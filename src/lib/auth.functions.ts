import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const identifierSchema = z.object({
  identifier: z.string().trim().min(3).max(255),
});

function classify(raw: string) {
  const v = raw.trim();
  if (/^\d{12}$/.test(v.replace(/\s/g, ""))) return { type: "aadhaar" as const, value: v.replace(/\s/g, "") };
  const digits = v.replace(/[^0-9]/g, "");
  if (/^\d{10}$/.test(digits) && !v.includes("@")) return { type: "phone" as const, value: digits };
  if (digits.length === 12 && digits.startsWith("91") && !v.includes("@")) {
    return { type: "phone" as const, value: digits.slice(2) };
  }
  return { type: "email" as const, value: v.toLowerCase() };
}

function mask(email: string) {
  const [local, domain] = email.split("@");
  if (!domain) return "****";
  const head = local.slice(0, 2);
  return `${head}${"*".repeat(Math.max(local.length - 2, 2))}@${domain}`;
}

/** Resolves any supported identifier (mobile / Aadhaar / email) to the account email. */
async function resolveEmail(raw: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { type, value } = classify(raw);

  if (type === "email") {
    return { type, email: value };
  }

  const column = type === "phone" ? "phone" : "aadhaar_number";

  const { data: member } = await supabaseAdmin
    .from("members")
    .select("email,user_id")
    .eq(column, value)
    .maybeSingle();

  let email = member?.email ?? null;
  let userId = member?.user_id ?? null;

  if (!email && type === "phone") {
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("email,id")
      .eq("phone", value)
      .maybeSingle();
    email = profile?.email ?? null;
    userId = userId ?? profile?.id ?? null;
  }

  if (!email && type === "aadhaar") {
    const { data: app } = await supabaseAdmin
      .from("membership_applications")
      .select("email,user_id")
      .eq("aadhaar_number", value)
      .maybeSingle();
    email = app?.email ?? null;
    userId = userId ?? app?.user_id ?? null;
  }

  if (!email && userId) {
    const { data } = await supabaseAdmin.auth.admin.getUserById(userId);
    email = data.user?.email ?? null;
  }

  return { type, email: email?.toLowerCase() ?? null };
}

async function logRecovery(entry: {
  identifier_type: string;
  identifier_masked: string;
  action: string;
  succeeded: boolean;
  detail?: string;
}) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.from("credential_recovery_log").insert(entry);
}

function maskIdentifier(type: string, raw: string) {
  const v = raw.trim();
  if (type === "email") return mask(v);
  return `${"*".repeat(Math.max(v.length - 4, 0))}${v.slice(-4)}`;
}

/** Signs in using mobile number, Aadhaar number or email + password. Returns a session. */
export const signInWithIdentifier = createServerFn({ method: "POST" })
  .inputValidator((input: { identifier: string; password: string }) =>
    identifierSchema.extend({ password: z.string().min(8).max(72) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const { type, email } = await resolveEmail(data.identifier);
    const masked = maskIdentifier(type, data.identifier);

    if (!email) {
      await logRecovery({
        identifier_type: type,
        identifier_masked: masked,
        action: "login",
        succeeded: false,
        detail: "No account found for this identifier",
      });
      throw new Error("No account found for that mobile number / Aadhaar / email.");
    }

    const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
    const client = createClient(process.env.SUPABASE_URL!, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    });

    const { data: result, error } = await client.auth.signInWithPassword({
      email,
      password: data.password,
    });

    await logRecovery({
      identifier_type: type,
      identifier_masked: masked,
      action: "login",
      succeeded: !error,
      detail: error?.message,
    });

    if (error || !result.session) {
      throw new Error(error?.message ?? "Invalid credentials");
    }

    return {
      access_token: result.session.access_token,
      refresh_token: result.session.refresh_token,
    };
  });

/** "Forgot Login ID" — returns the masked email tied to a mobile/Aadhaar number. */
export const recoverLoginId = createServerFn({ method: "POST" })
  .inputValidator((input: { identifier: string }) => identifierSchema.parse(input))
  .handler(async ({ data }) => {
    const { type, email } = await resolveEmail(data.identifier);
    const masked = maskIdentifier(type, data.identifier);
    await logRecovery({
      identifier_type: type,
      identifier_masked: masked,
      action: "recover_login_id",
      succeeded: Boolean(email),
    });
    if (!email) return { found: false as const };
    return { found: true as const, maskedEmail: mask(email) };
  });

/** "Forgot Password" — sends a reset link to the account behind any identifier. */
export const requestPasswordReset = createServerFn({ method: "POST" })
  .inputValidator((input: { identifier: string; redirectTo: string }) =>
    identifierSchema.extend({ redirectTo: z.string().url().max(500) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const { type, email } = await resolveEmail(data.identifier);
    const masked = maskIdentifier(type, data.identifier);

    if (!email) {
      await logRecovery({
        identifier_type: type,
        identifier_masked: masked,
        action: "password_reset",
        succeeded: false,
        detail: "No account found",
      });
      return { sent: false as const };
    }

    const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
    const client = createClient(process.env.SUPABASE_URL!, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: data.redirectTo });

    await logRecovery({
      identifier_type: type,
      identifier_masked: masked,
      action: "password_reset",
      succeeded: !error,
      detail: error?.message,
    });

    if (error) throw new Error(error.message);
    return { sent: true as const, maskedEmail: mask(email) };
  });

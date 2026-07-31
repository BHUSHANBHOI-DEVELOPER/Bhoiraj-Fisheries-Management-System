import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { createClient } from "@supabase/supabase-js";

export function classify(raw: string) {
  const v = raw.trim();
  if (/^\d{12}$/.test(v.replace(/\s/g, ""))) return { type: "aadhaar" as const, value: v.replace(/\s/g, "") };
  const digits = v.replace(/[^0-9]/g, "");
  if (/^\d{10}$/.test(digits) && !v.includes("@")) return { type: "phone" as const, value: digits };
  if (digits.length === 12 && digits.startsWith("91") && !v.includes("@")) {
    return { type: "phone" as const, value: digits.slice(2) };
  }
  return { type: "email" as const, value: v.toLowerCase() };
}

export function mask(email: string) {
  const [local, domain] = email.split("@");
  if (!domain) return "****";
  const head = local.slice(0, 2);
  return `${head}${"*".repeat(Math.max(local.length - 2, 2))}@${domain}`;
}

export function maskIdentifier(type: string, raw: string) {
  const v = raw.trim();
  if (type === "email") return mask(v);
  return `${"*".repeat(Math.max(v.length - 4, 0))}${v.slice(-4)}`;
}

/** Resolves any supported identifier (mobile / alternate mobile / Aadhaar / email) to the account email. */
export async function resolveEmail(raw: string) {
  const { type, value } = classify(raw);

  if (type === "email") return { type, email: value, userId: null as string | null };

  let email: string | null = null;
  let userId: string | null = null;

  if (type === "phone") {
    const { data } = await supabaseAdmin
      .from("members")
      .select("email,user_id")
      .or(`phone.eq.${value},alt_phone.eq.${value}`)
      .maybeSingle();
    email = data?.email ?? null;
    userId = data?.user_id ?? null;
  } else {
    const { data } = await supabaseAdmin
      .from("members")
      .select("email,user_id")
      .eq("aadhaar_number", value)
      .maybeSingle();
    email = data?.email ?? null;
    userId = data?.user_id ?? null;
  }

  if (!email && type === "phone") {
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("email,id")
      .or(`phone.eq.${value},alt_phone.eq.${value}`)
      .maybeSingle();
    email = profile?.email ?? null;
    userId = userId ?? profile?.id ?? null;
  }

  if (!email) {
    const column = type === "phone" ? "phone" : "aadhaar_number";
    const { data: app } = await supabaseAdmin
      .from("membership_applications")
      .select("email,user_id")
      .eq(column, value)
      .maybeSingle();
    email = app?.email ?? null;
    userId = userId ?? app?.user_id ?? null;
  }

  if (!email) {
    const { data: req } = await supabaseAdmin
      .from("admin_signup_requests")
      .select("email,user_id")
      .or(`phone.eq.${value},alt_phone.eq.${value}`)
      .maybeSingle();
    email = req?.email ?? null;
    userId = userId ?? req?.user_id ?? null;
  }

  if (!email && userId) {
    const { data } = await supabaseAdmin.auth.admin.getUserById(userId);
    email = data.user?.email ?? null;
  }

  return { type, email: email?.toLowerCase() ?? null, userId };
}

export async function logRecovery(entry: {
  identifier_type: string;
  identifier_masked: string;
  action: string;
  succeeded: boolean;
  detail?: string;
  user_id?: string | null;
}) {
  await supabaseAdmin.from("credential_recovery_log").insert(entry);
}

export async function logAdmin(entry: {
  actor_id?: string | null;
  actor_label?: string | null;
  action: string;
  entity_type?: string | null;
  entity_id?: string | null;
  detail?: string | null;
}) {
  await supabaseAdmin.from("admin_activity_log").insert(entry);
}

/** A publishable-key client suitable for server-side auth calls. */
export function publicAuthClient() {
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient(process.env.SUPABASE_URL!, key, {
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
}

/** Returns the roles held by a user id. */
export async function rolesFor(userId: string) {
  const { data } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId);
  return (data ?? []).map((r) => r.role as string);
}

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

/** Resolves an identifier all the way to an auth user id (needed for direct password changes). */
export async function resolveAccount(raw: string) {
  const base = await resolveEmail(raw);
  let userId = base.userId;
  if (!userId && base.email) {
    const { data } = await supabaseAdmin.from("profiles").select("id").eq("email", base.email).maybeSingle();
    userId = data?.id ?? null;
  }
  if (!userId && base.email) {
    const { data } = await supabaseAdmin.from("members").select("user_id").eq("email", base.email).maybeSingle();
    userId = data?.user_id ?? null;
  }
  return { ...base, userId };
}

/**
 * Confirms that the person asking for a password change also knows a second
 * registered detail — either their 10-digit mobile number or the last 4 digits
 * of their Aadhaar number.
 */
export async function verifySecondFactor(userId: string | null, email: string | null, secret: string) {
  const digits = secret.replace(/\D/g, "");
  if (digits.length !== 4 && digits.length !== 10) return false;

  const orFilter: string[] = [];
  if (userId) orFilter.push(`user_id.eq.${userId}`);
  if (email) orFilter.push(`email.eq.${email}`);
  if (orFilter.length === 0) return false;

  const { data: members } = await supabaseAdmin
    .from("members")
    .select("phone,alt_phone,aadhaar_number,aadhaar_last4")
    .or(orFilter.join(","));

  const { data: apps } = await supabaseAdmin
    .from("membership_applications")
    .select("phone,alt_phone,aadhaar_number")
    .or(orFilter.join(","));

  const { data: profs } = email
    ? await supabaseAdmin.from("profiles").select("phone,alt_phone").eq("email", email)
    : { data: [] as { phone: string | null; alt_phone: string | null }[] };

  const candidates: string[] = [];
  for (const m of members ?? []) {
    if (m.phone) candidates.push(m.phone);
    if (m.alt_phone) candidates.push(m.alt_phone);
    if (m.aadhaar_number) candidates.push(m.aadhaar_number.slice(-4));
    if (m.aadhaar_last4) candidates.push(m.aadhaar_last4);
  }
  for (const a of apps ?? []) {
    if (a.phone) candidates.push(a.phone);
    if (a.alt_phone) candidates.push(a.alt_phone);
    if (a.aadhaar_number) candidates.push(a.aadhaar_number.slice(-4));
  }
  for (const p of profs ?? []) {
    if (p.phone) candidates.push(p.phone);
    if (p.alt_phone) candidates.push(p.alt_phone);
  }

  return candidates.some((c) => c.replace(/\D/g, "") === digits);
}

/** Records a password change so the Chairman can audit it later. */
export async function recordPasswordChange(entry: {
  user_id: string;
  user_email?: string | null;
  changed_by?: string | null;
  changed_by_label?: string | null;
  method: string;
  note?: string | null;
}) {
  await supabaseAdmin.from("password_history").insert(entry);
}

/** Finds the best registered mobile number for an account (used for SMS OTP). */
export async function phoneFor(userId: string | null, email: string | null) {
  const pick = (row: { phone?: string | null; alt_phone?: string | null } | null | undefined) =>
    row?.phone || row?.alt_phone || null;

  if (userId) {
    const { data } = await supabaseAdmin
      .from("profiles")
      .select("phone,alt_phone")
      .eq("id", userId)
      .maybeSingle();
    const p = pick(data);
    if (p) return p;
  }
  if (email) {
    const { data } = await supabaseAdmin
      .from("members")
      .select("phone,alt_phone")
      .eq("email", email)
      .maybeSingle();
    const p = pick(data);
    if (p) return p;

    const { data: req } = await supabaseAdmin
      .from("admin_signup_requests")
      .select("phone,alt_phone")
      .eq("email", email)
      .maybeSingle();
    const r = pick(req);
    if (r) return r;

    const { data: app } = await supabaseAdmin
      .from("membership_applications")
      .select("phone,alt_phone")
      .eq("email", email)
      .maybeSingle();
    const a = pick(app);
    if (a) return a;
  }
  return null;
}

/**
 * Decides whether an account may sign in through a given login portal.
 * A Member portal login is always allowed and never carries admin rights.
 */
export function portalAllowed(profile: "chairman" | "admin" | "member", roles: string[]) {
  if (profile === "member") return true;
  if (profile === "chairman") return roles.includes("admin") || roles.includes("super_admin");
  return roles.includes("super_admin");
}

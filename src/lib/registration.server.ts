import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type SignupRole = "member" | "chairman" | "admin";

/** The database role granted for each portal. */
const ROLE_FOR: Record<Exclude<SignupRole, "member">, "admin" | "super_admin"> = {
  chairman: "admin",
  admin: "super_admin",
};

/** True only when this exact email already has a login account. */
export async function findAuthUserByEmail(email: string) {
  const wanted = email.trim().toLowerCase();
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(error.message);
    const hit = (data.users ?? []).find((u) => u.email?.toLowerCase() === wanted);
    if (hit) return hit;
    if ((data.users ?? []).length < 200) break;
  }
  return null;
}

export async function userHandleTaken(handle: string) {
  const { data } = await supabaseAdmin.from("profiles").select("id").ilike("user_id", handle).maybeSingle();
  return Boolean(data);
}

export async function phoneTaken(phone: string) {
  const { data: member } = await supabaseAdmin
    .from("members")
    .select("id")
    .or(`phone.eq.${phone},alt_phone.eq.${phone}`)
    .maybeSingle();
  if (member) return true;
  const { data: app } = await supabaseAdmin
    .from("membership_applications")
    .select("id")
    .neq("status", "rejected")
    .or(`phone.eq.${phone},alt_phone.eq.${phone}`)
    .maybeSingle();
  return Boolean(app);
}

/** Is there already somebody holding this portal's rights? */
export async function roleHolderExists(role: Exclude<SignupRole, "member">) {
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("id")
    .eq("role", ROLE_FOR[role])
    .limit(1)
    .maybeSingle();
  return Boolean(data);
}

/** Accepts an invite code issued by an existing Chairman / Admin. */
export async function consumeInvite(code: string, role: Exclude<SignupRole, "member">, userId: string) {
  const { data } = await supabaseAdmin
    .from("admin_invites")
    .select("id,expires_at,claimed_by,role")
    .eq("code", code.trim().toUpperCase())
    .maybeSingle();
  if (!data) return false;
  if (data.claimed_by) return false;
  if (new Date(data.expires_at).getTime() < Date.now()) return false;
  if (data.role !== ROLE_FOR[role]) return false;
  await supabaseAdmin
    .from("admin_invites")
    .update({ status: "claimed", claimed_by: userId, claimed_at: new Date().toISOString() })
    .eq("id", data.id);
  return true;
}

export async function createLogin(email: string, password: string, fullName: string) {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error) throw new Error(error.message);
  if (!data.user) throw new Error("The login account could not be created.");
  return data.user.id;
}

export async function grantRole(userId: string, role: Exclude<SignupRole, "member">) {
  const { error } = await supabaseAdmin
    .from("user_roles")
    .upsert({ user_id: userId, role: ROLE_FOR[role] }, { onConflict: "user_id,role" });
  if (error) throw new Error(error.message);
}

export async function saveHandle(userId: string, handle: string | null, phone: string, email: string, fullName: string) {
  const patch: Record<string, string | null> = { full_name: fullName, email, phone };
  if (handle) patch.user_id = handle.toLowerCase();
  const { error } = await supabaseAdmin.from("profiles").update(patch).eq("id", userId);
  if (error) throw new Error(error.message);
}

export async function deleteLogin(userId: string) {
  await supabaseAdmin.auth.admin.deleteUser(userId);
}

export type MemberApplication = {
  user_id: string;
  full_name: string;
  father_husband_name: string | null;
  surname: string | null;
  phone: string;
  alt_phone: string | null;
  email: string | null;
  aadhaar_number: string | null;
  pan: string | null;
  eshram_number: string | null;
  dob: string;
  village: string | null;
  taluka: string | null;
  district: string | null;
  address: string | null;
};

export async function insertApplication(row: MemberApplication) {
  const { error } = await supabaseAdmin.from("membership_applications").insert(row);
  if (error) throw new Error(error.message);
}

export async function notify(userId: string, title: string, body: string) {
  await supabaseAdmin.from("notifications").insert({
    is_broadcast: false,
    recipient_id: userId,
    title,
    body,
    category: "membership",
  });
}

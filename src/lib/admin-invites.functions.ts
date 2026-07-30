import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(supabase: any, userId: string) {
  const { data } = await supabase.rpc("is_admin", { _user_id: userId });
  if (!data) throw new Error("Forbidden: admin rights required");
  return true;
}

function makeCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 10; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `${out.slice(0, 5)}-${out.slice(5)}`;
}

/** An existing admin issues a one-time admin invite code. */
export const createAdminInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { label?: string; email?: string }) =>
    z
      .object({
        label: z.string().trim().max(120).optional(),
        email: z.string().trim().email().max(255).optional().or(z.literal("")),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const code = makeCode();
    const { error } = await supabaseAdmin.from("admin_invites").insert({
      code,
      label: data.label || null,
      email: data.email || null,
      created_by: context.userId,
    });
    if (error) throw new Error(error.message);
    return { code };
  });

/** A signed-in user submits an invite code; it then waits for an existing admin's approval. */
export const claimAdminInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { code: string }) =>
    z.object({ code: z.string().trim().min(6).max(30) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const code = data.code.trim().toUpperCase();
    const { data: invite } = await supabaseAdmin
      .from("admin_invites")
      .select("*")
      .eq("code", code)
      .maybeSingle();

    if (!invite) throw new Error("That admin code is not valid.");
    if (invite.status !== "open") throw new Error("That admin code has already been used.");
    if (new Date(invite.expires_at) < new Date()) throw new Error("That admin code has expired.");

    const { error } = await supabaseAdmin
      .from("admin_invites")
      .update({ status: "pending_approval", claimed_by: context.userId, claimed_at: new Date().toISOString() })
      .eq("id", invite.id);
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("notifications").insert({
      title: "Admin access request",
      body: `A user submitted admin code ${code} and is awaiting your approval.`,
      category: "admin",
      recipient_id: invite.created_by,
      created_by: context.userId,
    });

    return { ok: true as const };
  });

/** Existing admin approves (or rejects) a claimed invite, granting the admin role. */
export const decideAdminInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { inviteId: string; approve: boolean }) =>
    z.object({ inviteId: z.string().uuid(), approve: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: invite } = await supabaseAdmin
      .from("admin_invites")
      .select("*")
      .eq("id", data.inviteId)
      .maybeSingle();
    if (!invite) throw new Error("Invite not found");
    if (!invite.claimed_by) throw new Error("Nobody has claimed this code yet");

    if (!data.approve) {
      await supabaseAdmin
        .from("admin_invites")
        .update({ status: "rejected", approved_by: context.userId, approved_at: new Date().toISOString() })
        .eq("id", invite.id);
      return { granted: false as const };
    }

    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: invite.claimed_by, role: invite.role });
    if (roleError && !roleError.message.includes("duplicate")) throw new Error(roleError.message);

    await supabaseAdmin
      .from("admin_invites")
      .update({ status: "approved", approved_by: context.userId, approved_at: new Date().toISOString() })
      .eq("id", invite.id);

    await supabaseAdmin.from("notifications").insert({
      title: "Admin access approved",
      body: "You now have Chairman/admin rights in the portal.",
      category: "admin",
      recipient_id: invite.claimed_by,
      created_by: context.userId,
    });

    return { granted: true as const };
  });

/** Removes admin rights from a user (super admins only). */
export const revokeAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string }) => z.object({ userId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: isSuper } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "super_admin",
    });
    if (!isSuper) throw new Error("Forbidden: only a super admin can remove admins");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId).eq("role", "admin");
    return { ok: true as const };
  });

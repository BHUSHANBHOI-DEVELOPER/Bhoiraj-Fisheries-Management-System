import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { approveMembership, assertAdministrator, hardDeleteMember, rejectMembership, updateMemberRecord } from "@/lib/admin-members.server";

export const reviewMembership = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { applicationId: string; approve: boolean }) =>
    z.object({ applicationId: z.string().uuid(), approve: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdministrator(context.supabase, context.userId);
    if (data.approve) await approveMembership(data.applicationId, context.userId);
    else await rejectMembership(data.applicationId, context.userId);
    return { ok: true as const };
  });

export const editMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { memberId: string; fullName: string; phone: string; email?: string; village?: string; status: string }) =>
    z.object({
      memberId: z.string().uuid(), fullName: z.string().trim().min(2).max(120),
      phone: z.string().regex(/^\d{10}$/), email: z.string().email().optional().or(z.literal("")),
      village: z.string().max(100).optional(), status: z.enum(["active", "inactive"]),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdministrator(context.supabase, context.userId);
    await updateMemberRecord(data.memberId, {
      full_name: data.fullName, phone: data.phone, email: data.email || null,
      village: data.village || null, status: data.status,
    });
    return { ok: true as const };
  });

export const deleteMemberPermanently = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { memberId: string; confirmation: string }) =>
    z.object({ memberId: z.string().uuid(), confirmation: z.literal("DELETE") }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdministrator(context.supabase, context.userId);
    await hardDeleteMember(data.memberId);
    return { ok: true as const };
  });
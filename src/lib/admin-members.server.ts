import { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function assertAdministrator(supabase: any, userId: string) {
  const { data } = await supabase.rpc("is_admin", { _user_id: userId });
  if (!data) throw new Error("Administrator rights are required.");
}

export async function approveMembership(applicationId: string, reviewerId: string) {
  const { data, error } = await supabaseAdmin
    .from("membership_applications")
    .update({ status: "approved", reviewed_by: reviewerId, reviewed_at: new Date().toISOString() })
    .eq("id", applicationId)
    .eq("status", "pending")
    .select("user_id")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("This application has already been reviewed.");
  if (data.user_id) {
    await supabaseAdmin.from("notifications").insert({
      recipient_id: data.user_id,
      title: "Membership approved",
      body: "Welcome! Your membership is approved and your name is now listed publicly.",
      category: "membership",
      created_by: reviewerId,
    });
  }
}

export async function rejectMembership(applicationId: string, reviewerId: string) {
  const { error } = await supabaseAdmin
    .from("membership_applications")
    .update({ status: "rejected", reviewed_by: reviewerId, reviewed_at: new Date().toISOString() })
    .eq("id", applicationId)
    .eq("status", "pending");
  if (error) throw new Error(error.message);
}

type MemberChanges = {
  full_name: string; phone: string; email: string | null; village: string | null; status: string;
};

export async function updateMemberRecord(memberId: string, changes: MemberChanges) {
  const { error } = await supabaseAdmin.from("members").update(changes).eq("id", memberId);
  if (error) throw new Error(error.message);
}

export async function hardDeleteMember(memberId: string) {
  const { data: member, error } = await supabaseAdmin
    .from("members")
    .select("user_id")
    .eq("id", memberId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!member) throw new Error("Member not found.");
  if (member.user_id) {
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(member.user_id);
    if (authError) throw new Error(authError.message);
  } else {
    const { error: deleteError } = await supabaseAdmin.from("members").delete().eq("id", memberId);
    if (deleteError) throw new Error(deleteError.message);
  }
}
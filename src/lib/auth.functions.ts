import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  logRecovery,
  mask,
  maskIdentifier,
  publicAuthClient,
  resolveEmail,
  rolesFor,
} from "@/lib/auth.server";

const identifierSchema = z.object({
  identifier: z.string().trim().min(3).max(255),
});

const profileSchema = z.enum(["chairman", "admin", "member"]);

/**
 * Signs in a MEMBER using mobile / alternate mobile / Aadhaar / email + password.
 * The member portal never grants Chairman or Admin rights, even if the account
 * happens to hold them.
 */
export const signInWithIdentifier = createServerFn({ method: "POST" })
  .inputValidator((input: { identifier: string; password: string }) =>
    identifierSchema.extend({ password: z.string().min(1).max(72) }).parse(input),
  )
  .handler(async ({ data }) => {
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
      throw new Error("No account found for that mobile number / Aadhaar number / email.");
    }

    const client = publicAuthClient();
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
      user_id: result?.user?.id ?? null,
    });

    if (error || !result.session) throw new Error(error?.message ?? "Invalid credentials");

    return {
      access_token: result.session.access_token,
      refresh_token: result.session.refresh_token,
    };
  });

/**
 * Step 1 of a Chairman / Admin login. Checks the password AND that the account
 * holds rights for that specific portal, then sends a real 6-digit code by SMS.
 * No session is issued here.
 */
export const startRoleLogin = createServerFn({ method: "POST" })
  .inputValidator((input: { identifier: string; password: string; profile: string }) =>
    identifierSchema
      .extend({ password: z.string().min(1).max(72), profile: profileSchema })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { phoneFor, portalAllowed } = await import("@/lib/auth.server");
    const { issueOtp } = await import("@/lib/otp.server");

    const profile = data.profile as "chairman" | "admin" | "member";
    const { type, email, userId } = await resolveEmail(data.identifier);
    const masked = maskIdentifier(type, data.identifier);
    const action = `login_${profile}`;

    if (!email) {
      await logRecovery({ identifier_type: type, identifier_masked: masked, action, succeeded: false, detail: "No account found" });
      throw new Error("No account found for that mobile number / Aadhaar number / email.");
    }

    const client = publicAuthClient();
    const { data: result, error } = await client.auth.signInWithPassword({ email, password: data.password });
    if (error || !result.user) {
      await logRecovery({ identifier_type: type, identifier_masked: masked, action, succeeded: false, detail: error?.message ?? "Invalid credentials" });
      throw new Error("Incorrect password. Please try again.");
    }

    const roles = await rolesFor(result.user.id);
    await client.auth.signOut();

    if (!portalAllowed(profile, roles)) {
      await logRecovery({
        identifier_type: type,
        identifier_masked: masked,
        action,
        succeeded: false,
        detail: `Account lacks rights for the ${profile} portal`,
        user_id: result.user.id,
      });
      throw new Error(
        profile === "chairman"
          ? "This account is not approved as Chairman yet. Register as Chairman, or ask the Admin to approve you."
          : "This account does not hold Admin/Developer rights. Please use the Chairman or Member portal.",
      );
    }

    const phone = await phoneFor(userId ?? result.user.id, email);
    const { sms } = await issueOtp({ email, userId: result.user.id, purpose: action, phone });

    await logRecovery({
      identifier_type: type,
      identifier_masked: masked,
      action: `${action}_password_ok`,
      succeeded: true,
      detail: sms.sent ? "OTP sent by SMS" : `OTP created, SMS not sent: ${sms.reason}`,
      user_id: result.user.id,
    });

    return {
      email,
      maskedEmail: mask(email),
      maskedPhone: phone ? `******${phone.replace(/\D/g, "").slice(-4)}` : null,
      smsSent: sms.sent,
      smsReason: sms.reason,
    };
  });

/** Step 2 — checks the numeric code, then issues the session. */
export const completeRoleLogin = createServerFn({ method: "POST" })
  .inputValidator((input: { identifier: string; password: string; profile: string; code: string }) =>
    identifierSchema
      .extend({
        password: z.string().min(1).max(72),
        profile: profileSchema,
        code: z.string().trim().regex(/^\d{6}$/),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { portalAllowed } = await import("@/lib/auth.server");
    const { consumeOtp } = await import("@/lib/otp.server");

    const profile = data.profile as "chairman" | "admin" | "member";
    const { type, email } = await resolveEmail(data.identifier);
    const masked = maskIdentifier(type, data.identifier);
    const action = `login_${profile}`;
    if (!email) throw new Error("No account found for that identifier.");

    const check = await consumeOtp(email, action, data.code);
    if (!check.ok) {
      await logRecovery({ identifier_type: type, identifier_masked: masked, action: `otp_${profile}`, succeeded: false, detail: check.reason });
      throw new Error(check.reason ?? "That code is not correct.");
    }

    const client = publicAuthClient();
    const { data: result, error } = await client.auth.signInWithPassword({ email, password: data.password });
    if (error || !result.session || !result.user) throw new Error("Sign-in failed. Please start again.");

    const roles = await rolesFor(result.user.id);
    if (!portalAllowed(profile, roles)) {
      await client.auth.signOut();
      throw new Error("This account no longer holds rights for that portal.");
    }

    await logRecovery({ identifier_type: type, identifier_masked: masked, action: `otp_${profile}`, succeeded: true, user_id: result.user.id });

    return {
      access_token: result.session.access_token,
      refresh_token: result.session.refresh_token,
    };
  });

/** Resends the numeric code for a pending Chairman / Admin login. */
export const resendRoleOtp = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string; profile: string }) =>
    z.object({ email: z.string().email().max(255), profile: profileSchema }).parse(input),
  )
  .handler(async ({ data }) => {
    const { phoneFor } = await import("@/lib/auth.server");
    const { issueOtp } = await import("@/lib/otp.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const email = data.email.toLowerCase();
    const { data: prof } = await supabaseAdmin.from("profiles").select("id").eq("email", email).maybeSingle();
    const phone = await phoneFor(prof?.id ?? null, email);
    const { sms } = await issueOtp({
      email,
      userId: prof?.id ?? null,
      purpose: `login_${data.profile}`,
      phone,
    });
    return { smsSent: sms.sent, smsReason: sms.reason };
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

    const client = publicAuthClient();
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

/**
 * Direct password reset — no email link involved.
 * The account is found by mobile number / Aadhaar number / email, a second
 * registered detail is checked, and the new password is written straight into
 * the database so the member can sign in with it immediately.
 */
export const setNewPasswordDirect = createServerFn({ method: "POST" })
  .inputValidator((input: { identifier: string; secret: string; newPassword: string }) =>
    identifierSchema
      .extend({
        secret: z.string().trim().min(4).max(20),
        newPassword: z.string().min(9).max(72),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { resolveAccount, verifySecondFactor, recordPasswordChange } = await import("@/lib/auth.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { type, email, userId } = await resolveAccount(data.identifier);
    const masked = maskIdentifier(type, data.identifier);

    if (!email || !userId) {
      await logRecovery({
        identifier_type: type,
        identifier_masked: masked,
        action: "password_set_direct",
        succeeded: false,
        detail: "No account found",
      });
      throw new Error(
        "We could not find an account for that mobile number / Aadhaar number / email. Please check the value, or ask the Chairman to confirm your registration.",
      );
    }

    const ok = await verifySecondFactor(userId, email, data.secret);
    if (!ok) {
      await logRecovery({
        identifier_type: type,
        identifier_masked: masked,
        action: "password_set_direct",
        succeeded: false,
        detail: "Second factor did not match",
        user_id: userId,
      });
      throw new Error(
        "That verification value does not match our records. Enter your registered 10-digit mobile number or the last 4 digits of your Aadhaar number.",
      );
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, { password: data.newPassword });
    if (error) {
      await logRecovery({
        identifier_type: type,
        identifier_masked: masked,
        action: "password_set_direct",
        succeeded: false,
        detail: error.message,
        user_id: userId,
      });
      throw new Error(error.message);
    }

    await recordPasswordChange({
      user_id: userId,
      user_email: email,
      method: "self_reset_direct",
      note: `Reset using ${type} identifier`,
    });

    await logRecovery({
      identifier_type: type,
      identifier_masked: masked,
      action: "password_set_direct",
      succeeded: true,
      user_id: userId,
    });

    return { ok: true as const, maskedEmail: mask(email) };
  });

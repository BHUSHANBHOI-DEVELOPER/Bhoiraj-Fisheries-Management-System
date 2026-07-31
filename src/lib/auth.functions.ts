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
 * Chairman and Admin profiles must use `verifyCredentialsForOtp` instead — they
 * only receive a session after their one-time code is matched.
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
 * Step 1 of the Chairman / Admin login. Checks the password AND the role, then
 * returns only the account email so a one-time code can be emailed. No session
 * is issued here, so admin rights cannot be reached without matching the code.
 */
export const verifyCredentialsForOtp = createServerFn({ method: "POST" })
  .inputValidator((input: { identifier: string; password: string; profile: string }) =>
    identifierSchema
      .extend({ password: z.string().min(1).max(72), profile: profileSchema })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { type, email } = await resolveEmail(data.identifier);
    const masked = maskIdentifier(type, data.identifier);

    if (!email) {
      await logRecovery({
        identifier_type: type,
        identifier_masked: masked,
        action: `login_${data.profile}`,
        succeeded: false,
        detail: "No account found",
      });
      throw new Error("No account found for that mobile number / Aadhaar number / email.");
    }

    const client = publicAuthClient();
    const { data: result, error } = await client.auth.signInWithPassword({
      email,
      password: data.password,
    });

    if (error || !result.user) {
      await logRecovery({
        identifier_type: type,
        identifier_masked: masked,
        action: `login_${data.profile}`,
        succeeded: false,
        detail: error?.message ?? "Invalid credentials",
      });
      throw new Error("Incorrect password. Please try again.");
    }

    const roles = await rolesFor(result.user.id);
    // The session created for this check is discarded immediately.
    await client.auth.signOut();

    const isAdmin = roles.includes("admin") || roles.includes("super_admin");
    if (!isAdmin) {
      await logRecovery({
        identifier_type: type,
        identifier_masked: masked,
        action: `login_${data.profile}`,
        succeeded: false,
        detail: "Account does not hold Chairman/Admin rights",
        user_id: result.user.id,
      });
      throw new Error(
        "These credentials are correct, but this account does not hold Chairman/Admin rights. Please use Member Login.",
      );
    }

    await logRecovery({
      identifier_type: type,
      identifier_masked: masked,
      action: `login_${data.profile}_password_ok`,
      succeeded: true,
      user_id: result.user.id,
    });

    return { email, maskedEmail: mask(email), isSuperAdmin: roles.includes("super_admin") };
  });

/** Records the outcome of a one-time code check for the audit trail. */
export const logOtpOutcome = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string; profile: string; succeeded: boolean; detail?: string }) =>
    z
      .object({
        email: z.string().email().max(255),
        profile: profileSchema,
        succeeded: z.boolean(),
        detail: z.string().max(300).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    await logRecovery({
      identifier_type: "email",
      identifier_masked: mask(data.email),
      action: `otp_${data.profile}`,
      succeeded: data.succeeded,
      detail: data.detail,
    });
    return { ok: true };
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

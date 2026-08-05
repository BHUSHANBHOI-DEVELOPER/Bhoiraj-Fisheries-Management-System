import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const roleSchema = z.enum(["member", "chairman", "admin"]);

const baseSchema = z.object({
  role: roleSchema,
  full_name: z.string().trim().min(2).max(100),
  surname: z.string().trim().max(60).optional().or(z.literal("")),
  phone: z.string().trim().regex(/^\d{10}$/),
  email: z.string().trim().email().max(255),
  password: z.string().min(9).max(72),
  user_handle: z.string().trim().max(32).optional().or(z.literal("")),
  invite_code: z.string().trim().max(40).optional().or(z.literal("")),
  father_husband_name: z.string().trim().max(100).optional().or(z.literal("")),
  alt_phone: z.string().trim().max(10).optional().or(z.literal("")),
  aadhaar_number: z.string().trim().regex(/^$|^\d{12}$/).optional().or(z.literal("")),
  pan: z.string().trim().regex(/^$|^[A-Z]{5}\d{4}[A-Z]$/).optional().or(z.literal("")),
  eshram_number: z.string().trim().max(20).optional().or(z.literal("")),
  dob: z.string().max(20).optional().or(z.literal("")),
  village: z.string().trim().max(80).optional().or(z.literal("")),
  taluka: z.string().trim().max(80).optional().or(z.literal("")),
  district: z.string().trim().max(80).optional().or(z.literal("")),
  address: z.string().trim().max(400).optional().or(z.literal("")),
});

type RegisterInput = z.input<typeof baseSchema>;

/** Tells the visitor plainly whether an email / User ID is already in use. */
export const checkAvailability = createServerFn({ method: "POST" })
  .inputValidator((input: { email?: string; user_handle?: string }) =>
    z.object({ email: z.string().trim().max(255).optional(), user_handle: z.string().trim().max(32).optional() }).parse(input),
  )
  .handler(async ({ data }) => {
    const { findAuthUserByEmail, userHandleTaken } = await import("@/lib/registration.server");
    const email = data.email?.trim().toLowerCase();
    const handle = data.user_handle?.trim().toLowerCase();
    return {
      emailFound: email && /.+@.+\..+/.test(email) ? Boolean(await findAuthUserByEmail(email)) : null,
      handleFound: handle && handle.length >= 3 ? await userHandleTaken(handle) : null,
    };
  });

/**
 * One registration entry point for all three portals.
 * Members wait for Chairman approval. Chairman / Admin accounts get their
 * rights immediately — the first of each kind may register freely, later ones
 * need an invite code created inside the portal.
 */
export const registerAccount = createServerFn({ method: "POST" })
  .inputValidator((input: RegisterInput) => baseSchema.parse(input))
  .handler(async ({ data }) => {
    const reg = await import("@/lib/registration.server");
    const email = data.email.trim().toLowerCase();
    const fullName = `${data.full_name} ${data.surname ?? ""}`.trim();

    if (await reg.findAuthUserByEmail(email)) {
      throw new Error(`Found: ${email} already has a login account. Sign in instead, or use a different email.`);
    }

    const isStaff = data.role !== "member";
    const handle = data.user_handle?.trim().toLowerCase() || null;

    if (isStaff) {
      if (!handle || handle.length < 3 || !/^[a-z][a-z0-9._-]{2,31}$/.test(handle)) {
        throw new Error("Choose a User ID of at least 3 characters (letters, numbers, dot, dash or underscore).");
      }
      if (await reg.userHandleTaken(handle)) throw new Error(`Found: the User ID "${handle}" is already taken.`);
    } else {
      if (!data.dob) throw new Error("Date of birth is required.");
      if (await reg.phoneTaken(data.phone)) throw new Error("Found: this mobile number is already registered.");
    }

    const staffRole = data.role as "chairman" | "admin";
    const needsInvite = isStaff ? await reg.roleHolderExists(staffRole) : false;
    if (needsInvite && !data.invite_code) {
      throw new Error(
        `A ${data.role === "chairman" ? "Chairman" : "Admin"} already exists. Ask them for an invite code, then register with it.`,
      );
    }

    const userId = await reg.createLogin(email, data.password, fullName);

    try {
      if (isStaff) {
        if (needsInvite && !(await reg.consumeInvite(data.invite_code!, staffRole, userId))) {
          throw new Error("That invite code is not valid, has expired, or has already been used.");
        }
        await reg.grantRole(userId, staffRole);
        await reg.saveHandle(userId, handle, data.phone, email, fullName);
        await reg.notify(
          userId,
          data.role === "chairman" ? "Chairman access ready" : "Admin access ready",
          `Sign in on the ${data.role === "chairman" ? "Chairman" : "Admin / Developer"} portal with your User ID "${handle}" and password. A 6-digit code is texted to your mobile for extra safety.`,
        );
      } else {
        await reg.saveHandle(userId, handle, data.phone, email, fullName);
        await reg.insertApplication({
          user_id: userId,
          full_name: data.full_name,
          father_husband_name: data.father_husband_name || null,
          surname: data.surname || null,
          phone: data.phone,
          alt_phone: data.alt_phone || null,
          email,
          aadhaar_number: data.aadhaar_number || null,
          pan: data.pan || null,
          eshram_number: data.eshram_number || null,
          dob: data.dob!,
          village: data.village || null,
          taluka: data.taluka || null,
          district: data.district || null,
          address: data.address || null,
        });
        await reg.notify(
          userId,
          "Application received",
          "Your membership application has been sent to the Chairman for approval. You can sign in once it is approved.",
        );
      }
    } catch (err) {
      await reg.deleteLogin(userId);
      throw err instanceof Error ? err : new Error("Registration failed.");
    }

    return {
      ok: true as const,
      role: data.role,
      needsApproval: !isStaff,
      loginId: handle ?? email,
    };
  });

import { supabaseAdmin } from "@/integrations/supabase/client.server";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/twilio";
const GATEWAY_API_URL = "https://connector-gateway.lovable.dev/gatewayapi";

function sixDigits() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/** Normalises an Indian 10-digit mobile number to E.164. */
export function toE164(raw: string | null | undefined) {
  if (!raw) return null;
  const d = raw.replace(/\D/g, "");
  if (d.length === 10) return `+91${d}`;
  if (d.length === 12 && d.startsWith("91")) return `+${d}`;
  if (d.length === 13 && d.startsWith("091")) return `+${d.slice(1)}`;
  return null;
}

/** Best-effort SMS delivery through the Twilio connector gateway. */
export async function sendSms(to: string, body: string) {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const gatewayApiKey = process.env["GATEWAYAPI_API_KEY"];
  const twilioKey = process.env["TWILIO_API_KEY"];
  const from = process.env["TWILIO_FROM_NUMBER"];
  if (!lovableKey) return { sent: false, reason: "Messaging service is not configured" };

  if (gatewayApiKey) {
    const recipient = Number(to.replace(/\D/g, ""));
    const response = await fetch(`${GATEWAY_API_URL}/mobile/single`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": gatewayApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sender: "Bhoiraj", recipient, message: body }),
    });
    if (response.ok) return { sent: true, reason: null as string | null };
    const text = await response.text();
    console.error(`GatewayAPI send failed [${response.status}]: ${text}`);
    return { sent: false, reason: `SMS provider error [${response.status}]` };
  }

  if (!twilioKey || !from) {
    return { sent: false, reason: "Twilio is connected but has no sending phone number" };
  }

  const res = await fetch(`${GATEWAY_URL}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": twilioKey,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ To: to, From: from, Body: body }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`Twilio send failed [${res.status}]: ${text}`);
    return { sent: false, reason: `SMS provider error [${res.status}]` };
  }
  return { sent: true, reason: null as string | null };
}

/** Creates a fresh numeric code, stores it and tries to deliver it by SMS. */
export async function issueOtp(opts: {
  email: string;
  userId: string | null;
  purpose: string;
  phone: string | null;
}) {
  const code = sixDigits();

  await supabaseAdmin
    .from("login_otps")
    .update({ consumed_at: new Date().toISOString() })
    .eq("email", opts.email)
    .eq("purpose", opts.purpose)
    .is("consumed_at", null);

  await supabaseAdmin.from("login_otps").insert({
    email: opts.email,
    user_id: opts.userId,
    purpose: opts.purpose,
    code,
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  });

  const to = toE164(opts.phone);
  let sms = { sent: false, reason: "No registered mobile number on file" as string | null };
  if (to) {
    sms = await sendSms(to, `Bhoiraj Matsya Sanstha: your one-time code is ${code}. Valid for 10 minutes. Do not share it.`);
  }

  return { sms, to };
}

/** Checks a submitted code. Consumes it on success. */
export async function consumeOtp(email: string, purpose: string, code: string) {
  const { data } = await supabaseAdmin
    .from("login_otps")
    .select("id,code,attempts,expires_at")
    .eq("email", email)
    .eq("purpose", purpose)
    .is("consumed_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return { ok: false, reason: "No code is pending. Please request a new one." };
  if (new Date(data.expires_at).getTime() < Date.now()) {
    return { ok: false, reason: "That code has expired. Please request a new one." };
  }
  if (data.attempts >= 5) {
    return { ok: false, reason: "Too many wrong attempts. Please request a new code." };
  }
  if (data.code !== code.trim()) {
    await supabaseAdmin.from("login_otps").update({ attempts: data.attempts + 1 }).eq("id", data.id);
    return { ok: false, reason: "That code is not correct." };
  }

  await supabaseAdmin
    .from("login_otps")
    .update({ consumed_at: new Date().toISOString() })
    .eq("id", data.id);
  return { ok: true, reason: null as string | null };
}

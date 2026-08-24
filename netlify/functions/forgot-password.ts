import jwt from "jsonwebtoken";
import { sendPasswordResetEmail } from "../../server/mailer";

type Event = { httpMethod?: string; body?: string | null; headers?: Record<string, string | undefined> };

export default async (event: Event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };
  try {
    const { email } = JSON.parse(event.body || "{}");
    if (!email || typeof email !== "string" || !email.includes("@")) return { statusCode: 400, body: JSON.stringify({ success: false, error: "Please provide a valid email address." }) };
    const normalizedEmail = email.trim().toLowerCase();
    const token = jwt.sign({ email: normalizedEmail, purpose: "password_reset" }, process.env.JWT_SECRET || "nexus-reset-secret", { expiresIn: "1h" });
    const origin = process.env.APP_URL || `https://${event.headers?.host || "localhost"}`;
    const resetUrl = `${origin}/reset-password?token=${token}&email=${encodeURIComponent(normalizedEmail)}`;
    const result = await sendPasswordResetEmail({ to: normalizedEmail, resetUrl, userIp: event.headers?.["x-forwarded-for"] || "" });
    return { statusCode: 200, body: JSON.stringify({ success: true, message: "A password reset link has been sent to your email.", resetUrl, previewUrl: result.previewUrl }) };
  } catch (error) {
    console.error("Netlify forgot password error:", error);
    return { statusCode: 500, body: JSON.stringify({ success: false, error: "Internal server error while processing request." }) };
  }
};

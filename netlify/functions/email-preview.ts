import { generatePasswordResetEmailHtml } from "../../server/mailer";

type Event = { httpMethod?: string; queryStringParameters?: Record<string, string | undefined>; headers?: Record<string, string | undefined> };

export default async (event: Event) => {
  if (event.httpMethod !== "GET") return { statusCode: 405, body: "Method Not Allowed" };
  const email = event.queryStringParameters?.email || "developer@example.com";
  const origin = `https://${event.headers?.host || "localhost"}`;
  const html = generatePasswordResetEmailHtml({ to: email, resetUrl: `${origin}/reset-password?token=preview&email=${encodeURIComponent(email)}`, userIp: "127.0.0.1" });
  return { statusCode: 200, headers: { "Content-Type": "text/html" }, body: html };
};

import jwt from "jsonwebtoken";

type Event = { httpMethod?: string; body?: string | null };

export default async (event: Event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };
  try {
    const { token } = JSON.parse(event.body || "{}");
    if (!token) return { statusCode: 400, body: JSON.stringify({ valid: false, error: "Reset token is required." }) };
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "nexus-reset-secret") as { email: string; purpose: string };
    if (decoded.purpose !== "password_reset") throw new Error("Invalid token purpose");
    return { statusCode: 200, body: JSON.stringify({ valid: true, email: decoded.email }) };
  } catch {
    return { statusCode: 400, body: JSON.stringify({ valid: false, error: "Reset token has expired or is invalid." }) };
  }
};

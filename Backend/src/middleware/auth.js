import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";

export async function requireAuth(request, response, next) {
  const header = request.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return response.status(401).json({ error: "Authentication required" });
  if (!process.env.JWT_SECRET) return response.status(500).json({ error: "Authentication is not configured" });
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return response.status(401).json({ error: "Invalid or expired token" });
  }
  const userId = Number(payload.sub);
  if (!Number.isSafeInteger(userId) || userId < 1) return response.status(401).json({ error: "Invalid token subject" });
  try {
    const [user] = await db.select({ id: users.id, role: users.role }).from(users).where(eq(users.id, userId)).limit(1);
    if (!user) return response.status(401).json({ error: "User no longer exists" });
    request.auth = { ...payload, sub: user.id, role: user.role };
    return next();
  } catch (error) { return next(error); }
}

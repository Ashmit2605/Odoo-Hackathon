import { verifyToken } from "../controllers/auth.controller.js";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";

export default async function requireAuth(request, response, next) {
  const authorization = request.get("authorization");
  const [scheme, token] = authorization?.split(" ") ?? [];

  if (scheme !== "Bearer" || !token) {
    return response.status(401).json({ message: "Authentication is required." });
  }

  const userId = verifyToken(token);
  if (!userId) {
    return response.status(401).json({ message: "Session is invalid or expired." });
  }

  try {
    const [user] = await db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!user) {
      return response.status(401).json({ message: "Account no longer exists." });
    }
    request.user = user;
    return next();
  } catch (error) {
    console.error("Authentication check failed:", error);
    return response.status(503).json({ message: "Authentication is temporarily unavailable." });
  }
}

import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
const safeUser = ({ passwordHash, ...user }) => user;
const validEmail = (value) => typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

router.post("/signup", async (request, response, next) => {
  try {
    const { name, email, password } = request.body || {};
    if (typeof name !== "string" || !name.trim() || name.trim().length > 150 || !validEmail(email) || email.length > 255 || typeof password !== "string" || password.length < 8) {
      return response.status(400).json({ error: "Name (1-150 chars), valid email, and password (at least 8 chars) are required" });
    }
    const normalizedEmail = email.trim().toLowerCase();
    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, normalizedEmail)).limit(1);
    if (existing) return response.status(409).json({ error: "Email is already registered" });
    const passwordHash = await bcrypt.hash(password, 12);
    const [user] = await db.insert(users).values({ name: name.trim(), email: normalizedEmail, passwordHash }).returning();
    return response.status(201).json({ user: safeUser(user) });
  } catch (error) { return next(error); }
});

router.post("/login", async (request, response, next) => {
  try {
    const { email, password } = request.body || {};
    if (!validEmail(email) || typeof password !== "string") return response.status(400).json({ error: "Valid email and password are required" });
    if (!process.env.JWT_SECRET) return response.status(500).json({ error: "Authentication is not configured" });
    const [user] = await db.select().from(users).where(eq(users.email, email.trim().toLowerCase())).limit(1);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) return response.status(401).json({ error: "Invalid email or password" });
    const token = jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "1h" });
    return response.json({ token, user: safeUser(user) });
  } catch (error) { return next(error); }
});

router.get("/me", requireAuth, async (request, response, next) => {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, Number(request.auth.sub))).limit(1);
    return user ? response.json({ user: safeUser(user) }) : response.status(401).json({ error: "User no longer exists" });
  } catch (error) { return next(error); }
});

// JWT access tokens are stateless; logout is completed by discarding the token on the client.
router.post("/logout", requireAuth, (_request, response) => response.status(200).json({ message: "Logged out; discard the access token" }));

router.put("/profile", requireAuth, async (request, response, next) => {
  try {
    const { name, email } = request.body || {};
    if (name === undefined && email === undefined) return response.status(400).json({ error: "Provide name and/or email" });
    const changes = {};
    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim() || name.trim().length > 150) return response.status(400).json({ error: "Name must be 1-150 characters" });
      changes.name = name.trim();
    }
    if (email !== undefined) {
      if (!validEmail(email) || email.length > 255) return response.status(400).json({ error: "A valid email (up to 255 characters) is required" });
      changes.email = email.trim().toLowerCase();
    }
    const [user] = await db.update(users).set(changes).where(eq(users.id, Number(request.auth.sub))).returning();
    return user ? response.json({ user: safeUser(user) }) : response.status(404).json({ error: "User not found" });
  } catch (error) { return next(error); }
});

router.put("/change-password", requireAuth, async (request, response, next) => {
  try {
    const { currentPassword, newPassword } = request.body || {};
    if (typeof currentPassword !== "string" || typeof newPassword !== "string" || newPassword.length < 8) return response.status(400).json({ error: "Current password and new password (at least 8 chars) are required" });
    const [user] = await db.select().from(users).where(eq(users.id, Number(request.auth.sub))).limit(1);
    if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) return response.status(401).json({ error: "Current password is incorrect" });
    await db.update(users).set({ passwordHash: await bcrypt.hash(newPassword, 12) }).where(eq(users.id, user.id));
    return response.json({ message: "Password changed successfully" });
  } catch (error) { return next(error); }
});

export default router;

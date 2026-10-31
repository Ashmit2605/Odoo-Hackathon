<<<<<<< HEAD
import * as authService from '../services/auth.service.js';
import {
  loginSchema,
  registerSchema,
  updateProfileSchema,
} from '../validators/auth.validator.js';

export async function register(req, res, next) {
  try {
    const data = registerSchema.parse(req.body);
    const result = await authService.register(data);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const data = loginSchema.parse(req.body);
    const result = await authService.login(data);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function me(req, res, next) {
  try {
    const profile = await authService.getProfile(req.user.id);
    if (!profile) return res.status(404).json({ error: 'User not found' });
    res.json(profile);
  } catch (err) {
    next(err);
  }
}

export async function updateMe(req, res, next) {
  try {
    const data = updateProfileSchema.parse(req.body);
    const profile = await authService.updateProfile(req.user.id, data);
    res.json(profile);
  } catch (err) {
    next(err);
  }
}
=======
import {
  createHash,
  createHmac,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { and, eq, gt } from "drizzle-orm";
import { db, isDatabaseConfigured } from "../db/index.js";
import { customers, passwordResetTokens, users } from "../db/schema.js";

const scrypt = promisify(scryptCallback);
const tokenSecret =
  process.env.AUTH_TOKEN_SECRET || randomBytes(32).toString("hex");
const TOKEN_LIFETIME_SECONDS = 60 * 60 * 12;

function createToken(userId) {
  const expiresAt = Math.floor(Date.now() / 1000) + TOKEN_LIFETIME_SECONDS;
  const payload = `${userId}.${expiresAt}`;
  const signature = createHmac("sha256", tokenSecret)
    .update(payload)
    .digest("hex");
  return `${payload}.${signature}`;
}

export function verifyToken(token) {
  const [userIdValue, expiresAtValue, signature, ...rest] = token.split(".");
  if (!userIdValue || !expiresAtValue || !signature || rest.length) return null;

  const userId = Number(userIdValue);
  const expiresAt = Number(expiresAtValue);
  if (
    !Number.isSafeInteger(userId) ||
    userId < 1 ||
    !Number.isSafeInteger(expiresAt) ||
    expiresAt <= Math.floor(Date.now() / 1000)
  ) {
    return null;
  }

  const expected = createHmac("sha256", tokenSecret)
    .update(`${userIdValue}.${expiresAtValue}`)
    .digest();
  const actual = Buffer.from(signature, "hex");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return null;
  }
  return userId;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPassword(password) {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, 64);
  return `scrypt$${salt}$${derivedKey.toString("hex")}`;
}

async function verifyPassword(password, passwordHash) {
  const [algorithm, salt, hashHex] = passwordHash.split("$");
  if (algorithm !== "scrypt" || !salt || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = await scrypt(password, salt, expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function databaseUnavailable(response) {
  return response.status(503).json({
    message:
      "Database is not configured. Set DATABASE_URL in Backend/.env, then restart the backend.",
  });
}

export async function register(request, response) {
  const { fullName, email, password, confirmPassword } = request.body ?? {};
  if (
    typeof fullName !== "string" ||
    typeof email !== "string" ||
    typeof password !== "string" ||
    typeof confirmPassword !== "string"
  ) {
    return response.status(400).json({ message: "All fields are required." });
  }

  const name = fullName.trim();
  const normalizedEmail = email.trim().toLowerCase();
  if (!name || name.length > 150) {
    return response
      .status(400)
      .json({ message: "Name must be between 1 and 150 characters." });
  }
  if (normalizedEmail.length > 255 || !isValidEmail(normalizedEmail)) {
    return response.status(400).json({ message: "Enter a valid email address." });
  }
  if (!isValidPassword(password)) {
    return response.status(400).json({
      message:
        "Password must contain at least 8 characters, an uppercase letter, a lowercase letter, and a special character.",
    });
  }
  if (password !== confirmPassword) {
    return response.status(400).json({ message: "Passwords do not match." });
  }
  if (!isDatabaseConfigured) return databaseUnavailable(response);

  try {
    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);
    if (existingUser) {
      return response
        .status(409)
        .json({ message: "An account with this email already exists." });
    }

    const passwordHash = await hashPassword(password);
    const user = await db.transaction(async (transaction) => {
      const [createdUser] = await transaction
        .insert(users)
        .values({ name, email: normalizedEmail, passwordHash })
        .returning({ id: users.id, name: users.name, email: users.email });
      await transaction.insert(customers).values({
        userId: createdUser.id,
        name,
        email: normalizedEmail,
      });
      return createdUser;
    });

    return response.status(201).json({
      message: "Account created successfully.",
      user,
      token: createToken(user.id),
    });
  } catch (error) {
    if (error.code === "23505") {
      return response
        .status(409)
        .json({ message: "An account with this email already exists." });
    }
    console.error("Registration failed:", error);
    if (error.code === "28P01" || error.code === "28000") {
      return response.status(503).json({
        message: "Database login failed. Verify the credentials in Backend/.env.",
      });
    }
    if (error.code === "3D000") {
      return response.status(503).json({
        message:
          "The configured PostgreSQL database does not exist. Create it, then run npm run db:push from Backend.",
      });
    }
    if (error.code === "42P01") {
      return response.status(503).json({
        message: "The application tables are missing. Run npm run db:push from Backend.",
      });
    }
    return response.status(503).json({
      message:
        "Registration could not reach the database. Verify Backend/.env and PostgreSQL, then try again.",
    });
  }
}

export async function login(request, response) {
  const { email, password } = request.body ?? {};
  if (typeof email !== "string" || typeof password !== "string") {
    return response.status(400).json({ message: "Email and password are required." });
  }
  if (!isDatabaseConfigured) return databaseUnavailable(response);

  try {
    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        passwordHash: users.passwordHash,
      })
      .from(users)
      .where(eq(users.email, email.trim().toLowerCase()))
      .limit(1);
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return response.status(401).json({ message: "Invalid email or password." });
    }
    const { passwordHash, ...safeUser } = user;
    return response.json({ user: safeUser, token: createToken(user.id) });
  } catch (error) {
    console.error("Login failed:", error);
    return response.status(503).json({
      message: "Login could not reach the database. Verify PostgreSQL and try again.",
    });
  }
}

export async function currentUser(request, response) {
  try {
    const [user] = await db
      .select({ id: users.id, name: users.name, email: users.email, role: users.role })
      .from(users)
      .where(eq(users.id, request.user.id))
      .limit(1);
    if (!user) return response.status(401).json({ message: "Account not found." });
    return response.json({ user });
  } catch (error) {
    console.error("Loading current user failed:", error);
    return response.status(503).json({ message: "Unable to load your account right now." });
  }
}

export async function requestPasswordReset(request, response) {
  const { email } = request.body ?? {};
  if (typeof email !== "string" || !isValidEmail(email.trim())) {
    return response.status(400).json({ message: "Enter a valid email address." });
  }
  if (!isDatabaseConfigured) return databaseUnavailable(response);
  if (process.env.NODE_ENV === "production") {
    return response.status(503).json({
      message: "Password reset email delivery is not configured on this server.",
    });
  }

  try {
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email.trim().toLowerCase()))
      .limit(1);
    if (!user) {
      return response.json({
        message: "If that email is registered, a reset code is available.",
      });
    }

    const token = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    await db.transaction(async (transaction) => {
      await transaction
        .delete(passwordResetTokens)
        .where(eq(passwordResetTokens.userId, user.id));
      await transaction.insert(passwordResetTokens).values({
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      });
    });
    return response.json({
      message: "Development reset code created. It expires in 30 minutes.",
      resetToken: token,
    });
  } catch (error) {
    console.error("Password reset request failed:", error);
    return response.status(503).json({
      message: "Unable to request a password reset right now.",
    });
  }
}

export async function resetPassword(request, response) {
  const { token, password, confirmPassword } = request.body ?? {};
  if (typeof token !== "string" || !token) {
    return response.status(400).json({ message: "A password reset code is required." });
  }
  if (typeof password !== "string" || !isValidPassword(password)) {
    return response.status(400).json({
      message:
        "Password must contain at least 8 characters, an uppercase letter, a lowercase letter, and a special character.",
    });
  }
  if (password !== confirmPassword) {
    return response.status(400).json({ message: "Passwords do not match." });
  }
  if (!isDatabaseConfigured) return databaseUnavailable(response);

  try {
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const [resetRecord] = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.tokenHash, tokenHash),
          eq(passwordResetTokens.used, false),
          gt(passwordResetTokens.expiresAt, new Date()),
        ),
      )
      .limit(1);
    if (!resetRecord) {
      return response.status(400).json({ message: "Reset code is invalid or expired." });
    }

    const passwordHash = await hashPassword(password);
    await db.transaction(async (transaction) => {
      await transaction
        .update(users)
        .set({ passwordHash })
        .where(eq(users.id, resetRecord.userId));
      await transaction
        .update(passwordResetTokens)
        .set({ used: true })
        .where(eq(passwordResetTokens.id, resetRecord.id));
    });
    return response.json({ message: "Password updated. You can now sign in." });
  } catch (error) {
    console.error("Password reset failed:", error);
    return response.status(503).json({
      message: "Unable to reset your password right now.",
    });
  }
}
>>>>>>> 315d366 (done)

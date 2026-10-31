import bcrypt from 'bcryptjs';
import { eq, and, isNull } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users, customers } from '../db/schema.js';
import { signAccessToken } from '../utils/jwt.js';
import { homeForRole } from '../utils/role-home.js';
import { conflict, unauthorized, notFound } from '../utils/http-error.js';

const SALT_ROUNDS = 10;

function publicUser(u) {
  return { id: u.id, name: u.name, email: u.email, role: u.role, createdAt: u.createdAt };
}

function publicCustomer(c) {
  return {
    id: c.id,
    name: c.name,
    email: c.email,
    companyName: c.companyName,
    phone: c.phone,
    address: c.address,
  };
}
export async function register({
  name,
  email,
  password,
  companyName,
  phone,
  address,
}) {
  const normalizedEmail = email.trim().toLowerCase();

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (existing.length) {
    throw conflict("Email already registered");
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const result = await db.transaction(async (tx) => {
    const [createdUser] = await tx
      .insert(users)
      .values({
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: "CUSTOMER",
      })
      .returning();

    const [preExisting] = await tx
      .select()
      .from(customers)
      .where(
        and(
          eq(customers.email, normalizedEmail),
          isNull(customers.userId)
        )
      )
      .limit(1);

    let customerRow;

    if (preExisting) {
      [customerRow] = await tx
        .update(customers)
        .set({
          userId: createdUser.id,
          name: name.trim(),
          companyName: companyName || null,
          phone: phone || null,
          address: address || null,
        })
        .where(eq(customers.id, preExisting.id))
        .returning();
    } else {
      [customerRow] = await tx
        .insert(customers)
        .values({
          userId: createdUser.id,
          name: name.trim(),
          email: normalizedEmail,
          companyName: companyName || null,
          phone: phone || null,
          address: address || null,
        })
        .returning();
    }

    return { createdUser, customerRow };
  });

  const token = signAccessToken(result.createdUser);

  return {
    user: publicUser(result.createdUser),
    customer: publicCustomer(result.customerRow),
    token,
    redirectTo: homeForRole(result.createdUser.role),
  };
}
export async function login({ email, password }) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  // Same error for unknown email vs wrong password → no user enumeration
  if (!user) throw unauthorized('Invalid email or password');

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw unauthorized('Invalid email or password');

  const token = signAccessToken(user);

  // Include customer profile when the user is a CUSTOMER (for UI hydration)
  let customer = null;
  if (user.role === 'CUSTOMER') {
    const [c] = await db
      .select()
      .from(customers)
      .where(eq(customers.userId, user.id))
      .limit(1);
    if (c) customer = publicCustomer(c);
  }

  return {
    user: publicUser(user),
    customer,
    token,
    redirectTo: homeForRole(user.role),
  };
}

export async function getProfile(userId) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!user) return null;

  // For CUSTOMER: return their customer record (extended profile).
  // For ADMIN/STAFF: also return their customers row if one was linked
  // (we reuse the customers table to store phone/company for internal users).
  const [c] = await db
    .select()
    .from(customers)
    .where(eq(customers.userId, user.id))
    .limit(1);

  return { user: publicUser(user), customer: c ? publicCustomer(c) : null };
}

/**
 * Update the profile for any role.
 *
 * - All roles: name (on users table)
 * - CUSTOMER:  phone, companyName, address (on customers table)
 * - ADMIN/STAFF: phone, company (stored in customers table linked by userId,
 *                created on first update if not already present)
 */
export async function updateProfile(userId, data) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!user) throw notFound('User not found');

  // 1. Update name on users table (for all roles)
  const userUpdates = {};
  if (data.name !== undefined) userUpdates.name = data.name;

  let updatedUser = user;
  if (Object.keys(userUpdates).length > 0) {
    const [u] = await db
      .update(users)
      .set(userUpdates)
      .where(eq(users.id, userId))
      .returning();
    updatedUser = u;
  }

  // 2. Update or create the extended profile row
  const extUpdates = {};
  if (data.phone       !== undefined) extUpdates.phone       = data.phone;
  if (data.address     !== undefined) extUpdates.address     = data.address;
  if (data.companyName !== undefined) extUpdates.companyName = data.companyName;

  let customerRow = null;
  if (Object.keys(extUpdates).length > 0) {
    const [existing] = await db
      .select()
      .from(customers)
      .where(eq(customers.userId, userId))
      .limit(1);

    if (existing) {
      const [c] = await db
        .update(customers)
        .set(extUpdates)
        .where(eq(customers.id, existing.id))
        .returning();
      customerRow = c;
    } else if (user.role !== 'CUSTOMER') {
      // Auto-create an internal-user customer row on first extended-profile save
      const [c] = await db
        .insert(customers)
        .values({
          userId,
          name:  updatedUser.name,
          email: updatedUser.email,
          ...extUpdates,
        })
        .returning();
      customerRow = c;
    }
  } else {
    // No extended updates — just return what's already there
    const [c] = await db
      .select()
      .from(customers)
      .where(eq(customers.userId, userId))
      .limit(1);
    customerRow = c ?? null;
  }

  return {
    user:     publicUser(updatedUser),
    customer: customerRow ? publicCustomer(customerRow) : null,
  };
}
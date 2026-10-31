import bcrypt from 'bcryptjs';
import { eq, and, isNull } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users, customers } from '../db/schema.js';
import { signAccessToken } from '../utils/jwt.js';
import { homeForRole } from '../utils/role-home.js';
import { conflict, unauthorized } from '../utils/http-error.js';

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

export async function register({ name, email, password, companyName, phone, address }) {
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing.length) throw conflict('Email already registered');

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // 1) Create the user (role CUSTOMER — enforced, not accepted from client)
  const [createdUser] = await db
    .insert(users)
    .values({ name, email, passwordHash, role: 'CUSTOMER' })
    .returning();

  // 2) Link or create the customer record
  // If an admin pre-created a customer with this email and no user, link it.
  const [preExisting] = await db
    .select()
    .from(customers)
    .where(and(eq(customers.email, email), isNull(customers.userId)))
    .limit(1);

  let customerRow;
  if (preExisting) {
    [customerRow] = await db
      .update(customers)
      .set({ userId: createdUser.id, companyName, phone, address })
      .where(eq(customers.id, preExisting.id))
      .returning();
  } else {
    [customerRow] = await db
      .insert(customers)
      .values({ userId: createdUser.id, name, email, companyName, phone, address })
      .returning();
  }

  const token = signAccessToken(createdUser);
  return {
    user: publicUser(createdUser),
    customer: publicCustomer(customerRow),
    token,
    redirectTo: homeForRole(createdUser.role),
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

  let customer = null;
  if (user.role === 'CUSTOMER') {
    const [c] = await db
      .select()
      .from(customers)
      .where(eq(customers.userId, user.id))
      .limit(1);
    if (c) customer = publicCustomer(c);
  }

  return { user: publicUser(user), customer };
}
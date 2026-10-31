import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { pool } from '../src/db/index.js';
import { db } from '../src/db/index.js';
import { users, customers, invoices } from '../src/db/schema.js';
import { truncateAll, closeDb } from './helpers.js';

// MOCK THE AUTH MIDDLEWARE (Bypass JWT for tests)
vi.mock('../src/middleware/auth.middleware.js', () => ({
  requireAuth: (req, res, next) => {
    req.user = { id: 1, role: 'STAFF' }; // Fake Staff User
    next();
  },
  requireRole: () => (req, res, next) => next()
}));

beforeEach(async () => {
  await truncateAll();
  
  // Seed a fake staff user & customer
  await db.insert(users).values({ id: 1, name: 'Staff Member', email: 'staff@test.com', passwordHash: 'x', role: 'STAFF' });
  await db.insert(customers).values({ name: 'Test Customer', email: 'cust@test.com' });
});

afterAll(async () => {
  await closeDb();
});

describe('STAFF ROUTES', () => {
  
  it('GET /api/staff/dashboard - returns summary', async () => {
    const res = await request(app).get('/api/staff/dashboard');
    expect(res.status).toBe(200);
    expect(res.body.totalCustomers).toBe(1);
  });

  it('GET /api/staff/customers - lists customers', async () => {
    const res = await request(app).get('/api/staff/customers');
    expect(res.status).toBe(200);
    expect(res.body).toBeInstanceOf(Array);
    expect(res.body[0].name).toBe('Test Customer');
  });

  it('POST /api/staff/customers - creates a customer', async () => {
    const res = await request(app)
      .post('/api/staff/customers')
      .send({ name: 'New Cust', email: 'new@test.com', phone: '12345' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('New Cust');
  });

  it('PATCH /api/staff/invoices/:id/confirm - confirms a draft invoice', async () => {
    // 1. Create a dummy invoice
    const [inv] = await db.insert(invoices).values({
      invoiceNumber: 'INV-001',
      customerId: 1,
      totalAmount: '100.00',
      status: 'DRAFT',
      invoiceDate: new Date()
    }).returning();

    // 2. Confirm it
    const res = await request(app).patch(`/api/staff/invoices/${inv.id}/confirm`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('CONFIRMED');
  });

  it('POST /api/staff/payments - records a payment and updates invoice', async () => {
    // 1. Create invoice (Total 100)
    const [inv] = await db.insert(invoices).values({
      invoiceNumber: 'INV-002',
      customerId: 1,
      totalAmount: '100.00',
      amountPaid: '0.00',
      status: 'CONFIRMED',
      invoiceDate: new Date()
    }).returning();

    // 2. Pay 100
    const res = await request(app)
      .post('/api/staff/payments')
      .send({ invoiceId: inv.id, amount: 100, method: 'CASH' });
      
    expect(res.status).toBe(201);
    expect(res.body.invoiceStatus).toBe('PAID'); // Fully paid
  });

});
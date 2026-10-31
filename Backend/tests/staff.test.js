import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { pool } from '../src/db/index.js';
import { db } from '../src/db/index.js';
// 👇 Single, clean import for all tables
import { users, customers, invoices, subscriptions, plans, quotationTemplates } from '../src/db/schema.js';
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
  
  // 1. Seed the staff user (We keep id: 1 here because auth middleware depends on it)
  await db.insert(users).values({ id: 1, name: 'Staff Member', email: 'staff@test.com', passwordHash: 'x', role: 'STAFF' });
  
  // 2. Let the DB auto-assign IDs for everything else so sequences don't break!
  await db.insert(customers).values({ name: 'Test Customer', email: 'cust@test.com' });

  // 3. Seed the Plan and Template
  await db.insert(plans).values({ 
    name: 'Test Monthly Plan', 
    price: '100.00', 
    billingFrequency: 'MONTHLY' 
  });

  await db.insert(quotationTemplates).values({ 
    name: 'Standard Template', 
    planId: 1, 
    validityDays: 30 
  });
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
    const [inv] = await db.insert(invoices).values({
      invoiceNumber: 'INV-001',
      customerId: 1,
      totalAmount: '100.00',
      status: 'DRAFT',
      invoiceDate: new Date()
    }).returning();

    const res = await request(app).patch(`/api/staff/invoices/${inv.id}/confirm`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('CONFIRMED');
  });

  it('POST /api/staff/payments - records a payment and updates invoice', async () => {
    const [inv] = await db.insert(invoices).values({
      invoiceNumber: 'INV-002',
      customerId: 1,
      totalAmount: '100.00',
      amountPaid: '0.00',
      status: 'CONFIRMED',
      invoiceDate: new Date()
    }).returning();

    const res = await request(app)
      .post('/api/staff/payments')
      .send({ invoiceId: inv.id, amount: 100, method: 'CASH' });
      
    expect(res.status).toBe(201);
    expect(res.body.invoiceStatus).toBe('PAID'); // Fully paid
  });

  it('POST /api/staff/quotations - creates a quotation', async () => {
    const res = await request(app)
      .post('/api/staff/quotations')
      .send({ 
        customerId: 1, 
        templateId: 1, 
        startDate: '2026-11-01' 
      });
      
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('QUOTATION');
    expect(res.body.subscriptionNumber).toContain('QT-');
  });

  it('PATCH /api/staff/subscriptions/:id/confirm - confirms a quotation', async () => {
    const [sub] = await db.insert(subscriptions).values({
      subscriptionNumber: 'QT-123',
      customerId: 1,
      planId: 1,
      startDate: new Date(),
      status: 'QUOTATION'
    }).returning();

    const res = await request(app).patch(`/api/staff/subscriptions/${sub.id}/confirm`);
    
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('CONFIRMED');
    expect(res.body.nextBillingDate).toBeDefined();
  });

  it('PUT /api/staff/profile - updates the staff profile', async () => {
    const res = await request(app)
      .put('/api/staff/profile')
      .send({ 
        name: 'Updated Staff Name', 
        email: 'updated_staff@test.com' 
      });
      
    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe('Updated Staff Name');
    expect(res.body.user.email).toBe('updated_staff@test.com');
  });
});
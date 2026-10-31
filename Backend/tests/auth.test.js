import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { truncateAll, closeDb } from './helpers.js';

const GOOD = { name: 'Alice', email: 'alice@example.com', password: 'Test@Pass123' };

beforeEach(async () => { await truncateAll(); });
afterAll(async () => { await truncateAll(); await closeDb(); });

// ───────────── REGISTER ─────────────
describe('POST /api/auth/register', () => {
  it('creates CUSTOMER + customer row, returns token + redirectTo', async () => {
    const res = await request(app).post('/api/auth/register').send(GOOD);
    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({ name: 'Alice', email: 'alice@example.com', role: 'CUSTOMER' });
    expect(res.body.user).not.toHaveProperty('passwordHash');
    expect(res.body.customer).toMatchObject({ email: 'alice@example.com' });
    expect(typeof res.body.token).toBe('string');
    expect(res.body.redirectTo).toBe('/customer/dashboard');
  });

  it('normalizes email to lowercase', async () => {
    const res = await request(app).post('/api/auth/register')
      .send({ ...GOOD, email: 'ALICE@Example.COM' });
    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe('alice@example.com');
  });

  it('accepts optional customer fields', async () => {
    const res = await request(app).post('/api/auth/register').send({
      ...GOOD, companyName: 'Acme', phone: '9999999999', address: '1 Main St',
    });
    expect(res.status).toBe(201);
    expect(res.body.customer).toMatchObject({ companyName: 'Acme', phone: '9999999999' });
  });

  it('ignores client-sent role (always CUSTOMER)', async () => {
    const res = await request(app).post('/api/auth/register').send({ ...GOOD, role: 'ADMIN' });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('CUSTOMER');
  });

  it('rejects duplicate email with 409', async () => {
    await request(app).post('/api/auth/register').send(GOOD);
    const res = await request(app).post('/api/auth/register').send(GOOD);
    expect(res.status).toBe(409);
  });

  it('rejects weak passwords', async () => {
    for (const pwd of ['Ab@1', 'test@pass123', 'TestPass123', 'TEST@PASS123']) {
      const res = await request(app).post('/api/auth/register')
        .send({ ...GOOD, password: pwd });
      expect(res.status).toBe(400);
    }
  });

  it('rejects invalid email', async () => {
    const res = await request(app).post('/api/auth/register')
      .send({ ...GOOD, email: 'not-email' });
    expect(res.status).toBe(400);
  });
});

// ───────────── LOGIN ─────────────
describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/auth/register').send(GOOD);
  });

  it('returns token + redirectTo for CUSTOMER', async () => {
    const res = await request(app).post('/api/auth/login')
      .send({ email: GOOD.email, password: GOOD.password });
    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('CUSTOMER');
    expect(res.body.redirectTo).toBe('/customer/dashboard');
    expect(res.body.customer).toBeTruthy();
  });

  it('accepts mixed-case email', async () => {
    const res = await request(app).post('/api/auth/login')
      .send({ email: 'ALICE@EXAMPLE.COM', password: GOOD.password });
    expect(res.status).toBe(200);
  });

  it('rejects wrong password (401)', async () => {
    const res = await request(app).post('/api/auth/login')
      .send({ email: GOOD.email, password: 'Wrong@Pass123' });
    expect(res.status).toBe(401);
  });

  it('rejects unknown email with same message (no user enumeration)', async () => {
    const res = await request(app).post('/api/auth/login')
      .send({ email: 'ghost@example.com', password: 'Test@Pass123' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid email or password');
  });
});

// ───────────── ME ─────────────
describe('GET /api/auth/me', () => {
  let token;
  beforeEach(async () => {
    const reg = await request(app).post('/api/auth/register').send(GOOD);
    token = reg.body.token;
  });

  it('returns user + customer profile', async () => {
    const res = await request(app).get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(GOOD.email);
    expect(res.body.customer.email).toBe(GOOD.email);
  });

  it('rejects without token (401)', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('rejects malformed header (401)', async () => {
    const res = await request(app).get('/api/auth/me')
      .set('Authorization', 'NotBearer xyz');
    expect(res.status).toBe(401);
  });

  it('rejects invalid token (401)', async () => {
    const res = await request(app).get('/api/auth/me')
      .set('Authorization', 'Bearer not.a.jwt');
    expect(res.status).toBe(401);
  });
});
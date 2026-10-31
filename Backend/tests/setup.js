import { config } from 'dotenv';
config();

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET ||= 'test-secret-do-not-use-in-prod';
process.env.JWT_EXPIRES_IN ||= '1h';

// ⚠️ Tests run against the DEV database (odoohackathon) — no separate test DB.
// Each `npm test` truncates users + customers.
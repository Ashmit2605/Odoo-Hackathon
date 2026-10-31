import 'dotenv/config';
import app from './app.js';                    // ✅ NOT './src/app.js'
import { connectDatabase, pool } from './db/index.js';  // ✅ NOT './src/db/index.js'

const PORT = Number(process.env.PORT) || 5000;

async function start() {
  try {
    if (!process.env.JWT_SECRET?.trim()) {
      throw new Error('JWT_SECRET is required. Set it in Backend/.env before starting the API.');
    }
    await connectDatabase();
    console.log('✅ Database connected');
    app.listen(PORT, () => console.log(`🚀 Server on http://localhost:${PORT}`));
  } catch (err) {
    console.error('❌ Failed to start:', err);
    process.exit(1);
  }
}

start();

process.on('SIGINT', async () => { await pool.end(); process.exit(0); });
process.on('SIGTERM', async () => { await pool.end(); process.exit(0); });
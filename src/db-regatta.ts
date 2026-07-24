import { Pool } from 'pg';

/**
 * PostgreSQL Connection Pool für db_regatta
 * Regatta-Tracking: Personen, Sessions, GPS-Punkte
 */
const regattaPool = new Pool({
  connectionString: process.env.REGATTA_DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

regattaPool.on('error', (err) => {
  console.error('Regatta DB Pool Fehler:', err.message);
});

export default regattaPool;

import { Pool } from 'pg';

const songPool = new Pool({
  host: process.env.TIMEBOOK_DB_HOST || '192.168.178.25',
  port: parseInt(process.env.TIMEBOOK_DB_PORT || '5432'),
  user: process.env.TIMEBOOK_DB_USER || 'marijan',
  password: process.env.TIMEBOOK_DB_PASSWORD,
  database: 'db_songs',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

songPool.on('error', (err) => {
  console.error('Songs DB Fehler:', err.message);
});

export default songPool;

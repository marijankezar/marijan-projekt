import { Pool } from 'pg';

const songPool = new Pool({
  connectionString: process.env.SONGS_DATABASE_URL,
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

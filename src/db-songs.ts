import { Pool } from 'pg';

const songPool = new Pool({
  host: '192.168.178.25',
  port: 5432,
  user: 'marijan',
  password: 'postgres',
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

import { Pool } from 'pg';

/**
 * PostgreSQL Connection Pool für db_worktime
 * Multi-Company Zeiterfassung & Task-Management
 */
const worktimePool = new Pool({
  connectionString: process.env.WORKTIME_DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

worktimePool.on('error', (err) => {
  console.error('Worktime DB Pool Fehler:', err.message);
});

export default worktimePool;

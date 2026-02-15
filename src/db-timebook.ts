import { Pool } from 'pg';

/**
 * PostgreSQL Connection Pool für db_timebook
 * Zeiterfassungs-Datenbank
 */
const timebookPool = new Pool({
  host: process.env.TIMEBOOK_DB_HOST || '192.168.178.25',
  port: parseInt(process.env.TIMEBOOK_DB_PORT || '5432'),
  user: process.env.TIMEBOOK_DB_USER || 'marijan',
  password: process.env.TIMEBOOK_DB_PASSWORD || 'postgres',
  database: 'db_timebook',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

// Error Handler
timebookPool.on('error', (err) => {
  console.error('TimeBook DB Pool Fehler:', err.message);
});


/**
 * Setzt den aktuellen Benutzer für Row Level Security
 * Muss vor Queries aufgerufen werden, die RLS nutzen
 */
export async function setCurrentUser(userId: number): Promise<void> {
  await timebookPool.query(`SET app.current_user_id = '${userId}'`);
}

/**
 * Führt eine Query mit gesetztem Benutzerkontext aus
 */
export async function queryWithUser<T>(
  userId: number,
  query: string,
  params?: unknown[]
): Promise<T[]> {
  const client = await timebookPool.connect();
  try {
    await client.query(`SET app.current_user_id = '${userId}'`);
    const result = await client.query(query, params);
    return result.rows as T[];
  } finally {
    client.release();
  }
}

/**
 * Führt eine Transaktion mit gesetztem Benutzerkontext aus
 */
export async function transactionWithUser<T>(
  userId: number,
  callback: (client: import('pg').PoolClient) => Promise<T>
): Promise<T> {
  const client = await timebookPool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`SET app.current_user_id = '${userId}'`);
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export default timebookPool;

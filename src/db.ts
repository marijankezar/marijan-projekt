import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Pool-Konfiguration für stabile Verbindungen
  max: 10,                        // Maximale Anzahl Clients im Pool
  idleTimeoutMillis: 30000,       // Client wird nach 30s Inaktivität geschlossen
  connectionTimeoutMillis: 5000,  // Timeout für neue Verbindung: 5s
  keepAlive: true,                // TCP Keep-Alive aktivieren
  keepAliveInitialDelayMillis: 10000, // Keep-Alive nach 10s
});

// Error Handler für den Pool - verhindert Crashes bei Verbindungsproblemen
pool.on('error', (err) => {
  console.error('Unerwarteter Datenbankfehler:', err.message);
});

// Verbindung beim Start testen
pool.query('SELECT 1')
  .catch((err) => console.error('Datenbankverbindung fehlgeschlagen:', err.message));

export default pool;
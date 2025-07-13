// connectionService.ts – Service-Funktionen

import pool from '../lib/db'; 

// SELECT-Funktion
export async function getAllConnectionLogs() {
  const res = await pool.query('SELECT * FROM connection_logs ORDER BY log_time DESC');
  return res.rows;
}

// INSERT-Funktion
export async function insertConnectionLog(data: {
  username: string;
  host: string;
  ip_address: string;
  placeholder1: string;
  placeholder2: string;
  placeholder3: number;
  placeholder4: number;
  placeholder5: boolean;
}) {
  const query = `
    INSERT INTO connection_logs 
    (username, host, ip_address, placeholder1, placeholder2, placeholder3, placeholder4, placeholder5)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  `;
  const values = [
    data.username,
    data.host,
    data.ip_address,
    data.placeholder1,
    data.placeholder2,
    data.placeholder3,
    data.placeholder4,
    data.placeholder5,
  ];

  await pool.query(query, values);
}

// UPDATE-Funktion
export async function updateConnectionLogByUsername(username: string, updates: {
  placeholder1?: string;
  placeholder3?: number;
}) {
  const query = `
    UPDATE connection_logs
    SET placeholder1 = $1, placeholder3 = $2
    WHERE username = $3
  `;
  await pool.query(query, [updates.placeholder1, updates.placeholder3, username]);
}

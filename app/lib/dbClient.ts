// file: lib/dbClient.ts
import { Client } from "pg";

export function createClient() {
  return new Client({
    user: "kmarijan",
    password: "kmarijankmarijan",
    database: "kmarijan",
    host: "192.168.178.25",
    port: 5432, // Standard-Port für PostgreSQL
  });
}

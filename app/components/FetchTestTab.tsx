// file: app/components/FetchTestTab.tsx
"use client";

import { useEffect, useState } from "react";
import { createClient } from "../lib/dbClient";

type TestTabEntry = {
  id: number;
  timestamp: string;
  name: string;
  ip: string;
  host: string;
};

export default function FetchTestTab() {
  const [data, setData] = useState<TestTabEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const res = await fetch("/api/get-data-pg");
      const json = await res.json();
      setData(json.rows);
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">📊 Datenbank-Test Tab PostgreSQL</h1>
      <ul>
        {data.map((entry) => (
          <li key={entry.id} className="mb-2">
            <strong>{entry.name}</strong> ({entry.ip}) - {entry.host} at {entry.timestamp}
          </li>
        ))}
      </ul>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';

type Row = {
  [key: string]: any;
};

export default function DBViewer() {
  const [data, setData] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/get-data');
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error('Fehler beim Laden:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">📊 Datenbank-Test Tab Maria DB_</h2>
      {loading ? (
        <p>Lädt...</p>
      ) : (
        <table className="table-auto border-collapse border border-gray-300 w-full">
          <thead>
            <tr>
              {data.length > 0 &&
                Object.keys(data[0]).map((key) => (
                  <th key={key} className="border px-4 py-2 bg-gray-100 dark:bg-gray-700">
                    {key}
                  </th>
                ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                {Object.values(row).map((val, i) => (
                  <td key={i} className="border px-4 py-2">
                    {val}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

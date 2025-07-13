'use client';

import React, { useEffect, useState } from 'react';

type LogEntry = {
  id: number;
  log_time: string;
  username: string;
  host: string;
  ip_address: string;
  placeholder1: string;
  placeholder2: string;
  placeholder3: number;
  placeholder4: number;
  placeholder5: boolean;
};

export default function ConnectionLogger() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [formData, setFormData] = useState({
    username: '',
    host: '',
    ip_address: '',
    placeholder1: '',
    placeholder2: '',
    placeholder3: 0.0,
    placeholder4: 0,
    placeholder5: false,
  });

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    const res = await fetch('/api/connection-logs');
    const data = await res.json();
    setLogs(data);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleInsert = async () => {
    await fetch('/api/connection-logs', {
      method: 'POST',
      body: JSON.stringify({ ...formData, placeholder3: parseFloat(formData.placeholder3.toString()) }),
      headers: { 'Content-Type': 'application/json' },
    });
    fetchLogs();
  };

  const handleUpdate = async () => {
    await fetch('/api/connection-logs', {
      method: 'PUT',
      body: JSON.stringify({
        username: formData.username,
        placeholder1: formData.placeholder1,
        placeholder3: parseFloat(formData.placeholder3.toString()),
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    fetchLogs();
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Connection Logger</h2>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {Object.entries(formData).map(([key, val]) => (
          <div key={key} className="flex flex-col">
            <label className="text-sm capitalize">{key}</label>
            <input
              type={typeof val === 'boolean' ? 'checkbox' : 'text'}
              name={key}
              value={typeof val === 'boolean' ? undefined : val}
              checked={typeof val === 'boolean' ? val : undefined}
              onChange={handleChange}
              className="border p-2 rounded"
            />
          </div>
        ))}
      </div>

      <div className="flex gap-4 mb-6">
        <button onClick={handleInsert} className="bg-blue-600 text-white px-4 py-2 rounded">
          Insert
        </button>
        <button onClick={handleUpdate} className="bg-yellow-500 text-white px-4 py-2 rounded">
          Update
        </button>
      </div>

      <h3 className="text-xl font-semibold mb-2">Logs:</h3>
      <table className="w-full border text-sm">
        <thead className="bg-gray-200">
          <tr>
            <th className="p-2 border">ID</th>
            <th className="p-2 border">Time</th>
            <th className="p-2 border">User</th>
            <th className="p-2 border">IP</th>
            <th className="p-2 border">Placeholders</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} className="border-t">
              <td className="p-2 border">{log.id}</td>
              <td className="p-2 border">{log.log_time}</td>
              <td className="p-2 border">{log.username}</td>
              <td className="p-2 border">{log.ip_address}</td>
              <td className="p-2 border">
                {log.placeholder1}, {log.placeholder2}, {log.placeholder3}, {log.placeholder4}, {log.placeholder5 ? '✓' : '✗'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

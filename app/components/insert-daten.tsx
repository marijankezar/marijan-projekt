'use client'

import { useState } from 'react'

export default function InsertFormPage() {
  const [name, setName] = useState('')
  const [ip, setIP] = useState('')
  const [host, setHost] = useState('')
  const [status, setStatus] = useState<string | null>(null)

  const handleSubmit = async () => {
    setStatus('Sende Daten...')

    try {
      const res = await fetch('/api/insert-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Name: name, IP: ip, Host: host }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Unbekannter Fehler')
      }

      setStatus(`Erfolgreich eingefügt (ID: ${data.insertId})`)
    } catch (err: any) {
      setStatus(`Fehler: ${err.message}`)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded shadow">
      <h2 className="text-xl font-bold mb-4">Eintrag hinzufügen</h2>

      <label className="block mb-2">
        Name:
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border p-2 rounded mt-1"
        />
      </label>

      <label className="block mb-2">
        IP:
        <input
          type="text"
          value={ip}
          onChange={(e) => setIP(e.target.value)}
          className="w-full border p-2 rounded mt-1"
        />
      </label>

      <label className="block mb-4">
        Host:
        <input
          type="text"
          value={host}
          onChange={(e) => setHost(e.target.value)}
          className="w-full border p-2 rounded mt-1"
        />
      </label>

      <button
        onClick={handleSubmit}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Senden
      </button>

      {status && <p className="mt-4 text-sm">{status}</p>}
    </div>
  )
}

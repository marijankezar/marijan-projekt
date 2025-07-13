// src/lib/useUser.ts
'use client';
import { useEffect, useState } from 'react';

export function useUser() {
  const [user, setUser] = useState<{ id: number; username: string; admin: boolean } | null>(null);

  useEffect(() => {
    async function fetchUser() {
      const res = await fetch("/api/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    }
    fetchUser();
  }, []);

  return user;
}

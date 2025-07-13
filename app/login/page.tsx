'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [passwort, setPasswort] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
  
    const res = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json", // ← notwendig für JSON!
      },
      body: JSON.stringify({ username, passwort }),
    });
  
    if (res.ok) {
      router.push("/dashboard"); // ✅ Weiterleitung bei Erfolg
    } else {
      setError("Login fehlgeschlagen");
    }
  };
  

  // return (
  //   <div className="max-w-md mx-auto mt-10 p-4 border rounded shadow">
  //     <h1 className="text-2xl font-bold mb-4">Login</h1>
  //     {error && <p className="text-red-500 mb-2">{error}</p>}
  //     <form onSubmit={handleLogin} className="space-y-4">
  //       <input
  //         type="text"
  //         placeholder="Benutzername"
  //         value={username}
  //         onChange={(e) => setUsername(e.target.value)}
  //         className="w-full p-2 border rounded"
  //       />
  //       <input
  //         type="password"
  //         placeholder="Passwort"
  //         value={passwort}
  //         onChange={(e) => setPasswort(e.target.value)}
  //         className="w-full p-2 border rounded"
  //       />
  //       ben.mueller   geheim987
  //       <button className="bg-blue-600 text-white px-4 py-2 rounded w-full" type="submit">
  //         Einloggen
  //       </button>
  //     </form>
  //   </div>
  // );


  return (
    <div className="flex w-[30rem] flex-col space-y-10 mx-auto mt-10">
    <div className="text-center text-4xl font-medium">Login</div>
  
    {error && <p className="text-red-500 text-center text-lg">{error}</p>}
  
    <form onSubmit={handleLogin} className="space-y-10">
      <div className="w-full transform border-b-2 bg-transparent text-lg duration-300 focus-within:border-indigo-500">
        <input
          type="text"
          placeholder="Benutzername"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full border-none bg-transparent outline-none placeholder:italic focus:outline-none"
        />
      </div>
  
      <div className="w-full transform border-b-2 bg-transparent text-lg duration-300 focus-within:border-indigo-500">
        <input
          type="password"
          placeholder="Passwort"
          value={passwort}
          onChange={(e) => setPasswort(e.target.value)}
          className="w-full border-none bg-transparent outline-none placeholder:italic focus:outline-none"
        />
      </div>
  
      <button
        type="submit"
        className="transform rounded-sm bg-indigo-600 py-2 font-bold text-white duration-300 hover:bg-indigo-400 w-full"
      >
        EINLOGGEN
      </button>
    </form>
  
    <a
      href="#"
      className="transform text-center font-semibold text-gray-500 duration-300 hover:text-gray-300"
    >
      PASSWORT VERGESSEN?
    </a>
  
    <p className="text-center text-lg">
      Kein Konto?
  
      <a
        href="/register"
  
        className="font-medium text-indigo-500 underline-offset-4 hover:underline"
      >
        Konto erstellen
      </a>
    </p>
  </div>
  );
}

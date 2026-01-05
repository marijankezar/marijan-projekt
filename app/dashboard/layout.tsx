import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import React from "react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  // ⛔ Weiterleitung wenn nicht eingeloggt
  if (!session.user) {
    redirect("/login");
  }

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white dark:bg-gray-900 min-h-screen">
      <header className="flex justify-between items-center mb-6">
        <div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Eingeloggt als: <strong className="text-gray-900 dark:text-white">{session.user.username}</strong>{" "}
            {session.user.admin && (
              <span className="text-blue-600 dark:text-blue-400 text-xs ml-2">(Admin)</span>
            )}
          </p>
        </div>
        <form action="/api/logout" method="post">
          <button
            type="submit"
            className="w-40 rounded-md bg-indigo-600 px-4 py-4 text-base font-bold text-white transition-all duration-300 hover:bg-indigo-500 hover:scale-105 active:scale-95 sm:px-6 sm:py-5 sm:text-lg"
          >
            Logout
          </button>
        </form>
      </header>

      <main>{children}</main>
    </div>
  );
}



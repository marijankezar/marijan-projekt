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
    <div className="p-6 max-w-4xl mx-auto">
      <header className="flex justify-between items-center mb-6">
        <div>
          <p className="text-gray-600 text-sm">
            👤 Eingeloggt als: <strong>{session.user.username}</strong>{" "}
            {session.user.admin && (
              <span className="text-blue-600 text-xs ml-2">(Admin)</span>
            )}
          </p>
        </div>
        <form action="/api/logout" method="post">
          <button
            type="submit"
            className="text-red-500 text-sm hover:underline"
          >
            Logout
          </button>
        </form>
      </header>

      <main>{children}</main>
    </div>
  );
}

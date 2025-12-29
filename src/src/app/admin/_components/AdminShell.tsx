import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";

function AdminGateBlocked() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-xl w-full rounded-lg border p-6">
        <h1 className="text-xl font-semibold">Admin is disabled</h1>
        <p className="mt-2 text-sm text-gray-600">
          Set <code>ADMIN_GATE=open</code> in <code>.env.local</code> and restart the dev server.
        </p>
      </div>
    </div>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const isOpen = process.env.ADMIN_GATE === "open";

  if (!isOpen) return <AdminGateBlocked />;

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}


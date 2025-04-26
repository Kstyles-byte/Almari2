import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "../../auth";

export default async function AgentLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/auth/signin");
  }

  if (session.user.role !== "AGENT") {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="w-64 bg-white border-r">
        {/* Sidebar content will be implemented next */}
        <div className="p-4">
          <h2 className="text-xl font-semibold">Agent Dashboard</h2>
          <nav className="mt-6 space-y-1">
            <a href="/agent/dashboard" className="block p-2 rounded hover:bg-gray-100">Dashboard</a>
            <a href="/agent/orders" className="block p-2 rounded hover:bg-gray-100">Order Management</a>
            <a href="/agent/returns" className="block p-2 rounded hover:bg-gray-100">Return Processing</a>
            <a href="/agent/profile" className="block p-2 rounded hover:bg-gray-100">Profile</a>
          </nav>
        </div>
      </aside>
      <div className="flex-1 p-4 sm:p-6 lg:p-8">{children}</div>
    </div>
  );
} 
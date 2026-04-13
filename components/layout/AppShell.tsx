// components/layout/AppShell.tsx
import Link from "next/link";
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-950">
      <nav className="border-b border-gray-800 bg-gray-900 px-6 py-3 flex items-center justify-between">
        <Link href="/" className="text-sm font-semibold tracking-wide text-indigo-400 hover:text-indigo-300">
          ☀ Solar Tax Engine
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-xs text-gray-500 hover:text-gray-300">Dashboard</Link>
          <span className="text-xs text-gray-700">Project 43 · MVP</span>
        </div>
      </nav>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}

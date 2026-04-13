// lib/db/init.ts
// Simple connectivity check. Schema is managed by prisma db push locally.
// On Vercel: tables must exist (created via turso-init.sql or local push).

let initialized = false;

export async function ensureDb() {
  if (initialized) return;
  initialized = true;
  // No-op — Prisma handles connection lazily
}

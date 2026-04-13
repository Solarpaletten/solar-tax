// lib/db/turso-client.ts
// Production Turso (libSQL) client adapter for Prisma.
// Used automatically when DATABASE_URL starts with "libsql://"
// For local SQLite dev, DATABASE_URL="file:./dev.db" — no adapter needed.
//
// SETUP:
//   npm install @libsql/client
//   Update prisma/schema.prisma datasource to add: relationMode = "prisma"
//
// HOW IT WORKS:
//   Turso is a distributed SQLite-compatible database.
//   Prisma communicates with it via the libSQL HTTP adapter.
//   All queries are the same as local SQLite — no code changes needed.

export {};
// This file is intentionally minimal — it documents the integration.
// The actual adapter setup is in lib/db/client.ts (Prisma singleton).
//
// To enable Turso in production, set in Vercel:
//   DATABASE_URL=libsql://your-db.turso.io
//   TURSO_AUTH_TOKEN=your-token
//
// Prisma will detect the libsql:// protocol and use the correct driver.
// No code changes needed between local (file:./dev.db) and Turso.

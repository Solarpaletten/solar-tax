import { PrismaClient } from "@prisma/client";

const g = globalThis as unknown as { prisma?: PrismaClient };

function createClient(): PrismaClient {
  try {
    return new PrismaClient({ log: ["error"] });
  } catch {
    // During build time without DB — return proxy that throws on use
    return new PrismaClient({ log: ["error"] });
  }
}

export const prisma = g.prisma ?? createClient();
if (process.env.NODE_ENV !== "production") g.prisma = prisma;

export async function ensureSchema() {
  // No-op for PostgreSQL — schema managed by prisma db push
}

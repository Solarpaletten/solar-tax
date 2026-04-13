import { NextResponse } from "next/server";
import fs from "fs";

export async function GET() {
  let tmpExists = false;
  try { tmpExists = fs.existsSync("/tmp/prod.db"); } catch {}

  return NextResponse.json({
    DATABASE_URL: process.env.DATABASE_URL,
    VERCEL: process.env.VERCEL,
    resolved:
      (process.env.DATABASE_URL ?? "").startsWith("file:") && process.env.VERCEL === "1"
        ? "file:/tmp/prod.db"
        : process.env.DATABASE_URL,
    tmpDbExists: tmpExists,
  });
}

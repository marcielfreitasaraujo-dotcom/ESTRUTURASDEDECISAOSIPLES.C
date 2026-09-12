import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getEnv } from "@/lib/env";

export async function GET() {
  const env = getEnv();
  let database: "up" | "down" = "down";
  try {
    await prisma.$queryRaw`SELECT 1`;
    database = "up";
  } catch {
    database = "down";
  }

  const status = database === "up" ? "ok" : "degraded";
  return NextResponse.json(
    {
      status,
      database,
      version: env.APP_VERSION,
      timestamp: new Date().toISOString(),
    },
    { status: database === "up" ? 200 : 503 },
  );
}

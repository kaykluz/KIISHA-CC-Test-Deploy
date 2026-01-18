import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getDb } from "../server/db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const startTime = Date.now();
  let dbStatus = "unknown";
  let dbLatency = 0;

  try {
    const dbStart = Date.now();
    const db = await getDb();
    if (db) {
      // Simple query to check database connectivity
      await db.execute("SELECT 1");
      dbStatus = "healthy";
    } else {
      dbStatus = "unavailable";
    }
    dbLatency = Date.now() - dbStart;
  } catch (error) {
    dbStatus = "error";
    console.error("Health check database error:", error);
  }

  const responseTime = Date.now() - startTime;

  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatus,
      latency: `${dbLatency}ms`,
    },
    service: {
      name: "kiisha-api",
      version: "1.0.0",
      environment: process.env.NODE_ENV || "production",
    },
    responseTime: `${responseTime}ms`,
  });
}
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * GET /api/health
 * 健康检查端点，同时返回爬虫数据状态
 */
export async function GET() {
  try {
    // 检查数据库连接
    const playerCount = await prisma.playerCache.count();
    const lastUpdate = await prisma.playerCache.findFirst({
      orderBy: { lastUpdated: "desc" },
      select: { lastUpdated: true },
    });

    // 计算数据新鲜度
    const now = new Date();
    const lastUpdateTime = lastUpdate?.lastUpdated || new Date(0);
    const diffMinutes = Math.floor(
      (now.getTime() - lastUpdateTime.getTime()) / 1000 / 60
    );

    const status = {
      healthy: true,
      timestamp: now.toISOString(),
      database: {
        connected: true,
        playerCount,
        lastUpdate: lastUpdateTime.toISOString(),
        dataAgeMinutes: diffMinutes,
        isStale: diffMinutes > 120, // 超过2小时认为数据过期
      },
    };

    return NextResponse.json(status, {
      status: status.database.isStale ? 503 : 200,
    });
  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json(
      {
        healthy: false,
        error: "Database connection failed",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}

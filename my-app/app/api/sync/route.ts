import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 简单的 API key 验证（生产环境应该使用更安全的方案）
const API_KEY = process.env.CRAWL_API_KEY || "dev-key";

/**
 * POST /api/sync
 * 接收 GitHub Actions 爬虫推送的数据
 */
export async function POST(request: Request) {
  try {
    // 验证 API Key
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || authHeader !== `Bearer ${API_KEY}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { players } = body;

    if (!Array.isArray(players)) {
      return NextResponse.json(
        { error: "Invalid data format" },
        { status: 400 }
      );
    }

    let updated = 0;
    let created = 0;

    for (const player of players) {
      const result = await prisma.playerCache.upsert({
        where: { accountId: player.accountId },
        update: {
          name: player.name,
          personaname: player.personaname,
          avatar: player.avatar,
          rankTier: player.rankTier,
          competitiveRank: player.competitiveRank,
          win: player.win,
          lose: player.lose,
          winRate: player.winRate,
          totalGames: player.totalGames,
          recentMatches: player.recentMatches,
          lastUpdated: new Date(),
        },
        create: {
          steamId: player.steamId,
          accountId: player.accountId,
          name: player.name,
          personaname: player.personaname,
          avatar: player.avatar,
          rankTier: player.rankTier,
          competitiveRank: player.competitiveRank,
          win: player.win,
          lose: player.lose,
          winRate: player.winRate,
          totalGames: player.totalGames,
          recentMatches: player.recentMatches,
        },
      });

      if (result) {
        // 简单判断是创建还是更新
        const existing = await prisma.playerCache.findUnique({
          where: { accountId: player.accountId },
          select: { lastUpdated: true },
        });
        if (existing && existing.lastUpdated.getTime() > Date.now() - 60000) {
          created++;
        } else {
          updated++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${players.length} players`,
      created,
      updated,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Sync error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sync
 * 检查同步状态
 */
export async function GET() {
  const count = await prisma.playerCache.count();
  return NextResponse.json({
    message: "Use POST to sync player data",
    currentPlayerCount: count,
    endpoint: "/api/sync",
    method: "POST",
    headers: {
      Authorization: "Bearer <API_KEY>",
      "Content-Type": "application/json",
    },
  });
}

import { NextResponse } from "next/server";

// 动态导入 PrismaClient，避免构建时连接数据库
let prisma: any;
async function getPrisma() {
  if (!prisma) {
    const { PrismaClient } = await import("@prisma/client");
    prisma = new PrismaClient();
  }
  return prisma;
}

/**
 * GET /api/players/cached
 * 获取所有36名玩家的缓存数据
 * 用于替代实时爬取，提高页面加载速度
 */
export async function GET() {
  try {
    const db = await getPrisma();
    const players = await db.playerCache.findMany({
      orderBy: [
        { rankTier: "desc" }, // 按段位排序
        { winRate: "desc" },  // 同段位按胜率排序
      ],
    });

    // 格式化响应数据，保持与原有API兼容
    const formattedPlayers = players.map((p: any) => ({
      steamId: p.steamId,
      name: p.name,
      profile: {
        personaname: p.personaname || p.name,
        avatarfull: p.avatar,
      },
      rank_tier: p.rankTier,
      competitive_rank: p.competitiveRank,
      win: p.win,
      lose: p.lose,
      win_rate: p.winRate,
      total_games: p.totalGames,
      mmr_estimate: {
        estimate: p.estimatedMmr || 0,
      },
      recent_matches: p.recentMatches ? JSON.parse(p.recentMatches) : [],
      last_updated: p.lastUpdated,
    }));

    return NextResponse.json({
      players: formattedPlayers,
      total: players.length,
      last_updated: players[0]?.lastUpdated || new Date(),
    });
  } catch (error) {
    console.error("Error fetching cached players:", error);
    return NextResponse.json(
      { error: "Failed to fetch cached player data" },
      { status: 500 }
    );
  }
}

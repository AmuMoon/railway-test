import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ steamId: string }> }
) {
  const { steamId } = await params;
  
  try {
    // 从缓存数据库查找玩家
    const player = await prisma.playerCache.findFirst({
      where: {
        OR: [
          { steamId: steamId },
          { accountId: steamId },
        ],
      },
    });

    if (!player) {
      return NextResponse.json(
        { error: "Player not found in cache" },
        { status: 404 }
      );
    }

    // 解析最近比赛
    let recentMatches = [];
    try {
      if (player.recentMatches) {
        recentMatches = JSON.parse(player.recentMatches);
      }
    } catch (e) {
      console.error("Failed to parse recentMatches:", e);
    }

    // 返回格式化的数据
    return NextResponse.json({
      profile: {
        personaname: player.personaname || player.name,
        avatarfull: player.avatar,
        steamid: player.steamId,
        account_id: player.accountId,
      },
      rank_tier: player.rankTier,
      competitive_rank: player.competitiveRank,
      win: player.win,
      lose: player.lose,
      win_rate: player.winRate,
      total_games: player.totalGames,
      recent_matches: recentMatches,
      last_updated: player.lastUpdated,
    });
  } catch (error) {
    console.error("Error fetching cached player:", error);
    return NextResponse.json(
      { error: "Failed to fetch player data", details: String(error) },
      { status: 500 }
    );
  }
}

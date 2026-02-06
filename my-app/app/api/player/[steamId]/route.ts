import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ steamId: string }> }
) {
  const { steamId } = await params;
  
  try {
    // 首先尝试从缓存数据库获取
    const cachedPlayer = await prisma.playerCache.findFirst({
      where: {
        OR: [
          { steamId: steamId },
          { accountId: steamId },
        ],
      },
    });

    if (cachedPlayer) {
      // 解析最近比赛
      let recentMatches = [];
      try {
        if (cachedPlayer.recentMatches) {
          recentMatches = JSON.parse(cachedPlayer.recentMatches);
        }
      } catch (e) {
        console.error("Failed to parse recentMatches:", e);
      }

      return NextResponse.json({
        profile: {
          personaname: cachedPlayer.personaname || cachedPlayer.name,
          avatarfull: cachedPlayer.avatar,
          steamid: cachedPlayer.steamId,
        },
        rank_tier: cachedPlayer.rankTier,
        competitive_rank: cachedPlayer.competitiveRank,
        win: cachedPlayer.win,
        lose: cachedPlayer.lose,
        win_rate: cachedPlayer.winRate,
        total_games: cachedPlayer.totalGames,
        mmr_estimate: {
          estimate: 0,
        },
        recent_matches: recentMatches,
        last_updated: cachedPlayer.lastUpdated,
        source: "cache",
      });
    }

    // 缓存未命中，从 OpenDota API 获取
    const idNum = Number(steamId);
    const steamId64Threshold = 76561197960265728;
    
    let accountId: number;
    
    if (steamId.length < 17 || idNum < steamId64Threshold) {
      accountId = idNum;
    } else {
      const steamId64 = BigInt(steamId);
      accountId = Number(steamId64 - BigInt("76561197960265728"));
    }
    
    console.log(`Fetching player data for accountId: ${accountId}`);
    
    const playerRes = await fetch(
      `https://api.opendota.com/api/players/${accountId}`,
      { cache: 'no-store' }
    );

    console.log(`Player API status: ${playerRes.status}`);

    if (!playerRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch player data" },
        { status: 500 }
      );
    }

    const data = await playerRes.json();
    
    // Fetch win/lose data
    let wlData = { win: 0, lose: 0 };
    try {
      const wlRes = await fetch(
        `https://api.opendota.com/api/players/${accountId}/wl`,
        { cache: 'no-store' }
      );
      if (wlRes.ok) {
        wlData = await wlRes.json();
      }
    } catch (e) {
      console.error("WL fetch error:", e);
    }
    
    const win = wlData.win || 0;
    const lose = wlData.lose || 0;
    const totalGames = win + lose;
    const winRate = totalGames > 0 ? Math.round((win / totalGames) * 100) : 0;
    
    return NextResponse.json({
      ...data,
      win,
      lose,
      win_rate: winRate,
      total_games: totalGames,
      source: "api",
    });
  } catch (error) {
    console.error("Error fetching player:", error);
    return NextResponse.json(
      { error: "Failed to fetch player data", details: String(error) },
      { status: 500 }
    );
  }
}

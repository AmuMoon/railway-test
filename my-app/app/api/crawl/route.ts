import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 36位选手配置 (OpenDota account ID)
const PLAYERS = [
  { accountId: "141869520", name: "百京泰迪熊" },
  { accountId: "174245541", name: "选手2" },
  { accountId: "117116280", name: "选手3" },
  { accountId: "157428753", name: "选手4" },
  { accountId: "146389394", name: "选手5" },
  { accountId: "255710331", name: "选手6" },
  { accountId: "900466924", name: "选手7" },
  { accountId: "183746899", name: "选手8" },
  { accountId: "366757026", name: "选手9" },
  { accountId: "1101454493", name: "选手10" },
  { accountId: "149901486", name: "选手11" },
  { accountId: "364671117", name: "选手12" },
  { accountId: "216565503", name: "选手13" },
  { accountId: "124106189", name: "选手14" },
  { accountId: "215850857", name: "选手15" },
  { accountId: "168908562", name: "选手16" },
  { accountId: "301128180", name: "选手17" },
  { accountId: "136611464", name: "选手18" },
  { accountId: "103091764", name: "选手19" },
  { accountId: "362233986", name: "选手20" },
  { accountId: "294993528", name: "选手21" },
  { accountId: "137830756", name: "选手22" },
  { accountId: "350929386", name: "选手23" },
  { accountId: "178623013", name: "选手24" },
  { accountId: "311081131", name: "选手25" },
  { accountId: "159284323", name: "选手26" },
  { accountId: "182770713", name: "选手27" },
  { accountId: "245468093", name: "选手28" },
  { accountId: "199204903", name: "选手29" },
  { accountId: "353534498", name: "选手30" },
  { accountId: "209047428", name: "选手31" },
  { accountId: "182463905", name: "选手32" },
  { accountId: "355150943", name: "选手33" },
  { accountId: "350779393", name: "选手34" },
  { accountId: "303216728", name: "选手35" },
  { accountId: "142603252", name: "选手36" },
];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchPlayerData(accountId: string) {
  try {

    // 获取玩家基本信息
    const playerRes = await fetch(`https://api.opendota.com/api/players/${accountId}`, {
      headers: { "User-Agent": "Dota2-Leaderboard/1.0" },
    });

    if (!playerRes.ok) {
      console.log(`Player API status: ${playerRes.status}`);
      return null;
    }

    const playerData = await playerRes.json();

    // 获取最近比赛
    const matchesRes = await fetch(
      `https://api.opendota.com/api/players/${accountId}/matches?limit=5`,
      { headers: { "User-Agent": "Dota2-Leaderboard/1.0" } }
    );

    let recentMatches: any[] = [];
    if (matchesRes.ok) {
      const matches = await matchesRes.json();
      recentMatches = matches.map((m: any) => ({
        matchId: m.match_id,
        heroId: m.hero_id,
        result: m.radiant_win === (m.player_slot < 128) ? "win" : "loss",
        kills: m.kills,
        deaths: m.deaths,
        assists: m.assists,
        startTime: m.start_time,
      }));
    }

    return {
      accountId,
      steamId: playerData.profile?.steamid || null,
      personaname: playerData.profile?.personaname || null,
      avatar: playerData.profile?.avatar || null,
      rankTier: playerData.rank_tier || null,
      competitiveRank: playerData.competitive_rank?.toString() || null,
      win: playerData.win || 0,
      lose: playerData.lose || 0,
      recentMatches,
    };
  } catch (error) {
    console.error(`Failed to fetch player ${accountId}:`, error);
    return null;
  }
}

/**
 * POST /api/crawl
 * 手动触发爬虫
 */
export async function POST() {
  const startTime = Date.now();
  const results = {
    total: PLAYERS.length,
    success: 0,
    failed: 0,
    errors: [] as string[],
  };

  try {
    for (const player of PLAYERS) {
      try {
        const data = await fetchPlayerData(player.accountId);

        if (data) {
          const totalGames = data.win + data.lose;
          const winRate = totalGames > 0 ? Math.round((data.win / totalGames) * 100) : 0;

          await prisma.playerCache.upsert({
            where: { accountId: player.accountId },
            update: {
              name: player.name,
              personaname: data.personaname,
              avatar: data.avatar,
              rankTier: data.rankTier,
              competitiveRank: data.competitiveRank,
              win: data.win,
              lose: data.lose,
              winRate,
              totalGames,
              recentMatches: JSON.stringify(data.recentMatches),
              lastUpdated: new Date(),
            },
            create: {
              steamId: data.steamId || player.accountId,
              accountId: player.accountId,
              name: player.name,
              personaname: data.personaname,
              avatar: data.avatar,
              rankTier: data.rankTier,
              competitiveRank: data.competitiveRank,
              win: data.win,
              lose: data.lose,
              winRate,
              totalGames,
              recentMatches: JSON.stringify(data.recentMatches),
            },
          });
          results.success++;
        } else {
          results.failed++;
          results.errors.push(`Failed: ${player.name} (${player.accountId})`);
        }

        // 500ms 延迟避免 rate limit
        await delay(500);
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Error: ${player.name} - ${error.message}`);
      }
    }

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      message: "Crawl completed",
      duration: `${duration}ms`,
      results,
    });
  } catch (error: any) {
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
 * GET /api/crawl
 * 检查爬虫状态
 */
export async function GET() {
  const count = await prisma.playerCache.count();
  return NextResponse.json({
    message: "Use POST to trigger crawl",
    currentPlayerCount: count,
    totalExpected: PLAYERS.length,
  });
}

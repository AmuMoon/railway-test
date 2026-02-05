import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 预定义的选手数据
const DEFAULT_PLAYERS = [
  {"accountId":"141869520","name":"百京泰迪熊","personaname":"百京泰迪熊","rankTier":80,"win":2848,"lose":2695,"winRate":51,"totalGames":5543},
  {"accountId":"174245541","name":"选手2","personaname":"豊川祥子","rankTier":80,"win":554,"lose":541,"winRate":50,"totalGames":1095},
  {"accountId":"117116280","name":"选手3","personaname":"慎独","rankTier":80,"win":5429,"lose":4973,"winRate":52,"totalGames":10402},
  {"accountId":"157428753","name":"选手4","personaname":"CatU","rankTier":80,"win":1447,"lose":1409,"winRate":50,"totalGames":2856},
  {"accountId":"146389394","name":"选手5","personaname":"漆黑之牙","rankTier":80,"win":1059,"lose":1101,"winRate":49,"totalGames":2160},
  {"accountId":"255710331","name":"选手6","personaname":"HF","rankTier":80,"win":1750,"lose":1630,"winRate":51,"totalGames":3380},
  {"accountId":"900466924","name":"选手7","personaname":"水豚噜噜","rankTier":80,"win":1436,"lose":1358,"winRate":51,"totalGames":2794},
  {"accountId":"183746899","name":"选手8","personaname":"小熊宇航员","rankTier":80,"win":1439,"lose":1395,"winRate":50,"totalGames":2834},
  {"accountId":"366757026","name":"选手9","personaname":"A","rankTier":80,"win":2716,"lose":2602,"winRate":51,"totalGames":5318},
  {"accountId":"1101454493","name":"选手10","personaname":"awe","rankTier":80,"win":572,"lose":573,"winRate":49,"totalGames":1145},
  {"accountId":"149901486","name":"选手11","personaname":"Kirara","rankTier":80,"win":1598,"lose":1557,"winRate":50,"totalGames":3155},
  {"accountId":"364671117","name":"选手12","personaname":"ELO Victim","rankTier":80,"win":2185,"lose":2058,"winRate":51,"totalGames":4243},
  {"accountId":"216565503","name":"选手13","personaname":"七玄门厉飞宇","rankTier":80,"win":1984,"lose":1919,"winRate":50,"totalGames":3903},
  {"accountId":"124106189","name":"选手14","personaname":"卡卡羅特","rankTier":80,"win":2386,"lose":2219,"winRate":51,"totalGames":4605},
  {"accountId":"215850857","name":"选手15","personaname":"Elrithrarion","rankTier":80,"win":978,"lose":956,"winRate":50,"totalGames":1934},
  {"accountId":"168908562","name":"选手16","personaname":"大懒觉","rankTier":80,"win":1696,"lose":1617,"winRate":51,"totalGames":3313},
  {"accountId":"301128180","name":"选手17","personaname":"LiffyIsland","rankTier":80,"win":2842,"lose":2653,"winRate":51,"totalGames":5495},
  {"accountId":"136611464","name":"选手18","personaname":"Samble Lio","rankTier":80,"win":1882,"lose":1794,"winRate":51,"totalGames":3676},
  {"accountId":"103091764","name":"选手19","personaname":"Bian","rankTier":80,"win":1073,"lose":1071,"winRate":50,"totalGames":2144},
  {"accountId":"362233986","name":"选手20","personaname":"Dom","rankTier":80,"win":775,"lose":765,"winRate":50,"totalGames":1540},
  {"accountId":"294993528","name":"选手21","personaname":"Hola tres tacos de tripa gracias","rankTier":80,"win":1019,"lose":983,"winRate":50,"totalGames":2002},
  {"accountId":"137830756","name":"选手22","personaname":"少年阿崩","rankTier":80,"win":4095,"lose":3872,"winRate":51,"totalGames":7967}
];

/**
 * POST /api/init-data
 * 初始化选手数据
 */
export async function POST() {
  try {
    let inserted = 0;
    let updated = 0;

    for (const player of DEFAULT_PLAYERS) {
      const result = await prisma.playerCache.upsert({
        where: { accountId: player.accountId },
        update: {
          name: player.name,
          personaname: player.personaname,
          rankTier: player.rankTier,
          win: player.win,
          lose: player.lose,
          winRate: player.winRate,
          totalGames: player.totalGames,
          lastUpdated: new Date(),
        },
        create: {
          steamId: player.accountId,
          accountId: player.accountId,
          name: player.name,
          personaname: player.personaname,
          avatar: null,
          rankTier: player.rankTier,
          competitiveRank: player.rankTier?.toString() || null,
          win: player.win,
          lose: player.lose,
          winRate: player.winRate,
          totalGames: player.totalGames,
          recentMatches: [],
        },
      });

      if (result) {
        inserted++;
      }
    }

    const count = await prisma.playerCache.count();

    return NextResponse.json({
      success: true,
      message: `Initialized ${DEFAULT_PLAYERS.length} players`,
      inserted,
      updated,
      totalInDatabase: count,
    });
  } catch (error: any) {
    console.error("Init data failed:", error);
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
 * GET /api/init-data
 * 检查数据状态
 */
export async function GET() {
  const count = await prisma.playerCache.count();
  return NextResponse.json({
    message: "Use POST to initialize player data",
    currentPlayerCount: count,
    expectedPlayers: DEFAULT_PLAYERS.length,
    endpoint: "/api/init-data",
    method: "POST",
  });
}

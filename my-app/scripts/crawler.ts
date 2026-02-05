/**
 * Dota2 玩家数据爬虫脚本
 * 每小时爬取36名玩家的数据并存储到数据库
 * 
 * 使用方法:
 * - 开发环境: npx tsx scripts/crawler.ts
 * - 生产环境: node scripts/crawler.js (需先编译)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 36名玩家清单
const TEAM_PLAYERS = [
  { steamId: "149901486", name: "思Kirara" },
  { steamId: "216565503", name: "德德" },
  { steamId: "1101454493", name: "awe" },
  { steamId: "364671117", name: "JY.LIU" },
  { steamId: "124106189", name: "卡卡罗特" },
  { steamId: "168908562", name: "ahji" },
  { steamId: "215850857", name: "Sam QL" },
  { steamId: "146510503", name: "清寒" },
  { steamId: "103091764", name: "阿边边边边边" },
  { steamId: "117116280", name: "VK" },
  { steamId: "160800934", name: "海柱哥" },
  { steamId: "301128180", name: "LiffyIsland" },
  { steamId: "138637714", name: "Ym" },
  { steamId: "174245541", name: "walker" },
  { steamId: "225835718", name: "黄神AME" },
  { steamId: "354739911", name: "邮寄时光" },
  { steamId: "136320131", name: "看我干嘛" },
  { steamId: "365587496", name: "yuan." },
  { steamId: "362233986", name: "Dom" },
  { steamId: "294993528", name: "老板" },
  { steamId: "157552982", name: "拉罗" },
  { steamId: "136611464", name: "EK" },
  { steamId: "402598895", name: "韭韭（时浅）" },
  { steamId: "146348911", name: "彭律" },
  { steamId: "140976240", name: "世涛" },
  { steamId: "86788193", name: "Destiny" },
  { steamId: "420946695", name: "刘能" },
  { steamId: "900466924", name: "水豚噜噜" },
  { steamId: "387262791", name: "含章可贞" },
  { steamId: "157428753", name: "CatU" },
  { steamId: "255710331", name: "河粉" },
  { steamId: "117116280", name: "老刘" },
  { steamId: "141869520", name: "百京泰迪熊" },
  { steamId: "146389394", name: "漆黑之牙-卓" },
  { steamId: "183746899", name: "WWW" },
  { steamId: "366757026", name: "A" },
];

// SteamID64 转 Account ID
function steamIdToAccountId(steamId: string): string {
  const steamId64Threshold = 76561197960265728;
  const idNum = Number(steamId);
  
  if (steamId.length < 17 || idNum < steamId64Threshold) {
    return steamId; // 已经是 account_id
  }
  
  const steamId64 = BigInt(steamId);
  return String(Number(steamId64 - BigInt("76561197960265728")));
}

// 获取玩家数据
async function fetchPlayerData(accountId: string) {
  try {
    const res = await fetch(`https://api.opendota.com/api/players/${accountId}`, {
      headers: { 'User-Agent': 'Dota2Leaderboard/1.0' }
    });
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    
    return await res.json();
  } catch (error) {
    console.error(`Error fetching player ${accountId}:`, error);
    return null;
  }
}

// 获取胜负数据
async function fetchWinLose(accountId: string) {
  try {
    const res = await fetch(`https://api.opendota.com/api/players/${accountId}/wl`, {
      headers: { 'User-Agent': 'Dota2Leaderboard/1.0' }
    });
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    
    return await res.json();
  } catch (error) {
    console.error(`Error fetching win/lose for ${accountId}:`, error);
    return { win: 0, lose: 0 };
  }
}

// 获取最近比赛
async function fetchRecentMatches(accountId: string, limit: number = 5) {
  try {
    const res = await fetch(`https://api.opendota.com/api/players/${accountId}/matches?limit=${limit}`, {
      headers: { 'User-Agent': 'Dota2Leaderboard/1.0' }
    });
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    
    return await res.json();
  } catch (error) {
    console.error(`Error fetching matches for ${accountId}:`, error);
    return [];
  }
}

// 获取英雄数据（用于映射hero_id到名称）
let heroMap: Map<number, string> | null = null;
async function getHeroMap(): Promise<Map<number, string>> {
  if (heroMap) return heroMap;
  
  try {
    const res = await fetch('https://api.opendota.com/api/heroes');
    const heroes = await res.json();
    heroMap = new Map(heroes.map((h: { id: number; localized_name: string }) => [h.id, h.localized_name]));
    return heroMap;
  } catch (error) {
    console.error('Error fetching heroes:', error);
    return new Map();
  }
}

// 爬取单个玩家数据
async function crawlPlayer(player: { steamId: string; name: string }) {
  const accountId = steamIdToAccountId(player.steamId);
  console.log(`[${new Date().toISOString()}] Crawling ${player.name} (${accountId})...`);
  
  try {
    // 并行获取玩家数据、胜负和最近比赛
    const [playerData, wlData, matchesData] = await Promise.all([
      fetchPlayerData(accountId),
      fetchWinLose(accountId),
      fetchRecentMatches(accountId, 5)
    ]);
    
    if (!playerData) {
      console.error(`  ✗ Failed to fetch data for ${player.name}`);
      return null;
    }
    
    const heroMap = await getHeroMap();
    
    // 处理最近比赛数据
    const recentMatches = matchesData.map((match: {
      match_id: number;
      hero_id: number;
      kills: number;
      deaths: number;
      assists: number;
      radiant_win: boolean;
      player_slot: number;
      start_time: number;
    }) => ({
      matchId: String(match.match_id),
      heroId: match.hero_id,
      heroName: heroMap.get(match.hero_id) || `Hero ${match.hero_id}`,
      result: ((match.radiant_win && match.player_slot < 128) || (!match.radiant_win && match.player_slot >= 128)) ? 'win' : 'loss',
      kills: match.kills,
      deaths: match.deaths,
      assists: match.assists,
      startTime: new Date(match.start_time * 1000).toISOString(),
    }));
    
    const win = wlData.win || 0;
    const lose = wlData.lose || 0;
    const totalGames = win + lose;
    const winRate = totalGames > 0 ? Math.round((win / totalGames) * 100) : 0;
    
    // 准备数据
    const cacheData = {
      steamId: player.steamId,
      accountId: accountId,
      name: player.name,
      personaname: playerData.profile?.personaname || null,
      avatar: playerData.profile?.avatarfull || null,
      rankTier: playerData.rank_tier || null,
      competitiveRank: playerData.competitive_rank || null,
      win: win,
      lose: lose,
      winRate: winRate,
      totalGames: totalGames,
      estimatedMmr: playerData.mmr_estimate?.estimate || null,
      recentMatches: recentMatches,
      lastUpdated: new Date(),
    };
    
    // 保存到数据库
    await prisma.playerCache.upsert({
      where: { steamId: player.steamId },
      update: cacheData,
      create: cacheData,
    });
    
    console.log(`  ✓ ${player.name}: rank_tier=${cacheData.rankTier || 'N/A'}, win_rate=${winRate}%`);
    return cacheData;
    
  } catch (error) {
    console.error(`  ✗ Error processing ${player.name}:`, error);
    return null;
  }
}

// 主爬虫函数
async function crawlAllPlayers() {
  const startTime = Date.now();
  console.log(`\n[${new Date().toISOString()}] Starting crawler...`);
  console.log(`Target: ${TEAM_PLAYERS.length} players\n`);
  
  // 预加载英雄数据
  await getHeroMap();
  
  let successCount = 0;
  let failCount = 0;
  
  // 顺序爬取，避免API限流
  for (const player of TEAM_PLAYERS) {
    const result = await crawlPlayer(player);
    if (result) {
      successCount++;
    } else {
      failCount++;
    }
    
    // 每个请求间隔500ms，避免限流
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n[${new Date().toISOString()}] Crawler finished!`);
  console.log(`  Success: ${successCount}, Failed: ${failCount}, Duration: ${duration}s\n`);
  
  return { successCount, failCount };
}

// 执行爬虫
async function main() {
  try {
    const result = await crawlAllPlayers();
    
    // 如果失败太多，返回非零退出码
    if (result.failCount > result.successCount) {
      console.error('Too many failures, exiting with error');
      process.exit(1);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Crawler failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 运行
main();

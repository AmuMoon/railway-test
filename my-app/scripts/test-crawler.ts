/**
 * 爬虫测试脚本
 * 用于验证爬虫逻辑，无需数据库连接
 * 
 * 运行: npx tsx scripts/test-crawler.ts
 */

// 36名玩家清单
const TEAM_PLAYERS = [
  { steamId: "149901486", name: "思Kirara" },
  { steamId: "216565503", name: "德德" },
  { steamId: "1101454493", name: "awe" },
];

// SteamID64 转 Account ID
function steamIdToAccountId(steamId: string): string {
  const steamId64Threshold = 76561197960265728;
  const idNum = Number(steamId);
  
  if (steamId.length < 17 || idNum < steamId64Threshold) {
    return steamId;
  }
  
  const steamId64 = BigInt(steamId);
  return String(Number(steamId64 - BigInt("76561197960265728")));
}

async function fetchPlayerData(accountId: string) {
  try {
    const res = await fetch(`https://api.opendota.com/api/players/${accountId}`, {
      headers: { 'User-Agent': 'Dota2Leaderboard/1.0' }
    });
    
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error(`  ✗ Error: ${error}`);
    return null;
  }
}

async function testCrawler() {
  console.log("🧪 Testing crawler logic...\n");
  
  for (const player of TEAM_PLAYERS) {
    const accountId = steamIdToAccountId(player.steamId);
    console.log(`Testing ${player.name} (${accountId})...`);
    
    const data = await fetchPlayerData(accountId);
    
    if (data) {
      console.log(`  ✓ Success!`);
      console.log(`    - Steam Name: ${data.profile?.personaname || 'N/A'}`);
      console.log(`    - Rank Tier: ${data.rank_tier || 'N/A'}`);
      console.log(`    - MMR Estimate: ${data.mmr_estimate?.estimate || 'N/A'}`);
    } else {
      console.log(`  ✗ Failed to fetch data`);
    }
    
    // 间隔1秒避免限流
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log("\n✅ Test completed!");
}

testCrawler();

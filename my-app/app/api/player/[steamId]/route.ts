import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ steamId: string }> }
) {
  const { steamId } = await params;
  
  try {
    // 判断 ID 类型
    // 如果长度小于 17 或数值小于 76561197960265728，则已经是 account_id
    const idNum = Number(steamId);
    const steamId64Threshold = 76561197960265728;
    
    let accountId: number;
    
    if (steamId.length < 17 || idNum < steamId64Threshold) {
      // 已经是 account_id，直接使用
      accountId = idNum;
    } else {
      // SteamID64 需要转换
      const steamId64 = BigInt(steamId);
      accountId = Number(steamId64 - BigInt("76561197960265728"));
    }
    
    console.log(`Fetching player data for accountId: ${accountId}`);
    
    // Fetch player data from OpenDota API
    const playerRes = await fetch(
      `https://api.opendota.com/api/players/${accountId}`,
      { cache: 'no-store' }
    );

    console.log(`Player API status: ${playerRes.status}`);

    if (!playerRes.ok) {
      console.error(`OpenDota API failed: ${playerRes.status}`);
      // If OpenDota fails, try Steam Web API
      const steamResponse = await fetch(
        `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${process.env.STEAM_API_KEY}&steamids=${steamId}`,
        { cache: 'no-store' }
      );
      
      if (!steamResponse.ok) {
        return NextResponse.json(
          { error: "Failed to fetch player data" },
          { status: 500 }
        );
      }
      
      const steamData = await steamResponse.json();
      const player = steamData.response.players[0];
      
      return NextResponse.json({
        profile: {
          personaname: player.personaname,
          avatarfull: player.avatarfull,
          steamid: player.steamid,
        },
      });
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
    
    // 计算胜率
    const win = wlData.win || 0;
    const lose = wlData.lose || 0;
    const totalGames = win + lose;
    const winRate = totalGames > 0 ? Math.round((win / totalGames) * 100) : 0;
    
    // 获取数据
    const rankTier = data.rank_tier || 0;
    const estimatedMmr = data.computed_mmr || data.mmr_estimate?.estimate || 0;
    
    // 返回增强的数据
    return NextResponse.json({
      ...data,
      rank_tier: rankTier,
      mmr_estimate: {
        estimate: estimatedMmr,
        rank_tier: rankTier,
      },
      win,
      lose,
      win_rate: winRate,
      total_games: totalGames,
    });
  } catch (error) {
    console.error("Error fetching player:", error);
    return NextResponse.json(
      { error: "Failed to fetch player data", details: String(error) },
      { status: 500 }
    );
  }
}

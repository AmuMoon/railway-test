"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Trophy, Users, Target, History, ChevronRight } from "lucide-react";

interface PlayerData {
  profile?: {
    personaname: string;
    avatarfull: string;
    steamid: string;
  };
  mmr_estimate?: {
    estimate: number;
  };
  win?: number;
  lose?: number;
  win_rate?: number;
  total_games?: number;
  competitive_rank?: number;
  rank_tier?: number;
}

interface MatchStats {
  recent_5?: boolean[];
  streak?: number;
  streak_type?: 'win' | 'loss' | 'none';
}

// 段位判断函数
function getRankTier(mmr: number | null | undefined) {
  if (!mmr || mmr === 0) return { name: "未校准", icon: "❓", color: "text-gray-400" };
  if (mmr >= 6000) return { name: "冠绝一世", icon: "🏆", color: "text-yellow-500" };
  if (mmr >= 5000) return { name: "万古流芳", icon: "💎", color: "text-cyan-400" };
  if (mmr >= 4000) return { name: "超凡入圣", icon: "🥇", color: "text-yellow-400" };
  if (mmr >= 3000) return { name: "传奇", icon: "🥈", color: "text-purple-400" };
  if (mmr >= 2000) return { name: "统帅", icon: "🥉", color: "text-green-400" };
  if (mmr >= 1000) return { name: "卫士", icon: "⭐", color: "text-blue-400" };
  return { name: "先锋", icon: "🔰", color: "text-gray-300" };
}

export default function Home() {
  const [steamId, setSteamId] = useState("");
  const [loading, setLoading] = useState(false);
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);
  const [matchStats, setMatchStats] = useState<MatchStats | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const router = useRouter();

  // 从 localStorage 加载最近的搜索
  useEffect(() => {
    const saved = localStorage.getItem("dota2_recent_searches");
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse recent searches", e);
      }
    }
  }, []);

  // 保存到最近搜索
  const saveToRecentSearches = (id: string) => {
    setRecentSearches(prev => {
      const newSearches = [id, ...prev.filter(s => s !== id)].slice(0, 5);
      localStorage.setItem("dota2_recent_searches", JSON.stringify(newSearches));
      return newSearches;
    });
  };

  // 搜索玩家（不跳转）
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!steamId.trim()) return;
    
    setSearchLoading(true);
    setPlayerData(null);
    setMatchStats(null);
    
    try {
      // 获取玩家数据
      const playerRes = await fetch(`/api/player/${steamId}`);
      if (!playerRes.ok) throw new Error("Failed to fetch player");
      const playerData = await playerRes.json();
      setPlayerData(playerData);
      
      // 获取比赛数据
      const matchesRes = await fetch(`/api/player/${steamId}/matches`);
      if (matchesRes.ok) {
        const matchData = await matchesRes.json();
        setMatchStats({
          recent_5: matchData.recent_5,
          streak: matchData.streak,
          streak_type: matchData.streak_type,
        });
      }
      
      saveToRecentSearches(steamId);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setSearchLoading(false);
    }
  };

  // 查看完整战绩
  const viewFullStats = () => {
    if (steamId) {
      router.push(`/player/${steamId}`);
    }
  };

  // 快速搜索历史记录中的玩家
  const quickSearch = async (id: string) => {
    setSteamId(id);
    setSearchLoading(true);
    setPlayerData(null);
    setMatchStats(null);
    
    try {
      const playerRes = await fetch(`/api/player/${id}`);
      if (!playerRes.ok) throw new Error("Failed to fetch player");
      const playerData = await playerRes.json();
      setPlayerData(playerData);
      
      const matchesRes = await fetch(`/api/player/${id}/matches`);
      if (matchesRes.ok) {
        const matchData = await matchesRes.json();
        setMatchStats({
          recent_5: matchData.recent_5,
          streak: matchData.streak,
          streak_type: matchData.streak_type,
        });
      }
      
      saveToRecentSearches(id);
    } catch (error) {
      console.error("Quick search error:", error);
    } finally {
      setSearchLoading(false);
    }
  };

  const rankInfo = getRankTier(playerData?.mmr_estimate?.estimate);

  return (
    <main className="hero-gradient min-h-screen">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 glow-text">
            <span className="bg-gradient-to-r from-orange-500 via-yellow-500 to-orange-500 bg-clip-text text-transparent">
              Dota 2 Analytics
            </span>
          </h1>
          <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
            Track and analyze player statistics, match history, and performance metrics 
            for professional and casual Dota 2 players.
          </p>

          {/* Search Box */}
          <form onSubmit={handleSearch} className="max-w-xl mx-auto mb-8">
            <div className="relative">
              <input
                type="text"
                value={steamId}
                onChange={(e) => setSteamId(e.target.value)}
                placeholder="Enter Steam ID..."
                className="search-input w-full px-6 py-4 rounded-xl text-lg text-white placeholder-gray-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={searchLoading}
                className="absolute right-2 top-2 bg-gradient-to-r from-orange-500 to-yellow-500 text-black font-semibold px-6 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {searchLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Searching...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Search className="w-5 h-5 mr-2" />
                    Search
                  </span>
                )}
              </button>
            </div>
          </form>

          {/* 快速查询历史 */}
          {recentSearches.length > 0 && (
            <div className="max-w-xl mx-auto mb-8">
              <div className="flex items-center justify-center space-x-2 text-sm">
                <History className="w-4 h-4 text-gray-500" />
                <span className="text-gray-500">最近查询:</span>
                {recentSearches.map((id) => (
                  <button
                    key={id}
                    onClick={() => quickSearch(id)}
                    className="text-orange-500 hover:text-orange-400 underline"
                  >
                    {id}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 玩家卡片 */}
          {playerData && playerData.profile && (
            <div className="max-w-xl mx-auto mb-16">
              <div className="card-gradient rounded-2xl p-6 text-left">
                {/* 头部：头像 + 昵称 + 段位 */}
                <div className="flex items-start space-x-4 mb-6">
                  {playerData.profile.avatarfull ? (
                    <img
                      src={playerData.profile.avatarfull}
                      alt={playerData.profile.personaname}
                      className="w-20 h-20 rounded-xl"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-white/10 flex items-center justify-center">
                      <Users className="w-8 h-8 text-gray-500" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-1">
                      {playerData.profile.personaname}
                    </h2>
                    <div className={`flex items-center space-x-2 ${rankInfo.color}`}>
                      <span className="text-2xl">{rankInfo.icon}</span>
                      <span className="font-semibold">{rankInfo.name}</span>
                    </div>
                  </div>
                </div>

                {/* 统计数据 */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-white/5 rounded-xl p-3 text-center">
                    <p className="text-gray-400 text-sm mb-1">估算 MMR</p>
                    <p className="text-xl font-bold text-orange-500">
                      {playerData.mmr_estimate?.estimate || "?"}
                    </p>
                    <p className="text-xs text-gray-500">估算</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 text-center">
                    <p className="text-gray-400 text-sm mb-1">总场次</p>
                    <p className="text-xl font-bold text-white">
                      {playerData.total_games || 0}
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 text-center">
                    <p className="text-gray-400 text-sm mb-1">胜率</p>
                    <p className={`text-xl font-bold ${
                      (playerData.win_rate || 0) >= 50 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {playerData.win_rate}%
                    </p>
                  </div>
                </div>

                {/* 最近5场 + 连胜/连败 */}
                {matchStats?.recent_5 && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-gray-400 text-sm">最近5场</span>
                      {matchStats.streak && matchStats.streak > 0 && (
                        <span className={`text-sm font-semibold ${
                          matchStats.streak_type === 'win' ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {matchStats.streak_type === 'win' ? '🔥' : '💔'} 
                          {matchStats.streak_type === 'win' ? '连胜' : '连败'} {matchStats.streak} 场
                        </span>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      {matchStats.recent_5.map((won, i) => (
                        <div
                          key={i}
                          className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${
                            won
                              ? 'bg-green-500/20 text-green-500'
                              : 'bg-red-500/20 text-red-500'
                          }`}
                        >
                          {won ? 'W' : 'L'}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 查看完整战绩按钮 */}
                <button
                  onClick={viewFullStats}
                  className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 text-black font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center"
                >
                  查看完整战绩
                  <ChevronRight className="w-5 h-5 ml-1" />
                </button>
              </div>
            </div>
          )}

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Link href="/leaderboard" className="card-gradient p-6 rounded-2xl hover:border-orange-500/50 transition-all">
              <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <Trophy className="w-6 h-6 text-orange-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">排行榜</h3>
              <p className="text-gray-400">查看高分玩家排行榜和段位分布</p>
            </Link>
            <div className="card-gradient p-6 rounded-2xl">
              <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <Target className="w-6 h-6 text-orange-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">比赛分析</h3>
              <p className="text-gray-400">Detailed breakdown of recent matches with KDA and performance metrics</p>
            </div>
            <div className="card-gradient p-6 rounded-2xl">
              <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <Users className="w-6 h-6 text-orange-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Player Stats</h3>
              <p className="text-gray-400">Comprehensive player profiles with match history and win rates</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

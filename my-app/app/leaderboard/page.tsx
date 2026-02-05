"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy, Users, ArrowRight, RefreshCw } from "lucide-react";

interface Player {
  steamId: string;
  name: string;
  openDotaUrl: string;
  profile?: {
    personaname: string;
    avatarfull: string;
  };
  mmr_estimate?: {
    estimate: number;
  };
  win?: number;
  lose?: number;
  win_rate?: number;
  total_games?: number;
  rank_tier?: number;
  competitive_rank?: string;
  recent_matches?: Array<{
    matchId: string;
    heroId: number;
    heroName: string;
    result: string;
    kills: number;
    deaths: number;
    assists: number;
    startTime: string;
  }>;
  last_updated?: string;
}

// 段位定义 (基于 rank_tier)
// rank_tier: 十位数=段位(1-8), 个位数=星级(1-5)
// 10=先锋, 20=卫士, 30=中军, 40=统帅, 50=传奇, 60=万古流芳, 70=超凡入圣, 80=冠绝一世
const RANK_TIERS = [
  { minTier: 80, name: "冠绝一世", icon: "🏆", color: "text-yellow-400", bgColor: "bg-yellow-500/10", borderColor: "border-yellow-500/30" },
  { minTier: 70, name: "超凡入圣", icon: "🥇", color: "text-purple-400", bgColor: "bg-purple-500/10", borderColor: "border-purple-500/30" },
  { minTier: 60, name: "万古流芳", icon: "💎", color: "text-cyan-400", bgColor: "bg-cyan-500/10", borderColor: "border-cyan-500/30" },
  { minTier: 50, name: "传奇", icon: "🥈", color: "text-blue-400", bgColor: "bg-blue-500/10", borderColor: "border-blue-500/30" },
  { minTier: 40, name: "统帅", icon: "🥉", color: "text-green-400", bgColor: "bg-green-500/10", borderColor: "border-green-500/30" },
  { minTier: 30, name: "中军", icon: "⚔️", color: "text-orange-400", bgColor: "bg-orange-500/10", borderColor: "border-orange-500/30" },
  { minTier: 20, name: "卫士", icon: "⭐", color: "text-teal-400", bgColor: "bg-teal-500/10", borderColor: "border-teal-500/30" },
  { minTier: 10, name: "先锋", icon: "🔰", color: "text-red-400", bgColor: "bg-red-500/10", borderColor: "border-red-500/30" },
  { minTier: 0, name: "未校准", icon: "❓", color: "text-gray-400", bgColor: "bg-gray-500/10", borderColor: "border-gray-500/30" },
];

// 获取玩家段位 (基于 rank_tier)
// rank_tier: 十位数=段位, 个位数=星级 (如 35 = 中军5星)
function getPlayerRank(rankTier: number | undefined) {
  if (!rankTier || rankTier === 0) return RANK_TIERS[8]; // 未校准
  const tierBase = Math.floor(rankTier / 10) * 10; // 取十位数
  // 找到匹配的段位 (10=先锋, 20=卫士, 30=中军, 40=统帅, 50=传奇, 60=万古, 70=超凡, 80=冠绝)
  for (const tier of RANK_TIERS) {
    if (tierBase === tier.minTier) return tier;
  }
  // 如果没找到精确匹配，找最接近的
  for (const tier of RANK_TIERS) {
    if (tierBase >= tier.minTier) return tier;
  }
  return RANK_TIERS[8];
}

// 获取段位星级显示
function getRankStars(rankTier: number | undefined): string {
  if (!rankTier || rankTier === 0) return "";
  const stars = rankTier % 10; // 个位数就是星级
  if (stars >= 1 && stars <= 5) {
    return "★".repeat(stars);
  }
  return "";
}

// 36名玩家数据
const TEAM_PLAYERS = [
  { steamId: "149901486", name: "思Kirara", openDotaUrl: "https://www.opendota.com/players/149901486" },
  { steamId: "216565503", name: "德德", openDotaUrl: "https://www.opendota.com/players/216565503" },
  { steamId: "1101454493", name: "awe", openDotaUrl: "https://www.opendota.com/players/1101454493" },
  { steamId: "364671117", name: "JY.LIU", openDotaUrl: "https://www.opendota.com/players/364671117" },
  { steamId: "124106189", name: "卡卡罗特", openDotaUrl: "https://www.opendota.com/players/124106189" },
  { steamId: "168908562", name: "ahji", openDotaUrl: "https://www.opendota.com/players/168908562" },
  { steamId: "215850857", name: "Sam QL", openDotaUrl: "https://www.opendota.com/players/215850857" },
  { steamId: "146510503", name: "清寒", openDotaUrl: "https://www.opendota.com/players/146510503" },
  { steamId: "103091764", name: "阿边边边边边", openDotaUrl: "https://www.opendota.com/players/103091764" },
  { steamId: "117116280", name: "VK", openDotaUrl: "https://www.opendota.com/players/117116280" },
  { steamId: "160800934", name: "海柱哥", openDotaUrl: "https://www.opendota.com/players/160800934" },
  { steamId: "301128180", name: "LiffyIsland", openDotaUrl: "https://www.opendota.com/players/301128180" },
  { steamId: "138637714", name: "Ym", openDotaUrl: "https://www.opendota.com/players/138637714" },
  { steamId: "174245541", name: "walker", openDotaUrl: "https://www.opendota.com/players/174245541" },
  { steamId: "225835718", name: "黄神AME", openDotaUrl: "https://www.opendota.com/players/225835718" },
  { steamId: "354739911", name: "邮寄时光", openDotaUrl: "https://www.opendota.com/players/354739911" },
  { steamId: "136320131", name: "看我干嘛", openDotaUrl: "https://www.opendota.com/players/136320131" },
  { steamId: "365587496", name: "yuan.", openDotaUrl: "https://www.opendota.com/players/365587496" },
  { steamId: "362233986", name: "Dom", openDotaUrl: "https://www.opendota.com/players/362233986" },
  { steamId: "294993528", name: "老板", openDotaUrl: "https://www.opendota.com/players/294993528" },
  { steamId: "157552982", name: "拉罗", openDotaUrl: "https://www.opendota.com/players/157552982" },
  { steamId: "136611464", name: "EK", openDotaUrl: "https://www.opendota.com/players/136611464" },
  { steamId: "402598895", name: "韭韭（时浅）", openDotaUrl: "https://www.opendota.com/players/402598895" },
  { steamId: "146348911", name: "彭律", openDotaUrl: "https://www.opendota.com/players/146348911" },
  { steamId: "140976240", name: "世涛", openDotaUrl: "https://www.opendota.com/players/140976240" },
  { steamId: "86788193", name: "Destiny", openDotaUrl: "https://www.opendota.com/players/86788193" },
  { steamId: "420946695", name: "刘能", openDotaUrl: "https://www.opendota.com/players/420946695" },
  { steamId: "900466924", name: "水豚噜噜", openDotaUrl: "https://www.opendota.com/players/900466924" },
  { steamId: "387262791", name: "含章可贞", openDotaUrl: "https://www.opendota.com/players/387262791" },
  { steamId: "157428753", name: "CatU", openDotaUrl: "https://www.opendota.com/players/157428753" },
  { steamId: "255710331", name: "河粉", openDotaUrl: "https://www.opendota.com/players/255710331" },
  { steamId: "117116280", name: "老刘", openDotaUrl: "https://www.opendota.com/players/117116280" },
  { steamId: "141869520", name: "百京泰迪熊", openDotaUrl: "https://www.opendota.com/players/141869520" },
  { steamId: "146389394", name: "漆黑之牙-卓", openDotaUrl: "https://www.opendota.com/players/146389394" },
  { steamId: "183746899", name: "WWW", openDotaUrl: "https://www.opendota.com/players/183746899" },
  { steamId: "366757026", name: "A", openDotaUrl: "https://www.opendota.com/players/366757026" },
];

export default function LeaderboardPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    async function fetchPlayers() {
      try {
        // 使用缓存API替代实时爬取
        const res = await fetch("/api/players/cached", {
          cache: "no-store", // 确保获取最新数据
        });
        
        if (!res.ok) {
          throw new Error("Failed to fetch cached data");
        }
        
        const data = await res.json();
        
        // 合并基础信息和缓存数据
        const playerData = TEAM_PLAYERS.map((tp) => {
          const cached = data.players.find((p: Player) => p.steamId === tp.steamId);
          return { ...tp, ...cached };
        });
        
        setPlayers(playerData);
        setLastUpdated(data.last_updated);
        setError("");
      } catch (err) {
        console.error("Error fetching players:", err);
        setError("数据加载失败，请稍后重试");
        // 如果缓存API失败，回退到基础数据
        setPlayers(TEAM_PLAYERS);
      } finally {
        setLoading(false);
      }
    }

    fetchPlayers();
  }, []);
  
  // 格式化最后更新时间
  const formatLastUpdated = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000 / 60); // 分钟
    
    if (diff < 1) return "刚刚更新";
    if (diff < 60) return `${diff} 分钟前`;
    if (diff < 1440) return `${Math.floor(diff / 60)} 小时前`;
    return `${Math.floor(diff / 1440)} 天前`;
  };

  // 按段位分组 (使用 rank_tier)
  const playersByRank = RANK_TIERS.map(tier => ({
    tier,
    players: players.filter(p => {
      const rankTier = p.rank_tier;
      return getPlayerRank(rankTier).name === tier.name;
    }),
  })).filter(group => group.players.length > 0);

  // 计算统计数据
  const totalPlayers = players.length;
  const calibratedPlayers = players.filter(p => p.rank_tier && p.rank_tier > 0).length;
  const avgMMR = players.length > 0
    ? Math.round(players.reduce((sum, p) => sum + (p.mmr_estimate?.estimate || 0), 0) / players.length)
    : 0;

  return (
    <main className="hero-gradient min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-orange-500 via-yellow-500 to-orange-500 bg-clip-text text-transparent">
              天梯排行榜
            </span>
          </h1>
          <p className="text-xl text-gray-400">
            按真实段位分组 · 每小时自动更新
          </p>
          {lastUpdated && (
            <p className="text-sm text-gray-500 mt-2 flex items-center justify-center gap-2">
              <RefreshCw className="w-3 h-3" />
              最后更新: {formatLastUpdated(lastUpdated)}
            </p>
          )}
          {error && (
            <p className="text-sm text-red-500 mt-2">{error}</p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-12">
          <div className="card-gradient rounded-xl p-6 text-center">
            <Users className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <p className="text-3xl font-bold">{totalPlayers}</p>
            <p className="text-gray-400 text-sm">选手</p>
          </div>
          <div className="card-gradient rounded-xl p-6 text-center">
            <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-3xl font-bold">{calibratedPlayers}</p>
            <p className="text-gray-400 text-sm">已校准</p>
          </div>
          <div className="card-gradient rounded-xl p-6 text-center">
            <div className="w-8 h-8 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center mx-auto mb-2">
              <span className="text-lg">●</span>
            </div>
            <p className="text-3xl font-bold">{avgMMR || "--"}</p>
            <p className="text-gray-400 text-sm">平均 MMR</p>
          </div>
        </div>

        {/* Rank Groups */}
        {loading ? (
          <div className="space-y-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card-gradient rounded-xl p-6 animate-pulse">
                <div className="h-10 bg-white/10 rounded mb-4 w-48"></div>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="h-32 bg-white/5 rounded-lg"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            {playersByRank.map(({ tier, players: tierPlayers }) => (
              <div 
                key={tier.name} 
                className={`rounded-2xl p-6 border ${tier.bgColor} ${tier.borderColor}`}
              >
                {/* Tier Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <span className="text-4xl mr-3">{tier.icon}</span>
                    <div>
                      <h2 className={`text-2xl font-bold ${tier.color}`}>
                        {tier.name}
                      </h2>
                      <p className="text-gray-400 text-sm">
                        {tier.minTier === 0 ? "段位未知" : `天梯段位`} · {tierPlayers.length} 人
                      </p>
                    </div>
                  </div>
                </div>

                {/* Players Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {tierPlayers.map((player) => (
                    <Link 
                      key={player.steamId}
                      href={`/player/${player.steamId}`}
                      className="match-card rounded-xl p-4 group hover:border-white/20 transition-all"
                    >
                      <div className="flex items-center space-x-3 mb-3">
                        {player.profile?.avatarfull ? (
                          <img 
                            src={player.profile.avatarfull} 
                            alt={player.name}
                            className="w-12 h-12 rounded-lg"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">
                            <span className="text-lg font-bold text-gray-500">
                              {player.name.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold group-hover:text-orange-500 transition-colors truncate">
                            {player.name}
                          </h3>
                          <p className="text-gray-500 text-xs truncate">
                            {player.profile?.personaname || player.steamId}
                          </p>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">段位</span>
                          <span className="font-medium text-yellow-400">
                            {player.rank_tier ? (
                              <>
                                {getRankStars(player.rank_tier)}
                                <span className="text-xs text-gray-500 ml-1">({player.rank_tier})</span>
                              </>
                            ) : (
                              "未校准"
                            )}
                          </span>
                        </div>
                        {player.total_games !== undefined && player.total_games > 0 && (
                          <>
                            <div className="flex justify-between">
                              <span className="text-gray-500">场次</span>
                              <span className="font-medium">{player.total_games}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">胜率</span>
                              <span className={`font-medium ${player.win_rate && player.win_rate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                                {player.win_rate}%
                              </span>
                            </div>
                          </>
                        )}
                        {/* 最近5场比赛结果 */}
                        {player.recent_matches && player.recent_matches.length > 0 && (
                          <div className="pt-2 mt-2 border-t border-white/5">
                            <span className="text-gray-500 text-xs">最近5场</span>
                            <div className="flex gap-1 mt-1">
                              {player.recent_matches.map((match, idx) => (
                                <div
                                  key={idx}
                                  className={`w-5 h-5 rounded text-[10px] flex items-center justify-center font-medium ${
                                    match.result === 'win'
                                      ? 'bg-green-500/20 text-green-400'
                                      : 'bg-red-500/20 text-red-400'
                                  }`}
                                  title={`${match.heroName} - ${match.result === 'win' ? '胜' : '负'} (${match.kills}/${match.deaths}/${match.assists})`}
                                >
                                  {match.result === 'win' ? 'W' : 'L'}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                        <span className="text-gray-400 text-xs">查看战绩</span>
                        <ArrowRight className="w-4 h-4 text-orange-500 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}

            {/* Empty State */}
            {playersByRank.length === 0 && (
              <div className="text-center py-16">
                <p className="text-gray-400 text-xl">暂无数据</p>
                <p className="text-gray-500 mt-2">请刷新页面重试</p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

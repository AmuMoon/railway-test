"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, Swords, User } from "lucide-react";

interface Match {
  match_id: number;
  hero_id: number;
  kills: number;
  deaths: number;
  assists: number;
  radiant_win: boolean;
  player_slot: number;
  duration: number;
  game_mode: number;
  lobby_type: number;
  start_time: number;
}

interface PlayerData {
  profile: {
    personaname: string;
    avatarfull: string;
    steamid: string;
  };
  rank_tier: number;
  leaderboard_rank?: number;
}

const HEROES: Record<number, string> = {
  1: "Anti-Mage", 2: "Axe", 3: "Bane", 4: "Bloodseeker", 5: "Crystal Maiden",
  6: "Drow Ranger", 7: "Earthshaker", 8: "Juggernaut", 9: "Mirana", 10: "Morphling",
  11: "Shadow Fiend", 12: "Phantom Lancer", 13: "Puck", 14: "Pudge", 15: "Razor",
  16: "Sand King", 17: "Storm Spirit", 18: "Sven", 19: "Tiny", 20: "Vengeful Spirit",
  21: "Windranger", 22: "Zeus", 23: "Kunkka", 25: "Lina", 26: "Lion",
  27: "Shadow Shaman", 28: "Slardar", 29: "Tidehunter", 30: "Witch Doctor",
  31: "Lich", 32: "Riki", 33: "Enigma", 34: "Tinker", 35: "Sniper",
  36: "Necrophos", 37: "Warlock", 38: "Beastmaster", 39: "Queen of Pain",
  40: "Venomancer", 41: "Faceless Void", 42: "Wraith King", 43: "Death Prophet",
  44: "Phantom Assassin", 45: "Pugna", 46: "Templar Assassin", 47: "Viper",
  48: "Luna", 49: "Dragon Knight", 50: "Dazzle", 51: "Clockwerk",
  52: "Leshrac", 53: "Nature's Prophet", 54: "Lifestealer", 55: "Dark Seer",
  56: "Clinkz", 57: "Omniknight", 58: "Enchantress", 59: "Huskar",
  60: "Night Stalker", 61: "Broodmother", 62: "Bounty Hunter", 63: "Weaver",
  64: "Jakiro", 65: "Batrider", 66: "Chen", 67: "Spectre", 68: "Ancient Apparition",
  69: "Doom", 70: "Ursa", 71: "Spirit Breaker", 72: "Gyrocopter", 73: "Alchemist",
  74: "Invoker", 75: "Silencer", 76: "Outworld Destroyer", 77: "Lycan",
  78: "Brewmaster", 79: "Shadow Demon", 80: "Lone Druid", 81: "Chaos Knight",
  82: "Meepo", 83: "Treant Protector", 84: "Ogre Magi", 85: "Undying",
  86: "Rubick", 87: "Disruptor", 88: "Nyx Assassin", 89: "Naga Siren",
  90: "Keeper of the Light", 91: "Io", 92: "Visage", 93: "Slark",
  94: "Medusa", 95: "Troll Warlord", 96: "Centaur Warrunner", 97: "Magnus",
  98: "Timbersaw", 99: "Bristleback", 100: "Tusk", 101: "Skywrath Mage",
  102: "Abaddon", 103: "Elder Titan", 104: "Legion Commander", 105: "Techies",
  106: "Ember Spirit", 107: "Earth Spirit", 108: "Underlord", 109: "Terrorblade",
  110: "Phoenix", 111: "Oracle", 112: "Winter Wyvern", 113: "Arc Warden",
  114: "Monkey King", 119: "Dark Willow", 120: "Pangolier", 121: "Grimstroke",
  123: "Hoodwink", 126: "Void Spirit", 128: "Snapfire", 129: "Mars",
  135: "Dawnbreaker", 136: "Marci", 137: "Primal Beast", 138: "Muerta",
  145: "Ringmaster"
};

const GAME_MODES: Record<number, string> = {
  0: "Unknown", 1: "All Pick", 2: "Captains Mode", 3: "Random Draft",
  4: "Single Draft", 5: "All Random", 6: "Intro", 7: "Diretide",
  8: "Reverse Captains Mode", 9: "Greeviling", 10: "Tutorial",
  11: "Mid Only", 12: "Least Played", 13: "Limited Heroes",
  14: "Compendium Matchmaking", 15: "Custom", 16: "Captains Draft",
  17: "Balanced Draft", 18: "Ability Draft", 19: "Event",
  20: "All Random Deathmatch", 21: "1v1 Mid", 22: "Ranked All Pick",
  23: "Turbo"
};

const LOBBY_TYPES: Record<number, string> = {
  0: "Normal", 1: "Practice", 2: "Tournament", 3: "Tutorial",
  4: "Co-op Bots", 5: "Ranked Team", 6: "Ranked Solo",
  7: "Ranked", 8: "1v1 Mid", 9: "Battle Cup"
};

function getHeroName(heroId: number): string {
  return HEROES[heroId] || `Hero ${heroId}`;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function isRadiant(playerSlot: number): boolean {
  return playerSlot < 128;
}

function didWin(radiantWin: boolean, playerSlot: number): boolean {
  const playerRadiant = isRadiant(playerSlot);
  return (playerRadiant && radiantWin) || (!playerRadiant && !radiantWin);
}

export default function PlayerPage() {
  const params = useParams();
  const steamId = params.steamId as string;
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // 首先尝试从缓存获取数据
        const cachedRes = await fetch(`/api/player-cached/${steamId}`);
        
        if (cachedRes.ok) {
          const cachedData = await cachedRes.json();
          setPlayer({
            profile: cachedData.profile,
            rank_tier: cachedData.rank_tier,
            leaderboard_rank: cachedData.competitive_rank,
            win: cachedData.win,
            lose: cachedData.lose,
            win_rate: cachedData.win_rate,
            total_games: cachedData.total_games,
          });
          
          // 转换缓存的比赛数据格式
          if (cachedData.recent_matches) {
            const formattedMatches = cachedData.recent_matches.map((m: any) => ({
              match_id: m.matchId,
              hero_id: m.heroId,
              kills: m.kills,
              deaths: m.deaths,
              assists: m.assists,
              radiant_win: m.result === "win",
              player_slot: 0, // 缓存中没有这个信息
              duration: 0,
              game_mode: 0,
              lobby_type: 0,
              start_time: m.startTime,
            }));
            setMatches(formattedMatches);
          }
        } else {
          // 缓存未命中，回退到直接 API
          const playerRes = await fetch(`/api/player/${steamId}`);
          if (!playerRes.ok) throw new Error("Failed to fetch player");
          const playerData = await playerRes.json();
          setPlayer(playerData);

          const matchesRes = await fetch(`/api/player/${steamId}/matches`);
          if (!matchesRes.ok) throw new Error("Failed to fetch matches");
          const matchesData = await matchesRes.json();
          setMatches(matchesData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    if (steamId) {
      fetchData();
    }
  }, [steamId]);

  if (loading) {
    return (
      <div className="min-h-screen hero-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading player data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen hero-gradient flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Link href="/" className="text-orange-500 hover:underline">
            Go back
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="hero-gradient min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link 
          href="/" 
          className="inline-flex items-center text-gray-400 hover:text-orange-500 transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Search
        </Link>

        {/* Player Header */}
        {player && (
          <div className="card-gradient rounded-2xl p-6 mb-8">
            <div className="flex items-center space-x-6">
              <img 
                src={player.profile.avatarfull} 
                alt={player.profile.personaname}
                className="w-24 h-24 rounded-xl"
              />
              <div>
                <h1 className="text-3xl font-bold mb-2">{player.profile.personaname}</h1>
                <div className="flex items-center space-x-4 text-gray-400">
                  <span className="flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    Steam ID: {steamId}
                  </span>
                  {player.rank_tier && (
                    <span className="bg-orange-500/20 text-orange-500 px-3 py-1 rounded-full text-sm">
                      Rank: {Math.floor(player.rank_tier / 10)}★{player.rank_tier % 10}
                    </span>
                  )}
                  {player.leaderboard_rank && (
                    <span className="bg-yellow-500/20 text-yellow-500 px-3 py-1 rounded-full text-sm">
                      Leaderboard: #{player.leaderboard_rank}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Matches */}
        <h2 className="text-2xl font-bold mb-6 flex items-center">
          <Swords className="w-6 h-6 mr-2 text-orange-500" />
          Recent Matches
        </h2>

        {matches.length === 0 ? (
          <div className="card-gradient rounded-2xl p-8 text-center">
            <p className="text-gray-400">No recent matches found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {matches.map((match) => {
              const won = didWin(match.radiant_win, match.player_slot);
              return (
                <div key={match.match_id} className="match-card rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                      {/* Win/Loss Badge */}
                      <div className={`px-4 py-2 rounded-lg font-semibold ${won ? "win-badge" : "loss-badge"}`}>
                        {won ? "WIN" : "LOSS"}
                      </div>
                      
                      {/* Hero */}
                      <div>
                        <p className="text-sm text-gray-400">Hero</p>
                        <p className="font-semibold text-lg">{getHeroName(match.hero_id)}</p>
                      </div>

                      {/* KDA */}
                      <div>
                        <p className="text-sm text-gray-400">KDA</p>
                        <p className="font-semibold text-lg">
                          <span className="text-green-500">{match.kills}</span>
                          <span className="text-gray-500"> / </span>
                          <span className="text-red-500">{match.deaths}</span>
                          <span className="text-gray-500"> / </span>
                          <span className="text-blue-500">{match.assists}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6 text-right">
                      {/* Game Mode */}
                      <div>
                        <p className="text-sm text-gray-400">Mode</p>
                        <p className="font-medium">{GAME_MODES[match.game_mode] || "Unknown"}</p>
                      </div>

                      {/* Duration */}
                      <div>
                        <p className="text-sm text-gray-400">Duration</p>
                        <p className="font-medium flex items-center justify-end">
                          <Clock className="w-4 h-4 mr-1" />
                          {formatDuration(match.duration)}
                        </p>
                      </div>

                      {/* Date */}
                      <div>
                        <p className="text-sm text-gray-400">Date</p>
                        <p className="font-medium">{formatDate(match.start_time)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
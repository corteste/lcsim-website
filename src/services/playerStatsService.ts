import { PlayerStats, PlayerStatsAvg, PlayerStatsSum } from '@/types/playerStats';

const EDGE_URL = 'https://hzenyasrargpsbuaxmxl.supabase.co/functions/v1/rest-read';
const EDGE_PLAYER_STATS_URL = 'https://hzenyasrargpsbuaxmxl.supabase.co/functions/v1/rest-read-an-player-stats';
const LIMIT = 50;

export async function fetchPlayerStats(pageIndex = 1): Promise<PlayerStats[]> {
  const offset = pageIndex * LIMIT;
  const res = await fetch(`${EDGE_PLAYER_STATS_URL}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || 'Failed to fetch players');
  return json.data ?? [];
}

export async function fetchPlayerAvgBySeason(season: number): Promise<PlayerStatsAvg[]> {
  const res = await fetch(`${EDGE_PLAYER_STATS_URL}/season/avg`,{method: 'POST', body: JSON.stringify({season})});
  const json = await res.json();
  console.log("Player Stats fetched for season",  json.data);
  if (!res.ok) throw new Error(json?.error || 'Failed to fetch player');
   return json.data ?? [];
}

export async function fetchPlayerSumBySeason(season: number): Promise<PlayerStatsSum[]> {
  const res = await fetch(`${EDGE_PLAYER_STATS_URL}/season/sum`,{method: 'POST', body: JSON.stringify({season})});
  const json = await res.json();
  console.log("Player Stats fetched for season",  json.data);
  if (!res.ok) throw new Error(json?.error || 'Failed to fetch player');
   return json.data ?? [];
}

export async function fetchPlayerStatsByPlayer(player: String): Promise<PlayerStats[]> {
  const res = await fetch(`${EDGE_PLAYER_STATS_URL}/player`,{method: 'POST', body: JSON.stringify({player})});
  const json = await res.json();
  console.log("Player Stats fetched for player",  json.data);
  if (!res.ok) throw new Error(json?.error || 'Failed to fetch player');
   return json.data ?? [];
}

export async function fetchPlayerStatsByTeam(team: String): Promise<PlayerStats[]> {
  const res = await fetch(`${EDGE_PLAYER_STATS_URL}/team`,{method: 'POST', body: JSON.stringify({team})});
  const json = await res.json();
  console.log("Player Stats fetched for team",  json.data);
  if (!res.ok) throw new Error(json?.error || 'Failed to fetch player');
   return json.data ?? [];
}

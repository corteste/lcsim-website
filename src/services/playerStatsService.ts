import { PlayerStats, PlayerStatsAvg, PlayerStatsSum } from '@/types/playerStats';

const EDGE_PLAYER_STATS_URL = 'https://hzenyasrargpsbuaxmxl.supabase.co/functions/v1/rest-read-an-player-stats';

export async function fetchPlayerStats(): Promise<PlayerStats[]> {
  const res = await fetch(`${EDGE_PLAYER_STATS_URL}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || 'Failed to fetch player stats');
  return json.data ?? [];
}

export async function fetchPlayerRoundStats(): Promise<PlayerStats[]> {
  const res = await fetch(`${EDGE_PLAYER_STATS_URL}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || 'Failed to fetch player round stats');
  return json.data ?? [];
}

export async function fetchPlayerAvgBySeason(season: number): Promise<PlayerStatsAvg[]> {
  const res = await fetch(`${EDGE_PLAYER_STATS_URL}/season/avg`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ season }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || 'Failed to fetch player average stats');
  return json.data ?? [];
}

export async function fetchPlayerSumBySeason(season: number): Promise<PlayerStatsSum[]> {
  const res = await fetch(`${EDGE_PLAYER_STATS_URL}/season/sum`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ season }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || 'Failed to fetch player summary stats');
  return json.data ?? [];
}

export async function fetchPlayerStatsByPlayer(player: string): Promise<PlayerStats[]> {
  const res = await fetch(`${EDGE_PLAYER_STATS_URL}/player`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ player }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || 'Failed to fetch player stats');
  return json.data ?? [];
}

export async function fetchPlayerStatsByTeam(team: string): Promise<PlayerStats[]> {
  const res = await fetch(`${EDGE_PLAYER_STATS_URL}/team`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ team }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || 'Failed to fetch team player stats');
  return json.data ?? [];
}

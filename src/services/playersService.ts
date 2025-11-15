import { Player } from '@/types/player';

const EDGE_URL = 'https://hzenyasrargpsbuaxmxl.supabase.co/functions/v1/rest-read';
const EDGE_PLAYER_URL = 'https://hzenyasrargpsbuaxmxl.supabase.co/functions/v1/rest-read-an-player';
const LIMIT = 50;

export async function fetchPlayers(pageIndex = 1): Promise<Player[]> {
  const offset = pageIndex * LIMIT;
  const res = await fetch(`${EDGE_PLAYER_URL}`);
  const json = await res.json();
  //console.log("Players fetched:", json.data);
  if (!res.ok) throw new Error(json?.error || 'Failed to fetch players');
  return json.data ?? [];
}


export async function fetchPlayersByTeam(team: String): Promise<Player[]> {
  const res = await fetch(`${EDGE_PLAYER_URL}/${team}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || 'Failed to fetch player');
   return json.data ?? [];
}

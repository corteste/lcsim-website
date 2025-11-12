import { Player } from '@/types/player';
import { Team } from '@/types/team';

const EDGE_TEAM_URL = 'https://hzenyasrargpsbuaxmxl.supabase.co/functions/v1/rest-read-an-team';
const LIMIT = 50;

export async function fetchTeams(pageIndex = 1): Promise<Team[]> {
  const offset = pageIndex * LIMIT;
  const res = await fetch(`${EDGE_TEAM_URL}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || 'Failed to fetch players');
  return json.data ?? [];
}


export async function fetchTeamById(team: String): Promise<Team> {
  const res = await fetch(`${EDGE_TEAM_URL}/${team}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || 'Failed to fetch player');
   return json.data ?? [];
}

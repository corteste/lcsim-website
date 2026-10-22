import { Team } from '@/types/team';
import { supabase } from '@/supabaseClient';
import { TEAM_TABLE } from '@/constants/App';

export async function fetchTeams(_pageIndex = 1): Promise<Team[]> {
  const { data, error } = await supabase
    .from(TEAM_TABLE)
    .select('*, players:an_player(*)')
    .eq('ACTIVE', true);

  if (error) {
    console.error('Error fetching teams:', error);
    throw new Error(error.message || 'Failed to fetch teams');
  }

  return (data as Team[]) ?? [];
}

export async function fetchTeamById(team?: string | String): Promise<Team | null> {
  if (!team) return null;
  const teamStr = String(team);

  const { data, error } = await supabase
    .from(TEAM_TABLE)
    .select('*, players:an_player(*)')
    .or(`TEAM_ID.eq.${teamStr},NAME_ABBR.eq.${teamStr},NAME.eq.${teamStr}`)
    .maybeSingle();

  if (error) {
    console.error(`Error fetching team ${teamStr}:`, error);
    throw new Error(error.message || 'Failed to fetch team');
  }

  return data as Team | null;
}

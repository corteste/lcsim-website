import { Team } from '@/types/team';
import { supabase } from '@/supabaseClient';
import { TEAM_TABLE } from '@/constants/App';

export async function fetchTeams(_pageIndex = 1): Promise<Team[]> {
  const { data, error } = await supabase
    .from(TEAM_TABLE)
    .select('*, players:an_player(*, MarketStatus:AS_PLAYER_MARKET(Status))')
    .eq('ACTIVE', true);

  if (error) {
    console.error('Error fetching teams:', error);
    throw new Error(error.message || 'Failed to fetch teams');
  }

  return (data as Team[]) ?? [];
}

export async function fetchTeamById(team?: string): Promise<Team | null> {
  if (!team) return null;

  const { data, error } = await supabase
    .from(TEAM_TABLE)
    .select('*, players:an_player(*, MarketStatus:AS_PLAYER_MARKET(Status))')
    .or(`TEAM_ID.eq.${team},NAME_ABBR.eq.${team},NAME.eq.${team}`)
    .maybeSingle();

  if (error) {
    console.error(`Error fetching team ${team}:`, error);
    throw new Error(error.message || 'Failed to fetch team');
  }

  return data as Team | null;
}

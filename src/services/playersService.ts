import { Player } from '@/types/player';
import { supabase } from '@/supabaseClient';
import { PLAYER_TABLE } from '@/constants/App';

export async function fetchPlayers(_pageIndex = 1): Promise<Player[]> {
  const { data, error } = await supabase
    .from(PLAYER_TABLE)
    .select('*')
    .order('ID', { ascending: true });

  if (error) {
    console.error('Error fetching players:', error);
    throw new Error(error.message || 'Failed to fetch players');
  }

  return (data as Player[]) ?? [];
}

export async function fetchPlayersByTeam(team: string | String): Promise<Player[]> {
  const teamStr = String(team);
  const { data, error } = await supabase
    .from(PLAYER_TABLE)
    .select('*')
    .eq('Squadra', teamStr)
    .order('ID', { ascending: true });

  if (error) {
    console.error(`Error fetching players for team ${teamStr}:`, error);
    throw new Error(error.message || 'Failed to fetch players');
  }

  return (data as Player[]) ?? [];
}

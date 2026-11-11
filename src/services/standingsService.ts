import { Standings } from "@/types/standings";
import { supabase } from "@/supabaseClient";

export async function fetchStandings(season: number = 11): Promise<Standings[]> {
  try {
    await supabase.rpc('sync_unlocked_standings', { p_stag: season });
  } catch {
    // Non-blocking sync
  }

  const query = supabase
    .from('an_standings')
    .select('*, team:an_team(*)')
    .eq('stag', season)
    .order('points', { ascending: false })
    .order('goal_difference', { ascending: false })
    .order('goal_made', { ascending: false })
    .order('team', { ascending: true });

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching standings:', error);
    throw new Error(error.message || 'Failed to fetch standings');
  }

  return (data as Standings[]) ?? [];
}

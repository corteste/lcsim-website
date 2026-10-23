import { Standings } from "@/types/standings";
import { supabase } from "@/supabaseClient";

export async function fetchStandings(season?: number): Promise<Standings[]> {
  let query = supabase
    .from('an_standings')
    .select('*, team:an_team(*)')
    .order('points', { ascending: false })
    .order('goal_difference', { ascending: false });

  if (season !== undefined) {
    query = query.eq('stag', season);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching standings:', error);
    throw new Error(error.message || 'Failed to fetch standings');
  }

  return (data as Standings[]) ?? [];
}

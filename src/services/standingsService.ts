import { Standings } from "@/types/standings";

const EDGE_URL = 'https://hzenyasrargpsbuaxmxl.supabase.co/functions/v1/rest-get-standings';

export async function fetchStandings(): Promise<Standings[]> {
  const res = await fetch(`${EDGE_URL}`);
  const json = await res.json();
  //console.log("Players fetched:", json.data);
  if (!res.ok) throw new Error(json?.error || 'Failed to fetch standings');
  return json.data ?? [];
}

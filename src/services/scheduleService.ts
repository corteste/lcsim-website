import { ScheduleGeneral, Schedule } from "@/types/schedule";
import { MatchStats } from "@/types/teamStats";
import { PlayerStats } from "@/types/playerStats";
import { supabase } from "@/supabaseClient";

// Priority map for sorting player stats by role
const rolePriority: Record<string, number> = {
  POR: 0, TD: 1, DC: 2, TS: 3, CDC: 4, ED: 5, CC: 6, ES: 7, COC: 8, AD: 9, AS: 10, AT: 11, ATT: 12
};

function sortPlayersByRole(players: PlayerStats[]): PlayerStats[] {
  return players.slice().sort((a, b) => (rolePriority[a.Posiz] ?? 99) - (rolePriority[b.Posiz] ?? 99));
}

export async function fetchScheduleGeneral(stag: number, week?: number): Promise<ScheduleGeneral[]> {
  let query = supabase.from('an_schedule').select('*').eq('stag', stag);
  if (week !== undefined) {
    query = query.eq('week', week);
  }
  const { data, error } = await query.order('week', { ascending: true });
  if (error) {
    console.error('Error fetching schedule general:', error);
    throw new Error(error.message || 'Failed to fetch schedule general');
  }
  return (data as ScheduleGeneral[]) ?? [];
}

export async function fetchSchedule(stag: number, week: number): Promise<MatchStats[]> {
  const [teamStatsRes, playerStatsRes] = await Promise.all([
    supabase.from('view_team_stats').select('*').eq('stag', stag).eq('week', week),
    supabase.from('VIEW_PLAYER_STATS').select('*').eq('STAG', stag).eq('WEEK', week)
  ]);

  if (teamStatsRes.error) {
    console.error('Error fetching team stats:', teamStatsRes.error);
    throw new Error(teamStatsRes.error.message || 'Failed to fetch schedule');
  }

  const teamMatches = (teamStatsRes.data || []) as MatchStats[];
  const allPlayerStats = (playerStatsRes.data || []) as PlayerStats[];

  return teamMatches.map((match) => {
    const homePlayerStats = allPlayerStats.filter(
      (ps) => ps.Squadra === match.home || ps.Squadra === match.home_team
    );
    const awayPlayerStats = allPlayerStats.filter(
      (ps) => ps.Squadra === match.away || ps.Squadra === match.away_team
    );

    return {
      ...match,
      home_player_stats: sortPlayersByRole(homePlayerStats),
      away_player_stats: sortPlayersByRole(awayPlayerStats),
    };
  });
}

/**
 * Single batch fetch for the entire season schedule.
 * Replaces 18 Edge Function requests with a single parallel fetch taking < 300ms.
 */
export async function fetchSeasonSchedule(stag: number): Promise<Schedule[]> {
  try {
    await supabase.rpc('sync_unlocked_standings', { p_stag: stag });
  } catch {
    // Non-blocking sync
  }

  const [scheduleGenRes, teamStatsRes, playerStatsRes] = await Promise.all([
    supabase.from('an_schedule').select('*').eq('stag', stag).order('week', { ascending: true }),
    supabase.from('view_team_stats').select('*').eq('stag', stag).order('week', { ascending: true }),
    supabase.from('VIEW_PLAYER_STATS').select('*').eq('STAG', stag)
  ]);

  if (teamStatsRes.error) {
    console.error('Error fetching team stats:', teamStatsRes.error);
    throw new Error(teamStatsRes.error.message || 'Failed to fetch team stats');
  }
  if (scheduleGenRes.error) {
    console.error('Error fetching schedule general:', scheduleGenRes.error);
    throw new Error(scheduleGenRes.error.message || 'Failed to fetch schedule general');
  }

  const generalRows = (scheduleGenRes.data || []) as ScheduleGeneral[];
  const teamMatches = (teamStatsRes.data || []) as MatchStats[];
  const playerStatsRows = (playerStatsRes.data || []) as PlayerStats[];

  const weeksMap = new Map<number, MatchStats[]>();

  for (const match of teamMatches) {
    const gen = generalRows.find(
      (g) => g.week === match.week && g.home === match.home && g.away === match.away
    );

    const homePlayerStats = playerStatsRows.filter(
      (ps) => ps.WEEK === match.week && (ps.Squadra === match.home || ps.Squadra === match.home_team)
    );
    const awayPlayerStats = playerStatsRows.filter(
      (ps) => ps.WEEK === match.week && (ps.Squadra === match.away || ps.Squadra === match.away_team)
    );

    const fullMatch: MatchStats = {
      ...match,
      stadium: gen?.stadium ?? "",
      referee: gen?.referee ?? "",
      weather: gen?.weather ?? "",
      date: gen?.date ? new Date(gen.date) : new Date(),
      match_time: (gen as any)?.match_time ?? match.match_time ?? "21:00",
      unlock_at: (gen as any)?.unlock_at ?? match.unlock_at ?? null,
      home_player_stats: sortPlayersByRole(homePlayerStats),
      away_player_stats: sortPlayersByRole(awayPlayerStats),
    };

    if (!weeksMap.has(match.week)) {
      weeksMap.set(match.week, []);
    }
    weeksMap.get(match.week)!.push(fullMatch);
  }

  const result: Schedule[] = [];
  for (const [week, matches] of weeksMap.entries()) {
    result.push({ week, matches });
  }

  result.sort((a, b) => a.week - b.week);
  return result;
}

import { ScheduleGeneral, Schedule, LeagueCalendarEvent } from "@/types/schedule";
import { MatchStats } from "@/types/teamStats";
import { PlayerStats } from "@/types/playerStats";
import { supabase } from "@/supabaseClient";

// Priority map for sorting player stats by role (left-to-right within each line)
const rolePriority: Record<string, number> = {
  POR: 0,
  TS: 1,
  ASA: 1,
  DCS: 2,
  DC: 2,
  DCD: 2,
  TD: 3,
  ADA: 3,
  CDS: 4,
  CDC: 4,
  CDD: 4,
  ES: 5,
  CCS: 6,
  CC: 6,
  CCD: 6,
  ED: 7,
  COS: 8,
  COC: 8,
  COD: 8,
  AS: 9,
  PS: 10,
  AT: 11,
  ATT: 11,
  PD: 12,
  AD: 13,
};

/**
 * Resolves the 11 starters vs substitutes for a single team in a match.
 * If explicit SUB / POS_GIOCATA === 'SOS' flags already separate <=11 starters, respects them.
 * Otherwise (when SUB is false for all rows), uses match duration, goalkeeper priority,
 * full-match players, complementary substitution pairs (minA + minB ≈ matchDuration),
 * and minutes played to accurately flag the 11 starters (SUB = false) and substitutes (SUB = true).
 */
export function resolveStartersAndSubs(
  players: PlayerStats[],
  matchDuration?: number | null
): PlayerStats[] {
  if (!players || players.length === 0) return [];

  // Deduplicate by player ID if any duplicate exists
  const uniqueMap = new Map<number, PlayerStats>();
  for (const p of players) {
    if (!uniqueMap.has(p.ID)) {
      uniqueMap.set(p.ID, { ...p });
    }
  }
  const list = Array.from(uniqueMap.values());

  if (list.length <= 11) {
    return list.map((p) => ({ ...p, SUB: false }));
  }

  // Check if explicit SUB flags already yield exactly 11 starters
  const hasExplicitSubFlag = list.some(
    (p) => Boolean(p.SUB) || p.POS_GIOCATA === "SOS"
  );
  const explicitStarters = list.filter(
    (p) => !p.SUB && p.POS_GIOCATA !== "SOS"
  );

  if (hasExplicitSubFlag && explicitStarters.length === 11) {
    const starterIds = new Set(explicitStarters.map((p) => p.ID));
    return list.map((p) => ({
      ...p,
      SUB: !starterIds.has(p.ID),
    }));
  }

  // Otherwise, infer the 11 starters from minutes played and substitution pairs
  const maxMin =
    matchDuration && matchDuration > 0
      ? matchDuration
      : Math.max(...list.map((p) => p.MINUTI ?? 0), 90);

  const starterIds = new Set<number>();
  const definiteSubIds = new Set<number>();

  // 1. Goalkeeper with highest minutes is always a starter
  const gks = list
    .filter(
      (p) =>
        (p.POS_GIOCATA && p.POS_GIOCATA !== "SOS" ? p.POS_GIOCATA : p.Posiz) ===
          "POR" || p.Posiz === "POR"
    )
    .sort((a, b) => (b.MINUTI ?? 0) - (a.MINUTI ?? 0));

  if (gks.length > 0) {
    starterIds.add(gks[0].ID);
  }

  // 2. Players who played the full match (or got a red card after starting) are starters
  for (const p of list) {
    if (starterIds.size >= 11) break;
    if (starterIds.has(p.ID)) continue;
    const min = p.MINUTI ?? 0;
    if (min >= maxMin - 1 || (p.ROSSI && p.ROSSI > 0 && min >= 45)) {
      starterIds.add(p.ID);
    }
  }

  // 3. Identify complementary substitution pairs among remaining players (minA + minB ≈ maxMin)
  const candidates = list
    .filter((p) => !starterIds.has(p.ID) && !definiteSubIds.has(p.ID))
    .sort((a, b) => (b.MINUTI ?? 0) - (a.MINUTI ?? 0));

  const pairedIds = new Set<number>();
  for (let i = 0; i < candidates.length; i++) {
    const pA = candidates[i];
    if (pairedIds.has(pA.ID)) continue;
    const minA = pA.MINUTI ?? 0;

    // Look for a partner pB whose minutes sum with minA to ~maxMin (tolerance ±2 min)
    let bestPartner: PlayerStats | null = null;
    let bestDiff = 999;
    for (let j = candidates.length - 1; j > i; j--) {
      const pB = candidates[j];
      if (pairedIds.has(pB.ID)) continue;
      const minB = pB.MINUTI ?? 0;
      const diff = Math.abs(minA + minB - maxMin);
      if (diff <= 2 && diff < bestDiff) {
        bestDiff = diff;
        bestPartner = pB;
      }
    }

    if (bestPartner) {
      pairedIds.add(pA.ID);
      pairedIds.add(bestPartner.ID);
      // Since candidates is sorted descending by MINUTI, pA has >= minutes than bestPartner
      if (starterIds.size < 11) {
        starterIds.add(pA.ID);
        definiteSubIds.add(bestPartner.ID);
      } else {
        definiteSubIds.add(pA.ID);
        definiteSubIds.add(bestPartner.ID);
      }
    }
  }

  // 4. Fill any remaining starter slots up to 11 by highest minutes played
  for (const p of candidates) {
    if (starterIds.size >= 11) break;
    if (!starterIds.has(p.ID) && !definiteSubIds.has(p.ID)) {
      starterIds.add(p.ID);
    }
  }

  // Fallback if still < 11 (e.g. multiple subs on same slot)
  if (starterIds.size < 11) {
    const remainingByMin = list
      .filter((p) => !starterIds.has(p.ID))
      .sort((a, b) => (b.MINUTI ?? 0) - (a.MINUTI ?? 0));
    for (const p of remainingByMin) {
      if (starterIds.size >= 11) break;
      starterIds.add(p.ID);
    }
  }

  return list.map((p) => ({
    ...p,
    SUB: !starterIds.has(p.ID),
  }));
}

function sortPlayersByRole(
  players: PlayerStats[],
  matchDuration?: number | null
): PlayerStats[] {
  const resolved = resolveStartersAndSubs(players, matchDuration);
  return resolved.slice().sort((a, b) => {
    const aIsSub = Boolean(a.SUB || a.POS_GIOCATA === "SOS");
    const bIsSub = Boolean(b.SUB || b.POS_GIOCATA === "SOS");
    if (aIsSub !== bIsSub) return aIsSub ? 1 : -1;

    // For substitutes, sort primarily by minutes played descending, then role
    if (aIsSub && bIsSub) {
      const minDiff = (b.MINUTI ?? 0) - (a.MINUTI ?? 0);
      if (minDiff !== 0) return minDiff;
    }

    const aRoleKey =
      !aIsSub && a.POS_GIOCATA && a.POS_GIOCATA !== "SOS"
        ? a.POS_GIOCATA
        : a.Posiz;
    const bRoleKey =
      !bIsSub && b.POS_GIOCATA && b.POS_GIOCATA !== "SOS"
        ? b.POS_GIOCATA
        : b.Posiz;
    const prioDiff =
      (rolePriority[aRoleKey] ?? rolePriority[a.Posiz] ?? 99) -
      (rolePriority[bRoleKey] ?? rolePriority[b.Posiz] ?? 99);
    if (prioDiff !== 0) return prioDiff;
    return (b.MINUTI ?? 0) - (a.MINUTI ?? 0);
  });
}

/**
 * Checks if a player stat record belongs to the given team in that match.
 * Prioritizes historical TEAM_ID from as_player_stat so ex-players (traded/cut/retired)
 * are always matched to the team they played for in that match.
 */
function belongsToMatchTeam(
  ps: PlayerStats,
  teamCode: string,
  teamName?: string
): boolean {
  if (ps.TEAM_ID) {
    return ps.TEAM_ID === teamCode || (Boolean(teamName) && ps.TEAM_ID === teamName);
  }
  return ps.Squadra === teamCode || (Boolean(teamName) && ps.Squadra === teamName);
}

/**
 * Fetches all player stats rows for a season using pagination (bypassing PostgREST 1000-row limit).
 */
async function fetchAllSeasonPlayerStats(stag: number): Promise<PlayerStats[]> {
  const pageSize = 1000;
  let allRows: PlayerStats[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("view_player_stats")
      .select("*")
      .eq("STAG", stag)
      .range(from, from + pageSize - 1);

    if (error) {
      console.error("Error fetching season player stats page:", error);
      break;
    }
    if (!data || data.length === 0) break;

    allRows = allRows.concat(data as PlayerStats[]);
    if (data.length < pageSize) break;
    from += pageSize;
  }

  return allRows;
}

export async function fetchScheduleGeneral(
  stag: number,
  week?: number
): Promise<ScheduleGeneral[]> {
  let query = supabase.from("an_schedule").select("*").eq("stag", stag);
  if (week !== undefined) {
    query = query.eq("week", week);
  }
  const { data, error } = await query.order("week", { ascending: true });
  if (error) {
    console.error("Error fetching schedule general:", error);
    throw new Error(error.message || "Failed to fetch schedule general");
  }
  return (data as ScheduleGeneral[]) ?? [];
}

export async function fetchSchedule(
  stag: number,
  week: number
): Promise<MatchStats[]> {
  const [teamStatsRes, playerStatsRes] = await Promise.all([
    supabase.from("view_team_stats").select("*").eq("stag", stag).eq("week", week),
    supabase.from("view_player_stats").select("*").eq("STAG", stag).eq("WEEK", week),
  ]);

  if (teamStatsRes.error) {
    console.error("Error fetching team stats:", teamStatsRes.error);
    throw new Error(teamStatsRes.error.message || "Failed to fetch schedule");
  }

  const teamMatches = (teamStatsRes.data || []) as MatchStats[];
  const allPlayerStats = (playerStatsRes.data || []) as PlayerStats[];

  return teamMatches.map((match) => {
    const homePlayerStats = allPlayerStats.filter((ps) =>
      belongsToMatchTeam(ps, match.home, match.home_team)
    );
    const awayPlayerStats = allPlayerStats.filter((ps) =>
      belongsToMatchTeam(ps, match.away, match.away_team)
    );

    return {
      ...match,
      home_player_stats: sortPlayersByRole(homePlayerStats, match.home_minuti),
      away_player_stats: sortPlayersByRole(awayPlayerStats, match.away_minuti),
    };
  });
}

/**
 * Single batch fetch for the entire season schedule, including full paginated player stats.
 */
export async function fetchSeasonSchedule(stag: number): Promise<Schedule[]> {
  try {
    await supabase.rpc("sync_unlocked_standings", { p_stag: stag });
  } catch {
    // Non-blocking sync
  }

  const [scheduleGenRes, teamStatsRes, playerStatsRows] = await Promise.all([
    supabase
      .from("an_schedule")
      .select("*")
      .eq("stag", stag)
      .order("week", { ascending: true }),
    supabase
      .from("view_team_stats")
      .select("*")
      .eq("stag", stag)
      .order("week", { ascending: true }),
    fetchAllSeasonPlayerStats(stag),
  ]);

  if (teamStatsRes.error) {
    console.error("Error fetching team stats:", teamStatsRes.error);
    throw new Error(teamStatsRes.error.message || "Failed to fetch team stats");
  }
  if (scheduleGenRes.error) {
    console.error("Error fetching schedule general:", scheduleGenRes.error);
    throw new Error(
      scheduleGenRes.error.message || "Failed to fetch schedule general"
    );
  }

  const generalRows = (scheduleGenRes.data || []) as ScheduleGeneral[];
  const teamMatches = (teamStatsRes.data || []) as MatchStats[];

  const weeksMap = new Map<number, MatchStats[]>();

  for (const match of teamMatches) {
    const gen = generalRows.find(
      (g) =>
        g.week === match.week && g.home === match.home && g.away === match.away
    );

    const homePlayerStats = playerStatsRows.filter(
      (ps) =>
        ps.WEEK === match.week &&
        belongsToMatchTeam(ps, match.home, match.home_team)
    );
    const awayPlayerStats = playerStatsRows.filter(
      (ps) =>
        ps.WEEK === match.week &&
        belongsToMatchTeam(ps, match.away, match.away_team)
    );

    const fullMatch: MatchStats = {
      ...match,
      stadium: gen?.stadium ?? "",
      referee: gen?.referee ?? "",
      weather: gen?.weather ?? "",
      date: gen?.date ? new Date(gen.date) : new Date(),
      match_time: (gen as any)?.match_time ?? match.match_time ?? "21:00",
      unlock_at: (gen as any)?.unlock_at ?? match.unlock_at ?? null,
      is_neutral: (gen as any)?.is_neutral ?? false,
      home_player_stats: sortPlayersByRole(homePlayerStats, match.home_minuti),
      away_player_stats: sortPlayersByRole(awayPlayerStats, match.away_minuti),
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

// ============================================================================
// OFFSEASON & EVENTI STAGIONALI (an_league_events)
// ============================================================================

export async function fetchSeasonEvents(
  stag: number
): Promise<LeagueCalendarEvent[]> {
  const { data, error } = await supabase
    .from("an_league_events")
    .select("*")
    .eq("stagione", stag)
    .order("event_date", { ascending: true, nullsFirst: false })
    .order("event_order", { ascending: true });

  if (error) {
    console.error("Error fetching season events:", error);
    return [];
  }

  return (data as LeagueCalendarEvent[]) ?? [];
}

export async function upsertLeagueEvent(payload: {
  id?: number | null;
  stagione: number;
  evento: string;
  tipo: string;
  event_date: string | null;
  note?: string | null;
}): Promise<{ success: boolean; id?: number; error?: string }> {
  try {
    const { data, error } = await supabase.rpc("rpc_admin_upsert_league_event", {
      p_id: payload.id ?? null,
      p_stagione: payload.stagione,
      p_evento: payload.evento,
      p_tipo: payload.tipo,
      p_event_date: payload.event_date || null,
      p_note: payload.note ?? null,
    });

    if (error) {
      return { success: false, error: error.message };
    }
    const res = data as { success: boolean; id?: number; error?: string };
    return res;
  } catch (err: any) {
    return { success: false, error: err?.message || "Errore salvataggio evento" };
  }
}

export async function deleteLeagueEvent(
  id: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.rpc("rpc_admin_delete_league_event", {
      p_id: id,
    });
    if (error) {
      return { success: false, error: error.message };
    }
    return data as { success: boolean; error?: string };
  } catch (err: any) {
    return { success: false, error: err?.message || "Errore eliminazione evento" };
  }
}

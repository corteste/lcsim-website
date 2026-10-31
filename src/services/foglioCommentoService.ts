import { supabase } from "@/supabaseClient";
import { Player } from "@/types/player";
import { EA_FC25_FORMATIONS } from "@/pages/Tattica";

export interface DeadlineInfo {
  hasDeadline: boolean;
  deadlineIso: string | null;
  isForceClosed: boolean;
  isExpired: boolean;
  isLockedForManagers: boolean;
  description: string | null;
}

export interface SheetMatch {
  id: string;
  stag: number;
  week: number;
  homeTeamId: string;
  homeTeamName: string;
  homeTeamAbbr: string;
  awayTeamId: string;
  awayTeamName: string;
  awayTeamAbbr: string;
  stadium?: string;
  referee?: string;
  weather?: string;
  date?: string;
  isPlayed: boolean;
  homeScore?: number;
  awayScore?: number;
}

export interface SheetTeamFormation {
  teamId: string;
  teamName: string;
  teamAbbr: string;
  formationId: string;
  formationName: string;
  starters: (Player | null)[];
  bench: Player[];
  source: "match_stats" | "history" | "active_tactic" | "roster_fallback";
}

export interface MatchSheetData {
  match: SheetMatch;
  homeFormation: SheetTeamFormation;
  awayFormation: SheetTeamFormation;
  deadlineInfo: DeadlineInfo;
}

const ROLE_PRIORITY: Record<string, number> = {
  POR: 0, DC: 1, TD: 2, TS: 3, CDC: 4, CC: 5, ED: 6, ES: 7, COC: 8, AD: 9, AS: 10, AT: 11, ATT: 12,
};

function sortPlayersByRole(players: Player[]): Player[] {
  return [...players].sort((a, b) => {
    const prioA = ROLE_PRIORITY[a.Posiz] ?? 99;
    const prioB = ROLE_PRIORITY[b.Posiz] ?? 99;
    if (prioA !== prioB) return prioA - prioB;
    return (Number(b.OVR) || 0) - (Number(a.OVR) || 0);
  });
}

/**
 * Recupera le stagioni e giornate disponibili per la consultazione
 */
export async function fetchAvailableSeasonsAndWeeks(): Promise<{
  seasons: number[];
  weeksBySeason: Record<number, number[]>;
}> {
  try {
    const { data: scheduleRows } = await supabase
      .from("an_schedule")
      .select("stag, week")
      .order("stag", { ascending: false })
      .order("week", { ascending: true });

    const { data: deadlineRows } = await supabase
      .from("league_deadlines")
      .select("stag, week")
      .order("stag", { ascending: false });

    const seasonSet = new Set<number>();
    const weeksMap: Record<number, Set<number>> = {};

    (scheduleRows || []).forEach((r) => {
      seasonSet.add(r.stag);
      if (!weeksMap[r.stag]) weeksMap[r.stag] = new Set();
      weeksMap[r.stag].add(r.week);
    });

    (deadlineRows || []).forEach((r) => {
      seasonSet.add(r.stag);
      if (!weeksMap[r.stag]) weeksMap[r.stag] = new Set();
      weeksMap[r.stag].add(r.week);
    });

    const seasons = Array.from(seasonSet).sort((a, b) => b - a);
    const weeksBySeason: Record<number, number[]> = {};

    seasons.forEach((s) => {
      const weeks = Array.from(weeksMap[s] || []).sort((a, b) => a - b);
      weeksBySeason[s] = weeks.length > 0 ? weeks : [1];
    });

    return { seasons, weeksBySeason };
  } catch (err) {
    console.error("Errore fetchAvailableSeasonsAndWeeks:", err);
    return { seasons: [10], weeksBySeason: { 10: [1, 2, 3, 4, 5, 6, 7, 8, 9] } };
  }
}

/**
 * Recupera lo stato della scadenza di consegna formazioni per una data giornata
 */
export async function fetchDeadlineInfo(stag: number, week: number): Promise<DeadlineInfo> {
  try {
    const { data, error } = await supabase
      .from("league_deadlines")
      .select("*")
      .eq("stag", stag)
      .eq("week", week)
      .maybeSingle();

    if (error || !data) {
      // Se non esiste record di deadline (es. stagioni passate), consideriamo formazioni sbloccate
      return {
        hasDeadline: false,
        deadlineIso: null,
        isForceClosed: false,
        isExpired: true,
        isLockedForManagers: false,
        description: null,
      };
    }

    const now = new Date();
    const deadlineDate = data.deadline ? new Date(data.deadline) : null;
    const isExpired = deadlineDate ? now >= deadlineDate : false;
    const isForceClosed = Boolean(data.is_force_closed);

    // Bloccato per i normali manager finché non è scaduto e non è forzatamente chiuso
    const isLockedForManagers = !isExpired && !isForceClosed;

    return {
      hasDeadline: true,
      deadlineIso: data.deadline,
      isForceClosed,
      isExpired,
      isLockedForManagers,
      description: data.description,
    };
  } catch (err) {
    console.error("Errore fetchDeadlineInfo:", err);
    return {
      hasDeadline: false,
      deadlineIso: null,
      isForceClosed: false,
      isExpired: true,
      isLockedForManagers: false,
      description: null,
    };
  }
}

/**
 * Recupera le partite programmate per una determinata stagione e giornata
 */
export async function fetchWeekMatches(stag: number, week: number): Promise<SheetMatch[]> {
  try {
    // 1. Tabella an_team per nomi completi e abbreviazioni
    const { data: teamsData } = await supabase
      .from("an_team")
      .select("TEAM_ID, NAME, NAME_ABBR")
      .eq("ACTIVE", true);

    const teamMap = new Map<string, { name: string; abbr: string }>();
    (teamsData || []).forEach((t) => {
      teamMap.set(t.TEAM_ID, { name: t.NAME, abbr: t.NAME_ABBR || t.TEAM_ID });
    });

    // 2. Partite da view_team_stats o an_schedule
    const { data: viewStats } = await supabase
      .from("view_team_stats")
      .select("home, away, home_gol, away_gol, home_minuti, home_team, away_team, date, stadium, weather, referee")
      .eq("stag", stag)
      .eq("week", week);

    if (viewStats && viewStats.length > 0) {
      return viewStats.map((m) => {
        const homeInfo = teamMap.get(m.home) || { name: m.home_team || m.home, abbr: m.home };
        const awayInfo = teamMap.get(m.away) || { name: m.away_team || m.away, abbr: m.away };
        const isPlayed = m.home_minuti !== null && Number(m.home_minuti) > 0;

        return {
          id: `${stag}-${week}-${m.home}-${m.away}`,
          stag,
          week,
          homeTeamId: m.home,
          homeTeamName: homeInfo.name,
          homeTeamAbbr: homeInfo.abbr,
          awayTeamId: m.away,
          awayTeamName: awayInfo.name,
          awayTeamAbbr: awayInfo.abbr,
          stadium: m.stadium,
          referee: m.referee,
          weather: m.weather,
          date: m.date,
          isPlayed,
          homeScore: isPlayed ? Number(m.home_gol) : undefined,
          awayScore: isPlayed ? Number(m.away_gol) : undefined,
        };
      });
    }

    // 3. Fallback su an_schedule
    const { data: scheduleData } = await supabase
      .from("an_schedule")
      .select("home, away, stadium, referee, weather, date, standings_processed")
      .eq("stag", stag)
      .eq("week", week);

    if (scheduleData && scheduleData.length > 0) {
      return scheduleData.map((m) => {
        const homeInfo = teamMap.get(m.home) || { name: m.home, abbr: m.home };
        const awayInfo = teamMap.get(m.away) || { name: m.away, abbr: m.away };

        return {
          id: `${stag}-${week}-${m.home}-${m.away}`,
          stag,
          week,
          homeTeamId: m.home,
          homeTeamName: homeInfo.name,
          homeTeamAbbr: homeInfo.abbr,
          awayTeamId: m.away,
          awayTeamName: awayInfo.name,
          awayTeamAbbr: awayInfo.abbr,
          stadium: m.stadium,
          referee: m.referee,
          weather: m.weather,
          date: m.date,
          isPlayed: Boolean(m.standings_processed),
        };
      });
    }

    // 4. Se la stagione non ha ancora partite in an_schedule (es. Stagione 11 pre-campionato):
    // Accoppia le 12 squadre attive di Serie A per consentire l'anteprima del Foglio Commento
    const activeTeams = teamsData || [];
    if (activeTeams.length >= 2) {
      const generatedMatches: SheetMatch[] = [];
      for (let i = 0; i < activeTeams.length; i += 2) {
        if (i + 1 < activeTeams.length) {
          const homeT = activeTeams[i];
          const awayT = activeTeams[i + 1];
          generatedMatches.push({
            id: `${stag}-${week}-${homeT.TEAM_ID}-${awayT.TEAM_ID}`,
            stag,
            week,
            homeTeamId: homeT.TEAM_ID,
            homeTeamName: homeT.NAME,
            homeTeamAbbr: homeT.NAME_ABBR || homeT.TEAM_ID,
            awayTeamId: awayT.TEAM_ID,
            awayTeamName: awayT.NAME,
            awayTeamAbbr: awayT.NAME_ABBR || awayT.TEAM_ID,
            stadium: `Stadio di ${homeT.NAME_ABBR || homeT.NAME}`,
            isPlayed: false,
          });
        }
      }
      return generatedMatches;
    }

    return [];
  } catch (err) {
    console.error("Errore fetchWeekMatches:", err);
    return [];
  }
}

/**
 * Risolve la formazione ufficiale (11 titolari + panchina) per un team
 */
export async function fetchTeamSheetFormation(
  teamId: string,
  stag: number,
  week: number,
  isPlayed: boolean
): Promise<SheetTeamFormation> {
  try {
    // 1. Info squadra
    const { data: teamData } = await supabase
      .from("an_team")
      .select("NAME, NAME_ABBR")
      .eq("TEAM_ID", teamId)
      .maybeSingle();

    const teamName = teamData?.NAME || teamId;
    const teamAbbr = teamData?.NAME_ABBR || teamId;

    // 2. Tutta la rosa del team da an_player per lookup
    const { data: rosterData } = await supabase
      .from("an_player")
      .select("*")
      .eq("Squadra", teamId);

    const roster = (rosterData || []) as Player[];
    const playerMap = new Map<number, Player>();
    roster.forEach((p) => playerMap.set(Number(p.ID), p));

    // A) Se la partita è già stata giocata: estrai i calciatori scesi in campo da view_player_stats
    if (isPlayed) {
      const { data: matchStats } = await supabase
        .from("view_player_stats")
        .select("ID, Nome, Cognome, Posiz, OVR, MINUTI, NumeroMaglia, VOTO")
        .eq("STAG", stag)
        .eq("WEEK", week)
        .eq("Squadra", teamId)
        .order("MINUTI", { ascending: false });

      if (matchStats && matchStats.length >= 11) {
        // Titolari: i primi 11 per minutaggio
        const rawStarters = matchStats.slice(0, 11).map((ps) => playerMap.get(Number(ps.ID)) || (ps as unknown as Player));
        const rawBench = matchStats.slice(11).map((ps) => playerMap.get(Number(ps.ID)) || (ps as unknown as Player));

        // Determina un modulo coerente
        const defCount = rawStarters.filter((p) => ["DC", "TD", "TS"].includes(p?.Posiz || "")).length;
        const midCount = rawStarters.filter((p) => ["CDC", "CC", "ED", "ES", "COC"].includes(p?.Posiz || "")).length;
        const attCount = rawStarters.filter((p) => ["ATT", "AS", "AD"].includes(p?.Posiz || "")).length;

        const guessId = `${defCount}-${midCount}-${attCount}`;
        const formDef = EA_FC25_FORMATIONS.find((f) => f.id === guessId) || EA_FC25_FORMATIONS[0];

        // Mappa i titolari ordinati per ruolo alle posizioni del modulo
        const sortedStarters = sortPlayersByRole(rawStarters.filter((p): p is Player => Boolean(p)));
        const startersAligned: (Player | null)[] = formDef.positions.map((_, idx) => sortedStarters[idx] || null);

        return {
          teamId,
          teamName,
          teamAbbr,
          formationId: formDef.id,
          formationName: formDef.name,
          starters: startersAligned,
          bench: sortPlayersByRole(rawBench.filter((p): p is Player => Boolean(p))),
          source: "match_stats",
        };
      }
    }

    // B) Se non ancora giocata: controlla se presente in team_formation_history per (team_id, stag, week)
    const { data: historyRow } = await supabase
      .from("team_formation_history")
      .select("*")
      .eq("team_id", teamId)
      .eq("stag", stag)
      .eq("week", week)
      .order("created_at", { ascending: false })
      .maybeSingle();

    if (historyRow) {
      const rawStarters = (historyRow.starters || []) as (number | null)[];
      const rawBench = (historyRow.bench_order || []) as number[];

      const starters = rawStarters.map((id) => (id ? playerMap.get(Number(id)) || null : null));
      const bench = rawBench.map((id) => playerMap.get(Number(id))).filter((p): p is Player => Boolean(p));

      const formDef = EA_FC25_FORMATIONS.find((f) => f.id === historyRow.formation) || EA_FC25_FORMATIONS[0];

      return {
        teamId,
        teamName,
        teamAbbr,
        formationId: formDef.id,
        formationName: formDef.name,
        starters,
        bench,
        source: "history",
      };
    }

    // C) Controlla la formazione attiva su an_team_tactic
    const { data: activeTactic } = await supabase
      .from("an_team_tactic")
      .select("*")
      .eq("team_id", teamId)
      .maybeSingle();

    if (activeTactic) {
      const rawStarters = (activeTactic.starters || []) as (number | null)[];
      const rawBench = (activeTactic.bench_order || []) as number[];

      const starters = rawStarters.map((id) => (id ? playerMap.get(Number(id)) || null : null));
      const bench = rawBench.map((id) => playerMap.get(Number(id))).filter((p): p is Player => Boolean(p));

      const formDef = EA_FC25_FORMATIONS.find((f) => f.id === activeTactic.formation) || EA_FC25_FORMATIONS[0];

      return {
        teamId,
        teamName,
        teamAbbr,
        formationId: formDef.id,
        formationName: formDef.name,
        starters,
        bench,
        source: "active_tactic",
      };
    }

    // D) Fallback automatico su rosa completa del club
    const sortedRoster = sortPlayersByRole(roster);
    const formDef = EA_FC25_FORMATIONS.find((f) => f.id === "4-3-3") || EA_FC25_FORMATIONS[0];

    const starters = formDef.positions.map((_, idx) => sortedRoster[idx] || null);
    const bench = sortedRoster.slice(11);

    return {
      teamId,
      teamName,
      teamAbbr,
      formationId: formDef.id,
      formationName: formDef.name,
      starters,
      bench,
      source: "roster_fallback",
    };
  } catch (err) {
    console.error(`Errore fetchTeamSheetFormation per ${teamId}:`, err);
    const formDef = EA_FC25_FORMATIONS[0];
    return {
      teamId,
      teamName: teamId,
      teamAbbr: teamId,
      formationId: formDef.id,
      formationName: formDef.name,
      starters: formDef.positions.map(() => null),
      bench: [],
      source: "roster_fallback",
    };
  }
}

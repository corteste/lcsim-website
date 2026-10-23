import { supabase } from "@/supabaseClient";
import { Player } from "@/types/player";
import { PLAYER_TABLE, TEAM_TABLE } from "@/constants/App";
import { EA_FC25_FORMATIONS } from "@/pages/Tattica";

export interface OpponentMatchInfo {
  week: number;
  stag: number;
  isHome: boolean;
  myTeamId: string;
  opponentTeamId: string;
  opponentTeamName: string;
  opponentTeamAbbr: string;
  stadium: string;
  date?: string;
  weather?: string;
  referee?: string;
}

export interface OpponentRecentMatch {
  week: number;
  stag: number;
  isHome: boolean;
  opponentVsId: string;
  opponentVsName: string;
  homeGoals: number;
  awayGoals: number;
  result: "V" | "N" | "P";
  date?: string;
}

export interface OpponentFormationItem {
  id: string;
  source: "tactic_history" | "active_tactic" | "match_stats";
  title: string;
  formationId: string;
  formationName: string;
  date?: string;
  week?: number;
  starters: (Player | null)[];
  bench: Player[];
}

export interface OpponentScoutData {
  team: {
    team_id: string;
    name: string;
    name_abbr: string;
    coach?: string;
    stadium?: string;
  };
  standings?: {
    rank: number;
    points: number;
    played: number;
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDiff: number;
  };
  roster: Player[];
  recentMatches: OpponentRecentMatch[];
  form: ("V" | "N" | "P")[];
  formations: OpponentFormationItem[];
}

// Role priority for sorting players
const ROLE_PRIORITY: Record<string, number> = {
  POR: 0, DC: 1, TD: 2, TS: 3, CDC: 4, CC: 5, ED: 6, ES: 7, COC: 8, AD: 9, AS: 10, AT: 11, ATT: 12
};

/**
 * Trova il prossimo incontro in programma per la squadra del manager.
 */
export async function findNextOpponentMatch(myTeamId: string): Promise<OpponentMatchInfo | null> {
  if (!myTeamId) return null;

  try {
    // 1. Cerca nella tabella view_team_stats
    const { data: scheduleRows, error: sErr } = await supabase
      .from("view_team_stats")
      .select("stag, week, home, away, home_gol, away_gol, home_minuti, home_team, away_team")
      .or(`home.eq.${myTeamId},away.eq.${myTeamId}`)
      .order("stag", { ascending: false })
      .order("week", { ascending: true });

    if (sErr) {
      console.error("findNextOpponentMatch view_team_stats error:", sErr);
      return null;
    }
    if (!scheduleRows || scheduleRows.length === 0) return null;

    // Filtra partite della stagione più recente disponibile
    const latestSeason = scheduleRows[0].stag;
    const seasonMatches = scheduleRows.filter((m) => m.stag === latestSeason);

    // Cerca il primo incontro non ancora giocato (home_minuti null o 0)
    let nextMatch = seasonMatches.find((m) => !m.home_minuti || Number(m.home_minuti) === 0);

    // Se tutte le partite sono state giocate, prendi l'ultima giocata come riferimento
    if (!nextMatch) {
      nextMatch = seasonMatches[seasonMatches.length - 1];
    }

    const isHome = nextMatch.home === myTeamId;
    const opponentTeamId = isHome ? nextMatch.away : nextMatch.home;

    // Recupera anagrafica dettagliata della partita da an_schedule
    const [scheduleDetailsRes, opponentTeamRes] = await Promise.all([
      supabase
        .from("an_schedule")
        .select("stadium, referee, weather, date")
        .eq("stag", nextMatch.stag)
        .eq("week", nextMatch.week)
        .eq("home", nextMatch.home)
        .eq("away", nextMatch.away)
        .maybeSingle(),
      supabase
        .from(TEAM_TABLE)
        .select("TEAM_ID, NAME, NAME_ABBR")
        .eq("TEAM_ID", opponentTeamId)
        .maybeSingle(),
    ]);

    const scheduleDetails = scheduleDetailsRes.data;
    const opponentTeam = opponentTeamRes.data;

    return {
      week: nextMatch.week,
      stag: nextMatch.stag,
      isHome,
      myTeamId,
      opponentTeamId,
      opponentTeamName: opponentTeam?.NAME || (isHome ? nextMatch.away_team : nextMatch.home_team) || opponentTeamId,
      opponentTeamAbbr: opponentTeam?.NAME_ABBR || opponentTeamId,
      stadium: scheduleDetails?.stadium || "Stadio Comunale",
      date: scheduleDetails?.date || undefined,
      weather: scheduleDetails?.weather || undefined,
      referee: scheduleDetails?.referee || undefined,
    };
  } catch (err) {
    console.error("findNextOpponentMatch error:", err);
    return null;
  }
}

/**
 * Recupera l'intero report scout della squadra avversaria:
 * anagrafica, rosa completa, ultimi match con forma (V, N, P) e ultime 3 formazioni storicizzate.
 */
export async function fetchOpponentScoutData(opponentTeamId: string): Promise<OpponentScoutData | null> {
  if (!opponentTeamId) return null;

  try {
    // 1. Dati base squadra, classifica e mercato giocatori
    const [teamRes, standingsRes, rosterRes, marketRes] = await Promise.all([
      supabase.from(TEAM_TABLE).select('*').eq("TEAM_ID", opponentTeamId).maybeSingle(),
      supabase.from("an_standings").select('*').order("stag", { ascending: false }),
      supabase.from(PLAYER_TABLE).select('*').eq("Squadra", opponentTeamId),
      supabase.from("as_player_market").select("PLAYER_ID_FK, Status"),
    ]);

    const teamData = teamRes.data;
    if (!teamData) return null;

    // Risoluzione posizione in classifica (stagione più recente)
    const rawStandings = (standingsRes.data || []) as any[];
    const maxStag = rawStandings[0]?.stag;
    const currentStandings = maxStag ? rawStandings.filter((s) => s.stag === maxStag) : rawStandings;

    currentStandings.sort((a, b) => {
      const ptA = Number(a.points ?? 0);
      const ptB = Number(b.points ?? 0);
      if (ptB !== ptA) return ptB - ptA;
      const drA = Number(a.goal_difference ?? 0);
      const drB = Number(b.goal_difference ?? 0);
      return drB - drA;
    });

    const rankIdx = currentStandings.findIndex((s) => {
      const tid = typeof s.team === "object" ? s.team?.TEAM_ID : s.team;
      return tid === opponentTeamId;
    });

    const standingRow = rankIdx >= 0 ? currentStandings[rankIdx] : null;
    const standingsInfo = standingRow
      ? {
          rank: rankIdx + 1,
          points: Number(standingRow.points ?? 0),
          played: Number(standingRow.games_played ?? 0),
          wins: Number(standingRow.win ?? standingRow.won ?? 0),
          draws: Number(standingRow.draws ?? standingRow.draw ?? 0),
          losses: Number(standingRow.loss ?? standingRow.lost ?? 0),
          goalsFor: Number(standingRow.goal_made ?? 0),
          goalsAgainst: Number(standingRow.goal_conceded ?? standingRow.goal_suffered ?? 0),
          goalDiff: Number(standingRow.goal_difference ?? 0),
        }
      : undefined;

    // Mappa status di mercato
    const marketMap = new Map<number, string>();
    (marketRes.data || []).forEach((m: any) => {
      if (m.PLAYER_ID_FK && m.Status) {
        marketMap.set(Number(m.PLAYER_ID_FK), m.Status);
      }
    });

    // Roster arricchito con status di mercato e ordinato per ruolo poi per OVR
    const rawRoster = ((rosterRes.data || []) as Player[]).map((p) => {
      const st = marketMap.get(Number(p.ID));
      return {
        ...p,
        MarketStatus: (st ? { Status: st } : undefined) as any,
      };
    });

    const roster = rawRoster.sort((a, b) => {
      const rpA = ROLE_PRIORITY[a.Posiz] ?? 99;
      const rpB = ROLE_PRIORITY[b.Posiz] ?? 99;
      if (rpA !== rpB) return rpA - rpB;
      return (Number(b.OVR) || 0) - (Number(a.OVR) || 0);
    });

    const playerMap = new Map<number, Player>();
    rawRoster.forEach((p) => playerMap.set(Number(p.ID), p));

    // 2. Ultimi incontri giocati & Calcolo Forma (V, N, P)
    const { data: playedMatchesRows, error: pmErr } = await supabase
      .from("view_team_stats")
      .select("stag, week, home, away, home_gol, away_gol, home_minuti, home_team, away_team")
      .or(`home.eq.${opponentTeamId},away.eq.${opponentTeamId}`)
      .not("home_minuti", "is", null)
      .gt("home_minuti", 0)
      .order("stag", { ascending: false })
      .order("week", { ascending: false })
      .limit(6);

    if (pmErr) {
      console.error("fetchOpponentScoutData playedMatchesRows error:", pmErr);
    }

    const recentMatches: OpponentRecentMatch[] = [];
    const form: ("V" | "N" | "P")[] = [];

    (playedMatchesRows || []).forEach((m) => {
      const isHome = m.home === opponentTeamId;
      const vsId = isHome ? m.away : m.home;
      const vsName = isHome ? (m.away_team || m.away) : (m.home_team || m.home);
      const myGoals = isHome ? Number(m.home_gol) : Number(m.away_gol);
      const vsGoals = isHome ? Number(m.away_gol) : Number(m.home_gol);

      let result: "V" | "N" | "P" = "N";
      if (myGoals > vsGoals) result = "V";
      else if (myGoals < vsGoals) result = "P";

      recentMatches.push({
        week: m.week,
        stag: m.stag,
        isHome,
        opponentVsId: vsId,
        opponentVsName: vsName,
        homeGoals: Number(m.home_gol) || 0,
        awayGoals: Number(m.away_gol) || 0,
        result,
        date: m.date || undefined,
      });
      form.push(result);
    });

    // 3. Ultime 3 formazioni inserite (o fallback partite di campionato)
    const formations: OpponentFormationItem[] = [];

    // A) Recupera da team_formation_history
    const { data: historyRows } = await supabase
      .from("team_formation_history")
      .select("*")
      .eq("team_id", opponentTeamId)
      .order("created_at", { ascending: false })
      .limit(3);

    if (historyRows && historyRows.length > 0) {
      for (let i = 0; i < historyRows.length; i++) {
        const row = historyRows[i];
        const rawStarters = (row.starters || []) as (number | null)[];
        const rawBench = (row.bench_order || []) as number[];

        const starters = rawStarters.map((id) => (id ? playerMap.get(Number(id)) ?? null : null));
        const bench = rawBench.map((id) => playerMap.get(Number(id))).filter((p): p is Player => Boolean(p));

        const formDef = EA_FC25_FORMATIONS.find((f) => f.id === row.formation) || EA_FC25_FORMATIONS[0];

        formations.push({
          id: row.id,
          source: "tactic_history",
          title: `Formazione Storicizzata #${i + 1}`,
          formationId: formDef.id,
          formationName: formDef.name,
          date: row.created_at,
          week: row.week || undefined,
          starters,
          bench,
        });
      }
    }

    // B) Se meno di 3 formazioni, controlla la formazione attiva su an_team_tactic
    if (formations.length < 3) {
      const { data: activeTactic } = await supabase
        .from("an_team_tactic")
        .select("*")
        .eq("team_id", opponentTeamId)
        .maybeSingle();

      if (activeTactic) {
        const rawStarters = (activeTactic.starters || []) as (number | null)[];
        const rawBench = (activeTactic.bench_order || []) as number[];

        const starters = rawStarters.map((id) => (id ? playerMap.get(Number(id)) ?? null : null));
        const bench = rawBench.map((id) => playerMap.get(Number(id))).filter((p): p is Player => Boolean(p));

        const formDef = EA_FC25_FORMATIONS.find((f) => f.id === activeTactic.formation) || EA_FC25_FORMATIONS[0];

        // Evita duplicati identici se già salvata in history
        const isDuplicate = formations.some((f) => f.formationId === formDef.id && f.starters.length === starters.length);
        if (!isDuplicate) {
          formations.push({
            id: `active-${opponentTeamId}`,
            source: "active_tactic",
            title: "Ultima Formazione Attiva Salvata",
            formationId: formDef.id,
            formationName: formDef.name,
            date: activeTactic.updated_at,
            starters,
            bench,
          });
        }
      }
    }

    // C) Fallback sulle formazioni scese in campo nelle ultime partite di campionato (VIEW_PLAYER_STATS)
    if (formations.length < 3 && recentMatches.length > 0) {
      for (const m of recentMatches) {
        if (formations.length >= 3) break;

        const { data: matchPlayerStats } = await supabase
          .from("VIEW_PLAYER_STATS")
          .select("ID, Nome, Cognome, Posiz, OVR, MINUTI, NumeroMaglia")
          .eq("STAG", m.stag)
          .eq("WEEK", m.week)
          .eq("Squadra", opponentTeamId)
          .order("MINUTI", { ascending: false });

        if (matchPlayerStats && matchPlayerStats.length >= 11) {
          // I primi 11 per minutaggio sono i titolari
          const matchStarters = matchPlayerStats.slice(0, 11).map((ps) => playerMap.get(Number(ps.ID)) ?? (ps as unknown as Player));
          const matchBench = matchPlayerStats.slice(11).map((ps) => playerMap.get(Number(ps.ID)) ?? (ps as unknown as Player));

          // Calcola il modulo rilevato
          const defCount = matchStarters.filter((p) => ["DC", "TD", "TS"].includes(p?.Posiz || "")).length;
          const midCount = matchStarters.filter((p) => ["CDC", "CC", "ED", "ES", "COC"].includes(p?.Posiz || "")).length;
          const attCount = matchStarters.filter((p) => ["ATT", "AT", "AS", "AD"].includes(p?.Posiz || "")).length;
          const detectedModule = `${defCount || 4}-${midCount || 4}-${attCount || 2}`;

          const matchedDef = EA_FC25_FORMATIONS.find((f) => f.id.startsWith(detectedModule)) || EA_FC25_FORMATIONS[0];

          formations.push({
            id: `match-s${m.stag}-w${m.week}-${opponentTeamId}`,
            source: "match_stats",
            title: `Formazione in Campo - Giornata ${m.week} (Stagione ${m.stag})`,
            formationId: matchedDef.id,
            formationName: `${detectedModule} (Partita vs ${m.opponentVsName})`,
            date: m.date,
            week: m.week,
            starters: matchStarters,
            bench: matchBench,
          });
        }
      }
    }

    return {
      team: {
        team_id: teamData.TEAM_ID,
        name: teamData.NAME,
        name_abbr: teamData.NAME_ABBR || teamData.NAME,
        coach: teamData.COACH,
        stadium: teamData.STADIUM,
      },
      standings: standingsInfo,
      roster,
      recentMatches,
      form,
      formations,
    };
  } catch (err) {
    console.error("fetchOpponentScoutData error:", err);
    return null;
  }
}

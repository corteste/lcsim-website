import { supabase } from "@/supabaseClient";
import { Player } from "@/types/player";

export interface MatchStatRaw {
  STAG: number;
  WEEK: number;
  ID: number;
  VOTO: number | null;
  MINUTI: number | null;
}

export interface MatchXpBreakdown {
  week: number;
  isPlayoff: boolean;
  minuti: number;
  voto: number | null;
  xpMinuti: number;
  xpVoto: number;
  matchXp: number;
  isCountedInPlayoff?: boolean;
}

export interface PlayerSeasonXpSummary {
  playerId: number;
  playerName: string;
  playerRole: string;
  teamId: string;
  age: number;
  isYouth: boolean; // 24 or 25 years old
  rsMatchesCount: number;
  poMatchesCount: number;
  totalMinutes: number;
  averageGrade: number | null;
  rsXp: number;
  poXp: number;
  baseSeasonXp: number;
  youthBonusXp: number;
  seasonMultiplier: number;
  finalSeasonXp: number;
  matches: MatchXpBreakdown[];
}

export interface SeasonFormatConfig {
  regularSeasonWeeks: number;
  playoffBestMatchesToKeep: number;
  targetLeagueXp: number;
  teamsCount: number;
}

/**
 * Restituisce i parametri di formato della stagione:
 * - Dalla Stagione 11 in poi (12 squadre): 11 partite di Regular Season, 3 migliori match di Playoff, target 24.000 XP.
 * - Fino alla Stagione 10 (10 squadre): 9 partite di Regular Season, 2 migliori match di Playoff, target 20.000 XP.
 */
export function getSeasonFormatConfig(season: number): SeasonFormatConfig {
  if (season >= 11) {
    return {
      regularSeasonWeeks: 11,
      playoffBestMatchesToKeep: 3,
      targetLeagueXp: 24000,
      teamsCount: 12,
    };
  }
  return {
    regularSeasonWeeks: 9,
    playoffBestMatchesToKeep: 2,
    targetLeagueXp: 20000,
    teamsCount: 10,
  };
}

/**
 * Formula ufficiale LCSIM per il calcolo degli XP della singola giornata:
 * 1. XP Minuti:
 *    - se il giocatore non è entrato in campo (0 min) -> 0 XP
 *    - altrimenti 1 XP ogni 20 min giocati (arrotondamento per eccesso all'unità), max 5 XP
 * 2. XP Voto:
 *    - se il giocatore non ha ricevuto voto -> 2 XP
 *    - altrimenti (voto - 3) * 2, arrotondato per difetto all'unità
 */
export function calcSingleMatchXp(
  minuti: number | null | undefined,
  voto: number | null | undefined
): { xpMin: number; xpVoto: number; totalXp: number } {
  const m = Number(minuti) || 0;

  // 1. Minuti giocati
  let xpMin = 0;
  if (m > 0) {
    xpMin = Math.min(5, Math.ceil(m / 20));
  }

  // 2. Voto conseguito
  let xpVoto = 2;
  const v = voto !== null && voto !== undefined ? Number(voto) : null;
  if (v !== null && !isNaN(v) && v > 0) {
    xpVoto = Math.max(0, Math.floor((v - 3) * 2));
  }

  return {
    xpMin,
    xpVoto,
    totalXp: xpMin + xpVoto,
  };
}

/**
 * Calcola il riepilogo stagionale degli XP per un singolo calciatore
 */
export function computePlayerSeasonXp(
  player: {
    ID: number | string;
    Nome?: string;
    Cognome?: string;
    Posiz?: string;
    Squadra?: string | null;
    Età?: number | null;
  },
  matchRows: MatchStatRaw[],
  season: number,
  seasonMultiplier = 1.0
): PlayerSeasonXpSummary {
  const config = getSeasonFormatConfig(season);
  const age = Number(player.Età) || 0;
  const isYouth = age === 24 || age === 25;

  const rsMatches: MatchXpBreakdown[] = [];
  const poMatches: MatchXpBreakdown[] = [];

  let totalMinutes = 0;
  let gradeSum = 0;
  let gradeCount = 0;

  for (const row of matchRows) {
    const minuti = Number(row.MINUTI) || 0;
    const voto = row.VOTO !== null && row.VOTO !== undefined ? Number(row.VOTO) : null;
    const { xpMin, xpVoto, totalXp } = calcSingleMatchXp(minuti, voto);

    totalMinutes += minuti;
    if (voto !== null && !isNaN(voto) && voto > 0) {
      gradeSum += voto;
      gradeCount++;
    }

    const isPlayoff = row.WEEK > config.regularSeasonWeeks;
    const item: MatchXpBreakdown = {
      week: row.WEEK,
      isPlayoff,
      minuti,
      voto,
      xpMinuti: xpMin,
      xpVoto,
      matchXp: totalXp,
    };

    if (isPlayoff) {
      poMatches.push(item);
    } else {
      rsMatches.push(item);
    }
  }

  // Somma di tutte le partite di Regular Season
  const rsXp = rsMatches.reduce((acc, m) => acc + m.matchXp, 0);

  // Playoff: si considerano solo le N migliori prestazioni
  const sortedPo = [...poMatches].sort((a, b) => b.matchXp - a.matchXp);
  const topPoCount = config.playoffBestMatchesToKeep;
  const topPoWeeks = new Set(
    sortedPo.slice(0, topPoCount).map((m) => m.week)
  );

  let poXp = 0;
  const markedPoMatches = poMatches.map((m) => {
    const isCounted = topPoWeeks.has(m.week);
    if (isCounted) {
      poXp += m.matchXp;
    }
    return {
      ...m,
      isCountedInPlayoff: isCounted,
    };
  });

  const baseSeasonXp = rsXp + poXp;

  // Moltiplicatore giovani (24 e 25 anni): x1.1
  const youthAdjustedXp = isYouth ? Math.round(baseSeasonXp * 1.1) : baseSeasonXp;
  const youthBonusXp = youthAdjustedXp - baseSeasonXp;

  // Moltiplicatore generale di taratura della stagione
  const finalSeasonXp = Math.round(youthAdjustedXp * seasonMultiplier);

  const allMatchesSorted = [...rsMatches, ...markedPoMatches].sort(
    (a, b) => a.week - b.week
  );

  return {
    playerId: Number(player.ID),
    playerName: `${player.Nome || ""} ${player.Cognome || ""}`.trim(),
    playerRole: player.Posiz || "CEN",
    teamId: player.Squadra || "",
    age,
    isYouth,
    rsMatchesCount: rsMatches.length,
    poMatchesCount: poMatches.length,
    totalMinutes,
    averageGrade: gradeCount > 0 ? Number((gradeSum / gradeCount).toFixed(2)) : null,
    rsXp,
    poXp,
    baseSeasonXp,
    youthBonusXp,
    seasonMultiplier,
    finalSeasonXp,
    matches: allMatchesSorted,
  };
}

/**
 * Recupera le statistiche delle partite da Supabase per una determinata stagione e opzionalmente per un elenco di player ID
 */
export async function fetchSeasonMatchStats(
  season: number,
  playerIds?: number[]
): Promise<MatchStatRaw[]> {
  try {
    let query = supabase
      .from("view_player_stats")
      .select("STAG, WEEK, ID, VOTO, MINUTI")
      .eq("STAG", season)
      .not("STAG", "is", null)
      .order("WEEK", { ascending: true });

    if (playerIds && playerIds.length > 0) {
      query = query.in("ID", playerIds);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as MatchStatRaw[];
  } catch (err) {
    console.error("Errore fetchSeasonMatchStats:", err);
    return [];
  }
}

/**
 * Genera il report XP stagionale completo per una rosa di calciatori
 */
export async function fetchTeamSeasonXpReport(
  season: number,
  teamPlayers: Player[],
  seasonMultiplier = 1.0
): Promise<PlayerSeasonXpSummary[]> {
  if (!teamPlayers || teamPlayers.length === 0) return [];

  const playerIds = teamPlayers.map((p) => Number(p.ID));
  const matchStats = await fetchSeasonMatchStats(season, playerIds);

  const statsByPlayer = new Map<number, MatchStatRaw[]>();
  for (const row of matchStats) {
    const pId = Number(row.ID);
    if (!statsByPlayer.has(pId)) {
      statsByPlayer.set(pId, []);
    }
    statsByPlayer.get(pId)!.push(row);
  }

  const summaries: PlayerSeasonXpSummary[] = teamPlayers.map((p) => {
    const pId = Number(p.ID);
    const rows = statsByPlayer.get(pId) || [];
    return computePlayerSeasonXp(p, rows, season, seasonMultiplier);
  });

  return summaries.sort((a, b) => b.finalSeasonXp - a.finalSeasonXp);
}

/**
 * Calcola il moltiplicatore stagionale suggerito per raggiungere il target della Lega (es. 24.000 XP per 12 squadre)
 */
export function calculateSuggestedSeasonMultiplier(
  allPlayerSummaries: PlayerSeasonXpSummary[],
  targetXp: number
): number {
  const totalBaseWithYouth = allPlayerSummaries.reduce(
    (acc, p) => acc + (p.baseSeasonXp + p.youthBonusXp),
    0
  );
  if (totalBaseWithYouth === 0) return 1.0;
  return Number((targetXp / totalBaseWithYouth).toFixed(3));
}

/**
 * Normalizza la posizione in campo riportata nei tabellini EA FC / LCSIM
 * per ricondurla ai 12 ruoli ufficiali LCSIM (es. DCS -> DC, CCD -> CC, etc.)
 */
export function normalizePitchPosition(pos: string | null | undefined): string | null {
  if (!pos) return null;
  const upper = pos.trim().toUpperCase();
  if (upper === "POR") return "POR";
  if (upper === "TD") return "TD";
  if (upper === "TS") return "TS";
  if (["DC", "DCD", "DCS"].includes(upper)) return "DC";
  if (["CDC", "CDD", "CDS"].includes(upper)) return "CDC";
  if (["CC", "CCD", "CCS"].includes(upper)) return "CC";
  if (upper === "ED") return "ED";
  if (upper === "ES") return "ES";
  if (["COC", "COD", "COS"].includes(upper)) return "COC";
  if (upper === "AD") return "AD";
  if (upper === "AS") return "AS";
  if (["ATT", "ATD", "ATS", "AT", "PUN"].includes(upper)) return "ATT";
  return upper;
}

/**
 * Calcola l'idoneità allo sconto del 50% sul cambio di ruolo principale (#30)
 * per tutti i giocatori della rosa:
 * Regola: se il calciatore è stato titolare (SUB = false) iniziando più della metà
 * delle partite di Regular Season disputate dalla sua squadra nella stagione precedente (referenceSeason)
 * in quella specifica posizione, il cambio ruolo per quella posizione costa 20 XP anziché 40 XP.
 *
 * Restituisce una mappa: { [PlayerID]: { [RUOLO]: boolean } }
 */
export async function fetchTeamRoleDiscountEligibility(
  players: Player[],
  teamId: string,
  referenceSeason: number
): Promise<Record<number, Record<string, boolean>>> {
  if (!players || players.length === 0) return {};

  const formatConfig = getSeasonFormatConfig(referenceSeason);
  const playerIds = players.map((p) => Number(p.ID));
  const result: Record<number, Record<string, boolean>> = {};

  try {
    // 1. Quante partite di Regular Season ha disputato la squadra nella stagione di riferimento
    let teamRsMatches = 0;
    if (teamId) {
      const { data: schedData, error: schedErr } = await supabase
        .from("an_schedule")
        .select("week, standings_processed")
        .eq("stag", referenceSeason)
        .lte("week", formatConfig.regularSeasonWeeks)
        .or("home.eq." + teamId + ",away.eq." + teamId);

      if (!schedErr && schedData && schedData.length > 0) {
        const processed = schedData.filter((m) => m.standings_processed);
        teamRsMatches = processed.length > 0 ? processed.length : schedData.length;
      }
    }

    // Se non troviamo partite a calendario (es. nuova squadra o storico non ancora caricato),
    // fallback sulle giornate canoniche di Regular Season del formato
    if (teamRsMatches === 0) {
      teamRsMatches = formatConfig.regularSeasonWeeks;
    }

    // 2. Recupera le statistiche di tutte le partite di Regular Season dei calciatori per la stagione di riferimento
    const { data: statsData, error: statsErr } = await supabase
      .from("as_player_stat")
      .select("ID, STAG, WEEK, POS_GIOCATA, SUB, MINUTI, VOTO")
      .eq("STAG", referenceSeason)
      .lte("WEEK", formatConfig.regularSeasonWeeks)
      .in("ID", playerIds);

    if (statsErr) {
      console.error("Errore fetchTeamRoleDiscountEligibility:", statsErr);
    }

    const playerById = new Map<number, Player>();
    players.forEach((p) => playerById.set(Number(p.ID), p));

    // 3. Conteggio presenze da titolare per giocatore e per posizione normalizzata
    const starterCountsByPlayer: Record<number, Record<string, number>> = {};
    for (const pId of playerIds) {
      starterCountsByPlayer[pId] = {};
    }

    if (statsData) {
      for (const row of statsData) {
        const pId = Number(row.ID);
        // Titolare: SUB è false o null e ha giocato minuti o ha ricevuto voto
        const isStarter = row.SUB === false || row.SUB === null || !row.SUB;
        const minutes = Number(row.MINUTI) || 0;
        if (isStarter && (minutes > 0 || row.VOTO !== null)) {
          const p = playerById.get(pId);
          const rawPos = row.POS_GIOCATA || p?.Posiz || null;
          const normPos = normalizePitchPosition(rawPos);
          if (normPos) {
            const counts = starterCountsByPlayer[pId] || {};
            counts[normPos] = (counts[normPos] || 0) + 1;
            starterCountsByPlayer[pId] = counts;
          }
        }
      }
    }

    // 4. Soglia: più della metà delle partite di regular season disputate dalla squadra
    const threshold = teamRsMatches / 2;
    const OFFICIAL_ROLES = ["POR", "DC", "TD", "TS", "CDC", "CC", "ED", "ES", "COC", "AD", "AS", "ATT"];

    for (const pId of playerIds) {
      result[pId] = {};
      const counts = starterCountsByPlayer[pId] || {};
      for (const pos of OFFICIAL_ROLES) {
        const stCount = counts[pos] || 0;
        // Strettamente più della metà (> threshold)
        result[pId][pos] = teamRsMatches > 0 && stCount > threshold;
      }
    }

    return result;
  } catch (err) {
    console.error("Errore generico fetchTeamRoleDiscountEligibility:", err);
    return {};
  }
}

/**
 * Calcola l'idoneità allo sconto del 50% sul cambio di ruolo per un singolo calciatore
 */
export async function fetchPlayerRoleDiscountEligibility(
  player: Player,
  referenceSeason: number
): Promise<Record<string, boolean>> {
  const map = await fetchTeamRoleDiscountEligibility([player], player.Squadra || "", referenceSeason);
  return map[Number(player.ID)] || {};
}


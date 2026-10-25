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
      .from("AS_PLAYER_STAT")
      .select("STAG, WEEK, ID, VOTO, MINUTI")
      .eq("STAG", season)
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

import { supabase } from "@/supabaseClient";

export const SERIE_B_PLAYER_STAT_TABLE = "as_serie_b_player_stat";

export interface SerieBMatchStat {
  STAG: string;
  WEEK: number;
  ID: number;
  VOTO: number | null;
  MINUTI: number;
  GOL: number;
  AGOL: number;
  ASST: number;
  TIRI_IN: number;
  TIRI_TOT: number;
  PASS_SI: number;
  PASS_TOT: number;
  DRIB_SI: number;
  DRIB_TOT: number;
  CROS_SI: number;
  CROS_TOT: number;
  CTRS_SI: number;
  CTRS_TOT: number;
  FALLI: number;
  PARA: number;
  GSUB: number;
  GIALLI: number;
  ROSSI: number;
  FGIOCO: number;
  POSS_VINTI: number;
  PALLE_PERSE: number;
  DIST_TOT: number;
  DIST_SCATTO: number;
}

export interface SerieBAggregatedStats {
  matches: number;
  minuti: number;
  avgVoto: number | null;
  gol: number;
  agol: number;
  asst: number;
  tiriIn: number;
  tiriTot: number;
  shotAccuracyPct: number | null;
  passSi: number;
  passTot: number;
  passPct: number | null;
  dribSi: number;
  dribTot: number;
  dribPct: number | null;
  crosSi: number;
  crosTot: number;
  crosPct: number | null;
  ctrsSi: number;
  ctrsTot: number;
  ctrsPct: number | null;
  falli: number;
  para: number;
  gsub: number;
  gialli: number;
  rossi: number;
  fgioco: number;
  possVinti: number;
  pallePerse: number;
  distTot: number;
  distScatto: number;
  seasons: string[];
}

const pct = (made: number, total: number): number | null =>
  total > 0 ? Math.round((made / total) * 100) : null;

export function isSerieBTeamId(teamId?: string | null): boolean {
  if (!teamId) return false;
  return /^B\s*-/i.test(teamId.trim());
}

/**
 * Carica tutte le partite registrate nella tabella Serie B (LCSIM 2) per un determinato ID giocatore/rookie.
 */
export async function fetchSerieBPlayerMatches(
  playerId: number | string
): Promise<SerieBMatchStat[]> {
  const numericId = Number(playerId);
  if (!Number.isFinite(numericId) || numericId <= 0) return [];

  const { data, error } = await supabase
    .from(SERIE_B_PLAYER_STAT_TABLE)
    .select("*")
    .eq("ID", numericId)
    .order("STAG", { ascending: false })
    .order("WEEK", { ascending: true });

  if (error) {
    console.error("Errore fetchSerieBPlayerMatches:", error);
    return [];
  }

  return (data || []) as SerieBMatchStat[];
}

/**
 * Aggrega le statistiche match-by-match di Serie B (LCSIM 2).
 */
export function aggregateSerieBStats(
  rows: SerieBMatchStat[],
  seasonFilter?: string
): SerieBAggregatedStats | null {
  const filtered = seasonFilter
    ? rows.filter((r) => r.STAG === seasonFilter)
    : rows;

  if (filtered.length === 0) return null;

  let minuti = 0;
  let votoSum = 0;
  let votoCount = 0;
  let gol = 0;
  let agol = 0;
  let asst = 0;
  let tiriIn = 0;
  let tiriTot = 0;
  let passSi = 0;
  let passTot = 0;
  let dribSi = 0;
  let dribTot = 0;
  let crosSi = 0;
  let crosTot = 0;
  let ctrsSi = 0;
  let ctrsTot = 0;
  let falli = 0;
  let para = 0;
  let gsub = 0;
  let gialli = 0;
  let rossi = 0;
  let fgioco = 0;
  let possVinti = 0;
  let pallePerse = 0;
  let distTot = 0;
  let distScatto = 0;

  const seasonsSet = new Set<string>();

  for (const r of filtered) {
    seasonsSet.add(r.STAG);
    minuti += r.MINUTI || 0;
    if (typeof r.VOTO === "number" && Number.isFinite(r.VOTO) && r.VOTO > 0) {
      votoSum += r.VOTO;
      votoCount += 1;
    }
    gol += r.GOL || 0;
    agol += r.AGOL || 0;
    asst += r.ASST || 0;
    tiriIn += r.TIRI_IN || 0;
    tiriTot += r.TIRI_TOT || 0;
    passSi += r.PASS_SI || 0;
    passTot += r.PASS_TOT || 0;
    dribSi += r.DRIB_SI || 0;
    dribTot += r.DRIB_TOT || 0;
    crosSi += r.CROS_SI || 0;
    crosTot += r.CROS_TOT || 0;
    ctrsSi += r.CTRS_SI || 0;
    ctrsTot += r.CTRS_TOT || 0;
    falli += r.FALLI || 0;
    para += r.PARA || 0;
    gsub += r.GSUB || 0;
    gialli += r.GIALLI || 0;
    rossi += r.ROSSI || 0;
    fgioco += r.FGIOCO || 0;
    possVinti += r.POSS_VINTI || 0;
    pallePerse += r.PALLE_PERSE || 0;
    distTot += r.DIST_TOT || 0;
    distScatto += r.DIST_SCATTO || 0;
  }

  return {
    matches: filtered.length,
    minuti,
    avgVoto: votoCount > 0 ? Number((votoSum / votoCount).toFixed(2)) : null,
    gol,
    agol,
    asst,
    tiriIn,
    tiriTot,
    shotAccuracyPct: pct(tiriIn, tiriTot),
    passSi,
    passTot,
    passPct: pct(passSi, passTot),
    dribSi,
    dribTot,
    dribPct: pct(dribSi, dribTot),
    crosSi,
    crosTot,
    crosPct: pct(crosSi, crosTot),
    ctrsSi,
    ctrsTot,
    ctrsPct: pct(ctrsSi, ctrsTot),
    falli,
    para,
    gsub,
    gialli,
    rossi,
    fgioco,
    possVinti,
    pallePerse,
    distTot: Number(distTot.toFixed(1)),
    distScatto: Number(distScatto.toFixed(1)),
    seasons: Array.from(seasonsSet),
  };
}

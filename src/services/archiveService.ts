import { supabase } from "@/supabaseClient";

export interface HistoricalTeamMeta {
  code: string;
  fullName: string;
  franchiseCode: string;
  franchiseName: string;
  eraSeasons: string;
  badgeClass: string;
  isHistoricalRebrand: boolean;
  isDefunct?: boolean;
}

export const HISTORICAL_TEAMS_META: Record<string, HistoricalTeamMeta> = {
  // Franchigia APD
  APD: {
    code: "APD",
    fullName: "Average Pegiò Drivers",
    franchiseCode: "APD",
    franchiseName: "Average Pegiò Drivers",
    eraSeasons: "S1-S11",
    badgeClass: "bg-pink-600/90 text-white border-pink-400/40",
    isHistoricalRebrand: false,
  },
  // Franchigia ACD (ex GAP)
  GAP: {
    code: "GAP",
    fullName: "I Giunti Al Punto",
    franchiseCode: "ACD",
    franchiseName: "AC Denti",
    eraSeasons: "S1",
    badgeClass: "bg-red-700/90 text-white border-red-400/40",
    isHistoricalRebrand: true,
  },
  ACD: {
    code: "ACD",
    fullName: "AC Denti",
    franchiseCode: "ACD",
    franchiseName: "AC Denti",
    eraSeasons: "S2-S11",
    badgeClass: "bg-red-600/90 text-white border-red-400/40",
    isHistoricalRebrand: false,
  },
  // Franchigia ACF (ex QFM)
  QFM: {
    code: "QFM",
    fullName: "Quelli del FantaManiaci",
    franchiseCode: "ACF",
    franchiseName: "AC Fantasy",
    eraSeasons: "S1",
    badgeClass: "bg-emerald-700/90 text-white border-emerald-400/40",
    isHistoricalRebrand: true,
  },
  ACF: {
    code: "ACF",
    fullName: "AC Fantasy",
    franchiseCode: "ACF",
    franchiseName: "AC Fantasy",
    eraSeasons: "S2-S11",
    badgeClass: "bg-emerald-600/90 text-white border-emerald-400/40",
    isHistoricalRebrand: false,
  },
  // Franchigia PFC (ex PAN -> HTV)
  PAN: {
    code: "PAN",
    fullName: "Panzett Hell",
    franchiseCode: "PFC",
    franchiseName: "Panormus FC",
    eraSeasons: "S1-S2",
    badgeClass: "bg-orange-700/90 text-white border-orange-400/40",
    isHistoricalRebrand: true,
  },
  HTV: {
    code: "HTV",
    fullName: "Herta Vernello",
    franchiseCode: "PFC",
    franchiseName: "Panormus FC",
    eraSeasons: "S3",
    badgeClass: "bg-orange-600/90 text-white border-orange-400/40",
    isHistoricalRebrand: true,
  },
  PFC: {
    code: "PFC",
    fullName: "Panormus FC",
    franchiseCode: "PFC",
    franchiseName: "Panormus FC",
    eraSeasons: "S4-S11",
    badgeClass: "bg-orange-500/90 text-white border-orange-400/40",
    isHistoricalRebrand: false,
  },
  // Franchigia MAR (ex SBM)
  SBM: {
    code: "SBM",
    fullName: "Sbinnala Madrid",
    franchiseCode: "MAR",
    franchiseName: "Mar's Attack",
    eraSeasons: "S1-S5",
    badgeClass: "bg-rose-700/90 text-white border-rose-400/40",
    isHistoricalRebrand: true,
  },
  MAR: {
    code: "MAR",
    fullName: "Mar's Attack",
    franchiseCode: "MAR",
    franchiseName: "Mar's Attack",
    eraSeasons: "S6-S11",
    badgeClass: "bg-rose-600/90 text-white border-rose-400/40",
    isHistoricalRebrand: false,
  },
  // Franchigia KAR (ex FCP, poi fallita in S5)
  FCP: {
    code: "FCP",
    fullName: "Poppo FC",
    franchiseCode: "KAR",
    franchiseName: "FC Karalis (Storica S1-S4)",
    eraSeasons: "S1",
    badgeClass: "bg-slate-600/90 text-white border-slate-400/40",
    isHistoricalRebrand: true,
    isDefunct: true,
  },
  KAR: {
    code: "KAR",
    fullName: "FC Karalis",
    franchiseCode: "KAR",
    franchiseName: "FC Karalis (Storica S1-S4)",
    eraSeasons: "S2-S4",
    badgeClass: "bg-slate-700/90 text-white border-slate-400/40",
    isHistoricalRebrand: false,
    isDefunct: true,
  },
  // Franchigia OLD (ex PRO -> YBO)
  PRO: {
    code: "PRO",
    fullName: "Procions",
    franchiseCode: "OLD",
    franchiseName: "Old Bois",
    eraSeasons: "S2-S3",
    badgeClass: "bg-blue-700/90 text-white border-blue-400/40",
    isHistoricalRebrand: true,
  },
  YBO: {
    code: "YBO",
    fullName: "Yang Bois",
    franchiseCode: "OLD",
    franchiseName: "Old Bois",
    eraSeasons: "S4-S6",
    badgeClass: "bg-blue-600/90 text-white border-blue-400/40",
    isHistoricalRebrand: true,
  },
  OLD: {
    code: "OLD",
    fullName: "Old Bois",
    franchiseCode: "OLD",
    franchiseName: "Old Bois",
    eraSeasons: "S7-S11",
    badgeClass: "bg-blue-500/90 text-white border-blue-400/40",
    isHistoricalRebrand: false,
  },
  // Franchigia VFC
  VFC: {
    code: "VFC",
    fullName: "Valle FC",
    franchiseCode: "VFC",
    franchiseName: "Valle FC",
    eraSeasons: "S2-S11",
    badgeClass: "bg-amber-600/90 text-white border-amber-400/40",
    isHistoricalRebrand: false,
  },
  // Franchigia ALV
  ALV: {
    code: "ALV",
    fullName: "Alvisopoli FC",
    franchiseCode: "ALV",
    franchiseName: "Alvisopoli FC",
    eraSeasons: "S5-S11",
    badgeClass: "bg-sky-600/90 text-white border-sky-400/40",
    isHistoricalRebrand: false,
  },
  // Franchigia RMB (ex BLA)
  BLA: {
    code: "BLA",
    fullName: "Blackmamba FC",
    franchiseCode: "RMB",
    franchiseName: "Redmamba GPT",
    eraSeasons: "S5-S7",
    badgeClass: "bg-zinc-800 text-white border-zinc-500/40",
    isHistoricalRebrand: true,
  },
  RMB: {
    code: "RMB",
    fullName: "Redmamba GPT",
    franchiseCode: "RMB",
    franchiseName: "Redmamba GPT",
    eraSeasons: "S8-S11",
    badgeClass: "bg-red-800/90 text-white border-red-500/40",
    isHistoricalRebrand: false,
  },
  // Franchigia SKA (ex HVI -> ASK)
  HVI: {
    code: "HVI",
    fullName: "FC Hellas Vinello",
    franchiseCode: "SKA",
    franchiseName: "Sporting Karalis",
    eraSeasons: "S5",
    badgeClass: "bg-teal-700/90 text-white border-teal-400/40",
    isHistoricalRebrand: true,
  },
  ASK: {
    code: "ASK",
    fullName: "AS Karalis",
    franchiseCode: "SKA",
    franchiseName: "Sporting Karalis",
    eraSeasons: "S6-S9",
    badgeClass: "bg-teal-600/90 text-white border-teal-400/40",
    isHistoricalRebrand: true,
  },
  SKA: {
    code: "SKA",
    fullName: "Sporting Karalis",
    franchiseCode: "SKA",
    franchiseName: "Sporting Karalis",
    eraSeasons: "S10-S11",
    badgeClass: "bg-teal-500/90 text-white border-teal-400/40",
    isHistoricalRebrand: false,
  },
  // Nuove Franchigie S11
  COS: {
    code: "COS",
    fullName: "Cosmo FC",
    franchiseCode: "COS",
    franchiseName: "Cosmo FC",
    eraSeasons: "S11",
    badgeClass: "bg-purple-600/90 text-white border-purple-400/40",
    isHistoricalRebrand: false,
  },
  EUR: {
    code: "EUR",
    fullName: "Eurosbin FC",
    franchiseCode: "EUR",
    franchiseName: "Eurosbin FC",
    eraSeasons: "S11",
    badgeClass: "bg-indigo-600/90 text-white border-indigo-400/40",
    isHistoricalRebrand: false,
  },
};

export function getHistoricalTeamMeta(code: string | null | undefined): HistoricalTeamMeta {
  const clean = (code || "").trim().toUpperCase();
  if (HISTORICAL_TEAMS_META[clean]) {
    return HISTORICAL_TEAMS_META[clean];
  }
  return {
    code: clean || "N/D",
    fullName: clean || "Non Disponibile",
    franchiseCode: clean || "N/D",
    franchiseName: clean || "Non Disponibile",
    eraSeasons: "",
    badgeClass: "bg-slate-500/80 text-white border-slate-400/30",
    isHistoricalRebrand: false,
  };
}

export function formatCareerPath(
  seasonTeams: string[],
  isHof?: boolean,
  draftPick?: number | null,
  draftStag?: number | null,
  squadraAttuale?: string | null
): string {
  const distinctConsecutive: string[] = [];
  for (const t of seasonTeams || []) {
    if (!t || t === "N/D") continue;
    if (distinctConsecutive.length === 0 || distinctConsecutive[distinctConsecutive.length - 1] !== t) {
      distinctConsecutive.push(t);
    }
  }
  const parts: string[] = [];
  if (draftPick && draftStag) {
    parts.push(`#${draftPick} Draft S${draftStag}`);
  }
  if (distinctConsecutive.length > 0) {
    parts.push(distinctConsecutive.join(" ➔ "));
  }
  if (isHof) {
    parts.push("🌟 HALL OF FAME");
  } else if (squadraAttuale === "RITIRATO") {
    parts.push("Ritirato");
  }
  return parts.join(" • ");
}

export interface PlayerCareerSummary {
  player_id: number;
  nome: string;
  cognome: string;
  posiz: string;
  squadra_attuale: string | null;
  ovr: number;
  eta: number;
  altezza: number;
  peso: number;
  nazionalita: string | null;
  piede: string | null;
  is_hof: boolean;
  hof_class: string | null;
  hof_active_seasons: string | null;
  stagioni_rosa: number;
  stagioni_giocate: number;
  first_stag: number | null;
  last_stag: number | null;
  season_teams: string[];
  franchises: string[];
  draft_stag: number | null;
  draft_pick: number | null;
  draft_team: string | null;
  presenze_capitano: number;
  presenze: number;
  titolare: number;
  minuti: number;
  media_voto: number | null;
  motm: number;
  gol: number;
  autogol: number;
  assist: number;
  tiri_in: number;
  tiri_tot: number;
  pass_si: number;
  pass_tot: number;
  drib_si: number;
  drib_tot: number;
  cros_si: number;
  cros_tot: number;
  ctrs_si: number;
  ctrs_tot: number;
  falli: number;
  parate: number;
  gol_subiti: number;
  clean_sheets: number;
  gialli: number;
  rossi: number;
  fuorigioco: number;
}

export interface PlayerSeasonSummary {
  player_id: number;
  stagione: number;
  team_id: string;
  franchise_id: string;
  entry_motivo: string;
  draft_pick: number | null;
  presenze_capitano: number;
  presenze: number;
  titolare: number;
  minuti: number;
  media_voto: number | null;
  motm: number;
  gol: number;
  autogol: number;
  assist: number;
  tiri_in: number;
  tiri_tot: number;
  pass_si: number;
  pass_tot: number;
  drib_si: number;
  drib_tot: number;
  cros_si: number;
  cros_tot: number;
  ctrs_si: number;
  ctrs_tot: number;
  falli: number;
  parate: number;
  gol_subiti: number;
  clean_sheets: number;
  gialli: number;
  rossi: number;
  fuorigioco: number;
}

export interface PlayerTransaction {
  id: number;
  tx_order: number;
  tx_date: string | null;
  tx_time: string | null;
  player_id: number;
  nome: string;
  cognome: string;
  prev_team: string;
  new_team: string;
  motivo: string;
  stagione: number;
  draft_pick: number | null;
}

export interface HallOfFameEntry {
  player_id: number;
  active_seasons: string;
  induction_class: string;
  induction_order: number;
  bio_note: string | null;
  career?: PlayerCareerSummary;
}

export interface TeamRebrand {
  id: number;
  rebrand_date: string;
  pre_team_id: string;
  post_team_id: string;
  current_franchise_id: string;
  season_before: number | null;
  season_after: number | null;
}

export interface CoachHistoryEntry {
  id: number;
  coach_order: number;
  nome: string;
  team_id: string;
  current_franchise_id: string;
  effetto: string;
  event_date: string | null;
  giornata: number | null;
  stagione: number;
  note: string | null;
}

export async function fetchAllPlayersCareerSummary(): Promise<PlayerCareerSummary[]> {
  const { data, error } = await supabase
    .from("view_player_career_summary")
    .select("*")
    .order("presenze", { ascending: false })
    .order("minuti", { ascending: false })
    .order("ovr", { ascending: false });

  if (error) {
    console.error("Error fetching view_player_career_summary:", error);
    throw error;
  }

  return (data || []).map((r: any) => ({
    ...r,
    player_id: Number(r.player_id),
    ovr: Number(r.ovr ?? 0),
    eta: Number(r.eta ?? 0),
    altezza: Number(r.altezza ?? 0),
    peso: Number(r.peso ?? 0),
    stagioni_rosa: Number(r.stagioni_rosa ?? 0),
    stagioni_giocate: Number(r.stagioni_giocate ?? 0),
    presenze_capitano: Number(r.presenze_capitano ?? 0),
    presenze: Number(r.presenze ?? 0),
    titolare: Number(r.titolare ?? 0),
    minuti: Number(r.minuti ?? 0),
    media_voto: r.media_voto !== null && r.media_voto !== undefined ? Number(r.media_voto) : null,
    motm: Number(r.motm ?? 0),
    gol: Number(r.gol ?? 0),
    autogol: Number(r.autogol ?? 0),
    assist: Number(r.assist ?? 0),
    tiri_in: Number(r.tiri_in ?? 0),
    tiri_tot: Number(r.tiri_tot ?? 0),
    pass_si: Number(r.pass_si ?? 0),
    pass_tot: Number(r.pass_tot ?? 0),
    drib_si: Number(r.drib_si ?? 0),
    drib_tot: Number(r.drib_tot ?? 0),
    cros_si: Number(r.cros_si ?? 0),
    cros_tot: Number(r.cros_tot ?? 0),
    ctrs_si: Number(r.ctrs_si ?? 0),
    ctrs_tot: Number(r.ctrs_tot ?? 0),
    falli: Number(r.falli ?? 0),
    parate: Number(r.parate ?? 0),
    gol_subiti: Number(r.gol_subiti ?? 0),
    clean_sheets: Number(r.clean_sheets ?? 0),
    gialli: Number(r.gialli ?? 0),
    rossi: Number(r.rossi ?? 0),
    fuorigioco: Number(r.fuorigioco ?? 0),
    season_teams: Array.isArray(r.season_teams) ? r.season_teams : [],
    franchises: Array.isArray(r.franchises) ? r.franchises : [],
  }));
}

export type PlayerTeamCareerSummary = {
  player_id: number;
  team_id: string;
  gol: number;
  assist: number;
  presenze: number;
  titolare: number;
  minuti: number;
  first_stag: number;
  last_stag: number;
  stagioni_giocate: number;
};

export type PlayerTeamGoalsSummary = PlayerTeamCareerSummary;

/**
 * Aggrega le statistiche per ogni coppia (player_id, team_id) su tutta la storia LCSIM
 * a partire da view_player_season_summary (tutte le coppie con almeno 1 presenza).
 */
export async function fetchAllPlayersTeamCareerSummary(): Promise<PlayerTeamCareerSummary[]> {
  const PAGE_SIZE = 1000;
  let offset = 0;
  const allRows: any[] = [];

  while (true) {
    const { data, error } = await supabase
      .from("view_player_season_summary")
      .select("player_id, stagione, team_id, presenze, titolare, minuti, gol, assist")
      .gt("presenze", 0)
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      console.error("Error fetching view_player_season_summary for team career stats:", error);
      throw error;
    }

    const batch = data || [];
    allRows.push(...batch);
    if (batch.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  const grouped = new Map<string, PlayerTeamCareerSummary & { _seasons: Set<number> }>();

  for (const row of allRows) {
    const playerId = Number(row.player_id);
    const teamId = typeof row.team_id === "string" ? row.team_id.trim() : "";
    const stag = Number(row.stagione ?? 0);
    if (!playerId || !teamId || teamId === "N/D" || teamId === "/") continue;

    const key = `${playerId}::${teamId}`;
    const existing = grouped.get(key);
    const gol = Number(row.gol ?? 0);
    const assist = Number(row.assist ?? 0);
    const presenze = Number(row.presenze ?? 0);
    const titolare = Number(row.titolare ?? 0);
    const minuti = Number(row.minuti ?? 0);

    if (!existing) {
      grouped.set(key, {
        player_id: playerId,
        team_id: teamId,
        gol,
        assist,
        presenze,
        titolare,
        minuti,
        first_stag: stag,
        last_stag: stag,
        stagioni_giocate: stag > 0 ? 1 : 0,
        _seasons: stag > 0 ? new Set([stag]) : new Set(),
      });
    } else {
      existing.gol += gol;
      existing.assist += assist;
      existing.presenze += presenze;
      existing.titolare += titolare;
      existing.minuti += minuti;
      if (stag > 0) {
        existing._seasons.add(stag);
        existing.stagioni_giocate = existing._seasons.size;
        if (existing.first_stag === 0 || stag < existing.first_stag) existing.first_stag = stag;
        if (stag > existing.last_stag) existing.last_stag = stag;
      }
    }
  }

  return Array.from(grouped.values()).map(({ _seasons, ...rest }) => rest);
}

export interface GoalkeeperUnbeatenStreakSummary {
  player_id: number;
  best_streak: number;
  streak_span: string;
}

/**
 * Calcola per ciascun portiere (POR) la striscia record di partite intere consecutive
 * senza subire gol (GSUB === 0 e MINUTI >= 45) in ordine cronologico (STAG, WEEK).
 */
export async function fetchAllGoalkeepersUnbeatenStreakSummary(
  porPlayerIds: number[]
): Promise<GoalkeeperUnbeatenStreakSummary[]> {
  if (!porPlayerIds || porPlayerIds.length === 0) return [];

  const PAGE_SIZE = 1000;
  let offset = 0;
  const allRows: any[] = [];

  while (true) {
    const { data, error } = await supabase
      .from("as_player_stat")
      .select("STAG, WEEK, ID, MINUTI, GSUB")
      .in("ID", porPlayerIds)
      .gt("MINUTI", 0)
      .order("STAG", { ascending: true })
      .order("WEEK", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      console.error("Error fetching as_player_stat for GK unbeaten streak:", error);
      throw error;
    }

    const batch = data || [];
    allRows.push(...batch);
    if (batch.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  const byPlayer = new Map<number, any[]>();
  for (const row of allRows) {
    const pid = Number(row.ID);
    if (!pid) continue;
    if (!byPlayer.has(pid)) byPlayer.set(pid, []);
    byPlayer.get(pid)!.push(row);
  }

  const results: GoalkeeperUnbeatenStreakSummary[] = [];

  for (const [playerId, matches] of byPlayer.entries()) {
    matches.sort((a, b) => Number(a.STAG) - Number(b.STAG) || Number(a.WEEK) - Number(b.WEEK));
    let cur = 0;
    let curStart: any = null;
    let best = 0;
    let bestStart: any = null;
    let bestEnd: any = null;

    for (const m of matches) {
      const min = Number(m.MINUTI ?? 0);
      const gsub = Number(m.GSUB ?? 0);
      if (gsub === 0 && min >= 45) {
        if (cur === 0) curStart = m;
        cur += 1;
        if (cur > best) {
          best = cur;
          bestStart = curStart;
          bestEnd = m;
        }
      } else if (gsub > 0) {
        cur = 0;
        curStart = null;
      }
    }

    if (best > 0 && bestStart && bestEnd) {
      const startLabel = `S${bestStart.STAG} G${bestStart.WEEK}`;
      const endLabel = `S${bestEnd.STAG} G${bestEnd.WEEK}`;
      results.push({
        player_id: playerId,
        best_streak: best,
        streak_span: startLabel === endLabel ? startLabel : `${startLabel} – ${endLabel}`,
      });
    }
  }

  return results.sort((a, b) => b.best_streak - a.best_streak);
}

export async function fetchAllPlayersTeamGoalsSummary(): Promise<PlayerTeamGoalsSummary[]> {
  const rows = await fetchAllPlayersTeamCareerSummary();
  return rows
    .filter((entry) => entry.gol > 0)
    .sort((a, b) => b.gol - a.gol || a.presenze - b.presenze || a.minuti - b.minuti);
}

export interface PlayerMultiGoalSummary {
  player_id: number;
  doppiette: number;
  triplette: number;
  poker: number;
  totale: number;
  max_gol_match: number;
}

/**
 * Aggrega da as_player_stat le partite ufficiali con 2+ gol per ciascun calciatore:
 * - doppiette: partite con esattamente 2 gol
 * - triplette: partite con 3 o più gol (include eventuali poker/manite)
 * - poker: partite con 4+ gol (per dettaglio)
 * - totale: totale partite multi-gol (2+ gol)
 */
export async function fetchAllPlayersMultiGoalSummary(): Promise<PlayerMultiGoalSummary[]> {
  const PAGE_SIZE = 1000;
  let offset = 0;
  const allRows: any[] = [];

  while (true) {
    const { data, error } = await supabase
      .from("as_player_stat")
      .select("ID, GOL")
      .gte("GOL", 2)
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      console.error("Error fetching as_player_stat for multi-goal summary:", error);
      throw error;
    }

    const batch = data || [];
    allRows.push(...batch);
    if (batch.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  const grouped = new Map<number, PlayerMultiGoalSummary>();

  for (const row of allRows) {
    const playerId = Number(row.ID);
    const gol = Number(row.GOL ?? 0);
    if (!playerId || gol < 2) continue;

    let cur = grouped.get(playerId);
    if (!cur) {
      cur = {
        player_id: playerId,
        doppiette: 0,
        triplette: 0,
        poker: 0,
        totale: 0,
        max_gol_match: 0,
      };
      grouped.set(playerId, cur);
    }

    if (gol === 2) cur.doppiette += 1;
    else cur.triplette += 1;
    if (gol >= 4) cur.poker += 1;
    cur.totale += 1;
    if (gol > cur.max_gol_match) cur.max_gol_match = gol;
  }

  return Array.from(grouped.values()).sort(
    (a, b) =>
      b.totale - a.totale ||
      b.triplette - a.triplette ||
      b.max_gol_match - a.max_gol_match
  );
}

export async function fetchPlayerArchiveDetail(playerId: number): Promise<{
  seasons: PlayerSeasonSummary[];
  transactions: PlayerTransaction[];
}> {
  const [seasonsRes, txRes] = await Promise.all([
    supabase
      .from("view_player_season_summary")
      .select("*")
      .eq("player_id", playerId)
      .order("stagione", { ascending: true }),
    supabase
      .from("an_player_transactions")
      .select("*")
      .eq("player_id", playerId)
      .order("tx_order", { ascending: true }),
  ]);

  if (seasonsRes.error) throw seasonsRes.error;
  if (txRes.error) throw txRes.error;

  const seasons: PlayerSeasonSummary[] = (seasonsRes.data || []).map((r: any) => ({
    ...r,
    player_id: Number(r.player_id),
    stagione: Number(r.stagione),
    presenze_capitano: Number(r.presenze_capitano ?? 0),
    presenze: Number(r.presenze ?? 0),
    titolare: Number(r.titolare ?? 0),
    minuti: Number(r.minuti ?? 0),
    media_voto: r.media_voto !== null && r.media_voto !== undefined ? Number(r.media_voto) : null,
    motm: Number(r.motm ?? 0),
    gol: Number(r.gol ?? 0),
    autogol: Number(r.autogol ?? 0),
    assist: Number(r.assist ?? 0),
    tiri_in: Number(r.tiri_in ?? 0),
    tiri_tot: Number(r.tiri_tot ?? 0),
    pass_si: Number(r.pass_si ?? 0),
    pass_tot: Number(r.pass_tot ?? 0),
    drib_si: Number(r.drib_si ?? 0),
    drib_tot: Number(r.drib_tot ?? 0),
    cros_si: Number(r.cros_si ?? 0),
    cros_tot: Number(r.cros_tot ?? 0),
    ctrs_si: Number(r.ctrs_si ?? 0),
    ctrs_tot: Number(r.ctrs_tot ?? 0),
    falli: Number(r.falli ?? 0),
    parate: Number(r.parate ?? 0),
    gol_subiti: Number(r.gol_subiti ?? 0),
    clean_sheets: Number(r.clean_sheets ?? 0),
    gialli: Number(r.gialli ?? 0),
    rossi: Number(r.rossi ?? 0),
    fuorigioco: Number(r.fuorigioco ?? 0),
  }));

  const transactions: PlayerTransaction[] = (txRes.data || []).map((t: any) => ({
    ...t,
    id: Number(t.id),
    tx_order: Number(t.tx_order),
    player_id: Number(t.player_id),
    stagione: Number(t.stagione),
    draft_pick: t.draft_pick !== null && t.draft_pick !== undefined ? Number(t.draft_pick) : null,
  }));

  return { seasons, transactions };
}

export async function fetchHallOfFameEntries(): Promise<HallOfFameEntry[]> {
  const { data, error } = await supabase
    .from("an_hall_of_fame")
    .select("*")
    .order("induction_order", { ascending: true })
    .order("player_id", { ascending: true });

  if (error) throw error;
  return (data || []).map((r: any) => ({
    player_id: Number(r.player_id),
    active_seasons: r.active_seasons,
    induction_class: r.induction_class,
    induction_order: Number(r.induction_order ?? 1),
    bio_note: r.bio_note ?? null,
  }));
}

export async function upsertHallOfFameMember(params: {
  playerId: number;
  activeSeasons: string;
  inductionClass: string;
  inductionOrder?: number;
  bioNote?: string;
  actingUsername?: string;
}): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase.rpc("rpc_admin_upsert_hof_member", {
    p_player_id: params.playerId,
    p_active_seasons: params.activeSeasons,
    p_induction_class: params.inductionClass,
    p_induction_order: params.inductionOrder ?? 1,
    p_bio_note: params.bioNote ?? null,
    p_acting_username: params.actingUsername ?? null,
  });

  if (error) return { success: false, error: error.message };
  return (data as { success: boolean; error?: string }) || { success: true };
}

export async function deleteHallOfFameMember(
  playerId: number,
  actingUsername?: string
): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase.rpc("rpc_admin_delete_hof_member", {
    p_player_id: playerId,
    p_acting_username: actingUsername ?? null,
  });

  if (error) return { success: false, error: error.message };
  return (data as { success: boolean; error?: string }) || { success: true };
}

export async function fetchClubHistoricalData(franchiseCode: string): Promise<{
  rebrands: TeamRebrand[];
  coaches: CoachHistoryEntry[];
}> {
  const cleanCode = (franchiseCode || "").trim().toUpperCase();
  const meta = getHistoricalTeamMeta(cleanCode);
  const targetFranchise = meta.franchiseCode;

  const [rebrandsRes, coachesRes] = await Promise.all([
    supabase
      .from("an_team_rebrands")
      .select("*")
      .eq("current_franchise_id", targetFranchise)
      .order("rebrand_date", { ascending: true }),
    supabase
      .from("an_coach_history")
      .select("*")
      .eq("current_franchise_id", targetFranchise)
      .order("coach_order", { ascending: true }),
  ]);

  if (rebrandsRes.error) throw rebrandsRes.error;
  if (coachesRes.error) throw coachesRes.error;

  return {
    rebrands: (rebrandsRes.data || []) as TeamRebrand[],
    coaches: (coachesRes.data || []) as CoachHistoryEntry[],
  };
}

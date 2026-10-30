import { supabase } from "@/supabaseClient";
import { getGeminiApiKey } from "@/services/aiJournalistService";
import { createWorker } from "tesseract.js";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface AdminTeamStatDraft {
  STAG: number;
  WEEK: number;
  ID: string;
  ALLENATORE: string;
  VOTO: number;
  MINUTI: number;
  GOL: number;
  AGOL: number;
  ASST: number;
  TIRI_SI: number;
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
  POSS: number; // 0..1 (e.g. 0.50) or 0..100 normalized on save
  CANGL: number;
  TEMPOREC: number | null;
  xG: number | null;
  INTERC: number | null;
  TAGLI: number | null;
  AGGIR: number | null;
  SCAVAL: number | null;
  INCURS: number | null;
  EXTRA_STATS: Record<string, any>;
}

export interface AdminPlayerStatDraft {
  ID: number;
  Nome: string;
  Cognome: string;
  Posiz: string; // Ruolo naturale da an_player
  TEAM_ID: string;
  POS_GIOCATA: string;
  SUB: boolean;
  MOTM: boolean;
  VOTO: number;
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
  EXTRA_STATS: Record<string, any>;
}

export interface AdminScheduleMatchSummary {
  stag: number;
  week: number;
  home: string;
  away: string;
  home_name: string;
  away_name: string;
  home_manager: string;
  away_manager: string;
  stadium: string;
  referee: string;
  weather: string;
  date: string; // YYYY-MM-DD
  match_time: string; // HH:MM
  unlock_at: string | null;
  standings_processed: boolean;
  has_stats: boolean;
  is_unlocked: boolean;
  home_gol: number | null;
  away_gol: number | null;
}

export interface AdminMatchFullReport {
  schedule: AdminScheduleMatchSummary;
  homeTeamStat: AdminTeamStatDraft;
  awayTeamStat: AdminTeamStatDraft;
  homePlayers: AdminPlayerStatDraft[];
  awayPlayers: AdminPlayerStatDraft[];
}

export interface ScreenshotProgress {
  phase: string;
  current: number;
  total: number;
  detail?: string;
}

// ============================================================================
// DEFAULT FACTORIES
// ============================================================================

export function createEmptyTeamStat(
  stag: number,
  week: number,
  teamId: string,
  coachName = ""
): AdminTeamStatDraft {
  return {
    STAG: stag,
    WEEK: week,
    ID: teamId,
    ALLENATORE: coachName,
    VOTO: 6.0,
    MINUTI: 90,
    GOL: 0,
    AGOL: 0,
    ASST: 0,
    TIRI_SI: 0,
    TIRI_TOT: 0,
    PASS_SI: 0,
    PASS_TOT: 0,
    DRIB_SI: 0,
    DRIB_TOT: 0,
    CROS_SI: 0,
    CROS_TOT: 0,
    CTRS_SI: 0,
    CTRS_TOT: 0,
    FALLI: 0,
    PARA: 0,
    GSUB: 0,
    GIALLI: 0,
    ROSSI: 0,
    FGIOCO: 0,
    POSS: 0.5,
    CANGL: 0,
    TEMPOREC: 0,
    xG: 0,
    INTERC: 0,
    TAGLI: 0,
    AGGIR: 0,
    SCAVAL: 0,
    INCURS: 0,
    EXTRA_STATS: {},
  };
}

export function createEmptyPlayerStat(
  player: { ID: number; Nome: string; Cognome: string; Posiz: string; Squadra: string },
  teamId: string
): AdminPlayerStatDraft {
  return {
    ID: Number(player.ID),
    Nome: player.Nome || "",
    Cognome: player.Cognome || "",
    Posiz: player.Posiz || "CC",
    TEAM_ID: teamId,
    POS_GIOCATA: player.Posiz || "CC",
    SUB: false,
    MOTM: false,
    VOTO: 0,
    MINUTI: 0,
    GOL: 0,
    AGOL: 0,
    ASST: 0,
    TIRI_IN: 0,
    TIRI_TOT: 0,
    PASS_SI: 0,
    PASS_TOT: 0,
    DRIB_SI: 0,
    DRIB_TOT: 0,
    CROS_SI: 0,
    CROS_TOT: 0,
    CTRS_SI: 0,
    CTRS_TOT: 0,
    FALLI: 0,
    PARA: 0,
    GSUB: 0,
    GIALLI: 0,
    ROSSI: 0,
    FGIOCO: 0,
    POSS_VINTI: 0,
    PALLE_PERSE: 0,
    DIST_TOT: 0,
    DIST_SCATTO: 0,
    EXTRA_STATS: {},
  };
}

// ============================================================================
// 1. SUPABASE ADMIN QUERIES & RPCS
// ============================================================================

export async function fetchAvailableSeasons(): Promise<number[]> {
  const { data } = await supabase
    .from("an_schedule")
    .select("stag")
    .order("stag", { ascending: false });

  const set = new Set<number>([11, 10]);
  for (const r of data || []) {
    if (r.stag) set.add(Number(r.stag));
  }
  return Array.from(set).sort((a, b) => b - a);
}

export async function fetchAdminSeasonSchedule(stag: number): Promise<AdminScheduleMatchSummary[]> {
  const [schedRes, teamsRes, teamStatsRes] = await Promise.all([
    supabase
      .from("an_schedule")
      .select("*")
      .eq("stag", stag)
      .order("week", { ascending: true }),
    supabase.from("an_team").select("TEAM_ID, NAME, MANAGER"),
    supabase
      .from("AS_TEAM_STAT")
      .select("STAG, WEEK, ID, GOL")
      .eq("STAG", stag),
  ]);

  if (schedRes.error) throw new Error(schedRes.error.message);

  const teamMap = new Map<string, { name: string; manager: string }>();
  for (const t of teamsRes.data || []) {
    teamMap.set(t.TEAM_ID, {
      name: t.NAME || t.TEAM_ID,
      manager: t.MANAGER ? `Sig. ${t.MANAGER}` : "",
    });
  }

  const statMap = new Map<string, number>();
  for (const st of teamStatsRes.data || []) {
    statMap.set(`${st.WEEK}_${st.ID}`, Number(st.GOL ?? 0));
  }

  const now = Date.now();
  return (schedRes.data || []).map((row: any) => {
    const homeGol = statMap.has(`${row.week}_${row.home}`)
      ? statMap.get(`${row.week}_${row.home}`)!
      : null;
    const awayGol = statMap.has(`${row.week}_${row.away}`)
      ? statMap.get(`${row.week}_${row.away}`)!
      : null;
    const hasStats = homeGol !== null && awayGol !== null;
    const unlockMs = row.unlock_at ? new Date(row.unlock_at).getTime() : null;
    const isUnlocked = unlockMs === null || unlockMs <= now;

    return {
      stag: Number(row.stag),
      week: Number(row.week),
      home: row.home,
      away: row.away,
      home_name: teamMap.get(row.home)?.name || row.home,
      away_name: teamMap.get(row.away)?.name || row.away,
      home_manager: teamMap.get(row.home)?.manager || "",
      away_manager: teamMap.get(row.away)?.manager || "",
      stadium: row.stadium || "",
      referee: row.referee || "",
      weather: row.weather || "Sereno",
      date: row.date ? String(row.date).slice(0, 10) : new Date().toISOString().slice(0, 10),
      match_time: row.match_time ? String(row.match_time).slice(0, 5) : "21:00",
      unlock_at: row.unlock_at || null,
      standings_processed: Boolean(row.standings_processed),
      has_stats: hasStats,
      is_unlocked: isUnlocked,
      home_gol: homeGol,
      away_gol: awayGol,
    };
  });
}

export async function fetchAdminMatchReport(
  match: AdminScheduleMatchSummary
): Promise<AdminMatchFullReport> {
  const [teamStatsRes, rosterPlayersRes, matchPlayerStatsRes] = await Promise.all([
    supabase
      .from("AS_TEAM_STAT")
      .select("*")
      .eq("STAG", match.stag)
      .eq("WEEK", match.week)
      .in("ID", [match.home, match.away]),
    supabase
      .from("an_player")
      .select("ID, Nome, Cognome, Posiz, Squadra, OVR, NumeroMaglia")
      .in("Squadra", [match.home, match.away])
      .order("OVR", { ascending: false }),
    supabase
      .from("AS_PLAYER_STAT")
      .select("*")
      .eq("STAG", match.stag)
      .eq("WEEK", match.week),
  ]);

  const existingHomeTeam = (teamStatsRes.data || []).find((r: any) => r.ID === match.home);
  const existingAwayTeam = (teamStatsRes.data || []).find((r: any) => r.ID === match.away);

  const homeTeamStat: AdminTeamStatDraft = existingHomeTeam
    ? {
        ...createEmptyTeamStat(match.stag, match.week, match.home, match.home_manager),
        ...existingHomeTeam,
        POSS: Number(existingHomeTeam.POSS ?? 0.5),
        EXTRA_STATS: existingHomeTeam.EXTRA_STATS || {},
      }
    : createEmptyTeamStat(match.stag, match.week, match.home, match.home_manager);

  const awayTeamStat: AdminTeamStatDraft = existingAwayTeam
    ? {
        ...createEmptyTeamStat(match.stag, match.week, match.away, match.away_manager),
        ...existingAwayTeam,
        POSS: Number(existingAwayTeam.POSS ?? 0.5),
        EXTRA_STATS: existingAwayTeam.EXTRA_STATS || {},
      }
    : createEmptyTeamStat(match.stag, match.week, match.away, match.away_manager);

  const rosterPlayers = rosterPlayersRes.data || [];
  const savedPlayerMap = new Map<number, any>();
  for (const ps of matchPlayerStatsRes.data || []) {
    savedPlayerMap.set(Number(ps.ID), ps);
  }

  // Se ci sono giocatori che hanno giocato il match ma nel frattempo hanno cambiato squadra, li includiamo
  const rosterIds = new Set(rosterPlayers.map((p: any) => Number(p.ID)));
  const missingIds = (matchPlayerStatsRes.data || [])
    .filter((ps: any) => ps.TEAM_ID === match.home || ps.TEAM_ID === match.away)
    .map((ps: any) => Number(ps.ID))
    .filter((id: number) => !rosterIds.has(id));

  let extraAnPlayers: any[] = [];
  if (missingIds.length > 0) {
    const { data: ext } = await supabase
      .from("an_player")
      .select("ID, Nome, Cognome, Posiz, Squadra, OVR")
      .in("ID", missingIds);
    extraAnPlayers = ext || [];
  }

  const allCandidatePlayers = [...rosterPlayers, ...extraAnPlayers];

  const buildTeamPlayerList = (teamId: string): AdminPlayerStatDraft[] => {
    const list: AdminPlayerStatDraft[] = [];
    for (const p of allCandidatePlayers) {
      const saved = savedPlayerMap.get(Number(p.ID));
      const belongsToTeam =
        (saved && saved.TEAM_ID === teamId) ||
        (!saved?.TEAM_ID && p.Squadra === teamId);

      if (!belongsToTeam) continue;

      const base = createEmptyPlayerStat(p, teamId);
      if (saved) {
        list.push({
          ...base,
          POS_GIOCATA: saved.POS_GIOCATA || p.Posiz || "CC",
          SUB: Boolean(saved.SUB),
          MOTM: Boolean(saved.MOTM),
          VOTO: Number(saved.VOTO ?? 0),
          MINUTI: Number(saved.MINUTI ?? 0),
          GOL: Number(saved.GOL ?? 0),
          AGOL: Number(saved.AGOL ?? 0),
          ASST: Number(saved.ASST ?? 0),
          TIRI_IN: Number(saved.TIRI_IN ?? 0),
          TIRI_TOT: Number(saved.TIRI_TOT ?? 0),
          PASS_SI: Number(saved.PASS_SI ?? 0),
          PASS_TOT: Number(saved.PASS_TOT ?? 0),
          DRIB_SI: Number(saved.DRIB_SI ?? 0),
          DRIB_TOT: Number(saved.DRIB_TOT ?? 0),
          CROS_SI: Number(saved.CROS_SI ?? 0),
          CROS_TOT: Number(saved.CROS_TOT ?? 0),
          CTRS_SI: Number(saved.CTRS_SI ?? 0),
          CTRS_TOT: Number(saved.CTRS_TOT ?? 0),
          FALLI: Number(saved.FALLI ?? 0),
          PARA: Number(saved.PARA ?? 0),
          GSUB: Number(saved.GSUB ?? 0),
          GIALLI: Number(saved.GIALLI ?? 0),
          ROSSI: Number(saved.ROSSI ?? 0),
          FGIOCO: Number(saved.FGIOCO ?? 0),
          POSS_VINTI: Number(saved.POSS_VINTI ?? 0),
          PALLE_PERSE: Number(saved.PALLE_PERSE ?? 0),
          DIST_TOT: Number(saved.DIST_TOT ?? 0),
          DIST_SCATTO: Number(saved.DIST_SCATTO ?? 0),
          EXTRA_STATS: saved.EXTRA_STATS || {},
        });
      } else {
        list.push(base);
      }
    }

    const roleOrder: Record<string, number> = {
      POR: 0, TD: 1, DC: 2, DCD: 2, DCS: 2, TS: 3, CDC: 4, CDD: 4, CDS: 4,
      ED: 5, CC: 6, CCD: 6, CCS: 6, ES: 7, COC: 8, COD: 8, COS: 8,
      AD: 9, AS: 10, AT: 11, ATT: 12, PD: 12, PS: 12, SOS: 99,
    };

    return list.sort((a, b) => {
      const aPlayed = a.MINUTI > 0 ? 0 : 1;
      const bPlayed = b.MINUTI > 0 ? 0 : 1;
      if (aPlayed !== bPlayed) return aPlayed - bPlayed;
      return (roleOrder[a.Posiz] ?? 50) - (roleOrder[b.Posiz] ?? 50);
    });
  };

  return {
    schedule: match,
    homeTeamStat,
    awayTeamStat,
    homePlayers: buildTeamPlayerList(match.home),
    awayPlayers: buildTeamPlayerList(match.away),
  };
}

export async function saveAdminMatchReport(
  report: AdminMatchFullReport,
  adminName = "Super Admin",
  forceUnlockNow = false
): Promise<{ success: boolean; unlock_at?: string; is_unlocked_now?: boolean; players_saved?: number; error?: string }> {
  try {
    const normalizePoss = (v: number) => (v > 1 ? Number((v / 100).toFixed(2)) : Number(v.toFixed(2)));

    // Calcolo automatico media voto squadra dai giocatori con minuti > 0 se voto squadra è 6.0 o 0
    const calcAvgRating = (players: AdminPlayerStatDraft[], fallback: number) => {
      const active = players.filter((p) => p.MINUTI > 0 && p.VOTO > 0);
      if (active.length === 0) return fallback || 6.0;
      const avg = active.reduce((acc, p) => acc + Number(p.VOTO), 0) / active.length;
      return Number(avg.toFixed(2));
    };

    const homePayload: AdminTeamStatDraft = {
      ...report.homeTeamStat,
      POSS: normalizePoss(Number(report.homeTeamStat.POSS || 0.5)),
      VOTO: calcAvgRating(report.homePlayers, report.homeTeamStat.VOTO),
      GSUB: report.awayTeamStat.GOL,
    };

    const awayPayload: AdminTeamStatDraft = {
      ...report.awayTeamStat,
      POSS: normalizePoss(Number(report.awayTeamStat.POSS || 0.5)),
      VOTO: calcAvgRating(report.awayPlayers, report.awayTeamStat.VOTO),
      GSUB: report.homeTeamStat.GOL,
    };

    const allPlayers = [...report.homePlayers, ...report.awayPlayers].filter(
      (p) => p.MINUTI > 0 || p.VOTO > 0 || p.GOL > 0 || p.ASST > 0
    );

    const customUnlock = forceUnlockNow
      ? new Date(Date.now() - 60_000).toISOString()
      : null;

    const { data, error } = await supabase.rpc("rpc_admin_save_match_report", {
      p_stag: report.schedule.stag,
      p_week: report.schedule.week,
      p_home: report.schedule.home,
      p_away: report.schedule.away,
      p_match_date: report.schedule.date,
      p_match_time: report.schedule.match_time || "21:00",
      p_custom_unlock_at: customUnlock,
      p_stadium: report.schedule.stadium,
      p_referee: report.schedule.referee,
      p_weather: report.schedule.weather,
      p_home_team_stat: homePayload,
      p_away_team_stat: awayPayload,
      p_player_stats: allPlayers,
      p_admin_name: adminName,
    });

    if (error) throw new Error(error.message);
    return {
      success: true,
      unlock_at: data?.unlock_at,
      is_unlocked_now: data?.is_unlocked_now,
      players_saved: data?.players_saved,
    };
  } catch (err: any) {
    console.error("Errore saveAdminMatchReport:", err);
    return { success: false, error: err.message || "Errore durante il salvataggio del referto" };
  }
}

export async function updateAdminMatchSchedule(
  stag: number,
  week: number,
  home: string,
  away: string,
  matchDate: string,
  matchTime: string,
  forceUnlockNow = false
): Promise<{ success: boolean; unlock_at?: string; is_unlocked_now?: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.rpc("rpc_admin_set_match_schedule", {
      p_stag: stag,
      p_week: week,
      p_home: home,
      p_away: away,
      p_match_date: matchDate,
      p_match_time: matchTime,
      p_force_unlock_now: forceUnlockNow,
    });
    if (error) throw new Error(error.message);
    return {
      success: true,
      unlock_at: data?.unlock_at,
      is_unlocked_now: data?.is_unlocked_now,
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ============================================================================
// 2. FUZZY PLAYER & TEAM MATCHING HELPERS
// ============================================================================

function normalizeStr(s: string): string {
  return (s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function matchPlayerToRoster(
  rawName: string,
  candidates: AdminPlayerStatDraft[]
): AdminPlayerStatDraft | null {
  if (!rawName || candidates.length === 0) return null;
  const clean = normalizeStr(rawName);
  if (!clean) return null;

  // 1. Exact full name or surname match
  for (const c of candidates) {
    const full = normalizeStr(`${c.Nome} ${c.Cognome}`);
    const rev = normalizeStr(`${c.Cognome} ${c.Nome}`);
    const sur = normalizeStr(c.Cognome);
    const abbr = normalizeStr(`${c.Nome.charAt(0)} ${c.Cognome}`);
    if (clean === full || clean === rev || clean === sur || clean === abbr) {
      return c;
    }
  }

  // 2. Last word (surname) match
  const parts = clean.split(" ");
  const lastWord = parts[parts.length - 1];
  if (lastWord && lastWord.length >= 3) {
    const surnameMatches = candidates.filter((c) => {
      const sur = normalizeStr(c.Cognome);
      return sur === lastWord || sur.endsWith(lastWord) || lastWord.endsWith(sur);
    });
    if (surnameMatches.length === 1) return surnameMatches[0];
    if (surnameMatches.length > 1 && parts.length > 1) {
      const firstInitial = parts[0].charAt(0);
      const initialMatch = surnameMatches.find(
        (c) => normalizeStr(c.Nome).charAt(0) === firstInitial
      );
      if (initialMatch) return initialMatch;
      return surnameMatches[0];
    }
  }

  // 3. Levenshtein / substring similarity fallback
  let best: AdminPlayerStatDraft | null = null;
  let bestScore = 0;
  for (const c of candidates) {
    const sur = normalizeStr(c.Cognome);
    if (!sur) continue;
    let common = 0;
    for (let i = 0; i < Math.min(sur.length, lastWord.length); i++) {
      if (sur[i] === lastWord[i]) common++;
    }
    const score = common / Math.max(sur.length, lastWord.length, 1);
    if (score > bestScore && score >= 0.65) {
      bestScore = score;
      best = c;
    }
  }
  return best;
}

// ============================================================================
// 3. DETERMINISTIC EA FC 25 SCREENSHOT ANALYZER (32 OR 422 SCREENSHOTS)
// ============================================================================

type ScreenKind = "TEAM_SUMMARY" | "PLAYER_PERFORMANCE";
type ActiveTab = "Riepilogo" | "Possesso" | "Tiri" | "Passaggi" | "Difesa" | "Portiere" | "Eventi";

interface AnalyzedFrame {
  file: File;
  img: HTMLImageElement;
  kind: ScreenKind;
  tab: ActiveTab;
  isUnusedBench: boolean;
  playerSignHash: string;
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

/**
 * Classifica istantaneamente (< 2ms) uno screenshot 16:9 di EA Sports FC 25
 * leggendo la luminanza e la saturazione dei pixel chiave:
 * - Distingue Riepilogo Squadra vs Prestazioni Giocatore
 * - Rileva quale dei 6 tab è selezionato
 * - Rileva se il calciatore selezionato è N/D (0 minuti giocati) per saltare i sub-tab inutili
 */
function inspectFrameGeometry(img: HTMLImageElement, ctx: CanvasRenderingContext2D): Omit<AnalyzedFrame, "file" | "img"> {
  const W = 1920;
  const H = 1080;
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(img, 0, 0, W, H);

  const avgLum = (x: number, y: number, w: number, h: number): number => {
    const d = ctx.getImageData(x, y, w, h).data;
    let bright = 0;
    const total = w * h;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i] > 200 && d[i + 1] > 200 && d[i + 2] > 200) bright++;
    }
    return bright / Math.max(1, total);
  };

  // "Prestazioni giocatore" in alto a sinistra (x: 60..440, y: 55..105)
  const topLeftDensity = avgLum(60, 55, 380, 50);
  const kind: ScreenKind = topLeftDensity > 0.06 ? "PLAYER_PERFORMANCE" : "TEAM_SUMMARY";

  // Rilevamento Tab attivo tramite barra di sottolineatura/testo luminoso
  let tab: ActiveTab = "Riepilogo";
  if (kind === "PLAYER_PERFORMANCE") {
    const playerTabs: { name: ActiveTab; x: number; w: number }[] = [
      { name: "Riepilogo", x: 795, w: 95 },
      { name: "Possesso", x: 930, w: 160 },
      { name: "Tiri", x: 1120, w: 50 },
      { name: "Passaggi", x: 1195, w: 100 },
      { name: "Difesa", x: 1325, w: 80 },
      { name: "Portiere", x: 1435, w: 90 },
    ];
    let bestScore = -1;
    for (const t of playerTabs) {
      const score = avgLum(t.x, 158, t.w, 32);
      if (score > bestScore) {
        bestScore = score;
        tab = t.name;
      }
    }
  } else {
    const teamTabs: { name: ActiveTab; x: number; w: number }[] = [
      { name: "Riepilogo", x: 590, w: 105 },
      { name: "Possesso", x: 730, w: 160 },
      { name: "Tiri", x: 920, w: 50 },
      { name: "Passaggi", x: 1000, w: 100 },
      { name: "Difesa", x: 1130, w: 80 },
      { name: "Eventi", x: 1240, w: 80 },
    ];
    let bestScore = -1;
    for (const t of teamTabs) {
      const score = avgLum(t.x, 168, t.w, 32);
      if (score > bestScore) {
        bestScore = score;
        tab = t.name;
      }
    }
  }

  // Verifica se il giocatore selezionato ha un voto colorato o è "N/D" (cerchio grigio in x: 530..625, y: 175..265)
  let isUnusedBench = false;
  let playerSignHash = "";

  if (kind === "PLAYER_PERFORMANCE") {
    const circleData = ctx.getImageData(530, 175, 95, 90).data;
    let coloredPixels = 0;
    for (let i = 0; i < circleData.length; i += 4) {
      const r = circleData[i], g = circleData[i + 1], b = circleData[i + 2];
      const sat = Math.max(r, g, b) - Math.min(r, g, b);
      if (sat > 45 && Math.max(r, g, b) > 110) coloredPixels++;
    }
    // Se il cerchio non ha pixel colorati (verde/giallo/arancio), è N/D!
    isUnusedBench = coloredPixels < 25;

    // Hash leggero del box nome giocatore (x: 260..500, y: 185..255) per raggruppare screenshot consecutivi dello stesso giocatore
    const nameData = ctx.getImageData(260, 185, 240, 70).data;
    const buckets: number[] = [];
    for (let bx = 0; bx < 12; bx++) {
      let sum = 0;
      for (let y = 0; y < 70; y += 2) {
        for (let x = bx * 20; x < (bx + 1) * 20; x += 2) {
          const idx = (y * 240 + x) * 4;
          if (nameData[idx] > 180) sum++;
        }
      }
      buckets.push(sum);
    }
    playerSignHash = buckets.join("-");
  }

  return { kind, tab, isUnusedBench, playerSignHash };
}

/**
 * Ritaglia una regione dallo screenshot 1920x1080 e la converte in un'immagine
 * binarizzata (testo nero nitido su sfondo bianco puro) per massimizzare l'accuratezza OCR.
 */
function cropBinarizedDataUrl(
  sourceCanvas: HTMLCanvasElement,
  x: number,
  y: number,
  w: number,
  h: number,
  scale = 1.5,
  invertLightBg = false
): string {
  const out = document.createElement("canvas");
  out.width = Math.round(w * scale);
  out.height = Math.round(h * scale);
  const octx = out.getContext("2d")!;
  octx.imageSmoothingEnabled = true;
  octx.drawImage(sourceCanvas, x, y, w, h, 0, 0, out.width, out.height);

  const imgData = octx.getImageData(0, 0, out.width, out.height);
  const d = imgData.data;

  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i + 1], b = d[i + 2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    // Nei menu FC 25 il testo è chiaro (lum > 155) o giallo/verde acceso su fondo scuro
    const isBrightText = invertLightBg ? lum < 120 : (lum > 150 || r > 185 || g > 185);
    const val = isBrightText ? 0 : 255;
    d[i] = val;
    d[i + 1] = val;
    d[i + 2] = val;
    d[i + 3] = 255;
  }

  octx.putImageData(imgData, 0, 0);
  return out.toDataURL("image/png");
}

function parseItNumber(raw: string): number {
  if (!raw) return 0;
  const cleaned = raw
    .replace(/,/g, ".")
    .replace(/[^0-9.-]/g, "")
    .trim();
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

/**
 * Estrae coppie (Etichetta, Valori numerici a fine riga) dal testo OCR del pannello destro giocatore
 */
function parseRightPanelLines(ocrText: string): { label: string; nums: number[] }[] {
  const results: { label: string; nums: number[] }[] = [];
  const lines = ocrText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  for (const line of lines) {
    // Cerca 1 o 2 numeri finali (es. "Passaggi 6 73" o "% precisione passaggi 100 93" o "Assist previsti 0,0")
    const m = line.match(/^(.+?)\s+(-?\d+(?:[.,]\d+)?)(?:\s+(-?\d+(?:[.,]\d+)?))?$/);
    if (m) {
      const label = normalizeStr(m[1]);
      const nums = [parseItNumber(m[2])];
      if (m[3] !== undefined) nums.push(parseItNumber(m[3]));
      results.push({ label, nums });
    }
  }
  return results;
}

/**
 * Estrae terne (Valore Casa, Etichetta Centrale, Valore Trasferta) dal Riepilogo Squadra
 */
function parseTeamCenterLines(ocrText: string): { label: string; homeVal: number; awayVal: number }[] {
  const results: { label: string; homeVal: number; awayVal: number }[] = [];
  const lines = ocrText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  for (const line of lines) {
    // Rimuove eventuali barre verticali '|' lette dall'OCR accanto ai numeri (es. "| 5 Tiri 3 |")
    const cleaned = line.replace(/[|!I\[\]]/g, " ").replace(/\s+/g, " ").trim();
    const m = cleaned.match(/^(\d+(?:[.,]\d+)?)\s+(?:1\s+)?(.+?)\s+(\d+(?:[.,]\d+)?)$/);
    if (m) {
      results.push({
        homeVal: parseItNumber(m[1]),
        label: normalizeStr(m[2]),
        awayVal: parseItNumber(m[3]),
      });
    }
  }
  return results;
}

/**
 * Applica una riga del pannello destro (Riepilogo / Possesso / Tiri / Passaggi / Difesa / Portiere)
 * al draft del calciatore e (se in Riepilogo con 2 colonne) anche al draft della squadra.
 */
function applyPlayerRightPanelRow(
  tab: ActiveTab,
  label: string,
  nums: number[],
  pDraft: AdminPlayerStatDraft,
  teamDraft?: AdminTeamStatDraft,
  pctCache?: Record<string, number>,
  teamPctCache?: Record<string, number>
) {
  const pVal = nums[0] ?? 0;
  const tVal = nums.length > 1 ? nums[1] : undefined;

  if (tab === "Riepilogo") {
    if (label === "gol") {
      pDraft.GOL = Math.round(pVal);
    } else if (label.includes("assist")) {
      pDraft.ASST = Math.round(pVal);
      if (teamDraft && tVal !== undefined) teamDraft.ASST = Math.round(tVal);
    } else if (label === "tiri") {
      pDraft.TIRI_TOT = Math.round(pVal);
      if (teamDraft && tVal !== undefined && !teamDraft.TIRI_TOT) teamDraft.TIRI_TOT = Math.round(tVal);
    } else if (label.includes("precisione tiri")) {
      if (pctCache) pctCache.shotPct = pVal;
      if (teamPctCache && tVal !== undefined) teamPctCache.shotPct = tVal;
    } else if (label === "passaggi") {
      pDraft.PASS_TOT = Math.round(pVal);
      if (teamDraft && tVal !== undefined && !teamDraft.PASS_TOT) teamDraft.PASS_TOT = Math.round(tVal);
    } else if (label.includes("precisione passaggi")) {
      if (pctCache) pctCache.passPct = pVal;
      if (teamPctCache && tVal !== undefined) teamPctCache.passPct = tVal;
    } else if (label === "dribbling") {
      pDraft.DRIB_TOT = Math.round(pVal);
      if (teamDraft && tVal !== undefined) teamDraft.DRIB_TOT = Math.round(tVal);
    } else if (label.includes("dribbling riusciti")) {
      if (pctCache) pctCache.dribPct = pVal;
      if (teamPctCache && tVal !== undefined) teamPctCache.dribPct = tVal;
    } else if (label === "contrasti") {
      pDraft.CTRS_TOT = Math.round(pVal);
      if (teamDraft && tVal !== undefined && !teamDraft.CTRS_TOT) teamDraft.CTRS_TOT = Math.round(tVal);
    } else if (label.includes("contrasti vinti")) {
      if (pctCache) pctCache.ctrsPct = pVal;
      if (teamPctCache && tVal !== undefined) teamPctCache.ctrsPct = tVal;
    } else if (label.includes("fuorigioco")) {
      pDraft.FGIOCO = Math.round(pVal);
    } else if (label.includes("falli commessi")) {
      pDraft.FALLI = Math.round(pVal);
    } else if (label.includes("possessi vinti")) {
      pDraft.POSS_VINTI = Math.round(pVal);
    } else if (label.includes("palle perse")) {
      pDraft.PALLE_PERSE = Math.round(pVal);
    } else if (label.includes("minuti giocati")) {
      pDraft.MINUTI = Math.round(pVal);
      if (teamDraft && tVal !== undefined && tVal >= 80) teamDraft.MINUTI = Math.round(tVal);
    } else if (label.includes("dist percorsa")) {
      pDraft.DIST_TOT = pVal;
    } else if (label.includes("dist in scatto")) {
      pDraft.DIST_SCATTO = pVal;
    }
    return;
  }

  if (tab === "Possesso") {
    if (label.includes("dribbling completati")) pDraft.DRIB_SI = Math.round(pVal);
    else if (label === "dribbling") pDraft.DRIB_TOT = Math.round(pVal);
    else if (label.includes("possesso palla")) pDraft.EXTRA_STATS.possesso_pct = pVal;
    else if (label.includes("distanza in dribbling")) pDraft.EXTRA_STATS.dist_dribbling_km = pVal;
    else if (label.includes("contrasti subiti")) pDraft.EXTRA_STATS.contrasti_subiti = Math.round(pVal);
    else if (label.includes("angolo conquistati")) pDraft.EXTRA_STATS.angoli_conquistati = Math.round(pVal);
    else if (label.includes("falli conquistati")) pDraft.EXTRA_STATS.falli_conquistati = Math.round(pVal);
    else if (label.includes("rigori conquistati")) pDraft.EXTRA_STATS.rigori_conquistati = Math.round(pVal);
    else if (label.includes("avversari superati")) pDraft.EXTRA_STATS.avversari_superati = Math.round(pVal);
    else if (label.includes("mosse abilita")) pDraft.EXTRA_STATS.mosse_abilita = Math.round(pVal);
    else if (label.includes("tunnel")) pDraft.EXTRA_STATS.tunnel = Math.round(pVal);
    else if (label.includes("tocchi in avanti")) pDraft.EXTRA_STATS.tocchi_avanti = Math.round(pVal);
    return;
  }

  if (tab === "Tiri") {
    if (label === "tiri") pDraft.TIRI_TOT = Math.round(pVal);
    else if (label.includes("tiri in porta")) pDraft.TIRI_IN = Math.round(pVal);
    else if (label.includes("gol previsti")) pDraft.EXTRA_STATS.xg = pVal;
    else if (label.includes("tiri fuori")) pDraft.EXTRA_STATS.tiri_fuori = Math.round(pVal);
    else if (label.includes("tiri bloccati")) pDraft.EXTRA_STATS.tiri_bloccati = Math.round(pVal);
    else if (label.includes("gol su punizione")) pDraft.EXTRA_STATS.gol_punizione = Math.round(pVal);
    else if (label.includes("gol su rigore")) pDraft.EXTRA_STATS.gol_rigore = Math.round(pVal);
    else if (label.includes("colpi di testa")) pDraft.EXTRA_STATS.colpi_testa = Math.round(pVal);
    else if (label.includes("tiro di precisione")) pDraft.EXTRA_STATS.tiri_precisione = Math.round(pVal);
    return;
  }

  if (tab === "Passaggi") {
    if (label === "passaggi") pDraft.PASS_TOT = Math.round(pVal);
    else if (label === "completati") pDraft.PASS_SI = Math.round(pVal);
    else if (label.includes("cross tentati") || label === "cross") pDraft.CROS_TOT = Math.round(pVal);
    else if (label.includes("cross riusciti") && !label.includes("precisione")) pDraft.CROS_SI = Math.round(pVal);
    else if (label.includes("assist previsti")) pDraft.EXTRA_STATS.xa = pVal;
    else if (label.includes("pre assist")) pDraft.EXTRA_STATS.pre_assist = Math.round(pVal);
    else if (label.includes("passaggi chiave")) pDraft.EXTRA_STATS.passaggi_chiave = Math.round(pVal);
    else if (label.includes("superamenti con passaggi")) pDraft.EXTRA_STATS.superamenti_passaggi = Math.round(pVal);
    else if (label.includes("passaggi rasoterra")) pDraft.EXTRA_STATS.passaggi_rasoterra = Math.round(pVal);
    else if (label.includes("filtranti") && !label.includes("morbidi")) pDraft.EXTRA_STATS.filtranti = Math.round(pVal);
    else if (label.includes("filtranti morbidi")) pDraft.EXTRA_STATS.filtranti_morbidi = Math.round(pVal);
    else if (label.includes("sotto pressione") && label.includes("completati")) pDraft.EXTRA_STATS.passaggi_sotto_pressione = Math.round(pVal);
    return;
  }

  if (tab === "Difesa") {
    if (label.includes("intercettazioni")) pDraft.EXTRA_STATS.intercettazioni = Math.round(pVal);
    else if (label.includes("tiri bloccati")) pDraft.EXTRA_STATS.tiri_bloccati_dif = Math.round(pVal);
    else if (label.includes("spazzate")) pDraft.EXTRA_STATS.spazzate = Math.round(pVal);
    else if (label.includes("fuorigioco provocati")) pDraft.EXTRA_STATS.fuorigioco_provocati = Math.round(pVal);
    else if (label.includes("duelli offensivi vinti") && !label.includes("duelli offensivi vinti ")) {
      pDraft.EXTRA_STATS.duelli_offensivi_vinti = Math.round(pVal);
    } else if (label.includes("duelli difensivi vinti")) {
      pDraft.EXTRA_STATS.duelli_difensivi_vinti = Math.round(pVal);
    } else if (label.includes("duelli aerei vinti")) {
      pDraft.EXTRA_STATS.duelli_aerei_vinti = Math.round(pVal);
    } else if (label.includes("scivolate vincenti")) {
      pDraft.EXTRA_STATS.scivolate_vinte = Math.round(pVal);
    } else if (label.includes("rigori concessi")) {
      pDraft.EXTRA_STATS.rigori_concessi = Math.round(pVal);
    } else if (label.includes("autogol")) {
      pDraft.AGOL = Math.round(pVal);
    }
    return;
  }

  if (tab === "Portiere") {
    if (label === "parate") pDraft.PARA = Math.round(pVal);
    else if (label === "gol subiti") pDraft.GSUB = Math.round(pVal);
    else if (label.includes("parate di pugno")) pDraft.EXTRA_STATS.parate_pugno = Math.round(pVal);
    else if (label.includes("parate in uscita")) pDraft.EXTRA_STATS.parate_uscita = Math.round(pVal);
    else if (label.includes("rigori parati")) pDraft.EXTRA_STATS.rigori_parati = Math.round(pVal);
    else if (label.includes("tiri subiti")) pDraft.EXTRA_STATS.tiri_subiti_por = Math.round(pVal);
  }
}

/**
 * Elabora una cartella o selezione di screenshot (da 2 fino a 450+ immagini come PROVA OLD-VFC)
 * popolando il report completo di squadra e giocatori a costo zero.
 */
export async function processMatchScreenshots(
  files: File[],
  baseReport: AdminMatchFullReport,
  onProgress?: (p: ScreenshotProgress) => void
): Promise<{ report: AdminMatchFullReport; summaryText: string }> {
  const sortedFiles = [...files]
    .filter((f) => /\.(jpe?g|png|webp)$/i.test(f.name))
    .sort((a, b) => a.name.localeCompare(b.name));

  if (sortedFiles.length === 0) {
    throw new Error("Nessuna immagine valida (.jpg, .png, .webp) trovata nella selezione.");
  }

  const report: AdminMatchFullReport = JSON.parse(JSON.stringify(baseReport));
  const workCanvas = document.createElement("canvas");
  workCanvas.width = 1920;
  workCanvas.height = 1080;
  const ctx = workCanvas.getContext("2d", { willReadFrequently: true })!;

  // FASE 1: Scansione geometrica ultra-rapida (< 2ms a immagine) per classificare e scartare i sub-tab N/D
  const activeFrames: AnalyzedFrame[] = [];
  let skippedBenchFrames = 0;

  for (let i = 0; i < sortedFiles.length; i++) {
    const file = sortedFiles[i];
    if (i % 15 === 0 || i === sortedFiles.length - 1) {
      onProgress?.({
        phase: "Classificazione geometrica schermate & filtro panchinari N/D",
        current: i + 1,
        total: sortedFiles.length,
        detail: `${file.name} (${skippedBenchFrames} sub-tab N/D ignorati)`,
      });
      await new Promise((r) => setTimeout(r, 0));
    }

    try {
      const img = await loadImageFromFile(file);
      const info = inspectFrameGeometry(img, ctx);
      if (info.kind === "PLAYER_PERFORMANCE" && info.isUnusedBench) {
        skippedBenchFrames++;
        continue;
      }
      activeFrames.push({ file, img, ...info });
    } catch {
      // Ignora file danneggiati
    }
  }

  // FASE 2: Inizializzazione OCR locale (Tesseract.js Web Worker)
  onProgress?.({
    phase: "Inizializzazione motore OCR locale per estrazione statistiche",
    current: 0,
    total: activeFrames.length,
    detail: `${activeFrames.length} schermate attive da leggere (${skippedBenchFrames} schermate N/D saltate)`,
  });

  const worker = await createWorker("ita+eng");
  const playerPctCache = new Map<number, Record<string, number>>();
  const homeTeamPct: Record<string, number> = {};
  const awayTeamPct: Record<string, number> = {};

  let lastPlayerSign = "";
  let currentPlayerDraft: AdminPlayerStatDraft | null = null;
  let currentTeamSide: "home" | "away" = "home";
  let leftRosterParsedForHome = false;
  let leftRosterParsedForAway = false;

  try {
    for (let idx = 0; idx < activeFrames.length; idx++) {
      const frame = activeFrames[idx];
      ctx.drawImage(frame.img, 0, 0, 1920, 1080);

      onProgress?.({
        phase:
          frame.kind === "TEAM_SUMMARY"
            ? `Lettura Riepilogo Squadra (${frame.tab})`
            : `Lettura Tabellino Giocatore (${frame.tab})`,
        current: idx + 1,
        total: activeFrames.length,
        detail: frame.file.name,
      });

      if (frame.kind === "TEAM_SUMMARY") {
        // 1. Scoreboard header (x: 840..1080, y: 40..135) -> "1 : 0" e minuti "92:23"
        const scoreUrl = cropBinarizedDataUrl(workCanvas, 830, 38, 260, 95, 1.8);
        const { data: scoreOcr } = await worker.recognize(scoreUrl);
        const scoreMatch = scoreOcr.text.match(/(\d+)\s*[:\-]\s*(\d+)/);
        if (scoreMatch) {
          report.homeTeamStat.GOL = parseInt(scoreMatch[1], 10);
          report.awayTeamStat.GOL = parseInt(scoreMatch[2], 10);
          report.homeTeamStat.GSUB = report.awayTeamStat.GOL;
          report.awayTeamStat.GSUB = report.homeTeamStat.GOL;
        }
        const minMatch = scoreOcr.text.match(/(\d{2,3})\s*:\s*\d{2}/);
        if (minMatch) {
          const mins = parseInt(minMatch[1], 10);
          if (mins >= 85 && mins <= 130) {
            report.homeTeamStat.MINUTI = mins;
            report.awayTeamStat.MINUTI = mins;
          }
        }

        // 2. Tabella centrale confronto squadre (x: 650..1270, y: 225..905)
        if (frame.tab !== "Possesso" && frame.tab !== "Eventi") {
          const centerUrl = cropBinarizedDataUrl(workCanvas, 650, 225, 620, 680, 1.5);
          const { data: centerOcr } = await worker.recognize(centerUrl);
          const rows = parseTeamCenterLines(centerOcr.text);

          for (const r of rows) {
            const l = r.label;
            const h = r.homeVal;
            const a = r.awayVal;
            if (l.includes("possesso palla")) {
              report.homeTeamStat.POSS = h > 1 ? Number((h / 100).toFixed(2)) : h;
              report.awayTeamStat.POSS = a > 1 ? Number((a / 100).toFixed(2)) : a;
            } else if (l.includes("tempo recupero")) {
              report.homeTeamStat.TEMPOREC = Math.round(h);
              report.awayTeamStat.TEMPOREC = Math.round(a);
            } else if (l === "tiri" || l === "tiri totali") {
              report.homeTeamStat.TIRI_TOT = Math.round(h);
              report.awayTeamStat.TIRI_TOT = Math.round(a);
            } else if (l === "in porta") {
              report.homeTeamStat.TIRI_SI = Math.round(h);
              report.awayTeamStat.TIRI_SI = Math.round(a);
            } else if (l.includes("gol previsti")) {
              report.homeTeamStat.xG = h;
              report.awayTeamStat.xG = a;
            } else if (l === "passaggi" || l === "passaggi totali") {
              report.homeTeamStat.PASS_TOT = Math.round(h);
              report.awayTeamStat.PASS_TOT = Math.round(a);
            } else if (l === "completati") {
              report.homeTeamStat.PASS_SI = Math.round(h);
              report.awayTeamStat.PASS_SI = Math.round(a);
            } else if (l === "cross") {
              report.homeTeamStat.CROS_TOT = Math.round(h);
              report.awayTeamStat.CROS_TOT = Math.round(a);
            } else if (l === "contrasti" || l === "contrasti in piedi") {
              report.homeTeamStat.CTRS_TOT = Math.round(h);
              report.awayTeamStat.CTRS_TOT = Math.round(a);
            } else if (l.includes("contrasti vinti") || l.includes("contrasti in piedi vincenti")) {
              report.homeTeamStat.CTRS_SI = Math.round(h);
              report.awayTeamStat.CTRS_SI = Math.round(a);
            } else if (l.includes("intercettazioni")) {
              report.homeTeamStat.INTERC = Math.round(h);
              report.awayTeamStat.INTERC = Math.round(a);
            } else if (l === "parate") {
              report.homeTeamStat.PARA = Math.round(h);
              report.awayTeamStat.PARA = Math.round(a);
            } else if (l.includes("falli commessi")) {
              report.homeTeamStat.FALLI = Math.round(h);
              report.awayTeamStat.FALLI = Math.round(a);
            } else if (l === "fuorigioco") {
              report.homeTeamStat.FGIOCO = Math.round(h);
              report.awayTeamStat.FGIOCO = Math.round(a);
            } else if (l.includes("angolo")) {
              report.homeTeamStat.CANGL = Math.round(h);
              report.awayTeamStat.CANGL = Math.round(a);
            } else if (l.includes("gialli")) {
              report.homeTeamStat.GIALLI = Math.round(h);
              report.awayTeamStat.GIALLI = Math.round(a);
            } else if (l.includes("rossi")) {
              report.homeTeamStat.ROSSI = Math.round(h);
              report.awayTeamStat.ROSSI = Math.round(a);
            } else if (l.includes("tagli difesa")) {
              report.homeTeamStat.TAGLI = Math.round(h);
              report.awayTeamStat.TAGLI = Math.round(a);
            } else if (l.includes("aggiramenti difesa")) {
              report.homeTeamStat.AGGIR = Math.round(h);
              report.awayTeamStat.AGGIR = Math.round(a);
            } else if (l.includes("scavalcamenti difesa")) {
              report.homeTeamStat.SCAVAL = Math.round(h);
              report.awayTeamStat.SCAVAL = Math.round(a);
            } else if (l.includes("incursioni")) {
              report.homeTeamStat.INCURS = Math.round(h);
              report.awayTeamStat.INCURS = Math.round(a);
            } else {
              const key = l.replace(/\s+/g, "_");
              report.homeTeamStat.EXTRA_STATS[key] = h;
              report.awayTeamStat.EXTRA_STATS[key] = a;
            }
          }
        }
        continue;
      }

      // === PLAYER_PERFORMANCE ===
      // Se cambia il giocatore selezionato (o è il primo frame giocatore), identifica squadra e giocatore!
      if (!currentPlayerDraft || frame.playerSignHash !== lastPlayerSign) {
        lastPlayerSign = frame.playerSignHash;

        // 1. Nome Squadra in alto a destra (x: 1360..1670, y: 55..115)
        const teamHeaderUrl = cropBinarizedDataUrl(workCanvas, 1360, 55, 310, 60, 1.5);
        const { data: teamOcr } = await worker.recognize(teamHeaderUrl);
        const rawTeam = normalizeStr(teamOcr.text);
        const homeNameNorm = normalizeStr(report.schedule.home_name);
        const awayNameNorm = normalizeStr(report.schedule.away_name);

        if (
          rawTeam &&
          (rawTeam.includes(awayNameNorm.split(" ")[0]) ||
            awayNameNorm.includes(rawTeam.split(" ")[0]))
        ) {
          currentTeamSide = "away";
        } else if (
          rawTeam &&
          (rawTeam.includes(homeNameNorm.split(" ")[0]) ||
            homeNameNorm.includes(rawTeam.split(" ")[0]))
        ) {
          currentTeamSide = "home";
        }

        const teamCandidates =
          currentTeamSide === "home" ? report.homePlayers : report.awayPlayers;

        // 2. Nome completo e Voto nel card in alto a sinistra (x: 255..630, y: 170..265)
        const playerHeaderUrl = cropBinarizedDataUrl(workCanvas, 255, 170, 375, 95, 1.8);
        const { data: pHeaderOcr } = await worker.recognize(playerHeaderUrl);
        const pHeaderText = pHeaderOcr.text.replace(/\r?\n/g, " ").trim();

        // Estrae voto (es. "7,6" o "9,3" o "7.0")
        const ratingMatch = pHeaderText.match(/\b([3-9][.,]\d|10[.,]0)\b/);
        const namePart = pHeaderText.replace(/\b([3-9][.,]\d|10[.,]0|N\/D)\b/gi, "").trim();

        currentPlayerDraft = matchPlayerToRoster(namePart, teamCandidates);

        // Fallback: se non trovato nella squadra corrente, prova nell'altra squadra
        if (!currentPlayerDraft) {
          const otherCandidates =
            currentTeamSide === "home" ? report.awayPlayers : report.homePlayers;
          const otherMatch = matchPlayerToRoster(namePart, otherCandidates);
          if (otherMatch) {
            currentPlayerDraft = otherMatch;
            currentTeamSide = currentTeamSide === "home" ? "away" : "home";
          }
        }

        if (currentPlayerDraft && ratingMatch) {
          currentPlayerDraft.VOTO = parseItNumber(ratingMatch[1]);
        }

        // 3. Una volta per squadra, legge anche la tabella riepilogativa di sinistra (POS | Nome | VP | G | ASS)
        if (
          (currentTeamSide === "home" && !leftRosterParsedForHome) ||
          (currentTeamSide === "away" && !leftRosterParsedForAway)
        ) {
          if (currentTeamSide === "home") leftRosterParsedForHome = true;
          else leftRosterParsedForAway = true;

          const leftTableUrl = cropBinarizedDataUrl(workCanvas, 65, 325, 580, 555, 1.6);
          const { data: leftOcr } = await worker.recognize(leftTableUrl);
          const listCandidates =
            currentTeamSide === "home" ? report.homePlayers : report.awayPlayers;

          for (const line of leftOcr.text.split(/\r?\n/)) {
            const m = line
              .trim()
              .match(/^([A-Z]{2,3})\s+(.+?)\s+([3-9][.,]\d|10[.,]0)\s+(\d+)\s+(\d+)$/);
            if (m) {
              const pos = m[1];
              const pName = m[2];
              const vp = parseItNumber(m[3]);
              const g = parseInt(m[4], 10);
              const ass = parseInt(m[5], 10);
              const matched = matchPlayerToRoster(pName, listCandidates);
              if (matched) {
                matched.POS_GIOCATA = pos;
                if (!matched.VOTO) matched.VOTO = vp;
                if (!matched.GOL && g > 0) matched.GOL = g;
                if (!matched.ASST && ass > 0) matched.ASST = ass;
                if (!matched.MINUTI && vp > 0) matched.MINUTI = 90;
              }
            }
          }
        }
      }

      if (!currentPlayerDraft) continue;

      // 4. Lettura del pannello statistiche di destra (x: 1265..1830, y: 265..895)
      const rightUrl = cropBinarizedDataUrl(workCanvas, 1265, 265, 565, 630, 1.5);
      const { data: rightOcr } = await worker.recognize(rightUrl);
      const parsedRows = parseRightPanelLines(rightOcr.text);

      if (!playerPctCache.has(currentPlayerDraft.ID)) {
        playerPctCache.set(currentPlayerDraft.ID, {});
      }
      const pPct = playerPctCache.get(currentPlayerDraft.ID)!;
      const tDraft =
        currentTeamSide === "home" ? report.homeTeamStat : report.awayTeamStat;
      const tPct = currentTeamSide === "home" ? homeTeamPct : awayTeamPct;

      for (const row of parsedRows) {
        applyPlayerRightPanelRow(
          frame.tab,
          row.label,
          row.nums,
          currentPlayerDraft,
          tDraft,
          pPct,
          tPct
        );
      }
    }
  } finally {
    await worker.terminate();
  }

  // FASE 3: Post-processing matematico (derivazione valori riusciti da % se non letti da sub-tab, MOTM, portiere)
  const finalizeTeamPlayers = (
    players: AdminPlayerStatDraft[],
    teamStat: AdminTeamStatDraft,
    opponentGol: number,
    tPct: Record<string, number>
  ) => {
    let bestPlayer: AdminPlayerStatDraft | null = null;
    for (const p of players) {
      const pcts = playerPctCache.get(p.ID) || {};
      if (p.TIRI_TOT > 0 && p.TIRI_IN === 0 && pcts.shotPct !== undefined) {
        p.TIRI_IN = Math.round((p.TIRI_TOT * pcts.shotPct) / 100);
      }
      if (p.PASS_TOT > 0 && p.PASS_SI === 0 && pcts.passPct !== undefined) {
        p.PASS_SI = Math.round((p.PASS_TOT * pcts.passPct) / 100);
      }
      if (p.DRIB_TOT > 0 && p.DRIB_SI === 0 && pcts.dribPct !== undefined) {
        p.DRIB_SI = Math.round((p.DRIB_TOT * pcts.dribPct) / 100);
      }
      if (p.CTRS_TOT > 0 && p.CTRS_SI === 0 && pcts.ctrsPct !== undefined) {
        p.CTRS_SI = Math.round((p.CTRS_TOT * pcts.ctrsPct) / 100);
      }
      if (p.Posiz === "POR" && p.MINUTI > 0) {
        if (p.GSUB === 0 && opponentGol > 0) p.GSUB = opponentGol;
        if (p.PARA === 0 && teamStat.PARA > 0) p.PARA = teamStat.PARA;
      }
      if (p.MINUTI > 0 && (!bestPlayer || p.VOTO > bestPlayer.VOTO)) {
        bestPlayer = p;
      }
    }

    if (teamStat.TIRI_TOT > 0 && teamStat.TIRI_SI === 0 && tPct.shotPct !== undefined) {
      teamStat.TIRI_SI = Math.round((teamStat.TIRI_TOT * tPct.shotPct) / 100);
    }
    if (teamStat.PASS_TOT > 0 && teamStat.PASS_SI === 0 && tPct.passPct !== undefined) {
      teamStat.PASS_SI = Math.round((teamStat.PASS_TOT * tPct.passPct) / 100);
    }
    if (teamStat.DRIB_TOT > 0 && teamStat.DRIB_SI === 0 && tPct.dribPct !== undefined) {
      teamStat.DRIB_SI = Math.round((teamStat.DRIB_TOT * tPct.dribPct) / 100);
    }
    if (teamStat.CTRS_TOT > 0 && teamStat.CTRS_SI === 0 && tPct.ctrsPct !== undefined) {
      teamStat.CTRS_SI = Math.round((teamStat.CTRS_TOT * tPct.ctrsPct) / 100);
    }

    // Calcolo totali da somma giocatori se non presenti nel riepilogo squadra
    const sumPlayers = (fn: (p: AdminPlayerStatDraft) => number) =>
      players.filter((p) => p.MINUTI > 0).reduce((acc, p) => acc + fn(p), 0);

    if (!teamStat.GOL) teamStat.GOL = sumPlayers((p) => p.GOL);
    if (!teamStat.ASST) teamStat.ASST = sumPlayers((p) => p.ASST);
    if (!teamStat.CROS_SI) teamStat.CROS_SI = sumPlayers((p) => p.CROS_SI);
    if (!teamStat.CROS_TOT) teamStat.CROS_TOT = sumPlayers((p) => p.CROS_TOT);

    const active = players.filter((p) => p.MINUTI > 0 && p.VOTO > 0);
    if (active.length > 0) {
      teamStat.VOTO = Number(
        (active.reduce((a, p) => a + p.VOTO, 0) / active.length).toFixed(2)
      );
    }
  };

  finalizeTeamPlayers(
    report.homePlayers,
    report.homeTeamStat,
    report.awayTeamStat.GOL,
    homeTeamPct
  );
  finalizeTeamPlayers(
    report.awayPlayers,
    report.awayTeamStat,
    report.homeTeamStat.GOL,
    awayTeamPct
  );

  // Imposta MOTM sul giocatore col voto più alto dell'intero match
  const allActive = [...report.homePlayers, ...report.awayPlayers].filter((p) => p.MINUTI > 0);
  if (allActive.length > 0) {
    allActive.forEach((p) => (p.MOTM = false));
    const top = allActive.reduce((best, cur) => (cur.VOTO > best.VOTO ? cur : best), allActive[0]);
    if (top && top.VOTO > 0) top.MOTM = true;
  }

  const homeActiveCount = report.homePlayers.filter((p) => p.MINUTI > 0).length;
  const awayActiveCount = report.awayPlayers.filter((p) => p.MINUTI > 0).length;

  return {
    report,
    summaryText: `Analizzate ${activeFrames.length} schermate utili (${skippedBenchFrames} schermate panchinari N/D scartate automaticamente). Rilevato risultato ${report.schedule.home} ${report.homeTeamStat.GOL} - ${report.awayTeamStat.GOL} ${report.schedule.away} (${homeActiveCount} giocatori casa, ${awayActiveCount} giocatori trasferta).`,
  };
}

// ============================================================================
// 4. CSV / TSV EXPORT & IMPORT (PUNTI #1 E #27)
// ============================================================================

export function exportMatchReportToCSV(report: AdminMatchFullReport): string {
  const lines: string[] = [];

  // Sezione 1: Metadati Partita
  lines.push("# MATCH_INFO");
  lines.push("STAG;WEEK;HOME;AWAY;DATE;TIME;STADIUM;REFEREE;WEATHER");
  lines.push(
    [
      report.schedule.stag,
      report.schedule.week,
      report.schedule.home,
      report.schedule.away,
      report.schedule.date,
      report.schedule.match_time || "21:00",
      report.schedule.stadium || "",
      report.schedule.referee || "",
      report.schedule.weather || "",
    ].join(";")
  );
  lines.push("");

  // Sezione 2: Statistiche Squadra (AS_TEAM_STAT)
  lines.push("# TEAM_STATS");
  const teamCols: (keyof AdminTeamStatDraft)[] = [
    "STAG", "WEEK", "ID", "ALLENATORE", "VOTO", "MINUTI", "GOL", "AGOL", "ASST",
    "TIRI_SI", "TIRI_TOT", "PASS_SI", "PASS_TOT", "DRIB_SI", "DRIB_TOT",
    "CROS_SI", "CROS_TOT", "CTRS_SI", "CTRS_TOT", "FALLI", "PARA", "GSUB",
    "GIALLI", "ROSSI", "FGIOCO", "POSS", "CANGL", "TEMPOREC", "xG", "INTERC",
    "TAGLI", "AGGIR", "SCAVAL", "INCURS",
  ];
  lines.push([...teamCols, "EXTRA_STATS_JSON"].join(";"));

  for (const ts of [report.homeTeamStat, report.awayTeamStat]) {
    const row = teamCols.map((c) => (ts[c] !== null && ts[c] !== undefined ? String(ts[c]) : ""));
    row.push(JSON.stringify(ts.EXTRA_STATS || {}));
    lines.push(row.join(";"));
  }
  lines.push("");

  // Sezione 3: Statistiche Calciatori (AS_PLAYER_STAT)
  lines.push("# PLAYER_STATS");
  const playerCols: (keyof AdminPlayerStatDraft)[] = [
    "ID", "TEAM_ID", "Nome", "Cognome", "Posiz", "POS_GIOCATA", "SUB", "MOTM",
    "VOTO", "MINUTI", "GOL", "AGOL", "ASST", "TIRI_IN", "TIRI_TOT",
    "PASS_SI", "PASS_TOT", "DRIB_SI", "DRIB_TOT", "CROS_SI", "CROS_TOT",
    "CTRS_SI", "CTRS_TOT", "FALLI", "PARA", "GSUB", "GIALLI", "ROSSI", "FGIOCO",
    "POSS_VINTI", "PALLE_PERSE", "DIST_TOT", "DIST_SCATTO",
  ];
  lines.push([...playerCols, "EXTRA_STATS_JSON"].join(";"));

  for (const ps of [...report.homePlayers, ...report.awayPlayers]) {
    const row = playerCols.map((c) => (ps[c] !== null && ps[c] !== undefined ? String(ps[c]) : ""));
    row.push(JSON.stringify(ps.EXTRA_STATS || {}));
    lines.push(row.join(";"));
  }

  return lines.join("\r\n");
}

export function importMatchReportFromCSV(
  csvText: string,
  baseReport: AdminMatchFullReport
): AdminMatchFullReport {
  const report: AdminMatchFullReport = JSON.parse(JSON.stringify(baseReport));
  const rawLines = csvText.split(/\r?\n/).map((l) => l.trim());

  let section: "NONE" | "MATCH_INFO" | "TEAM_STATS" | "PLAYER_STATS" = "NONE";
  let headers: string[] = [];

  for (const line of rawLines) {
    if (!line) continue;
    if (line.startsWith("# MATCH_INFO")) {
      section = "MATCH_INFO";
      headers = [];
      continue;
    }
    if (line.startsWith("# TEAM_STATS")) {
      section = "TEAM_STATS";
      headers = [];
      continue;
    }
    if (line.startsWith("# PLAYER_STATS")) {
      section = "PLAYER_STATS";
      headers = [];
      continue;
    }
    if (line.startsWith("#")) continue;

    const sep = line.includes(";") ? ";" : line.includes("\t") ? "\t" : ",";
    const cols = line.split(sep).map((c) => c.trim());

    if (headers.length === 0) {
      headers = cols.map((h) => h.toUpperCase());
      // Rilevamento automatico CSV piatto se non ci sono marker "# ..."
      if (section === "NONE") {
        if (headers.includes("MINUTI") && headers.includes("VOTO") && headers.includes("COGNOME")) {
          section = "PLAYER_STATS";
        } else if (headers.includes("POSS") && headers.includes("CANGL")) {
          section = "TEAM_STATS";
        }
      }
      continue;
    }

    const rowObj: Record<string, string> = {};
    headers.forEach((h, i) => {
      rowObj[h] = cols[i] ?? "";
    });

    if (section === "MATCH_INFO") {
      if (rowObj.DATE) report.schedule.date = rowObj.DATE;
      if (rowObj.TIME) report.schedule.match_time = rowObj.TIME;
      if (rowObj.STADIUM) report.schedule.stadium = rowObj.STADIUM;
      if (rowObj.REFEREE) report.schedule.referee = rowObj.REFEREE;
      if (rowObj.WEATHER) report.schedule.weather = rowObj.WEATHER;
    } else if (section === "TEAM_STATS") {
      const teamId = rowObj.ID || rowObj.TEAM_ID;
      const target =
        teamId === report.schedule.home
          ? report.homeTeamStat
          : teamId === report.schedule.away
          ? report.awayTeamStat
          : null;

      if (target) {
        if (rowObj.ALLENATORE) target.ALLENATORE = rowObj.ALLENATORE;
        target.VOTO = parseItNumber(rowObj.VOTO);
        target.MINUTI = Math.round(parseItNumber(rowObj.MINUTI) || 90);
        target.GOL = Math.round(parseItNumber(rowObj.GOL));
        target.AGOL = Math.round(parseItNumber(rowObj.AGOL));
        target.ASST = Math.round(parseItNumber(rowObj.ASST));
        target.TIRI_SI = Math.round(parseItNumber(rowObj.TIRI_SI));
        target.TIRI_TOT = Math.round(parseItNumber(rowObj.TIRI_TOT));
        target.PASS_SI = Math.round(parseItNumber(rowObj.PASS_SI));
        target.PASS_TOT = Math.round(parseItNumber(rowObj.PASS_TOT));
        target.DRIB_SI = Math.round(parseItNumber(rowObj.DRIB_SI));
        target.DRIB_TOT = Math.round(parseItNumber(rowObj.DRIB_TOT));
        target.CROS_SI = Math.round(parseItNumber(rowObj.CROS_SI));
        target.CROS_TOT = Math.round(parseItNumber(rowObj.CROS_TOT));
        target.CTRS_SI = Math.round(parseItNumber(rowObj.CTRS_SI));
        target.CTRS_TOT = Math.round(parseItNumber(rowObj.CTRS_TOT));
        target.FALLI = Math.round(parseItNumber(rowObj.FALLI));
        target.PARA = Math.round(parseItNumber(rowObj.PARA));
        target.GSUB = Math.round(parseItNumber(rowObj.GSUB));
        target.GIALLI = Math.round(parseItNumber(rowObj.GIALLI));
        target.ROSSI = Math.round(parseItNumber(rowObj.ROSSI));
        target.FGIOCO = Math.round(parseItNumber(rowObj.FGIOCO));
        target.POSS = parseItNumber(rowObj.POSS) || 0.5;
        target.CANGL = Math.round(parseItNumber(rowObj.CANGL));
        target.TEMPOREC = rowObj.TEMPOREC ? Math.round(parseItNumber(rowObj.TEMPOREC)) : null;
        target.xG = rowObj.XG ? parseItNumber(rowObj.XG) : null;
        target.INTERC = rowObj.INTERC ? Math.round(parseItNumber(rowObj.INTERC)) : null;
        target.TAGLI = rowObj.TAGLI ? Math.round(parseItNumber(rowObj.TAGLI)) : null;
        target.AGGIR = rowObj.AGGIR ? Math.round(parseItNumber(rowObj.AGGIR)) : null;
        target.SCAVAL = rowObj.SCAVAL ? Math.round(parseItNumber(rowObj.SCAVAL)) : null;
        target.INCURS = rowObj.INCURS ? Math.round(parseItNumber(rowObj.INCURS)) : null;
        if (rowObj.EXTRA_STATS_JSON) {
          try {
            target.EXTRA_STATS = JSON.parse(rowObj.EXTRA_STATS_JSON);
          } catch {}
        }
      }
    } else if (section === "PLAYER_STATS") {
      const pid = Number(rowObj.ID);
      const allList = [...report.homePlayers, ...report.awayPlayers];
      let target = allList.find((p) => p.ID === pid) || null;
      if (!target && (rowObj.NOME || rowObj.COGNOME)) {
        target = matchPlayerToRoster(`${rowObj.NOME || ""} ${rowObj.COGNOME || ""}`, allList);
      }

      if (target) {
        if (rowObj.POS_GIOCATA) target.POS_GIOCATA = rowObj.POS_GIOCATA;
        target.SUB = rowObj.SUB === "true" || rowObj.SUB === "1";
        target.MOTM = rowObj.MOTM === "true" || rowObj.MOTM === "1";
        target.VOTO = parseItNumber(rowObj.VOTO);
        target.MINUTI = Math.round(parseItNumber(rowObj.MINUTI));
        target.GOL = Math.round(parseItNumber(rowObj.GOL));
        target.AGOL = Math.round(parseItNumber(rowObj.AGOL));
        target.ASST = Math.round(parseItNumber(rowObj.ASST));
        target.TIRI_IN = Math.round(parseItNumber(rowObj.TIRI_IN));
        target.TIRI_TOT = Math.round(parseItNumber(rowObj.TIRI_TOT));
        target.PASS_SI = Math.round(parseItNumber(rowObj.PASS_SI));
        target.PASS_TOT = Math.round(parseItNumber(rowObj.PASS_TOT));
        target.DRIB_SI = Math.round(parseItNumber(rowObj.DRIB_SI));
        target.DRIB_TOT = Math.round(parseItNumber(rowObj.DRIB_TOT));
        target.CROS_SI = Math.round(parseItNumber(rowObj.CROS_SI));
        target.CROS_TOT = Math.round(parseItNumber(rowObj.CROS_TOT));
        target.CTRS_SI = Math.round(parseItNumber(rowObj.CTRS_SI));
        target.CTRS_TOT = Math.round(parseItNumber(rowObj.CTRS_TOT));
        target.FALLI = Math.round(parseItNumber(rowObj.FALLI));
        target.PARA = Math.round(parseItNumber(rowObj.PARA));
        target.GSUB = Math.round(parseItNumber(rowObj.GSUB));
        target.GIALLI = Math.round(parseItNumber(rowObj.GIALLI));
        target.ROSSI = Math.round(parseItNumber(rowObj.ROSSI));
        target.FGIOCO = Math.round(parseItNumber(rowObj.FGIOCO));
        target.POSS_VINTI = Math.round(parseItNumber(rowObj.POSS_VINTI));
        target.PALLE_PERSE = Math.round(parseItNumber(rowObj.PALLE_PERSE));
        target.DIST_TOT = parseItNumber(rowObj.DIST_TOT);
        target.DIST_SCATTO = parseItNumber(rowObj.DIST_SCATTO);
        if (rowObj.EXTRA_STATS_JSON) {
          try {
            target.EXTRA_STATS = JSON.parse(rowObj.EXTRA_STATS_JSON);
          } catch {}
        }
      }
    }
  }

  return report;
}

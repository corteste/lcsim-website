import { supabase } from "@/supabaseClient";

export interface TotwPlayer {
  id: number;
  name: string;
  surname: string;
  fullName: string;
  team: string; // Historical TEAM_ID
  teamName?: string; // Decoded full club name
  position: string; // "POR", "DC", "TD", "TS", "CC", "COC", "ATT", etc.
  slotLabel: string; // "POR", "TS", "DC", "DC", "TD", "CC", "CDC", "COC", "AS", "ATT", "AD"
  ovr: number;
  vote: number;
  minutes: number;
  goals: number;
  assists: number;
  saves: number;
  conceded: number;
  tackles: number;
  isMvp?: boolean;
  coordinates: { x: number; y: number }; // Percentage on 2D tactical pitch
}

export interface TotwResult {
  season: number;
  week: number;
  formation: "4-3-3";
  averageRating: number;
  mvp: TotwPlayer | null;
  players: TotwPlayer[];
}

// 4-3-3 Field Coordinates (% from top-left of pitch)
// Y: 84 (POR) -> 66 (DIF) -> 44 (CEN) -> 18 (ATT)
const FORMATION_433_COORDINATES: Record<string, { x: number; y: number }> = {
  POR: { x: 50, y: 84 },
  TS: { x: 16, y: 64 },
  DC1: { x: 38, y: 68 },
  DC2: { x: 62, y: 68 },
  TD: { x: 84, y: 64 },
  CEN1: { x: 26, y: 44 },
  CEN2: { x: 50, y: 48 },
  CEN3: { x: 74, y: 44 },
  AS: { x: 20, y: 18 },
  ATT: { x: 50, y: 14 },
  AD: { x: 80, y: 18 },
};

let teamCache: Map<string, string> | null = null;
async function getTeamNameMap(): Promise<Map<string, string>> {
  if (teamCache) return teamCache;
  try {
    const { data } = await supabase.from("an_team").select("TEAM_ID, NAME, NAME_ABBR");
    const map = new Map<string, string>();
    (data || []).forEach((t: any) => {
      if (t.TEAM_ID) {
        map.set(t.TEAM_ID.trim(), t.NAME || t.NAME_ABBR || t.TEAM_ID);
      }
    });
    teamCache = map;
    return map;
  } catch (_) {
    return new Map();
  }
}

export async function fetchAvailableTotwWeeks(season: number): Promise<number[]> {
  try {
    const { data, error } = await supabase
      .from("as_player_stat")
      .select("WEEK")
      .eq("STAG", season)
      .not("VOTO", "is", null)
      .gt("MINUTI", 0);

    if (error || !data) return [];
    const weeks = Array.from(new Set(data.map((r: any) => Number(r.WEEK)))).filter((w) => !isNaN(w) && w > 0);
    return weeks.sort((a, b) => a - b);
  } catch (err) {
    console.error("fetchAvailableTotwWeeks error:", err);
    return [];
  }
}

export async function fetchTotwForWeek(season: number, week: number): Promise<TotwResult | null> {
  try {
    const { data, error } = await supabase
      .from("view_player_stats")
      .select("*")
      .eq("STAG", season)
      .eq("WEEK", week)
      .not("VOTO", "is", null)
      .gt("MINUTI", 0);

    if (error || !data || data.length === 0) {
      return null;
    }

    // Filter only valid entries with a numerical vote
    const rows = data.filter((r) => typeof r.VOTO === "number" && r.VOTO > 0);
    if (rows.length === 0) return null;

    const teamNameMap = await getTeamNameMap();

    // Helper to map DB row to partial object (Punto #71: usa il TEAM_ID storico del referto gara)
    const mapRow = (r: any) => {
      const historicalTeam = (r.TEAM_ID || r.Squadra || "").trim();
      return {
        id: Number(r.ID),
        name: r.Nome || "",
        surname: r.Cognome || "",
        fullName: `${r.Nome || ""} ${r.Cognome || ""}`.trim(),
        team: historicalTeam,
        teamName: teamNameMap.get(historicalTeam) || historicalTeam,
        position: r.Posiz || "CC",
      ovr: Number(r.OVR) || 75,
      vote: Number(r.VOTO) || 6.0,
      minutes: Number(r.MINUTI) || 0,
      goals: Number(r.GOL) || 0,
      assists: Number(r.ASST) || 0,
      saves: Number(r.PARA) || 0,
      conceded: Number(r.GSUB) || 0,
      tackles: Number(r.CTRS_SI) || 0,
      yellows: Number(r.GIALLI) || 0,
      reds: Number(r.ROSSI) || 0,
    };
  };

    const allMapped = rows.map(mapRow);

    // 1. SELECT BEST GOALKEEPER (POR)
    const porCandidates = allMapped
      .filter((p) => p.position === "POR")
      .sort((a, b) => {
        if (b.vote !== a.vote) return b.vote - a.vote;
        if (b.saves !== a.saves) return b.saves - a.saves;
        return a.conceded - b.conceded;
      });

    const chosenGk = porCandidates[0] || null;

    // 2. SELECT 4 DEFENDERS (1 TS, 2 DC, 1 TD - with fallback to best overall DIF)
    const difSorter = (a: any, b: any) => {
      if (b.vote !== a.vote) return b.vote - a.vote;
      if (b.tackles !== a.tackles) return b.tackles - a.tackles;
      return a.yellows + a.reds * 2 - (b.yellows + b.reds * 2);
    };

    const usedIds = new Set<number>();
    if (chosenGk) usedIds.add(chosenGk.id);

    const allDefenders = allMapped
      .filter((p) => ["DC", "TD", "TS", "DIF", "ADA", "ASA"].includes(p.position) && !usedIds.has(p.id))
      .sort(difSorter);

    // Try specific TS
    let tsCandidate = allDefenders.find((p) => ["TS", "ASA"].includes(p.position) && !usedIds.has(p.id));
    if (tsCandidate) usedIds.add(tsCandidate.id);

    // Try specific TD
    let tdCandidate = allDefenders.find((p) => ["TD", "ADA"].includes(p.position) && !usedIds.has(p.id));
    if (tdCandidate) usedIds.add(tdCandidate.id);

    // DC candidates
    const dcCandidates = allDefenders.filter((p) => ["DC"].includes(p.position) && !usedIds.has(p.id));
    let dc1Candidate = dcCandidates[0] || null;
    if (dc1Candidate) usedIds.add(dc1Candidate.id);
    let dc2Candidate = dcCandidates[1] || null;
    if (dc2Candidate) usedIds.add(dc2Candidate.id);

    // Fill remaining defensive slots with best remaining defenders if specific ones weren't available
    const remainingDefs = allDefenders.filter((p) => !usedIds.has(p.id));
    if (!tsCandidate && remainingDefs.length > 0) {
      tsCandidate = remainingDefs.shift();
      if (tsCandidate) usedIds.add(tsCandidate.id);
    }
    if (!dc1Candidate && remainingDefs.length > 0) {
      dc1Candidate = remainingDefs.shift();
      if (dc1Candidate) usedIds.add(dc1Candidate.id);
    }
    if (!dc2Candidate && remainingDefs.length > 0) {
      dc2Candidate = remainingDefs.shift();
      if (dc2Candidate) usedIds.add(dc2Candidate.id);
    }
    if (!tdCandidate && remainingDefs.length > 0) {
      tdCandidate = remainingDefs.shift();
      if (tdCandidate) usedIds.add(tdCandidate.id);
    }

    // 3. SELECT 3 MIDFIELDERS (CEN)
    const cenSorter = (a: any, b: any) => {
      if (b.vote !== a.vote) return b.vote - a.vote;
      if (b.goals !== a.goals) return b.goals - a.goals;
      if (b.assists !== a.assists) return b.assists - a.assists;
      return b.tackles - a.tackles;
    };

    const midCandidates = allMapped
      .filter((p) => ["CC", "CDC", "COC", "ED", "ES", "CEN"].includes(p.position) && !usedIds.has(p.id))
      .sort(cenSorter);

    const chosenMids = midCandidates.slice(0, 3);
    chosenMids.forEach((m) => usedIds.add(m.id));

    // 4. SELECT 3 ATTACKERS (ATT)
    const attSorter = (a: any, b: any) => {
      if (b.vote !== a.vote) return b.vote - a.vote;
      if (b.goals !== a.goals) return b.goals - a.goals;
      if (b.assists !== a.assists) return b.assists - a.assists;
      return b.minutes - a.minutes;
    };

    const attCandidates = allMapped
      .filter((p) => ["ATT", "AT", "AD", "AS"].includes(p.position) && !usedIds.has(p.id))
      .sort(attSorter);

    const chosenAtts = attCandidates.slice(0, 3);
    chosenAtts.forEach((a) => usedIds.add(a.id));

    // Build the 11 slots
    const rawTotwList: Array<{ slot: string; data: any }> = [];

    if (chosenGk) rawTotwList.push({ slot: "POR", data: chosenGk });
    if (tsCandidate) rawTotwList.push({ slot: "TS", data: tsCandidate });
    if (dc1Candidate) rawTotwList.push({ slot: "DC1", data: dc1Candidate });
    if (dc2Candidate) rawTotwList.push({ slot: "DC2", data: dc2Candidate });
    if (tdCandidate) rawTotwList.push({ slot: "TD", data: tdCandidate });

    if (chosenMids[0]) rawTotwList.push({ slot: "CEN1", data: chosenMids[0] });
    if (chosenMids[1]) rawTotwList.push({ slot: "CEN2", data: chosenMids[1] });
    if (chosenMids[2]) rawTotwList.push({ slot: "CEN3", data: chosenMids[2] });

    if (chosenAtts[0]) rawTotwList.push({ slot: "AS", data: chosenAtts[0] });
    if (chosenAtts[1]) rawTotwList.push({ slot: "ATT", data: chosenAtts[1] });
    if (chosenAtts[2]) rawTotwList.push({ slot: "AD", data: chosenAtts[2] });

    if (rawTotwList.length === 0) return null;

    // Find MVP (highest vote overall among the selected 11)
    let maxVote = -1;
    let mvpPlayerId: number | null = null;
    rawTotwList.forEach(({ data: p }) => {
      if (p.vote > maxVote) {
        maxVote = p.vote;
        mvpPlayerId = p.id;
      }
    });

    const totwPlayers: TotwPlayer[] = rawTotwList.map(({ slot, data: p }) => {
      const coords = FORMATION_433_COORDINATES[slot] || { x: 50, y: 50 };
      const isMvp = p.id === mvpPlayerId;
      return {
        id: p.id,
        name: p.name,
        surname: p.surname,
        fullName: p.fullName,
        team: p.team,
        teamName: p.teamName,
        position: p.position,
        slotLabel: slot.replace(/\d+$/, ""),
        ovr: p.ovr,
        vote: p.vote,
        minutes: p.minutes,
        goals: p.goals,
        assists: p.assists,
        saves: p.saves,
        conceded: p.conceded,
        tackles: p.tackles,
        isMvp,
        coordinates: coords,
      };
    });

    const avgVote =
      totwPlayers.reduce((acc, p) => acc + p.vote, 0) / (totwPlayers.length || 1);

    const mvpObj = totwPlayers.find((p) => p.isMvp) || null;

    return {
      season,
      week,
      formation: "4-3-3",
      averageRating: Math.round(avgVote * 10) / 10,
      mvp: mvpObj,
      players: totwPlayers,
    };
  } catch (err) {
    console.error("fetchTotwForWeek error:", err);
    return null;
  }
}

/**
 * Computes how many times each player was selected into the TOTW during the specified season.
 * Cached in memory for speed.
 */
let cachedSeasonCounts: { season: number; map: Record<number, number>; timestamp: number } | null = null;

export async function fetchSeasonTotwCounts(season: number): Promise<Record<number, number>> {
  const now = Date.now();
  if (cachedSeasonCounts && cachedSeasonCounts.season === season && now - cachedSeasonCounts.timestamp < 60000) {
    return cachedSeasonCounts.map;
  }

  const weeks = await fetchAvailableTotwWeeks(season);
  const counts: Record<number, number> = {};

  for (const w of weeks) {
    const totw = await fetchTotwForWeek(season, w);
    if (totw && totw.players) {
      for (const p of totw.players) {
        counts[p.id] = (counts[p.id] || 0) + 1;
      }
    }
  }

  cachedSeasonCounts = { season, map: counts, timestamp: now };
  return counts;
}

export async function fetchPlayerTotwAppearances(playerId: number, season = 11): Promise<number> {
  if (!playerId) return 0;
  // If no counts in season 11, check season 10 as well
  const counts = await fetchSeasonTotwCounts(season);
  if (counts[playerId]) return counts[playerId];
  if (season === 11) {
    const prevCounts = await fetchSeasonTotwCounts(10);
    return prevCounts[playerId] || 0;
  }
  return 0;
}

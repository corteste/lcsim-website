import { supabase } from "@/supabaseClient";

export const NEUTRAL_MATCHDAY_WEEK = 6;
export const NEUTRAL_STADIUM_NAME = "PhoneHub Arena";
export const DEFAULT_DAILY_MATCH_TIMES = ["21:00", "21:30", "22:00"] as const;

export interface ScheduleTeamInfo {
  teamId: string;
  name: string;
  stadiumName: string;
}

export interface GeneratedMatchItem {
  id: string; // local UI key e.g. "W1-M1"
  week: number;
  matchIndex: number; // 0..5
  home: string;
  away: string;
  homeName: string;
  awayName: string;
  stadium: string;
  is_neutral: boolean;
  daySlot: "monday" | "tuesday" | "custom";
  date: string; // YYYY-MM-DD
  match_time: string; // HH:mm
  referee: string;
  weather: string;
}

export interface GeneratedWeekSchedule {
  week: number;
  isNeutralWeek: boolean;
  mondayDate: string; // YYYY-MM-DD
  tuesdayDate: string; // YYYY-MM-DD
  matches: GeneratedMatchItem[];
}

export interface TeamWeekRoleItem {
  week: number;
  role: "C" | "T" | "N"; // Casa, Trasferta, Neutro
  opponentId: string;
  opponentName: string;
}

export interface TeamScheduleVerification {
  teamId: string;
  teamName: string;
  stadiumName: string;
  homeCount: number;
  awayCount: number;
  neutralCount: number;
  uniqueOpponents: number;
  maxConsecutiveHome: number;
  maxConsecutiveAway: number;
  sequence: TeamWeekRoleItem[];
  isValid: boolean;
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Adds `days` to a YYYY-MM-DD string in UTC-safe calendar arithmetic.
 */
export function addDaysToDateStr(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, (m || 1) - 1, (d || 1) + days));
  return dt.toISOString().slice(0, 10);
}

/**
 * Returns the next upcoming Monday (or today if today is Monday) in YYYY-MM-DD format.
 */
export function getNextMondayDateStr(): string {
  const now = new Date();
  const day = now.getDay(); // 0 = Sun, 1 = Mon, ...
  const diffToMonday = day === 1 ? 0 : (8 - day) % 7;
  const target = new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday)
  );
  return target.toISOString().slice(0, 10);
}

/**
 * Fetches the 12 active Serie A clubs with their official stadiums.
 */
export async function fetchActiveScheduleTeams(): Promise<ScheduleTeamInfo[]> {
  const { data, error } = await supabase
    .from("an_team")
    .select('TEAM_ID, NAME, stadium_name, "ACTIVE"')
    .eq("ACTIVE", true)
    .order("NAME", { ascending: true });

  if (error) {
    throw new Error(error.message || "Impossibile caricare le squadre attive");
  }

  return (data || []).map((row: any) => ({
    teamId: String(row.TEAM_ID).trim(),
    name: String(row.NAME || row.TEAM_ID).trim(),
    stadiumName: String(row.stadium_name || "Stadio Ufficiale").trim(),
  }));
}

/**
 * Generates a complete, mathematically balanced 11-week Round-Robin schedule for 12 teams:
 * - 11 weeks, 6 matches per week (each pair meets once).
 * - Week 6 is played on neutral ground ("PhoneHub Arena").
 * - Across the 10 non-neutral weeks (1..5 and 7..11), each team plays:
 *   - Exactly 5 Home matches and 5 Away matches.
 *   - At most 2 consecutive Home or Away matches (ignoring Week 6 neutral).
 * - Splits each week's 6 matches into 3 on Monday and 3 on Tuesday.
 */
export function generateBalancedSeasonSchedule(
  teams: ScheduleTeamInfo[],
  startMondayDateStr: string
): GeneratedWeekSchedule[] {
  const n = teams.length;
  if (n !== 12) {
    throw new Error(
      `Il generatore richiede esattamente 12 squadre attive (trovate: ${n}).`
    );
  }

  const teamByIndex = teams;

  for (let attempt = 0; attempt < 80; attempt++) {
    const perm = shuffleArray([...Array(n).keys()]);
    const fixed = perm[n - 1];
    const rot = perm.slice(0, n - 1);

    // 1. Circle method 1-factorization of K_12 (11 rounds of 6 unordered pairs)
    let rawRounds: Array<Array<[number, number]>> = [];
    for (let r = 0; r < 11; r++) {
      const pairs: Array<[number, number]> = [];
      pairs.push([rot[r % 11], fixed]);
      for (let k = 1; k <= 5; k++) {
        pairs.push([rot[(r + k) % 11], rot[(r + 11 - k) % 11]]);
      }
      rawRounds.push(shuffleArray(pairs));
    }

    rawRounds = shuffleArray(rawRounds);

    // Non-neutral round indices (0..4 corresponds to Week 1..5, 6..10 corresponds to Week 7..11)
    const nonNeutralIndices = [0, 1, 2, 3, 4, 6, 7, 8, 9, 10];
    const nonNeutralRounds = nonNeutralIndices.map((idx) => rawRounds[idx]);

    const homeCount = new Int8Array(n);
    const lastDir = new Int8Array(n); // 1 = Home, -1 = Away, 0 = none
    const streak = new Int8Array(n);
    const orientations: boolean[][] = Array.from({ length: 10 }, () =>
      new Array(6).fill(true)
    );

    let steps = 0;
    const MAX_STEPS = 60000;

    const solve = (roundIdx: number, pairIdx: number): boolean => {
      if (roundIdx === 10) return true;
      if (++steps > MAX_STEPS) return false;

      if (pairIdx === 6) {
        return solve(roundIdx + 1, 0);
      }

      const [u, v] = nonNeutralRounds[roundIdx][pairIdx];
      const remAfter = 9 - roundIdx;
      const choices = Math.random() < 0.5 ? [true, false] : [false, true];

      for (const uIsHome of choices) {
        const dirU = uIsHome ? 1 : -1;
        const dirV = uIsHome ? -1 : 1;

        const nextStreakU = lastDir[u] === dirU ? streak[u] + 1 : 1;
        if (nextStreakU > 2) continue;

        const nextStreakV = lastDir[v] === dirV ? streak[v] + 1 : 1;
        if (nextStreakV > 2) continue;

        const nextHomeU = homeCount[u] + (uIsHome ? 1 : 0);
        if (nextHomeU > 5 || nextHomeU + remAfter < 5) continue;

        const nextHomeV = homeCount[v] + (uIsHome ? 0 : 1);
        if (nextHomeV > 5 || nextHomeV + remAfter < 5) continue;

        // Lookahead pruning when streak reaches 2
        if (
          nextStreakU === 2 &&
          dirU === 1 &&
          remAfter >= 1 &&
          nextHomeU + (remAfter - 1) < 5
        )
          continue;
        if (
          nextStreakV === 2 &&
          dirV === 1 &&
          remAfter >= 1 &&
          nextHomeV + (remAfter - 1) < 5
        )
          continue;

        const nextAwayU = roundIdx + 1 - nextHomeU;
        const nextAwayV = roundIdx + 1 - nextHomeV;
        if (
          nextStreakU === 2 &&
          dirU === -1 &&
          remAfter >= 1 &&
          nextAwayU + (remAfter - 1) < 5
        )
          continue;
        if (
          nextStreakV === 2 &&
          dirV === -1 &&
          remAfter >= 1 &&
          nextAwayV + (remAfter - 1) < 5
        )
          continue;

        // Commit choice
        const pHomeU = homeCount[u],
          pLastU = lastDir[u],
          pStreakU = streak[u];
        const pHomeV = homeCount[v],
          pLastV = lastDir[v],
          pStreakV = streak[v];

        homeCount[u] = nextHomeU;
        lastDir[u] = dirU;
        streak[u] = nextStreakU;
        homeCount[v] = nextHomeV;
        lastDir[v] = dirV;
        streak[v] = nextStreakV;
        orientations[roundIdx][pairIdx] = uIsHome;

        if (solve(roundIdx, pairIdx + 1)) return true;

        // Backtrack
        homeCount[u] = pHomeU;
        lastDir[u] = pLastU;
        streak[u] = pStreakU;
        homeCount[v] = pHomeV;
        lastDir[v] = pLastV;
        streak[v] = pStreakV;
      }

      return false;
    };

    if (solve(0, 0)) {
      const weeks: GeneratedWeekSchedule[] = [];

      for (let wIdx = 0; wIdx < 11; wIdx++) {
        const weekNum = wIdx + 1;
        const isNeutralWeek = weekNum === NEUTRAL_MATCHDAY_WEEK;
        const mondayDate = addDaysToDateStr(startMondayDateStr, wIdx * 7);
        const tuesdayDate = addDaysToDateStr(mondayDate, 1);

        const nonNeutralPos = nonNeutralIndices.indexOf(wIdx);
        const pairs = rawRounds[wIdx];

        const matches: GeneratedMatchItem[] = pairs.map((pair, mIdx) => {
          const [u, v] = pair;
          let homeIdx = u;
          let awayIdx = v;

          if (isNeutralWeek) {
            // Neutral week: randomize left/right display order
            if (Math.random() < 0.5) {
              homeIdx = v;
              awayIdx = u;
            }
          } else {
            const uIsHome = orientations[nonNeutralPos][mIdx];
            homeIdx = uIsHome ? u : v;
            awayIdx = uIsHome ? v : u;
          }

          const homeTeam = teamByIndex[homeIdx];
          const awayTeam = teamByIndex[awayIdx];
          const daySlot: "monday" | "tuesday" = mIdx < 3 ? "monday" : "tuesday";
          const matchDate = daySlot === "monday" ? mondayDate : tuesdayDate;
          const slotIndex = mIdx < 3 ? mIdx : mIdx - 3;
          const matchTime = DEFAULT_DAILY_MATCH_TIMES[slotIndex] || "21:00";

          return {
            id: `W${weekNum}-M${mIdx + 1}`,
            week: weekNum,
            matchIndex: mIdx,
            home: homeTeam.teamId,
            away: awayTeam.teamId,
            homeName: homeTeam.name,
            awayName: awayTeam.name,
            stadium: isNeutralWeek
              ? NEUTRAL_STADIUM_NAME
              : homeTeam.stadiumName || "Stadio Ufficiale",
            is_neutral: isNeutralWeek,
            daySlot,
            date: matchDate,
            match_time: matchTime,
            referee: "Arbitro Federale",
            weather: "Sereno",
          };
        });

        weeks.push({
          week: weekNum,
          isNeutralWeek,
          mondayDate,
          tuesdayDate,
          matches,
        });
      }

      return weeks;
    }
  }

  throw new Error(
    "Impossibile generare una combinazione valida dopo molteplici tentativi. Riprova."
  );
}

/**
 * Re-applies a new global Start Monday date across all 11 weeks.
 */
export function applyGlobalStartMondayToSchedule(
  weeks: GeneratedWeekSchedule[],
  startMondayDateStr: string
): GeneratedWeekSchedule[] {
  return weeks.map((w, idx) => {
    const mondayDate = addDaysToDateStr(startMondayDateStr, idx * 7);
    const tuesdayDate = addDaysToDateStr(mondayDate, 1);
    return {
      ...w,
      mondayDate,
      tuesdayDate,
      matches: w.matches.map((m) => ({
        ...m,
        date:
          m.daySlot === "monday"
            ? mondayDate
            : m.daySlot === "tuesday"
            ? tuesdayDate
            : m.date,
      })),
    };
  });
}

/**
 * Evaluates all mathematical constraints per team for the verification table.
 */
export function verifyGeneratedSchedule(
  weeks: GeneratedWeekSchedule[],
  teams: ScheduleTeamInfo[]
): TeamScheduleVerification[] {
  const teamMap = new Map<string, ScheduleTeamInfo>();
  teams.forEach((t) => teamMap.set(t.teamId, t));

  return teams.map((team) => {
    let homeCount = 0;
    let awayCount = 0;
    let neutralCount = 0;
    let maxConsecutiveHome = 0;
    let maxConsecutiveAway = 0;
    let curHomeStreak = 0;
    let curAwayStreak = 0;
    const opponentsSet = new Set<string>();
    const sequence: TeamWeekRoleItem[] = [];

    const sortedWeeks = [...weeks].sort((a, b) => a.week - b.week);

    for (const w of sortedWeeks) {
      const match = w.matches.find(
        (m) => m.home === team.teamId || m.away === team.teamId
      );
      if (!match) continue;

      const isHomeSide = match.home === team.teamId;
      const oppId = isHomeSide ? match.away : match.home;
      const oppName =
        teamMap.get(oppId)?.name ||
        (isHomeSide ? match.awayName : match.homeName);
      opponentsSet.add(oppId);

      if (match.is_neutral || w.week === NEUTRAL_MATCHDAY_WEEK) {
        neutralCount++;
        sequence.push({
          week: w.week,
          role: "N",
          opponentId: oppId,
          opponentName: oppName,
        });
        // Neutral matchday (Week 6) does NOT count toward consecutive Home/Away streak
      } else if (isHomeSide) {
        homeCount++;
        curHomeStreak++;
        curAwayStreak = 0;
        if (curHomeStreak > maxConsecutiveHome) {
          maxConsecutiveHome = curHomeStreak;
        }
        sequence.push({
          week: w.week,
          role: "C",
          opponentId: oppId,
          opponentName: oppName,
        });
      } else {
        awayCount++;
        curAwayStreak++;
        curHomeStreak = 0;
        if (curAwayStreak > maxConsecutiveAway) {
          maxConsecutiveAway = curAwayStreak;
        }
        sequence.push({
          week: w.week,
          role: "T",
          opponentId: oppId,
          opponentName: oppName,
        });
      }
    }

    const isValid =
      homeCount === 5 &&
      awayCount === 5 &&
      neutralCount === 1 &&
      opponentsSet.size === 11 &&
      maxConsecutiveHome <= 2 &&
      maxConsecutiveAway <= 2;

    return {
      teamId: team.teamId,
      teamName: team.name,
      stadiumName: team.stadiumName,
      homeCount,
      awayCount,
      neutralCount,
      uniqueOpponents: opponentsSet.size,
      maxConsecutiveHome,
      maxConsecutiveAway,
      sequence,
      isValid,
    };
  });
}

/**
 * Saves the approved 66-match season schedule to Supabase via RPC.
 */
export async function saveGeneratedSeasonSchedule(
  stag: number,
  weeks: GeneratedWeekSchedule[],
  adminName: string
): Promise<{ success: boolean; inserted_count?: number; error?: string }> {
  const flatMatches = weeks.flatMap((w) =>
    w.matches.map((m) => ({
      week: w.week,
      home: m.home,
      away: m.away,
      stadium: m.is_neutral ? NEUTRAL_STADIUM_NAME : m.stadium,
      is_neutral: m.is_neutral,
      date: m.date,
      match_time: m.match_time || "21:00",
      referee: m.referee || "Arbitro Federale",
      weather: m.weather || "Sereno",
    }))
  );

  const { data, error } = await supabase.rpc("rpc_admin_save_season_schedule", {
    p_stag: stag,
    p_matches: flatMatches,
    p_admin_name: adminName,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return (data || { success: false, error: "Risposta vuota dal server" }) as {
    success: boolean;
    inserted_count?: number;
    error?: string;
  };
}

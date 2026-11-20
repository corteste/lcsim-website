import { supabase } from "@/supabaseClient";
import { fetchPlayerTotwAppearances } from "@/services/totwService";
import { getHistoricalTeamMeta } from "@/services/archiveService";

export interface PlayerTeamTrophy {
  id: string;
  trophyType: "scudetto" | "supercoppa";
  title: string;
  season: number;
  seasonLabel: string;
  teamId: string;
  teamName: string;
  wonAsTeamName?: string;
  notes?: string;
}

export type PlayerAwardType =
  | "capocannoniere"
  | "assistman"
  | "golden_glove"
  | "mvp"
  | "finals_mvp"
  | "miglior_portiere"
  | "miglior_difensore"
  | "miglior_centrocampista"
  | "miglior_attaccante"
  | "mip"
  | "roty"
  | "weekly_mvp"
  | "all_star"
  | "ring"
  | "custom";

export interface PlayerIndividualAward {
  id: string;
  awardType: PlayerAwardType;
  title: string;
  season: number;
  seasonLabel: string;
  teamId: string;
  teamName: string;
  statValue?: string;
  notes?: string;
}

export interface PlayerHallOfFame {
  inductionClass: string;
  activeSeasons: string;
  inductionOrder?: number;
  bioNote?: string;
}

export interface PlayerPalmares {
  playerId: number;
  teamTrophies: PlayerTeamTrophy[];
  individualAwards: PlayerIndividualAward[];
  hallOfFame: PlayerHallOfFame | null;
  totwCount: number;
  allStarCount: number;
  totalTrophiesCount: number;
  scudettiCount: number;
  supercoppeCount: number;
  individualAwardsCount: number;
}

const EXCLUDED_FROM_INDIVIDUAL_LIST = new Set(["all_star", "ring", "weekly_mvp"]);

export interface PlayerPalmaresLeaderboardRow {
  playerId: number;
  scudettiCount: number;
  supercoppeCount: number;
  teamTrophiesCount: number;
  individualAwardsCount: number;
  totalCount: number;
}

async function fetchAllPaginated(table: string, selectCols: string): Promise<any[]> {
  const PAGE_SIZE = 1000;
  let offset = 0;
  const rows: any[] = [];
  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select(selectCols)
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) throw error;
    const batch = data || [];
    rows.push(...batch);
    if (batch.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }
  return rows;
}

/**
 * Calcola per tutti i calciatori la somma totale di trofei di squadra (Scudetti + Supercoppe)
 * e premi individuali ufficiali vinti in carriera (esclusi Hall of Fame, All-Star, Ring e TOTW).
 */
export async function fetchAllPlayersPalmaresLeaderboard(): Promise<PlayerPalmaresLeaderboardRow[]> {
  const [playerSeasons, allTeamTrophies, rawAwards] = await Promise.all([
    fetchAllPaginated("an_player_career_seasons", "player_id, stagione, team_id, franchise_id"),
    supabase.from("team_trophies").select("season_number, team_id, trophy_type").then((res) => {
      if (res.error) throw res.error;
      return res.data || [];
    }),
    fetchAllPaginated("player_awards", "player_id, award_type"),
  ]);

  const byPlayer = new Map<number, PlayerPalmaresLeaderboardRow>();
  const ensure = (pid: number) => {
    let cur = byPlayer.get(pid);
    if (!cur) {
      cur = {
        playerId: pid,
        scudettiCount: 0,
        supercoppeCount: 0,
        teamTrophiesCount: 0,
        individualAwardsCount: 0,
        totalCount: 0,
      };
      byPlayer.set(pid, cur);
    }
    return cur;
  };

  for (const cs of playerSeasons) {
    const pid = Number(cs.player_id);
    const sNum = Number(cs.stagione);
    if (!pid || !sNum) continue;

    for (const tt of allTeamTrophies) {
      if (
        Number(tt.season_number) === sNum &&
        (tt.team_id === cs.team_id || tt.team_id === cs.franchise_id)
      ) {
        const cur = ensure(pid);
        if (tt.trophy_type === "scudetto") cur.scudettiCount += 1;
        else cur.supercoppeCount += 1;
        cur.teamTrophiesCount += 1;
        cur.totalCount += 1;
      }
    }
  }

  for (const aw of rawAwards) {
    const pid = Number(aw.player_id);
    if (!pid || EXCLUDED_FROM_INDIVIDUAL_LIST.has(aw.award_type)) continue;
    const cur = ensure(pid);
    cur.individualAwardsCount += 1;
    cur.totalCount += 1;
  }

  return Array.from(byPlayer.values())
    .filter((r) => r.totalCount > 0)
    .sort(
      (a, b) =>
        b.totalCount - a.totalCount ||
        b.scudettiCount - a.scudettiCount ||
        b.individualAwardsCount - a.individualAwardsCount
    );
}

/**
 * Recupera l'intero Palmarès del calciatore:
 * 1. Trofei di Squadra (Scudetti e Supercoppe incrociando an_player_career_seasons e team_trophies)
 * 2. Riconoscimenti e Premi Individuali (player_awards)
 * 3. Induzione nella Hall of Fame (an_hall_of_fame)
 * 4. Presenze nella Squadra della Settimana (TOTW)
 */
export async function fetchPlayerPalmares(playerId: number): Promise<PlayerPalmares> {
  const [seasonsRes, trophiesRes, awardsRes, hofRes, totwCount] = await Promise.all([
    supabase
      .from("an_player_career_seasons")
      .select("stagione, team_id, franchise_id")
      .eq("player_id", playerId),
    supabase
      .from("team_trophies")
      .select("*")
      .order("season_number", { ascending: true }),
    supabase
      .from("player_awards")
      .select("*")
      .eq("player_id", playerId)
      .order("season", { ascending: true }),
    supabase
      .from("an_hall_of_fame")
      .select("*")
      .eq("player_id", playerId)
      .maybeSingle(),
    fetchPlayerTotwAppearances(playerId).catch(() => 0),
  ]);

  if (seasonsRes.error) throw seasonsRes.error;
  if (trophiesRes.error) throw trophiesRes.error;
  if (awardsRes.error) throw awardsRes.error;

  const playerSeasons = seasonsRes.data || [];
  const allTeamTrophies = trophiesRes.data || [];
  const rawAwards = awardsRes.data || [];
  const hofData = hofRes.data;

  // 1. Risolvi Trofei di Squadra
  const teamTrophies: PlayerTeamTrophy[] = [];
  for (const cs of playerSeasons) {
    const sNum = Number(cs.stagione);
    const wonTrophies = allTeamTrophies.filter(
      (tt: any) =>
        Number(tt.season_number) === sNum &&
        (tt.team_id === cs.team_id || tt.team_id === cs.franchise_id)
    );

    for (const tt of wonTrophies) {
      const isScudetto = tt.trophy_type === "scudetto";
      const meta = getHistoricalTeamMeta(tt.won_as_team_name ? cs.team_id : tt.team_id);
      teamTrophies.push({
        id: `${tt.id}-${playerId}`,
        trophyType: isScudetto ? "scudetto" : "supercoppa",
        title: isScudetto ? "Scudetto Serie A LCSIM" : "Supercoppa di Lega LCSIM",
        season: sNum,
        seasonLabel: tt.season_label || `Stagione ${sNum}`,
        teamId: cs.team_id,
        teamName: tt.won_as_team_name || meta.fullName,
        wonAsTeamName: tt.won_as_team_name,
        notes: tt.notes,
      });
    }
  }

  // Ordina trofei di squadra per stagione crescente
  teamTrophies.sort((a, b) => a.season - b.season);

  // 2. Risolvi Premi Individuali & Conteggio All-Star
  const allStarCount = rawAwards.filter((a: any) => a.award_type === "all_star").length;

  const individualAwards: PlayerIndividualAward[] = rawAwards
    .filter((a: any) => !EXCLUDED_FROM_INDIVIDUAL_LIST.has(a.award_type))
    .map((a: any) => {
      const meta = getHistoricalTeamMeta(a.team_id);
      return {
        id: a.id,
        awardType: a.award_type,
        title: a.award_title,
        season: Number(a.season),
        seasonLabel: `Stagione ${a.season}`,
        teamId: a.team_id,
        teamName: meta.fullName,
        statValue: a.stat_value,
        notes: a.notes,
      };
    });

  // 3. Hall of Fame
  const hallOfFame: PlayerHallOfFame | null = hofData
    ? {
        inductionClass: hofData.induction_class,
        activeSeasons: hofData.active_seasons,
        inductionOrder: hofData.induction_order,
        bioNote: hofData.bio_note,
      }
    : null;

  const scudettiCount = teamTrophies.filter((t) => t.trophyType === "scudetto").length;
  const supercoppeCount = teamTrophies.filter((t) => t.trophyType === "supercoppa").length;
  const individualAwardsCount = individualAwards.length;
  const totalTrophiesCount =
    teamTrophies.length + individualAwardsCount + (hallOfFame ? 1 : 0);

  return {
    playerId,
    teamTrophies,
    individualAwards,
    hallOfFame,
    totwCount: totwCount || 0,
    allStarCount,
    totalTrophiesCount,
    scudettiCount,
    supercoppeCount,
    individualAwardsCount,
  };
}

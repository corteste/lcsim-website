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

export interface PlayerIndividualAward {
  id: string;
  awardType: "capocannoniere" | "assistman" | "golden_glove" | "mvp" | "custom";
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
  totalTrophiesCount: number;
  scudettiCount: number;
  supercoppeCount: number;
  individualAwardsCount: number;
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

  // 2. Risolvi Premi Individuali
  const individualAwards: PlayerIndividualAward[] = rawAwards.map((a: any) => {
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
    totalTrophiesCount,
    scudettiCount,
    supercoppeCount,
    individualAwardsCount,
  };
}

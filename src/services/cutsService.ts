import { supabase } from "@/supabaseClient";

export interface TeamCutRecord {
  id: number;
  player_id: number;
  team_id: string;
  created_at: string;
}

export interface TeamCutCompliance {
  teamId: string;
  teamName: string;
  currentRoster: number;
  cutsCount: number;
  minCuts: number;
  maxCuts: number;
  postRoster: number;
  currentGk: number;
  cutGk: number;
  postGk: number;
  picksCount: number; // Scelte draft possedute e non ancora utilizzate (Punto #33)
  postAssets: number; // Giocatori post-tagli + scelte draft (Punto #33)
  isCompliant: boolean;
  gkReason?: string;
  assetReason?: string;
}

/** Limiti regolamentari della rosa post-tagli */
export const CUTS_MIN_ROSTER = 13;
export const CUTS_MAX_ROSTER = 16;
export const CUTS_MAX_ASSETS = 21;
export const CUTS_MIN_GK = 2;

/**
 * Calcola le scelte compensatorie al Draft spettanti in base alla dimensione della rosa post-tagli (Punto #32)
 * 16 giocatori -> 0 scelte
 * 15 giocatori -> 1 scelta compensatoria (fine Round 4)
 * 14 giocatori -> 2 scelte compensatorie (fine Round 3 e Round 4)
 * 13 giocatori -> 3 scelte compensatorie (fine Round 2, Round 3 e Round 4)
 */
export function getCompensatoryPicksCount(postRoster: number): number {
  if (postRoster <= CUTS_MAX_ROSTER && postRoster >= CUTS_MIN_ROSTER) {
    return Math.max(0, CUTS_MAX_ROSTER - postRoster);
  }
  return 0;
}

/**
 * Conta le scelte draft possedute da una squadra e non ancora utilizzate (Punto #33)
 */
export async function getTeamAvailablePicksCount(teamId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from("an_draft_board")
      .select("pick_overall", { count: "exact", head: true })
      .eq("team_id", teamId)
      .is("rookie_id", null)
      .is("player_id", null);

    if (error) throw error;
    return count ?? 0;
  } catch (err) {
    console.error("Errore conteggio scelte draft squadra:", err);
    return 0;
  }
}

export interface CutsComplianceReport {
  teams: TeamCutCompliance[];
  allCompliant: boolean;
  totalCuts: number;
  nonCompliantTeams: TeamCutCompliance[];
}

/**
 * Recupera gli ID dei giocatori inseriti nella lista tagli per una determinata squadra
 */
export async function getTeamCutPlayerIds(teamId: string): Promise<number[]> {
  try {
    const { data, error } = await supabase
      .from("team_cuts_registry")
      .select("player_id")
      .eq("team_id", teamId);

    if (error) throw error;
    return (data || []).map((row) => Number(row.player_id));
  } catch (err) {
    console.error("Errore recupero lista tagli squadra:", err);
    return [];
  }
}

/**
 * Aggiunge o rimuove un calciatore dalla lista tagli della squadra.
 * Include il controllo di salvaguardia portieri (minimo 2 portieri rimanenti).
 */
export async function togglePlayerCut(
  playerId: number,
  teamId: string,
  isCurrentlyCut: boolean
): Promise<{ success: boolean; isNowCut: boolean; error?: string }> {
  try {
    if (isCurrentlyCut) {
      const { error } = await supabase
        .from("team_cuts_registry")
        .delete()
        .eq("player_id", playerId);

      if (error) throw error;
      return { success: true, isNowCut: false };
    } else {
      // Controllo di salvaguardia portieri: se si taglia un portiere, la squadra deve mantenere almeno 2 portieri in rosa
      const { data: player, error: pError } = await supabase
        .from("an_player")
        .select("Posiz")
        .eq("ID", playerId)
        .single();

      if (pError) throw pError;

      if (player?.Posiz === "POR") {
        const { data: gks, error: gkError } = await supabase
          .from("an_player")
          .select("ID")
          .eq("Squadra", teamId)
          .eq("Posiz", "POR");

        if (gkError) throw gkError;

        const { data: cutRecords, error: cError } = await supabase
          .from("team_cuts_registry")
          .select("player_id")
          .eq("team_id", teamId);

        if (cError) throw cError;

        const gkIds = new Set((gks || []).map((g) => Number(g.ID)));
        const alreadyCutGkCount = (cutRecords || []).filter((c) => gkIds.has(Number(c.player_id))).length;
        const remainingGk = (gks || []).length - alreadyCutGkCount;

        if (remainingGk <= 2) {
          return {
            success: false,
            isNowCut: false,
            error: "Obbligatorio mantenere almeno 2 portieri in rosa. Impossibile tagliare questo portiere.",
          };
        }
      }

      const { error } = await supabase
        .from("team_cuts_registry")
        .insert({
          player_id: playerId,
          team_id: teamId,
        });

      if (error) throw error;
      return { success: true, isNowCut: true };
    }
  } catch (err: any) {
    console.error("Errore modifica lista tagli calciatore:", err);
    return { success: false, isNowCut: isCurrentlyCut, error: err.message };
  }
}

/**
 * Calcola lo stato di adempienza dei tagli per tutte le squadre attive di Serie A
 */
export async function getCutsComplianceReport(): Promise<CutsComplianceReport> {
  try {
    // 1. Squadre attive
    const { data: teamsData, error: teamsError } = await supabase
      .from("an_team")
      .select("TEAM_ID, NAME")
      .eq("ACTIVE", true)
      .neq("TEAM_ID", "RITIRATO")
      .order("NAME", { ascending: true });

    if (teamsError) throw teamsError;
    const teams = teamsData || [];

    // 2. Giocatori attivi per squadra (inclusa la posizione per verificare i portieri)
    const { data: playersData, error: playersError } = await supabase
      .from("an_player")
      .select("ID, Squadra, Posiz")
      .not("Squadra", "is", null)
      .neq("Squadra", "RITIRATO");

    if (playersError) throw playersError;
    const players = playersData || [];

    // 3. Tutti i tagli registrati
    const { data: cutsData, error: cutsError } = await supabase
      .from("team_cuts_registry")
      .select("player_id, team_id");

    if (cutsError) throw cutsError;
    const cuts = cutsData || [];

    // 4. Scelte draft non ancora utilizzate (Punto #33)
    const { data: picksData, error: picksError } = await supabase
      .from("an_draft_board")
      .select("team_id")
      .is("rookie_id", null)
      .is("player_id", null);

    if (picksError) throw picksError;
    const picksByTeam: Record<string, number> = {};
    for (const p of picksData || []) {
      picksByTeam[p.team_id] = (picksByTeam[p.team_id] || 0) + 1;
    }

    // Costruzione report
    const teamReports: TeamCutCompliance[] = teams.map((t) => {
      const teamId = t.TEAM_ID;
      const teamPlayers = players.filter((p) => p.Squadra === teamId);
      const currentRoster = teamPlayers.length;
      const currentGk = teamPlayers.filter((p) => p.Posiz === "POR").length;

      const teamCuts = cuts.filter((c) => c.team_id === teamId);
      const cutsCount = teamCuts.length;

      const cutPlayerIds = new Set(teamCuts.map((c) => Number(c.player_id)));
      const cutGk = teamPlayers.filter((p) => p.Posiz === "POR" && cutPlayerIds.has(Number(p.ID))).length;

      const picksCount = picksByTeam[teamId] || 0;
      const minCuts = Math.max(
        0,
        currentRoster - CUTS_MAX_ROSTER,
        currentRoster + picksCount - CUTS_MAX_ASSETS
      );
      const maxCuts = Math.max(0, currentRoster - CUTS_MIN_ROSTER);
      const postRoster = currentRoster - cutsCount;
      const postGk = currentGk - cutGk;
      const postAssets = postRoster + picksCount;

      // In regola se: 13-16 giocatori, giocatori + pick <= 21 asset, almeno 2 portieri
      const isRosterCompliant = postRoster >= CUTS_MIN_ROSTER && postRoster <= CUTS_MAX_ROSTER;
      const isGkCompliant = postGk >= CUTS_MIN_GK;
      const isAssetCompliant = postAssets <= CUTS_MAX_ASSETS;
      const isCompliant = isRosterCompliant && isGkCompliant && isAssetCompliant;

      return {
        teamId,
        teamName: t.NAME,
        currentRoster,
        cutsCount,
        minCuts,
        maxCuts,
        postRoster,
        currentGk,
        cutGk,
        postGk,
        picksCount,
        postAssets,
        isCompliant,
        gkReason: !isGkCompliant ? `Meno di 2 portieri rimasti (${postGk} POR)` : undefined,
        assetReason: !isAssetCompliant
          ? `Asset oltre il limite: ${postAssets}/${CUTS_MAX_ASSETS} (${postRoster} giocatori + ${picksCount} pick)`
          : undefined,
      };
    });

    const nonCompliantTeams = teamReports.filter((t) => !t.isCompliant);
    const totalCuts = cuts.length;
    const allCompliant = nonCompliantTeams.length === 0 && totalCuts > 0;

    return {
      teams: teamReports,
      allCompliant,
      totalCuts,
      nonCompliantTeams,
    };
  } catch (err) {
    console.error("Errore calcolo report adempienza tagli:", err);
    return {
      teams: [],
      allCompliant: false,
      totalCuts: 0,
      nonCompliantTeams: [],
    };
  }
}

/**
 * Esegue l'ufficializzazione atomica dei tagli tramite la funzione RPC Postgres
 */
export async function executeOfficialCutsRpc(
  adminName: string = "Amministratore LCSIM"
): Promise<{
  success: boolean;
  released_count?: number;
  released_players?: any[];
  error?: string;
  non_compliant_teams?: any[];
}> {
  try {
    const { data, error } = await supabase.rpc("execute_official_cuts", {
      p_admin_name: adminName,
    });

    if (error) throw error;
    return data as any;
  } catch (err: any) {
    console.error("Errore esecuzione RPC ufficializzazione tagli:", err);
    return {
      success: false,
      error: err.message || "Errore sconosciuto durante l'ufficializzazione dei tagli",
    };
  }
}

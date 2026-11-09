import { supabase } from "@/supabaseClient";
import { TEAM_TABLE } from "@/constants/App";
import { Team, TeamTrophy } from "@/types/team";

export async function fetchTeams(): Promise<Team[]> {
  const { data, error } = await supabase
    .from(TEAM_TABLE)
    .select('*, players:an_player(*, MarketStatus:as_player_market(Status))')
    .eq('ACTIVE', true)
    .order('NAME', { ascending: true });

  if (error) {
    console.error('Error fetching teams:', error);
    throw new Error(error.message || 'Failed to fetch teams');
  }

  return (data || []) as Team[];
}

export async function fetchTeamById(team?: string): Promise<Team | null> {
  if (!team) return null;

  const { data, error } = await supabase
    .from(TEAM_TABLE)
    .select('*, players:an_player(*, MarketStatus:as_player_market(Status))')
    .or(`TEAM_ID.eq.${team},NAME_ABBR.eq.${team},NAME.eq.${team}`)
    .maybeSingle();

  if (error) {
    console.error('Error fetching team by id:', error);
    throw new Error(error.message || 'Failed to fetch team');
  }

  return data as Team | null;
}

/**
 * Recupera l'Albo d'Oro / Bacheca trofei di una o tutte le squadre (Punto #45)
 */
export async function fetchTeamTrophies(teamId?: string): Promise<TeamTrophy[]> {
  let query = supabase.from("team_trophies").select("*").order("season_number", { ascending: true });
  if (teamId) {
    query = query.eq("team_id", teamId.toUpperCase().trim());
  }
  const { data, error } = await query;
  if (error) {
    console.error("Error fetching trophies:", error);
    return [];
  }
  return (data || []) as TeamTrophy[];
}

/**
 * Aggiorna il nome dell'allenatore del club (campo an_team.MANAGER).
 */
export async function updateTeamCoach(
  teamId: string,
  coachName: string,
  actingUsername?: string
): Promise<{ success: boolean; error?: string }> {
  return updateTeamStaff({
    teamId,
    coachName,
    actingUsername,
  });
}

/**
 * Aggiorna lo staff del club (Allenatore e Presidente).
 */
export async function updateTeamStaff(params: {
  teamId: string;
  coachName?: string;
  presidentName?: string;
  actingUsername?: string;
}): Promise<{ success: boolean; error?: string }> {
  return updateTeamProfile(params);
}

/**
 * Aggiorna profilo completo club (Staff, Presidente e Stadio) tramite RPC SECURITY DEFINER (Punto #45)
 */
export async function updateTeamProfile(params: {
  teamId: string;
  coachName?: string;
  presidentName?: string;
  stadiumName?: string;
  stadiumCity?: string;
  stadiumCapacity?: number;
  stadiumSurface?: string;
  stadiumYear?: number;
  actingUsername?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const {
      teamId,
      coachName,
      presidentName,
      stadiumName,
      stadiumCity,
      stadiumCapacity,
      stadiumSurface,
      stadiumYear,
      actingUsername,
    } = params;

    const { data: rpcData, error: rpcError } = await supabase.rpc("rpc_update_team_profile", {
      p_team_id: teamId.trim(),
      p_coach_name: coachName?.trim() || null,
      p_president_name: presidentName?.trim() || null,
      p_stadium_name: stadiumName?.trim() || null,
      p_stadium_city: stadiumCity?.trim() || null,
      p_stadium_capacity: stadiumCapacity || null,
      p_stadium_surface: stadiumSurface?.trim() || null,
      p_stadium_year: stadiumYear || null,
      p_acting_username: actingUsername?.trim() || null,
    });

    if (rpcError) {
      console.error("Errore rpc_update_team_profile:", rpcError);
      return { success: false, error: rpcError.message || "Errore durante l'aggiornamento del profilo squadra." };
    }

    if (rpcData && !rpcData.success) {
      return { success: false, error: rpcData.error || "Impossibile aggiornare il profilo squadra." };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Errore durante l'aggiornamento del profilo squadra." };
  }
}

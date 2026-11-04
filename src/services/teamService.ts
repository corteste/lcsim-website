import { supabase } from "@/supabaseClient";
import { TEAM_TABLE } from "@/constants/App";
import { Team } from "@/types/team";

export async function fetchTeams(): Promise<Team[]> {
  const { data, error } = await supabase
    .from(TEAM_TABLE)
    .select('*')
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
    .select('*')
    .eq('TEAM_ID', team)
    .maybeSingle();

  if (error) {
    console.error('Error fetching team by id:', error);
    throw new Error(error.message || 'Failed to fetch team');
  }

  return data as Team | null;
}

/**
 * Aggiorna il nome dell'allenatore del club (campo an_team.MANAGER).
 * Prova prima tramite RPC SECURITY DEFINER (rpc_update_team_coach)
 * con fallback diretto su an_team.
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
 * Utilizza la RPC SECURITY DEFINER (rpc_update_team_staff)
 */
export async function updateTeamStaff(params: {
  teamId: string;
  coachName?: string;
  presidentName?: string;
  actingUsername?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { teamId, coachName, presidentName, actingUsername } = params;
    const cleanCoach = coachName?.trim() || "";
    const cleanPresident = presidentName?.trim() || "";

    const { data: rpcData, error: rpcError } = await supabase.rpc("rpc_update_team_staff", {
      p_team_id: teamId.trim(),
      p_coach_name: cleanCoach,
      p_president_name: cleanPresident || null,
      p_acting_username: actingUsername?.trim() || null,
    });

    if (rpcError) {
      console.error("Errore rpc_update_team_staff:", rpcError);
      return { success: false, error: rpcError.message || "Errore durante l'aggiornamento dello staff." };
    }

    if (rpcData && !rpcData.success) {
      return { success: false, error: rpcData.error || "Impossibile aggiornare lo staff." };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Errore durante l'aggiornamento dello staff." };
  }
}

import { Team } from '@/types/team';
import { supabase } from '@/supabaseClient';
import { TEAM_TABLE } from '@/constants/App';

export async function fetchTeams(_pageIndex = 1): Promise<Team[]> {
  const { data, error } = await supabase
    .from(TEAM_TABLE)
    .select('*, players:an_player(*, MarketStatus:as_player_market(Status))')
    .eq('ACTIVE', true);

  if (error) {
    console.error('Error fetching teams:', error);
    throw new Error(error.message || 'Failed to fetch teams');
  }

  return (data as Team[]) ?? [];
}

export async function fetchTeamById(team?: string): Promise<Team | null> {
  if (!team) return null;

  const { data, error } = await supabase
    .from(TEAM_TABLE)
    .select('*, players:an_player(*, MarketStatus:as_player_market(Status))')
    .or(`TEAM_ID.eq.${team},NAME_ABBR.eq.${team},NAME.eq.${team}`)
    .maybeSingle();

  if (error) {
    console.error(`Error fetching team ${team}:`, error);
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
  try {
    const trimmed = coachName.trim();
    if (!trimmed) {
      return { success: false, error: "Il nome dell'allenatore non può essere vuoto." };
    }

    // Tentativo tramite RPC
    const { data: rpcData, error: rpcError } = await supabase.rpc("rpc_update_team_coach", {
      p_team_id: teamId,
      p_coach_name: trimmed,
      p_acting_username: actingUsername || null,
    });

    if (!rpcError && rpcData) {
      if (rpcData.success) {
        return { success: true };
      }
      return { success: false, error: rpcData.error };
    }

    // Fallback: aggiornamento diretto sulla tabella an_team
    const { error } = await supabase
      .from(TEAM_TABLE)
      .update({ MANAGER: trimmed })
      .eq("TEAM_ID", teamId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Errore durante l'aggiornamento dell'allenatore." };
  }
}

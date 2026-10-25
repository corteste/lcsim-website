import { supabase } from "@/supabaseClient";
import {
  MacroNeedId,
  TeamMarketNeedRecord,
  EnrichedTeamMarketNeed,
} from "@/types/marketNeeds";

/**
 * Recupera l'elenco completo dei bisogni di mercato per tutte le società di Serie A
 */
export async function fetchAllTeamMarketNeeds(): Promise<EnrichedTeamMarketNeed[]> {
  try {
    // 1. Carica le squadre da an_team (solo club attivi di Serie A)
    const { data: teamsData, error: teamsError } = await supabase
      .from("an_team")
      .select("TEAM_ID, NAME, MANAGER")
      .eq("ACTIVE", true)
      .order("NAME", { ascending: true });

    if (teamsError) {
      console.error("Errore fetch an_team per bisogni:", teamsError);
      return [];
    }

    // 2. Carica i bisogni registrati da team_market_needs
    const { data: needsData, error: needsError } = await supabase
      .from("team_market_needs")
      .select("team_id, needs, updated_at, updated_by");

    if (needsError) {
      console.error("Errore fetch team_market_needs:", needsError);
    }

    const needsMap = new Map<string, TeamMarketNeedRecord>();
    if (needsData) {
      needsData.forEach((row: any) => {
        needsMap.set(row.team_id, {
          team_id: row.team_id,
          needs: Array.isArray(row.needs) ? (row.needs as MacroNeedId[]) : [],
          updated_at: row.updated_at || new Date().toISOString(),
          updated_by: row.updated_by || null,
        });
      });
    }

    // 3. Combina i dati per le squadre
    const enriched: EnrichedTeamMarketNeed[] = (teamsData || []).map((t: any) => {
      const recorded = needsMap.get(t.TEAM_ID);
      return {
        team_id: t.TEAM_ID,
        team_name: t.NAME || t.TEAM_ID,
        manager_name: t.MANAGER || null,
        needs: recorded ? recorded.needs : [],
        updated_at: recorded ? recorded.updated_at : new Date().toISOString(),
        updated_by: recorded ? recorded.updated_by : null,
      };
    });

    return enriched;
  } catch (err) {
    console.error("Eccezione durante fetchAllTeamMarketNeeds:", err);
    return [];
  }
}

/**
 * Recupera i bisogni di una singola squadra
 */
export async function fetchSingleTeamNeeds(teamId: string): Promise<MacroNeedId[]> {
  try {
    const { data, error } = await supabase
      .from("team_market_needs")
      .select("needs")
      .eq("team_id", teamId)
      .maybeSingle();

    if (error) {
      console.error(`Errore fetch bisogni per team ${teamId}:`, error);
      return [];
    }

    if (!data || !Array.isArray(data.needs)) {
      return [];
    }

    return data.needs as MacroNeedId[];
  } catch (err) {
    console.error(`Eccezione fetchSingleTeamNeeds per ${teamId}:`, err);
    return [];
  }
}

/**
 * Salva / aggiorna i bisogni di mercato di una squadra
 */
export async function updateTeamMarketNeeds(
  teamId: string,
  needs: MacroNeedId[],
  updatedBy?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = {
      team_id: teamId,
      needs,
      updated_at: new Date().toISOString(),
      updated_by: updatedBy || "Manager",
    };

    const { error } = await supabase
      .from("team_market_needs")
      .upsert(payload, { onConflict: "team_id" });

    if (error) {
      console.error(`Errore salvataggio bisogni per ${teamId}:`, error);
      return { success: false, error: error.message };
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("lcsim-market-needs-updated"));
    }

    return { success: true };
  } catch (err: any) {
    console.error(`Eccezione updateTeamMarketNeeds per ${teamId}:`, err);
    return { success: false, error: err?.message || "Errore sconosciuto" };
  }
}

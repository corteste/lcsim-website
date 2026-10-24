import { supabase } from "@/supabaseClient";
import {
  TeamPlayerFavorite,
  DraftWishlistItem,
  DraftAutopickSetting,
} from "@/types/draftWishlist";
import { Player } from "@/types/player";
import { DRAFT_BOARD_TABLE, ROOKIE_TABLE } from "@/constants/App";

const FAVORITES_TABLE = "team_player_favorites";
const WISHLIST_TABLE = "draft_team_wishlist";
const AUTOPICK_TABLE = "draft_autopick_settings";

// ============================================================================
// 1. GESTIONE GIOCATORI PREFERITI / WATCHLIST (PUNTO 6)
// ============================================================================

/**
 * Recupera l'insieme degli ID dei giocatori preferiti per una determinata squadra.
 */
export async function fetchTeamFavorites(
  teamId: string,
  playerType: "rookie" | "player" = "rookie"
): Promise<Set<number>> {
  if (!teamId) return new Set();

  try {
    const { data, error } = await supabase
      .from(FAVORITES_TABLE)
      .select("player_id")
      .eq("team_id", teamId)
      .eq("player_type", playerType);

    if (error) {
      console.error("fetchTeamFavorites error:", error);
      return new Set();
    }

    const set = new Set<number>();
    (data || []).forEach((row: any) => set.add(Number(row.player_id)));
    return set;
  } catch (err) {
    console.error("fetchTeamFavorites exception:", err);
    return new Set();
  }
}

/**
 * Attiva o disattiva un giocatore tra i preferiti della squadra (Toggle).
 */
export async function toggleTeamFavorite(
  teamId: string,
  playerId: number,
  playerType: "rookie" | "player" = "rookie"
): Promise<{ isFavorite: boolean; error?: string }> {
  if (!teamId || !playerId) {
    return { isFavorite: false, error: "Dati non validi" };
  }

  try {
    // Verifica se è già presente
    const { data: existing } = await supabase
      .from(FAVORITES_TABLE)
      .select("id")
      .eq("team_id", teamId)
      .eq("player_id", playerId)
      .eq("player_type", playerType)
      .maybeSingle();

    if (existing) {
      // Rimuovi
      const { error: delErr } = await supabase
        .from(FAVORITES_TABLE)
        .delete()
        .eq("id", existing.id);

      if (delErr) throw delErr;
      return { isFavorite: false };
    } else {
      // Aggiungi
      const { error: insErr } = await supabase
        .from(FAVORITES_TABLE)
        .insert({
          team_id: teamId,
          player_id: playerId,
          player_type: playerType,
        });

      if (insErr) throw insErr;
      return { isFavorite: true };
    }
  } catch (err: any) {
    console.error("toggleTeamFavorite error:", err);
    return { isFavorite: false, error: err?.message || "Errore toggle preferiti" };
  }
}

// ============================================================================
// 2. GESTIONE LISTA DI PRIORITÀ DRAFT (WISHLIST ORDINATA - PUNTO 7)
// ============================================================================

/**
 * Recupera la wishlist ordinata della squadra con i dettagli completi del rookie da an_rookie.
 */
export async function fetchTeamWishlist(teamId: string): Promise<DraftWishlistItem[]> {
  if (!teamId) return [];

  try {
    const { data: wishlistRows, error: wErr } = await supabase
      .from(WISHLIST_TABLE)
      .select("*")
      .eq("team_id", teamId)
      .order("priority_rank", { ascending: true });

    if (wErr) {
      console.error("fetchTeamWishlist error:", wErr);
      return [];
    }

    if (!wishlistRows || wishlistRows.length === 0) return [];

    const rookieIds = wishlistRows.map((r: any) => Number(r.rookie_id));

    // Carica i dettagli dei rookie corrispondenti
    const { data: rookiesData, error: rErr } = await supabase
      .from(ROOKIE_TABLE)
      .select("*")
      .in("ID", rookieIds);

    if (rErr) {
      console.error("fetchTeamWishlist rookies fetch error:", rErr);
    }

    const rookiesMap = new Map<number, Player>();
    (rookiesData || []).forEach((rk: any) => {
      rookiesMap.set(Number(rk.ID), rk as Player);
    });

    return wishlistRows.map((row: any) => ({
      id: row.id,
      team_id: row.team_id,
      rookie_id: Number(row.rookie_id),
      priority_rank: Number(row.priority_rank),
      created_at: row.created_at,
      updated_at: row.updated_at,
      rookie: rookiesMap.get(Number(row.rookie_id)),
    }));
  } catch (err) {
    console.error("fetchTeamWishlist exception:", err);
    return [];
  }
}

/**
 * Aggiunge un rookie alla wishlist della squadra in fondo alla coda.
 */
export async function addToWishlist(
  teamId: string,
  rookieId: number
): Promise<{ success: boolean; error?: string }> {
  if (!teamId || !rookieId) {
    return { success: false, error: "Dati mancanti" };
  }

  try {
    // Calcola il prossimo rank
    const { data: maxRankRow } = await supabase
      .from(WISHLIST_TABLE)
      .select("priority_rank")
      .eq("team_id", teamId)
      .order("priority_rank", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextRank = (maxRankRow?.priority_rank || 0) + 1;

    const { error } = await supabase.from(WISHLIST_TABLE).upsert(
      {
        team_id: teamId,
        rookie_id: rookieId,
        priority_rank: nextRank,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "team_id,rookie_id" }
    );

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error("addToWishlist error:", err);
    return { success: false, error: err?.message || "Errore inserimento in wishlist" };
  }
}

/**
 * Aggiunge più rookie alla wishlist contemporaneamente (es. dai Preferiti).
 */
export async function addMultipleToWishlist(
  teamId: string,
  rookieIds: number[]
): Promise<{ count: number; error?: string }> {
  if (!teamId || rookieIds.length === 0) return { count: 0 };

  try {
    // Recupera i rookie già presenti
    const existing = await fetchTeamWishlist(teamId);
    const existingIds = new Set(existing.map((w) => w.rookie_id));

    const toAdd = rookieIds.filter((id) => !existingIds.has(id));
    if (toAdd.length === 0) return { count: 0 };

    let currentRank = existing.length > 0 ? Math.max(...existing.map((w) => w.priority_rank)) : 0;

    const rows = toAdd.map((rId) => {
      currentRank += 1;
      return {
        team_id: teamId,
        rookie_id: rId,
        priority_rank: currentRank,
        updated_at: new Date().toISOString(),
      };
    });

    const { error } = await supabase
      .from(WISHLIST_TABLE)
      .upsert(rows, { onConflict: "team_id,rookie_id" });

    if (error) throw error;
    return { count: toAdd.length };
  } catch (err: any) {
    console.error("addMultipleToWishlist error:", err);
    return { count: 0, error: err?.message || "Errore aggiunta multipla" };
  }
}

/**
 * Rimuove un rookie dalla wishlist e ricalcola i rank rimanenti.
 */
export async function removeFromWishlist(
  teamId: string,
  rookieId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error: delErr } = await supabase
      .from(WISHLIST_TABLE)
      .delete()
      .eq("team_id", teamId)
      .eq("rookie_id", rookieId);

    if (delErr) throw delErr;

    // Ricalcola i rank consecutivi 1..N
    const remaining = await fetchTeamWishlist(teamId);
    if (remaining.length > 0) {
      const updates = remaining.map((item, index) => ({
        id: item.id,
        team_id: teamId,
        rookie_id: item.rookie_id,
        priority_rank: index + 1,
        updated_at: new Date().toISOString(),
      }));

      await supabase.from(WISHLIST_TABLE).upsert(updates, { onConflict: "team_id,rookie_id" });
    }

    return { success: true };
  } catch (err: any) {
    console.error("removeFromWishlist error:", err);
    return { success: false, error: err?.message || "Errore rimozione da wishlist" };
  }
}

/**
 * Sposta un rookie su o giù nella graduatoria.
 */
export async function moveWishlistItem(
  teamId: string,
  rookieId: number,
  direction: "up" | "down"
): Promise<{ success: boolean; error?: string }> {
  try {
    const list = await fetchTeamWishlist(teamId);
    const index = list.findIndex((item) => item.rookie_id === rookieId);
    if (index === -1) return { success: false, error: "Rookie non trovato nella lista" };

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) {
      return { success: true }; // Già al limite
    }

    // Scambia gli elementi
    const reordered = [...list];
    const temp = reordered[index];
    reordered[index] = reordered[targetIndex];
    reordered[targetIndex] = temp;

    const updates = reordered.map((item, idx) => ({
      team_id: teamId,
      rookie_id: item.rookie_id,
      priority_rank: idx + 1,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from(WISHLIST_TABLE)
      .upsert(updates, { onConflict: "team_id,rookie_id" });

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error("moveWishlistItem error:", err);
    return { success: false, error: err?.message || "Errore spostamento elemento" };
  }
}

/**
 * Salva l'intero nuovo ordinamento dei rookie IDs per la squadra.
 */
export async function reorderWishlist(
  teamId: string,
  reorderedRookieIds: number[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const updates = reorderedRookieIds.map((rId, idx) => ({
      team_id: teamId,
      rookie_id: rId,
      priority_rank: idx + 1,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from(WISHLIST_TABLE)
      .upsert(updates, { onConflict: "team_id,rookie_id" });

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error("reorderWishlist error:", err);
    return { success: false, error: err?.message || "Errore riordino wishlist" };
  }
}

/**
 * Svuota completamente la wishlist della squadra.
 */
export async function clearWishlist(
  teamId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from(WISHLIST_TABLE).delete().eq("team_id", teamId);
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Errore svuotamento wishlist" };
  }
}

// ============================================================================
// 3. IMPOSTAZIONI AUTOPICK SQUADRA
// ============================================================================

/**
 * Recupera se l'autopick è abilitato per la squadra specificata.
 */
export async function fetchAutopickSetting(teamId: string): Promise<boolean> {
  if (!teamId) return false;
  try {
    const { data } = await supabase
      .from(AUTOPICK_TABLE)
      .select("is_autopick_enabled")
      .eq("team_id", teamId)
      .maybeSingle();

    return Boolean(data?.is_autopick_enabled);
  } catch (err) {
    console.error("fetchAutopickSetting error:", err);
    return false;
  }
}

/**
 * Imposta lo stato di autopick per la squadra.
 */
export async function setAutopickSetting(
  teamId: string,
  enabled: boolean
): Promise<{ success: boolean; error?: string }> {
  if (!teamId) return { success: false, error: "Squadra mancante" };
  try {
    const { error } = await supabase.from(AUTOPICK_TABLE).upsert(
      {
        team_id: teamId,
        is_autopick_enabled: enabled,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "team_id" }
    );

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error("setAutopickSetting error:", err);
    return { success: false, error: err?.message || "Errore salvataggio autopick" };
  }
}

/**
 * Recupera lo stato autopick di tutte le squadre (per Admin).
 */
export async function fetchAllAutopickSettings(): Promise<Record<string, boolean>> {
  try {
    const { data, error } = await supabase.from(AUTOPICK_TABLE).select("*");
    if (error || !data) return {};

    const map: Record<string, boolean> = {};
    data.forEach((row: any) => {
      map[row.team_id] = Boolean(row.is_autopick_enabled);
    });
    return map;
  } catch {
    return {};
  }
}

// ============================================================================
// 4. ESECUZIONE AUTOPICK (CORE ENGINE - FALLBACK A APPROVATO)
// ============================================================================

export interface ExecuteAutopickResult {
  success: boolean;
  rookie?: Player;
  source?: "wishlist" | "fallback";
  rank?: number;
  error?: string;
}

/**
 * Esegue la selezione automatica per una scelta a turno:
 * 1. Cerca il primo rookie nella Wishlist della squadra non ancora draftato.
 * 2. Se non ne trova o la lista è vuota, applica il Fallback A: sceglie il rookie disponibile con il più alto OVR.
 * 3. Registra la scelta sia su an_rookie che su an_draft_board.
 */
export async function executeAutopick(params: {
  pickOverall: number;
  pickingTeamId: string;
  executedBy: string;
}): Promise<ExecuteAutopickResult> {
  const { pickOverall, pickingTeamId, executedBy } = params;

  try {
    // 1. Verifica che lo slot al draft sia ancora libero
    const { data: pickRow, error: pErr } = await supabase
      .from(DRAFT_BOARD_TABLE)
      .select("*")
      .eq("pick_overall", pickOverall)
      .single();

    if (pErr || !pickRow) {
      return { success: false, error: "Scelta al draft non trovata" };
    }

    if (pickRow.rookie_id !== null) {
      return { success: false, error: `La scelta #${pickOverall} è già stata assegnata!` };
    }

    // 2. Recupera tutti i rookie attualmente non draftati (Squadra IS NULL)
    const { data: availableRookies, error: rErr } = await supabase
      .from(ROOKIE_TABLE)
      .select("*")
      .is("Squadra", null);

    if (rErr || !availableRookies || availableRookies.length === 0) {
      return { success: false, error: "Nessun rookie disponibile rimasto da draftare!" };
    }

    const availableMap = new Map<number, Player>();
    availableRookies.forEach((rk: any) => availableMap.set(Number(rk.ID), rk as Player));

    // 3. Recupera la wishlist ordinata della squadra
    const wishlist = await fetchTeamWishlist(pickingTeamId);

    let chosenRookie: Player | null = null;
    let chosenSource: "wishlist" | "fallback" = "fallback";
    let chosenRank: number | undefined = undefined;

    // Cerca il primo disponibile nella lista delle preferenze
    for (const item of wishlist) {
      const match = availableMap.get(item.rookie_id);
      if (match) {
        chosenRookie = match;
        chosenSource = "wishlist";
        chosenRank = item.priority_rank;
        break;
      }
    }

    // 4. Se nessun rookie della lista è disponibile, applica Fallback A (Miglior OVR rimasto)
    if (!chosenRookie) {
      chosenSource = "fallback";
      // Ordina per Stelle decrescente, poi per OVR decrescente, poi per ID crescente
      const sortedByOvr = [...availableRookies].sort((a, b) => {
        const starA = Number(a.Stelle) || 0;
        const starB = Number(b.Stelle) || 0;
        if (starB !== starA) return starB - starA;
        const ovrA = Number(a.OVR) || 0;
        const ovrB = Number(b.OVR) || 0;
        if (ovrB !== ovrA) return ovrB - ovrA;
        return Number(a.ID) - Number(b.ID);
      });

      chosenRookie = sortedByOvr[0] as Player;
    }

    if (!chosenRookie) {
      return { success: false, error: "Impossibile determinare un rookie per l'autopick" };
    }

    const rookieId = Number(chosenRookie.ID);
    const nowIso = new Date().toISOString();
    const pickedByString =
      chosenSource === "wishlist"
        ? `AUTOPICK (#${chosenRank} Wishlist da ${executedBy})`
        : `AUTOPICK (Fallback Max OVR da ${executedBy})`;

    // 5. Esegui scelta draft atomica (con de-crittografia ed inserimento in an_player)
    const { error: draftRpcErr } = await supabase.rpc("rpc_draft_rookie", {
      p_pick_overall: pickOverall,
      p_rookie_id: rookieId,
      p_team_id: pickingTeamId,
      p_picked_by: pickedByString,
    });

    if (draftRpcErr) throw draftRpcErr;

    return {
      success: true,
      rookie: chosenRookie,
      source: chosenSource,
      rank: chosenRank,
    };
  } catch (err: any) {
    console.error("executeAutopick error:", err);
    return { success: false, error: err?.message || "Errore imprevisto durante l'autopick" };
  }
}

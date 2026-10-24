import { supabase } from "@/supabaseClient";
import {
  LeagueDeadline,
  CreateDeadlinePayload,
  TeamLineupSnapshot,
  DeadlineCountdownState,
} from "@/types/deadlines";

const DEADLINES_TABLE = "league_deadlines";
const SNAPSHOTS_TABLE = "team_lineup_snapshots";

let memoryActiveDeadline: LeagueDeadline | null = null;

export function getCachedActiveDeadline(): LeagueDeadline | null {
  return memoryActiveDeadline;
}

/**
 * Recupera la scadenza della giornata attualmente attiva.
 * Se nessuna è marcata come is_active, tenta di recuperare la prima scadenza futura o la più recente.
 */
export async function fetchActiveDeadline(): Promise<LeagueDeadline | null> {
  try {
    // 1. Cerca quella con is_active = true
    const { data: activeData, error: activeErr } = await supabase
      .from(DEADLINES_TABLE)
      .select("*")
      .eq("is_active", true)
      .order("week", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!activeErr && activeData) {
      memoryActiveDeadline = activeData as LeagueDeadline;
      return memoryActiveDeadline;
    }

    // 2. Fallback: la prima scadenza disponibile
    const { data: fallbackData } = await supabase
      .from(DEADLINES_TABLE)
      .select("*")
      .order("stag", { ascending: false })
      .order("week", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (fallbackData) {
      memoryActiveDeadline = fallbackData as LeagueDeadline;
      return memoryActiveDeadline;
    }

    return memoryActiveDeadline;
  } catch (err) {
    console.error("fetchActiveDeadline error:", err);
    return null;
  }
}

/**
 * Recupera tutte le scadenze impostate (opzionalmente per una stagione).
 */
export async function fetchAllDeadlines(stag?: number): Promise<LeagueDeadline[]> {
  try {
    let query = supabase.from(DEADLINES_TABLE).select("*");
    if (stag !== undefined) {
      query = query.eq("stag", stag);
    }
    const { data, error } = await query
      .order("stag", { ascending: false })
      .order("week", { ascending: true });

    if (error) {
      console.error("fetchAllDeadlines error:", error);
      return [];
    }
    return (data || []) as LeagueDeadline[];
  } catch (err) {
    console.error("fetchAllDeadlines exception:", err);
    return [];
  }
}

/**
 * Aggiorna una scadenza esistente (Solo Admin).
 */
export async function updateDeadline(
  id: string,
  updates: Partial<LeagueDeadline>
): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = {
      ...updates,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase
      .from(DEADLINES_TABLE)
      .update(payload)
      .eq("id", id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Errore aggiornamento scadenza" };
  }
}

/**
 * Imposta una determinata giornata come quella attiva per la Lega (e disattiva le altre).
 */
export async function setActiveMatchday(
  stag: number,
  week: number
): Promise<{ success: boolean; error?: string }> {
  try {
    // Disattiva tutte le altre per la stagione
    await supabase
      .from(DEADLINES_TABLE)
      .update({ is_active: false })
      .eq("stag", stag);

    // Attiva la giornata scelta
    const { error } = await supabase
      .from(DEADLINES_TABLE)
      .update({ is_active: true, updated_at: new Date().toISOString() })
      .eq("stag", stag)
      .eq("week", week);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Errore impostazione giornata attiva" };
  }
}

/**
 * Crea o aggiorna una scadenza (Admin).
 */
export async function upsertDeadline(
  payload: CreateDeadlinePayload
): Promise<{ success: boolean; data?: LeagueDeadline; error?: string }> {
  try {
    const { data, error } = await supabase
      .from(DEADLINES_TABLE)
      .upsert(
        {
          stag: payload.stag,
          week: payload.week,
          deadline: payload.deadline,
          is_active: payload.is_active ?? false,
          is_force_closed: payload.is_force_closed ?? false,
          description: payload.description || `Giornata ${payload.week}`,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "stag,week" }
      )
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data: data as LeagueDeadline };
  } catch (err: any) {
    return { success: false, error: err?.message || "Errore salvataggio scadenza" };
  }
}

/**
 * Calcola il countdown a partire da una data di scadenza e dallo stato di chiusura forzata.
 */
export function calculateCountdown(
  deadlineDateStr: string,
  isForceClosed = false
): DeadlineCountdownState {
  if (isForceClosed) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalMs: 0,
      isExpired: true,
      isUrgent: false,
    };
  }

  const target = new Date(deadlineDateStr).getTime();
  const now = Date.now();
  const diff = target - now;

  if (isNaN(target) || diff <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalMs: 0,
      isExpired: true,
      isUrgent: false,
    };
  }

  const oneSecond = 1000;
  const oneMinute = oneSecond * 60;
  const oneHour = oneMinute * 60;
  const oneDay = oneHour * 24;

  const days = Math.floor(diff / oneDay);
  const hours = Math.floor((diff % oneDay) / oneHour);
  const minutes = Math.floor((diff % oneHour) / oneMinute);
  const seconds = Math.floor((diff % oneMinute) / oneSecond);

  const isUrgent = diff <= oneDay; // meno di 24 ore rimaste

  return {
    days,
    hours,
    minutes,
    seconds,
    totalMs: diff,
    isExpired: false,
    isUrgent,
  };
}

/**
 * Salva lo snapshot immutabile della formazione per la giornata specifica in team_lineup_snapshots.
 */
export async function saveLineupSnapshot(
  snapshot: TeamLineupSnapshot
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from(SNAPSHOTS_TABLE).upsert(
      {
        team_id: snapshot.team_id,
        stag: snapshot.stag,
        week: snapshot.week,
        formation: snapshot.formation,
        starters: snapshot.starters,
        bench_order: snapshot.bench_order,
        submitted_at: snapshot.submitted_at || new Date().toISOString(),
        submitted_by: snapshot.submitted_by || "user",
        is_locked: snapshot.is_locked ?? true,
        tactical_settings: snapshot.tactical_settings || {},
      },
      { onConflict: "team_id,stag,week" }
    );

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Errore salvataggio snapshot formazione" };
  }
}

/**
 * Recupera lo snapshot salvato per una determinata squadra e giornata.
 */
export async function fetchTeamLineupSnapshot(
  teamId: string,
  stag: number,
  week: number
): Promise<TeamLineupSnapshot | null> {
  try {
    const { data, error } = await supabase
      .from(SNAPSHOTS_TABLE)
      .select("*")
      .eq("team_id", teamId)
      .eq("stag", stag)
      .eq("week", week)
      .maybeSingle();

    if (error || !data) return null;
    return data as TeamLineupSnapshot;
  } catch (err) {
    console.error("fetchTeamLineupSnapshot error:", err);
    return null;
  }
}

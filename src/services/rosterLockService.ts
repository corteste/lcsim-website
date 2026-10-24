import { supabase } from "@/supabaseClient";

export interface RosterLockState {
  isLocked: boolean;
  status: "locked" | "unlocked";
  lastRunAt: string | null;
  lastRunBy: string | null;
  updatedAt: string | null;
}

const STORAGE_KEY = "lcsim_roster_lock_state";

/**
 * Recupera lo stato attuale del congelamento delle rose da Supabase
 * (con fallback sincrono su localStorage).
 */
export async function getRosterLockState(): Promise<RosterLockState> {
  try {
    const { data, error } = await supabase
      .from("league_automation_state")
      .select("*")
      .eq("id", "roster_lock")
      .maybeSingle();

    if (error || !data) {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const item = JSON.parse(raw);
          if (item) {
            const isLocked = item.status === "locked";
            return {
              isLocked,
              status: isLocked ? "locked" : "unlocked",
              lastRunAt: item.lastRunAt || null,
              lastRunBy: item.lastRunBy || null,
              updatedAt: item.updatedAt || null,
            };
          }
        }
      } catch (_) {}

      // Default: sbloccato (modificabile)
      return {
        isLocked: false,
        status: "unlocked",
        lastRunAt: null,
        lastRunBy: null,
        updatedAt: null,
      };
    }

    const isLocked = data.details?.status === "locked";
    const result: RosterLockState = {
      isLocked,
      status: isLocked ? "locked" : "unlocked",
      lastRunAt: data.last_run_at || null,
      lastRunBy: data.last_run_by || null,
      updatedAt: data.updated_at || null,
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
    } catch (_) {}

    return result;
  } catch (err) {
    console.warn("Errore getRosterLockState, fallback sbloccato:", err);
    return {
      isLocked: false,
      status: "unlocked",
      lastRunAt: null,
      lastRunBy: null,
      updatedAt: null,
    };
  }
}

/**
 * Aggiorna lo stato del congelamento delle rose su Supabase e sincronizza la cache locale.
 */
export async function setRosterLockState(
  newStatus: "locked" | "unlocked",
  authorName: string
): Promise<{ success: boolean; error?: string }> {
  const nowIso = new Date().toISOString();
  try {
    const { error } = await supabase
      .from("league_automation_state")
      .upsert({
        id: "roster_lock",
        action_name: "Blocco / Sblocco Rose",
        last_run_at: nowIso,
        last_run_by: authorName,
        details: { status: newStatus },
        updated_at: nowIso,
      });

    if (error) throw error;

    // Aggiorna cache locale
    try {
      const lockState: RosterLockState = {
        isLocked: newStatus === "locked",
        status: newStatus,
        lastRunAt: nowIso,
        lastRunBy: authorName,
        updatedAt: nowIso,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lockState));
    } catch (_) {}

    return { success: true };
  } catch (err: any) {
    console.error("Errore setRosterLockState:", err);
    return { success: false, error: err?.message || "Errore durante l'aggiornamento del blocco rose." };
  }
}

/**
 * Sottoscrizione realtime ai cambiamenti di stato di roster_lock.
 */
export function subscribeToRosterLock(callback: (state: RosterLockState) => void): () => void {
  const channel = supabase
    .channel("lcsim-roster-lock-realtime")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "league_automation_state",
        filter: "id=eq.roster_lock",
      },
      (payload) => {
        const row = payload.new as any;
        if (row && row.details) {
          const isLocked = row.details?.status === "locked";
          const state: RosterLockState = {
            isLocked,
            status: isLocked ? "locked" : "unlocked",
            lastRunAt: row.last_run_at || null,
            lastRunBy: row.last_run_by || null,
            updatedAt: row.updated_at || null,
          };
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
          } catch (_) {}
          callback(state);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

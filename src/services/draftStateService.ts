import { supabase } from "@/supabaseClient";

export interface DraftState {
  isOpen: boolean;        // true = Aperto (scelte attive), false = Chiuso (scelte inibite)
  isClosed: boolean;      // true = Chiuso, false = Aperto
  status: "open" | "closed";
  lastRunAt: string | null;
  lastRunBy: string | null;
  updatedAt: string | null;
}

export interface TestModeState {
  isActive: boolean;
  status: "active" | "inactive";
  lastRunAt: string | null;
  lastRunBy: string | null;
  updatedAt: string | null;
}

const STORAGE_KEY = "lcsim_draft_state";

// Default iniziale: CHIUSO (come da richiesta dell'utente)
let memoryDraftState: DraftState = {
  isOpen: false,
  isClosed: true,
  status: "closed",
  lastRunAt: null,
  lastRunBy: null,
  updatedAt: null,
};

/**
 * Recupera lo stato attuale del Draft da Supabase (con fallback sincrono locale).
 * Se non configurato o al primo avvio, lo stato è CHIUSO (isOpen: false, isClosed: true).
 */
export async function getDraftState(): Promise<DraftState> {
  try {
    const { data, error } = await supabase
      .from("league_automation_state")
      .select("*")
      .eq("id", "test_mode")
      .maybeSingle();

    if (error || !data) {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const item = JSON.parse(raw);
          if (item) {
            memoryDraftState = item;
            return item;
          }
        }
      } catch (_) {}

      return memoryDraftState;
    }

    let isOpen = false;
    if (typeof data.details?.is_open === "boolean") {
      isOpen = data.details.is_open;
    } else if (data.details?.status) {
      isOpen = data.details.status === "open";
    } else if (typeof data.details?.is_active === "boolean") {
      isOpen = !data.details.is_active;
    }

    const result: DraftState = {
      isOpen,
      isClosed: !isOpen,
      status: isOpen ? "open" : "closed",
      lastRunAt: data.last_run_at || null,
      lastRunBy: data.last_run_by || null,
      updatedAt: data.updated_at || null,
    };

    memoryDraftState = result;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
    } catch (_) {}

    return result;
  } catch (err) {
    console.warn("getDraftState error, uso fallback in memoria:", err);
    return memoryDraftState;
  }
}

/**
 * Aggiorna lo stato del Draft (Aperto / Chiuso) - Solo Admin.
 */
export async function setDraftState(
  isOpen: boolean,
  authorName = "Super Admin"
): Promise<{ success: boolean; state?: DraftState; error?: string }> {
  try {
    const nowIso = new Date().toISOString();
    const payload = {
      id: "test_mode",
      action_name: "Apertura / Chiusura Draft",
      last_run_at: nowIso,
      last_run_by: authorName,
      details: {
        is_open: isOpen,
        status: isOpen ? "open" : "closed",
        is_active: !isOpen, // Retrocompatibilità per eventuali consumer legacy
        updated_at: nowIso,
        updated_by: authorName,
      },
      updated_at: nowIso,
    };

    const { error } = await supabase
      .from("league_automation_state")
      .upsert(payload, { onConflict: "id" });

    if (error) throw error;

    const nextState: DraftState = {
      isOpen,
      isClosed: !isOpen,
      status: isOpen ? "open" : "closed",
      lastRunAt: nowIso,
      lastRunBy: authorName,
      updatedAt: nowIso,
    };

    memoryDraftState = nextState;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
    } catch (_) {}

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("lcsim-draft-state-updated", { detail: nextState })
      );
      window.dispatchEvent(
        new CustomEvent("lcsim-test-mode-updated", {
          detail: {
            isActive: !isOpen,
            status: !isOpen ? "active" : "inactive",
            lastRunAt: nowIso,
            lastRunBy: authorName,
            updatedAt: nowIso,
          },
        })
      );
    }

    return { success: true, state: nextState };
  } catch (err: any) {
    console.error("setDraftState error:", err);
    return {
      success: false,
      error: err?.message || "Impossibile aggiornare lo stato del draft.",
    };
  }
}

/**
 * Wrapper retrocompatibile per getTestModeState
 */
export async function getTestModeState(): Promise<TestModeState> {
  const draftState = await getDraftState();
  return {
    isActive: draftState.isClosed,
    status: draftState.isClosed ? "active" : "inactive",
    lastRunAt: draftState.lastRunAt,
    lastRunBy: draftState.lastRunBy,
    updatedAt: draftState.updatedAt,
  };
}

/**
 * Wrapper retrocompatibile per setTestModeState
 */
export async function setTestModeState(
  active: boolean,
  authorName = "Super Admin"
): Promise<{ success: boolean; state?: TestModeState; error?: string }> {
  // active = true significa test_mode ON (draft bloccato/chiuso, isOpen = false)
  const res = await setDraftState(!active, authorName);
  if (!res.success || !res.state) {
    return { success: false, error: res.error };
  }
  return {
    success: true,
    state: {
      isActive: res.state.isClosed,
      status: res.state.isClosed ? "active" : "inactive",
      lastRunAt: res.state.lastRunAt,
      lastRunBy: res.state.lastRunBy,
      updatedAt: res.state.updatedAt,
    },
  };
}

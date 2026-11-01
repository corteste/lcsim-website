import { supabase } from "@/supabaseClient";

export interface TestModeState {
  isActive: boolean;
  status: "active" | "inactive";
  lastRunAt: string | null;
  lastRunBy: string | null;
  updatedAt: string | null;
}

const STORAGE_KEY = "lcsim_test_mode_state";
let memoryTestModeState: TestModeState = {
  isActive: false,
  status: "inactive",
  lastRunAt: null,
  lastRunBy: null,
  updatedAt: null,
};

/**
 * Recupera lo stato attuale della Modalità Test (Dry Run) da Supabase
 * con fallback locale sincrono.
 */
export async function getTestModeState(): Promise<TestModeState> {
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
            memoryTestModeState = item;
            return item;
          }
        }
      } catch (_) {}

      return memoryTestModeState;
    }

    const isActive = Boolean(data.details?.is_active);
    const result: TestModeState = {
      isActive,
      status: isActive ? "active" : "inactive",
      lastRunAt: data.last_run_at || null,
      lastRunBy: data.last_run_by || null,
      updatedAt: data.updated_at || null,
    };

    memoryTestModeState = result;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
    } catch (_) {}

    return result;
  } catch (err) {
    console.warn("getTestModeState error, uso fallback in memoria:", err);
    return memoryTestModeState;
  }
}

/**
 * Aggiorna lo stato della Modalità Test (Solo Admin).
 */
export async function setTestModeState(
  active: boolean,
  authorName = "Super Admin"
): Promise<{ success: boolean; state?: TestModeState; error?: string }> {
  try {
    const nowIso = new Date().toISOString();
    const payload = {
      id: "test_mode",
      action_name: "Modalità Test (Dry Run)",
      last_run_at: nowIso,
      last_run_by: authorName,
      details: {
        is_active: active,
        updated_at: nowIso,
        updated_by: authorName,
      },
      updated_at: nowIso,
    };

    const { error } = await supabase
      .from("league_automation_state")
      .upsert(payload, { onConflict: "id" });

    if (error) throw error;

    const nextState: TestModeState = {
      isActive: active,
      status: active ? "active" : "inactive",
      lastRunAt: nowIso,
      lastRunBy: authorName,
      updatedAt: nowIso,
    };

    memoryTestModeState = nextState;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
    } catch (_) {}

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("lcsim-test-mode-updated", { detail: nextState })
      );
    }

    return { success: true, state: nextState };
  } catch (err: any) {
    console.error("setTestModeState error:", err);
    return {
      success: false,
      error: err?.message || "Impossibile aggiornare lo stato della modalità test.",
    };
  }
}

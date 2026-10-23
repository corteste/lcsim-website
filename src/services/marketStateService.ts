import { supabase } from "@/supabaseClient";

export interface MarketState {
  isOpen: boolean;
  status: "open" | "closed";
  lastRunAt: string | null;
  lastRunBy: string | null;
  updatedAt: string | null;
}

const STORAGE_KEY = "lcsim_automation_state";

/**
 * Recupera lo stato attuale della finestra di calciomercato da Supabase
 * (con fallback sincrono su localStorage).
 */
export async function getMarketState(): Promise<MarketState> {
  try {
    const { data, error } = await supabase
      .from("league_automation_state")
      .select("*")
      .eq("id", "market_toggle")
      .maybeSingle();

    if (error || !data) {
      // Fallback da localStorage
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          const item = parsed["market_toggle"];
          if (item) {
            const isClosed = item.details?.status === "closed";
            return {
              isOpen: !isClosed,
              status: isClosed ? "closed" : "open",
              lastRunAt: item.last_run_at || null,
              lastRunBy: item.last_run_by || null,
              updatedAt: item.updated_at || null,
            };
          }
        }
      } catch (_) {}

      // Default: aperto
      return {
        isOpen: true,
        status: "open",
        lastRunAt: null,
        lastRunBy: null,
        updatedAt: null,
      };
    }

    const isClosed = data.details?.status === "closed";
    return {
      isOpen: !isClosed,
      status: isClosed ? "closed" : "open",
      lastRunAt: data.last_run_at || null,
      lastRunBy: data.last_run_by || null,
      updatedAt: data.updated_at || null,
    };
  } catch (err) {
    console.warn("Errore getMarketState, fallback aperto:", err);
    return {
      isOpen: true,
      status: "open",
      lastRunAt: null,
      lastRunBy: null,
      updatedAt: null,
    };
  }
}

/**
 * Aggiorna lo stato della finestra di calciomercato su Supabase e sincronizza la cache locale.
 */
export async function setMarketState(
  newStatus: "open" | "closed",
  authorName: string
): Promise<{ success: boolean; error?: string }> {
  const nowIso = new Date().toISOString();
  try {
    const { error } = await supabase
      .from("league_automation_state")
      .upsert({
        id: "market_toggle",
        action_name: "Controllo Finestra Calciomercato",
        last_run_at: nowIso,
        last_run_by: authorName,
        details: { status: newStatus },
        updated_at: nowIso,
      });

    if (error) throw error;

    // Aggiorna cache locale
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      parsed["market_toggle"] = {
        id: "market_toggle",
        action_name: "Controllo Finestra Calciomercato",
        last_run_at: nowIso,
        last_run_by: authorName,
        details: { status: newStatus },
        updated_at: nowIso,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    } catch (_) {}

    return { success: true };
  } catch (err: any) {
    console.error("Errore setMarketState:", err);
    return { success: false, error: err.message || "Errore durante l'aggiornamento dello stato del mercato" };
  }
}

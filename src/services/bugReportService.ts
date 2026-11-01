import { supabase } from "@/supabaseClient";

export type BugReportCategory =
  | "bug"
  | "funzione"
  | "calcoli"
  | "suggerimento"
  | "altro";

export interface BugReport {
  id: string;
  sender_username: string | null;
  sender_team: string | null;
  page_url: string | null;
  category: BugReportCategory;
  title: string;
  description: string;
  status: "open" | "resolved" | "ignored";
  admin_notes: string | null;
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
}

export interface CreateBugReportPayload {
  title: string;
  description: string;
  category?: BugReportCategory;
  page_url?: string;
  sender_username?: string;
  sender_team?: string;
}

export const BUG_CATEGORIES: Record<
  BugReportCategory,
  { label: string; badgeClass: string; icon: string }
> = {
  bug: {
    label: "Bug Grafico / UI",
    badgeClass: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
    icon: "🐛",
  },
  funzione: {
    label: "Funzione Bloccata / Errore",
    badgeClass: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
    icon: "⚠️",
  },
  calcoli: {
    label: "Errore Calcoli / Dati",
    badgeClass: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
    icon: "📊",
  },
  suggerimento: {
    label: "Suggerimento / Miglioria",
    badgeClass: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30",
    icon: "💡",
  },
  altro: {
    label: "Altro",
    badgeClass: "bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30",
    icon: "📝",
  },
};

/**
 * Invia una nuova segnalazione di bug o feedback.
 */
export async function sendBugReport(
  payload: CreateBugReportPayload
): Promise<{ success: boolean; data?: BugReport; error?: string }> {
  try {
    if (!payload.title?.trim()) {
      return { success: false, error: "Inserisci un titolo per la segnalazione." };
    }
    if (!payload.description?.trim()) {
      return { success: false, error: "Inserisci una descrizione del problema riscontrato." };
    }

    const insertPayload = {
      title: payload.title.trim(),
      description: payload.description.trim(),
      category: payload.category || "bug",
      page_url: payload.page_url || (typeof window !== "undefined" ? window.location.pathname : ""),
      sender_username: payload.sender_username || "Utente",
      sender_team: payload.sender_team || null,
      status: "open",
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("league_bug_reports")
      .insert(insertPayload)
      .select()
      .single();

    if (error) throw error;

    // Notifica l'evento a livello locale/finestra
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("lcsim-notifications-updated"));
      window.dispatchEvent(new CustomEvent("lcsim-bug-report-created", { detail: data }));
    }

    return { success: true, data: data as BugReport };
  } catch (err: any) {
    console.error("sendBugReport error:", err);
    return {
      success: false,
      error: err?.message || "Errore durante l'invio della segnalazione.",
    };
  }
}

/**
 * Recupera l'elenco delle segnalazioni (per l'Admin).
 */
export async function fetchBugReports(
  statusFilter?: "open" | "resolved" | "ignored" | "all"
): Promise<BugReport[]> {
  try {
    let query = supabase
      .from("league_bug_reports")
      .select("*")
      .order("created_at", { ascending: false });

    if (statusFilter && statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []) as BugReport[];
  } catch (err) {
    console.error("fetchBugReports error:", err);
    return [];
  }
}

/**
 * Aggiorna lo stato di una segnalazione (Aperto, Risolto, Ignorato).
 */
export async function updateBugReportStatus(
  id: string,
  status: "open" | "resolved" | "ignored",
  adminNotes?: string,
  adminName = "Super Admin"
): Promise<{ success: boolean; error?: string }> {
  try {
    const isResolved = status === "resolved";
    const updatePayload: Record<string, any> = {
      status,
      admin_notes: adminNotes !== undefined ? adminNotes : undefined,
      resolved_at: isResolved ? new Date().toISOString() : null,
      resolved_by: isResolved ? adminName : null,
    };

    const { error } = await supabase
      .from("league_bug_reports")
      .update(updatePayload)
      .eq("id", id);

    if (error) throw error;

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("lcsim-notifications-updated"));
      window.dispatchEvent(new CustomEvent("lcsim-bug-report-updated", { detail: { id, status } }));
    }

    return { success: true };
  } catch (err: any) {
    console.error("updateBugReportStatus error:", err);
    return {
      success: false,
      error: err?.message || "Errore durante l'aggiornamento della segnalazione.",
    };
  }
}

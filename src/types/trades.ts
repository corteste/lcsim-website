export type TradeStatus =
  | "pending"          // In attesa della risposta della controparte
  | "pending_admin"    // Accettata dalle squadre, in attesa di firma Admin
  | "completed"        // Ufficiale ed eseguita a sistema
  | "rejected"         // Rifiutata dal ricevente
  | "cancelled"        // Annullata dal mittente
  | "admin_rejected";  // Respinta dall'Admin

export interface Trade {
  id: string;
  sender_team: string;
  receiver_team: string;
  offered_player_ids: number[];
  offered_pick_numbers: number[];
  requested_player_ids: number[];
  requested_pick_numbers: number[];
  status: TradeStatus;
  notes?: string | null;
  rejection_reason?: string | null;
  parent_trade_id?: string | null;
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
  completed_by?: string | null;
}

export interface TradeMessage {
  id: string;
  trade_id: string;
  sender_team: string;
  sender_name?: string | null;
  message: string;
  created_at: string;
}

export interface TradePlayerAsset {
  ID: number;
  Nome: string;
  Cognome: string;
  Posiz: string;
  OVR: number;
  Squadra: string;
  Età?: number | null;
  marketStatus?: string | null;
}

export interface TradePickAsset {
  pick_overall: number;
  round: number;
  pick_in_round: number;
  team_id: string;
  original_team_id: string;
  rookie_id?: number | null;
}

export interface EnrichedTrade extends Trade {
  sender_team_name?: string;
  receiver_team_name?: string;
  offered_players: TradePlayerAsset[];
  offered_picks: TradePickAsset[];
  requested_players: TradePlayerAsset[];
  requested_picks: TradePickAsset[];
  messages?: TradeMessage[];
}

export interface CreateTradePayload {
  sender_team: string;
  receiver_team: string;
  offered_player_ids: number[];
  offered_pick_numbers: number[];
  requested_player_ids: number[];
  requested_pick_numbers: number[];
  notes?: string;
  parent_trade_id?: string;
}

export const TRADE_STATUS_CONFIG: Record<
  TradeStatus,
  { label: string; badgeClass: string; description: string }
> = {
  pending: {
    label: "In Attesa di Risposta",
    badgeClass: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
    description: "In valutazione da parte della squadra ricevente.",
  },
  pending_admin: {
    label: "In Approvazione Admin",
    badgeClass: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30",
    description: "Accordo raggiunto tra le squadre! In attesa di convalida ufficiale della Lega.",
  },
  completed: {
    label: "Ufficiale & Conclusa",
    badgeClass: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    description: "Scambio approvato ed eseguito ufficialmente in Serie A.",
  },
  rejected: {
    label: "Rifiutata",
    badgeClass: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
    description: "La squadra ricevente ha declinato la proposta.",
  },
  cancelled: {
    label: "Annullata",
    badgeClass: "bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30",
    description: "Ritirata dalla squadra proponente.",
  },
  admin_rejected: {
    label: "Respinta dalla Lega",
    badgeClass: "bg-red-600/15 text-red-700 dark:text-red-400 border-red-600/30",
    description: "Non approvata dalla Commissione Tecnica / Admin.",
  },
};

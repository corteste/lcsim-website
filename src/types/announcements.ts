export type AnnouncementCategory =
  | "generale"
  | "regolamento"
  | "mercato"
  | "giornate"
  | "disciplinare";

export type AnnouncementPriority = "normal" | "high" | "urgent";

export interface LeagueAnnouncement {
  id: string;
  title: string;
  content: string;
  category: AnnouncementCategory;
  priority: AnnouncementPriority;
  is_pinned: boolean;
  is_banner: boolean;
  author_name: string;
  created_at: string;
  expires_at?: string | null;
  is_read?: boolean;
}

export interface CreateAnnouncementPayload {
  title: string;
  content: string;
  category: AnnouncementCategory;
  priority: AnnouncementPriority;
  is_pinned: boolean;
  is_banner: boolean;
  author_name?: string;
  expires_at?: string | null;
}

export type NotificationType =
  | "announcement"
  | "trade_received"
  | "trade_status"
  | "trade_message"
  | "admin_approval";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  timestamp: string;
  link: string;
  isUnread: boolean;
  priority?: "normal" | "high" | "urgent";
  announcementId?: string;
  tradeId?: string;
}

export const ANNOUNCEMENT_CATEGORIES: Record<
  AnnouncementCategory,
  { label: string; badgeClass: string; dotColor: string }
> = {
  generale: {
    label: "Comunicato Generale",
    badgeClass: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
    dotColor: "bg-blue-500",
  },
  regolamento: {
    label: "Regolamento & Norme",
    badgeClass: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30",
    dotColor: "bg-purple-500",
  },
  mercato: {
    label: "Mercato & Draft",
    badgeClass: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    dotColor: "bg-emerald-500",
  },
  giornate: {
    label: "Calendario & Giornate",
    badgeClass: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
    dotColor: "bg-amber-500",
  },
  disciplinare: {
    label: "Giudice Sportivo",
    badgeClass: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
    dotColor: "bg-rose-500",
  },
};

export const ANNOUNCEMENT_PRIORITIES: Record<
  AnnouncementPriority,
  { label: string; badgeClass: string }
> = {
  normal: {
    label: "Ordinaria",
    badgeClass: "bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30",
  },
  high: {
    label: "Importante",
    badgeClass: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  },
  urgent: {
    label: "Urgente / Prioritaria",
    badgeClass: "bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/40 animate-pulse",
  },
};

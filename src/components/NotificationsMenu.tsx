import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Megaphone,
  ArrowLeftRight,
  MessageSquare,
  ShieldAlert,
  CheckCheck,
  ExternalLink,
  Clock,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/supabaseClient";
import {
  fetchUnifiedNotifications,
  markAnnouncementAsRead,
  markAllAnnouncementsAsRead,
  markNotificationIdReadLocally,
  markMultipleNotificationIdsReadLocally,
  deleteNotificationLocally,
  deleteMultipleNotificationsLocally,
} from "@/services/announcementsService";
import { AppNotification } from "@/types/announcements";
import { toast } from "sonner";

let memoryNotifications: AppNotification[] = [];

export const NotificationsMenu: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<AppNotification[]>(() => memoryNotifications);
  const [open, setOpen] = useState(false);

  const userKey = user?.id || user?.username || user?.team || undefined;
  const userTeam = user?.team || undefined;

  const loadNotifications = useCallback(async () => {
    const items = await fetchUnifiedNotifications({
      userKey,
      userTeam,
      isAdmin,
    });
    memoryNotifications = items;
    setNotifications(items);
  }, [userKey, userTeam, isAdmin]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Realtime subscription su league_announcements, market_trades e trade_messages
  useEffect(() => {
    const channel = supabase
      .channel("lcsim-realtime-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "league_announcements" },
        (payload: any) => {
          loadNotifications();
          if (payload?.new?.title) {
            toast.info(`📢 Nuovo Comunicato Lega: ${payload.new.title}`);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "market_trades" },
        (payload: any) => {
          loadNotifications();
          const row = payload?.new;
          if (!row) return;
          if (payload.eventType === "INSERT" && userTeam && row.receiver_team === userTeam) {
            toast.info(`📥 Nuova proposta di scambio ricevuta da ${row.sender_team}!`);
          } else if (payload.eventType === "UPDATE" && isAdmin && row.status === "pending_admin") {
            toast.info(`⚖️ Scambio concordato tra ${row.sender_team} e ${row.receiver_team} pronto per convalida!`);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "trade_messages" },
        () => {
          loadNotifications();
        }
      )
      .subscribe();

    const handleSync = () => loadNotifications();
    window.addEventListener("lcsim-notifications-updated", handleSync);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("lcsim-notifications-updated", handleSync);
    };
  }, [loadNotifications, userTeam, isAdmin]);

  const unreadCount = notifications.filter((n) => n.isUnread).length;

  // Clic su una notifica: segna immediatamente come letta e naviga
  const handleNotificationClick = async (notif: AppNotification) => {
    markNotificationIdReadLocally(notif.id, userKey);
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, isUnread: false } : n))
    );

    if (notif.announcementId) {
      await markAnnouncementAsRead(notif.announcementId, userKey);
    }

    window.dispatchEvent(new Event("lcsim-notifications-updated"));
    setOpen(false);
    navigate(notif.link);
  };

  // Elimina una singola notifica dal Centro Notifiche
  const handleDeleteNotification = async (
    e: React.MouseEvent,
    notif: AppNotification
  ) => {
    e.stopPropagation();
    deleteNotificationLocally(notif.id, userKey);
    markNotificationIdReadLocally(notif.id, userKey);

    if (notif.announcementId) {
      await markAnnouncementAsRead(notif.announcementId, userKey);
    }

    setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
    window.dispatchEvent(new Event("lcsim-notifications-updated"));
  };

  // Segna tutte come lette
  const handleMarkAllRead = async () => {
    const allIds = notifications.map((n) => n.id);
    markMultipleNotificationIdsReadLocally(allIds, userKey);

    const announcementIds = notifications
      .filter((n) => n.announcementId)
      .map((n) => n.announcementId!);

    if (announcementIds.length > 0) {
      await markAllAnnouncementsAsRead(announcementIds, userKey);
    }

    setNotifications((prev) => prev.map((n) => ({ ...n, isUnread: false })));
    window.dispatchEvent(new Event("lcsim-notifications-updated"));
    toast.success("Tutte le notifiche sono state segnate come lette.");
  };

  // Svuota / elimina tutte le notifiche presenti nel Centro Notifiche
  const handleClearAllNotifications = async () => {
    const allIds = notifications.map((n) => n.id);
    deleteMultipleNotificationsLocally(allIds, userKey);
    markMultipleNotificationIdsReadLocally(allIds, userKey);

    const announcementIds = notifications
      .filter((n) => n.announcementId)
      .map((n) => n.announcementId!);

    if (announcementIds.length > 0) {
      await markAllAnnouncementsAsRead(announcementIds, userKey);
    }

    setNotifications([]);
    window.dispatchEvent(new Event("lcsim-notifications-updated"));
    toast.info("Centro notifiche svuotato.");
  };

  const getIcon = (type: AppNotification["type"]) => {
    switch (type) {
      case "announcement":
        return <Megaphone className="h-4 w-4 text-amber-500 shrink-0" />;
      case "admin_approval":
        return <ShieldAlert className="h-4 w-4 text-purple-500 shrink-0" />;
      case "trade_received":
      case "trade_status":
        return <ArrowLeftRight className="h-4 w-4 text-emerald-500 shrink-0" />;
      case "trade_message":
        return <MessageSquare className="h-4 w-4 text-blue-500 shrink-0" />;
      default:
        return <Bell className="h-4 w-4 text-muted-foreground shrink-0" />;
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          title="Notifiche & Comunicazioni"
          className="relative h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 rounded-full bg-rose-500 text-white text-[9px] font-black font-mono flex items-center justify-center shadow-sm animate-pulse">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-80 sm:w-96 p-0 bg-card/95 backdrop-blur-md border border-border/80 shadow-2xl rounded-2xl overflow-hidden z-50"
      >
        {/* Header */}
        <div className="p-3 border-b border-border/70 bg-muted/30 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Bell className="h-4 w-4 text-emerald-500 shrink-0" />
            <span className="text-xs font-black tracking-tight truncate">Centro Notifiche</span>
            {unreadCount > 0 && (
              <Badge className="bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 text-[10px] font-mono px-1.5 py-0 shrink-0">
                {unreadCount} nuove
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllRead}
                title="Segna tutte come lette"
                className="h-6 px-2 text-[10px] font-bold text-muted-foreground hover:text-foreground"
              >
                <CheckCheck className="h-3 w-3 mr-1" /> Lette
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAllNotifications}
                title="Elimina tutte le notifiche dalla lista"
                className="h-6 px-2 text-[10px] font-bold text-rose-600/80 hover:text-rose-600 hover:bg-rose-500/10"
              >
                <Trash2 className="h-3 w-3 mr-1" /> Svuota
              </Button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <ScrollArea className="max-h-[360px]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              <Bell className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              Nessuna notifica presente.
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`group p-3 flex items-start gap-3 cursor-pointer transition-colors ${
                    notif.isUnread
                      ? "bg-emerald-500/10 hover:bg-emerald-500/15"
                      : "hover:bg-muted/50 opacity-75"
                  }`}
                >
                  <div className="mt-0.5 h-8 w-8 rounded-lg bg-muted/80 border border-border/60 flex items-center justify-center shrink-0">
                    {getIcon(notif.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={`text-xs leading-snug ${
                          notif.isUnread
                            ? "font-extrabold text-foreground"
                            : "font-semibold text-foreground/80"
                        }`}
                      >
                        {notif.title}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {notif.isUnread && (
                          <span
                            title="Non letta"
                            className="h-2 w-2 rounded-full bg-emerald-500 shrink-0"
                          />
                        )}
                        <button
                          type="button"
                          onClick={(e) => handleDeleteNotification(e, notif)}
                          title="Elimina questa notifica"
                          className="p-1 rounded-md text-muted-foreground/60 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                      {notif.description}
                    </p>
                    <div className="flex items-center justify-between mt-1 text-[10px] font-mono text-muted-foreground/80">
                      <div className="flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        <span>
                          {new Date(notif.timestamp).toLocaleDateString("it-IT", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <span className="text-[9px] font-sans font-bold text-emerald-600 dark:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        {notif.isUnread ? "Clicca per aprire e segnare letta →" : "Apri →"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="p-2.5 border-t border-border/70 bg-muted/20 flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setOpen(false);
              navigate("/comunicati");
            }}
            className="w-full h-8 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
          >
            <Megaphone className="h-3.5 w-3.5 mr-1.5" />
            Bacheca Comunicati Ufficiali
            <ExternalLink className="h-3 w-3 ml-1.5 opacity-70" />
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/supabaseClient";
import { fetchUnifiedNotifications } from "@/services/announcementsService";
import { AppNotification } from "@/types/announcements";

let memoryNotifications: AppNotification[] = [];

export function useInboxUnreadCount(): number {
  const { user, isAdmin } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>(
    () => memoryNotifications
  );

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

  useEffect(() => {
    const channel = supabase
      .channel("lcsim-realtime-inbox-badge")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "league_announcements" },
        (payload: { new?: { title?: string } }) => {
          loadNotifications();
          if (payload?.new?.title) {
            toast.info(`📢 Nuovo Comunicato Lega: ${payload.new.title}`);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "market_trades" },
        (payload: {
          eventType?: string;
          new?: { receiver_team?: string; sender_team?: string; status?: string };
        }) => {
          loadNotifications();
          const row = payload?.new;
          if (!row) return;
          if (payload.eventType === "INSERT" && userTeam && row.receiver_team === userTeam) {
            toast.info(`📥 Nuova proposta di scambio ricevuta da ${row.sender_team}!`);
          } else if (
            payload.eventType === "UPDATE" &&
            isAdmin &&
            row.status === "pending_admin"
          ) {
            toast.info(
              `⚖️ Scambio concordato tra ${row.sender_team} e ${row.receiver_team} pronto per convalida!`
            );
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
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "league_bug_reports" },
        (payload: { eventType?: string; new?: { title?: string } }) => {
          loadNotifications();
          if (isAdmin && payload.eventType === "INSERT") {
            toast.error(
              `🐞 Nuova segnalazione bug ricevuta: "${payload?.new?.title || "Bug"}"`,
              { duration: 6000 }
            );
          }
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

  return notifications.filter((n) => n.isUnread).length;
}

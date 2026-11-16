import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/supabaseClient";
import { fetchUnifiedNotifications } from "@/services/announcementsService";
import { AppNotification } from "@/types/announcements";
import {
  checkAndNotifyFormationDeadline,
  registerPwaServiceWorker,
  showNativePwaNotification,
} from "@/services/pwaNotificationService";

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
    registerPwaServiceWorker();
    checkAndNotifyFormationDeadline(userTeam, isAdmin);
    const intervalId = window.setInterval(() => {
      checkAndNotifyFormationDeadline(userTeam, isAdmin);
    }, 5 * 60 * 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [userTeam, isAdmin]);

  useEffect(() => {
    const channel = supabase
      .channel("lcsim-realtime-inbox-badge")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "league_announcements" },
        (payload: { new?: { id?: string; title?: string; content?: string } }) => {
          loadNotifications();
          if (payload?.new?.title) {
            toast.info(`📢 Nuovo Comunicato Lega: ${payload.new.title}`);
            showNativePwaNotification({
              title: `📢 ${payload.new.title}`,
              body: payload.new.content?.slice(0, 120) || "Nuovo comunicato ufficiale in Inbox.",
              url: "/inbox",
              tag: `ann-${payload.new.id || Date.now()}`,
            });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "market_trades" },
        (payload: {
          eventType?: string;
          new?: { id?: string; receiver_team?: string; sender_team?: string; status?: string };
        }) => {
          loadNotifications();
          const row = payload?.new;
          if (!row) return;
          if (payload.eventType === "INSERT" && userTeam && row.receiver_team === userTeam) {
            const msg = `📥 Nuova proposta di scambio ricevuta da ${row.sender_team}!`;
            toast.info(msg);
            showNativePwaNotification({
              title: "📥 Nuova Offerta di Scambio",
              body: `${row.sender_team} ti ha inviato una proposta di trattativa.`,
              url: "/mia-squadra/trattative",
              tag: `trade-recv-${row.id || Date.now()}`,
            });
          } else if (
            payload.eventType === "UPDATE" &&
            isAdmin &&
            row.status === "pending_admin"
          ) {
            toast.info(
              `⚖️ Scambio concordato tra ${row.sender_team} e ${row.receiver_team} pronto per convalida!`
            );
            showNativePwaNotification({
              title: `⚖️ Scambio da Convalidare (${row.sender_team} ↔ ${row.receiver_team})`,
              body: "Entrambi i club hanno accettato. È richiesta la convalida Admin.",
              url: "/mia-squadra/trattative",
              tag: `trade-admin-${row.id || Date.now()}`,
            });
          } else if (
            payload.eventType === "UPDATE" &&
            userTeam &&
            (row.sender_team === userTeam || row.receiver_team === userTeam) &&
            (row.status === "completed" || row.status === "rejected" || row.status === "admin_rejected")
          ) {
            const statusTitle =
              row.status === "completed"
                ? `🏆 Scambio Ufficiale (${row.sender_team} ↔ ${row.receiver_team})`
                : row.status === "admin_rejected"
                ? `⛔ Scambio Respinto dalla Lega (${row.sender_team} ↔ ${row.receiver_team})`
                : `❌ Offerta Rifiutata (${row.sender_team} ↔ ${row.receiver_team})`;
            showNativePwaNotification({
              title: statusTitle,
              body: "Apri l'Inbox o Trattative per vedere i dettagli.",
              url: "/inbox",
              tag: `trade-upd-${row.id}-${row.status}`,
            });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "trade_messages" },
        (payload: { new?: { id?: string; sender_team?: string; sender_name?: string; message?: string } }) => {
          loadNotifications();
          const msgRow = payload?.new;
          if (msgRow && userTeam && msgRow.sender_team && msgRow.sender_team !== userTeam) {
            showNativePwaNotification({
              title: `💬 Messaggio da ${msgRow.sender_name || msgRow.sender_team}`,
              body: msgRow.message?.slice(0, 120) || "Nuovo messaggio nella trattativa.",
              url: "/mia-squadra/trattative",
              tag: `trade-msg-${msgRow.id || Date.now()}`,
            });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "press_conferences" },
        (payload: {
          eventType?: string;
          new?: { id?: number; team_id?: string; status?: string; question?: string; matchday?: number };
        }) => {
          const pc = payload?.new;
          if (!pc) return;
          if (payload.eventType === "INSERT" && userTeam && pc.team_id === userTeam && pc.status === "PENDING") {
            showNativePwaNotification({
              title: `🎙️ Nuova Domanda Sala Stampa (G${pc.matchday ?? ""})`,
              body: pc.question?.slice(0, 120) || "Il giornalista della Lega attende una tua dichiarazione.",
              url: "/inbox",
              tag: `press-pending-${pc.id || Date.now()}`,
            });
          } else if (payload.eventType === "UPDATE" && pc.status === "ANSWERED" && pc.team_id !== userTeam) {
            showNativePwaNotification({
              title: `📰 Dichiarazioni da ${pc.team_id} in Sala Stampa`,
              body: pc.question?.slice(0, 120) || "Nuova intervista pubblicata nella Inbox.",
              url: "/inbox",
              tag: `press-ans-${pc.id || Date.now()}`,
            });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "league_market_rumors" },
        (payload: { new?: { id?: number; headline?: string; source_label?: string } }) => {
          const rumor = payload?.new;
          if (rumor?.headline) {
            showNativePwaNotification({
              title: `🔥 ${rumor.source_label || "Voci di Mercato"}`,
              body: rumor.headline,
              url: "/inbox",
              tag: `rumor-${rumor.id || Date.now()}`,
            });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "league_bug_reports" },
        (payload: { eventType?: string; new?: { id?: string; title?: string } }) => {
          loadNotifications();
          if (isAdmin && payload.eventType === "INSERT") {
            toast.error(
              `🐞 Nuova segnalazione bug ricevuta: "${payload?.new?.title || "Bug"}"`,
              { duration: 6000 }
            );
            showNativePwaNotification({
              title: "🐞 Nuova Segnalazione Bug",
              body: payload?.new?.title || "Controlla il pannello Admin.",
              url: "/admin/automazioni",
              tag: `bug-${payload?.new?.id || Date.now()}`,
            });
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

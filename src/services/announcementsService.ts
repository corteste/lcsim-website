import { supabase } from "@/supabaseClient";
import {
  LeagueAnnouncement,
  CreateAnnouncementPayload,
  AppNotification,
} from "@/types/announcements";

const ANNOUNCEMENTS_TABLE = "league_announcements";
const READS_TABLE = "announcement_reads";

const LOCAL_READ_ANNOUNCEMENTS_KEY = "lcsim_read_announcements";
const LOCAL_DISMISSED_BANNERS_KEY = "lcsim_dismissed_banners";
const LOCAL_READ_NOTIFICATIONS_KEY = "lcsim_read_notifications";
const LOCAL_DELETED_NOTIFICATIONS_KEY = "lcsim_deleted_notifications";

function getScopedKey(baseKey: string, userKey?: string): string {
  return userKey ? `${baseKey}_${userKey}` : baseKey;
}

function getLocalSet(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
}

function saveLocalSet(key: string, set: Set<string>) {
  try {
    localStorage.setItem(key, JSON.stringify(Array.from(set)));
  } catch {
    /* ignore */
  }
}

export function isBannerDismissed(announcementId: string): boolean {
  return getLocalSet(LOCAL_DISMISSED_BANNERS_KEY).has(announcementId);
}

export function dismissBannerLocally(announcementId: string) {
  const set = getLocalSet(LOCAL_DISMISSED_BANNERS_KEY);
  set.add(announcementId);
  saveLocalSet(LOCAL_DISMISSED_BANNERS_KEY, set);
}

export function markNotificationIdReadLocally(notifId: string, userKey?: string) {
  const scopedKey = getScopedKey(LOCAL_READ_NOTIFICATIONS_KEY, userKey);
  const set = getLocalSet(scopedKey);
  set.add(notifId);
  saveLocalSet(scopedKey, set);

  // Salva anche nella chiave globale per sicurezza
  const globalSet = getLocalSet(LOCAL_READ_NOTIFICATIONS_KEY);
  globalSet.add(notifId);
  saveLocalSet(LOCAL_READ_NOTIFICATIONS_KEY, globalSet);
}

export function markMultipleNotificationIdsReadLocally(notifIds: string[], userKey?: string) {
  const scopedKey = getScopedKey(LOCAL_READ_NOTIFICATIONS_KEY, userKey);
  const set = getLocalSet(scopedKey);
  notifIds.forEach((id) => set.add(id));
  saveLocalSet(scopedKey, set);

  const globalSet = getLocalSet(LOCAL_READ_NOTIFICATIONS_KEY);
  notifIds.forEach((id) => globalSet.add(id));
  saveLocalSet(LOCAL_READ_NOTIFICATIONS_KEY, globalSet);
}

/**
 * Elimina/nasconde definitivamente una notifica dal Centro Notifiche dell'utente.
 */
export function deleteNotificationLocally(notifId: string, userKey?: string) {
  const scopedKey = getScopedKey(LOCAL_DELETED_NOTIFICATIONS_KEY, userKey);
  const set = getLocalSet(scopedKey);
  set.add(notifId);
  saveLocalSet(scopedKey, set);

  const globalSet = getLocalSet(LOCAL_DELETED_NOTIFICATIONS_KEY);
  globalSet.add(notifId);
  saveLocalSet(LOCAL_DELETED_NOTIFICATIONS_KEY, globalSet);
}

/**
 * Elimina più notifiche contemporaneamente dal Centro Notifiche.
 */
export function deleteMultipleNotificationsLocally(notifIds: string[], userKey?: string) {
  const scopedKey = getScopedKey(LOCAL_DELETED_NOTIFICATIONS_KEY, userKey);
  const set = getLocalSet(scopedKey);
  notifIds.forEach((id) => set.add(id));
  saveLocalSet(scopedKey, set);

  const globalSet = getLocalSet(LOCAL_DELETED_NOTIFICATIONS_KEY);
  notifIds.forEach((id) => globalSet.add(id));
  saveLocalSet(LOCAL_DELETED_NOTIFICATIONS_KEY, globalSet);
}

/**
 * Carica tutti i comunicati ufficiali della Lega e calcola lo stato is_read per l'utente corrente.
 */
export async function fetchAnnouncements(userKey?: string): Promise<LeagueAnnouncement[]> {
  try {
    const { data, error } = await supabase
      .from(ANNOUNCEMENTS_TABLE)
      .select("*")
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("fetchAnnouncements error:", error);
      return [];
    }

    const scopedReadSet = getLocalSet(getScopedKey(LOCAL_READ_ANNOUNCEMENTS_KEY, userKey));
    const globalReadSet = getLocalSet(LOCAL_READ_ANNOUNCEMENTS_KEY);
    const dbReadSet = new Set<string>();

    if (userKey) {
      const { data: readsData } = await supabase
        .from(READS_TABLE)
        .select("announcement_id")
        .eq("user_key", userKey);

      (readsData || []).forEach((r: any) => dbReadSet.add(r.announcement_id));
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      title: item.title,
      content: item.content,
      category: item.category,
      priority: item.priority,
      is_pinned: Boolean(item.is_pinned),
      is_banner: Boolean(item.is_banner),
      author_name: item.author_name || "Commissione Lega LCSIM",
      created_at: item.created_at,
      expires_at: item.expires_at,
      is_read:
        dbReadSet.has(item.id) ||
        scopedReadSet.has(item.id) ||
        globalReadSet.has(item.id),
    }));
  } catch (err) {
    console.error("fetchAnnouncements exception:", err);
    return [];
  }
}

/**
 * Segna un comunicato come letto (sia su DB che su localStorage).
 */
export async function markAnnouncementAsRead(
  announcementId: string,
  userKey?: string
): Promise<void> {
  const scopedKey = getScopedKey(LOCAL_READ_ANNOUNCEMENTS_KEY, userKey);
  const scopedSet = getLocalSet(scopedKey);
  scopedSet.add(announcementId);
  saveLocalSet(scopedKey, scopedSet);

  const localSet = getLocalSet(LOCAL_READ_ANNOUNCEMENTS_KEY);
  localSet.add(announcementId);
  saveLocalSet(LOCAL_READ_ANNOUNCEMENTS_KEY, localSet);

  markNotificationIdReadLocally(`ann_${announcementId}`, userKey);

  if (userKey) {
    try {
      await supabase.from(READS_TABLE).upsert(
        {
          announcement_id: announcementId,
          user_key: userKey,
          read_at: new Date().toISOString(),
        },
        { onConflict: "announcement_id,user_key" }
      );
    } catch (err) {
      console.warn("markAnnouncementAsRead db warning:", err);
    }
  }
}

/**
 * Segna tutti i comunicati come letti.
 */
export async function markAllAnnouncementsAsRead(
  announcementIds: string[],
  userKey?: string
): Promise<void> {
  if (announcementIds.length === 0) return;

  const scopedKey = getScopedKey(LOCAL_READ_ANNOUNCEMENTS_KEY, userKey);
  const scopedSet = getLocalSet(scopedKey);
  announcementIds.forEach((id) => scopedSet.add(id));
  saveLocalSet(scopedKey, scopedSet);

  const localSet = getLocalSet(LOCAL_READ_ANNOUNCEMENTS_KEY);
  announcementIds.forEach((id) => localSet.add(id));
  saveLocalSet(LOCAL_READ_ANNOUNCEMENTS_KEY, localSet);

  markMultipleNotificationIdsReadLocally(
    announcementIds.map((id) => `ann_${id}`),
    userKey
  );

  if (userKey) {
    try {
      const rows = announcementIds.map((id) => ({
        announcement_id: id,
        user_key: userKey,
        read_at: new Date().toISOString(),
      }));
      await supabase.from(READS_TABLE).upsert(rows, {
        onConflict: "announcement_id,user_key",
      });
    } catch (err) {
      console.warn("markAllAnnouncementsAsRead db warning:", err);
    }
  }
}

/**
 * Crea un nuovo comunicato ufficiale (Solo Admin).
 */
export async function createAnnouncement(
  payload: CreateAnnouncementPayload
): Promise<{ success: boolean; data?: LeagueAnnouncement; error?: string }> {
  try {
    const { data, error } = await supabase
      .from(ANNOUNCEMENTS_TABLE)
      .insert({
        title: payload.title.trim(),
        content: payload.content.trim(),
        category: payload.category,
        priority: payload.priority,
        is_pinned: payload.is_pinned,
        is_banner: payload.is_banner,
        author_name: payload.author_name || "Commissione Lega LCSIM",
        expires_at: payload.expires_at || null,
      })
      .select()
      .single();

    if (error || !data) {
      return { success: false, error: error?.message || "Errore creazione comunicato." };
    }

    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err?.message || "Errore imprevisto." };
  }
}

/**
 * Aggiorna un comunicato esistente (Solo Admin).
 */
export async function updateAnnouncement(
  id: string,
  updates: Partial<CreateAnnouncementPayload>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from(ANNOUNCEMENTS_TABLE)
      .update(updates)
      .eq("id", id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Errore aggiornamento." };
  }
}

/**
 * Elimina un comunicato (Solo Admin).
 */
export async function deleteAnnouncement(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from(ANNOUNCEMENTS_TABLE)
      .delete()
      .eq("id", id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Errore eliminazione." };
  }
}

/**
 * Costruisce il feed unificato di notifiche per la Campana nella Navbar,
 * escludendo quelle eliminate dall'utente.
 */
export async function fetchUnifiedNotifications(params: {
  userKey?: string;
  userTeam?: string;
  isAdmin?: boolean;
}): Promise<AppNotification[]> {
  const { userKey, userTeam, isAdmin } = params;
  const scopedReadNotifs = getLocalSet(getScopedKey(LOCAL_READ_NOTIFICATIONS_KEY, userKey));
  const globalReadNotifs = getLocalSet(LOCAL_READ_NOTIFICATIONS_KEY);
  const scopedDeletedNotifs = getLocalSet(getScopedKey(LOCAL_DELETED_NOTIFICATIONS_KEY, userKey));
  const globalDeletedNotifs = getLocalSet(LOCAL_DELETED_NOTIFICATIONS_KEY);

  const isDeleted = (id: string) => scopedDeletedNotifs.has(id) || globalDeletedNotifs.has(id);
  const isRead = (id: string) => scopedReadNotifs.has(id) || globalReadNotifs.has(id);

  const notifications: AppNotification[] = [];

  try {
    // 1. Comunicati Lega
    const announcements = await fetchAnnouncements(userKey);
    announcements.slice(0, 15).forEach((ann) => {
      const notifId = `ann_${ann.id}`;
      if (isDeleted(notifId)) return;

      const unread = !ann.is_read && !isRead(notifId);
      notifications.push({
        id: notifId,
        type: "announcement",
        title: `📢 ${ann.title}`,
        description: ann.content.length > 90 ? ann.content.slice(0, 90) + "..." : ann.content,
        timestamp: ann.created_at,
        link: "/comunicati",
        isUnread: unread,
        priority: ann.priority,
        announcementId: ann.id,
      });
    });

    // 2. Notifiche Admin: Scambi in attesa di convalida Lega
    if (isAdmin) {
      const { data: adminTrades } = await supabase
        .from("market_trades")
        .select("*")
        .in("status", ["pending_admin", "pending"])
        .order("updated_at", { ascending: false })
        .limit(15);

      (adminTrades || []).forEach((t: any) => {
        const notifId = `admin_trade_${t.id}_${t.status}`;
        if (isDeleted(notifId)) return;

        const isPendingAdmin = t.status === "pending_admin";
        notifications.push({
          id: notifId,
          type: "admin_approval",
          title: isPendingAdmin
            ? `⚖️ Scambio Concordato: ${t.sender_team} ↔ ${t.receiver_team}`
            : `🔄 Nuova Trattativa: ${t.sender_team} → ${t.receiver_team}`,
          description: isPendingAdmin
            ? "Entrambe le società hanno accettato. Richiesta firma dell'Admin."
            : "Trattativa aperta tra i due club. Clicca per supervisionare o convalidare.",
          timestamp: t.updated_at || t.created_at,
          link: "/mia-squadra/trattative",
          isUnread: !isRead(notifId),
          priority: isPendingAdmin ? "urgent" : "high",
          tradeId: t.id,
        });
      });
    }

    // 3. Notifiche Manager Squadra: Scambi ricevuti, cambi stato e messaggi chat
    if (userTeam) {
      const { data: myTrades } = await supabase
        .from("market_trades")
        .select("*")
        .or(`sender_team.eq.${userTeam},receiver_team.eq.${userTeam}`)
        .order("updated_at", { ascending: false })
        .limit(20);

      const tradeIds: string[] = [];

      (myTrades || []).forEach((t: any) => {
        tradeIds.push(t.id);

        // a. Nuova proposta ricevuta in attesa
        if (t.receiver_team === userTeam && t.status === "pending") {
          const notifId = `trade_recv_${t.id}`;
          if (!isDeleted(notifId)) {
            notifications.push({
              id: notifId,
              type: "trade_received",
              title: `📥 Nuova Offerta di Scambio da ${t.sender_team}`,
              description: `${t.sender_team} ti ha inviato una proposta per ${(t.offered_player_ids?.length || 0) + (t.offered_pick_numbers?.length || 0)} asset.`,
              timestamp: t.created_at,
              link: "/mia-squadra/trattative",
              isUnread: !isRead(notifId),
              priority: "high",
              tradeId: t.id,
            });
          }
        }

        // b. Aggiornamento stato scambio (pending_admin, completed, rejected, admin_rejected)
        if (t.status !== "pending" && t.status !== "cancelled") {
          const notifId = `trade_status_${t.id}_${t.status}`;
          if (!isDeleted(notifId)) {
            let statusTitle = "";
            let statusDesc = "";

            if (t.status === "pending_admin") {
              statusTitle = `🤝 Accordo Raggiunto (${t.sender_team} ↔ ${t.receiver_team})`;
              statusDesc = "In attesa di convalida finale da parte dell'Admin di Lega.";
            } else if (t.status === "completed") {
              statusTitle = `🏆 Scambio Ufficiale Approvato (${t.sender_team} ↔ ${t.receiver_team})`;
              statusDesc = "La Lega ha registrato il trasferimento! Rose e scelte aggiornate.";
            } else if (t.status === "rejected" && t.sender_team === userTeam) {
              statusTitle = `❌ Offerta Rifiutata da ${t.receiver_team}`;
              statusDesc = t.rejection_reason
                ? `Motivo: "${t.rejection_reason}"`
                : "La società destinataria ha declinato la proposta.";
            } else if (t.status === "admin_rejected") {
              statusTitle = `⛔ Scambio Respinto dalla Lega (${t.sender_team} ↔ ${t.receiver_team})`;
              statusDesc = t.rejection_reason || "Non convalidato dalla Commissione Tecnica.";
            }

            if (statusTitle) {
              notifications.push({
                id: notifId,
                type: "trade_status",
                title: statusTitle,
                description: statusDesc,
                timestamp: t.completed_at || t.updated_at || t.created_at,
                link: "/mia-squadra/trattative",
                isUnread: !isRead(notifId),
                priority: t.status === "completed" ? "high" : "normal",
                tradeId: t.id,
              });
            }
          }
        }
      });

      // c. Messaggi chat recenti sulle proprie trattative inviati dalla controparte
      if (tradeIds.length > 0) {
        const { data: msgs } = await supabase
          .from("trade_messages")
          .select("*")
          .in("trade_id", tradeIds)
          .neq("sender_team", userTeam)
          .order("created_at", { ascending: false })
          .limit(10);

        (msgs || []).forEach((m: any) => {
          const notifId = `trade_msg_${m.id}`;
          if (isDeleted(notifId)) return;

          notifications.push({
            id: notifId,
            type: "trade_message",
            title: `💬 Messaggio da ${m.sender_name || m.sender_team}`,
            description: m.message.length > 80 ? m.message.slice(0, 80) + "..." : m.message,
            timestamp: m.created_at,
            link: "/mia-squadra/trattative",
            isUnread: !isRead(notifId),
            priority: "normal",
            tradeId: m.trade_id,
          });
        });
      }
    }

    return notifications.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  } catch (err) {
    console.error("fetchUnifiedNotifications error:", err);
    return notifications;
  }
}

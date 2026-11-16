import { toast } from "sonner";
import { supabase } from "@/supabaseClient";
import { VAPID_PUBLIC_KEY } from "@/constants/App";

const LOCAL_PUSH_ENABLED_KEY = "lcsim_push_enabled";
const LOCAL_PUSH_ENDPOINT_KEY = "lcsim_push_client_endpoint";
const LOCAL_DEADLINE_REMINDED_PREFIX = "lcsim_deadline_reminded_";
export const PWA_PUSH_STATE_EVENT = "lcsim-push-state-changed";

let swRegistrationPromise: Promise<ServiceWorkerRegistration | null> | null = null;

export interface NativeNotificationPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

/**
 * Registra il Service Worker PWA in modo idempotente.
 */
export function registerPwaServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return Promise.resolve(null);
  }
  if (!swRegistrationPromise) {
    swRegistrationPromise = navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .catch((err) => {
        console.warn("Registrazione Service Worker PWA non riuscita:", err);
        swRegistrationPromise = null;
        return null;
      });
  }
  return swRegistrationPromise;
}

export function isPushNotificationsSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator
  );
}

export function isPushNotificationsEnabled(): boolean {
  if (!isPushNotificationsSupported()) return false;
  if (Notification.permission !== "granted") return false;
  try {
    return localStorage.getItem(LOCAL_PUSH_ENABLED_KEY) !== "false";
  } catch {
    return true;
  }
}

function getOrCreateClientEndpoint(): string {
  try {
    const existing = localStorage.getItem(LOCAL_PUSH_ENDPOINT_KEY);
    if (existing) return existing;
    const generated =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? `pwa://client/${crypto.randomUUID()}`
        : `pwa://client/${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(LOCAL_PUSH_ENDPOINT_KEY, generated);
    return generated;
  } catch {
    return `pwa://client/fallback-${Date.now()}`;
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Invia una notifica nativa tramite il Service Worker PWA (con fallback su Notification API).
 */
export async function showNativePwaNotification(
  payload: NativeNotificationPayload
): Promise<boolean> {
  if (!isPushNotificationsEnabled()) return false;

  const title = payload.title;
  const options: NotificationOptions = {
    body: payload.body,
    icon: "/pwa-192x192.png",
    badge: "/pwa-192x192.png",
    tag: payload.tag || "lcsim-notification",
    data: { url: payload.url || "/inbox" },
  };

  try {
    const reg = await registerPwaServiceWorker();
    if (reg && "showNotification" in reg) {
      await reg.showNotification(title, options);
      return true;
    }
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: "SHOW_NOTIFICATION",
        payload,
      });
      return true;
    }
    new Notification(title, options);
    return true;
  } catch (err) {
    console.warn("Errore invio notifica nativa PWA:", err);
    return false;
  }
}

/**
 * Richiede i permessi di notifica push, registra l'eventuale PushSubscription e salva su Supabase.
 */
export async function requestAndEnablePushNotifications(params: {
  userKey?: string;
  teamId?: string | null;
}): Promise<{ enabled: boolean; reason?: string }> {
  if (!isPushNotificationsSupported()) {
    return {
      enabled: false,
      reason: "Il browser o dispositivo attuale non supporta le notifiche push.",
    };
  }

  const reg = await registerPwaServiceWorker();
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    try {
      localStorage.setItem(LOCAL_PUSH_ENABLED_KEY, "false");
    } catch {}
    window.dispatchEvent(new Event(PWA_PUSH_STATE_EVENT));
    return {
      enabled: false,
      reason:
        permission === "denied"
          ? "Permesso notifiche bloccato dalle impostazioni del browser."
          : "Autorizzazione alle notifiche non concessa.",
    };
  }

  try {
    localStorage.setItem(LOCAL_PUSH_ENABLED_KEY, "true");
  } catch {}

  let endpoint = getOrCreateClientEndpoint();
  let p256dh: string | null = null;
  let auth: string | null = null;

  const vapidKey = (import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined) || VAPID_PUBLIC_KEY;
  if (reg && "pushManager" in reg && vapidKey) {
    try {
      let subscription = await reg.pushManager.getSubscription();
      if (!subscription) {
        subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });
      }
      const subJson = subscription.toJSON();
      if (subJson.endpoint) {
        endpoint = subJson.endpoint;
        try {
          localStorage.setItem(LOCAL_PUSH_ENDPOINT_KEY, endpoint);
        } catch {}
      }
      p256dh = subJson.keys?.p256dh || null;
      auth = subJson.keys?.auth || null;
    } catch (subErr) {
      console.warn("PushManager subscribe fallback su client endpoint locale:", subErr);
    }
  }

  if (params.userKey) {
    await supabase.from("user_push_subscriptions").upsert(
      {
        user_key: params.userKey,
        team_id: params.teamId || null,
        endpoint,
        p256dh,
        auth,
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
        enabled: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "endpoint" }
    );
  }

  window.dispatchEvent(new Event(PWA_PUSH_STATE_EVENT));

  await showNativePwaNotification({
    title: "🔔 Notifiche LCSIM attivate",
    body: "Riceverai avvisi per nuove notizie in Inbox e promemoria 24h prima della chiusura formazioni.",
    url: "/inbox",
    tag: "lcsim-push-enabled",
  });

  return { enabled: true };
}

/**
 * Disattiva le notifiche push per la sessione e aggiorna Supabase.
 */
export async function disablePushNotifications(): Promise<void> {
  try {
    localStorage.setItem(LOCAL_PUSH_ENABLED_KEY, "false");
    const endpoint = localStorage.getItem(LOCAL_PUSH_ENDPOINT_KEY);
    if (endpoint) {
      await supabase
        .from("user_push_subscriptions")
        .update({ enabled: false, updated_at: new Date().toISOString() })
        .eq("endpoint", endpoint);
    }
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(PWA_PUSH_STATE_EVENT));
}

/**
 * Controlla se la chiusura formazioni attiva scade entro le prossime 24 ore
 * e invia un singolo reminder per squadra/giornata (notifica push + toast in-app).
 */
export async function checkAndNotifyFormationDeadline(
  userTeam?: string | null,
  isAdmin?: boolean
): Promise<void> {
  if (!userTeam || isAdmin) return;

  try {
    const { data, error } = await supabase
      .from("league_deadlines")
      .select("stag, week, deadline, is_active, is_force_closed")
      .eq("is_active", true);

    if (error || !data || data.length === 0) return;

    const now = Date.now();
    const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

    for (const row of data) {
      if (row.is_force_closed || !row.deadline) continue;
      const deadlineMs = new Date(row.deadline).getTime();
      if (Number.isNaN(deadlineMs)) continue;

      const remainingMs = deadlineMs - now;
      if (remainingMs <= 0 || remainingMs > TWENTY_FOUR_HOURS_MS) continue;

      const remindedKey = `${LOCAL_DEADLINE_REMINDED_PREFIX}${row.stag}_${row.week}_${userTeam}`;
      try {
        if (localStorage.getItem(remindedKey) === "true") continue;
        localStorage.setItem(remindedKey, "true");
      } catch {}

      const hoursLeft = Math.max(1, Math.ceil(remainingMs / (60 * 60 * 1000)));
      const deadlineFormatted = new Date(deadlineMs).toLocaleString("it-IT", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });

      const title = `⏰ Scadenza Formazione Giornata ${row.week}`;
      const body = `Mancano meno di ${hoursLeft}h alla chiusura formazioni (${deadlineFormatted}). Controlla e salva la tua tattica!`;

      toast.warning(`${title}: ${body}`, { duration: 8000 });
      await showNativePwaNotification({
        title,
        body,
        url: "/mia-squadra/tattica",
        tag: `lcsim-deadline-${row.stag}-${row.week}`,
      });
    }
  } catch (err) {
    console.warn("Errore controllo reminder scadenza formazioni:", err);
  }
}

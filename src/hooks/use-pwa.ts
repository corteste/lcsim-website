import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  PWA_PUSH_STATE_EVENT,
  disablePushNotifications,
  isPushNotificationsEnabled,
  isPushNotificationsSupported,
  registerPwaServiceWorker,
  requestAndEnablePushNotifications,
} from "@/services/pwaNotificationService";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

/**
 * Hook per gestire stato installazione PWA (solo mobile/tablet) e notifiche Push native.
 */
export function usePwa(params?: { userKey?: string; teamId?: string | null }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [pushEnabled, setPushEnabled] = useState<boolean>(() => isPushNotificationsEnabled());
  const [iosGuideOpen, setIosGuideOpen] = useState<boolean>(false);

  const { isMobileOrTablet, isIOS } = useMemo(() => {
    if (typeof navigator === "undefined") {
      return { isMobileOrTablet: false, isIOS: false };
    }
    const ua = navigator.userAgent || "";
    const ios =
      /iPhone|iPad|iPod/i.test(ua) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const mobile =
      ios || /Android|webOS|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet/i.test(ua);
    return { isMobileOrTablet: mobile, isIOS: ios };
  }, []);

  useEffect(() => {
    registerPwaServiceWorker();

    const checkStandalone = () => {
      const displayStandalone =
        typeof window !== "undefined" &&
        window.matchMedia?.("(display-mode: standalone)").matches;
      const iosStandalone =
        typeof navigator !== "undefined" && (navigator as { standalone?: boolean }).standalone === true;
      setIsStandalone(Boolean(displayStandalone || iosStandalone));
    };

    checkStandalone();

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
      toast.success("App LCSIM installata con successo!");
    };

    const handlePushSync = () => {
      setPushEnabled(isPushNotificationsEnabled());
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    window.addEventListener(PWA_PUSH_STATE_EVENT, handlePushSync);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener(PWA_PUSH_STATE_EVENT, handlePushSync);
    };
  }, []);

  // Il pulsante "Installa App" è visibile SOLO su dispositivi mobili/tablet non ancora in modalità standalone
  const showInstallButton =
    isMobileOrTablet && !isStandalone && (Boolean(deferredPrompt) || isIOS);

  const triggerInstall = useCallback(async () => {
    if (!isMobileOrTablet || isStandalone) return;

    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setDeferredPrompt(null);
      }
      return;
    }

    if (isIOS) {
      setIosGuideOpen(true);
    }
  }, [deferredPrompt, isIOS, isMobileOrTablet, isStandalone]);

  const togglePushNotifications = useCallback(async () => {
    if (pushEnabled) {
      await disablePushNotifications();
      setPushEnabled(false);
      toast.info("Notifiche Push disattivate.");
      return;
    }

    const res = await requestAndEnablePushNotifications({
      userKey: params?.userKey,
      teamId: params?.teamId,
    });
    setPushEnabled(res.enabled);
    if (res.enabled) {
      toast.success("Notifiche Push LCSIM attivate!");
    } else if (res.reason) {
      toast.error(res.reason);
    }
  }, [pushEnabled, params?.userKey, params?.teamId]);

  return {
    isMobileOrTablet,
    isIOS,
    isStandalone,
    showInstallButton,
    iosGuideOpen,
    setIosGuideOpen,
    triggerInstall,
    pushSupported: isPushNotificationsSupported(),
    pushEnabled,
    togglePushNotifications,
  };
}

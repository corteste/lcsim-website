import { useState, useEffect, useCallback } from "react";

export type HomeMode = "season" | "offseason";

const STORAGE_KEY = "lcsim_home_mode";
const CHANGE_EVENT = "lcsim-home-mode-change";

const readStoredMode = (): HomeMode => {
  if (typeof window === "undefined") return "season";
  try {
    const val = window.localStorage.getItem(STORAGE_KEY);
    return val === "offseason" ? "offseason" : "season";
  } catch {
    return "season";
  }
};

/**
 * Gestisce la modalità della Home Page ("season" | "offseason") persistita in localStorage
 * e sincronizzata fra i componenti della stessa tab e fra tab diverse.
 */
export const useHomeMode = () => {
  const [homeMode, setHomeModeState] = useState<HomeMode>(readStoredMode);

  useEffect(() => {
    const syncFromStorage = () => setHomeModeState(readStoredMode());

    const handleCustomEvent = (e: Event) => {
      const custom = e as CustomEvent<HomeMode>;
      if (custom.detail === "season" || custom.detail === "offseason") {
        setHomeModeState(custom.detail);
      } else {
        syncFromStorage();
      }
    };

    window.addEventListener(CHANGE_EVENT, handleCustomEvent);
    window.addEventListener("storage", syncFromStorage);
    return () => {
      window.removeEventListener(CHANGE_EVENT, handleCustomEvent);
      window.removeEventListener("storage", syncFromStorage);
    };
  }, []);

  const setHomeMode = useCallback((mode: HomeMode) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // Ignora errori storage in ambienti ristretti
    }
    setHomeModeState(mode);
    window.dispatchEvent(new CustomEvent<HomeMode>(CHANGE_EVENT, { detail: mode }));
  }, []);

  const toggleHomeMode = useCallback(() => {
    setHomeMode(readStoredMode() === "offseason" ? "season" : "offseason");
  }, [setHomeMode]);

  return { homeMode, setHomeMode, toggleHomeMode };
};

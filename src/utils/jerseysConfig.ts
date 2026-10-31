import { SUPABASE_STORAGE_URL } from "@/constants/App";

export interface TeamJersey {
  type: "home" | "away" | "third" | "gk";
  label: string;
  fullLabel: string;
  shortLabel: string;
  badgeClass: string;
  fileName: string;
  url: string;
}

export const TEAM_NUMERIC_IDS: Record<string, string> = {
  VFC: "17",
  ACD: "189",
  SKA: "237",
  APD: "245",
  ALV: "1745",
  PFC: "1843", // File id per Panormus FC
  RMB: "1848",
  MAR: "1906",
  OLD: "110062",
  EUR: "111434",
  ACF: "111974",
  COS: "112124",
};

export const TEAMS_WITH_THIRD_KIT = new Set([
  "VFC",
  "ACD",
  "SKA",
  "APD",
  "ALV",
  "PFC",
  "MAR",
  "OLD",
  "COS",
]);

/**
 * Ritorna le divise ufficiali della squadra nell'ordine stabilito:
 * 1 (Home), 2 (Away), 3 (Third se presente), Portiere (GK).
 * Le immagini risiedono nel bucket pubblico Supabase Storage (cartella images/jerseys/).
 */
export function getTeamJerseys(teamId: string | null | undefined): TeamJersey[] {
  if (!teamId) return [];
  const normalized = teamId.trim().toUpperCase();
  const numId = TEAM_NUMERIC_IDS[normalized];
  if (!numId) return [];

  const hasThird = TEAMS_WITH_THIRD_KIT.has(normalized);

  const jerseys: TeamJersey[] = [
    {
      type: "home",
      label: "1ª Maglia",
      fullLabel: "Prima Divisa (Casa)",
      shortLabel: "1ª",
      badgeClass: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
      fileName: `j0_${numId}_0.png`,
      url: `${SUPABASE_STORAGE_URL}/images/jerseys/j0_${numId}_0.png`,
    },
    {
      type: "away",
      label: "2ª Maglia",
      fullLabel: "Seconda Divisa (Trasferta)",
      shortLabel: "2ª",
      badgeClass: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
      fileName: `j1_${numId}_0.png`,
      url: `${SUPABASE_STORAGE_URL}/images/jerseys/j1_${numId}_0.png`,
    },
  ];

  if (hasThird) {
    jerseys.push({
      type: "third",
      label: "3ª Maglia",
      fullLabel: "Terza Divisa (Alternativa)",
      shortLabel: "3ª",
      badgeClass: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
      fileName: `j3_${numId}_0.png`,
      url: `${SUPABASE_STORAGE_URL}/images/jerseys/j3_${numId}_0.png`,
    });
  }

  jerseys.push({
    type: "gk",
    label: "Portiere",
    fullLabel: "Divisa Ufficiale Portiere",
    shortLabel: "POR",
    badgeClass: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30",
    fileName: `j2_${numId}_0.png`,
    url: `${SUPABASE_STORAGE_URL}/images/jerseys/j2_${numId}_0.png`,
  });

  return jerseys;
}

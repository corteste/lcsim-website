export type MacroNeedId =
  | "POR"
  | "TER"
  | "DC"
  | "CDC"
  | "CC"
  | "EST"
  | "COC"
  | "ATT";

export interface MacroCategoryConfig {
  id: MacroNeedId;
  label: string;
  shortLabel: string;
  subRoles: string[];
  subRolesLabel: string;
  colorClass: {
    bg: string;
    bgSubtle: string;
    text: string;
    border: string;
    badge: string;
    ring: string;
  };
}

export const MACRO_MARKET_CATEGORIES: MacroCategoryConfig[] = [
  {
    id: "POR",
    label: "Portieri",
    shortLabel: "POR",
    subRoles: ["POR"],
    subRolesLabel: "POR",
    colorClass: {
      bg: "bg-amber-500",
      bgSubtle: "bg-amber-500/10",
      text: "text-amber-500 dark:text-amber-400",
      border: "border-amber-500/30",
      badge: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
      ring: "ring-amber-500/30",
    },
  },
  {
    id: "TER",
    label: "Terzini",
    shortLabel: "TER",
    subRoles: ["TD", "TS"],
    subRolesLabel: "TD • TS",
    colorClass: {
      bg: "bg-cyan-500",
      bgSubtle: "bg-cyan-500/10",
      text: "text-cyan-500 dark:text-cyan-400",
      border: "border-cyan-500/30",
      badge: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30",
      ring: "ring-cyan-500/30",
    },
  },
  {
    id: "DC",
    label: "Difesa Interni",
    shortLabel: "DC",
    subRoles: ["DC"],
    subRolesLabel: "DC",
    colorClass: {
      bg: "bg-blue-600",
      bgSubtle: "bg-blue-600/10",
      text: "text-blue-600 dark:text-blue-400",
      border: "border-blue-500/30",
      badge: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
      ring: "ring-blue-500/30",
    },
  },
  {
    id: "CDC",
    label: "Mediani",
    shortLabel: "CDC",
    subRoles: ["CDC"],
    subRolesLabel: "CDC",
    colorClass: {
      bg: "bg-teal-500",
      bgSubtle: "bg-teal-500/10",
      text: "text-teal-600 dark:text-teal-400",
      border: "border-teal-500/30",
      badge: "bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30",
      ring: "ring-teal-500/30",
    },
  },
  {
    id: "CC",
    label: "Centrocampisti",
    shortLabel: "CC",
    subRoles: ["CC"],
    subRolesLabel: "CC",
    colorClass: {
      bg: "bg-emerald-500",
      bgSubtle: "bg-emerald-500/10",
      text: "text-emerald-600 dark:text-emerald-400",
      border: "border-emerald-500/30",
      badge: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
      ring: "ring-emerald-500/30",
    },
  },
  {
    id: "EST",
    label: "Esterni",
    shortLabel: "EST",
    subRoles: ["ED", "ES", "AD", "AS"],
    subRolesLabel: "ED • ES • AD • AS",
    colorClass: {
      bg: "bg-orange-500",
      bgSubtle: "bg-orange-500/10",
      text: "text-orange-500 dark:text-orange-400",
      border: "border-orange-500/30",
      badge: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30",
      ring: "ring-orange-500/30",
    },
  },
  {
    id: "COC",
    label: "Trequartisti",
    shortLabel: "COC",
    subRoles: ["COC"],
    subRolesLabel: "COC",
    colorClass: {
      bg: "bg-purple-500",
      bgSubtle: "bg-purple-500/10",
      text: "text-purple-600 dark:text-purple-400",
      border: "border-purple-500/30",
      badge: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30",
      ring: "ring-purple-500/30",
    },
  },
  {
    id: "ATT",
    label: "Attaccanti",
    shortLabel: "ATT",
    subRoles: ["ATT", "AT"],
    subRolesLabel: "ATT • AT",
    colorClass: {
      bg: "bg-rose-500",
      bgSubtle: "bg-rose-500/10",
      text: "text-rose-600 dark:text-rose-400",
      border: "border-rose-500/30",
      badge: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
      ring: "ring-rose-500/30",
    },
  },
];

export interface TeamMarketNeedRecord {
  team_id: string;
  needs: MacroNeedId[];
  updated_at: string;
  updated_by: string | null;
}

export interface EnrichedTeamMarketNeed extends TeamMarketNeedRecord {
  team_name: string;
  manager_name?: string | null;
  players_count?: number;
}

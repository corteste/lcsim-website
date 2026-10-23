import { Player } from "@/types/player";

export type ScoutingTier = 0 | 1 | 2 | 3 | 5;

export const SCOUTING_TIERS: {
  tokens: 1 | 2 | 3 | 5;
  label: string;
  shortLabel: string;
  title: string;
  description: string;
  badgeClass: string;
}[] = [
  {
    tokens: 1,
    label: "1 Gettone",
    shortLabel: "1G",
    title: "Fascia 1 • Osservazione Base",
    description:
      "Sblocca Piede Debole, Mosse Abilità, Specializzazioni Ruolo (Role 1/2) e il reparto attributi primario del ruolo.",
    badgeClass:
      "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30",
  },
  {
    tokens: 2,
    label: "2 Gettoni",
    shortLabel: "2G",
    title: "Fascia 2 • Analisi Atletica & Tratti",
    description:
      "Sblocca anche l'intero reparto Fisico & Velocità, i Calci Piazzati e i Tratti Base (Trait 1 & 2).",
    badgeClass:
      "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
  },
  {
    tokens: 3,
    label: "3 Gettoni",
    shortLabel: "3G",
    title: "Fascia 3 • Report Tecnico Avanzato",
    description:
      "Sblocca i reparti tecnici secondari, i Tratti Icona (Icon Trait 1 & 2) e una stima ristretta dell'Overall.",
    badgeClass:
      "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30",
  },
  {
    tokens: 5,
    label: "5 Gettoni",
    shortLabel: "5G",
    title: "Fascia 4 • Scouting Completo (100%)",
    description:
      "Sblocca l'Overall esatto e il 100% di tutte le caratteristiche e i 33 attributi del rookie.",
    badgeClass:
      "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  },
];

export type ScoutingDeptKey = "DIF" | "PAS" | "ATT" | "FIS" | "POR" | "CPZ";

export interface ScoutingStatItem {
  code: keyof Player;
  label: string;
  dept: ScoutingDeptKey;
}

export const SCOUTING_DEPARTMENTS: {
  key: ScoutingDeptKey;
  title: string;
  colorClass: string;
  stats: ScoutingStatItem[];
}[] = [
  {
    key: "DIF",
    title: "Difesa & Marcatura",
    colorClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    stats: [
      { code: "CONT", label: "Contrasto", dept: "DIF" },
      { code: "SCIV", label: "Scivolata", dept: "DIF" },
      { code: "MARC", label: "Marcatura", dept: "DIF" },
      { code: "AGGR", label: "Aggressività", dept: "DIF" },
      { code: "INTR", label: "Intercettazione", dept: "DIF" },
    ],
  },
  {
    key: "PAS",
    title: "Passaggi & Regia",
    colorClass: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
    stats: [
      { code: "PASC", label: "Passaggio Corto", dept: "PAS" },
      { code: "PASL", label: "Passaggio Lungo", dept: "PAS" },
      { code: "CRSS", label: "Cross", dept: "PAS" },
      { code: "CTRP", label: "Controllo Palla", dept: "PAS" },
      { code: "VISI", label: "Visione di Gioco", dept: "PAS" },
      { code: "EFFT", label: "Effetto", dept: "PAS" },
    ],
  },
  {
    key: "ATT",
    title: "Attacco & Tiro",
    colorClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    stats: [
      { code: "FINA", label: "Finalizzazione", dept: "ATT" },
      { code: "PIAZ", label: "Piazzamento", dept: "ATT" },
      { code: "PTIR", label: "Potenza Tiro", dept: "ATT" },
      { code: "TIRD", label: "Tiri dalla Distanza", dept: "ATT" },
      { code: "TIRV", label: "Tiri al Volo", dept: "ATT" },
      { code: "DRBL", label: "Dribbling", dept: "ATT" },
      { code: "TSTA", label: "Colpi di Testa", dept: "ATT" },
    ],
  },
  {
    key: "FIS",
    title: "Fisico & Velocità",
    colorClass: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    stats: [
      { code: "VELO", label: "Velocità Scatto", dept: "FIS" },
      { code: "ACCL", label: "Accelerazione", dept: "FIS" },
      { code: "AGIL", label: "Agilità", dept: "FIS" },
      { code: "RESI", label: "Resistenza", dept: "FIS" },
      { code: "FRZA", label: "Forza Fisica", dept: "FIS" },
      { code: "ELEV", label: "Elevazione", dept: "FIS" },
      { code: "EQLB", label: "Equilibrio", dept: "FIS" },
      { code: "RIFL", label: "Riflessi", dept: "FIS" },
    ],
  },
  {
    key: "POR",
    title: "Portiere",
    colorClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    stats: [
      { code: "PREP", label: "Presa", dept: "POR" },
      { code: "POSP", label: "Posizionamento", dept: "POR" },
      { code: "RINP", label: "Rinvio", dept: "POR" },
      { code: "RIFP", label: "Riflessi Portiere", dept: "POR" },
      { code: "TUFP", label: "Tuffo", dept: "POR" },
    ],
  },
  {
    key: "CPZ",
    title: "Calci Piazzati",
    colorClass: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    stats: [
      { code: "PNIZ", label: "Punizioni", dept: "CPZ" },
      { code: "CRIG", label: "Rigori", dept: "CPZ" },
    ],
  },
];

/**
 * Returns the primary department for a given player role (unlocked at 1 token).
 */
export function getPrimaryDepartmentForRole(posiz: string): ScoutingDeptKey {
  if (posiz === "POR") return "POR";
  if (["DC", "TD", "TS"].includes(posiz)) return "DIF";
  if (["CDC", "CC", "ED", "ES", "COC"].includes(posiz)) return "PAS";
  return "ATT";
}

/**
 * Returns the secondary technical department for a given player role (unlocked at 3 tokens).
 */
export function getSecondaryDepartmentsForRole(posiz: string): ScoutingDeptKey[] {
  if (posiz === "POR") return ["PAS", "DIF"];
  if (["DC", "TD", "TS"].includes(posiz)) return ["PAS", "ATT"];
  if (["CDC", "CC", "ED", "ES", "COC"].includes(posiz)) return ["DIF", "ATT"];
  return ["PAS", "DIF"];
}

/**
 * Minimum tokens required to unlock a specific department for a player of role `posiz`.
 */
export function getRequiredTokensForDepartment(
  dept: ScoutingDeptKey,
  posiz: string
): 1 | 2 | 3 | 5 {
  const primary = getPrimaryDepartmentForRole(posiz);
  if (dept === primary) return 1;
  if (dept === "FIS" || dept === "CPZ") return 2;
  const secondary = getSecondaryDepartmentsForRole(posiz);
  if (secondary.includes(dept)) return 3;
  return 5;
}

export function isDepartmentUnlocked(
  dept: ScoutingDeptKey,
  posiz: string,
  tokensSpent: number
): boolean {
  if (tokensSpent >= 5) return true;
  const req = getRequiredTokensForDepartment(dept, posiz);
  return tokensSpent >= req;
}

/**
 * Checks if extra profile fields are unlocked:
 * - PiedeDebole, MABI, Role1, Role2 -> 1 token
 * - Trait1, Trait2 -> 2 tokens
 * - IconTrait1, IconTrait2 -> 3 tokens
 * - Exact OVR -> 5 tokens (at 3 tokens an approximate range is shown)
 */
export function getRequiredTokensForField(
  field:
    | "PiedeDebole"
    | "MABI"
    | "Role1"
    | "Role2"
    | "Trait1"
    | "Trait2"
    | "IconTrait1"
    | "IconTrait2"
    | "OVR"
): 1 | 2 | 3 | 5 {
  switch (field) {
    case "PiedeDebole":
    case "MABI":
    case "Role1":
    case "Role2":
      return 1;
    case "Trait1":
    case "Trait2":
      return 2;
    case "IconTrait1":
    case "IconTrait2":
      return 3;
    case "OVR":
      return 5;
  }
}

export function getOvrDisplayByTokens(
  ovr: number | null | undefined,
  tokensSpent: number
): { label: string; isExact: boolean; isRange: boolean } {
  const val = Number(ovr) || 70;
  if (tokensSpent >= 5) {
    return { label: `${val}`, isExact: true, isRange: false };
  }
  if (tokensSpent >= 3) {
    return { label: `${val - 2}–${val + 2}`, isExact: false, isRange: true };
  }
  return { label: "??", isExact: false, isRange: false };
}

export function getTierBadgeStyle(tokensSpent: number): string {
  if (tokensSpent >= 5)
    return "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40";
  if (tokensSpent === 3)
    return "bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/40";
  if (tokensSpent === 2)
    return "bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/40";
  if (tokensSpent === 1)
    return "bg-sky-500/20 text-sky-600 dark:text-sky-400 border-sky-500/40";
  return "bg-muted text-muted-foreground border-border";
}

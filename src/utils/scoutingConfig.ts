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
      title: "Fascia 1 • Stima Abilità (Range 10)",
      description:
        "Sblocca la stima di tutte le abilità tecniche e fisiche con decadi fisse (es. 70-79).",
      badgeClass:
        "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30",
    },
    {
      tokens: 2,
      label: "2 Gettoni",
      shortLabel: "2G",
      title: "Fascia 2 • Precisione Abilità (Range 3), Emotion & Conteggio Tratti",
      description:
        "Affina le abilità a range di 3 (es. 70-72, 73-75, 76-79), svela l'attitudine emotiva (Emotion) e il conteggio dei tratti posseduti.",
      badgeClass:
        "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
    },
    {
      tokens: 3,
      label: "3 Gettoni",
      shortLabel: "3G",
      title: "Fascia 3 • Tratti Esatti, Ruolo Tattico (Role 1), Piede Debole & Mosse Abilità",
      description:
        "Svela i nomi di tutti i tratti (base e icona), la specializzazione tattica Role 1 e il valore esatto di Piede Debole e Mosse Abilità.",
      badgeClass:
        "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30",
    },
    {
      tokens: 5,
      label: "5 Gettoni",
      shortLabel: "5G",
      title: "Fascia 4 • Scouting Completo & Overall per Ruolo",
      description:
        "Sblocca l'Overall numerico esatto e l'Overall ricalcolato per ciascun ruolo in campo in base ai pesi del simulatore.",
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
        { code: "PREP", label: "Presa Portiere", dept: "POR" },
        { code: "POSP", label: "Posizionamento Portiere", dept: "POR" },
        { code: "RINP", label: "Rinvio Portiere", dept: "POR" },
        { code: "RIFP", label: "Riflessi Portiere", dept: "POR" },
        { code: "TUFP", label: "Tuffo Portiere", dept: "POR" },
      ],
    },
    {
      key: "CPZ",
      title: "Calci Piazzati",
      colorClass: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
      stats: [
        { code: "PNIZ", label: "Punizioni", dept: "CPZ" },
        { code: "CRIG", label: "Rigori", dept: "CPZ" },
        { code: "FRED", label: "Freddezza", dept: "CPZ" },
      ],
    },
  ];

/**
 * Range di 10 (Opzione A - Decadi fisse):
 * 74 -> 70-79, 63 -> 60-69, 85 -> 80-89
 */
export function getStatRange10(value: number | null | undefined): string {
  const val = Math.max(0, Math.min(99, Number(value) || 0));
  const decade = Math.floor(val / 10) * 10;
  return `${decade}-${Math.min(99, decade + 9)}`;
}

/**
 * Range di 3:
 * Ogni decina divisa in 3 blocchi:
 * - 0..2 -> X0 - X2 (es. 70-72)
 * - 3..5 -> X3 - X5 (es. 73-75)
 * - 6..9 -> X6 - X9 (es. 76-79)
 */
export function getStatRange3(value: number | null | undefined): string {
  const val = Math.max(0, Math.min(99, Number(value) || 0));
  const decade = Math.floor(val / 10) * 10;
  const unit = val % 10;
  if (unit <= 2) {
    return `${decade}-${decade + 2}`;
  } else if (unit <= 5) {
    return `${decade + 3}-${decade + 5}`;
  } else {
    return `${decade + 6}-${Math.min(99, decade + 9)}`;
  }
}

export interface StatDisplayResult {
  label: string;
  isUnlocked: boolean;
  midpoint: number;
  rangeType: "none" | "10" | "3";
}

/**
 * Returns formatted stat display label and midpoint based on spent tokens.
 * - 0 Gettoni: Locked (??)
 * - 1 Gettone: Range di 10 (es. 70-79)
 * - 2, 3, 5 Gettoni: Range di 3 (es. 73-75)
 */
export function getStatDisplayByTokens(
  value: number | null | undefined,
  tokensSpent: number
): StatDisplayResult {
  const num = Math.max(0, Math.min(99, Number(value) || 0));
  if (tokensSpent < 1) {
    return { label: "??", isUnlocked: false, midpoint: 0, rangeType: "none" };
  }
  if (tokensSpent === 1) {
    const decade = Math.floor(num / 10) * 10;
    return {
      label: getStatRange10(num),
      isUnlocked: true,
      midpoint: decade + 4.5,
      rangeType: "10",
    };
  }
  // tokensSpent >= 2 (2, 3, 5 Gettoni)
  const decade = Math.floor(num / 10) * 10;
  const unit = num % 10;
  let mid = decade + 1;
  if (unit <= 2) mid = decade + 1;
  else if (unit <= 5) mid = decade + 4;
  else mid = decade + 7.5;

  return {
    label: getStatRange3(num),
    isUnlocked: true,
    midpoint: mid,
    rangeType: "3",
  };
}

/**
 * Checks overall display:
 * - 0, 1, 2, 3 gettoni: Sistema a stelle (es. 3★)
 * - 5 gettoni: Valore Esatto (es. 71)
 */
export function getOvrDisplayByTokens(
  ovr: number | null | undefined,
  tokensSpent: number,
  stars?: number | null | undefined
): { label: string; isExact: boolean; isRange: boolean; stars: number } {
  const exactVal = Number(ovr) || 70;
  const starVal = Number(stars) || 3;
  if (tokensSpent >= 5) {
    return { label: `${exactVal}`, isExact: true, isRange: false, stars: starVal };
  }
  return { label: `${starVal}★`, isExact: false, isRange: false, stars: starVal };
}

/**
 * Splits comma-separated traits and returns an array of unique trimmed traits.
 */
export function parseTraitString(val?: string | null): string[] {
  if (!val || val.trim() === "" || val === "Nessuno" || val === "-") return [];
  return val
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && s !== "Nessuno" && s !== "-");
}

/**
 * Aggregates all standard traits (PlayStyles) from Trait1 and Trait2 (or legacy Tratti).
 */
export function getStandardTraits(player: {
  Trait1?: string | null;
  Trait2?: string | null;
  Tratti?: string | null;
}): string[] {
  const t1 = parseTraitString(player.Trait1);
  const t2 = parseTraitString(player.Trait2);
  const combined = [...t1, ...t2];
  if (combined.length > 0) return Array.from(new Set(combined));
  return Array.from(new Set(parseTraitString(player.Tratti)));
}

/**
 * Aggregates all icon traits (PlayStyles+) from IconTrait1 and IconTrait2.
 */
export function getIconTraits(player: {
  IconTrait1?: string | null;
  IconTrait2?: string | null;
}): string[] {
  const i1 = parseTraitString(player.IconTrait1);
  const i2 = parseTraitString(player.IconTrait2);
  return Array.from(new Set([...i1, ...i2]));
}

/**
 * Counts individual unique traits on a rookie.
 * Checks decoded standard & icon traits (tokens >= 3 or full data).
 * If individual traits are hidden (tokens < 3), falls back to rookie.TraitsCount from backend.
 */
export function getRookieTraitsCount(rookie: {
  Trait1?: string | null;
  Trait2?: string | null;
  IconTrait1?: string | null;
  IconTrait2?: string | null;
  Tratti?: string | null;
  TraitsCount?: number | null;
}): number {
  const std = getStandardTraits(rookie);
  const icon = getIconTraits(rookie);
  const calculated = std.length + icon.length;
  if (calculated > 0) return calculated;
  if (rookie.TraitsCount != null) {
    return Number(rookie.TraitsCount) || 0;
  }
  return 0;
}

/**
 * Unlocking rules for profile fields
 */
export function isWeakFootUnlocked(tokensSpent: number): boolean {
  return tokensSpent >= 3;
}

export function isSkillMovesUnlocked(tokensSpent: number): boolean {
  return tokensSpent >= 3;
}

export function isRole1Unlocked(tokensSpent: number): boolean {
  return tokensSpent >= 3;
}

export function isEmotionUnlocked(tokensSpent: number): boolean {
  return tokensSpent >= 2;
}

export function isExactOvrUnlocked(tokensSpent: number): boolean {
  return tokensSpent >= 5;
}

export function isOvrPerRoleUnlocked(tokensSpent: number): boolean {
  return tokensSpent >= 5;
}

export function getTraitVisibility(tokensSpent: number): "none" | "count" | "exact" {
  if (tokensSpent >= 3) return "exact";
  if (tokensSpent >= 2) return "count";
  return "none";
}

export function getRequiredTokensForField(
  field:
    | "PiedeDebole"
    | "MABI"
    | "Role1"
    | "Role2"
    | "Emotion"
    | "TraitsCount"
    | "Trait1"
    | "Trait2"
    | "IconTrait1"
    | "IconTrait2"
    | "OVR"
    | "OvrPerRole"
): 1 | 2 | 3 | 5 {
  switch (field) {
    case "Emotion":
    case "TraitsCount":
      return 2;
    case "PiedeDebole":
    case "MABI":
    case "Role1":
    case "Role2":
    case "Trait1":
    case "Trait2":
    case "IconTrait1":
    case "IconTrait2":
      return 3;
    case "OVR":
    case "OvrPerRole":
      return 5;
  }
}

/**
 * All departments unlock simultaneously at 1G (showing range of 10)
 * and refine at 2G+ (showing range of 3).
 */
export function isDepartmentUnlocked(
  _dept: ScoutingDeptKey,
  _posiz: string,
  tokensSpent: number
): boolean {
  return tokensSpent >= 1;
}

export function getRequiredTokensForDepartment(
  _dept: ScoutingDeptKey,
  _posiz: string
): 1 | 2 | 3 | 5 {
  return 1;
}

export function getPrimaryDepartmentForRole(posiz: string): ScoutingDeptKey {
  if (posiz === "POR") return "POR";
  if (["DC", "TD", "TS"].includes(posiz)) return "DIF";
  if (["CDC", "CC", "ED", "ES", "COC"].includes(posiz)) return "PAS";
  return "ATT";
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

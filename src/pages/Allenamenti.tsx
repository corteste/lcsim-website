import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useMemo, useState } from "react";
import { Player } from "@/types/player";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Plus, Minus, TrendingUp, Award, Save, RotateCcw, 
  CheckCircle2, Clock, Sparkles, Shield, Zap, Flame, 
  Dumbbell, Target, Activity, Swords, ArrowRight, Search, 
  ChevronRight, AlertCircle, RefreshCw, Star
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import TraitSystem from "@/components/training/TraitSystem";
import RoleSystem from "@/components/training/RoleSystem";
import { useAuth } from "@/context/AuthContext";
import AdminTeamSelector from "@/components/AdminTeamSelector";
import RequireAuthPrompt from "@/components/RequireAuthPrompt";
import { supabase } from "@/supabaseClient";
import { PLAYER_TABLE, PLAYER_TABLE_TRAINING } from "@/constants/App";
import { useQueryClient } from "@tanstack/react-query";
import { getRoleColor, getValueColor, getPlayerImage, getNationalityFlag } from "@/utils/functions";

/* NOMI DELLE SINGOLE STATISTICHE */
export type StatKey =
  | "PREP"  | "POSP"  | "RINP"  | "RIFP"  | "TUFP"  | "CONT"  | "SCIV"  | "MARC"  | "AGGR"  | "INTR"  | "PASC"  | "PASL"  | "CRSS"  | "CTRP"
  | "VISI"  | "EFFT"  | "PTIR"  | "TIRD"  | "TIRV"  | "DRBL"  | "PIAZ"  | "FINA"  | "ACCL"  | "VELO"  | "AGIL"  | "RESI"  | "EQLB"  | "FRZA"
  | "TSTA"  | "RIFL"  | "ELEV"  | "PNIZ"  | "CRIG"  | "FRED";

export const statMeta: Record<StatKey, { label: string; short: string }> = {
  PREP: { label: "Presa", short: "PREP" },
  POSP: { label: "Posizionamento", short: "POSP" },
  RINP: { label: "Rinvio", short: "RINP" },
  RIFP: { label: "Riflessi", short: "RIFP" },
  TUFP: { label: "Tuffo", short: "TUFP" },
  CONT: { label: "Contrasto", short: "CONT" },
  SCIV: { label: "Scivolata", short: "SCIV" },
  MARC: { label: "Marcatura", short: "MARC" },
  AGGR: { label: "Aggressività", short: "AGGR" },
  INTR: { label: "Intercettazione", short: "INTR" },
  PASC: { label: "Passaggio Corto", short: "PASC" },
  PASL: { label: "Passaggio Lungo", short: "PASL" },
  CRSS: { label: "Cross", short: "CRSS" },
  CTRP: { label: "Controllo Palla", short: "CTRP" },
  VISI: { label: "Visione di Gioco", short: "VISI" },
  EFFT: { label: "Effetto", short: "EFFT" },
  PTIR: { label: "Potenza Tiro", short: "PTIR" },
  TIRD: { label: "Tiri da Fuori", short: "TIRD" },
  TIRV: { label: "Tiri al Volo", short: "TIRV" },
  DRBL: { label: "Dribbling", short: "DRBL" },
  PIAZ: { label: "Piazzamento", short: "PIAZ" },
  FINA: { label: "Finalizzazione", short: "FINA" },
  ACCL: { label: "Accelerazione", short: "ACCL" },
  VELO: { label: "Velocità Scatto", short: "VELO" },
  AGIL: { label: "Agilità", short: "AGIL" },
  RESI: { label: "Resistenza", short: "RESI" },
  EQLB: { label: "Equilibrio", short: "EQLB" },
  FRZA: { label: "Forza Fisica", short: "FRZA" },
  TSTA: { label: "Colpi di Testa", short: "TSTA" },
  RIFL: { label: "Reattività", short: "RIFL" },
  ELEV: { label: "Elevazione", short: "ELEV" },
  PNIZ: { label: "Calci di Punizione", short: "PNIZ" },
  CRIG: { label: "Rigori", short: "CRIG" },
  FRED: { label: "Freddezza", short: "FRED" },
};

export interface GroupRowDef {
  key: string;
  label: string;
  category: "POR" | "DIF" | "CEN" | "ATT" | "FIS" | "CALC";
  subs: StatKey[];
  icon: typeof Shield;
  colorClass: string;
  bgClass: string;
}

export const groupRows: GroupRowDef[] = [
  { key: "PORT", label: "POR Tecnico", category: "POR", subs: ["PREP", "POSP", "RINP"], icon: Shield, colorClass: "text-amber-500", bgClass: "bg-amber-500/10 border-amber-500/20" },
  { key: "PORF", label: "POR Fisico", category: "POR", subs: ["RIFP", "TUFP"], icon: Activity, colorClass: "text-orange-500", bgClass: "bg-orange-500/10 border-orange-500/20" },
  { key: "DIFF", label: "DIF Fisico", category: "DIF", subs: ["CONT", "SCIV"], icon: Shield, colorClass: "text-blue-500", bgClass: "bg-blue-500/10 border-blue-500/20" },
  { key: "DIFM", label: "DIF Mentale", category: "DIF", subs: ["MARC", "AGGR", "INTR"], icon: Target, colorClass: "text-cyan-500", bgClass: "bg-cyan-500/10 border-cyan-500/20" },
  { key: "CENP", label: "CEN Passaggi", category: "CEN", subs: ["PASC", "PASL", "CRSS"], icon: Zap, colorClass: "text-emerald-500", bgClass: "bg-emerald-500/10 border-emerald-500/20" },
  { key: "CENG", label: "CEN Gestione", category: "CEN", subs: ["CTRP", "VISI", "EFFT"], icon: Sparkles, colorClass: "text-teal-500", bgClass: "bg-teal-500/10 border-teal-500/20" },
  { key: "ATTT", label: "ATT Tiri", category: "ATT", subs: ["PTIR", "TIRD", "TIRV"], icon: Flame, colorClass: "text-rose-500", bgClass: "bg-rose-500/10 border-rose-500/20" },
  { key: "ATTC", label: "ATT Controllo", category: "ATT", subs: ["DRBL", "PIAZ", "FINA"], icon: Dumbbell, colorClass: "text-pink-500", bgClass: "bg-pink-500/10 border-pink-500/20" },
  { key: "FISV", label: "FIS Velocità", category: "FIS", subs: ["ACCL", "VELO", "AGIL"], icon: Zap, colorClass: "text-yellow-500", bgClass: "bg-yellow-500/10 border-yellow-500/20" },
  { key: "FISP", label: "FIS Potenza", category: "FIS", subs: ["RESI", "EQLB", "FRZA"], icon: Dumbbell, colorClass: "text-purple-500", bgClass: "bg-purple-500/10 border-purple-500/20" },
  { key: "FISR", label: "FIS Prontezza", category: "FIS", subs: ["TSTA", "RIFL", "ELEV"], icon: Activity, colorClass: "text-indigo-500", bgClass: "bg-indigo-500/10 border-indigo-500/20" },
  { key: "CALC", label: "Calci Piazzati", category: "CALC", subs: ["PNIZ", "CRIG", "FRED"], icon: Swords, colorClass: "text-sky-500", bgClass: "bg-sky-500/10 border-sky-500/20" },
];

/**
 * Calcola il costo base XP in base al valore di riferimento del gruppo (media o max).
 * Regole utente:
 * media >90 --> 50xp
 * media >80 --> 30xp
 * media >70 --> 15xp
 * media >60 --> 8xp
 * media >50 --> 5xp
 * media >30 --> 3xp
 * media <=30 --> 1xp
 */
export function getBaseXpCost(value: number): number {
  if (value > 90) return 50;
  if (value > 80) return 30;
  if (value > 70) return 15;
  if (value > 60) return 8;
  if (value > 50) return 5;
  if (value > 30) return 3;
  return 1;
}

/**
 * Calcola il valore di riferimento per il gruppo ad un dato livello di incremento.
 * - Per i Calci Piazzati (CALC), il valore si basa sul massimo tra PNIZ, CRIG e FRED.
 * - Per le altre categorie, si calcola la media aritmetica dei sotto-attributi.
 * Ogni attributo è limitato al cap di 99.
 */
export function getGroupReferenceValue(
  group: GroupRowDef,
  baseStats: Record<StatKey, number>,
  levelOffset: number = 0
): number {
  if (group.key === "CALC") {
    const pniz = Math.min(99, (baseStats.PNIZ ?? 0) + levelOffset);
    const crig = Math.min(99, (baseStats.CRIG ?? 0) + levelOffset);
    const fred = Math.min(99, (baseStats.FRED ?? 0) + levelOffset);
    return Math.max(pniz, crig, fred);
  }
  const sum = group.subs.reduce((acc, subKey) => {
    return acc + Math.min(99, (baseStats[subKey] ?? 0) + levelOffset);
  }, 0);
  return group.subs.length > 0 ? sum / group.subs.length : 0;
}

/**
 * Calcola il costo del singolo tick (livello successivo) per un gruppo.
 * - Se la categoria è 'POR' (Portiere), il costo è raddoppiato (x2).
 */
export function getSingleTickCost(
  group: GroupRowDef,
  baseStats: Record<StatKey, number>,
  currentLevel: number
): number {
  const refVal = getGroupReferenceValue(group, baseStats, currentLevel);
  const baseCost = getBaseXpCost(refVal);
  const isGoalkeeper = group.category === "POR";
  return baseCost * (isGoalkeeper ? 2 : 1);
}

/**
 * Calcola il costo totale XP per portare un gruppo da 0 a totalLevels livelli.
 * Ogni singolo tick viene valutato dinamicamente con la media/max aggiornata.
 */
export function calculateGroupCost(
  group: GroupRowDef,
  baseStats: Record<StatKey, number>,
  totalLevels: number
): number {
  let cost = 0;
  for (let lvl = 0; lvl < totalLevels; lvl++) {
    cost += getSingleTickCost(group, baseStats, lvl);
  }
  return cost;
}

const emptyIncreases = (): Record<string, number> =>
  groupRows.reduce((acc, r) => {
    acc[r.key] = 0;
    return acc;
  }, {} as Record<string, number>);

const emptyStats = (): Record<StatKey, number> =>
  (Object.keys(statMeta) as StatKey[]).reduce((acc, k) => {
    acc[k] = 0;
    return acc;
  }, {} as Record<StatKey, number>);

export const mapPlayerToStats = (p: Player | undefined | null): Record<StatKey, number> => {
  const out = emptyStats();
  if (!p) return out;

  const sources: any[] = [];
  if ((p as any).stats && typeof (p as any).stats === "object") sources.push((p as any).stats);
  if ((p as any).Attributi) {
    try {
      const parsed = typeof (p as any).Attributi === "string" ? JSON.parse((p as any).Attributi) : (p as any).Attributi;
      if (parsed && typeof parsed === "object") sources.push(parsed);
    } catch { /* ignore */ }
  }
  sources.push(p);

  for (const k of Object.keys(statMeta) as StatKey[]) {
    let v: any = undefined;
    for (const src of sources) {
      if (!src) continue;
      if (src[k] !== undefined && src[k] !== null) { v = src[k]; break; }
      if (src[k.toLowerCase()] !== undefined && src[k.toLowerCase()] !== null) { v = src[k.toLowerCase()]; break; }
    }
    out[k] = Number.isFinite(Number(v)) ? Number(v) : 0;
  }

  return out;
};

// Pesi per la media ponderata basata sul ruolo
export const roleWeights: Record<string, Record<StatKey, number>> = {
  'POR': {
    PREP: 21, POSP: 21, RINP: 5, RIFP: 21, TUFP: 21,
    CONT: 0, SCIV: 0, MARC: 0, AGGR: 0, INTR: 0,
    PASC: 0, PASL: 0, CRSS: 0, CTRP: 0, VISI: 0, EFFT: 0,
    PTIR: 0, TIRD: 0, TIRV: 0, DRBL: 0, PIAZ: 0, FINA: 0,
    ACCL: 0, VELO: 0, AGIL: 0, RESI: 0, EQLB: 0, FRZA: 0,
    TSTA: 0, RIFL: 11, ELEV: 0, PNIZ: 0, CRIG: 0, FRED: 0,
  },
  'DC': {
    PREP: 0, POSP: 0, RINP: 0, RIFP: 0, TUFP: 0,
    CONT: 17, SCIV: 10, MARC: 14, AGGR: 7, INTR: 13,
    PASC: 5, PASL: 0, CRSS: 0, CTRP: 4, VISI: 0, EFFT: 0,
    PTIR: 0, TIRD: 0, TIRV: 0, DRBL: 0, PIAZ: 0, FINA: 0,
    ACCL: 0, VELO: 2, AGIL: 0, RESI: 0, EQLB: 0, FRZA: 10,
    TSTA: 10, RIFL: 5, ELEV: 3, PNIZ: 0, CRIG: 0, FRED: 0,
  },
  'DFC': {
    PREP: 0, POSP: 0, RINP: 0, RIFP: 0, TUFP: 0,
    CONT: 17, SCIV: 10, MARC: 14, AGGR: 7, INTR: 13,
    PASC: 5, PASL: 0, CRSS: 0, CTRP: 4, VISI: 0, EFFT: 0,
    PTIR: 0, TIRD: 0, TIRV: 0, DRBL: 0, PIAZ: 0, FINA: 0,
    ACCL: 0, VELO: 2, AGIL: 0, RESI: 0, EQLB: 0, FRZA: 10,
    TSTA: 10, RIFL: 5, ELEV: 3, PNIZ: 0, CRIG: 0, FRED: 0,
  },
  'TS': {
    PREP: 0, POSP: 0, RINP: 0, RIFP: 0, TUFP: 0,
    CONT: 11, SCIV: 14, MARC: 8, AGGR: 0, INTR: 12,
    PASC: 7, PASL: 0, CRSS: 9, CTRP: 7, VISI: 0, EFFT: 0,
    PTIR: 0, TIRD: 0, TIRV: 0, DRBL: 0, PIAZ: 0, FINA: 0,
    ACCL: 5, VELO: 7, AGIL: 0, RESI: 8, EQLB: 0, FRZA: 0,
    TSTA: 4, RIFL: 8, ELEV: 0, PNIZ: 0, CRIG: 0, FRED: 0,
  },
  'TD': {
    PREP: 0, POSP: 0, RINP: 0, RIFP: 0, TUFP: 0,
    CONT: 11, SCIV: 14, MARC: 8, AGGR: 0, INTR: 12,
    PASC: 7, PASL: 0, CRSS: 9, CTRP: 7, VISI: 0, EFFT: 0,
    PTIR: 0, TIRD: 0, TIRV: 0, DRBL: 0, PIAZ: 0, FINA: 0,
    ACCL: 5, VELO: 7, AGIL: 0, RESI: 8, EQLB: 0, FRZA: 0,
    TSTA: 4, RIFL: 8, ELEV: 0, PNIZ: 0, CRIG: 0, FRED: 0,
  },
  'TER': {
    PREP: 0, POSP: 0, RINP: 0, RIFP: 0, TUFP: 0,
    CONT: 11, SCIV: 14, MARC: 8, AGGR: 0, INTR: 12,
    PASC: 7, PASL: 0, CRSS: 9, CTRP: 7, VISI: 0, EFFT: 0,
    PTIR: 0, TIRD: 0, TIRV: 0, DRBL: 0, PIAZ: 0, FINA: 0,
    ACCL: 5, VELO: 7, AGIL: 0, RESI: 8, EQLB: 0, FRZA: 0,
    TSTA: 4, RIFL: 8, ELEV: 0, PNIZ: 0, CRIG: 0, FRED: 0,
  },
  'CDC': {
    PREP: 0, POSP: 0, RINP: 0, RIFP: 0, TUFP: 0,
    CONT: 12, SCIV: 9, MARC: 9, AGGR: 5, INTR: 14,
    PASC: 10, PASL: 10, CRSS: 0, CTRP: 7, VISI: 4, EFFT: 0,
    PTIR: 0, TIRD: 0, TIRV: 0, DRBL: 0, PIAZ: 0, FINA: 0,
    ACCL: 0, VELO: 0, AGIL: 0, RESI: 6, EQLB: 0, FRZA: 4,
    TSTA: 0, RIFL: 10, ELEV: 0, PNIZ: 0, CRIG: 0, FRED: 0,
  },
  'CC': {
    PREP: 0, POSP: 0, RINP: 0, RIFP: 0, TUFP: 0,
    CONT: 0, SCIV: 0, MARC: 0, AGGR: 0, INTR: 5,
    PASC: 15, PASL: 13, CRSS: 0, CTRP: 14, VISI: 13, EFFT: 0,
    PTIR: 0, TIRD: 4, TIRV: 0, DRBL: 7, PIAZ: 6, FINA: 2,
    ACCL: 0, VELO: 0, AGIL: 0, RESI: 6, EQLB: 0, FRZA: 0,
    TSTA: 0, RIFL: 5, ELEV: 0, PNIZ: 0, CRIG: 0, FRED: 0,
  },
  'CEN': {
    PREP: 0, POSP: 0, RINP: 0, RIFP: 0, TUFP: 0,
    CONT: 0, SCIV: 0, MARC: 0, AGGR: 0, INTR: 5,
    PASC: 15, PASL: 13, CRSS: 0, CTRP: 14, VISI: 13, EFFT: 0,
    PTIR: 0, TIRD: 4, TIRV: 0, DRBL: 7, PIAZ: 6, FINA: 2,
    ACCL: 0, VELO: 0, AGIL: 0, RESI: 6, EQLB: 0, FRZA: 0,
    TSTA: 0, RIFL: 5, ELEV: 0, PNIZ: 0, CRIG: 0, FRED: 0,
  },
  'COC': {
    PREP: 0, POSP: 0, RINP: 0, RIFP: 0, TUFP: 0,
    CONT: 0, SCIV: 0, MARC: 0, AGGR: 0, INTR: 0,
    PASC: 16, PASL: 4, CRSS: 0, CTRP: 15, VISI: 14, EFFT: 0,
    PTIR: 0, TIRD: 4, TIRV: 0, DRBL: 13, PIAZ: 9, FINA: 7,
    ACCL: 4, VELO: 3, AGIL: 3, RESI: 0, EQLB: 0, FRZA: 0,
    TSTA: 0, RIFL: 3, ELEV: 0, PNIZ: 0, CRIG: 0, FRED: 0,
  },
  'ED': {
    PREP: 0, POSP: 0, RINP: 0, RIFP: 0, TUFP: 0,
    CONT: 0, SCIV: 0, MARC: 0, AGGR: 0, INTR: 0,
    PASC: 9, PASL: 0, CRSS: 12, CTRP: 12, VISI: 7, EFFT: 0,
    PTIR: 0, TIRD: 0, TIRV: 0, DRBL: 15, PIAZ: 8, FINA: 6,
    ACCL: 7, VELO: 6, AGIL: 3, RESI: 5, EQLB: 0, FRZA: 0,
    TSTA: 0, RIFL: 7, ELEV: 0, PNIZ: 0, CRIG: 0, FRED: 0,
  },
  'ES': {
    PREP: 0, POSP: 0, RINP: 0, RIFP: 0, TUFP: 0,
    CONT: 0, SCIV: 0, MARC: 0, AGGR: 0, INTR: 0,
    PASC: 9, PASL: 0, CRSS: 12, CTRP: 12, VISI: 7, EFFT: 0,
    PTIR: 0, TIRD: 0, TIRV: 0, DRBL: 15, PIAZ: 8, FINA: 6,
    ACCL: 7, VELO: 6, AGIL: 3, RESI: 5, EQLB: 0, FRZA: 0,
    TSTA: 0, RIFL: 7, ELEV: 0, PNIZ: 0, CRIG: 0, FRED: 0,
  },
  'AD': {
    PREP: 0, POSP: 0, RINP: 0, RIFP: 0, TUFP: 0,
    CONT: 0, SCIV: 0, MARC: 0, AGGR: 0, INTR: 0,
    PASC: 9, PASL: 0, CRSS: 9, CTRP: 14, VISI: 4, EFFT: 0,
    PTIR: 0, TIRD: 0, TIRV: 0, DRBL: 16, PIAZ: 9, FINA: 10,
    ACCL: 7, VELO: 6, AGIL: 3, RESI: 0, EQLB: 0, FRZA: 0,
    TSTA: 0, RIFL: 7, ELEV: 0, PNIZ: 0, CRIG: 0, FRED: 0,
  },
  'AS': {
    PREP: 0, POSP: 0, RINP: 0, RIFP: 0, TUFP: 0,
    CONT: 0, SCIV: 0, MARC: 0, AGGR: 0, INTR: 0,
    PASC: 9, PASL: 0, CRSS: 9, CTRP: 14, VISI: 4, EFFT: 0,
    PTIR: 0, TIRD: 0, TIRV: 0, DRBL: 16, PIAZ: 9, FINA: 10,
    ACCL: 7, VELO: 6, AGIL: 3, RESI: 0, EQLB: 0, FRZA: 0,
    TSTA: 0, RIFL: 7, ELEV: 0, PNIZ: 0, CRIG: 0, FRED: 0,
  },
  'AT': {
    PREP: 0, POSP: 0, RINP: 0, RIFP: 0, TUFP: 0,
    CONT: 0, SCIV: 0, MARC: 0, AGGR: 0, INTR: 0,
    PASC: 9, PASL: 0, CRSS: 0, CTRP: 15, VISI: 8, EFFT: 0,
    PTIR: 0, TIRD: 4, TIRV: 0, DRBL: 14, PIAZ: 13, FINA: 18,
    ACCL: 5, VELO: 4, AGIL: 0, RESI: 0, EQLB: 0, FRZA: 0,
    TSTA: 2, RIFL: 5, ELEV: 0, PNIZ: 0, CRIG: 0, FRED: 0,
  },
  'ATT': {
    PREP: 0, POSP: 0, RINP: 0, RIFP: 0, TUFP: 0,
    CONT: 0, SCIV: 0, MARC: 0, AGGR: 0, INTR: 0,
    PASC: 5, PASL: 0, CRSS: 0, CTRP: 10, VISI: 0, EFFT: 0,
    PTIR: 0, TIRD: 0, TIRV: 0, DRBL: 7, PIAZ: 13, FINA: 18,
    ACCL: 4, VELO: 5, AGIL: 0, RESI: 0, EQLB: 0, FRZA: 5,
    TSTA: 10, RIFL: 8, ELEV: 0, PNIZ: 0, CRIG: 0, FRED: 0,
  },
};

export const calcOverall = (
  role: string | undefined | null,
  stats: Record<StatKey, number>,
  fallbackOvr: number = 70
): number => {
  if (!role) return fallbackOvr;
  const weights = roleWeights[role.toUpperCase()];
  if (!weights) return fallbackOvr;

  let totalWeight = 0;
  let weightedSum = 0;

  for (const [key, weight] of Object.entries(weights) as [StatKey, number][]) {
    if (weight > 0) {
      totalWeight += weight;
      weightedSum += (stats[key] ?? 0) * weight;
    }
  }

  if (totalWeight === 0) return fallbackOvr;
  return Math.round(weightedSum / totalWeight);
};

interface TrainingRecord {
  id?: string;
  PlayerID: number;
  Squadra: string;
  status: "draft" | "confirmed";
  increases: Record<string, number>;
  xp_cost: number;
  pre_ovr: number;
  post_ovr: number;
  base_snapshot?: Record<string, any>;
  updated_at: string;
  confirmed_at?: string | null;
}

const normalizeIncreases = (inc: any): Record<string, number> => {
  const base = emptyIncreases();
  if (!inc || typeof inc !== "object") return base;
  for (const k of Object.keys(base)) {
    if (typeof inc[k] === "number") base[k] = Math.max(0, inc[k]);
  }
  return base;
};

const hasAnyIncrease = (inc: Record<string, number>): boolean => {
  return Object.values(inc).some((v) => v > 0);
};

const areIncreasesEqual = (a: Record<string, number>, b: Record<string, number>): boolean => {
  const normA = normalizeIncreases(a);
  const normB = normalizeIncreases(b);
  for (const k of Object.keys(normA)) {
    if ((normA[k] || 0) !== (normB[k] || 0)) return false;
  }
  return true;
};

const Allenamenti = () => {
  const { user, effectiveTeam, effectiveTeamFullName } = useAuth();
  const currentTeam = effectiveTeam;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [players, setPlayers] = useState<Player[]>([]);
  const [trainingMap, setTrainingMap] = useState<Record<number, TrainingRecord>>({});
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Filtro ruolo & ricerca per la rosa
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Stato aumenti per il giocatore attualmente selezionato
  const [increases, setIncreases] = useState<Record<string, number>>(emptyIncreases);

  // Stati operativi UI
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Caricamento giocatori e allenamenti salvati da Supabase
  useEffect(() => {
    async function fetchTeamTrainingData() {
      if (!currentTeam) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const [playersRes, trainingRes] = await Promise.all([
          supabase
            .from(PLAYER_TABLE)
            .select("*")
            .eq("Squadra", currentTeam)
            .order("OVR", { ascending: false }),
          supabase
            .from(PLAYER_TABLE_TRAINING)
            .select("*")
            .eq("Squadra", currentTeam),
        ]);

        if (playersRes.error) throw playersRes.error;
        if (trainingRes.error) throw trainingRes.error;

        const basePlayers = (playersRes.data || []) as Player[];
        const records = (trainingRes.data || []) as TrainingRecord[];

        const tMap: Record<number, TrainingRecord> = {};
        for (const r of records) {
          tMap[Number(r.PlayerID)] = r;
        }

        setPlayers(basePlayers);
        setTrainingMap(tMap);

        // Seleziona il primo giocatore o mantiene il selezionato se appartiene alla nuova squadra
        const currentStillExists = basePlayers.some((p) => Number(p.ID) === selectedId);
        if (basePlayers.length > 0 && (!currentStillExists || selectedId === null)) {
          const firstId = Number(basePlayers[0].ID);
          setSelectedId(firstId);
          const rec = tMap[firstId];
          if (rec && rec.increases) {
            setIncreases(normalizeIncreases(rec.increases));
          } else {
            setIncreases(emptyIncreases());
          }
        }
      } catch (err) {
        console.error("Error fetching training data:", err);
        toast({
          title: "Errore caricamento",
          description: "Impossibile caricare i dati degli allenamenti.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchTeamTrainingData();
  }, [currentTeam]);

  // Giocatore attualmente selezionato (valori originali da an_player)
  const player = useMemo(() => {
    if (!selectedId) return null;
    return players.find((p) => Number(p.ID) === selectedId) ?? null;
  }, [players, selectedId]);

  const currentTrainingRecord = useMemo(() => {
    if (!selectedId) return null;
    return trainingMap[selectedId] ?? null;
  }, [trainingMap, selectedId]);

  // Quando si cambia giocatore dalla lista, carica i suoi allenamenti correnti
  const handlePlayerChange = (id: number) => {
    setSelectedId(id);
    const rec = trainingMap[id];
    if (rec && rec.increases) {
      setIncreases(normalizeIncreases(rec.increases));
    } else {
      setIncreases(emptyIncreases());
    }
  };

  // Statistiche di base del giocatore prima degli allenamenti
  const preStats = useMemo(() => mapPlayerToStats(player), [player]);

  // Statistiche post-training = preStats + aumenti di ciascun gruppo
  const postStats = useMemo(() => {
    const next = { ...preStats };
    for (const row of groupRows) {
      const inc = increases[row.key] ?? 0;
      if (inc > 0) {
        for (const sub of row.subs) {
          next[sub] = Math.min(99, (next[sub] ?? 0) + inc);
        }
      }
    }
    return next;
  }, [preStats, increases]);

  // Calcolo Overall pre e post
  const preOverall = useMemo(
    () => calcOverall(player?.Posiz, preStats, player?.OVR ?? 70),
    [player?.Posiz, preStats, player?.OVR]
  );

  const postOverall = useMemo(
    () => calcOverall(player?.Posiz, postStats, preOverall),
    [player?.Posiz, postStats, preOverall]
  );

  // Calcolo Costo Totale XP (Dinamico basato su media/max e tick-by-tick)
  const totalCost = useMemo(() => {
    let cost = 0;
    for (const row of groupRows) {
      const inc = increases[row.key] ?? 0;
      if (inc > 0) {
        cost += calculateGroupCost(row, preStats, inc);
      }
    }
    return cost;
  }, [increases, preStats]);

  const xpAvailable = player?.XP ?? 0;
  const xpRemaining = xpAvailable - totalCost;

  // Verifica se ci sono modifiche attive e se differiscono dallo stato salvato
  const hasActiveIncreases = useMemo(() => hasAnyIncrease(increases), [increases]);

  const hasSavedTraining = useMemo(() => {
    if (!currentTrainingRecord) return false;
    return hasAnyIncrease(normalizeIncreases(currentTrainingRecord.increases));
  }, [currentTrainingRecord]);

  const hasUnsavedChanges = useMemo(() => {
    const saved = currentTrainingRecord ? normalizeIncreases(currentTrainingRecord.increases) : emptyIncreases();
    return !areIncreasesEqual(increases, saved);
  }, [increases, currentTrainingRecord]);

  // Gestione incremento/decremento singolo gruppo
  const setIncrease = (key: string, value: number) => {
    const clamped = Math.max(0, Math.min(25, value));
    const currentVal = increases[key] ?? 0;
    if (clamped === currentVal) return;

    const group = groupRows.find((g) => g.key === key);
    if (!group) return;

    // Se si sta aumentando
    if (clamped > currentVal) {
      // Verifica se tutti gli attributi hanno già raggiunto il cap di 99
      const allMaxed = group.subs.every((s) => (preStats[s] ?? 0) + currentVal >= 99);
      if (allMaxed) {
        toast({
          title: "Limite Raggiunto",
          description: "Tutti gli attributi di questo gruppo hanno già raggiunto il valore massimo (99).",
        });
        return;
      }

      // Calcolo costo dinamico per i livelli aggiuntivi
      let diffCost = 0;
      for (let lvl = currentVal; lvl < clamped; lvl++) {
        diffCost += getSingleTickCost(group, preStats, lvl);
      }

      // Se non ci sono abbastanza XP, blocca
      if (xpRemaining < diffCost) {
        toast({
          title: "XP Insufficienti",
          description: `Servono ${diffCost} XP per questo aumento, ne hai a disposizione ${xpRemaining}.`,
          variant: "destructive",
        });
        return;
      }
    }

    setIncreases((prev) => ({
      ...prev,
      [key]: clamped,
    }));
  };

  // Funzione SALVA ALLENAMENTI
  const handleSaveTraining = async () => {
    if (!player) return;
    if (xpRemaining < 0) {
      toast({
        title: "Attenzione",
        description: "Il costo degli allenamenti supera gli XP a disposizione.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    const playerId = Number(player.ID);

    try {
      if (!hasActiveIncreases) {
        await supabase
          .from(PLAYER_TABLE_TRAINING)
          .delete()
          .eq("PlayerID", playerId);

        setTrainingMap((prev) => {
          const next = { ...prev };
          delete next[playerId];
          return next;
        });

        toast({
          title: "Valori originali salvati",
          description: `Allenamenti azzerati per ${player.Nome} ${player.Cognome}.`,
        });
        return;
      }

      const nowIso = new Date().toISOString();
      const payload = {
        PlayerID: playerId,
        Squadra: currentTeam || player.Squadra,
        status: "draft" as const,
        increases: normalizeIncreases(increases),
        xp_cost: totalCost,
        pre_ovr: preOverall,
        post_ovr: postOverall,
        base_snapshot: {
          Nome: player.Nome,
          Cognome: player.Cognome,
          Posiz: player.Posiz,
          OVR: preOverall,
          XP: player.XP,
          stats: preStats,
        },
        updated_at: nowIso,
      };

      const { data, error } = await supabase
        .from(PLAYER_TABLE_TRAINING)
        .upsert(payload, { onConflict: "PlayerID" })
        .select()
        .single();

      if (error) throw error;

      setTrainingMap((prev) => ({
        ...prev,
        [playerId]: data as TrainingRecord,
      }));

      queryClient.invalidateQueries({ queryKey: ["player_training", playerId] });

      toast({
        title: "Allenamenti Salvati!",
        description: `Stato salvato per ${player.Nome} ${player.Cognome}. OVR stimato: ${postOverall} (+${postOverall - preOverall}).`,
      });
    } catch (err: any) {
      console.error("Errore salvataggio allenamenti:", err);
      toast({
        title: "Errore durante il salvataggio",
        description: err.message || "Impossibile salvare gli allenamenti.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Funzione RESET VALORI ORIGINALI
  const handleResetToOriginal = async () => {
    if (!player) return;
    setIsResetting(true);
    const playerId = Number(player.ID);

    try {
      setIncreases(emptyIncreases());

      if (trainingMap[playerId]) {
        const { error } = await supabase
          .from(PLAYER_TABLE_TRAINING)
          .delete()
          .eq("PlayerID", playerId);

        if (error) throw error;

        setTrainingMap((prev) => {
          const next = { ...prev };
          delete next[playerId];
          return next;
        });
      }

      toast({
        title: "Valori Originali Ripristinati",
        description: `Gli allenamenti di ${player.Nome} ${player.Cognome} sono tornati ai valori originali.`,
      });
    } catch (err: any) {
      console.error("Errore reset:", err);
      toast({
        title: "Errore reset",
        description: "Impossibile ripristinare i valori originali.",
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
    }
  };

  const handlePlayerUpdate = (updatedPlayer: Player) => {
    setPlayers((prev) =>
      prev.map((p) => (p.ID === updatedPlayer.ID ? updatedPlayer : p))
    );
  };

  const playerWithPreviewStats = useMemo(() => {
    if (!player) return null;
    return {
      ...player,
      OVR: postOverall,
      XP: xpRemaining,
      stats: postStats,
    };
  }, [player, postOverall, xpRemaining, postStats]);

  // Elenco dei gruppi migliorati per il riepilogo
  const activeGroupsSummary = useMemo(
    () =>
      groupRows
        .filter((g) => (increases[g.key] ?? 0) > 0)
        .map((g) => {
          const inc = increases[g.key] ?? 0;
          return {
            ...g,
            inc,
            cost: calculateGroupCost(g, preStats, inc),
          };
        }),
    [increases, preStats]
  );

  // Giocatori filtrati per ricerca e ruolo
  const filteredPlayers = useMemo(() => {
    return players.filter((p) => {
      // Filtro ruolo
      if (roleFilter !== "ALL") {
        if (roleFilter === "POR" && p.Posiz !== "POR") return false;
        if (roleFilter === "DIF" && !["DC", "TD", "TS", "DFC", "TER"].includes(p.Posiz)) return false;
        if (roleFilter === "CEN" && !["CDC", "CC", "ED", "ES", "COC", "CEN"].includes(p.Posiz)) return false;
        if (roleFilter === "ATT" && !["AD", "AS", "AT", "ATT"].includes(p.Posiz)) return false;
      }
      // Filtro ricerca nome
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const fullName = `${p.Nome} ${p.Cognome}`.toLowerCase();
        if (!fullName.includes(q)) return false;
      }
      return true;
    });
  }, [players, roleFilter, searchQuery]);

  // Calcolo impatto OVR per singolo attributo per il giocatore attivo
  const playerRoleWeights = useMemo(() => {
    if (!player?.Posiz) return {};
    return roleWeights[player.Posiz.toUpperCase()] || {};
  }, [player?.Posiz]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="container mx-auto px-4 py-6 space-y-6">
        {!user ? (
          <RequireAuthPrompt
            title="Centro Allenamenti & Sviluppo XP"
            description="Accedi con il tuo account o scegli una squadra libera per gestire gli allenamenti e l'assegnazione dei punti XP."
          />
        ) : (
          <>
            {/* Selettore Admin Globale */}
            <AdminTeamSelector />

            {/* Header Broadcast */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-border/80">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                    Centro Sviluppo • {effectiveTeamFullName || currentTeam || "Squadra"}
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                  Centro Allenamenti & Sviluppo XP
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  Potenzia i tuoi calciatori assegnando i punti XP ai gruppi di attributi dedicati.
                </p>
              </div>

              {/* Status Pill */}
              {player && (
                <div className="flex items-center gap-2">
                  {hasUnsavedChanges ? (
                    <Badge variant="outline" className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 px-3 py-1.5 text-xs font-semibold gap-1.5 shadow-sm">
                      <Clock className="h-3.5 w-3.5 animate-pulse" />
                      Modifiche non salvate
                    </Badge>
                  ) : hasSavedTraining ? (
                    <Badge variant="outline" className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 px-3 py-1.5 text-xs font-semibold gap-1.5 shadow-sm">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Allenamento Salvato a Sistema
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground px-3 py-1.5 text-xs">
                      Valori Originali di Default
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {/* ========================================================================= */}
            {/* TELEMETRY COMMAND HUD: RECAP COMPLETO OVERALL & XP (RICHIESTA UTENTE)     */}
            {/* ========================================================================= */}
            {player && (
              <div className="rounded-2xl border border-border/80 bg-gradient-to-r from-card via-card/95 to-card/90 shadow-xl p-4 sm:p-5 backdrop-blur-md">
                <div className="grid grid-cols-12 gap-4 items-center">
                  
                  {/* Calciatore Profilo Rapido */}
                  <div className="col-span-12 lg:col-span-4 flex items-center gap-3.5 pr-0 lg:pr-4 lg:border-r border-border/70">
                    <div className="relative shrink-0">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-border/80 bg-muted/30 shadow-md">
                        <img
                          src={getPlayerImage(Number(player.ID))}
                          alt={`${player.Nome} ${player.Cognome}`}
                          className="w-full h-full object-cover object-top"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/images/players/MConti.png";
                          }}
                        />
                      </div>
                      <Badge className={`absolute -bottom-1 -right-1 text-[10px] px-1.5 py-0 font-bold border ${getRoleColor(player.Posiz)}`}>
                        {player.Posiz}
                      </Badge>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-base sm:text-lg text-foreground truncate">
                          {player.Nome} {player.Cognome}
                        </span>
                        {player.Nazionalità && (
                          <img
                            src={getNationalityFlag(player.Nazionalità)}
                            alt={player.Nazionalità}
                            className="h-3.5 w-3.5 object-contain shrink-0"
                          />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                        <span>{player.Età} anni</span>
                        <span>•</span>
                        <span>Piede: {player.Piede || "Dx"}</span>
                        <span>•</span>
                        <span>{player.Altezza || "180"} cm</span>
                      </div>
                    </div>
                  </div>

                  {/* Recap XP: Disponibili, Usati, Rimanenti */}
                  <div className="col-span-12 sm:col-span-7 lg:col-span-4 grid grid-cols-3 gap-2 px-0 lg:px-2">
                    {/* XP Disponibili */}
                    <div className="p-2.5 rounded-xl border border-border/60 bg-muted/20 text-center">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate">
                        Punti Disponibili
                      </div>
                      <div className="text-xl sm:text-2xl font-black font-mono text-foreground mt-0.5">
                        {xpAvailable}
                      </div>
                      <span className="text-[9px] text-muted-foreground font-medium">XP totali</span>
                    </div>

                    {/* XP Usati al Momento */}
                    <div className={`p-2.5 rounded-xl border text-center transition-all ${
                      totalCost > 0 ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400" : "bg-muted/20 border-border/60 text-muted-foreground"
                    }`}>
                      <div className="text-[10px] font-bold uppercase tracking-wider truncate">
                        Punti Usati
                      </div>
                      <div className="text-xl sm:text-2xl font-black font-mono mt-0.5">
                        {totalCost > 0 ? `-${totalCost}` : "0"}
                      </div>
                      <span className="text-[9px] font-medium">Costo attuale</span>
                    </div>

                    {/* XP Rimanenti */}
                    <div className={`p-2.5 rounded-xl border text-center transition-all ${
                      xpRemaining < 0 
                        ? "bg-rose-500/15 border-rose-500/40 text-rose-600 dark:text-rose-400 animate-pulse" 
                        : "bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                    }`}>
                      <div className="text-[10px] font-bold uppercase tracking-wider truncate">
                        XP Rimanenti
                      </div>
                      <div className="text-xl sm:text-2xl font-black font-mono mt-0.5">
                        {xpRemaining}
                      </div>
                      <span className="text-[9px] font-medium">Saldo residuo</span>
                    </div>
                  </div>

                  {/* Recap Overall: PRE vs POST */}
                  <div className="col-span-12 sm:col-span-5 lg:col-span-4 flex items-center justify-between sm:justify-end gap-3 pl-0 lg:pl-3 lg:border-l border-border/70">
                    <div className="flex items-center gap-2 sm:gap-3">
                      {/* Pre Overall */}
                      <div className="text-center p-2 rounded-xl bg-muted/40 border border-border/70 min-w-[65px]">
                        <span className="text-[9px] uppercase font-bold text-muted-foreground block">
                          Pre OVR
                        </span>
                        <span className="text-xl sm:text-2xl font-black font-mono text-muted-foreground">
                          {preOverall}
                        </span>
                      </div>

                      <ArrowRight className="h-4 w-4 text-emerald-500 shrink-0" />

                      {/* Post Overall */}
                      <div className={`text-center p-2 rounded-xl border min-w-[75px] transition-all ${
                        postOverall > preOverall 
                          ? "bg-emerald-500/20 border-emerald-500/50 shadow-md" 
                          : "bg-muted/40 border-border/70"
                      }`}>
                        <span className="text-[9px] uppercase font-bold text-foreground block">
                          Post OVR
                        </span>
                        <div className="flex items-center justify-center gap-1">
                          <span className={`text-xl sm:text-2xl font-black font-mono ${
                            postOverall > preOverall ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"
                          }`}>
                            {postOverall}
                          </span>
                          {postOverall > preOverall && (
                            <Badge className="bg-emerald-500 text-white text-[9px] px-1 py-0 font-bold h-4">
                              +{postOverall - preOverall}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Azioni Rapide Salva/Reset nel Command Bar */}
                    <div className="flex flex-col gap-1.5 shrink-0">
                      <Button
                        size="sm"
                        disabled={!player || !hasUnsavedChanges || xpRemaining < 0 || isSaving || isResetting}
                        onClick={handleSaveTraining}
                        className="h-8 px-3 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
                      >
                        <Save className="h-3.5 w-3.5 mr-1.5" />
                        {isSaving ? "Salvataggio..." : "Salva"}
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!player || (!hasActiveIncreases && !hasSavedTraining) || isResetting || isSaving}
                        onClick={handleResetToOriginal}
                        className="h-7 px-2 text-[11px] font-semibold text-muted-foreground hover:text-rose-500 hover:border-rose-500/40"
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Reset
                      </Button>
                    </div>

                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* CORPO DELLA PAGINA: SIDEBAR CALCIATORI + BLOCCHI ATTRIBUTI A TRE A TRE     */}
            {/* ========================================================================= */}
            <div className="grid grid-cols-12 gap-6 items-start">
              
              {/* ------------------------------------------------------------- */}
              {/* COLONNA SINISTRA: SELETTORE CALCIATORE DELLA ROSA              */}
              {/* ------------------------------------------------------------- */}
              <div className="col-span-12 lg:col-span-3 space-y-4">
                <Card className="shadow-lg border-border/80 overflow-hidden">
                  <CardHeader className="bg-muted/30 border-b border-border/60 py-3.5 px-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-emerald-500" />
                        <CardTitle className="text-sm font-bold">Rosa della Squadra</CardTitle>
                      </div>
                      <Badge variant="secondary" className="text-[10px] font-mono px-1.5 py-0">
                        {players.length} Giocatori
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 space-y-3">
                    {/* Campo ricerca per nome */}
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Cerca calciatore..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 h-8 text-xs bg-muted/20 border-border/70"
                      />
                    </div>

                    {/* Filtro per Ruolo Rapido */}
                    <div className="grid grid-cols-5 gap-1">
                      {["ALL", "POR", "DIF", "CEN", "ATT"].map((r) => (
                        <Button
                          key={r}
                          size="sm"
                          variant={roleFilter === r ? "default" : "outline"}
                          onClick={() => setRoleFilter(r)}
                          className={`h-7 text-[10px] px-1 font-bold ${
                            roleFilter === r ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                          }`}
                        >
                          {r}
                        </Button>
                      ))}
                    </div>

                    {/* Lista Giocatori */}
                    <div className="max-h-[500px] overflow-y-auto space-y-1.5 pr-1">
                      {filteredPlayers.length === 0 ? (
                        <div className="p-4 text-center text-xs text-muted-foreground">
                          Nessun giocatore trovato.
                        </div>
                      ) : (
                        filteredPlayers.map((p) => {
                          const pId = Number(p.ID);
                          const isSelected = pId === selectedId;
                          const rec = trainingMap[pId];
                          const hasSaved = rec && hasAnyIncrease(normalizeIncreases(rec.increases));

                          return (
                            <div
                              key={pId}
                              onClick={() => handlePlayerChange(pId)}
                              className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-2.5 ${
                                isSelected
                                  ? "bg-emerald-500/10 border-emerald-500/50 shadow-sm"
                                  : "hover:bg-muted/40 border-border/50"
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-lg overflow-hidden border border-border/80 bg-muted/30 shrink-0">
                                  <img
                                    src={getPlayerImage(pId)}
                                    alt={p.Cognome}
                                    className="w-full h-full object-cover object-top"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = "/images/players/MConti.png";
                                    }}
                                  />
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-xs text-foreground truncate">
                                    {p.Nome?.[0]}. {p.Cognome}
                                  </div>
                                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                    <Badge variant="outline" className={`text-[9px] px-1 py-0 h-3.5 ${getRoleColor(p.Posiz)}`}>
                                      {p.Posiz}
                                    </Badge>
                                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                                      {p.XP ?? 0} XP
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                {hasSaved && (
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" title="Allenamento salvato" />
                                )}
                                <span className={`text-xs font-black font-mono ${getValueColor(p.OVR ?? 70)}`}>
                                  {p.OVR}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Guida Rapida / Istruzioni */}
                <Card className="border-border/60 bg-muted/20 text-xs p-3.5 space-y-2.5">
                  <div className="flex items-center gap-1.5 font-bold text-foreground">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Regolamento Costi XP Dinamici</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground leading-relaxed space-y-2">
                    <p>
                      • Il costo in XP per ciascun livello viene calcolato in base alla <strong>media degli attributi</strong> del gruppo (o al <strong>valore più alto</strong> per i Calci Piazzati):
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 text-[10px] font-mono">
                      <span className="bg-background/80 px-1.5 py-0.5 rounded border border-border/60">&gt;90 &rarr; 50 XP</span>
                      <span className="bg-background/80 px-1.5 py-0.5 rounded border border-border/60">&gt;80 &rarr; 30 XP</span>
                      <span className="bg-background/80 px-1.5 py-0.5 rounded border border-border/60">&gt;70 &rarr; 15 XP</span>
                      <span className="bg-background/80 px-1.5 py-0.5 rounded border border-border/60">&gt;60 &rarr; 8 XP</span>
                      <span className="bg-background/80 px-1.5 py-0.5 rounded border border-border/60">&gt;50 &rarr; 5 XP</span>
                      <span className="bg-background/80 px-1.5 py-0.5 rounded border border-border/60">&gt;30 &rarr; 3 XP</span>
                      <span className="bg-background/80 px-1.5 py-0.5 rounded border border-border/60">&le;30 &rarr; 1 XP</span>
                      <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/30 font-bold">POR: Costo x2</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      • <strong>Dinamico tick-by-tick</strong>: ad ogni punto assegnato la media aumenta e il costo del tick successivo si adatta in tempo reale.<br />
                      • <strong>Calci Piazzati</strong>: non si calcola la media, ma il valore max tra Punizioni (PNIZ), Rigori (CRIG) e Freddezza (FRED).
                    </p>
                  </div>
                </Card>
              </div>

              {/* ------------------------------------------------------------- */}
              {/* COLONNA CENTRALE: I BLOCCHI ATTRIBUTI A TRE A TRE (GRIGLIA)   */}
              {/* ------------------------------------------------------------- */}
              <div className="col-span-12 lg:col-span-6 space-y-4">
                <Tabs defaultValue="attributi" className="w-full">
                  <TabsList className="w-full grid grid-cols-3 h-11 bg-muted/40 p-1 rounded-xl">
                    <TabsTrigger value="attributi" className="font-bold text-xs sm:text-sm gap-1.5">
                      <TrendingUp className="h-4 w-4" /> Gruppi Attributi
                    </TabsTrigger>
                    <TabsTrigger value="ruolo" className="font-bold text-xs sm:text-sm gap-1.5">
                      <Award className="h-4 w-4" /> Ruolo & Ruolo+
                    </TabsTrigger>
                    <TabsTrigger value="tratti" className="font-bold text-xs sm:text-sm gap-1.5">
                      <Sparkles className="h-4 w-4" /> Tratti & Stili
                    </TabsTrigger>
                  </TabsList>

                  {/* TAB 1: I 12 BLOCCHI ATTRIBUTI A TRE A TRE */}
                  <TabsContent value="attributi" className="mt-4 space-y-4">
                    {!player ? (
                      <Card className="p-12 text-center text-muted-foreground border-dashed">
                        Seleziona un giocatore dalla rosa a sinistra per iniziare l'allenamento.
                      </Card>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {groupRows.map((g) => {
                          const inc = increases[g.key] ?? 0;
                          const nextTickCost = getSingleTickCost(g, preStats, inc);
                          const groupTotalCost = calculateGroupCost(g, preStats, inc);
                          const refVal = getGroupReferenceValue(g, preStats, inc);
                          const isPOR = g.category === "POR";
                          const isCALC = g.key === "CALC";
                          const allMaxed = g.subs.every((s) => (preStats[s] ?? 0) + inc >= 99);
                          const hasChange = inc > 0;
                          const canIncrement = inc < 25 && !allMaxed && xpRemaining >= nextTickCost;
                          const IconComp = g.icon;

                          return (
                            <Card
                              key={g.key}
                              className={`transition-all duration-200 overflow-hidden border ${
                                hasChange
                                  ? "border-emerald-500/50 bg-gradient-to-b from-emerald-500/[0.05] to-transparent shadow-md"
                                  : "border-border/80 hover:border-border bg-card"
                              }`}
                            >
                              {/* Header del Blocco di 3 Attributi */}
                              <div className="p-3.5 border-b border-border/50 bg-muted/20 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className={`p-2 rounded-lg border ${g.bgClass} ${g.colorClass} shrink-0`}>
                                    <IconComp className="h-4 w-4" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <h3 className="text-sm font-extrabold text-foreground truncate">{g.label}</h3>
                                      {hasChange && (
                                        <Badge className="bg-emerald-500 text-white font-mono text-[10px] px-1.5 py-0">
                                          +{inc}
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono flex-wrap">
                                      <span>
                                        {isCALC ? "Max" : "Media"}:{" "}
                                        <strong className="text-foreground">
                                          {isCALC ? Math.round(refVal) : (Math.round(refVal * 10) / 10).toFixed(1)}
                                        </strong>
                                      </span>
                                      <span>•</span>
                                      <span className={nextTickCost >= 30 ? "text-amber-500 font-semibold" : ""}>
                                        Prox: <strong>{nextTickCost} XP</strong>{isPOR ? " (x2)" : ""}
                                      </span>
                                      {hasChange && (
                                        <>
                                          <span>•</span>
                                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                            Tot: {groupTotalCost} XP
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Stepper Controlli [-] [Valore] [+] */}
                                <div className="flex items-center gap-1 bg-background/80 p-1 rounded-xl border border-border/70 shadow-sm shrink-0">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6 rounded-lg hover:bg-muted text-muted-foreground"
                                    onClick={() => setIncrease(g.key, inc - 1)}
                                    disabled={inc <= 0}
                                    title="Diminuisci di 1 livello (fino all'originale)"
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>

                                  <span className={`w-7 text-center font-mono text-xs font-bold ${
                                    hasChange ? "text-emerald-600 dark:text-emerald-400 font-extrabold" : "text-muted-foreground"
                                  }`}>
                                    +{inc}
                                  </span>

                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className={`h-6 w-6 rounded-lg ${
                                      canIncrement ? "hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "text-muted-foreground opacity-40"
                                    }`}
                                    onClick={() => setIncrease(g.key, inc + 1)}
                                    disabled={!canIncrement}
                                    title={
                                      allMaxed
                                        ? "Tutti gli attributi del gruppo hanno raggiunto 99"
                                        : xpRemaining < nextTickCost
                                        ? `Servono ${nextTickCost} XP disponibili (ne hai ${xpRemaining})`
                                        : `Aumenta di 1 livello (costo: ${nextTickCost} XP)`
                                    }
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>

                              {/* I 3 Sotto-Attributi del Blocco */}
                              <CardContent className="p-3 space-y-2">
                                {g.subs.map((s) => {
                                  const origVal = preStats[s];
                                  const newVal = postStats[s];
                                  const diff = newVal - origVal;
                                  const weight = playerRoleWeights[s] || 0;
                                  const isKeyForRole = weight >= 10;

                                  return (
                                    <div
                                      key={s}
                                      className={`p-2 rounded-lg transition-all ${
                                        diff > 0 
                                          ? "bg-emerald-500/10 border border-emerald-500/20" 
                                          : "bg-muted/15 hover:bg-muted/30 border border-transparent"
                                      }`}
                                    >
                                      <div className="flex items-center justify-between text-xs mb-1">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                          <span className="font-semibold text-foreground truncate">
                                            {statMeta[s].label}
                                          </span>
                                          <span className="text-[10px] font-mono text-muted-foreground">
                                            ({statMeta[s].short})
                                          </span>
                                          {isKeyForRole && (
                                            <Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 font-bold" title="Attributo fondamentale per il calcolo OVR del ruolo">
                                              ★ OVR {weight}%
                                            </Badge>
                                          )}
                                        </div>

                                        <div className="flex items-center gap-2 font-mono shrink-0">
                                          <span className="text-xs text-muted-foreground font-medium">
                                            {origVal}
                                          </span>
                                          <ArrowRight className="h-3 w-3 text-muted-foreground opacity-50" />
                                          <span className={`text-xs font-black ${
                                            diff > 0 ? "text-emerald-600 dark:text-emerald-400 font-extrabold" : "text-foreground"
                                          }`}>
                                            {newVal}
                                          </span>
                                        </div>
                                      </div>

                                      {/* Mini Barra Progressiva a due colori */}
                                      <div className="h-1.5 w-full bg-muted/60 rounded-full overflow-hidden flex">
                                        <div
                                          className="h-full bg-primary/40 rounded-l-full"
                                          style={{ width: `${Math.min(100, (origVal / 99) * 100)}%` }}
                                        />
                                        {diff > 0 && (
                                          <div
                                            className="h-full bg-emerald-500 animate-pulse"
                                            style={{ width: `${Math.min(100 - (origVal / 99) * 100, (diff / 99) * 100)}%` }}
                                          />
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </TabsContent>

                  {/* TAB 2: RUOLO & RUOLO+ */}
                  <TabsContent value="ruolo" className="mt-4">
                    {playerWithPreviewStats ? (
                      <RoleSystem
                        player={playerWithPreviewStats}
                        xpAvailable={xpRemaining}
                        onXpChange={() => {}}
                        onPlayerUpdate={handlePlayerUpdate}
                      />
                    ) : (
                      <Card className="py-12 text-center text-muted-foreground">
                        Seleziona un giocatore
                      </Card>
                    )}
                  </TabsContent>

                  {/* TAB 3: TRATTI */}
                  <TabsContent value="tratti" className="mt-4">
                    {playerWithPreviewStats ? (
                      <TraitSystem
                        player={playerWithPreviewStats}
                        xpAvailable={xpRemaining}
                        onXpChange={() => {}}
                        onPlayerUpdate={handlePlayerUpdate}
                      />
                    ) : (
                      <Card className="py-12 text-center text-muted-foreground">
                        Seleziona un giocatore
                      </Card>
                    )}
                  </TabsContent>
                </Tabs>
              </div>

              {/* ------------------------------------------------------------- */}
              {/* COLONNA DESTRA: RIEPILOGO DETTAGLIATO MODIFICHE & IMPATTO      */}
              {/* ------------------------------------------------------------- */}
              <div className="col-span-12 lg:col-span-3 space-y-4">
                
                {/* Scheda Riepilogo Generale */}
                <Card className="shadow-lg border-border/80 overflow-hidden">
                  <CardHeader className="bg-muted/30 border-b border-border/60 py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-emerald-500" />
                      <CardTitle className="text-sm font-bold">Riepilogo Avanzamento</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    
                    {/* Visualizzatore OVR Grande */}
                    <div className="p-3.5 rounded-xl bg-gradient-to-br from-card to-muted/30 border border-border/80 text-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                        Crescita Overall Valutata
                      </span>
                      <div className="flex items-center justify-center gap-3">
                        <div>
                          <span className="text-xs text-muted-foreground block">Base</span>
                          <span className="text-2xl font-black font-mono text-muted-foreground">{preOverall}</span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-emerald-500" />
                        <div>
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 block font-bold">Nuovo</span>
                          <span className="text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400">{postOverall}</span>
                        </div>
                      </div>
                      {postOverall > preOverall && (
                        <div className="mt-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>+ {postOverall - preOverall} Punti OVR complessivi</span>
                        </div>
                      )}
                    </div>

                    {/* Elenco dei gruppi incrementati */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        <span>Gruppi Allenati</span>
                        <span>{activeGroupsSummary.length} Attivi</span>
                      </div>

                      {activeGroupsSummary.length === 0 ? (
                        <div className="p-4 rounded-xl border border-dashed border-border text-center text-xs text-muted-foreground leading-relaxed">
                          Nessun gruppo ancora potenziato.<br />
                          Usa i tasti <strong>+</strong> nella griglia centrale per spendere XP.
                        </div>
                      ) : (
                        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                          {activeGroupsSummary.map((item) => (
                            <div
                              key={item.key}
                              className="p-2.5 rounded-xl bg-muted/30 border border-border/60 flex items-center justify-between text-xs"
                            >
                              <div>
                                <span className="font-bold text-foreground">{item.label}</span>
                                <span className="block text-[10px] text-muted-foreground font-mono">
                                  {item.subs.join(" • ")}
                                </span>
                              </div>
                              <div className="text-right font-mono">
                                <span className="font-extrabold text-emerald-600 dark:text-emerald-400 block">
                                  +{item.inc} liv.
                                </span>
                                <span className="text-[10px] text-amber-500 font-semibold">
                                  -{item.cost} XP
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Bottone di salvataggio fisso in sidebar */}
                    <div className="pt-2 space-y-2">
                      <Button
                        className="w-full font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md h-10"
                        disabled={!player || !hasUnsavedChanges || xpRemaining < 0 || isSaving || isResetting}
                        onClick={handleSaveTraining}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {isSaving ? "Salvataggio..." : "Salva Allenamenti"}
                      </Button>

                      <Button
                        variant="outline"
                        className="w-full text-xs font-semibold text-muted-foreground hover:text-rose-500 hover:border-rose-500/40"
                        disabled={!player || (!hasActiveIncreases && !hasSavedTraining) || isResetting || isSaving}
                        onClick={handleResetToOriginal}
                      >
                        <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                        Reset ai Valori Originali
                      </Button>
                    </div>

                    {/* Stato Ultimo Salvataggio */}
                    {hasSavedTraining && currentTrainingRecord?.updated_at && (
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Ultimo Salvataggio a DB</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          OVR {currentTrainingRecord.pre_ovr} &rarr; {currentTrainingRecord.post_ovr} ({currentTrainingRecord.xp_cost} XP spesi)<br />
                          {new Date(currentTrainingRecord.updated_at).toLocaleString("it-IT")}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Allenamenti;

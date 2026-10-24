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
  ChevronRight, AlertCircle, RefreshCw, Star, Lock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import UnifiedRoleAndTraitSystem from "@/components/training/UnifiedRoleAndTraitSystem";
import { useAuth } from "@/context/AuthContext";
import AdminTeamSelector from "@/components/AdminTeamSelector";
import RequireAuthPrompt from "@/components/RequireAuthPrompt";
import { supabase } from "@/supabaseClient";
import { PLAYER_TABLE, PLAYER_TABLE_TRAINING } from "@/constants/App";
import { useQueryClient } from "@tanstack/react-query";
import { getRoleColor, getValueColor, getPlayerImage, getNationalityFlag } from "@/utils/functions";
import { getRosterLockState, subscribeToRosterLock } from "@/services/rosterLockService";
import {
  StatKey,
  PlayerSpecializationDraft,
  parsePlayerSpecializations,
  serializeSpecializationsForDb,
  calculateSpecializationsCost,
  OFFICIAL_TRAITS,
} from "@/types/training";

export { type StatKey };

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
    PASC: 9, PASL: 0, CRSS: 9, CTRP: 14, VISI: 6, EFFT: 0,
    PTIR: 0, TIRD: 0, TIRV: 0, DRBL: 16, PIAZ: 9, FINA: 10,
    ACCL: 7, VELO: 6, AGIL: 3, RESI: 0, EQLB: 0, FRZA: 0,
    TSTA: 0, RIFL: 7, ELEV: 0, PNIZ: 0, CRIG: 0, FRED: 0,
  },
  'AS': {
    PREP: 0, POSP: 0, RINP: 0, RIFP: 0, TUFP: 0,
    CONT: 0, SCIV: 0, MARC: 0, AGGR: 0, INTR: 0,
    PASC: 9, PASL: 0, CRSS: 9, CTRP: 14, VISI: 6, EFFT: 0,
    PTIR: 0, TIRD: 0, TIRV: 0, DRBL: 16, PIAZ: 9, FINA: 10,
    ACCL: 7, VELO: 6, AGIL: 3, RESI: 0, EQLB: 0, FRZA: 0,
    TSTA: 0, RIFL: 7, ELEV: 0, PNIZ: 0, CRIG: 0, FRED: 0,
  },
  'ATT': {
    PREP: 0, POSP: 0, RINP: 0, RIFP: 0, TUFP: 0,
    CONT: 0, SCIV: 0, MARC: 0, AGGR: 0, INTR: 0,
    PASC: 5, PASL: 0, CRSS: 0, CTRP: 10, VISI: 0, EFFT: 0,
    PTIR: 10, TIRD: 3, TIRV: 2, DRBL: 7, PIAZ: 13, FINA: 18,
    ACCL: 4, VELO: 5, AGIL: 0, RESI: 0, EQLB: 0, FRZA: 5,
    TSTA: 10, RIFL: 8, ELEV: 0, PNIZ: 0, CRIG: 0, FRED: 0,
  },
  'AT': {
    PREP: 0, POSP: 0, RINP: 0, RIFP: 0, TUFP: 0,
    CONT: 0, SCIV: 0, MARC: 0, AGGR: 0, INTR: 0,
    PASC: 9, PASL: 0, CRSS: 0, CTRP: 15, VISI: 8, EFFT: 0,
    PTIR: 5, TIRD: 4, TIRV: 0, DRBL: 14, PIAZ: 13, FINA: 11,
    ACCL: 5, VELO: 4, AGIL: 0, RESI: 0, EQLB: 0, FRZA: 0,
    TSTA: 2, RIFL: 7, ELEV: 0, PNIZ: 0, CRIG: 0, FRED: 0,
  },
};

export const calcOverall = (
  role: string | undefined | null,
  stats: Record<StatKey, number>,
  fallback: number = 70
): number => {
  const normRole = (role || "").toUpperCase();
  const weights = roleWeights[normRole] || roleWeights['CC'];
  if (!weights) return fallback;

  let totalWeight = 0;
  let weightedSum = 0;

  for (const k of Object.keys(statMeta) as StatKey[]) {
    const w = weights[k] || 0;
    if (w > 0) {
      totalWeight += w;
      weightedSum += (stats[k] || 0) * w;
    }
  }

  if (totalWeight === 0) return fallback;
  return Math.round(weightedSum / totalWeight);
};

interface TrainingRecord {
  id?: string;
  PlayerID: number;
  Squadra: string;
  status: "draft" | "confirmed";
  increases: Record<string, any>;
  xp_cost: number;
  pre_ovr: number;
  post_ovr: number;
  base_snapshot?: any;
  updated_at?: string;
  confirmed_at?: string;
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

  // Stato bozza per ruoli e tratti
  const [specializationsDraft, setSpecializationsDraft] = useState<PlayerSpecializationDraft>(() =>
    parsePlayerSpecializations(null)
  );

  // Stati operativi UI
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isRosterLocked, setIsRosterLocked] = useState<boolean>(false);

  useEffect(() => {
    getRosterLockState().then((st) => setIsRosterLocked(st.isLocked));
    const unsub = subscribeToRosterLock((st) => setIsRosterLocked(st.isLocked));
    return unsub;
  }, []);

  // Helper per caricare bozza giocatore da trainingMap o da an_player base
  const loadPlayerDraft = (targetPlayer: Player | null, record: TrainingRecord | undefined) => {
    if (!targetPlayer) {
      setIncreases(emptyIncreases());
      setSpecializationsDraft(parsePlayerSpecializations(null));
      return;
    }

    if (record && record.increases) {
      setIncreases(normalizeIncreases(record.increases));
      if (record.increases.specializations) {
        const spec = record.increases.specializations;
        setSpecializationsDraft({
          posiz: spec.posiz || targetPlayer.Posiz || "CC",
          role1: spec.role1 !== undefined ? spec.role1 : targetPlayer.Role1 || null,
          role2: spec.role2 !== undefined ? spec.role2 : targetPlayer.Role2 || null,
          traits: Array.isArray(spec.traits_list)
            ? spec.traits_list
            : parsePlayerSpecializations(targetPlayer).traits,
          removedBaseTraits: Array.isArray(spec.removed_base_traits) ? spec.removed_base_traits : [],
        });
      } else {
        setSpecializationsDraft(parsePlayerSpecializations(targetPlayer));
      }
    } else {
      setIncreases(emptyIncreases());
      setSpecializationsDraft(parsePlayerSpecializations(targetPlayer));
    }
  };

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
          loadPlayerDraft(basePlayers[0], rec);
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
    const p = players.find((x) => Number(x.ID) === id) ?? null;
    const rec = trainingMap[id];
    loadPlayerDraft(p, rec);
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

  // Calcolo Overall pre e post (post Overall calcolato sulla posizione bozza se cambiata)
  const preOverall = useMemo(
    () => calcOverall(player?.Posiz, preStats, player?.OVR ?? 70),
    [player?.Posiz, preStats, player?.OVR]
  );

  const postOverall = useMemo(
    () => calcOverall(specializationsDraft.posiz || player?.Posiz, postStats, preOverall),
    [specializationsDraft.posiz, player?.Posiz, postStats, preOverall]
  );

  // Calcolo Costo Attributi XP (Dinamico basato su media/max e tick-by-tick)
  const attributeCost = useMemo(() => {
    let cost = 0;
    for (const row of groupRows) {
      const inc = increases[row.key] ?? 0;
      if (inc > 0) {
        cost += calculateGroupCost(row, preStats, inc);
      }
    }
    return cost;
  }, [increases, preStats]);

  // Calcolo Costo Specializzazioni (Ruoli & Tratti)
  const specCostSummary = useMemo(() => {
    return calculateSpecializationsCost(player, specializationsDraft, postOverall);
  }, [player, specializationsDraft, postOverall]);

  // Costo Totale Complessivo
  const totalCost = attributeCost + specCostSummary.totalCost;
  const xpAvailable = player?.XP ?? 0;
  const xpRemaining = xpAvailable - totalCost;

  // Verifica se ci sono modifiche attive sugli attributi
  const hasActiveIncreases = useMemo(() => hasAnyIncrease(increases), [increases]);

  // Verifica se ci sono modifiche attive su ruoli o tratti rispetto al giocatore base di an_player
  const hasActiveSpecializations = useMemo(() => {
    if (!player) return false;
    const base = parsePlayerSpecializations(player);
    if (specializationsDraft.posiz !== base.posiz) return true;
    if (specializationsDraft.role1 !== base.role1) return true;
    if (specializationsDraft.role2 !== base.role2) return true;
    if ((specializationsDraft.removedBaseTraits || []).length > 0) return true;
    const baseTraitKeys = base.traits.map((t) => `${t.id}:${t.tier}`).sort().join(",");
    const draftTraitKeys = specializationsDraft.traits.map((t) => `${t.id}:${t.tier}`).sort().join(",");
    return baseTraitKeys !== draftTraitKeys;
  }, [player, specializationsDraft]);

  const hasAnyDraftChanges = hasActiveIncreases || hasActiveSpecializations;

  const hasSavedTraining = useMemo(() => {
    return !!currentTrainingRecord;
  }, [currentTrainingRecord]);

  const hasUnsavedChanges = useMemo(() => {
    if (!player) return false;
    const savedIncreases = currentTrainingRecord ? normalizeIncreases(currentTrainingRecord.increases) : emptyIncreases();
    const increasesChanged = !areIncreasesEqual(increases, savedIncreases);

    const savedSpec = currentTrainingRecord?.increases?.specializations;
    let savedDraftSpec: PlayerSpecializationDraft;
    if (savedSpec) {
      savedDraftSpec = {
        posiz: savedSpec.posiz || player.Posiz || "CC",
        role1: savedSpec.role1 !== undefined ? savedSpec.role1 : player.Role1 || null,
        role2: savedSpec.role2 !== undefined ? savedSpec.role2 : player.Role2 || null,
        traits: Array.isArray(savedSpec.traits_list) ? savedSpec.traits_list : parsePlayerSpecializations(player).traits,
        removedBaseTraits: Array.isArray(savedSpec.removed_base_traits) ? savedSpec.removed_base_traits : [],
      };
    } else {
      savedDraftSpec = parsePlayerSpecializations(player);
    }

    const specChanged =
      specializationsDraft.posiz !== savedDraftSpec.posiz ||
      specializationsDraft.role1 !== savedDraftSpec.role1 ||
      specializationsDraft.role2 !== savedDraftSpec.role2 ||
      (specializationsDraft.removedBaseTraits || []).join(",") !== (savedDraftSpec.removedBaseTraits || []).join(",") ||
      specializationsDraft.traits.map((t) => `${t.id}:${t.tier}`).sort().join(",") !==
        savedDraftSpec.traits.map((t) => `${t.id}:${t.tier}`).sort().join(",");

    return increasesChanged || specChanged;
  }, [player, increases, specializationsDraft, currentTrainingRecord]);

  // Gestione incremento/decremento singolo gruppo attributi
  const setIncrease = (key: string, value: number) => {
    const clamped = Math.max(0, Math.min(25, value));
    const currentVal = increases[key] ?? 0;
    if (clamped === currentVal) return;

    const group = groupRows.find((g) => g.key === key);
    if (!group) return;

    if (clamped > currentVal) {
      const allMaxed = group.subs.every((s) => (preStats[s] ?? 0) + currentVal >= 99);
      if (allMaxed) {
        toast({
          title: "Limite Raggiunto",
          description: "Tutti gli attributi di questo gruppo hanno già raggiunto il valore massimo (99).",
        });
        return;
      }

      let diffCost = 0;
      for (let lvl = currentVal; lvl < clamped; lvl++) {
        diffCost += getSingleTickCost(group, preStats, lvl);
      }

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

  // Funzione SALVA ALLENAMENTI COMPLETI (Attributi + Ruoli + Tratti)
  const handleSaveTraining = async () => {
    if (!player) return;
    if (isRosterLocked) {
      toast({
        title: "Rose Congelate dalla Lega",
        description: "Le rose sono attualmente congelate dall'amministrazione. Non è possibile salvare nuovi allenamenti.",
        variant: "destructive",
      });
      return;
    }
    if (xpRemaining < 0) {
      toast({
        title: "Attenzione",
        description: "Il costo complessivo degli allenamenti supera gli XP a disposizione.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    const playerId = Number(player.ID);

    try {
      if (!hasAnyDraftChanges) {
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

      const serializedSpec = serializeSpecializationsForDb(specializationsDraft);
      const normalizedInc = normalizeIncreases(increases);
      const payloadIncreases = {
        ...normalizedInc,
        specializations: serializedSpec,
      };

      const nowIso = new Date().toISOString();
      const payload = {
        PlayerID: playerId,
        Squadra: currentTeam || player.Squadra,
        status: "draft" as const,
        increases: payloadIncreases,
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
          specializations: specializationsDraft,
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
        description: `Stato salvato per ${player.Nome} ${player.Cognome}. Spesa: ${totalCost} XP. OVR stimato: ${postOverall} (+${postOverall - preOverall}).`,
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

  // Funzione RESET VALORI ORIGINALI (Annulla tutte le modifiche e cancella bozza da an_player_training)
  const handleResetToOriginal = async () => {
    if (!player) return;
    setIsResetting(true);
    const playerId = Number(player.ID);

    try {
      setIncreases(emptyIncreases());
      setSpecializationsDraft(parsePlayerSpecializations(player));

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
        description: `Tutti gli allenamenti, ruoli e tratti di ${player.Nome} ${player.Cognome} sono tornati ai valori originali.`,
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
      if (roleFilter !== "ALL") {
        if (roleFilter === "POR" && p.Posiz !== "POR") return false;
        if (roleFilter === "DIF" && !["DC", "TD", "TS", "DFC", "TER"].includes(p.Posiz)) return false;
        if (roleFilter === "CEN" && !["CDC", "CC", "ED", "ES", "COC", "CEN"].includes(p.Posiz)) return false;
        if (roleFilter === "ATT" && !["AD", "AS", "AT", "ATT"].includes(p.Posiz)) return false;
      }
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
    const r = (specializationsDraft.posiz || player?.Posiz || "CC").toUpperCase();
    return roleWeights[r] || roleWeights["CC"] || {};
  }, [player, specializationsDraft.posiz]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-6 space-y-6 max-w-7xl">
        <RequireAuthPrompt />

        {/* ========================================================================= */}
        {/* HEADER DELLA PAGINA CON TITOLO, SELETTORE SQUADRA E ROSTER LOCK BANNER    */}
        {/* ========================================================================= */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/80 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
                <Dumbbell className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground flex items-center gap-2">
                  Centro Allenamenti
                  <Badge variant="outline" className="text-xs font-mono font-bold border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                    Stagione Attiva
                  </Badge>
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Potenzia gli attributi, modifica il ruolo tattico e acquista Tratti &amp; Stili di Gioco per la tua rosa.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <AdminTeamSelector />
          </div>
        </div>

        {/* Banner Avviso Blocco Rose */}
        {isRosterLocked && (
          <div className="p-4 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center gap-3 shadow-sm">
            <Lock className="h-5 w-5 shrink-0" />
            <div className="text-xs sm:text-sm">
              <span className="font-bold">Rose Congelate dalla Lega:</span> le modifiche agli allenamenti sono attualmente in sola visualizzazione. Il salvataggio sarà riabilitato dall'amministrazione alla riapertura delle operazioni di mercato.
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <RefreshCw className="h-8 w-8 animate-spin text-emerald-500" />
            <p className="text-sm font-medium text-muted-foreground">
              Caricamento giocatori e sessioni di allenamento...
            </p>
          </div>
        ) : players.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground">
            Nessun giocatore trovato per la squadra selezionata ({effectiveTeamFullName || currentTeam}).
          </Card>
        ) : (
          <>
            {/* ========================================================================= */}
            {/* TELEMETRY COMMAND HUD: RECAP COMPLETO OVERALL & XP                        */}
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
                      <Badge className={`absolute -bottom-1 -right-1 text-[10px] px-1.5 py-0 font-bold border ${getRoleColor(specializationsDraft.posiz || player.Posiz)}`}>
                        {specializationsDraft.posiz || player.Posiz}
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
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground flex-wrap">
                        <span>{player.Età} anni</span>
                        <span>•</span>
                        <span>Piede: {player.Piede || "Dx"}</span>
                        <span>•</span>
                        <span>{player.Altezza || "180"} cm</span>
                        {specializationsDraft.posiz !== player.Posiz && (
                          <>
                            <span>•</span>
                            <Badge variant="outline" className="text-[9px] px-1 py-0 bg-amber-500/10 text-amber-500 border-amber-500/30">
                              Ex {player.Posiz}
                            </Badge>
                          </>
                        )}
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
                        disabled={!player || !hasUnsavedChanges || xpRemaining < 0 || isSaving || isResetting || isRosterLocked}
                        title={isRosterLocked ? "Rose congelate dalla Lega: salvataggio disabilitato" : undefined}
                        onClick={handleSaveTraining}
                        className="h-8 px-3 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
                      >
                        <Save className="h-3.5 w-3.5 mr-1.5" />
                        {isSaving ? "Salvataggio..." : "Salva"}
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!player || (!hasAnyDraftChanges && !hasSavedTraining) || isResetting || isSaving}
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
            {/* CORPO DELLA PAGINA: SIDEBAR CALCIATORI + TABS SEZIONE CENTRALE + RIEPILOGO */}
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
                          const hasSaved = !!rec;

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

                {/* Guida Rapida Costi XP */}
                <Card className="border-border/60 bg-muted/20 text-xs p-3.5 space-y-2.5">
                  <div className="flex items-center gap-1.5 font-bold text-foreground">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Regolamento Costi XP Ufficiali</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground leading-relaxed space-y-2">
                    <div>
                      <strong className="text-foreground">Attributi (Dinamico):</strong>
                      <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 font-mono text-[10px] mt-1">
                        <span>&gt;90: 50 XP</span>
                        <span>&gt;80: 30 XP</span>
                        <span>&gt;70: 15 XP</span>
                        <span>&gt;60: 8 XP</span>
                        <span>&gt;50: 5 XP</span>
                        <span>&gt;30: 3 XP</span>
                      </div>
                    </div>
                    <div className="pt-1 border-t border-border/40">
                      <strong className="text-foreground">Ruolo &amp; Ruoli+:</strong>
                      <ul className="list-disc list-inside space-y-0.5 text-[10px] mt-0.5">
                        <li>Cambio Ruolo: <strong>40 XP</strong> (1° Ruolo+ gratis)</li>
                        <li>2° Ruolo+: <strong>100 XP</strong> (max 2)</li>
                        <li>Swap Ruolo+: <strong>60 XP</strong></li>
                        <li>Upgrade Ruolo++: <strong>100 XP</strong> (≥84 OVR)</li>
                      </ul>
                    </div>
                    <div className="pt-1 border-t border-border/40">
                      <strong className="text-foreground">Tratti &amp; Stili (Max 5, 1 Oro):</strong>
                      <ul className="list-disc list-inside space-y-0.5 text-[10px] mt-0.5">
                        <li>Tratto Argento: <strong>60 XP</strong> (Elimina: 40 XP)</li>
                        <li>1° Tratto Oro: <strong>Gratuito</strong> a ≥84 OVR</li>
                        <li>Swap Tratto Oro: <strong>70 XP</strong></li>
                      </ul>
                    </div>
                  </div>
                </Card>
              </div>

              {/* ------------------------------------------------------------- */}
              {/* COLONNA CENTRALE: LE DUE SCHEDE (ATTRIBUTI vs RUOLI & TRATTI) */}
              {/* ------------------------------------------------------------- */}
              <div className="col-span-12 lg:col-span-6 space-y-4">
                <Tabs defaultValue="attributi" className="w-full">
                  <TabsList className="w-full grid grid-cols-2 h-11 bg-muted/40 p-1 rounded-xl">
                    <TabsTrigger value="attributi" className="font-bold text-xs sm:text-sm gap-1.5">
                      <TrendingUp className="h-4 w-4" /> Gruppi Attributi
                    </TabsTrigger>
                    <TabsTrigger value="specializzazioni" className="font-bold text-xs sm:text-sm gap-1.5">
                      <Sparkles className="h-4 w-4" /> Ruoli &amp; Tratti Speciali
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

                  {/* TAB 2: RUOLI & TRATTI UNIFICATI */}
                  <TabsContent value="specializzazioni" className="mt-4">
                    {player ? (
                      <UnifiedRoleAndTraitSystem
                        player={player}
                        postStats={postStats}
                        postOverall={postOverall}
                        draft={specializationsDraft}
                        onDraftChange={setSpecializationsDraft}
                        xpAvailable={xpRemaining}
                        isRosterLocked={isRosterLocked}
                      />
                    ) : (
                      <Card className="py-12 text-center text-muted-foreground border-dashed">
                        Seleziona un giocatore dalla rosa a sinistra per gestire ruoli e tratti.
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

                    {/* Breakdown Costi XP per Categoria */}
                    <div className="space-y-2 p-3 rounded-xl bg-muted/20 border border-border/60 text-xs">
                      <span className="font-bold text-foreground block text-[11px] uppercase tracking-wider">
                        Ripartizione Costo XP:
                      </span>
                      <div className="space-y-1 font-mono">
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span>Attributi:</span>
                          <span className="font-bold text-foreground">-{attributeCost} XP</span>
                        </div>
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span>Ruoli (+/++):</span>
                          <span className="font-bold text-foreground">-{specCostSummary.roleCost} XP</span>
                        </div>
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span>Tratti &amp; Stili:</span>
                          <span className="font-bold text-foreground">-{specCostSummary.traitCost} XP</span>
                        </div>
                        <div className="pt-1 border-t border-border/40 flex items-center justify-between font-extrabold text-foreground">
                          <span>Totale Speso:</span>
                          <span className="text-emerald-600 dark:text-emerald-400">-{totalCost} XP</span>
                        </div>
                      </div>
                    </div>

                    {/* Dettagli Specializzazioni Modificate */}
                    {(specCostSummary.roleBreakdown.length > 0 || specCostSummary.traitBreakdown.length > 0) && (
                      <div className="space-y-1.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs">
                        <span className="font-bold text-amber-500 block text-[10px] uppercase">
                          Modifiche Ruolo &amp; Tratti:
                        </span>
                        <ul className="space-y-1 text-[11px] text-muted-foreground">
                          {specCostSummary.roleBreakdown.map((r, i) => (
                            <li key={`rb-${i}`} className="flex items-start gap-1">
                              <span className="text-amber-500 font-bold">•</span> {r}
                            </li>
                          ))}
                          {specCostSummary.traitBreakdown.map((t, i) => (
                            <li key={`tb-${i}`} className="flex items-start gap-1">
                              <span className="text-amber-500 font-bold">•</span> {t}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Elenco dei gruppi incrementati */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        <span>Gruppi Attributi Allenati</span>
                        <span>{activeGroupsSummary.length} Attivi</span>
                      </div>

                      {activeGroupsSummary.length === 0 ? (
                        <div className="p-3 rounded-xl border border-dashed border-border text-center text-xs text-muted-foreground leading-relaxed">
                          Nessun gruppo ancora potenziato.<br />
                          Usa i tasti <strong>+</strong> nella griglia centrale.
                        </div>
                      ) : (
                        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                          {activeGroupsSummary.map((item) => (
                            <div
                              key={item.key}
                              className="p-2 rounded-xl bg-muted/30 border border-border/60 flex items-center justify-between text-xs"
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
                        disabled={!player || !hasUnsavedChanges || xpRemaining < 0 || isSaving || isResetting || isRosterLocked}
                        title={isRosterLocked ? "Rose congelate dalla Lega: salvataggio disabilitato" : undefined}
                        onClick={handleSaveTraining}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {isSaving ? "Salvataggio..." : "Salva Allenamenti"}
                      </Button>

                      <Button
                        variant="outline"
                        className="w-full text-xs font-semibold text-muted-foreground hover:text-rose-500 hover:border-rose-500/40"
                        disabled={!player || (!hasAnyDraftChanges && !hasSavedTraining) || isResetting || isSaving}
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

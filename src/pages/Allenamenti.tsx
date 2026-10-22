import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useMemo, useState } from "react";
import { Player } from "@/types/player";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Plus, Minus, TrendingUp, Award, Save, RotateCcw, 
  CheckCircle2, Clock, Sparkles 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import TraitSystem from "@/components/training/TraitSystem";
import RoleSystem from "@/components/training/RoleSystem";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/supabaseClient";
import { PLAYER_TABLE, PLAYER_TABLE_TRAINING } from "@/constants/App";
import { useQueryClient } from "@tanstack/react-query";
import { getRoleColor } from "@/utils/functions";

/* NOMI DELLE SINGOLE STATISTICHE */
export type StatKey =
  | "PREP"  | "POSP"  | "RINP"  | "RIFP"  | "TUFP"  | "CONT"  | "SCIV"  | "MARC"  | "AGGR"  | "INTR"  | "PASC"  | "PASL"  | "CRSS"  | "CTRP"
  | "VISI"  | "EFFT"  | "PTIR"  | "TIRD"  | "TIRV"  | "DRBL"  | "PIAZ"  | "FINA"  | "ACCL"  | "VELO"  | "AGIL"  | "RESI"  | "EQLB"  | "FRZA"
  | "TSTA"  | "RIFL"  | "ELEV"  | "PNIZ"  | "CRIG";

export const statMeta: Record<StatKey, { label: string; short?: string }> = {
  PREP: { label: "POR Presa", short: "PREP" },
  POSP: { label: "POR Posizionamento", short: "POSP" },
  RINP: { label: "POR Rinvio", short: "RINP" },
  RIFP: { label: "POR Riflessi", short: "RIFP" },
  TUFP: { label: "POR Tuffo", short: "TUFP" },
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
  TIRD: { label: "Tiri dalla Distanza", short: "TIRD" },
  TIRV: { label: "Tiri al Volo", short: "TIRV" },
  DRBL: { label: "Dribbling", short: "DRBL" },
  PIAZ: { label: "Piazzamento", short: "PIAZ" },
  FINA: { label: "Finalizzazione", short: "FINA" },
  ACCL: { label: "Accelerazione", short: "ACCL" },
  VELO: { label: "Velocità", short: "VELO" },
  AGIL: { label: "Agilità", short: "AGIL" },
  RESI: { label: "Resistenza", short: "RESI" },
  EQLB: { label: "Equilibrio", short: "EQLB" },
  FRZA: { label: "Forza", short: "FRZA" },
  TSTA: { label: "Colpi di Testa", short: "TSTA" },
  RIFL: { label: "Riflessi", short: "RIFL" },
  ELEV: { label: "Elevazione", short: "ELEV" },
  PNIZ: { label: "Punizioni", short: "PNIZ" },
  CRIG: { label: "Rigori", short: "CRIG" },
};

export const groupRows: { key: string; label: string; subs: StatKey[] }[] = [
  { key: "PORT", label: "POR Tecnico", subs: ["PREP", "POSP", "RINP"] },
  { key: "PORF", label: "POR Fisico", subs: ["RIFP", "TUFP"] },
  { key: "DIFF", label: "DIF Fisico", subs: ["CONT", "SCIV"] },
  { key: "DIFM", label: "DIF Mentale", subs: ["MARC", "AGGR", "INTR"] },
  { key: "CENP", label: "CEN Passaggi", subs: ["PASC", "PASL", "CRSS"] },
  { key: "CENG", label: "CEN Gestione", subs: ["CTRP", "VISI", "EFFT"] },
  { key: "ATTT", label: "ATT Tiri", subs: ["PTIR", "TIRD", "TIRV"] },
  { key: "ATTC", label: "ATT Controllo", subs: ["DRBL", "PIAZ", "FINA"] },
  { key: "FISV", label: "FIS Velocità", subs: ["ACCL", "VELO", "AGIL"] },
  { key: "FISP", label: "FIS Potenza", subs: ["RESI", "EQLB", "FRZA"] },
  { key: "FISR", label: "FIS Prontezza", subs: ["TSTA", "RIFL", "ELEV"] },
  { key: "CALC", label: "Calci piazzati", subs: ["PNIZ", "CRIG"] },
];

const COST_PER_POINT = 1;

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
    TSTA: 0, RIFL: 11, ELEV: 0, PNIZ: 0, CRIG: 0,
  },
  'DC': {
    PREP: 0, POSP: 0, RINP: 0, RIFP: 0, TUFP: 0,
    CONT: 17, SCIV: 10, MARC: 14, AGGR: 7, INTR: 13,
    PASC: 5, PASL: 0, CRSS: 0, CTRP: 4, VISI: 0, EFFT: 0,
    PTIR: 0, TIRD: 0, TIRV: 0, DRBL: 0, PIAZ: 0, FINA: 0,
    ACCL: 0, VELO: 2, AGIL: 0, RESI: 0, EQLB: 0, FRZA: 10,
    TSTA: 10, RIFL: 5, ELEV: 3, PNIZ: 0, CRIG: 0,
  },
  'DFC': {
    PREP: 0, POSP: 0, RINP: 0, RIFP: 0, TUFP: 0,
    CONT: 17, SCIV: 10, MARC: 14, AGGR: 7, INTR: 13,
    PASC: 5, PASL: 0, CRSS: 0, CTRP: 4, VISI: 0, EFFT: 0,
    PTIR: 0, TIRD: 0, TIRV: 0, DRBL: 0, PIAZ: 0, FINA: 0,
    ACCL: 0, VELO: 2, AGIL: 0, RESI: 0, EQLB: 0, FRZA: 10,
    TSTA: 10, RIFL: 5, ELEV: 3, PNIZ: 0, CRIG: 0,
  },
  'TS': {
    PREP: 0, POSP: 0, RINP: 0, RIFP: 0, TUFP: 0,
    CONT: 11, SCIV: 14, MARC: 8, AGGR: 0, INTR: 12,
    PASC: 7, PASL: 0, CRSS: 9, CTRP: 7, VISI: 0, EFFT: 0,
    PTIR: 0, TIRD: 0, TIRV: 0, DRBL: 0, PIAZ: 0, FINA: 0,
    ACCL: 5, VELO: 7, AGIL: 0, RESI: 8, EQLB: 0, FRZA: 0,
    TSTA: 4, RIFL: 8, ELEV: 0, PNIZ: 0, CRIG: 0,
  },
  'DFS': {
    PREP: 0, POSP: 0, RINP: 0, RIFP: 0, TUFP: 0,
    CONT: 11, SCIV: 14, MARC: 8, AGGR: 0, INTR: 12,
    PASC: 7, PASL: 0, CRSS: 9, CTRP: 7, VISI: 0, EFFT: 0,
    PTIR: 0, TIRD: 0, TIRV: 0, DRBL: 0, PIAZ: 0, FINA: 0,
    ACCL: 5, VELO: 7, AGIL: 0, RESI: 8, EQLB: 0, FRZA: 0,
    TSTA: 4, RIFL: 8, ELEV: 0, PNIZ: 0, CRIG: 0,
  },
  'TD': {
    PREP: 0, POSP: 0, RINP: 0, RIFP: 0, TUFP: 0,
    CONT: 11, SCIV: 14, MARC: 8, AGGR: 0, INTR: 12,
    PASC: 7, PASL: 0, CRSS: 9, CTRP: 7, VISI: 0, EFFT: 0,
    PTIR: 0, TIRD: 0, TIRV: 0, DRBL: 0, PIAZ: 0, FINA: 0,
    ACCL: 5, VELO: 7, AGIL: 0, RESI: 8, EQLB: 0, FRZA: 0,
    TSTA: 4, RIFL: 8, ELEV: 0, PNIZ: 0, CRIG: 0,
  },
  'DFD': {
    PREP: 0, POSP: 0, RINP: 0, RIFP: 0, TUFP: 0,
    CONT: 11, SCIV: 14, MARC: 8, AGGR: 0, INTR: 12,
    PASC: 7, PASL: 0, CRSS: 9, CTRP: 7, VISI: 0, EFFT: 0,
    PTIR: 0, TIRD: 0, TIRV: 0, DRBL: 0, PIAZ: 0, FINA: 0,
    ACCL: 5, VELO: 7, AGIL: 0, RESI: 8, EQLB: 0, FRZA: 0,
    TSTA: 4, RIFL: 8, ELEV: 0, PNIZ: 0, CRIG: 0,
  },
  'CDC': {
    PREP: 0, POSP: 0, RINP: 0, RIFP: 0, TUFP: 0,
    CONT: 12, SCIV: 5, MARC: 9, AGGR: 5, INTR: 14,
    PASC: 14, PASL: 10, CRSS: 0, CTRP: 10, VISI: 4, EFFT: 0,
    PTIR: 0, TIRD: 0, TIRV: 0, DRBL: 0, PIAZ: 0, FINA: 0,
    ACCL: 0, VELO: 0, AGIL: 0, RESI: 6, EQLB: 0, FRZA: 4,
    TSTA: 0, RIFL: 7, ELEV: 0, PNIZ: 0, CRIG: 0,
  },
  'CC': {
    PREP: 0, POSP: 0, RINP: 0, RIFP: 0, TUFP: 0,
    CONT: 5, SCIV: 0, MARC: 0, AGGR: 0, INTR: 5,
    PASC: 17, PASL: 13, CRSS: 0, CTRP: 14, VISI: 13, EFFT: 0,
    PTIR: 0, TIRD: 4, TIRV: 0, DRBL: 7, PIAZ: 6, FINA: 2,
    ACCL: 0, VELO: 0, AGIL: 0, RESI: 6, EQLB: 0, FRZA: 0,
    TSTA: 0, RIFL: 8, ELEV: 0, PNIZ: 0, CRIG: 0,
  },
  'ED': {
    PREP: 0, POSP: 0, RINP: 0, RIFP: 0, TUFP: 0,
    CONT: 0, SCIV: 0, MARC: 0, AGGR: 0, INTR: 0,
    PASC: 11, PASL: 5, CRSS: 10, CTRP: 13, VISI: 7, EFFT: 0,
    PTIR: 0, TIRD: 0, TIRV: 0, DRBL: 15, PIAZ: 8, FINA: 6,
    ACCL: 7, VELO: 6, AGIL: 0, RESI: 5, EQLB: 0, FRZA: 0,
    TSTA: 0, RIFL: 7, ELEV: 0, PNIZ: 0, CRIG: 0,
  },
  'ES': {
    PREP: 0, POSP: 0, RINP: 0, RIFP: 0, TUFP: 0,
    CONT: 0, SCIV: 0, MARC: 0, AGGR: 0, INTR: 0,
    PASC: 11, PASL: 5, CRSS: 10, CTRP: 13, VISI: 7, EFFT: 0,
    PTIR: 0, TIRD: 0, TIRV: 0, DRBL: 15, PIAZ: 8, FINA: 6,
    ACCL: 7, VELO: 6, AGIL: 0, RESI: 5, EQLB: 0, FRZA: 0,
    TSTA: 0, RIFL: 7, ELEV: 0, PNIZ: 0, CRIG: 0,
  },
  'COC': {
    PREP: 0, POSP: 0, RINP: 0, RIFP: 0, TUFP: 0,
    CONT: 0, SCIV: 0, MARC: 0, AGGR: 0, INTR: 0,
    PASC: 16, PASL: 4, CRSS: 0, CTRP: 15, VISI: 14, EFFT: 0,
    PTIR: 0, TIRD: 5, TIRV: 0, DRBL: 13, PIAZ: 9, FINA: 7,
    ACCL: 4, VELO: 3, AGIL: 3, RESI: 0, EQLB: 0, FRZA: 0,
    TSTA: 0, RIFL: 7, ELEV: 0, PNIZ: 0, CRIG: 0,
  },
  'TRQ': {
    PREP: 0, POSP: 0, RINP: 0, RIFP: 0, TUFP: 0,
    CONT: 0, SCIV: 0, MARC: 0, AGGR: 0, INTR: 0,
    PASC: 16, PASL: 4, CRSS: 0, CTRP: 15, VISI: 14, EFFT: 0,
    PTIR: 0, TIRD: 5, TIRV: 0, DRBL: 13, PIAZ: 9, FINA: 7,
    ACCL: 4, VELO: 3, AGIL: 3, RESI: 0, EQLB: 0, FRZA: 0,
    TSTA: 0, RIFL: 7, ELEV: 0, PNIZ: 0, CRIG: 0,
  },
  'AD': {
    PREP: 0, POSP: 0, RINP: 0, RIFP: 0, TUFP: 0,
    CONT: 0, SCIV: 0, MARC: 0, AGGR: 0, INTR: 0,
    PASC: 9, PASL: 0, CRSS: 9, CTRP: 14, VISI: 6, EFFT: 0,
    PTIR: 0, TIRD: 4, TIRV: 0, DRBL: 16, PIAZ: 9, FINA: 10,
    ACCL: 7, VELO: 6, AGIL: 3, RESI: 0, EQLB: 0, FRZA: 0,
    TSTA: 0, RIFL: 7, ELEV: 0, PNIZ: 0, CRIG: 0,
  },
  'AS': {
    PREP: 0, POSP: 0, RINP: 0, RIFP: 0, TUFP: 0,
    CONT: 0, SCIV: 0, MARC: 0, AGGR: 0, INTR: 0,
    PASC: 9, PASL: 0, CRSS: 9, CTRP: 14, VISI: 6, EFFT: 0,
    PTIR: 0, TIRD: 4, TIRV: 0, DRBL: 16, PIAZ: 9, FINA: 10,
    ACCL: 7, VELO: 6, AGIL: 3, RESI: 0, EQLB: 0, FRZA: 0,
    TSTA: 0, RIFL: 7, ELEV: 0, PNIZ: 0, CRIG: 0,
  },
  'AT': {
    PREP: 0, POSP: 0, RINP: 0, RIFP: 0, TUFP: 0,
    CONT: 0, SCIV: 0, MARC: 0, AGGR: 0, INTR: 0,
    PASC: 5, PASL: 0, CRSS: 0, CTRP: 10, VISI: 0, EFFT: 0,
    PTIR: 10, TIRD: 3, TIRV: 2, DRBL: 7, PIAZ: 13, FINA: 18,
    ACCL: 4, VELO: 5, AGIL: 0, RESI: 0, EQLB: 0, FRZA: 5,
    TSTA: 10, RIFL: 8, ELEV: 0, PNIZ: 0, CRIG: 0,
  },
  'AC': {
    PREP: 0, POSP: 0, RINP: 0, RIFP: 0, TUFP: 0,
    CONT: 0, SCIV: 0, MARC: 0, AGGR: 0, INTR: 0,
    PASC: 5, PASL: 0, CRSS: 0, CTRP: 10, VISI: 0, EFFT: 0,
    PTIR: 10, TIRD: 3, TIRV: 2, DRBL: 7, PIAZ: 13, FINA: 18,
    ACCL: 4, VELO: 5, AGIL: 0, RESI: 0, EQLB: 0, FRZA: 5,
    TSTA: 10, RIFL: 8, ELEV: 0, PNIZ: 0, CRIG: 0,
  },
  'PC': {
    PREP: 0, POSP: 0, RINP: 0, RIFP: 0, TUFP: 0,
    CONT: 0, SCIV: 0, MARC: 0, AGGR: 0, INTR: 0,
    PASC: 5, PASL: 0, CRSS: 0, CTRP: 10, VISI: 0, EFFT: 0,
    PTIR: 10, TIRD: 3, TIRV: 2, DRBL: 7, PIAZ: 13, FINA: 18,
    ACCL: 4, VELO: 5, AGIL: 0, RESI: 0, EQLB: 0, FRZA: 5,
    TSTA: 10, RIFL: 8, ELEV: 0, PNIZ: 0, CRIG: 0,
  },
  'SP': {
    PREP: 0, POSP: 0, RINP: 0, RIFP: 0, TUFP: 0,
    CONT: 0, SCIV: 0, MARC: 0, AGGR: 0, INTR: 0,
    PASC: 5, PASL: 0, CRSS: 0, CTRP: 10, VISI: 0, EFFT: 0,
    PTIR: 10, TIRD: 3, TIRV: 2, DRBL: 7, PIAZ: 13, FINA: 18,
    ACCL: 4, VELO: 5, AGIL: 0, RESI: 0, EQLB: 0, FRZA: 5,
    TSTA: 10, RIFL: 8, ELEV: 0, PNIZ: 0, CRIG: 0,
  },
  'ATT': {
    PREP: 0, POSP: 0, RINP: 0, RIFP: 0, TUFP: 0,
    CONT: 0, SCIV: 0, MARC: 0, AGGR: 0, INTR: 0,
    PASC: 5, PASL: 0, CRSS: 0, CTRP: 10, VISI: 0, EFFT: 0,
    PTIR: 10, TIRD: 3, TIRV: 2, DRBL: 7, PIAZ: 13, FINA: 18,
    ACCL: 4, VELO: 5, AGIL: 0, RESI: 0, EQLB: 0, FRZA: 5,
    TSTA: 10, RIFL: 8, ELEV: 0, PNIZ: 0, CRIG: 0,
  },
};

export const computeOverall = (stats: Record<StatKey, number>, role: string) => {
  const weights = roleWeights[role] || {};
  let totalWeighted = 0;
  let totalWeight = 0;
  for (const key in stats) {
    const weight = weights[key as StatKey] || 0;
    totalWeighted += stats[key as StatKey] * weight;
    totalWeight += weight;
  }
  if (totalWeight === 0) return 0;
  return Math.round(totalWeighted / totalWeight);
};

interface TrainingRecord {
  PlayerID: number;
  Squadra: string;
  status: "draft" | "confirmed";
  increases: Record<string, number>;
  xp_cost: number;
  pre_ovr: number | null;
  post_ovr: number | null;
  base_snapshot: any;
  updated_at: string;
  confirmed_at: string | null;
}

const normalizeIncreases = (raw: Record<string, number> | null | undefined): Record<string, number> => {
  const base = emptyIncreases();
  if (!raw || typeof raw !== "object") return base;
  for (const g of groupRows) {
    const val = Number(raw[g.key] ?? 0);
    base[g.key] = Number.isFinite(val) ? Math.max(0, Math.min(25, Math.round(val))) : 0;
  }
  return base;
};

const areIncreasesEqual = (a: Record<string, number>, b: Record<string, number>): boolean => {
  for (const g of groupRows) {
    if ((a[g.key] ?? 0) !== (b[g.key] ?? 0)) return false;
  }
  return true;
};

const hasAnyIncrease = (inc: Record<string, number>): boolean => {
  for (const g of groupRows) {
    if ((inc[g.key] ?? 0) > 0) return true;
  }
  return false;
};

const Allenamenti = () => {
  const { user } = useAuth();
  const userTeam = user?.team;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [players, setPlayers] = useState<Player[]>([]);
  const [trainingMap, setTrainingMap] = useState<Record<number, TrainingRecord>>({});
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Stato aumenti per il giocatore attualmente selezionato
  const [increases, setIncreases] = useState<Record<string, number>>(emptyIncreases);

  // Stati operativi UI
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Caricamento giocatori e allenamenti salvati da Supabase
  useEffect(() => {
    async function fetchTeamTrainingData() {
      if (!userTeam) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const [playersRes, trainingRes] = await Promise.all([
          supabase
            .from(PLAYER_TABLE)
            .select("*")
            .eq("Squadra", userTeam)
            .order("OVR", { ascending: false }),
          supabase
            .from(PLAYER_TABLE_TRAINING)
            .select("*")
            .eq("Squadra", userTeam),
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

        // Se non c'è ancora un giocatore selezionato, seleziona il primo
        if (basePlayers.length > 0 && selectedId === null) {
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
  }, [userTeam]);

  // Giocatore attualmente selezionato (valori originali da an_player)
  const player = useMemo(() => {
    if (!selectedId) return null;
    return players.find((p) => Number(p.ID) === selectedId) ?? null;
  }, [players, selectedId]);

  const currentTrainingRecord = useMemo(() => {
    if (!selectedId) return null;
    return trainingMap[selectedId] ?? null;
  }, [trainingMap, selectedId]);

  const savedIncreases = useMemo(() => {
    if (currentTrainingRecord && currentTrainingRecord.increases) {
      return normalizeIncreases(currentTrainingRecord.increases);
    }
    return emptyIncreases();
  }, [currentTrainingRecord]);

  const hasUnsavedChanges = useMemo(
    () => !areIncreasesEqual(increases, savedIncreases),
    [increases, savedIncreases]
  );

  const hasActiveIncreases = useMemo(() => hasAnyIncrease(increases), [increases]);
  const hasSavedTraining = Boolean(currentTrainingRecord && hasAnyIncrease(savedIncreases));

  // Cambio giocatore selezionato
  const handlePlayerChange = (id: number) => {
    if (!id) {
      setSelectedId(null);
      setIncreases(emptyIncreases());
      return;
    }
    setSelectedId(id);
    const rec = trainingMap[id];
    if (rec && rec.increases) {
      setIncreases(normalizeIncreases(rec.increases));
    } else {
      setIncreases(emptyIncreases());
    }
  };

  // Attributi originali (Pre-Allenamento) e simulati (Post-Allenamento)
  const preStats = useMemo(() => mapPlayerToStats(player), [player]);

  const postStats = useMemo(() => {
    const out = { ...preStats };
    for (const g of groupRows) {
      // L'aumento non può mai essere inferiore a 0: il valore del gruppo non scende mai sotto l'originale
      const inc = Math.max(0, increases[g.key] || 0);
      for (const sub of g.subs) {
        out[sub] = (preStats[sub] ?? 0) + inc;
      }
    }
    return out;
  }, [preStats, increases]);

  // Calcolo XP e Costi
  const totalCost = useMemo(
    () => groupRows.reduce((s, g) => s + Math.max(0, increases[g.key] || 0) * g.subs.length * COST_PER_POINT, 0),
    [increases]
  );

  const xpAvailable = player ? Number(player.XP ?? 0) : 0;
  const xpRemaining = xpAvailable - totalCost;

  // Modifica aumento di un singolo gruppo (mai sotto 0 = valore originale, e mai oltre gli XP disponibili)
  const setIncrease = (groupKey: string, rawValue: number) => {
    const group = groupRows.find((g) => g.key === groupKey);
    if (!group || !player) return;

    const currentInc = increases[groupKey] ?? 0;
    const costPerStep = group.subs.length * COST_PER_POINT;

    // Quanti punti aggiuntivi possiamo permetterci con gli XP rimasti
    const maxAdditionalSteps = Math.floor(Math.max(0, xpRemaining) / costPerStep);
    const maxAllowedForGroup = Math.min(25, currentInc + maxAdditionalSteps);

    const clampedVal = Math.max(0, Math.min(maxAllowedForGroup, Math.round(rawValue)));
    setIncreases((prev) => ({ ...prev, [groupKey]: clampedVal }));
  };

  // Calcolo Overall con le regole ponderate per ruolo
  const preOverall = useMemo(() => computeOverall(preStats, player?.Posiz ?? ""), [preStats, player?.Posiz]);
  const postOverall = useMemo(() => computeOverall(postStats, player?.Posiz ?? ""), [postStats, player?.Posiz]);

  // Oggetto giocatore arricchito con le statistiche e l'OVR post-allenamento per Tratti e Ruolo+
  const playerWithPreviewStats = useMemo(() => {
    if (!player) return null;
    return {
      ...player,
      ...postStats,
      OVR: postOverall,
    } as Player;
  }, [player, postStats, postOverall]);

  // Callback quando RoleSystem o TraitSystem aggiornano il giocatore su DB
  const handlePlayerUpdate = (updatedPlayer: Player) => {
    setPlayers((prev) =>
      prev.map((p) => (Number(p.ID) === Number(updatedPlayer.ID) ? updatedPlayer : p))
    );
    queryClient.invalidateQueries({ queryKey: ["players"] });
  };

  // SALVA ALLENAMENTI (salva lo stato corrente in an_player_training senza modificare an_player)
  const handleSaveTraining = async () => {
    if (!player) return;
    if (xpRemaining < 0) {
      toast({
        title: "XP Insufficienti",
        description: "Il costo degli allenamenti supera i punti XP disponibili.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const playerId = Number(player.ID);

      // Se tutti gli aumenti sono stati riportati a 0, rimuoviamo il record da an_player_training
      if (!hasActiveIncreases) {
        const { error: delError } = await supabase
          .from(PLAYER_TABLE_TRAINING)
          .delete()
          .eq("PlayerID", playerId);
        if (delError) throw delError;

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
        Squadra: userTeam ?? player.Squadra,
        status: "draft" as const,
        increases: normalizeIncreases(increases),
        xp_cost: totalCost,
        pre_ovr: preOverall,
        post_ovr: postOverall,
        base_snapshot: {
          preStats,
          postStats,
          appliedIncreases: normalizeIncreases(increases),
          xpAvailable,
          xpCost: totalCost,
          xpRemaining,
          preOverall,
          postOverall,
          savedAt: nowIso,
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

      toast({
        title: "Allenamenti salvati",
        description: `Stato allenamenti salvato per ${player.Nome} ${player.Cognome}. Puoi modificarlo o resettarlo in qualsiasi momento.`,
      });
    } catch (err) {
      console.error("Error saving training:", err);
      toast({
        title: "Errore",
        description: "Impossibile salvare gli allenamenti.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // RESET AI VALORI ORIGINALI
  const handleResetToOriginal = async () => {
    if (!player) return;
    setIsResetting(true);
    try {
      const playerId = Number(player.ID);
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
        title: "Reset completato",
        description: `Gli attributi e i punti XP di ${player.Nome} ${player.Cognome} sono tornati ai valori originali.`,
      });
    } catch (err) {
      console.error("Error resetting training:", err);
      toast({
        title: "Errore",
        description: "Impossibile completare il reset.",
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
        .map((g) => ({
          ...g,
          inc: increases[g.key],
          cost: increases[g.key] * g.subs.length * COST_PER_POINT,
        })),
    [increases]
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Header Broadcast */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-border/80">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                Centro Sviluppo • {user?.teamFullName || userTeam || "Squadra"}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Centro Allenamenti & Sviluppo XP
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Pianifica e salva i miglioramenti dei tuoi giocatori in base ai punti XP accumulati.
            </p>
          </div>

          {/* Status Pill del giocatore selezionato */}
          {player && (
            <div className="flex flex-wrap items-center gap-2">
              {hasUnsavedChanges ? (
                <Badge variant="outline" className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 px-3 py-1 text-xs font-semibold gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  Modifiche non salvate
                </Badge>
              ) : hasSavedTraining ? (
                <Badge variant="outline" className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 px-3 py-1 text-xs font-semibold gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Allenamenti Salvati
                </Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground px-3 py-1 text-xs">
                  Valori Originali
                </Badge>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* ========================================================= */}
          {/* COLONNA SINISTRA: SELEZIONE GIOCATORE, XP & AZIONI */}
          {/* ========================================================= */}
          <div className="col-span-12 lg:col-span-3 space-y-4">
            <Card className="shadow-md border-border/80">
              <CardHeader className="bg-muted/20 border-b border-border/60 pb-4">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-emerald-500" />
                  <CardTitle className="text-base font-bold">Seleziona Giocatore</CardTitle>
                </div>
                <CardDescription className="text-xs">
                  Scegli un calciatore della rosa ({players.length} disponibili)
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <select
                  value={selectedId ?? ""}
                  onChange={(e) => handlePlayerChange(Number(e.target.value))}
                  disabled={loading}
                  className="w-full p-2.5 text-sm font-medium border border-border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-emerald-500/30 focus:outline-none"
                >
                  <option value="">Seleziona giocatore...</option>
                  {players.map((p) => {
                    const pId = Number(p.ID);
                    const rec = trainingMap[pId];
                    const isSaved = rec && hasAnyIncrease(normalizeIncreases(rec.increases));
                    const tag = isSaved ? " • [SALVATO]" : "";
                    return (
                      <option key={pId} value={pId}>
                        {p.Nome} {p.Cognome} ({p.Posiz} - OVR {p.OVR}) — {p.XP ?? 0} XP{tag}
                      </option>
                    );
                  })}
                </select>

                {player && (
                  <div className="p-3 rounded-xl bg-muted/30 border border-border/60 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm">{player.Nome} {player.Cognome}</div>
                      <div className="text-xs text-muted-foreground">Età: {player.Età} • Piede: {player.Piede}</div>
                    </div>
                    <Badge variant="outline" className={`${getRoleColor(player.Posiz)} font-bold`}>
                      {player.Posiz}
                    </Badge>
                  </div>
                )}

                {/* Contatori XP */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-xl border border-border/60 bg-card text-center">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      XP Disponibili
                    </div>
                    <div className="text-2xl font-extrabold font-mono text-foreground mt-1">
                      {xpAvailable}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl border border-border/60 bg-card text-center">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Costo Attuale
                    </div>
                    <div className="text-2xl font-extrabold font-mono text-amber-500 mt-1">
                      {totalCost > 0 ? `-${totalCost}` : "0"}
                    </div>
                  </div>
                </div>

                <div className={`p-3.5 rounded-xl border text-center transition-colors ${
                  xpRemaining < 0 
                    ? "bg-rose-500/10 border-rose-500/30 text-rose-500" 
                    : "bg-emerald-500/10 border-emerald-500/25"
                }`}>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Punti XP Rimasti
                  </div>
                  <div className={`text-3xl font-black font-mono mt-0.5 ${
                    xpRemaining < 0 ? "text-rose-500" : "text-emerald-600 dark:text-emerald-400"
                  }`}>
                    {xpRemaining}
                  </div>
                </div>

                {/* Pulsanti di Gestione: Salva Allenamenti & Reset */}
                <div className="space-y-2.5 pt-2 border-t border-border/60">
                  <Button
                    className="w-full justify-center font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md"
                    disabled={!player || !hasUnsavedChanges || xpRemaining < 0 || isSaving || isResetting}
                    onClick={handleSaveTraining}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? "Salvataggio..." : "Salva Allenamenti"}
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-center font-semibold text-muted-foreground hover:text-rose-500 hover:border-rose-500/40 hover:bg-rose-500/10"
                    disabled={!player || (!hasActiveIncreases && !hasSavedTraining) || isResetting || isSaving}
                    onClick={handleResetToOriginal}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    {isResetting ? "Ripristino..." : "Reset Valori Originali"}
                  </Button>
                </div>

                <div className="text-[11px] text-muted-foreground space-y-1 pt-1 leading-relaxed">
                  <p>• <strong>Salva Allenamenti:</strong> salva lo stato corrente degli allenamenti del giocatore; puoi sempre tornare indietro diminuendo i valori o usando Reset.</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ========================================================= */}
          {/* COLONNA CENTRALE: TABS ATTRIBUTI, RUOLO+, TRATTI */}
          {/* ========================================================= */}
          <div className="col-span-12 lg:col-span-6">
            <Tabs defaultValue="attributi" className="w-full">
              <TabsList className="w-full grid grid-cols-3 h-11">
                <TabsTrigger value="attributi" className="font-semibold text-xs sm:text-sm">Dettaglio Attributi</TabsTrigger>
                <TabsTrigger value="ruolo" className="font-semibold text-xs sm:text-sm">Ruolo & Ruolo+</TabsTrigger>
                <TabsTrigger value="tratti" className="font-semibold text-xs sm:text-sm">Tratti</TabsTrigger>
              </TabsList>

              <TabsContent value="attributi" className="mt-4">
                <Card className="shadow-md border-border/80">
                  <CardHeader className="bg-muted/20 border-b border-border/60 py-4 px-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-emerald-500" />
                        <div>
                          <CardTitle className="text-base font-bold">Gruppi di Attributi</CardTitle>
                          <CardDescription className="text-xs">
                            Ogni +1 al gruppo migliora tutti i sotto-attributi (1 XP per sotto-attributo). Il valore non può mai scendere sotto l'originale.
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-5 px-4 sm:px-5">
                    {!player ? (
                      <div className="py-12 text-center text-muted-foreground text-sm">
                        Seleziona un giocatore dalla colonna di sinistra per pianificare gli allenamenti.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {groupRows.map((g) => {
                          const inc = increases[g.key] ?? 0;
                          const stepCost = g.subs.length * COST_PER_POINT;
                          const groupTotalCost = inc * stepCost;
                          const hasChange = inc > 0;
                          const canIncrement = inc < 25 && xpRemaining >= stepCost;

                          return (
                            <Card
                              key={g.key}
                              className={`transition-all duration-200 ${
                                hasChange
                                  ? "border-emerald-500/40 bg-emerald-500/[0.03] shadow-sm"
                                  : "border-border/80 hover:border-border"
                              }`}
                            >
                              <CardHeader className="pb-2.5 pt-3.5 px-4 border-b border-border/40">
                                <div className="flex items-center justify-between gap-2">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <CardTitle className="text-sm font-bold">{g.label}</CardTitle>
                                      {hasChange && (
                                        <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[11px] font-mono px-1.5 py-0">
                                          +{inc} ({groupTotalCost} XP)
                                        </Badge>
                                      )}
                                    </div>
                                    <span className="text-[10px] text-muted-foreground font-mono">
                                      Costo: {stepCost} XP / livello
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1">
                                    <Button
                                      size="icon"
                                      variant="outline"
                                      className="h-7 w-7 rounded-lg"
                                      onClick={() => setIncrease(g.key, inc - 1)}
                                      disabled={inc <= 0}
                                      title="Diminuisci (fino al valore originale)"
                                    >
                                      <Minus className="h-3.5 w-3.5" />
                                    </Button>
                                    <input
                                      type="number"
                                      min={0}
                                      max={25}
                                      value={inc}
                                      onChange={(e) => setIncrease(g.key, Number(e.target.value || 0))}
                                      className={`w-11 h-7 px-1 text-center text-xs font-mono font-bold border rounded-lg bg-background focus:ring-2 focus:ring-emerald-500/30 focus:outline-none ${
                                        hasChange ? "border-emerald-500/50 text-emerald-600 dark:text-emerald-400" : "border-border text-foreground"
                                      }`}
                                    />
                                    <Button
                                      size="icon"
                                      variant="outline"
                                      className="h-7 w-7 rounded-lg"
                                      onClick={() => setIncrease(g.key, inc + 1)}
                                      disabled={!canIncrement}
                                      title={
                                        xpRemaining < stepCost
                                          ? `Servono ${stepCost} XP disponibili`
                                          : "Aumenta gruppo (+1)"
                                      }
                                    >
                                      <Plus className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent className="pt-2.5 pb-3 px-4">
                                <div className="space-y-1">
                                  <div className="flex items-center text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2 pb-0.5">
                                    <span className="flex-1">Attributo</span>
                                    <span className="w-12 text-center">Orig.</span>
                                    <span className="w-12 text-center">Nuovo</span>
                                  </div>
                                  {g.subs.map((s) => (
                                    <div
                                      key={s}
                                      className={`flex items-center py-1 px-2 rounded-md transition-colors ${
                                        hasChange ? "bg-emerald-500/10" : "hover:bg-muted/40"
                                      }`}
                                    >
                                      <span className="flex-1 text-xs font-medium text-foreground">
                                        {statMeta[s].label}
                                      </span>
                                      <span className="w-12 text-center font-mono text-xs text-muted-foreground">
                                        {preStats[s]}
                                      </span>
                                      <span
                                        className={`w-12 text-center font-mono text-xs font-bold ${
                                          hasChange
                                            ? "text-emerald-600 dark:text-emerald-400"
                                            : "text-foreground"
                                        }`}
                                      >
                                        {postStats[s]}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="ruolo" className="mt-4">
                {playerWithPreviewStats ? (
                  <RoleSystem
                    player={playerWithPreviewStats}
                    xpAvailable={xpRemaining}
                    onXpChange={() => {}}
                    onPlayerUpdate={handlePlayerUpdate}
                  />
                ) : (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      Seleziona un giocatore
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="tratti" className="mt-4">
                {playerWithPreviewStats ? (
                  <TraitSystem
                    player={playerWithPreviewStats}
                    xpAvailable={xpRemaining}
                    onXpChange={() => {}}
                    onPlayerUpdate={handlePlayerUpdate}
                  />
                ) : (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      Seleziona un giocatore
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* ========================================================= */}
          {/* COLONNA DESTRA: RIEPILOGO OVERALL & MODIFICHE */}
          {/* ========================================================= */}
          <div className="col-span-12 lg:col-span-3 space-y-4">
            <Card className="shadow-md border-border/80">
              <CardHeader className="bg-muted/20 border-b border-border/60 pb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-emerald-500" />
                  <CardTitle className="text-base font-bold">Impatto Overall</CardTitle>
                </div>
                <CardDescription className="text-xs">
                  Calcolo ponderato per il ruolo <strong>{player?.Posiz || "—"}</strong>
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                <div className="grid grid-cols-2 gap-3 items-stretch">
                  <div className="p-4 rounded-xl bg-muted/40 border border-border/60 text-center flex flex-col justify-center">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                      Originale
                    </div>
                    <div className="text-3xl font-extrabold font-mono text-foreground">
                      {preOverall}
                    </div>
                  </div>

                  <div className={`p-4 rounded-xl border text-center flex flex-col justify-center transition-all ${
                    postOverall > preOverall
                      ? "bg-emerald-500/15 border-emerald-500/40 shadow-sm"
                      : "bg-muted/40 border-border/60"
                  }`}>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                      Post-Training
                    </div>
                    <div className="flex items-center justify-center gap-1.5">
                      <span className={`text-3xl font-black font-mono ${
                        postOverall > preOverall ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"
                      }`}>
                        {postOverall}
                      </span>
                      {postOverall > preOverall && (
                        <Badge className="bg-emerald-500 text-white text-[10px] px-1.5 py-0 font-mono">
                          +{postOverall - preOverall}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Riepilogo Gruppi Migliorati */}
                <div className="space-y-2 pt-2 border-t border-border/60">
                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Riepilogo Incrementi Attivi
                  </div>
                  {activeGroupsSummary.length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-border text-center text-xs text-muted-foreground">
                      Nessun incremento selezionato. Usa i pulsanti <strong>+</strong> sui gruppi di attributi.
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                      {activeGroupsSummary.map((item) => (
                        <div
                          key={item.key}
                          className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/40 border border-border/60 text-xs"
                        >
                          <div>
                            <span className="font-semibold text-foreground">{item.label}</span>
                            <span className="block text-[10px] text-muted-foreground">
                              {item.subs.join(", ")}
                            </span>
                          </div>
                          <div className="text-right font-mono">
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                              +{item.inc}
                            </span>
                            <span className="block text-[10px] text-amber-500">
                              -{item.cost} XP
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Ultimo salvataggio registrato */}
                {hasSavedTraining && currentTrainingRecord?.updated_at && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Stato Salvato a Sistema</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      OVR {currentTrainingRecord.pre_ovr} &rarr; {currentTrainingRecord.post_ovr} ({currentTrainingRecord.xp_cost} XP impegnati) •{" "}
                      {new Date(currentTrainingRecord.updated_at).toLocaleString("it-IT")}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Allenamenti;

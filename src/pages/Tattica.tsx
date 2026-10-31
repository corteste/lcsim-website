import Navbar from "@/components/Navbar";
import PlayerDetails from "@/components/player/playerDetails";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Save,
  Users,
  Eye,
  LayoutDashboard,
  Shield,
  ClipboardList,
  Sparkles,
  RotateCcw,
  Search,
  Wand2,
  X,
  Info,
  CheckCircle2,
  Clock,
  Lock,
  ArrowLeftRight,
  UserPlus,
  AlertTriangle,
  GripVertical,
  Armchair,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { supabase } from "@/supabaseClient";
import { PLAYER_TABLE, TEAM_TACTIC_TABLE } from "../constants/App";
import { Player } from "../types/player";
import { getRoleColor, getValueColor, getPlayerImage, getPosGroup, getRoleTextColor } from "@/utils/functions";
import { useAuth } from "@/context/AuthContext";
import AdminTeamSelector from "@/components/AdminTeamSelector";
import RequireAuthPrompt from "@/components/RequireAuthPrompt";
import { FormationCountdown } from "@/components/FormationCountdown";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TacticsOverviewTab } from "@/components/tactics/TacticsOverviewTab";
import { TacticsEditorTab } from "@/components/tactics/TacticsEditorTab";
import { TeamTacticsCard } from "@/components/tactics/TeamTacticsCard";
import { PlayerInstructionsModal } from "@/components/tactics/PlayerInstructionsModal";
import {
  TacticalSettings,
  getDefaultTacticalSettings,
  sanitizeTacticalSettings,
  FC25_ROLES_BY_POSITION,
} from "@/types/tactics";
import { SlidersHorizontal } from "lucide-react";
import { LeagueDeadline } from "@/types/deadlines";
import { saveLineupSnapshot } from "@/services/deadlineService";

// ============================================================================
// ORDINAMENTO RUOLI UFFICIALE DEL PROGETTO (da Rose.tsx)
// ============================================================================
export const ROLE_PRIORITY: Record<string, number> = {
  POR: 0,
  DC: 1,
  TD: 2,
  TS: 3,
  CDC: 4,
  CC: 5,
  ED: 6,
  ES: 7,
  COC: 8,
  AD: 9,
  AS: 10,
  AT: 11,
  ATT: 12,
};

export function sortPlayersByRole(list: Player[]): Player[] {
  return list.slice().sort((a, b) => {
    const prioA = ROLE_PRIORITY[a.Posiz] ?? 99;
    const prioB = ROLE_PRIORITY[b.Posiz] ?? 99;
    if (prioA !== prioB) return prioA - prioB;
    return (b.OVR ?? 0) - (a.OVR ?? 0);
  });
}

// ============================================================================
// MODULI UFFICIALI EA SPORTS FC 25 (31 Moduli divisi per Difesa a 3, 4, 5)
// ============================================================================
export interface SlotPosition {
  x: string;
  y: string;
  label: string;
}

export interface FormationDef {
  id: string;
  name: string;
  category: "Difesa a 4" | "Difesa a 3" | "Difesa a 5";
  positions: SlotPosition[]; // 11 posizioni (0 = POR, 1..10 = giocatori di movimento)
}

export const EA_FC25_FORMATIONS: FormationDef[] = [
  // ================= DIFESA A 4 =================
  {
    id: "4-4-2",
    name: "4-4-2 (Classico)",
    category: "Difesa a 4",
    positions: [
      { x: "50%", y: "90%", label: "POR" },
      { x: "16%", y: "73%", label: "TS" },
      { x: "38%", y: "76%", label: "DC" },
      { x: "62%", y: "76%", label: "DC" },
      { x: "84%", y: "73%", label: "TD" },
      { x: "16%", y: "47%", label: "ES" },
      { x: "38%", y: "50%", label: "CC" },
      { x: "62%", y: "50%", label: "CC" },
      { x: "84%", y: "47%", label: "ED" },
      { x: "37%", y: "18%", label: "ATT" },
      { x: "63%", y: "18%", label: "ATT" },
    ],
  },
  {
    id: "4-4-2-holding",
    name: "4-4-2 (Contenimento)",
    category: "Difesa a 4",
    positions: [
      { x: "50%", y: "90%", label: "POR" },
      { x: "16%", y: "73%", label: "TS" },
      { x: "38%", y: "76%", label: "DC" },
      { x: "62%", y: "76%", label: "DC" },
      { x: "84%", y: "73%", label: "TD" },
      { x: "16%", y: "48%", label: "ES" },
      { x: "39%", y: "56%", label: "CDC" },
      { x: "61%", y: "56%", label: "CDC" },
      { x: "84%", y: "48%", label: "ED" },
      { x: "37%", y: "18%", label: "ATT" },
      { x: "63%", y: "18%", label: "ATT" },
    ],
  },
  {
    id: "4-3-3",
    name: "4-3-3 (Classico)",
    category: "Difesa a 4",
    positions: [
      { x: "50%", y: "90%", label: "POR" },
      { x: "16%", y: "73%", label: "TS" },
      { x: "38%", y: "76%", label: "DC" },
      { x: "62%", y: "76%", label: "DC" },
      { x: "84%", y: "73%", label: "TD" },
      { x: "28%", y: "50%", label: "CC" },
      { x: "50%", y: "53%", label: "CC" },
      { x: "72%", y: "50%", label: "CC" },
      { x: "18%", y: "22%", label: "AS" },
      { x: "50%", y: "16%", label: "ATT" },
      { x: "82%", y: "22%", label: "AD" },
    ],
  },
  {
    id: "4-3-3-holding",
    name: "4-3-3 (Contenimento)",
    category: "Difesa a 4",
    positions: [
      { x: "50%", y: "90%", label: "POR" },
      { x: "16%", y: "73%", label: "TS" },
      { x: "38%", y: "76%", label: "DC" },
      { x: "62%", y: "76%", label: "DC" },
      { x: "84%", y: "73%", label: "TD" },
      { x: "50%", y: "58%", label: "CDC" },
      { x: "30%", y: "46%", label: "CC" },
      { x: "70%", y: "46%", label: "CC" },
      { x: "18%", y: "22%", label: "AS" },
      { x: "50%", y: "16%", label: "ATT" },
      { x: "82%", y: "22%", label: "AD" },
    ],
  },
  {
    id: "4-3-3-defending",
    name: "4-3-3 (Difensivo)",
    category: "Difesa a 4",
    positions: [
      { x: "50%", y: "90%", label: "POR" },
      { x: "16%", y: "73%", label: "TS" },
      { x: "38%", y: "76%", label: "DC" },
      { x: "62%", y: "76%", label: "DC" },
      { x: "84%", y: "73%", label: "TD" },
      { x: "34%", y: "57%", label: "CDC" },
      { x: "66%", y: "57%", label: "CDC" },
      { x: "50%", y: "44%", label: "CC" },
      { x: "18%", y: "22%", label: "AS" },
      { x: "50%", y: "16%", label: "ATT" },
      { x: "82%", y: "22%", label: "AD" },
    ],
  },
  {
    id: "4-3-3-attack",
    name: "4-3-3 (Offensivo)",
    category: "Difesa a 4",
    positions: [
      { x: "50%", y: "90%", label: "POR" },
      { x: "16%", y: "73%", label: "TS" },
      { x: "38%", y: "76%", label: "DC" },
      { x: "62%", y: "76%", label: "DC" },
      { x: "84%", y: "73%", label: "TD" },
      { x: "32%", y: "53%", label: "CC" },
      { x: "68%", y: "53%", label: "CC" },
      { x: "50%", y: "38%", label: "COC" },
      { x: "18%", y: "22%", label: "AS" },
      { x: "50%", y: "16%", label: "ATT" },
      { x: "82%", y: "22%", label: "AD" },
    ],
  },
  {
    id: "4-3-3-false9",
    name: "4-3-3 (Falso 9)",
    category: "Difesa a 4",
    positions: [
      { x: "50%", y: "90%", label: "POR" },
      { x: "16%", y: "73%", label: "TS" },
      { x: "38%", y: "76%", label: "DC" },
      { x: "62%", y: "76%", label: "DC" },
      { x: "84%", y: "73%", label: "TD" },
      { x: "50%", y: "58%", label: "CDC" },
      { x: "30%", y: "47%", label: "CC" },
      { x: "70%", y: "47%", label: "CC" },
      { x: "18%", y: "20%", label: "AS" },
      { x: "50%", y: "28%", label: "COC" },
      { x: "82%", y: "20%", label: "AD" },
    ],
  },
  {
    id: "4-2-3-1",
    name: "4-2-3-1 (Largo)",
    category: "Difesa a 4",
    positions: [
      { x: "50%", y: "90%", label: "POR" },
      { x: "16%", y: "73%", label: "TS" },
      { x: "38%", y: "76%", label: "DC" },
      { x: "62%", y: "76%", label: "DC" },
      { x: "84%", y: "73%", label: "TD" },
      { x: "37%", y: "57%", label: "CDC" },
      { x: "63%", y: "57%", label: "CDC" },
      { x: "18%", y: "36%", label: "ES" },
      { x: "50%", y: "37%", label: "COC" },
      { x: "82%", y: "36%", label: "ED" },
      { x: "50%", y: "16%", label: "ATT" },
    ],
  },
  {
    id: "4-2-3-1-narrow",
    name: "4-2-3-1 (Stretto)",
    category: "Difesa a 4",
    positions: [
      { x: "50%", y: "90%", label: "POR" },
      { x: "16%", y: "73%", label: "TS" },
      { x: "38%", y: "76%", label: "DC" },
      { x: "62%", y: "76%", label: "DC" },
      { x: "84%", y: "73%", label: "TD" },
      { x: "37%", y: "57%", label: "CDC" },
      { x: "63%", y: "57%", label: "CDC" },
      { x: "26%", y: "36%", label: "COC" },
      { x: "50%", y: "38%", label: "COC" },
      { x: "74%", y: "36%", label: "COC" },
      { x: "50%", y: "16%", label: "ATT" },
    ],
  },
  {
    id: "4-2-1-3",
    name: "4-2-1-3",
    category: "Difesa a 4",
    positions: [
      { x: "50%", y: "90%", label: "POR" },
      { x: "16%", y: "73%", label: "TS" },
      { x: "38%", y: "76%", label: "DC" },
      { x: "62%", y: "76%", label: "DC" },
      { x: "84%", y: "73%", label: "TD" },
      { x: "36%", y: "56%", label: "CDC" },
      { x: "64%", y: "56%", label: "CDC" },
      { x: "50%", y: "39%", label: "COC" },
      { x: "18%", y: "22%", label: "AS" },
      { x: "50%", y: "16%", label: "ATT" },
      { x: "82%", y: "22%", label: "AD" },
    ],
  },
  {
    id: "4-1-2-1-2-narrow",
    name: "4-1-2-1-2 (Stretto)",
    category: "Difesa a 4",
    positions: [
      { x: "50%", y: "90%", label: "POR" },
      { x: "16%", y: "73%", label: "TS" },
      { x: "38%", y: "76%", label: "DC" },
      { x: "62%", y: "76%", label: "DC" },
      { x: "84%", y: "73%", label: "TD" },
      { x: "50%", y: "60%", label: "CDC" },
      { x: "30%", y: "48%", label: "CC" },
      { x: "70%", y: "48%", label: "CC" },
      { x: "50%", y: "35%", label: "COC" },
      { x: "37%", y: "17%", label: "ATT" },
      { x: "63%", y: "17%", label: "ATT" },
    ],
  },
  {
    id: "4-1-2-1-2-wide",
    name: "4-1-2-1-2 (Largo)",
    category: "Difesa a 4",
    positions: [
      { x: "50%", y: "90%", label: "POR" },
      { x: "16%", y: "73%", label: "TS" },
      { x: "38%", y: "76%", label: "DC" },
      { x: "62%", y: "76%", label: "DC" },
      { x: "84%", y: "73%", label: "TD" },
      { x: "50%", y: "60%", label: "CDC" },
      { x: "18%", y: "47%", label: "ES" },
      { x: "82%", y: "47%", label: "ED" },
      { x: "50%", y: "35%", label: "COC" },
      { x: "37%", y: "17%", label: "ATT" },
      { x: "63%", y: "17%", label: "ATT" },
    ],
  },
  {
    id: "4-3-1-2",
    name: "4-3-1-2",
    category: "Difesa a 4",
    positions: [
      { x: "50%", y: "90%", label: "POR" },
      { x: "16%", y: "73%", label: "TS" },
      { x: "38%", y: "76%", label: "DC" },
      { x: "62%", y: "76%", label: "DC" },
      { x: "84%", y: "73%", label: "TD" },
      { x: "28%", y: "52%", label: "CC" },
      { x: "50%", y: "55%", label: "CC" },
      { x: "72%", y: "52%", label: "CC" },
      { x: "50%", y: "35%", label: "COC" },
      { x: "37%", y: "17%", label: "ATT" },
      { x: "63%", y: "17%", label: "ATT" },
    ],
  },
  {
    id: "4-3-2-1",
    name: "4-3-2-1 (Albero di Natale)",
    category: "Difesa a 4",
    positions: [
      { x: "50%", y: "90%", label: "POR" },
      { x: "16%", y: "73%", label: "TS" },
      { x: "38%", y: "76%", label: "DC" },
      { x: "62%", y: "76%", label: "DC" },
      { x: "84%", y: "73%", label: "TD" },
      { x: "28%", y: "53%", label: "CC" },
      { x: "50%", y: "55%", label: "CC" },
      { x: "72%", y: "53%", label: "CC" },
      { x: "34%", y: "34%", label: "COC" },
      { x: "66%", y: "34%", label: "COC" },
      { x: "50%", y: "16%", label: "ATT" },
    ],
  },
  {
    id: "4-2-2-2",
    name: "4-2-2-2",
    category: "Difesa a 4",
    positions: [
      { x: "50%", y: "90%", label: "POR" },
      { x: "16%", y: "73%", label: "TS" },
      { x: "38%", y: "76%", label: "DC" },
      { x: "62%", y: "76%", label: "DC" },
      { x: "84%", y: "73%", label: "TD" },
      { x: "36%", y: "56%", label: "CDC" },
      { x: "64%", y: "56%", label: "CDC" },
      { x: "26%", y: "36%", label: "COC" },
      { x: "74%", y: "36%", label: "COC" },
      { x: "37%", y: "17%", label: "ATT" },
      { x: "63%", y: "17%", label: "ATT" },
    ],
  },
  {
    id: "4-1-4-1",
    name: "4-1-4-1",
    category: "Difesa a 4",
    positions: [
      { x: "50%", y: "90%", label: "POR" },
      { x: "16%", y: "73%", label: "TS" },
      { x: "38%", y: "76%", label: "DC" },
      { x: "62%", y: "76%", label: "DC" },
      { x: "84%", y: "73%", label: "TD" },
      { x: "50%", y: "60%", label: "CDC" },
      { x: "16%", y: "43%", label: "ES" },
      { x: "38%", y: "45%", label: "CC" },
      { x: "62%", y: "45%", label: "CC" },
      { x: "84%", y: "43%", label: "ED" },
      { x: "50%", y: "17%", label: "ATT" },
    ],
  },
  {
    id: "4-4-1-1",
    name: "4-4-1-1 (Attacco)",
    category: "Difesa a 4",
    positions: [
      { x: "50%", y: "90%", label: "POR" },
      { x: "16%", y: "73%", label: "TS" },
      { x: "38%", y: "76%", label: "DC" },
      { x: "62%", y: "76%", label: "DC" },
      { x: "84%", y: "73%", label: "TD" },
      { x: "16%", y: "50%", label: "ES" },
      { x: "38%", y: "53%", label: "CC" },
      { x: "62%", y: "53%", label: "CC" },
      { x: "84%", y: "50%", label: "ED" },
      { x: "50%", y: "33%", label: "COC" },
      { x: "50%", y: "16%", label: "ATT" },
    ],
  },
  {
    id: "4-5-1",
    name: "4-5-1 (Attacco)",
    category: "Difesa a 4",
    positions: [
      { x: "50%", y: "90%", label: "POR" },
      { x: "16%", y: "73%", label: "TS" },
      { x: "38%", y: "76%", label: "DC" },
      { x: "62%", y: "76%", label: "DC" },
      { x: "84%", y: "73%", label: "TD" },
      { x: "50%", y: "55%", label: "CC" },
      { x: "16%", y: "44%", label: "ES" },
      { x: "36%", y: "36%", label: "COC" },
      { x: "64%", y: "36%", label: "COC" },
      { x: "84%", y: "44%", label: "ED" },
      { x: "50%", y: "16%", label: "ATT" },
    ],
  },
  {
    id: "4-5-1-flat",
    name: "4-5-1 (Piatto)",
    category: "Difesa a 4",
    positions: [
      { x: "50%", y: "90%", label: "POR" },
      { x: "16%", y: "73%", label: "TS" },
      { x: "38%", y: "76%", label: "DC" },
      { x: "62%", y: "76%", label: "DC" },
      { x: "84%", y: "73%", label: "TD" },
      { x: "14%", y: "46%", label: "ES" },
      { x: "32%", y: "50%", label: "CC" },
      { x: "50%", y: "52%", label: "CC" },
      { x: "68%", y: "50%", label: "CC" },
      { x: "86%", y: "46%", label: "ED" },
      { x: "50%", y: "16%", label: "ATT" },
    ],
  },
  {
    id: "4-2-4",
    name: "4-2-4",
    category: "Difesa a 4",
    positions: [
      { x: "50%", y: "90%", label: "POR" },
      { x: "16%", y: "73%", label: "TS" },
      { x: "38%", y: "76%", label: "DC" },
      { x: "62%", y: "76%", label: "DC" },
      { x: "84%", y: "73%", label: "TD" },
      { x: "38%", y: "52%", label: "CC" },
      { x: "62%", y: "52%", label: "CC" },
      { x: "16%", y: "24%", label: "AS" },
      { x: "38%", y: "17%", label: "ATT" },
      { x: "62%", y: "17%", label: "ATT" },
      { x: "84%", y: "24%", label: "AD" },
    ],
  },

  // ================= DIFESA A 3 =================
  {
    id: "3-5-2",
    name: "3-5-2",
    category: "Difesa a 3",
    positions: [
      { x: "50%", y: "89%", label: "POR" },
      { x: "26%", y: "73%", label: "DC" },
      { x: "50%", y: "72%", label: "DC" },
      { x: "74%", y: "73%", label: "DC" },
      { x: "38%", y: "56%", label: "CDC" },
      { x: "62%", y: "56%", label: "CDC" },
      { x: "15%", y: "44%", label: "ES" },
      { x: "50%", y: "36%", label: "COC" },
      { x: "85%", y: "44%", label: "ED" },
      { x: "37%", y: "16%", label: "ATT" },
      { x: "63%", y: "16%", label: "ATT" },
    ],
  },
  {
    id: "3-4-1-2",
    name: "3-4-1-2",
    category: "Difesa a 3",
    positions: [
      { x: "50%", y: "89%", label: "POR" },
      { x: "26%", y: "73%", label: "DC" },
      { x: "50%", y: "72%", label: "DC" },
      { x: "74%", y: "73%", label: "DC" },
      { x: "15%", y: "46%", label: "ES" },
      { x: "38%", y: "51%", label: "CC" },
      { x: "62%", y: "51%", label: "CC" },
      { x: "85%", y: "46%", label: "ED" },
      { x: "50%", y: "34%", label: "COC" },
      { x: "37%", y: "16%", label: "ATT" },
      { x: "63%", y: "16%", label: "ATT" },
    ],
  },
  {
    id: "3-4-2-1",
    name: "3-4-2-1",
    category: "Difesa a 3",
    positions: [
      { x: "50%", y: "89%", label: "POR" },
      { x: "26%", y: "73%", label: "DC" },
      { x: "50%", y: "72%", label: "DC" },
      { x: "74%", y: "73%", label: "DC" },
      { x: "15%", y: "46%", label: "ES" },
      { x: "38%", y: "51%", label: "CC" },
      { x: "62%", y: "51%", label: "CC" },
      { x: "85%", y: "46%", label: "ED" },
      { x: "34%", y: "33%", label: "COC" },
      { x: "66%", y: "33%", label: "COC" },
      { x: "50%", y: "16%", label: "ATT" },
    ],
  },
  {
    id: "3-4-3",
    name: "3-4-3 (Piatto)",
    category: "Difesa a 3",
    positions: [
      { x: "50%", y: "89%", label: "POR" },
      { x: "26%", y: "73%", label: "DC" },
      { x: "50%", y: "72%", label: "DC" },
      { x: "74%", y: "73%", label: "DC" },
      { x: "15%", y: "46%", label: "ES" },
      { x: "38%", y: "50%", label: "CC" },
      { x: "62%", y: "50%", label: "CC" },
      { x: "85%", y: "46%", label: "ED" },
      { x: "20%", y: "22%", label: "AS" },
      { x: "50%", y: "16%", label: "ATT" },
      { x: "80%", y: "22%", label: "AD" },
    ],
  },
  {
    id: "3-4-3-diamond",
    name: "3-4-3 (Rombo)",
    category: "Difesa a 3",
    positions: [
      { x: "50%", y: "89%", label: "POR" },
      { x: "26%", y: "73%", label: "DC" },
      { x: "50%", y: "72%", label: "DC" },
      { x: "74%", y: "73%", label: "DC" },
      { x: "50%", y: "55%", label: "CDC" },
      { x: "18%", y: "46%", label: "ES" },
      { x: "82%", y: "46%", label: "ED" },
      { x: "50%", y: "35%", label: "COC" },
      { x: "20%", y: "21%", label: "AS" },
      { x: "50%", y: "15%", label: "ATT" },
      { x: "80%", y: "21%", label: "AD" },
    ],
  },
  {
    id: "3-1-4-2",
    name: "3-1-4-2",
    category: "Difesa a 3",
    positions: [
      { x: "50%", y: "89%", label: "POR" },
      { x: "26%", y: "73%", label: "DC" },
      { x: "50%", y: "72%", label: "DC" },
      { x: "74%", y: "73%", label: "DC" },
      { x: "50%", y: "57%", label: "CDC" },
      { x: "15%", y: "44%", label: "ES" },
      { x: "38%", y: "45%", label: "CC" },
      { x: "62%", y: "45%", label: "CC" },
      { x: "85%", y: "44%", label: "ED" },
      { x: "37%", y: "16%", label: "ATT" },
      { x: "63%", y: "16%", label: "ATT" },
    ],
  },

  // ================= DIFESA A 5 =================
  {
    id: "5-3-2",
    name: "5-3-2 (Contenimento)",
    category: "Difesa a 5",
    positions: [
      { x: "50%", y: "89%", label: "POR" },
      { x: "14%", y: "69%", label: "TS" },
      { x: "32%", y: "73%", label: "DC" },
      { x: "50%", y: "72%", label: "DC" },
      { x: "68%", y: "73%", label: "DC" },
      { x: "86%", y: "69%", label: "TD" },
      { x: "50%", y: "55%", label: "CDC" },
      { x: "32%", y: "43%", label: "CC" },
      { x: "68%", y: "43%", label: "CC" },
      { x: "37%", y: "16%", label: "ATT" },
      { x: "63%", y: "16%", label: "ATT" },
    ],
  },
  {
    id: "5-2-1-2",
    name: "5-2-1-2",
    category: "Difesa a 5",
    positions: [
      { x: "50%", y: "89%", label: "POR" },
      { x: "14%", y: "69%", label: "TS" },
      { x: "32%", y: "73%", label: "DC" },
      { x: "50%", y: "72%", label: "DC" },
      { x: "68%", y: "73%", label: "DC" },
      { x: "86%", y: "69%", label: "TD" },
      { x: "36%", y: "51%", label: "CC" },
      { x: "64%", y: "51%", label: "CC" },
      { x: "50%", y: "34%", label: "COC" },
      { x: "37%", y: "16%", label: "ATT" },
      { x: "63%", y: "16%", label: "ATT" },
    ],
  },
  {
    id: "5-2-3",
    name: "5-2-3",
    category: "Difesa a 5",
    positions: [
      { x: "50%", y: "89%", label: "POR" },
      { x: "14%", y: "69%", label: "TS" },
      { x: "32%", y: "73%", label: "DC" },
      { x: "50%", y: "72%", label: "DC" },
      { x: "68%", y: "73%", label: "DC" },
      { x: "86%", y: "69%", label: "TD" },
      { x: "36%", y: "50%", label: "CC" },
      { x: "64%", y: "50%", label: "CC" },
      { x: "20%", y: "22%", label: "AS" },
      { x: "50%", y: "16%", label: "ATT" },
      { x: "80%", y: "22%", label: "AD" },
    ],
  },
  {
    id: "5-4-1",
    name: "5-4-1 (Piatto)",
    category: "Difesa a 5",
    positions: [
      { x: "50%", y: "89%", label: "POR" },
      { x: "14%", y: "69%", label: "TS" },
      { x: "32%", y: "73%", label: "DC" },
      { x: "50%", y: "72%", label: "DC" },
      { x: "68%", y: "73%", label: "DC" },
      { x: "86%", y: "69%", label: "TD" },
      { x: "16%", "y": "46%", label: "ES" },
      { x: "38%", y: "49%", label: "CC" },
      { x: "62%", y: "49%", label: "CC" },
      { x: "84%", y: "46%", label: "ED" },
      { x: "50%", y: "16%", label: "ATT" },
    ],
  },
];

// ============================================================================
// VALUTAZIONE COMPATIBILITÀ RUOLO (Stile EA FC IQ)
// ============================================================================
export type RoleFit = "natural" | "adaptable" | "out";

export function evaluateRoleFit(playerPos: string | undefined, slotRole: string): RoleFit {
  if (!playerPos) return "out";
  const p = playerPos.toUpperCase();
  const s = slotRole.toUpperCase();

  if (p === s) return "natural";
  if ((p === "AT" && s === "ATT") || (p === "ATT" && s === "AT")) return "natural";

  // Portiere può fare solo il portiere
  if (p === "POR" || s === "POR") return "out";

  // Compatibilità affine tra ruoli vicini
  const adaptableMap: Record<string, string[]> = {
    DC: ["CDC", "TD", "TS"],
    TD: ["ED", "TS", "DC"],
    TS: ["ES", "TD", "DC"],
    CDC: ["CC", "DC"],
    CC: ["CDC", "COC", "ED", "ES"],
    COC: ["CC", "AT", "AD", "AS", "ED", "ES", "ATT"],
    ED: ["AD", "TD", "ES", "CC", "COC"],
    ES: ["AS", "TS", "ED", "CC", "COC"],
    AD: ["ED", "AS", "ATT", "COC"],
    AS: ["ES", "AD", "ATT", "COC"],
    AT: ["ATT", "COC", "AD", "AS"],
    ATT: ["AT", "AD", "AS", "COC"],
  };

  if (adaptableMap[s]?.includes(p)) return "adaptable";
  if (getPosGroup(p) === getPosGroup(s)) return "adaptable";
  return "out";
}

// ============================================================================
// ALGORITMO DI AUTO-SCHIERAMENTO MIGLIOR 11 PER IL MODULO SCELTO
// ============================================================================
export function computeBest11ForFormation(
  roster: Player[],
  formationDef: FormationDef
): (number | null)[] {
  const slots: (number | null)[] = Array(11).fill(null);
  const usedIds = new Set<number>();

  const sortedByOvr = roster.slice().sort((a, b) => (b.OVR ?? 0) - (a.OVR ?? 0));

  // Pass 1: Ruolo naturale esatto
  formationDef.positions.forEach((pos, idx) => {
    const match = sortedByOvr.find(
      (p) => !usedIds.has(Number(p.ID)) && evaluateRoleFit(p.Posiz, pos.label) === "natural"
    );
    if (match) {
      slots[idx] = Number(match.ID);
      usedIds.add(Number(match.ID));
    }
  });

  // Pass 2: Ruolo adattabile
  formationDef.positions.forEach((pos, idx) => {
    if (slots[idx] !== null) return;
    const match = sortedByOvr.find(
      (p) => !usedIds.has(Number(p.ID)) && evaluateRoleFit(p.Posiz, pos.label) === "adaptable"
    );
    if (match) {
      slots[idx] = Number(match.ID);
      usedIds.add(Number(match.ID));
    }
  });

  // Pass 3: Qualsiasi giocatore rimanente con OVR più alto (evitando POR fuori porta)
  formationDef.positions.forEach((pos, idx) => {
    if (slots[idx] !== null) return;
    const match =
      sortedByOvr.find(
        (p) => !usedIds.has(Number(p.ID)) && (pos.label === "POR" ? true : p.Posiz !== "POR")
      ) || sortedByOvr.find((p) => !usedIds.has(Number(p.ID)));
    if (match) {
      slots[idx] = Number(match.ID);
      usedIds.add(Number(match.ID));
    }
  });

  return slots;
}

// Riallinea intelligentemente gli 11 titolari già scelti quando si cambia modulo
export function realignStartersToFormation(
  currentStarterIds: (number | null)[],
  roster: Player[],
  newFormation: FormationDef
): (number | null)[] {
  const activePlayers = currentStarterIds
    .map((id) => (id !== null ? roster.find((p) => Number(p.ID) === id) : null))
    .filter((p): p is Player => Boolean(p));

  if (activePlayers.length === 0) return Array(11).fill(null);

  return computeBest11ForFormation(activePlayers, newFormation);
}

// ============================================================================
// COMPONENTE PRINCIPALE TATTICA
// ============================================================================
const Tattica = () => {
  const { user, isAdmin, effectiveTeam, effectiveTeamFullName } = useAuth();
  const currentTeam = effectiveTeam;

  // Stato Roster e Tattica
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeDeadline, setActiveDeadline] = useState<LeagueDeadline | null>(null);
  const [isDeadlineClosed, setIsDeadlineClosed] = useState<boolean>(false);

  const handleDeadlineStatusChange = (
    isExpired: boolean,
    deadline: LeagueDeadline | null
  ) => {
    setActiveDeadline(deadline);
    setIsDeadlineClosed(isExpired || Boolean(deadline?.is_force_closed));
  };
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Modulo selezionato e 11 slot titolari (ID giocatore o null)
  const [formationId, setFormationId] = useState<string>("4-4-2");
  const [starterIds, setStarterIds] = useState<(number | null)[]>(Array(11).fill(null));
  const [benchOrderIds, setBenchOrderIds] = useState<number[]>([]);

  // Impostazioni Tattiche FC IQ EA Sports FC 25 (Squadra + Istruzioni Giocatori)
  const [tacticalSettings, setTacticalSettings] = useState<TacticalSettings>(() =>
    getDefaultTacticalSettings(EA_FC25_FORMATIONS[0].positions)
  );

  // Tab attiva (overview: Panoramica Titolari | lineup: Schiera Formazione | tactics: Tattiche & Istruzioni)
  const [activeTab, setActiveTab] = useState<string>("overview");

  // Modale istruzioni per uno specifico slot (0..10)
  const [instructionSlotIndex, setInstructionSlotIndex] = useState<number | null>(null);

  // Snapshot salvato nel DB per rilevare modifiche non salvate
  const [savedState, setSavedState] = useState<{
    formation: string;
    starters: (number | null)[];
    benchOrder: number[];
    tacticalSettings: TacticalSettings;
    updatedAt: string | null;
  } | null>(null);

  // Filtri Roster
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modale dettaglio giocatore
  const [selectedPlayerModal, setSelectedPlayerModal] = useState<Player | null>(null);

  // Drag & Drop state
  const [draggedPlayerId, setDraggedPlayerId] = useState<number | null>(null);
  const [dragOverSlotIndex, setDragOverSlotIndex] = useState<number | null>(null);
  const [dragOverBenchId, setDragOverBenchId] = useState<number | null>(null);
  const [dragOverBenchZone, setDragOverBenchZone] = useState<boolean>(false);
  const [dragOverTribunaZone, setDragOverTribunaZone] = useState<boolean>(false);

  // Definizione del modulo attivo
  const currentFormation = useMemo(
    () => EA_FC25_FORMATIONS.find((f) => f.id === formationId) || EA_FC25_FORMATIONS[0],
    [formationId]
  );

  // Caricamento giocatori e tattica salvata su Supabase
  useEffect(() => {
    async function loadTeamTacticData() {
      if (!currentTeam) {
        setPlayers([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [playersRes, tacticRes] = await Promise.all([
          supabase.from(PLAYER_TABLE).select("*").eq("Squadra", currentTeam),
          supabase.from(TEAM_TACTIC_TABLE).select("*").eq("team_id", currentTeam).maybeSingle(),
        ]);

        if (playersRes.error) throw playersRes.error;
        const teamRoster = sortPlayersByRole((playersRes.data || []) as Player[]);
        setPlayers(teamRoster);

        const validPlayerIds = new Set(teamRoster.map((p) => Number(p.ID)));

        if (tacticRes.data && Array.isArray(tacticRes.data.starters)) {
          const dbFormation =
            EA_FC25_FORMATIONS.some((f) => f.id === tacticRes.data.formation)
              ? tacticRes.data.formation
              : "4-4-2";

          const rawStarters: (number | null)[] = Array.from({ length: 11 }, (_, i) => {
            const val = tacticRes.data.starters[i];
            const num = val !== null && val !== undefined ? Number(val) : null;
            return num !== null && validPlayerIds.has(num) ? num : null;
          });

          const rawBench: number[] = Array.isArray(tacticRes.data.bench_order)
            ? tacticRes.data.bench_order
                .map((id: any) => Number(id))
                .filter((id: number) => validPlayerIds.has(id) && !rawStarters.includes(id))
            : [];

          const matchedFormation =
            EA_FC25_FORMATIONS.find((f) => f.id === dbFormation) || EA_FC25_FORMATIONS[0];
          const parsedTactics = sanitizeTacticalSettings(
            tacticRes.data.tactical_settings,
            matchedFormation.positions
          );

          setFormationId(dbFormation);
          setStarterIds(rawStarters);
          setBenchOrderIds(rawBench);
          setTacticalSettings(parsedTactics);
          setSavedState({
            formation: dbFormation,
            starters: rawStarters,
            benchOrder: rawBench,
            tacticalSettings: parsedTactics,
            updatedAt: tacticRes.data.updated_at || null,
          });
        } else {
          // Nessuna tattica ancora salvata: calcola un 11 iniziale intelligente basato sul 4-4-2
          const defaultFormation = EA_FC25_FORMATIONS[0];
          const autoStarters = computeBest11ForFormation(teamRoster, defaultFormation);
          const initialTactics = getDefaultTacticalSettings(defaultFormation.positions);
          setFormationId(defaultFormation.id);
          setStarterIds(autoStarters);
          setBenchOrderIds([]);
          setTacticalSettings(initialTactics);
          setSavedState(null);
        }
      } catch (err) {
        console.error("Errore caricamento tattica:", err);
        toast.error("Impossibile caricare i dati tattici della squadra.");
      } finally {
        setLoading(false);
      }
    }

    loadTeamTacticData();
  }, [currentTeam]);

  // Roster completo ordinato per ruolo (POR -> ATT)
  const orderedRoster = useMemo(() => sortPlayersByRole(players), [players]);

  // Mappa veloce ID -> Player
  const playerById = useMemo(() => {
    const map = new Map<number, Player>();
    for (const p of orderedRoster) {
      map.set(Number(p.ID), p);
    }
    return map;
  }, [orderedRoster]);

  // Array degli 11 slot titolari popolati con l'oggetto Player | null
  const formationSlots: (Player | null)[] = useMemo(() => {
    return Array.from({ length: 11 }, (_, idx) => {
      const id = starterIds[idx];
      return id !== null ? playerById.get(id) ?? null : null;
    });
  }, [starterIds, playerById]);

  // Set degli ID attualmente negli 11 titolari (con mappa ID -> slotIndex)
  const starterSlotByPlayerId = useMemo(() => {
    const map = new Map<number, number>();
    starterIds.forEach((id, idx) => {
      if (id !== null) map.set(id, idx);
    });
    return map;
  }, [starterIds]);

  // Riserve ordinate (Panchina + Tribuna)
  // I primi 9 slot sono destinati alla PANCHINA UFFICIALE (P1..P9)
  // Il 10° calciatore (e successivi) finiscono in TRIBUNA (non convocati a gara)
  const nonStarterPlayers: Player[] = useMemo(() => {
    const nonStarters = orderedRoster.filter((p) => !starterSlotByPlayerId.has(Number(p.ID)));
    if (benchOrderIds.length === 0) return nonStarters;

    const orderMap = new Map<number, number>();
    benchOrderIds.forEach((id, idx) => orderMap.set(id, idx));

    return nonStarters.slice().sort((a, b) => {
      const posA = orderMap.get(Number(a.ID));
      const posB = orderMap.get(Number(b.ID));
      if (posA !== undefined && posB !== undefined) return posA - posB;
      if (posA !== undefined) return -1;
      if (posB !== undefined) return 1;
      const prioA = ROLE_PRIORITY[a.Posiz] ?? 99;
      const prioB = ROLE_PRIORITY[b.Posiz] ?? 99;
      if (prioA !== prioB) return prioA - prioB;
      return (b.OVR ?? 0) - (a.OVR ?? 0);
    });
  }, [orderedRoster, starterSlotByPlayerId, benchOrderIds]);

  // Esattamente fino a 9 panchinari ufficiali (Slot P1..P9)
  const benchPlayers: Player[] = useMemo(() => {
    return nonStarterPlayers.slice(0, 9);
  }, [nonStarterPlayers]);

  // Dal 10° in poi: Giocatori in Tribuna (es. 21° calciatore nelle rose standard)
  const tribunaPlayers: Player[] = useMemo(() => {
    return nonStarterPlayers.slice(9);
  }, [nonStarterPlayers]);

  // Roster filtrato nella colonna sinistra
  const filteredRoster = useMemo(() => {
    return orderedRoster.filter((p) => {
      if (roleFilter !== "ALL") {
        const group = getPosGroup(p.Posiz);
        if (group !== roleFilter) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const fullName = `${p.Nome} ${p.Cognome} ${p.Posiz}`.toLowerCase();
        if (!fullName.includes(q)) return false;
      }
      return true;
    });
  }, [orderedRoster, roleFilter, searchQuery]);

  // Statistiche della formazione titolare
  const tacticStats = useMemo(() => {
    const activeStarters = formationSlots.filter((p): p is Player => p !== null);
    const count = activeStarters.length;
    const avgOvr =
      count > 0
        ? Math.round(activeStarters.reduce((acc, p) => acc + (p.OVR ?? 0), 0) / count)
        : 0;

    let naturalCount = 0;
    let adaptableCount = 0;
    let outCount = 0;

    let difSum = 0,
      difCnt = 0;
    let cenSum = 0,
      cenCnt = 0;
    let attSum = 0,
      attCnt = 0;

    formationSlots.forEach((p, idx) => {
      if (!p) return;
      const slotRole = currentFormation.positions[idx]?.label || "CC";
      const fit = evaluateRoleFit(p.Posiz, slotRole);
      if (fit === "natural") naturalCount++;
      else if (fit === "adaptable") adaptableCount++;
      else outCount++;

      const slotGroup = getPosGroup(slotRole);
      if (slotGroup === "DIF" || slotGroup === "POR") {
        difSum += p.OVR ?? 0;
        difCnt++;
      } else if (slotGroup === "CEN") {
        cenSum += p.OVR ?? 0;
        cenCnt++;
      } else if (slotGroup === "ATT") {
        attSum += p.OVR ?? 0;
        attCnt++;
      }
    });

    return {
      count,
      avgOvr,
      naturalCount,
      adaptableCount,
      outCount,
      avgDif: difCnt > 0 ? Math.round(difSum / difCnt) : 0,
      avgCen: cenCnt > 0 ? Math.round(cenSum / cenCnt) : 0,
      avgAtt: attCnt > 0 ? Math.round(attSum / attCnt) : 0,
    };
  }, [formationSlots, currentFormation]);

  // Verifica se ci sono modifiche non salvate rispetto al DB
  const hasUnsavedChanges = useMemo(() => {
    if (!savedState) return true;
    if (savedState.formation !== formationId) return true;
    for (let i = 0; i < 11; i++) {
      if ((savedState.starters[i] ?? null) !== (starterIds[i] ?? null)) return true;
    }
    if (
      JSON.stringify(savedState.tacticalSettings) !==
      JSON.stringify(tacticalSettings)
    ) {
      return true;
    }
    return false;
  }, [savedState, formationId, starterIds, tacticalSettings]);

  // ============================================================================
  // AZIONI DI GESTIONE FORMAZIONE (DRAG & DROP, MENÙ A TENDINA, BOTTONI RAPIDI)
  // ============================================================================

  // Assegna un giocatore (tramite ID) a uno specifico slot titolare (0..10).
  // Se il giocatore era già in un altro slot titolare, scambia i due slot!
  const assignPlayerToSlot = (slotIndex: number, playerId: number | null) => {
    setStarterIds((prev) => {
      const next = [...prev];
      if (playerId === null) {
        next[slotIndex] = null;
        return next;
      }

      const existingSlot = next.indexOf(playerId);
      const displacedPlayerId = next[slotIndex];

      if (existingSlot !== -1 && existingSlot !== slotIndex) {
        // Scambio tra due slot titolari
        next[existingSlot] = displacedPlayerId;
      }
      next[slotIndex] = playerId;
      return next;
    });
  };

  // Rimuove un giocatore dagli 11 titolari (spostandolo automaticamente in panchina)
  const removePlayerFromStarters = (playerId: number) => {
    setStarterIds((prev) => prev.map((id) => (id === playerId ? null : id)));
    setBenchOrderIds((prev) => [playerId, ...prev.filter((id) => id !== playerId)]);
  };

  // Inserisce rapidamente un giocatore dal Roster/Panchina nel miglior slot compatibile vuoto
  const quickInsertToStarters = (player: Player) => {
    const pId = Number(player.ID);
    if (starterSlotByPlayerId.has(pId)) {
      toast.info(`${player.Nome} ${player.Cognome} è già tra gli 11 titolari.`);
      return;
    }

    // 1. Cerca uno slot vuoto con ruolo naturale
    let targetSlot = currentFormation.positions.findIndex(
      (pos, idx) => starterIds[idx] === null && evaluateRoleFit(player.Posiz, pos.label) === "natural"
    );

    // 2. Cerca uno slot vuoto con ruolo adattabile
    if (targetSlot === -1) {
      targetSlot = currentFormation.positions.findIndex(
        (pos, idx) => starterIds[idx] === null && evaluateRoleFit(player.Posiz, pos.label) === "adaptable"
      );
    }

    // 3. Primo slot vuoto qualsiasi
    if (targetSlot === -1) {
      targetSlot = starterIds.findIndex((id) => id === null);
    }

    if (targetSlot !== -1) {
      assignPlayerToSlot(targetSlot, pId);
      toast.success(
        `${player.Cognome} inserito come ${currentFormation.positions[targetSlot].label} (Slot #${targetSlot + 1})`
      );
    } else {
      toast.error("Tutti gli 11 slot titolari sono occupati. Usa il menù a tendina o trascina sopra un titolare per sostituirlo.");
    }
  };

  // Cambio modulo con riallineamento intelligente degli 11 titolari
  const handleFormationChange = (newId: string) => {
    const nextFormation = EA_FC25_FORMATIONS.find((f) => f.id === newId);
    if (!nextFormation) return;
    setFormationId(newId);
    setStarterIds((prev) => realignStartersToFormation(prev, orderedRoster, nextFormation));
    setTacticalSettings((prev) => sanitizeTacticalSettings(prev, nextFormation.positions));
    toast.info(`Modulo aggiornato a ${nextFormation.name}`);
  };

  // Auto-schieramento miglior 11 per il modulo corrente
  const handleAutoPickBest11 = () => {
    const best = computeBest11ForFormation(orderedRoster, currentFormation);
    setStarterIds(best);
    toast.success(`Miglior 11 schierato per il modulo ${currentFormation.name}!`);
  };

  // Svuota tutti gli 11 slot titolari
  const handleClearStarters = () => {
    setStarterIds(Array(11).fill(null));
    toast.info("Formazione titolare svuotata.");
  };

  // Salvataggio su Supabase nella tabella an_team_tactic
  const handleSaveFormation = async () => {
    if (!currentTeam) return;

    if (isDeadlineClosed && !isAdmin) {
      toast.error("Formazioni Chiuse: il termine per l'inserimento o la modifica della formazione è terminato.");
      return;
    }

    setIsSaving(true);
    try {
      const nowIso = new Date().toISOString();
      const currentBenchIds = benchPlayers.map((p) => Number(p.ID));

      const payload = {
        team_id: currentTeam,
        formation: formationId,
        starters: starterIds,
        bench_order: currentBenchIds,
        tactical_settings: tacticalSettings,
        updated_at: nowIso,
        updated_by: user?.username || "user",
      };

      const { error } = await supabase
        .from(TEAM_TACTIC_TABLE)
        .upsert(payload, { onConflict: "team_id" });

      if (error) throw error;

      // Salva snapshot nello storico formazioni (Archivio Formazioni)
      await supabase.from("team_formation_history").insert({
        team_id: currentTeam,
        stag: activeDeadline?.stag || 11,
        formation: formationId,
        starters: starterIds,
        bench_order: currentBenchIds,
        captain_id: tacticalSettings.setPieces?.capitano || null,
        freekick_id: tacticalSettings.setPieces?.punizione_corta_sx || tacticalSettings.setPieces?.punizione_corta_dx || null,
        penalty_id: tacticalSettings.setPieces?.rigore || null,
        corner_id: tacticalSettings.setPieces?.corner_sx || tacticalSettings.setPieces?.corner_dx || null,
        tactical_settings: tacticalSettings,
        created_at: nowIso,
        created_by: user?.username || "user",
      });

      if (activeDeadline) {
        await saveLineupSnapshot({
          team_id: currentTeam,
          stag: activeDeadline.stag,
          week: activeDeadline.week,
          formation: formationId,
          starters: starterIds,
          bench_order: currentBenchIds,
          submitted_at: nowIso,
          submitted_by: user?.username || "user",
          is_locked: isDeadlineClosed,
          tactical_settings: tacticalSettings,
        });
      }

      setSavedState({
        formation: formationId,
        starters: [...starterIds],
        benchOrder: currentBenchIds,
        tacticalSettings: JSON.parse(JSON.stringify(tacticalSettings)),
        updatedAt: nowIso,
      });

      toast.success(`Formazione di ${effectiveTeamFullName || currentTeam} salvata con successo!`);
    } catch (err: any) {
      console.error("Errore salvataggio formazione:", err);
      toast.error(err?.message || "Errore durante il salvataggio della formazione.");
    } finally {
      setIsSaving(false);
    }
  };

  // ============================================================================
  // HANDLERS DRAG & DROP
  // ============================================================================
  const handleDragStartPlayer = (e: React.DragEvent, playerId: number) => {
    setDraggedPlayerId(playerId);
    e.dataTransfer.setData("text/plain", String(playerId));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setDraggedPlayerId(null);
    setDragOverSlotIndex(null);
    setDragOverBenchId(null);
    setDragOverBenchZone(false);
    setDragOverTribunaZone(false);
  };

  const handleDropOnStarterSlot = (e: React.DragEvent, slotIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    const pId = draggedPlayerId ?? Number(e.dataTransfer.getData("text/plain"));
    if (!pId || Number.isNaN(pId)) {
      handleDragEnd();
      return;
    }

    assignPlayerToSlot(slotIndex, pId);
    const p = playerById.get(pId);
    if (p) {
      const roleLabel = currentFormation.positions[slotIndex]?.label || "";
      toast.success(`${p.Cognome} schierato in #${slotIndex + 1} (${roleLabel})`);
    }
    handleDragEnd();
  };

  const handleDropOnBenchPlayer = (e: React.DragEvent, targetBenchPlayerId: number) => {
    e.preventDefault();
    e.stopPropagation();
    const sourceId = draggedPlayerId ?? Number(e.dataTransfer.getData("text/plain"));
    if (!sourceId || Number.isNaN(sourceId) || sourceId === targetBenchPlayerId) {
      handleDragEnd();
      return;
    }

    const sourceSlot = starterSlotByPlayerId.get(sourceId);
    if (sourceSlot !== undefined) {
      // Un titolare è stato trascinato sopra uno specifico panchinaro/tribunaro -> Sostituzione diretta!
      assignPlayerToSlot(sourceSlot, targetBenchPlayerId);
      const inPlayer = playerById.get(targetBenchPlayerId);
      const outPlayer = playerById.get(sourceId);
      if (inPlayer && outPlayer) {
        toast.success(`Sostituzione: entra ${inPlayer.Cognome} per ${outPlayer.Cognome}`);
      }
    } else {
      // Riordino tra riserve (Panchina o Tribuna)
      const currentIds = nonStarterPlayers.map((p) => Number(p.ID));
      const fromIdx = currentIds.indexOf(sourceId);
      const toIdx = currentIds.indexOf(targetBenchPlayerId);
      if (fromIdx !== -1 && toIdx !== -1) {
        const nextIds = [...currentIds];
        nextIds.splice(fromIdx, 1);
        nextIds.splice(toIdx, 0, sourceId);
        setBenchOrderIds(nextIds);
      }
    }
    handleDragEnd();
  };

  const handleDropOnBenchZone = (e: React.DragEvent, targetSlotIdx?: number) => {
    e.preventDefault();
    const sourceId = draggedPlayerId ?? Number(e.dataTransfer.getData("text/plain"));
    if (!sourceId || Number.isNaN(sourceId)) {
      handleDragEnd();
      return;
    }

    if (starterSlotByPlayerId.has(sourceId)) {
      removePlayerFromStarters(sourceId);
      const p = playerById.get(sourceId);
      if (p) toast.info(`${p.Cognome} spostato in panchina`);
    } else if (targetSlotIdx !== undefined) {
      // Spostamento tra riserve per finire in questo specifico slot panchina
      const currentIds = nonStarterPlayers.map((p) => Number(p.ID));
      const fromIdx = currentIds.indexOf(sourceId);
      if (fromIdx !== -1) {
        const nextIds = [...currentIds];
        nextIds.splice(fromIdx, 1);
        nextIds.splice(Math.min(targetSlotIdx, nextIds.length), 0, sourceId);
        setBenchOrderIds(nextIds);
      }
    }
    handleDragEnd();
  };

  // Trascina o sposta direttamente un calciatore in Tribuna
  const handleMoveToTribuna = (playerId: number) => {
    if (starterSlotByPlayerId.has(playerId)) {
      setStarterIds((prev) => prev.map((id) => (id === playerId ? null : id)));
    }
    const currentIds = nonStarterPlayers.map((p) => Number(p.ID)).filter((id) => id !== playerId);
    // Accoda in fondo (dalla 10a posizione in giù)
    setBenchOrderIds([...currentIds, playerId]);
    const p = playerById.get(playerId);
    if (p) toast.info(`${p.Cognome} spostato in Tribuna`);
  };

  // Trascina o sposta un calciatore dalla Tribuna alla prima posizione libera in Panchina
  const handlePromoteToBench = (playerId: number) => {
    const currentIds = nonStarterPlayers.map((p) => Number(p.ID)).filter((id) => id !== playerId);
    // Inserisce in cima alle riserve (slot P1)
    setBenchOrderIds([playerId, ...currentIds]);
    const p = playerById.get(playerId);
    if (p) toast.success(`${p.Cognome} convocato in Panchina`);
  };

  const handleDropOnTribunaZone = (e: React.DragEvent) => {
    e.preventDefault();
    const sourceId = draggedPlayerId ?? Number(e.dataTransfer.getData("text/plain"));
    if (!sourceId || Number.isNaN(sourceId)) {
      handleDragEnd();
      return;
    }
    handleMoveToTribuna(sourceId);
    handleDragEnd();
  };

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="container mx-auto px-4 py-6 space-y-6">
        {!user ? (
          <RequireAuthPrompt
            title="Gestione Tattica & Formazione"
            description="Accedi con il tuo account di squadra o scegli una squadra libera per schierare la formazione, scegliere il modulo EA FC 25 e salvare la tattica."
          />
        ) : (
          <>
            {/* Selettore Squadra Admin */}
            <AdminTeamSelector />

            {/* Countdown Scadenza Inserimento Formazione */}
            <FormationCountdown onStatusChange={handleDeadlineStatusChange} />

            {/* Banner Informativo se Formazioni Chiuse */}
            {isDeadlineClosed && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs sm:text-sm font-semibold flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Lock className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                  <span>
                    <strong>Formazioni Chiuse per la Giornata in corso:</strong> Il termine per l'inserimento o la modifica della formazione è terminato. {isAdmin ? "Bypass Amministratore attivo: puoi effettuare modifiche correttive." : "Le modifiche e i salvataggi sono bloccati per i manager."}
                  </span>
                </div>
                {isAdmin && (
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-500 border border-amber-500/40 shrink-0 font-bold uppercase">
                    Admin Bypass
                  </span>
                )}
              </div>
            )}

            {/* ================================================================= */}
            {/* HEADER BROADCAST + TELEMETRY BAR                                  */}
            {/* ================================================================= */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-border/80">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                    Lavagna Tattica • {effectiveTeamFullName || currentTeam}
                  </span>
                  {savedState?.updatedAt && !hasUnsavedChanges && (
                    <Badge
                      variant="outline"
                      className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] gap-1"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      Salvata a Sistema
                    </Badge>
                  )}
                  {hasUnsavedChanges && (
                    <Badge
                      variant="outline"
                      className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] gap-1"
                    >
                      <Clock className="h-3 w-3 animate-pulse" />
                      Modifiche non salvate
                    </Badge>
                  )}
                </div>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                  Gestione Tattica & Formazione
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  Trascina i giocatori dal Roster o usa i menù a tendina per schierare gli 11 titolari e la panchina.
                </p>
              </div>

              {/* Pulsanti Azione Principali */}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAutoPickBest11}
                  disabled={loading || orderedRoster.length === 0 || (isDeadlineClosed && !isAdmin)}
                  className="h-9 text-xs font-bold border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                >
                  <Wand2 className="h-3.5 w-3.5 mr-1.5" />
                  Auto-Schiera Miglior 11
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearStarters}
                  disabled={loading || tacticStats.count === 0 || (isDeadlineClosed && !isAdmin)}
                  className="h-9 text-xs font-semibold text-muted-foreground hover:text-rose-500 hover:border-rose-500/40"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                  Svuota
                </Button>

                {savedState && hasUnsavedChanges && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFormationId(savedState.formation);
                      setStarterIds([...savedState.starters]);
                      setBenchOrderIds([...savedState.benchOrder]);
                      setTacticalSettings(
                        JSON.parse(JSON.stringify(savedState.tacticalSettings))
                      );
                      toast.info("Formazione e tattiche ripristinate.");
                    }}
                    disabled={loading || isSaving}
                    className="h-9 text-xs font-semibold text-muted-foreground hover:text-foreground"
                  >
                    <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                    Ripristina
                  </Button>
                )}

                <Button
                  size="sm"
                  onClick={handleSaveFormation}
                  disabled={loading || isSaving || (isDeadlineClosed && !isAdmin)}
                  title={isDeadlineClosed && !isAdmin ? "Formazioni chiuse per la giornata in corso" : undefined}
                  className="h-9 px-4 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md disabled:opacity-50 disabled:pointer-events-none"
                >
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                  {isSaving ? "Salvataggio..." : "Salva Formazione"}
                </Button>
              </div>
            </div>

            {/* ================================================================= */}
            {/* TABS PRINCIPALI: PANORAMICA (1) | SCHIERA (2) | TATTICHE FC IQ (3)*/}
            {/* ================================================================= */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/70 pb-3">
                <TabsList className="bg-muted/60 p-1 rounded-xl h-11 border border-border/60">
                  <TabsTrigger
                    value="overview"
                    className="gap-2 text-xs sm:text-sm font-bold data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow px-3 sm:px-4 h-9 rounded-lg"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Panoramica Titolari</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="lineup"
                    className="gap-2 text-xs sm:text-sm font-bold data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow px-3 sm:px-4 h-9 rounded-lg"
                  >
                    <ClipboardList className="w-4 h-4" />
                    <span>Schiera Formazione</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="tactics"
                    className="gap-2 text-xs sm:text-sm font-bold data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow px-3 sm:px-4 h-9 rounded-lg"
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                    <span>Tattiche FC IQ</span>
                  </TabsTrigger>
                </TabsList>

                <div className="text-xs text-muted-foreground hidden sm:flex items-center gap-2 font-medium">
                  <span>Modulo: <b className="text-foreground">{currentFormation.name}</b></span>
                  <span>•</span>
                  <span>Titolari: <b className="text-foreground">{tacticStats.count}/11</b></span>
                </div>
              </div>

              {/* TAB 1: PANORAMICA & RIEPILOGO (SOLO TITOLARI + TATTICHE) */}
              <TabsContent value="overview" className="mt-0 space-y-6">
                <TacticsOverviewTab
                  formation={currentFormation}
                  formationSlots={formationSlots}
                  roster={orderedRoster}
                  tacticalSettings={tacticalSettings}
                  onEditFormation={() => setActiveTab("lineup")}
                  onEditTactics={() => setActiveTab("tactics")}
                  onOpenPlayerModal={(p) => setSelectedPlayerModal(p)}
                  onOpenInstructionModal={(slotIdx) => setInstructionSlotIndex(slotIdx)}
                />
              </TabsContent>

              {/* TAB 2: SCHIERA FORMAZIONE (MODULO + TELEMETRIA + ROSTER + TITOLARI + PANCHINA) */}
              <TabsContent value="lineup" className="mt-0 space-y-6">
            {/* ================================================================= */}
            {/* COMMAND HUD: MODULO EA FC 25 + STATISTICHE FORMAZIONE             */}
            {/* ================================================================= */}
            <div className="rounded-2xl border border-border/80 bg-gradient-to-r from-card via-card/95 to-card/90 shadow-lg p-4 backdrop-blur-md">
              <div className="grid grid-cols-12 gap-4 items-center">
                {/* Squadra & Modulo Selector */}
                <div className="col-span-12 lg:col-span-5 flex flex-col sm:flex-row sm:items-center gap-3.5 lg:border-r border-border/70 lg:pr-4">
                  <div className="flex items-center gap-3">
                    {currentTeam && (
                      <img
                        src={`/images/teams/${currentTeam}_Logo.png`}
                        alt={currentTeam}
                        className="h-12 w-12 object-contain drop-shadow shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/images/LCSIM_Logo_SMALL.png";
                        }}
                      />
                    )}
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Modulo EA Sports FC 25
                      </div>
                      <div className="font-extrabold text-sm sm:text-base text-foreground truncate">
                        {currentFormation.name}
                      </div>
                    </div>
                  </div>

                  <div className="sm:ml-auto w-full sm:w-[220px]">
                    <Select value={formationId} onValueChange={handleFormationChange}>
                      <SelectTrigger className="h-10 bg-background/80 border-primary/30 font-bold text-xs sm:text-sm">
                        <SelectValue placeholder="Seleziona modulo" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[340px]">
                        {(["Difesa a 4", "Difesa a 3", "Difesa a 5"] as const).map((cat) => (
                          <SelectGroup key={cat}>
                            <SelectLabel className="text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-extrabold bg-muted/40 py-1.5">
                              {cat}
                            </SelectLabel>
                            {EA_FC25_FORMATIONS.filter((f) => f.category === cat).map((f) => (
                              <SelectItem key={f.id} value={f.id} className="text-xs font-semibold">
                                {f.name}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Contatori Telemetry: Titolari, OVR Medio, Reparti, Affinità */}
                <div className="col-span-12 lg:col-span-7 grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  <div
                    className={`p-2.5 rounded-xl border text-center ${
                      tacticStats.count === 11
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                        : "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    <div className="text-[10px] font-bold uppercase tracking-wider">Titolari</div>
                    <div className="text-xl font-black font-mono mt-0.5">{tacticStats.count}/11</div>
                    <span className="text-[9px] font-medium">
                      {benchPlayers.length}/9 panchina • {tribunaPlayers.length} tribuna
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl border border-border/60 bg-muted/20 text-center">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      OVR Titolari
                    </div>
                    <div className="text-xl font-black font-mono text-primary mt-0.5">
                      {tacticStats.avgOvr || "—"}
                    </div>
                    <span className="text-[9px] text-muted-foreground font-medium">Media 11</span>
                  </div>

                  <div className="p-2.5 rounded-xl border border-border/60 bg-muted/20 text-center">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-blue-500">
                      Difesa
                    </div>
                    <div className="text-xl font-black font-mono text-foreground mt-0.5">
                      {tacticStats.avgDif || "—"}
                    </div>
                    <span className="text-[9px] text-muted-foreground font-medium">POR + DIF</span>
                  </div>

                  <div className="p-2.5 rounded-xl border border-border/60 bg-muted/20 text-center">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">
                      Centrocampo
                    </div>
                    <div className="text-xl font-black font-mono text-foreground mt-0.5">
                      {tacticStats.avgCen || "—"}
                    </div>
                    <span className="text-[9px] text-muted-foreground font-medium">Reparto CEN</span>
                  </div>

                  <div className="col-span-2 sm:col-span-1 p-2.5 rounded-xl border border-border/60 bg-muted/20 text-center">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-rose-500">
                      Attacco
                    </div>
                    <div className="text-xl font-black font-mono text-foreground mt-0.5">
                      {tacticStats.avgAtt || "—"}
                    </div>
                    <span className="text-[9px] text-muted-foreground font-medium">Reparto ATT</span>
                  </div>
                </div>
              </div>
            </div>



            {/* ================================================================= */}
            {/* GRIGLIA A 3 COLONNE: ROSTER (3) | TITOLARI+PANCHINA (5) | CAMPO (4) */}
            {/* ================================================================= */}
            <div className="grid grid-cols-12 gap-5 items-start">
              
              {/* --------------------------------------------------------------- */}
              {/* COLONNA 1 (SINISTRA): ROSTER COMPLETO ORDINATO PER RUOLO        */}
              {/* --------------------------------------------------------------- */}
              <div className="col-span-12 lg:col-span-3 space-y-4">
                <Card className="shadow-lg border-border/80 overflow-hidden">
                  <CardHeader className="bg-muted/30 border-b border-border/60 py-3.5 px-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-emerald-500" />
                        <CardTitle className="text-sm font-bold">Roster Completo</CardTitle>
                      </div>
                      <Badge variant="secondary" className="text-[10px] font-mono px-1.5 py-0">
                        {orderedRoster.length} Giocatori
                      </Badge>
                    </div>
                    <CardDescription className="text-[11px] mt-0.5">
                      Ordinato per ruolo (POR &rarr; ATT). Trascina o clicca + per schierare.
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="p-3 space-y-2.5">
                    {/* Ricerca rapida */}
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Cerca nome o ruolo..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 h-8 text-xs bg-muted/20 border-border/70"
                      />
                    </div>

                    {/* Filtro Reparto */}
                    <div className="grid grid-cols-5 gap-1">
                      {["ALL", "POR", "DIF", "CEN", "ATT"].map((r) => (
                        <Button
                          key={r}
                          size="sm"
                          variant={roleFilter === r ? "default" : "outline"}
                          onClick={() => setRoleFilter(r)}
                          className={`h-7 text-[10px] px-1 font-bold ${
                            roleFilter === r
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground"
                          }`}
                        >
                          {r === "ALL" ? "Tutti" : r}
                        </Button>
                      ))}
                    </div>

                    {/* Elenco completo ordinato per ruolo */}
                    <div className="max-h-[680px] overflow-y-auto space-y-1.5 pr-1">
                      {filteredRoster.length === 0 ? (
                        <div className="p-6 text-center text-xs text-muted-foreground">
                          Nessun giocatore trovato.
                        </div>
                      ) : (
                        filteredRoster.map((player) => {
                          const pId = Number(player.ID);
                          const slotIdx = starterSlotByPlayerId.get(pId);
                          const isStarter = slotIdx !== undefined;
                          const assignedRole =
                            isStarter ? currentFormation.positions[slotIdx]?.label : null;

                          return (
                            <div
                              key={pId}
                              draggable
                              onDragStart={(e) => handleDragStartPlayer(e, pId)}
                              onDragEnd={handleDragEnd}
                              className={`group p-2 rounded-xl border transition-all flex items-center justify-between gap-2 cursor-grab active:cursor-grabbing ${
                                isStarter
                                  ? "bg-emerald-500/10 border-emerald-500/40 shadow-sm"
                                  : "bg-card hover:bg-muted/40 border-border/60"
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                                <div
                                  onClick={() => setSelectedPlayerModal(player)}
                                  className="w-8 h-8 rounded-lg overflow-hidden border border-border/80 bg-muted/30 shrink-0 cursor-pointer"
                                  title="Vedi dettagli giocatore"
                                >
                                  <img
                                    src={getPlayerImage(pId)}
                                    alt={player.Cognome}
                                    className="w-full h-full object-cover object-top"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src =
                                        "/images/players/MConti.png";
                                    }}
                                  />
                                </div>

                                <div
                                  onClick={() => setSelectedPlayerModal(player)}
                                  className="min-w-0 flex-1 cursor-pointer"
                                >
                                  <div className="font-bold text-xs text-foreground truncate group-hover:text-primary transition-colors">
                                    {player.Nome?.[0]}. {player.Cognome}
                                  </div>
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <Badge
                                      variant="outline"
                                      className={`text-[9px] px-1 py-0 h-3.5 font-bold ${getRoleColor(
                                        player.Posiz
                                      )}`}
                                    >
                                      {player.Posiz}
                                    </Badge>
                                    {isStarter ? (
                                      <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[8px] px-1 py-0 h-3.5 font-extrabold">
                                        TIT #{slotIdx + 1} ({assignedRole})
                                      </Badge>
                                    ) : (
                                      <Badge
                                        variant="secondary"
                                        className="text-[8px] px-1 py-0 h-3.5 text-muted-foreground font-semibold"
                                      >
                                        PAN
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <span
                                  className={`text-xs font-black font-mono ${getValueColor(
                                    player.OVR ?? 70
                                  )}`}
                                >
                                  {player.OVR}
                                </span>

                                {!isStarter ? (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => quickInsertToStarters(player)}
                                    className="h-6 w-6 rounded-lg hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                    title="Inserisci nel primo slot compatibile"
                                  >
                                    <UserPlus className="h-3.5 w-3.5" />
                                  </Button>
                                ) : (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => removePlayerFromStarters(pId)}
                                    className="h-6 w-6 rounded-lg hover:bg-rose-500/20 text-muted-foreground hover:text-rose-500"
                                    title="Sposta in panchina"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* --------------------------------------------------------------- */}
              {/* COLONNA 2 (CENTRO): SEZIONE TITOLARI (11) & SEZIONE PANCHINARI  */}
              {/* --------------------------------------------------------------- */}
              <div className="col-span-12 lg:col-span-5 space-y-5">
                
                {/* SEZIONE 1: TITOLARI (11 SLOT) */}
                <Card className="shadow-lg border-border/80 overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-emerald-500/15 via-primary/10 to-transparent border-b border-border/60 py-3.5 px-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-emerald-500" />
                        <div>
                          <CardTitle className="text-sm font-bold">
                            Undici Titolare ({currentFormation.name})
                          </CardTitle>
                          <CardDescription className="text-[11px]">
                            Trascina un giocatore nello slot o selezionalo dal menù a tendina
                          </CardDescription>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-background/80 font-mono text-xs font-extrabold border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                      >
                        {tacticStats.count} / 11
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="p-3 space-y-2">
                    {currentFormation.positions.map((pos, slotIndex) => {
                      const occupant = formationSlots[slotIndex];
                      const roleFit = occupant
                        ? evaluateRoleFit(occupant.Posiz, pos.label)
                        : null;
                      const isDragOver = dragOverSlotIndex === slotIndex;

                      // Opzioni per il menù a tendina di questo slot:
                      // mette in cima i giocatori con ruolo naturale per lo slot, poi gli adattabili, poi gli altri
                      const slotDropdownOptions = orderedRoster.slice().sort((a, b) => {
                        const fitA = evaluateRoleFit(a.Posiz, pos.label);
                        const fitB = evaluateRoleFit(b.Posiz, pos.label);
                        const rank = { natural: 0, adaptable: 1, out: 2 };
                        if (rank[fitA] !== rank[fitB]) return rank[fitA] - rank[fitB];
                        const prioA = ROLE_PRIORITY[a.Posiz] ?? 99;
                        const prioB = ROLE_PRIORITY[b.Posiz] ?? 99;
                        if (prioA !== prioB) return prioA - prioB;
                        return (b.OVR ?? 0) - (a.OVR ?? 0);
                      });

                      return (
                        <div
                          key={slotIndex}
                          draggable={Boolean(occupant)}
                          onDragStart={(e) =>
                            occupant && handleDragStartPlayer(e, Number(occupant.ID))
                          }
                          onDragEnd={handleDragEnd}
                          onDragOver={(e) => {
                            e.preventDefault();
                            setDragOverSlotIndex(slotIndex);
                          }}
                          onDragLeave={() => {
                            if (dragOverSlotIndex === slotIndex) setDragOverSlotIndex(null);
                          }}
                          onDrop={(e) => handleDropOnStarterSlot(e, slotIndex)}
                          className={`p-2 rounded-xl border transition-all flex items-center gap-2.5 ${
                            isDragOver
                              ? "ring-2 ring-emerald-500 border-emerald-500 bg-emerald-500/10 scale-[1.01]"
                              : occupant
                              ? "bg-card hover:border-primary/40 border-border/70 shadow-sm"
                              : "bg-muted/15 border-dashed border-border hover:border-emerald-500/40"
                          }`}
                        >
                          {/* Numero Slot + Ruolo Richiesto nel Modulo (LARGHEZZA FISSA: w-[72px] shrink-0) */}
                          <div className="flex items-center gap-1.5 w-[72px] shrink-0">
                            <div className="w-6 h-6 rounded-md bg-muted/70 border border-border/80 flex items-center justify-center font-mono text-[11px] font-black text-foreground shrink-0">
                              {slotIndex + 1}
                            </div>
                            <Badge
                              variant="outline"
                              className={`w-10 justify-center font-extrabold text-[10px] py-0 px-1 shrink-0 ${getRoleColor(
                                pos.label
                              )}`}
                            >
                              {pos.label}
                            </Badge>
                          </div>

                          {/* Menù a Tendina Selettore Giocatore per lo Slot */}
                          <div className="flex-1 min-w-0">
                            <Select
                              value={occupant ? String(occupant.ID) : "EMPTY"}
                              onValueChange={(val) => {
                                if (val === "EMPTY") {
                                  assignPlayerToSlot(slotIndex, null);
                                } else {
                                  assignPlayerToSlot(slotIndex, Number(val));
                                }
                              }}
                            >
                              <SelectTrigger className="h-9 w-full bg-background/70 border-border/60 text-xs font-semibold px-2.5">
                                {occupant ? (
                                  <div className="flex items-center gap-2 min-w-0 truncate">
                                    <img
                                      src={getPlayerImage(Number(occupant.ID))}
                                      alt={occupant.Cognome}
                                      className="h-5 w-5 rounded-full object-cover object-top border border-border shrink-0"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src =
                                          "/images/players/MConti.png";
                                      }}
                                    />
                                    <span className="font-bold text-foreground truncate">
                                      {occupant.Nome} {occupant.Cognome}
                                    </span>
                                    <Badge
                                      variant="outline"
                                      className={`text-[9px] px-1 py-0 h-4 shrink-0 ${getRoleColor(
                                        occupant.Posiz
                                      )}`}
                                    >
                                      {occupant.Posiz}
                                    </Badge>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground italic">
                                    + Seleziona o trascina ({pos.label})...
                                  </span>
                                )}
                              </SelectTrigger>

                              <SelectContent className="max-h-[300px]">
                                <SelectItem value="EMPTY" className="text-xs italic text-muted-foreground">
                                  — Lascia slot vuoto —
                                </SelectItem>
                                {slotDropdownOptions.map((p) => {
                                  const pId = Number(p.ID);
                                  const otherSlot = starterSlotByPlayerId.get(pId);
                                  const isInOtherSlot =
                                    otherSlot !== undefined && otherSlot !== slotIndex;
                                  const fit = evaluateRoleFit(p.Posiz, pos.label);

                                  return (
                                    <SelectItem key={pId} value={String(pId)} className="text-xs">
                                      <div className="flex items-center gap-2 w-full">
                                        <span
                                          className={`inline-block w-2 h-2 rounded-full shrink-0 ${
                                            fit === "natural"
                                              ? "bg-emerald-500"
                                              : fit === "adaptable"
                                              ? "bg-amber-500"
                                              : "bg-rose-500/60"
                                          }`}
                                        />
                                        <span className="font-mono text-[10px] font-bold w-8">
                                          [{p.Posiz}]
                                        </span>
                                        <span className="font-semibold">
                                          {p.Nome} {p.Cognome}
                                        </span>
                                        <span className="font-mono font-bold text-primary ml-1">
                                          OVR {p.OVR}
                                        </span>
                                        {isInOtherSlot && (
                                          <span className="text-[10px] text-amber-500 font-semibold ml-1">
                                            (Scambia con #{otherSlot + 1})
                                          </span>
                                        )}
                                      </div>
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Colonna 3: Indicatori Destra & Azioni (LARGHEZZA FISSA: w-[140px] shrink-0 flex items-center justify-end gap-1.5) */}
                          <div className="w-[140px] shrink-0 flex items-center justify-end gap-1.5">
                            {occupant ? (
                              <>
                                {roleFit === "natural" ? (
                                  <span
                                    className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"
                                    title={`Ruolo Naturale (${occupant.Posiz})`}
                                  />
                                ) : roleFit === "adaptable" ? (
                                  <span
                                    className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"
                                    title={`Adattato (${occupant.Posiz} schierato come ${pos.label})`}
                                  />
                                ) : (
                                  <AlertTriangle
                                    className="h-3.5 w-3.5 text-rose-500 shrink-0"
                                    title={`Fuori ruolo! (${occupant.Posiz} schierato come ${pos.label})`}
                                  />
                                )}

                                <span
                                  className={`text-xs font-black font-mono w-7 text-center shrink-0 ${getValueColor(
                                    occupant.OVR ?? 70
                                  )}`}
                                >
                                  {occupant.OVR}
                                </span>

                                {/* Bottone Istruzioni FC IQ */}
                                <Button
                                  size="icon"
                                  variant="outline"
                                  onClick={() => setInstructionSlotIndex(slotIndex)}
                                  className="h-7 w-7 rounded-lg text-primary border-primary/30 bg-primary/5 hover:bg-primary/15 shrink-0"
                                  title="Personalizza Ruolo e Focus FC IQ (EA FC 25)"
                                >
                                  <SlidersHorizontal className="h-3.5 w-3.5" />
                                </Button>

                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => setSelectedPlayerModal(occupant)}
                                  className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground shrink-0"
                                  title="Scheda attributi giocatore"
                                >
                                  <Info className="h-3.5 w-3.5" />
                                </Button>

                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => assignPlayerToSlot(slotIndex, null)}
                                  className="h-7 w-7 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 shrink-0"
                                  title="Manda in panchina"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <div className="w-7 text-center font-mono text-[11px] text-muted-foreground shrink-0">—</div>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => setInstructionSlotIndex(slotIndex)}
                                  className="h-7 w-7 rounded-lg text-muted-foreground hover:text-primary shrink-0"
                                  title="Pre-imposta Ruolo e Focus FC IQ per questo slot"
                                >
                                  <SlidersHorizontal className="h-3.5 w-3.5" />
                                </Button>
                                <div className="w-7 h-7 shrink-0" />
                                <div className="w-7 h-7 shrink-0" />
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                {/* SEZIONE 2: PANCHINA UFFICIALE (9 SLOT FISSI P1..P9) */}
                <Card
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverBenchZone(true);
                  }}
                  onDragLeave={() => setDragOverBenchZone(false)}
                  onDrop={(e) => handleDropOnBenchZone(e)}
                  className={`shadow-lg overflow-hidden transition-all ${
                    dragOverBenchZone
                      ? "ring-2 ring-amber-500 border-amber-500 bg-amber-500/5"
                      : "border-border/80"
                  }`}
                >
                  <CardHeader className="bg-muted/30 border-b border-border/60 py-3 px-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ClipboardList className="h-4 w-4 text-amber-500" />
                        <div>
                          <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <span>Panchina Ufficiale (9 Riserve)</span>
                            <Badge variant="outline" className="text-[10px] font-mono text-amber-600 dark:text-amber-400 border-amber-500/30">
                              Disponibili per il match
                            </Badge>
                          </CardTitle>
                          <CardDescription className="text-[11px]">
                            9 calciatori convocati ordinati per priorità di subentro (da P1 a P9). Trascina per sostituire o usa i bottoni rapidi.
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs font-mono font-bold">
                        {benchPlayers.length} / 9 Panchinari
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="p-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-2">
                      {Array.from({ length: 9 }).map((_, slotIdx) => {
                        const player = benchPlayers[slotIdx];
                        if (!player) {
                          // Slot panchina vuoto
                          return (
                            <div
                              key={`empty-bench-${slotIdx}`}
                              onDragOver={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                              }}
                              onDrop={(e) => handleDropOnBenchZone(e, slotIdx)}
                              className="p-2 rounded-xl border border-dashed border-border/70 bg-muted/20 flex items-center justify-between text-xs text-muted-foreground select-none"
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="text-[10px] font-mono font-bold text-muted-foreground w-5 text-center shrink-0">
                                  P{slotIdx + 1}
                                </span>
                                <span className="text-xs italic truncate">Slot Panchina Libero</span>
                              </div>
                              <span className="text-[10px] font-mono opacity-60 shrink-0 ml-1">Trascina qui</span>
                            </div>
                          );
                        }

                        const pId = Number(player.ID);
                        const isDragTarget = dragOverBenchId === pId;

                        return (
                          <div
                            key={pId}
                            draggable
                            onDragStart={(e) => handleDragStartPlayer(e, pId)}
                            onDragEnd={handleDragEnd}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setDragOverBenchId(pId);
                            }}
                            onDragLeave={() => {
                              if (dragOverBenchId === pId) setDragOverBenchId(null);
                            }}
                            onDrop={(e) => handleDropOnBenchPlayer(e, pId)}
                            className={`p-2 rounded-xl border bg-card hover:bg-muted/30 transition-all flex items-center justify-between gap-2 cursor-grab active:cursor-grabbing ${
                              isDragTarget
                                ? "ring-2 ring-emerald-500 border-emerald-500 bg-emerald-500/10"
                                : "border-border/60"
                            }`}
                          >
                            <div
                              onClick={() => setSelectedPlayerModal(player)}
                              className="flex items-center gap-1.5 min-w-0 flex-1 cursor-pointer"
                            >
                              <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 w-5 text-center shrink-0">
                                P{slotIdx + 1}
                              </span>
                              <Badge
                                variant="outline"
                                className={`text-[9px] px-1.5 py-0 h-4 shrink-0 font-bold ${getRoleColor(
                                  player.Posiz
                                )}`}
                              >
                                {player.Posiz}
                              </Badge>
                              <span
                                className="font-bold text-xs text-foreground truncate min-w-0"
                                title={`${player.Nome} ${player.Cognome}`}
                              >
                                {player.Nome?.[0]}. {player.Cognome}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 shrink-0 ml-1">
                              <span
                                className={`text-[11px] font-black font-mono mr-0.5 ${getValueColor(
                                  player.OVR ?? 70
                                )}`}
                              >
                                {player.OVR}
                              </span>

                              {/* Invia in campo nel primo slot libero */}
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  quickInsertToStarters(player);
                                }}
                                className="h-6 w-6 rounded-lg hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                title="Schiera negli 11 titolari"
                              >
                                <ArrowLeftRight className="h-3 w-3" />
                              </Button>

                              {/* Sposta in Tribuna */}
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveToTribuna(pId);
                                }}
                                className="h-6 w-6 rounded-lg hover:bg-rose-500/20 text-muted-foreground hover:text-rose-500"
                                title="Manda in Tribuna (Non convocato)"
                              >
                                <ArrowDownRight className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* SEZIONE 3: TRIBUNA (NON CONVOCATI / ECCEDENZE OLTRE LE 9 RISERVE) */}
                <Card
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverTribunaZone(true);
                  }}
                  onDragLeave={() => setDragOverTribunaZone(false)}
                  onDrop={handleDropOnTribunaZone}
                  className={`shadow-md overflow-hidden transition-all ${
                    dragOverTribunaZone
                      ? "ring-2 ring-rose-500 border-rose-500 bg-rose-500/5"
                      : "border-border/70 bg-card/60"
                  }`}
                >
                  <CardHeader className="bg-muted/20 border-b border-border/50 py-2.5 px-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Armchair className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <span>Tribuna / Non Convocati</span>
                            <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground border-border">
                              Non disponibili a partita in corso
                            </Badge>
                          </CardTitle>
                          <CardDescription className="text-[10px]">
                            Calciatori non inseriti nei 9 slot della panchina. Trascina qui per escludere o clicca Promuovi per portare nei 9 panchinari.
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[11px] font-mono text-muted-foreground">
                        {tribunaPlayers.length} in Tribuna
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="p-3">
                    {tribunaPlayers.length === 0 ? (
                      <div className="p-3.5 text-center text-xs text-muted-foreground border border-dashed rounded-xl bg-muted/10">
                        Nessun calciatore in tribuna. Tutta la rosa attiva è schierata tra titolari e panchina.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-2">
                        {tribunaPlayers.map((player) => {
                          const pId = Number(player.ID);
                          return (
                            <div
                              key={pId}
                              draggable
                              onDragStart={(e) => handleDragStartPlayer(e, pId)}
                              onDragEnd={handleDragEnd}
                              className="p-2 rounded-xl border border-dashed border-border/70 bg-muted/30 hover:bg-muted/50 transition-all flex items-center justify-between gap-2 cursor-grab active:cursor-grabbing"
                            >
                              <div
                                onClick={() => setSelectedPlayerModal(player)}
                                className="flex items-center gap-1.5 min-w-0 flex-1 cursor-pointer"
                              >
                                <span className="text-[10px] font-mono font-bold text-muted-foreground/80 w-5 text-center shrink-0">
                                  TRB
                                </span>
                                <Badge
                                  variant="outline"
                                  className={`text-[9px] px-1.5 py-0 h-4 shrink-0 font-bold opacity-80 ${getRoleColor(
                                    player.Posiz
                                  )}`}
                                >
                                  {player.Posiz}
                                </Badge>
                                <span
                                  className="font-semibold text-xs text-foreground/90 truncate min-w-0"
                                  title={`${player.Nome} ${player.Cognome}`}
                                >
                                  {player.Nome?.[0]}. {player.Cognome}
                                </span>
                              </div>

                              <div className="flex items-center gap-1 shrink-0 ml-1">
                                <span
                                  className={`text-[11px] font-black font-mono mr-0.5 opacity-80 ${getValueColor(
                                    player.OVR ?? 70
                                  )}`}
                                >
                                  {player.OVR}
                                </span>

                                {/* Promuovi in Panchina */}
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePromoteToBench(pId);
                                  }}
                                  className="h-6 w-6 rounded-lg hover:bg-amber-500/20 text-amber-600 dark:text-amber-400"
                                  title="Promuovi in Panchina (Slot P1)"
                                >
                                  <ArrowUpRight className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* --------------------------------------------------------------- */}
              {/* COLONNA 3 (DESTRA): CAMPETTO INTERATTIVO LIVE                   */}
              {/* --------------------------------------------------------------- */}
              <div className="col-span-12 lg:col-span-4 lg:sticky lg:top-20 space-y-4">
                <Card className="shadow-xl border-border/80 overflow-hidden">
                  <CardHeader className="bg-muted/30 border-b border-border/60 py-3.5 px-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-emerald-500" />
                        <div>
                          <CardTitle className="text-sm font-bold">
                            Campetto Tattico Live
                          </CardTitle>
                          <CardDescription className="text-[11px]">
                            Trascina i giocatori anche direttamente sulle posizioni in campo
                          </CardDescription>
                        </div>
                      </div>
                      <Badge className="bg-emerald-600 text-white font-mono text-xs font-extrabold">
                        {currentFormation.id}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="p-3 sm:p-4">
                    {/* Pitch Container - Allungato in verticale per evitare sovrapposizioni */}
                    <div
                      className="relative w-full rounded-2xl shadow-inner overflow-hidden border-2 border-emerald-950/60 select-none"
                      style={{
                        minHeight: "780px",
                        height: "780px",
                        background: `repeating-linear-gradient(0deg, hsl(142 52% 26%) 0px, hsl(142 52% 26%) 45px, hsl(142 52% 30%) 45px, hsl(142 52% 30%) 90px)`,
                      }}
                    >
                      {/* Vignette & Broadcast Lighting */}
                      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(0,0,0,0.45)_100%)]" />

                      {/* Linee regolamentari del campo */}
                      <div className="pointer-events-none absolute inset-4 border-2 border-white/55 rounded-sm">
                        {/* Linea di metà campo */}
                        <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-white/55" />
                        {/* Cerchio di centrocampo */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 border-2 border-white/55 rounded-full" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white/80 rounded-full" />

                        {/* Area di rigore superiore (Attacco) */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-56 h-30 border-2 border-white/55 border-t-0" />
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-12 border-2 border-white/55 border-t-0" />

                        {/* Area di rigore inferiore (Porta) */}
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-56 h-30 border-2 border-white/55 border-b-0" />
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-12 border-2 border-white/55 border-b-0" />
                      </div>

                      {/* 11 Posizioni interattive sul campo */}
                      <div className="relative w-full h-full">
                        {currentFormation.positions.map((pos, slotIdx) => {
                          const occupant = formationSlots[slotIdx];
                          const fit = occupant
                            ? evaluateRoleFit(occupant.Posiz, pos.label)
                            : null;
                          const isHovered = dragOverSlotIndex === slotIdx;

                          const ringColor =
                            fit === "natural"
                              ? "border-emerald-400 shadow-emerald-500/30"
                              : fit === "adaptable"
                              ? "border-amber-400 shadow-amber-500/30"
                              : "border-rose-400 shadow-rose-500/30";

                          return (
                            <div
                              key={slotIdx}
                              draggable={Boolean(occupant)}
                              onDragStart={(e) =>
                                occupant && handleDragStartPlayer(e, Number(occupant.ID))
                              }
                              onDragEnd={handleDragEnd}
                              onDragOver={(e) => {
                                e.preventDefault();
                                setDragOverSlotIndex(slotIdx);
                              }}
                              onDragLeave={() => {
                                if (dragOverSlotIndex === slotIdx) setDragOverSlotIndex(null);
                              }}
                              onDrop={(e) => handleDropOnStarterSlot(e, slotIdx)}
                              onClick={() => setInstructionSlotIndex(slotIdx)}
                              style={{ left: pos.x, top: pos.y }}
                              className={`absolute -translate-x-1/2 -translate-y-1/2 z-10 transition-all duration-300 ${
                                isHovered ? "scale-125 z-30" : "hover:scale-110 hover:z-20"
                              }`}
                            >
                              {occupant ? (
                                <div className="flex flex-col items-center cursor-grab active:cursor-grabbing group">
                                  {/* Avatar Pedina con OVR */}
                                  <div className="relative">
                                    <div
                                      className={`w-12 h-12 rounded-full overflow-hidden bg-slate-900 border-2 ${ringColor} shadow-lg`}
                                    >
                                      <img
                                        src={getPlayerImage(Number(occupant.ID))}
                                        alt={occupant.Cognome}
                                        className="w-full h-full object-cover object-top"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).src =
                                            "/images/players/MConti.png";
                                        }}
                                      />
                                    </div>

                                    {/* Pillola OVR in alto a destra */}
                                    <span className="absolute -top-1 -right-2 bg-slate-950 text-white border border-white/40 text-[10px] font-black font-mono px-1.5 py-0 rounded-full shadow">
                                      {occupant.OVR}
                                    </span>

                                    {/* Numero maglia giocatore in basso a sinistra */}
                                    <span
                                      className="absolute -bottom-1 -left-1.5 bg-emerald-600 text-white text-[9px] font-bold font-mono min-w-4 h-4 px-1 rounded-full flex items-center justify-center border border-white/60 shadow"
                                      title={occupant.NumeroMaglia ? `Maglia #${occupant.NumeroMaglia}` : `Posizione #${slotIdx + 1}`}
                                    >
                                      {occupant.NumeroMaglia ?? slotIdx + 1}
                                    </span>
                                  </div>

                                  {/* Targhetta Cognome + Ruolo */}
                                  <div className="mt-1 px-2 py-0.5 rounded-md bg-slate-950/90 backdrop-blur-sm border border-white/25 text-white shadow-md flex items-center gap-1 max-w-[110px]">
                                    <span className={`text-[9px] font-extrabold font-mono shrink-0 ${getRoleTextColor(pos.label)}`}>
                                      {pos.label}
                                    </span>
                                    <span className="text-[10px] font-bold truncate">
                                      {occupant.Cognome}
                                    </span>
                                  </div>

                                  {/* Badge Ruolo FC IQ */}
                                  {(() => {
                                    const instr = tacticalSettings.playerInstructions[slotIdx];
                                    const roleDef = FC25_ROLES_BY_POSITION[pos.label]?.find(
                                      (r) => r.id === instr?.roleId
                                    );
                                    const roleName = roleDef?.name || "FC IQ";
                                    return (
                                      <div
                                        className="mt-0.5 px-1.5 py-0.5 rounded bg-primary/95 text-primary-foreground text-[8px] font-black tracking-tight shadow flex items-center gap-1 border border-primary/40 truncate max-w-[110px]"
                                        title={`FC IQ: ${roleName}`}
                                      >
                                        <SlidersHorizontal className="w-2.5 h-2.5 shrink-0" />
                                        <span className="truncate">{roleName}</span>
                                      </div>
                                    );
                                  })()}
                                </div>
                              ) : (
                                /* Slot Vuoto sul Campo */
                                <div className="flex flex-col items-center">
                                  <div
                                    className={`w-11 h-11 rounded-full border-2 border-dashed flex flex-col items-center justify-center transition-colors ${
                                      isHovered
                                        ? "border-emerald-300 bg-emerald-500/40 text-white"
                                        : "border-white/70 bg-black/35 text-white/90 hover:bg-black/50"
                                    }`}
                                  >
                                    <span className="text-[9px] font-mono font-bold opacity-80">
                                      #{slotIdx + 1}
                                    </span>
                                    <span className={`text-[10px] font-extrabold ${getRoleTextColor(pos.label)}`}>
                                      {pos.label}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Legenda Affinità Ruolo & Hint FC IQ */}
                    <div className="mt-3 pt-2.5 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-muted-foreground">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                          <span>Naturale ({tacticStats.naturalCount})</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                          <span>Adattato ({tacticStats.adaptableCount})</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                          <span>Fuori Ruolo ({tacticStats.outCount})</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-primary font-bold">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Clicca su una pedina per le Istruzioni FC IQ</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
              </TabsContent>

              {/* TAB 3: TATTICHE & ISTRUZIONI FC IQ */}
              <TabsContent value="tactics" className="mt-0 space-y-6">
                <TacticsEditorTab
                  formation={currentFormation}
                  formationSlots={formationSlots}
                  roster={orderedRoster}
                  tacticalSettings={tacticalSettings}
                  onChangeTacticalSettings={setTacticalSettings}
                  onOpenInstructionModal={(slotIdx) => setInstructionSlotIndex(slotIdx)}
                  disabled={loading || isSaving}
                />
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>

      {/* Modale Istruzioni FC IQ Giocatore (EA FC 25) */}
      {instructionSlotIndex !== null && (
        <PlayerInstructionsModal
          isOpen={instructionSlotIndex !== null}
          onClose={() => setInstructionSlotIndex(null)}
          slotIndex={instructionSlotIndex}
          slotRole={currentFormation.positions[instructionSlotIndex]?.label || "CC"}
          occupant={formationSlots[instructionSlotIndex] || null}
          totalSlots={11}
          tacticalSettings={tacticalSettings}
          onUpdateInstruction={(idx, roleId, focusId) => {
            setTacticalSettings((prev) => ({
              ...prev,
              playerInstructions: {
                ...prev.playerInstructions,
                [idx]: {
                  slotRole: currentFormation.positions[idx]?.label || "CC",
                  roleId,
                  focusId,
                },
              },
            }));
          }}
          onNavigateSlot={(nextIdx) => setInstructionSlotIndex(nextIdx)}
          onOpenPlayerDetails={(p) => setSelectedPlayerModal(p)}
          disabled={loading || isSaving}
        />
      )}

      {/* Modal Dettaglio Giocatore */}
      {selectedPlayerModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4"
          onClick={() => setSelectedPlayerModal(null)}
        >
          <PlayerDetails
            currentPlayer={selectedPlayerModal}
            onClose={() => setSelectedPlayerModal(null)}
          />
        </div>
      )}
    </div>
  );
};

export default Tattica;

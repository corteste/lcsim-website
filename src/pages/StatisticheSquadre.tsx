import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  BarChart3,
  Shield,
  Trophy,
  Activity,
  Target,
  Star,
  Zap,
  Swords,
  AlertTriangle,
  Search,
  X,
  TrendingUp,
  Layers,
  Calendar,
  Users,
  Flag,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Award,
  Sparkles,
  PieChart as PieChartIcon,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { supabase } from "@/supabaseClient";
import { SUPABASE_STORAGE_URL } from "@/constants/App";
import {
  getHistoricalTeamMeta,
  HISTORICAL_TEAMS_META,
} from "@/services/archiveService";

interface RawTeamStatRow {
  STAG: number;
  WEEK: number;
  ID: string;
  ALLENATORE: string | null;
  VOTO: number | null;
  MINUTI: number | null;
  GOL: number | null;
  AGOL: number | null;
  ASST: number | null;
  TIRI_SI: number | null;
  TIRI_TOT: number | null;
  PASS_SI: number | null;
  PASS_TOT: number | null;
  DRIB_SI: number | null;
  DRIB_TOT: number | null;
  CROS_SI: number | null;
  CROS_TOT: number | null;
  CTRS_SI: number | null;
  CTRS_TOT: number | null;
  FALLI: number | null;
  PARA: number | null;
  GSUB: number | null;
  GIALLI: number | null;
  ROSSI: number | null;
  FGIOCO: number | null;
  POSS: number | null;
  CANGL: number | null;
}

interface DbTeamRow {
  TEAM_ID: string;
  NAME: string;
  NAME_ABBR: string | null;
  MANAGER: string | null;
  ACTIVE: boolean | null;
  scudetto: number | null;
  supercoppa: number | null;
}

interface CoachSummary {
  name: string;
  matches: number;
  avgRating: number;
  goalsFor: number;
  goalsAgainst: number;
}

interface SeasonBreakdown {
  stag: number;
  teamCode: string;
  matches: number;
  avgRating: number;
  gol: number;
  gsub: number;
  cleanSheets: number;
  avgPoss: number;
  passPct: number;
}

export interface AggregatedTeamStats {
  key: string; // teamCode or franchiseCode
  displayCode: string;
  franchiseCode: string;
  displayName: string;
  eraCodes: string[];
  seasonsPlayed: number[];
  scudetti: number;
  supercoppe: number;
  matches: number;
  validRatingMatches: number;
  sumVoto: number;
  avgVoto: number;
  maxVoto: number;
  minuti: number;
  gol: number;
  agol: number;
  asst: number;
  gsub: number;
  cleanSheets: number;
  para: number;
  tiriSi: number;
  tiriTot: number;
  passSi: number;
  passTot: number;
  dribSi: number;
  dribTot: number;
  crosSi: number;
  crosTot: number;
  ctrsSi: number;
  ctrsTot: number;
  falli: number;
  gialli: number;
  rossi: number;
  fgioco: number;
  cangl: number;
  validCanglMatches: number;
  avgPoss: number; // 0..100
  validPossMatches: number;
  // Derived percentages & per-game rates
  golPerGame: number;
  gsubPerGame: number;
  asstPerGame: number;
  paraPerGame: number;
  tiriTotPerGame: number;
  tiriSiPerGame: number;
  shotAccuracyPct: number;
  shotConversionPct: number;
  passSiPerGame: number;
  passAccuracyPct: number;
  dribSiPerGame: number;
  dribSuccessPct: number;
  crosSiPerGame: number;
  crosAccuracyPct: number;
  ctrsSiPerGame: number;
  ctrsSuccessPct: number;
  canglPerGame: number;
  falliPerGame: number;
  cardsIndex: number;
  coaches: CoachSummary[];
  seasonBreakdowns: SeasonBreakdown[];
  matchRows: RawTeamStatRow[];
}

type TeamStatCategory =
  | "attack"
  | "defense"
  | "rating"
  | "possession"
  | "shots"
  | "passing"
  | "duels"
  | "discipline";

type StatMode = "total" | "per_game";

interface CategoryConfig {
  id: TeamStatCategory;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  accentColor: string;
}

const TEAM_STAT_CATEGORIES: CategoryConfig[] = [
  {
    id: "attack",
    label: "Attacco & Gol",
    shortLabel: "Gol Fatti",
    icon: Target,
    description: "Potenza offensiva, reti realizzate, assist e tasso di conversione tiri/gol",
    accentColor: "text-rose-500",
  },
  {
    id: "defense",
    label: "Solidità & Clean Sheet",
    shortLabel: "Difesa",
    icon: Shield,
    description: "Porte inviolate (Clean Sheet), media reti subite e parate complessive",
    accentColor: "text-emerald-500",
  },
  {
    id: "rating",
    label: "Media Voto Squadra",
    shortLabel: "Media Voto",
    icon: Star,
    description: "Rendimento medio collettivo in pagella nelle gare ufficiali disputate",
    accentColor: "text-amber-500",
  },
  {
    id: "possession",
    label: "Possesso & Dominio",
    shortLabel: "Possesso %",
    icon: Activity,
    description: "Percentuale media di possesso palla e controllo territoriale del match",
    accentColor: "text-purple-500",
  },
  {
    id: "passing",
    label: "Regia & Passaggi",
    shortLabel: "Passaggi",
    icon: TrendingUp,
    description: "Volume di fraseggio, passaggi completati, precisione tecnica e traversoni",
    accentColor: "text-blue-500",
  },
  {
    id: "shots",
    label: "Tiri & Precisione",
    shortLabel: "Tiri Specchio",
    icon: Sparkles,
    description: "Conclusioni nello specchio della porta, volume di tiro e precisione al tiro",
    accentColor: "text-cyan-500",
  },
  {
    id: "duels",
    label: "Contrasti & 1vs1",
    shortLabel: "Contrasti",
    icon: Swords,
    description: "Contrasti vinti, efficacia nei duelli difensivi e dribbling riusciti",
    accentColor: "text-indigo-500",
  },
  {
    id: "discipline",
    label: "Corner & Disciplina",
    shortLabel: "Corner",
    icon: Flag,
    description: "Calci d'angolo conquistati, fuorigioco, falli commessi e cartellini",
    accentColor: "text-orange-500",
  },
];

const CURRENT_STAG = 11;

async function fetchCurrentSeasonTeamStatsData(): Promise<{
  statRows: RawTeamStatRow[];
  dbTeams: DbTeamRow[];
}> {
  const [statRes, teamsRes] = await Promise.all([
    supabase
      .from("as_team_stat")
      .select("*")
      .eq("STAG", CURRENT_STAG)
      .order("WEEK", { ascending: true })
      .order("ID", { ascending: true }),
    supabase
      .from("an_team")
      .select("TEAM_ID, NAME, NAME_ABBR, MANAGER, ACTIVE, scudetto, supercoppa")
      .eq("ACTIVE", true)
      .order("NAME", { ascending: true }),
  ]);

  if (statRes.error) {
    console.error("Errore caricamento as_team_stat S11:", statRes.error);
  }
  if (teamsRes.error) {
    console.error("Errore caricamento an_team:", teamsRes.error);
  }

  return {
    statRows: (statRes.data || []) as RawTeamStatRow[],
    dbTeams: (teamsRes.data || []) as DbTeamRow[],
  };
}

function TeamLogo({
  teamCode,
  franchiseCode,
  className = "h-8 w-8",
}: {
  teamCode: string;
  franchiseCode?: string;
  className?: string;
}) {
  const [attempt, setAttempt] = useState<number>(0);

  useEffect(() => {
    setAttempt(0);
  }, [teamCode, franchiseCode]);

  const src = useMemo(() => {
    if (attempt === 0) {
      return `${SUPABASE_STORAGE_URL}/images/teams/${teamCode}_Logo.png`;
    }
    if (attempt === 1 && franchiseCode && franchiseCode !== teamCode) {
      return `${SUPABASE_STORAGE_URL}/images/teams/${franchiseCode}_Logo.png`;
    }
    return `${SUPABASE_STORAGE_URL}/images/LCSIM_Logo_SMALL.png`;
  }, [teamCode, franchiseCode, attempt]);

  return (
    <img
      src={src}
      alt={teamCode}
      className={`${className} object-contain shrink-0 drop-shadow-xs`}
      onError={() => {
        if (attempt < 2) setAttempt((prev) => prev + 1);
      }}
    />
  );
}

const TEAM_COLORS: Record<string, string> = {
  APD: "#ec4899", // pink
  ACD: "#ef4444", // red
  GAP: "#b91c1c",
  ACF: "#10b981", // emerald
  QFM: "#059669",
  PFC: "#f97316", // orange
  PAN: "#ea580c",
  HTV: "#c2410c",
  MAR: "#f43f5e", // rose
  SBM: "#be123c",
  OLD: "#3b82f6", // blue
  PRO: "#1d4ed8",
  YBO: "#60a5fa",
  VFC: "#f59e0b", // amber
  ALV: "#0ea5e9", // sky
  RMB: "#b91c1c", // dark red
  BLA: "#71717a", // zinc
  SKA: "#14b8a6", // teal
  ASK: "#0f766e",
  HVI: "#115e59",
  COS: "#a855f7", // purple
  EUR: "#6366f1", // indigo
  KAR: "#64748b", // slate
  FCP: "#94a3b8",
};

const DEFAULT_PALETTE = [
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#ec4899",
  "#8b5cf6",
  "#06b6d4",
  "#f43f5e",
  "#14b8a6",
  "#f97316",
  "#6366f1",
  "#84cc16",
  "#a855f7",
  "#eab308",
  "#64748b",
];

function getTeamColor(code: string, index: number): string {
  const clean = (code || "").trim().toUpperCase();
  return TEAM_COLORS[clean] || DEFAULT_PALETTE[index % DEFAULT_PALETTE.length];
}

export default function StatisticheSquadre() {
  const [statCategory, setStatCategory] = useState<TeamStatCategory>("attack");
  const [statMode, setStatMode] = useState<StatMode>("total");
  const [chartViewMode, setChartViewMode] = useState<"bar" | "donut">("bar");
  const [showKpiChart, setShowKpiChart] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedTeam, setSelectedTeam] = useState<AggregatedTeamStats | null>(null);
  const [modalTab, setModalTab] = useState<"overview" | "seasons" | "matches">("overview");

  const { data, isLoading } = useQuery({
    queryKey: ["as_team_stat_s11"],
    queryFn: fetchCurrentSeasonTeamStatsData,
    staleTime: 2 * 60 * 1000,
  });

  const statRows = data?.statRows ?? [];
  const dbTeams = data?.dbTeams ?? [];

  // Filter rows by valid match played (MINUTI > 0 or VOTO != null)
  const filteredRawRows = useMemo(() => {
    return statRows.filter((r) => {
      const isPlayed = (r.MINUTI !== null && Number(r.MINUTI) > 0) || r.VOTO !== null;
      return isPlayed;
    });
  }, [statRows]);

  // Aggregate stats per active team for the current season (Stagione 11)
  const aggregatedTeams = useMemo<AggregatedTeamStats[]>(() => {
    return dbTeams.map((team) => {
      const teamCode = team.TEAM_ID.trim().toUpperCase();
      const rows = filteredRawRows.filter(
        (r) => (r.ID || "").trim().toUpperCase() === teamCode
      );

      let matches = 0;
      let validRatingMatches = 0;
      let sumVoto = 0;
      let maxVoto = 0;
      let minuti = 0;
      let gol = 0;
      let agol = 0;
      let asst = 0;
      let gsub = 0;
      let cleanSheets = 0;
      let para = 0;
      let tiriSi = 0;
      let tiriTot = 0;
      let passSi = 0;
      let passTot = 0;
      let dribSi = 0;
      let dribTot = 0;
      let crosSi = 0;
      let crosTot = 0;
      let ctrsSi = 0;
      let ctrsTot = 0;
      let falli = 0;
      let gialli = 0;
      let rossi = 0;
      let fgioco = 0;
      let cangl = 0;
      let validCanglMatches = 0;
      let sumPoss = 0;
      let validPossMatches = 0;

      const coachMap = new Map<
        string,
        { matches: number; sumVoto: number; votoCount: number; gf: number; gs: number }
      >();

      for (const r of rows) {
        matches += 1;
        minuti += Number(r.MINUTI ?? 0);
        const g = Number(r.GOL ?? 0);
        const gs = Number(r.GSUB ?? 0);
        gol += g;
        agol += Number(r.AGOL ?? 0);
        asst += Number(r.ASST ?? 0);
        gsub += gs;
        if (gs === 0) cleanSheets += 1;
        para += Number(r.PARA ?? 0);
        tiriSi += Number(r.TIRI_SI ?? 0);
        tiriTot += Number(r.TIRI_TOT ?? 0);
        passSi += Number(r.PASS_SI ?? 0);
        passTot += Number(r.PASS_TOT ?? 0);
        dribSi += Number(r.DRIB_SI ?? 0);
        dribTot += Number(r.DRIB_TOT ?? 0);
        crosSi += Number(r.CROS_SI ?? 0);
        crosTot += Number(r.CROS_TOT ?? 0);
        ctrsSi += Number(r.CTRS_SI ?? 0);
        ctrsTot += Number(r.CTRS_TOT ?? 0);
        falli += Number(r.FALLI ?? 0);
        gialli += Number(r.GIALLI ?? 0);
        rossi += Number(r.ROSSI ?? 0);
        fgioco += Number(r.FGIOCO ?? 0);

        if (r.VOTO !== null && r.VOTO !== undefined && !isNaN(Number(r.VOTO))) {
          const v = Number(r.VOTO);
          sumVoto += v;
          validRatingMatches += 1;
          if (v > maxVoto) maxVoto = v;
        }

        if (r.CANGL !== null && r.CANGL !== undefined) {
          cangl += Number(r.CANGL);
          validCanglMatches += 1;
        }

        if (
          r.POSS !== null &&
          r.POSS !== undefined &&
          Number(r.POSS) > 0 &&
          Number(r.POSS) < 0.99
        ) {
          sumPoss += Number(r.POSS) * 100;
          validPossMatches += 1;
        }

        // Coach aggregation
        const coachName = (r.ALLENATORE || team.MANAGER || "Staff Tecnico").trim();
        if (coachName && coachName !== "N/D") {
          const prev = coachMap.get(coachName) || {
            matches: 0,
            sumVoto: 0,
            votoCount: 0,
            gf: 0,
            gs: 0,
          };
          prev.matches += 1;
          if (r.VOTO !== null && !isNaN(Number(r.VOTO))) {
            prev.sumVoto += Number(r.VOTO);
            prev.votoCount += 1;
          }
          prev.gf += g;
          prev.gs += gs;
          coachMap.set(coachName, prev);
        }
      }

      const gCount = Math.max(1, matches);
      const avgVoto =
        validRatingMatches > 0
          ? Math.round((sumVoto / validRatingMatches) * 100) / 100
          : 0;
      const avgPoss =
        validPossMatches > 0
          ? Math.round((sumPoss / validPossMatches) * 10) / 10
          : 0;

      const coaches: CoachSummary[] = Array.from(coachMap.entries())
        .map(([name, c]) => ({
          name,
          matches: c.matches,
          avgRating:
            c.votoCount > 0 ? Math.round((c.sumVoto / c.votoCount) * 100) / 100 : 0,
          goalsFor: c.gf,
          goalsAgainst: c.gs,
        }))
        .sort((a, b) => b.matches - a.matches || b.avgRating - a.avgRating);

      const seasonBreakdowns: SeasonBreakdown[] =
        matches > 0
          ? [
              {
                stag: CURRENT_STAG,
                teamCode,
                matches,
                avgRating: avgVoto,
                gol,
                gsub,
                cleanSheets,
                avgPoss,
                passPct:
                  passTot > 0 ? Math.round((passSi / passTot) * 1000) / 10 : 0,
              },
            ]
          : [];

      return {
        key: teamCode,
        displayCode: teamCode,
        franchiseCode: teamCode,
        displayName: team.NAME,
        eraCodes: [teamCode],
        seasonsPlayed: [CURRENT_STAG],
        scudetti: Number(team.scudetto ?? 0),
        supercoppe: Number(team.supercoppa ?? 0),
        matches,
        validRatingMatches,
        sumVoto,
        avgVoto,
        maxVoto,
        minuti,
        gol,
        agol,
        asst,
        gsub,
        cleanSheets,
        para,
        tiriSi,
        tiriTot,
        passSi,
        passTot,
        dribSi,
        dribTot,
        crosSi,
        crosTot,
        ctrsSi,
        ctrsTot,
        falli,
        gialli,
        rossi,
        fgioco,
        cangl,
        validCanglMatches,
        avgPoss,
        validPossMatches,
        golPerGame: matches > 0 ? Math.round((gol / gCount) * 100) / 100 : 0,
        gsubPerGame: matches > 0 ? Math.round((gsub / gCount) * 100) / 100 : 0,
        asstPerGame: matches > 0 ? Math.round((asst / gCount) * 100) / 100 : 0,
        paraPerGame: matches > 0 ? Math.round((para / gCount) * 100) / 100 : 0,
        tiriTotPerGame: matches > 0 ? Math.round((tiriTot / gCount) * 10) / 10 : 0,
        tiriSiPerGame: matches > 0 ? Math.round((tiriSi / gCount) * 10) / 10 : 0,
        shotAccuracyPct:
          tiriTot > 0 ? Math.round((tiriSi / tiriTot) * 1000) / 10 : 0,
        shotConversionPct:
          tiriTot > 0 ? Math.round((gol / tiriTot) * 1000) / 10 : 0,
        passSiPerGame: matches > 0 ? Math.round((passSi / gCount) * 10) / 10 : 0,
        passAccuracyPct:
          passTot > 0 ? Math.round((passSi / passTot) * 1000) / 10 : 0,
        dribSiPerGame: matches > 0 ? Math.round((dribSi / gCount) * 10) / 10 : 0,
        dribSuccessPct:
          dribTot > 0 ? Math.round((dribSi / dribTot) * 1000) / 10 : 0,
        crosSiPerGame: matches > 0 ? Math.round((crosSi / gCount) * 10) / 10 : 0,
        crosAccuracyPct:
          crosTot > 0 ? Math.round((crosSi / crosTot) * 1000) / 10 : 0,
        ctrsSiPerGame: matches > 0 ? Math.round((ctrsSi / gCount) * 10) / 10 : 0,
        ctrsSuccessPct:
          ctrsTot > 0 ? Math.round((ctrsSi / ctrsTot) * 1000) / 10 : 0,
        canglPerGame: matches > 0 ? Math.round((cangl / gCount) * 10) / 10 : 0,
        falliPerGame: matches > 0 ? Math.round((falli / gCount) * 10) / 10 : 0,
        cardsIndex: Math.round((gialli * 1 + rossi * 3) * 10) / 10,
        coaches,
        seasonBreakdowns,
        matchRows: rows,
      };
    });
  }, [dbTeams, filteredRawRows]);

  // Dynamic percentage share data based on selected category & statMode
  const statShareData = useMemo(() => {
    const isPerGame = statMode === "per_game";

    let metricLabel = "";
    let metricUnit = "";
    let getValue: (t: AggregatedTeamStats) => number;
    let formatVal: (v: number) => string;

    switch (statCategory) {
      case "attack":
        metricLabel = isPerGame ? "Media Gol a Partita" : "Gol Totali Realizzati";
        metricUnit = isPerGame ? "gol/g" : "gol";
        getValue = (t) => (isPerGame ? t.golPerGame : t.gol);
        formatVal = (v) => (isPerGame ? v.toFixed(2) : String(Math.round(v)));
        break;
      case "defense":
        metricLabel = isPerGame ? "Percentuale Clean Sheet" : "Clean Sheet Totali";
        metricUnit = isPerGame ? "% CS" : "CS";
        getValue = (t) => {
          if (isPerGame) {
            return t.matches > 0 ? (t.cleanSheets / t.matches) * 100 : 0;
          }
          return t.cleanSheets;
        };
        formatVal = (v) => (isPerGame ? `${v.toFixed(1)}%` : String(Math.round(v)));
        break;
      case "rating":
        metricLabel = "Media Voto Pagelle";
        metricUnit = "M.Voto";
        getValue = (t) => t.avgVoto;
        formatVal = (v) => v.toFixed(2);
        break;
      case "possession":
        metricLabel = "Percentuale Media di Possesso";
        metricUnit = "% Poss";
        getValue = (t) => t.avgPoss;
        formatVal = (v) => `${v.toFixed(1)}%`;
        break;
      case "passing":
        metricLabel = isPerGame ? "Passaggi Riusciti / Gara" : "Passaggi Riusciti Totali";
        metricUnit = isPerGame ? "pass/g" : "pass";
        getValue = (t) => (isPerGame ? t.passSiPerGame : t.passSi);
        formatVal = (v) => (isPerGame ? v.toFixed(1) : v.toLocaleString("it-IT"));
        break;
      case "shots":
        metricLabel = isPerGame ? "Tiri in Porta / Gara" : "Tiri nello Specchio Totali";
        metricUnit = isPerGame ? "tiri/g" : "tiri in porta";
        getValue = (t) => (isPerGame ? t.tiriSiPerGame : t.tiriSi);
        formatVal = (v) => (isPerGame ? v.toFixed(1) : String(Math.round(v)));
        break;
      case "duels":
        metricLabel = isPerGame ? "Contrasti Vinti / Gara" : "Contrasti Difensivi Vinti";
        metricUnit = isPerGame ? "ctrs/g" : "contrasti";
        getValue = (t) => (isPerGame ? t.ctrsSiPerGame : t.ctrsSi);
        formatVal = (v) => (isPerGame ? v.toFixed(1) : String(Math.round(v)));
        break;
      case "discipline":
        metricLabel = isPerGame ? "Calci d'Angolo / Gara" : "Calci d'Angolo Totali";
        metricUnit = isPerGame ? "corner/g" : "angoli";
        getValue = (t) => (isPerGame ? t.canglPerGame : t.cangl);
        formatVal = (v) => (isPerGame ? v.toFixed(2) : String(Math.round(v)));
        break;
    }

    const items = aggregatedTeams.map((t, index) => {
      const val = getValue(t);
      return {
        key: t.key,
        code: t.displayCode,
        name: t.displayName,
        franchiseCode: t.franchiseCode,
        value: val,
        displayValue: formatVal(val),
        color: getTeamColor(t.displayCode, index),
        teamRef: t,
      };
    });

    const totalSum = items.reduce((acc, i) => acc + (i.value > 0 ? i.value : 0), 0);

    const list = items
      .map((item) => ({
        ...item,
        percentage: totalSum > 0 ? Math.round((item.value / totalSum) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.percentage - a.percentage || b.value - a.value);

    return {
      metricLabel,
      metricUnit,
      totalSum,
      totalDisplay: formatVal(totalSum),
      items: list,
    };
  }, [aggregatedTeams, statCategory, statMode]);

  const activeCategoryConfig = useMemo(
    () =>
      TEAM_STAT_CATEGORIES.find((c) => c.id === statCategory) ||
      TEAM_STAT_CATEGORIES[0],
    [statCategory]
  );

  // Get primary numeric metric for sorting
  const getPrimarySortValue = (t: AggregatedTeamStats): number => {
    const isPerGame = statMode === "per_game";
    switch (statCategory) {
      case "attack":
        return isPerGame ? t.golPerGame : t.gol;
      case "defense":
        // For per_game mode, sort by Clean Sheet % or lowest gsubPerGame; for total, sort by Clean Sheets
        return isPerGame
          ? Math.round((t.cleanSheets / Math.max(1, t.matches)) * 1000) / 10
          : t.cleanSheets;
      case "rating":
        return t.avgVoto;
      case "possession":
        return t.avgPoss;
      case "passing":
        return isPerGame ? t.passSiPerGame : t.passSi;
      case "shots":
        return isPerGame ? t.tiriSiPerGame : t.tiriSi;
      case "duels":
        return isPerGame ? t.ctrsSiPerGame : t.ctrsSi;
      case "discipline":
        return isPerGame ? t.canglPerGame : t.cangl;
    }
  };

  // Formatted display for Podium & Highlight column
  const getTeamStatDisplay = (
    t: AggregatedTeamStats
  ): { value: string; label: string; context: string } => {
    const isPerGame = statMode === "per_game";
    switch (statCategory) {
      case "attack":
        return {
          value: isPerGame ? t.golPerGame.toFixed(2) : String(t.gol),
          label: isPerGame ? "Gol / Gara" : "Gol Segnati",
          context: `${t.asst} assist • ${t.shotConversionPct}% conv. tiri (${t.gol}/${t.tiriTot})`,
        };
      case "defense":
        const csPct = Math.round((t.cleanSheets / Math.max(1, t.matches)) * 100);
        return {
          value: isPerGame ? `${csPct}%` : String(t.cleanSheets),
          label: isPerGame ? "% Clean Sheet" : "Clean Sheet",
          context: `${t.gsub} GS (${t.gsubPerGame.toFixed(2)}/gara) • ${t.para} parate`,
        };
      case "rating":
        return {
          value: t.avgVoto.toFixed(2),
          label: "Media Voto",
          context: `Picco max ${t.maxVoto.toFixed(1)} • ${t.matches} gare a referto`,
        };
      case "possession":
        return {
          value: `${t.avgPoss.toFixed(1)}%`,
          label: "Possesso Medio",
          context: `${t.passAccuracyPct}% prec. passaggi • ${t.passSiPerGame} pass/gara`,
        };
      case "passing":
        return {
          value: isPerGame
            ? t.passSiPerGame.toFixed(1)
            : t.passSi.toLocaleString("it-IT"),
          label: isPerGame ? "Passaggi Riusciti / Gara" : "Passaggi Riusciti",
          context: `${t.passAccuracyPct}% precisione (${t.passTot.toLocaleString("it-IT")} tent.) • ${t.crosSi} cross`,
        };
      case "shots":
        return {
          value: isPerGame ? t.tiriSiPerGame.toFixed(2) : String(t.tiriSi),
          label: isPerGame ? "Tiri in Porta / Gara" : "Tiri nello Specchio",
          context: `${t.shotAccuracyPct}% precisione (${t.tiriTot} tiri tot.) • ${t.gol} gol`,
        };
      case "duels":
        return {
          value: isPerGame ? t.ctrsSiPerGame.toFixed(2) : String(t.ctrsSi),
          label: isPerGame ? "Contrasti Vinti / Gara" : "Contrasti Vinti",
          context: `${t.ctrsSuccessPct}% contrasti • ${t.dribSi} drib. riusciti (${t.dribSuccessPct}%)`,
        };
      case "discipline":
        return {
          value: isPerGame ? t.canglPerGame.toFixed(2) : String(t.cangl),
          label: isPerGame ? "Corner / Gara" : "Calci d'Angolo",
          context: `${t.gialli}G / ${t.rossi}R • ${t.falli} falli • ${t.fgioco} fuorigioco`,
        };
    }
  };

  // Filtered and sorted teams
  const sortedTeams = useMemo(() => {
    return aggregatedTeams
      .filter((t) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase().trim();
        const matchName = t.displayName.toLowerCase().includes(q);
        const matchCode = t.eraCodes.some((c) => c.toLowerCase().includes(q));
        const matchCoach = t.coaches.some((c) =>
          c.name.toLowerCase().includes(q)
        );
        return matchName || matchCode || matchCoach;
      })
      .sort((a, b) => {
        const valA = getPrimarySortValue(a);
        const valB = getPrimarySortValue(b);
        if (Math.abs(valB - valA) > 0.0001) return valB - valA;
        // Tie-breakers
        if (statCategory === "defense") {
          return a.gsubPerGame - b.gsubPerGame;
        }
        return (
          b.avgVoto - a.avgVoto ||
          b.gol - a.gol ||
          a.displayName.localeCompare(b.displayName)
        );
      });
  }, [aggregatedTeams, statCategory, statMode, searchQuery]);

  const podiumTeams = useMemo(() => sortedTeams.slice(0, 3), [sortedTeams]);

  const handleOpenTeamModal = (team: AggregatedTeamStats) => {
    setSelectedTeam(team);
    setModalTab("overview");
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <Navbar />

      <main className="container mx-auto px-4 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* BROADCAST HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-border/80">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5" />
                Serie A • Stagione 11
              </span>
              <span className="text-xs text-muted-foreground">
                Statistiche Ufficiali di Squadra • Campionato in Corso
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              Statistiche Squadre
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              Rendimenti, efficienza offensiva e difensiva, possesso palla e indicatori prestazionali dei 12 club di Serie A nella stagione in corso.
            </p>
          </div>
        </div>

        {/* UNIFIED COMPACT FILTER & CATEGORY BAR */}
        <Card className="border border-border/80 bg-card shadow-xs overflow-hidden">
          <div className="p-3 sm:px-4 sm:py-3 flex flex-wrap items-center justify-between gap-2.5">
            {/* Left Group: Category Select */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground hidden sm:inline">
                  Statistica:
                </span>
                <Select
                  value={statCategory}
                  onValueChange={(val) => setStatCategory(val as TeamStatCategory)}
                >
                  <SelectTrigger className="h-8 w-[205px] sm:w-[225px] text-xs font-bold bg-muted/40 border-border/70">
                    <div className="flex items-center gap-1.5 truncate">
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {TEAM_STAT_CATEGORIES.map((cat) => {
                      const Icon = cat.icon;
                      return (
                        <SelectItem
                          key={cat.id}
                          value={cat.id}
                          className="text-xs font-bold"
                        >
                          <span className="inline-flex items-center gap-2">
                            <Icon className={`h-3.5 w-3.5 ${cat.accentColor}`} />
                            <span>{cat.label}</span>
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Right Group: Total/Per-Game Toggle, Search, KPI Chart Button */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center bg-muted/50 p-0.5 rounded-lg border border-border/60">
                <button
                  type="button"
                  onClick={() => setStatMode("total")}
                  className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    statMode === "total"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Totali
                </button>
                <button
                  type="button"
                  onClick={() => setStatMode("per_game")}
                  className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    statMode === "per_game"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Media/G
                </button>
              </div>

              {/* Search input */}
              <div className="relative w-[130px] sm:w-[170px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Cerca club..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 pr-7 text-xs bg-muted/40 border-border/70 rounded-lg"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              <Button
                type="button"
                variant={showKpiChart ? "default" : "outline"}
                size="sm"
                onClick={() => setShowKpiChart((prev) => !prev)}
                className={`h-8 text-xs font-bold gap-1.5 shrink-0 cursor-pointer ${
                  showKpiChart
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                    : "border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                }`}
              >
                <PieChartIcon className="h-3.5 w-3.5" />
                <span>{showKpiChart ? "Chiudi Grafico" : "Grafico Quote (%)"}</span>
                {showKpiChart ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          </div>

          {/* Mini inline 100% distribution footer strip when chart is closed */}
          {!showKpiChart && statShareData.items.length > 0 && (
            <div
              onClick={() => setShowKpiChart(true)}
              className="px-3.5 py-1.5 border-t border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer flex items-center gap-3"
              title="Clicca per espandere il grafico completo delle quote percentuali"
            >
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider shrink-0">
                Totale {activeCategoryConfig.shortLabel}:{" "}
                <strong className="text-foreground font-mono">
                  {statShareData.totalDisplay} {statShareData.metricUnit}
                </strong>
              </span>

              <div className="h-2 flex-1 rounded-full overflow-hidden flex bg-muted/60">
                {statShareData.items.map((item) => {
                  if (item.percentage <= 0) return null;
                  return (
                    <div
                      key={item.key}
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: item.color,
                      }}
                      className="h-full"
                      title={`${item.name}: ${item.percentage}%`}
                    />
                  );
                })}
              </div>

              <div className="hidden md:flex items-center gap-2 shrink-0 text-[10px] font-mono text-muted-foreground">
                {statShareData.items.slice(0, 3).map((item) => (
                  <span key={item.key} className="inline-flex items-center gap-1">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <strong className="text-foreground">{item.code}</strong>{" "}
                    {item.percentage}%
                  </span>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* COLLAPSIBLE TEAM STAT PERCENTAGE SHARE CHART CARD */}
        {showKpiChart && (
          <Card className="border border-border/80 shadow-md bg-card overflow-hidden">
            <div className="p-3.5 sm:p-4 border-b border-border/80 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <Badge
                    variant="outline"
                    className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-bold px-2 py-0 text-[10px] uppercase tracking-wider flex items-center gap-1"
                  >
                    <activeCategoryConfig.icon className="h-3 w-3" />
                    Distribuzione Percentuale
                  </Badge>
                  <span className="text-xs text-muted-foreground font-mono">
                    Totale Registrato:{" "}
                    <strong className="text-foreground">
                      {statShareData.totalDisplay}
                    </strong>{" "}
                    {statShareData.metricUnit}
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-black text-foreground">
                  Quota Squadre • {activeCategoryConfig.label}
                </h3>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                <div className="flex items-center bg-muted/50 p-0.5 rounded-xl border border-border/60">
                  <button
                    type="button"
                    onClick={() => setChartViewMode("bar")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      chartViewMode === "bar"
                        ? "bg-card text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <BarChart3 className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Barre</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartViewMode("donut")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      chartViewMode === "donut"
                        ? "bg-card text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <PieChartIcon className="h-3.5 w-3.5 text-amber-500" />
                    <span>Ciambella</span>
                  </button>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowKpiChart(false)}
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                  title="Chiudi pannello grafico"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="p-4 sm:p-5 space-y-4">
              {/* Multi-segmented distribution strip */}
              <div className="space-y-1">
                <div className="h-3 w-full rounded-full overflow-hidden flex bg-muted/60 border border-border/60 shadow-inner">
                  {statShareData.items.map((item) => {
                    if (item.percentage <= 0) return null;
                    return (
                      <div
                        key={item.key}
                        style={{
                          width: `${item.percentage}%`,
                          backgroundColor: item.color,
                        }}
                        className="h-full transition-all duration-300 hover:opacity-80 cursor-pointer"
                        onClick={() => handleOpenTeamModal(item.teamRef)}
                        title={`${item.name} (${item.code}): ${item.percentage}% (${item.displayValue} ${statShareData.metricUnit})`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Main Chart Area */}
              {statShareData.items.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground text-xs">
                  Nessun dato statistico disponibile per i filtri selezionati.
                </div>
              ) : chartViewMode === "bar" ? (
                <div className="w-full h-[240px] pt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={statShareData.items}
                      margin={{ top: 10, right: 10, left: -15, bottom: 10 }}
                    >
                      <XAxis
                        dataKey="code"
                        tick={{ fill: "currentColor", fontSize: 11, fontWeight: 700 }}
                        interval={0}
                        axisLine={{ stroke: "rgba(128,128,128,0.2)" }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: "currentColor", fontSize: 10 }}
                        tickFormatter={(val) => `${val}%`}
                        axisLine={false}
                        tickLine={false}
                      />
                      <RechartsTooltip
                        content={({ active, payload }: any) => {
                          if (active && payload && payload.length) {
                            const d = payload[0].payload;
                            return (
                              <div className="rounded-xl border border-border/80 bg-popover/95 p-3 shadow-xl backdrop-blur-md text-xs space-y-1.5 z-50 min-w-[190px]">
                                <div className="flex items-center gap-2">
                                  <TeamLogo
                                    teamCode={d.code}
                                    franchiseCode={d.franchiseCode}
                                    className="h-5 w-5"
                                  />
                                  <span className="font-bold text-popover-foreground">
                                    {d.name}
                                  </span>
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] font-mono px-1 py-0"
                                  >
                                    {d.code}
                                  </Badge>
                                </div>
                                <div className="flex items-center justify-between gap-4 pt-1 border-t border-border/60">
                                  <span className="text-muted-foreground">
                                    Quota sulla Lega:
                                  </span>
                                  <span
                                    className="font-mono font-black text-sm"
                                    style={{ color: d.color }}
                                  >
                                    {d.percentage}%
                                  </span>
                                </div>
                                <div className="flex items-center justify-between gap-4 text-muted-foreground text-[11px]">
                                  <span>Valore Registrato:</span>
                                  <span className="font-mono font-bold text-foreground">
                                    {d.displayValue} {statShareData.metricUnit}
                                  </span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar
                        dataKey="percentage"
                        radius={[6, 6, 0, 0]}
                        onClick={(data: any) => {
                          if (data && data.teamRef) {
                            handleOpenTeamModal(data.teamRef);
                          }
                        }}
                        className="cursor-pointer"
                      >
                        {statShareData.items.map((entry) => (
                          <Cell
                            key={`cell-${entry.key}`}
                            fill={entry.color}
                            className="hover:opacity-85 transition-opacity cursor-pointer"
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                  <div className="lg:col-span-5 h-[220px] relative flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statShareData.items}
                          dataKey="percentage"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={88}
                          paddingAngle={2}
                          onClick={(data: any) => {
                            if (data && data.teamRef) {
                              handleOpenTeamModal(data.teamRef);
                            }
                          }}
                          className="cursor-pointer"
                        >
                          {statShareData.items.map((entry) => (
                            <Cell
                              key={`slice-${entry.key}`}
                              fill={entry.color}
                              stroke="rgba(0,0,0,0.2)"
                              className="hover:opacity-85 transition-opacity cursor-pointer"
                            />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          content={({ active, payload }: any) => {
                            if (active && payload && payload.length) {
                              const d = payload[0].payload;
                              return (
                                <div className="rounded-xl border border-border/80 bg-popover/95 p-3 shadow-xl backdrop-blur-md text-xs space-y-1.5 z-50 min-w-[190px]">
                                  <div className="flex items-center gap-2">
                                    <TeamLogo
                                      teamCode={d.code}
                                      franchiseCode={d.franchiseCode}
                                      className="h-5 w-5"
                                    />
                                    <span className="font-bold text-popover-foreground">
                                      {d.name}
                                    </span>
                                    <Badge
                                      variant="outline"
                                      className="text-[10px] font-mono px-1 py-0"
                                    >
                                      {d.code}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center justify-between gap-4 pt-1 border-t border-border/60">
                                    <span className="text-muted-foreground">
                                      Quota sulla Lega:
                                    </span>
                                    <span
                                      className="font-mono font-black text-sm"
                                      style={{ color: d.color }}
                                    >
                                      {d.percentage}%
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between gap-4 text-muted-foreground text-[11px]">
                                    <span>Valore Registrato:</span>
                                    <span className="font-mono font-bold text-foreground">
                                      {d.displayValue} {statShareData.metricUnit}
                                    </span>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                      <span className="text-[9px] uppercase font-bold text-muted-foreground">
                        Quota
                      </span>
                      <span className="text-lg font-black font-mono text-foreground">
                        100%
                      </span>
                    </div>
                  </div>

                  <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-[220px] overflow-y-auto pr-1">
                    {statShareData.items.map((item, idx) => (
                      <div
                        key={item.key}
                        onClick={() => handleOpenTeamModal(item.teamRef)}
                        className="p-2 rounded-xl border border-border/70 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer flex items-center justify-between gap-2 group"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                          <TeamLogo
                            teamCode={item.code}
                            franchiseCode={item.franchiseCode}
                            className="h-5 w-5"
                          />
                          <div className="min-w-0">
                            <span className="font-bold text-xs text-foreground block truncate group-hover:text-emerald-500 transition-colors">
                              {item.name}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono block">
                              {item.displayValue} {statShareData.metricUnit}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0 flex items-center gap-1.5">
                          <span
                            className="font-mono font-black text-xs px-1.5 py-0.5 rounded-md border"
                            style={{
                              color: item.color,
                              borderColor: `${item.color}40`,
                              backgroundColor: `${item.color}15`,
                            }}
                          >
                            {item.percentage}%
                          </span>
                          <span className="text-[9px] text-muted-foreground font-mono">
                            #{idx + 1}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* COMPACT HORIZONTAL PODIUM TOP 3 TEAMS SHOWCASE */}
        {podiumTeams.length >= 3 && !isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              {
                team: podiumTeams[0],
                rankLabel: "👑 1° Leader",
                cardClass:
                  "border-amber-500/60 bg-gradient-to-r from-amber-500/10 via-card to-card hover:border-amber-400",
                badgeClass:
                  "bg-gradient-to-r from-amber-500 to-yellow-500 text-black",
                valClass: "text-amber-500",
              },
              {
                team: podiumTeams[1],
                rankLabel: "🥈 2° Posto",
                cardClass:
                  "border-slate-300/60 dark:border-slate-600/60 bg-card hover:border-slate-400",
                badgeClass:
                  "bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200",
                valClass: "text-foreground",
              },
              {
                team: podiumTeams[2],
                rankLabel: "🥉 3° Posto",
                cardClass:
                  "border-amber-700/40 bg-card hover:border-amber-600",
                badgeClass:
                  "bg-amber-800/20 text-amber-700 dark:text-amber-400 border border-amber-700/30",
                valClass: "text-foreground",
              },
            ].map(({ team, rankLabel, cardClass, badgeClass, valClass }) => {
              const stat = getTeamStatDisplay(team);
              return (
                <Card
                  key={team.key}
                  onClick={() => handleOpenTeamModal(team)}
                  className={`border ${cardClass} transition-all duration-150 cursor-pointer p-3.5 group shadow-xs`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-11 w-11 flex items-center justify-center rounded-xl bg-muted/40 border border-border/60 p-1.5 shrink-0 group-hover:scale-105 transition-transform">
                        <TeamLogo
                          teamCode={team.displayCode}
                          franchiseCode={team.franchiseCode}
                          className="h-8 w-8"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span
                            className={`px-2 py-0 rounded-full text-[10px] font-black ${badgeClass}`}
                          >
                            {rankLabel}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {team.matches}g
                          </span>
                        </div>
                        <span className="font-extrabold text-sm text-foreground block truncate group-hover:text-emerald-500 transition-colors">
                          {team.displayName}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono block truncate">
                          {stat.context}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0 pl-2 border-l border-border/50">
                      <span
                        className={`text-xl font-black font-mono block leading-none ${valClass}`}
                      >
                        {stat.value}
                      </span>
                      <span className="text-[9px] uppercase font-bold text-muted-foreground block mt-1">
                        {stat.label}
                      </span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* FULL COMPARATIVE TELEMETRY TABLE */}
        <Card className="border border-border/80 shadow-md bg-card overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-border/80 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-emerald-500" />
                Graduatoria Telemetrica Completa • {activeCategoryConfig.label}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Clicca su qualsiasi squadra per aprire il dossier telemetrico completo, gli allenatori e i referti gara.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Cerca club, sigla o mister..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 w-full sm:w-[230px] pl-8 text-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          <div className="p-0 overflow-x-auto">
            {isLoading ? (
              <div className="p-12 text-center text-muted-foreground text-sm">
                Caricamento telemetrie di squadra in corso...
              </div>
            ) : sortedTeams.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground text-sm">
                Nessuna squadra trovata con i filtri selezionati.
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-[11px] font-bold uppercase text-muted-foreground tracking-wider select-none">
                    <th className="py-3 px-3 text-center w-12">Pos.</th>
                    <th className="py-3 px-3">Club / Franchigia</th>
                    <th className="py-3 px-2 text-center">Gare</th>
                    <th
                      onClick={() => setStatCategory("rating")}
                      className={`py-3 px-2.5 text-center cursor-pointer hover:text-foreground transition-colors ${
                        statCategory === "rating" ? "text-amber-500 font-black bg-amber-500/5" : ""
                      }`}
                    >
                      M.Voto
                    </th>
                    <th
                      onClick={() => setStatCategory("attack")}
                      className={`py-3 px-2.5 text-center cursor-pointer hover:text-foreground transition-colors ${
                        statCategory === "attack" ? "text-rose-500 font-black bg-rose-500/5" : ""
                      }`}
                    >
                      {statMode === "per_game" ? "GF/G" : "GF"} (Asst)
                    </th>
                    <th
                      onClick={() => setStatCategory("defense")}
                      className={`py-3 px-2.5 text-center cursor-pointer hover:text-foreground transition-colors ${
                        statCategory === "defense" ? "text-emerald-500 font-black bg-emerald-500/5" : ""
                      }`}
                    >
                      CS (GS)
                    </th>
                    <th
                      onClick={() => setStatCategory("possession")}
                      className={`py-3 px-2.5 text-center cursor-pointer hover:text-foreground transition-colors ${
                        statCategory === "possession" ? "text-purple-500 font-black bg-purple-500/5" : ""
                      }`}
                    >
                      Poss %
                    </th>
                    <th
                      onClick={() => setStatCategory("shots")}
                      className={`py-3 px-2.5 text-center cursor-pointer hover:text-foreground transition-colors ${
                        statCategory === "shots" ? "text-cyan-500 font-black bg-cyan-500/5" : ""
                      }`}
                    >
                      Tiri (Spec%)
                    </th>
                    <th
                      onClick={() => setStatCategory("passing")}
                      className={`py-3 px-2.5 text-center cursor-pointer hover:text-foreground transition-colors ${
                        statCategory === "passing" ? "text-blue-500 font-black bg-blue-500/5" : ""
                      }`}
                    >
                      Passaggi (Prec%)
                    </th>
                    <th
                      onClick={() => setStatCategory("duels")}
                      className={`py-3 px-2.5 text-center cursor-pointer hover:text-foreground transition-colors ${
                        statCategory === "duels" ? "text-indigo-500 font-black bg-indigo-500/5" : ""
                      }`}
                    >
                      Ctrs / Drib
                    </th>
                    <th
                      onClick={() => setStatCategory("discipline")}
                      className={`py-3 px-2.5 text-center cursor-pointer hover:text-foreground transition-colors ${
                        statCategory === "discipline" ? "text-orange-500 font-black bg-orange-500/5" : ""
                      }`}
                    >
                      Angoli / Disc.
                    </th>
                    <th className="py-3 px-3 text-right w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {sortedTeams.map((team, index) => {
                    const rank = index + 1;
                    const mainCoach = team.coaches[0]?.name || "N/D";

                    return (
                      <tr
                        key={team.key}
                        onClick={() => handleOpenTeamModal(team)}
                        className={`hover:bg-muted/40 transition-colors group cursor-pointer ${
                          rank === 1
                            ? "bg-amber-500/[0.04]"
                            : rank === 2
                            ? "bg-slate-400/[0.03]"
                            : rank === 3
                            ? "bg-amber-800/[0.02]"
                            : ""
                        }`}
                      >
                        {/* Rank */}
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-flex items-center justify-center h-6 w-6 rounded-full font-mono font-black text-xs ${
                              rank === 1
                                ? "bg-amber-500 text-black shadow-xs"
                                : rank === 2
                                ? "bg-slate-300 dark:bg-slate-600 text-slate-900 dark:text-slate-100"
                                : rank === 3
                                ? "bg-amber-800/30 text-amber-700 dark:text-amber-400 border border-amber-700/40"
                                : "text-muted-foreground font-medium"
                            }`}
                          >
                            {rank}
                          </span>
                        </td>

                        {/* Club Info */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <TeamLogo
                              teamCode={team.displayCode}
                              franchiseCode={team.franchiseCode}
                              className="h-7 w-7"
                            />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-foreground group-hover:text-emerald-500 transition-colors text-xs sm:text-sm">
                                  {team.displayName}
                                </span>
                                {team.eraCodes.map((c) => (
                                  <Badge
                                    key={c}
                                    variant="outline"
                                    className="text-[9px] font-mono px-1 py-0 h-4"
                                  >
                                    {c}
                                  </Badge>
                                ))}
                              </div>
                              <span className="text-[10px] text-muted-foreground block">
                                Mister: {mainCoach}
                                {team.coaches.length > 1
                                  ? ` (+${team.coaches.length - 1})`
                                  : ""}{" "}
                                • S{team.seasonsPlayed[0]}
                                {team.seasonsPlayed.length > 1
                                  ? `–S${team.seasonsPlayed[team.seasonsPlayed.length - 1]}`
                                  : ""}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Matches */}
                        <td className="py-3 px-2 text-center font-mono font-bold text-muted-foreground">
                          {team.matches}
                        </td>

                        {/* Rating */}
                        <td className="py-3 px-2.5 text-center font-mono">
                          <span className="font-bold text-foreground">
                            {team.avgVoto.toFixed(2)}
                          </span>
                        </td>

                        {/* Attack */}
                        <td className="py-3 px-2.5 text-center font-mono">
                          <span className="font-bold text-rose-600 dark:text-rose-400">
                            {statMode === "per_game"
                              ? team.golPerGame.toFixed(2)
                              : team.gol}
                          </span>
                          <span className="text-[10px] text-muted-foreground ml-1">
                            ({team.asst}A)
                          </span>
                        </td>

                        {/* Defense */}
                        <td className="py-3 px-2.5 text-center font-mono">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {team.cleanSheets} CS
                          </span>
                          <span className="text-[10px] text-muted-foreground ml-1">
                            ({team.gsub} GS)
                          </span>
                        </td>

                        {/* Possession */}
                        <td className="py-3 px-2.5 text-center font-mono">
                          <span className="font-bold text-purple-600 dark:text-purple-400">
                            {team.avgPoss.toFixed(1)}%
                          </span>
                        </td>

                        {/* Shots */}
                        <td className="py-3 px-2.5 text-center font-mono">
                          <span className="font-bold text-foreground">
                            {statMode === "per_game"
                              ? `${team.tiriSiPerGame}/${team.tiriTotPerGame}`
                              : `${team.tiriSi}/${team.tiriTot}`}
                          </span>
                          <span className="text-[10px] text-muted-foreground ml-1">
                            ({team.shotAccuracyPct}%)
                          </span>
                        </td>

                        {/* Passing */}
                        <td className="py-3 px-2.5 text-center font-mono">
                          <span className="font-bold text-blue-600 dark:text-blue-400">
                            {statMode === "per_game"
                              ? team.passSiPerGame.toFixed(1)
                              : team.passSi.toLocaleString("it-IT")}
                          </span>
                          <span className="text-[10px] text-muted-foreground ml-1">
                            ({team.passAccuracyPct}%)
                          </span>
                        </td>

                        {/* Duels */}
                        <td className="py-3 px-2.5 text-center font-mono">
                          <span className="font-semibold text-foreground">
                            {statMode === "per_game"
                              ? `${team.ctrsSiPerGame}C`
                              : `${team.ctrsSi}C`}
                          </span>
                          <span className="text-muted-foreground mx-0.5">•</span>
                          <span className="text-[11px] text-muted-foreground">
                            {statMode === "per_game"
                              ? `${team.dribSiPerGame}D`
                              : `${team.dribSi}D`}
                          </span>
                        </td>

                        {/* Corners & Discipline */}
                        <td className="py-3 px-2.5 text-center font-mono">
                          <span className="font-semibold text-amber-600 dark:text-amber-400">
                            {team.cangl} ang
                          </span>
                          <span className="text-[10px] text-muted-foreground ml-1">
                            ({team.gialli}G/{team.rossi}R)
                          </span>
                        </td>

                        {/* Action */}
                        <td className="py-3 px-3 text-right">
                          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all inline-block" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      </main>

      {/* TEAM TELEMETRY DOSSIER MODAL */}
      <Dialog
        open={!!selectedTeam}
        onOpenChange={(open) => {
          if (!open) setSelectedTeam(null);
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0 border-border/80 bg-card">
          {selectedTeam && (
            <>
              {/* Modal Header */}
              <DialogHeader className="p-5 sm:p-6 border-b border-border/80 bg-gradient-to-r from-emerald-500/10 via-card to-card">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-2xl bg-card border border-border/80 p-2 flex items-center justify-center shadow-sm shrink-0">
                      <TeamLogo
                        teamCode={selectedTeam.displayCode}
                        franchiseCode={selectedTeam.franchiseCode}
                        className="h-12 w-12"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <DialogTitle className="text-xl sm:text-2xl font-black tracking-tight">
                          {selectedTeam.displayName}
                        </DialogTitle>
                        {selectedTeam.scudetti > 0 && (
                          <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30 text-[10px] font-bold">
                            🏆 {selectedTeam.scudetti}x Scudetto
                          </Badge>
                        )}
                      </div>
                      <DialogDescription className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5 flex-wrap">
                        <span>Codici Storici:</span>
                        {selectedTeam.eraCodes.map((c) => (
                          <Badge
                            key={c}
                            variant="outline"
                            className="text-[10px] font-mono px-1.5 py-0"
                          >
                            {c}
                          </Badge>
                        ))}
                        <span>•</span>
                        <span className="font-mono font-semibold text-foreground">
                          {selectedTeam.matches} gare ufficiali ({selectedTeam.minuti.toLocaleString("it-IT")}&apos; min)
                        </span>
                      </DialogDescription>
                    </div>
                  </div>
                </div>

                {/* Modal Sub-navigation */}
                <div className="flex items-center gap-2 pt-4">
                  <Button
                    size="sm"
                    variant={modalTab === "overview" ? "default" : "outline"}
                    onClick={() => setModalTab("overview")}
                    className="text-xs font-bold h-8"
                  >
                    Panoramica &amp; Allenatori
                  </Button>
                  <Button
                    size="sm"
                    variant={modalTab === "seasons" ? "default" : "outline"}
                    onClick={() => setModalTab("seasons")}
                    className="text-xs font-bold h-8"
                  >
                    Storico Stagioni ({selectedTeam.seasonBreakdowns.length})
                  </Button>
                  <Button
                    size="sm"
                    variant={modalTab === "matches" ? "default" : "outline"}
                    onClick={() => setModalTab("matches")}
                    className="text-xs font-bold h-8"
                  >
                    Tabellini Partite ({selectedTeam.matchRows.length})
                  </Button>
                </div>
              </DialogHeader>

              <div className="p-5 sm:p-6 space-y-6">
                {modalTab === "overview" && (
                  <>
                    {/* KPI Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 rounded-xl border border-border/70 bg-muted/20 text-center">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                          Media Voto Squadra
                        </span>
                        <span className="text-xl font-black font-mono text-amber-500">
                          {selectedTeam.avgVoto.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-muted-foreground block">
                          Max: {selectedTeam.maxVoto.toFixed(1)}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl border border-border/70 bg-muted/20 text-center">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                          Gol Fatti / Subiti
                        </span>
                        <span className="text-xl font-black font-mono text-foreground">
                          {selectedTeam.gol} / {selectedTeam.gsub}
                        </span>
                        <span className="text-[10px] text-muted-foreground block font-mono">
                          {selectedTeam.golPerGame.toFixed(2)} GF • {selectedTeam.gsubPerGame.toFixed(2)} GS
                        </span>
                      </div>

                      <div className="p-3 rounded-xl border border-border/70 bg-muted/20 text-center">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                          Possesso &amp; Regia
                        </span>
                        <span className="text-xl font-black font-mono text-purple-500">
                          {selectedTeam.avgPoss.toFixed(1)}%
                        </span>
                        <span className="text-[10px] text-muted-foreground block font-mono">
                          {selectedTeam.passSi.toLocaleString("it-IT")} pass. riusciti
                        </span>
                      </div>

                      <div className="p-3 rounded-xl border border-border/70 bg-muted/20 text-center">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                          Clean Sheet &amp; Parate
                        </span>
                        <span className="text-xl font-black font-mono text-emerald-500">
                          {selectedTeam.cleanSheets} CS
                        </span>
                        <span className="text-[10px] text-muted-foreground block font-mono">
                          {selectedTeam.para} parate ({selectedTeam.paraPerGame}/gara)
                        </span>
                      </div>
                    </div>

                    {/* Efficiency Progress Bars */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Award className="h-3.5 w-3.5 text-emerald-500" />
                        Indici di Efficienza Telemetrica
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {[
                          {
                            label: "Precisione Passaggi",
                            pct: selectedTeam.passAccuracyPct,
                            detail: `${selectedTeam.passSi.toLocaleString("it-IT")} / ${selectedTeam.passTot.toLocaleString("it-IT")}`,
                            color: "bg-blue-500",
                          },
                          {
                            label: "Precisione Tiri nello Specchio",
                            pct: selectedTeam.shotAccuracyPct,
                            detail: `${selectedTeam.tiriSi} / ${selectedTeam.tiriTot} tiri`,
                            color: "bg-rose-500",
                          },
                          {
                            label: "Tasso Conversione Tiri in Gol",
                            pct: selectedTeam.shotConversionPct,
                            detail: `${selectedTeam.gol} gol su ${selectedTeam.tiriTot} tiri`,
                            color: "bg-amber-500",
                          },
                          {
                            label: "Successo Dribbling (1vs1)",
                            pct: selectedTeam.dribSuccessPct,
                            detail: `${selectedTeam.dribSi} / ${selectedTeam.dribTot} dribbling`,
                            color: "bg-cyan-500",
                          },
                          {
                            label: "Efficacia Contrasti Difensivi",
                            pct: selectedTeam.ctrsSuccessPct,
                            detail: `${selectedTeam.ctrsSi} / ${selectedTeam.ctrsTot} contrasti`,
                            color: "bg-emerald-500",
                          },
                          {
                            label: "Precisione Cross & Traversoni",
                            pct: selectedTeam.crosAccuracyPct,
                            detail: `${selectedTeam.crosSi} / ${selectedTeam.crosTot} cross`,
                            color: "bg-purple-500",
                          },
                        ].map((bar) => (
                          <div
                            key={bar.label}
                            className="p-3 rounded-xl border border-border/60 bg-card space-y-1.5"
                          >
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-foreground">
                                {bar.label}
                              </span>
                              <span className="font-mono font-black text-foreground">
                                {bar.pct.toFixed(1)}%
                              </span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                              <div
                                className={`h-full rounded-full ${bar.color}`}
                                style={{
                                  width: `${Math.min(100, Math.max(2, bar.pct))}%`,
                                }}
                              />
                            </div>
                            <span className="text-[10px] font-mono text-muted-foreground block">
                              {bar.detail}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Coaches History Table */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-emerald-500" />
                        Allenatori a Referto ({selectedTeam.coaches.length})
                      </h4>
                      <div className="border border-border/70 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-muted/40 border-b border-border text-[10px] font-bold uppercase text-muted-foreground">
                            <tr>
                              <th className="py-2 px-3">Allenatore</th>
                              <th className="py-2 px-3 text-center">Panchine</th>
                              <th className="py-2 px-3 text-center">Media Voto</th>
                              <th className="py-2 px-3 text-center">Gol Fatti</th>
                              <th className="py-2 px-3 text-center">Gol Subiti</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/50">
                            {selectedTeam.coaches.map((c) => (
                              <tr key={c.name} className="hover:bg-muted/20">
                                <td className="py-2 px-3 font-bold text-foreground">
                                  {c.name}
                                </td>
                                <td className="py-2 px-3 text-center font-mono font-bold">
                                  {c.matches}
                                </td>
                                <td className="py-2 px-3 text-center font-mono text-amber-500 font-bold">
                                  {c.avgRating.toFixed(2)}
                                </td>
                                <td className="py-2 px-3 text-center font-mono text-emerald-500">
                                  {c.goalsFor}
                                </td>
                                <td className="py-2 px-3 text-center font-mono text-rose-500">
                                  {c.goalsAgainst}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}

                {modalTab === "seasons" && (
                  <div className="border border-border/70 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-muted/40 border-b border-border text-[10px] font-bold uppercase text-muted-foreground">
                        <tr>
                          <th className="py-2.5 px-3">Stagione</th>
                          <th className="py-2.5 px-3">Sigla</th>
                          <th className="py-2.5 px-3 text-center">Gare</th>
                          <th className="py-2.5 px-3 text-center">M.Voto</th>
                          <th className="py-2.5 px-3 text-center">GF / GS</th>
                          <th className="py-2.5 px-3 text-center">Clean Sheet</th>
                          <th className="py-2.5 px-3 text-center">Possesso %</th>
                          <th className="py-2.5 px-3 text-center">Prec. Pass %</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50 font-mono">
                        {selectedTeam.seasonBreakdowns.map((s) => (
                          <tr key={s.stag} className="hover:bg-muted/20">
                            <td className="py-2.5 px-3 font-bold text-foreground">
                              Stagione {s.stag}
                            </td>
                            <td className="py-2.5 px-3">
                              <Badge variant="outline" className="text-[10px] font-mono">
                                {s.teamCode}
                              </Badge>
                            </td>
                            <td className="py-2.5 px-3 text-center">{s.matches}</td>
                            <td className="py-2.5 px-3 text-center font-bold text-amber-500">
                              {s.avgRating.toFixed(2)}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="text-emerald-500 font-bold">{s.gol}</span>
                              {" / "}
                              <span className="text-rose-500">{s.gsub}</span>
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold text-emerald-500">
                              {s.cleanSheets}
                            </td>
                            <td className="py-2.5 px-3 text-center">{s.avgPoss.toFixed(1)}%</td>
                            <td className="py-2.5 px-3 text-center text-blue-500 font-bold">
                              {s.passPct.toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {modalTab === "matches" && (
                  <div className="border border-border/70 rounded-xl overflow-x-auto max-h-[420px] overflow-y-auto">
                    <table className="w-full text-left text-xs whitespace-nowrap">
                      <thead className="bg-muted/60 border-b border-border text-[10px] font-bold uppercase text-muted-foreground sticky top-0">
                        <tr>
                          <th className="py-2.5 px-3">Gara</th>
                          <th className="py-2.5 px-3">Club</th>
                          <th className="py-2.5 px-3">Allenatore</th>
                          <th className="py-2.5 px-3 text-center">Voto</th>
                          <th className="py-2.5 px-3 text-center">GF - GS</th>
                          <th className="py-2.5 px-3 text-center">Poss%</th>
                          <th className="py-2.5 px-3 text-center">Tiri</th>
                          <th className="py-2.5 px-3 text-center">Passaggi</th>
                          <th className="py-2.5 px-3 text-center">Contrasti</th>
                          <th className="py-2.5 px-3 text-center">Corner</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50 font-mono">
                        {selectedTeam.matchRows.map((m, idx) => (
                          <tr key={`${m.STAG}-${m.WEEK}-${m.ID}-${idx}`} className="hover:bg-muted/20">
                            <td className="py-2 px-3 font-bold text-foreground">
                              S{m.STAG} • W{m.WEEK}
                            </td>
                            <td className="py-2 px-3">
                              <Badge variant="outline" className="text-[10px] font-mono">
                                {m.ID}
                              </Badge>
                            </td>
                            <td className="py-2 px-3 font-sans text-muted-foreground">
                              {m.ALLENATORE || "N/D"}
                            </td>
                            <td className="py-2 px-3 text-center font-bold text-amber-500">
                              {m.VOTO !== null ? Number(m.VOTO).toFixed(1) : "—"}
                            </td>
                            <td className="py-2 px-3 text-center font-bold">
                              <span className="text-emerald-500">{m.GOL ?? 0}</span>
                              {" - "}
                              <span className="text-rose-500">{m.GSUB ?? 0}</span>
                            </td>
                            <td className="py-2 px-3 text-center">
                              {m.POSS && Number(m.POSS) < 0.99
                                ? `${Math.round(Number(m.POSS) * 100)}%`
                                : "—"}
                            </td>
                            <td className="py-2 px-3 text-center">
                              {m.TIRI_SI ?? 0}/{m.TIRI_TOT ?? 0}
                            </td>
                            <td className="py-2 px-3 text-center">
                              {m.PASS_SI ?? 0}/{m.PASS_TOT ?? 0}
                            </td>
                            <td className="py-2 px-3 text-center">
                              {m.CTRS_SI ?? 0}/{m.CTRS_TOT ?? 0}
                            </td>
                            <td className="py-2 px-3 text-center">
                              {m.CANGL !== null ? m.CANGL : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

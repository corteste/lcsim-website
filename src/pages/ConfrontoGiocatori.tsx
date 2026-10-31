import { useState, useMemo, useEffect, useCallback } from "react";
import { isRetiringSoon } from "@/utils/functions";
import { RetiringBadge } from "@/components/player/RetiringBadge";
import Navbar from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Swords,
  Users,
  Shield,
  Target,
  Zap,
  Award,
  Sparkles,
  Lock,
  Unlock,
  Search,
  ArrowLeftRight,
  Compass,
  Flame,
  Coins,
  ChevronRight,
  ExternalLink,
  Activity,
  UserCheck,
  BarChart3,
  ShieldAlert,
} from "lucide-react";
import { PlayerSeasonalStatsComparison } from "@/components/comparison/PlayerSeasonalStatsComparison";
import {
  getPlayerImage,
  getNationalityFlag,
  getRoleColor,
  getValueColor,
  getTeamBackground,
} from "@/utils/functions";
import { useAuth } from "@/context/AuthContext";
import AdminTeamSelector from "@/components/AdminTeamSelector";
import RequireAuthPrompt from "@/components/RequireAuthPrompt";
import { Player } from "@/types/player";
import { supabase } from "@/supabaseClient";
import { PLAYER_TABLE,
  TEAM_TABLE,
  ROOKIE_TABLE,
  ROOKIE_SCOUTING_TABLE, SUPABASE_STORAGE_URL } from "@/constants/App";
import { renderStars } from "@/components/scouting/StarRating";
import {
  isDepartmentUnlocked,
  getRequiredTokensForDepartment,
  getRequiredTokensForField,
  getOvrDisplayByTokens,
  getTierBadgeStyle,
  getStatDisplayByTokens,
  ScoutingDeptKey,
} from "@/utils/scoutingConfig";
import PlayerDetails from "@/components/player/playerDetails";
import { toast } from "sonner";
import { Link, useLocation } from "react-router-dom";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";

export type ComparisonPlayer = Player & {
  isRookie: boolean;
  scoutingTokens: number;
  uniqueKey: string;
};

interface StatDef {
  key: keyof Player;
  label: string;
  dept: ScoutingDeptKey;
}

const STAT_CATEGORIES: {
  id: string;
  label: string;
  icon: typeof Shield;
  colorClass: string;
  stats: StatDef[];
}[] = [
  {
    id: "ALL",
    label: "Tutti gli Attributi",
    icon: Activity,
    colorClass: "text-primary",
    stats: [
      // Fisico
      { key: "VELO", label: "Velocità Scatto", dept: "FIS" },
      { key: "ACCL", label: "Accelerazione", dept: "FIS" },
      { key: "FRZA", label: "Forza Fisica", dept: "FIS" },
      { key: "RESI", label: "Resistenza", dept: "FIS" },
      { key: "AGIL", label: "Agilità", dept: "FIS" },
      { key: "ELEV", label: "Elevazione", dept: "FIS" },
      { key: "RIFL", label: "Riflessi Generali", dept: "FIS" },
      { key: "EQLB", label: "Equilibrio", dept: "FIS" },
      // Difesa
      { key: "CONT", label: "Contrasto", dept: "DIF" },
      { key: "MARC", label: "Marcatura", dept: "DIF" },
      { key: "INTR", label: "Intercettazione", dept: "DIF" },
      { key: "SCIV", label: "Scivolata", dept: "DIF" },
      { key: "AGGR", label: "Aggressività", dept: "DIF" },
      // Passaggi
      { key: "PASC", label: "Passaggio Corto", dept: "PAS" },
      { key: "PASL", label: "Passaggio Lungo", dept: "PAS" },
      { key: "CTRP", label: "Controllo Palla", dept: "PAS" },
      { key: "VISI", label: "Visione di Gioco", dept: "PAS" },
      { key: "CRSS", label: "Cross", dept: "PAS" },
      { key: "EFFT", label: "Effetto", dept: "PAS" },
      // Attacco
      { key: "FINA", label: "Finalizzazione", dept: "ATT" },
      { key: "PTIR", label: "Potenza Tiro", dept: "ATT" },
      { key: "TIRD", label: "Tiro dalla Distanza", dept: "ATT" },
      { key: "DRBL", label: "Dribbling", dept: "ATT" },
      { key: "TSTA", label: "Colpo di Testa", dept: "ATT" },
      { key: "PIAZ", label: "Piazzamento Offensivo", dept: "ATT" },
      { key: "TIRV", label: "Tiro al Volo", dept: "ATT" },
      // Calci Piazzati
      { key: "PNIZ", label: "Calci di Punizione", dept: "CPZ" },
      { key: "CRIG", label: "Calci di Rigore", dept: "CPZ" },
      { key: "FRED", label: "Freddezza", dept: "CPZ" },
      // Portiere
      { key: "TUFP", label: "Tuffo Portiere", dept: "POR" },
      { key: "PREP", label: "Presa Portiere", dept: "POR" },
      { key: "RINP", label: "Rinvio Portiere", dept: "POR" },
      { key: "RIFP", label: "Riflessi Portiere", dept: "POR" },
      { key: "POSP", label: "Posizionamento Portiere", dept: "POR" },
    ],
  },
  {
    id: "FIS",
    label: "Fisico & Velocità",
    icon: Zap,
    colorClass: "text-purple-500",
    stats: [
      { key: "VELO", label: "Velocità Scatto", dept: "FIS" },
      { key: "ACCL", label: "Accelerazione", dept: "FIS" },
      { key: "FRZA", label: "Forza Fisica", dept: "FIS" },
      { key: "RESI", label: "Resistenza", dept: "FIS" },
      { key: "AGIL", label: "Agilità", dept: "FIS" },
      { key: "ELEV", label: "Elevazione", dept: "FIS" },
      { key: "RIFL", label: "Riflessi Generali", dept: "FIS" },
      { key: "EQLB", label: "Equilibrio", dept: "FIS" },
    ],
  },
  {
    id: "DIF",
    label: "Difesa & Marcatura",
    icon: Shield,
    colorClass: "text-blue-500",
    stats: [
      { key: "CONT", label: "Contrasto", dept: "DIF" },
      { key: "MARC", label: "Marcatura", dept: "DIF" },
      { key: "INTR", label: "Intercettazione", dept: "DIF" },
      { key: "SCIV", label: "Scivolata", dept: "DIF" },
      { key: "AGGR", label: "Aggressività", dept: "DIF" },
    ],
  },
  {
    id: "PAS",
    label: "Passaggi & Regia",
    icon: Compass,
    colorClass: "text-cyan-500",
    stats: [
      { key: "PASC", label: "Passaggio Corto", dept: "PAS" },
      { key: "PASL", label: "Passaggio Lungo", dept: "PAS" },
      { key: "CTRP", label: "Controllo Palla", dept: "PAS" },
      { key: "VISI", label: "Visione di Gioco", dept: "PAS" },
      { key: "CRSS", label: "Cross", dept: "PAS" },
      { key: "EFFT", label: "Effetto", dept: "PAS" },
    ],
  },
  {
    id: "ATT",
    label: "Attacco & Calci piazzati",
    icon: Target,
    colorClass: "text-rose-500",
    stats: [
      { key: "FINA", label: "Finalizzazione", dept: "ATT" },
      { key: "PTIR", label: "Potenza Tiro", dept: "ATT" },
      { key: "TIRD", label: "Tiro dalla Distanza", dept: "ATT" },
      { key: "DRBL", label: "Dribbling", dept: "ATT" },
      { key: "TSTA", label: "Colpo di Testa", dept: "ATT" },
      { key: "PIAZ", label: "Piazzamento Offensivo", dept: "ATT" },
      { key: "TIRV", label: "Tiro al Volo", dept: "ATT" },
      { key: "PNIZ", label: "Calci di Punizione", dept: "CPZ" },
      { key: "CRIG", label: "Calci di Rigore", dept: "CPZ" },
      { key: "FRED", label: "Freddezza", dept: "CPZ" },
    ],
  },
  {
    id: "POR",
    label: "Portiere",
    icon: Shield,
    colorClass: "text-amber-500",
    stats: [
      { key: "TUFP", label: "Tuffo Portiere", dept: "POR" },
      { key: "PREP", label: "Presa Portiere", dept: "POR" },
      { key: "RINP", label: "Rinvio Portiere", dept: "POR" },
      { key: "RIFP", label: "Riflessi Portiere", dept: "POR" },
      { key: "POSP", label: "Posizionamento Portiere", dept: "POR" },
    ],
  },
];

const ROLE_GROUPS: { id: string; label: string; roles: string[] }[] = [
  { id: "ALL", label: "Tutti i Ruoli", roles: [] },
  { id: "POR", label: "Portieri", roles: ["POR"] },
  { id: "DIF", label: "Difesa", roles: ["DC", "TD", "TS"] },
  { id: "CEN", label: "Centrocampo", roles: ["CDC", "CC", "ED", "ES", "COC"] },
  { id: "ATT", label: "Attacco", roles: ["AD", "AS", "ATT"] },
];

// Helper to evaluate a stat for a player (handles scouting visibility for rookies)
function getPlayerStatValue(
  player: ComparisonPlayer,
  statKey: keyof Player,
  dept: ScoutingDeptKey
): {
  isRevealed: boolean;
  numericVal: number | null;
  displayVal: string;
  requiredTokens?: number;
} {
  if (!player.isRookie) {
    const raw = player[statKey];
    const n = raw !== null && raw !== undefined ? Number(raw) : null;
    return {
      isRevealed: true,
      numericVal: n,
      displayVal: n !== null ? String(n) : "—",
    };
  }

  // Rookie scouting rule
  if (player.scoutingTokens < 1) {
    return {
      isRevealed: false,
      numericVal: null,
      displayVal: "?",
      requiredTokens: 1,
    };
  }

  const raw = player[statKey];
  const n = raw !== null && raw !== undefined ? Number(raw) : null;
  const disp = getStatDisplayByTokens(n, player.scoutingTokens);
  return {
    isRevealed: true,
    numericVal: disp.midpoint,
    displayVal: disp.label,
  };
}

// Helper to evaluate OVR
function getPlayerOvr(player: ComparisonPlayer): {
  isRevealed: boolean;
  displayVal: string;
  numericVal: number | null;
  isRange: boolean;
} {
  if (!player.isRookie) {
    return {
      isRevealed: true,
      displayVal: String(player.OVR ?? "—"),
      numericVal: player.OVR ?? 0,
      isRange: false,
    };
  }

  const ovrInfo = getOvrDisplayByTokens(
    player.OVR,
    player.scoutingTokens,
    (player as any).Stelle
  );
  if (player.scoutingTokens >= 5) {
    return {
      isRevealed: true,
      displayVal: String(player.OVR ?? "—"),
      numericVal: player.OVR ?? 0,
      isRange: false,
    };
  }
  return {
    isRevealed: true,
    displayVal: `${ovrInfo.stars}★`,
    numericVal: ovrInfo.stars * 15,
    isRange: true,
  };
}

// Helper to evaluate Trait / Special Field
function getPlayerTrait(
  player: ComparisonPlayer,
  field:
    | "Role1"
    | "Role2"
    | "Trait1"
    | "Trait2"
    | "IconTrait1"
    | "IconTrait2"
    | "PiedeDebole"
    | "MABI"
): {
  isRevealed: boolean;
  displayVal: string;
  requiredTokens?: number;
} {
  if (!player.isRookie) {
    return {
      isRevealed: true,
      displayVal: String(player[field] || "Nessuno"),
    };
  }

  const req = getRequiredTokensForField(field);
  if (player.scoutingTokens >= req) {
    return {
      isRevealed: true,
      displayVal: String(player[field] || "Nessuno"),
    };
  }

  return {
    isRevealed: false,
    displayVal: "?",
    requiredTokens: req,
  };
}

// Compute 6 Macro stats
function getMacroPillars(player: ComparisonPlayer) {
  const isGK = player.Posiz === "POR";

  if (isGK) {
    const tuf = getPlayerStatValue(player, "TUFP", "POR");
    const pre = getPlayerStatValue(player, "PREP", "POR");
    const rin = getPlayerStatValue(player, "RINP", "POR");
    const rif = getPlayerStatValue(player, "RIFP", "POR");
    const pos = getPlayerStatValue(player, "POSP", "POR");
    const fis = getPlayerStatValue(player, "FRZA", "FIS");

    return [
      { label: "TUF", name: "Tuffo", ...tuf },
      { label: "PRE", name: "Presa", ...pre },
      { label: "RIN", name: "Rinvio", ...rin },
      { label: "RIF", name: "Riflessi", ...rif },
      { label: "POS", name: "Piazzamento", ...pos },
      { label: "FIS", name: "Fisico", ...fis },
    ];
  }

  // Outfield
  const velStat = getPlayerStatValue(player, "VELO", "FIS");
  const tirStat = getPlayerStatValue(player, "FINA", "ATT");
  const pasStat = getPlayerStatValue(player, "PASC", "PAS");
  const drbStat = getPlayerStatValue(player, "DRBL", "ATT");
  const difStat = getPlayerStatValue(player, "CONT", "DIF");
  const fisStat = getPlayerStatValue(player, "FRZA", "FIS");

  const calcAvg = (
    stats: { isRevealed: boolean; numericVal: number | null }[]
  ) => {
    if (stats.some((s) => !s.isRevealed)) {
      return { isRevealed: false, displayVal: "?", numericVal: null };
    }
    const vals = stats.map((s) => s.numericVal).filter((v) => v !== null) as number[];
    if (vals.length === 0) return { isRevealed: true, displayVal: "—", numericVal: null };
    const avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
    return { isRevealed: true, displayVal: String(avg), numericVal: avg };
  };

  const vel = velStat.isRevealed
    ? calcAvg([velStat, getPlayerStatValue(player, "ACCL", "FIS")])
    : velStat;
  const tir = tirStat.isRevealed
    ? calcAvg([
        tirStat,
        getPlayerStatValue(player, "PTIR", "ATT"),
        getPlayerStatValue(player, "TIRD", "ATT"),
        getPlayerStatValue(player, "PIAZ", "ATT"),
      ])
    : tirStat;
  const pas = pasStat.isRevealed
    ? calcAvg([
        pasStat,
        getPlayerStatValue(player, "PASL", "PAS"),
        getPlayerStatValue(player, "CTRP", "PAS"),
        getPlayerStatValue(player, "VISI", "PAS"),
      ])
    : pasStat;
  const drb = drbStat.isRevealed
    ? calcAvg([
        drbStat,
        getPlayerStatValue(player, "CTRP", "PAS"),
        getPlayerStatValue(player, "AGIL", "FIS"),
      ])
    : drbStat;
  const dif = difStat.isRevealed
    ? calcAvg([
        difStat,
        getPlayerStatValue(player, "MARC", "DIF"),
        getPlayerStatValue(player, "INTR", "DIF"),
        getPlayerStatValue(player, "SCIV", "DIF"),
      ])
    : difStat;
  const fis = fisStat.isRevealed
    ? calcAvg([
        fisStat,
        getPlayerStatValue(player, "RESI", "FIS"),
        getPlayerStatValue(player, "ELEV", "FIS"),
      ])
    : fisStat;

  return [
    { label: "VEL", name: "Velocità", ...vel },
    { label: "TIR", name: "Tiro", ...tir },
    { label: "PAS", name: "Passaggio", ...pas },
    { label: "DRI", name: "Dribbling", ...drb },
    { label: "DIF", name: "Difesa", ...dif },
    { label: "FIS", name: "Fisico", ...fis },
  ];
}

const ConfrontoGiocatori = () => {
  const location = useLocation();
  const isTeamMode = location.pathname.startsWith("/mia-squadra");

  const { user, effectiveTeam, effectiveTeamFullName } = useAuth();
  const currentTeam = effectiveTeam;
  const currentTeamFullName = effectiveTeamFullName || currentTeam;

  const [teamPlayers, setTeamPlayers] = useState<Player[]>([]);
  const [rookies, setRookies] = useState<Player[]>([]);
  const [serieATeams, setSerieATeams] = useState<{ TEAM_ID: string; NAME: string }[]>([]);
  const [scoutingMap, setScoutingMap] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState<boolean>(true);

  // Selected player keys (uniqueKey)
  const [leftKey, setLeftKey] = useState<string>("");
  const [rightKey, setRightKey] = useState<string>("");

  // Player selector dialog state
  const [selectorTarget, setSelectorTarget] = useState<"left" | "right" | null>(null);
  const [selectorSource, setSelectorSource] = useState<"ALL" | "TEAM" | "ROOKIE">("ALL");
  const [selectorTeam, setSelectorTeam] = useState<string>("ALL");
  const [selectorRole, setSelectorRole] = useState<string>("ALL");
  const [selectorSearch, setSelectorSearch] = useState<string>("");

  // Full player details modal
  const [selectedModalPlayer, setSelectedModalPlayer] = useState<Player | null>(null);

  // Active Category Tab
  const [activeTab, setActiveTab] = useState<string>("ALL");

  // Load Data: user's team squad + all rookies (Team Mode) OR active Serie A players (Serie A Mode)
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (isTeamMode) {
        if (!currentTeam) {
          setLoading(false);
          return;
        }
        const [teamRes, rookiesRes, scoutingRes] = await Promise.all([
          supabase
            .from(PLAYER_TABLE)
            .select("*")
            .eq("Squadra", currentTeam)
            .order("OVR", { ascending: false }),
          supabase.rpc("rpc_get_scouted_rookies", { p_team_id: currentTeam }),
          supabase
            .from(ROOKIE_SCOUTING_TABLE)
            .select("rookie_id, tokens_spent")
            .eq("team_id", currentTeam),
        ]);

        if (teamRes.error) throw teamRes.error;
        if (rookiesRes.error) throw rookiesRes.error;

        const sMap: Record<number, number> = {};
        if (scoutingRes.data) {
          for (const row of scoutingRes.data) {
            sMap[Number(row.rookie_id)] = Number(row.tokens_spent) || 0;
          }
        }

        setTeamPlayers((teamRes.data as Player[]) ?? []);
        setRookies((rookiesRes.data as Player[]) ?? []);
        setScoutingMap(sMap);
      } else {
        // Modalità Serie A (/giocatori/confronto-giocatori):
        // Carica SOLO i calciatori attivi nelle squadre di Serie A (nessun rookie)
        const { data: teamsData, error: teamsError } = await supabase
          .from(TEAM_TABLE)
          .select("TEAM_ID, NAME")
          .eq("ACTIVE", true)
          .order("NAME", { ascending: true });

        if (teamsError) throw teamsError;

        const activeTeamsList = (teamsData || []) as { TEAM_ID: string; NAME: string }[];
        setSerieATeams(activeTeamsList);
        const activeTeamIds = activeTeamsList.map((t) => t.TEAM_ID);

        const { data: playersData, error: playersError } = await supabase
          .from(PLAYER_TABLE)
          .select("*")
          .in("Squadra", activeTeamIds)
          .order("OVR", { ascending: false });

        if (playersError) throw playersError;

        setTeamPlayers((playersData as Player[]) ?? []);
        setRookies([]); // Nessun rookie in Serie A
        setScoutingMap({});
      }
    } catch (err) {
      console.error("Errore caricamento dati Confronto Giocatori:", err);
      toast.error("Errore durante il caricamento dei dati di confronto");
    } finally {
      setLoading(false);
    }
  }, [isTeamMode, currentTeam]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Combine into unified ComparisonPlayer array
  const availablePlayers = useMemo<ComparisonPlayer[]>(() => {
    const list: ComparisonPlayer[] = [];
    for (const p of teamPlayers) {
      list.push({
        ...p,
        isRookie: false,
        scoutingTokens: 5,
        uniqueKey: `player_${p.ID}`,
      });
    }
    if (isTeamMode) {
      for (const r of rookies) {
        list.push({
          ...r,
          isRookie: true,
          scoutingTokens: scoutingMap[r.ID] ?? 0,
          uniqueKey: `rookie_${r.ID}`,
        });
      }
    }
    return list;
  }, [teamPlayers, rookies, scoutingMap, isTeamMode]);

  // Initialize Left & Right players default selection
  useEffect(() => {
    if (availablePlayers.length > 0) {
      if (!isTeamMode) {
        // Modalità Serie A: seleziona i primi due giocatori per OVR
        if (!leftKey || !availablePlayers.some((p) => p.uniqueKey === leftKey)) {
          setLeftKey(availablePlayers[0].uniqueKey);
        }
        if (!rightKey || !availablePlayers.some((p) => p.uniqueKey === rightKey)) {
          setRightKey(availablePlayers[1]?.uniqueKey || availablePlayers[0].uniqueKey);
        }
      } else {
        if (!leftKey || !availablePlayers.some((p) => p.uniqueKey === leftKey)) {
          const firstTeam = availablePlayers.find((p) => !p.isRookie);
          setLeftKey(firstTeam ? firstTeam.uniqueKey : availablePlayers[0].uniqueKey);
        }
        if (!rightKey || !availablePlayers.some((p) => p.uniqueKey === rightKey)) {
          const firstRookie = availablePlayers.find((p) => p.isRookie);
          if (firstRookie) {
            setRightKey(firstRookie.uniqueKey);
          } else if (availablePlayers.length > 1) {
            setRightKey(availablePlayers[1].uniqueKey);
          } else {
            setRightKey(availablePlayers[0].uniqueKey);
          }
        }
      }
    }
  }, [availablePlayers, isTeamMode, leftKey, rightKey]);

  const leftPlayer = useMemo(
    () => availablePlayers.find((p) => p.uniqueKey === leftKey) ?? null,
    [availablePlayers, leftKey]
  );

  const rightPlayer = useMemo(
    () => availablePlayers.find((p) => p.uniqueKey === rightKey) ?? null,
    [availablePlayers, rightKey]
  );

  // Swap Left and Right players
  const handleSwap = () => {
    const temp = leftKey;
    setLeftKey(rightKey);
    setRightKey(temp);
  };

  // Filter candidates for Player Selector Dialog
  const dialogFilteredPlayers = useMemo(() => {
    return availablePlayers.filter((p) => {
      if (isTeamMode) {
        // Source filter
        if (selectorSource === "TEAM" && p.isRookie) return false;
        if (selectorSource === "ROOKIE" && !p.isRookie) return false;
      } else {
        // Team filter in Serie A mode
        if (selectorTeam !== "ALL" && p.Squadra !== selectorTeam) return false;
      }

      // Role filter
      if (selectorRole !== "ALL") {
        const group = ROLE_GROUPS.find((g) => g.id === selectorRole);
        if (group && group.roles.length > 0 && !group.roles.includes(p.Posiz)) {
          return false;
        }
      }

      // Search input
      if (selectorSearch.trim() !== "") {
        const q = selectorSearch.toLowerCase().trim();
        const fullName = `${p.Nome} ${p.Cognome}`.toLowerCase();
        const role = (p.Posiz || "").toLowerCase();
        const team = (p.Squadra || "").toLowerCase();
        const num = p.NumeroMaglia ? String(p.NumeroMaglia) : "";
        return fullName.includes(q) || role.includes(q) || team.includes(q) || num.includes(q);
      }

      return true;
    });
  }, [availablePlayers, isTeamMode, selectorSource, selectorTeam, selectorRole, selectorSearch]);

  const handleSelectFromDialog = (player: ComparisonPlayer) => {
    if (selectorTarget === "left") {
      setLeftKey(player.uniqueKey);
    } else if (selectorTarget === "right") {
      setRightKey(player.uniqueKey);
    }
    setSelectorTarget(null);
  };

  // Rilevamento disallineamento ruolo Portiere vs Giocatore di Movimento (#55)
  const isGkVsOutfield = useMemo(() => {
    if (!leftPlayer || !rightPlayer) return false;
    return (leftPlayer.Posiz === "POR") !== (rightPlayer.Posiz === "POR");
  }, [leftPlayer, rightPlayer]);

  // Compute Head-to-Head win summary for the active category
  const comparisonStats = useMemo(() => {
    const category = STAT_CATEGORIES.find((c) => c.id === activeTab) || STAT_CATEGORIES[0];
    return category.stats;
  }, [activeTab]);

  const headToHeadSummary = useMemo(() => {
    if (!leftPlayer || !rightPlayer) return { winsLeft: 0, winsRight: 0, ties: 0, hidden: 0 };
    let winsLeft = 0;
    let winsRight = 0;
    let ties = 0;
    let hidden = 0;

    // Se POR vs Movimento e siamo su "ALL", filtriamo su attributi condivisi (FIS e CPZ) per evitare falsi conteggi
    const effectiveStats =
      isGkVsOutfield && activeTab === "ALL"
        ? comparisonStats.filter((st) => st.dept === "FIS" || st.dept === "CPZ")
        : comparisonStats;

    for (const st of effectiveStats) {
      // Se tab Portiere e uno dei due non è portiere, escludi dall'head-to-head competitivo
      if (st.dept === "POR" && isGkVsOutfield) continue;

      const a = getPlayerStatValue(leftPlayer, st.key, st.dept);
      const b = getPlayerStatValue(rightPlayer, st.key, st.dept);

      if (!a.isRevealed || !b.isRevealed || a.numericVal === null || b.numericVal === null) {
        hidden++;
      } else if (a.numericVal > b.numericVal) {
        winsLeft++;
      } else if (b.numericVal > a.numericVal) {
        winsRight++;
      } else {
        ties++;
      }
    }
    return { winsLeft, winsRight, ties, hidden };
  }, [leftPlayer, rightPlayer, comparisonStats, isGkVsOutfield, activeTab]);

  if (isTeamMode && !user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <RequireAuthPrompt
          title="Confronto Giocatori & Scouting"
          description="Accedi al tuo account di squadra o prendi la guida di una squadra libera per confrontare i tuoi giocatori con tutti i 72 Rookie del Draft!"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <Navbar />

      <main className="container mx-auto px-4 py-6 space-y-6 max-w-7xl">
        {isTeamMode ? (
          <>
            <AdminTeamSelector />
            <Card
              className={`overflow-hidden border border-border/80 shadow-lg ${getTeamBackground(
                currentTeam ?? ""
              )}`}
            >
              <div className="p-6 bg-gradient-to-r from-card/85 via-card/70 to-card/90 backdrop-blur-md">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                  <div className="flex items-center gap-4">
                    {currentTeam && (
                      <img
                        src={`${SUPABASE_STORAGE_URL}/images/teams/${currentTeam}_Logo.png`}
                        alt={`${currentTeam} Logo`}
                        className="h-16 w-16 object-contain drop-shadow-md"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `${SUPABASE_STORAGE_URL}/images/LCSIM_Logo_SMALL.png`;
                        }}
                      />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs font-mono font-bold"
                        >
                          La Mia Squadra
                        </Badge>
                        <span className="text-xs text-muted-foreground font-mono">
                          Stagione 2026/2027
                        </span>
                      </div>
                      <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight flex items-center gap-2 mt-0.5">
                        <Swords className="h-6 w-6 sm:h-7 sm:w-7 text-emerald-500" />
                        Confronto Giocatori &amp; Scouting
                      </h1>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                        Confronta testa a testa i calciatori della tua rosa ({currentTeamFullName}) con tutti i 72 Rookie del Draft.
                      </p>
                    </div>
                  </div>

                  {/* Quick Telemetry Strip */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <div className="px-3 py-2 rounded-xl bg-card border border-border/80 text-center shadow-sm">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                        Rosa {currentTeam}
                      </span>
                      <span className="text-lg sm:text-xl font-black font-mono text-foreground">
                        {teamPlayers.length}{" "}
                        <span className="text-xs font-normal text-muted-foreground">giocatori</span>
                      </span>
                    </div>

                    <div className="px-3 py-2 rounded-xl bg-card border border-border/80 text-center shadow-sm">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                        Rookie Draft
                      </span>
                      <span className="text-lg sm:text-xl font-black font-mono text-amber-500">
                        {rookies.length}{" "}
                        <span className="text-xs font-normal text-muted-foreground">prospetti</span>
                      </span>
                    </div>

                    <div className="px-3 py-2 rounded-xl bg-card border border-border/80 text-center shadow-sm">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                        Rookie Scoutati
                      </span>
                      <span className="text-lg sm:text-xl font-black font-mono text-emerald-500">
                        {Object.keys(scoutingMap).length}/{rookies.length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </>
        ) : (
          <Card className="overflow-hidden border border-border/80 shadow-lg bg-card">
            <div className="p-6 bg-gradient-to-r from-emerald-500/[0.08] via-card to-blue-500/[0.08] backdrop-blur-md">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 border-2 border-border/80 flex items-center justify-center shadow-md shrink-0">
                    <Swords className="h-8 w-8 text-emerald-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs font-mono font-bold"
                      >
                        Serie A LCSIM
                      </Badge>
                      <span className="text-xs text-muted-foreground font-mono">
                        Stagione 2026/2027
                      </span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight flex items-center gap-2 mt-0.5">
                      Confronto Calciatori Serie A
                    </h1>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                      Metti a confronto testa a testa i calciatori attivi delle squadre di Serie A.
                    </p>
                  </div>
                </div>

                {/* Telemetria Serie A */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="px-3 py-2 rounded-xl bg-card border border-border/80 text-center shadow-sm">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                      Squadre Serie A
                    </span>
                    <span className="text-lg sm:text-xl font-black font-mono text-foreground">
                      12 <span className="text-xs font-normal text-muted-foreground">club</span>
                    </span>
                  </div>

                  <div className="px-3 py-2 rounded-xl bg-card border border-border/80 text-center shadow-sm">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                      Calciatori Attivi
                    </span>
                    <span className="text-lg sm:text-xl font-black font-mono text-emerald-500">
                      {teamPlayers.length}{" "}
                      <span className="text-xs font-normal text-muted-foreground">atleti</span>
                    </span>
                  </div>

                  <div className="px-3 py-2 rounded-xl bg-card border border-border/80 text-center shadow-sm">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                      Statistiche
                    </span>
                    <span className="text-lg sm:text-xl font-black font-mono text-blue-500">
                      100% <span className="text-xs font-normal text-muted-foreground">visibili</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {loading ? (
          <Card className="p-16 text-center text-muted-foreground">
            Caricamento atleti e dati di scouting in corso...
          </Card>
        ) : (
          <>
            {/* 2. HEAD-TO-HEAD PLAYER CARDS (LEFT VS RIGHT) */}
            <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Swap Button (floating in center on desktop) */}
              <div className="lg:absolute lg:left-1/2 lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 z-20 flex items-center justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSwap}
                  className="rounded-full h-10 w-10 p-0 shadow-lg border-2 border-emerald-500/50 bg-card hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 transition-transform active:scale-95"
                  title="Inverti Giocatore Sinistra / Destra"
                >
                  <ArrowLeftRight className="h-4 w-4" />
                </Button>
              </div>

              {/* CARD LEFT: PLAYER A */}
              {leftPlayer && (
                <PlayerComparisonCard
                  player={leftPlayer}
                  side="left"
                  onOpenSelector={() => {
                    setSelectorTarget("left");
                    setSelectorSearch("");
                  }}
                  onOpenDetails={() => setSelectedModalPlayer(leftPlayer)}
                />
              )}

              {/* CARD RIGHT: PLAYER B */}
              {rightPlayer && (
                <PlayerComparisonCard
                  player={rightPlayer}
                  side="right"
                  onOpenSelector={() => {
                    setSelectorTarget("right");
                    setSelectorSearch("");
                  }}
                  onOpenDetails={() => setSelectedModalPlayer(rightPlayer)}
                />
              )}
            </div>

            {/* 3. HEAD-TO-HEAD COMPARISON MATRIX */}
            {leftPlayer && rightPlayer && (
              <Card className="border border-border/80 bg-card shadow-lg overflow-hidden">
                {/* Comparison Header Summary */}
                <div className="p-4 sm:p-5 border-b border-border/80 bg-muted/20 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Swords className="h-5 w-5 text-emerald-500" />
                    <div>
                      <h3 className="text-sm sm:text-base font-extrabold uppercase tracking-wider text-foreground">
                        Scontro Diretto Attributi
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Confronto delle abilità tra {leftPlayer.Nome} {leftPlayer.Cognome} e{" "}
                        {rightPlayer.Nome} {rightPlayer.Cognome}
                      </p>
                    </div>
                  </div>

                  {/* Scoreboard Pill */}
                  <div className="flex flex-wrap items-center gap-2 bg-card border border-border px-3.5 py-1.5 rounded-xl shadow-sm text-xs font-mono font-bold">
                    {activeTab === "STATS" ? (
                      <span className="text-emerald-500 flex items-center gap-1">
                        <BarChart3 className="h-3.5 w-3.5" />
                        Tabellino Partite Ufficiali di Campionato
                      </span>
                    ) : (
                      <>
                        <span className="text-blue-500">
                          {leftPlayer.Cognome}: {headToHeadSummary.winsLeft}
                        </span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-muted-foreground">
                          Parità: {headToHeadSummary.ties}
                        </span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-emerald-500">
                          {rightPlayer.Cognome}: {headToHeadSummary.winsRight}
                        </span>
                        {headToHeadSummary.hidden > 0 && (
                          <>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-amber-500 flex items-center gap-1">
                              <Lock className="h-3 w-3" /> {headToHeadSummary.hidden} da svelare
                            </span>
                          </>
                        )}
                        {isGkVsOutfield && activeTab === "ALL" && (
                          <Badge variant="outline" className="text-[9px] font-mono border-amber-500/30 text-amber-600 dark:text-amber-400">
                            Attributi Comuni
                          </Badge>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Categories Tabs List */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <div className="border-b border-border/80 bg-muted/10 px-3 overflow-x-auto">
                    <TabsList className="bg-transparent h-12 p-0 gap-1 sm:gap-2 justify-start">
                      {STAT_CATEGORIES.map((cat) => {
                        const Icon = cat.icon;
                        return (
                          <TabsTrigger
                            key={cat.id}
                            value={cat.id}
                            className="h-10 data-[state=active]:bg-card data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 data-[state=active]:text-foreground text-xs font-bold px-3 transition-all rounded-none"
                          >
                            <Icon className={`h-3.5 w-3.5 mr-1.5 ${cat.colorClass}`} />
                            {cat.label}
                          </TabsTrigger>
                        );
                      })}
                      <TabsTrigger
                        value="TRAITS"
                        className="h-10 data-[state=active]:bg-card data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 data-[state=active]:text-foreground text-xs font-bold px-3 transition-all rounded-none"
                      >
                        <Sparkles className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
                        Ruoli &amp; Tratti
                      </TabsTrigger>
                      <TabsTrigger
                        value="STATS"
                        className="h-10 data-[state=active]:bg-card data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 data-[state=active]:text-foreground text-xs font-bold px-3 transition-all rounded-none"
                      >
                        <BarChart3 className="h-3.5 w-3.5 mr-1.5 text-emerald-500" />
                        Statistiche Stagionali
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  {/* Standard Stat Department Tab Content */}
                  {STAT_CATEGORIES.map((cat) => (
                    <TabsContent key={cat.id} value={cat.id} className="p-4 sm:p-6 m-0 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
                        {cat.stats.map((stat) => (
                          <StatComparisonRow
                            key={stat.key}
                            stat={stat}
                            leftPlayer={leftPlayer}
                            rightPlayer={rightPlayer}
                          />
                        ))}
                      </div>
                    </TabsContent>
                  ))}

                  {/* Special Traits Tab Content */}
                  <TabsContent value="TRAITS" className="p-4 sm:p-6 m-0 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <TraitComparisonRow
                        label="Ruolo Specializzato 1"
                        field="Role1"
                        leftPlayer={leftPlayer}
                        rightPlayer={rightPlayer}
                      />
                      <TraitComparisonRow
                        label="Ruolo Specializzato 2"
                        field="Role2"
                        leftPlayer={leftPlayer}
                        rightPlayer={rightPlayer}
                      />
                      <TraitComparisonRow
                        label="Tratto Base 1"
                        field="Trait1"
                        leftPlayer={leftPlayer}
                        rightPlayer={rightPlayer}
                      />
                      <TraitComparisonRow
                        label="Tratto Base 2"
                        field="Trait2"
                        leftPlayer={leftPlayer}
                        rightPlayer={rightPlayer}
                      />
                      <TraitComparisonRow
                        label="Tratto Icona 1"
                        field="IconTrait1"
                        isIcon
                        leftPlayer={leftPlayer}
                        rightPlayer={rightPlayer}
                      />
                      <TraitComparisonRow
                        label="Tratto Icona 2"
                        field="IconTrait2"
                        isIcon
                        leftPlayer={leftPlayer}
                        rightPlayer={rightPlayer}
                      />
                      <TraitComparisonRow
                        label="Piede Debole"
                        field="PiedeDebole"
                        leftPlayer={leftPlayer}
                        rightPlayer={rightPlayer}
                      />
                      <TraitComparisonRow
                        label="Mosse Abilità (Skill)"
                        field="MABI"
                        leftPlayer={leftPlayer}
                        rightPlayer={rightPlayer}
                      />
                    </div>
                  </TabsContent>

                  {/* Seasonal Match Stats Tab Content (#55) */}
                  <TabsContent value="STATS" className="p-4 sm:p-6 m-0 focus-visible:outline-none">
                    <PlayerSeasonalStatsComparison leftPlayer={leftPlayer} rightPlayer={rightPlayer} />
                  </TabsContent>
                </Tabs>
              </Card>
            )}

            {/* 4. RADAR CHART COMPARISON (POLYGON OVERLAY) */}
            {leftPlayer && rightPlayer && (
              <PlayerComparisonRadar
                leftPlayer={leftPlayer}
                rightPlayer={rightPlayer}
              />
            )}
          </>
        )}
      </main>

      {/* 4. PLAYER SELECTOR DIALOG (SEARCHABLE, WITH SOURCE & ROLE FILTERS) */}
      <Dialog
        open={selectorTarget !== null}
        onOpenChange={(open) => !open && setSelectorTarget(null)}
      >
        <DialogContent className="max-w-4xl xl:max-w-5xl max-h-[88vh] flex flex-col p-0 overflow-hidden bg-card border-border/80">
          <DialogHeader className="p-5 pb-3 border-b border-border/80">
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-500" />
              Seleziona Giocatore per il Lato{" "}
              {selectorTarget === "left" ? "Sinistro (Blu)" : "Destro (Verde)"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {isTeamMode
                ? `Scegli tra i giocatori della rosa di ${currentTeamFullName} o uno dei 72 Rookie del Draft.`
                : "Scegli tra i calciatori attivi nelle squadre di Serie A."}
            </DialogDescription>

            {/* Search Bar */}
            <div className="relative mt-3">
              <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder={
                  isTeamMode
                    ? "Cerca per nome, cognome, ruolo o #..."
                    : "Cerca per nome, cognome, ruolo, squadra o #..."
                }
                value={selectorSearch}
                onChange={(e) => setSelectorSearch(e.target.value)}
                className="pl-9 h-9 text-xs"
                autoFocus
              />
            </div>

            {/* In Team Mode: Source Filter Tabs */}
            {isTeamMode ? (
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                <button
                  type="button"
                  onClick={() => setSelectorSource("ALL")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    selectorSource === "ALL"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-muted/40 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Tutti ({availablePlayers.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectorSource("TEAM")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    selectorSource === "TEAM"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-muted/40 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Rosa {currentTeam} ({teamPlayers.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectorSource("ROOKIE")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    selectorSource === "ROOKIE"
                      ? "bg-amber-500 text-white shadow-sm"
                      : "bg-muted/40 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Rookies Draft ({rookies.length})
                </button>
              </div>
            ) : (
              /* In Serie A Mode: Team Filter Selector */
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-muted-foreground shrink-0">Squadra:</span>
                  <Select value={selectorTeam} onValueChange={setSelectorTeam}>
                    <SelectTrigger className="h-8 text-xs bg-muted/30 w-full sm:w-64">
                      <SelectValue placeholder="Tutte le squadre" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Tutte le squadre ({teamPlayers.length})</SelectItem>
                      {serieATeams.map((t) => {
                        const count = teamPlayers.filter((p) => p.Squadra === t.TEAM_ID).length;
                        return (
                          <SelectItem key={t.TEAM_ID} value={t.TEAM_ID}>
                            {t.NAME} ({t.TEAM_ID}) - {count} giocatori
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Role Filter Pills */}
            <div className="flex flex-wrap gap-1 mt-2">
              {ROLE_GROUPS.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setSelectorRole(g.id)}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                    selectorRole === g.id
                      ? "bg-foreground text-background font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </DialogHeader>

          {/* Results List */}
          <div className="flex-1 overflow-y-auto p-4 max-h-[580px]">
            {dialogFilteredPlayers.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-xs">
                Nessun giocatore trovato con questi criteri di ricerca.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {dialogFilteredPlayers.map((player) => {
                const isSelected =
                  (selectorTarget === "left" && player.uniqueKey === leftKey) ||
                  (selectorTarget === "right" && player.uniqueKey === rightKey);
                const ovrInfo = getPlayerOvr(player);

                return (
                  <div
                    key={player.uniqueKey}
                    onClick={() => handleSelectFromDialog(player)}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-500/10 shadow-sm"
                        : "border-border/70 bg-card hover:bg-muted/40 hover:border-border"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-10 w-10 border border-border shrink-0">
                        <AvatarImage
                          src={getPlayerImage(player.ID)}
                          alt={`${player.Nome} ${player.Cognome}`}
                        />
                        <AvatarFallback className="text-[10px] font-bold">
                          {player.Nome?.[0]}
                          {player.Cognome?.[0]}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-foreground text-sm truncate">
                            {player.Nome} {player.Cognome}
                          </span>
                          <Badge
                            variant="outline"
                            className={`text-[9px] font-bold px-1.5 py-0 ${getRoleColor(
                              player.Posiz
                            )}`}
                          >
                            {player.Posiz}
                          </Badge>
                          <img
                            src={getNationalityFlag(player.Nazionalità)}
                            alt={player.Nazionalità}
                            className="h-3 w-4 object-cover rounded-sm shrink-0"
                          />
                        </div>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          {player.isRookie ? (
                            <span className="flex items-center gap-1 text-amber-500 font-semibold text-[11px]">
                              {renderStars(player.Stelle, "h-2.5 w-2.5")}
                              <span>•</span>
                              <span
                                className={`text-[10px] px-1 py-0 rounded border ${getTierBadgeStyle(
                                  player.scoutingTokens
                                )}`}
                              >
                                {player.scoutingTokens}G
                              </span>
                            </span>
                          ) : (
                            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              {player.Squadra && (
                                <img
                                  src={`${SUPABASE_STORAGE_URL}/images/teams/${player.Squadra}_Logo.png`}
                                  alt={player.Squadra}
                                  className="h-3.5 w-3.5 object-contain"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = "none";
                                  }}
                                />
                              )}
                              <span>{player.Squadra}</span>
                              {player.NumeroMaglia ? ` #${player.NumeroMaglia}` : ""}
                            </span>
                          )}
                          <span>•</span>
                          <span>{player.Età} anni</span>
                          {isRetiringSoon(player) && <RetiringBadge variant="compact" />}
                        </div>
                      </div>
                    </div>

                    {/* OVR Pill */}
                    <div className="shrink-0 text-right">
                      {ovrInfo.isRevealed ? (
                        <Badge
                          variant="outline"
                          className={`${getValueColor(
                            player.OVR ?? 0
                          )} text-sm font-black font-mono px-2 py-0.5 border`}
                        >
                          {ovrInfo.displayVal}
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-muted text-muted-foreground font-mono text-xs px-2 py-0.5 flex items-center gap-1"
                        >
                          <Lock className="h-2.5 w-2.5" /> ?
                        </Badge>
                      )}
                      <span className="text-[9px] uppercase font-bold text-muted-foreground block mt-0.5">
                        OVR
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 5. PLAYER FULL DETAIL MODAL (RADAR & ATTRIBUTES) */}
      {selectedModalPlayer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4"
          onClick={() => setSelectedModalPlayer(null)}
        >
          <PlayerDetails
            currentPlayer={selectedModalPlayer}
            onClose={() => setSelectedModalPlayer(null)}
          />
        </div>
      )}
    </div>
  );
};

// -------------------------------------------------------------
// SUB-COMPONENT: PLAYER COMPARISON CARD (LEFT OR RIGHT)
// -------------------------------------------------------------
interface PlayerComparisonCardProps {
  player: ComparisonPlayer;
  side: "left" | "right";
  onOpenSelector: () => void;
  onOpenDetails: () => void;
}

const PlayerComparisonCard = ({
  player,
  side,
  onOpenSelector,
  onOpenDetails,
}: PlayerComparisonCardProps) => {
  const isLeft = side === "left";
  const themeBorder = isLeft ? "border-blue-500/40" : "border-emerald-500/40";
  const themeGlow = isLeft
    ? "from-blue-500/10 via-card to-card"
    : "from-emerald-500/10 via-card to-card";

  const ovrInfo = getPlayerOvr(player);
  const macroPillars = getMacroPillars(player);
  const weakFoot = getPlayerTrait(player, "PiedeDebole");
  const skillMoves = getPlayerTrait(player, "MABI");

  return (
    <Card
      className={`relative rounded-2xl border-2 ${themeBorder} bg-gradient-to-b ${themeGlow} shadow-lg overflow-hidden flex flex-col justify-between`}
    >
      <div className="p-5 space-y-4">
        {/* Top Header: Badge Squadra / Rookie & Change Button */}
        <div className="flex items-center justify-between gap-2">
          {player.isRookie ? (
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge
                variant="outline"
                className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[11px] font-bold gap-1"
              >
                <Sparkles className="h-3 w-3" />
                Rookie Draft
              </Badge>
              {renderStars(player.Stelle, "h-3 w-3")}
              <Badge
                variant="outline"
                className={`text-[10px] font-mono font-bold ${getTierBadgeStyle(
                  player.scoutingTokens
                )}`}
              >
                Scouting: {player.scoutingTokens}G
              </Badge>
            </div>
          ) : (
            <Badge
              variant="outline"
              className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30 text-[11px] font-bold flex items-center gap-1.5"
            >
              {player.Squadra && (
                <img
                  src={`${SUPABASE_STORAGE_URL}/images/teams/${player.Squadra}_Logo.png`}
                  alt={player.Squadra}
                  className="h-3.5 w-3.5 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              )}
              <span>{player.Squadra} {player.NumeroMaglia ? `#${player.NumeroMaglia}` : ""}</span>
            </Badge>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={onOpenSelector}
            className="h-7 text-xs font-bold gap-1 bg-card hover:bg-muted"
          >
            <Users className="h-3 w-3 text-muted-foreground" />
            Cambia Giocatore
          </Button>
        </div>

        {/* Player Profile Hero */}
        <div className="flex items-start gap-4">
          {/* Avatar with OVR overlay */}
          <div className="relative shrink-0">
            <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border-2 border-border shadow-md">
              <AvatarImage
                src={getPlayerImage(player.ID)}
                alt={`${player.Nome} ${player.Cognome}`}
              />
              <AvatarFallback className="text-sm font-bold">
                {player.Nome?.[0]}
                {player.Cognome?.[0]}
              </AvatarFallback>
            </Avatar>

            {/* OVR Floating Badge */}
            <div
              className={`absolute -bottom-2 -right-2 h-8 min-w-[32px] px-1.5 rounded-lg flex items-center justify-center font-mono font-black text-sm border shadow-md ${
                ovrInfo.isRevealed
                  ? getValueColor(player.OVR ?? 0)
                  : "bg-muted text-muted-foreground border-border text-xs"
              }`}
              title={ovrInfo.isRevealed ? `Overall: ${ovrInfo.displayVal}` : "OVR da scoprire"}
            >
              {ovrInfo.isRevealed ? (
                ovrInfo.displayVal
              ) : (
                <span className="flex items-center gap-0.5">
                  <Lock className="h-2.5 w-2.5" />?
                </span>
              )}
            </div>
          </div>

          {/* Name & Biometrics */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <Badge
                variant="outline"
                className={`text-[10px] font-extrabold px-1.5 py-0 ${getRoleColor(
                  player.Posiz
                )}`}
              >
                {player.Posiz}
              </Badge>
              <h2 className="text-base sm:text-lg font-black text-foreground truncate">
                {player.Nome} {player.Cognome}
              </h2>
              <img
                src={getNationalityFlag(player.Nazionalità)}
                alt={player.Nazionalità}
                className="h-3.5 w-5 object-cover rounded-sm shrink-0"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-1.5">
              <span>{player.Età} anni</span>
                          {isRetiringSoon(player) && <RetiringBadge variant="compact" />}
              <span>•</span>
              <span>{player.Altezza ? `${player.Altezza} cm` : "—"}</span>
              <span>•</span>
              <span>Piede {player.Piede || "—"}</span>
            </div>

            {/* Weak foot & Skill moves */}
            <div className="flex flex-wrap items-center gap-3 text-xs mt-2 text-muted-foreground">
              <span className="flex items-center gap-1">
                Piede Debole:{" "}
                <strong className="text-foreground">
                  {weakFoot.isRevealed ? (
                    weakFoot.displayVal
                  ) : (
                    <span className="inline-flex items-center gap-0.5 text-amber-500 font-mono">
                      <Lock className="h-2.5 w-2.5" />?
                    </span>
                  )}
                </strong>
              </span>
              <span className="flex items-center gap-1">
                Skill:{" "}
                <strong className="text-foreground">
                  {skillMoves.isRevealed ? (
                    skillMoves.displayVal
                  ) : (
                    <span className="inline-flex items-center gap-0.5 text-amber-500 font-mono">
                      <Lock className="h-2.5 w-2.5" />?
                    </span>
                  )}
                </strong>
              </span>
            </div>
          </div>
        </div>

        {/* Macro Pillars Strip */}
        <div className="grid grid-cols-6 gap-1.5 pt-1">
          {macroPillars.map((p) => (
            <div
              key={p.label}
              className="p-1.5 rounded-lg bg-card border border-border/70 text-center shadow-xs"
              title={`${p.name}: ${p.displayVal}`}
            >
              <span className="text-[10px] font-black text-foreground uppercase block">
                {p.label}
              </span>
              <span
                className={`text-sm font-black font-mono block mt-0.5 ${
                  p.isRevealed
                    ? p.numericVal !== null
                      ? p.numericVal >= 80
                        ? "text-emerald-500"
                        : p.numericVal >= 70
                        ? "text-foreground"
                        : "text-muted-foreground"
                      : "text-muted-foreground"
                    : "text-amber-500 flex items-center justify-center gap-0.5"
                }`}
              >
                {p.isRevealed ? (
                  p.displayVal
                ) : (
                  <>
                    <Lock className="h-2.5 w-2.5" />?
                  </>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="px-5 py-2.5 bg-muted/20 border-t border-border/60 flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenDetails}
          className="h-7 text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          Scheda Completa
        </Button>

        {player.isRookie && (
          <Button
            variant="outline"
            size="sm"
            asChild
            className="h-7 text-xs font-bold gap-1 text-amber-500 border-amber-500/30 hover:bg-amber-500/10"
          >
            <Link to="/mia-squadra/scouting">
              <Coins className="h-3 w-3" />
              Scouting ({player.scoutingTokens}G)
            </Link>
          </Button>
        )}
      </div>
    </Card>
  );
};

// -------------------------------------------------------------
// SUB-COMPONENT: ATTRIBUTE COMPARISON ROW WITH INTERACTIVE BAR
// -------------------------------------------------------------
interface StatComparisonRowProps {
  stat: StatDef;
  leftPlayer: ComparisonPlayer;
  rightPlayer: ComparisonPlayer;
}

const StatComparisonRow = ({
  stat,
  leftPlayer,
  rightPlayer,
}: StatComparisonRowProps) => {
  const isStatGk = stat.dept === "POR";
  const leftIsGk = leftPlayer.Posiz === "POR";
  const rightIsGk = rightPlayer.Posiz === "POR";
  const leftNotGk = isStatGk && !leftIsGk;
  const rightNotGk = isStatGk && !rightIsGk;

  const rawLeft = getPlayerStatValue(leftPlayer, stat.key, stat.dept);
  const rawRight = getPlayerStatValue(rightPlayer, stat.key, stat.dept);

  const left = leftNotGk
    ? { isRevealed: true, numericVal: null, displayVal: "N/D" }
    : rawLeft;
  const right = rightNotGk
    ? { isRevealed: true, numericVal: null, displayVal: "N/D" }
    : rawRight;

  const bothRevealed = left.isRevealed && right.isRevealed;
  const numA = left.numericVal;
  const numB = right.numericVal;

  // Non dichiarare vittoria se uno dei due giocatori non appartiene al ruolo della statistica
  const isComparable = !(leftNotGk || rightNotGk);
  const aWins = isComparable && bothRevealed && numA !== null && numB !== null && numA > numB;
  const bWins = isComparable && bothRevealed && numA !== null && numB !== null && numB > numA;
  const isTie = isComparable && bothRevealed && numA !== null && numB !== null && numA === numB;

  const diffA = aWins && numA !== null && numB !== null ? `+${numA - numB}` : null;
  const diffB = bWins && numA !== null && numB !== null ? `+${numB - numA}` : null;

  // Visual Bar Percentage (proportional to values, defaulting to 50/50 if unrevealed or non-comparable)
  let percentA = 50;
  let percentB = 50;
  if (isComparable && bothRevealed && numA !== null && numB !== null && numA + numB > 0) {
    percentA = Math.round((numA / (numA + numB)) * 100);
    percentB = 100 - percentA;
  } else if (leftNotGk && !rightNotGk) {
    percentA = 0;
    percentB = 100;
  } else if (!leftNotGk && rightNotGk) {
    percentA = 100;
    percentB = 0;
  }

  return (
    <div className="p-3 rounded-xl bg-card border border-border/70 hover:border-border transition-colors">
      <div className="flex items-center justify-between mb-1 text-xs">
        {/* Left Player Value */}
        <div className="flex items-center gap-1.5 w-1/3 justify-start font-mono">
          <span
            className={`font-black text-sm ${
              left.isRevealed
                ? aWins
                  ? "text-blue-500 font-black"
                  : "text-foreground"
                : "text-amber-500 font-bold flex items-center gap-0.5"
            }`}
          >
            {left.isRevealed ? (
              left.displayVal
            ) : (
              <span
                className="inline-flex items-center gap-0.5 text-xs bg-amber-500/10 px-1 py-0.5 rounded border border-amber-500/30"
                title={`Non svelato: richiede fascia scouting ${left.requiredTokens}G`}
              >
                <Lock className="h-3 w-3" /> ?
              </span>
            )}
          </span>
          {diffA && (
            <Badge
              variant="outline"
              className="text-[9px] font-extrabold px-1 py-0 bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30"
            >
              {diffA}
            </Badge>
          )}
        </div>

        {/* Stat Label */}
        <div className="w-1/3 text-center text-xs font-black text-foreground uppercase tracking-wider truncate">
          {stat.label}
        </div>

        {/* Right Player Value */}
        <div className="flex items-center gap-1.5 w-1/3 justify-end font-mono">
          {diffB && (
            <Badge
              variant="outline"
              className="text-[9px] font-extrabold px-1 py-0 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
            >
              {diffB}
            </Badge>
          )}
          <span
            className={`font-black text-sm ${
              right.isRevealed
                ? bWins
                  ? "text-emerald-500 font-black"
                  : "text-foreground"
                : "text-amber-500 font-bold flex items-center gap-0.5"
            }`}
          >
            {right.isRevealed ? (
              right.displayVal
            ) : (
              <span
                className="inline-flex items-center gap-0.5 text-xs bg-amber-500/10 px-1 py-0.5 rounded border border-amber-500/30"
                title={`Non svelato: richiede fascia scouting ${right.requiredTokens}G`}
              >
                <Lock className="h-3 w-3" /> ?
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Two-Sided Visual Comparison Bar */}
      <div className="h-2 w-full bg-muted/40 rounded-full overflow-hidden flex">
        <div
          className={`h-full transition-all duration-300 ${
            left.isRevealed
              ? aWins
                ? "bg-blue-500"
                : "bg-blue-400/40"
              : "bg-amber-500/30"
          }`}
          style={{ width: `${percentA}%` }}
        />
        <div
          className={`h-full transition-all duration-300 ${
            right.isRevealed
              ? bWins
                ? "bg-emerald-500"
                : "bg-emerald-400/40"
              : "bg-amber-500/30"
          }`}
          style={{ width: `${percentB}%` }}
        />
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// SUB-COMPONENT: TRAIT COMPARISON ROW
// -------------------------------------------------------------
interface TraitComparisonRowProps {
  label: string;
  field:
    | "Role1"
    | "Role2"
    | "Trait1"
    | "Trait2"
    | "IconTrait1"
    | "IconTrait2"
    | "PiedeDebole"
    | "MABI";
  isIcon?: boolean;
  leftPlayer: ComparisonPlayer;
  rightPlayer: ComparisonPlayer;
}

const TraitComparisonRow = ({
  label,
  field,
  isIcon = false,
  leftPlayer,
  rightPlayer,
}: TraitComparisonRowProps) => {
  const left = getPlayerTrait(leftPlayer, field);
  const right = getPlayerTrait(rightPlayer, field);

  return (
    <div className="p-3.5 rounded-xl bg-card border border-border/80 flex flex-col justify-between gap-2">
      <div className="flex items-center justify-between text-xs font-black text-foreground uppercase tracking-wider">
        <span className="flex items-center gap-1.5">
          {isIcon && <Sparkles className="h-3.5 w-3.5 text-amber-500" />}
          {label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs pt-1">
        {/* Left Player Trait */}
        <div className="p-2.5 rounded-lg bg-muted/20 border border-border/50">
          <span className="text-[10px] font-bold text-blue-500 block truncate">
            {leftPlayer.Nome} {leftPlayer.Cognome}
          </span>
          <span className="font-bold text-foreground mt-0.5 block truncate">
            {left.isRevealed ? (
              left.displayVal
            ) : (
              <span className="text-amber-500 flex items-center gap-1 font-mono text-xs">
                <Lock className="h-3 w-3" /> Sblocca con {left.requiredTokens}G
              </span>
            )}
          </span>
        </div>

        {/* Right Player Trait */}
        <div className="p-2.5 rounded-lg bg-muted/20 border border-border/50">
          <span className="text-[10px] font-bold text-emerald-500 block truncate">
            {rightPlayer.Nome} {rightPlayer.Cognome}
          </span>
          <span className="font-bold text-foreground mt-0.5 block truncate">
            {right.isRevealed ? (
              right.displayVal
            ) : (
              <span className="text-amber-500 flex items-center gap-1 font-mono text-xs">
                <Lock className="h-3 w-3" /> Sblocca con {right.requiredTokens}G
              </span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// SUB-COMPONENT: RADAR COMPARISON CHART (EA FC / FM STYLE)
// -------------------------------------------------------------
interface PlayerComparisonRadarProps {
  leftPlayer: ComparisonPlayer;
  rightPlayer: ComparisonPlayer;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: {
    payload: {
      pillar: string;
      pillarName: string;
      valA: number;
      valB: number;
      displayA: string;
      displayB: string;
      isRevealedA: boolean;
      isRevealedB: boolean;
      winner: string | null;
    };
  }[];
}

const CustomRadarTooltip = ({
  active,
  payload,
  leftName,
  rightName,
}: CustomTooltipProps & { leftName: string; rightName: string }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-xl border border-border/80 bg-popover/95 p-3 shadow-xl backdrop-blur-md text-xs min-w-[210px] space-y-1.5 z-50">
        <div className="font-extrabold uppercase tracking-wider text-foreground border-b border-border/60 pb-1 flex items-center justify-between">
          <span>{data.pillarName}</span>
          <span className="text-[10px] text-muted-foreground font-mono">({data.pillar})</span>
        </div>
        <div className="flex items-center justify-between text-blue-500 font-bold">
          <span className="truncate max-w-[120px]">{leftName}:</span>
          <span className="font-mono text-sm font-black">
            {data.isRevealedA ? data.displayA : "? (Scouting)"}
          </span>
        </div>
        <div className="flex items-center justify-between text-emerald-500 font-bold">
          <span className="truncate max-w-[120px]">{rightName}:</span>
          <span className="font-mono text-sm font-black">
            {data.isRevealedB ? data.displayB : "? (Scouting)"}
          </span>
        </div>
        {data.winner && (
          <div className="text-[11px] font-medium text-muted-foreground pt-1 border-t border-border/40">
            {data.winner}
          </div>
        )}
      </div>
    );
  }
  return null;
};

const PlayerComparisonRadar = ({
  leftPlayer,
  rightPlayer,
}: PlayerComparisonRadarProps) => {
  const isLeftGk = leftPlayer.Posiz === "POR";
  const isRightGk = rightPlayer.Posiz === "POR";
  const isGkVsOutfield = isLeftGk !== isRightGk;

  const leftPillars = getMacroPillars(leftPlayer);
  const rightPillars = getMacroPillars(rightPlayer);

  const leftOvr = getPlayerOvr(leftPlayer);
  const rightOvr = getPlayerOvr(rightPlayer);

  const leftHiddenCount = leftPillars.filter((p) => !p.isRevealed).length;
  const rightHiddenCount = rightPillars.filter((p) => !p.isRevealed).length;

  // Se entrambi sono portieri o entrambi sono di movimento: radar unico classico
  const radarData = !isGkVsOutfield
    ? leftPillars.map((lp, idx) => {
        const rp = rightPillars[idx];
        const valA = lp.isRevealed ? (lp.numericVal ?? 0) : 25;
        const valB = rp.isRevealed ? (rp.numericVal ?? 0) : 25;

        let winnerText: string | null = null;
        if (lp.isRevealed && rp.isRevealed && lp.numericVal !== null && rp.numericVal !== null) {
          if (lp.numericVal > rp.numericVal) {
            winnerText = `+${lp.numericVal - rp.numericVal} ${leftPlayer.Cognome}`;
          } else if (rp.numericVal > lp.numericVal) {
            winnerText = `+${rp.numericVal - lp.numericVal} ${rightPlayer.Cognome}`;
          } else {
            winnerText = "Parità perfetta";
          }
        } else if (!lp.isRevealed || !rp.isRevealed) {
          winnerText = "Statistica non svelata (Richiede Scouting)";
        }

        return {
          pillar: lp.label,
          pillarName: lp.name,
          valA,
          valB,
          displayA: lp.displayVal,
          displayB: rp.displayVal,
          isRevealedA: lp.isRevealed,
          isRevealedB: rp.isRevealed,
          winner: winnerText,
        };
      })
    : [];

  // Se POR vs Movimento: prepariamo i dati separati per i 2 radar individuali
  const leftSingleRadarData = isGkVsOutfield
    ? leftPillars.map((p) => ({
        pillar: p.label,
        pillarName: p.name,
        val: p.isRevealed ? (p.numericVal ?? 0) : 25,
        display: p.displayVal,
        isRevealed: p.isRevealed,
      }))
    : [];

  const rightSingleRadarData = isGkVsOutfield
    ? rightPillars.map((p) => ({
        pillar: p.label,
        pillarName: p.name,
        val: p.isRevealed ? (p.numericVal ?? 0) : 25,
        display: p.displayVal,
        isRevealed: p.isRevealed,
      }))
    : [];

  return (
    <Card className="border border-border/80 bg-card shadow-lg overflow-hidden">
      <CardHeader className="p-4 sm:p-5 border-b border-border/80 bg-muted/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="text-sm sm:text-base font-extrabold uppercase tracking-wider flex items-center gap-2">
            <Activity className="h-5 w-5 text-emerald-500" />
            Radar di Confronto Multi-Dimensionale
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isGkVsOutfield
              ? "Profili prestazionali a 6 macro-aree dedicati per ruolo (Portiere vs Movimento)."
              : "Impronta geometrica a 6 macro-aree (scala 0–99). Visualizza a colpo d'occhio l'equilibrio tecnico e atletico."}
          </p>
        </div>

        {/* Legend Pills */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 font-bold">
            <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
            <span>
              {leftPlayer.Cognome} ({leftPlayer.Posiz} - {leftOvr.displayVal})
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span>
              {rightPlayer.Cognome} ({rightPlayer.Posiz} - {rightOvr.displayVal})
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-6">
        {/* Caso A: Errore Portiere vs Movimento (#55 - Opzione A) */}
        {isGkVsOutfield ? (
          <div className="space-y-6">
            {/* Banner Informativo di Non Sovrapponibilità Geometrica */}
            <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 flex items-start sm:items-center gap-3">
              <ShieldAlert className="h-5 w-5 text-amber-500 shrink-0 mt-0.5 sm:mt-0" />
              <div className="text-xs space-y-0.5">
                <span className="font-extrabold text-foreground block">
                  Confronto Geometrico Diretto Non Applicabile (Portiere vs Movimento)
                </span>
                <p className="text-muted-foreground leading-relaxed">
                  I portieri utilizzano metriche specifiche di reparto (Tuffo, Presa, Rinvio, Riflessi, Piazzamento) che non sono direttamente sovrapponibili alle macro-aree dei giocatori di movimento (Velocità, Tiro, Passaggio, Dribbling, Difesa). Di seguito sono presentate le impronte geometriche e i valori specifici di ciascun calciatore.
                </p>
              </div>
            </div>

            {/* Schede Radar Individuali Affiancate */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Giocatore Sinistro */}
              <div className="p-4 rounded-2xl border border-blue-500/30 bg-blue-500/5 flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between border-b border-border/60 pb-2">
                  <span className="font-extrabold text-xs text-foreground flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                    {leftPlayer.Nome} {leftPlayer.Cognome} ({leftPlayer.Posiz})
                  </span>
                  <Badge variant="outline" className="text-[10px] font-mono border-blue-500/40 text-blue-500 font-bold">
                    OVR {leftOvr.displayVal}
                  </Badge>
                </div>

                <div className="w-full h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={leftSingleRadarData} outerRadius="75%">
                      <PolarGrid stroke="hsl(var(--border))" strokeOpacity={0.8} strokeDasharray="3 3" />
                      <PolarAngleAxis dataKey="pillar" tick={{ fill: "hsl(var(--foreground))", fontSize: 10, fontWeight: 800 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 99]} tick={false} axisLine={false} />
                      <Radar
                        name={leftPlayer.Cognome}
                        dataKey="val"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.35}
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: "#3b82f6" }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50">
                  {leftPillars.map((p) => (
                    <div key={p.label} className="p-2 rounded-lg bg-card/80 border border-border/60 flex items-center justify-between text-xs">
                      <span className="text-xs font-mono font-bold text-foreground">{p.label} {p.name}:</span>
                      <span className="font-black text-blue-500 font-mono">{p.displayVal}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Giocatore Destro */}
              <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between border-b border-border/60 pb-2">
                  <span className="font-extrabold text-xs text-foreground flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    {rightPlayer.Nome} {rightPlayer.Cognome} ({rightPlayer.Posiz})
                  </span>
                  <Badge variant="outline" className="text-[10px] font-mono border-emerald-500/40 text-emerald-500 font-bold">
                    OVR {rightOvr.displayVal}
                  </Badge>
                </div>

                <div className="w-full h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={rightSingleRadarData} outerRadius="75%">
                      <PolarGrid stroke="hsl(var(--border))" strokeOpacity={0.8} strokeDasharray="3 3" />
                      <PolarAngleAxis dataKey="pillar" tick={{ fill: "hsl(var(--foreground))", fontSize: 10, fontWeight: 800 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 99]} tick={false} axisLine={false} />
                      <Radar
                        name={rightPlayer.Cognome}
                        dataKey="val"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.35}
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: "#10b981" }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50">
                  {rightPillars.map((p) => (
                    <div key={p.label} className="p-2 rounded-lg bg-card/80 border border-border/60 flex items-center justify-between text-xs">
                      <span className="text-xs font-mono font-bold text-foreground">{p.label} {p.name}:</span>
                      <span className="font-black text-emerald-500 font-mono">{p.displayVal}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Caso B: Ruoli Omogenei (Entrambi Movimento o Entrambi Portieri) */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Radar Graphic (Left 7 columns on desktop) */}
            <div className="lg:col-span-7 flex flex-col items-center justify-center relative min-h-[320px] sm:min-h-[360px] w-full">
              {(leftHiddenCount > 0 || rightHiddenCount > 0) && (
                <div className="absolute top-0 right-0 z-10 flex flex-col items-end gap-1 pointer-events-none">
                  {leftHiddenCount > 0 && (
                    <Badge
                      variant="outline"
                      className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 text-[10px] font-mono gap-1"
                    >
                      <Lock className="h-2.5 w-2.5" />
                      {leftPlayer.Cognome}: {6 - leftHiddenCount}/6 scoperte
                    </Badge>
                  )}
                  {rightHiddenCount > 0 && (
                    <Badge
                      variant="outline"
                      className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-mono gap-1"
                    >
                      <Lock className="h-2.5 w-2.5" />
                      {rightPlayer.Cognome}: {6 - rightHiddenCount}/6 scoperte
                    </Badge>
                  )}
                </div>
              )}

              <div className="w-full h-[320px] sm:h-[360px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} outerRadius="75%">
                    <PolarGrid
                      stroke="hsl(var(--border))"
                      strokeOpacity={0.8}
                      strokeDasharray="3 3"
                    />
                    <PolarAngleAxis
                      dataKey="pillar"
                      tick={{
                        fill: "hsl(var(--foreground))",
                        fontSize: 11,
                        fontWeight: 800,
                      }}
                    />
                    <PolarRadiusAxis
                      angle={30}
                      domain={[0, 99]}
                      tick={false}
                      axisLine={false}
                    />
                    <Radar
                      name={leftPlayer.Cognome}
                      dataKey="valA"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.35}
                      strokeWidth={2.5}
                      dot={{ r: 3.5, fill: "#3b82f6" }}
                    />
                    <Radar
                      name={rightPlayer.Cognome}
                      dataKey="valB"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.35}
                      strokeWidth={2.5}
                      dot={{ r: 3.5, fill: "#10b981" }}
                    />
                    <RechartsTooltip
                      content={
                        <CustomRadarTooltip
                          leftName={leftPlayer.Cognome}
                          rightName={rightPlayer.Cognome}
                        />
                      }
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Macro Pillars Breakdown & Advantages (Right 5 columns on desktop) */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-2.5">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between pb-1 border-b border-border/60">
                <span>Macro-Area</span>
                <div className="flex items-center gap-4 text-[11px] font-mono">
                  <span className="text-blue-500 font-bold">{leftPlayer.Cognome}</span>
                  <span className="text-muted-foreground">vs</span>
                  <span className="text-emerald-500 font-bold">{rightPlayer.Cognome}</span>
                </div>
              </div>

              <div className="space-y-2">
                {radarData.map((item) => {
                  const numA = item.isRevealedA ? item.valA : null;
                  const numB = item.isRevealedB ? item.valB : null;
                  const bothRevealed = numA !== null && numB !== null;
                  const aWins = bothRevealed && numA > numB;
                  const bWins = bothRevealed && numB > numA;
                  const isTie = bothRevealed && numA === numB;

                  return (
                    <div
                      key={item.pillar}
                      className="p-2.5 rounded-xl bg-muted/20 border border-border/60 hover:border-border transition-colors flex flex-col gap-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-extrabold text-foreground flex items-center gap-1.5">
                          <span className="font-mono text-[10px] font-black text-foreground/80">
                            {item.pillar}
                          </span>
                          <span className="font-black text-foreground">{item.pillarName}</span>
                        </span>

                        <div className="flex items-center gap-2 font-mono text-xs">
                          {/* Left Player Value */}
                          <span
                            className={`font-black ${
                              item.isRevealedA
                                ? aWins
                                  ? "text-blue-500"
                                  : "text-foreground"
                                : "text-amber-500"
                            }`}
                          >
                            {item.displayA}
                          </span>

                          {/* Delta Indicator */}
                          <div className="w-16 text-center">
                            {bothRevealed ? (
                              aWins ? (
                                <Badge
                                  variant="outline"
                                  className="text-[9px] font-mono font-bold px-1 py-0 bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30"
                                >
                                  +{numA - numB}
                                </Badge>
                              ) : bWins ? (
                                <Badge
                                  variant="outline"
                                  className="text-[9px] font-mono font-bold px-1 py-0 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                                >
                                  +{numB - numA}
                                </Badge>
                              ) : (
                                <span className="text-[10px] text-muted-foreground font-bold">=</span>
                              )
                            ) : (
                              <span
                                className="inline-flex items-center gap-0.5 text-[9px] text-amber-500 font-mono"
                                title="Scouting parziale"
                              >
                                <Lock className="h-2.5 w-2.5" /> ?
                              </span>
                            )}
                          </div>

                          {/* Right Player Value */}
                          <span
                            className={`font-black ${
                              item.isRevealedB
                                ? bWins
                                  ? "text-emerald-500"
                                  : "text-foreground"
                                : "text-amber-500"
                            }`}
                          >
                            {item.displayB}
                          </span>
                        </div>
                      </div>

                      {/* Micro duel progress bar */}
                      <div className="h-1.5 w-full bg-muted/40 rounded-full overflow-hidden flex">
                        <div
                          className={`h-full transition-all duration-300 ${
                            item.isRevealedA
                              ? aWins
                                ? "bg-blue-500"
                                : "bg-blue-400/40"
                              : "bg-amber-500/30"
                          }`}
                          style={{
                            width: `${
                              bothRevealed && numA + numB > 0
                                ? Math.round((numA / (numA + numB)) * 100)
                                : 50
                            }%`,
                          }}
                        />
                        <div
                          className={`h-full transition-all duration-300 ${
                            item.isRevealedB
                              ? bWins
                                ? "bg-emerald-500"
                                : "bg-emerald-400/40"
                              : "bg-amber-500/30"
                          }`}
                          style={{
                            width: `${
                              bothRevealed && numA + numB > 0
                                ? Math.round((numB / (numA + numB)) * 100)
                                : 50
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ConfrontoGiocatori;

import { useState, useMemo, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Shield,
  Zap,
  Users,
  Search,
  Shirt,
  Sparkles,
  LayoutGrid,
  List,
  CheckCircle2,
  AlertCircle,
  Footprints,
  SlidersHorizontal,
  ChevronRight,
  User,
  Ruler,
  Weight,
  Save,
  RotateCcw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Tag,
  Coins,
  Check,
  Store,
  X,
  TrendingUp,
  Scissors,
  Loader2,
} from "lucide-react";
import {
  getRoleColor,
  getPlayerImage,
  getNationalityFlag,
  getTeamBackground,
  getValueColor,
} from "@/utils/functions";
import { getPlayers } from "@/hooks/use-players";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Player } from "@/types/player";
import PlayerDetails from "@/components/player/playerDetails";
import AdminTeamSelector from "@/components/AdminTeamSelector";
import RequireAuthPrompt from "@/components/RequireAuthPrompt";
import { supabase } from "@/supabaseClient";
import { PLAYER_TABLE, PLAYER_MARKET_TABLE } from "@/constants/App";
import {
  MARKET_STATUS_OPTIONS,
  getMarketStatusCode,
  getMarketStatusOption,
  MarketStatusCode,
} from "@/types/marketStatus";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getTeamCutPlayerIds,
  togglePlayerCut,
  getTeamAvailablePicksCount,
  getCompensatoryPicksCount,
  CUTS_MIN_ROSTER,
  CUTS_MAX_ROSTER,
  CUTS_MAX_ASSETS,
} from "@/services/cutsService";
import { getRosterLockState, subscribeToRosterLock } from "@/services/rosterLockService";
import {
  JERSEY_STYLE_OPTIONS,
  JERSEY_FIT_OPTIONS,
  SLEEVE_LENGTH_OPTIONS,
  SEASONAL_JERSEY_OPTIONS,
  SOCK_LENGTH_OPTIONS,
  ACCESSORY_OPTIONS,
  ACCESSORY_COLOR_OPTIONS,
  GK_GLOVES_OPTIONS,
  POPULAR_SHOE_OPTIONS,
  getJerseyStyleLabel,
  getJerseyFitLabel,
  getSleeveLengthLabel,
  getSockLengthLabel,
  getAccessoryLabel,
  getAccessoryColorLabel,
  getGKGlovesLabel,
  getShoeLabel,
} from "@/constants/accessories";
import { toast } from "sonner";

const ROLE_PRIORITY: Record<string, number> = {
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

const ROLE_GROUPS: { id: string; label: string; roles: string[] }[] = [
  { id: "ALL", label: "Tutti i Ruoli", roles: [] },
  { id: "POR", label: "POR", roles: ["POR"] },
  { id: "DIF", label: "Difesa", roles: ["DC", "TD", "TS"] },
  { id: "CEN", label: "Centrocampo", roles: ["CDC", "CC", "ED", "ES", "COC"] },
  { id: "ATT", label: "Attacco", roles: ["AD", "AS", "ATT"] },
];

interface StatColumnDef {
  key: keyof Player;
  label: string;
  shortLabel: string;
  category: "FIS" | "DIF" | "PAS" | "ATT" | "POR";
  categoryLabel: string;
  categoryColor: string;
}

const STAT_COLUMNS: StatColumnDef[] = [
  // FISICO
  { key: "VELO", label: "Velocità Scatto", shortLabel: "VEL", category: "FIS", categoryLabel: "Fisico", categoryColor: "text-purple-600 dark:text-purple-400" },
  { key: "ACCL", label: "Accelerazione", shortLabel: "ACC", category: "FIS", categoryLabel: "Fisico", categoryColor: "text-purple-600 dark:text-purple-400" },
  { key: "FRZA", label: "Forza Fisica", shortLabel: "FRZ", category: "FIS", categoryLabel: "Fisico", categoryColor: "text-purple-600 dark:text-purple-400" },
  { key: "RESI", label: "Resistenza", shortLabel: "RES", category: "FIS", categoryLabel: "Fisico", categoryColor: "text-purple-600 dark:text-purple-400" },
  { key: "AGIL", label: "Agilità", shortLabel: "AGI", category: "FIS", categoryLabel: "Fisico", categoryColor: "text-purple-600 dark:text-purple-400" },
  { key: "ELEV", label: "Elevazione", shortLabel: "ELE", category: "FIS", categoryLabel: "Fisico", categoryColor: "text-purple-600 dark:text-purple-400" },

  // DIFESA
  { key: "CONT", label: "Contrasto", shortLabel: "CON", category: "DIF", categoryLabel: "Difesa", categoryColor: "text-blue-600 dark:text-blue-400" },
  { key: "MARC", label: "Marcatura", shortLabel: "MAR", category: "DIF", categoryLabel: "Difesa", categoryColor: "text-blue-600 dark:text-blue-400" },
  { key: "INTR", label: "Intercettazione", shortLabel: "INT", category: "DIF", categoryLabel: "Difesa", categoryColor: "text-blue-600 dark:text-blue-400" },
  { key: "SCIV", label: "Scivolata", shortLabel: "SCI", category: "DIF", categoryLabel: "Difesa", categoryColor: "text-blue-600 dark:text-blue-400" },
  { key: "AGGR", label: "Aggressività", shortLabel: "AGG", category: "DIF", categoryLabel: "Difesa", categoryColor: "text-blue-600 dark:text-blue-400" },

  // PASSAGGI
  { key: "PASC", label: "Passaggio Corto", shortLabel: "PSC", category: "PAS", categoryLabel: "Passaggi", categoryColor: "text-cyan-600 dark:text-cyan-400" },
  { key: "PASL", label: "Passaggio Lungo", shortLabel: "PSL", category: "PAS", categoryLabel: "Passaggi", categoryColor: "text-cyan-600 dark:text-cyan-400" },
  { key: "CTRP", label: "Controllo Palla", shortLabel: "CTR", category: "PAS", categoryLabel: "Passaggi", categoryColor: "text-cyan-600 dark:text-cyan-400" },
  { key: "VISI", label: "Visione di Gioco", shortLabel: "VIS", category: "PAS", categoryLabel: "Passaggi", categoryColor: "text-cyan-600 dark:text-cyan-400" },
  { key: "CRSS", label: "Cross", shortLabel: "CRS", category: "PAS", categoryLabel: "Passaggi", categoryColor: "text-cyan-600 dark:text-cyan-400" },

  // ATTACCO
  { key: "FINA", label: "Finalizzazione", shortLabel: "FIN", category: "ATT", categoryLabel: "Attacco", categoryColor: "text-rose-600 dark:text-rose-400" },
  { key: "PTIR", label: "Potenza Tiro", shortLabel: "POT", category: "ATT", categoryLabel: "Attacco", categoryColor: "text-rose-600 dark:text-rose-400" },
  { key: "TIRD", label: "Tiro dalla Distanza", shortLabel: "TIR", category: "ATT", categoryLabel: "Attacco", categoryColor: "text-rose-600 dark:text-rose-400" },
  { key: "DRBL", label: "Dribbling", shortLabel: "DRB", category: "ATT", categoryLabel: "Attacco", categoryColor: "text-rose-600 dark:text-rose-400" },
  { key: "TSTA", label: "Colpo di Testa", shortLabel: "TES", category: "ATT", categoryLabel: "Attacco", categoryColor: "text-rose-600 dark:text-rose-400" },
  { key: "PIAZ", label: "Piazzamento Offensivo", shortLabel: "PIA", category: "ATT", categoryLabel: "Attacco", categoryColor: "text-rose-600 dark:text-rose-400" },

  // PORTIERE
  { key: "TUFP", label: "Tuffo Portiere", shortLabel: "TUF", category: "POR", categoryLabel: "Portiere", categoryColor: "text-amber-600 dark:text-amber-400" },
  { key: "PREP", label: "Presa Portiere", shortLabel: "PRE", category: "POR", categoryLabel: "Portiere", categoryColor: "text-amber-600 dark:text-amber-400" },
  { key: "RINP", label: "Rinvio Portiere", shortLabel: "RIN", category: "POR", categoryLabel: "Portiere", categoryColor: "text-amber-600 dark:text-amber-400" },
  { key: "RIFP", label: "Riflessi Portiere", shortLabel: "RIF", category: "POR", categoryLabel: "Portiere", categoryColor: "text-amber-600 dark:text-amber-400" },
  { key: "POSP", label: "Posizionamento Portiere", shortLabel: "POS", category: "POR", categoryLabel: "Portiere", categoryColor: "text-amber-600 dark:text-amber-400" },
];

const TABLE_STAT_CATEGORIES = [
  { id: "ALL", label: "Tutti gli Attributi" },
  { id: "FIS", label: "Fisico & Velocità" },
  { id: "DIF", label: "Difesa" },
  { id: "PAS", label: "Passaggi & Regia" },
  { id: "ATT", label: "Attacco & Tiro" },
  { id: "POR", label: "Portiere" },
];

const getStatColorClass = (val: number | string | null | undefined) => {
  if (val === null || val === undefined || val === "") return "text-muted-foreground/30";
  const num = Number(val);
  if (isNaN(num)) return "text-foreground";
  if (num >= 90) return "text-purple-600 dark:text-purple-400 font-black";
  if (num >= 85) return "text-blue-600 dark:text-blue-400 font-extrabold";
  if (num >= 80) return "text-emerald-600 dark:text-emerald-400 font-bold";
  if (num >= 75) return "text-amber-600 dark:text-amber-400 font-semibold";
  if (num >= 70) return "text-yellow-600 dark:text-yellow-400";
  if (num >= 60) return "text-orange-500/80";
  return "text-muted-foreground/60";
};

const Roster = () => {
  const { user, effectiveTeam, effectiveTeamFullName, isAdmin } = useAuth();
  const currentTeam = effectiveTeam;
  const currentTeamFullName = effectiveTeamFullName || currentTeam;
  const { players, loading } = getPlayers(currentTeam);
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<string>("roster");
  const [viewLayout, setViewLayout] = useState<"grid" | "table">("grid");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");

  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  // Kit & Accessories Customizer Modal state
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [kitForm, setKitForm] = useState<{
    NumeroMaglia: number | null;
    JerseyStyle: number;
    JerseyFit: number;
    SleeveLength: number;
    SeasonalJersey: number;
    SockLength: number;
    Shoe: number;
    GKGloves: number;
    Accessory1: number;
    Colour: number;
    Accessory2: number;
    Colour_1: number;
    Accessory3: number;
    Colour_2: number;
    Accessory4: number;
    Colour_3: number;
  }>({
    NumeroMaglia: null,
    JerseyStyle: 0,
    JerseyFit: 0,
    SleeveLength: 0,
    SeasonalJersey: 0,
    SockLength: 0,
    Shoe: 0,
    GKGloves: 0,
    Accessory1: 0,
    Colour: 0,
    Accessory2: 0,
    Colour_1: 0,
    Accessory3: 0,
    Colour_2: 0,
    Accessory4: 0,
    Colour_3: 0,
  });
  const [savingKit, setSavingKit] = useState<boolean>(false);

  // Map of kit numbers already assigned in the team (excluding the player being edited)
  const assignedKitNumbers = useMemo(() => {
    const map = new Map<number, Player>();
    for (const p of players) {
      if (p.NumeroMaglia && (!editingPlayer || p.ID !== editingPlayer.ID)) {
        map.set(Number(p.NumeroMaglia), p);
      }
    }
    return map;
  }, [players, editingPlayer]);

  // Check if chosen kit number in the form is in conflict
  const kitNumberConflict = useMemo(() => {
    if (!kitForm.NumeroMaglia) return null;
    return assignedKitNumbers.get(Number(kitForm.NumeroMaglia)) ?? null;
  }, [kitForm.NumeroMaglia, assignedKitNumbers]);

  // Suggested free kit numbers (1..99)
  const freeNumbers = useMemo(() => {
    const free: number[] = [];
    for (let i = 1; i <= 99; i++) {
      if (!assignedKitNumbers.has(i)) {
        free.push(i);
        if (free.length >= 14) break;
      }
    }
    return free;
  }, [assignedKitNumbers]);

  // Sorted and filtered players list
  const filteredPlayers = useMemo(() => {
    return players
      .filter((p) => {
        if (roleFilter !== "ALL") {
          const group = ROLE_GROUPS.find((g) => g.id === roleFilter);
          if (group && group.roles.length > 0 && !group.roles.includes(p.Posiz)) {
            return false;
          }
        }
        if (searchQuery.trim() !== "") {
          const q = searchQuery.toLowerCase().trim();
          const num = p.NumeroMaglia ? String(p.NumeroMaglia) : "";
          const full = `${p.Nome} ${p.Cognome} ${p.Posiz} ${num}`.toLowerCase();
          return full.includes(q);
        }
        return true;
      })
      .sort((a, b) => {
        if (activeTab === "kit-accessories") {
          const numA = a.NumeroMaglia ?? 999;
          const numB = b.NumeroMaglia ?? 999;
          if (numA !== numB) return numA - numB;
        }
        const rp = (ROLE_PRIORITY[a.Posiz] ?? 99) - (ROLE_PRIORITY[b.Posiz] ?? 99);
        if (rp !== 0) return rp;
        return (b.OVR ?? 0) - (a.OVR ?? 0);
      });
  }, [players, roleFilter, searchQuery, activeTab]);

  // Table view: attribute category filter & column sorting
  const [tableStatCategory, setTableStatCategory] = useState<string>("ALL");
  const [tableSortColumn, setTableSortColumn] = useState<string>("ROLE");
  const [tableSortDirection, setTableSortDirection] = useState<"asc" | "desc">("asc");

  const displayedStatColumns = useMemo(() => {
    if (tableStatCategory === "ALL") return STAT_COLUMNS;
    return STAT_COLUMNS.filter((col) => col.category === tableStatCategory);
  }, [tableStatCategory]);

  const handleTableSort = (colKey: string) => {
    if (tableSortColumn === colKey) {
      setTableSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setTableSortColumn(colKey);
      if (colKey === "Nome" || colKey === "ROLE" || colKey === "Posiz" || colKey === "Piede") {
        setTableSortDirection("asc");
      } else {
        setTableSortDirection("desc");
      }
    }
  };

  const sortedTablePlayers = useMemo(() => {
    if (tableSortColumn === "ROLE") {
      return [...filteredPlayers].sort((a, b) => {
        const rp = (ROLE_PRIORITY[a.Posiz] ?? 99) - (ROLE_PRIORITY[b.Posiz] ?? 99);
        if (rp !== 0) return tableSortDirection === "asc" ? rp : -rp;
        return (b.OVR ?? 0) - (a.OVR ?? 0);
      });
    }

    return [...filteredPlayers].sort((a, b) => {
      let valA: unknown = a[tableSortColumn as keyof Player];
      let valB: unknown = b[tableSortColumn as keyof Player];

      if (tableSortColumn === "Nome") {
        valA = `${a.Nome} ${a.Cognome}`;
        valB = `${b.Nome} ${b.Cognome}`;
      } else if (tableSortColumn === "NumeroMaglia") {
        valA = a.NumeroMaglia ?? (tableSortDirection === "asc" ? 999 : -1);
        valB = b.NumeroMaglia ?? (tableSortDirection === "asc" ? 999 : -1);
      }

      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      if (typeof valA === "string" && typeof valB === "string") {
        return tableSortDirection === "asc"
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }

      return tableSortDirection === "asc"
        ? Number(valA) - Number(valB)
        : Number(valB) - Number(valA);
    });
  }, [filteredPlayers, tableSortColumn, tableSortDirection]);

  // Telemetry KPIs
  const avgOvr = useMemo(() => {
    if (players.length === 0) return 0;
    return Math.round(
      players.reduce((sum, p) => sum + (p.OVR ?? 0), 0) / players.length
    );
  }, [players]);

  const avgAge = useMemo(() => {
    if (players.length === 0) return "0.0";
    const sum = players.reduce((acc, p) => acc + (Number(p.Età) || 0), 0);
    return (sum / players.length).toFixed(1);
  }, [players]);

  const assignedNumbersCount = useMemo(() => {
    return players.filter((p) => p.NumeroMaglia !== null && p.NumeroMaglia !== undefined).length;
  }, [players]);

  // Market status state & counts
  const [marketFilterTab, setMarketFilterTab] = useState<string>("ALL");
  const [savingMarketPlayerId, setSavingMarketPlayerId] = useState<number | null>(null);

  // Cuts management state & counts
  const { data: cutPlayerIdsArray = [], refetch: refetchCuts } = useQuery({
    queryKey: ["team_cuts", currentTeam],
    queryFn: () => (currentTeam ? getTeamCutPlayerIds(currentTeam) : Promise.resolve([])),
    enabled: Boolean(currentTeam),
  });

  const cutPlayerIds = useMemo(() => new Set(cutPlayerIdsArray), [cutPlayerIdsArray]);

  // Scelte draft possedute e non ancora utilizzate (Punto #33 - Totale Asset)
  const { data: availablePicksCount = 0 } = useQuery({
    queryKey: ["team_available_picks", currentTeam],
    queryFn: () => (currentTeam ? getTeamAvailablePicksCount(currentTeam) : Promise.resolve(0)),
    enabled: Boolean(currentTeam),
  });
  const [isTogglingCutId, setIsTogglingCutId] = useState<number | null>(null);
  const [isRosterLocked, setIsRosterLocked] = useState<boolean>(false);

  useEffect(() => {
    getRosterLockState().then((st) => setIsRosterLocked(st.isLocked));
    const unsubscribe = subscribeToRosterLock((st) => setIsRosterLocked(st.isLocked));
    return unsubscribe;
  }, []);

  const currentRosterCount = players.length;
  const minCutsNeeded = Math.max(
    0,
    currentRosterCount - CUTS_MAX_ROSTER,
    currentRosterCount + effectivePicksCount - CUTS_MAX_ASSETS
  );
  const maxCutsAllowed = Math.max(0, currentRosterCount - CUTS_MIN_ROSTER);
  const currentCutCount = cutPlayerIds.size;
  const postCutRoster = currentRosterCount - currentCutCount;
  const compensatoryPicksCount = postCutRoster <= CUTS_MAX_ROSTER && postCutRoster >= CUTS_MIN_ROSTER
    ? getCompensatoryPicksCount(postCutRoster)
    : 0;
  const effectivePicksCount = availablePicksCount + compensatoryPicksCount;
  const postCutAssets = postCutRoster + effectivePicksCount;
  const isAssetCompliant = postCutAssets <= CUTS_MAX_ASSETS;

  // Calcolo salvaguardia portieri (Punto #41)
  const totalGks = useMemo(() => players.filter((p) => p.Posiz === "POR").length, [players]);
  const cutGks = useMemo(
    () => players.filter((p) => p.Posiz === "POR" && cutPlayerIds.has(Number(p.ID))).length,
    [players, cutPlayerIds]
  );
  const remainingGks = totalGks - cutGks;
  const isGkCompliant = remainingGks >= 2;
  const isCutsCompliant =
    postCutRoster >= CUTS_MIN_ROSTER &&
    postCutRoster <= CUTS_MAX_ROSTER &&
    isAssetCompliant &&
    isGkCompliant;
  const canAddMoreCuts = currentCutCount < maxCutsAllowed;

  const handleTogglePlayerCut = async (player: Player) => {
    if (isRosterLocked) {
      toast.error("Le rose sono attualmente congelate dalla Lega: impossibile modificare la lista tagli!");
      return;
    }

    if (player.Squadra !== currentTeam && !isAdmin) {
      toast.error("Puoi modificare i tagli solo per i giocatori della tua squadra!");
      return;
    }

    const playerId = Number(player.ID);
    const isCurrentlyCut = cutPlayerIds.has(playerId);

    if (!isCurrentlyCut && !canAddMoreCuts) {
      toast.error(`Hai raggiunto il limite massimo di ${maxCutsAllowed} tagli per mantenere almeno 13 giocatori in rosa.`);
      return;
    }

    if (!isCurrentlyCut && player.Posiz === "POR" && remainingGks <= 2) {
      toast.error("Obbligatorio mantenere almeno 2 portieri in rosa. Impossibile tagliare questo portiere!");
      return;
    }

    setIsTogglingCutId(playerId);
    try {
      const res = await togglePlayerCut(playerId, player.Squadra || currentTeam, isCurrentlyCut);
      if (!res.success) throw new Error(res.error);

      if (res.isNowCut) {
        toast.success(`${player.Nome} ${player.Cognome} inserito nella lista tagli.`);
      } else {
        toast.info(`${player.Nome} ${player.Cognome} rimosso dalla lista tagli.`);
      }

      await refetchCuts();
      await queryClient.invalidateQueries({ queryKey: ["team_cuts"] });
      await queryClient.invalidateQueries({ queryKey: ["cuts_compliance_report"] });
    } catch (err: any) {
      toast.error(err.message || "Errore aggiornamento lista tagli");
    } finally {
      setIsTogglingCutId(null);
    }
  };

  const marketCounts = useMemo(() => {
    let intCount = 0;
    let fisCount = 0;
    let traCount = 0;
    let cedCount = 0;
    let noneCount = 0;

    for (const p of players) {
      const code = getMarketStatusCode(p.MarketStatus);
      if (code === "int") intCount++;
      else if (code === "fis") fisCount++;
      else if (code === "tra") traCount++;
      else if (code === "ced") cedCount++;
      else noneCount++;
    }

    return { intCount, fisCount, traCount, cedCount, noneCount };
  }, [players]);

  const marketFilteredPlayers = useMemo(() => {
    return filteredPlayers.filter((p) => {
      if (marketFilterTab === "cut") return cutPlayerIds.has(Number(p.ID));
      if (marketFilterTab === "ALL") return true;
      const code = getMarketStatusCode(p.MarketStatus);
      if (marketFilterTab === "none") return !code;
      return code === marketFilterTab;
    });
  }, [filteredPlayers, marketFilterTab, cutPlayerIds]);

  const handleUpdateMarketStatus = async (
    player: Player,
    newStatusCode: MarketStatusCode | "none"
  ) => {
    if (player.Squadra !== currentTeam && !isAdmin) {
      toast.error("Puoi modificare solo lo status dei giocatori della tua squadra!");
      return;
    }

    setSavingMarketPlayerId(player.ID);
    try {
      if (newStatusCode === "none") {
        const { error } = await supabase
          .from(PLAYER_MARKET_TABLE)
          .delete()
          .eq("PLAYER_ID_FK", player.ID);
        if (error) throw error;
        toast.success(`Status di mercato di ${player.Nome} ${player.Cognome} rimosso.`);
      } else {
        const { error } = await supabase
          .from(PLAYER_MARKET_TABLE)
          .upsert({
            PLAYER_ID_FK: player.ID,
            Status: newStatusCode,
          });
        if (error) throw error;
        const opt = MARKET_STATUS_OPTIONS.find((o) => o.code === newStatusCode);
        toast.success(
          `Status di ${player.Nome} ${player.Cognome} impostato su: ${opt?.label}`
        );
      }

      await queryClient.invalidateQueries({ queryKey: ["players", currentTeam] });
      await queryClient.invalidateQueries({ queryKey: ["players"] });
    } catch (err: unknown) {
      console.error("Errore salvataggio status mercato:", err);
      const msg = err instanceof Error ? err.message : "Errore durante il salvataggio";
      toast.error(msg);
    } finally {
      setSavingMarketPlayerId(null);
    }
  };

  // Open Kit Customizer Modal
  const handleOpenKitCustomizer = (player: Player) => {
    setEditingPlayer(player);
    setKitForm({
      NumeroMaglia: player.NumeroMaglia ?? null,
      JerseyStyle: Number(player.JerseyStyle) || 0,
      JerseyFit: Number(player.JerseyFit) || 0,
      SleeveLength: Number(player.SleeveLength) || 0,
      SeasonalJersey: Number(player.SeasonalJersey) || 0,
      SockLength: Number(player.SockLength) || 0,
      Shoe: Number(player.Shoe) || 0,
      GKGloves: Number(player.GKGloves) || 0,
      Accessory1: Number(player.Accessory1) || 0,
      Colour: Number(player.Colour) || 0,
      Accessory2: Number(player.Accessory2) || 0,
      Colour_1: Number(player.Colour_1) || 0,
      Accessory3: Number(player.Accessory3) || 0,
      Colour_2: Number(player.Colour_2) || 0,
      Accessory4: Number(player.Accessory4) || 0,
      Colour_3: Number(player.Colour_3) || 0,
    });
  };

  // Save Kit Customizer Form
  const handleSaveKitCustomizer = async () => {
    if (!editingPlayer || !currentTeam) return;

    if (kitForm.NumeroMaglia) {
      const num = Number(kitForm.NumeroMaglia);
      if (num < 1 || num > 99) {
        toast.error("Il numero di maglia deve essere compreso tra 1 e 99");
        return;
      }
      if (kitNumberConflict) {
        toast.error(
          `Il numero #${num} è già occupato da ${kitNumberConflict.Nome} ${kitNumberConflict.Cognome}!`
        );
        return;
      }
    }

    setSavingKit(true);
    try {
      const { error } = await supabase
        .from(PLAYER_TABLE)
        .update({
          NumeroMaglia: kitForm.NumeroMaglia,
          JerseyStyle: kitForm.JerseyStyle,
          JerseyFit: kitForm.JerseyFit,
          SleeveLength: kitForm.SleeveLength,
          SeasonalJersey: kitForm.SeasonalJersey,
          SockLength: kitForm.SockLength,
          Shoe: kitForm.Shoe,
          GKGloves: kitForm.GKGloves,
          Accessory1: kitForm.Accessory1,
          Colour: kitForm.Colour,
          Accessory2: kitForm.Accessory2,
          Colour_1: kitForm.Colour_1,
          Accessory3: kitForm.Accessory3,
          Colour_2: kitForm.Colour_2,
          Accessory4: kitForm.Accessory4,
          Colour_3: kitForm.Colour_3,
        })
        .eq("ID", editingPlayer.ID);

      if (error) throw error;

      toast.success(
        `Kit & Accessori di ${editingPlayer.Nome} ${editingPlayer.Cognome} salvati con successo!`
      );
      setEditingPlayer(null);
      await queryClient.invalidateQueries({ queryKey: ["players", currentTeam] });
    } catch (err: unknown) {
      console.error("Errore salvataggio kit:", err);
      const msg = err instanceof Error ? err.message : "Errore durante il salvataggio";
      toast.error(msg);
    } finally {
      setSavingKit(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <RequireAuthPrompt
          title="Roster di Squadra"
          description="Per consultare la rosa della tua squadra devi effettuare il login oppure scegliere una delle squadre di Serie A attualmente libere!"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <Navbar />

      <main className="container mx-auto px-4 py-6 space-y-6">
        <AdminTeamSelector />

        {/* HERO TELEMETRY COMMAND CARD */}
        <Card className={`overflow-hidden border border-border/80 shadow-lg ${getTeamBackground(currentTeam ?? "")}`}>
          <div className="p-6 bg-gradient-to-r from-card/80 via-card/60 to-card/90 backdrop-blur-md">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
              <div className="flex items-center gap-4">
                {currentTeam && (
                  <img
                    src={`/images/teams/${currentTeam}_Logo.png`}
                    alt={`${currentTeam} Logo`}
                    className="h-16 w-16 object-contain drop-shadow-md"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/images/LCSIM_Logo_SMALL.png";
                    }}
                  />
                )}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      Roster Completo
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                    {currentTeamFullName}
                  </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                    Gestione completa della rosa, consultazione schede e configurazione numerazione &amp; accessori da gara.
                  </p>
                </div>
              </div>

              {/* Telemetry KPI Widgets */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3 shrink-0">
                <div className="px-3.5 py-2 rounded-xl bg-card border border-border/80 text-center shadow-sm">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                    Giocatori
                  </span>
                  <span className="text-xl sm:text-2xl font-black font-mono text-foreground">
                    {players.length}
                  </span>
                </div>

                <div className="px-3.5 py-2 rounded-xl bg-card border border-border/80 text-center shadow-sm">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                    OVR Medio
                  </span>
                  <span className="text-xl sm:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                    {avgOvr}
                  </span>
                </div>

                <div className="px-3.5 py-2 rounded-xl bg-card border border-border/80 text-center shadow-sm">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                    Età Media
                  </span>
                  <span className="text-xl sm:text-2xl font-black font-mono text-foreground">
                    {avgAge} <span className="text-xs font-normal text-muted-foreground">a</span>
                  </span>
                </div>

                <div className="px-3.5 py-2 rounded-xl bg-card border border-border/80 text-center shadow-sm">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                    Numeri Maglia
                  </span>
                  <span className="text-xl sm:text-2xl font-black font-mono text-foreground">
                    {assignedNumbersCount}/{players.length}
                  </span>
                </div>

                <div className="px-3.5 py-2 rounded-xl bg-card border border-border/80 text-center shadow-sm col-span-2 sm:col-span-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                    Status Mercato
                  </span>
                  <span className="text-xl sm:text-2xl font-black font-mono text-foreground">
                    {players.length - marketCounts.noneCount}/{players.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* TABS: 1) ROSA GIOCATORI | 2) STATUS DI MERCATO | 3) NUMERI DI MAGLIA & ACCESSORI */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <TabsList className="bg-card border border-border/80 p-1 h-auto flex flex-wrap gap-1">
              <TabsTrigger
                value="roster"
                className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-lg gap-2"
              >
                <Users className="h-4 w-4" />
                Rosa Giocatori ({players.length})
              </TabsTrigger>
              <TabsTrigger
                value="market"
                className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-lg gap-2"
              >
                <Tag className="h-4 w-4" />
                Status di Mercato ({players.length - marketCounts.noneCount}/{players.length})
              </TabsTrigger>
              <TabsTrigger
                value="kit-accessories"
                className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-lg gap-2"
              >
                <Shirt className="h-4 w-4" />
                Numeri di Maglia &amp; Accessori
              </TabsTrigger>
            </TabsList>

            {/* Quick Layout & Filter controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
                <Input
                  placeholder="Cerca giocatore o #..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 w-[180px] sm:w-[210px] pl-8 text-xs"
                />
              </div>

              {activeTab === "roster" && (
                <div className="flex items-center rounded-lg border border-border bg-card p-0.5">
                  <Button
                    variant={viewLayout === "grid" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setViewLayout("grid")}
                    className="h-7 px-2 text-xs"
                    title="Vista Griglia Schede"
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant={viewLayout === "table" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setViewLayout("table")}
                    className="h-7 px-2 text-xs"
                    title="Vista Tabella Compatta"
                  >
                    <List className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* ROLE FILTER PILLS BAR */}
          <div className="flex flex-wrap gap-1.5 pb-1">
            {ROLE_GROUPS.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setRoleFilter(g.id)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${roleFilter === g.id
                  ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 shadow-sm"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
                  }`}
              >
                {g.label}
              </button>
            ))}
          </div>

          {/* TAB 1: ROSA GIOCATORI (GRID OR TABLE) */}
          <TabsContent value="roster" className="m-0 space-y-4">
            {loading ? (
              <Card className="p-12 text-center text-muted-foreground">
                Caricamento rosa in corso...
              </Card>
            ) : filteredPlayers.length === 0 ? (
              <Card className="p-12 text-center text-muted-foreground">
                Nessun giocatore trovato con questi filtri.
              </Card>
            ) : viewLayout === "grid" ? (
              /* GRID VIEW */
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                {filteredPlayers.map((player) => (
                  <Card
                    key={player.ID}
                    className="group border border-border/80 hover:border-emerald-500/50 hover:shadow-lg transition-all duration-200 overflow-hidden bg-card flex flex-col justify-between"
                  >
                    <div className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        {/* Avatar & Jersey Number Pill */}
                        <div className="relative shrink-0">
                          <Avatar className="h-14 w-14 border-2 border-border group-hover:border-emerald-500/40 transition-colors">
                            <AvatarImage
                              src={getPlayerImage(player.ID)}
                              alt={`${player.Nome} ${player.Cognome}`}
                            />
                            <AvatarFallback className="text-xs font-bold bg-muted">
                              {player.Nome?.[0]}
                              {player.Cognome?.[0]}
                            </AvatarFallback>
                          </Avatar>

                          {/* Jersey number badge */}
                          <div
                            className={`absolute -bottom-1 -right-1 h-6 min-w-[24px] px-1 rounded-md flex items-center justify-center font-mono font-black text-xs border shadow ${player.NumeroMaglia
                              ? "bg-emerald-600 text-white border-emerald-400"
                              : "bg-muted text-muted-foreground border-border text-[10px]"
                              }`}
                            title={
                              player.NumeroMaglia
                                ? `Numero di maglia: #${player.NumeroMaglia}`
                                : "Nessun numero assegnato"
                            }
                          >
                            {player.NumeroMaglia ? `#${player.NumeroMaglia}` : "—"}
                          </div>
                        </div>

                        {/* Player Name, Role & Flag */}
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
                            <span className="font-extrabold text-foreground text-sm sm:text-base truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                              {player.Nome} {player.Cognome}
                            </span>
                            <img
                              src={getNationalityFlag(player.Nazionalità)}
                              alt={player.Nazionalità}
                              className="h-3.5 w-5 object-cover rounded-sm shrink-0"
                            />
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-1">
                            <span>{player.Età} anni</span>
                            <span>•</span>
                            <span>{player.Altezza} cm</span>
                            <span>•</span>
                            <span>Piede {player.Piede}</span>
                          </div>

                          {/* Market Status Badge */}
                          {(() => {
                            const marketOpt = getMarketStatusOption(player.MarketStatus);
                            if (marketOpt) {
                              return (
                                <div className="mt-2 flex items-center gap-1.5">
                                  <span
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${marketOpt.badgeClass}`}
                                    title={`Status di mercato: ${marketOpt.label} — ${marketOpt.description}`}
                                  >
                                    <Tag className="h-2.5 w-2.5" />
                                    {marketOpt.label}
                                  </span>
                                </div>
                              );
                            }
                            return (
                              <div className="mt-2 flex items-center gap-1.5">
                                <span
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border border-dashed border-border/70 text-muted-foreground/60"
                                  title="Nessuno status di mercato impostato"
                                >
                                  <Tag className="h-2.5 w-2.5 opacity-40" />
                                  Non specificato
                                </span>
                              </div>
                            );
                          })()}
                        </div>

                        {/* OVR Badge */}
                        <div className="shrink-0 text-center">
                          <Badge
                            variant="outline"
                            className={`${getValueColor(
                              player.OVR ?? 0
                            )} text-xl font-black px-2.5 py-1 border shadow-sm font-mono`}
                          >
                            {player.OVR}
                          </Badge>
                          <span className="text-[9px] uppercase font-bold text-muted-foreground block mt-0.5">
                            OVR
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="px-4 py-2 bg-muted/20 border-t border-border/60 flex items-center justify-between gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedPlayer(player)}
                        className="h-7 text-xs font-semibold hover:text-emerald-600"
                      >
                        Scheda Completa
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenKitCustomizer(player)}
                        className="h-7 text-xs font-bold gap-1 border-border"
                      >
                        <Shirt className="h-3 w-3 text-emerald-500" />
                        Numero &amp; Kit
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              /* ROW-BY-ROW TABLE VIEW WITH ALL PLAYER ATTRIBUTES */
              <Card className="border border-border/80 shadow-md overflow-hidden bg-card">
                {/* Table sub-filter bar for attributes */}
                <div className="p-3 bg-muted/20 border-b border-border/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 text-xs">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mr-1">
                      Filtro Attributi:
                    </span>
                    {TABLE_STAT_CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setTableStatCategory(cat.id)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${tableStatCategory === cat.id
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "bg-card border border-border text-muted-foreground hover:text-foreground"
                          }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                  <div className="text-[11px] text-muted-foreground italic hidden md:block">
                    Ordina per colonna cliccando sull'intestazione • Clicca sulla riga per la scheda completa
                  </div>
                </div>

                <CardContent className="p-0 overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                    <thead>
                      <tr className="border-b border-border bg-muted/50 text-[11px] font-bold uppercase text-muted-foreground tracking-wider select-none">
                        {/* Jersey Number */}
                        <th
                          className="py-3 px-2 text-center w-12 cursor-pointer hover:bg-muted/80 transition-colors"
                          onClick={() => handleTableSort("NumeroMaglia")}
                          title="Ordina per Numero di Maglia"
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>#</span>
                            {tableSortColumn === "NumeroMaglia" && (
                              tableSortDirection === "asc" ? (
                                <ArrowUp className="h-3 w-3 text-emerald-500" />
                              ) : (
                                <ArrowDown className="h-3 w-3 text-emerald-500" />
                              )
                            )}
                          </div>
                        </th>

                        {/* Player Name */}
                        <th
                          className="py-3 px-3 min-w-[200px] cursor-pointer hover:bg-muted/80 transition-colors"
                          onClick={() => handleTableSort("Nome")}
                          title="Ordina per Nome"
                        >
                          <div className="flex items-center gap-1.5">
                            <span>Giocatore</span>
                            {tableSortColumn === "Nome" ? (
                              tableSortDirection === "asc" ? (
                                <ArrowUp className="h-3 w-3 text-emerald-500" />
                              ) : (
                                <ArrowDown className="h-3 w-3 text-emerald-500" />
                              )
                            ) : (
                              <ArrowUpDown className="h-3 w-3 opacity-30" />
                            )}
                          </div>
                        </th>

                        {/* Role */}
                        <th
                          className="py-3 px-2 text-center w-16 cursor-pointer hover:bg-muted/80 transition-colors"
                          onClick={() => handleTableSort("ROLE")}
                          title="Ordina per Ruolo (POR -> ATT)"
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>Ruolo</span>
                            {tableSortColumn === "ROLE" && (
                              tableSortDirection === "asc" ? (
                                <ArrowUp className="h-3 w-3 text-emerald-500" />
                              ) : (
                                <ArrowDown className="h-3 w-3 text-emerald-500" />
                              )
                            )}
                          </div>
                        </th>

                        {/* OVR */}
                        <th
                          className="py-3 px-2 text-center w-14 cursor-pointer hover:bg-muted/80 transition-colors"
                          onClick={() => handleTableSort("OVR")}
                          title="Ordina per Overall (OVR)"
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-foreground font-black">OVR</span>
                            {tableSortColumn === "OVR" ? (
                              tableSortDirection === "asc" ? (
                                <ArrowUp className="h-3 w-3 text-emerald-500" />
                              ) : (
                                <ArrowDown className="h-3 w-3 text-emerald-500" />
                              )
                            ) : (
                              <ArrowUpDown className="h-3 w-3 opacity-30" />
                            )}
                          </div>
                        </th>

                        {/* Age */}
                        <th
                          className="py-3 px-2 text-center w-12 cursor-pointer hover:bg-muted/80 transition-colors"
                          onClick={() => handleTableSort("Età")}
                          title="Ordina per Età"
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>Età</span>
                            {tableSortColumn === "Età" && (
                              tableSortDirection === "asc" ? (
                                <ArrowUp className="h-3 w-3 text-emerald-500" />
                              ) : (
                                <ArrowDown className="h-3 w-3 text-emerald-500" />
                              )
                            )}
                          </div>
                        </th>

                        {/* Height */}
                        <th
                          className="py-3 px-2 text-center w-14 cursor-pointer hover:bg-muted/80 transition-colors"
                          onClick={() => handleTableSort("Altezza")}
                          title="Ordina per Altezza"
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>Alt</span>
                            {tableSortColumn === "Altezza" && (
                              tableSortDirection === "asc" ? (
                                <ArrowUp className="h-3 w-3 text-emerald-500" />
                              ) : (
                                <ArrowDown className="h-3 w-3 text-emerald-500" />
                              )
                            )}
                          </div>
                        </th>

                        {/* Foot */}
                        <th className="py-3 px-2 text-center w-12 text-muted-foreground">
                          Piede
                        </th>

                        {/* DYNAMIC ATTRIBUTE COLUMNS */}
                        {displayedStatColumns.map((col) => {
                          const isSorted = tableSortColumn === col.key;
                          return (
                            <th
                              key={col.key}
                              onClick={() => handleTableSort(col.key)}
                              className="py-3 px-2 text-center w-12 cursor-pointer hover:bg-muted/80 transition-colors border-l border-border/40 font-mono text-[11px]"
                              title={`${col.label} (${col.key}) - Clicca per ordinare`}
                            >
                              <div className="flex items-center justify-center gap-0.5">
                                <span className={isSorted ? "text-emerald-500 font-black" : "text-foreground font-bold"}>
                                  {col.shortLabel}
                                </span>
                                {isSorted ? (
                                  tableSortDirection === "asc" ? (
                                    <ArrowUp className="h-2.5 w-2.5 text-emerald-500" />
                                  ) : (
                                    <ArrowDown className="h-2.5 w-2.5 text-emerald-500" />
                                  )
                                ) : null}
                              </div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {sortedTablePlayers.map((player) => (
                        <tr
                          key={player.ID}
                          className="hover:bg-muted/40 transition-colors group cursor-pointer"
                          onClick={() => setSelectedPlayer(player)}
                          title={`Clicca per aprire la scheda di ${player.Nome} ${player.Cognome}`}
                        >
                          {/* Kit number */}
                          <td className="py-2.5 px-2 text-center font-mono font-black text-xs text-foreground">
                            {player.NumeroMaglia ? (
                              <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold">
                                #{player.NumeroMaglia}
                              </span>
                            ) : (
                              <span className="text-muted-foreground/40">—</span>
                            )}
                          </td>

                          {/* Player Identity */}
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8 border border-border shrink-0">
                                <AvatarImage
                                  src={getPlayerImage(player.ID)}
                                  alt={`${player.Nome} ${player.Cognome}`}
                                />
                                <AvatarFallback className="text-[10px]">
                                  {player.Nome?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <div className="font-bold text-foreground group-hover:text-emerald-600 transition-colors flex items-center gap-1.5">
                                  <span className="truncate">
                                    {player.Nome} {player.Cognome}
                                  </span>
                                  <img
                                    src={getNationalityFlag(player.Nazionalità)}
                                    alt={player.Nazionalità}
                                    className="h-3 w-4 object-cover rounded-sm shrink-0"
                                  />
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Role */}
                          <td className="py-2.5 px-2 text-center">
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-bold px-1.5 py-0 ${getRoleColor(
                                player.Posiz
                              )}`}
                            >
                              {player.Posiz}
                            </Badge>
                          </td>

                          {/* OVR */}
                          <td className="py-2.5 px-2 text-center font-mono font-black text-sm">
                            <span className={getValueColor(player.OVR ?? 0)}>
                              {player.OVR}
                            </span>
                          </td>

                          {/* Age */}
                          <td className="py-2.5 px-2 text-center font-mono text-muted-foreground">
                            {player.Età}
                          </td>

                          {/* Height */}
                          <td className="py-2.5 px-2 text-center font-mono text-muted-foreground">
                            {player.Altezza ? `${player.Altezza} cm` : "—"}
                          </td>

                          {/* Foot */}
                          <td className="py-2.5 px-2 text-center font-bold text-xs">
                            {player.Piede || "—"}
                          </td>

                          {/* ALL ATTRIBUTE VALUES FOR THIS ROW */}
                          {displayedStatColumns.map((col) => {
                            const val = player[col.key];
                            return (
                              <td
                                key={col.key}
                                className="py-2.5 px-2 text-center font-mono text-xs border-l border-border/30"
                              >
                                <span className={getStatColorClass(val)}>
                                  {val ?? "—"}
                                </span>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* TAB 2: STATUS DI MERCATO */}
          <TabsContent value="market" className="m-0 space-y-4">
            {/* Header info & counters */}
            <Card className="border border-border/80 bg-card shadow-sm">
              <CardContent className="p-4 sm:p-5 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-emerald-500" />
                      <h3 className="text-sm font-extrabold uppercase tracking-wider">
                        Gestione Status di Mercato dei Giocatori
                      </h3>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Imposta la disponibilità sul mercato per ciascun calciatore della tua rosa. Lo status sarà visibile a tutti gli altri manager nella Lista Giocatori.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <Badge
                      variant="outline"
                      className={`font-mono text-xs font-bold px-2.5 py-1 transition-colors ${isAssetCompliant &&
                        postCutRoster >= CUTS_MIN_ROSTER &&
                        postCutRoster <= CUTS_MAX_ROSTER
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/40"
                        : "bg-destructive/10 text-destructive border-destructive/40"
                        }`}
                      title={`Totale Asset dopo i tagli = giocatori in rosa + scelte draft attese (${availablePicksCount} regolari${compensatoryPicksCount > 0 ? ` + ${compensatoryPicksCount} compensatorie per rosa a ${postCutRoster}` : ""}). Limite massimo: ${CUTS_MAX_ASSETS} asset, con una rosa tra ${CUTS_MIN_ROSTER} e ${CUTS_MAX_ROSTER} giocatori. Tagli minimi richiesti: ${minCutsNeeded}, massimi consentiti: ${maxCutsAllowed}.`}
                    >
                      Asset: {postCutAssets}/{CUTS_MAX_ASSETS} ({postCutRoster} giocatori + {effectivePicksCount} pick)
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`font-mono text-xs font-bold px-2.5 py-1 transition-colors ${isCutsCompliant
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/40"
                        : "bg-destructive/10 text-destructive border-destructive/40"
                        }`}
                      title={`Rosa attuale: ${currentRosterCount} (${totalGks} POR). Dopo i tagli: ${postCutRoster} (${remainingGks} POR - min. 2 obbligatori). Rosa finale ammessa: 13-16.`}
                    >
                      <Scissors className="h-3.5 w-3.5 mr-1.5 inline-block" />
                      Giocatori Tagliati: {currentCutCount} ({remainingGks} POR rimasti)
                    </Badge>
                    <Badge variant="outline" className="font-mono text-xs">
                      Status Assegnati: {players.length - marketCounts.noneCount} / {players.length}
                    </Badge>
                  </div>
                </div>

                {isRosterLocked && (
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2.5">
                    <Lock className="h-4 w-4 shrink-0" />
                    <span>
                      <strong>Rose Congelate dalla Lega:</strong> Le rose sono attualmente bloccate dall'amministrazione. La selezione o la modifica dei giocatori da tagliare è temporaneamente disabilitata.
                    </span>
                  </div>
                )}

                {!isGkCompliant && (
                  <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-semibold flex items-center gap-2.5">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>
                      <strong>Salvaguardia Portieri:</strong> È obbligatorio mantenere almeno 2 portieri in rosa dopo i tagli. Attualmente ne rimarrebbero {remainingGks}.
                    </span>
                  </div>
                )}

                {/* Status Legend & Quick Filter Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-2 border-t border-border/60">
                  <button
                    type="button"
                    onClick={() => setMarketFilterTab("ALL")}
                    className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${marketFilterTab === "ALL"
                      ? "bg-muted border-primary shadow-sm"
                      : "bg-card border-border hover:bg-muted/40"
                      }`}
                  >
                    <div className="text-[10px] uppercase font-bold text-muted-foreground">Tutti</div>
                    <div className="text-lg font-black font-mono text-foreground">{players.length}</div>
                    <div className="text-[10px] text-muted-foreground truncate">Tutti i giocatori</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMarketFilterTab("cut")}
                    className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${marketFilterTab === "cut"
                      ? "bg-rose-500/20 border-rose-500 shadow-sm"
                      : "bg-rose-500/5 border-rose-500/20 hover:bg-rose-500/10"
                      }`}
                  >
                    <div className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400 flex items-center justify-between">
                      <span>In Taglio</span>
                      <Scissors className="h-3 w-3" />
                    </div>
                    <div className="text-lg font-black font-mono text-rose-600 dark:text-rose-400">{currentCutCount}</div>
                    <div className="text-[10px] text-muted-foreground truncate">Lista svincolo</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMarketFilterTab("int")}
                    className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${marketFilterTab === "int"
                      ? "bg-purple-500/20 border-purple-500 shadow-sm"
                      : "bg-purple-500/5 border-purple-500/20 hover:bg-purple-500/10"
                      }`}
                  >
                    <div className="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400">Intoccabili</div>
                    <div className="text-lg font-black font-mono text-purple-600 dark:text-purple-400">{marketCounts.intCount}</div>
                    <div className="text-[10px] text-muted-foreground truncate">Incedibili</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMarketFilterTab("fis")}
                    className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${marketFilterTab === "fis"
                      ? "bg-blue-500/20 border-blue-500 shadow-sm"
                      : "bg-blue-500/5 border-blue-500/20 hover:bg-blue-500/10"
                      }`}
                  >
                    <div className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400">Elementi Fissi</div>
                    <div className="text-lg font-black font-mono text-blue-600 dark:text-blue-400">{marketCounts.fisCount}</div>
                    <div className="text-[10px] text-muted-foreground truncate">Solo offerte eccezionali</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMarketFilterTab("tra")}
                    className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${marketFilterTab === "tra"
                      ? "bg-amber-500/20 border-amber-500 shadow-sm"
                      : "bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/10"
                      }`}
                  >
                    <div className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400">In Trattativa</div>
                    <div className="text-lg font-black font-mono text-amber-600 dark:text-amber-400">{marketCounts.traCount}</div>
                    <div className="text-[10px] text-muted-foreground truncate">Aperto ad offerte</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMarketFilterTab("ced")}
                    className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${marketFilterTab === "ced"
                      ? "bg-emerald-500/20 border-emerald-500 shadow-sm"
                      : "bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10"
                      }`}
                  >
                    <div className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Cedibili</div>
                    <div className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">{marketCounts.cedCount}</div>
                    <div className="text-[10px] text-muted-foreground truncate">Lista cessioni</div>
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Players Market Board */}
            {marketFilteredPlayers.length === 0 ? (
              <Card className="p-10 text-center text-muted-foreground">
                Nessun giocatore corrisponde ai filtri selezionati.
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {marketFilteredPlayers.map((player) => {
                  const currentCode = getMarketStatusCode(player.MarketStatus);
                  const currentOption = getMarketStatusOption(player.MarketStatus);
                  const isSaving = savingMarketPlayerId === player.ID;
                  const canEdit = player.Squadra === currentTeam || isAdmin;
                  const isCut = cutPlayerIds.has(Number(player.ID));
                  const isTogglingCut = isTogglingCutId === Number(player.ID);

                  return (
                    <Card
                      key={player.ID}
                      className={`border bg-card shadow-sm transition-all overflow-hidden p-4 flex flex-col justify-between gap-3.5 ${isCut
                        ? "border-rose-500/60 bg-rose-500/[0.04] ring-1 ring-rose-500/30 shadow-rose-500/5"
                        : "border-border/80 hover:border-emerald-500/40"
                        }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Avatar with kit number */}
                          <div className="relative shrink-0">
                            <Avatar className="h-12 w-12 border border-border">
                              <AvatarImage
                                src={getPlayerImage(player.ID)}
                                alt={`${player.Nome} ${player.Cognome}`}
                              />
                              <AvatarFallback className="text-xs">
                                {player.Nome?.[0]}
                                {player.Cognome?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            {player.NumeroMaglia && (
                              <div className="absolute -bottom-1 -right-1 h-5 min-w-[20px] px-1 rounded bg-emerald-600 text-white font-mono font-black text-[10px] flex items-center justify-center border border-emerald-400 shadow-xs">
                                #{player.NumeroMaglia}
                              </div>
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Badge
                                variant="outline"
                                className={`text-[10px] font-bold px-1.5 py-0 ${getRoleColor(
                                  player.Posiz
                                )}`}
                              >
                                {player.Posiz}
                              </Badge>
                              {isCut && (
                                <Badge
                                  variant="outline"
                                  className="bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/40 text-[10px] font-black uppercase tracking-wider px-1.5 py-0"
                                >
                                  In Taglio
                                </Badge>
                              )}
                              <span className="font-bold text-foreground text-sm truncate">
                                {player.Nome} {player.Cognome}
                              </span>
                              <img
                                src={getNationalityFlag(player.Nazionalità)}
                                alt={player.Nazionalità}
                                className="h-3 w-4 object-cover rounded-xs shrink-0"
                              />
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                              <span>{player.Età} anni</span>
                              <span>•</span>
                              <span>Piede {player.Piede}</span>
                            </div>
                          </div>
                        </div>

                        {/* OVR */}
                        <div className="text-center shrink-0">
                          <span className={`text-base font-black font-mono px-2 py-0.5 rounded border ${getValueColor(player.OVR ?? 0)}`}>
                            {player.OVR}
                          </span>
                        </div>
                      </div>

                      {/* Status Selector Section */}
                      <div className="pt-2 border-t border-border/60 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground font-medium text-[11px]">
                            Stato attuale:
                          </span>
                          {currentOption ? (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border ${currentOption.badgeClass}`}>
                              <Tag className="h-3 w-3" />
                              {currentOption.label}
                            </span>
                          ) : (
                            <span className="text-[11px] text-muted-foreground italic">
                              Non impostato
                            </span>
                          )}
                        </div>

                        {/* Status Buttons Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                          {MARKET_STATUS_OPTIONS.map((opt) => {
                            const isSelected = currentCode === opt.code;
                            return (
                              <button
                                key={opt.code}
                                type="button"
                                disabled={isSaving || !canEdit}
                                onClick={() =>
                                  handleUpdateMarketStatus(
                                    player,
                                    isSelected ? "none" : opt.code
                                  )
                                }
                                title={opt.description}
                                className={`px-2 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1 text-center ${isSelected
                                  ? `${opt.badgeClass} ring-2 ring-primary/40 font-black shadow-xs`
                                  : "bg-muted/40 hover:bg-muted text-muted-foreground border-border/80 hover:text-foreground"
                                  } ${!canEdit ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                              >
                                {isSelected && <Check className="h-3 w-3 shrink-0" />}
                                <span className="truncate">{opt.label}</span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Clear Status Button (if set) */}
                        {currentCode && canEdit && (
                          <div className="flex justify-end pt-1">
                            <button
                              type="button"
                              disabled={isSaving}
                              onClick={() => handleUpdateMarketStatus(player, "none")}
                              className="text-[11px] text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <X className="h-3 w-3" />
                              Rimuovi status di mercato
                            </button>
                          </div>
                        )}

                        {/* Cut Toggle Action */}
                        <div className="pt-2 border-t border-border/50 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Scissors className={`h-3.5 w-3.5 shrink-0 ${isCut ? "text-rose-500" : "text-muted-foreground"}`} />
                            <span className="text-[11px] font-medium text-muted-foreground truncate">
                              {isCut ? "Selezionato per il taglio" : "Lista Tagli Rosa"}
                            </span>
                          </div>

                          {(() => {
                            const isGkCutBlocked = !isCut && player.Posiz === "POR" && remainingGks <= 2;
                            return (
                              <Button
                                type="button"
                                size="sm"
                                variant={isCut ? "destructive" : "outline"}
                                disabled={isTogglingCut || (!isCut && (!canAddMoreCuts || isGkCutBlocked)) || !canEdit || isRosterLocked}
                                onClick={() => handleTogglePlayerCut(player)}
                                className={`h-7 px-2.5 text-xs font-bold gap-1.5 transition-all ${isCut
                                  ? "bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
                                  : "hover:bg-rose-500/10 hover:text-rose-600 hover:border-rose-500/40"
                                  }`}
                                title={
                                  isGkCutBlocked
                                    ? "Obbligatorio mantenere almeno 2 portieri in rosa"
                                    : !isCut && !canAddMoreCuts
                                      ? `Limite massimo di ${maxCutsAllowed} tagli raggiunto (per garantire almeno 13 giocatori in rosa)`
                                      : isCut
                                        ? "Rimuovi dalla lista tagli"
                                        : "Inserisci nella lista tagli"
                                }
                              >
                                {isTogglingCut ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : isCut ? (
                                  <>
                                    <X className="h-3 w-3" />
                                    <span>Annulla Taglio</span>
                                  </>
                                ) : (
                                  <>
                                    <Scissors className="h-3 w-3" />
                                    <span>Taglia</span>
                                  </>
                                )}
                              </Button>
                            );
                          })()}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* TAB 3: NUMERI DI MAGLIA & ACCESSORI MANAGEMENT BOARD */}
          <TabsContent value="kit-accessories" className="m-0 space-y-4">
            <Card className="border border-border/80 bg-card shadow-sm">
              <CardContent className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Shirt className="h-4 w-4 text-emerald-500" />
                    <h3 className="text-sm font-extrabold uppercase tracking-wider">
                      Gestione Numeri di Maglia &amp; Accessori Giocatori
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Assegna il numero di maglia univoco (1–99) e personalizza gli accessori EA Sports FC di ogni giocatore della tua rosa.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs">
                    Numeri Assegnati: {assignedNumbersCount} / {players.length}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* List of Players Sorted by Kit Number */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredPlayers.map((player) => {
                const hasAcc1 = player.Accessory1 && Number(player.Accessory1) > 0;
                const hasAcc2 = player.Accessory2 && Number(player.Accessory2) > 0;
                const isGK = player.Posiz === "POR";

                return (
                  <Card
                    key={player.ID}
                    className="border border-border/80 hover:border-emerald-500/40 bg-card shadow-sm transition-all overflow-hidden p-4 flex flex-col justify-between gap-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Big Kit Number Badge */}
                        <div
                          className={`h-12 w-12 rounded-xl flex flex-col items-center justify-center font-mono font-black border shadow-sm shrink-0 ${player.NumeroMaglia
                            ? "bg-emerald-600 text-white border-emerald-400 text-lg"
                            : "bg-muted text-muted-foreground border-border text-xs"
                            }`}
                        >
                          {player.NumeroMaglia ? `#${player.NumeroMaglia}` : "—"}
                        </div>

                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-bold px-1.5 py-0 ${getRoleColor(
                                player.Posiz
                              )}`}
                            >
                              {player.Posiz}
                            </Badge>
                            <h4 className="font-extrabold text-sm sm:text-base text-foreground truncate">
                              {player.Nome} {player.Cognome}
                            </h4>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>OVR {player.OVR}</span>
                            <span>•</span>
                            <span>Piede {player.Piede}</span>
                            <span>•</span>
                            <span>{player.Età} anni</span>
                          </div>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => handleOpenKitCustomizer(player)}
                        className="h-8 text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
                      >
                        <Shirt className="h-3.5 w-3.5" />
                        Personalizza
                      </Button>
                    </div>

                    {/* Active Kit Configuration Badges */}
                    <div className="pt-2 border-t border-border/50 flex flex-wrap gap-1.5 text-[11px]">
                      <Badge variant="secondary" className="font-mono text-[10px]">
                        Divisa: {getJerseyStyleLabel(player.JerseyStyle).split("(")[0]?.trim()}
                      </Badge>
                      <Badge variant="secondary" className="font-mono text-[10px]">
                        Fit: {getJerseyFitLabel(player.JerseyFit).split("/")[0]?.trim()}
                      </Badge>
                      <Badge variant="secondary" className="font-mono text-[10px]">
                        Maniche: {getSleeveLengthLabel(player.SleeveLength)}
                      </Badge>
                      <Badge variant="secondary" className="font-mono text-[10px]">
                        Calzettoni: {getSockLengthLabel(player.SockLength).split("(")[0]?.trim()}
                      </Badge>
                      {isGK && player.GKGloves && Number(player.GKGloves) > 0 && (
                        <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/30">
                          Guanti: {getGKGlovesLabel(player.GKGloves)}
                        </Badge>
                      )}
                      {player.Shoe && Number(player.Shoe) > 0 && (
                        <Badge variant="outline" className="text-[10px]">
                          Scarpini: {getShoeLabel(player.Shoe)}
                        </Badge>
                      )}
                      {hasAcc1 && (
                        <Badge variant="outline" className="text-[10px] bg-sky-500/10 text-sky-600 border-sky-500/30">
                          {getAccessoryLabel(player.Accessory1)} ({getAccessoryColorLabel(player.Colour).label})
                        </Badge>
                      )}
                      {hasAcc2 && (
                        <Badge variant="outline" className="text-[10px] bg-sky-500/10 text-sky-600 border-sky-500/30">
                          {getAccessoryLabel(player.Accessory2)} ({getAccessoryColorLabel(player.Colour_1).label})
                        </Badge>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* MODAL: PLAYER DETAILS INSPECTOR */}
      {selectedPlayer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4"
          onClick={() => setSelectedPlayer(null)}
        >
          <PlayerDetails
            currentPlayer={selectedPlayer}
            onClose={() => setSelectedPlayer(null)}
          />
        </div>
      )}

      {/* MODAL: KIT & ACCESSORIES CUSTOMIZER */}
      <Dialog
        open={!!editingPlayer}
        onOpenChange={(open) => !open && setEditingPlayer(null)}
      >
        <DialogContent className="max-w-4xl xl:max-w-5xl max-h-[92vh] overflow-y-auto">
          {editingPlayer && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Badge
                      variant="outline"
                      className={`text-xs font-bold ${getRoleColor(
                        editingPlayer.Posiz
                      )}`}
                    >
                      {editingPlayer.Posiz}
                    </Badge>
                    <DialogTitle className="text-lg font-extrabold">
                      Personalizza Kit • {editingPlayer.Nome} {editingPlayer.Cognome}
                    </DialogTitle>
                  </div>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {currentTeam}
                  </Badge>
                </div>
                <DialogDescription className="text-xs">
                  Modifica il numero di maglia e tutti gli accessori da campo ufficiali EA Sports FC.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 py-2">
                {/* 1. NUMERO DI MAGLIA (1–99) WITH REAL-TIME CONFLICT CHECK */}
                <div className="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                      <Shirt className="h-4 w-4 text-emerald-500" />
                      Numero di Maglia (1–99)
                    </label>
                    <span className="text-[11px] text-muted-foreground">
                      Univoco per tutta la squadra
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-24">
                      <Input
                        type="number"
                        min={1}
                        max={99}
                        value={kitForm.NumeroMaglia ?? ""}
                        onChange={(e) => {
                          const val = e.target.value === "" ? null : Number(e.target.value);
                          setKitForm((prev) => ({ ...prev, NumeroMaglia: val }));
                        }}
                        placeholder="N°"
                        className={`text-center font-mono font-black text-lg h-10 ${kitNumberConflict ? "border-destructive text-destructive" : ""
                          }`}
                      />
                    </div>

                    <div className="flex-1 text-xs">
                      {kitNumberConflict ? (
                        <div className="p-2 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 shrink-0" />
                          <span>
                            Il numero <strong>#{kitForm.NumeroMaglia}</strong> è già occupato da{" "}
                            <strong>
                              {kitNumberConflict.Nome} {kitNumberConflict.Cognome}
                            </strong>!
                          </span>
                        </div>
                      ) : kitForm.NumeroMaglia ? (
                        <div className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4 shrink-0" />
                          Numero #{kitForm.NumeroMaglia} disponibile e pronto all&apos;assegnazione.
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic">
                          Nessun numero assegnato. Inserisci un valore da 1 a 99.
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Free numbers quick suggestion pills */}
                  <div className="flex flex-wrap items-center gap-1 pt-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase mr-1">
                      Liberi:
                    </span>
                    {freeNumbers.map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() =>
                          setKitForm((prev) => ({ ...prev, NumeroMaglia: n }))
                        }
                        className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold transition-colors ${kitForm.NumeroMaglia === n
                          ? "bg-emerald-600 text-white"
                          : "bg-background border border-border/70 hover:bg-muted"
                          }`}
                      >
                        #{n}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. STILE DIVISA, VESTIBILITÀ E MANICHE */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">
                      Stile Divisa (Maglia dentro/fuori)
                    </label>
                    <Select
                      value={String(kitForm.JerseyStyle)}
                      onValueChange={(val) =>
                        setKitForm((prev) => ({ ...prev, JerseyStyle: Number(val) }))
                      }
                    >
                      <SelectTrigger className="text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {JERSEY_STYLE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.code} value={String(opt.code)}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">
                      Vestibilità (Jersey Fit)
                    </label>
                    <Select
                      value={String(kitForm.JerseyFit)}
                      onValueChange={(val) =>
                        setKitForm((prev) => ({ ...prev, JerseyFit: Number(val) }))
                      }
                    >
                      <SelectTrigger className="text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {JERSEY_FIT_OPTIONS.map((opt) => (
                          <SelectItem key={opt.code} value={String(opt.code)}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">
                      Lunghezza Maniche
                    </label>
                    <Select
                      value={String(kitForm.SleeveLength)}
                      onValueChange={(val) =>
                        setKitForm((prev) => ({ ...prev, SleeveLength: Number(val) }))
                      }
                    >
                      <SelectTrigger className="text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SLEEVE_LENGTH_OPTIONS.map((opt) => (
                          <SelectItem key={opt.code} value={String(opt.code)}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">
                      Divisa Stagionale / Invernale
                    </label>
                    <Select
                      value={String(kitForm.SeasonalJersey)}
                      onValueChange={(val) =>
                        setKitForm((prev) => ({
                          ...prev,
                          SeasonalJersey: Number(val),
                        }))
                      }
                    >
                      <SelectTrigger className="text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SEASONAL_JERSEY_OPTIONS.map((opt) => (
                          <SelectItem key={opt.code} value={String(opt.code)}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* 3. CALZETTONI, SCARPINI & GUANTI PORTIERE */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">
                      Altezza Calzettoni
                    </label>
                    <Select
                      value={String(kitForm.SockLength)}
                      onValueChange={(val) =>
                        setKitForm((prev) => ({ ...prev, SockLength: Number(val) }))
                      }
                    >
                      <SelectTrigger className="text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SOCK_LENGTH_OPTIONS.map((opt) => (
                          <SelectItem key={opt.code} value={String(opt.code)}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">
                      Modello Scarpini
                    </label>
                    <Select
                      value={String(kitForm.Shoe)}
                      onValueChange={(val) =>
                        setKitForm((prev) => ({ ...prev, Shoe: Number(val) }))
                      }
                    >
                      <SelectTrigger className="text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {POPULAR_SHOE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.code} value={String(opt.code)}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {editingPlayer.Posiz === "POR" ? (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground">
                        Guanti Portiere
                      </label>
                      <Select
                        value={String(kitForm.GKGloves)}
                        onValueChange={(val) =>
                          setKitForm((prev) => ({ ...prev, GKGloves: Number(val) }))
                        }
                      >
                        <SelectTrigger className="text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {GK_GLOVES_OPTIONS.map((opt) => (
                            <SelectItem key={opt.code} value={String(opt.code)}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className="space-y-1.5 opacity-60">
                      <label className="text-xs font-bold text-muted-foreground">
                        Guanti Portiere
                      </label>
                      <div className="h-9 px-3 rounded-md border border-border bg-muted/30 flex items-center text-xs text-muted-foreground">
                        Solo per Portieri (POR)
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. ACCESSORI & COLORI (SLOT 1, 2, 3, 4) */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                      Accessori Polsi, Braccia &amp; Protezioni (Slot 1–4)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Slot 1 */}
                    <div className="p-3 rounded-xl border border-border/80 bg-muted/10 space-y-2">
                      <span className="text-[11px] font-bold text-foreground block">
                        Slot Accessorio 1
                      </span>
                      <Select
                        value={String(kitForm.Accessory1)}
                        onValueChange={(val) =>
                          setKitForm((prev) => ({
                            ...prev,
                            Accessory1: Number(val),
                          }))
                        }
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ACCESSORY_OPTIONS.map((opt) => (
                            <SelectItem key={opt.code} value={String(opt.code)}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        value={String(kitForm.Colour)}
                        onValueChange={(val) =>
                          setKitForm((prev) => ({ ...prev, Colour: Number(val) }))
                        }
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ACCESSORY_COLOR_OPTIONS.map((c) => (
                            <SelectItem key={c.code} value={String(c.code)}>
                              <div className="flex items-center gap-2">
                                <span
                                  className="h-2.5 w-2.5 rounded-full border border-black/20"
                                  style={{ backgroundColor: c.hex }}
                                />
                                <span>{c.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Slot 2 */}
                    <div className="p-3 rounded-xl border border-border/80 bg-muted/10 space-y-2">
                      <span className="text-[11px] font-bold text-foreground block">
                        Slot Accessorio 2
                      </span>
                      <Select
                        value={String(kitForm.Accessory2)}
                        onValueChange={(val) =>
                          setKitForm((prev) => ({
                            ...prev,
                            Accessory2: Number(val),
                          }))
                        }
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ACCESSORY_OPTIONS.map((opt) => (
                            <SelectItem key={opt.code} value={String(opt.code)}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        value={String(kitForm.Colour_1)}
                        onValueChange={(val) =>
                          setKitForm((prev) => ({
                            ...prev,
                            Colour_1: Number(val),
                          }))
                        }
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ACCESSORY_COLOR_OPTIONS.map((c) => (
                            <SelectItem key={c.code} value={String(c.code)}>
                              <div className="flex items-center gap-2">
                                <span
                                  className="h-2.5 w-2.5 rounded-full border border-black/20"
                                  style={{ backgroundColor: c.hex }}
                                />
                                <span>{c.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Slot 3 */}
                    <div className="p-3 rounded-xl border border-border/80 bg-muted/10 space-y-2">
                      <span className="text-[11px] font-bold text-foreground block">
                        Slot Accessorio 3
                      </span>
                      <Select
                        value={String(kitForm.Accessory3)}
                        onValueChange={(val) =>
                          setKitForm((prev) => ({
                            ...prev,
                            Accessory3: Number(val),
                          }))
                        }
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ACCESSORY_OPTIONS.map((opt) => (
                            <SelectItem key={opt.code} value={String(opt.code)}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        value={String(kitForm.Colour_2)}
                        onValueChange={(val) =>
                          setKitForm((prev) => ({
                            ...prev,
                            Colour_2: Number(val),
                          }))
                        }
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ACCESSORY_COLOR_OPTIONS.map((c) => (
                            <SelectItem key={c.code} value={String(c.code)}>
                              <div className="flex items-center gap-2">
                                <span
                                  className="h-2.5 w-2.5 rounded-full border border-black/20"
                                  style={{ backgroundColor: c.hex }}
                                />
                                <span>{c.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Slot 4 */}
                    <div className="p-3 rounded-xl border border-border/80 bg-muted/10 space-y-2">
                      <span className="text-[11px] font-bold text-foreground block">
                        Slot Accessorio 4
                      </span>
                      <Select
                        value={String(kitForm.Accessory4)}
                        onValueChange={(val) =>
                          setKitForm((prev) => ({
                            ...prev,
                            Accessory4: Number(val),
                          }))
                        }
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ACCESSORY_OPTIONS.map((opt) => (
                            <SelectItem key={opt.code} value={String(opt.code)}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        value={String(kitForm.Colour_3)}
                        onValueChange={(val) =>
                          setKitForm((prev) => ({
                            ...prev,
                            Colour_3: Number(val),
                          }))
                        }
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ACCESSORY_COLOR_OPTIONS.map((c) => (
                            <SelectItem key={c.code} value={String(c.code)}>
                              <div className="flex items-center gap-2">
                                <span
                                  className="h-2.5 w-2.5 rounded-full border border-black/20"
                                  style={{ backgroundColor: c.hex }}
                                />
                                <span>{c.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="flex items-center justify-between gap-2 border-t border-border pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingPlayer(null)}
                >
                  Annulla
                </Button>
                <Button
                  size="sm"
                  disabled={savingKit || !!kitNumberConflict}
                  onClick={handleSaveKitCustomizer}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5"
                >
                  <Save className="h-4 w-4" />
                  Salva Modifiche Giocatore
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Roster;

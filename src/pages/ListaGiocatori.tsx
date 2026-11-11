import Navbar from "@/components/Navbar";
import { isRetiringSoon } from "@/utils/functions";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Users,
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Sparkles,
  Shield,
  Eye,
  Trophy,
  Activity,
  Layers,
  X,
  UserX,
  Star,
  GraduationCap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  getRoleColor,
  getPosGroup,
  getValueColor,
  getPlayerImage,
  getNationalityFlag,
  LCSIM_LOGO_SMALL,
} from "@/utils/functions";
import { getPlayers } from "@/hooks/use-players";
import { getTeams } from "@/hooks/use-teams";
import { Player } from "@/types/player";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/supabaseClient";
import { toast } from "sonner";
import PlayerDetails from "@/components/player/playerDetails";
import { SUPABASE_STORAGE_URL } from "@/constants/App";
import { isEligibleForMarketStatus } from "@/types/marketStatus";

// Helper per estrarre il codice dello stato mercato
export const extractMarketStatusCode = (market: any, squadra?: string | null): string | null => {
  if (squadra !== undefined && !isEligibleForMarketStatus(squadra)) return null;
  if (!market) return null;
  if (typeof market === "string") return market;
  if (Array.isArray(market) && market.length > 0) return market[0]?.Status || null;
  if (typeof market === "object") return market?.Status || null;
  return null;
};

export const getMarketBadgeStyle = (code: string | null) => {
  switch (code) {
    case "int":
      return "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30";
    case "ced":
      return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
    case "tra":
      return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30";
    case "fis":
      return "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30";
    default:
      return "bg-muted text-muted-foreground border-border/60";
  }
};

export const getMarketLabel = (code: string | null) => {
  switch (code) {
    case "int":
      return "Intoccabile";
    case "ced":
      return "In Cessione";
    case "tra":
      return "Possibili Trattative";
    case "fis":
      return "Elemento Fisso";
    default:
      return "Disponibile";
  }
};

type SortField = "OVR" | "Età" | "Nome" | "Posiz" | "XP";
type SortDir = "asc" | "desc";
type ScopeTab = "LCSIM" | "ALL" | "SVINCOLATI" | "RITIRATI" | "SERIE_B" | "ROOKIES";
type ViewMode = "table" | "grid";

const ROLE_GROUPS = [
  { id: "all", label: "Tutti i Ruoli" },
  { id: "POR", label: "Portieri" },
  { id: "DIF", label: "Difensori" },
  { id: "CEN", label: "Centrocampisti" },
  { id: "ATT", label: "Attaccanti" },
];

const ListaGiocatori = () => {
  const { effectiveTeam } = useAuth();
  const { players, loading: playersLoading } = getPlayers();
  const { teams } = getTeams();

  // Rookie Draft Class (Punto 84: tab dedicato protetto con Blind Database)
  const [rookies, setRookies] = useState<Player[]>([]);
  const [rookiesLoading, setRookiesLoading] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchRookies() {
      try {
        setRookiesLoading(true);
        const { data, error } = await supabase.rpc("rpc_get_scouted_rookies", {
          p_team_id: effectiveTeam || null,
          p_admin_passphrase: null,
        });
        if (error) throw error;
        if (isMounted && data) {
          const mapped = (data as any[]).map((r) => ({
            ...r,
            isRookie: true,
            Squadra: "Rookie Draft",
          }));
          setRookies(mapped as Player[]);
        }
      } catch (err) {
        console.error("Errore nel caricamento della classe rookie:", err);
      } finally {
        if (isMounted) setRookiesLoading(false);
      }
    }
    fetchRookies();
    return () => {
      isMounted = false;
    };
  }, [effectiveTeam]);

  const loading = playersLoading || (scopeTab === "ROOKIES" && rookiesLoading);

  // Scope / Ambito Giocatori (Scelta utente: default Serie A)
  const [scopeTab, setScopeTab] = useState<ScopeTab>("LCSIM");

  // Vista (Scelta utente: Doppia vista Tabella / Griglia)
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  // Filtri integrati sempre visibili
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [teamFilter, setTeamFilter] = useState<string>("all");
  const [marketFilter, setMarketFilter] = useState<string>("all");

  // Ordinamento
  const [sortField, setSortField] = useState<SortField>("OVR");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Paginazione (Scelta utente: 25 di default con scelta 15, 25, 50)
  const [pageSize, setPageSize] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Modale Dettagli Giocatore
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  // Mappa delle squadre per lookup rapido
  const teamsMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of teams) {
      map.set(t.TEAM_ID, t.NAME);
    }
    return map;
  }, [teams]);

  // Squadre attive di Serie A
  const serieATeamIds = useMemo(() => {
    return new Set(
      teams.filter((t) => (t as any).ACTIVE !== false).map((t) => t.TEAM_ID)
    );
  }, [teams]);

  // Conteggi per i tab di ambito
  const countsByScope = useMemo(() => {
    let lcsimCount = 0;
    let svincolatiCount = 0;
    let ritiratiCount = 0;
    let serieBCount = 0;

    for (const p of players) {
      const sq = p.Squadra;
      if (!sq) {
        svincolatiCount++;
      } else if (sq === "RITIRATO") {
        ritiratiCount++;
      } else if (sq.includes("B -")) {
        serieBCount++;
      } else {
        lcsimCount++;
      }
    }

    return {
      total: players.length,
      lcsim: lcsimCount,
      svincolati: svincolatiCount,
      ritirati: ritiratiCount,
      serieB: serieBCount,
      rookies: rookies.length,
    };
  }, [players, rookies]);

  // Reset pagina al variare dei filtri
  useEffect(() => {
    setCurrentPage(1);
  }, [scopeTab, searchQuery, roleFilter, teamFilter, marketFilter, sortField, sortDir, pageSize]);

  // Reset completo dei filtri
  const handleResetFilters = () => {
    setSearchQuery("");
    setRoleFilter("all");
    setTeamFilter("all");
    setMarketFilter("all");
    setSortField("OVR");
    setSortDir("desc");
  };

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    roleFilter !== "all" ||
    teamFilter !== "all" ||
    marketFilter !== "all" ||
    sortField !== "OVR" ||
    sortDir !== "desc";

  // Calcolo e filtraggio giocatori
  const filteredAndSorted = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const sourceList = scopeTab === "ROOKIES" ? rookies : players;

    const filtered = sourceList.filter((player) => {
      const sq = player.Squadra;
      const isSvincolato = !sq;
      const isRitirato = sq === "RITIRATO";
      const isSerieB = !!sq && sq.includes("B -");
      const isLcsim = !isSvincolato && !isRitirato && !isSerieB;

      // 1. Filtro Scope Tab
      if (scopeTab === "LCSIM" && !isLcsim) return false;
      if (scopeTab === "SVINCOLATI" && !isSvincolato) return false;
      if (scopeTab === "RITIRATI" && !isRitirato) return false;
      if (scopeTab === "SERIE_B" && !isSerieB) return false;
      if (scopeTab === "ROOKIES" && !(player as any).isRookie) return false;

      // 2. Filtro Ricerca Testuale
      if (q) {
        const fullName = `${player.Nome || ""} ${player.Cognome || ""}`.toLowerCase();
        const role = (player.Posiz || "").toLowerCase();
        const nationality = (player.Nazionalità || "").toLowerCase();
        const teamCode = (sq || "").toLowerCase();
        const teamName = (teamsMap.get(sq || "") || "").toLowerCase();
        const num = player.NumeroMaglia ? String(player.NumeroMaglia) : "";
        const matches =
          fullName.includes(q) ||
          role.includes(q) ||
          nationality.includes(q) ||
          teamCode.includes(q) ||
          teamName.includes(q) ||
          num.includes(q);
        if (!matches) return false;
      }

      // 3. Filtro Ruolo
      if (roleFilter !== "all") {
        if (getPosGroup(player.Posiz) !== roleFilter) return false;
      }

      // 4. Filtro Squadra (non applicabile alla classe Rookie)
      if (scopeTab !== "ROOKIES" && teamFilter !== "all") {
        if (player.Squadra !== teamFilter) return false;
      }

      // 5. Filtro Stato Mercato (non applicabile alla classe Rookie)
      if (scopeTab !== "ROOKIES" && marketFilter !== "all") {
        if (!isEligibleForMarketStatus(player.Squadra)) return false;
        const code = extractMarketStatusCode(player.MarketStatus, player.Squadra);
        if (code !== marketFilter) return false;
      }

      return true;
    });

    // Ordinamento
    return [...filtered].sort((a, b) => {
      let valA: any = 0;
      let valB: any = 0;

      switch (sortField) {
        case "OVR": {
          const getEffectiveOvr = (p: Player) => {
            if (p.OVR !== null && p.OVR !== undefined) return Number(p.OVR);
            // Se rookie non scoutato al 100%, usa le stelle percentili * 15
            const stars = Number((p as any).Stelle) || 3;
            const tokens = Number((p as any).tokens_spent) || 0;
            return stars * 15 + tokens;
          };
          valA = getEffectiveOvr(a);
          valB = getEffectiveOvr(b);
          break;
        }
        case "Età":
          valA = a.Età ?? 0;
          valB = b.Età ?? 0;
          break;
        case "XP":
          valA = a.XP ?? ((a as any).tokens_spent ?? 0);
          valB = b.XP ?? ((b as any).tokens_spent ?? 0);
          break;
        case "Nome":
          valA = `${a.Cognome || ""} ${a.Nome || ""}`.toLowerCase();
          valB = `${b.Cognome || ""} ${b.Nome || ""}`.toLowerCase();
          break;
        case "Posiz":
          valA = a.Posiz || "";
          valB = b.Posiz || "";
          break;
      }

      if (valA < valB) return sortDir === "asc" ? -1 : 1;
      if (valA > valB) return sortDir === "asc" ? 1 : -1;
      return (b.OVR ?? 0) - (a.OVR ?? 0);
    });
  }, [players, rookies, scopeTab, searchQuery, roleFilter, teamFilter, marketFilter, sortField, sortDir, teamsMap]);

  // Calcolo paginazione
  const totalItems = filteredAndSorted.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const currentPlayers = filteredAndSorted.slice(startIndex, startIndex + pageSize);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  // Calcolo media OVR Serie A per il badge telemetrico
  const avgSerieAOvr = useMemo(() => {
    const serieAPlayers = players.filter(
      (p) => p.Squadra && p.Squadra !== "RITIRATO" && !p.Squadra.includes("B -")
    );
    if (serieAPlayers.length === 0) return 0;
    const sum = serieAPlayers.reduce((acc, p) => acc + (p.OVR ?? 0), 0);
    return (sum / serieAPlayers.length).toFixed(1);
  }, [players]);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <Navbar />

      <main className="container mx-auto px-4 py-6 space-y-6 max-w-7xl">
        {/* ========================================================================= */}
        {/* 1. HERO COMMAND HEADER (BROADCAST / TELEMETRIA)                            */}
        {/* ========================================================================= */}
        <Card className="overflow-hidden border border-border/80 shadow-lg bg-card">
          <div className="p-6 bg-gradient-to-r from-emerald-500/[0.08] via-card to-blue-500/[0.08] backdrop-blur-md">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 border-2 border-border/80 flex items-center justify-center shadow-md shrink-0">
                  <Users className="h-8 w-8 text-emerald-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs font-mono font-bold"
                    >
                      Database Ufficiale LCSIM
                    </Badge>
                    <span className="text-xs text-muted-foreground font-mono">
                      Stagione 2026/2027
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight flex items-center gap-2 mt-0.5">
                    Lista Calciatori
                  </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                    Consulta, filtra ed esplora tutti i calciatori della LCSIM e dell'archivio di lega.
                  </p>
                </div>
              </div>

              {/* Telemetria Cards */}
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="px-3 py-2 rounded-xl bg-card border border-border/80 text-center shadow-sm min-w-[95px]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                    LCSIM
                  </span>
                  <span className="text-lg sm:text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                    {countsByScope.lcsim}
                  </span>
                  <span className="text-[9px] text-muted-foreground block">atleti attivi</span>
                </div>

                <div className="px-3 py-2 rounded-xl bg-card border border-border/80 text-center shadow-sm min-w-[95px]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                    Media OVR
                  </span>
                  <span className="text-lg sm:text-xl font-black font-mono text-foreground">
                    {avgSerieAOvr}
                  </span>
                  <span className="text-[9px] text-muted-foreground block">LCSIM</span>
                </div>

                <div className="px-3 py-2 rounded-xl bg-card border border-border/80 text-center shadow-sm min-w-[95px]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                    Svincolati
                  </span>
                  <span className="text-lg sm:text-xl font-black font-mono text-amber-500">
                    {countsByScope.svincolati}
                  </span>
                  <span className="text-[9px] text-muted-foreground block">liberi / arch.</span>
                </div>

                <div className="px-3 py-2 rounded-xl bg-card border border-border/80 text-center shadow-sm min-w-[95px]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                    Totali DB
                  </span>
                  <span className="text-lg sm:text-xl font-black font-mono text-blue-500">
                    {countsByScope.total}
                  </span>
                  <span className="text-[9px] text-muted-foreground block">nel database</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* ========================================================================= */}
        {/* 2. TAB RAPIDI DI AMBITO (SERIE A | TUTTI | SVINCOLATI | SERIE B)          */}
        {/* ========================================================================= */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border/70 pb-3">
          <button
            type="button"
            onClick={() => setScopeTab("LCSIM")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shadow-sm ${
              scopeTab === "LCSIM"
                ? "bg-emerald-600 text-white shadow-emerald-500/20"
                : "bg-card border border-border/70 text-muted-foreground hover:text-foreground hover:bg-muted/30"
            }`}
          >
            <img src={LCSIM_LOGO_SMALL} alt="LCSIM" className="h-4 w-4 object-contain shrink-0" />
            <span>LCSIM</span>
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 font-mono ${
                scopeTab === "LCSIM"
                  ? "bg-white/20 text-white border-white/30"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {countsByScope.lcsim}
            </Badge>
          </button>

          <button
            type="button"
            onClick={() => setScopeTab("ALL")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shadow-sm ${
              scopeTab === "ALL"
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border/70 text-muted-foreground hover:text-foreground hover:bg-muted/30"
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Tutti i Giocatori</span>
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 font-mono ${
                scopeTab === "ALL"
                  ? "bg-white/20 text-white border-white/30"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {countsByScope.total}
            </Badge>
          </button>

          <button
            type="button"
            onClick={() => setScopeTab("SVINCOLATI")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shadow-sm ${
              scopeTab === "SVINCOLATI"
                ? "bg-amber-600 text-white shadow-amber-500/20"
                : "bg-card border border-border/70 text-muted-foreground hover:text-foreground hover:bg-muted/30"
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>Svincolati</span>
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 font-mono ${
                scopeTab === "SVINCOLATI"
                  ? "bg-white/20 text-white border-white/30"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {countsByScope.svincolati}
            </Badge>
          </button>

          <button
            type="button"
            onClick={() => setScopeTab("RITIRATI")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shadow-sm ${
              scopeTab === "RITIRATI"
                ? "bg-rose-600 text-white shadow-rose-500/20"
                : "bg-card border border-border/70 text-muted-foreground hover:text-foreground hover:bg-muted/30"
            }`}
          >
            <UserX className="h-4 w-4" />
            <span>Ritirati</span>
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 font-mono ${
                scopeTab === "RITIRATI"
                  ? "bg-white/20 text-white border-white/30"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {countsByScope.ritirati}
            </Badge>
          </button>

          <button
            type="button"
            onClick={() => setScopeTab("SERIE_B")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shadow-sm ${
              scopeTab === "SERIE_B"
                ? "bg-blue-600 text-white shadow-blue-500/20"
                : "bg-card border border-border/70 text-muted-foreground hover:text-foreground hover:bg-muted/30"
            }`}
          >
            <Shield className="h-4 w-4" />
            <span>LCSIM 2</span>
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 font-mono ${
                scopeTab === "SERIE_B"
                  ? "bg-white/20 text-white border-white/30"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {countsByScope.serieB}
            </Badge>
          </button>

          <button
            type="button"
            onClick={() => {
              setScopeTab("ROOKIES");
              setTeamFilter("all");
              setMarketFilter("all");
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shadow-sm ${
              scopeTab === "ROOKIES"
                ? "bg-amber-500 text-slate-950 shadow-amber-500/20 font-black"
                : "bg-card border border-border/70 text-muted-foreground hover:text-foreground hover:bg-muted/30"
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>Rookie</span>
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 font-mono ${
                scopeTab === "ROOKIES"
                  ? "bg-black/20 text-slate-950 border-black/30 font-black"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {countsByScope.rookies}
            </Badge>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* 3. BARRA FILTRI INTEGRATA SEMPRE VISIBILE (RICERCA, RUOLI, SQUADRE, VISTE) */}
        {/* ========================================================================= */}
        <Card className="border border-border/80 bg-card/95 shadow-sm p-4 space-y-3.5">
          {/* Riga 1: Ricerca Testuale + Selettore Vista + Reset */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input con icona e clear button */}
            <div className="relative flex-1">
              <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Cerca per nome, cognome, squadra, ruolo o numero maglia..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9 h-10 text-xs sm:text-sm bg-muted/20 border-border/70 rounded-xl"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Toggle Switch Vista: Tabella vs Griglia Card */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center p-1 bg-muted/40 rounded-xl border border-border/70">
                <Button
                  size="sm"
                  variant={viewMode === "table" ? "default" : "ghost"}
                  onClick={() => setViewMode("table")}
                  className={`h-8 px-3 rounded-lg text-xs font-bold gap-1.5 ${
                    viewMode === "table" ? "shadow-sm" : "text-muted-foreground"
                  }`}
                  title="Visualizzazione a Tabella Densa"
                >
                  <List className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Tabella</span>
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  onClick={() => setViewMode("grid")}
                  className={`h-8 px-3 rounded-lg text-xs font-bold gap-1.5 ${
                    viewMode === "grid" ? "shadow-sm" : "text-muted-foreground"
                  }`}
                  title="Visualizzazione a Griglia Card (FUT Style)"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Griglia</span>
                </Button>
              </div>

              {/* Bottone Reset Filtri */}
              {hasActiveFilters && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleResetFilters}
                  className="h-10 text-xs font-semibold text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/10 rounded-xl gap-1.5"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Azzera</span>
                </Button>
              )}
            </div>
          </div>

          {/* Riga 2: Pillole Ruoli + Tendine Squadra, Mercato e Ordinamento */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center pt-1 border-t border-border/50">
            {/* Pillole Reparto Ruolo (POR, DIF, CEN, ATT) */}
            <div className="md:col-span-5 flex flex-wrap gap-1.5 items-center">
              {ROLE_GROUPS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRoleFilter(r.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    roleFilter === r.id
                      ? "bg-foreground text-background font-extrabold shadow-sm"
                      : "bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {/* Tendina Squadra */}
            <div className="md:col-span-3">
              <Select
                value={teamFilter}
                onValueChange={setTeamFilter}
                disabled={scopeTab === "ROOKIES"}
              >
                <SelectTrigger className="h-9 text-xs bg-muted/20 border-border/70 rounded-xl disabled:opacity-50">
                  <SelectValue
                    placeholder={
                      scopeTab === "ROOKIES"
                        ? "Classe Draft (Nessuna Squadra)"
                        : "Tutte le Squadre"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value="all">Tutte le Squadre ({teams.length})</SelectItem>
                  {teams.map((t) => (
                    <SelectItem key={t.TEAM_ID} value={t.TEAM_ID}>
                      {t.NAME} ({t.TEAM_ID})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tendina Stato Mercato */}
            <div className="md:col-span-2">
              <Select
                value={marketFilter}
                onValueChange={setMarketFilter}
                disabled={scopeTab === "ROOKIES"}
              >
                <SelectTrigger className="h-9 text-xs bg-muted/20 border-border/70 rounded-xl disabled:opacity-50">
                  <SelectValue
                    placeholder={
                      scopeTab === "ROOKIES" ? "Non a Mercato" : "Tutti gli Stati"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti gli stati</SelectItem>
                  <SelectItem value="ced">In Cessione</SelectItem>
                  <SelectItem value="tra">Possibili Trattative</SelectItem>
                  <SelectItem value="fis">Elemento Fisso</SelectItem>
                  <SelectItem value="int">Intoccabile</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tendina Ordinamento con Toggle Asc/Desc */}
            <div className="md:col-span-2 flex items-center gap-1.5">
              <Select value={sortField} onValueChange={(v) => setSortField(v as SortField)}>
                <SelectTrigger className="h-9 text-xs bg-muted/20 border-border/70 rounded-xl flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OVR">Ordina: OVR</SelectItem>
                  <SelectItem value="Età">Ordina: Età</SelectItem>
                  <SelectItem value="Nome">Ordina: Nome</SelectItem>
                  <SelectItem value="Posiz">Ordina: Ruolo</SelectItem>
                  <SelectItem value="XP">Ordina: XP</SelectItem>
                </SelectContent>
              </Select>

              <Button
                size="icon"
                variant="outline"
                onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
                className="h-9 w-9 shrink-0 rounded-xl border-border/70 hover:bg-muted"
                title={sortDir === "asc" ? "Ordinamento Crescente" : "Ordinamento Decrescente"}
              >
                {sortDir === "asc" ? (
                  <ArrowUp className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <ArrowDown className="h-3.5 w-3.5 text-emerald-500" />
                )}
              </Button>
            </div>
          </div>
        </Card>

        {/* ========================================================================= */}
        {/* 4. SEZIONE RISULTATI (HEADER CONTEGGIO + TABELLA O GRIGLIA)               */}
        {/* ========================================================================= */}
        <div className="space-y-4">
          {/* Header Risultati e Page Size Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-foreground text-sm">
                {totalItems} {totalItems === 1 ? "calciatore trovato" : "calciatori trovati"}
              </span>
              <span>•</span>
              <span>
                Pagina <strong className="text-foreground">{currentPage}</strong> di{" "}
                <strong className="text-foreground">{totalPages}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span>Visualizza per pagina:</span>
              <Select
                value={String(pageSize)}
                onValueChange={(val) => setPageSize(Number(val))}
              >
                <SelectTrigger className="h-8 w-20 text-xs bg-card border-border/70 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
            <Card className="p-16 text-center text-muted-foreground border-dashed">
              <Activity className="h-8 w-8 text-emerald-500 animate-pulse mx-auto mb-2" />
              Caricamento del database calciatori in corso...
            </Card>
          ) : currentPlayers.length === 0 ? (
            <Card className="p-16 text-center text-muted-foreground border-dashed space-y-3">
              <Users className="h-10 w-10 text-muted-foreground/50 mx-auto" />
              <div className="text-base font-bold text-foreground">
                Nessun calciatore trovato
              </div>
              <p className="text-xs max-w-sm mx-auto">
                Nessun atleta corrisponde ai filtri impostati. Prova a modificare i termini di ricerca o azzera i filtri.
              </p>
              {hasActiveFilters && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleResetFilters}
                  className="rounded-xl mt-2"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                  Azzera Filtri
                </Button>
              )}
            </Card>
          ) : viewMode === "table" ? (
            /* =================================================================== */
            /* VIEW 1: TABELLA DENSA MODERNA (TRANSFERMARKT STYLE)                 */
            /* =================================================================== */
            <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-md">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border/80 bg-muted/40 font-bold text-muted-foreground uppercase tracking-wider text-[11px]">
                      <th
                        className="py-3 px-4 cursor-pointer hover:text-foreground transition-colors"
                        onClick={() => toggleSort("OVR")}
                      >
                        <div className="flex items-center gap-1">
                          <span>OVR</span>
                          {sortField === "OVR" && (
                            sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                          )}
                        </div>
                      </th>
                      <th
                        className="py-3 px-4 cursor-pointer hover:text-foreground transition-colors"
                        onClick={() => toggleSort("Nome")}
                      >
                        <div className="flex items-center gap-1">
                          <span>Calciatore</span>
                          {sortField === "Nome" && (
                            sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                          )}
                        </div>
                      </th>
                      <th
                        className="py-3 px-4 cursor-pointer hover:text-foreground transition-colors"
                        onClick={() => toggleSort("Posiz")}
                      >
                        <div className="flex items-center gap-1">
                          <span>Ruolo</span>
                          {sortField === "Posiz" && (
                            sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                          )}
                        </div>
                      </th>
                      <th className="py-3 px-4">Squadra</th>
                      <th
                        className="py-3 px-4 text-center cursor-pointer hover:text-foreground transition-colors"
                        onClick={() => toggleSort("Età")}
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span>Età</span>
                          {sortField === "Età" && (
                            sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                          )}
                        </div>
                      </th>
                      <th className="py-3 px-4 text-center hidden md:table-cell">Biometria</th>
                      <th
                        className="py-3 px-4 text-center cursor-pointer hover:text-foreground transition-colors hidden sm:table-cell"
                        onClick={() => toggleSort("XP")}
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span>XP</span>
                          {sortField === "XP" && (
                            sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                          )}
                        </div>
                      </th>
                      <th className="py-3 px-4 text-center">Mercato</th>
                      <th className="py-3 px-4 text-right">Dettagli</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {currentPlayers.map((player) => {
                      const isRookie = (player as any).isRookie || player.Squadra === "Rookie Draft";
                      const rookieStars = Number((player as any).Stelle) || 3;
                      const rookieTokens = Number((player as any).tokens_spent) || 0;
                      const marketCode = extractMarketStatusCode(player.MarketStatus, player.Squadra);
                      const teamName = teamsMap.get(player.Squadra || "") || player.Squadra;
                      const isSvincolato = !player.Squadra || player.Squadra === "RITIRATO";
                      const isSerieB = player.Squadra && player.Squadra.includes("B -");

                      return (
                        <tr
                          key={player.ID}
                          onClick={() => setSelectedPlayer(player)}
                          className="hover:bg-muted/40 cursor-pointer transition-colors group"
                        >
                          {/* Colonna OVR */}
                          <td className="py-2.5 px-4 font-mono">
                            {player.OVR !== null && player.OVR !== undefined ? (
                              <div
                                className={`h-9 w-9 rounded-xl flex items-center justify-center font-black text-sm border shadow-xs ${getValueColor(
                                  player.OVR
                                )}`}
                                title={isRookie ? "Valore OVR sbloccato (Scouting 5G)" : undefined}
                              >
                                {player.OVR}
                              </div>
                            ) : isRookie ? (
                              <div
                                className="h-9 min-w-9 px-2 rounded-xl flex items-center justify-center gap-1 font-black text-xs border border-amber-500/40 bg-amber-500/10 text-amber-500 shadow-xs"
                                title={`Stima di lega: ${rookieStars}★ (${rookieTokens}G spesi)`}
                              >
                                <Star className="h-3.5 w-3.5 fill-amber-500" />
                                <span>{rookieStars}★</span>
                              </div>
                            ) : (
                              <div
                                className={`h-9 w-9 rounded-xl flex items-center justify-center font-black text-sm border shadow-xs ${getValueColor(
                                  0
                                )}`}
                              >
                                -
                              </div>
                            )}
                          </td>

                          {/* Colonna Giocatore (Avatar + Nome + Bandiera + Numero) */}
                          <td className="py-2.5 px-4 min-w-[180px]">
                            <div className="flex items-center gap-3">
                              <div className="relative shrink-0">
                                <img
                                  src={getPlayerImage(player.ID)}
                                  alt={`${player.Nome} ${player.Cognome}`}
                                  className="h-10 w-10 object-cover object-top rounded-xl border border-border/80 bg-muted/30 shadow-xs"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = `${SUPABASE_STORAGE_URL}/images/players/MConti.png`;
                                  }}
                                />
                              </div>

                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-extrabold text-foreground group-hover:text-primary transition-colors text-xs sm:text-sm truncate">
                                    {player.Nome} {player.Cognome}
                                  </span>
                                  {player.Nazionalità && (
                                    <img
                                      src={getNationalityFlag(player.Nazionalità)}
                                      alt={player.Nazionalità}
                                      className="h-3 w-4 object-cover rounded-xs shrink-0"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = "none";
                                      }}
                                    />
                                  )}
                                </div>
                                <div className="text-[10px] text-muted-foreground font-mono">
                                  {player.NumeroMaglia ? `#${player.NumeroMaglia} • ` : ""}
                                  ID: {player.ID}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Colonna Ruolo */}
                          <td className="py-2.5 px-4">
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-bold px-2 py-0.5 border ${getRoleColor(
                                player.Posiz
                              )}`}
                            >
                              {player.Posiz}
                            </Badge>
                          </td>

                          {/* Colonna Squadra */}
                          <td className="py-2.5 px-4 min-w-[140px]">
                            {isRookie ? (
                              <Badge
                                variant="outline"
                                className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] font-bold gap-1"
                              >
                                <Sparkles className="h-3 w-3" />
                                Rookie Draft
                              </Badge>
                            ) : isSvincolato ? (
                              <Badge
                                variant="outline"
                                className="bg-muted/50 text-muted-foreground border-border text-[10px]"
                              >
                                {player.Squadra === "RITIRATO" ? "Ritirato" : "Svincolato"}
                              </Badge>
                            ) : (
                              <div className="flex items-center gap-2">
                                <img
                                  src={`${SUPABASE_STORAGE_URL}/images/teams/${player.Squadra}_Logo.png`}
                                  alt={player.Squadra || ""}
                                  className="h-5 w-5 object-contain shrink-0"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = `${SUPABASE_STORAGE_URL}/images/LCSIM_Logo_SMALL.png`;
                                  }}
                                />
                                <span className="font-medium text-foreground truncate max-w-[130px]" title={teamName || player.Squadra}>
                                  {teamName || player.Squadra}
                                </span>
                              </div>
                            )}
                          </td>

                          {/* Colonna Età */}
                          <td className="py-2.5 px-4 text-center font-mono font-medium text-muted-foreground">
                            {player.Età ? `${player.Età} anni` : "—"}
                          </td>

                          {/* Colonna Biometria (Piede + Altezza) */}
                          <td className="py-2.5 px-4 text-center font-mono text-muted-foreground hidden md:table-cell">
                            {player.Piede || "Dx"} • {player.Altezza ? `${player.Altezza} cm` : "—"}
                          </td>

                          {/* Colonna XP / Scouting */}
                          <td className="py-2.5 px-4 text-center font-mono font-bold hidden sm:table-cell">
                            {isRookie ? (
                              rookieTokens > 0 ? (
                                <Badge variant="outline" className="text-[10px] font-mono border-amber-500/30 text-amber-500 bg-amber-500/10">
                                  Scout {rookieTokens}G
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground/50 text-xs font-normal">0G</span>
                              )
                            ) : (
                              <span className="text-emerald-600 dark:text-emerald-400">
                                {player.XP ?? 0} XP
                              </span>
                            )}
                          </td>

                          {/* Colonna Stato Mercato */}
                          <td className="py-2.5 px-4 text-center">
                            {isRookie ? (
                              <Badge variant="outline" className="text-[10px] text-muted-foreground border-border/60">
                                Draft Pool
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className={`text-[10px] font-semibold px-2 py-0.5 border ${getMarketBadgeStyle(
                                  marketCode
                                )}`}
                              >
                                {getMarketLabel(marketCode)}
                              </Badge>
                            )}
                          </td>

                          {/* Colonna Azioni */}
                          <td className="py-2.5 px-4 text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground rounded-lg"
                              title="Visualizza Scheda Completa"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* =================================================================== */
            /* VIEW 2: GRIGLIA DI CARD CALCIATORE (FUT / FIGURINE STYLE)          */
            /* =================================================================== */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {currentPlayers.map((player) => {
                const isRookie = (player as any).isRookie || player.Squadra === "Rookie Draft";
                const rookieStars = Number((player as any).Stelle) || 3;
                const rookieTokens = Number((player as any).tokens_spent) || 0;
                const marketCode = extractMarketStatusCode(player.MarketStatus, player.Squadra);
                const teamName = teamsMap.get(player.Squadra || "") || player.Squadra;
                const isSvincolato = !player.Squadra || player.Squadra === "RITIRATO";

                return (
                  <Card
                    key={player.ID}
                    onClick={() => setSelectedPlayer(player)}
                    className="overflow-hidden border border-border/80 bg-gradient-to-b from-card via-card/95 to-card/90 shadow-md hover:shadow-xl hover:border-primary/50 transition-all duration-200 cursor-pointer group flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Bar: OVR + Ruolo + Logo Club */}
                      <div className="p-3.5 border-b border-border/60 bg-muted/20 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {player.OVR !== null && player.OVR !== undefined ? (
                            <div
                              className={`h-9 w-9 rounded-xl flex items-center justify-center font-black text-sm border shadow-xs ${getValueColor(
                                player.OVR ?? 0
                              )}`}
                              title={isRookie ? "Valore OVR sbloccato (Scouting 5G)" : undefined}
                            >
                              {player.OVR}
                            </div>
                          ) : isRookie ? (
                            <div
                              className="h-9 px-2.5 rounded-xl flex items-center justify-center gap-1 font-black text-xs border border-amber-500/40 bg-amber-500/10 text-amber-500 shadow-xs"
                              title={`Stima di lega: ${rookieStars}★ (${rookieTokens}G)`}
                            >
                              <Star className="h-3.5 w-3.5 fill-amber-500" />
                              <span>{rookieStars}★</span>
                            </div>
                          ) : (
                            <div
                              className={`h-9 w-9 rounded-xl flex items-center justify-center font-black text-sm border shadow-xs ${getValueColor(
                                0
                              )}`}
                            >
                              -
                            </div>
                          )}
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-bold px-2 py-0.5 border ${getRoleColor(
                              player.Posiz
                            )}`}
                          >
                            {player.Posiz}
                          </Badge>
                        </div>

                        {/* Logo Club o Badge Rookie/Svincolato */}
                        {isRookie ? (
                          <Badge
                            variant="outline"
                            className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 font-bold gap-1"
                          >
                            <Sparkles className="h-2.5 w-2.5" />
                            Rookie Draft
                          </Badge>
                        ) : !isSvincolato && player.Squadra ? (
                          <div className="flex items-center gap-1.5" title={teamName || player.Squadra}>
                            <img
                              src={`${SUPABASE_STORAGE_URL}/images/teams/${player.Squadra}_Logo.png`}
                              alt={player.Squadra}
                              className="h-6 w-6 object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = `${SUPABASE_STORAGE_URL}/images/LCSIM_Logo_SMALL.png`;
                              }}
                            />
                            <span className="font-bold font-mono text-xs text-muted-foreground">
                              {player.Squadra}
                            </span>
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-[9px] bg-muted/60 text-muted-foreground">
                            {player.Squadra === "RITIRATO" ? "Ritirato" : "Svincolato"}
                          </Badge>
                        )}
                      </div>

                      {/* Card Body: Foto Giocatore + Dati */}
                      <div className="p-4 flex flex-col items-center text-center space-y-3">
                        {/* Avatar */}
                        <div className="relative">
                          <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-border/80 bg-muted/30 shadow-md group-hover:scale-105 transition-transform duration-200">
                            <img
                              src={getPlayerImage(player.ID)}
                              alt={`${player.Nome} ${player.Cognome}`}
                              className="w-full h-full object-cover object-top"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = `${SUPABASE_STORAGE_URL}/images/players/MConti.png`;
                              }}
                            />
                          </div>
                          {player.Nazionalità && (
                            <img
                              src={getNationalityFlag(player.Nazionalità)}
                              alt={player.Nazionalità}
                              className="absolute -bottom-1 -right-1 h-4 w-6 object-cover rounded-xs border border-border shadow-xs"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                          )}
                        </div>

                        {/* Nome & Squadra */}
                        <div className="w-full min-w-0">
                          <h3 className="font-extrabold text-foreground text-base truncate group-hover:text-primary transition-colors">
                            {player.Nome} {player.Cognome}
                          </h3>
                          <div className="text-xs text-muted-foreground truncate mt-0.5">
                            {isRookie ? "Classe Draft 2026/27" : (teamName || (isSvincolato ? "Senza Squadra" : player.Squadra))}
                            {player.NumeroMaglia ? ` • #${player.NumeroMaglia}` : ""}
                          </div>
                        </div>

                        {/* 4 Quick Stat Pills */}
                        <div className="w-full grid grid-cols-4 gap-1 text-center font-mono text-[11px] pt-1 border-t border-border/50">
                          <div className="p-1 rounded bg-muted/30">
                            <span className="text-[9px] text-muted-foreground block">Età</span>
                            <span className="font-bold text-foreground flex items-center justify-center gap-0.5">
                              {player.Età || "—"}
                              {isRetiringSoon(player) && (
                                <span title="34 anni: ultima stagione prima del ritiro" className="text-amber-500 text-[10px]">⏳</span>
                              )}
                            </span>
                          </div>
                          <div className="p-1 rounded bg-muted/30">
                            <span className="text-[9px] text-muted-foreground block">Piede</span>
                            <span className="font-bold text-foreground">{player.Piede || "Dx"}</span>
                          </div>
                          <div className="p-1 rounded bg-muted/30">
                            <span className="text-[9px] text-muted-foreground block">Alt.</span>
                            <span className="font-bold text-foreground">
                              {player.Altezza ? `${player.Altezza}` : "—"}
                            </span>
                          </div>
                          <div className="p-1 rounded bg-muted/30">
                            <span className="text-[9px] text-muted-foreground block">{isRookie ? "Scout" : "XP"}</span>
                            <span className={`font-bold ${isRookie ? "text-amber-500" : "text-emerald-600 dark:text-emerald-400"}`}>
                              {isRookie ? `${rookieTokens}G` : (player.XP ?? 0)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer: Stato Mercato */}
                    <div className="p-3 border-t border-border/60 bg-muted/20 flex items-center justify-between">
                      {isRookie ? (
                        <Badge
                          variant="outline"
                          className="text-[10px] font-mono border-amber-500/30 text-amber-500 bg-amber-500/10"
                        >
                          Draft 2026/27
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-semibold px-2 py-0.5 border ${getMarketBadgeStyle(
                            marketCode
                          )}`}
                        >
                          {getMarketLabel(marketCode)}
                        </Badge>
                      )}

                      <span className="text-[11px] font-bold text-primary flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        <span>Scheda</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* ========================================================================= */}
          {/* 5. BARRA PAGINAZIONE MODERNA CON TENDINA E CONTROLLI COMPLETI             */}
          {/* ========================================================================= */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border/70">
              <div className="text-xs text-muted-foreground">
                Mostrando da <strong className="text-foreground">{startIndex + 1}</strong> a{" "}
                <strong className="text-foreground">
                  {Math.min(startIndex + pageSize, totalItems)}
                </strong>{" "}
                di <strong className="text-foreground">{totalItems}</strong> calciatori
              </div>

              {/* Bottoni Navigazione Pagine */}
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="h-8 px-2.5 text-xs font-semibold rounded-lg"
                  title="Prima Pagina"
                >
                  «
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-8 px-2.5 text-xs font-semibold rounded-lg gap-1"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Prec.</span>
                </Button>

                {/* Sliding Window Pagine */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`h-8 w-8 p-0 text-xs font-bold rounded-lg ${
                          currentPage === pageNum ? "shadow-sm font-black" : ""
                        }`}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="h-8 px-2.5 text-xs font-semibold rounded-lg gap-1"
                >
                  <span className="hidden sm:inline">Succ.</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="h-8 px-2.5 text-xs font-semibold rounded-lg"
                  title="Ultima Pagina"
                >
                  »
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ========================================================================= */}
      {/* 6. MODALE DETTAGLIO GIOCATORE (INGRANDITO, COMPLETO CON STATISTICHE & RADAR) */}
      {/* ========================================================================= */}
      {selectedPlayer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setSelectedPlayer(null)}
        >
          <PlayerDetails
            currentPlayer={selectedPlayer}
            onClose={() => setSelectedPlayer(null)}
          />
        </div>
      )}
    </div>
  );
};

export default ListaGiocatori;

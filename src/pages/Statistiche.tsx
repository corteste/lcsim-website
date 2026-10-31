import { useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
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
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  BarChart3,
  Target,
  TrendingUp,
  Star,
  Shield,
  Swords,
  Zap,
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  Trophy,
  Flame,
  Award,
} from "lucide-react";
import {
  getRoleColor,
  getPosGroup,
  getPlayerImage,
  getTeamBackground,
} from "@/utils/functions";
import { getPlayersSumStats } from "@/hooks/use-players-stats";
import { PlayerStatsSum } from "@/types/playerStats";
import { getTeams } from "@/hooks/use-teams";
import PlayerDetails from "@/components/player/playerDetails";
import { Player } from "@/types/player";
import { fetchPlayerById } from "@/services/playersService";
import { Loader2 } from "lucide-react";
import { SUPABASE_STORAGE_URL } from "@/constants/App";

const PLAYERS_PER_PAGE = 10;
const CURRENT_SEASON = 9;

type StatCategory =
  | "goalscorers"
  | "assists"
  | "ratings"
  | "saves"
  | "tackles"
  | "dribbles"
  | "minutes"
  | "cards";

interface CategoryConfig {
  id: StatCategory;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  badgeColor: string;
  defaultRoleFilter?: string;
}

const STAT_CATEGORIES: CategoryConfig[] = [
  {
    id: "goalscorers",
    label: "Marcatori",
    shortLabel: "Gol",
    icon: Target,
    description: "Classifica dei migliori realizzatori del campionato",
    badgeColor: "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20",
  },
  {
    id: "assists",
    label: "Assist",
    shortLabel: "Assist",
    icon: TrendingUp,
    description: "I migliori assistman e rifinitori di Serie A",
    badgeColor: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20",
  },
  {
    id: "ratings",
    label: "Media Voto",
    shortLabel: "Voto",
    icon: Star,
    description: "I calciatori con il rendimento medio più elevato",
    badgeColor: "text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20",
  },
  {
    id: "saves",
    label: "Portieri & Parate",
    shortLabel: "Parate",
    icon: Shield,
    description: "Interventi decisivi e parate totali dei numeri 1",
    badgeColor: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
  },
  {
    id: "tackles",
    label: "Contrasti Vinti",
    shortLabel: "Contrasti",
    icon: Swords,
    description: "I migliori recuperatori di palloni e duellanti",
    badgeColor: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  },
  {
    id: "dribbles",
    label: "Dribbling Riusciti",
    shortLabel: "Dribbling",
    icon: Zap,
    description: "I giocatori con il maggior numero di uno contro uno vinti",
    badgeColor: "text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  },
  {
    id: "minutes",
    label: "Minuti Giocati",
    shortLabel: "Minuti",
    icon: Clock,
    description: "Gli stacanovisti con il maggior minutaggio disputato",
    badgeColor: "text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
  },
  {
    id: "cards",
    label: "Disciplina & Falli",
    shortLabel: "Cartellini",
    icon: AlertTriangle,
    description: "Ammonizioni, espulsioni e falli commessi",
    badgeColor: "text-orange-600 dark:text-orange-400 bg-orange-500/10 border-orange-500/20",
  },
];

const ROLE_OPTIONS = [
  { id: "all", label: "Tutti i Ruoli" },
  { id: "POR", label: "Portieri" },
  { id: "DIF", label: "Difensori" },
  { id: "CEN", label: "Centrocampisti" },
  { id: "ATT", label: "Attaccanti" },
];

function getPlayerPrimaryStat(player: PlayerStatsSum, cat: StatCategory): number {
  switch (cat) {
    case "goalscorers":
      return player.sum_gol ?? 0;
    case "assists":
      return player.sum_asst ?? 0;
    case "ratings":
      return player.matches_played > 0
        ? Math.round((player.sum_voto / player.matches_played) * 100) / 100
        : 0;
    case "saves":
      return player.sum_para ?? 0;
    case "tackles":
      return player.sum_ctrs_si ?? 0;
    case "dribbles":
      return player.sum_drib_si ?? 0;
    case "cards":
      return (player.sum_gialli ?? 0) + (player.sum_rossi ?? 0) * 3;
    case "minutes":
      return player.sum_minuti ?? 0;
    default:
      return 0;
  }
}

function getStatDisplay(player: PlayerStatsSum, cat: StatCategory): {
  value: string | number;
  label: string;
  context: string;
} {
  switch (cat) {
    case "goalscorers":
      return {
        value: player.sum_gol ?? 0,
        label: "Gol",
        context: `${player.matches_played || 0} presenze • ${(
          (player.sum_gol ?? 0) / (player.matches_played || 1)
        ).toFixed(2)} gol/gara`,
      };
    case "assists":
      return {
        value: player.sum_asst ?? 0,
        label: "Assist",
        context: `${player.matches_played || 0} presenze • ${(
          (player.sum_asst ?? 0) / (player.matches_played || 1)
        ).toFixed(2)} asst/gara`,
      };
    case "ratings":
      const rating =
        player.matches_played > 0
          ? (player.sum_voto / player.matches_played).toFixed(2)
          : "N/D";
      return {
        value: rating,
        label: "Media Voto",
        context: `${player.matches_played || 0} presenze a referto`,
      };
    case "saves":
      return {
        value: player.sum_para ?? 0,
        label: "Parate",
        context: `${player.sum_gsub ?? 0} gol subiti in ${player.matches_played || 0} gare`,
      };
    case "tackles":
      const tacklePct = player.sum_ctrs_tot
        ? Math.round(((player.sum_ctrs_si ?? 0) / player.sum_ctrs_tot) * 100)
        : 0;
      return {
        value: player.sum_ctrs_si ?? 0,
        label: "Contrasti Vinti",
        context: `${player.sum_ctrs_tot ?? 0} tentati (${tacklePct}% successo)`,
      };
    case "dribbles":
      const dribPct = player.sum_drib_tot
        ? Math.round(((player.sum_drib_si ?? 0) / player.sum_drib_tot) * 100)
        : 0;
      return {
        value: player.sum_drib_si ?? 0,
        label: "Dribbling",
        context: `${player.sum_drib_tot ?? 0} tentati (${dribPct}% successo)`,
      };
    case "cards":
      return {
        value: `${player.sum_gialli ?? 0}G / ${player.sum_rossi ?? 0}R`,
        label: "Cartellini",
        context: `${player.sum_falli ?? 0} falli commessi`,
      };
    case "minutes":
      return {
        value: `${player.sum_minuti ?? 0}'`,
        label: "Minuti",
        context: `${player.matches_played || 0} presenze complessive`,
      };
  }
}

const Statistiche = () => {
  const [statType, setStatType] = useState<StatCategory>("goalscorers");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [teamFilter, setTeamFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerStatsSum | null>(null);
  const [fullPlayer, setFullPlayer] = useState<Player | null>(null);
  const [loadingFullPlayer, setLoadingFullPlayer] = useState<boolean>(false);

  // Fetch full Player details when a player is selected
  const handleSelectPlayer = async (playerStat: PlayerStatsSum) => {
    setSelectedPlayer(playerStat);
    setLoadingFullPlayer(true);
    try {
      const full = await fetchPlayerById(Number(playerStat.ID));
      if (full) {
        setFullPlayer(full);
      } else {
        // Fallback minimal player object
        setFullPlayer({
          ID: Number(playerStat.ID),
          Nome: playerStat.Nome,
          Cognome: playerStat.Cognome,
          Posiz: playerStat.Posiz,
          Squadra: playerStat.Squadra,
          DOB: new Date(),
          Età: 25,
          Nazionalità: "ITA",
          Altezza: 180,
          Peso: 75,
          Piede: "DX",
          PiedeDebole: "3",
          XP: 0,
          WROff: null,
          WRDef: null,
          OVR: 75,
          POR: null, DIF: null, CEN: null, MEN: null, ATT: null, FIS: null, CPZ: null,
          RIFP: null, PREP: null, TUFP: null, POSP: null, RINP: null, MARC: null,
          CONT: null, AGGR: null, SCIV: null, INTR: null, PASC: null, PASL: null,
          CRSS: null, CTRP: null, VISI: null, EFFT: null, POTN: null, PIAZ: null,
          PTIR: null, TIRD: null, DRBL: null, TIRV: null, TSTA: null, FINA: null,
          ACCL: null, VELO: null, RESI: null, FRZA: null, AGIL: null, ELEV: null,
          RIFL: null, EQLB: null, PNIZ: null, CRIG: null, MABI: null, Tratti: null,
          RuoloInCampo: null, MarketStatus: null, Role1: null, Role2: null,
          Trait1: null, Trait2: null, IconTrait1: null, IconTrait2: null
        });
      }
    } catch (err) {
      console.error("Errore fetch dati completi calciatore:", err);
    } finally {
      setLoadingFullPlayer(false);
    }
  };

  const handleClosePlayerModal = () => {
    setSelectedPlayer(null);
    setFullPlayer(null);
  };

  const { teams } = getTeams();
  const { playersStats, loading: loadingStats } = getPlayersSumStats(
    CURRENT_SEASON,
    null,
    null
  );

  // Active category configuration
  const activeCategory = useMemo(() => {
    return (
      STAT_CATEGORIES.find((c) => c.id === statType) || STAT_CATEGORIES[0]
    );
  }, [statType]);

  // Overall league telemetry summary
  const leagueSummary = useMemo(() => {
    let totalGoals = 0;
    let totalAssists = 0;
    let totalMatches = 0;

    for (const p of playersStats) {
      totalGoals += p.sum_gol ?? 0;
      totalAssists += p.sum_asst ?? 0;
      totalMatches += p.matches_played ?? 0;
    }

    return {
      totalGoals,
      totalAssists,
      totalPlayers: playersStats.length,
      averageGoalsPerPlayer:
        playersStats.length > 0
          ? (totalGoals / playersStats.length).toFixed(1)
          : "0.0",
    };
  }, [playersStats]);

  // Filter and sort players
  const filteredStats = useMemo(() => {
    return playersStats
      .filter((player) => {
        if (teamFilter !== "all" && player.Squadra !== teamFilter) return false;
        if (roleFilter !== "all" && getPosGroup(player.Posiz) !== roleFilter)
          return false;
        if (statType === "saves" && player.Posiz !== "POR") return false;
        if (searchQuery.trim() !== "") {
          const q = searchQuery.toLowerCase().trim();
          const fullName = `${player.Nome} ${player.Cognome}`.toLowerCase();
          return fullName.includes(q);
        }
        return true;
      })
      .sort((a, b) => {
        if (statType === "ratings") {
          const valA =
            a.matches_played > 0 ? a.sum_voto / a.matches_played : 0;
          const valB =
            b.matches_played > 0 ? b.sum_voto / b.matches_played : 0;
          const diff = valB - valA;
          if (Math.abs(diff) > 0.001) return diff;
          return (b.matches_played ?? 0) - (a.matches_played ?? 0);
        }
        const valA = getPlayerPrimaryStat(a, statType);
        const valB = getPlayerPrimaryStat(b, statType);
        if (valB !== valA) return valB - valA;
        return (a.matches_played ?? 0) - (b.matches_played ?? 0);
      });
  }, [playersStats, statType, teamFilter, roleFilter, searchQuery]);

  // Reset pagination on filter or category change
  const handleCategoryChange = (newCat: StatCategory) => {
    setStatType(newCat);
    setCurrentPage(1);
    if (newCat === "saves") {
      setRoleFilter("POR");
    } else if (roleFilter === "POR") {
      setRoleFilter("all");
    }
  };

  // Top 3 Podium players
  const podiumPlayers = useMemo(() => {
    return filteredStats.slice(0, 3);
  }, [filteredStats]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredStats.length / PLAYERS_PER_PAGE));
  const startIndex = (currentPage - 1) * PLAYERS_PER_PAGE;
  const currentPlayers = filteredStats.slice(
    startIndex,
    startIndex + PLAYERS_PER_PAGE
  );

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const getTeamName = (teamId: string) => {
    return teams.find((t) => t.TEAM_ID === teamId)?.NAME ?? teamId;
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <Navbar />

      <main className="container mx-auto px-4 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* BROADCAST HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-border/80">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                LCSIM Ufficiale • Serie A
              </span>
              <span className="text-xs text-muted-foreground">
                Rendimento Individuale • Stagione 2024/25
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              Statistiche Giocatori
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Leaderboard complete, statistiche avanzate di rendimento sul campo e classifiche individuali.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <div className="px-3.5 py-1.5 rounded-xl border border-border/80 bg-card text-xs flex items-center gap-2 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-muted-foreground">Aggiornato alla Giornata:</span>
              <span className="font-semibold text-foreground font-mono">
                Attiva
              </span>
            </div>
          </div>
        </div>

        {/* TELEMETRY KPI SUMMARY WIDGETS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
          <Card className="border border-border/80 bg-card shadow-sm p-3.5 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
              Gol Segnati in Lega
            </span>
            <span className="text-xl sm:text-2xl font-black font-mono text-rose-600 dark:text-rose-400">
              {leagueSummary.totalGoals}
            </span>
          </Card>

          <Card className="border border-border/80 bg-card shadow-sm p-3.5 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
              Assist Vincenti
            </span>
            <span className="text-xl sm:text-2xl font-black font-mono text-blue-600 dark:text-blue-400">
              {leagueSummary.totalAssists}
            </span>
          </Card>

          <Card className="border border-border/80 bg-card shadow-sm p-3.5 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
              Giocatori a Referto
            </span>
            <span className="text-xl sm:text-2xl font-black font-mono text-foreground">
              {leagueSummary.totalPlayers}
            </span>
          </Card>

          <Card className="border border-border/80 bg-card shadow-sm p-3.5 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
              Categoria Attiva
            </span>
            <span className="text-sm sm:text-base font-black font-mono text-emerald-600 dark:text-emerald-400 truncate block mt-1">
              {activeCategory.label}
            </span>
          </Card>
        </div>

        {/* CATEGORY SELECTOR PILLS BAR */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Classifiche Speciali:
            </span>
            <span className="text-xs text-muted-foreground">
              {activeCategory.description}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {STAT_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = statType === cat.id;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategoryChange(cat.id)}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition-all duration-200 cursor-pointer text-center gap-1.5 ${
                    isSelected
                      ? "bg-emerald-600 text-white border-emerald-500 shadow-md ring-2 ring-emerald-500/30 scale-[1.02]"
                      : "bg-card border-border/80 text-foreground hover:bg-muted/60 hover:border-border"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 ${
                      isSelected ? "text-white" : "text-emerald-500"
                    }`}
                  />
                  <span className="leading-tight text-[11px] sm:text-xs">
                    {cat.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* PODIUM TOP 3 LEADERS SHOWCASE */}
        {podiumPlayers.length >= 3 && !loadingStats && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-foreground">
                Podio Ufficiale • {activeCategory.label}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4 items-end">
              {/* 2ND PLACE (SILVER) - Left on Desktop */}
              {(() => {
                const player = podiumPlayers[1];
                const stat = getStatDisplay(player, statType);
                return (
                  <Card
                    onClick={() => handleSelectPlayer(player)}
                    className="order-2 md:order-1 border-2 border-slate-300/60 dark:border-slate-600/60 bg-gradient-to-b from-card to-slate-500/5 hover:border-slate-400 hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden p-4 group"
                  >
                    <div className="flex flex-col items-center text-center space-y-3">
                      {/* Rank Medal */}
                      <span className="px-3 py-0.5 rounded-full text-xs font-black bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600 shadow-xs flex items-center gap-1">
                        🥈 2° Posto
                      </span>

                      {/* Avatar */}
                      <div className="relative">
                        <Avatar className="h-16 w-16 border-2 border-slate-300 dark:border-slate-600 shadow-md group-hover:scale-105 transition-transform">
                          <AvatarImage
                            src={getPlayerImage(player.ID)}
                            alt={`${player.Nome} ${player.Cognome}`}
                          />
                          <AvatarFallback className="font-bold">
                            {player.Nome?.[0]}
                            {player.Cognome?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <img
                          src={`${SUPABASE_STORAGE_URL}/images/teams/${player.Squadra}_Logo.png`}
                          alt={player.Squadra}
                          className="absolute -bottom-1 -right-1 h-6 w-6 object-contain drop-shadow"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              `${SUPABASE_STORAGE_URL}/images/LCSIM_Logo_SMALL.png`;
                          }}
                        />
                      </div>

                      {/* Info */}
                      <div>
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-bold px-1.5 py-0 ${getRoleColor(
                              player.Posiz
                            )}`}
                          >
                            {player.Posiz}
                          </Badge>
                          <span className="font-extrabold text-foreground text-sm group-hover:text-emerald-600 transition-colors">
                            {player.Nome} {player.Cognome}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground block mt-0.5 font-medium">
                          {getTeamName(player.Squadra)}
                        </span>
                      </div>

                      {/* Stat Value */}
                      <div className="pt-2 border-t border-border/60 w-full">
                        <span className="text-2xl font-black font-mono text-foreground block">
                          {stat.value}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                          {stat.label}
                        </span>
                        <span className="text-[11px] text-muted-foreground mt-0.5 block font-mono">
                          {stat.context}
                        </span>
                      </div>
                    </div>
                  </Card>
                );
              })()}

              {/* 1ST PLACE (GOLD) - Center on Desktop */}
              {(() => {
                const player = podiumPlayers[0];
                const stat = getStatDisplay(player, statType);
                return (
                  <Card
                    onClick={() => handleSelectPlayer(player)}
                    className="order-1 md:order-2 border-2 border-amber-500/70 bg-gradient-to-b from-card via-amber-500/5 to-amber-500/15 hover:border-amber-400 hover:shadow-xl transition-all duration-200 cursor-pointer overflow-hidden p-5 group md:-translate-y-2 ring-2 ring-amber-500/20"
                  >
                    <div className="flex flex-col items-center text-center space-y-3">
                      {/* Rank Medal */}
                      <span className="px-3.5 py-0.5 rounded-full text-xs font-black bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-md flex items-center gap-1 uppercase tracking-wider">
                        👑 1° Posto • Leader
                      </span>

                      {/* Avatar */}
                      <div className="relative">
                        <Avatar className="h-20 w-20 border-3 border-amber-400 shadow-xl group-hover:scale-105 transition-transform">
                          <AvatarImage
                            src={getPlayerImage(player.ID)}
                            alt={`${player.Nome} ${player.Cognome}`}
                          />
                          <AvatarFallback className="font-bold text-lg">
                            {player.Nome?.[0]}
                            {player.Cognome?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <img
                          src={`${SUPABASE_STORAGE_URL}/images/teams/${player.Squadra}_Logo.png`}
                          alt={player.Squadra}
                          className="absolute -bottom-1 -right-1 h-7 w-7 object-contain drop-shadow"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              `${SUPABASE_STORAGE_URL}/images/LCSIM_Logo_SMALL.png`;
                          }}
                        />
                      </div>

                      {/* Info */}
                      <div>
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-bold px-1.5 py-0 ${getRoleColor(
                              player.Posiz
                            )}`}
                          >
                            {player.Posiz}
                          </Badge>
                          <span className="font-black text-foreground text-base group-hover:text-amber-500 transition-colors">
                            {player.Nome} {player.Cognome}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground block mt-0.5 font-bold">
                          {getTeamName(player.Squadra)}
                        </span>
                      </div>

                      {/* Stat Value */}
                      <div className="pt-2 border-t border-amber-500/30 w-full">
                        <span className="text-3xl font-black font-mono text-amber-500 block drop-shadow-xs">
                          {stat.value}
                        </span>
                        <span className="text-[11px] uppercase font-black tracking-wider text-muted-foreground block">
                          {stat.label}
                        </span>
                        <span className="text-[11px] text-muted-foreground mt-0.5 block font-mono font-medium">
                          {stat.context}
                        </span>
                      </div>
                    </div>
                  </Card>
                );
              })()}

              {/* 3RD PLACE (BRONZE) - Right on Desktop */}
              {(() => {
                const player = podiumPlayers[2];
                const stat = getStatDisplay(player, statType);
                return (
                  <Card
                    onClick={() => handleSelectPlayer(player)}
                    className="order-3 md:order-3 border-2 border-amber-700/40 bg-gradient-to-b from-card to-amber-900/5 hover:border-amber-600 hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden p-4 group"
                  >
                    <div className="flex flex-col items-center text-center space-y-3">
                      {/* Rank Medal */}
                      <span className="px-3 py-0.5 rounded-full text-xs font-black bg-amber-800/20 text-amber-700 dark:text-amber-400 border border-amber-700/30 shadow-xs flex items-center gap-1">
                        🥉 3° Posto
                      </span>

                      {/* Avatar */}
                      <div className="relative">
                        <Avatar className="h-16 w-16 border-2 border-amber-700/40 shadow-md group-hover:scale-105 transition-transform">
                          <AvatarImage
                            src={getPlayerImage(player.ID)}
                            alt={`${player.Nome} ${player.Cognome}`}
                          />
                          <AvatarFallback className="font-bold">
                            {player.Nome?.[0]}
                            {player.Cognome?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <img
                          src={`${SUPABASE_STORAGE_URL}/images/teams/${player.Squadra}_Logo.png`}
                          alt={player.Squadra}
                          className="absolute -bottom-1 -right-1 h-6 w-6 object-contain drop-shadow"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              `${SUPABASE_STORAGE_URL}/images/LCSIM_Logo_SMALL.png`;
                          }}
                        />
                      </div>

                      {/* Info */}
                      <div>
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-bold px-1.5 py-0 ${getRoleColor(
                              player.Posiz
                            )}`}
                          >
                            {player.Posiz}
                          </Badge>
                          <span className="font-extrabold text-foreground text-sm group-hover:text-emerald-600 transition-colors">
                            {player.Nome} {player.Cognome}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground block mt-0.5 font-medium">
                          {getTeamName(player.Squadra)}
                        </span>
                      </div>

                      {/* Stat Value */}
                      <div className="pt-2 border-t border-border/60 w-full">
                        <span className="text-2xl font-black font-mono text-foreground block">
                          {stat.value}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                          {stat.label}
                        </span>
                        <span className="text-[11px] text-muted-foreground mt-0.5 block font-mono">
                          {stat.context}
                        </span>
                      </div>
                    </div>
                  </Card>
                );
              })()}
            </div>
          </div>
        )}

        {/* FULL LEADERBOARD TABLE & FILTERS SECTION */}
        <Card className="border border-border/80 shadow-md bg-card overflow-hidden">
          {/* Table Header & Controls Bar */}
          <div className="p-4 sm:p-5 border-b border-border/80 bg-muted/20 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-emerald-500" />
                  Classifica Completa • {activeCategory.label}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {filteredStats.length} giocatori in graduatoria con i filtri attuali.
                </p>
              </div>

              {/* Search input */}
              <div className="relative">
                <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
                <Input
                  placeholder="Cerca calciatore..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-8 w-[190px] sm:w-[220px] pl-8 text-xs"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setCurrentPage(1);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Filters Row: Roles & Squadra */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-border/60">
              {/* Role filter buttons */}
              <div className="flex flex-wrap gap-1.5">
                {ROLE_OPTIONS.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      setRoleFilter(r.id);
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      roleFilter === r.id
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted/40"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              {/* Team dropdown */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-medium text-muted-foreground">
                  Filtra Squadra:
                </span>
                <Select
                  value={teamFilter}
                  onValueChange={(val) => {
                    setTeamFilter(val);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="h-8 w-[180px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutte le Squadre</SelectItem>
                    {teams.map((team) => (
                      <SelectItem key={team.TEAM_ID} value={team.TEAM_ID}>
                        {team.NAME}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Table Content */}
          <div className="p-0 overflow-x-auto">
            {loadingStats ? (
              <div className="p-12 text-center text-muted-foreground">
                Caricamento statistiche del campionato in corso...
              </div>
            ) : filteredStats.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                Nessun calciatore trovato con i filtri selezionati.
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-[11px] font-bold uppercase text-muted-foreground tracking-wider select-none">
                    <th className="py-3 px-3 text-center w-14">Pos.</th>
                    <th className="py-3 px-3">Giocatore</th>
                    <th className="py-3 px-2 text-center w-14">Ruolo</th>
                    <th className="py-3 px-3">Squadra</th>
                    <th className="py-3 px-3 text-center w-20">Presenze</th>
                    <th className="py-3 px-4 text-right">Dettaglio Rendimento</th>
                    <th className="py-3 px-4 text-right font-black w-28">
                      {activeCategory.shortLabel}
                    </th>
                    <th className="py-3 px-3 text-right w-20">Azione</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {currentPlayers.map((player, index) => {
                    const globalRank = startIndex + index + 1;
                    const stat = getStatDisplay(player, statType);
                    const isPodium = globalRank <= 3;

                    return (
                      <tr
                        key={player.ID}
                        onClick={() => handleSelectPlayer(player)}
                        className={`hover:bg-muted/40 transition-colors group cursor-pointer ${
                          globalRank === 1
                            ? "bg-amber-500/[0.04]"
                            : globalRank === 2
                            ? "bg-slate-400/[0.03]"
                            : globalRank === 3
                            ? "bg-amber-800/[0.02]"
                            : ""
                        }`}
                        title="Clicca per aprire la scheda delle statistiche avanzate"
                      >
                        {/* Rank */}
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`inline-flex items-center justify-center h-6 w-6 rounded-full font-mono font-black text-xs ${
                              globalRank === 1
                                ? "bg-amber-500 text-black shadow-xs font-extrabold"
                                : globalRank === 2
                                ? "bg-slate-300 dark:bg-slate-600 text-slate-900 dark:text-slate-100 font-extrabold"
                                : globalRank === 3
                                ? "bg-amber-800/30 text-amber-700 dark:text-amber-400 border border-amber-700/40"
                                : "text-muted-foreground font-medium"
                            }`}
                          >
                            {globalRank}
                          </span>
                        </td>

                        {/* Player */}
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2.5">
                            <Avatar className="h-8 w-8 border border-border shrink-0">
                              <AvatarImage
                                src={getPlayerImage(player.ID)}
                                alt={`${player.Nome} ${player.Cognome}`}
                              />
                              <AvatarFallback className="text-[10px]">
                                {player.Nome?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-bold text-foreground group-hover:text-emerald-600 transition-colors">
                              {player.Nome} {player.Cognome}
                            </span>
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

                        {/* Team */}
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <img
                              src={`${SUPABASE_STORAGE_URL}/images/teams/${player.Squadra}_Logo.png`}
                              alt={player.Squadra}
                              className="h-5 w-5 object-contain shrink-0"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  `${SUPABASE_STORAGE_URL}/images/LCSIM_Logo_SMALL.png`;
                              }}
                            />
                            <span className="text-muted-foreground font-medium text-xs">
                              {getTeamName(player.Squadra)}
                            </span>
                          </div>
                        </td>

                        {/* Matches */}
                        <td className="py-2.5 px-3 text-center font-mono text-muted-foreground">
                          {player.matches_played ?? 0}
                        </td>

                        {/* Detail Context */}
                        <td className="py-2.5 px-4 text-right text-muted-foreground font-mono text-xs">
                          {stat.context}
                        </td>

                        {/* Primary Stat Value */}
                        <td className="py-2.5 px-4 text-right">
                          <span
                            className={`font-black font-mono text-base ${
                              isPodium
                                ? "text-amber-500"
                                : "text-emerald-600 dark:text-emerald-400"
                            }`}
                          >
                            {stat.value}
                          </span>
                        </td>

                        {/* Action */}
                        <td className="py-2.5 px-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs font-semibold group-hover:text-emerald-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPlayer(player);
                            }}
                          >
                            Dettagli
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-border/80 bg-muted/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="text-muted-foreground">
                Visualizzazione {startIndex + 1}–
                {Math.min(startIndex + PLAYERS_PER_PAGE, filteredStats.length)} di{" "}
                {filteredStats.length} giocatori
              </span>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="h-8 px-2.5 text-xs gap-1"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>Precedente</span>
                </Button>

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
                        onClick={() => goToPage(pageNum)}
                        className={`h-8 w-8 text-xs font-bold ${
                          currentPage === pageNum
                            ? "bg-emerald-600 text-white"
                            : ""
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
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="h-8 px-2.5 text-xs gap-1"
                >
                  <span>Successiva</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </main>

      {/* PLAYER ADVANCED STATS & FULL CHARACTERISTICS MODAL */}
      {selectedPlayer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto"
          onClick={handleClosePlayerModal}
        >
          {loadingFullPlayer && !fullPlayer ? (
            <div 
              className="p-8 rounded-2xl bg-card border border-border/80 shadow-2xl flex flex-col items-center gap-3 text-sm font-semibold text-foreground animate-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span>Caricamento scheda completa di {selectedPlayer.Nome} {selectedPlayer.Cognome}...</span>
            </div>
          ) : fullPlayer ? (
            <PlayerDetails
              currentPlayer={fullPlayer}
              initialStats={selectedPlayer}
              defaultTab="stats"
              onClose={handleClosePlayerModal}
            />
          ) : null}
        </div>
      )}
    </div>
  );
};

export default Statistiche;

import { useState, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Archive,
  Star,
  Award,
  Users,
  Search,
  History,
  ArrowLeftRight,
  Sparkles,
  Shield,
  Crown,
  ArrowLeft,
  Calendar,
  ChevronRight,
  UserX,
  CheckCircle2,
  Flame,
  Trophy,
} from "lucide-react";
import {
  getRoleColor,
  getPlayerImage,
  getNationalityFlag,
  getValueColor,
  LCSIM_LOGO_SMALL,
} from "@/utils/functions";
import { SUPABASE_STORAGE_URL } from "@/constants/App";
import {
  fetchAllPlayersCareerSummary,
  fetchPlayerArchiveDetail,
  getHistoricalTeamMeta,
  formatCareerPath,
  PlayerCareerSummary,
  PlayerTransaction,
} from "@/services/archiveService";
import { fetchPlayerPalmares } from "@/services/playerPalmaresService";
import { PlayerPalmaresTab } from "@/components/player/PlayerPalmaresTab";
import { PlayerPalmaresBadges } from "@/components/player/PlayerPalmaresBadges";

const ROLE_GROUPS = [
  { id: "ALL", label: "Tutti i Ruoli", roles: [] as string[] },
  { id: "POR", label: "Portieri (POR)", roles: ["POR"] },
  { id: "DIF", label: "Difensori (DC, TD, TS)", roles: ["DC", "TD", "TS"] },
  {
    id: "CEN",
    label: "Centrocampisti (CDC, CC, COC, ED, ES)",
    roles: ["CDC", "CC", "COC", "ED", "ES"],
  },
  { id: "ATT", label: "Attaccanti (ATT, AT, AD, AS)", roles: ["ATT", "AT", "AD", "AS"] },
];

const FRANCHISE_FILTER_OPTIONS = [
  { id: "ALL", label: "Tutte le Franchigie (Storiche e Attuali)" },
  { id: "ACD", label: "ACD — AC Denti (incl. GAP)" },
  { id: "ACF", label: "ACF — AC Fantasy (incl. QFM)" },
  { id: "ALV", label: "ALV — Alvisopoli FC" },
  { id: "APD", label: "APD — Average Pegiò Drivers" },
  { id: "COS", label: "COS — Cosmo FC" },
  { id: "EUR", label: "EUR — Eurosbin FC" },
  { id: "MAR", label: "MAR — Mar's Attack (incl. SBM)" },
  { id: "OLD", label: "OLD — Old Bois (incl. PRO, YBO)" },
  { id: "PFC", label: "PFC — Panormus FC (incl. PAN, HTV)" },
  { id: "RMB", label: "RMB — Redmamba GPT (incl. BLA)" },
  { id: "SKA", label: "SKA — Sporting Karalis (incl. HVI, ASK)" },
  { id: "VFC", label: "VFC — Valle FC" },
  { id: "KAR", label: "KAR — Karalis FC / Poppo FC (S1-S4)" },
];

const pct = (si: number, tot: number) => {
  if (!tot || tot <= 0) return "0.0%";
  return `${((si / tot) * 100).toFixed(1)}%`;
};

const getOvrTextColor = (ovr: number | null | undefined) => {
  if (!ovr) return "text-muted-foreground";
  if (ovr >= 90) return "text-purple-500 dark:text-purple-400";
  if (ovr >= 85) return "text-blue-500 dark:text-blue-400";
  if (ovr >= 80) return "text-emerald-500 dark:text-emerald-400";
  if (ovr >= 75) return "text-amber-500 dark:text-amber-400";
  return "text-orange-500 dark:text-orange-400";
};

const SERIE_B_TEAMS: Record<string, string> = {
  "B - KEY": "Key",
  "B - ASP": "AS Pradalunga",
  "B - SLM": "AS San Lombardo",
  "B - FFC": "Flamingo FC",
  "B - CSF": "Colle Salvetti FC",
  "B - CYD": "Cydonia FC",
  "B - BFC": "Borcelle FC",
};

const HistoricalTeamBadge = ({
  teamCode,
  showFranchiseHint = true,
}: {
  teamCode: string;
  showFranchiseHint?: boolean;
}) => {
  if (!teamCode || teamCode === "/" || teamCode === "N/D") {
    return <span className="text-muted-foreground text-xs">—</span>;
  }
  if (teamCode === "Rookie") {
    return (
      <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 font-semibold text-xs">
        🎓 Rookie
      </Badge>
    );
  }
  if (teamCode === "Svincolati") {
    return (
      <Badge variant="outline" className="bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30 font-semibold text-xs">
        Svincolati
      </Badge>
    );
  }
  if (teamCode === "Ritiro" || teamCode === "Ritirati" || teamCode === "RITIRATO") {
    return (
      <Badge variant="outline" className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 font-semibold text-xs">
        Ritirato
      </Badge>
    );
  }

  const cleanCode = teamCode.trim().toUpperCase();
  const isSerieB = cleanCode.startsWith("B -") || cleanCode.startsWith("B-");

  if (isSerieB) {
    const bName = SERIE_B_TEAMS[cleanCode] || cleanCode.replace(/^B\s*-\s*/i, "");
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center gap-1.5 cursor-help">
            <div className="h-7 w-7 rounded-lg bg-card/80 border border-border/70 p-0.5 shrink-0 flex items-center justify-center overflow-hidden shadow-2xs hover:border-primary/50 transition-colors">
              <img
                src={LCSIM_LOGO_SMALL}
                alt={`${bName} (Serie B)`}
                className="h-full w-full object-contain"
              />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs space-y-1 p-2.5 shadow-md">
          <div className="flex items-center gap-2">
            <img
              src={LCSIM_LOGO_SMALL}
              alt="LCSIM Logo"
              className="h-4 w-4 object-contain shrink-0"
            />
            <p className="font-bold text-foreground">
              {bName} ({cleanCode})
            </p>
          </div>
          <p className="text-muted-foreground text-[11px]">
            Campionato cadetto / Serie B
          </p>
        </TooltipContent>
      </Tooltip>
    );
  }

  const meta = getHistoricalTeamMeta(teamCode);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="inline-flex items-center gap-1.5 cursor-help">
          <div className="h-7 w-7 rounded-lg bg-card/80 border border-border/70 p-0.5 shrink-0 flex items-center justify-center overflow-hidden shadow-2xs hover:border-primary/50 transition-colors">
            <img
              src={`${SUPABASE_STORAGE_URL}/images/teams/${meta.code}_Logo.png`}
              alt={meta.fullName || meta.code}
              className="h-full w-full object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (meta.franchiseCode && !target.src.includes(`${meta.franchiseCode}_Logo.png`)) {
                  target.src = `${SUPABASE_STORAGE_URL}/images/teams/${meta.franchiseCode}_Logo.png`;
                } else {
                  target.src = LCSIM_LOGO_SMALL;
                }
              }}
            />
          </div>
          {showFranchiseHint && meta.isHistoricalRebrand && (
            <span className="text-[10px] text-muted-foreground font-mono font-medium">
              ({meta.code})
            </span>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs space-y-1 p-2.5 shadow-md">
        <div className="flex items-center gap-2">
          <img
            src={`${SUPABASE_STORAGE_URL}/images/teams/${meta.code}_Logo.png`}
            alt={meta.code}
            className="h-4 w-4 object-contain shrink-0"
            onError={(e) => {
              (e.target as HTMLImageElement).src = LCSIM_LOGO_SMALL;
            }}
          />
          <p className="font-bold text-foreground">
            {meta.fullName} ({meta.code})
          </p>
        </div>
        {meta.isHistoricalRebrand ? (
          <p className="text-muted-foreground text-[11px]">
            Denominazione storica ({meta.eraSeasons}) • Franchigia attuale:{" "}
            <strong className="text-foreground">
              {meta.franchiseName} ({meta.franchiseCode})
            </strong>
          </p>
        ) : (
          <p className="text-muted-foreground text-[11px]">Attiva in {meta.eraSeasons}</p>
        )}
      </TooltipContent>
    </Tooltip>
  );
};

const getMotivoBadge = (motivo: string, pick?: number | null) => {
  switch (motivo) {
    case "Draft":
      return (
        <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-bold">
          <Sparkles className="h-3 w-3 mr-1" />
          Draft {pick ? `#${pick}` : ""}
        </Badge>
      );
    case "Scambio":
      return (
        <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30 font-bold">
          <ArrowLeftRight className="h-3 w-3 mr-1" />
          Scambio
        </Badge>
      );
    case "Espansione":
      return (
        <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30 font-bold">
          <Shield className="h-3 w-3 mr-1" />
          Draft Espansione
        </Badge>
      );
    case "Taglio":
      return (
        <Badge className="bg-orange-500/15 text-orange-700 dark:text-orange-300 border border-orange-500/30 font-bold">
          <UserX className="h-3 w-3 mr-1" />
          Taglio
        </Badge>
      );
    case "Fallimento":
      return (
        <Badge className="bg-slate-500/15 text-slate-700 dark:text-slate-300 border border-slate-500/30 font-bold">
          Fallimento Club
        </Badge>
      );
    case "Ritiro":
      return (
        <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 font-bold">
          Ritiro Ufficiale
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-xs font-medium">
          {motivo}
        </Badge>
      );
  }
};

const StatBox = ({
  label,
  value,
  subValue,
  highlight = false,
}: {
  label: string;
  value: string | number;
  subValue?: string;
  highlight?: boolean;
}) => (
  <div
    className={`flex flex-col items-center justify-center p-3.5 rounded-xl border transition-all ${
      highlight
        ? "bg-primary/10 border-primary/30 shadow-xs"
        : "bg-muted/30 border-border/60"
    }`}
  >
    <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-1 text-center">
      {label}
    </span>
    <span className={`text-xl font-black ${highlight ? "text-primary" : "text-foreground"}`}>
      {value}
    </span>
    {subValue && (
      <span className="text-[11px] text-muted-foreground font-medium mt-0.5">{subValue}</span>
    )}
  </div>
);

const ArchivioGiocatori = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedPlayerIdParam = searchParams.get("player") || "";

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [franchiseFilter, setFranchiseFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState<
    "presenze" | "minuti" | "gol" | "assist" | "media_voto" | "capitano" | "ovr"
  >("presenze");

  const { data: allPlayers = [], isLoading: loadingPlayers } = useQuery({
    queryKey: ["archive_players_career_summary"],
    queryFn: fetchAllPlayersCareerSummary,
    staleTime: 60 * 1000,
  });

  const selectedPlayer: PlayerCareerSummary | undefined = useMemo(() => {
    if (!selectedPlayerIdParam) return undefined;
    const pid = Number(selectedPlayerIdParam);
    return allPlayers.find((p) => p.player_id === pid);
  }, [allPlayers, selectedPlayerIdParam]);

  const { data: playerDetail, isLoading: loadingDetail } = useQuery({
    queryKey: ["archive_player_detail", selectedPlayer?.player_id],
    queryFn: () => fetchPlayerArchiveDetail(selectedPlayer!.player_id),
    enabled: !!selectedPlayer,
    staleTime: 60 * 1000,
  });

  const { data: playerPalmares, isLoading: loadingPalmares } = useQuery({
    queryKey: ["archive_player_palmares", selectedPlayer?.player_id],
    queryFn: () => fetchPlayerPalmares(selectedPlayer!.player_id),
    enabled: !!selectedPlayer,
    staleTime: 60 * 1000,
  });

  const filteredPlayers = useMemo(() => {
    return allPlayers
      .filter((p) => {
        // Status filter
        if (statusFilter === "ACTIVE_A") {
          if (!p.squadra_attuale || p.squadra_attuale === "RITIRATO" || p.squadra_attuale.startsWith("B -")) {
            return false;
          }
        } else if (statusFilter === "RETIRED") {
          if (p.squadra_attuale !== "RITIRATO") return false;
        } else if (statusFilter === "FREE_AGENT") {
          if (p.squadra_attuale !== null && p.squadra_attuale !== "") return false;
        } else if (statusFilter === "SERIE_B") {
          if (!p.squadra_attuale || !p.squadra_attuale.startsWith("B -")) return false;
        } else if (statusFilter === "HOF") {
          if (!p.is_hof) return false;
        }

        // Role filter
        if (roleFilter !== "ALL") {
          const grp = ROLE_GROUPS.find((g) => g.id === roleFilter);
          if (grp && !grp.roles.includes(p.posiz)) return false;
        }

        // Franchise filter (matches historical franchise or current team)
        if (franchiseFilter !== "ALL") {
          const matchesFranchise =
            p.franchises.includes(franchiseFilter) ||
            p.season_teams.includes(franchiseFilter) ||
            p.squadra_attuale === franchiseFilter;
          if (!matchesFranchise) return false;
        }

        // Search query
        if (searchQuery.trim() !== "") {
          const q = searchQuery.toLowerCase().trim();
          const full = `${p.nome} ${p.cognome} ${p.cognome} ${p.nome} ${p.player_id} ${p.posiz}`.toLowerCase();
          if (!full.includes(q)) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "presenze") return b.presenze - a.presenze || b.minuti - a.minuti;
        if (sortBy === "minuti") return b.minuti - a.minuti;
        if (sortBy === "gol") return b.gol - a.gol || b.presenze - a.presenze;
        if (sortBy === "assist") return b.assist - a.assist || b.presenze - a.presenze;
        if (sortBy === "media_voto") {
          const mvA = a.presenze >= 5 ? a.media_voto ?? 0 : 0;
          const mvB = b.presenze >= 5 ? b.media_voto ?? 0 : 0;
          return mvB - mvA || b.presenze - a.presenze;
        }
        if (sortBy === "capitano") return b.presenze_capitano - a.presenze_capitano || b.presenze - a.presenze;
        if (sortBy === "ovr") return b.ovr - a.ovr || b.presenze - a.presenze;
        return 0;
      });
  }, [allPlayers, statusFilter, roleFilter, franchiseFilter, searchQuery, sortBy]);

  const handleSelectPlayer = (playerId: number) => {
    setSearchParams({ player: String(playerId) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleClearSelection = () => {
    setSearchParams({});
  };

  const renderPlayerStatusBadge = (p: PlayerCareerSummary) => {
    if (p.is_hof) {
      return (
        <Badge className="bg-yellow-500 text-yellow-950 font-black border-yellow-400">
          <Star className="h-3 w-3 mr-1 fill-yellow-950" />
          Hall of Fame ({p.hof_class})
        </Badge>
      );
    }
    if (p.squadra_attuale === "RITIRATO") {
      return (
        <Badge variant="outline" className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 font-bold">
          Ritirato
        </Badge>
      );
    }
    if (!p.squadra_attuale) {
      return (
        <Badge variant="outline" className="bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30 font-semibold">
          Svincolato
        </Badge>
      );
    }
    return <HistoricalTeamBadge teamCode={p.squadra_attuale} showFranchiseHint={false} />;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/60 pb-5">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
                <Archive className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
                  Archivio Storico Calciatori
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Database storico completo (S1–S11): carriere, stagioni in rosa, statistiche, fasce da capitano e trasferimenti ufficiali
                </p>
              </div>
            </div>
          </div>

          {selectedPlayer && (
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="default" size="sm" onClick={handleClearSelection} className="gap-1.5 font-bold">
                <ArrowLeft className="h-4 w-4" />
                Tutti i Calciatori ({allPlayers.length})
              </Button>
            </div>
          )}
        </div>

        {/* SELECTED PLAYER FULL ARCHIVE VIEW */}
        {selectedPlayer ? (
          <div className="space-y-6 animate-fade-in">
            {/* Player Hero Card */}
            <Card className="shadow-xl overflow-hidden border-border/80">
              <div className="bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-6">
                <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
                  {/* Left: Avatar + Name + Career Trail */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                    <div className="relative shrink-0">
                      <img
                        src={getPlayerImage(selectedPlayer.player_id)}
                        alt={`${selectedPlayer.nome} ${selectedPlayer.cognome}`}
                        className={`h-28 w-28 sm:h-32 sm:w-32 rounded-2xl object-cover border-4 shadow-xl ${
                          selectedPlayer.is_hof
                            ? "border-yellow-500 shadow-yellow-500/20"
                            : "border-primary/30"
                        }`}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/placeholder.svg";
                        }}
                      />
                      {selectedPlayer.is_hof && (
                        <div className="absolute -top-2.5 -right-2.5 bg-yellow-500 rounded-full p-2 shadow-lg border-2 border-background">
                          <Star className="h-4 w-4 text-yellow-950 fill-yellow-950" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <Badge variant="outline" className={`${getRoleColor(selectedPlayer.posiz)} text-xs font-bold px-2.5 py-0.5`}>
                          {selectedPlayer.posiz}
                        </Badge>
                        {renderPlayerStatusBadge(selectedPlayer)}
                        <span className="text-xs font-mono text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md">
                          ID #{selectedPlayer.player_id}
                        </span>
                        {selectedPlayer.nazionalita && (
                          <img
                            src={getNationalityFlag(selectedPlayer.nazionalita)}
                            alt={selectedPlayer.nazionalita}
                            className="h-4 w-6 object-cover rounded-xs shadow-2xs"
                          />
                        )}
                      </div>

                      <h2 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight">
                        {selectedPlayer.cognome.toUpperCase()}, {selectedPlayer.nome}
                      </h2>

                      {/* Career Path Trail */}
                      <p className="text-xs sm:text-sm font-semibold text-muted-foreground">
                        {formatCareerPath(
                          selectedPlayer.season_teams,
                          selectedPlayer.is_hof,
                          selectedPlayer.draft_pick,
                          selectedPlayer.draft_stag,
                          selectedPlayer.squadra_attuale
                        ) || "Nessuna stagione a roster registrata"}
                      </p>

                      {/* Key Career Pill Highlights */}
                      <div className="flex flex-wrap gap-2 pt-1">
                        {selectedPlayer.draft_pick && selectedPlayer.draft_stag && (
                          <Badge variant="secondary" className="gap-1.5 px-2.5 py-1 text-xs font-bold">
                            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                            Scelta #{selectedPlayer.draft_pick} Draft S{selectedPlayer.draft_stag} ({selectedPlayer.draft_team})
                          </Badge>
                        )}
                        {selectedPlayer.stagioni_rosa > 0 && (
                          <Badge variant="secondary" className="gap-1.5 px-2.5 py-1 text-xs font-bold">
                            <Calendar className="h-3.5 w-3.5 text-primary" />
                            {selectedPlayer.stagioni_rosa}{" "}
                            {selectedPlayer.stagioni_rosa === 1 ? "Stagione" : "Stagioni"} a Roster (S{selectedPlayer.first_stag}–S{selectedPlayer.last_stag})
                          </Badge>
                        )}
                        {selectedPlayer.presenze_capitano > 0 && (
                          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 gap-1.5 px-2.5 py-1 text-xs font-bold">
                            <Crown className="h-3.5 w-3.5 text-amber-500" />
                            {selectedPlayer.presenze_capitano}x Capitano in Campo
                          </Badge>
                        )}
                        {selectedPlayer.motm > 0 && (
                          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 gap-1.5 px-2.5 py-1 text-xs font-bold">
                            <Award className="h-3.5 w-3.5 text-emerald-500" />
                            {selectedPlayer.motm}x MVP Giornata (MOTM)
                          </Badge>
                        )}
                        <PlayerPalmaresBadges palmares={playerPalmares} />
                      </div>
                    </div>
                  </div>

                  {/* Right: Key Bio & Career Numbers */}
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5 w-full lg:w-auto">
                    <div className="bg-background/70 backdrop-blur-xs border border-border/60 rounded-xl p-3 text-center flex flex-col justify-center items-center min-w-[70px]">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold block">
                        OVR
                      </span>
                      <span className={`text-2xl sm:text-3xl font-black ${getOvrTextColor(selectedPlayer.ovr)}`}>
                        {selectedPlayer.ovr}
                      </span>
                    </div>
                    <div className="bg-background/70 backdrop-blur-xs border border-border/60 rounded-xl p-3 text-center flex flex-col justify-center items-center min-w-[85px]">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold block">
                        Presenze
                      </span>
                      <span className="text-2xl sm:text-3xl font-black text-foreground">
                        {selectedPlayer.presenze}
                      </span>
                      <span className="text-[10px] text-muted-foreground block">
                        {selectedPlayer.titolare} tit.
                      </span>
                    </div>
                    <div className="bg-background/70 backdrop-blur-xs border border-border/60 rounded-xl p-3 text-center flex flex-col justify-center items-center min-w-[95px]">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold block">
                        Gol / Assist
                      </span>
                      <span className="text-2xl sm:text-3xl font-black text-foreground">
                        {selectedPlayer.gol} / {selectedPlayer.assist}
                      </span>
                    </div>
                    <div className="bg-background/70 backdrop-blur-xs border border-border/60 rounded-xl p-3 text-center flex flex-col justify-center items-center min-w-[85px]">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold block">
                        Media Voto
                      </span>
                      <span className="text-2xl sm:text-3xl font-black text-primary">
                        {selectedPlayer.media_voto ? selectedPlayer.media_voto.toFixed(2) : "—"}
                      </span>
                    </div>
                    <div className="bg-background/70 backdrop-blur-xs border border-border/60 rounded-xl p-3 text-center col-span-3 sm:col-span-1 flex flex-col justify-center items-center min-w-[105px]">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold block">
                        Fisico
                      </span>
                      <span className="text-sm font-bold text-foreground block mt-1">
                        {selectedPlayer.altezza}cm • {selectedPlayer.peso}kg
                      </span>
                      <span className="text-[10px] text-muted-foreground block">
                        Età {selectedPlayer.eta}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Detailed Archive Tabs: 1. Stagioni (default), 2. Cronistoria & Trasferimenti, 3. Totali Carriera */}
            <Card className="shadow-lg border-border/80">
              <Tabs defaultValue="stagioni" className="w-full">
                <CardHeader className="border-b border-border/60 pb-4">
                  <TabsList className="grid w-full max-w-3xl grid-cols-2 sm:grid-cols-4 gap-1">
                    <TabsTrigger value="stagioni" className="gap-1.5 font-bold text-xs sm:text-sm">
                      <Calendar className="h-4 w-4" />
                      Per Stagione ({playerDetail?.seasons.length ?? 0})
                    </TabsTrigger>
                    <TabsTrigger value="movimenti" className="gap-1.5 font-bold text-xs sm:text-sm">
                      <History className="h-4 w-4" />
                      Movimenti ({playerDetail?.transactions.length ?? 0})
                    </TabsTrigger>
                    <TabsTrigger value="carriera" className="gap-1.5 font-bold text-xs sm:text-sm">
                      <Award className="h-4 w-4" />
                      Totali Carriera
                    </TabsTrigger>
                    <TabsTrigger value="palmares" className="gap-1.5 font-bold text-xs sm:text-sm">
                      <Trophy className="h-4 w-4 text-amber-500" />
                      Palmarès
                    </TabsTrigger>
                  </TabsList>
                </CardHeader>

                <CardContent className="p-4 sm:p-6">
                  {/* TAB 1: STAGIONI (includes 0-minute roster seasons!) */}
                  <TabsContent value="stagioni" className="mt-0 space-y-4">
                    {loadingDetail ? (
                      <div className="py-12 text-center text-muted-foreground">
                        Caricamento stagioni in carriera...
                      </div>
                    ) : !playerDetail?.seasons.length ? (
                      <div className="py-12 text-center text-muted-foreground">
                        Nessuna stagione registrata per questo calciatore.
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-xl border border-border/70">
                        <table className="w-full text-xs sm:text-sm">
                          <thead className="bg-muted/50 border-b border-border">
                            <tr>
                              <th className="text-left p-3 font-bold">Stag</th>
                              <th className="text-left p-3 font-bold">Squadra Storica</th>
                              <th className="text-left p-3 font-bold">Stato Rosa</th>
                              <th className="text-center p-3 font-bold">Pres (Tit)</th>
                              <th className="text-center p-3 font-bold">Min</th>
                              <th className="text-center p-3 font-bold">MV</th>
                              <th className="text-center p-3 font-bold" title="Presenze con la fascia da Capitano">
                                © Cap
                              </th>
                              <th className="text-center p-3 font-bold">Gol</th>
                              <th className="text-center p-3 font-bold">Assist</th>
                              <th className="text-center p-3 font-bold">Tiri</th>
                              <th className="text-center p-3 font-bold">Passaggi</th>
                              <th className="text-center p-3 font-bold">Dribbling</th>
                              <th className="text-center p-3 font-bold">Contrasti</th>
                              {selectedPlayer.posiz === "POR" && (
                                <>
                                  <th className="text-center p-3 font-bold">Parate</th>
                                  <th className="text-center p-3 font-bold">GS / CS</th>
                                </>
                              )}
                              <th className="text-center p-3 font-bold">🟨/🟥</th>
                            </tr>
                          </thead>
                          <tbody>
                            {playerDetail.seasons.map((s) => {
                              const zeroPlayed = s.presenze === 0 || s.minuti === 0;
                              return (
                                <tr
                                  key={s.stagione}
                                  className={`border-b border-border/50 transition-colors ${
                                    zeroPlayed
                                      ? "bg-muted/15 text-muted-foreground"
                                      : "hover:bg-muted/30"
                                  }`}
                                >
                                  <td className="p-3 font-black text-foreground">S{s.stagione}</td>
                                  <td className="p-3">
                                    <HistoricalTeamBadge teamCode={s.team_id} />
                                  </td>
                                  <td className="p-3">
                                    {s.entry_motivo === "Draft" ? (
                                      <Badge variant="outline" className="text-[11px] border-amber-500/40 text-amber-600 dark:text-amber-400 font-bold">
                                        Draft {s.draft_pick ? `#${s.draft_pick}` : ""}
                                      </Badge>
                                    ) : (
                                      <span className="text-xs text-muted-foreground font-medium">
                                        {s.entry_motivo}
                                      </span>
                                    )}
                                  </td>
                                  <td className="text-center p-3">
                                    {zeroPlayed ? (
                                      <Badge variant="outline" className="text-[11px] bg-muted/40 text-muted-foreground">
                                        0 pres (In rosa)
                                      </Badge>
                                    ) : (
                                      <span className="font-bold text-foreground">
                                        {s.presenze}{" "}
                                        <span className="text-xs text-muted-foreground font-normal">
                                          ({s.titolare})
                                        </span>
                                      </span>
                                    )}
                                  </td>
                                  <td className="text-center p-3 font-mono">
                                    {zeroPlayed ? "0'" : `${s.minuti}'`}
                                  </td>
                                  <td className="text-center p-3 font-black text-primary">
                                    {s.media_voto ? s.media_voto.toFixed(2) : "—"}
                                  </td>
                                  <td className="text-center p-3">
                                    {s.presenze_capitano > 0 ? (
                                      <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30 font-bold text-xs">
                                        © {s.presenze_capitano}
                                      </Badge>
                                    ) : (
                                      <span className="text-muted-foreground/50">—</span>
                                    )}
                                  </td>
                                  <td className="text-center p-3 font-bold">
                                    {s.gol > 0 ? (
                                      <span className="text-emerald-600 dark:text-emerald-400">{s.gol}</span>
                                    ) : (
                                      "0"
                                    )}
                                  </td>
                                  <td className="text-center p-3 font-bold">
                                    {s.assist > 0 ? (
                                      <span className="text-blue-600 dark:text-blue-400">{s.assist}</span>
                                    ) : (
                                      "0"
                                    )}
                                  </td>
                                  <td className="text-center p-3 text-xs">
                                    {zeroPlayed ? "—" : `${s.tiri_in}/${s.tiri_tot}`}
                                  </td>
                                  <td className="text-center p-3 text-xs">
                                    {zeroPlayed ? (
                                      "—"
                                    ) : (
                                      <span>
                                        {s.pass_si}/{s.pass_tot}{" "}
                                        <span className="text-[10px] text-muted-foreground">
                                          ({pct(s.pass_si, s.pass_tot)})
                                        </span>
                                      </span>
                                    )}
                                  </td>
                                  <td className="text-center p-3 text-xs">
                                    {zeroPlayed ? (
                                      "—"
                                    ) : (
                                      <span>
                                        {s.drib_si}/{s.drib_tot}{" "}
                                        <span className="text-[10px] text-muted-foreground">
                                          ({pct(s.drib_si, s.drib_tot)})
                                        </span>
                                      </span>
                                    )}
                                  </td>
                                  <td className="text-center p-3 text-xs">
                                    {zeroPlayed ? "—" : `${s.ctrs_si}/${s.ctrs_tot}`}
                                  </td>
                                  {selectedPlayer.posiz === "POR" && (
                                    <>
                                      <td className="text-center p-3 font-bold">{s.parate}</td>
                                      <td className="text-center p-3 text-xs">
                                        {s.gol_subiti} sub /{" "}
                                        <strong className="text-emerald-500">{s.clean_sheets} CS</strong>
                                      </td>
                                    </>
                                  )}
                                  <td className="text-center p-3 text-xs">
                                    <span className="text-yellow-600 dark:text-yellow-400 font-bold">
                                      {s.gialli}
                                    </span>{" "}
                                    /{" "}
                                    <span className="text-rose-600 dark:text-rose-400 font-bold">
                                      {s.rossi}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                          {/* Career Summary Footer */}
                          <tfoot className="bg-muted/60 border-t-2 border-border font-bold">
                            <tr>
                              <td className="p-3" colSpan={3}>
                                TOTALE CARRIERA ({selectedPlayer.stagioni_rosa} stagioni a roster,{" "}
                                {selectedPlayer.stagioni_giocate} giocate)
                              </td>
                              <td className="text-center p-3">
                                {selectedPlayer.presenze} ({selectedPlayer.titolare})
                              </td>
                              <td className="text-center p-3 font-mono">
                                {selectedPlayer.minuti.toLocaleString()}'
                              </td>
                              <td className="text-center p-3 text-primary">
                                {selectedPlayer.media_voto
                                  ? selectedPlayer.media_voto.toFixed(2)
                                  : "—"}
                              </td>
                              <td className="text-center p-3">
                                {selectedPlayer.presenze_capitano > 0
                                  ? `© ${selectedPlayer.presenze_capitano}`
                                  : "—"}
                              </td>
                              <td className="text-center p-3 text-emerald-600 dark:text-emerald-400">
                                {selectedPlayer.gol}
                              </td>
                              <td className="text-center p-3 text-blue-600 dark:text-blue-400">
                                {selectedPlayer.assist}
                              </td>
                              <td className="text-center p-3 text-xs">
                                {selectedPlayer.tiri_in}/{selectedPlayer.tiri_tot}
                              </td>
                              <td className="text-center p-3 text-xs">
                                {selectedPlayer.pass_si}/{selectedPlayer.pass_tot} (
                                {pct(selectedPlayer.pass_si, selectedPlayer.pass_tot)})
                              </td>
                              <td className="text-center p-3 text-xs">
                                {selectedPlayer.drib_si}/{selectedPlayer.drib_tot} (
                                {pct(selectedPlayer.drib_si, selectedPlayer.drib_tot)})
                              </td>
                              <td className="text-center p-3 text-xs">
                                {selectedPlayer.ctrs_si}/{selectedPlayer.ctrs_tot}
                              </td>
                              {selectedPlayer.posiz === "POR" && (
                                <>
                                  <td className="text-center p-3">{selectedPlayer.parate}</td>
                                  <td className="text-center p-3 text-xs">
                                    {selectedPlayer.gol_subiti} sub / {selectedPlayer.clean_sheets} CS
                                  </td>
                                </>
                              )}
                              <td className="text-center p-3 text-xs">
                                {selectedPlayer.gialli} / {selectedPlayer.rossi}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )}
                  </TabsContent>

                  {/* TAB 2: CRONISTORIA & MOVIMENTI (Foglio Giocatori) */}
                  <TabsContent value="movimenti" className="mt-0">
                    {loadingDetail ? (
                      <div className="py-12 text-center text-muted-foreground">
                        Caricamento movimenti storici...
                      </div>
                    ) : !playerDetail?.transactions.length ? (
                      <div className="py-12 text-center text-muted-foreground">
                        Nessun movimento registrato in cronistoria per questo giocatore.
                      </div>
                    ) : (
                      <div className="relative pl-6 border-l-2 border-primary/30 space-y-4 my-2">
                        {playerDetail.transactions.map((tx: PlayerTransaction) => (
                          <div
                            key={tx.id}
                            className="relative bg-muted/25 hover:bg-muted/40 border border-border/60 rounded-xl p-4 transition-colors"
                          >
                            <div className="absolute -left-[31px] top-5 h-3.5 w-3.5 rounded-full bg-primary border-2 border-background" />
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="flex items-center gap-2.5 flex-wrap">
                                <Badge variant="outline" className="font-black text-xs">
                                  Stagione {tx.stagione}
                                </Badge>
                                {getMotivoBadge(tx.motivo, tx.draft_pick)}
                                {tx.tx_date && (
                                  <span className="text-xs text-muted-foreground font-mono">
                                    📅 {tx.tx_date} {tx.tx_time ? `• 🕒 ${tx.tx_time.slice(0, 5)}` : ""}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="mt-3 flex items-center gap-3 flex-wrap">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">Da:</span>
                                <HistoricalTeamBadge teamCode={tx.prev_team} />
                              </div>
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">A:</span>
                                <HistoricalTeamBadge teamCode={tx.new_team} />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  {/* TAB 3: TOTALI CARRIERA */}
                  <TabsContent value="carriera" className="mt-0">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      <StatBox
                        label="Presenze Totali"
                        value={selectedPlayer.presenze}
                        subValue={`${selectedPlayer.titolare} da titolare`}
                        highlight
                      />
                      <StatBox
                        label="Minuti Giocati"
                        value={selectedPlayer.minuti.toLocaleString()}
                        subValue={`${selectedPlayer.stagioni_giocate} stagioni giocate`}
                      />
                      <StatBox
                        label="Media Voto"
                        value={selectedPlayer.media_voto ? selectedPlayer.media_voto.toFixed(2) : "—"}
                        subValue={selectedPlayer.motm > 0 ? `${selectedPlayer.motm}x MOTM` : undefined}
                        highlight
                      />
                      <StatBox
                        label="Presenze Capitano"
                        value={selectedPlayer.presenze_capitano}
                        subValue="Fascia al braccio"
                      />
                      <StatBox label="Gol" value={selectedPlayer.gol} highlight={selectedPlayer.gol > 0} />
                      <StatBox
                        label="Assist"
                        value={selectedPlayer.assist}
                        highlight={selectedPlayer.assist > 0}
                      />
                      <StatBox
                        label="Partecipazione Gol"
                        value={selectedPlayer.gol + selectedPlayer.assist}
                        subValue="Gol + Assist"
                      />
                      <StatBox
                        label="Tiri in Porta"
                        value={`${selectedPlayer.tiri_in}/${selectedPlayer.tiri_tot}`}
                        subValue={pct(selectedPlayer.tiri_in, selectedPlayer.tiri_tot)}
                      />
                      <StatBox
                        label="Passaggi Riusciti"
                        value={`${selectedPlayer.pass_si}/${selectedPlayer.pass_tot}`}
                        subValue={pct(selectedPlayer.pass_si, selectedPlayer.pass_tot)}
                      />
                      <StatBox
                        label="Dribbling Riusciti"
                        value={`${selectedPlayer.drib_si}/${selectedPlayer.drib_tot}`}
                        subValue={pct(selectedPlayer.drib_si, selectedPlayer.drib_tot)}
                      />
                      <StatBox
                        label="Cross Riusciti"
                        value={`${selectedPlayer.cros_si}/${selectedPlayer.cros_tot}`}
                        subValue={pct(selectedPlayer.cros_si, selectedPlayer.cros_tot)}
                      />
                      <StatBox
                        label="Contrasti Vinti"
                        value={`${selectedPlayer.ctrs_si}/${selectedPlayer.ctrs_tot}`}
                        subValue={pct(selectedPlayer.ctrs_si, selectedPlayer.ctrs_tot)}
                      />
                      {selectedPlayer.posiz === "POR" && (
                        <>
                          <StatBox label="Parate" value={selectedPlayer.parate} />
                          <StatBox
                            label="Gol Subiti / Clean Sheet"
                            value={`${selectedPlayer.gol_subiti} / ${selectedPlayer.clean_sheets}`}
                            subValue="Portiere"
                          />
                        </>
                      )}
                      <StatBox label="Autogol" value={selectedPlayer.autogol} />
                      <StatBox label="Falli Commessi" value={selectedPlayer.falli} />
                      <StatBox
                        label="Ammonizioni / Espulsioni"
                        value={`${selectedPlayer.gialli} 🟨 / ${selectedPlayer.rossi} 🟥`}
                      />
                      <StatBox label="Fuorigioco" value={selectedPlayer.fuorigioco} />
                    </div>
                  </TabsContent>

                  {/* TAB 4: PALMARÈS & BACHECA TROFEI */}
                  <TabsContent value="palmares" className="mt-0 space-y-4">
                    <PlayerPalmaresTab palmares={playerPalmares} isLoading={loadingPalmares} />
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>
          </div>
        ) : (
          /* DIRECTORY VIEW: ALL 660 PLAYERS WITH FILTERS & SORTING */
          <div className="space-y-6">
            {/* Filters Card */}
            <Card className="shadow-md border-border/80">
              <CardContent className="p-4 sm:p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {/* Search */}
                  <div className="relative sm:col-span-2 lg:col-span-1">
                    <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      placeholder="Cerca nome, cognome o ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>

                  {/* Status Filter */}
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Stato Carriera" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Tutti gli Stati ({allPlayers.length})</SelectItem>
                      <SelectItem value="ACTIVE_A">In Attività (Serie A)</SelectItem>
                      <SelectItem value="RETIRED">Ritirati</SelectItem>
                      <SelectItem value="FREE_AGENT">Svincolati</SelectItem>
                      <SelectItem value="SERIE_B">Serie B</SelectItem>
                      <SelectItem value="HOF">🌟 Membri Hall of Fame</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Role Filter */}
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Reparto / Ruolo" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_GROUPS.map((g) => (
                        <SelectItem key={g.id} value={g.id}>
                          {g.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Historical / Current Franchise Filter */}
                  <Select value={franchiseFilter} onValueChange={setFranchiseFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Franchigia Storica" />
                    </SelectTrigger>
                    <SelectContent>
                      {FRANCHISE_FILTER_OPTIONS.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Sort By */}
                  <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Ordina per..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="presenze">Ordina per: Presenze All-Time</SelectItem>
                      <SelectItem value="minuti">Ordina per: Minuti Giocati</SelectItem>
                      <SelectItem value="gol">Ordina per: Gol Segnati</SelectItem>
                      <SelectItem value="assist">Ordina per: Assist</SelectItem>
                      <SelectItem value="media_voto">Ordina per: Media Voto (min. 5 pres)</SelectItem>
                      <SelectItem value="capitano">Ordina per: Presenze da Capitano</SelectItem>
                      <SelectItem value="ovr">Ordina per: Overall (OVR)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                  <span>
                    Trovati <strong className="text-foreground">{filteredPlayers.length}</strong> calciatori nell'archivio storico
                  </span>
                  {(searchQuery || statusFilter !== "ALL" || roleFilter !== "ALL" || franchiseFilter !== "ALL") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => {
                        setSearchQuery("");
                        setStatusFilter("ALL");
                        setRoleFilter("ALL");
                        setFranchiseFilter("ALL");
                      }}
                    >
                      Reimposta filtri
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Directory Table */}
            <Card className="shadow-lg border-border/80 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="text-left p-3 font-bold">Calciatore</th>
                      <th className="text-center p-3 font-bold">Ruolo</th>
                      <th className="text-center p-3 font-bold">OVR</th>
                      <th className="text-left p-3 font-bold">Stato Attuale</th>
                      <th className="text-left p-3 font-bold">Carriera & Squadre Storiche</th>
                      <th className="text-center p-3 font-bold">Stag.</th>
                      <th className="text-center p-3 font-bold">Pres (Tit)</th>
                      <th className="text-center p-3 font-bold">Min</th>
                      <th className="text-center p-3 font-bold">MV</th>
                      <th className="text-center p-3 font-bold">Gol</th>
                      <th className="text-center p-3 font-bold">Assist</th>
                      <th className="text-center p-3 font-bold">© Cap</th>
                      <th className="text-right p-3 font-bold">Scheda</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingPlayers ? (
                      <tr>
                        <td colSpan={13} className="py-16 text-center text-muted-foreground">
                          Caricamento archivio storico in corso...
                        </td>
                      </tr>
                    ) : filteredPlayers.length === 0 ? (
                      <tr>
                        <td colSpan={13} className="py-16 text-center text-muted-foreground">
                          Nessun calciatore trovato con i filtri selezionati.
                        </td>
                      </tr>
                    ) : (
                      filteredPlayers.slice(0, 150).map((p) => {
                        const distinctTeams = Array.from(new Set(p.season_teams));
                        return (
                          <tr
                            key={p.player_id}
                            onClick={() => handleSelectPlayer(p.player_id)}
                            className="border-b border-border/50 hover:bg-muted/40 transition-colors cursor-pointer group"
                          >
                            <td className="p-3">
                              <div className="flex items-center gap-3">
                                <img
                                  src={getPlayerImage(p.player_id)}
                                  alt={`${p.nome} ${p.cognome}`}
                                  className="h-10 w-10 rounded-lg object-cover border border-border shrink-0"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = "/placeholder.svg";
                                  }}
                                />
                                <div>
                                  <div className="font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                                    <span>
                                      {p.cognome}, {p.nome}
                                    </span>
                                    {p.is_hof && (
                                      <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500 shrink-0" />
                                    )}
                                  </div>
                                  <span className="text-[11px] text-muted-foreground font-mono">
                                    #{p.player_id}
                                    {p.draft_pick ? ` • Pick #${p.draft_pick} (S${p.draft_stag})` : ""}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="text-center p-3">
                              <Badge variant="outline" className={`${getRoleColor(p.posiz)} font-bold text-xs`}>
                                {p.posiz}
                              </Badge>
                            </td>
                            <td className="text-center p-3">
                              <span className={`font-black ${getValueColor(p.ovr)}`}>{p.ovr}</span>
                            </td>
                            <td className="p-3">{renderPlayerStatusBadge(p)}</td>
                            <td className="p-3">
                              <div className="flex items-center gap-1 flex-wrap max-w-xs">
                                {distinctTeams.length > 0 ? (
                                  distinctTeams.map((t) => (
                                    <HistoricalTeamBadge
                                      key={t}
                                      teamCode={t}
                                      showFranchiseHint={false}
                                    />
                                  ))
                                ) : (
                                  <span className="text-xs text-muted-foreground">—</span>
                                )}
                              </div>
                            </td>
                            <td className="text-center p-3 font-medium">
                              {p.stagioni_rosa > 0 ? (
                                <span title={`S${p.first_stag} - S${p.last_stag}`}>
                                  {p.stagioni_rosa}
                                </span>
                              ) : (
                                "0"
                              )}
                            </td>
                            <td className="text-center p-3 font-bold">
                              {p.presenze}{" "}
                              <span className="text-xs text-muted-foreground font-normal">
                                ({p.titolare})
                              </span>
                            </td>
                            <td className="text-center p-3 font-mono text-xs">
                              {p.minuti.toLocaleString()}'
                            </td>
                            <td className="text-center p-3 font-black text-primary">
                              {p.media_voto ? p.media_voto.toFixed(2) : "—"}
                            </td>
                            <td className="text-center p-3 font-bold text-emerald-600 dark:text-emerald-400">
                              {p.gol}
                            </td>
                            <td className="text-center p-3 font-bold text-blue-600 dark:text-blue-400">
                              {p.assist}
                            </td>
                            <td className="text-center p-3">
                              {p.presenze_capitano > 0 ? (
                                <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 font-bold text-xs">
                                  © {p.presenze_capitano}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground/40">—</span>
                              )}
                            </td>
                            <td className="text-right p-3">
                              <Button variant="ghost" size="sm" className="h-8 text-xs font-bold gap-1">
                                Carriera
                                <ChevronRight className="h-3.5 w-3.5" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              {filteredPlayers.length > 150 && (
                <div className="p-3 text-center text-xs text-muted-foreground bg-muted/30 border-t border-border">
                  Visualizzati i primi 150 risultati su {filteredPlayers.length}. Usa la barra di ricerca o i filtri sopra per affinare la selezione.
                </div>
              )}
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default ArchivioGiocatori;

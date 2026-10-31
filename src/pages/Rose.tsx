import { useState, useMemo, useRef, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Users,
  Search,
  LayoutGrid,
  List,
  Tag,
  ShieldCheck,
  Trophy,
  User,
  Shield,
  X,
  ChevronRight,
  RotateCcw,
  Volume2,
  VolumeX,
  Pause,
} from "lucide-react";
import {
  getRoleColor,
  getValueColor,
  getNationalityFlag,
  getTeamBackground,
  getPlayerImage,
} from "@/utils/functions";
import { getTeams } from "@/hooks/use-teams";
import { Player } from "@/types/player";
import { Team } from "@/types/team";
import PlayerDetails from "@/components/player/playerDetails";
import {
  getMarketStatusCode,
  getMarketStatusOption,
} from "@/types/marketStatus";

// Role Priority sorting order (matches Roster page)
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

const ROLE_GROUPS = [
  { id: "ALL", label: "Tutti i Ruoli", roles: [] as string[] },
  { id: "POR", label: "Portieri", roles: ["POR"] },
  { id: "DIF", label: "Difensori", roles: ["DC", "TD", "TS"] },
  { id: "CEN", label: "Centrocampisti", roles: ["CDC", "CC", "ED", "ES", "COC"] },
  { id: "ATT", label: "Attaccanti", roles: ["AD", "AS", "ATT"] },
];

// Known teams with an official anthem available in public/sounds
const KNOWN_ANTHEMS = new Set(["ACD", "APD", "COS", "MAR", "PFC", "SKA", "ASK"]);

const Rose = () => {
  const { teams, loading: loadingTeams, refetch: refetchTeams } = getTeams();

  // Sort teams alphabetically by name
  const sortedTeams = useMemo(() => {
    return teams.slice().sort((a, b) => a.NAME.localeCompare(b.NAME));
  }, [teams]);

  // Selected Team state
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const activeTeamId = selectedTeamId || sortedTeams[0]?.TEAM_ID || "";
  const currentTeam: Team | undefined = useMemo(() => {
    return sortedTeams.find((t) => t.TEAM_ID === activeTeamId) || sortedTeams[0];
  }, [sortedTeams, activeTeamId]);

  // Audio Anthem Player state
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlayingAnthem, setIsPlayingAnthem] = useState<boolean>(false);

  // Stop anthem playback when team changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlayingAnthem(false);
  }, [currentTeam?.TEAM_ID]);

  // Clean up audio element on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
    };
  }, []);

  const hasAnthem = currentTeam ? KNOWN_ANTHEMS.has(currentTeam.TEAM_ID) : false;

  const handleToggleAnthem = () => {
    if (!currentTeam || !hasAnthem) return;

    if (isPlayingAnthem && audioRef.current) {
      audioRef.current.pause();
      setIsPlayingAnthem(false);
      return;
    }

    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    const audio = audioRef.current;
    const anthemPath = `/sounds/${currentTeam.TEAM_ID}.mp3`;

    if (!audio.src.endsWith(anthemPath)) {
      audio.src = anthemPath;
    }

    // Moderate/contained volume
    audio.volume = 0.25;

    audio.onended = () => {
      setIsPlayingAnthem(false);
    };

    audio.onerror = () => {
      setIsPlayingAnthem(false);
    };

    audio
      .play()
      .then(() => {
        setIsPlayingAnthem(true);
      })
      .catch((err) => {
        console.warn("Impossibile riprodurre l'inno della squadra:", err);
        setIsPlayingAnthem(false);
      });
  };

  // View & Filter states
  const [viewLayout, setViewLayout] = useState<"grid" | "table">("grid");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  // Raw players of the selected team
  const rawPlayers: Player[] = currentTeam?.players || [];

  // Filtered and sorted players
  const filteredPlayers = useMemo(() => {
    return rawPlayers
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
        const rp = (ROLE_PRIORITY[a.Posiz] ?? 99) - (ROLE_PRIORITY[b.Posiz] ?? 99);
        if (rp !== 0) return rp;
        return (b.OVR ?? 0) - (a.OVR ?? 0);
      });
  }, [rawPlayers, roleFilter, searchQuery]);

  // Telemetry KPIs for the current team
  const avgOvr = useMemo(() => {
    if (rawPlayers.length === 0) return 0;
    return Math.round(
      rawPlayers.reduce((sum, p) => sum + (p.OVR ?? 0), 0) / rawPlayers.length
    );
  }, [rawPlayers]);

  const avgAge = useMemo(() => {
    if (rawPlayers.length === 0) return "0.0";
    const sum = rawPlayers.reduce((acc, p) => acc + (Number(p.Età) || 0), 0);
    return (sum / rawPlayers.length).toFixed(1);
  }, [rawPlayers]);

  const assignedNumbersCount = useMemo(() => {
    return rawPlayers.filter(
      (p) => p.NumeroMaglia !== null && p.NumeroMaglia !== undefined
    ).length;
  }, [rawPlayers]);

  const marketCounts = useMemo(() => {
    let defined = 0;
    let cedCount = 0;
    for (const p of rawPlayers) {
      const code = getMarketStatusCode(p.MarketStatus);
      if (code) {
        defined++;
        if (code === "ced") cedCount++;
      }
    }
    return { defined, cedCount };
  }, [rawPlayers]);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <Navbar />

      <main className="container mx-auto px-4 py-6 sm:py-8 space-y-6">
        {/* BROADCAST HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-border/80">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                LCSIM Ufficiale • Serie A
              </span>
              <span className="text-xs text-muted-foreground">
                {sortedTeams.length} Club Professionistici
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight flex items-center gap-3">
              <Users className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              Rose Complete
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Organici ufficiali, schede tecniche e disponibilità di mercato di tutte le squadre della lega.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchTeams()}
              disabled={loadingTeams}
              className="h-8 px-2.5 rounded-xl text-xs gap-1.5 border-border/80 bg-card hover:bg-muted"
              title="Ricarica le rose aggiornate dal database"
            >
              <RotateCcw className={`h-3.5 w-3.5 ${loadingTeams ? "animate-spin text-emerald-500" : "text-muted-foreground"}`} />
              <span>Aggiorna Rose</span>
            </Button>
            <div className="px-3.5 py-1.5 rounded-xl border border-border/80 bg-card text-xs flex items-center gap-2 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-muted-foreground">Stagione Attiva:</span>
              <span className="font-semibold text-foreground font-mono">
                2024/25
              </span>
            </div>
          </div>
        </div>

        {/* TEAM SELECTOR SYMMETRIC GRID (2 ROWS OF 6 ON DESKTOP, 3 ROWS OF 4 ON TABLET) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Seleziona Squadra:
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              {sortedTeams.length} Club in Serie A
            </span>
          </div>

          {loadingTeams ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-2.5">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="h-11 bg-muted/40 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-2.5">
              {sortedTeams.map((team) => {
                const isSelected = team.TEAM_ID === currentTeam?.TEAM_ID;
                return (
                  <button
                    key={team.TEAM_ID}
                    type="button"
                    onClick={() => {
                      setSelectedTeamId(team.TEAM_ID);
                      setSearchQuery("");
                      setRoleFilter("ALL");
                    }}
                    title={`${team.NAME} (${team.players.length} giocatori)`}
                    className={`group flex items-center justify-between gap-1.5 px-2.5 py-2 sm:px-3 sm:py-2.5 rounded-xl border text-xs font-bold transition-all duration-200 cursor-pointer min-w-0 ${
                      isSelected
                        ? "bg-emerald-600 text-white border-emerald-500 shadow-md ring-2 ring-emerald-500/30"
                        : "bg-card border-border/80 text-foreground hover:bg-muted/60 hover:border-border"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={`/images/teams/${team.TEAM_ID}_Logo.png`}
                        alt={`${team.NAME} Logo`}
                        className="h-6 w-6 sm:h-7 sm:w-7 object-contain shrink-0 group-hover:scale-110 transition-transform"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/images/LCSIM_Logo_SMALL.png";
                        }}
                      />
                      <span className="truncate font-extrabold tracking-tight text-left text-[11px] sm:text-xs">
                        {team.NAME}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full font-bold shrink-0 ${
                        isSelected
                          ? "bg-white/20 text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {team.players.length}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* TEAM HERO COMMAND CARD */}
        {currentTeam && (
          <Card
            className={`overflow-hidden border border-border/80 shadow-lg ${getTeamBackground(
              currentTeam.TEAM_ID
            )}`}
          >
            <div className="p-6 bg-gradient-to-r from-card/85 via-card/70 to-card/90 backdrop-blur-md">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                {/* Team Identity */}
                <div className="flex items-center gap-4 sm:gap-5">
                  <img
                    src={`/images/teams/${currentTeam.TEAM_ID}_Logo.png`}
                    alt={`${currentTeam.NAME} Logo`}
                    className="h-20 w-20 sm:h-24 sm:w-24 object-contain drop-shadow-md shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/images/LCSIM_Logo_SMALL.png";
                    }}
                  />
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30">
                        Serie A
                      </span>
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {currentTeam.TEAM_ID}
                      </Badge>
                      {currentTeam.MANAGER && (
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md border border-border/60">
                          <User className="h-3 w-3 text-emerald-500" />
                          <span>Manager: <strong>{currentTeam.MANAGER}</strong></span>
                        </div>
                      )}
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                      {currentTeam.NAME}
                    </h2>

                    {/* Palmares and Team Anthem */}
                    <div className="flex items-center gap-2.5 pt-1 flex-wrap">
                      {currentTeam.scudetto > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/15 px-2.5 py-0.5 rounded-md border border-amber-500/30">
                          <Trophy className="h-3.5 w-3.5" />
                          {currentTeam.scudetto}{" "}
                          {currentTeam.scudetto === 1 ? "Scudetto" : "Scudetti"}
                        </span>
                      )}
                      {currentTeam.supercoppa > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-500/15 px-2.5 py-0.5 rounded-md border border-blue-500/30">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          {currentTeam.supercoppa}{" "}
                          {currentTeam.supercoppa === 1 ? "Supercoppa" : "Supercoppe"}
                        </span>
                      )}

                      {/* Anthem Audio Button */}
                      {hasAnthem ? (
                        <button
                          type="button"
                          onClick={handleToggleAnthem}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold transition-all duration-200 border cursor-pointer select-none shadow-sm ${
                            isPlayingAnthem
                              ? "bg-emerald-500 text-white border-emerald-400 dark:bg-emerald-600 dark:border-emerald-500 shadow-emerald-500/20"
                              : "bg-card/90 hover:bg-muted text-foreground border-border hover:border-emerald-500/50"
                          }`}
                          title={
                            isPlayingAnthem
                              ? `Metti in pausa l'inno di ${currentTeam.NAME}`
                              : `Ascolta l'inno ufficiale di ${currentTeam.NAME}`
                          }
                          aria-label={
                            isPlayingAnthem
                              ? `Metti in pausa l'inno di ${currentTeam.NAME}`
                              : `Ascolta l'inno ufficiale di ${currentTeam.NAME}`
                          }
                        >
                          {isPlayingAnthem ? (
                            <>
                              <Pause className="h-3.5 w-3.5 shrink-0 fill-current" />
                              <span>Inno in Riproduzione</span>
                              <span className="flex items-center gap-0.5 ml-1">
                                <span className="w-1 h-2.5 bg-white rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                <span className="w-1 h-3.5 bg-white rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                <span className="w-1 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                              </span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                              <span>Inno Ufficiale</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span
                              tabIndex={0}
                              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-muted/40 text-muted-foreground/60 border border-border/40 cursor-not-allowed select-none"
                            >
                              <VolumeX className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
                              <span>Inno non disponibile</span>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs">
                            Inno ufficiale non ancora disponibile per questo club
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                </div>

                {/* Telemetry KPI Widgets */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-2.5 sm:gap-3 shrink-0">
                  <div className="px-3.5 py-2 rounded-xl bg-card border border-border/80 text-center shadow-sm">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                      Giocatori
                    </span>
                    <span className="text-xl sm:text-2xl font-black font-mono text-foreground">
                      {rawPlayers.length}
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
                      Status Mercato
                    </span>
                    <span className="text-xl sm:text-2xl font-black font-mono text-foreground">
                      {marketCounts.defined}/{rawPlayers.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* CONTROLS & FILTERS BAR */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* ROLE FILTER PILLS BAR */}
            <div className="flex flex-wrap gap-1.5">
              {ROLE_GROUPS.map((g) => {
                const count =
                  g.id === "ALL"
                    ? rawPlayers.length
                    : rawPlayers.filter((p) => g.roles.includes(p.Posiz)).length;

                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setRoleFilter(g.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      roleFilter === g.id
                        ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 shadow-sm"
                        : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted/40"
                    }`}
                  >
                    <span>{g.label}</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                        roleFilter === g.id
                          ? "bg-emerald-600 text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* SEARCH & LAYOUT TOGGLE */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
                <Input
                  placeholder="Cerca giocatore o #..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 w-[180px] sm:w-[220px] pl-8 text-xs"
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
            </div>
          </div>
        </div>

        {/* PLAYERS LIST (GRID OR TABLE) */}
        {filteredPlayers.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground">
            Nessun giocatore trovato con questi filtri.
          </Card>
        ) : viewLayout === "grid" ? (
          /* GRID VIEW (SCHEDE STILE EA FC) */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {filteredPlayers.map((player) => {
              const marketOpt = getMarketStatusOption(player.MarketStatus);

              return (
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
                          className={`absolute -bottom-1 -right-1 h-6 min-w-[24px] px-1 rounded-md flex items-center justify-center font-mono font-black text-xs border shadow ${
                            player.NumeroMaglia
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

                      {/* Player Identity */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
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
                        <div className="mt-2 flex items-center gap-1.5">
                          {marketOpt ? (
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${marketOpt.badgeClass}`}
                              title={`Status di mercato: ${marketOpt.label} — ${marketOpt.description}`}
                            >
                              <Tag className="h-2.5 w-2.5" />
                              {marketOpt.label}
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border border-dashed border-border/70 text-muted-foreground/60"
                              title="Nessuno status di mercato impostato"
                            >
                              <Tag className="h-2.5 w-2.5 opacity-40" />
                              Non specificato
                            </span>
                          )}
                        </div>
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
                    <span className="text-[11px] text-muted-foreground font-mono">
                      XP: {player.XP ?? 0}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedPlayer(player)}
                      className="h-7 text-xs font-semibold hover:text-emerald-600 gap-1"
                    >
                      <span>Scheda Completa</span>
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          /* TABLE VIEW (TABELLA COMPATTA) */
          <Card className="border border-border/80 shadow-md overflow-hidden bg-card">
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                <thead>
                  <tr className="border-b border-border bg-muted/50 text-[11px] font-bold uppercase text-muted-foreground tracking-wider select-none">
                    <th className="py-3 px-2 text-center w-12">#</th>
                    <th className="py-3 px-3">Giocatore</th>
                    <th className="py-3 px-2 text-center w-14">Ruolo</th>
                    <th className="py-3 px-2 text-center w-14">OVR</th>
                    <th className="py-3 px-2 text-center w-14">Età</th>
                    <th className="py-3 px-2 text-center w-16">Altezza</th>
                    <th className="py-3 px-2 text-center w-14">Piede</th>
                    <th className="py-3 px-2 text-center w-14">XP</th>
                    <th className="py-3 px-3 text-center w-36">Status Mercato</th>
                    <th className="py-3 px-3 text-right">Azione</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredPlayers.map((player) => {
                    const marketOpt = getMarketStatusOption(player.MarketStatus);

                    return (
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

                        {/* XP */}
                        <td className="py-2.5 px-2 text-center font-mono text-muted-foreground">
                          {player.XP ?? 0}
                        </td>

                        {/* Market Status */}
                        <td className="py-2.5 px-3 text-center">
                          {marketOpt ? (
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${marketOpt.badgeClass}`}
                            >
                              <Tag className="h-2.5 w-2.5" />
                              {marketOpt.label}
                            </span>
                          ) : (
                            <span className="text-[10px] text-muted-foreground/50 italic">
                              Non specificato
                            </span>
                          )}
                        </td>

                        {/* Action */}
                        <td className="py-2.5 px-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs font-semibold group-hover:text-emerald-600"
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
            </CardContent>
          </Card>
        )}
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
    </div>
  );
};

export default Rose;

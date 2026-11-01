function formatCoachDisplay(name?: string | null): string {
  if (!name) return "";
  const trimmed = name.trim();
  if (/^(mister|sig\.?|mr\.?)\b/i.test(trimmed)) {
    return trimmed;
  }
  return `Mister ${trimmed}`;
}

import { useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  X,
  MapPin,
  BarChart3,
  Users,
  Trophy,
  Shield,
  Activity,
  Shirt,
  Sparkles,
} from "lucide-react";
import {
  PLAYER_EXTRA_STAT_CATEGORIES,
  KNOWN_PLAYER_EXTRA_KEYS,
  formatExtraStatLabel,
} from "@/services/matchStatsImportService";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Schedule } from "@/types/schedule";
import { MatchStats } from "@/types/teamStats";
import { PlayerStats } from "@/types/playerStats";
import {
  getRoleColor,
  getValueColor,
  getWeatherIcon,
  getPlayerImage,
  getTeamBackground,
} from "@/utils/functions";
import { useSchedule } from "@/context/ScheduleContext";
import { useTheme } from "next-themes";
import { getMatchStatsColors } from "@/utils/teamColors";
import { SUPABASE_STORAGE_URL } from "@/constants/App";

// Function to compute pitch coordinates for 11 starters
function computePitchCoordinates(
  starters: PlayerStats[]
): { player: PlayerStats; x: string; y: string }[] {
  const getEffPos = (p: PlayerStats) =>
    p.POS_GIOCATA && p.POS_GIOCATA !== "SOS" ? p.POS_GIOCATA : p.Posiz;

  const gk = starters.find((p) => getEffPos(p) === "POR" || p.Posiz === "POR") || starters[0];
  const others = starters.filter((p) => p !== gk);

  const defenders = others.filter((p) => ["DC", "DCD", "DCS", "TD", "TS", "ASA", "ADA"].includes(getEffPos(p)));
  const midfielders = others.filter((p) =>
    ["CDC", "CDD", "CDS", "CC", "CCD", "CCS", "ED", "ES", "COC", "COD", "COS"].includes(getEffPos(p))
  );
  const forwards = others.filter((p) =>
    ["ATT", "AT", "AS", "AD", "PD", "PS"].includes(getEffPos(p))
  );

  const remaining = others.filter(
    (p) =>
      !defenders.includes(p) &&
      !midfielders.includes(p) &&
      !forwards.includes(p)
  );
  if (remaining.length > 0) {
    midfielders.push(...remaining);
  }

  const result: { player: PlayerStats; x: string; y: string }[] = [];

  // 1. Goalkeeper
  if (gk) {
    result.push({ player: gk, x: "50%", y: "91%" });
  }

  // Spacing helper
  const getXCoords = (count: number): string[] => {
    switch (count) {
      case 1:
        return ["50%"];
      case 2:
        return ["30%", "70%"];
      case 3:
        return ["20%", "50%", "80%"];
      case 4:
        return ["15%", "38%", "62%", "85%"];
      case 5:
        return ["12%", "30%", "50%", "70%", "88%"];
      default:
        return Array.from(
          { length: count },
          (_, i) => `${Math.round(15 + (70 / (count - 1 || 1)) * i)}%`
        );
    }
  };

  // 2. Defenders
  const defXs = getXCoords(defenders.length);
  defenders.forEach((p, i) => {
    const isCentral = defenders.length === 4 && (i === 1 || i === 2);
    result.push({ player: p, x: defXs[i], y: isCentral ? "79%" : "75%" });
  });

  // 3. Midfielders
  const cdcList = midfielders.filter((p) => ["CDC", "CDD", "CDS"].includes(getEffPos(p)));
  const cocList = midfielders.filter((p) => ["COC", "COD", "COS"].includes(getEffPos(p)));
  const centralMidList = midfielders.filter(
    (p) => !["CDC", "CDD", "CDS", "COC", "COD", "COS"].includes(getEffPos(p))
  );

  if (cdcList.length > 0 && cocList.length > 0) {
    const cdcXs = getXCoords(cdcList.length);
    cdcList.forEach((p, i) =>
      result.push({ player: p, x: cdcXs[i], y: "63%" })
    );

    const midXs = getXCoords(centralMidList.length);
    centralMidList.forEach((p, i) =>
      result.push({ player: p, x: midXs[i], y: "49%" })
    );

    const cocXs = getXCoords(cocList.length);
    cocList.forEach((p, i) =>
      result.push({ player: p, x: cocXs[i], y: "34%" })
    );
  } else if (cdcList.length > 0) {
    const cdcXs = getXCoords(cdcList.length);
    cdcList.forEach((p, i) =>
      result.push({ player: p, x: cdcXs[i], y: "63%" })
    );

    const midXs = getXCoords(centralMidList.concat(cocList).length);
    centralMidList.concat(cocList).forEach((p, i) =>
      result.push({ player: p, x: midXs[i], y: "47%" })
    );
  } else if (cocList.length > 0) {
    const midXs = getXCoords(centralMidList.length);
    centralMidList.forEach((p, i) =>
      result.push({ player: p, x: midXs[i], y: "52%" })
    );

    const cocXs = getXCoords(cocList.length);
    cocList.forEach((p, i) =>
      result.push({ player: p, x: cocXs[i], y: "34%" })
    );
  } else {
    const midXs = getXCoords(midfielders.length);
    midfielders.forEach((p, i) =>
      result.push({ player: p, x: midXs[i], y: "50%" })
    );
  }

  // 4. Forwards
  const fwdXs = getXCoords(forwards.length);
  forwards.forEach((p, i) => {
    const isWinger = getEffPos(p) === "AS" || getEffPos(p) === "AD";
    result.push({ player: p, x: fwdXs[i], y: isWinger ? "22%" : "14%" });
  });

  return result;
}

const Calendario = () => {
  const { schedule, loaded, season, setSeason } = useSchedule();
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme !== "light";

  // Active selected week state (defaults to 1)
  const [activeWeek, setActiveWeek] = useState<number>(1);

  // Selected match for modal detail
  const [selected, setSelected] = useState<{
    week: number;
    match: MatchStats;
  } | null>(null);

  // Active sub-tab inside the match detail modal
  const [modalTab, setModalTab] = useState<"lineup" | "stats" | "players">(
    "lineup"
  );

  // Active team in lineup view ("home" or "away")
  const [lineupTeamSide, setLineupTeamSide] = useState<"home" | "away">("home");

  // Expanded player rows in Pagelle & Giocatori tab
  const [expandedRecapPlayerIds, setExpandedRecapPlayerIds] = useState<Record<number, boolean>>({});

  const toggleExpandRecapPlayer = (playerId: number) => {
    setExpandedRecapPlayerIds((prev) => ({ ...prev, [playerId]: !prev[playerId] }));
  };

  const handleCloseModal = () => {
    setSelected(null);
    setModalTab("lineup");
    setExpandedRecapPlayerIds({});
  };

  // Find the active round
  const currentRound: Schedule | undefined = useMemo(() => {
    if (!schedule || schedule.length === 0) return undefined;
    return schedule.find((s) => s.week === activeWeek) || schedule[0];
  }, [schedule, activeWeek]);

  // Overall telemetry summary of played matches
  const telemetry = useMemo(() => {
    let totalMatches = 0;
    let playedMatches = 0;
    let totalGoals = 0;

    for (const round of schedule) {
      for (const m of round.matches) {
        totalMatches++;
        if (m.home_minuti && m.home_minuti > 0) {
          playedMatches++;
          totalGoals += (m.home_gol ?? 0) + (m.away_gol ?? 0);
        }
      }
    }

    return { totalMatches, playedMatches, totalGoals };
  }, [schedule]);

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
                Stagione 2024/25 • Calendario Ufficiale
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight flex items-center gap-3">
              <CalendarIcon className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              Calendario &amp; Risultati
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Tutti i turni di campionato, risultati ufficiali, statistiche gara e formazioni tattiche in campo.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <div className="px-3.5 py-1.5 rounded-xl border border-border/80 bg-card text-xs flex items-center gap-2 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-muted-foreground">Stagione Attiva:</span>
              <select
                value={season}
                onChange={(e) => {
                  setSeason(Number(e.target.value));
                  setActiveWeek(1);
                }}
                className="font-semibold text-foreground font-mono bg-transparent focus:outline-none cursor-pointer"
              >
                <option value={11} className="bg-card text-foreground">Stagione 11</option>
                <option value={10} className="bg-card text-foreground">Stagione 10</option>
                <option value={9} className="bg-card text-foreground">Stagione 9</option>
              </select>
            </div>
          </div>
        </div>

        {/* TELEMETRY KPI WIDGETS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
          <Card className="border border-border/80 bg-card shadow-sm p-3.5 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
              Giornata Selezionata
            </span>
            <span className="text-xl sm:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              Giornata {activeWeek}
            </span>
          </Card>

          <Card className="border border-border/80 bg-card shadow-sm p-3.5 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
              Partite Disputate
            </span>
            <span className="text-xl sm:text-2xl font-black font-mono text-foreground">
              {telemetry.playedMatches} / {telemetry.totalMatches}
            </span>
          </Card>

          <Card className="border border-border/80 bg-card shadow-sm p-3.5 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
              Gol Totali Stagione
            </span>
            <span className="text-xl sm:text-2xl font-black font-mono text-rose-600 dark:text-rose-400">
              {telemetry.totalGoals}
            </span>
          </Card>

          <Card className="border border-border/80 bg-card shadow-sm p-3.5 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
              Turni di Campionato
            </span>
            <span className="text-xl sm:text-2xl font-black font-mono text-foreground">
              {schedule.length || 9} Giornate
            </span>
          </Card>
        </div>

        {/* HORIZONTAL WEEK CAROUSEL SELECTOR */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Seleziona Turno di Campionato:
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveWeek((w) => Math.max(1, w - 1))}
                disabled={activeWeek === 1}
                className="h-7 px-2.5 text-xs gap-1"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Precedente</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setActiveWeek((w) =>
                    Math.min(schedule.length || 9, w + 1)
                  )
                }
                disabled={activeWeek === (schedule.length || 9)}
                className="h-7 px-2.5 text-xs gap-1"
              >
                <span>Successiva</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Carousel Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {schedule.map((round) => {
              const isSelected = round.week === activeWeek;
              const isPlayed =
                round.matches.length > 0 &&
                round.matches[0]?.home_minuti &&
                round.matches[0]?.home_minuti > 0;

              return (
                <button
                  key={round.week}
                  type="button"
                  onClick={() => setActiveWeek(round.week)}
                  className={`group shrink-0 flex flex-col items-start px-3.5 py-2 rounded-xl border text-left transition-all duration-200 cursor-pointer min-w-[130px] ${
                    isSelected
                      ? "bg-emerald-600 text-white border-emerald-500 shadow-md ring-2 ring-emerald-500/30 scale-[1.02]"
                      : "bg-card border-border/80 text-foreground hover:bg-muted/60 hover:border-border"
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="font-extrabold text-xs tracking-tight">
                      Giornata {round.week}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase ${
                        isPlayed
                          ? isSelected
                            ? "bg-white/20 text-white"
                            : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                          : isSelected
                          ? "bg-white/20 text-white"
                          : "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30"
                      }`}
                    >
                      {isPlayed ? "Conclusa" : "In programma"}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-mono ${
                      isSelected ? "text-emerald-100" : "text-muted-foreground"
                    }`}
                  >
                    {round.matches[0]?.date
                      ? new Date(round.matches[0].date).toLocaleDateString(
                          "it-IT",
                          { day: "2-digit", month: "short", year: "numeric" }
                        )
                      : "Da definire"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ACTIVE ROUND BOARD & MATCH CARDS */}
        {loaded ? (
          <div className="w-full py-16 flex flex-col items-center justify-center gap-3">
            <div className="h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-muted-foreground font-mono">
              Caricamento calendario e statistiche...
            </span>
          </div>
        ) : !currentRound ? (
          <Card className="p-12 text-center text-muted-foreground">
            Nessuna partita programmata per questo turno.
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Round Status Header */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-emerald-500" />
                <h2 className="text-base font-extrabold text-foreground">
                  Incontri • Giornata {currentRound.week}
                </h2>
              </div>
              <span className="text-xs text-muted-foreground">
                {currentRound.matches.length} Partite
              </span>
            </div>

            {/* Match Cards List */}
            <div className="grid grid-cols-1 gap-3.5">
              {currentRound.matches.map((match, idx) => {
                const isPlayed = match.home_minuti && match.home_minuti > 0;
                const homeGoals = match.home_gol ?? 0;
                const awayGoals = match.away_gol ?? 0;

                // Find goalscorers if played
                const homeScorers = match.home_player_stats?.filter(
                  (p) => p.GOL && p.GOL > 0
                );
                const awayScorers = match.away_player_stats?.filter(
                  (p) => p.GOL && p.GOL > 0
                );

                return (
                  <Card
                    key={idx}
                    onClick={() =>
                      setSelected({ week: currentRound.week, match })
                    }
                    className="group border border-border/80 hover:border-emerald-500/50 hover:shadow-lg transition-all duration-200 overflow-hidden bg-card cursor-pointer"
                  >
                    {/* Top match header strip */}
                    <div className="px-4 py-2 bg-muted/20 border-b border-border/60 flex items-center justify-between text-xs text-muted-foreground flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                            isPlayed
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                              : "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30"
                          }`}
                        >
                          {isPlayed ? "Terminata • Risultato Ufficiale" : "In programma"}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-medium">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {match.stadium || "Stadio Ufficiale"}
                          {match.is_neutral && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                              Neutro
                            </span>
                          )}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        {match.weather && (
                          <span className="flex items-center gap-1 font-medium">
                            {getWeatherIcon(match.weather)} {match.weather}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Main Match Fixture Row */}
                    <div className="p-4 sm:p-5">
                      <div className="grid grid-cols-[1fr_auto_1fr] gap-3 sm:gap-6 items-center">
                        {/* HOME TEAM */}
                        <div className="flex items-center gap-3 sm:gap-4 justify-end text-right min-w-0">
                          <div className="min-w-0">
                            <span className="font-extrabold text-sm sm:text-base text-foreground truncate block group-hover:text-emerald-600 transition-colors">
                              {match.home_team}
                            </span>
                            {match.home_allenatore && (
                              <span className="text-[11px] text-muted-foreground block truncate">
                                {formatCoachDisplay(match.home_allenatore)}
                              </span>
                            )}
                          </div>
                          <img
                            src={`${SUPABASE_STORAGE_URL}/images/teams/${match.home}_Logo.png`}
                            alt={`${match.home} Logo`}
                            className="h-10 w-10 sm:h-12 sm:w-12 object-contain shrink-0 drop-shadow-md group-hover:scale-105 transition-transform"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                `${SUPABASE_STORAGE_URL}/images/LCSIM_Logo_SMALL.png`;
                            }}
                          />
                        </div>

                        {/* SCORE / VS BOX */}
                        <div className="flex flex-col items-center justify-center min-w-[110px] sm:min-w-[140px] px-3 py-1.5 rounded-xl bg-muted/40 border border-border/80 text-center">
                          {isPlayed ? (
                            <div className="flex items-center gap-3 text-2xl sm:text-3xl font-black font-mono text-foreground">
                              <span
                                className={
                                  homeGoals > awayGoals
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : ""
                                }
                              >
                                {homeGoals}
                              </span>
                              <span className="text-muted-foreground/60 text-lg sm:text-xl font-light">
                                :
                              </span>
                              <span
                                className={
                                  awayGoals > homeGoals
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : ""
                                }
                              >
                                {awayGoals}
                              </span>
                            </div>
                          ) : (
                            <span className="text-lg sm:text-xl font-black text-muted-foreground tracking-widest">
                              VS
                            </span>
                          )}

                          <span className="text-[10px] uppercase font-bold text-muted-foreground mt-0.5">
                            {isPlayed
                              ? "Finale"
                              : match.date
                              ? `${new Date(match.date).toLocaleDateString(
                                  "it-IT",
                                  { day: "2-digit", month: "short" }
                                )} • ${match.match_time || "21:00"}`
                              : match.match_time || "21:00"}
                          </span>
                        </div>

                        {/* AWAY TEAM */}
                        <div className="flex items-center gap-3 sm:gap-4 justify-start text-left min-w-0">
                          <img
                            src={`${SUPABASE_STORAGE_URL}/images/teams/${match.away}_Logo.png`}
                            alt={`${match.away} Logo`}
                            className="h-10 w-10 sm:h-12 sm:w-12 object-contain shrink-0 drop-shadow-md group-hover:scale-105 transition-transform"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                `${SUPABASE_STORAGE_URL}/images/LCSIM_Logo_SMALL.png`;
                            }}
                          />
                          <div className="min-w-0">
                            <span className="font-extrabold text-sm sm:text-base text-foreground truncate block group-hover:text-emerald-600 transition-colors">
                              {match.away_team}
                            </span>
                            {match.away_allenatore && (
                              <span className="text-[11px] text-muted-foreground block truncate">
                                {formatCoachDisplay(match.away_allenatore)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Goalscorers Recap (if played) */}
                      {isPlayed && (homeScorers?.length || awayScorers?.length) ? (
                        <div className="mt-3 pt-3 border-t border-border/60 grid grid-cols-2 gap-4 text-xs font-mono">
                          <div className="text-right text-muted-foreground truncate">
                            {homeScorers?.map((p) => (
                              <span key={p.ID} className="inline-block mr-2">
                                ⚽ {p.Cognome}{" "}
                                {p.GOL > 1 ? `(${p.GOL})` : ""}
                              </span>
                            ))}
                          </div>
                          <div className="text-left text-muted-foreground truncate">
                            {awayScorers?.map((p) => (
                              <span key={p.ID} className="inline-block mr-2">
                                ⚽ {p.Cognome}{" "}
                                {p.GOL > 1 ? `(${p.GOL})` : ""}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="px-4 py-2 bg-muted/15 border-t border-border/60 flex items-center justify-between gap-2 text-xs">
                      <div className="text-[11px] text-muted-foreground font-mono">
                        {isPlayed
                          ? `Possesso: ${Math.round(
                              (match.home_poss ?? 0.5) * 100
                            )}% - ${Math.round(
                              (match.away_poss ?? 0.5) * 100
                            )}% • Tiri: ${match.home_tiri_tot ?? 0} - ${
                              match.away_tiri_tot ?? 0
                            }`
                          : "Calcio d'inizio ore 21:00"}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs font-bold gap-1 text-emerald-600 dark:text-emerald-400 hover:text-emerald-500"
                      >
                        <span>Match Center &amp; Formazioni</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* MATCH CENTER POPUP CON FORMAZIONI TATTICHE SUL CAMPO */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-2 sm:p-4 animate-in fade-in duration-200"
          onClick={handleCloseModal}
        >
          <div
            className="w-full max-w-6xl xl:max-w-7xl max-h-[96vh] flex flex-col rounded-2xl shadow-2xl border border-border/80 bg-card overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* HERO MATCH SCORE BANNER */}
            <div className="relative overflow-hidden bg-gradient-to-r from-card/90 via-card/80 to-card/90 border-b border-border/80 p-4 sm:p-5 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCloseModal}
                className="absolute top-3 right-3 h-8 w-8 rounded-full bg-background/60 hover:bg-background border border-border/60 z-20"
                aria-label="Chiudi"
              >
                <X className="h-4 w-4" />
              </Button>

              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-[10px]">
                    <Trophy className="h-3 w-3 mr-1 text-amber-500" />
                    Giornata {selected.week}
                  </Badge>
                  <Badge variant="outline" className="font-mono text-[10px]">
                    <CalendarIcon className="h-3 w-3 mr-1 text-emerald-500" />
                    {selected.match.date
                      ? `${new Date(selected.match.date).toLocaleDateString(
                          "it-IT",
                          { day: "2-digit", month: "long", year: "numeric" }
                        )}${selected.match.match_time ? ` • ${selected.match.match_time}` : ""}`
                      : "Data da definire"}
                  </Badge>
                </div>

                {/* Score Header Grid */}
                <div className="grid grid-cols-[1fr_auto_1fr] gap-4 sm:gap-8 items-center w-full max-w-2xl">
                  {/* Home Team */}
                  <div className="flex flex-col items-center text-center gap-2 min-w-0">
                    <img
                      src={`${SUPABASE_STORAGE_URL}/images/teams/${selected.match.home}_Logo.png`}
                      alt={selected.match.home_team}
                      className="h-16 w-16 sm:h-20 sm:w-20 object-contain drop-shadow-md"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          `${SUPABASE_STORAGE_URL}/images/LCSIM_Logo_SMALL.png`;
                      }}
                    />
                    <div className="min-w-0">
                      <span className="font-extrabold text-sm sm:text-base text-foreground block truncate">
                        {selected.match.home_team}
                      </span>
                      {selected.match.home_allenatore && (
                        <span className="text-[11px] text-muted-foreground block truncate">
                          {formatCoachDisplay(selected.match.home_allenatore)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Score */}
                  <div className="flex flex-col items-center justify-center min-w-[120px]">
                    {selected.match.home_minuti > 0 ? (
                      <div className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-2 rounded-2xl bg-muted/60 border border-border/80 shadow-inner">
                        <span className="text-3xl sm:text-5xl font-black font-mono text-foreground">
                          {selected.match.home_gol ?? 0}
                        </span>
                        <span className="text-muted-foreground/60 text-xl font-light">
                          :
                        </span>
                        <span className="text-3xl sm:text-5xl font-black font-mono text-foreground">
                          {selected.match.away_gol ?? 0}
                        </span>
                      </div>
                    ) : (
                      <div className="px-5 py-2.5 rounded-2xl bg-muted/50 border border-border/80">
                        <span className="text-xl sm:text-2xl font-black text-muted-foreground">
                          VS
                        </span>
                      </div>
                    )}
                    <span className="text-[10px] uppercase font-bold text-muted-foreground mt-1.5">
                      {selected.match.home_minuti > 0
                        ? "Risultato Ufficiale"
                        : "In programma"}
                    </span>
                  </div>

                  {/* Away Team */}
                  <div className="flex flex-col items-center text-center gap-2 min-w-0">
                    <img
                      src={`${SUPABASE_STORAGE_URL}/images/teams/${selected.match.away}_Logo.png`}
                      alt={selected.match.away_team}
                      className="h-16 w-16 sm:h-20 sm:w-20 object-contain drop-shadow-md"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          `${SUPABASE_STORAGE_URL}/images/LCSIM_Logo_SMALL.png`;
                      }}
                    />
                    <div className="min-w-0">
                      <span className="font-extrabold text-sm sm:text-base text-foreground block truncate">
                        {selected.match.away_team}
                      </span>
                      {selected.match.away_allenatore && (
                        <span className="text-[11px] text-muted-foreground block truncate">
                          {formatCoachDisplay(selected.match.away_allenatore)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Match Chips */}
                <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
                  <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-card border border-border/80">
                    <MapPin className="h-3 w-3 text-emerald-500" />
                    <span>{selected.match.stadium || "Stadio Ufficiale"}</span>
                    {selected.match.is_neutral && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 ml-1">
                        Campo Neutro
                      </span>
                    )}
                  </div>
                  {selected.match.weather && (
                    <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-card border border-border/80">
                      <span>{getWeatherIcon(selected.match.weather)}</span>
                      <span>{selected.match.weather}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* MODAL TABS SUB-NAVBAR */}
            <div className="px-5 pt-3 border-b border-border/80 bg-muted/20 shrink-0">
              <Tabs
                value={modalTab}
                onValueChange={(v: any) => setModalTab(v)}
                className="w-full"
              >
                <TabsList className="bg-card border border-border/80 p-1 flex">
                  <TabsTrigger
                    value="lineup"
                    className="flex-1 data-[state=active]:bg-emerald-600 data-[state=active]:text-white font-bold text-xs gap-1.5"
                  >
                    <Shirt className="h-3.5 w-3.5" />
                    <span>Formazioni in Campo</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="stats"
                    className="flex-1 data-[state=active]:bg-emerald-600 data-[state=active]:text-white font-bold text-xs gap-1.5"
                  >
                    <BarChart3 className="h-3.5 w-3.5" />
                    <span>Statistiche Partita</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="players"
                    className="flex-1 data-[state=active]:bg-emerald-600 data-[state=active]:text-white font-bold text-xs gap-1.5"
                  >
                    <Users className="h-3.5 w-3.5" />
                    <span>Pagelle &amp; Giocatori</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* MODAL SCROLLABLE CONTENT BODY */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
              {/* TAB 1: FORMAZIONI IN CAMPO (VISUAL 2D TACTICAL PITCH) */}
              {modalTab === "lineup" && (
                <div className="space-y-5">
                  {/* Team Switcher Segmented Control */}
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/40 border border-border/80">
                      <button
                        type="button"
                        onClick={() => setLineupTeamSide("home")}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          lineupTeamSide === "home"
                            ? "bg-emerald-600 text-white shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <img
                          src={`${SUPABASE_STORAGE_URL}/images/teams/${selected.match.home}_Logo.png`}
                          alt=""
                          className="h-4 w-4 object-contain"
                        />
                        <span>{selected.match.home_team} {selected.match.is_neutral ? "(Campo Neutro)" : "(Casa)"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setLineupTeamSide("away")}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          lineupTeamSide === "away"
                            ? "bg-emerald-600 text-white shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <img
                          src={`${SUPABASE_STORAGE_URL}/images/teams/${selected.match.away}_Logo.png`}
                          alt=""
                          className="h-4 w-4 object-contain"
                        />
                        <span>{selected.match.away_team} (Trasferta)</span>
                      </button>
                    </div>

                    <div className="text-xs text-muted-foreground font-mono">
                      11 Titolari Schierati • Campetto Tattico Ufficiale
                    </div>
                  </div>

                  {(() => {
                    const activePlayerStats =
                      lineupTeamSide === "home"
                        ? selected.match.home_player_stats || []
                        : selected.match.away_player_stats || [];

                    const activeTeamName =
                      lineupTeamSide === "home"
                        ? selected.match.home_team
                        : selected.match.away_team;

                    const activeTeamManager =
                      lineupTeamSide === "home"
                        ? selected.match.home_allenatore
                        : selected.match.away_allenatore;

                    const activeTeamAbbr =
                      lineupTeamSide === "home"
                        ? selected.match.home
                        : selected.match.away;

                    // Separate Starters (11) and Bench using SUB / POS_GIOCATA cross-referenced with official formations
                    const explicitStarters = activePlayerStats.filter(
                      (p) => !p.SUB && p.POS_GIOCATA !== "SOS"
                    );
                    const hasExplicitSubs = activePlayerStats.some(
                      (p) => Boolean(p.SUB) || p.POS_GIOCATA === "SOS"
                    );
                    const starters =
                      hasExplicitSubs && explicitStarters.length > 0
                        ? explicitStarters.slice(0, 11)
                        : activePlayerStats.slice(0, 11);
                    const starterIdSet = new Set(starters.map((p) => p.ID));
                    const bench = activePlayerStats.filter((p) => !starterIdSet.has(p.ID));

                    const pitchNodes = computePitchCoordinates(starters);

                    return (
                      <div className="grid grid-cols-1 lg:grid-cols-[500px_1fr] xl:grid-cols-[540px_1fr] gap-6 items-start">
                        {/* THE 2D GREEN PITCH */}
                        <div className="relative w-full aspect-[3/4] sm:aspect-[4/5] min-h-[640px] sm:min-h-[700px] rounded-2xl overflow-hidden border-2 border-emerald-600/50 bg-gradient-to-b from-emerald-800 via-emerald-700 to-emerald-950 shadow-2xl p-4 select-none">
                          {/* Grass texture stripes */}
                          <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(0deg,transparent,transparent_38px,rgba(255,255,255,0.08)_38px,rgba(255,255,255,0.08)_76px)] pointer-events-none" />

                          {/* White field lines */}
                          <div className="absolute inset-3 sm:inset-4 border-2 border-white/40 rounded-xl pointer-events-none">
                            {/* Center line */}
                            <div className="absolute top-1/2 left-0 right-0 border-t-2 border-white/35" />
                            {/* Center circle */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 sm:w-36 sm:h-36 border-2 border-white/35 rounded-full" />
                            {/* Center dot */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white/50 rounded-full" />
                            {/* Penalty box top (opponent side) */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-52 sm:w-64 h-24 sm:h-28 border-b-2 border-x-2 border-white/35 rounded-b-lg" />
                            {/* Goal area top */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 sm:w-36 h-10 sm:h-12 border-b-2 border-x-2 border-white/30 rounded-b" />
                            {/* Penalty box bottom (home side) */}
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-52 sm:w-64 h-24 sm:h-28 border-t-2 border-x-2 border-white/35 rounded-t-lg" />
                            {/* Goal area bottom */}
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-28 sm:w-36 h-10 sm:h-12 border-t-2 border-x-2 border-white/30 rounded-t" />
                          </div>

                          {/* Team watermark in pitch center */}
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-15 pointer-events-none">
                            <img
                              src={`${SUPABASE_STORAGE_URL}/images/teams/${activeTeamAbbr}_Logo.png`}
                              alt=""
                              className="h-32 w-32 object-contain"
                            />
                          </div>

                          {/* 11 STARTERS NODES ON PITCH */}
                          {pitchNodes.map(({ player, x, y }) => {
                            const hasGoal = Boolean(player.GOL && Number(player.GOL) > 0);
                            const hasAssist = Boolean(player.ASST && Number(player.ASST) > 0);
                            const hasRed = Boolean(player.ROSSI && Number(player.ROSSI) > 0);
                            const hasYellow = Boolean(player.GIALLI && Number(player.GIALLI) > 0);

                            return (
                              <div
                                key={player.ID}
                                style={{
                                  left: x,
                                  top: y,
                                  transform: "translate(-50%, -50%)",
                                }}
                                className="absolute flex flex-col items-center group cursor-pointer"
                                title={`${player.Nome} ${player.Cognome} (${player.Posiz}) • Voto: ${Number(player.VOTO).toFixed(1)}`}
                              >
                                {/* Player Avatar Circle */}
                                <div className="relative">
                                  <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border-2 border-white shadow-xl bg-card">
                                    <AvatarImage
                                      src={getPlayerImage(player.ID)}
                                      alt={player.Cognome}
                                    />
                                    <AvatarFallback className="text-[10px] font-bold bg-muted text-foreground">
                                      {player.NumeroMaglia
                                        ? `#${player.NumeroMaglia}`
                                        : player.Cognome?.[0]}
                                    </AvatarFallback>
                                  </Avatar>

                                  {/* Kit number pill */}
                                  {player.NumeroMaglia && (
                                    <div className="absolute -bottom-1 -left-1 h-4 min-w-[16px] px-0.5 rounded bg-black/80 text-white font-mono font-black text-[9px] flex items-center justify-center border border-white/50">
                                      #{player.NumeroMaglia}
                                    </div>
                                  )}

                                  {/* Match Rating pill */}
                                  {player.VOTO && (
                                    <div
                                      className={`absolute -top-1 -right-1 h-4 min-w-[20px] px-1 rounded font-mono font-black text-[9px] flex items-center justify-center border shadow-xs ${
                                        Number(player.VOTO) >= 7.5
                                          ? "bg-amber-400 text-black border-amber-300 font-extrabold"
                                          : Number(player.VOTO) >= 6.5
                                          ? "bg-emerald-500 text-white border-emerald-400"
                                          : "bg-slate-700 text-white border-slate-600"
                                      }`}
                                    >
                                      {Number(player.VOTO).toFixed(1)}
                                    </div>
                                  )}

                                  {/* Event icon badges */}
                                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 flex items-center gap-0.5">
                                    {hasGoal && (
                                      <span className="text-[10px] drop-shadow-md">
                                        ⚽{player.GOL > 1 ? `x${player.GOL}` : ""}
                                      </span>
                                    )}
                                    {hasAssist && (
                                      <span className="text-[10px] drop-shadow-md">
                                        🅰️
                                      </span>
                                    )}
                                    {hasRed ? (
                                      <span className="text-[10px] drop-shadow-md">🟥</span>
                                    ) : hasYellow ? (
                                      <span className="text-[10px] drop-shadow-md">🟨</span>
                                    ) : null}
                                  </div>
                                </div>

                                {/* Player Name & Role */}
                                <div className="mt-1 flex flex-col items-center max-w-[84px] text-center">
                                  <span className="text-[10px] sm:text-[11px] font-extrabold text-white drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.9)] tracking-tight leading-tight truncate w-full px-0.5">
                                    {player.Cognome}
                                  </span>
                                  <span className="text-[8px] font-bold text-emerald-200 drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)]">
                                    {player.POS_GIOCATA && player.POS_GIOCATA !== "SOS"
                                      ? player.POS_GIOCATA
                                      : player.Posiz}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* BENCH & SUBSTITUTES SECTION */}
                        <Card className="border border-border/80 bg-card shadow-sm p-4 space-y-3">
                          <div className="flex items-center justify-between border-b border-border/60 pb-2">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-emerald-500" />
                              <h4 className="text-xs font-extrabold uppercase tracking-wider text-foreground">
                                Panchina &amp; Sostituzioni • {activeTeamName}
                              </h4>
                            </div>
                            {activeTeamManager && (
                              <span className="text-xs text-muted-foreground font-medium">
                                Allenatore: <strong>{formatCoachDisplay(activeTeamManager)}</strong>
                              </span>
                            )}
                          </div>

                          {bench.length === 0 ? (
                            <div className="text-xs text-muted-foreground italic">
                              Nessun giocatore in panchina a referto.
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                              {bench.map((p) => {
                                const entered = p.MINUTI && p.MINUTI > 0;
                                return (
                                  <div
                                    key={p.ID}
                                    className="p-2.5 rounded-lg border border-border/80 bg-muted/20 flex items-center justify-between gap-2"
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <Avatar className="h-8 w-8 border border-border shrink-0">
                                        <AvatarImage
                                          src={getPlayerImage(p.ID)}
                                          alt={p.Cognome}
                                        />
                                        <AvatarFallback className="text-[9px]">
                                          {p.Cognome?.[0]}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-1.5">
                                          <Badge
                                            variant="outline"
                                            className={`text-[9px] font-bold px-1 py-0 ${getRoleColor(
                                              p.Posiz
                                            )}`}
                                          >
                                            {p.Posiz}
                                          </Badge>
                                          <span className="font-bold text-xs truncate">
                                            {p.Nome?.[0]}. {p.Cognome}
                                          </span>
                                        </div>
                                        <span className="text-[10px] text-muted-foreground block">
                                          {entered ? (
                                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                              🔄 Subentrato ({p.MINUTI}')
                                            </span>
                                          ) : (
                                            "In panchina"
                                          )}
                                        </span>
                                      </div>
                                    </div>

                                    {entered && p.VOTO && (
                                      <Badge
                                        variant="outline"
                                        className="font-mono font-bold text-xs"
                                      >
                                        {Number(p.VOTO).toFixed(1)}
                                      </Badge>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </Card>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* TAB 2: STATISTICHE SQUADRE */}
              {modalTab === "stats" && (
                <div className="space-y-4">
                  {(() => {
                    const statsColors = getMatchStatsColors(
                      selected.match.home,
                      selected.match.away,
                      isDarkMode
                    );
                    const {
                      homeColor,
                      awayColor,
                      homeTextColor,
                      awayTextColor,
                      isAwayUsingSecondary,
                    } = statsColors;

                    const renderStatBar = (
                      label: string,
                      left: number | string | undefined,
                      right: number | string | undefined,
                      format?: (v: number) => string
                    ) => {
                      const isNum =
                        typeof left === "number" && typeof right === "number";
                      const total = isNum
                        ? (left as number) + (right as number)
                        : 0;
                      const leftPct =
                        isNum && total > 0
                          ? Math.round(((left as number) / total) * 100)
                          : 50;
                      const rightPct = 100 - leftPct;
                      const leftDisplay = isNum
                        ? format
                          ? format(left as number)
                          : String(left)
                        : "0";
                      const rightDisplay = isNum
                        ? format
                          ? format(right as number)
                          : String(right)
                        : "0";

                      return (
                        <div className="space-y-1.5 p-3 rounded-xl bg-card border border-border/80 shadow-xs hover:border-border transition-colors">
                          <div className="flex items-center justify-between text-xs font-mono">
                            <span
                              className="font-black text-sm min-w-[3rem]"
                              style={{ color: homeTextColor }}
                            >
                              {leftDisplay}
                            </span>
                            <span className="text-muted-foreground font-bold uppercase tracking-wider text-[11px]">
                              {label}
                            </span>
                            <span
                              className="font-black text-sm min-w-[3rem] text-right"
                              style={{ color: awayTextColor }}
                            >
                              {rightDisplay}
                            </span>
                          </div>
                          <div className="relative w-full h-2 rounded-full bg-muted/70 overflow-hidden flex">
                            <div
                              className="h-full transition-all duration-500"
                              style={{
                                width: `${leftPct}%`,
                                backgroundColor: homeColor,
                              }}
                            />
                            <div
                              className="h-full transition-all duration-500"
                              style={{
                                width: `${rightPct}%`,
                                backgroundColor: awayColor,
                              }}
                            />
                          </div>
                        </div>
                      );
                    };

                    const extraTeamKeys = Array.from(
                      new Set([
                        ...Object.keys(selected.match.home_extra_stats || {}),
                        ...Object.keys(selected.match.away_extra_stats || {}),
                      ])
                    );

                    const hasVal = (a: any, b: any) =>
                      (a !== null && a !== undefined && Number(a) > 0) ||
                      (b !== null && b !== undefined && Number(b) > 0);

                    return (
                      <div className="space-y-3 max-w-3xl mx-auto w-full">
                        {renderStatBar(
                          "Possesso Palla",
                          selected.match.home_poss,
                          selected.match.away_poss,
                          (v) => `${Math.round(v * 100)}%`
                        )}
                        {hasVal(selected.match.home_xg, selected.match.away_xg) &&
                          renderStatBar(
                            "Expected Goals (xG)",
                            Number(selected.match.home_xg ?? 0),
                            Number(selected.match.away_xg ?? 0),
                            (v) => v.toFixed(2)
                          )}
                        {renderStatBar(
                          "Tiri Totali",
                          selected.match.home_tiri_tot,
                          selected.match.away_tiri_tot
                        )}
                        {renderStatBar(
                          "Tiri nello Specchio",
                          selected.match.home_tiri_si,
                          selected.match.away_tiri_si
                        )}
                        {renderStatBar(
                          "Passaggi Riusciti",
                          selected.match.home_pass_si,
                          selected.match.away_pass_si
                        )}
                        {hasVal(selected.match.home_pass_tot, selected.match.away_pass_tot) &&
                          renderStatBar(
                            "Passaggi Tentati",
                            selected.match.home_pass_tot,
                            selected.match.away_pass_tot
                          )}
                        {hasVal(selected.match.home_drib_si, selected.match.away_drib_si) &&
                          renderStatBar(
                            "Dribbling Riusciti",
                            selected.match.home_drib_si,
                            selected.match.away_drib_si
                          )}
                        {hasVal(selected.match.home_drib_tot, selected.match.away_drib_tot) &&
                          renderStatBar(
                            "Dribbling Tentati",
                            selected.match.home_drib_tot,
                            selected.match.away_drib_tot
                          )}
                        {hasVal(selected.match.home_cros_si, selected.match.away_cros_si) &&
                          renderStatBar(
                            "Cross Riusciti",
                            selected.match.home_cros_si,
                            selected.match.away_cros_si
                          )}
                        {hasVal(selected.match.home_cros_tot, selected.match.away_cros_tot) &&
                          renderStatBar(
                            "Cross Tentati",
                            selected.match.home_cros_tot,
                            selected.match.away_cros_tot
                          )}
                        {renderStatBar(
                          "Contrasti Vinti",
                          selected.match.home_ctrs_si,
                          selected.match.away_ctrs_si
                        )}
                        {hasVal(selected.match.home_ctrs_tot, selected.match.away_ctrs_tot) &&
                          renderStatBar(
                            "Contrasti Tentati",
                            selected.match.home_ctrs_tot,
                            selected.match.away_ctrs_tot
                          )}
                        {hasVal(selected.match.home_interc, selected.match.away_interc) &&
                          renderStatBar(
                            "Intercettazioni",
                            Number(selected.match.home_interc ?? 0),
                            Number(selected.match.away_interc ?? 0)
                          )}
                        {hasVal(selected.match.home_temporec, selected.match.away_temporec) &&
                          renderStatBar(
                            "Tempo Recupero Palla (s)",
                            Number(selected.match.home_temporec ?? 0),
                            Number(selected.match.away_temporec ?? 0),
                            (v) => `${v}s`
                          )}
                        {renderStatBar(
                          "Parate del Portiere",
                          selected.match.home_para,
                          selected.match.away_para
                        )}
                        {renderStatBar(
                          "Calci d'Angolo",
                          selected.match.home_cangl,
                          selected.match.away_cangl
                        )}
                        {renderStatBar(
                          "Falli Commessi",
                          selected.match.home_falli,
                          selected.match.away_falli
                        )}
                        {hasVal(selected.match.home_fgioco, selected.match.away_fgioco) &&
                          renderStatBar(
                            "Fuorigioco",
                            selected.match.home_fgioco,
                            selected.match.away_fgioco
                          )}
                        {hasVal(selected.match.home_gialli, selected.match.away_gialli) &&
                          renderStatBar(
                            "Cartellini Gialli",
                            selected.match.home_gialli,
                            selected.match.away_gialli
                          )}
                        {hasVal(selected.match.home_rossi, selected.match.away_rossi) &&
                          renderStatBar(
                            "Cartellini Rossi",
                            selected.match.home_rossi,
                            selected.match.away_rossi
                          )}
                        {hasVal(selected.match.home_tagli, selected.match.away_tagli) &&
                          renderStatBar(
                            "Tagli Difesa",
                            Number(selected.match.home_tagli ?? 0),
                            Number(selected.match.away_tagli ?? 0)
                          )}
                        {hasVal(selected.match.home_aggir, selected.match.away_aggir) &&
                          renderStatBar(
                            "Aggiramenti Difesa",
                            Number(selected.match.home_aggir ?? 0),
                            Number(selected.match.away_aggir ?? 0)
                          )}
                        {hasVal(selected.match.home_scaval, selected.match.away_scaval) &&
                          renderStatBar(
                            "Scavalcamenti Difesa",
                            Number(selected.match.home_scaval ?? 0),
                            Number(selected.match.away_scaval ?? 0)
                          )}
                        {hasVal(selected.match.home_incurs, selected.match.away_incurs) &&
                          renderStatBar(
                            "Incursioni Tentate",
                            Number(selected.match.home_incurs ?? 0),
                            Number(selected.match.away_incurs ?? 0)
                          )}
                        {extraTeamKeys.map((extKey) => {
                          const hVal = Number(selected.match.home_extra_stats?.[extKey] ?? 0);
                          const aVal = Number(selected.match.away_extra_stats?.[extKey] ?? 0);
                          if (!hasVal(hVal, aVal)) return null;
                          return (
                            <div key={extKey}>
                              {renderStatBar(
                                formatExtraStatLabel(extKey),
                                hVal,
                                aVal
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* TAB 3: PAGELLE & GIOCATORI */}
              {modalTab === "players" && (
                <div className="space-y-4">
                  <div className="text-xs text-muted-foreground text-center">
                    Clicca su qualsiasi calciatore per espandere il dettaglio completo delle statistiche di gara e dei sub-tab avanzati.
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                    {[
                      {
                        teamName: selected.match.home_team,
                        teamAbbr: selected.match.home,
                        players: selected.match.home_player_stats || [],
                      },
                      {
                        teamName: selected.match.away_team,
                        teamAbbr: selected.match.away,
                        players: selected.match.away_player_stats || [],
                      },
                    ].map((side, sIdx) => (
                      <Card
                        key={sIdx}
                        className="border border-border/80 bg-card overflow-hidden"
                      >
                        <div className="p-3 bg-muted/30 border-b border-border/80 flex items-center justify-between gap-2.5">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={`${SUPABASE_STORAGE_URL}/images/teams/${side.teamAbbr}_Logo.png`}
                              alt=""
                              className="h-6 w-6 object-contain"
                            />
                            <h4 className="font-extrabold text-xs uppercase tracking-wider text-foreground">
                              {side.teamName} ({side.players.length} calciatori)
                            </h4>
                          </div>
                          <span className="text-[10px] font-mono text-muted-foreground">
                            Titolari: {side.players.filter((p) => !p.SUB && p.POS_GIOCATA !== "SOS").length} • Sub: {side.players.filter((p) => p.SUB || p.POS_GIOCATA === "SOS").length}
                          </span>
                        </div>

                        <div className="divide-y divide-border/60">
                          {side.players.map((p) => {
                            const isExpanded = Boolean(expandedRecapPlayerIds[p.ID]);
                            const isSub = Boolean(p.SUB || p.POS_GIOCATA === "SOS");
                            const playedRole =
                              !isSub && p.POS_GIOCATA && p.POS_GIOCATA !== "SOS"
                                ? p.POS_GIOCATA
                                : p.Posiz;
                            const extraStatsObj = p.EXTRA_STATS || {};
                            const extraKeys = Object.keys(extraStatsObj).filter(
                              (k) => extraStatsObj[k] !== null && extraStatsObj[k] !== undefined
                            );
                            const dynamicExtraKeys = extraKeys.filter(
                              (k) => !KNOWN_PLAYER_EXTRA_KEYS.has(k)
                            );

                            return (
                              <div key={p.ID} className="transition-colors">
                                <div
                                  onClick={() => toggleExpandRecapPlayer(p.ID)}
                                  className="p-3 hover:bg-muted/30 transition-colors flex items-center justify-between gap-3 text-xs cursor-pointer"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <Avatar className="h-8 w-8 border border-border shrink-0">
                                      <AvatarImage
                                        src={getPlayerImage(p.ID)}
                                        alt={p.Cognome}
                                      />
                                      <AvatarFallback className="text-[9px]">
                                        {p.Cognome?.[0]}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <Badge
                                          variant="outline"
                                          className={`text-[9px] font-bold px-1 py-0 ${getRoleColor(
                                            playedRole
                                          )}`}
                                        >
                                          {playedRole}
                                        </Badge>
                                        <span
                                          className={`text-[9px] font-mono font-extrabold px-1.5 py-0.2 rounded border ${
                                            isSub
                                              ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                                              : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                                          }`}
                                        >
                                          {isSub ? "🔄 SUB" : "TIT"}
                                        </span>
                                        <span className="font-bold text-foreground truncate">
                                          {p.Nome} {p.Cognome}
                                        </span>
                                        {p.NumeroMaglia && (
                                          <span className="text-[10px] font-mono text-muted-foreground">
                                            #{p.NumeroMaglia}
                                          </span>
                                        )}
                                        {p.MOTM && (
                                          <Badge className="bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40 text-[9px] px-1.5 py-0 font-black">
                                            ⭐ MVP
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5 flex-wrap">
                                        <span>⏱️ {p.MINUTI}'</span>
                                        {p.GOL > 0 && (
                                          <span className="text-emerald-600 font-bold">
                                            ⚽ {p.GOL}
                                          </span>
                                        )}
                                        {p.ASST > 0 && (
                                          <span className="text-blue-600 font-bold">
                                            🅰️ {p.ASST}
                                          </span>
                                        )}
                                        {p.AGOL > 0 && (
                                          <span className="text-rose-500 font-bold">
                                            ⚽ AG {p.AGOL}
                                          </span>
                                        )}
                                        {p.GIALLI > 0 && <span>🟨 {p.GIALLI}</span>}
                                        {p.ROSSI > 0 && <span>🟥 {p.ROSSI}</span>}
                                        {extraKeys.length > 0 && (
                                          <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                                            • +{extraKeys.length} stat extra
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    <Badge
                                      variant="outline"
                                      className={`font-mono font-black text-sm px-2 py-0.5 ${
                                        Number(p.VOTO) >= 7.5
                                          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                                          : Number(p.VOTO) >= 6.5
                                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                                          : "bg-muted text-foreground"
                                      }`}
                                    >
                                      {Number(p.VOTO).toFixed(1)}
                                    </Badge>
                                    {isExpanded ? (
                                      <ChevronUp className="h-4 w-4 text-emerald-500" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                    )}
                                  </div>
                                </div>

                                {isExpanded && (
                                  <div className="px-3.5 pb-3.5 pt-2 bg-muted/20 border-t border-border/50 space-y-3 text-[11px]">
                                    {/* RIEPILOGO BASE DEL CALCIATORE */}
                                    <div>
                                      <div className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1.5">
                                        Statistiche Riepilogo Partita
                                      </div>
                                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 font-mono">
                                        <div className="px-2 py-1 rounded bg-card border border-border/60 flex justify-between">
                                          <span className="text-muted-foreground">Tiri (In/Tot):</span>
                                          <span className="font-bold">{p.TIRI_IN ?? 0}/{p.TIRI_TOT ?? 0}</span>
                                        </div>
                                        <div className="px-2 py-1 rounded bg-card border border-border/60 flex justify-between">
                                          <span className="text-muted-foreground">Passaggi:</span>
                                          <span className="font-bold">{p.PASS_SI ?? 0}/{p.PASS_TOT ?? 0}</span>
                                        </div>
                                        <div className="px-2 py-1 rounded bg-card border border-border/60 flex justify-between">
                                          <span className="text-muted-foreground">Dribbling:</span>
                                          <span className="font-bold">{p.DRIB_SI ?? 0}/{p.DRIB_TOT ?? 0}</span>
                                        </div>
                                        <div className="px-2 py-1 rounded bg-card border border-border/60 flex justify-between">
                                          <span className="text-muted-foreground">Cross:</span>
                                          <span className="font-bold">{p.CROS_SI ?? 0}/{p.CROS_TOT ?? 0}</span>
                                        </div>
                                        <div className="px-2 py-1 rounded bg-card border border-border/60 flex justify-between">
                                          <span className="text-muted-foreground">Contrasti:</span>
                                          <span className="font-bold">{p.CTRS_SI ?? 0}/{p.CTRS_TOT ?? 0}</span>
                                        </div>
                                        <div className="px-2 py-1 rounded bg-card border border-border/60 flex justify-between">
                                          <span className="text-muted-foreground">Poss. Vinti/Persi:</span>
                                          <span className="font-bold">{p.POSS_VINTI ?? 0}/{p.PALLE_PERSE ?? 0}</span>
                                        </div>
                                        <div className="px-2 py-1 rounded bg-card border border-border/60 flex justify-between">
                                          <span className="text-muted-foreground">Km (Scatto):</span>
                                          <span className="font-bold">{p.DIST_TOT ?? 0} ({p.DIST_SCATTO ?? 0})</span>
                                        </div>
                                        <div className="px-2 py-1 rounded bg-card border border-border/60 flex justify-between">
                                          <span className="text-muted-foreground">Falli / Fuorig.:</span>
                                          <span className="font-bold">{p.FALLI ?? 0} / {p.FGIOCO ?? 0}</span>
                                        </div>
                                        {(p.Posiz === "POR" || (p.PARA ?? 0) > 0 || (p.GSUB ?? 0) > 0) && (
                                          <div className="px-2 py-1 rounded bg-card border border-border/60 flex justify-between col-span-2">
                                            <span className="text-muted-foreground">Parate / Gol Subiti:</span>
                                            <span className="font-bold">{p.PARA ?? 0} / {p.GSUB ?? 0}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* STATISTICHE EXTRA SUB-TAB DIVISE PER REPARTO */}
                                    {extraKeys.length > 0 && (
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {PLAYER_EXTRA_STAT_CATEGORIES.map((cat) => {
                                          const populatedFields = cat.fields.filter(
                                            (f) =>
                                              extraStatsObj[f.key] !== null &&
                                              extraStatsObj[f.key] !== undefined
                                          );
                                          if (populatedFields.length === 0) return null;
                                          return (
                                            <div
                                              key={cat.id}
                                              className="rounded-lg border border-border/70 bg-card p-2 space-y-1"
                                            >
                                              <div className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 border-b border-border/50 pb-0.5">
                                                {cat.title}
                                              </div>
                                              <div className="space-y-0.5 font-mono text-[10px]">
                                                {populatedFields.map((f) => (
                                                  <div
                                                    key={f.key}
                                                    className="flex items-center justify-between gap-2"
                                                  >
                                                    <span className="text-muted-foreground truncate">
                                                      {f.label}
                                                    </span>
                                                    <span className="font-bold text-foreground">
                                                      {extraStatsObj[f.key]}
                                                      {f.unit ? ` ${f.unit}` : ""}
                                                    </span>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          );
                                        })}

                                        {dynamicExtraKeys.length > 0 && (
                                          <div className="rounded-lg border border-border/70 bg-card p-2 space-y-1">
                                            <div className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 border-b border-border/50 pb-0.5">
                                              Altre Statistiche
                                            </div>
                                            <div className="space-y-0.5 font-mono text-[10px]">
                                              {dynamicExtraKeys.map((dk) => (
                                                <div
                                                  key={dk}
                                                  className="flex items-center justify-between gap-2"
                                                >
                                                  <span className="text-muted-foreground truncate">
                                                    {formatExtraStatLabel(dk)}
                                                  </span>
                                                  <span className="font-bold text-foreground">
                                                    {String(extraStatsObj[dk])}
                                                  </span>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendario;

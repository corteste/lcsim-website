import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { getStandings } from "@/hooks/use-standings";
import { fetchSeasonSchedule } from "@/services/scheduleService";
import { Schedule } from "@/types/schedule";
import { SeasonCalendarBoard } from "@/components/schedule/SeasonCalendarBoard";
import { Trophy, Flame, History, Award, Crown, Swords, Calendar } from "lucide-react";
import { getTeamLogo, LCSIM_LOGO_SMALL } from "@/utils/functions";
import { useSearchParams } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface HistoricalSeasonMeta {
  seasonNumber: number;
  label: string;
  champion: string;
  championTeamId: string;
  runnerUp: string;
  runnerUpTeamId: string;
  finalScore: string;
  regularSeasonWinner: string;
  regularSeasonWinnerTeamId: string;
  formatDescription: string;
  description: string;
  totalTeams: number;
  regularSeasonWeeks: number;
}

const HISTORICAL_SEASONS: HistoricalSeasonMeta[] = [
  {
    seasonNumber: 10,
    label: "Stagione 10",
    champion: "Old Bois",
    championTeamId: "OLD",
    runnerUp: "Alvisopoli FC",
    runnerUpTeamId: "ALV",
    finalScore: "2 - 0",
    regularSeasonWinner: "Alvisopoli FC",
    regularSeasonWinnerTeamId: "ALV",
    formatDescription: "10 squadre • 9 giornate di Regular Season • Playoff a eliminazione diretta",
    description: "Regular Season dominata da Alvisopoli FC (21 pt), ma gli Old Bois trionfano nella Finalissima per 2-0 conquistando il loro primo storico Scudetto.",
    totalTeams: 10,
    regularSeasonWeeks: 9,
  },
  {
    seasonNumber: 9,
    label: "Stagione 9",
    champion: "Panormus FC",
    championTeamId: "PFC",
    runnerUp: "Alvisopoli FC",
    runnerUpTeamId: "ALV",
    finalScore: "2 - 2 (d.c.r.)",
    regularSeasonWinner: "Alvisopoli FC",
    regularSeasonWinnerTeamId: "ALV",
    formatDescription: "10 squadre • 9 giornate di Regular Season • Playoff a eliminazione diretta",
    description: "Finale al cardiopalma: Panormus FC si laurea Campione LCSIM superando Alvisopoli FC ai calci di rigore dopo il 2-2 dei tempi regolamentari.",
    totalTeams: 10,
    regularSeasonWeeks: 9,
  },
  {
    seasonNumber: 8,
    label: "Stagione 8",
    champion: "Mar's Attack",
    championTeamId: "MAR",
    runnerUp: "AC Denti",
    runnerUpTeamId: "ACD",
    finalScore: "3 - 0",
    regularSeasonWinner: "Mar's Attack",
    regularSeasonWinnerTeamId: "MAR",
    formatDescription: "10 squadre • 9 giornate di Regular Season • Playoff a eliminazione diretta",
    description: "Dominio netto di Mar's Attack: 1° posto in Regular Season (18 pt) e trionfo netto per 3-0 nella Finalissima contro l'AC Denti.",
    totalTeams: 10,
    regularSeasonWeeks: 9,
  },
  {
    seasonNumber: 7,
    label: "Stagione 7",
    champion: "Average Pegiò Drivers",
    championTeamId: "APD",
    runnerUp: "Panormus FC",
    runnerUpTeamId: "PFC",
    finalScore: "2 - 0",
    regularSeasonWinner: "Average Pegiò Drivers",
    regularSeasonWinnerTeamId: "APD",
    formatDescription: "10 squadre • 9 giornate di Regular Season • Playoff a eliminazione diretta",
    description: "Trionfo totale per gli Average Pegiò Drivers: primato in Regular Season (20 pt) e Scudetto conquistato superando per 2-0 il Panormus FC in finale.",
    totalTeams: 10,
    regularSeasonWeeks: 9,
  },
  {
    seasonNumber: 6,
    label: "Stagione 6",
    champion: "AC Denti",
    championTeamId: "ACD",
    runnerUp: "AC Fantasy",
    runnerUpTeamId: "ACF",
    finalScore: "1 - 0",
    regularSeasonWinner: "Blackmamba FC",
    regularSeasonWinnerTeamId: "BLA",
    formatDescription: "10 squadre • 9 giornate di Regular Season • Playoff a eliminazione diretta",
    description: "Blackmamba FC e AC Fantasy chiudono la stagione regolare appaiate a 15 pt, ma l'AC Denti ruggisce nei playoff e batte 1-0 l'AC Fantasy in finale.",
    totalTeams: 10,
    regularSeasonWeeks: 9,
  },
  {
    seasonNumber: 5,
    label: "Stagione 5",
    champion: "Valle FC",
    championTeamId: "VFC",
    runnerUp: "AC Denti",
    runnerUpTeamId: "ACD",
    finalScore: "4 - 3",
    regularSeasonWinner: "Valle FC",
    regularSeasonWinnerTeamId: "VFC",
    formatDescription: "10 squadre • 9 giornate di Regular Season • Playoff a eliminazione diretta",
    description: "Una delle finali più spettacolari e prolifiche della storia LCSIM: Valle FC vince la Regular Season (20 pt) e piega l'AC Denti per 4-3 nell'ultimo atto.",
    totalTeams: 10,
    regularSeasonWeeks: 9,
  },
  {
    seasonNumber: 4,
    label: "Stagione 4",
    champion: "Panormus FC",
    championTeamId: "PFC",
    runnerUp: "Sbinnala Madrid",
    runnerUpTeamId: "SBM",
    finalScore: "1 - 0",
    regularSeasonWinner: "Sbinnala Madrid",
    regularSeasonWinnerTeamId: "SBM",
    formatDescription: "8 squadre • 9 giornate di Regular Season • Playoff a eliminazione diretta",
    description: "Sbinnala Madrid vince la Regular Season (16 pt), ma il Panormus FC compie l'impresa nella Finalissima vincendo 1-0 e strappando lo Scudetto.",
    totalTeams: 8,
    regularSeasonWeeks: 9,
  },
  {
    seasonNumber: 3,
    label: "Stagione 3",
    champion: "AC Denti",
    championTeamId: "ACD",
    runnerUp: "AC Fantasy",
    runnerUpTeamId: "ACF",
    finalScore: "2 - 0",
    regularSeasonWinner: "FC Karalis",
    regularSeasonWinnerTeamId: "KAR",
    formatDescription: "8 squadre • 9 giornate di Regular Season • Playoff a eliminazione diretta",
    description: "L'FC Karalis comanda la fase a girone con 19 pt, ma l'AC Denti si impone nei playoff e supera l'AC Fantasy 2-0 laureandosi Campione LCSIM.",
    totalTeams: 8,
    regularSeasonWeeks: 9,
  },
  {
    seasonNumber: 2,
    label: "Stagione 2",
    champion: "Sbinnala Madrid",
    championTeamId: "SBM",
    runnerUp: "Average Pegiò Drivers",
    runnerUpTeamId: "APD",
    finalScore: "2 - 1",
    regularSeasonWinner: "Sbinnala Madrid",
    regularSeasonWinnerTeamId: "SBM",
    formatDescription: "8 squadre • 9 giornate di Regular Season • Playoff a eliminazione diretta",
    description: "Back-to-Back leggendario per Sbinnala Madrid: 1° posto in Regular Season (15 pt) e secondo titolo consecutivo battendo per 2-1 gli Average Pegiò Drivers.",
    totalTeams: 8,
    regularSeasonWeeks: 9,
  },
  {
    seasonNumber: 1,
    label: "Stagione 1",
    champion: "Sbinnala Madrid",
    championTeamId: "SBM",
    runnerUp: "Average Pegiò Drivers",
    runnerUpTeamId: "APD",
    finalScore: "2 - 0",
    regularSeasonWinner: "Average Pegiò Drivers",
    regularSeasonWinnerTeamId: "APD",
    formatDescription: "6 squadre • 5 giornate di Regular Season • Fase Finale Playoff",
    description: "L'edizione inaugurale della Serie A LCSIM a 6 franchigie. Gli Average Pegiò Drivers guidano il girone a 9 pt, ma Sbinnala Madrid vince la prima storica Finale per 2-0.",
    totalTeams: 6,
    regularSeasonWeeks: 5,
  },
];

export default function ArchivioStagioni() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedSeason = Number(searchParams.get("stag") || "10");
  const rawTab = searchParams.get("tab");
  const currentTab =
    rawTab === "playoff"
      ? "playoff"
      : rawTab === "calendario"
      ? "calendario"
      : "regular";

  const [historicalSchedule, setHistoricalSchedule] = useState<Schedule[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setScheduleLoading(true);
    fetchSeasonSchedule(selectedSeason)
      .then((data) => {
        if (!cancelled) {
          setHistoricalSchedule(data || []);
        }
      })
      .catch((err) => {
        console.error("Error fetching historical season schedule:", err);
        if (!cancelled) {
          setHistoricalSchedule([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setScheduleLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedSeason]);

  const handleSeasonChange = (s: number) => {
    setSearchParams((prev) => {
      const n = new URLSearchParams(prev);
      n.set("stag", String(s));
      return n;
    });
  };

  const handleTabChange = (val: string) => {
    setSearchParams((prev) => {
      const n = new URLSearchParams(prev);
      n.set("tab", val);
      return n;
    });
  };

  const { standings, loading } = getStandings(selectedSeason);
  const seasonMeta = HISTORICAL_SEASONS.find((s) => s.seasonNumber === selectedSeason) || {
    seasonNumber: selectedSeason,
    label: `Stagione ${selectedSeason}`,
    champion: "Albo Storico",
    championTeamId: "",
    runnerUp: "",
    runnerUpTeamId: "",
    finalScore: "-",
    regularSeasonWinner: "",
    regularSeasonWinnerTeamId: "",
    formatDescription: "Edizione passata di Serie A LCSIM",
    description: "Dati storici della stagione archiviata.",
    totalTeams: 10,
    regularSeasonWeeks: 9,
  };

  const playoffCutoff = seasonMeta.totalTeams <= 6 ? 4 : seasonMeta.totalTeams <= 8 ? 6 : 8;

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <Navbar />

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Header Broadcast Archivio */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-border/80">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                Memoria Storica LCSIM
              </span>
              <span className="text-xs text-muted-foreground font-semibold">
                Albo &amp; Classifiche Concluse
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight flex items-center gap-3">
              <History className="h-8 w-8 text-amber-500" />
              Archivio Stagioni
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Consulta le classifiche di Regular Season e i verdetti della fase finale di tutte le edizioni storiche (Stagioni 1–10).
            </p>
          </div>

          {/* Selettore Stagione Storica (Menu a tendina ordinato da S1 a S10) */}
          <div className="flex items-center gap-2.5 self-start lg:self-auto shrink-0">
            <span className="text-xs font-bold text-muted-foreground shrink-0 hidden sm:inline">
              Edizione:
            </span>
            <Select
              value={String(selectedSeason)}
              onValueChange={(val) => handleSeasonChange(Number(val))}
            >
              <SelectTrigger className="w-[160px] sm:w-[180px] bg-card border-border/80 font-bold text-xs h-10 rounded-xl shadow-xs">
                <SelectValue placeholder="Seleziona Stagione" />
              </SelectTrigger>
              <SelectContent className="max-h-[320px]">
                {[...HISTORICAL_SEASONS]
                  .sort((a, b) => a.seasonNumber - b.seasonNumber)
                  .map((s) => (
                    <SelectItem
                      key={s.seasonNumber}
                      value={String(s.seasonNumber)}
                      className="text-xs font-semibold cursor-pointer"
                    >
                      {s.label}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Banner Stagione Selezionata & Vincitore */}
        <Card className="border-border/80 bg-gradient-to-r from-amber-500/10 via-card to-amber-500/5 shadow-sm overflow-hidden">
          <CardContent className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge className="bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30 text-xs font-bold">
                  Edizione Storica
                </Badge>
                <span className="text-sm font-extrabold text-foreground">{seasonMeta.label}</span>
                <span className="text-xs text-muted-foreground font-mono">
                  ({seasonMeta.totalTeams} squadre • {seasonMeta.regularSeasonWeeks} giornate reg.)
                </span>
              </div>
              <p className="text-xs text-muted-foreground max-w-2xl">{seasonMeta.description}</p>
            </div>

            {seasonMeta.champion && (
              <div className="flex items-center gap-3 bg-card px-4 py-2.5 rounded-2xl border border-amber-500/30 shadow-xs shrink-0">
                {seasonMeta.championTeamId && (
                  <img
                    src={getTeamLogo(seasonMeta.championTeamId)}
                    alt={seasonMeta.champion}
                    className="h-10 w-10 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = LCSIM_LOGO_SMALL;
                    }}
                  />
                )}
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-amber-500 flex items-center gap-1">
                    <Trophy className="h-3.5 w-3.5" /> Campione LCSIM
                  </div>
                  <div className="text-sm font-black text-foreground">{seasonMeta.champion}</div>
                  {seasonMeta.runnerUp && (
                    <div className="text-[10px] text-muted-foreground font-mono">
                      Vice-Campione: {seasonMeta.runnerUp} ({seasonMeta.finalScore})
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Tabs (Regular Season / Playoff / Calendario & Risultati) */}
        <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="bg-muted/60 p-1 rounded-xl border border-border/60 flex-wrap h-auto">
            <TabsTrigger
              value="regular"
              className="gap-2 px-4 py-2 font-bold text-xs data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-lg"
            >
              <Trophy className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Regular Season ({seasonMeta.label})</span>
            </TabsTrigger>
            <TabsTrigger
              value="playoff"
              className="gap-2 px-4 py-2 font-bold text-xs data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-lg"
            >
              <Flame className="h-4 w-4 text-amber-500" />
              <span>Fase Finale &amp; Playoff ({seasonMeta.label})</span>
            </TabsTrigger>
            <TabsTrigger
              value="calendario"
              className="gap-2 px-4 py-2 font-bold text-xs data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-lg"
            >
              <Calendar className="h-4 w-4 text-blue-500" />
              <span>Calendario &amp; Risultati ({seasonMeta.label})</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: REGULAR SEASON */}
          <TabsContent value="regular" className="space-y-6 mt-0">
            <Card className="border border-border/80 shadow-md overflow-hidden bg-card">
              <CardHeader className="bg-muted/20 border-b border-border/60 py-4 px-6 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold">Classifica Finale Regular Season</CardTitle>
                  <CardDescription className="text-xs">
                    {seasonMeta.label} • Risultati ufficiali d'archivio ({seasonMeta.regularSeasonWeeks} giornate disputate)
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-border text-[11px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted/30">
                      <TableHead className="w-16 text-center py-3">Pos.</TableHead>
                      <TableHead className="w-12 text-center py-3"></TableHead>
                      <TableHead className="py-3">Squadra</TableHead>
                      <TableHead className="text-center py-3">G</TableHead>
                      <TableHead className="text-center py-3">V</TableHead>
                      <TableHead className="text-center py-3">P</TableHead>
                      <TableHead className="text-center py-3">S</TableHead>
                      <TableHead className="text-center py-3">GF</TableHead>
                      <TableHead className="text-center py-3">GS</TableHead>
                      <TableHead className="text-center py-3">DR</TableHead>
                      <TableHead className="text-center py-3 font-bold text-foreground">Pt</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={11} className="h-32 text-center text-muted-foreground">
                          Caricamento classifica d'archivio...
                        </TableCell>
                      </TableRow>
                    ) : standings.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={11} className="h-32 text-center text-muted-foreground">
                          Nessun dato registrato per la {seasonMeta.label}.
                        </TableCell>
                      </TableRow>
                    ) : (
                      standings.map((s, index) => {
                        const isPlayoffZone = index < playoffCutoff;
                        const teamId = s.team?.TEAM_ID || s.team_id;
                        return (
                          <TableRow
                            key={`${teamId || index}-${s.stag}`}
                            className="hover:bg-muted/40 transition-colors border-b border-border/60 text-xs"
                          >
                            <TableCell className="text-center font-bold font-mono">
                              <span
                                className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold ${
                                  index === 0
                                    ? "bg-amber-500 text-slate-950 shadow-xs"
                                    : isPlayoffZone
                                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                    : "text-muted-foreground"
                                }`}
                              >
                                {index + 1}
                              </span>
                            </TableCell>
                            <TableCell className="text-center py-2.5">
                              {teamId && (
                                <img
                                  src={getTeamLogo(teamId)}
                                  alt={s.team?.NAME || teamId}
                                  className="h-7 w-7 object-contain mx-auto"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = LCSIM_LOGO_SMALL;
                                  }}
                                />
                              )}
                            </TableCell>
                            <TableCell className="font-extrabold text-foreground">
                              {s.team?.NAME || teamId}
                            </TableCell>
                            <TableCell className="text-center font-mono text-muted-foreground">
                              {s.games_played}
                            </TableCell>
                            <TableCell className="text-center font-mono text-muted-foreground">{s.win}</TableCell>
                            <TableCell className="text-center font-mono text-muted-foreground">{s.draws}</TableCell>
                            <TableCell className="text-center font-mono text-muted-foreground">{s.loss}</TableCell>
                            <TableCell className="text-center font-mono text-muted-foreground">
                              {s.goal_made}
                            </TableCell>
                            <TableCell className="text-center font-mono text-muted-foreground">
                              {s.goal_conceded}
                            </TableCell>
                            <TableCell className="text-center font-mono font-semibold">
                              <span
                                className={
                                  (s.goal_difference || 0) > 0
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : (s.goal_difference || 0) < 0
                                    ? "text-rose-600 dark:text-rose-400"
                                    : "text-muted-foreground"
                                }
                              >
                                {(s.goal_difference || 0) > 0 ? `+${s.goal_difference}` : s.goal_difference}
                              </span>
                            </TableCell>
                            <TableCell className="text-center font-mono font-black text-sm text-foreground">
                              {s.points}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: TABELLONE / EPILOGO PLAYOFF */}
          <TabsContent value="playoff" className="space-y-6 mt-0">
            <Card className="border border-border/80 shadow-md overflow-hidden bg-card">
              <CardHeader className="bg-gradient-to-r from-amber-500/15 via-card to-amber-500/10 border-b border-border/60 py-4 px-6 flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/20 text-amber-500 rounded-xl border border-amber-500/30">
                    <Trophy className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      Finalissima Scudetto • {seasonMeta.label}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {seasonMeta.formatDescription}
                    </CardDescription>
                  </div>
                </div>
                <Badge className="bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30 font-bold text-xs">
                  Esito Ufficiale
                </Badge>
              </CardHeader>
              <CardContent className="p-6">
                {/* Showdown Finale */}
                <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center bg-muted/30 rounded-2xl p-5 border border-border/60">
                  {/* Campione */}
                  <div className="md:col-span-3 flex items-center gap-4 p-4 rounded-xl bg-card border-2 border-amber-500/40 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 font-black text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-bl-lg flex items-center gap-1">
                      <Crown className="h-3 w-3" /> Campione
                    </div>
                    <img
                      src={getTeamLogo(seasonMeta.championTeamId)}
                      alt={seasonMeta.champion}
                      className="h-16 w-16 object-contain shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = LCSIM_LOGO_SMALL;
                      }}
                    />
                    <div className="space-y-0.5 min-w-0">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-amber-500">
                        Campione LCSIM
                      </span>
                      <h3 className="text-lg font-black text-foreground truncate">
                        {seasonMeta.champion}
                      </h3>
                      <p className="text-xs text-muted-foreground font-mono">
                        Sigla: {seasonMeta.championTeamId}
                      </p>
                    </div>
                  </div>

                  {/* Risultato / Centro */}
                  <div className="md:col-span-1 flex flex-col items-center justify-center py-2 text-center">
                    <div className="flex items-center justify-center p-2 rounded-full bg-amber-500/10 text-amber-500 mb-1">
                      <Swords className="h-5 w-5" />
                    </div>
                    <span className="text-xl md:text-2xl font-black font-mono tracking-tight text-foreground">
                      {seasonMeta.finalScore}
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                      Finale Playoff
                    </span>
                  </div>

                  {/* Vice-Campione */}
                  <div className="md:col-span-3 flex items-center gap-4 p-4 rounded-xl bg-card border border-border/80 shadow-xs relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-muted-foreground/20 text-muted-foreground font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-bl-lg">
                      Vice-Campione
                    </div>
                    <img
                      src={getTeamLogo(seasonMeta.runnerUpTeamId)}
                      alt={seasonMeta.runnerUp}
                      className="h-16 w-16 object-contain shrink-0 opacity-90"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = LCSIM_LOGO_SMALL;
                      }}
                    />
                    <div className="space-y-0.5 min-w-0">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                        Finalista Playoff
                      </span>
                      <h3 className="text-lg font-bold text-foreground truncate">
                        {seasonMeta.runnerUp}
                      </h3>
                      <p className="text-xs text-muted-foreground font-mono">
                        Sigla: {seasonMeta.runnerUpTeamId}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Recap storico dettagliato */}
                <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-muted/20 border border-border/60 space-y-1">
                    <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Award className="h-3.5 w-3.5" /> Sintesi dell'Edizione
                    </span>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {seasonMeta.description}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-muted/20 border border-border/60 space-y-1">
                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Trophy className="h-3.5 w-3.5" /> Vincitore Regular Season
                    </span>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      La fase a girone regolare è stata vinta da{" "}
                      <strong className="text-foreground">{seasonMeta.regularSeasonWinner || seasonMeta.champion}</strong>,
                      a conferma dell'alta competitività della formula Playoff della LCSIM.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: CALENDARIO & RISULTATI STORICI */}
          <TabsContent value="calendario" className="space-y-6 mt-0">
            <SeasonCalendarBoard
              season={selectedSeason}
              schedule={historicalSchedule}
              loading={scheduleLoading}
              showOffseason={false}
              allowAdminEdit={false}
              emptyMessage={`Nessuna partita registrata in archivio per la ${seasonMeta.label}.`}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

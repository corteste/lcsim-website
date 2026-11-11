import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { getStandings } from "@/hooks/use-standings";
import { Trophy, Flame, History, Award, Calendar, ChevronRight } from "lucide-react";
import PlayoffBracket from "@/components/PlayoffBracket";
import { SUPABASE_STORAGE_URL } from "@/constants/App";
import { useSearchParams } from "react-router-dom";

interface HistoricalSeasonMeta {
  seasonNumber: number;
  label: string;
  champion: string;
  championTeamId: string;
  runnerUp?: string;
  runnerUpTeamId?: string;
  description: string;
}

const HISTORICAL_SEASONS: HistoricalSeasonMeta[] = [
  {
    seasonNumber: 10,
    label: "Stagione 10",
    champion: "Old Bois",
    championTeamId: "OLD",
    runnerUp: "Valle FC",
    runnerUpTeamId: "VFC",
    description: "Campionato a 10 squadre con 9 giornate di Regular Season e tabellone playoff.",
  },
  {
    seasonNumber: 9,
    label: "Stagione 9",
    champion: "Panormus FC",
    championTeamId: "PFC",
    runnerUp: "Mar's Attack",
    runnerUpTeamId: "MAR",
    description: "Campionato storico con 9 giornate di Regular Season e fase finale.",
  },
];

export default function ArchivioStagioni() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedSeason = Number(searchParams.get("stag") || "10");
  const currentTab = searchParams.get("tab") === "playoff" ? "playoff" : "regular";

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
    description: "Dati storici della stagione archiviata.",
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <Navbar />

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Header Broadcast Archivio */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-border/80">
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
              Consulta le classifiche di Regular Season e i tabelloni Playoff delle passate edizioni di Serie A.
            </p>
          </div>

          {/* Selettore Stagione Storica */}
          <div className="flex items-center gap-2 bg-muted/60 p-1.5 rounded-2xl border border-border/80 self-start md:self-auto">
            <span className="text-xs font-bold text-muted-foreground px-2">Stagione:</span>
            {HISTORICAL_SEASONS.map((s) => (
              <button
                key={s.seasonNumber}
                type="button"
                onClick={() => handleSeasonChange(s.seasonNumber)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedSeason === s.seasonNumber
                    ? "bg-card text-foreground shadow-sm border border-border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {s.label}
              </button>
            ))}
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
              </div>
              <p className="text-xs text-muted-foreground">{seasonMeta.description}</p>
            </div>

            {seasonMeta.champion && (
              <div className="flex items-center gap-3 bg-card px-4 py-2.5 rounded-2xl border border-amber-500/30 shadow-xs">
                {seasonMeta.championTeamId && (
                  <img
                    src={`${SUPABASE_STORAGE_URL}/teams/${seasonMeta.championTeamId}.png`}
                    alt={seasonMeta.champion}
                    className="h-10 w-10 object-contain"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                )}
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-amber-500 flex items-center gap-1">
                    <Trophy className="h-3.5 w-3.5" /> Campione d'Italia
                  </div>
                  <div className="text-sm font-black text-foreground">{seasonMeta.champion}</div>
                  {seasonMeta.runnerUp && (
                    <div className="text-[10px] text-muted-foreground font-mono">
                      Vice-Campione: {seasonMeta.runnerUp}
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Tabs (Regular Season / Playoff) */}
        <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="bg-muted/60 p-1 rounded-xl border border-border/60">
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
              <span>Tabellone Playoff ({seasonMeta.label})</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: REGULAR SEASON */}
          <TabsContent value="regular" className="space-y-6 mt-0">
            <Card className="border border-border/80 shadow-md overflow-hidden bg-card">
              <CardHeader className="bg-muted/20 border-b border-border/60 py-4 px-6 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold">Classifica Finale Regular Season</CardTitle>
                  <CardDescription className="text-xs">
                    {seasonMeta.label} • Risultati ufficiali d'archivio al termine della fase a girone
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
                        const isPlayoffZone = index < 8;
                        return (
                          <TableRow
                            key={`${s.team?.TEAM_ID || s.team_id || index}-${s.stag}`}
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
                              {s.team?.TEAM_ID && (
                                <img
                                  src={`${SUPABASE_STORAGE_URL}/teams/${s.team.TEAM_ID}.png`}
                                  alt={s.team.NAME}
                                  className="h-7 w-7 object-contain mx-auto"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = "none";
                                  }}
                                />
                              )}
                            </TableCell>
                            <TableCell className="font-extrabold text-foreground">
                              {s.team?.NAME || s.team_id}
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

          {/* TAB 2: TABELLONE PLAYOFF */}
          <TabsContent value="playoff" className="mt-0">
            <PlayoffBracket standings={standings} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

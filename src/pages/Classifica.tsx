import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getStandings } from "@/hooks/use-standings";
import { Trophy, Flame, Layers } from "lucide-react";
import PlayoffBracket from "@/components/PlayoffBracket";
import { SUPABASE_STORAGE_URL } from "@/constants/App";
import { useSearchParams } from "react-router-dom";

const Classifica = () => {
  const { standings, loading } = getStandings();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentTab = searchParams.get("tab") === "playoff" ? "playoff" : "regular";

  const handleTabChange = (val: string) => {
    setSearchParams(val === "playoff" ? { tab: "playoff" } : {});
  };

  const maxMatchday = standings.length > 0
    ? Math.max(1, ...standings.map(s => s.games_played || 0))
    : 10;

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <Navbar />

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Broadcast Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-border/80">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                LCSIM
              </span>
              <span className="text-xs text-muted-foreground">
                Stagione 2024/25 • Giornata {maxMatchday}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight flex items-center gap-3">
              <Trophy className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              Classifica & Playoff
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Classifica ufficiale della Regular Season e Tabellone Playoff Serie A
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <div className="px-3.5 py-1.5 rounded-xl border border-border/80 bg-card text-xs flex items-center gap-2 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-muted-foreground">Ultimo aggiornamento:</span>
              <span className="font-semibold text-foreground font-mono">
                {new Date().toLocaleDateString('it-IT')}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="bg-muted/60 p-1 rounded-xl border border-border/60">
            <TabsTrigger
              value="regular"
              className="gap-2 px-4 py-2 font-bold text-xs data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-lg"
            >
              <Trophy className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Regular Season</span>
            </TabsTrigger>
            <TabsTrigger
              value="playoff"
              className="gap-2 px-4 py-2 font-bold text-xs data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-lg"
            >
              <Flame className="h-4 w-4 text-amber-500" />
              <span>Tabellone Playoff</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: REGULAR SEASON */}
          <TabsContent value="regular" className="space-y-6 mt-0">
            {/* Main Standings Card */}
            <Card className="border border-border/80 shadow-md overflow-hidden bg-card">
              <CardHeader className="bg-muted/20 border-b border-border/60 py-4 px-6 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold">Classifica Regular Season</CardTitle>
                  <CardDescription className="text-xs">
                    Criteri parità: Punti &gt; Scontri Diretti &gt; Differenza Reti &gt; Gol Fatti
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <tr className="border-b border-border text-[11px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted/30">
                      <TableHead className="w-16 text-center py-3">Pos.</TableHead>
                      <TableHead className="w-12 text-center py-3"></TableHead>
                      <TableHead className="py-3">Squadra</TableHead>
                      <TableHead className="text-center py-3">G</TableHead>
                      <TableHead className="text-center py-3">V</TableHead>
                      <TableHead className="text-center py-3">N</TableHead>
                      <TableHead className="text-center py-3">P</TableHead>
                      <TableHead className="text-center py-3">GF</TableHead>
                      <TableHead className="text-center py-3">GS</TableHead>
                      <TableHead className="text-center py-3">DR</TableHead>
                      <TableHead className="text-center py-3">Casa</TableHead>
                      <TableHead className="text-center py-3 font-bold">Punti</TableHead>
                    </tr>
                  </TableHeader>
                  <TableBody className="divide-y divide-border/60">
                    {standings.map((team, index) => {
                      const isQuarterFinals = index < 4;

                      return (
                        <TableRow
                          key={index}
                          className={`hover:bg-muted/50 transition-colors ${isQuarterFinals
                              ? "border-l-4 border-l-emerald-500 bg-emerald-500/[0.02]"
                              : "border-l-4 border-l-blue-500 bg-blue-500/[0.02]"
                            }`}
                        >
                          <TableCell className="text-center font-mono font-bold">
                            <span
                              className={`inline-flex items-center justify-center h-6 w-6 rounded-md font-mono text-xs font-bold ${isQuarterFinals
                                  ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                                  : "bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30"
                                }`}
                            >
                              {index + 1}
                            </span>
                          </TableCell>
                          <TableCell className="text-center py-2.5">
                            <img
                              src={`${SUPABASE_STORAGE_URL}/images/teams/${team.team.TEAM_ID}_Logo.png`}
                              alt={`${team.team.TEAM_ID} Logo`}
                              className="h-8 w-8 object-contain mx-auto filter drop-shadow-sm"
                              onError={(e) => (e.currentTarget.style.display = 'none')}
                            />
                          </TableCell>
                          <TableCell className="font-semibold text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-foreground">{team.team.NAME}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center font-mono text-xs text-muted-foreground">{team.games_played}</TableCell>
                          <TableCell className="text-center font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">{team.win}</TableCell>
                          <TableCell className="text-center font-mono text-xs text-muted-foreground">{team.draws}</TableCell>
                          <TableCell className="text-center font-mono text-xs text-rose-500">{team.loss}</TableCell>
                          <TableCell className="text-center font-mono text-xs">{team.goal_made}</TableCell>
                          <TableCell className="text-center font-mono text-xs">{team.goal_conceded}</TableCell>
                          <TableCell className="text-center font-mono text-xs">
                            <span className={team.goal_difference > 0 ? "text-emerald-600 dark:text-emerald-400 font-semibold" : team.goal_difference < 0 ? "text-rose-500" : ""}>
                              {team.goal_difference > 0 ? `+${team.goal_difference}` : team.goal_difference}
                            </span>
                          </TableCell>
                          <TableCell className="text-center font-mono text-xs text-muted-foreground">{team.played_at_home}</TableCell>
                          <TableCell className="text-center">
                            <span className="font-mono font-extrabold text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                              {team.points}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Competition Zone Legend */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-3 p-3.5 rounded-xl border border-border/80 bg-card shadow-sm">
                <span className="h-3 w-3 rounded-full bg-emerald-500 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-foreground">1° - 4° Posto</p>
                  <p className="text-[11px] text-muted-foreground">Accesso Diretto Quarti di Finale Playoff (Round Bye)</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3.5 rounded-xl border border-border/80 bg-card shadow-sm">
                <span className="h-3 w-3 rounded-full bg-blue-500 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-foreground">5° - 12° Posto</p>
                  <p className="text-[11px] text-muted-foreground">Turno Play In Preliminare (Gara Secca)</p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: TABELLONE PLAYOFF */}
          <TabsContent value="playoff" className="mt-0">
            <PlayoffBracket standings={standings} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Classifica;

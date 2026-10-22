import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getStandings } from "@/hooks/use-standings";
import { Trophy, ShieldCheck, Flame, Info } from "lucide-react";
import PlayoffBracket from "@/components/PlayoffBracket";

const Classifica = () => {
  const { standings, loading } = getStandings();

  const maxMatchday = standings.length > 0
    ? Math.max(1, ...standings.map(s => s.games_played || 0))
    : 10;

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <Navbar />

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Broadcast Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-border/80">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                LCSIM Ufficiale • Serie A
              </span>
              <span className="text-xs text-muted-foreground">
                Stagione 2024/25 • Giornata {maxMatchday}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight flex items-center gap-3">
              <Trophy className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              Classifica Generale
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Ricalcolata in tempo reale ad ogni referto gara registrato.
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

        {/* Main Standings Card */}
        <Card className="border border-border/80 shadow-md overflow-hidden bg-card">
          <CardHeader className="bg-muted/20 border-b border-border/60 py-4 px-6 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold">Tabella Punti & Rendimento</CardTitle>
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
                  const isChampions = index < 2;
                  const isPlayoff = index >= 2 && index < 6;
                  const isPlayIn = index >= 6 && index < 10;

                  return (
                    <TableRow 
                      key={index} 
                      className={`hover:bg-muted/50 transition-colors ${
                        isChampions ? "border-l-4 border-l-emerald-500 bg-emerald-500/[0.02]" :
                        isPlayoff ? "border-l-4 border-l-blue-500 bg-blue-500/[0.02]" :
                        isPlayIn ? "border-l-4 border-l-amber-500 bg-amber-500/[0.02]" : ""
                      }`}
                    >
                      <TableCell className="text-center font-mono font-bold">
                        <span className={`inline-flex items-center justify-center h-6 w-6 rounded-md font-mono text-xs font-bold ${
                          isChampions 
                            ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30" 
                            : isPlayoff 
                              ? "bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30"
                              : isPlayIn
                                ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                                : "text-muted-foreground"
                        }`}>
                          {index + 1}
                        </span>
                      </TableCell>
                      <TableCell className="text-center py-2.5">
                        <img 
                          src={`/images/teams/${team.team.TEAM_ID}_Logo.png`} 
                          alt={`${team.team.TEAM_ID} Logo`} 
                          className="h-8 w-8 object-contain mx-auto filter drop-shadow-sm" 
                          onError={(e) => (e.currentTarget.style.display = 'none')}
                        />
                      </TableCell>
                      <TableCell className="font-semibold text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-foreground">{team.team.NAME}</span>
                          <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-muted text-muted-foreground border">
                            {team.team.TEAM_ID}
                          </span>
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex items-center gap-3 p-3.5 rounded-xl border border-border/80 bg-card shadow-sm">
            <span className="h-3 w-3 rounded-full bg-emerald-500 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-foreground">1° - 2° Posto</p>
              <p className="text-[11px] text-muted-foreground">Accesso Diretto Semifinali Playoff</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3.5 rounded-xl border border-border/80 bg-card shadow-sm">
            <span className="h-3 w-3 rounded-full bg-blue-500 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-foreground">3° - 6° Posto</p>
              <p className="text-[11px] text-muted-foreground">Quarti di Finale Playoff</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3.5 rounded-xl border border-border/80 bg-card shadow-sm">
            <span className="h-3 w-3 rounded-full bg-amber-500 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-foreground">7° - 10° Posto</p>
              <p className="text-[11px] text-muted-foreground">Turno Play In Preliminare</p>
            </div>
          </div>
        </div>

        {/* Tabellone Playoff */}
        <div className="pt-4">
          <PlayoffBracket standings={standings} />
        </div>
      </main>
    </div>
  );
};

export default Classifica;

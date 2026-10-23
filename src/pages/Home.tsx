import Navbar from "@/components/Navbar";
import { Trophy, TrendingUp, Users, Award, BarChart3, CalendarDays, Flame, Activity, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { getStandings } from "@/hooks/use-standings";
import { getPlayersSumStats } from "@/hooks/use-players-stats";
import { getPlayers } from "@/hooks/use-players";
import { getRoleColor } from "@/utils/functions";
import { useState } from "react";
import { NextOpponentCard } from "@/components/home/NextOpponentCard";

const CURRENT_SEASON = 9;

const Home = () => {
  const [activeLeaderboardTab, setActiveLeaderboardTab] = useState<"scorers" | "mvp">("scorers");

  const { standings, loading: loadingStandings } = getStandings();
  const { playersStats, loading: loadingStats } = getPlayersSumStats(CURRENT_SEASON, null, null);
  const { players, loading: loadingPlayers } = getPlayers();

  // Calcoli metriche telemetria
  const maxMatchday = standings.length > 0
    ? Math.max(1, ...standings.map(s => s.games_played || 0))
    : 10;
  
  const totalGoals = standings.length > 0
    ? standings.reduce((acc, s) => acc + (s.goal_made || 0), 0)
    : playersStats.reduce((acc, p) => acc + (p.sum_gol || 0), 0);

  const totalMatches = standings.length > 0
    ? standings.reduce((acc, s) => acc + (s.games_played || 0), 0) / 2
    : 1;

  const avgGoalsPerMatch = totalMatches > 0 && totalGoals > 0
    ? (totalGoals / totalMatches).toFixed(2)
    : "2.65";

  // Top Marcatori
  const topScorers = [...playersStats]
    .sort((a, b) => (b.sum_gol || 0) - (a.sum_gol || 0))
    .slice(0, 5);

  // Top MVP (Media Voto con almeno 3 partite o max)
  const topPerformers = [...playersStats]
    .filter(p => (p.matches_played || 0) >= 2)
    .sort((a, b) => {
      const avgB = (b.sum_voto || 0) / (b.matches_played || 1);
      const avgA = (a.sum_voto || 0) / (a.matches_played || 1);
      return avgB - avgA;
    })
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <Navbar />

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* ========================================================= */}
        {/* HERO TELEMETRY STRIP */}
        {/* ========================================================= */}
        <section
          aria-label="Panoramica Campionato"
          className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-br from-card via-card/90 to-background p-6 md:p-8 shadow-xl"
        >
          {/* Sfondo ambient mesh pro */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  Serie A Ufficiale • LCSIM
                </span>
                <span className="text-xs text-muted-foreground">
                  Stagione 2024/25 • Edizione 9
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                Centro Dati & Telemetria di Lega
              </h1>
              <p className="text-sm md:text-base max-w-2xl text-muted-foreground">
                Monitora classifiche in tempo reale, statistiche avanzate dei giocatori e andamento delle rose con precisione broadcast.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link to="/classifica">
                <Button className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-md gap-2">
                  <Trophy className="h-4 w-4" />
                  <span>Esplora Classifica</span>
                </Button>
              </Link>
              <Link to="/statistiche">
                <Button variant="outline" className="font-semibold text-sm gap-2">
                  <Activity className="h-4 w-4 text-emerald-500" />
                  <span>Statistiche Giocatori</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* KPI METRIC CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-border/60">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Giornata Attuale
              </span>
              <div className="text-2xl font-bold font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
                {maxMatchday}ª
              </div>
              <div className="text-[11px] flex items-center gap-1.5 text-muted-foreground">
                <span>su 18 giornate</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">• {Math.round((maxMatchday / 18) * 100)}%</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Squadre Iscritte
              </span>
              <div className="text-2xl font-bold font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
                {standings.length || 10}
              </div>
              <div className="text-[11px] flex items-center gap-1.5 text-muted-foreground">
                <span>Serie A Unica</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">• 100% attive</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Gol Totali Stagione
              </span>
              <div className="text-2xl font-bold font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
                {totalGoals}
              </div>
              <div className="text-[11px] flex items-center gap-1.5 text-muted-foreground">
                <span>Media {avgGoalsPerMatch} / partita</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Giocatori Censiti
              </span>
              <div className="text-2xl font-bold font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
                {players.length || 660}
              </div>
              <div className="text-[11px] flex items-center gap-1.5 text-muted-foreground">
                <span>Database Ufficiale</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">• Verificati</span>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* NEXT MATCH / OPPONENT SCOUT CARD (WHEN LOGGED IN)         */}
        {/* ========================================================= */}
        <NextOpponentCard />

        {/* ========================================================= */}
        {/* SPLIT SCREEN: STANDINGS SPOTLIGHT + LEADERBOARDS */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Standings Summary (2 Cols) */}
          <div className="lg:col-span-2 rounded-2xl border border-border/80 bg-card p-5 md:p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <Trophy className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-bold text-base md:text-lg text-foreground">
                    Zona Vertice & Qualificazioni
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Classifica in tempo reale • Prime posizioni fase finale
                  </p>
                </div>
              </div>

              <Link
                to="/classifica"
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:opacity-80 flex items-center gap-1 transition-opacity"
              >
                <span>Vedi Classifica Completa</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Standings Micro Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="py-2.5 px-3 w-12 text-center">Pos</th>
                    <th className="py-2.5 px-3">Club</th>
                    <th className="py-2.5 px-3 text-center">G</th>
                    <th className="py-2.5 px-3 text-center">V</th>
                    <th className="py-2.5 px-3 text-center">N</th>
                    <th className="py-2.5 px-3 text-center">P</th>
                    <th className="py-2.5 px-3 text-center">DR</th>
                    <th className="py-2.5 px-3 text-center font-bold">PT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {standings.slice(0, 6).map((team, idx) => {
                    const isChampions = idx < 2;
                    const isPlayoff = idx >= 2 && idx < 6;
                    return (
                      <tr 
                        key={idx} 
                        className="group hover:bg-muted/40 transition-colors"
                      >
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-flex items-center justify-center h-6 w-6 rounded-md font-mono text-xs font-bold ${
                            isChampions 
                              ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30" 
                              : isPlayoff 
                                ? "bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30"
                                : "text-muted-foreground"
                          }`}>
                            {idx + 1}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={`/images/teams/${team.team.TEAM_ID}_Logo.png`}
                              alt=""
                              className="h-6 w-6 object-contain"
                              onError={(e) => (e.currentTarget.style.display = 'none')}
                            />
                            <div>
                              <span className="font-semibold text-sm group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                {team.team.NAME}
                              </span>
                              <span className="ml-2 text-[10px] font-mono uppercase px-1 rounded bg-muted text-muted-foreground">
                                {team.team.TEAM_ID}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-xs">{team.games_played}</td>
                        <td className="py-3 px-3 text-center font-mono text-xs text-emerald-600 dark:text-emerald-400 font-semibold">{team.win}</td>
                        <td className="py-3 px-3 text-center font-mono text-xs text-muted-foreground">{team.draws}</td>
                        <td className="py-3 px-3 text-center font-mono text-xs text-rose-500">{team.loss}</td>
                        <td className="py-3 px-3 text-center font-mono text-xs">
                          {team.goal_difference > 0 ? `+${team.goal_difference}` : team.goal_difference}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            {team.points}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="pt-2 flex items-center justify-between text-xs text-muted-foreground border-t border-border/40">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span>Fase Finale Diretta</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  <span>Playoff</span>
                </div>
              </div>
              <Link to="/classifica">
                <Button variant="ghost" size="sm" className="h-7 text-xs">
                  Tabellone Playoff Completo &rarr;
                </Button>
              </Link>
            </div>
          </div>

          {/* Top Performers / Leaderboards (1 Col) */}
          <div className="rounded-2xl border border-border/80 bg-card p-5 md:p-6 shadow-sm space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveLeaderboardTab("scorers")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      activeLeaderboardTab === "scorers"
                        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <Flame className="h-3.5 w-3.5" />
                    <span>Bomber</span>
                  </button>
                  <button
                    onClick={() => setActiveLeaderboardTab("mvp")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      activeLeaderboardTab === "mvp"
                        ? "bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <Award className="h-3.5 w-3.5" />
                    <span>MVP Media Voto</span>
                  </button>
                </div>

                <Link
                  to="/statistiche"
                  className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-0.5"
                >
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {/* Leaderboard List */}
              <div className="space-y-2.5">
                {activeLeaderboardTab === "scorers" ? (
                  topScorers.length > 0 ? (
                    topScorers.map((player, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-border/60 bg-muted/30 hover:bg-muted/60 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`h-6 w-6 rounded-md font-mono text-xs font-bold flex items-center justify-center ${
                            i === 0 
                              ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30" 
                              : "text-muted-foreground"
                          }`}>
                            {i + 1}
                          </span>
                          <div>
                            <p className="font-semibold text-xs md:text-sm text-foreground">
                              {player.Nome} {player.Cognome}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {player.Squadra} • {player.matches_played} presenze
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-mono text-base font-extrabold text-amber-600 dark:text-amber-400">
                            {player.sum_gol}
                          </span>
                          <span className="block text-[10px] font-semibold uppercase text-muted-foreground">
                            Gol
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs text-muted-foreground">Nessun dato registrato</div>
                  )
                ) : (
                  topPerformers.length > 0 ? (
                    topPerformers.map((player, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-border/60 bg-muted/30 hover:bg-muted/60 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`h-6 w-6 rounded-md font-mono text-xs font-bold flex items-center justify-center ${
                            i === 0 
                              ? "bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30" 
                              : "text-muted-foreground"
                          }`}>
                            {i + 1}
                          </span>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-xs md:text-sm text-foreground">
                                {player.Nome} {player.Cognome}
                              </span>
                              <Badge variant="outline" className={`text-[10px] px-1 py-0 ${getRoleColor(player.Posiz)}`}>
                                {player.Posiz}
                              </Badge>
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                              {player.Squadra} • {player.matches_played} gare
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-mono text-base font-extrabold text-purple-600 dark:text-purple-400">
                            {((player.sum_voto || 0) / (player.matches_played || 1)).toFixed(2)}
                          </span>
                          <span className="block text-[10px] font-semibold uppercase text-muted-foreground">
                            Media
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs text-muted-foreground">Nessun dato registrato</div>
                  )
                )}
              </div>
            </div>

            <Link to="/statistiche" className="w-full pt-2">
              <Button variant="outline" className="w-full text-xs font-semibold">
                Classifica Completa Marcatori & Statistiche
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;

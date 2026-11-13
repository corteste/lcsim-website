import Navbar from "@/components/Navbar";
import { Trophy, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { getStandings } from "@/hooks/use-standings";
import { NextOpponentCard } from "@/components/home/NextOpponentCard";
import { PressAndRumorsHomeCard } from "@/components/home/PressAndRumorsHomeCard";
import { TotwHomeCard } from "@/components/home/TotwHomeCard";
import { OwnedPicksHomeCard } from "@/components/home/OwnedPicksHomeCard";
import { MyRosterHomeCard } from "@/components/home/MyRosterHomeCard";
import { RookieListHomeCard } from "@/components/home/RookieListHomeCard";
import { useHomeMode } from "@/hooks/use-home-mode";
import { SUPABASE_STORAGE_URL } from "@/constants/App";

const Home = () => {
  const { standings } = getStandings();
  const { homeMode } = useHomeMode();

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <Navbar />

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* ========================================================= */}
        {/* TOP ROW: CENTRO DATI & TEAM OF THE WEEK (TOTW)           */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Blocco 1: Centro Dati (4 Colonne) */}
          <section
            aria-label="Centro Dati"
            className="lg:col-span-4 relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-br from-card via-card/90 to-background p-6 md:p-7 shadow-sm flex flex-col justify-between min-h-[280px]"
          >
            {/* Sfondo ambient mesh pro */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-1/3 -mb-20 w-64 h-64 rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-mono">
                  Serie A • LCSIM
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  Edizione 9
                </span>
                {homeMode === "offseason" && (
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 font-mono">
                    Offseason
                  </span>
                )}
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground">
                Centro Dati
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Monitora classifiche in tempo reale, statistiche avanzate dei giocatori e andamento delle rose con precisione broadcast.
              </p>
            </div>
          </section>

          {/* Blocco 2 (8 Colonne): TOTW in Stagione / Inbox Personale in Offseason */}
          <div className="lg:col-span-8 h-full flex flex-col justify-stretch">
            {homeMode === "offseason" ? (
              <PressAndRumorsHomeCard layout="side-by-side" className="h-full" />
            ) : (
              <TotwHomeCard />
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* FASCIA ORIZZONTALE CENTRALE: AVVERSARIO / SCELTE DRAFT     */}
        {/* ========================================================= */}
        {homeMode === "offseason" ? <OwnedPicksHomeCard /> : <NextOpponentCard />}

        {/* ========================================================= */}
        {/* SPLIT SCREEN INFERIORE (8 COL + 4 COL)                     */}
        {/* ========================================================= */}
        {homeMode === "offseason" ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Il Mio Roster (8 Colonne) */}
            <div className="lg:col-span-8 h-full">
              <MyRosterHomeCard />
            </div>

            {/* Classe Rookie (4 Colonne) */}
            <div className="lg:col-span-4 h-full">
              <RookieListHomeCard />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Standings Summary (8 Colonne) */}
            <div className="lg:col-span-8 rounded-2xl border border-border/80 bg-card p-5 md:p-6 shadow-sm space-y-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
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
                        const isDirectQuarters = idx < 4;
                        return (
                          <tr
                            key={idx}
                            className="group hover:bg-muted/40 transition-colors"
                          >
                            <td className="py-3 px-3 text-center">
                              <span
                                className={`inline-flex items-center justify-center h-6 w-6 rounded-md font-mono text-xs font-bold ${
                                  isDirectQuarters
                                    ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                                    : "bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30"
                                }`}
                              >
                                {idx + 1}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-3">
                                <img
                                  src={`${SUPABASE_STORAGE_URL}/images/teams/${team.team.TEAM_ID}_Logo.png`}
                                  alt=""
                                  className="h-6 w-6 object-contain"
                                  onError={(e) => (e.currentTarget.style.display = 'none')}
                                />
                                <div>
                                  <span className="font-semibold text-sm group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                    {team.team.NAME}
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
              </div>

              <div className="pt-2 flex items-center justify-between text-xs text-muted-foreground border-t border-border/40">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span>1°-4° Quarti Diretti</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                    <span>5°-12° Play-In</span>
                  </div>
                </div>
                <Link to="/classifica?tab=playoff">
                  <Button variant="ghost" size="sm" className="h-7 text-xs">
                    Tabellone Playoff Completo &rarr;
                  </Button>
                </Link>
              </div>
            </div>

            {/* LCSIM Media & Sala Stampa (4 Colonne - Formato Stacked) */}
            <div className="lg:col-span-4 h-full flex flex-col justify-stretch">
              <PressAndRumorsHomeCard layout="stacked" className="h-full" />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;

import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Trophy, TrendingUp, TrendingDown, Minus, Shield, Zap, Target, Flame, 
  BarChart3, CalendarDays, Award, ArrowUpRight, CheckCircle2, ChevronRight,
  Filter, Layers, Sparkles, SlidersHorizontal, Activity, ArrowLeft, RefreshCw
} from "lucide-react";
import { getStandings } from "@/hooks/use-standings";
import { getPlayersSumStats } from "@/hooks/use-players-stats";
import { getPlayers } from "@/hooks/use-players";
import { getNationalityFlag } from "@/utils/functions";

export default function PreviewStile() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "classifica" | "giocatori" | "design-system">("dashboard");
  const [themeMode, setThemeMode] = useState<"dark" | "light">("dark");

  const { standings, loading: loadingStandings } = getStandings();
  const { playersStats, loading: loadingStats } = getPlayersSumStats(9, null, null);
  const { players, loading: loadingPlayers } = getPlayers();

  // Top 5 marcatori / performers
  const topPerformers = [...playersStats]
    .sort((a, b) => (b.sum_voto / (b.matches_played || 1)) - (a.sum_voto / (a.matches_played || 1)))
    .slice(0, 5);

  const topScorers = [...playersStats]
    .sort((a, b) => b.goals - a.goals)
    .slice(0, 5);

  const featuredPlayer = players[0] || {
    ID: 1,
    NomeCompleto: "Matteo Silva",
    Posiz: "ATT",
    Squadra: "FC Dragonslayers",
    OVR: 88,
    Nazionalità: "Italy",
    Età: 26,
    Piede: "Destro",
    Altezza: 184,
    Peso: 78,
    VAL: 88,
    VEL: 91,
    TIR: 89,
    PAS: 82,
    DRI: 87,
    DIF: 45,
    FIS: 84,
  };

  const isDark = themeMode === "dark";

  return (
    <div className={`min-h-screen transition-colors duration-300 font-sans ${
      isDark ? "bg-[#090D16] text-slate-100" : "bg-[#F8FAFC] text-slate-900"
    }`}>
      {/* Top Banner: Informational & Controls */}
      <aside aria-label="Modalità Anteprima" className="sticky top-0 z-50 border-b border-emerald-500/30 bg-emerald-950/90 text-emerald-100 backdrop-blur-md px-4 py-2.5 text-xs">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold uppercase tracking-wider text-emerald-300">Preview Grafica Locale</span>
            <span className="hidden sm:inline text-emerald-200/70">|</span>
            <span className="hidden sm:inline text-emerald-200/90">
              Nessuna modifica è stata pushata su GitHub. Questa pagina illustra il concept "LCSIM Pro Broadcast & Analytics".
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setThemeMode(isDark ? "light" : "dark")}
              className="px-2.5 py-1 rounded bg-emerald-900/80 hover:bg-emerald-800 border border-emerald-600/40 text-emerald-100 transition-colors flex items-center gap-1.5 font-medium"
            >
              <span>{isDark ? "☀️ Modalità Chiara" : "🌙 Modalità Scura"}</span>
            </button>
            <Link
              to="/"
              className="px-2.5 py-1 rounded bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="h-3 w-3" />
              <span>Torna al Sito Attuale</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* Pro Broadcast Navigation Bar */}
      <header className={`border-b transition-colors backdrop-blur-md sticky top-[41px] z-40 ${
        isDark 
          ? "bg-[#0B1120]/80 border-slate-800/80" 
          : "bg-white/85 border-slate-200 shadow-sm"
      }`}>
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Brand Logo & Live Pill */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <img 
                  src="/images/LCSIM_Logo_SMALL.png" 
                  alt="LCSIM" 
                  className="h-8 w-8 object-contain filter drop-shadow"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold tracking-tight text-lg">LCSIM</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded tracking-widest uppercase ${
                      isDark ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-emerald-100 text-emerald-800"
                    }`}>
                      PRO
                    </span>
                  </div>
                  <p className={`text-[11px] font-medium leading-none ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    Lega Calcio Simulato • Serie A
                  </p>
                </div>
              </div>

              <div className={`hidden lg:flex items-center gap-2 ml-4 px-2.5 py-1 rounded-full text-xs font-semibold ${
                isDark ? "bg-slate-800/80 text-slate-300 border border-slate-700/60" : "bg-slate-100 text-slate-700 border border-slate-200"
              }`}>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="font-mono">STAGIONE 9</span>
                <span className="text-slate-500">•</span>
                <span className="text-emerald-500 font-bold">GIORNATA 10</span>
              </div>
            </div>

            {/* Nav Tabs */}
            <div className="flex items-center gap-1">
              {[
                { id: "dashboard", label: "Dashboard Hub", icon: Layers },
                { id: "classifica", label: "Classifica Pro", icon: Trophy },
                { id: "giocatori", label: "Scheda Scouting", icon: Activity },
                { id: "design-system", label: "Design System & Specifiche", icon: Sparkles },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all ${
                      isActive
                        ? isDark
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm"
                          : "bg-emerald-600 text-white shadow-sm"
                        : isDark
                          ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="container mx-auto px-4 py-8">
        {/* ========================================================= */}
        {/* TAB 1: DASHBOARD HUB (HOME PRO) */}
        {/* ========================================================= */}
        {activeTab === "dashboard" && (
          <div className="space-y-8 animate-in fade-in-50 duration-300">
            {/* Broadcast Hero Strip */}
            <section aria-label="Panoramica Campionato" className={`relative overflow-hidden rounded-2xl border p-6 md:p-8 ${
              isDark 
                ? "bg-gradient-to-br from-[#0F172A] via-[#0B1329] to-[#0A0E17] border-slate-800/90 shadow-2xl" 
                : "bg-gradient-to-br from-white via-slate-50 to-emerald-50/30 border-slate-200 shadow-md"
            }`}>
              {/* Background ambient mesh */}
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />

              <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                      Serie A Ufficiale • LCSIM
                    </span>
                    <span className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      Edizione Manageriale 2024/25
                    </span>
                  </div>
                  <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                    Centro Dati & Telemetria di Lega
                  </h1>
                  <p className={`text-sm md:text-base max-w-2xl ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                    Monitora classifiche in tempo reale, statistiche avanzate dei giocatori e andamento delle rose con precisione broadcast.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button 
                    onClick={() => setActiveTab("classifica")}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all shadow-lg shadow-emerald-950/20 flex items-center gap-2"
                  >
                    <Trophy className="h-4 w-4" />
                    <span>Esplora Classifica</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab("giocatori")}
                    className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition-all border ${
                      isDark 
                        ? "bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border-slate-700" 
                        : "bg-white hover:bg-slate-50 text-slate-700 border-slate-300 shadow-sm"
                    } flex items-center gap-2`}
                  >
                    <Activity className="h-4 w-4" />
                    <span>Radar Giocatori</span>
                  </button>
                </div>
              </div>

              {/* Quick telemetry metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-700/40">
                {[
                  { label: "Giornata Attuale", value: "10ª", sub: "su 18 giornate", trend: "55% completato" },
                  { label: "Squadre Iscritte", value: `${standings.length || 12}`, sub: "Serie A Unica", trend: "100% attive" },
                  { label: "Gol Totali Stagione", value: "142", sub: "Media 2.63 / partita", trend: "+8% vs S8" },
                  { label: "Giocatori Censiti", value: `${players.length || 240}+`, sub: "Database Completo", trend: "Verificati" },
                ].map((stat, i) => (
                  <div key={i} className="space-y-1">
                    <span className={`text-[11px] font-semibold uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      {stat.label}
                    </span>
                    <div className="text-2xl font-bold font-mono tracking-tight text-emerald-400">
                      {stat.value}
                    </div>
                    <div className={`text-[11px] flex items-center gap-1.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      <span>{stat.sub}</span>
                      <span className="text-emerald-500 font-semibold">• {stat.trend}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Split Screen: Classifica Spotlight + Top Scorers */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Standings Summary (2 Cols) */}
              <div className={`lg:col-span-2 rounded-2xl border p-5 md:p-6 transition-all ${
                isDark ? "bg-[#0F172A]/80 border-slate-800/80" : "bg-white border-slate-200 shadow-sm"
              }`}>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <Trophy className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="font-bold text-base md:text-lg">Zona Vertice & Qualificazioni</h2>
                      <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                        Prime 6 posizioni valevoli per la fase finale
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab("classifica")}
                    className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
                  >
                    <span>Vedi Tutto</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Micro Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className={`border-b text-[11px] font-semibold uppercase tracking-wider ${
                        isDark ? "border-slate-800 text-slate-400" : "border-slate-200 text-slate-500"
                      }`}>
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
                    <tbody className="divide-y divide-slate-800/40">
                      {standings.slice(0, 6).map((team, idx) => {
                        const isChampions = idx < 2;
                        const isPlayoff = idx >= 2 && idx < 4;
                        return (
                          <tr 
                            key={idx} 
                            className={`group transition-colors ${
                              isDark ? "hover:bg-slate-800/40" : "hover:bg-slate-50"
                            }`}
                          >
                            <td className="py-3 px-3 text-center">
                              <span className={`inline-flex items-center justify-center h-6 w-6 rounded-md font-mono text-xs font-bold ${
                                isChampions 
                                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                                  : isPlayoff 
                                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                    : isDark ? "text-slate-400" : "text-slate-600"
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
                                  <span className="font-semibold text-sm group-hover:text-emerald-400 transition-colors">
                                    {team.team.NAME}
                                  </span>
                                  <span className={`ml-2 text-[10px] font-mono uppercase px-1 rounded ${
                                    isDark ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-600"
                                  }`}>
                                    {team.team.TEAM_ID}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-center font-mono text-xs">{team.games_played}</td>
                            <td className="py-3 px-3 text-center font-mono text-xs text-emerald-500 font-semibold">{team.win}</td>
                            <td className="py-3 px-3 text-center font-mono text-xs text-slate-400">{team.draws}</td>
                            <td className="py-3 px-3 text-center font-mono text-xs text-rose-500">{team.loss}</td>
                            <td className="py-3 px-3 text-center font-mono text-xs">
                              {team.goal_difference > 0 ? `+${team.goal_difference}` : team.goal_difference}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className="font-mono font-bold text-sm text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
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

              {/* Top Scorers Spotlight (1 Col) */}
              <div className={`rounded-2xl border p-5 md:p-6 transition-all space-y-4 ${
                isDark ? "bg-[#0F172A]/80 border-slate-800/80" : "bg-white border-slate-200 shadow-sm"
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <Flame className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="font-bold text-base">Classifica Marcatori</h2>
                      <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>Top bomber in corsa</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  {(topScorers.length ? topScorers : [
                    { player_id: "1", goals: 9, matches_played: 10, sum_voto: 75.5 },
                    { player_id: "2", goals: 7, matches_played: 9, sum_voto: 68.2 },
                    { player_id: "3", goals: 6, matches_played: 10, sum_voto: 71.0 },
                  ]).slice(0, 5).map((scorer, i) => (
                    <div 
                      key={i} 
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                        isDark 
                          ? "bg-slate-800/40 border-slate-800/80 hover:border-slate-700" 
                          : "bg-slate-50 border-slate-200/80 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`h-6 w-6 rounded-md font-mono text-xs font-bold flex items-center justify-center ${
                          i === 0 ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : isDark ? "text-slate-400" : "text-slate-600"
                        }`}>
                          {i + 1}
                        </span>
                        <div>
                          <p className="font-semibold text-xs md:text-sm">
                            {scorer.player_id || "Giocatore Pro"}
                          </p>
                          <p className={`text-[11px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                            {scorer.matches_played} presenze • {(scorer.sum_voto / (scorer.matches_played || 1)).toFixed(2)} media voto
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-mono text-base font-extrabold text-amber-400">
                          {scorer.goals}
                        </span>
                        <span className={`block text-[10px] font-semibold uppercase ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                          Gol
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: CLASSIFICA PRO (STANDINGS REDESIGN) */}
        {/* ========================================================= */}
        {activeTab === "classifica" && (
          <div className="space-y-6 animate-in fade-in-50 duration-300">
            {/* Header / Subnav */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                  Classifica Generale Ufficiale
                </h1>
                <p className={`text-xs md:text-sm mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  Stagione Regolare 2024/25 • Aggiornato al {new Date().toLocaleDateString('it-IT')}
                </p>
              </div>

              {/* Legend of Zones */}
              <div className="flex flex-wrap items-center gap-3 text-xs font-medium">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span>Champions (1-2)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                  <span>Playoff (3-4)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                  <span>Retrocessione (11-12)</span>
                </span>
              </div>
            </div>

            {/* Standings Table Card */}
            <div className={`rounded-2xl border overflow-hidden shadow-sm transition-all ${
              isDark ? "bg-[#0F172A]/90 border-slate-800" : "bg-white border-slate-200"
            }`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className={`border-b text-[11px] font-bold uppercase tracking-wider ${
                      isDark ? "bg-[#0B1222] border-slate-800 text-slate-400" : "bg-slate-100 border-slate-200 text-slate-600"
                    }`}>
                      <th className="py-3 px-3 text-center w-12">Pos</th>
                      <th className="py-3 px-4">Club</th>
                      <th className="py-3 px-3 text-center font-semibold">G</th>
                      <th className="py-3 px-3 text-center font-semibold text-emerald-400">V</th>
                      <th className="py-3 px-3 text-center font-semibold">N</th>
                      <th className="py-3 px-3 text-center font-semibold text-rose-400">P</th>
                      <th className="py-3 px-3 text-center font-semibold">GF</th>
                      <th className="py-3 px-3 text-center font-semibold">GS</th>
                      <th className="py-3 px-3 text-center font-semibold">DR</th>
                      <th className="py-3 px-3 text-center font-semibold">Casa</th>
                      <th className="py-3 px-4 text-center font-extrabold text-sm text-foreground">Punti</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? "divide-slate-800/60" : "divide-slate-200"}`}>
                    {standings.map((team, index) => {
                      const pos = index + 1;
                      const isChampions = pos <= 2;
                      const isPlayoff = pos > 2 && pos <= 4;
                      const isRelegation = pos >= 11;

                      return (
                        <tr 
                          key={index} 
                          className={`group transition-colors relative ${
                            isDark ? "hover:bg-slate-800/50" : "hover:bg-slate-50"
                          } ${
                            isChampions 
                              ? isDark ? "bg-emerald-500/[0.02]" : "bg-emerald-500/[0.04]"
                              : isRelegation 
                                ? isDark ? "bg-rose-500/[0.02]" : "bg-rose-500/[0.04]"
                                : ""
                          }`}
                        >
                          {/* Position Badge with colored stripe */}
                          <td className="py-3.5 px-3 text-center relative">
                            {/* Left indicator bar */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                              isChampions 
                                ? "bg-emerald-500" 
                                : isPlayoff 
                                  ? "bg-blue-500" 
                                  : isRelegation 
                                    ? "bg-rose-500" 
                                    : "bg-transparent"
                            }`} />
                            <span className={`inline-flex items-center justify-center h-6 w-6 rounded-md font-mono text-xs font-bold ${
                              isChampions
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : isPlayoff
                                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                  : isRelegation
                                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                    : isDark ? "text-slate-400" : "text-slate-600"
                            }`}>
                              {pos}
                            </span>
                          </td>

                          {/* Team Identity */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={`/images/teams/${team.team.TEAM_ID}_Logo.png`}
                                alt=""
                                className="h-7 w-7 object-contain filter drop-shadow-sm"
                                onError={(e) => (e.currentTarget.style.display = 'none')}
                              />
                              <div>
                                <span className="font-semibold text-sm group-hover:text-emerald-400 transition-colors">
                                  {team.team.NAME}
                                </span>
                                <span className={`ml-2 text-[10px] font-mono uppercase px-1.5 py-0.5 rounded ${
                                  isDark ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-600"
                                }`}>
                                  {team.team.TEAM_ID}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Stats in Tabular Monospace */}
                          <td className="py-3.5 px-3 text-center font-mono text-xs">{team.games_played}</td>
                          <td className="py-3.5 px-3 text-center font-mono text-xs font-bold text-emerald-400">{team.win}</td>
                          <td className="py-3.5 px-3 text-center font-mono text-xs text-slate-400">{team.draws}</td>
                          <td className="py-3.5 px-3 text-center font-mono text-xs text-rose-400">{team.loss}</td>
                          <td className="py-3.5 px-3 text-center font-mono text-xs">{team.goal_made}</td>
                          <td className="py-3.5 px-3 text-center font-mono text-xs">{team.goal_conceded}</td>
                          <td className="py-3.5 px-3 text-center font-mono text-xs font-semibold">
                            {team.goal_difference > 0 ? `+${team.goal_difference}` : team.goal_difference}
                          </td>
                          <td className="py-3.5 px-3 text-center font-mono text-xs text-slate-400">{team.played_at_home}</td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-block px-3 py-1 rounded-lg font-mono font-extrabold text-sm text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 shadow-sm">
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
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: SCHEDA SCOUTING & GIOCATORE PRO */}
        {/* ========================================================= */}
        {activeTab === "giocatori" && (
          <div className="space-y-6 animate-in fade-in-50 duration-300">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                Dossier Giocatore & Scouting Pro
              </h1>
              <p className={`text-xs md:text-sm mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                Visualizzazione ad alta intensità analitica, ideale per rose e tattiche.
              </p>
            </div>

            {/* Player Card Showcase */}
            <div className={`rounded-2xl border p-6 md:p-8 max-w-4xl mx-auto ${
              isDark ? "bg-[#0F172A] border-slate-800 shadow-2xl" : "bg-white border-slate-200 shadow-lg"
            }`}>
              {/* Header: Photo / Badge / Meta */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800">
                <div className="flex items-center gap-5">
                  {/* OVR Hexagon Badge */}
                  <div className="relative flex flex-col items-center justify-center h-20 w-20 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-slate-950 font-black shadow-lg shadow-amber-950/30">
                    <span className="text-3xl font-mono leading-none tracking-tight">{featuredPlayer.OVR}</span>
                    <span className="text-[10px] uppercase font-bold tracking-widest mt-0.5">OVR</span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-xs font-bold uppercase bg-rose-500/20 text-rose-400 border border-rose-500/30">
                        {featuredPlayer.Posiz}
                      </span>
                      <span className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                        {featuredPlayer.Squadra}
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        Intoccabile
                      </span>
                    </div>

                    <h2 className="text-2xl md:text-3xl font-black tracking-tight">
                      {featuredPlayer.NomeCompleto}
                    </h2>

                    <div className={`flex items-center gap-4 text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      <span>Età: <strong className="text-foreground">{featuredPlayer.Età} anni</strong></span>
                      <span>Altezza: <strong className="text-foreground">{featuredPlayer.Altezza} cm</strong></span>
                      <span>Piede: <strong className="text-foreground">{featuredPlayer.Piede}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Macro Rating Hexagrid */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {[
                    { label: "VEL", val: featuredPlayer.VEL },
                    { label: "TIR", val: featuredPlayer.TIR },
                    { label: "PAS", val: featuredPlayer.PAS },
                    { label: "DRI", val: featuredPlayer.DRI },
                    { label: "DIF", val: featuredPlayer.DIF },
                    { label: "FIS", val: featuredPlayer.FIS },
                  ].map((m, i) => (
                    <div 
                      key={i} 
                      className={`text-center p-2 rounded-xl border ${
                        isDark ? "bg-slate-900/80 border-slate-800" : "bg-slate-50 border-slate-200"
                      }`}
                    >
                      <span className={`block text-[10px] font-bold ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                        {m.label}
                      </span>
                      <span className="text-lg font-mono font-extrabold text-emerald-400">
                        {m.val || 75}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Attributes breakdown preview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                {[
                  { name: "Finalizzazione", val: 92, code: "FIN" },
                  { name: "Potenza di Tiro", val: 89, code: "POT" },
                  { name: "Scatto & Accelerazione", val: 94, code: "ACC" },
                  { name: "Controllo di Palla", val: 88, code: "CON" },
                  { name: "Freddezza Sotto Porta", val: 90, code: "FRE" },
                  { name: "Resistenza & Stamina", val: 85, code: "RES" },
                ].map((stat, i) => (
                  <div 
                    key={i} 
                    className={`p-3 rounded-xl border flex items-center justify-between ${
                      isDark ? "bg-slate-800/30 border-slate-800" : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                        isDark ? "bg-slate-800 text-slate-400" : "bg-slate-200 text-slate-600"
                      }`}>
                        {stat.code}
                      </span>
                      <span className="text-sm font-semibold">{stat.name}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-24 h-2 rounded-full bg-slate-800 overflow-hidden hidden sm:block">
                        <div 
                          className="h-full bg-emerald-500 rounded-full" 
                          style={{ width: `${stat.val}%` }} 
                        />
                      </div>
                      <span className="font-mono text-base font-bold text-emerald-400 w-8 text-right">
                        {stat.val}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: DESIGN SYSTEM & CONFRONTO TECNICO */}
        {/* ========================================================= */}
        {activeTab === "design-system" && (
          <div className="space-y-8 animate-in fade-in-50 duration-300">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                Specifiche del Design System "LCSIM Pro"
              </h1>
              <p className={`text-xs md:text-sm mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                Confronto tra l'impostazione attuale e l'evoluzione verso uno stile istituzionale, serio ed editoriale.
              </p>
            </div>

            {/* Comparison Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Stile Attuale */}
              <div className={`p-6 rounded-2xl border ${
                isDark ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200"
              }`}>
                <div className="flex items-center gap-2 mb-4">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  <h3 className="font-bold text-base">Stile Attuale (Casual / Gaming)</h3>
                </div>
                <ul className={`space-y-3 text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 font-bold">•</span>
                    <span><strong>Font Poppins:</strong> Rotondo e giocoso, tipico di app casuali ma poco autorevole per statistiche sportive.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 font-bold">•</span>
                    <span><strong>Hero con logo gigante:</strong> Un'immagine da 240px centrata che toglie spazio visivo ai dati e alla classifica.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 font-bold">•</span>
                    <span><strong>Verde brillante generico:</strong> Tinte sature prive di sfumature slate/dark blue istituzionali.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 font-bold">•</span>
                    <span><strong>Tabelle semplici:</strong> Mancanza di indicatori cromatici verticali per zone Champions/Retrocessione e numeri non incolonnati a larghezza fissa.</span>
                  </li>
                </ul>
              </div>

              {/* Stile Pro / Serio */}
              <div className={`p-6 rounded-2xl border-2 border-emerald-500/40 ${
                isDark ? "bg-[#0F172A] shadow-xl shadow-emerald-950/20" : "bg-emerald-50/20 shadow-lg"
              }`}>
                <div className="flex items-center gap-2 mb-4">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <h3 className="font-bold text-base text-emerald-400">Nuovo Stile Pro (Wyscout / The Athletic Style)</h3>
                </div>
                <ul className={`space-y-3 text-sm ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Tipografia Ingegnerizzata:</strong> `Inter` o `Plus Jakarta Sans` con tracking stretto sui titoli e `font-mono tabular-nums` su punti e statistiche.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Hero Hub Broadcast:</strong> Barra informativa compatta con telemetria in tempo reale (giornata, gol totali, media voto).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Palette Obsidian & Slate:</strong> Sfondo dark `slate-950` con superfici in contrasto, dettagli in oro metallico e accento verde campo tecnico (`#10B981`).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Tabelle Broadcast:</strong> Indicatori di zona (Champions, Playoff, Salvezza) con barre laterali colorate e pillole di forma.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Color Palette Swatches */}
            <div className={`p-6 rounded-2xl border ${
              isDark ? "bg-[#0F172A] border-slate-800" : "bg-white border-slate-200"
            }`}>
              <h3 className="font-bold text-base mb-4">Tavolozza Colori Proposta</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                {[
                  { name: "Obsidian Deep", hex: "#090D16", use: "Background Scura" },
                  { name: "Slate Surface", hex: "#0F172A", use: "Card & Modali" },
                  { name: "Pitch Emerald", hex: "#10B981", use: "Accento Primario" },
                  { name: "Gold Prestige", hex: "#F59E0B", use: "Leaderboard & MVP" },
                  { name: "Tactical Blue", hex: "#3B82F6", use: "Playoff & Ruoli" },
                  { name: "Danger Rose", hex: "#F43F5E", use: "Retrocessione & Sconfitte" },
                ].map((color, i) => (
                  <div key={i} className="space-y-1.5">
                    <div 
                      className="h-16 w-full rounded-xl border border-white/10 shadow-inner flex items-end p-2" 
                      style={{ backgroundColor: color.hex }}
                    >
                      <span className="text-[10px] font-mono font-bold text-white bg-black/60 px-1 rounded backdrop-blur-sm">
                        {color.hex}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-bold leading-tight">{color.name}</p>
                      <p className={`text-[10px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>{color.use}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Standings } from "@/types/standings";
import { 
  Trophy, ChevronLeft, ChevronRight, X, Route, Sparkles, 
  Layers, Swords, Calendar, Shield, Crown
} from "lucide-react";

interface PlayoffBracketProps {
  standings: Standings[];
}

// Mappa del percorso per ogni testa di serie (posizioni 1-10)
const getTeamPath = (teamPos: number): { round: number; opponents: number[] }[] => {
  const paths: Record<number, { round: number; opponents: number[] }[]> = {
    1: [{ round: 1, opponents: [8, 9] }, { round: 2, opponents: [4, 5] }, { round: 3, opponents: [2, 3, 6, 7, 10] }],
    2: [{ round: 1, opponents: [7, 10] }, { round: 2, opponents: [3, 6] }, { round: 3, opponents: [1, 4, 5, 8, 9] }],
    3: [{ round: 1, opponents: [6] }, { round: 2, opponents: [2, 7, 10] }, { round: 3, opponents: [1, 4, 5, 8, 9] }],
    4: [{ round: 1, opponents: [5] }, { round: 2, opponents: [1, 8, 9] }, { round: 3, opponents: [2, 3, 6, 7, 10] }],
    5: [{ round: 1, opponents: [4] }, { round: 2, opponents: [1, 8, 9] }, { round: 3, opponents: [2, 3, 6, 7, 10] }],
    6: [{ round: 1, opponents: [3] }, { round: 2, opponents: [2, 7, 10] }, { round: 3, opponents: [1, 4, 5, 8, 9] }],
    7: [{ round: 0, opponents: [10] }, { round: 1, opponents: [2] }, { round: 2, opponents: [3, 6] }, { round: 3, opponents: [1, 4, 5, 8, 9] }],
    8: [{ round: 0, opponents: [9] }, { round: 1, opponents: [1] }, { round: 2, opponents: [4, 5] }, { round: 3, opponents: [2, 3, 6, 7, 10] }],
    9: [{ round: 0, opponents: [8] }, { round: 1, opponents: [1] }, { round: 2, opponents: [4, 5] }, { round: 3, opponents: [2, 3, 6, 7, 10] }],
    10: [{ round: 0, opponents: [7] }, { round: 1, opponents: [2] }, { round: 2, opponents: [3, 6] }, { round: 3, opponents: [1, 4, 5, 8, 9] }],
  };
  return paths[teamPos] || [];
};

const PlayoffBracket = ({ standings }: PlayoffBracketProps) => {
  const teams = standings.slice(0, 10);
  const [viewMode, setViewMode] = useState<"bracket" | "rounds">("bracket");
  const [currentRound, setCurrentRound] = useState(1); // default Quarti
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);

  const rounds = [
    { id: 0, key: "playin", title: "Play In", subtitle: "Turno Preliminare", date: "15-16 Maggio", isFinal: false },
    { id: 1, key: "quarti", title: "Quarti di Finale", subtitle: "Gara Secca", date: "22-23 Maggio", isFinal: false },
    { id: 2, key: "semifinali", title: "Semifinali", subtitle: "Andata / Ritorno", date: "29-30 Maggio", isFinal: false },
    { id: 3, key: "finale", title: "Grande Finale", subtitle: "Gara per il Titolo", date: "5-6 Giugno", isFinal: true },
  ];

  const isTeamInMatch = (teamPos: number, roundId: number): boolean => {
    if (!selectedTeam) return false;
    if (teamPos === selectedTeam) return true;
    const path = getTeamPath(selectedTeam);
    return path.some(p => p.round === roundId && p.opponents.includes(teamPos));
  };

  const isMatchHighlighted = (team1Pos: number, team2Pos: number, roundId: number): boolean => {
    if (!selectedTeam) return false;
    return isTeamInMatch(team1Pos, roundId) || isTeamInMatch(team2Pos, roundId);
  };

  const selectedTeamData = selectedTeam ? teams[selectedTeam - 1] : null;

  // Singola riga squadra nel match
  const TeamRow = ({
    teamPos,
    placeholder,
    score = "–",
    isTop = false,
    roundId = 0,
    seedAdvantage = false,
  }: {
    teamPos?: number;
    placeholder?: string;
    score?: string | number;
    isTop?: boolean;
    roundId?: number;
    seedAdvantage?: boolean;
  }) => {
    if (!teamPos) {
      return (
        <div className={`flex items-center justify-between px-3.5 py-2.5 ${isTop ? 'border-b border-border/50' : ''} bg-muted/20 text-muted-foreground`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground border">TBD</span>
            <span className="text-xs italic truncate">{placeholder || "Da determinare"}</span>
          </div>
          <span className="text-xs font-mono text-muted-foreground font-semibold">{score}</span>
        </div>
      );
    }

    const team = teams[teamPos - 1];
    const isSelected = selectedTeam === teamPos;
    const isInPath = isTeamInMatch(teamPos, roundId);
    const isMuted = selectedTeam !== null && !isInPath && !isSelected;

    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
          setSelectedTeam(selectedTeam === teamPos ? null : teamPos);
        }}
        title={`Clicca per tracciare il cammino di ${team?.team?.NAME || `Testa di serie #${teamPos}`}`}
        className={`
          flex items-center justify-between px-3.5 py-2.5 cursor-pointer transition-all duration-200
          ${isTop ? 'border-b border-border/60' : ''}
          ${isSelected 
            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 font-semibold' 
            : isInPath && selectedTeam
              ? 'bg-emerald-500/10 text-foreground'
              : 'hover:bg-muted/60 text-foreground'}
          ${isMuted ? 'opacity-35 hover:opacity-75' : ''}
        `}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Seed Pill */}
          <span className={`inline-flex items-center justify-center h-5 w-5 rounded text-[10px] font-mono font-bold flex-shrink-0 ${
            teamPos <= 2 
              ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' 
              : teamPos <= 6
                ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                : 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
          }`}>
            {teamPos}°
          </span>

          {/* Logo */}
          <img
            src={`/images/teams/${team?.team.TEAM_ID}_Logo.png`}
            alt={team?.team.NAME || ""}
            className="h-6 w-6 object-contain flex-shrink-0 filter drop-shadow-sm"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />

          {/* Nome Squadra */}
          <div className="truncate min-w-0">
            <span className="text-xs md:text-sm font-medium truncate block">
              {team?.team.NAME || `Squadra #${teamPos}`}
            </span>
          </div>

          {seedAdvantage && (
            <span className="hidden xl:inline text-[9px] uppercase tracking-wider font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1 rounded">
              Home
            </span>
          )}
        </div>

        {/* Punteggio o Placeholder */}
        <span className={`text-sm font-mono font-bold ml-2 ${
          isSelected 
            ? 'text-emerald-600 dark:text-emerald-400' 
            : 'text-muted-foreground'
        }`}>
          {score}
        </span>
      </div>
    );
  };

  // Singola Match Card
  const MatchCard = ({
    code,
    team1Pos,
    team2Pos,
    placeholder1,
    placeholder2,
    score1 = "–",
    score2 = "–",
    isFinal = false,
    roundId = 0,
    label,
  }: {
    code: string;
    team1Pos?: number;
    team2Pos?: number;
    placeholder1?: string;
    placeholder2?: string;
    score1?: string | number;
    score2?: string | number;
    isFinal?: boolean;
    roundId?: number;
    label?: string;
  }) => {
    const isHighlighted = (team1Pos && team2Pos) 
      ? isMatchHighlighted(team1Pos, team2Pos, roundId)
      : selectedTeam ? (team1Pos && isTeamInMatch(team1Pos, roundId)) || (team2Pos && isTeamInMatch(team2Pos, roundId)) : false;

    const isFaded = selectedTeam !== null && !isHighlighted;

    return (
      <div className={`
        relative rounded-xl border transition-all duration-300 overflow-hidden shadow-sm
        ${isFinal 
          ? 'bg-gradient-to-b from-amber-500/[0.08] via-card to-card border-amber-500/40 ring-1 ring-amber-500/30 shadow-amber-500/10 shadow-lg' 
          : 'bg-card border-border/80'}
        ${isHighlighted 
          ? 'ring-2 ring-emerald-500 border-emerald-500 shadow-md shadow-emerald-500/20 scale-[1.01]' 
          : isFaded
            ? 'opacity-40 hover:opacity-85'
            : 'hover:border-border hover:shadow-md'}
      `}>
        {/* Card Header strip */}
        <div className={`flex items-center justify-between px-3 py-1.5 border-b text-[10px] font-semibold uppercase tracking-wider ${
          isFinal 
            ? 'bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-300' 
            : 'bg-muted/40 border-border/60 text-muted-foreground'
        }`}>
          <div className="flex items-center gap-1.5 font-mono">
            {isFinal ? <Crown className="h-3 w-3 text-amber-500" /> : <Swords className="h-3 w-3 text-muted-foreground" />}
            <span>{code}</span>
          </div>
          <span className="font-sans normal-case text-[10px] text-muted-foreground">
            {label || rounds[roundId]?.date}
          </span>
        </div>

        {/* Team 1 & Team 2 */}
        <TeamRow 
          teamPos={team1Pos} 
          placeholder={placeholder1} 
          score={score1} 
          isTop 
          roundId={roundId} 
          seedAdvantage={team1Pos !== undefined && team2Pos !== undefined && team1Pos < team2Pos}
        />
        <TeamRow 
          teamPos={team2Pos} 
          placeholder={placeholder2} 
          score={score2} 
          roundId={roundId} 
          seedAdvantage={false}
        />
      </div>
    );
  };

  return (
    <Card className="border border-border/80 shadow-lg overflow-hidden bg-card mt-8">
      {/* Top Header */}
      <CardHeader className="bg-muted/20 border-b border-border/60 p-5 md:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                Post-Season Ufficiale
              </span>
              <span className="text-xs text-muted-foreground">
                Formula a 10 Squadre
              </span>
            </div>
            <CardTitle className="text-xl md:text-2xl font-bold flex items-center gap-2.5">
              <Trophy className="h-6 w-6 text-amber-500" />
              <span>Tabellone Playoff LCSIM</span>
            </CardTitle>
          </div>

          {/* View Mode Toggle: Tabellone vs Fasi */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/60 border border-border/60 self-start sm:self-auto">
            <button
              onClick={() => setViewMode("bracket")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === "bracket"
                  ? "bg-card text-foreground shadow-sm font-bold border border-border/60"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Tabellone Panoramico</span>
            </button>
            <button
              onClick={() => setViewMode("rounds")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === "rounds"
                  ? "bg-card text-foreground shadow-sm font-bold border border-border/60"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>Vista per Fasi</span>
            </button>
          </div>
        </div>

        {/* Team Pathway Selector Pills */}
        <div className="pt-2 border-t border-border/40">
          <div className="flex items-center justify-between gap-2 mb-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Route className="h-3.5 w-3.5 text-emerald-500" />
              <span>Traccia Percorso Squadra:</span>
            </p>
            {selectedTeam && (
              <button
                onClick={() => setSelectedTeam(null)}
                className="text-[11px] font-semibold text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-colors"
              >
                <X className="h-3 w-3" />
                <span>Azzera Selezione</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {teams.map((t, idx) => {
              const pos = idx + 1;
              const isSel = selectedTeam === pos;
              return (
                <button
                  key={pos}
                  onClick={() => setSelectedTeam(isSel ? null : pos)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex-shrink-0 border ${
                    isSel
                      ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40 shadow-sm font-bold scale-105"
                      : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border-border/60"
                  }`}
                >
                  <span className="font-mono text-[10px] font-bold opacity-70">#{pos}</span>
                  <img
                    src={`/images/teams/${t.team.TEAM_ID}_Logo.png`}
                    alt=""
                    className="h-4 w-4 object-contain"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                  <span className="truncate max-w-[90px]">{t.team.NAME}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Banner Alert */}
        {selectedTeamData && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between text-xs animate-in fade-in-50">
            <div className="flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <div className="flex items-center gap-2">
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  Stai visualizzando il cammino di:
                </span>
                <span className="font-extrabold text-foreground underline decoration-emerald-500 decoration-2">
                  {selectedTeamData.team.NAME} (#{selectedTeam}ª classificata)
                </span>
              </div>
            </div>
            <button
              onClick={() => setSelectedTeam(null)}
              className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/30 font-semibold"
            >
              Reset
            </button>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-5 md:p-6">
        {/* ========================================================= */}
        {/* MODALITÀ 1: TABELLONE COMPLETO PANORAMICO (TREE) */}
        {/* ========================================================= */}
        {viewMode === "bracket" ? (
          <div className="overflow-x-auto pb-4">
            <div className="min-w-[980px] grid grid-cols-4 gap-6 relative">
              {/* COLONNA 1: PLAY IN */}
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    Fase 1
                  </span>
                  <h3 className="font-extrabold text-sm text-foreground">Play In Preliminare</h3>
                  <p className="text-[11px] text-muted-foreground">15-16 Maggio • Gara Secca</p>
                </div>

                <div className="space-y-8 pt-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block text-center">
                      Play-In A &rarr; accede a Q1
                    </span>
                    <MatchCard
                      code="PI-1"
                      team1Pos={8}
                      team2Pos={9}
                      roundId={0}
                    />
                  </div>

                  <div className="space-y-1 pt-12">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block text-center">
                      Play-In B &rarr; accede a Q3
                    </span>
                    <MatchCard
                      code="PI-2"
                      team1Pos={7}
                      team2Pos={10}
                      roundId={0}
                    />
                  </div>
                </div>
              </div>

              {/* COLONNA 2: QUARTI DI FINALE */}
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    Fase 2
                  </span>
                  <h3 className="font-extrabold text-sm text-foreground">Quarti di Finale</h3>
                  <p className="text-[11px] text-muted-foreground">22-23 Maggio • Gara Secca</p>
                </div>

                <div className="space-y-4 pt-1">
                  <MatchCard
                    code="Q1"
                    team1Pos={1}
                    placeholder2="Vincente PI-1 (8° vs 9°)"
                    roundId={1}
                  />

                  <MatchCard
                    code="Q2"
                    team1Pos={4}
                    team2Pos={5}
                    roundId={1}
                  />

                  <MatchCard
                    code="Q3"
                    team1Pos={2}
                    placeholder2="Vincente PI-2 (7° vs 10°)"
                    roundId={1}
                  />

                  <MatchCard
                    code="Q4"
                    team1Pos={3}
                    team2Pos={6}
                    roundId={1}
                  />
                </div>
              </div>

              {/* COLONNA 3: SEMIFINALI */}
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Fase 3
                  </span>
                  <h3 className="font-extrabold text-sm text-foreground">Semifinali</h3>
                  <p className="text-[11px] text-muted-foreground">29-30 Maggio • Andata & Ritorno</p>
                </div>

                <div className="space-y-16 pt-8">
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block text-center">
                      Semifinale 1 (Q1 vs Q2)
                    </span>
                    <MatchCard
                      code="SF-1"
                      placeholder1="Vincente Q1 (1°/8°/9°)"
                      placeholder2="Vincente Q2 (4°/5°)"
                      roundId={2}
                    />
                  </div>

                  <div className="space-y-1 pt-6">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block text-center">
                      Semifinale 2 (Q3 vs Q4)
                    </span>
                    <MatchCard
                      code="SF-2"
                      placeholder1="Vincente Q3 (2°/7°/10°)"
                      placeholder2="Vincente Q4 (3°/6°)"
                      roundId={2}
                    />
                  </div>
                </div>
              </div>

              {/* COLONNA 4: GRANDE FINALE & TROFEO */}
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    Epilogo
                  </span>
                  <h3 className="font-extrabold text-sm text-amber-600 dark:text-amber-400">Grande Finale</h3>
                  <p className="text-[11px] text-muted-foreground">5-6 Giugno • Campo Neutro</p>
                </div>

                <div className="pt-20 space-y-6">
                  <MatchCard
                    code="FINAL"
                    placeholder1="Campione Tabellone Nord (SF1)"
                    placeholder2="Campione Tabellone Sud (SF2)"
                    isFinal
                    roundId={3}
                  />

                  {/* Glorious Trophy Podium */}
                  <div className="p-4 rounded-2xl bg-gradient-to-b from-amber-500/20 via-card to-card border border-amber-500/30 text-center shadow-lg shadow-amber-500/10">
                    <div className="inline-flex p-3 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-500 mb-2">
                      <Trophy className="h-8 w-8 animate-bounce" />
                    </div>
                    <h4 className="font-extrabold text-base text-foreground">
                      Campione Ufficiale LCSIM
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Trofeo Serie A Stagione 2024/25
                    </p>
                    <div className="mt-3 py-1 px-3 rounded-lg bg-amber-500/15 border border-amber-500/30 text-[11px] font-bold text-amber-700 dark:text-amber-300 inline-block font-mono">
                      ALBO D'ORO • SERIE A
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================= */
          /* MODALITÀ 2: VISTA A FASI DETTAGLIATA (STEP-BY-STEP) */
          /* ========================================================= */
          <div className="space-y-6">
            {/* Step Navigation Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {rounds.map((r, i) => (
                <button
                  key={r.id}
                  onClick={() => setCurrentRound(i)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    currentRound === i
                      ? r.isFinal
                        ? "bg-amber-500/15 border-amber-500/40 shadow-sm"
                        : "bg-emerald-500/15 border-emerald-500/40 shadow-sm"
                      : "bg-muted/30 border-border/60 hover:bg-muted/60"
                  }`}
                >
                  <span className={`text-[10px] font-bold uppercase tracking-wider block ${
                    currentRound === i ? (r.isFinal ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400") : "text-muted-foreground"
                  }`}>
                    {r.subtitle}
                  </span>
                  <span className="font-bold text-sm text-foreground block truncate">
                    {r.title}
                  </span>
                  <span className="text-[11px] text-muted-foreground block font-mono mt-0.5">
                    {r.date}
                  </span>
                </button>
              ))}
            </div>

            {/* Stage Content */}
            <div className="max-w-xl mx-auto py-4">
              {currentRound === 0 && (
                <div className="space-y-4">
                  <div className="text-center space-y-1 mb-4">
                    <h3 className="font-extrabold text-lg">Turno Preliminare Play In</h3>
                    <p className="text-xs text-muted-foreground">
                      Le squadre classificate dal 7° al 10° posto si sfidano per i 2 pass dei quarti.
                    </p>
                  </div>
                  <MatchCard code="PI-1" team1Pos={8} team2Pos={9} roundId={0} />
                  <MatchCard code="PI-2" team1Pos={7} team2Pos={10} roundId={0} />
                </div>
              )}

              {currentRound === 1 && (
                <div className="space-y-4">
                  <div className="text-center space-y-1 mb-4">
                    <h3 className="font-extrabold text-lg">Quarti di Finale</h3>
                    <p className="text-xs text-muted-foreground">
                      Gara secca con fattore campo a favore della testa di serie migliore.
                    </p>
                  </div>
                  <MatchCard code="Q1" team1Pos={1} placeholder2="Vincente PI-1 (8° vs 9°)" roundId={1} />
                  <MatchCard code="Q2" team1Pos={4} team2Pos={5} roundId={1} />
                  <MatchCard code="Q3" team1Pos={2} placeholder2="Vincente PI-2 (7° vs 10°)" roundId={1} />
                  <MatchCard code="Q4" team1Pos={3} team2Pos={6} roundId={1} />
                </div>
              )}

              {currentRound === 2 && (
                <div className="space-y-4">
                  <div className="text-center space-y-1 mb-4">
                    <h3 className="font-extrabold text-lg">Semifinali Playoff</h3>
                    <p className="text-xs text-muted-foreground">
                      Doppio confronto andata/ritorno per accedere alla finalissima.
                    </p>
                  </div>
                  <MatchCard code="SF-1" placeholder1="Vincente Q1 (1°/8°/9°)" placeholder2="Vincente Q2 (4°/5°)" roundId={2} />
                  <MatchCard code="SF-2" placeholder1="Vincente Q3 (2°/7°/10°)" placeholder2="Vincente Q4 (3°/6°)" roundId={2} />
                </div>
              )}

              {currentRound === 3 && (
                <div className="space-y-6">
                  <div className="text-center space-y-1 mb-4">
                    <h3 className="font-extrabold text-lg text-amber-600 dark:text-amber-400">Finalissima per il Titolo</h3>
                    <p className="text-xs text-muted-foreground">
                      Gara secca per eleggere il Campione di Lega Calcio Simulato.
                    </p>
                  </div>
                  <MatchCard code="FINAL" placeholder1="Campione Tabellone Nord" placeholder2="Campione Tabellone Sud" isFinal roundId={3} />
                  
                  <div className="p-6 rounded-2xl bg-gradient-to-b from-amber-500/20 via-card to-card border border-amber-500/30 text-center shadow-lg shadow-amber-500/10">
                    <Trophy className="h-10 w-10 text-amber-500 mx-auto mb-2" />
                    <h4 className="font-extrabold text-lg text-foreground">Scudetto LCSIM</h4>
                    <p className="text-xs text-muted-foreground">Il vincitore si qualifica direttamente all'albo d'oro</p>
                  </div>
                </div>
              )}

              {/* Prev / Next controls */}
              <div className="flex items-center justify-between pt-6 border-t border-border/50">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentRound(prev => Math.max(0, prev - 1))}
                  disabled={currentRound === 0}
                  className="gap-1.5 text-xs font-semibold"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Fase Precedente</span>
                </Button>
                <span className="text-xs text-muted-foreground font-mono">
                  {currentRound + 1} di {rounds.length}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentRound(prev => Math.min(rounds.length - 1, prev + 1))}
                  disabled={currentRound === rounds.length - 1}
                  className="gap-1.5 text-xs font-semibold"
                >
                  <span>Fase Successiva</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Footer / Legend */}
        <div className="mt-8 pt-4 border-t border-border/60 flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded bg-emerald-500" />
              <span>1°-2° (Accesso Quarti con fattore campo)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded bg-blue-500" />
              <span>3°-6° (Accesso Quarti di finale)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded bg-amber-500" />
              <span>7°-10° (Turno Play In Preliminare)</span>
            </div>
          </div>
          <p className="text-[11px] font-mono">
            * I numeri indicano il piazzamento al termine della regular season
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlayoffBracket;

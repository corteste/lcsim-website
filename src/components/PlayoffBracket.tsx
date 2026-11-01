import { SUPABASE_STORAGE_URL } from "@/constants/App";
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Standings } from "@/types/standings";
import { supabase } from "@/supabaseClient";
import {
  Trophy,
  ChevronLeft,
  ChevronRight,
  X,
  Route,
  Layers,
  Swords,
  Calendar,
  Crown,
  CheckCircle2,
} from "lucide-react";

interface PlayoffBracketProps {
  standings: Standings[];
}

interface DBPlayoffMatch {
  stag: number;
  week: number;
  home: string;
  away: string;
  stadium?: string;
  date?: string;
  match_time?: string;
  unlock_at?: string | null;
  home_gol?: number | null;
  away_gol?: number | null;
  is_played: boolean;
  winner_id?: string | null;
}

// Mappa del percorso per ogni testa di serie (posizioni 1-12) secondo il tabellone ufficiale
const getTeamPath = (teamPos: number): { round: number; opponents: number[] }[] => {
  const paths: Record<number, { round: number; opponents: number[] }[]> = {
    1: [
      { round: 1, opponents: [8, 9] },
      { round: 2, opponents: [4, 5, 12] },
      { round: 3, opponents: [2, 3, 6, 7, 10, 11] },
    ],
    2: [
      { round: 1, opponents: [7, 10] },
      { round: 2, opponents: [3, 6, 11] },
      { round: 3, opponents: [1, 4, 5, 8, 9, 12] },
    ],
    3: [
      { round: 1, opponents: [6, 11] },
      { round: 2, opponents: [2, 7, 10] },
      { round: 3, opponents: [1, 4, 5, 8, 9, 12] },
    ],
    4: [
      { round: 1, opponents: [5, 12] },
      { round: 2, opponents: [1, 8, 9] },
      { round: 3, opponents: [2, 3, 6, 7, 10, 11] },
    ],
    5: [
      { round: 0, opponents: [12] },
      { round: 1, opponents: [4] },
      { round: 2, opponents: [1, 8, 9] },
      { round: 3, opponents: [2, 3, 6, 7, 10, 11] },
    ],
    6: [
      { round: 0, opponents: [11] },
      { round: 1, opponents: [3] },
      { round: 2, opponents: [2, 7, 10] },
      { round: 3, opponents: [1, 4, 5, 8, 9, 12] },
    ],
    7: [
      { round: 0, opponents: [10] },
      { round: 1, opponents: [2] },
      { round: 2, opponents: [3, 6, 11] },
      { round: 3, opponents: [1, 4, 5, 8, 9, 12] },
    ],
    8: [
      { round: 0, opponents: [9] },
      { round: 1, opponents: [1] },
      { round: 2, opponents: [4, 5, 12] },
      { round: 3, opponents: [2, 3, 6, 7, 10, 11] },
    ],
    9: [
      { round: 0, opponents: [8] },
      { round: 1, opponents: [1] },
      { round: 2, opponents: [4, 5, 12] },
      { round: 3, opponents: [2, 3, 6, 7, 10, 11] },
    ],
    10: [
      { round: 0, opponents: [7] },
      { round: 1, opponents: [2] },
      { round: 2, opponents: [3, 6, 11] },
      { round: 3, opponents: [1, 4, 5, 8, 9, 12] },
    ],
    11: [
      { round: 0, opponents: [6] },
      { round: 1, opponents: [3] },
      { round: 2, opponents: [2, 7, 10] },
      { round: 3, opponents: [1, 4, 5, 8, 9, 12] },
    ],
    12: [
      { round: 0, opponents: [5] },
      { round: 1, opponents: [4] },
      { round: 2, opponents: [1, 8, 9] },
      { round: 3, opponents: [2, 3, 6, 7, 10, 11] },
    ],
  };
  return paths[teamPos] || [];
};

const PlayoffBracket = ({ standings }: PlayoffBracketProps) => {
  // Tutte le 12 squadre della Serie A
  const teams = useMemo(() => standings.slice(0, 12), [standings]);
  const activeSeason = standings[0]?.stag ?? 11;

  const [viewMode, setViewMode] = useState<"bracket" | "rounds">("bracket");
  const [currentRound, setCurrentRound] = useState(1); // default Quarti
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);

  // Risultati reali da DB (an_schedule + view_team_stats per week >= 12)
  const [dbMatches, setDbMatches] = useState<DBPlayoffMatch[]>([]);

  useEffect(() => {
    async function loadPlayoffData() {
      try {
        const [schedRes, statsRes] = await Promise.all([
          supabase
            .from("an_schedule")
            .select("*")
            .eq("stag", activeSeason)
            .gte("week", 12),
          supabase
            .from("view_team_stats")
            .select("*")
            .eq("stag", activeSeason)
            .gte("week", 12),
        ]);

        if (schedRes.error) {
          console.error("Errore recupero calendario playoff:", schedRes.error);
          return;
        }

        const statsData = statsRes.data || [];
        const matches: DBPlayoffMatch[] = (schedRes.data || []).map((s: any) => {
          const stat = statsData.find(
            (st: any) =>
              st.week === s.week &&
              ((st.home === s.home && st.away === s.away) ||
                (st.home === s.away && st.away === s.home))
          );

          const isPlayed = Boolean(stat && (stat.home_minuti > 0 || stat.away_minuti > 0));
          const homeGol = stat?.home_gol ?? null;
          const awayGol = stat?.away_gol ?? null;

          let winner_id: string | null = null;
          if (isPlayed && homeGol !== null && awayGol !== null) {
            if (homeGol > awayGol) winner_id = s.home;
            else if (awayGol > homeGol) winner_id = s.away;
            else {
              // Parità: passa la testa di serie migliore presente nella classifica
              const homeIdx = teams.findIndex((t) => t.team.TEAM_ID === s.home);
              const awayIdx = teams.findIndex((t) => t.team.TEAM_ID === s.away);
              winner_id = homeIdx <= awayIdx ? s.home : s.away;
            }
          }

          return {
            stag: s.stag,
            week: s.week,
            home: s.home,
            away: s.away,
            stadium: s.stadium,
            date: s.date,
            match_time: s.match_time,
            unlock_at: s.unlock_at,
            home_gol: homeGol,
            away_gol: awayGol,
            is_played: isPlayed,
            winner_id,
          };
        });

        setDbMatches(matches);
      } catch (err) {
        console.error("Eccezione caricamento playoff:", err);
      }
    }

    loadPlayoffData();
  }, [activeSeason, teams]);

  // Helper per trovare una partita specifica a DB
  const findMatch = (week: number, teamAId?: string, teamBId?: string): DBPlayoffMatch | undefined => {
    if (!teamAId && !teamBId) return undefined;
    return dbMatches.find((m) => {
      if (m.week !== week) return false;
      if (teamAId && teamBId) {
        return (
          (m.home === teamAId && m.away === teamBId) ||
          (m.home === teamBId && m.away === teamAId)
        );
      }
      return m.home === teamAId || m.away === teamAId || m.home === teamBId || m.away === teamBId;
    });
  };

  // Helper per ottenere la squadra vincente da un TEAM_ID
  const getTeamById = (teamId?: string | null): Standings | undefined => {
    if (!teamId) return undefined;
    return teams.find((t) => t.team.TEAM_ID === teamId);
  };

  // Helper per ottenere la posizione in classifica (1-based)
  const getTeamSeed = (team?: Standings | null): number | undefined => {
    if (!team) return undefined;
    const idx = teams.findIndex((t) => t.team.TEAM_ID === team.team.TEAM_ID);
    return idx >= 0 ? idx + 1 : undefined;
  };

  // =========================================================================
  // RISOLUZIONE DINAMICA DEL TABELLONE (PLAY-IN -> QUARTI -> SEMIFINALI -> FINALE)
  // =========================================================================

  // --- FASE 1: PLAY-IN (Week 12) ---
  // PI-1: #8 vs #9
  const teamPI1_Top = teams[7]; // #8
  const teamPI1_Bot = teams[8]; // #9
  const matchPI1 = findMatch(12, teamPI1_Top?.team?.TEAM_ID, teamPI1_Bot?.team?.TEAM_ID);
  const winnerPI1 = matchPI1?.is_played ? getTeamById(matchPI1.winner_id) : undefined;

  // PI-2: #5 vs #12
  const teamPI2_Top = teams[4]; // #5
  const teamPI2_Bot = teams[11]; // #12
  const matchPI2 = findMatch(12, teamPI2_Top?.team?.TEAM_ID, teamPI2_Bot?.team?.TEAM_ID);
  const winnerPI2 = matchPI2?.is_played ? getTeamById(matchPI2.winner_id) : undefined;

  // PI-3: #6 vs #11
  const teamPI3_Top = teams[5]; // #6
  const teamPI3_Bot = teams[10]; // #11
  const matchPI3 = findMatch(12, teamPI3_Top?.team?.TEAM_ID, teamPI3_Bot?.team?.TEAM_ID);
  const winnerPI3 = matchPI3?.is_played ? getTeamById(matchPI3.winner_id) : undefined;

  // PI-4: #7 vs #10
  const teamPI4_Top = teams[6]; // #7
  const teamPI4_Bot = teams[9]; // #10
  const matchPI4 = findMatch(12, teamPI4_Top?.team?.TEAM_ID, teamPI4_Bot?.team?.TEAM_ID);
  const winnerPI4 = matchPI4?.is_played ? getTeamById(matchPI4.winner_id) : undefined;

  // --- FASE 2: QUARTI DI FINALE (Week 13) ---
  // Q1: Vincente PI-1 (#8/#9) vs #1
  const teamQ1_Top = winnerPI1;
  const teamQ1_Bot = teams[0]; // #1
  const matchQ1 = findMatch(13, teamQ1_Top?.team?.TEAM_ID, teamQ1_Bot?.team?.TEAM_ID);
  const winnerQ1 = matchQ1?.is_played ? getTeamById(matchQ1.winner_id) : undefined;

  // Q2: #4 vs Vincente PI-2 (#5/#12)
  const teamQ2_Top = teams[3]; // #4
  const teamQ2_Bot = winnerPI2;
  const matchQ2 = findMatch(13, teamQ2_Top?.team?.TEAM_ID, teamQ2_Bot?.team?.TEAM_ID);
  const winnerQ2 = matchQ2?.is_played ? getTeamById(matchQ2.winner_id) : undefined;

  // Q3: Vincente PI-3 (#6/#11) vs #3
  const teamQ3_Top = winnerPI3;
  const teamQ3_Bot = teams[2]; // #3
  const matchQ3 = findMatch(13, teamQ3_Top?.team?.TEAM_ID, teamQ3_Bot?.team?.TEAM_ID);
  const winnerQ3 = matchQ3?.is_played ? getTeamById(matchQ3.winner_id) : undefined;

  // Q4: #2 vs Vincente PI-4 (#7/#10)
  const teamQ4_Top = teams[1]; // #2
  const teamQ4_Bot = winnerPI4;
  const matchQ4 = findMatch(13, teamQ4_Top?.team?.TEAM_ID, teamQ4_Bot?.team?.TEAM_ID);
  const winnerQ4 = matchQ4?.is_played ? getTeamById(matchQ4.winner_id) : undefined;

  // --- FASE 3: SEMIFINALI (Week 14) ---
  // SF-1: Vincente Q1 vs Vincente Q2
  const teamSF1_Top = winnerQ1;
  const teamSF1_Bot = winnerQ2;
  const matchSF1 = findMatch(14, teamSF1_Top?.team?.TEAM_ID, teamSF1_Bot?.team?.TEAM_ID);
  const winnerSF1 = matchSF1?.is_played ? getTeamById(matchSF1.winner_id) : undefined;

  // SF-2: Vincente Q3 vs Vincente Q4
  const teamSF2_Top = winnerQ3;
  const teamSF2_Bot = winnerQ4;
  const matchSF2 = findMatch(14, teamSF2_Top?.team?.TEAM_ID, teamSF2_Bot?.team?.TEAM_ID);
  const winnerSF2 = matchSF2?.is_played ? getTeamById(matchSF2.winner_id) : undefined;

  // --- FASE 4: GRANDE FINALE (Week 15) ---
  const teamFinal_Top = winnerSF1;
  const teamFinal_Bot = winnerSF2;
  const matchFinal = findMatch(15, teamFinal_Top?.team?.TEAM_ID, teamFinal_Bot?.team?.TEAM_ID);
  const championTeam = matchFinal?.is_played ? getTeamById(matchFinal.winner_id) : undefined;

  const rounds = [
    { id: 0, key: "playin", title: "Play In", subtitle: "Turno Preliminare (Gara Secca)", date: "Settimana 12", isFinal: false },
    { id: 1, key: "quarti", title: "Quarti di Finale", subtitle: "Gara Secca", date: "Settimana 13", isFinal: false },
    { id: 2, key: "semifinali", title: "Semifinali", subtitle: "Penultimo Atto", date: "Settimana 14", isFinal: false },
    { id: 3, key: "finale", title: "Grande Finale", subtitle: "Gara per il Titolo", date: "Settimana 15", isFinal: true },
  ];

  const isTeamInMatch = (teamPos: number, roundId: number): boolean => {
    if (!selectedTeam) return false;
    if (teamPos === selectedTeam) return true;
    const path = getTeamPath(selectedTeam);
    return path.some((p) => p.round === roundId && p.opponents.includes(teamPos));
  };

  const isMatchHighlighted = (team1Pos?: number, team2Pos?: number, roundId = 0): boolean => {
    if (!selectedTeam) return false;
    if (team1Pos && isTeamInMatch(team1Pos, roundId)) return true;
    if (team2Pos && isTeamInMatch(team2Pos, roundId)) return true;
    return false;
  };

  const selectedTeamData = selectedTeam ? teams[selectedTeam - 1] : null;

  // Singola riga squadra nel match
  const TeamRow = ({
    team,
    teamPos,
    placeholder,
    score = "–",
    isTop = false,
    roundId = 0,
    seedAdvantage = false,
    isWinner = false,
  }: {
    team?: Standings;
    teamPos?: number;
    placeholder?: string;
    score?: string | number;
    isTop?: boolean;
    roundId?: number;
    seedAdvantage?: boolean;
    isWinner?: boolean;
  }) => {
    const effectivePos = teamPos ?? getTeamSeed(team);

    if (!team && !effectivePos) {
      return (
        <div
          className={`flex items-center justify-between px-3.5 py-2.5 ${
            isTop ? "border-b border-border/50" : ""
          } bg-muted/20 text-muted-foreground`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground border">
              TBD
            </span>
            <span className="text-xs italic truncate">{placeholder || "Da determinare"}</span>
          </div>
          <span className="text-xs font-mono text-muted-foreground font-semibold">{score}</span>
        </div>
      );
    }

    const effectiveTeam = team ?? (effectivePos ? teams[effectivePos - 1] : undefined);
    const isSelected = effectivePos ? selectedTeam === effectivePos : false;
    const isInPath = effectivePos ? isTeamInMatch(effectivePos, roundId) : false;
    const isMuted = selectedTeam !== null && !isInPath && !isSelected;

    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
          if (effectivePos) {
            setSelectedTeam(selectedTeam === effectivePos ? null : effectivePos);
          }
        }}
        title={`Clicca per tracciare il cammino di ${effectiveTeam?.team?.NAME || `Testa di serie #${effectivePos}`}`}
        className={`
          flex items-center justify-between px-3.5 py-2.5 cursor-pointer transition-all duration-200
          ${isTop ? "border-b border-border/60" : ""}
          ${
            isSelected
              ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 font-semibold"
              : isInPath && selectedTeam
              ? "bg-emerald-500/10 text-foreground"
              : "hover:bg-muted/60 text-foreground"
          }
          ${isWinner ? "font-bold text-emerald-600 dark:text-emerald-400" : ""}
          ${isMuted ? "opacity-35 hover:opacity-75" : ""}
        `}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Seed Badge */}
          {effectivePos ? (
            <span
              className={`inline-flex items-center justify-center h-5 w-5 rounded text-[10px] font-mono font-bold flex-shrink-0 ${
                effectivePos <= 4
                  ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                  : "bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30"
              }`}
            >
              #{effectivePos}
            </span>
          ) : (
            <span className="text-[10px] font-mono px-1 rounded bg-muted text-muted-foreground border">
              WIN
            </span>
          )}

          {/* Logo */}
          <img
            src={`${SUPABASE_STORAGE_URL}/images/teams/${effectiveTeam?.team.TEAM_ID}_Logo.png`}
            alt={effectiveTeam?.team.NAME || ""}
            className="h-6 w-6 object-contain flex-shrink-0 filter drop-shadow-sm"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />

          {/* Nome Squadra */}
          <div className="truncate min-w-0">
            <span className="text-xs md:text-sm font-medium truncate block">
              {effectiveTeam?.team.NAME || placeholder || `Squadra #${effectivePos}`}
            </span>
          </div>

          {seedAdvantage && (
            <span className="hidden xl:inline text-[9px] uppercase tracking-wider font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1 rounded">
              Casa
            </span>
          )}
        </div>

        {/* Punteggio o Placeholder */}
        <span
          className={`text-sm font-mono font-bold ml-2 ${
            isSelected || isWinner
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-muted-foreground"
          }`}
        >
          {score}
        </span>
      </div>
    );
  };

  // Singola Match Card
  const MatchCard = ({
    code,
    team1,
    team2,
    team1Pos,
    team2Pos,
    placeholder1,
    placeholder2,
    dbMatch,
    isFinal = false,
    roundId = 0,
    label,
  }: {
    code: string;
    team1?: Standings;
    team2?: Standings;
    team1Pos?: number;
    team2Pos?: number;
    placeholder1?: string;
    placeholder2?: string;
    dbMatch?: DBPlayoffMatch;
    isFinal?: boolean;
    roundId?: number;
    label?: string;
  }) => {
    const t1Pos = team1Pos ?? getTeamSeed(team1);
    const t2Pos = team2Pos ?? getTeamSeed(team2);

    const isHighlighted = isMatchHighlighted(t1Pos, t2Pos, roundId);
    const isFaded = selectedTeam !== null && !isHighlighted;

    const isPlayed = Boolean(dbMatch?.is_played);
    const score1 = isPlayed ? dbMatch?.home_gol ?? "0" : "–";
    const score2 = isPlayed ? dbMatch?.away_gol ?? "0" : "–";

    const winnerId = dbMatch?.winner_id;
    const isWinner1 = Boolean(isPlayed && team1 && team1.team.TEAM_ID === winnerId);
    const isWinner2 = Boolean(isPlayed && team2 && team2.team.TEAM_ID === winnerId);

    return (
      <div
        className={`
        relative rounded-xl border transition-all duration-300 overflow-hidden shadow-sm
        ${
          isFinal
            ? "bg-gradient-to-b from-amber-500/[0.08] via-card to-card border-amber-500/40 ring-1 ring-amber-500/30 shadow-amber-500/10 shadow-lg"
            : "bg-card border-border/80"
        }
        ${
          isHighlighted
            ? "ring-2 ring-emerald-500 border-emerald-500 shadow-md shadow-emerald-500/20 scale-[1.01]"
            : isFaded
            ? "opacity-40 hover:opacity-85"
            : "hover:border-border hover:shadow-md"
        }
      `}
      >
        {/* Card Header Strip */}
        <div
          className={`flex items-center justify-between px-3 py-1.5 border-b text-[10px] font-semibold uppercase tracking-wider ${
            isFinal
              ? "bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-300"
              : "bg-muted/40 border-border/60 text-muted-foreground"
          }`}
        >
          <div className="flex items-center gap-1.5 font-mono">
            {isFinal ? (
              <Crown className="h-3 w-3 text-amber-500" />
            ) : (
              <Swords className="h-3 w-3 text-muted-foreground" />
            )}
            <span>{code}</span>
            {isPlayed && (
              <Badge
                variant="outline"
                className="text-[8px] px-1 py-0 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
              >
                Finale
              </Badge>
            )}
          </div>
          <span className="font-sans normal-case text-[10px] text-muted-foreground">
            {label || rounds[roundId]?.date}
          </span>
        </div>

        {/* Team 1 & Team 2 */}
        <TeamRow
          team={team1}
          teamPos={t1Pos}
          placeholder={placeholder1}
          score={score1}
          isTop
          roundId={roundId}
          seedAdvantage={t1Pos !== undefined && t2Pos !== undefined && t1Pos < t2Pos}
          isWinner={isWinner1}
        />
        <TeamRow
          team={team2}
          teamPos={t2Pos}
          placeholder={placeholder2}
          score={score2}
          roundId={roundId}
          seedAdvantage={t2Pos !== undefined && t1Pos !== undefined && t2Pos < t1Pos}
          isWinner={isWinner2}
        />
      </div>
    );
  };

  return (
    <Card className="border border-border/80 shadow-lg overflow-hidden bg-card">
      {/* Top Header */}
      <CardHeader className="bg-muted/20 border-b border-border/60 p-5 md:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                Post-Season Ufficiale
              </span>
              <span className="text-xs text-muted-foreground">
                Formula Serie A a 12 Squadre
              </span>
            </div>
            <CardTitle className="text-xl md:text-2xl font-bold flex items-center gap-2.5">
              <Trophy className="h-6 w-6 text-amber-500" />
              <span>Tabellone Playoff LCSIM</span>
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Clicca sul nome di una squadra nel tabellone per tracciarne il cammino verso il titolo.
            </p>
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
                  {selectedTeamData.team.NAME} (#{selectedTeam}ª classificata
                  {selectedTeam <= 4 ? " • Quarti Diretti" : " • Play-In"})
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
        {/* MODALITÀ 1: TABELLONE COMPLETO PANORAMICO A 12 SQUADRE     */}
        {/* ========================================================= */}
        {viewMode === "bracket" ? (
          <div className="overflow-x-auto pb-4">
            <div className="min-w-[1080px] grid grid-cols-4 gap-6 relative">
              {/* COLONNA 1: PLAY IN (Week 12) */}
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    Fase 1
                  </span>
                  <h3 className="font-extrabold text-sm text-foreground">Play In Preliminare</h3>
                  <p className="text-[11px] text-muted-foreground">Settimana 12 • Gara Secca</p>
                </div>

                <div className="space-y-6 pt-2">
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block text-center">
                      Play-In 1 &rarr; accede a Q1 (#8 vs #9)
                    </span>
                    <MatchCard
                      code="PI-1"
                      team1={teamPI1_Top}
                      team2={teamPI1_Bot}
                      team1Pos={8}
                      team2Pos={9}
                      dbMatch={matchPI1}
                      roundId={0}
                    />
                  </div>

                  <div className="space-y-1 pt-6">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block text-center">
                      Play-In 2 &rarr; accede a Q2 (#5 vs #12)
                    </span>
                    <MatchCard
                      code="PI-2"
                      team1={teamPI2_Top}
                      team2={teamPI2_Bot}
                      team1Pos={5}
                      team2Pos={12}
                      dbMatch={matchPI2}
                      roundId={0}
                    />
                  </div>

                  <div className="space-y-1 pt-6">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block text-center">
                      Play-In 3 &rarr; accede a Q3 (#6 vs #11)
                    </span>
                    <MatchCard
                      code="PI-3"
                      team1={teamPI3_Top}
                      team2={teamPI3_Bot}
                      team1Pos={6}
                      team2Pos={11}
                      dbMatch={matchPI3}
                      roundId={0}
                    />
                  </div>

                  <div className="space-y-1 pt-6">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block text-center">
                      Play-In 4 &rarr; accede a Q4 (#7 vs #10)
                    </span>
                    <MatchCard
                      code="PI-4"
                      team1={teamPI4_Top}
                      team2={teamPI4_Bot}
                      team1Pos={7}
                      team2Pos={10}
                      dbMatch={matchPI4}
                      roundId={0}
                    />
                  </div>
                </div>
              </div>

              {/* COLONNA 2: QUARTI DI FINALE (Week 13) */}
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Fase 2
                  </span>
                  <h3 className="font-extrabold text-sm text-foreground">Quarti di Finale</h3>
                  <p className="text-[11px] text-muted-foreground">Settimana 13 • Gara Secca</p>
                </div>

                <div className="space-y-8 pt-4">
                  {/* Q1: Vinc. PI-1 vs #1 */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block text-center">
                      Quarto 1 (Vinc. PI-1 vs #1)
                    </span>
                    <MatchCard
                      code="Q1"
                      team1={teamQ1_Top}
                      team2={teamQ1_Bot}
                      placeholder1="Vincente PI-1 (#8 vs #9)"
                      team2Pos={1}
                      dbMatch={matchQ1}
                      roundId={1}
                    />
                  </div>

                  {/* Q2: #4 vs Vinc. PI-2 */}
                  <div className="space-y-1 pt-4">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block text-center">
                      Quarto 2 (#4 vs Vinc. PI-2)
                    </span>
                    <MatchCard
                      code="Q2"
                      team1={teamQ2_Top}
                      team2={teamQ2_Bot}
                      team1Pos={4}
                      placeholder2="Vincente PI-2 (#5 vs #12)"
                      dbMatch={matchQ2}
                      roundId={1}
                    />
                  </div>

                  {/* Q3: Vinc. PI-3 vs #3 */}
                  <div className="space-y-1 pt-4">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block text-center">
                      Quarto 3 (Vinc. PI-3 vs #3)
                    </span>
                    <MatchCard
                      code="Q3"
                      team1={teamQ3_Top}
                      team2={teamQ3_Bot}
                      placeholder1="Vincente PI-3 (#6 vs #11)"
                      team2Pos={3}
                      dbMatch={matchQ3}
                      roundId={1}
                    />
                  </div>

                  {/* Q4: #2 vs Vinc. PI-4 */}
                  <div className="space-y-1 pt-4">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block text-center">
                      Quarto 4 (#2 vs Vinc. PI-4)
                    </span>
                    <MatchCard
                      code="Q4"
                      team1={teamQ4_Top}
                      team2={teamQ4_Bot}
                      team1Pos={2}
                      placeholder2="Vincente PI-4 (#7 vs #10)"
                      dbMatch={matchQ4}
                      roundId={1}
                    />
                  </div>
                </div>
              </div>

              {/* COLONNA 3: SEMIFINALI (Week 14) */}
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                    Fase 3
                  </span>
                  <h3 className="font-extrabold text-sm text-foreground">Semifinali</h3>
                  <p className="text-[11px] text-muted-foreground">Settimana 14 • Penultimo Atto</p>
                </div>

                <div className="space-y-20 pt-16">
                  {/* SF1: Vinc. Q1 vs Vinc. Q2 */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block text-center">
                      Semifinale 1 (Q1 vs Q2)
                    </span>
                    <MatchCard
                      code="SF-1"
                      team1={teamSF1_Top}
                      team2={teamSF1_Bot}
                      placeholder1="Vincente Q1"
                      placeholder2="Vincente Q2"
                      dbMatch={matchSF1}
                      roundId={2}
                    />
                  </div>

                  {/* SF2: Vinc. Q3 vs Vinc. Q4 */}
                  <div className="space-y-1 pt-12">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block text-center">
                      Semifinale 2 (Q3 vs Q4)
                    </span>
                    <MatchCard
                      code="SF-2"
                      team1={teamSF2_Top}
                      team2={teamSF2_Bot}
                      placeholder1="Vincente Q3"
                      placeholder2="Vincente Q4"
                      dbMatch={matchSF2}
                      roundId={2}
                    />
                  </div>
                </div>
              </div>

              {/* COLONNA 4: GRANDE FINALE & TROFEO (Week 15) */}
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    Epilogo
                  </span>
                  <h3 className="font-extrabold text-sm text-amber-600 dark:text-amber-400">
                    Grande Finale
                  </h3>
                  <p className="text-[11px] text-muted-foreground">Settimana 15 • Campo Neutro</p>
                </div>

                <div className="pt-28 space-y-6">
                  <MatchCard
                    code="FINAL"
                    team1={teamFinal_Top}
                    team2={teamFinal_Bot}
                    placeholder1="Finalista Tabellone Nord (SF-1)"
                    placeholder2="Finalista Tabellone Sud (SF-2)"
                    dbMatch={matchFinal}
                    isFinal
                    roundId={3}
                  />

                  {/* Glorious Trophy Podium */}
                  <div className="p-4 rounded-2xl bg-gradient-to-b from-amber-500/20 via-card to-card border border-amber-500/30 text-center shadow-lg shadow-amber-500/10">
                    <div className="inline-flex p-3 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-500 mb-2">
                      <Trophy className="h-8 w-8 animate-bounce" />
                    </div>
                    {championTeam ? (
                      <div className="space-y-1">
                        <Badge className="bg-amber-500 text-black font-extrabold text-[10px] uppercase">
                          Campione Serie A LCSIM
                        </Badge>
                        <h4 className="font-black text-lg text-foreground">
                          {championTeam.team.NAME}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Manager: {championTeam.team.MANAGER || "–"}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-0.5">
                        <h4 className="font-extrabold text-base text-foreground">
                          Campione Ufficiale LCSIM
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Trofeo Serie A Stagione {activeSeason}
                        </p>
                      </div>
                    )}
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
          /* MODALITÀ 2: VISTA A FASI DETTAGLIATA (STEP-BY-STEP)        */
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
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider block ${
                      currentRound === i
                        ? r.isFinal
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-emerald-600 dark:text-emerald-400"
                        : "text-muted-foreground"
                    }`}
                  >
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
                      Le squadre classificate dal 5° al 12° posto si sfidano in gara secca per i 4 posti
                      nei Quarti di Finale.
                    </p>
                  </div>
                  <MatchCard
                    code="PI-1"
                    team1={teamPI1_Top}
                    team2={teamPI1_Bot}
                    team1Pos={8}
                    team2Pos={9}
                    dbMatch={matchPI1}
                    roundId={0}
                  />
                  <MatchCard
                    code="PI-2"
                    team1={teamPI2_Top}
                    team2={teamPI2_Bot}
                    team1Pos={5}
                    team2Pos={12}
                    dbMatch={matchPI2}
                    roundId={0}
                  />
                  <MatchCard
                    code="PI-3"
                    team1={teamPI3_Top}
                    team2={teamPI3_Bot}
                    team1Pos={6}
                    team2Pos={11}
                    dbMatch={matchPI3}
                    roundId={0}
                  />
                  <MatchCard
                    code="PI-4"
                    team1={teamPI4_Top}
                    team2={teamPI4_Bot}
                    team1Pos={7}
                    team2Pos={10}
                    dbMatch={matchPI4}
                    roundId={0}
                  />
                </div>
              )}

              {currentRound === 1 && (
                <div className="space-y-4">
                  <div className="text-center space-y-1 mb-4">
                    <h3 className="font-extrabold text-lg">Quarti di Finale</h3>
                    <p className="text-xs text-muted-foreground">
                      Gara secca con fattore campo a favore delle prime 4 classificate (Round Bye al Play-In).
                    </p>
                  </div>
                  <MatchCard
                    code="Q1"
                    team1={teamQ1_Top}
                    team2={teamQ1_Bot}
                    placeholder1="Vincente PI-1 (#8 vs #9)"
                    team2Pos={1}
                    dbMatch={matchQ1}
                    roundId={1}
                  />
                  <MatchCard
                    code="Q2"
                    team1={teamQ2_Top}
                    team2={teamQ2_Bot}
                    team1Pos={4}
                    placeholder2="Vincente PI-2 (#5 vs #12)"
                    dbMatch={matchQ2}
                    roundId={1}
                  />
                  <MatchCard
                    code="Q3"
                    team1={teamQ3_Top}
                    team2={teamQ3_Bot}
                    placeholder1="Vincente PI-3 (#6 vs #11)"
                    team2Pos={3}
                    dbMatch={matchQ3}
                    roundId={1}
                  />
                  <MatchCard
                    code="Q4"
                    team1={teamQ4_Top}
                    team2={teamQ4_Bot}
                    team1Pos={2}
                    placeholder2="Vincente PI-4 (#7 vs #10)"
                    dbMatch={matchQ4}
                    roundId={1}
                  />
                </div>
              )}

              {currentRound === 2 && (
                <div className="space-y-4">
                  <div className="text-center space-y-1 mb-4">
                    <h3 className="font-extrabold text-lg">Semifinali Playoff</h3>
                    <p className="text-xs text-muted-foreground">
                      Sfide decisive per accedere alla finalissima scudetto.
                    </p>
                  </div>
                  <MatchCard
                    code="SF-1"
                    team1={teamSF1_Top}
                    team2={teamSF1_Bot}
                    placeholder1="Vincente Q1"
                    placeholder2="Vincente Q2"
                    dbMatch={matchSF1}
                    roundId={2}
                  />
                  <MatchCard
                    code="SF-2"
                    team1={teamSF2_Top}
                    team2={teamSF2_Bot}
                    placeholder1="Vincente Q3"
                    placeholder2="Vincente Q4"
                    dbMatch={matchSF2}
                    roundId={2}
                  />
                </div>
              )}

              {currentRound === 3 && (
                <div className="space-y-6">
                  <div className="text-center space-y-1 mb-4">
                    <h3 className="font-extrabold text-lg text-amber-600 dark:text-amber-400">
                      Finalissima per il Titolo
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Gara secca in campo neutro per eleggere il Campione di Lega Calcio Simulato.
                    </p>
                  </div>
                  <MatchCard
                    code="FINAL"
                    team1={teamFinal_Top}
                    team2={teamFinal_Bot}
                    placeholder1="Finalista Tabellone Nord (SF-1)"
                    placeholder2="Finalista Tabellone Sud (SF-2)"
                    dbMatch={matchFinal}
                    isFinal
                    roundId={3}
                  />

                  <div className="p-6 rounded-2xl bg-gradient-to-b from-amber-500/20 via-card to-card border border-amber-500/30 text-center shadow-lg shadow-amber-500/10">
                    <Trophy className="h-10 w-10 text-amber-500 mx-auto mb-2" />
                    {championTeam ? (
                      <div className="space-y-1">
                        <Badge className="bg-amber-500 text-black font-extrabold text-xs uppercase">
                          Campione Serie A LCSIM
                        </Badge>
                        <h4 className="font-black text-xl text-foreground">
                          {championTeam.team.NAME}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Manager: {championTeam.team.MANAGER || "–"}
                        </p>
                      </div>
                    ) : (
                      <>
                        <h4 className="font-extrabold text-lg text-foreground">Scudetto LCSIM</h4>
                        <p className="text-xs text-muted-foreground">
                          Il vincitore si qualifica direttamente all'albo d'oro
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Prev / Next Controls */}
              <div className="flex items-center justify-between pt-6 border-t border-border/50">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentRound((prev) => Math.max(0, prev - 1))}
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
                  onClick={() => setCurrentRound((prev) => Math.min(rounds.length - 1, prev + 1))}
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
              <span>1°-4° Posto (Accesso Diretto ai Quarti con Round Bye)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded bg-blue-500" />
              <span>5°-12° Posto (Turno Play-In Preliminare)</span>
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

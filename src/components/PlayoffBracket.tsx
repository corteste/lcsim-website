import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Standings } from "@/types/standings";
import { Trophy, ChevronLeft, ChevronRight } from "lucide-react";

interface PlayoffBracketProps {
  standings: Standings[];
}

const PlayoffBracket = ({ standings }: PlayoffBracketProps) => {
  const teams = standings.slice(0, 10);
  const [currentRound, setCurrentRound] = useState(0);

  const rounds = [
    { id: 0, title: "Play In", date: "15-16 Mag", isFinal: false },
    { id: 1, title: "Quarti di Finale", date: "22-23 Mag", isFinal: false },
    { id: 2, title: "Semifinali", date: "29-30 Mag", isFinal: false },
    { id: 3, title: "Finale", date: "5-6 Giu", isFinal: true },
  ];

  const TeamRow = ({ 
    teamPos, 
    score = "–",
    isTop = false,
  }: { 
    teamPos: number; 
    score?: string | number;
    isTop?: boolean;
  }) => {
    const team = teams[teamPos - 1];
    
    return (
      <div className={`
        flex items-center justify-between px-4 py-3
        ${isTop ? 'border-b border-border/50' : ''}
        hover:bg-muted/40 transition-colors
      `}>
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <span className="text-xs font-bold text-muted-foreground w-5 text-center">{teamPos}°</span>
          <img 
            src={`/images/teams/${team?.team.TEAM_ID}_Logo.png`} 
            alt={team?.team.NAME} 
            className="h-8 w-8 flex-shrink-0 object-contain"
          />
          <span className="text-base font-medium truncate">{team?.team.NAME}</span>
        </div>
        <span className="text-lg font-bold text-primary ml-3">{score}</span>
      </div>
    );
  };

  const MatchCard = ({ 
    team1Pos, 
    team2Pos, 
    score1 = "–", 
    score2 = "–",
    isFinal = false
  }: { 
    team1Pos: number; 
    team2Pos: number; 
    score1?: string | number; 
    score2?: string | number;
    isFinal?: boolean;
  }) => (
    <div className={`
      bg-card border rounded-xl overflow-hidden shadow-sm
      transition-all duration-300 ease-out cursor-pointer
      hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1
      hover:border-primary/40 relative
      ${isFinal 
        ? 'border-amber-500/40 ring-2 ring-amber-500/20 hover:shadow-amber-500/20 hover:border-amber-500/60' 
        : ''}
    `}>
      <TeamRow teamPos={team1Pos} score={score1} isTop />
      <TeamRow teamPos={team2Pos} score={score2} />
    </div>
  );

  const renderRoundContent = (roundId: number) => {
    switch (roundId) {
      case 0: // Play In
        return (
          <div className="space-y-4 max-w-md mx-auto">
            <MatchCard team1Pos={8} team2Pos={9} />
            <MatchCard team1Pos={7} team2Pos={10} />
          </div>
        );
      case 1: // Quarti
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <MatchCard team1Pos={4} team2Pos={5} />
            <MatchCard team1Pos={1} team2Pos={8} />
            <MatchCard team1Pos={2} team2Pos={7} />
            <MatchCard team1Pos={3} team2Pos={6} />
          </div>
        );
      case 2: // Semifinali
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <MatchCard team1Pos={4} team2Pos={1} />
            <MatchCard team1Pos={2} team2Pos={3} />
          </div>
        );
      case 3: // Finale
        return (
          <div className="max-w-md mx-auto">
            <MatchCard team1Pos={1} team2Pos={2} isFinal />
            <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-amber-500/15 to-yellow-500/15 border border-amber-500/30 text-center">
              <Trophy className="h-8 w-8 text-amber-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">Campione LCSIM</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const goToPrevious = () => {
    setCurrentRound((prev) => (prev > 0 ? prev - 1 : prev));
  };

  const goToNext = () => {
    setCurrentRound((prev) => (prev < rounds.length - 1 ? prev + 1 : prev));
  };

  const currentRoundData = rounds[currentRound];

  return (
    <Card className="shadow-lg mt-8 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b pb-4">
        <CardTitle className="flex items-center gap-3 text-lg">
          <Trophy className="h-5 w-5 text-amber-500" />
          Schema Playoff
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {/* Round Navigation */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={goToPrevious}
            disabled={currentRound === 0}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Precedente</span>
          </Button>

          {/* Round Title */}
          <div className={`
            text-center py-2 px-6 rounded-lg
            ${currentRoundData.isFinal 
              ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30' 
              : 'bg-muted/50 border border-border/50'}
          `}>
            <h4 className={`text-sm font-bold uppercase tracking-wider ${currentRoundData.isFinal ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'}`}>
              {currentRoundData.title}
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">{currentRoundData.date}</p>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={goToNext}
            disabled={currentRound === rounds.length - 1}
            className="gap-1"
          >
            <span className="hidden sm:inline">Successivo</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Round Dots Indicator */}
        <div className="flex justify-center gap-2 mb-6">
          {rounds.map((round) => (
            <button
              key={round.id}
              onClick={() => setCurrentRound(round.id)}
              className={`
                w-2.5 h-2.5 rounded-full transition-all duration-300
                ${currentRound === round.id 
                  ? round.isFinal 
                    ? 'bg-amber-500 scale-125' 
                    : 'bg-primary scale-125'
                  : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'}
              `}
              aria-label={`Vai a ${round.title}`}
            />
          ))}
        </div>

        {/* Round Content with Animation */}
        <div className="relative min-h-[280px]">
          <div 
            key={currentRound}
            className="animate-fade-in"
          >
            {renderRoundContent(currentRound)}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-border/30 flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded border border-border bg-card" />
              <span>Partita da giocare</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded border border-amber-500/40 bg-gradient-to-r from-amber-500/10 to-yellow-500/10" />
              <span>Finale</span>
            </div>
          </div>
          <p className="italic">I numeri indicano la posizione in classifica</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlayoffBracket;

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Standings } from "@/types/standings";
import { Trophy, ChevronLeft, ChevronRight, X, Route } from "lucide-react";

interface PlayoffBracketProps {
  standings: Standings[];
}

// Define the playoff path for each team position
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
  const [currentRound, setCurrentRound] = useState(0);
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);

  const rounds = [
    { id: 0, title: "Play In", date: "15-16 Mag", isFinal: false },
    { id: 1, title: "Quarti di Finale", date: "22-23 Mag", isFinal: false },
    { id: 2, title: "Semifinali", date: "29-30 Mag", isFinal: false },
    { id: 3, title: "Finale", date: "5-6 Giu", isFinal: true },
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

  const TeamRow = ({ 
    teamPos, 
    score = "–",
    isTop = false,
    roundId = 0,
  }: { 
    teamPos: number; 
    score?: string | number;
    isTop?: boolean;
    roundId?: number;
  }) => {
    const team = teams[teamPos - 1];
    const isSelected = selectedTeam === teamPos;
    const isInPath = isTeamInMatch(teamPos, roundId);
    
    return (
      <div 
        onClick={(e) => {
          e.stopPropagation();
          setSelectedTeam(selectedTeam === teamPos ? null : teamPos);
        }}
        className={`
          flex items-center justify-between px-4 py-3 cursor-pointer
          ${isTop ? 'border-b border-border/50' : ''}
          transition-all duration-300
          ${isSelected 
            ? 'bg-primary/20 ring-2 ring-primary ring-inset' 
            : isInPath && selectedTeam
              ? 'bg-primary/10'
              : 'hover:bg-muted/40'}
          ${selectedTeam && !isInPath && !isSelected ? 'opacity-40' : ''}
        `}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <span className={`text-xs font-bold w-5 text-center ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
            {teamPos}°
          </span>
          <img 
            src={`/images/teams/${team?.team.TEAM_ID}_Logo.png`} 
            alt={team?.team.NAME} 
            className={`h-8 w-8 flex-shrink-0 object-contain transition-transform duration-300 ${isSelected ? 'scale-110' : ''}`}
          />
          <span className={`text-base font-medium truncate ${isSelected ? 'text-primary font-semibold' : ''}`}>
            {team?.team.NAME}
          </span>
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
    isFinal = false,
    roundId = 0,
  }: { 
    team1Pos: number; 
    team2Pos: number; 
    score1?: string | number; 
    score2?: string | number;
    isFinal?: boolean;
    roundId?: number;
  }) => {
    const isHighlighted = isMatchHighlighted(team1Pos, team2Pos, roundId);
    
    return (
      <div className={`
        bg-card border rounded-xl overflow-hidden shadow-sm
        transition-all duration-300 ease-out
        ${isHighlighted 
          ? 'ring-2 ring-primary shadow-lg shadow-primary/20 scale-[1.02]' 
          : selectedTeam 
            ? 'opacity-50 scale-[0.98]' 
            : 'hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 hover:border-primary/40 cursor-pointer'}
        ${isFinal && !selectedTeam
          ? 'border-amber-500/40 ring-2 ring-amber-500/20 hover:shadow-amber-500/20 hover:border-amber-500/60' 
          : ''}
        ${isFinal && isHighlighted
          ? 'ring-amber-500 shadow-amber-500/30' 
          : ''}
      `}>
        <TeamRow teamPos={team1Pos} score={score1} isTop roundId={roundId} />
        <TeamRow teamPos={team2Pos} score={score2} roundId={roundId} />
      </div>
    );
  };

  const renderRoundContent = (roundId: number) => {
    switch (roundId) {
      case 0: // Play In
        return (
          <div className="space-y-4 max-w-md mx-auto">
            <MatchCard team1Pos={8} team2Pos={9} roundId={0} />
            <MatchCard team1Pos={7} team2Pos={10} roundId={0} />
          </div>
        );
      case 1: // Quarti
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <MatchCard team1Pos={4} team2Pos={5} roundId={1} />
            <MatchCard team1Pos={1} team2Pos={8} roundId={1} />
            <MatchCard team1Pos={2} team2Pos={7} roundId={1} />
            <MatchCard team1Pos={3} team2Pos={6} roundId={1} />
          </div>
        );
      case 2: // Semifinali
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <MatchCard team1Pos={4} team2Pos={1} roundId={2} />
            <MatchCard team1Pos={2} team2Pos={3} roundId={2} />
          </div>
        );
      case 3: // Finale
        return (
          <div className="max-w-md mx-auto">
            <MatchCard team1Pos={1} team2Pos={2} isFinal roundId={3} />
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
  const selectedTeamData = selectedTeam ? teams[selectedTeam - 1] : null;

  return (
    <Card className="shadow-lg mt-8 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-lg">
            <Trophy className="h-5 w-5 text-amber-500" />
            Schema Playoff
          </CardTitle>
          
          {/* Selected Team Badge */}
          {selectedTeamData && (
            <div className="flex items-center gap-2 bg-primary/15 border border-primary/30 rounded-lg px-3 py-1.5 animate-fade-in">
              <Route className="h-4 w-4 text-primary" />
              <img 
                src={`/images/teams/${selectedTeamData.team.TEAM_ID}_Logo.png`} 
                alt={selectedTeamData.team.NAME}
                className="h-5 w-5 object-contain"
              />
              <span className="text-sm font-medium text-primary">{selectedTeamData.team.NAME}</span>
              <button 
                onClick={() => setSelectedTeam(null)}
                className="ml-1 p-0.5 hover:bg-primary/20 rounded transition-colors"
              >
                <X className="h-3.5 w-3.5 text-primary" />
              </button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {/* Team Selection Hint */}
        {!selectedTeam && (
          <div className="mb-4 p-3 rounded-lg bg-muted/50 border border-border/50 text-center animate-fade-in">
            <p className="text-sm text-muted-foreground">
              <Route className="h-4 w-4 inline-block mr-2 -mt-0.5" />
              Clicca su una squadra per visualizzare il suo percorso playoff
            </p>
          </div>
        )}

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
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded ring-2 ring-primary bg-primary/20" />
              <span>Percorso selezionato</span>
            </div>
          </div>
          <p className="italic">I numeri indicano la posizione in classifica</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlayoffBracket;

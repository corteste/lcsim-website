import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Standings } from "@/types/standings";
import { Trophy } from "lucide-react";

interface PlayoffBracketProps {
  standings: Standings[];
}

const PlayoffBracket = ({ standings }: PlayoffBracketProps) => {
  const teams = standings.slice(0, 10);

  const TeamRow = ({ 
    teamPos, 
    score = "–",
    isTop = false,
    highlighted = false
  }: { 
    teamPos: number; 
    score?: string | number;
    isTop?: boolean;
    highlighted?: boolean;
  }) => {
    const team = teams[teamPos - 1];
    
    return (
      <div className={`
        flex items-center justify-between px-3 py-2
        ${isTop ? 'border-b border-border/50' : ''}
        ${highlighted ? 'bg-primary/10' : 'hover:bg-muted/40'}
        transition-colors
      `}>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-[10px] font-bold text-muted-foreground w-4">{teamPos}</span>
          <img 
            src={`/images/teams/${team?.team.TEAM_ID}_Logo.png`} 
            alt={team?.team.NAME} 
            className="h-5 w-5 flex-shrink-0 object-contain"
          />
          <span className="text-sm font-medium truncate">{team?.team.NAME}</span>
        </div>
        <span className="text-sm font-bold text-primary ml-2">{score}</span>
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
      bg-card border rounded-lg overflow-hidden shadow-sm
      transition-all duration-300 ease-out cursor-pointer
      hover:scale-105 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1
      hover:border-primary/40 hover:z-10 relative
      ${isFinal 
        ? 'border-amber-500/40 ring-1 ring-amber-500/20 hover:shadow-amber-500/20 hover:border-amber-500/60' 
        : ''}
    `}>
      <TeamRow teamPos={team1Pos} score={score1} isTop />
      <TeamRow teamPos={team2Pos} score={score2} />
    </div>
  );

  const RoundHeader = ({ title, date, isFinal = false }: { title: string; date: string; isFinal?: boolean }) => (
    <div className={`
      text-center py-2 px-3 rounded-md mb-3
      ${isFinal 
        ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30' 
        : 'bg-muted/50 border border-border/50'}
    `}>
      <h4 className={`text-xs font-bold uppercase tracking-wider ${isFinal ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'}`}>
        {title}
      </h4>
      <p className="text-[10px] text-muted-foreground mt-0.5">{date}</p>
    </div>
  );

  const Connector = ({ type }: { type: 'right' | 'top' | 'bottom' | 'straight' }) => {
    if (type === 'right') {
      return <div className="w-4 h-px bg-border/70" />;
    }
    if (type === 'straight') {
      return <div className="w-6 h-px bg-border/70" />;
    }
    return null;
  };

  return (
    <Card className="shadow-lg mt-8 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b pb-4">
        <CardTitle className="flex items-center gap-3 text-lg">
          <Trophy className="h-5 w-5 text-amber-500" />
          Schema Playoff
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <div className="min-w-[900px] p-6">
          
          {/* Main Bracket Grid */}
          <div className="grid grid-cols-[180px_24px_180px_24px_180px_24px_200px] gap-0 items-start">
            
            {/* PLAY IN Column */}
            <div>
              <RoundHeader title="Play In" date="15-16 Mag" />
              <div className="space-y-4">
                {/* Match 8 vs 9 */}
                <div className="relative">
                  <MatchCard team1Pos={8} team2Pos={9} />
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full flex items-center">
                    <Connector type="straight" />
                  </div>
                </div>
                
                {/* Match 7 vs 10 */}
                <div className="relative">
                  <MatchCard team1Pos={7} team2Pos={10} />
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full flex items-center">
                    <Connector type="straight" />
                  </div>
                </div>
              </div>
            </div>

            {/* Connector to Quarters */}
            <div className="flex flex-col justify-center h-full pt-10">
              <div className="h-[52px] flex items-center">
                <div className="w-full h-px bg-border/50" />
              </div>
              <div className="h-4" />
              <div className="h-[52px] flex items-center">
                <div className="w-full h-px bg-border/50" />
              </div>
            </div>

            {/* QUARTI Column */}
            <div>
              <RoundHeader title="Quarti" date="22-23 Mag" />
              <div className="space-y-3">
                <MatchCard team1Pos={4} team2Pos={5} />
                <MatchCard team1Pos={1} team2Pos={8} />
                <MatchCard team1Pos={2} team2Pos={7} />
                <MatchCard team1Pos={3} team2Pos={6} />
              </div>
            </div>

            {/* Connector to Semis */}
            <div className="flex flex-col items-center pt-10">
              {/* Top bracket lines */}
              <div className="relative h-[108px] w-full">
                <div className="absolute left-0 top-[26px] w-3 h-px bg-border/70" />
                <div className="absolute left-0 top-[78px] w-3 h-px bg-border/70" />
                <div className="absolute left-3 top-[26px] w-px h-[52px] bg-border/70" />
                <div className="absolute left-3 top-[52px] w-3 h-px bg-border/70" />
              </div>
              {/* Bottom bracket lines */}
              <div className="relative h-[108px] w-full">
                <div className="absolute left-0 top-[26px] w-3 h-px bg-border/70" />
                <div className="absolute left-0 top-[78px] w-3 h-px bg-border/70" />
                <div className="absolute left-3 top-[26px] w-px h-[52px] bg-border/70" />
                <div className="absolute left-3 top-[52px] w-3 h-px bg-border/70" />
              </div>
            </div>

            {/* SEMIFINALI Column */}
            <div>
              <RoundHeader title="Semifinali" date="29-30 Mag" />
              <div className="space-y-[62px] pt-[26px]">
                <MatchCard team1Pos={4} team2Pos={1} />
                <MatchCard team1Pos={2} team2Pos={3} />
              </div>
            </div>

            {/* Connector to Final */}
            <div className="flex flex-col items-center pt-10">
              <div className="relative h-[216px] w-full flex items-center">
                <div className="absolute left-0 top-[52px] w-3 h-px bg-border/70" />
                <div className="absolute left-0 top-[166px] w-3 h-px bg-border/70" />
                <div className="absolute left-3 top-[52px] w-px h-[114px] bg-border/70" />
                <div className="absolute left-3 top-[108px] w-3 h-px bg-amber-500/50" />
              </div>
            </div>

            {/* FINALE Column */}
            <div>
              <RoundHeader title="Finale" date="5-6 Giu" isFinal />
              <div className="pt-[80px]">
                <MatchCard team1Pos={1} team2Pos={2} isFinal />
                
                {/* Winner placeholder */}
                <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/20 text-center">
                  <Trophy className="h-5 w-5 text-amber-500 mx-auto mb-1" />
                  <p className="text-xs font-medium text-amber-600 dark:text-amber-400">Campione</p>
                </div>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-6 pt-4 border-t border-border/30 flex items-center justify-between text-xs text-muted-foreground">
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
        </div>
      </CardContent>
    </Card>
  );
};

export default PlayoffBracket;

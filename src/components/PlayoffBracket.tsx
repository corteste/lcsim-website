import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Standings } from "@/types/standings";

interface PlayoffBracketProps {
  standings: Standings[];
}

const PlayoffBracket = ({ standings }: PlayoffBracketProps) => {
  // Get top 10 teams for playoff bracket
  const teams = standings.slice(0, 10);

  const MatchBox = ({ 
    team1Pos, 
    team2Pos, 
    score1 = "?", 
    score2 = "?",
    className = ""
  }: { 
    team1Pos: number; 
    team2Pos: number; 
    score1?: string | number; 
    score2?: string | number;
    className?: string;
  }) => {
    const team1 = teams[team1Pos - 1];
    const team2 = teams[team2Pos - 1];

    return (
      <div className={`bg-card border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow ${className}`}>
        <div className="flex items-center justify-between p-2 border-b hover:bg-muted/30 transition-colors">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <img 
              src={`/images/teams/${team1?.team.TEAM_ID}_Logo.png`} 
              alt={team1?.team.NAME} 
              className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0 object-contain"
            />
            <span className="text-xs sm:text-sm font-medium truncate">
              #{team1Pos} {team1?.team.NAME}
            </span>
          </div>
          <span className="text-sm sm:text-base font-bold text-primary ml-2 flex-shrink-0">{score1}</span>
        </div>
        <div className="flex items-center justify-between p-2 hover:bg-muted/30 transition-colors">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <img 
              src={`/images/teams/${team2?.team.TEAM_ID}_Logo.png`} 
              alt={team2?.team.NAME} 
              className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0 object-contain"
            />
            <span className="text-xs sm:text-sm font-medium truncate">
              #{team2Pos} {team2?.team.NAME}
            </span>
          </div>
          <span className="text-sm sm:text-base font-bold text-primary ml-2 flex-shrink-0">{score2}</span>
        </div>
      </div>
    );
  };

  const WinnerBox = ({ teamPos, className = "" }: { teamPos: number; className?: string }) => {
    const team = teams[teamPos - 1];
    
    return (
      <div className={`bg-card border rounded-lg p-2 sm:p-3 shadow-sm hover:shadow-md transition-shadow ${className}`}>
        <div className="flex items-center gap-2">
          <img 
            src={`/images/teams/${team?.team.TEAM_ID}_Logo.png`} 
            alt={team?.team.NAME} 
            className="h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0 object-contain"
          />
          <span className="text-xs sm:text-sm font-medium truncate">
            #{teamPos} {team?.team.NAME}
          </span>
        </div>
      </div>
    );
  };

  const Connector = ({ vertical = false }: { vertical?: boolean }) => (
    <div className={`${vertical ? 'w-0.5 h-8 sm:h-12' : 'h-0.5 w-6 sm:w-8'} bg-border`} />
  );

  return (
    <Card className="shadow-lg mt-8 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b">
        <CardTitle className="flex items-center gap-3">
          <span className="text-2xl">🏆</span>
          <span>Schema Playoff</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <div className="min-w-[800px] p-6">
          {/* Round Headers */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="text-center px-4 py-3 rounded-lg bg-primary/5 border border-primary/20">
              <h3 className="text-sm sm:text-base font-bold text-primary uppercase tracking-wide">Play In</h3>
              <p className="text-xs text-muted-foreground mt-1">15-16 Mag</p>
            </div>
            <div className="text-center px-4 py-3 rounded-lg bg-primary/5 border border-primary/20">
              <h3 className="text-sm sm:text-base font-bold text-primary uppercase tracking-wide">Quarti</h3>
              <p className="text-xs text-muted-foreground mt-1">22-23 Mag</p>
            </div>
            <div className="text-center px-4 py-3 rounded-lg bg-primary/5 border border-primary/20">
              <h3 className="text-sm sm:text-base font-bold text-primary uppercase tracking-wide">Semifinale</h3>
              <p className="text-xs text-muted-foreground mt-1">29-30 Mag</p>
            </div>
            <div className="text-center px-4 py-3 rounded-lg bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30">
              <h3 className="text-sm sm:text-base font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide">Finale</h3>
              <p className="text-xs text-muted-foreground mt-1">5-6 Giu</p>
            </div>
          </div>

          {/* Bracket Structure */}
          <div className="grid grid-cols-4 gap-4 items-center">
            
            {/* Play In */}
            <div className="flex flex-col gap-6">
              <MatchBox team1Pos={8} team2Pos={9} />
              <MatchBox team1Pos={7} team2Pos={10} />
            </div>

            {/* Quarterfinals */}
            <div className="flex flex-col gap-4">
              <MatchBox team1Pos={4} team2Pos={5} />
              <MatchBox team1Pos={1} team2Pos={8} />
              <MatchBox team1Pos={2} team2Pos={7} />
              <MatchBox team1Pos={3} team2Pos={6} />
            </div>

            {/* Semifinals */}
            <div className="flex flex-col gap-8 py-8">
              <MatchBox team1Pos={4} team2Pos={1} />
              <MatchBox team1Pos={2} team2Pos={3} />
            </div>

            {/* Finals */}
            <div className="flex items-center justify-center h-full">
              <MatchBox team1Pos={1} team2Pos={2} className="min-w-[180px] border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-yellow-500/5" />
            </div>
          </div>

          {/* Legend */}
          <div className="mt-8 pt-6 border-t border-border/50">
            <p className="text-xs text-muted-foreground text-center italic">
              I risultati mostrati sono esemplificativi. I punteggi effettivi verranno aggiornati durante i playoff.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlayoffBracket;

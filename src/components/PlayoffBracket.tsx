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
    <Card className="shadow-lg mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🏆 Schema Playoff
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <div className="min-w-[900px] p-4">
          {/* Round Headers */}
          <div className="flex justify-between items-start gap-3 sm:gap-6 mb-6">
            <div className="flex-1 text-center">
              <h3 className="text-sm sm:text-base font-bold text-primary">PLAY IN</h3>
              <p className="text-xs text-muted-foreground mt-1">15-16 Mag</p>
            </div>
            <div className="flex-1 text-center">
              <h3 className="text-sm sm:text-base font-bold text-primary">QUARTI</h3>
              <p className="text-xs text-muted-foreground mt-1">22-23 Mag</p>
            </div>
            <div className="flex-1 text-center">
              <h3 className="text-sm sm:text-base font-bold text-primary">SEMIFINALE</h3>
              <p className="text-xs text-muted-foreground mt-1">29-30 Mag</p>
            </div>
            <div className="flex-1 text-center">
              <h3 className="text-sm sm:text-base font-bold text-primary">FINALE</h3>
              <p className="text-xs text-muted-foreground mt-1">5-6 Giu</p>
            </div>
            <div className="flex-1 text-center">
              <h3 className="text-sm sm:text-base font-bold text-primary">VINCITORE</h3>
              <p className="text-xs text-muted-foreground mt-1">6 Giu</p>
            </div>
          </div>

          {/* Bracket Structure */}
          <div className="flex justify-between items-center gap-3 sm:gap-6">
            
            {/* First Round - Left Side */}
            <div className="flex flex-col gap-16">
              <MatchBox team1Pos={8} team2Pos={9} />
              <MatchBox team1Pos={7} team2Pos={10} />
            </div>

            {/* Quarterfinals */}
            <div className="flex flex-col gap-8">
              <div className="flex flex-col items-center">
                <MatchBox team1Pos={4} team2Pos={5} />
                <Connector vertical />
                <MatchBox team1Pos={9} team2Pos={1} />
              </div>
              
              <div className="flex flex-col items-center">
                <MatchBox team1Pos={2} team2Pos={7} />
                <Connector vertical />
                <MatchBox team1Pos={3} team2Pos={6} />
              </div>
            </div>

            {/* Semifinals */}
            <div className="flex flex-col gap-32">
              <MatchBox team1Pos={5} team2Pos={1} />
              <MatchBox team1Pos={2} team2Pos={3} />
            </div>

            {/* Finals */}
            <div className="flex flex-col items-center justify-center">
              <MatchBox team1Pos={1} team2Pos={2} className="min-w-[200px]" />
            </div>

            {/* Winner */}
            <div className="flex items-center gap-3">
              <Connector />
              <WinnerBox teamPos={2} className="min-w-[180px] bg-primary/5 border-primary/30" />
            </div>
          </div>

          {/* Legend */}
          <div className="mt-8 pt-6 border-t">
            <p className="text-xs sm:text-sm text-muted-foreground text-center">
              I risultati mostrati sono esemplificativi. I punteggi effettivi verranno aggiornati durante i playoff.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlayoffBracket;

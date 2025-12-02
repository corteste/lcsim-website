import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getStandings } from "@/hooks/use-standings";
import { Trophy, TrendingUp, TrendingDown, Minus } from "lucide-react";
import PlayoffBracket from "@/components/PlayoffBracket";

const Classifica = () => {

  const { standings } = getStandings();
  
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-primary" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-destructive" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center justify-center gap-3">
            <Trophy className="h-8 w-8 text-primary" />
            Classifica
          </h1>
          <p className="text-muted-foreground">Stagione 2024/25 - Giornata 10</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Posizioni</CardTitle>
            <CardDescription>Aggiornata al {new Date().toLocaleDateString('it-IT')}</CardDescription>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16 text-center">Pos.</TableHead>
                  <TableHead className="w-16"></TableHead>
                  <TableHead>Squadra</TableHead>
                  <TableHead className="text-center">G</TableHead>
                  <TableHead className="text-center">V</TableHead>
                  <TableHead className="text-center">N</TableHead>
                  <TableHead className="text-center">P</TableHead>
                  <TableHead className="text-center">GF</TableHead>
                  <TableHead className="text-center">GS</TableHead>
                  <TableHead className="text-center">DR</TableHead>
                  <TableHead className="text-center">Casa</TableHead>
                  <TableHead className="text-center font-bold">Punti</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {standings.map((team,index) => (
                  <TableRow key={index} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="text-center font-bold">
                      {index+1}
                    </TableCell>
                    <TableCell className="text-center">
                      <img src={`/images/teams/${team.team.TEAM_ID}_Logo.png`} alt={`${team.team.TEAM_ID} Logo`} className="h-8 w-8 object-contain" />
                    </TableCell>
                    <TableCell className="font-medium">{team.team.NAME}</TableCell>
                    <TableCell className="text-center">{team.games_played}</TableCell>
                    <TableCell className="text-center">{team.win}</TableCell>
                    <TableCell className="text-center">{team.draws}</TableCell>
                    <TableCell className="text-center">{team.loss}</TableCell>
                    <TableCell className="text-center">{team.goal_made}</TableCell>
                    <TableCell className="text-center">{team.goal_conceded}</TableCell>
                    <TableCell className="text-center">{team.goal_difference}</TableCell>
                    <TableCell className="text-center">{team.played_at_home}</TableCell>
                    <TableCell className="text-center font-bold text-primary">
                      {team.points}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <PlayoffBracket standings={standings} />
      </main>
    </div>
  );
};

export default Classifica;

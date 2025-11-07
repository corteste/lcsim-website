import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy, TrendingUp, TrendingDown, Minus } from "lucide-react";

const mockStandings = [
  { position: 1, team: "FC Dragonslayers", played: 10, won: 8, drawn: 1, lost: 1, points: 25, trend: "up" },
  { position: 2, team: "Thunder United", played: 10, won: 7, drawn: 2, lost: 1, points: 23, trend: "same" },
  { position: 3, team: "Phoenix Rising", played: 10, won: 6, drawn: 3, lost: 1, points: 21, trend: "up" },
  { position: 4, team: "Titans FC", played: 10, won: 6, drawn: 2, lost: 2, points: 20, trend: "down" },
  { position: 5, team: "Warriors Club", played: 10, won: 5, drawn: 3, lost: 2, points: 18, trend: "same" },
  { position: 6, team: "Eagles United", played: 10, won: 4, drawn: 4, lost: 2, points: 16, trend: "up" },
  { position: 7, team: "Lions SC", played: 10, won: 4, drawn: 3, lost: 3, points: 15, trend: "down" },
  { position: 8, team: "Sharks FC", played: 10, won: 3, drawn: 3, lost: 4, points: 12, trend: "same" },
];

const Classifica = () => {
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
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16 text-center">Pos.</TableHead>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Squadra</TableHead>
                  <TableHead className="text-center">G</TableHead>
                  <TableHead className="text-center">V</TableHead>
                  <TableHead className="text-center">N</TableHead>
                  <TableHead className="text-center">P</TableHead>
                  <TableHead className="text-center font-bold">Punti</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockStandings.map((team) => (
                  <TableRow key={team.position} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="text-center font-bold">
                      {team.position}
                    </TableCell>
                    <TableCell className="text-center">
                      {getTrendIcon(team.trend)}
                    </TableCell>
                    <TableCell className="font-medium">{team.team}</TableCell>
                    <TableCell className="text-center">{team.played}</TableCell>
                    <TableCell className="text-center">{team.won}</TableCell>
                    <TableCell className="text-center">{team.drawn}</TableCell>
                    <TableCell className="text-center">{team.lost}</TableCell>
                    <TableCell className="text-center font-bold text-primary">
                      {team.points}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Classifica;

import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

const teams = [
  {
    name: "FC Dragonslayers",
    players: [
      { name: "Marco Rossi", role: "POR", rating: 7.5 },
      { name: "Luca Bianchi", role: "DIF", rating: 7.2 },
      { name: "Andrea Verdi", role: "DIF", rating: 7.8 },
      { name: "Paolo Neri", role: "DIF", rating: 7.0 },
      { name: "Giuseppe Gialli", role: "CEN", rating: 8.2 },
      { name: "Francesco Blu", role: "CEN", rating: 7.9 },
      { name: "Antonio Viola", role: "CEN", rating: 7.4 },
      { name: "Alessandro Grigi", role: "ATT", rating: 8.5 },
      { name: "Matteo Arancio", role: "ATT", rating: 8.0 },
    ],
  },
  {
    name: "Thunder United",
    players: [
      { name: "Roberto Marroni", role: "POR", rating: 7.3 },
      { name: "Stefano Rosa", role: "DIF", rating: 7.6 },
      { name: "Davide Azzurri", role: "DIF", rating: 7.1 },
      { name: "Simone Verde", role: "DIF", rating: 7.4 },
      { name: "Lorenzo Neri", role: "CEN", rating: 7.8 },
      { name: "Federico Bianchi", role: "CEN", rating: 8.1 },
      { name: "Riccardo Rossi", role: "CEN", rating: 7.7 },
      { name: "Gabriele Gialli", role: "ATT", rating: 8.3 },
      { name: "Nicola Blu", role: "ATT", rating: 7.9 },
    ],
  },
];

const getRoleColor = (role: string) => {
  switch (role) {
    case "POR": return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20";
    case "DIF": return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20";
    case "CEN": return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20";
    case "ATT": return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20";
    default: return "bg-muted";
  }
};

const Rose = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center justify-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            Rose Complete
          </h1>
          <p className="text-muted-foreground">Tutte le squadre del campionato</p>
        </div>

        <Tabs defaultValue="0" className="w-full">
          <TabsList className="w-full flex-wrap h-auto justify-start gap-2 bg-muted/50 p-2">
            {teams.map((team, index) => (
              <TabsTrigger key={index} value={index.toString()} className="flex-1 min-w-[200px]">
                {team.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {teams.map((team, teamIndex) => (
            <TabsContent key={teamIndex} value={teamIndex.toString()}>
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>{team.name}</CardTitle>
                  <CardDescription>{team.players.length} giocatori</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {team.players.map((player, playerIndex) => (
                      <div
                        key={playerIndex}
                        className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <Badge variant="outline" className={getRoleColor(player.role)}>
                            {player.role}
                          </Badge>
                          <span className="font-medium">{player.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Voto medio:</span>
                          <span className="font-bold text-primary text-lg">{player.rating}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </main>
    </div>
  );
};

export default Rose;

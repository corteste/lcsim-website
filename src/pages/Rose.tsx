import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

const teams = [
  {
    name: "Red Mamba",
    players: [
      { name: "Marco Rossi",age: "24", role: "POR", overall: 83, rating: 7.5 },
      { name: "Luca Bianchi",age: "24", role: "DIF", overall: 83, rating: 7.2 },
      { name: "Andrea Verdi",age: "24", role: "DIF", overall: 83, rating: 7.8 },
      { name: "Paolo Neri",age: "24", role: "DIF", overall: 83, rating: 7.0 },
      { name: "Giuseppe Gialli",age: "24", role: "CEN", overall: 83, rating: 8.2 },
      { name: "Francesco Blu",age: "24", role: "CEN", overall: 83, rating: 7.9 },
      { name: "Antonio Viola",age: "24", role: "CEN", overall: 83, rating: 7.4 },
      { name: "Alessandro Grigi",age: "24", role: "ATT", overall: 83, rating: 8.5 },
      { name: "Matteo Arancio",age: "24", role: "ATT", overall: 83, rating: 8.0 },
    ],
  },
  {
    name: "Mar's Attack",
    players: [
      { name: "Roberto Marroni",age: "24", role: "POR", overall: 83, rating: 7.3 },
      { name: "Stefano Rosa",age: "24", role: "DIF", overall: 70, rating: 7.6 },
      { name: "Davide Azzurri",age: "24", role: "DIF", overall: 77, rating: 7.1 },
      { name: "Simone Verde",age: "24", role: "DIF", overall: 83, rating: 7.4 },
      { name: "Lorenzo Neri",age: "24", role: "CEN", overall: 83, rating: 7.8 },
      { name: "Federico Bianchi",age: "24", role: "CEN", overall: 83, rating: 8.1 },
      { name: "Riccardo Rossi",age: "24", role: "CEN", overall: 83, rating: 7.7 },
      { name: "Gabriele Gialli",age: "24", role: "ATT", overall: 83, rating: 8.3 },
      { name: "Nicola Blu",age: "24", role: "ATT", overall: 83, rating: 7.9 },
    ],
  },
  {
    name: "AC Denti",
    players: [
      { name: "Roberto Marroni",age: "24", role: "POR", overall: 83, rating: 7.3 },
      { name: "Stefano Rosa",age: "24", role: "DIF", overall: 83, rating: 7.6 },
      { name: "Davide Azzurri",age: "24", role: "DIF", overall: 83, rating: 7.1 },
      { name: "Simone Verde",age: "24", role: "DIF", overall: 83, rating: 7.4 },
      { name: "Lorenzo Neri",age: "24", role: "CEN", overall: 83, rating: 7.8 },
      { name: "Federico Bianchi",age: "24", role: "CEN", overall: 83, rating: 8.1 },
      { name: "Riccardo Rossi",age: "24", role: "CEN", overall: 83, rating: 7.7 },
      { name: "Gabriele Gialli",age: "24", role: "ATT", overall: 83, rating: 8.3 },
      { name: "Nicola Blu",age: "24", role: "ATT", overall: 83, rating: 7.9 },
    ],
  },
  {
    name: "Average Pegiò Drivers",
    players: [
      { name: "Roberto Marroni",age: "24", role: "POR", overall: 83, rating: 7.3 },
      { name: "Stefano Rosa",age: "24", role: "DIF", overall: 83, rating: 7.6 },
      { name: "Davide Azzurri",age: "24", role: "DIF", overall: 83, rating: 7.1 },
      { name: "Simone Verde",age: "24", role: "DIF", overall: 83, rating: 7.4 },
      { name: "Lorenzo Neri",age: "24", role: "CEN", overall: 83, rating: 7.8 },
      { name: "Federico Bianchi",age: "24", role: "CEN", overall: 83, rating: 8.1 },
      { name: "Riccardo Rossi",age: "24", role: "CEN", overall: 83, rating: 7.7 },
      { name: "Gabriele Gialli",age: "24", role: "ATT", overall: 83, rating: 8.3 },
      { name: "Nicola Blu",age: "24", role: "ATT", overall: 83, rating: 7.9 },
    ],
  },
  {
    name: "Panormus FC",
    players: [
      { name: "Roberto Marroni",age: "24", role: "POR", overall: 83, rating: 7.3 },
      { name: "Stefano Rosa",age: "24", role: "DIF", overall: 83, rating: 7.6 },
      { name: "Davide Azzurri",age: "24", role: "DIF", overall: 83, rating: 7.1 },
      { name: "Simone Verde",age: "24", role: "DIF", overall: 83, rating: 7.4 },
      { name: "Lorenzo Neri",age: "24", role: "CEN", overall: 83, rating: 7.8 },
      { name: "Federico Bianchi",age: "24", role: "CEN", overall: 83, rating: 8.1 },
      { name: "Riccardo Rossi",age: "24", role: "CEN", overall: 83, rating: 7.7 },
      { name: "Gabriele Gialli",age: "24", role: "ATT", overall: 83, rating: 8.3 },
      { name: "Nicola Blu",age: "24", role: "ATT", overall: 83, rating: 7.9 },
    ],
  },
  {
    name: "Valle FC",
    players: [
      { name: "Roberto Marroni",age: "24", role: "POR", overall: 83, rating: 7.3 },
      { name: "Stefano Rosa",age: "24", role: "DIF", overall: 83, rating: 7.6 },
      { name: "Davide Azzurri",age: "24", role: "DIF", overall: 83, rating: 7.1 },
      { name: "Simone Verde",age: "24", role: "DIF", overall: 83, rating: 7.4 },
      { name: "Lorenzo Neri",age: "24", role: "CEN", overall: 83, rating: 7.8 },
      { name: "Federico Bianchi",age: "24", role: "CEN", overall: 83, rating: 8.1 },
      { name: "Riccardo Rossi",age: "24", role: "CEN", overall: 83, rating: 7.7 },
      { name: "Gabriele Gialli",age: "24", role: "ATT", overall: 83, rating: 8.3 },
      { name: "Nicola Blu",age: "24", role: "ATT", overall: 83, rating: 7.9 },
    ],
  },
  {
    name: "AS Karalis",
    players: [
      { name: "Roberto Marroni",age: "24", role: "POR", overall: 83, rating: 7.3 },
      { name: "Stefano Rosa",age: "24", role: "DIF", overall: 83, rating: 7.6 },
      { name: "Davide Azzurri",age: "24", role: "DIF", overall: 83, rating: 7.1 },
      { name: "Simone Verde",age: "24", role: "DIF", overall: 83, rating: 7.4 },
      { name: "Lorenzo Neri",age: "24", role: "CEN", overall: 83, rating: 7.8 },
      { name: "Federico Bianchi",age: "24", role: "CEN", overall: 83, rating: 8.1 },
      { name: "Riccardo Rossi",age: "24", role: "CEN", overall: 83, rating: 7.7 },
      { name: "Gabriele Gialli",age: "24", role: "ATT", overall: 83, rating: 8.3 },
      { name: "Nicola Blu",age: "24", role: "ATT", overall: 83, rating: 7.9 },
    ],
  },
  {
    name: "AC Fantasy",
    players: [
      { name: "Roberto Marroni",age: "24", role: "POR", overall: 83, rating: 7.3 },
      { name: "Stefano Rosa",age: "24", role: "DIF", overall: 83, rating: 7.6 },
      { name: "Davide Azzurri",age: "24", role: "DIF", overall: 83, rating: 7.1 },
      { name: "Simone Verde",age: "24", role: "DIF", overall: 83, rating: 7.4 },
      { name: "Lorenzo Neri",age: "24", role: "CEN", overall: 83, rating: 7.8 },
      { name: "Federico Bianchi",age: "24", role: "CEN", overall: 83, rating: 8.1 },
      { name: "Riccardo Rossi",age: "24", role: "CEN", overall: 83, rating: 7.7 },
      { name: "Gabriele Gialli",age: "24", role: "ATT", overall: 83, rating: 8.3 },
      { name: "Nicola Blu",age: "24", role: "ATT", overall: 83, rating: 7.9 },
    ],
  },
  {
    name: "Old Boys",
    players: [
      { name: "Roberto Marroni",age: "24", role: "POR", overall: 83, rating: 7.3 },
      { name: "Stefano Rosa",age: "24", role: "DIF", overall: 83, rating: 7.6 },
      { name: "Davide Azzurri",age: "24", role: "DIF", overall: 83, rating: 7.1 },
      { name: "Simone Verde",age: "24", role: "DIF", overall: 83, rating: 7.4 },
      { name: "Lorenzo Neri",age: "24", role: "CEN", overall: 83, rating: 7.8 },
      { name: "Federico Bianchi",age: "24", role: "CEN", overall: 83, rating: 8.1 },
      { name: "Riccardo Rossi",age: "24", role: "CEN", overall: 63, rating: 7.7 },
      { name: "Gabriele Gialli",age: "24", role: "ATT", overall: 83, rating: 8.3 },
      { name: "Nicola Blu",age: "24", role: "ATT", overall: 83, rating: 7.9 },
    ],
  },
  {
    name: "Alvisopoli FC",
    players: [
      { name: "Roberto Marroni",age: "24", role: "POR", overall: 83, rating: 7.3 },
      { name: "Stefano Rosa",age: "24", role: "DIF", overall: 83, rating: 7.6 },
      { name: "Davide Azzurri",age: "24", role: "DIF", overall: 83, rating: 7.1 },
      { name: "Simone Verde",age: "24", role: "DIF", overall: 83, rating: 7.4 },
      { name: "Lorenzo Neri",age: "24", role: "CEN", overall: 83, rating: 7.8 },
      { name: "Federico Bianchi",age: "24", role: "CEN", overall: 83, rating: 8.1 },
      { name: "Riccardo Rossi",age: "24", role: "CEN", overall: 83, rating: 7.7 },
      { name: "Gabriele Gialli",age: "24", role: "ATT", overall: 83, rating: 8.3 },
      { name: "Nicola Blu",age: "24", role: "ATT", overall: 83, rating: 7.9 },
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

const getOverallColor = (overall:number) => {

  if(overall < 70) return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20";
  if(overall >= 70 && overall < 80) return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20";
  if(overall >= 80) return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20";
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
          <TabsList className="w-full h-auto bg-muted/50 p-2 grid grid-cols-5 grid-rows-2 gap-2">
            {teams.map((team, index) => (
              <TabsTrigger key={index} value={index.toString()}>
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
                        <div className="flex items-center gap-1">
                          <span className="text-sm text-muted-foreground">Età:</span>
                          <span className="font-medium">{player.age}</span>
                        </div> 
                        <div className="flex items-center gap-1">
                          <span className="text-sm text-muted-foreground">Overall:</span>
                          <Badge variant="outline" className={getOverallColor(player.overall)}>
                            {player.overall}
                          </Badge>
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

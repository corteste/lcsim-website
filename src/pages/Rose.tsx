import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { getRoleColor, getValueColor } from "@/utils/functions";

const teams = [
  {
    name: "Red Mamba",
    logo: "/src/images/teams/RMB_Logo.png",
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
    logo: "/src/images/teams/MAR_Logo.png",
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
    logo: "/src/images/teams/ACD_Logo.png",
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
    logo: "/src/images/teams/APD_Logo.png",
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
    logo: "/src/images/teams/PFC_Logo.png",
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
    logo: "/src/images/teams/VFC_Logo.png",
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
    logo: "/src/images/teams/ASK_Logo.png",
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
    logo: "/src/images/teams/ACF_Logo.png",
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
    name: "Old Bois",
    logo: "/src/images/teams/OLD_Logo.png",
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
    logo: "/src/images/teams/ALV_Logo.png",
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
                <img src={team.logo} alt={`${team.name} Logo`} className="h-8 w-8 object-contain" />
              </TabsTrigger>
            ))}
          </TabsList>

          {teams.map((team, teamIndex) => (
            <TabsContent key={teamIndex} value={teamIndex.toString()}>
              <Card className="shadow-lg">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{team.name}</CardTitle>
                      <CardDescription>{team.players.length} giocatori</CardDescription>
                    </div>
                    <img src={team.logo} alt={`${team.name} Logo`} className="h-16 w-16 object-contain" />
                  </div>
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
                          <Badge variant="outline" className={getValueColor(player.overall)}>
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

import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { getRoleColor } from "@/utils/functions";
import { getPlayers } from "@/hooks/use-players";


const teamName = "Average Pegiò Drivers";

const getOverallColor = (overall:number) => {

  if(overall < 70) return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20";
  if(overall >= 70 && overall < 80) return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20";
  if(overall >= 80) return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20";
};

const Roster = () => {
   const { players } = getPlayers("APD");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center justify-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            Average Pegiò Drivers
          </h1>
          <p className="text-muted-foreground">Roster Completo</p>
        </div>

        <Tabs defaultValue="0" className="w-full">
            <TabsContent key={0} value={"0"}>
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>{teamName}</CardTitle>
                  <CardDescription>{players.length} giocatori</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {players.map((player, playerIndex) => (
                      <div
                        key={playerIndex}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                          <Badge variant="outline" className={getRoleColor(player.Posiz)}>
                            {player.Posiz}
                          </Badge>
                          
                          <span className="font-medium text-sm sm:text-base truncate">{player.Nome} {player.Cognome}</span>
                          <img src="/images/players/MConti.png" alt="Custom Trophy" className="h-6 w-6 sm:h-8 sm:w-8 object-contain border rounded-full" />
                        </div>
                        
                        <div className="flex gap-4 sm:gap-6 justify-between sm:justify-end w-full sm:w-auto">
                          <div className="flex items-center gap-1">
                            <span className="text-xs sm:text-sm text-muted-foreground">Età:</span>
                            <span className="font-medium text-sm sm:text-base">{player.Età}</span>
                          </div> 
                          <div className="flex items-center gap-1">
                            <span className="text-xs sm:text-sm text-muted-foreground">Overall:</span>
                            <Badge variant="outline" className={getOverallColor(player.OVR)}>
                              {player.OVR}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 sm:flex hidden">
                            <span className="text-sm text-muted-foreground">Voto medio:</span>
                            <span className="font-bold text-primary text-lg">{player.OVR}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Roster;

import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Player } from "../types/player";
import { supabase } from "../supabaseClient";
import { PLAYER_TABLE } from "../constants/App";

const teamName = "Average Pegiò Drivers";

const getRoleColor = (role: string) => {
  switch (role) {
    case "POR": return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20";
    case "DC": return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20";
    case "TS": return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20";
    case "TD": return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20";
    case "CDC": return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20";
    case "CC": return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20";
    case "ED": return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20";
    case "ES": return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20";
    case "COC": return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20";
    case "AD": return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20";
    case "AS": return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20";
    case "AT": return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20";
    case "ATT": return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20";
    default: return "bg-muted";
  }
};

const getOverallColor = (overall:number) => {

  if(overall < 70) return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20";
  if(overall >= 70 && overall < 80) return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20";
  if(overall >= 80) return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20";
};

const Roster = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  
    useEffect(() => {
      async function fetchPlayers() {
        const { data, error } = await supabase.from(PLAYER_TABLE).select("*").eq('Squadra', 'APD'); // filtrare per squadra dell'utente
        console.log(data);
        if (error) console.error(error);
        else setPlayers(data || []);
      }
      fetchPlayers();
    }, []);

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
                        className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <Badge variant="outline" className={getRoleColor(player.Posiz)}>
                            {player.Posiz}
                          </Badge>
                          <span className="font-medium">{player.Nome} {player.Cognome}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-sm text-muted-foreground">Età:</span>
                          <span className="font-medium">{player.Età}</span>
                        </div> 
                        <div className="flex items-center gap-1">
                          <span className="text-sm text-muted-foreground">Overall:</span>
                          <Badge variant="outline" className={getOverallColor(player.OVR)}>
                            {player.OVR}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Voto medio:</span>
                          <span className="font-bold text-primary text-lg">{player.OVR}</span>
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

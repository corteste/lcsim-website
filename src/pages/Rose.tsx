import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { getRoleColor, getValueColor } from "@/utils/functions";
import { getTeams } from "@/hooks/use-teams";

const Rose = () => {
 const { teams } = getTeams();
  
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
                {team.NAME}
                <img src={`/src/images/teams/${team.TEAM_ID}_Logo.png`} alt={`${team.TEAM_ID} Logo`} className="h-8 w-8 object-contain" />
              </TabsTrigger>
            ))}
          </TabsList>

          {teams.map((team, teamIndex) => (
            <TabsContent key={teamIndex} value={teamIndex.toString()}>
              <Card className="shadow-lg">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{team.NAME}</CardTitle>
                      <CardDescription>{team.players.length} giocatori</CardDescription>
                    </div>
                    <img src={`/src/images/teams/${team.TEAM_ID}_Logo.png`} alt={`${team.TEAM_ID} Logo`} className="h-16 w-16 object-contain" />
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
                          <Badge variant="outline" className={getValueColor(player.OVR)}>
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
          ))}
        </Tabs>
      </main>
    </div>
  );
};

export default Rose;

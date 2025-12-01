import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { getRoleColor, getValueColor, getNationalityFlag } from "@/utils/functions";
import { getTeams } from "@/hooks/use-teams";
import { getPlayersSumStats } from "@/hooks/use-players-stats";
import { Player } from "@/types/player";

const CURRENT_SEASON = 9;

const Rose = () => {
  const { teams } = getTeams();
  const { playersStats } = getPlayersSumStats(CURRENT_SEASON, null, null);

  const sortedTeams = teams.slice().sort((a, b) => a.NAME.localeCompare(b.NAME));

 // PER ORDINE FORMAZIONE
    const rolePriority: Record<string, number> = {
        POR: 0, DC: 1, TD: 2, TS: 3, CDC: 4, CC: 5, ED: 6, ES: 7, COC: 8, AD: 9, AS: 10, AT: 11, ATT: 12
    };

    function sortPlayersByRole(players: Player[]): Player[] {
        // slice() serve per non modificare l'array originale
        return players.slice().sort((a, b) => rolePriority[a.Posiz] - rolePriority[b.Posiz]);
    }


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
            {sortedTeams.map((team, index) => (
              <TabsTrigger key={index} value={index.toString()}>
                {team.NAME}
                <img src={`/images/teams/${team.TEAM_ID}_Logo.png`} alt={`${team.TEAM_ID} Logo`} className="h-8 w-8 object-contain" />
              </TabsTrigger>
            ))}
          </TabsList>

          {sortedTeams.map((team, teamIndex) => (
            <TabsContent key={teamIndex} value={teamIndex.toString()}>
              <Card className="shadow-lg">
                <CardHeader>
                  <div className="grid grid-cols-[5fr_1fr_100px] gap-4 items-center">
                    <div>
                      <CardTitle>{team.NAME}</CardTitle>
                      <CardDescription>{team.players.length} giocatori</CardDescription>
                    </div>
                    {/* TROFEI (dinamico) */}
                    <div className="flex gap-4 items-center">
                      {team.scudetto > 0 && (
                        <div className="flex items-center gap-1">
                          <span>{team.scudetto}×</span>
                          <img
                            src={`/images/trophies/LCSIM_Scudetto.png`}
                            alt="Scudetto"
                            className="h-16 w-16 object-contain"
                          />
                        </div>
                      )}

                      {team.supercoppa > 0 && (
                        <div className="flex items-center gap-1">
                          <span>{team.supercoppa}×</span>
                          <img
                            src={`/images/trophies/LCSIM_Supercoppa.png`}
                            alt="Supercoppa"
                            className="h-16 w-16 object-contain"
                          />
                        </div>
                      )}
                    </div>

                    {/* LOGO TEAM (sempre fisso) */}
                    <img
                      src={`/images/teams/${team.TEAM_ID}_Logo.png`}
                      alt={`${team.TEAM_ID} Logo`}
                      className="h-16 w-16 object-contain"
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {sortPlayersByRole(team.players).map((player, playerIndex) => {
                      const stat = playersStats.find(p => p.ID === player.ID);
                      const avgVote = stat?.sum_voto
                        ? (stat.sum_voto / (stat.matches_played || 1)).toFixed(1)
                        : "N/D";

                      return (
                        <div
                          key={playerIndex}
                          className="flex flex-col sm:grid sm:grid-cols-[50px_minmax(150px,1fr)_80px_80px_80px] lg:grid-cols-[50px_300px_2fr_100px_120px_120px_120px_150px] items-start sm:items-center gap-2 sm:gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                        >
                          <Badge variant="outline" className={getRoleColor(player.Posiz)}>
                            {player.Posiz}
                          </Badge>
                          <span className="font-medium">{player.Nome} {player.Cognome}</span>
                          <div className="flex items-center gap-1 sm:hidden lg:flex">
                            <img src={getNationalityFlag(player.Nazionalità)} alt="Player Flag" className="h-8 w-8 object-contain border rounded-full" />
                          </div>
                          <div className="flex items-center gap-1 sm:w-auto">
                            <span className="text-sm text-muted-foreground">Età:</span>
                            <span className="font-medium">{player.Età}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-sm text-muted-foreground">Overall:</span>
                            <Badge variant="outline" className={getValueColor(player.OVR)}>
                              {player.OVR}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1 sm:hidden lg:flex">
                            <span className="text-sm text-muted-foreground">Piede:</span>
                            <span className="font-small">{player.Piede}</span>
                          </div>
                          <div className="flex items-center gap-1 sm:hidden lg:flex">
                            <span className="text-sm text-muted-foreground">XP:</span>
                            <span className="font-small">{player.XP}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Voto medio:</span>
                            <span className="font-bold text-primary text-lg">
                              {avgVote}
                            </span>
                          </div>
                        </div>
                      )
                    })}
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

import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BarChart3, TrendingUp, Award, Target, ChartNoAxesColumn } from "lucide-react";
import { useState } from "react";
import { getRoleColor, getPosGroup } from "@/utils/functions";
import { getPlayersSumStats } from "@/hooks/use-players-stats";
import { PlayerStatsSum } from "@/types/playerStats";
import { getTeams } from "@/hooks/use-teams";



const Statistiche = () => {
  const [statType, setStatType] = useState<"goalscorers" | "assists" | "ratings">("goalscorers");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [teamFilter, setTeamFilter] = useState<string>("all");
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const { teams } = getTeams();
  const { playersStats } = getPlayersSumStats(8,null,null);

  const filteredStats = playersStats.filter(
    player =>
      (teamFilter === "all" || player.Squadra === teamFilter) &&
      (roleFilter === "all" || getPosGroup(player.Posiz) === roleFilter)
  ).sort(sortPlayersStats);

  function sortPlayersStats(a: PlayerStatsSum, b: PlayerStatsSum) {
  switch (statType) {
    case "goalscorers":
      return b.sum_gol - a.sum_gol;
    case "assists":
      return b.sum_asst - a.sum_asst;
    case "ratings":
      return (Math.round(((b.sum_voto/b.matches_played) - (a.sum_voto/a.matches_played))* 100) / 100);
    // return (Math.round((b.sum_voto/b.matches_played) * 100) / 100) - Math.round((a.sum_voto/a.matches_played) * 100) / 100;
    default:
      return 0;
  }
}

  const getStatLabel = () => {
    switch (statType) {
      case "goalscorers": return "Goal";
      case "assists": return "Assist";
      case "ratings": return "Voto Medio";
    }
  };

  const getStatValue = (player: PlayerStatsSum) => {
    switch (statType) {
      case "goalscorers": return player.sum_gol;
      case "assists": return player.sum_asst;
      case "ratings": return Math.round((player.sum_voto/player.matches_played) * 100) / 100;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center justify-center gap-3">
            <BarChart3 className="h-8 w-8 text-primary" />
            Statistiche
          </h1>
          <p className="text-muted-foreground">Analisi dettagliata del campionato</p>
        </div>

        {/* Filters */}
        <Card className="mb-6 shadow-lg">
          <CardHeader>
            <CardTitle>Filtri</CardTitle>
            <CardDescription>Personalizza la visualizzazione delle statistiche</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo di Statistica</label>
                <Select value={statType} onValueChange={(value: any) => {
                  setStatType(value)                  
                  }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="goalscorers">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Capocannonieri
                      </div>
                    </SelectItem>
                    <SelectItem value="assists">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Assist
                      </div>
                    </SelectItem>
                    <SelectItem value="ratings">
                      <div className="flex items-center gap-2">
                        <ChartNoAxesColumn className="h-4 w-4" />
                        Voti Medi
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Ruolo</label>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti i Ruoli</SelectItem>
                    <SelectItem value="POR">Portieri</SelectItem>
                    <SelectItem value="DIF">Difensori</SelectItem>
                    <SelectItem value="CEN">Centrocampisti</SelectItem>
                    <SelectItem value="ATT">Attaccanti</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Squadra</label>
                <Select value={teamFilter} onValueChange={setTeamFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutte le Squadre</SelectItem>
                    {teams.map((team) => (
                      <SelectItem value={team.TEAM_ID}>{team.NAME}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Display */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {statType === "goalscorers" && <Target className="h-5 w-5 text-primary" />}
              {statType === "assists" && <TrendingUp className="h-5 w-5 text-primary" />}
              {statType === "ratings" && <ChartNoAxesColumn className="h-5 w-5 text-primary" />}
              {statType === "goalscorers" && "Classifica Marcatori"}
              {statType === "assists" && "Classifica Assist"}
              {statType === "ratings" && "Migliori Voti Medi"}
            </CardTitle>
            <CardDescription>
              {playersStats.length} giocatori trovati
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredStats.map((player, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedPlayer(player)}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 font-bold text-primary">
                      {index + 1}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{player.Nome} {player.Cognome}</span>
                        <Badge variant="outline" className={getRoleColor(player.Posiz)}>
                          {player.Posiz}
                        </Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">{teams.find(t => t.TEAM_ID === player.Squadra)?.NAME ?? "-" } </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-sm text-muted-foreground">{getStatLabel()}</span>
                    <span className="font-bold text-primary text-2xl">{getStatValue(player)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Player Stats Dialog */}
      <Dialog open={!!selectedPlayer} onOpenChange={(open) => !open && setSelectedPlayer(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-2xl">
              {selectedPlayer?.name}
              <Badge variant="outline" className={getRoleColor(selectedPlayer?.role)}>
                {selectedPlayer?.role}
              </Badge>
            </DialogTitle>
          </DialogHeader>
          
          {selectedPlayer && (
            <div className="space-y-6 mt-4">
              {/* General Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informazioni Generali</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Squadra</p>
                    <p className="font-medium">{selectedPlayer.Squadra}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ruolo</p>
                    <p className="font-medium">{selectedPlayer.Posiz}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Statistiche Prestazioni</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {selectedPlayer.goals !== undefined && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground">Gol</p>
                      <p className="font-bold text-2xl text-primary">{selectedPlayer.goals}</p>
                    </div>
                  )}
                  {selectedPlayer.assists !== undefined && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground">Assist</p>
                      <p className="font-bold text-2xl text-primary">{selectedPlayer.assists}</p>
                    </div>
                  )}
                  {selectedPlayer.rating !== undefined && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground">Voto Medio</p>
                      <p className="font-bold text-2xl text-primary">{selectedPlayer.rating}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Note about full stats */}
              <div className="p-4 rounded-lg bg-muted/30 border border-border">
                <p className="text-sm text-muted-foreground">
                  💡 Per visualizzare tutte le statistiche complete del giocatore (attributi tecnici, fisici, mentali, ecc.), 
                  collega il database dei giocatori con l'integrazione dati.
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Statistiche;

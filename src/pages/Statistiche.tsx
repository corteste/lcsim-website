import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BarChart3, TrendingUp, ChevronRight, Target, ChartNoAxesColumn, ChevronLeft } from "lucide-react";
import { useState } from "react";
import { getRoleColor, getPosGroup } from "@/utils/functions";
import { getPlayersSumStats } from "@/hooks/use-players-stats";
import { PlayerStatsSum } from "@/types/playerStats";
import { getTeams } from "@/hooks/use-teams";
import { Button } from "@/components/ui/button";
import PlayerAdvancedStats from "@/components/player/playerAdvancedStats"


const PLAYERS_PER_PAGE = 10;
const CURRENT_SEASON = 8;

const Statistiche = () => {
  const [statType, setStatType] = useState<"goalscorers" | "assists" | "ratings">("ratings");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [teamFilter, setTeamFilter] = useState<string>("all");
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const { teams } = getTeams();
  const { playersStats } = getPlayersSumStats(CURRENT_SEASON, null, null);
  const [currentPage, setCurrentPage] = useState(1);
  // aggiungi get delle statistiche per id giocatore in modo da poterle mostrare nella pagina dedicata

  const filteredStats = playersStats.filter(
    player =>
      (teamFilter === "all" || player.Squadra === teamFilter) &&
      (roleFilter === "all" || getPosGroup(player.Posiz) === roleFilter)
  ).sort(sortPlayersStats);

  // Calculate pagination
  const totalPages = Math.ceil(filteredStats.length / PLAYERS_PER_PAGE);
  const startIndex = (currentPage - 1) * PLAYERS_PER_PAGE;
  const endIndex = startIndex + PLAYERS_PER_PAGE;
  const currentPlayers = filteredStats.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  function sortPlayersStats(a: PlayerStatsSum, b: PlayerStatsSum) {
    switch (statType) {
      case "goalscorers":
        return b.sum_gol - a.sum_gol;
      case "assists":
        return b.sum_asst - a.sum_asst;
      case "ratings":
        return (Math.round(((b.sum_voto / b.matches_played) - (a.sum_voto / a.matches_played)) * 100) / 100);
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
      case "ratings": return Math.round((player.sum_voto / player.matches_played) * 100) / 100;
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
                        Media Voto
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
              {statType === "ratings" && "Migliore Media Voto"}
            </CardTitle>
            <CardDescription>
              {playersStats.length} giocatori trovati
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {currentPlayers.map((player, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedPlayer(player)}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 font-bold text-primary">
                      {index + 1 + ((currentPage - 1) * 10)}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{player.Nome} {player.Cognome}</span>
                        <Badge variant="outline" className={getRoleColor(player.Posiz)}>
                          {player.Posiz}
                        </Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">{teams.find(t => t.TEAM_ID === player.Squadra)?.NAME ?? "-"}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-sm text-muted-foreground">{getStatLabel()}</span>
                    <span className="font-bold text-primary text-2xl">{getStatValue(player)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Precedente
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => goToPage(pageNum)}
                        className="w-10"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Successiva
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}

          </CardContent>
        </Card>
      </main>

      {/* Player Stats Dialog */}
      <Dialog open={!!selectedPlayer} onOpenChange={(open) => !open && setSelectedPlayer(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-2xl">
              <img src="/images/players/MConti.png" alt="Custom Trophy" className="h-14 w-14 object-contain border rounded-full" />
              {selectedPlayer?.Nome} {selectedPlayer?.Cognome}
              <Badge variant="outline" className={getRoleColor(selectedPlayer?.Posiz)}>
                {selectedPlayer?.Posiz}
              </Badge>
              <p className="text-sm text-muted-foreground">{teams.find(t => t.TEAM_ID === selectedPlayer?.Squadra)?.NAME ?? "-"}</p>
            </DialogTitle>
          </DialogHeader>

          {selectedPlayer && (
            <PlayerAdvancedStats currentPlayer={selectedPlayer} teams={teams} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Statistiche;

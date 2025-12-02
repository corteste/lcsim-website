import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart3, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { getRoleColor, getPosGroup, getContractStatus } from "@/utils/functions";
import { getPlayers } from "@/hooks/use-players";
import { MarketStatus } from "@/types/marketStatus";
import { getTeams } from "@/hooks/use-teams";
import { Player } from "@/types/player";
import PlayerDetails from "@/components/player/playerDetails";

const getMarketStatus = (market: MarketStatus) => {
  if(market === null) return "bg-muted";
  switch (market.Status) {
    case "int": return "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20";
    case "ced": return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20";
    case "tra": return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20";
    case "fis": return "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20";
    default: return "bg-muted";
  }
};

const getMarketStatusDisplay = (market: MarketStatus) => {
  if(market === null) return "N/A";
  switch (market.Status) {
    case "int": return "Intoccabile";
    case "ced": return "Cedibile";
    case "tra": return "Possibili Trattative";
    case "fis": return "Elemento Fisso";
    default: return "N/A";
  }
};

const PLAYERS_PER_PAGE = 10;

const ListaGiocatori = () => {
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [teamFilter, setTeamFilter] = useState<string>("all");
  const [contractFilter, setContractFilter] = useState<string>("all");
  const [marketFilter, setMarketFilter] = useState<string>("all");
  const { players } = getPlayers();
  const { teams } = getTeams();
  const [currentPage, setCurrentPage] = useState(1);
  const [selected, setSelected] = useState<{ player: Player } | null>(null);
  
  
  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [roleFilter, teamFilter, contractFilter, marketFilter]);

  const filteredStats = players.filter(
    player =>
      (teamFilter === "all" || player.Squadra === teamFilter) &&
      (roleFilter === "all" || getPosGroup(player.Posiz) === roleFilter) &&
      (marketFilter === "all" || player.MarketStatus?.Status === marketFilter) &&
      (contractFilter === "all" || getContractStatus(player.Squadra) === contractFilter)
  );

  // Calculate pagination
  const totalPages = Math.ceil(filteredStats.length / PLAYERS_PER_PAGE);
  const startIndex = (currentPage - 1) * PLAYERS_PER_PAGE;
  const endIndex = startIndex + PLAYERS_PER_PAGE;
  const currentPlayers = filteredStats.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center justify-center gap-3">
            <BarChart3 className="h-8 w-8 text-primary" />
            Lista Giocatori
          </h1>
          <p className="text-muted-foreground">Lista completa dei giocatori</p>
        </div>

        {/* Filters */}
        <Card className="mb-6 shadow-lg">
          <CardHeader>
            <CardTitle>Filtri</CardTitle>
            <CardDescription>Personalizza la visualizzazione delle statistiche</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/** Squadra Filter */}
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

               {/** Ruolo Filter */}

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

               {/** Stato Giocatore */}

              <div className="space-y-2">
                <label className="text-sm font-medium">Stato Giocatore</label>
                <Select value={contractFilter} onValueChange={setContractFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti</SelectItem>
                    <SelectItem value="svi">Svincolati</SelectItem>
                    <SelectItem value="con">Sotto Contratto</SelectItem>
                    <SelectItem value="sec">Serie Inferiore</SelectItem>
                  </SelectContent>
                </Select>
              </div>

               {/** Stato sul Mercato */}

              <div className="space-y-2">
                <label className="text-sm font-medium">Stato sul Mercato</label>
                <Select value={marketFilter} onValueChange={setMarketFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti gli stati</SelectItem>
                    <SelectItem value="ced">Lista Cessioni</SelectItem>
                    <SelectItem value="tra">Possibili Trattative</SelectItem>
                    <SelectItem value="fis">Elemento Fisso</SelectItem>
                    <SelectItem value="int">Intoccabile</SelectItem>
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
              Risultati
            </CardTitle>
            <CardDescription>
              {filteredStats.length} giocatori trovati - Pagina {currentPage} di {totalPages}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {currentPlayers.map((player, index) => (
                <div
                  key={index}
                  onClick={() => setSelected({ player })}
                  className="flex flex-col sm:grid sm:grid-cols-[60px_minmax(150px,1fr)_80px] lg:grid-cols-[80px_minmax(200px,1fr)_100px_100px_100px_180px] gap-3 sm:gap-4 items-start sm:items-center p-4 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-center w-12 h-12 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full bg-primary/10 font-bold text-primary text-base sm:text-lg">
                    {player.OVR}
                  </div>
                  
                  <div className="flex flex-col min-w-0 flex-1 sm:flex-initial">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate">{player.Nome} {player.Cognome}</span>
                      <Badge variant="outline" className={getRoleColor(player.Posiz)}>
                        {player.Posiz}
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground truncate">{teams.find(t => t.TEAM_ID === player.Squadra)?.NAME ?? "-"}</span>
                  </div>
                  
                  <div className="flex gap-4 justify-between w-full sm:w-auto sm:contents">
                    <div className="flex flex-col items-center sm:items-center">
                      <span className="text-xs sm:text-sm text-muted-foreground">Età</span>
                      <span className="font-bold text-primary text-base sm:text-lg">{player.Età}</span>
                    </div>
                    
                    <div className="flex flex-col items-center lg:flex hidden">
                      <span className="text-sm text-muted-foreground">Piede</span>
                      <span className="font-bold text-[rgb(73,140,244)]/90 text-lg">{player.Piede}</span>
                    </div>
                    
                    <div className="flex flex-col items-center lg:flex hidden">
                      <span className="text-sm text-muted-foreground">XP</span>
                      <span className="font-bold text-primary text-lg">{player.XP}</span>
                    </div>
                    
                    <div className="flex flex-col items-center lg:flex hidden">
                      <span className="text-sm text-muted-foreground mb-1">Market Status</span>
                      <Badge variant="outline" className={getMarketStatus(player.MarketStatus)}>
                        {getMarketStatusDisplay(player.MarketStatus)}
                      </Badge>
                    </div>
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

      {/* Modal Dettaglio Giocatore */}
      {selected && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setSelected(null)}>
                <PlayerDetails currentPlayer={selected.player} />
              </div>
            )}
    </div>
  );
};

export default ListaGiocatori;

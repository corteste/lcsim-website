import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, TrendingUp, Users, Award, BarChart3, CalendarDays} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { getStandings } from "@/hooks/use-standings";
import { getPlayersSumStats } from "@/hooks/use-players-stats";
import { PlayerStatsSum } from "@/types/playerStats";
import { getRoleColor } from "@/utils/functions";

const stats = [
  { label: "Giornate Giocate", value: "0", icon: CalendarDays, color: "text-green-600" },
  { label: "Gol Totali", value: "0", icon: Award, color: "text-red-600" },
  { label: "Media Gol/Partita", value: "0", icon: TrendingUp, color: "text-purple-600" },
];

const topPlayers = [
  { name: "Alessandro Grigi", team: "FC Dragonslayers", rating: 8.5, role: "ATT" },
  { name: "Gabriele Gialli", team: "Thunder United", rating: 8.3, role: "ATT" },
  { name: "Giuseppe Gialli", team: "FC Dragonslayers", rating: 8.2, role: "CEN" },
];

const CURRENT_SEASON = 9;

const Home = () => {

  const { playersStats } = getPlayersSumStats(CURRENT_SEASON, null, null);
  const filteredStats = playersStats.sort(sortPlayersStats);

    function sortPlayersStats(a: PlayerStatsSum, b: PlayerStatsSum) {
          return (Math.round(((b.sum_voto / b.matches_played) - (a.sum_voto / a.matches_played)) * 100) / 100);
    };
    

  const { standings } = getStandings();
  return (
    
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* <div className="mb-8 text-center">
          <h1 className="text-5xl font-bold text-foreground mb-3 flex items-center justify-center gap-3">
            <img src="/src/images/LCSIM_Logo.png" alt="Custom Trophy" className="h-16 w-16 object-contain" />
            Lega Calcio Simulato
          </h1>
          <p className="text-lg text-muted-foreground">Benvenuto nel tuo campionato manageriale</p>
          <p className="text-sm text-muted-foreground mt-1">Stagione 2024/25</p>
        </div> */}

        <div className="mb-8 text-center">
          <div className="flex items-center justify-center mb-3">
            <img
              src="/images/LCSIM_Logo.png"
              alt="Custom Trophy"
              className="h-60 w-60 object-contain"
            />
          </div>
          <p className="text-lg text-muted-foreground">Benvenuto nel tuo campionato manageriale</p>
          <p className="text-sm text-muted-foreground mt-1">Stagione 2024/25</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Classifica Summary */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                Classifica
              </CardTitle>
              <CardDescription>Top 3 squadre</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {standings.slice(0,3).map((team,index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                        index + 1 === 1 ? "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400" :
                        index + 1 === 2 ? "bg-gray-400/20 text-gray-700 dark:text-gray-400" :
                        "bg-orange-500/20 text-orange-700 dark:text-orange-400"
                      }`}>
                        {index + 1}
                      </div>
                      <span className="font-medium">{team.team.NAME}</span>
                    </div>
                    <span className="font-bold text-primary">{team.points} pt</span>
                  </div>
                ))}
                <Link to="/classifica">
                  <Button variant="outline" className="w-full mt-2">
                    Vedi Classifica Completa
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Statistiche */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Statistiche
              </CardTitle>
              <CardDescription>Numeri del campionato</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                 <div
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    
                    <div className="flex items-center gap-3">
                      <Users className={`h-5 w-5 text-blue-600`} />
                      <span className="text-sm text-muted-foreground">Squadre</span>
                    </div>
                    <span className="font-bold text-lg">10</span>
                  </div>
                {stats.map((stat, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                      <span className="text-sm text-muted-foreground">{stat.label}</span>
                    </div>
                    <span className="font-bold text-lg">{stat.value}</span>
                  </div>
                ))}
                <Link to="/statistiche">
                  <Button variant="outline" className="w-full mt-2">
                    Vedi Statistiche Giocatori
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Top Players */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Top Giocatori
              </CardTitle>
              <CardDescription>Migliori performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {filteredStats.slice(0,3).map((player, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex flex-col">
                      
                      <span className="font-medium">{player.Nome} {player.Cognome}</span>
                      <span className="text-xs text-muted-foreground">{player.Squadra}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={getRoleColor(player.Posiz)}>
                        {player.Posiz}
                      </Badge>
                      <span className="font-bold text-primary text-lg">{Math.round((player.sum_voto / player.matches_played) * 100)/100}</span>
                    </div>
                  </div>
                ))}
                <Link to="/rose">
                  <Button variant="outline" className="w-full mt-2">
                    Vedi Tutte le Rose
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Home;

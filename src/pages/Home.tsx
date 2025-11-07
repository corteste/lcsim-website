import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, TrendingUp, Users, Award, BarChart3, CalendarDays} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const topTeams = [
  { position: 1, team: "Average Pegiò Drivers", points: 25 },
  { position: 2, team: "Panormus FC", points: 23 },
  { position: 3, team: "Phoenix Rising", points: 21 },
];

const stats = [
  { label: "Squadre Totali", value: "8", icon: Users, color: "text-blue-600" },
  { label: "Giornate Giocate", value: "10", icon: CalendarDays, color: "text-green-600" },
  { label: "Gol Totali", value: "142", icon: Award, color: "text-red-600" },
  { label: "Media Gol/Partita", value: "3.55", icon: TrendingUp, color: "text-purple-600" },
];

const topPlayers = [
  { name: "Alessandro Grigi", team: "FC Dragonslayers", rating: 8.5, role: "ATT" },
  { name: "Gabriele Gialli", team: "Thunder United", rating: 8.3, role: "ATT" },
  { name: "Giuseppe Gialli", team: "FC Dragonslayers", rating: 8.2, role: "CEN" },
];

const Home = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-5xl font-bold text-foreground mb-3 flex items-center justify-center gap-3">
            <Trophy className="h-10 w-10 text-primary" />
            Lega Calcio Simulato
          </h1>
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
                {topTeams.map((team) => (
                  <div
                    key={team.position}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                        team.position === 1 ? "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400" :
                        team.position === 2 ? "bg-gray-400/20 text-gray-700 dark:text-gray-400" :
                        "bg-orange-500/20 text-orange-700 dark:text-orange-400"
                      }`}>
                        {team.position}
                      </div>
                      <span className="font-medium">{team.team}</span>
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
                    Vedi Statistiche Dettagliate
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
              <div className="space-y-4">
                {topPlayers.map((player, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{player.name}</span>
                      <span className="text-xs text-muted-foreground">{player.team}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${
                        player.role === "ATT" ? "bg-red-500/10 text-red-700 dark:text-red-400" :
                        "bg-green-500/10 text-green-700 dark:text-green-400"
                      }`}>
                        {player.role}
                      </span>
                      <span className="font-bold text-primary text-lg">{player.rating}</span>
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

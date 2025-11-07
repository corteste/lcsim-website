import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, Award, Target } from "lucide-react";
import { useState } from "react";

const allStats = {
  goalscorers: [
    { name: "Alessandro Grigi", team: "FC Dragonslayers", goals: 12, role: "ATT" },
    { name: "Gabriele Gialli", team: "Thunder United", goals: 11, role: "ATT" },
    { name: "Matteo Arancio", team: "FC Dragonslayers", goals: 9, role: "ATT" },
    { name: "Nicola Blu", team: "Thunder United", goals: 8, role: "ATT" },
    { name: "Giuseppe Gialli", team: "FC Dragonslayers", goals: 7, role: "CEN" },
  ],
  assists: [
    { name: "Giuseppe Gialli", team: "FC Dragonslayers", assists: 8, role: "CEN" },
    { name: "Federico Bianchi", team: "Thunder United", assists: 7, role: "CEN" },
    { name: "Francesco Blu", team: "FC Dragonslayers", assists: 6, role: "CEN" },
    { name: "Lorenzo Neri", team: "Thunder United", assists: 5, role: "CEN" },
    { name: "Antonio Viola", team: "FC Dragonslayers", assists: 4, role: "CEN" },
  ],
  ratings: [
    { name: "Alessandro Grigi", team: "FC Dragonslayers", rating: 8.5, role: "ATT" },
    { name: "Gabriele Gialli", team: "Thunder United", rating: 8.3, role: "ATT" },
    { name: "Giuseppe Gialli", team: "FC Dragonslayers", rating: 8.2, role: "CEN" },
    { name: "Federico Bianchi", team: "Thunder United", rating: 8.1, role: "CEN" },
    { name: "Matteo Arancio", team: "FC Dragonslayers", rating: 8.0, role: "ATT" },
  ],
};

const getRoleColor = (role: string) => {
  switch (role) {
    case "POR": return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20";
    case "DIF": return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20";
    case "CEN": return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20";
    case "ATT": return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20";
    default: return "bg-muted";
  }
};

const Statistiche = () => {
  const [statType, setStatType] = useState<"goalscorers" | "assists" | "ratings">("goalscorers");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const currentStats = allStats[statType];
  const filteredStats = roleFilter === "all" 
    ? currentStats 
    : currentStats.filter(player => player.role === roleFilter);

  const getStatLabel = () => {
    switch (statType) {
      case "goalscorers": return "Gol";
      case "assists": return "Assist";
      case "ratings": return "Voto Medio";
    }
  };

  const getStatValue = (player: any) => {
    switch (statType) {
      case "goalscorers": return player.goals;
      case "assists": return player.assists;
      case "ratings": return player.rating;
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
                <Select value={statType} onValueChange={(value: any) => setStatType(value)}>
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
                        <Award className="h-4 w-4" />
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
            </div>
          </CardContent>
        </Card>

        {/* Stats Display */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {statType === "goalscorers" && <Target className="h-5 w-5 text-primary" />}
              {statType === "assists" && <TrendingUp className="h-5 w-5 text-primary" />}
              {statType === "ratings" && <Award className="h-5 w-5 text-primary" />}
              {statType === "goalscorers" && "Classifica Marcatori"}
              {statType === "assists" && "Classifica Assist"}
              {statType === "ratings" && "Migliori Voti Medi"}
            </CardTitle>
            <CardDescription>
              {filteredStats.length} giocatori trovati
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredStats.map((player, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 font-bold text-primary">
                      {index + 1}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{player.name}</span>
                        <Badge variant="outline" className={getRoleColor(player.role)}>
                          {player.role}
                        </Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">{player.team}</span>
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
    </div>
  );
};

export default Statistiche;

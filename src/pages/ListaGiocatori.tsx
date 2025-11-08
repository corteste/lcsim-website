import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, Award, Target } from "lucide-react";
import { useState } from "react";

interface Player {
  id: number;
  name: string;
  role: string;
  rating: number;
  overall: number;
  position: string | null;
  number: number | null;
  team: string | null;
  marketStatus: string | null;
  contractStatus: string;
}

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
    { name: "Andrea Viola", team: "Average Pegiò Drivers", rating: 8.0, role: "ATT" },
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

const getMarketStatus = (status: string) => {
  switch (status) {
    case "int": return "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20";
    case "ced": return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20";
    case "tra": return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20";
    case "fis": return "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20";
    default: return "bg-muted";
  }
};

const ListaGiocatori = () => {
  const [statType, setStatType] = useState<"goalscorers" | "assists" | "ratings">("goalscorers");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [teamFilter, setTeamFilter] = useState<string>("all");
  const [contractFilter, setContractFilter] = useState<string>("all");
  const [marketFilter, setMarketFilter] = useState<string>("all");
  const [players] = useState<Player[]>([
    { id: 1, name: "Marco Rossi", role: "POR", rating: 7.5, overall: 75, position: "POR", number: 1, team: "FC Dragonslayers", marketStatus: "int", contractStatus: "con"},
    { id: 2, name: "Luca Bianchi", role: "DIF", rating: 7.2, overall: 72, position: "DIF1", number: 2, team: "Thunder United", marketStatus: "tra", contractStatus: "con" },
    { id: 3, name: "Andrea Verdi", role: "DIF", rating: 7.8, overall: 78, position: "DIF2", number: 3, team: null, marketStatus: null, contractStatus: "svi" },
    { id: 4, name: "Paolo Neri", role: "DIF", rating: 7.0, overall: 70, position: "DIF3", number: 4, team: "Thunder United", marketStatus: "ced", contractStatus: "con" },
    { id: 5, name: "Giuseppe Gialli", role: "CEN", rating: 8.2, overall: 82, position: "CEN1", number: 5, team: "FC Dragonslayers", marketStatus: "int", contractStatus: "con" },
    { id: 6, name: "Francesco Blu", role: "CEN", rating: 7.9, overall: 79, position: "CEN2", number: 6, team: "Thunder United", marketStatus: "ced", contractStatus: "con" },
    { id: 7, name: "Antonio Viola", role: "CEN", rating: 7.4, overall: 74, position: "CEN3", number: 7, team: "FC Dragonslayers", marketStatus: "fis", contractStatus: "con" },
    { id: 8, name: "Alessandro Grigi", role: "ATT", rating: 8.5, overall: 85, position: "ATT1", number: 8, team: null, marketStatus: null, contractStatus: "svi" },
    { id: 9, name: "Matteo Arancio", role: "ATT", rating: 8.0, overall: 80, position: "ATT2", number: 9, team: "FC Dragonslayers", marketStatus: "tra", contractStatus: "con" },
    { id: 10, name: "Roberto Marroni", role: "POR", rating: 7.3, overall: 73, position: null, number: 10, team: null, marketStatus: null, contractStatus: "svi" },
    { id: 11, name: "Stefano Rosa", role: "DIF", rating: 7.6, overall: 76, position: null, number: 11, team: "FC Dragonslayers", marketStatus: "ced", contractStatus: "con" },
    { id: 12, name: "Davide Azzurri", role: "CEN", rating: 7.1, overall: 71, position: null, number: 12, team: "Average Pegiò Drivers", marketStatus: "int", contractStatus: "con" },
  ]);

  const currentStats = allStats[statType];
  const filteredStats = players.filter(
  player =>
    (teamFilter === "all" || player.team === teamFilter) &&
    (roleFilter === "all" || player.role === roleFilter) &&
    (contractFilter === "all" || player.contractStatus === contractFilter) &&
    (marketFilter === "all" || player.marketStatus === marketFilter)
);

  /* Gestione delle statistiche: ho una lista di giocatori e una lista di statistiche, potenzialmente potrei avere anche tutto insieme quindi non c'è bisogno dei FOR */
  const getStatValue = (player: any) => {
    var goals = 0;
    var assists = 0; 
    var rating = 0;

    for (const p of allStats.goalscorers) {
      if (p.name === player.name) {
        goals = p.goals;
        break;
      }
    }
     for (const p of allStats.assists) {
      if (p.name === player.name) {
        assists = p.assists; 
        break;
      }
    }
     for (const p of allStats.ratings) {
      if (p.name === player.name) {
        rating = p.rating;
        break;
      }
    }
    switch (statType) {
      case "goalscorers": return goals;
      case "assists": return assists;
      case "ratings": return rating;
    }
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
                    <SelectItem value="FC Dragonslayers">FC Dragonslayers</SelectItem>
                    <SelectItem value="Average Pegiò Drivers">Average Pegiò Drivers</SelectItem>
                    <SelectItem value="Thunder United">Thunder United</SelectItem>
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
                    <span className="text-sm text-muted-foreground">Overall</span>
                    <span className="font-bold text-primary text-2xl">{player.overall}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-sm text-muted-foreground">Market Status</span>
                    <span className="font-bold text-primary text-2xl">
                      <Badge variant="outline" className={getMarketStatus(player.marketStatus)}>
                      {player.marketStatus}
                    </Badge>
                    </span>
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

export default ListaGiocatori;

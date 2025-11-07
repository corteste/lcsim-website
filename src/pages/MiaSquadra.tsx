import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Save, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Player {
  id: number;
  name: string;
  role: string;
  rating: number;
  position: string | null;
}

const MiaSquadra = () => {
  const [players] = useState<Player[]>([
    { id: 1, name: "Marco Rossi", role: "POR", rating: 7.5, position: "POR" },
    { id: 2, name: "Luca Bianchi", role: "DIF", rating: 7.2, position: "DIF1" },
    { id: 3, name: "Andrea Verdi", role: "DIF", rating: 7.8, position: "DIF2" },
    { id: 4, name: "Paolo Neri", role: "DIF", rating: 7.0, position: "DIF3" },
    { id: 5, name: "Giuseppe Gialli", role: "CEN", rating: 8.2, position: "CEN1" },
    { id: 6, name: "Francesco Blu", role: "CEN", rating: 7.9, position: "CEN2" },
    { id: 7, name: "Antonio Viola", role: "CEN", rating: 7.4, position: "CEN3" },
    { id: 8, name: "Alessandro Grigi", role: "ATT", rating: 8.5, position: "ATT1" },
    { id: 9, name: "Matteo Arancio", role: "ATT", rating: 8.0, position: "ATT2" },
    { id: 10, name: "Roberto Marroni", role: "POR", rating: 7.3, position: null },
    { id: 11, name: "Stefano Rosa", role: "DIF", rating: 7.6, position: null },
    { id: 12, name: "Davide Azzurri", role: "CEN", rating: 7.1, position: null },
  ]);

  const getRoleColor = (role: string) => {
    switch (role) {
      case "POR": return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20";
      case "DIF": return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20";
      case "CEN": return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20";
      case "ATT": return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20";
      default: return "bg-muted";
    }
  };

  const handleSaveFormation = () => {
    toast.success("Formazione salvata con successo!");
  };

  const titolari = players.filter(p => p.position !== null);
  const panchina = players.filter(p => p.position === null);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center justify-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            La Mia Squadra
          </h1>
          <p className="text-muted-foreground">Gestisci la tua formazione</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Formazione Titolare
              </CardTitle>
              <CardDescription>Giocatori in campo (3-3-2)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {titolari.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className={getRoleColor(player.role)}>
                        {player.role}
                      </Badge>
                      <span className="font-medium">{player.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Voto:</span>
                      <span className="font-bold text-primary">{player.rating}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Panchina</CardTitle>
              <CardDescription>Giocatori di riserva</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {panchina.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className={getRoleColor(player.role)}>
                        {player.role}
                      </Badge>
                      <span className="font-medium">{player.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Voto:</span>
                      <span className="font-bold text-primary">{player.rating}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 flex justify-center">
          <Button size="lg" onClick={handleSaveFormation} className="gap-2">
            <Save className="h-5 w-5" />
            Salva Formazione
          </Button>
        </div>
      </main>
    </div>
  );
};

export default MiaSquadra;

import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star } from "lucide-react";

// Mock data per la Hall of Fame - in futuro da DB
const hallOfFamePlayers = [
  {
    id: 50006,
    nome: "Oscar",
    cognome: "Brown",
    attivo: "S1-S8",
    classe: "S8",
  },
  {
    id: 50003,
    nome: "Mario",
    cognome: "Conti",
    attivo: "S1-S8",
    classe: "S8",
  },
  {
    id: 50008,
    nome: "Claudio",
    cognome: "Cassani",
    attivo: "S1-S8",
    classe: "S8",
  },
];

const PlayerCard = ({ player }: { player: typeof hallOfFamePlayers[0] }) => {
  return (
    <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-yellow-500/50">
      <div className="absolute inset-0 bg-gradient-to-t from-yellow-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <CardContent className="p-4 flex flex-col items-center">
        {/* Player Image */}
        <div className="relative mb-3">
          <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 rounded-xl opacity-60 blur-sm group-hover:opacity-80 transition-opacity" />
          <img
            src={`/images/players/p${player.id}.png`}
            alt={`${player.nome} ${player.cognome}`}
            className="relative h-32 w-32 rounded-xl object-cover border-2 border-yellow-500/50"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/placeholder.svg";
            }}
          />
          <div className="absolute -top-2 -right-2 bg-yellow-500 rounded-full p-1.5 shadow-lg">
            <Star className="h-4 w-4 text-yellow-950 fill-yellow-950" />
          </div>
        </div>

        {/* Player Info */}
        <h3 className="text-lg font-bold text-foreground text-center">
          {player.nome} {player.cognome}
        </h3>
        
        <div className="mt-3 w-full space-y-2 text-center">
          <div className="flex justify-between items-center px-2 py-1.5 bg-muted/40 rounded-lg">
            <span className="text-xs text-muted-foreground">Attivo</span>
            <span className="text-sm font-semibold text-foreground">{player.attivo}</span>
          </div>
          <div className="flex justify-between items-center px-2 py-1.5 bg-muted/40 rounded-lg">
            <span className="text-xs text-muted-foreground">Classe</span>
            <span className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">{player.classe}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const EmptySlot = () => (
  <Card className="border-dashed border-2 border-muted-foreground/20 bg-muted/10">
    <CardContent className="p-4 flex flex-col items-center justify-center h-full min-h-[240px]">
      <div className="h-32 w-32 rounded-xl bg-muted/30 flex items-center justify-center mb-3">
        <Star className="h-8 w-8 text-muted-foreground/30" />
      </div>
      <span className="text-muted-foreground/50 text-sm">In attesa</span>
    </CardContent>
  </Card>
);

const HallOfFame = () => {
  // Creo un array di 8 slot (come nell'immagine)
  const totalSlots = 8;
  const emptySlots = totalSlots - hallOfFamePlayers.length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Star className="h-8 w-8 text-yellow-500 fill-yellow-500" />
            <h1 className="text-4xl font-bold text-foreground">
              LCSIM Hall of Fame
            </h1>
            <Star className="h-8 w-8 text-yellow-500 fill-yellow-500" />
          </div>
          <p className="text-muted-foreground text-lg">
            I giocatori leggendari che hanno scritto la storia della Lega Calcio Simulato
          </p>
        </div>

        {/* Hall of Fame Grid */}
        <Card className="shadow-lg">
          <CardHeader className="border-b border-border">
            <CardTitle className="flex items-center justify-center gap-2 text-xl">
              <Star className="h-5 w-5 text-yellow-500" />
              Membri della Hall of Fame
              <Star className="h-5 w-5 text-yellow-500" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
              {hallOfFamePlayers.map((player) => (
                <PlayerCard key={player.id} player={player} />
              ))}
              {Array.from({ length: emptySlots }).map((_, idx) => (
                <EmptySlot key={`empty-${idx}`} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Legend */}
        <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="font-medium">Attivo:</span>
            <span>Stagioni in cui il giocatore è stato attivo</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Classe:</span>
            <span>Stagione di ingresso nella Hall of Fame</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HallOfFame;

import Navbar from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { useMemo, useState } from "react";
import { getPlayers } from "@/hooks/use-players";
import { Player } from "@/types/player";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Swords, Shield, Target, Zap, Award } from "lucide-react";

const statCategories = {
  generale: {
    label: "Generale",
    icon: Award,
    color: "from-amber-500 to-orange-500",
    stats: [
      { key: "OVR", label: "Overall" },
      { key: "POR", label: "Porta" },
      { key: "DIF", label: "Difesa" },
      { key: "CEN", label: "Centrocampo" },
      { key: "ATT", label: "Attacco" },
      { key: "FIS", label: "Fisico" },
      { key: "MEN", label: "Mentale" },
      { key: "CPZ", label: "Calci Piazzati" },
    ],
  },
  portiere: {
    label: "Portiere",
    icon: Shield,
    color: "from-yellow-500 to-amber-500",
    stats: [
      { key: "RIFP", label: "Riflessi" },
      { key: "PREP", label: "Presa" },
      { key: "TUFP", label: "Tuffo" },
      { key: "POSP", label: "Posizionamento" },
      { key: "RINP", label: "Rinvio" },
    ],
  },
  difesa: {
    label: "Difesa",
    icon: Shield,
    color: "from-blue-500 to-cyan-500",
    stats: [
      { key: "MARC", label: "Marcatura" },
      { key: "CONT", label: "Contrasto" },
      { key: "AGGR", label: "Aggressività" },
      { key: "SCIV", label: "Scivolata" },
      { key: "INTR", label: "Intercettazioni" },
    ],
  },
  centrocampo: {
    label: "Centrocampo",
    icon: Users,
    color: "from-green-500 to-emerald-500",
    stats: [
      { key: "PASC", label: "Passaggi Corti" },
      { key: "PASL", label: "Passaggi Lunghi" },
      { key: "CRSS", label: "Cross" },
      { key: "CTRP", label: "Controllo Palla" },
      { key: "VISI", label: "Visione" },
      { key: "EFFT", label: "Effetto" },
    ],
  },
  attacco: {
    label: "Attacco",
    icon: Target,
    color: "from-red-500 to-pink-500",
    stats: [
      { key: "PIAZ", label: "Piazzamento" },
      { key: "PTIR", label: "Potenza Tiro" },
      { key: "TIRD", label: "Tiro dalla Distanza" },
      { key: "DRBL", label: "Dribbling" },
      { key: "TIRV", label: "Tiri al Volo" },
      { key: "TSTA", label: "Colpi di Testa" },
      { key: "FINA", label: "Finalizzazione" },
    ],
  },
  fisico: {
    label: "Fisico",
    icon: Zap,
    color: "from-purple-500 to-violet-500",
    stats: [
      { key: "ACCL", label: "Accelerazione" },
      { key: "VELO", label: "Velocità" },
      { key: "RESI", label: "Resistenza" },
      { key: "FRZA", label: "Forza" },
      { key: "AGIL", label: "Agilità" },
      { key: "ELEV", label: "Elevazione" },
      { key: "RIFL", label: "Riflessi" },
      { key: "EQLB", label: "Equilibrio" },
    ],
  },
  calciPiazzati: {
    label: "Calci Piazzati",
    icon: Swords,
    color: "from-indigo-500 to-blue-500",
    stats: [
      { key: "PNIZ", label: "Punizioni" },
      { key: "CRIG", label: "Rigori" },
      { key: "MABI", label: "Mosse Abilità" },
    ],
  },
};

const getPlayerImage = (player: Player | null) => {
  if (!player) return "/placeholder.svg";
  return `/images/players/p${player.ID}.png`;
};

const getPositionColor = (position: string | undefined) => {
  if (!position) return "bg-muted text-muted-foreground";
  if (position === "POR") return "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400";
  if (["DC", "TD", "TS"].includes(position)) return "bg-blue-500/20 text-blue-600 dark:text-blue-400";
  if (["CDC", "CC", "AD", "AS", "COC"].includes(position)) return "bg-green-500/20 text-green-600 dark:text-green-400";
  return "bg-red-500/20 text-red-600 dark:text-red-400";
};

interface PlayerCardProps {
  player: Player | null;
  playerId: number;
  onPlayerChange: (id: number) => void;
  players: Player[];
  side: "left" | "right";
}

const PlayerCard = ({ player, playerId, onPlayerChange, players, side }: PlayerCardProps) => {
  const gradientClass = side === "left" 
    ? "from-blue-500/10 to-transparent" 
    : "from-emerald-500/10 to-transparent";
  const accentColor = side === "left" ? "border-blue-500/30" : "border-emerald-500/30";
  
  return (
    <div className={`relative rounded-2xl border ${accentColor} bg-gradient-to-br ${gradientClass} backdrop-blur-sm overflow-hidden`}>
      <div className="p-6">
        <Select value={String(playerId)} onValueChange={(v) => onPlayerChange(Number(v))}>
          <SelectTrigger className="w-full mb-6 bg-background/50 border-border/50">
            <SelectValue placeholder="Seleziona giocatore" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {players.map((p) => (
              <SelectItem key={p.ID} value={String(p.ID)}>
                <span className="flex items-center gap-2">
                  <span className="font-medium">{p.Cognome}</span>
                  <span className="text-muted-foreground">{p.Nome}</span>
                  <span className="text-xs text-muted-foreground">— {p.Squadra}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {player ? (
          <div className="flex flex-col items-center animate-fade-in">
            <div className="relative mb-4">
              <div className={`w-32 h-32 rounded-full overflow-hidden border-4 ${accentColor} bg-muted/30`}>
                <img
                  src={getPlayerImage(player)}
                  alt={`${player.Nome} ${player.Cognome}`}
                  className="w-full h-full object-cover object-top"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/placeholder.svg";
                  }}
                />
              </div>
              <div className={`absolute -bottom-2 -right-2 w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
                side === "left" ? "bg-blue-500" : "bg-emerald-500"
              } text-white shadow-lg`}>
                {player.OVR}
              </div>
            </div>

            <h3 className="text-xl font-bold text-foreground mb-1">
              {player.Nome} {player.Cognome}
            </h3>
            <p className="text-sm text-muted-foreground mb-3">{player.Squadra}</p>
            
            <Badge className={`${getPositionColor(player.Posiz)} border-0 px-4 py-1 text-sm font-medium`}>
              {player.Posiz || "—"}
            </Badge>

            <div className="grid grid-cols-4 gap-3 mt-6 w-full">
              {[
                { key: "DIF", label: "DIF", color: "text-blue-500" },
                { key: "CEN", label: "CEN", color: "text-green-500" },
                { key: "ATT", label: "ATT", color: "text-red-500" },
                { key: "FIS", label: "FIS", color: "text-purple-500" },
              ].map((stat) => (
                <div key={stat.key} className="text-center p-2 rounded-lg bg-background/50">
                  <div className={`text-lg font-bold ${stat.color}`}>
                    {String(player[stat.key as keyof Player] ?? "—")}
                  </div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Users className="w-16 h-16 mb-4 opacity-30" />
            <p>Seleziona un giocatore</p>
          </div>
        )}
      </div>
    </div>
  );
};

interface ComparisonBarProps {
  label: string;
  valueA: number;
  valueB: number;
  delay?: number;
}

const ComparisonBar = ({ label, valueA, valueB, delay = 0 }: ComparisonBarProps) => {
  const isANaN = isNaN(valueA);
  const isBNaN = isNaN(valueB);
  const total = valueA + valueB || 1;
  const percentA = isANaN || isBNaN ? 50 : Math.round((valueA / total) * 100);
  const percentB = 100 - percentA;
  
  const aWins = !isANaN && !isBNaN && valueA > valueB;
  const bWins = !isANaN && !isBNaN && valueB > valueA;
  const tie = !isANaN && !isBNaN && valueA === valueB;

  return (
    <div 
      className="animate-fade-in" 
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className={`text-sm font-semibold tabular-nums ${aWins ? "text-blue-500" : tie ? "text-foreground" : "text-muted-foreground"}`}>
          {isANaN ? "—" : valueA}
        </span>
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
        <span className={`text-sm font-semibold tabular-nums ${bWins ? "text-emerald-500" : tie ? "text-foreground" : "text-muted-foreground"}`}>
          {isBNaN ? "—" : valueB}
        </span>
      </div>
      <div className="h-2 w-full bg-muted/30 rounded-full overflow-hidden flex">
        <div
          className={`h-full transition-all duration-500 ease-out ${aWins ? "bg-blue-500" : "bg-blue-500/40"}`}
          style={{ width: `${percentA}%` }}
        />
        <div
          className={`h-full transition-all duration-500 ease-out ${bWins ? "bg-emerald-500" : "bg-emerald-500/40"}`}
          style={{ width: `${percentB}%` }}
        />
      </div>
    </div>
  );
};

const ConfrontoGiocatori = () => {
  const { players } = getPlayers();
  const [leftId, setLeftId] = useState<number>(players[0]?.ID || 0);
  const [rightId, setRightId] = useState<number>(players[1]?.ID || 0);

  const left = useMemo(() => players.find((p) => p.ID === leftId) || null, [leftId, players]);
  const right = useMemo(() => players.find((p) => p.ID === rightId) || null, [rightId, players]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center justify-center gap-3">
            <Swords className="w-8 h-8 text-primary" />
            Confronto Giocatori
          </h1>
          <p className="text-muted-foreground">Confronta le statistiche dei giocatori fianco a fianco</p>
        </div>

        {/* Player Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <PlayerCard
            player={left}
            playerId={leftId}
            onPlayerChange={setLeftId}
            players={players}
            side="left"
          />
          <PlayerCard
            player={right}
            playerId={rightId}
            onPlayerChange={setRightId}
            players={players}
            side="right"
          />
        </div>

        {/* Stats Comparison */}
        {left && right && (
          <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden animate-fade-in">
            <div className="p-4 border-b border-border/50 bg-muted/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="font-medium">{left.Cognome}</span>
                </div>
                <span className="text-sm text-muted-foreground font-medium">VS</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{right.Cognome}</span>
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                </div>
              </div>
            </div>

            <Tabs defaultValue="generale" className="w-full">
              <div className="border-b border-border/50 overflow-x-auto">
                <TabsList className="w-full justify-start bg-transparent h-auto p-0 rounded-none">
                  {Object.entries(statCategories).map(([key, category]) => {
                    const Icon = category.icon;
                    return (
                      <TabsTrigger
                        key={key}
                        value={key}
                        className="data-[state=active]:bg-muted/50 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-3 text-sm font-medium transition-all"
                      >
                        <Icon className="w-4 h-4 mr-2" />
                        <span className="hidden sm:inline">{category.label}</span>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </div>

              {Object.entries(statCategories).map(([key, category]) => (
                <TabsContent 
                  key={key} 
                  value={key}
                  className="p-6 animate-fade-in data-[state=inactive]:animate-fade-out"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                    {category.stats.map((stat, index) => {
                      const a = left ? Number(left[stat.key as keyof Player] ?? NaN) : NaN;
                      const b = right ? Number(right[stat.key as keyof Player] ?? NaN) : NaN;
                      return (
                        <ComparisonBar
                          key={stat.key}
                          label={stat.label}
                          valueA={a}
                          valueB={b}
                          delay={index * 50}
                        />
                      );
                    })}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        )}
      </main>
    </div>
  );
};

export default ConfrontoGiocatori;

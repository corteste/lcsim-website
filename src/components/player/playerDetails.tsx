import { Card, CardContent } from "@/components/ui/card";
import { getPlayerImage, getRoleColor, getTeamBackground, getValueColor } from "@/utils/functions";
import { Badge } from "@/components/ui/badge";
import { Player } from "@/types/player";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { User, Ruler, Weight, Footprints, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PlayerDetailsProps {
  currentPlayer: Player;
  onClose?: () => void;
}

const StatBar = ({ label, value, delay = 0 }: { label: string; value: number | null; delay?: number }) => {
  const numValue = value ?? 0;
  const percentage = Math.min(numValue, 99);
  
  return (
    <div className="space-y-1 animate-fade-in" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex justify-between items-center">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className={`text-sm font-bold ${getValueColor(value)}`}>{value ?? "-"}</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-500 ${
            numValue >= 90 ? "bg-purple-500/80" : 
            numValue >= 85 ? "bg-blue-500/80" : 
            numValue >= 80 ? "bg-green-500/80" : 
            numValue >= 75 ? "bg-yellow-500/80" : 
            numValue >= 40 ? "bg-orange-500/80" : "bg-red-500/80"
          }`}
          style={{ width: `${percentage}%`, transitionDelay: `${delay + 100}ms` }}
        />
      </div>
    </div>
  );
};

const StatSection = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`grid grid-cols-3 gap-x-8 gap-y-4 ${className}`}>
    {children}
  </div>
);

const PlayerDetails = ({ currentPlayer, onClose }: PlayerDetailsProps) => {
  return (
    <div className="w-full max-w-7xl p-6 animate-scale-in" onClick={(e) => e.stopPropagation()}>
      <Card className="shadow-2xl border-0 bg-gradient-to-br from-card to-card/95 overflow-hidden">
        {/* Header */}
        <div className={getTeamBackground(currentPlayer.Squadra)}>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3 h-10 w-10"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          )}
          
          <div className="flex items-center gap-8">
            {/* Player Image & OVR */}
            <div className="relative">
              <div className="h-36 w-36 rounded-xl overflow-hidden border-2 border-primary/20 shadow-lg">
                <img 
                  src={getPlayerImage(currentPlayer.ID)} 
                  onError={(e) => e.currentTarget.src = "/images/players/MConti.png"} 
                  alt="Player" 
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="absolute -bottom-3 -right-3 h-14 w-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl shadow-lg">
                {currentPlayer.OVR}
              </div>
            </div>
            
            {/* Player Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <h2 className="text-2xl font-bold text-foreground truncate">
                  {currentPlayer.Nome} {currentPlayer.Cognome}
                </h2>
                <Badge variant="outline" className={`${getRoleColor(currentPlayer.Posiz)} shrink-0 text-sm px-3 py-1`}>
                  {currentPlayer.Posiz}
                </Badge>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 text-base text-muted-foreground mt-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>{currentPlayer.Età} anni</span>
                </div>
                {currentPlayer.Altezza && (
                  <div className="flex items-center gap-2">
                    <Ruler className="h-4 w-4" />
                    <span>{currentPlayer.Altezza} cm</span>
                  </div>
                )}
                {currentPlayer.Peso && (
                  <div className="flex items-center gap-2">
                    <Weight className="h-4 w-4" />
                    <span>{currentPlayer.Peso} kg</span>
                  </div>
                )}
                {currentPlayer.Piede && (
                  <div className="flex items-center gap-2">
                    <Footprints className="h-4 w-4" />
                    <span>{currentPlayer.Piede}</span>
                  </div>
                )}
              </div>
              
              {/* Main Stats */}
              <div className="flex gap-3 mt-4 flex-wrap">
                {[
                  { label: "POR", value: currentPlayer.POR, color: "bg-orange-500/20 text-orange-600 dark:text-orange-400" },
                  { label: "DIF", value: currentPlayer.DIF, color: "bg-blue-500/20 text-blue-600 dark:text-blue-400" },
                  { label: "CEN", value: currentPlayer.CEN, color: "bg-green-500/20 text-green-600 dark:text-green-400" },
                  { label: "ATT", value: currentPlayer.ATT, color: "bg-red-500/20 text-red-600 dark:text-red-400" },
                  { label: "FIS", value: currentPlayer.FIS, color: "bg-purple-500/20 text-purple-600 dark:text-purple-400" },
                ].map(stat => (
                  <div key={stat.label} className={`px-3 py-1.5 rounded-md text-sm font-medium ${stat.color}`}>
                    {stat.label}: {stat.value ?? "-"}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Stats Tabs */}
        <CardContent className="p-0">
          <Tabs defaultValue="portiere" className="w-full">
            <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-auto p-0 overflow-x-auto">
              <TabsTrigger 
                value="portiere" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:bg-transparent px-4 py-3 text-xs"
              >
                Portiere
              </TabsTrigger>
              <TabsTrigger 
                value="difesa" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent px-4 py-3 text-xs"
              >
                Difesa
              </TabsTrigger>
              <TabsTrigger 
                value="centrocampo" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-green-500 data-[state=active]:bg-transparent px-4 py-3 text-xs"
              >
                Centrocampo
              </TabsTrigger>
              <TabsTrigger 
                value="attacco" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-red-500 data-[state=active]:bg-transparent px-4 py-3 text-xs"
              >
                Attacco
              </TabsTrigger>
              <TabsTrigger 
                value="fisico" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-purple-500 data-[state=active]:bg-transparent px-4 py-3 text-xs"
              >
                Fisico
              </TabsTrigger>
            </TabsList>

            <div className="p-8 max-h-[600px] overflow-y-auto">
              <TabsContent value="portiere" className="mt-0 space-y-4 animate-fade-in data-[state=inactive]:animate-fade-out">
                <div>
                  <h4 className="text-xs font-semibold text-orange-500 uppercase tracking-wider mb-3">Tecnico</h4>
                  <StatSection>
                    <StatBar label="Presa" value={currentPlayer.PREP} delay={0} />
                    <StatBar label="Posizionamento" value={currentPlayer.POSP} delay={50} />
                    <StatBar label="Rinvio" value={currentPlayer.RINP} delay={100} />
                  </StatSection>
                </div>
                <Separator className="my-4" />
                <div>
                  <h4 className="text-xs font-semibold text-orange-500 uppercase tracking-wider mb-3">Fisico</h4>
                  <StatSection>
                    <StatBar label="Riflessi" value={currentPlayer.RIFP} delay={150} />
                    <StatBar label="Tuffo" value={currentPlayer.TUFP} delay={200} />
                  </StatSection>
                </div>
              </TabsContent>

              <TabsContent value="difesa" className="mt-0 space-y-4 animate-fade-in data-[state=inactive]:animate-fade-out">
                <div>
                  <h4 className="text-xs font-semibold text-blue-500 uppercase tracking-wider mb-3">Fisico</h4>
                  <StatSection>
                    <StatBar label="Contrasto" value={currentPlayer.CONT} delay={0} />
                    <StatBar label="Scivolata" value={currentPlayer.SCIV} delay={50} />
                  </StatSection>
                </div>
                <Separator className="my-4" />
                <div>
                  <h4 className="text-xs font-semibold text-blue-500 uppercase tracking-wider mb-3">Mentale</h4>
                  <StatSection>
                    <StatBar label="Marcatura" value={currentPlayer.MARC} delay={100} />
                    <StatBar label="Aggressività" value={currentPlayer.AGGR} delay={150} />
                    <StatBar label="Intercettazioni" value={currentPlayer.INTR} delay={200} />
                  </StatSection>
                </div>
              </TabsContent>

              <TabsContent value="centrocampo" className="mt-0 space-y-4 animate-fade-in data-[state=inactive]:animate-fade-out">
                <div>
                  <h4 className="text-xs font-semibold text-green-500 uppercase tracking-wider mb-3">Passaggi</h4>
                  <StatSection>
                    <StatBar label="Passaggi Corti" value={currentPlayer.PASC} delay={0} />
                    <StatBar label="Passaggi Lunghi" value={currentPlayer.PASL} delay={50} />
                    <StatBar label="Cross" value={currentPlayer.CRSS} delay={100} />
                  </StatSection>
                </div>
                <Separator className="my-4" />
                <div>
                  <h4 className="text-xs font-semibold text-green-500 uppercase tracking-wider mb-3">Gestione</h4>
                  <StatSection>
                    <StatBar label="Controllo Palla" value={currentPlayer.CTRP} delay={150} />
                    <StatBar label="Visione" value={currentPlayer.VISI} delay={200} />
                    <StatBar label="Effetto" value={currentPlayer.EFFT} delay={250} />
                  </StatSection>
                </div>
              </TabsContent>

              <TabsContent value="attacco" className="mt-0 space-y-4 animate-fade-in data-[state=inactive]:animate-fade-out">
                <div>
                  <h4 className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-3">Tiri</h4>
                  <StatSection>
                    <StatBar label="Potenza Tiro" value={currentPlayer.PTIR} delay={0} />
                    <StatBar label="Tiri Distanza" value={currentPlayer.TIRD} delay={50} />
                    <StatBar label="Tiri al Volo" value={currentPlayer.TIRV} delay={100} />
                  </StatSection>
                </div>
                <Separator className="my-4" />
                <div>
                  <h4 className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-3">Controllo</h4>
                  <StatSection>
                    <StatBar label="Dribbling" value={currentPlayer.DRBL} delay={150} />
                    <StatBar label="Piazzamento" value={currentPlayer.PIAZ} delay={200} />
                    <StatBar label="Finalizzazione" value={currentPlayer.FINA} delay={250} />
                    <StatBar label="Colpo di Testa" value={currentPlayer.TSTA} delay={300} />
                  </StatSection>
                </div>
              </TabsContent>

              <TabsContent value="fisico" className="mt-0 space-y-4 animate-fade-in data-[state=inactive]:animate-fade-out">
                <div>
                  <h4 className="text-xs font-semibold text-purple-500 uppercase tracking-wider mb-3">Velocità</h4>
                  <StatSection>
                    <StatBar label="Accelerazione" value={currentPlayer.ACCL} delay={0} />
                    <StatBar label="Velocità" value={currentPlayer.VELO} delay={50} />
                    <StatBar label="Agilità" value={currentPlayer.AGIL} delay={100} />
                  </StatSection>
                </div>
                <Separator className="my-4" />
                <div>
                  <h4 className="text-xs font-semibold text-purple-500 uppercase tracking-wider mb-3">Potenza</h4>
                  <StatSection>
                    <StatBar label="Forza" value={currentPlayer.FRZA} delay={150} />
                    <StatBar label="Resistenza" value={currentPlayer.RESI} delay={200} />
                    <StatBar label="Elevazione" value={currentPlayer.ELEV} delay={250} />
                  </StatSection>
                </div>
                <Separator className="my-4" />
                <div>
                  <h4 className="text-xs font-semibold text-purple-500 uppercase tracking-wider mb-3">Prontezza</h4>
                  <StatSection>
                    <StatBar label="Riflessi" value={currentPlayer.RIFL} delay={300} />
                    <StatBar label="Equilibrio" value={currentPlayer.EQLB} delay={350} />
                  </StatSection>
                </div>
                <Separator className="my-4" />
                <div>
                  <h4 className="text-xs font-semibold text-amber-500 uppercase tracking-wider mb-3">Calci Piazzati</h4>
                  <StatSection>
                    <StatBar label="Punizioni" value={currentPlayer.PNIZ} delay={400} />
                    <StatBar label="Rigori" value={currentPlayer.CRIG} delay={450} />
                  </StatSection>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlayerDetails;

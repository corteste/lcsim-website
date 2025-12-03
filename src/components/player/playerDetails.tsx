import { Card, CardContent } from "@/components/ui/card";
import { getPlayerImage, getRoleColor, getValueColor } from "@/utils/functions";
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

const StatBar = ({ label, value }: { label: string; value: number | null }) => {
  const numValue = value ?? 0;
  const percentage = Math.min(numValue, 99);
  
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className={`text-sm font-bold ${getValueColor(value)}`}>{value ?? "-"}</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all ${
            numValue >= 80 ? "bg-green-500" : 
            numValue >= 60 ? "bg-yellow-500" : 
            numValue >= 40 ? "bg-orange-500" : "bg-red-500"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

const StatSection = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`grid grid-cols-2 gap-x-6 gap-y-3 ${className}`}>
    {children}
  </div>
);

const PlayerDetails = ({ currentPlayer, onClose }: PlayerDetailsProps) => {
  return (
    <div className="w-full max-w-2xl p-4" onClick={(e) => e.stopPropagation()}>
      <Card className="shadow-2xl border-0 bg-gradient-to-br from-card to-card/95 overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6">
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          
          <div className="flex items-center gap-5">
            {/* Player Image & OVR */}
            <div className="relative">
              <div className="h-24 w-24 rounded-xl overflow-hidden border-2 border-primary/20 shadow-lg">
                <img 
                  src={getPlayerImage(currentPlayer.ID)} 
                  onError={(e) => e.currentTarget.src = "/images/players/MConti.png"} 
                  alt="Player" 
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="absolute -bottom-2 -right-2 h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg shadow-lg">
                {currentPlayer.OVR}
              </div>
            </div>
            
            {/* Player Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h2 className="text-xl font-bold text-foreground truncate">
                  {currentPlayer.Nome} {currentPlayer.Cognome}
                </h2>
                <Badge variant="outline" className={`${getRoleColor(currentPlayer.Posiz)} shrink-0`}>
                  {currentPlayer.Posiz}
                </Badge>
              </div>
              
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-2">
                <div className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5" />
                  <span>{currentPlayer.Età} anni</span>
                </div>
                {currentPlayer.Altezza && (
                  <div className="flex items-center gap-1">
                    <Ruler className="h-3.5 w-3.5" />
                    <span>{currentPlayer.Altezza} cm</span>
                  </div>
                )}
                {currentPlayer.Peso && (
                  <div className="flex items-center gap-1">
                    <Weight className="h-3.5 w-3.5" />
                    <span>{currentPlayer.Peso} kg</span>
                  </div>
                )}
                {currentPlayer.Piede && (
                  <div className="flex items-center gap-1">
                    <Footprints className="h-3.5 w-3.5" />
                    <span>{currentPlayer.Piede}</span>
                  </div>
                )}
              </div>
              
              {/* Main Stats */}
              <div className="flex gap-2 mt-3 flex-wrap">
                {[
                  { label: "POR", value: currentPlayer.POR, color: "bg-orange-500/20 text-orange-600 dark:text-orange-400" },
                  { label: "DIF", value: currentPlayer.DIF, color: "bg-blue-500/20 text-blue-600 dark:text-blue-400" },
                  { label: "CEN", value: currentPlayer.CEN, color: "bg-green-500/20 text-green-600 dark:text-green-400" },
                  { label: "ATT", value: currentPlayer.ATT, color: "bg-red-500/20 text-red-600 dark:text-red-400" },
                  { label: "FIS", value: currentPlayer.FIS, color: "bg-purple-500/20 text-purple-600 dark:text-purple-400" },
                ].map(stat => (
                  <div key={stat.label} className={`px-2 py-1 rounded-md text-xs font-medium ${stat.color}`}>
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

            <div className="p-5 max-h-[300px] overflow-y-auto">
              <TabsContent value="portiere" className="mt-0 space-y-4">
                <div>
                  <h4 className="text-xs font-semibold text-orange-500 uppercase tracking-wider mb-3">Tecnico</h4>
                  <StatSection>
                    <StatBar label="Presa" value={currentPlayer.PREP} />
                    <StatBar label="Posizionamento" value={currentPlayer.POSP} />
                    <StatBar label="Rinvio" value={currentPlayer.RINP} />
                  </StatSection>
                </div>
                <Separator className="my-4" />
                <div>
                  <h4 className="text-xs font-semibold text-orange-500 uppercase tracking-wider mb-3">Fisico</h4>
                  <StatSection>
                    <StatBar label="Riflessi" value={currentPlayer.RIFP} />
                    <StatBar label="Tuffo" value={currentPlayer.TUFP} />
                  </StatSection>
                </div>
              </TabsContent>

              <TabsContent value="difesa" className="mt-0 space-y-4">
                <div>
                  <h4 className="text-xs font-semibold text-blue-500 uppercase tracking-wider mb-3">Fisico</h4>
                  <StatSection>
                    <StatBar label="Contrasto" value={currentPlayer.CONT} />
                    <StatBar label="Scivolata" value={currentPlayer.SCIV} />
                  </StatSection>
                </div>
                <Separator className="my-4" />
                <div>
                  <h4 className="text-xs font-semibold text-blue-500 uppercase tracking-wider mb-3">Mentale</h4>
                  <StatSection>
                    <StatBar label="Marcatura" value={currentPlayer.MARC} />
                    <StatBar label="Aggressività" value={currentPlayer.AGGR} />
                    <StatBar label="Intercettazioni" value={currentPlayer.INTR} />
                  </StatSection>
                </div>
              </TabsContent>

              <TabsContent value="centrocampo" className="mt-0 space-y-4">
                <div>
                  <h4 className="text-xs font-semibold text-green-500 uppercase tracking-wider mb-3">Passaggi</h4>
                  <StatSection>
                    <StatBar label="Passaggi Corti" value={currentPlayer.PASC} />
                    <StatBar label="Passaggi Lunghi" value={currentPlayer.PASL} />
                    <StatBar label="Cross" value={currentPlayer.CRSS} />
                  </StatSection>
                </div>
                <Separator className="my-4" />
                <div>
                  <h4 className="text-xs font-semibold text-green-500 uppercase tracking-wider mb-3">Gestione</h4>
                  <StatSection>
                    <StatBar label="Controllo Palla" value={currentPlayer.CTRP} />
                    <StatBar label="Visione" value={currentPlayer.VISI} />
                    <StatBar label="Effetto" value={currentPlayer.EFFT} />
                  </StatSection>
                </div>
              </TabsContent>

              <TabsContent value="attacco" className="mt-0 space-y-4">
                <div>
                  <h4 className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-3">Tiri</h4>
                  <StatSection>
                    <StatBar label="Potenza Tiro" value={currentPlayer.PTIR} />
                    <StatBar label="Tiri Distanza" value={currentPlayer.TIRD} />
                    <StatBar label="Tiri al Volo" value={currentPlayer.TIRV} />
                  </StatSection>
                </div>
                <Separator className="my-4" />
                <div>
                  <h4 className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-3">Controllo</h4>
                  <StatSection>
                    <StatBar label="Dribbling" value={currentPlayer.DRBL} />
                    <StatBar label="Piazzamento" value={currentPlayer.PIAZ} />
                    <StatBar label="Finalizzazione" value={currentPlayer.FINA} />
                    <StatBar label="Colpo di Testa" value={currentPlayer.TSTA} />
                  </StatSection>
                </div>
              </TabsContent>

              <TabsContent value="fisico" className="mt-0 space-y-4">
                <div>
                  <h4 className="text-xs font-semibold text-purple-500 uppercase tracking-wider mb-3">Velocità</h4>
                  <StatSection>
                    <StatBar label="Accelerazione" value={currentPlayer.ACCL} />
                    <StatBar label="Velocità" value={currentPlayer.VELO} />
                    <StatBar label="Agilità" value={currentPlayer.AGIL} />
                  </StatSection>
                </div>
                <Separator className="my-4" />
                <div>
                  <h4 className="text-xs font-semibold text-purple-500 uppercase tracking-wider mb-3">Potenza</h4>
                  <StatSection>
                    <StatBar label="Forza" value={currentPlayer.FRZA} />
                    <StatBar label="Resistenza" value={currentPlayer.RESI} />
                    <StatBar label="Elevazione" value={currentPlayer.ELEV} />
                  </StatSection>
                </div>
                <Separator className="my-4" />
                <div>
                  <h4 className="text-xs font-semibold text-purple-500 uppercase tracking-wider mb-3">Prontezza</h4>
                  <StatSection>
                    <StatBar label="Riflessi" value={currentPlayer.RIFL} />
                    <StatBar label="Equilibrio" value={currentPlayer.EQLB} />
                  </StatSection>
                </div>
                <Separator className="my-4" />
                <div>
                  <h4 className="text-xs font-semibold text-amber-500 uppercase tracking-wider mb-3">Calci Piazzati</h4>
                  <StatSection>
                    <StatBar label="Punizioni" value={currentPlayer.PNIZ} />
                    <StatBar label="Rigori" value={currentPlayer.CRIG} />
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

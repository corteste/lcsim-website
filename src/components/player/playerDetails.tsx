import { Card, CardContent } from "@/components/ui/card";
import { getPlayerImage, getRoleColor, getTeamBackground, getValueColor, getNationalityFlag } from "@/utils/functions";
import { Badge } from "@/components/ui/badge";
import { Player } from "@/types/player";
import { MarketStatus } from "@/types/marketStatus";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, Ruler, Weight, Footprints, X, Shield, Zap, Target, Activity, 
  Sparkles, Star, Award, Compass, Swords, Flame
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface PlayerDetailsProps {
  currentPlayer: Player;
  onClose?: () => void;
}

const getMarketStatus = (market?: MarketStatus | null) => {
  if (!market?.Status) return "bg-muted text-muted-foreground border-border";
  switch (market.Status) {
    case "int": return "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30";
    case "ced": return "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30";
    case "tra": return "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30";
    case "fis": return "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30";
    default: return "bg-muted text-muted-foreground border-border";
  }
};

const getMarketStatusDisplay = (market?: MarketStatus | null) => {
  if (!market?.Status) return "N/A";
  switch (market.Status) {
    case "int": return "Intoccabile";
    case "ced": return "Cedibile";
    case "tra": return "In Trattativa";
    case "fis": return "Elemento Fisso";
    default: return "N/A";
  }
};

const StatBar = ({ label, value, code }: { label: string; value: number | null | undefined; code?: string }) => {
  const numValue = value ?? 0;
  const percentage = Math.min(Math.max(numValue, 0), 99);
  
  return (
    <div className="group p-2 rounded-lg bg-card/70 hover:bg-muted/50 border border-border/50 hover:border-primary/40 transition-all duration-200 shadow-xs">
      <div className="flex justify-between items-center mb-1 gap-1.5">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {code && (
            <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-muted text-muted-foreground font-bold shrink-0 border border-border/40">
              {code}
            </span>
          )}
          <span className="text-xs font-semibold text-foreground truncate" title={label}>
            {label}
          </span>
        </div>
        <span className={`text-sm font-bold font-mono ${getValueColor(value ?? null)} shrink-0 pl-1`}>
          {value ?? "-"}
        </span>
      </div>
      <div className="h-1.5 bg-muted/90 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-500 ${
            numValue >= 90 ? "bg-gradient-to-r from-purple-500 to-indigo-500" : 
            numValue >= 85 ? "bg-gradient-to-r from-blue-500 to-cyan-500" : 
            numValue >= 80 ? "bg-gradient-to-r from-emerald-500 to-green-500" : 
            numValue >= 75 ? "bg-gradient-to-r from-yellow-500 to-amber-500" : 
            numValue >= 50 ? "bg-gradient-to-r from-orange-500 to-amber-600" : "bg-gradient-to-r from-red-500 to-rose-600"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

const StatCardGroup = ({ 
  title, 
  icon: Icon, 
  colorClass, 
  children 
}: { 
  title: string; 
  icon: any; 
  colorClass: string; 
  children: React.ReactNode 
}) => (
  <Card className="border border-border/60 bg-card/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col">
    <div className={`px-3 py-2 border-b border-border/50 flex items-center justify-between ${colorClass}`}>
      <div className="flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5" />
        <h4 className="text-xs font-bold uppercase tracking-wider">{title}</h4>
      </div>
    </div>
    <CardContent className="p-2 flex flex-col gap-1.5 flex-1 justify-start">
      {children}
    </CardContent>
  </Card>
);

const PlayerDetails = ({ currentPlayer, onClose }: PlayerDetailsProps) => {
  const ovr = currentPlayer.OVR ?? 0;
  const isGoalkeeper = currentPlayer.Posiz === "POR";

  // Macro pillars with full non-truncated names
  const macroStats = isGoalkeeper ? [
    { label: "Tuffo", value: currentPlayer.TUFP, color: "from-amber-500/20 to-orange-500/10 text-orange-600 dark:text-orange-400" },
    { label: "Presa", value: currentPlayer.PREP, color: "from-blue-500/20 to-cyan-500/10 text-blue-600 dark:text-blue-400" },
    { label: "Rinvio", value: currentPlayer.RINP, color: "from-emerald-500/20 to-teal-500/10 text-emerald-600 dark:text-emerald-400" },
    { label: "Riflessi", value: currentPlayer.RIFP, color: "from-purple-500/20 to-indigo-500/10 text-purple-600 dark:text-purple-400" },
    { label: "Piazzamento", value: currentPlayer.POSP, color: "from-rose-500/20 to-pink-500/10 text-rose-600 dark:text-rose-400" },
    { label: "Fisico", value: currentPlayer.FIS, color: "from-purple-500/20 to-violet-500/10 text-purple-600 dark:text-purple-400" },
  ] : [
    { label: "Velocità", value: currentPlayer.VELO, color: "from-emerald-500/20 to-teal-500/10 text-emerald-600 dark:text-emerald-400" },
    { label: "Tiro", value: currentPlayer.ATT, color: "from-red-500/20 to-rose-500/10 text-red-600 dark:text-red-400" },
    { label: "Passaggio", value: currentPlayer.CEN, color: "from-blue-500/20 to-cyan-500/10 text-blue-600 dark:text-blue-400" },
    { label: "Dribbling", value: currentPlayer.DRBL, color: "from-amber-500/20 to-yellow-500/10 text-amber-600 dark:text-amber-400" },
    { label: "Difesa", value: currentPlayer.DIF, color: "from-indigo-500/20 to-blue-500/10 text-indigo-600 dark:text-indigo-400" },
    { label: "Fisico", value: currentPlayer.FIS, color: "from-purple-500/20 to-violet-500/10 text-purple-600 dark:text-purple-400" },
    { label: "Mentale", value: currentPlayer.MEN, color: "from-pink-500/20 to-rose-500/10 text-pink-600 dark:text-pink-400" },
  ];

  return (
    <div 
      className="w-[98vw] max-w-7xl 2xl:max-w-[1640px] h-[95vh] max-h-[960px] flex flex-col rounded-2xl overflow-hidden bg-card border border-border/80 shadow-2xl animate-scale-in"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Top Banner / Hero Card */}
      <div className={`${getTeamBackground(currentPlayer.Squadra || '')} border-b border-border/50 relative shrink-0`}>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 h-8 w-8 rounded-full bg-background/60 hover:bg-background/90 text-foreground border border-border/50 shadow-sm transition-transform hover:scale-105 z-20"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        )}

        <div className="flex flex-col md:flex-row md:items-center gap-4 sm:gap-6 p-4 sm:p-5">
          {/* Player Photo + OVR Badge */}
          <div className="relative shrink-0 flex items-center justify-center sm:justify-start">
            <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-2xl overflow-hidden border-2 border-border/80 shadow-xl bg-card/60 backdrop-blur-sm relative group">
              <img 
                src={getPlayerImage(currentPlayer.ID)} 
                onError={(e) => (e.currentTarget.src = "/images/players/MConti.png")} 
                alt={`${currentPlayer.Nome} ${currentPlayer.Cognome}`} 
                className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
              />
              {/* Flag pill overlay on avatar bottom-left */}
              {currentPlayer.Nazionalità && (
                <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-background/85 backdrop-blur-md border border-border/60 shadow">
                  <img 
                    src={getNationalityFlag(currentPlayer.Nazionalità)} 
                    alt={currentPlayer.Nazionalità} 
                    className="h-3.5 w-5 object-cover rounded-sm"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                  <span className="text-[10px] font-bold uppercase">{currentPlayer.Nazionalità}</span>
                </div>
              )}
            </div>

            {/* Glowing OVR badge */}
            <div className="absolute -bottom-2 -right-2 h-12 w-12 sm:h-13 sm:w-13 rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground flex flex-col items-center justify-center font-black shadow-xl border-2 border-background">
              <span className="text-[8px] uppercase tracking-widest leading-none opacity-80 font-bold">OVR</span>
              <span className="text-xl sm:text-2xl leading-tight font-black">{ovr}</span>
            </div>
          </div>

          {/* Main Info */}
          <div className="flex-1 min-w-0 space-y-2.5 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-foreground tracking-tight truncate">
                {currentPlayer.Nome} {currentPlayer.Cognome}
              </h2>
              <Badge variant="outline" className={`${getRoleColor(currentPlayer.Posiz)} text-sm font-bold px-3 py-0.5 border shadow-sm`}>
                {currentPlayer.Posiz}
              </Badge>
              {currentPlayer.Squadra && (
                <Badge variant="secondary" className="text-xs font-semibold px-2.5 py-0.5">
                  {currentPlayer.Squadra}
                </Badge>
              )}
              {currentPlayer.MarketStatus && (
                <Badge variant="outline" className={`text-xs font-semibold ${getMarketStatus(currentPlayer.MarketStatus)}`}>
                  {getMarketStatusDisplay(currentPlayer.MarketStatus)}
                </Badge>
              )}
              {currentPlayer.XP !== null && (
                <Badge variant="outline" className="text-xs font-mono font-bold bg-primary/10 text-primary border-primary/20">
                  XP: {currentPlayer.XP}
                </Badge>
              )}
            </div>

            {/* Quick Biometrics Strip */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs sm:text-sm text-muted-foreground pt-1">
              <div className="flex items-center gap-1.5">
                <User className="h-4 w-4 text-primary" />
                <span className="font-medium text-foreground">{currentPlayer.Età} anni</span>
              </div>
              {currentPlayer.Altezza && (
                <div className="flex items-center gap-1.5">
                  <Ruler className="h-4 w-4 text-primary" />
                  <span className="font-medium text-foreground">{currentPlayer.Altezza} cm</span>
                </div>
              )}
              {currentPlayer.Peso && (
                <div className="flex items-center gap-1.5">
                  <Weight className="h-4 w-4 text-primary" />
                  <span className="font-medium text-foreground">{currentPlayer.Peso} kg</span>
                </div>
              )}
              {currentPlayer.Piede && (
                <div className="flex items-center gap-1.5">
                  <Footprints className="h-4 w-4 text-primary" />
                  <span>Piede: <strong className="text-foreground">{currentPlayer.Piede}</strong></span>
                </div>
              )}
              {currentPlayer.PiedeDebole && (
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground">P. Debole:</span>
                  <span className="text-amber-500 font-bold">{currentPlayer.PiedeDebole}</span>
                </div>
              )}
              {currentPlayer.MABI && (
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground">Skill:</span>
                  <span className="text-amber-500 font-bold">{currentPlayer.MABI}</span>
                </div>
              )}
            </div>

            {/* Macro Stats Strip */}
            <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-7 gap-2 pt-2">
              {macroStats.map((st) => (
                <div 
                  key={st.label} 
                  className={`flex flex-col items-center justify-center p-2 rounded-xl bg-gradient-to-br ${st.color} border border-border/40 shadow-sm`}
                >
                  <span className="text-[11px] font-bold text-muted-foreground whitespace-nowrap">{st.label}</span>
                  <span className="text-lg font-black font-mono leading-tight mt-0.5">{st.value ?? "-"}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs and Detailed Content */}
      <Tabs defaultValue="tutti" className="flex-1 flex flex-col min-h-0">
        <div className="px-6 border-b border-border/60 bg-muted/20 shrink-0">
          <TabsList className="bg-transparent h-12 p-0 gap-6 justify-start">
            <TabsTrigger 
              value="tutti" 
              className="h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary font-bold text-sm px-2 transition-colors"
            >
              <Activity className="h-4 w-4 mr-2" />
              Tutti gli Attributi
            </TabsTrigger>
            <TabsTrigger 
              value="ruoli" 
              className="h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary font-bold text-sm px-2 transition-colors"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Ruoli & Tratti Speciali
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: Tutti gli Attributi (Dashboard Completa) */}
        <TabsContent value="tutti" className="flex-1 overflow-y-auto p-3.5 sm:p-5 m-0 focus-visible:outline-none">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            {/* Attacco */}
            <StatCardGroup title="Attacco & Tiro" icon={Target} colorClass="bg-red-500/10 text-red-600 dark:text-red-400">
              <StatBar label="Finalizzazione" code="FINA" value={currentPlayer.FINA} />
              <StatBar label="Piazzamento" code="PIAZ" value={currentPlayer.PIAZ} />
              <StatBar label="Potenza Tiro" code="PTIR" value={currentPlayer.PTIR} />
              <StatBar label="Tiri Distanza" code="TIRD" value={currentPlayer.TIRD} />
              <StatBar label="Tiri al Volo" code="TIRV" value={currentPlayer.TIRV} />
              <StatBar label="Dribbling" code="DRBL" value={currentPlayer.DRBL} />
              <StatBar label="Colpi di Testa" code="TSTA" value={currentPlayer.TSTA} />
            </StatCardGroup>

            {/* Passaggi */}
            <StatCardGroup title="Passaggi & Regia" icon={Compass} colorClass="bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <StatBar label="Passaggio Corto" code="PASC" value={currentPlayer.PASC} />
              <StatBar label="Passaggio Lungo" code="PASL" value={currentPlayer.PASL} />
              <StatBar label="Cross" code="CRSS" value={currentPlayer.CRSS} />
              <StatBar label="Controllo Palla" code="CTRP" value={currentPlayer.CTRP} />
              <StatBar label="Visione Gioco" code="VISI" value={currentPlayer.VISI} />
              <StatBar label="Effetto" code="EFFT" value={currentPlayer.EFFT} />
            </StatCardGroup>

            {/* Difesa */}
            <StatCardGroup title="Difesa & Marcatura" icon={Shield} colorClass="bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <StatBar label="Contrasto" code="CONT" value={currentPlayer.CONT} />
              <StatBar label="Scivolata" code="SCIV" value={currentPlayer.SCIV} />
              <StatBar label="Marcatura" code="MARC" value={currentPlayer.MARC} />
              <StatBar label="Aggressività" code="AGGR" value={currentPlayer.AGGR} />
              <StatBar label="Intercettazione" code="INTR" value={currentPlayer.INTR} />
            </StatCardGroup>

            {/* Fisico */}
            <StatCardGroup title="Fisico & Velocità" icon={Zap} colorClass="bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <StatBar label="Velocità Scatto" code="VELO" value={currentPlayer.VELO} />
              <StatBar label="Accelerazione" code="ACCL" value={currentPlayer.ACCL} />
              <StatBar label="Agilità" code="AGIL" value={currentPlayer.AGIL} />
              <StatBar label="Resistenza" code="RESI" value={currentPlayer.RESI} />
              <StatBar label="Forza Fisica" code="FRZA" value={currentPlayer.FRZA} />
              <StatBar label="Elevazione" code="ELEV" value={currentPlayer.ELEV} />
              <StatBar label="Equilibrio" code="EQLB" value={currentPlayer.EQLB} />
              <StatBar label="Riflessi" code="RIFL" value={currentPlayer.RIFL} />
            </StatCardGroup>

            {/* Calci Piazzati */}
            <StatCardGroup title="Calci Piazzati" icon={Flame} colorClass="bg-orange-500/10 text-orange-600 dark:text-orange-400">
              <StatBar label="Punizioni" code="PNIZ" value={currentPlayer.PNIZ} />
              <StatBar label="Rigori" code="CRIG" value={currentPlayer.CRIG} />
            </StatCardGroup>

            {/* Portiere */}
            <StatCardGroup title="Portiere" icon={Swords} colorClass="bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <StatBar label="Presa" code="PREP" value={currentPlayer.PREP} />
              <StatBar label="Posizionamento" code="POSP" value={currentPlayer.POSP} />
              <StatBar label="Rinvio" code="RINP" value={currentPlayer.RINP} />
              <StatBar label="Riflessi Portiere" code="RIFP" value={currentPlayer.RIFP} />
              <StatBar label="Tuffo" code="TUFP" value={currentPlayer.TUFP} />
            </StatCardGroup>
          </div>
        </TabsContent>

        {/* Tab 2: Ruoli & Tratti Speciali */}
        <TabsContent value="ruoli" className="flex-1 overflow-y-auto p-4 sm:p-6 m-0 focus-visible:outline-none">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {/* Ruoli in Campo */}
            <Card className="border border-border/60 bg-card/60 backdrop-blur-sm">
              <div className="px-5 py-3 border-b border-border/50 flex items-center gap-2 bg-primary/5">
                <Compass className="h-4 w-4 text-primary" />
                <h4 className="text-sm font-bold uppercase tracking-wider text-foreground">Ruoli e Specializzazioni</h4>
              </div>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-border/60 bg-muted/20">
                  <span className="text-sm font-medium text-muted-foreground">Ruolo Naturale</span>
                  <Badge variant="outline" className={`${getRoleColor(currentPlayer.Posiz)} text-sm font-bold px-3 py-1`}>
                    {currentPlayer.Posiz}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl border border-border/60 bg-muted/20">
                  <span className="text-sm font-medium text-muted-foreground">Specializzazione Primaria (Role 1)</span>
                  <span className="text-sm font-bold text-primary">
                    {currentPlayer.Role1 || "Standard"}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl border border-border/60 bg-muted/20">
                  <span className="text-sm font-medium text-muted-foreground">Specializzazione Secondaria (Role 2)</span>
                  <span className="text-sm font-bold text-foreground">
                    {currentPlayer.Role2 || "-"}
                  </span>
                </div>

                {currentPlayer.RuoloInCampo && (
                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-border/60 bg-muted/20">
                    <span className="text-sm font-medium text-muted-foreground">Ruolo Attivo in Tattica</span>
                    <span className="text-sm font-bold text-foreground">{currentPlayer.RuoloInCampo}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tratti & PlayStyles */}
            <Card className="border border-border/60 bg-card/60 backdrop-blur-sm">
              <div className="px-5 py-3 border-b border-border/50 flex items-center gap-2 bg-amber-500/5">
                <Star className="h-4 w-4 text-amber-500" />
                <h4 className="text-sm font-bold uppercase tracking-wider text-foreground">Tratti & Caratteristiche</h4>
              </div>
              <CardContent className="p-5 space-y-3">
                {[
                  { label: "Tratto Icona 1", val: currentPlayer.IconTrait1, isIcon: true },
                  { label: "Tratto Icona 2", val: currentPlayer.IconTrait2, isIcon: true },
                  { label: "Tratto 1", val: currentPlayer.Trait1, isIcon: false },
                  { label: "Tratto 2", val: currentPlayer.Trait2, isIcon: false },
                ].map((tr, idx) => (
                  <div 
                    key={idx} 
                    className={`flex items-center justify-between p-3 rounded-xl border ${
                      tr.val ? (tr.isIcon ? 'border-amber-500/30 bg-amber-500/5' : 'border-primary/20 bg-primary/5') : 'border-border/40 bg-muted/10 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {tr.isIcon ? (
                        <Award className="h-4 w-4 text-amber-500" />
                      ) : (
                        <Sparkles className="h-4 w-4 text-primary" />
                      )}
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{tr.label}</span>
                    </div>
                    <span className={`text-sm font-bold ${tr.val ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {tr.val || "Nessuno"}
                    </span>
                  </div>
                ))}

                {currentPlayer.Tratti && (
                  <div className="p-3 rounded-xl border border-border/60 bg-muted/20 mt-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Altri Tratti:</span>
                    <p className="text-xs text-foreground font-medium">{currentPlayer.Tratti}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PlayerDetails;

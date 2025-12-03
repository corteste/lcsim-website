import { Card, CardContent } from "@/components/ui/card";
import { PlayerStatsSum } from "@/types/playerStats";
import { Team } from "@/types/team";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { X, Target, Timer, Award, TrendingUp, Shield, Footprints } from "lucide-react";
import { getPlayerImage, getRoleColor } from "@/utils/functions";

interface PlayerStatsProps {
  currentPlayer: PlayerStatsSum;
  teams: Team[];
  onClose?: () => void;
}

const StatCard = ({ label, value, icon: Icon, delay = 0 }: { 
  label: string; 
  value: string | number; 
  icon?: React.ElementType;
  delay?: number;
}) => (
  <div 
    className="p-4 rounded-xl bg-muted/30 border border-border/50 animate-fade-in hover:bg-muted/50 transition-colors"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="flex items-center gap-2 mb-1">
      {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
    <p className="font-bold text-2xl text-primary">{value}</p>
  </div>
);

const StatRow = ({ label, success, total, percentage, delay = 0 }: {
  label: string;
  success: number;
  total: number;
  percentage: number;
  delay?: number;
}) => (
  <div className="animate-fade-in" style={{ animationDelay: `${delay}ms` }}>
    <div className="flex justify-between items-center mb-2">
      <span className="text-sm font-medium">{label}</span>
      <span className="text-sm text-muted-foreground">{success}/{total}</span>
    </div>
    <div className="h-2 bg-muted rounded-full overflow-hidden">
      <div 
        className={`h-full rounded-full transition-all duration-500 ${
          percentage >= 70 ? "bg-green-500" : 
          percentage >= 50 ? "bg-yellow-500" : 
          percentage >= 30 ? "bg-orange-500" : "bg-red-500"
        }`}
        style={{ width: `${percentage}%`, transitionDelay: `${delay + 100}ms` }}
      />
    </div>
    <p className="text-right text-xs text-muted-foreground mt-1">{percentage}%</p>
  </div>
);

const PlayerAdvancedStats = ({ currentPlayer, teams, onClose }: PlayerStatsProps) => {
  const teamName = teams.find(t => t.TEAM_ID === currentPlayer.Squadra)?.NAME ?? "-";
  const avgRating = currentPlayer.matches_played 
    ? Math.round((currentPlayer.sum_voto / currentPlayer.matches_played) * 100) / 100 
    : 0;
  const isGoalkeeper = currentPlayer.Posiz === "POR";

  return (
    <div className="w-full max-w-4xl p-4 animate-scale-in" onClick={(e) => e.stopPropagation()}>
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
              <p className="text-sm text-muted-foreground">{teamName}</p>
              
              {/* Quick Stats */}
              <div className="flex gap-3 mt-4 flex-wrap">
                <div className="px-3 py-2 rounded-lg bg-primary/10 text-center">
                  <p className="text-xs text-muted-foreground">Partite</p>
                  <p className="font-bold text-lg text-primary">{currentPlayer.matches_played ?? 0}</p>
                </div>
                <div className="px-3 py-2 rounded-lg bg-primary/10 text-center">
                  <p className="text-xs text-muted-foreground">Voto Medio</p>
                  <p className="font-bold text-lg text-primary">{isNaN(avgRating) ? "N/D" : avgRating}</p>
                </div>
                <div className="px-3 py-2 rounded-lg bg-primary/10 text-center">
                  <p className="text-xs text-muted-foreground">Minuti</p>
                  <p className="font-bold text-lg text-primary">{currentPlayer.sum_minuti ?? 0}</p>
                </div>
                {!isGoalkeeper && (
                  <>
                    <div className="px-3 py-2 rounded-lg bg-green-500/10 text-center">
                      <p className="text-xs text-muted-foreground">Gol</p>
                      <p className="font-bold text-lg text-green-600 dark:text-green-400">{currentPlayer.sum_gol ?? 0}</p>
                    </div>
                    <div className="px-3 py-2 rounded-lg bg-blue-500/10 text-center">
                      <p className="text-xs text-muted-foreground">Assist</p>
                      <p className="font-bold text-lg text-blue-600 dark:text-blue-400">{currentPlayer.sum_asst ?? 0}</p>
                    </div>
                  </>
                )}
                {isGoalkeeper && (
                  <>
                    <div className="px-3 py-2 rounded-lg bg-green-500/10 text-center">
                      <p className="text-xs text-muted-foreground">Parate</p>
                      <p className="font-bold text-lg text-green-600 dark:text-green-400">{currentPlayer.sum_para ?? 0}</p>
                    </div>
                    <div className="px-3 py-2 rounded-lg bg-red-500/10 text-center">
                      <p className="text-xs text-muted-foreground">Gol Subiti</p>
                      <p className="font-bold text-lg text-red-600 dark:text-red-400">{currentPlayer.sum_gsub ?? 0}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Stats Content */}
        <CardContent className="p-0">
          {isGoalkeeper ? (
            // Goalkeeper Stats
            <div className="p-6 space-y-4 animate-fade-in">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Parate" value={currentPlayer.sum_para ?? 0} icon={Shield} delay={0} />
                <StatCard label="Goal Subiti" value={currentPlayer.sum_gsub ?? 0} icon={Target} delay={50} />
                <StatCard label="Voto Medio" value={isNaN(avgRating) ? "N/D" : avgRating} icon={Award} delay={100} />
                <StatCard label="Minuti Giocati" value={currentPlayer.sum_minuti ?? 0} icon={Timer} delay={150} />
              </div>
              
              {/* Note */}
              <div className="p-4 rounded-lg bg-muted/30 border border-border mt-4">
                <p className="text-sm text-muted-foreground">
                  💡 Per visualizzare tutte le statistiche negli anni usare la pagina Storico.
                </p>
              </div>
            </div>
          ) : (
            // Outfield Player Stats with Tabs
            <Tabs defaultValue="generale" className="w-full">
              <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-auto p-0 overflow-x-auto">
                <TabsTrigger 
                  value="generale" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 text-xs"
                >
                  Generale
                </TabsTrigger>
                <TabsTrigger 
                  value="offensivo" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-red-500 data-[state=active]:bg-transparent px-4 py-3 text-xs"
                >
                  Offensivo
                </TabsTrigger>
                <TabsTrigger 
                  value="possesso" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-green-500 data-[state=active]:bg-transparent px-4 py-3 text-xs"
                >
                  Possesso
                </TabsTrigger>
                <TabsTrigger 
                  value="difensivo" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent px-4 py-3 text-xs"
                >
                  Difensivo
                </TabsTrigger>
              </TabsList>

              <div className="p-6 max-h-[800px] overflow-y-auto">
                <TabsContent value="generale" className="mt-0 space-y-6 animate-fade-in data-[state=inactive]:animate-fade-out">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard label="Gol" value={currentPlayer.sum_gol ?? 0} icon={Target} delay={0} />
                    <StatCard label="Assist" value={currentPlayer.sum_asst ?? 0} icon={TrendingUp} delay={50} />
                    <StatCard label="Voto Medio" value={isNaN(avgRating) ? "N/D" : avgRating} icon={Award} delay={100} />
                    <StatCard label="Minuti" value={currentPlayer.sum_minuti ?? 0} icon={Timer} delay={150} />
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard label="Fuorigioco" value={currentPlayer.sum_fgioco ?? 0} delay={200} />
                    <StatCard label="Falli" value={currentPlayer.sum_falli ?? 0} delay={250} />
                    <StatCard label="Gialli" value={currentPlayer.sum_gialli ?? 0} delay={300} />
                    <StatCard label="Rossi" value={currentPlayer.sum_rossi ?? 0} delay={350} />
                  </div>
                </TabsContent>

                <TabsContent value="offensivo" className="mt-0 space-y-6 animate-fade-in data-[state=inactive]:animate-fade-out">
                  <h4 className="text-xs font-semibold text-red-500 uppercase tracking-wider">Tiri</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <StatRow 
                      label="Precisione Tiri" 
                      success={currentPlayer.sum_tiri_in ?? 0} 
                      total={currentPlayer.sum_tiri_tot ?? 0}
                      percentage={currentPlayer.sum_tiri_tot ? Math.round((currentPlayer.sum_tiri_in / currentPlayer.sum_tiri_tot) * 100) : 0}
                      delay={0}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <StatCard label="Tiri a Segno" value={currentPlayer.sum_tiri_in ?? 0} delay={50} />
                      <StatCard label="Tiri Totali" value={currentPlayer.sum_tiri_tot ?? 0} delay={100} />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="possesso" className="mt-0 space-y-6 animate-fade-in data-[state=inactive]:animate-fade-out">
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-xs font-semibold text-green-500 uppercase tracking-wider mb-4">Passaggi</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <StatRow 
                          label="Precisione Passaggi" 
                          success={currentPlayer.sum_pass_si ?? 0} 
                          total={currentPlayer.sum_pass_tot ?? 0}
                          percentage={currentPlayer.sum_pass_tot ? Math.round((currentPlayer.sum_pass_si / currentPlayer.sum_pass_tot) * 100) : 0}
                          delay={0}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <StatCard label="Riusciti" value={currentPlayer.sum_pass_si ?? 0} delay={50} />
                          <StatCard label="Tentati" value={currentPlayer.sum_pass_tot ?? 0} delay={100} />
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h4 className="text-xs font-semibold text-green-500 uppercase tracking-wider mb-4">Dribbling</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <StatRow 
                          label="Precisione Dribbling" 
                          success={currentPlayer.sum_drib_si ?? 0} 
                          total={currentPlayer.sum_drib_tot ?? 0}
                          percentage={currentPlayer.sum_drib_tot ? Math.round((currentPlayer.sum_drib_si / currentPlayer.sum_drib_tot) * 100) : 0}
                          delay={150}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <StatCard label="Riusciti" value={currentPlayer.sum_drib_si ?? 0} delay={200} />
                          <StatCard label="Tentati" value={currentPlayer.sum_drib_tot ?? 0} delay={250} />
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h4 className="text-xs font-semibold text-green-500 uppercase tracking-wider mb-4">Cross</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <StatRow 
                          label="Precisione Cross" 
                          success={currentPlayer.sum_cros_si ?? 0} 
                          total={currentPlayer.sum_cros_tot ?? 0}
                          percentage={currentPlayer.sum_cros_tot ? Math.round((currentPlayer.sum_cros_si / currentPlayer.sum_cros_tot) * 100) : 0}
                          delay={300}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <StatCard label="Riusciti" value={currentPlayer.sum_cros_si ?? 0} delay={350} />
                          <StatCard label="Tentati" value={currentPlayer.sum_cros_tot ?? 0} delay={400} />
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="difensivo" className="mt-0 space-y-6 animate-fade-in data-[state=inactive]:animate-fade-out">
                  <h4 className="text-xs font-semibold text-blue-500 uppercase tracking-wider">Contrasti</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <StatRow 
                      label="Precisione Contrasti" 
                      success={currentPlayer.sum_ctrs_si ?? 0} 
                      total={currentPlayer.sum_ctrs_tot ?? 0}
                      percentage={currentPlayer.sum_ctrs_tot ? Math.round((currentPlayer.sum_ctrs_si / currentPlayer.sum_ctrs_tot) * 100) : 0}
                      delay={0}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <StatCard label="Riusciti" value={currentPlayer.sum_ctrs_si ?? 0} icon={Shield} delay={50} />
                      <StatCard label="Tentati" value={currentPlayer.sum_ctrs_tot ?? 0} delay={100} />
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          )}
        </CardContent>
        
        {/* Footer Note */}
        {!isGoalkeeper && (
          <div className="px-6 pb-6">
            <div className="p-4 rounded-lg bg-muted/30 border border-border">
              <p className="text-sm text-muted-foreground">
                💡 Per visualizzare tutte le statistiche negli anni usare la pagina Storico.
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default PlayerAdvancedStats;

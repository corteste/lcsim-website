import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TrendingDown,
  Users,
  ShieldCheck,
  AlertTriangle,
  Search,
  CheckCircle2,
  Loader2,
  Calendar,
  Sparkles,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  History,
  Shield,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import {
  calculatePerformanceDecaySimulation,
  executePerformanceDecay,
  PerformanceDecaySimulationReport,
  DecayedPlayerReport,
} from "@/services/performanceDecayService";
import { getRoleColor } from "@/utils/functions";
import { useAuth } from "@/context/AuthContext";

interface PerformanceDecayModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const PerformanceDecayModal: React.FC<PerformanceDecayModalProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [season, setSeason] = useState<number>(11);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [report, setReport] = useState<PerformanceDecaySimulationReport | null>(null);

  // Filtri UI
  const [searchQuery, setSearchQuery] = useState("");
  const [penaltyFilter, setPenaltyFilter] = useState<"all" | "penalized" | "penalty2" | "penalty1" | "exempt">("penalized");
  const [teamFilter, setTeamFilter] = useState<string>("all");
  const [expandedPlayerId, setExpandedPlayerId] = useState<number | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  // Carica simulazione quando si apre la modale o cambia la stagione
  const loadSimulation = async (targetSeason: number) => {
    setLoading(true);
    setExpandedPlayerId(null);
    try {
      const sim = await calculatePerformanceDecaySimulation(targetSeason);
      setReport(sim);
    } catch (err: any) {
      console.error("Errore calcolo simulazione peggioramenti:", err);
      toast.error(err.message || "Errore durante il calcolo della simulazione");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadSimulation(season);
    }
  }, [open, season]);

  // Lista squadre presenti nel report per il filtro
  const availableTeams = useMemo(() => {
    if (!report) return [];
    const set = new Set<string>();
    report.players.forEach((p) => {
      if (p.team) set.add(p.team);
    });
    return Array.from(set).sort();
  }, [report]);

  // Calciatori filtrati
  const filteredPlayers = useMemo(() => {
    if (!report) return [];
    return report.players.filter((p) => {
      // Filtro testo
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesTeam = p.team.toLowerCase().includes(q);
        const matchesPos = p.pos.toLowerCase().includes(q);
        if (!matchesName && !matchesTeam && !matchesPos) return false;
      }

      // Filtro squadra
      if (teamFilter !== "all" && p.team !== teamFilter) {
        return false;
      }

      // Filtro penalità
      if (penaltyFilter === "penalized" && p.penalty === 0) return false;
      if (penaltyFilter === "penalty2" && p.penalty !== 2) return false;
      if (penaltyFilter === "penalty1" && p.penalty !== 1) return false;
      if (penaltyFilter === "exempt" && p.penalty !== 0) return false;

      return true;
    });
  }, [report, searchQuery, penaltyFilter, teamFilter]);

  // Esecuzione applicazione definitiva
  const handleApply = async () => {
    if (!report) return;
    setApplying(true);
    try {
      const adminName = user?.name || user?.username || "Amministratore LCSIM";
      const res = await executePerformanceDecay(report, adminName);

      if (res.success) {
        toast.success(
          `Peggioramenti applicati con successo! ${res.updatedCount ?? report.penalty2Count + report.penalty1Count} calciatori aggiornati nel database.`
        );
        setConfirmDialogOpen(false);
        onOpenChange(false);
        if (onSuccess) onSuccess();
      } else {
        toast.error(res.error || "Errore durante l'applicazione dei peggioramenti");
      }
    } catch (err: any) {
      console.error("Errore salvataggio peggioramenti:", err);
      toast.error(err.message || "Errore di connessione o salvataggio");
    } finally {
      setApplying(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-card border-border/80 shadow-2xl">
          {/* Header */}
          <DialogHeader className="p-6 pb-4 border-b border-border/60 bg-muted/20">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"
                  >
                    <TrendingDown className="h-3 w-3" />
                    Punto #25 • In-Season
                  </Badge>
                  <span className="text-xs text-muted-foreground font-mono">
                    Formula Assenze &amp; Decadimento
                  </span>
                </div>
                <DialogTitle className="text-xl font-black tracking-tight text-foreground">
                  Peggioramenti Prestazionali In-Season
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
                  Calcolo dinamico delle assenze prolungate: penalità di -1 o -2 punti ad ogni attributo
                  (con salvaguardia a 30 e ricalcolo OVR) per calciatori poco impiegati in Serie A.
                </DialogDescription>
              </div>

              {/* Selettore Stagione */}
              <div className="flex items-center gap-2 self-start sm:self-auto bg-card border border-border/70 rounded-xl px-3 py-1.5 shadow-xs">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold text-muted-foreground">Stagione:</span>
                <Select
                  value={String(season)}
                  onValueChange={(val) => setSeason(Number(val))}
                  disabled={loading || applying}
                >
                  <SelectTrigger className="h-7 w-20 text-xs font-bold border-0 bg-transparent p-0 focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="11" className="text-xs font-medium">Stag. 11</SelectItem>
                    <SelectItem value="10" className="text-xs font-medium">Stag. 10</SelectItem>
                    <SelectItem value="9" className="text-xs font-medium">Stag. 9</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* KPI Cards */}
            {report && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3">
                <div className="p-2.5 rounded-xl bg-card border border-border/60 shadow-xs flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Valutati</span>
                    <p className="text-lg font-black text-foreground">{report.totalEvaluated}</p>
                  </div>
                  <Users className="h-5 w-5 text-muted-foreground/60" />
                </div>

                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 shadow-xs flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                      Penalità -2
                    </span>
                    <p className="text-lg font-black text-rose-600 dark:text-rose-400">
                      {report.penalty2Count}
                    </p>
                  </div>
                  <TrendingDown className="h-5 w-5 text-rose-500" />
                </div>

                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 shadow-xs flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                      Penalità -1
                    </span>
                    <p className="text-lg font-black text-amber-600 dark:text-amber-400">
                      {report.penalty1Count}
                    </p>
                  </div>
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                </div>

                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 shadow-xs flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      Esenti
                    </span>
                    <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                      {report.exemptCount}
                    </p>
                  </div>
                  <ShieldCheck className="h-5 w-5 text-emerald-500" />
                </div>
              </div>
            )}
          </DialogHeader>

          {/* Controls Bar */}
          <div className="p-4 border-b border-border/60 bg-card flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Cerca per calciatore, squadra o ruolo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-8 text-xs bg-muted/30 border-border/70"
              />
            </div>

            <div className="flex items-center gap-2">
              {/* Filtro Penalità */}
              <Select
                value={penaltyFilter}
                onValueChange={(val: any) => setPenaltyFilter(val)}
              >
                <SelectTrigger className="h-8 w-40 text-xs font-semibold bg-muted/30 border-border/70">
                  <SelectValue placeholder="Penalità" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">Tutti i calciatori</SelectItem>
                  <SelectItem value="penalized" className="text-xs font-bold text-rose-600 dark:text-rose-400">
                    Solo Penalizzati (-1 / -2)
                  </SelectItem>
                  <SelectItem value="penalty2" className="text-xs text-rose-600">Solo Penalità -2</SelectItem>
                  <SelectItem value="penalty1" className="text-xs text-amber-600">Solo Penalità -1</SelectItem>
                  <SelectItem value="exempt" className="text-xs text-emerald-600">Solo Esenti (0)</SelectItem>
                </SelectContent>
              </Select>

              {/* Filtro Squadra */}
              <Select value={teamFilter} onValueChange={setTeamFilter}>
                <SelectTrigger className="h-8 w-28 text-xs font-semibold bg-muted/30 border-border/70">
                  <SelectValue placeholder="Squadra" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">Tutti i club</SelectItem>
                  {availableTeams.map((t) => (
                    <SelectItem key={t} value={t} className="text-xs font-mono font-bold">
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tabella Calciatori */}
          <div className="flex-1 overflow-hidden relative">
            {loading ? (
              <div className="h-72 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-xs font-medium">Calcolo della simulazione stagionale in corso...</span>
              </div>
            ) : filteredPlayers.length === 0 ? (
              <div className="h-72 flex flex-col items-center justify-center gap-2 text-muted-foreground p-6 text-center">
                <ShieldCheck className="h-8 w-8 text-emerald-500/70" />
                <span className="text-sm font-bold text-foreground">Nessun calciatore corrisponde ai filtri</span>
                <span className="text-xs max-w-sm">
                  Prova a modificare la ricerca, il filtro penalità o a selezionare un'altra stagione.
                </span>
              </div>
            ) : (
              <ScrollArea className="h-[440px]">
                <div className="divide-y divide-border/50">
                  {filteredPlayers.map((player) => {
                    const isExpanded = expandedPlayerId === player.id;
                    const roleColor = getRoleColor(player.pos);

                    return (
                      <div
                        key={player.id}
                        className={`transition-colors ${
                          player.penalty === 2
                            ? "bg-rose-500/3 hover:bg-rose-500/6"
                            : player.penalty === 1
                            ? "bg-amber-500/3 hover:bg-amber-500/6"
                            : "hover:bg-muted/30"
                        }`}
                      >
                        {/* Riga Principale */}
                        <div className="p-3.5 flex items-center justify-between gap-3 text-xs">
                          {/* Info Calciatore */}
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <span className="font-mono text-[11px] font-bold text-muted-foreground w-12 shrink-0">
                              #{player.id}
                            </span>
                            <Badge
                              variant="outline"
                              className={`px-1.5 py-0.5 text-[10px] font-mono font-extrabold shrink-0 ${roleColor}`}
                            >
                              {player.pos}
                            </Badge>
                            <Badge
                              variant="outline"
                              className="font-mono text-[10px] font-bold px-1.5 py-0.5 shrink-0 bg-muted/40"
                            >
                              {player.team}
                            </Badge>
                            <span className="font-bold text-foreground truncate text-sm">
                              {player.name}
                            </span>
                          </div>

                          {/* Statistiche Assenze */}
                          <div className="flex items-center gap-4 shrink-0 text-right">
                            <div className="hidden sm:block text-right">
                              <span className="text-[10px] text-muted-foreground block font-mono">
                                Partite Club: {player.matchesPlayedByTeam}
                              </span>
                              <span className="text-[11px] font-mono font-semibold">
                                Punti Assenza: <strong className="text-foreground">{player.totalAbsencePoints}</strong>
                              </span>
                            </div>

                            <div className="w-20 text-right">
                              <span className="text-[10px] text-muted-foreground block uppercase font-mono">Media</span>
                              <span
                                className={`text-sm font-black font-mono ${
                                  player.penalty === 2
                                    ? "text-rose-600 dark:text-rose-400"
                                    : player.penalty === 1
                                    ? "text-amber-600 dark:text-amber-400"
                                    : "text-emerald-600 dark:text-emerald-400"
                                }`}
                              >
                                {player.avgAbsence.toFixed(2)}
                              </span>
                            </div>

                            {/* Badge Penalità */}
                            <div className="w-28 flex justify-center">
                              {player.penalty === 2 ? (
                                <Badge className="bg-rose-500 text-white font-extrabold text-[10px] px-2 py-0.5 shadow-xs">
                                  -2 Attributi
                                </Badge>
                              ) : player.penalty === 1 ? (
                                <Badge className="bg-amber-500 text-amber-950 font-extrabold text-[10px] px-2 py-0.5 shadow-xs">
                                  -1 Attributo
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-bold text-[10px] px-2 py-0.5">
                                  Regolare
                                </Badge>
                              )}
                            </div>

                            {/* OVR Prima / Dopo */}
                            <div className="w-24 text-right flex items-center justify-end gap-1.5 font-mono">
                              <span className="text-muted-foreground font-semibold">{player.oldOvr}</span>
                              {player.penalty > 0 ? (
                                <>
                                  <ArrowRight className="h-3 w-3 text-rose-500" />
                                  <span className="font-extrabold text-rose-600 dark:text-rose-400">
                                    {player.newOvr}
                                  </span>
                                </>
                              ) : (
                                <span className="text-muted-foreground/60 text-[11px] ml-1">(=)</span>
                              )}
                            </div>

                            {/* Toggle Dettaglio Partite */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setExpandedPlayerId(isExpanded ? null : player.id)}
                              className="h-7 w-7 p-0 shrink-0 text-muted-foreground hover:text-foreground"
                            >
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>

                        {/* Sezione Espansa: Storico Partite & Dettaglio Punteggi */}
                        {isExpanded && (
                          <div className="p-3.5 pt-0 bg-muted/20 border-t border-border/40 text-xs space-y-2">
                            <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium pt-2">
                              <span className="flex items-center gap-1.5 font-semibold text-foreground">
                                <History className="h-3.5 w-3.5 text-primary" />
                                Sequenza cronologica partite stagione {report?.season}:
                              </span>
                              <span>
                                Formula: <strong>0</strong> se gioca (≥1 min) • <strong>1</strong> prima assenza • <strong>2</strong> seconda assenza • <strong>3</strong> terza+ assenza consecutiva
                              </span>
                            </div>

                            {player.matchHistory.length === 0 ? (
                              <p className="text-[11px] text-muted-foreground italic">
                                Nessun match disputato registrato per questa squadra nella stagione.
                              </p>
                            ) : (
                              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                                {player.matchHistory.map((m, idx) => (
                                  <div
                                    key={idx}
                                    className={`px-2 py-1 rounded-md border text-[11px] font-mono flex items-center gap-1.5 ${
                                      m.points === 0
                                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold"
                                        : m.points === 3
                                        ? "bg-rose-500/15 border-rose-500/35 text-rose-600 dark:text-rose-400 font-bold"
                                        : "bg-amber-500/15 border-amber-500/35 text-amber-600 dark:text-amber-400 font-bold"
                                    }`}
                                  >
                                    <span className="text-[9px] uppercase opacity-75">G{m.week}</span>
                                    <span>{m.minutes}'</span>
                                    <span className="px-1 rounded bg-black/10 dark:bg-white/10 text-[10px]">
                                      +{m.points} pt
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Footer */}
          <DialogFooter className="p-4 border-t border-border/60 bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-primary" />
              <span>
                {report
                  ? `${report.penalty2Count + report.penalty1Count} calciatori su ${report.totalEvaluated} subiranno penalità`
                  : "In attesa di calcolo..."}
              </span>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                disabled={applying}
                className="text-xs font-semibold"
              >
                Chiudi
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setConfirmDialogOpen(true)}
                disabled={loading || applying || !report || (report.penalty2Count === 0 && report.penalty1Count === 0)}
                className="text-xs font-bold gap-1.5 bg-rose-600 hover:bg-rose-700 shadow-sm"
              >
                {applying ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Applicazione in corso...
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-3.5 w-3.5" />
                    Applica Peggioramenti ({report ? report.penalty2Count + report.penalty1Count : 0})
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog di Conferma Definitiva */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="max-w-md bg-card border-border/80 shadow-xl">
          <DialogHeader>
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 mb-1">
              <AlertTriangle className="h-5 w-5" />
              <DialogTitle className="text-base font-black">Conferma Applicazione Peggioramenti</DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed pt-1">
              Stai per applicare definitivamente le penalità di assenza in-season per la <strong>Stagione {report?.season}</strong>:
            </DialogDescription>
          </DialogHeader>

          <div className="p-3.5 rounded-xl bg-muted/40 border border-border/70 space-y-2 text-xs">
            <div className="flex justify-between items-center font-medium">
              <span>Calciatori con Penalità -2:</span>
              <span className="font-bold font-mono text-rose-600 dark:text-rose-400">{report?.penalty2Count}</span>
            </div>
            <div className="flex justify-between items-center font-medium">
              <span>Calciatori con Penalità -1:</span>
              <span className="font-bold font-mono text-amber-600 dark:text-amber-400">{report?.penalty1Count}</span>
            </div>
            <div className="flex justify-between items-center font-medium pt-1 border-t border-border/50">
              <span className="font-bold">Totale Calciatori da Modificare:</span>
              <span className="font-black font-mono text-foreground">
                {(report?.penalty2Count || 0) + (report?.penalty1Count || 0)}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground pt-1 leading-relaxed">
              ⚠️ Verranno aggiornati tutti i 35 attributi di gioco in <code>an_player</code> e <code>ea_player_db</code> (mantenendo la soglia minima a 30) e ricalcolato l'OVR di ciascun calciatore.
            </p>
          </div>

          <DialogFooter className="pt-2 flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmDialogOpen(false)}
              disabled={applying}
              className="text-xs"
            >
              Annulla
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleApply}
              disabled={applying}
              className="text-xs font-bold gap-1.5 bg-rose-600 hover:bg-rose-700"
            >
              {applying ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Salvataggio...
                </>
              ) : (
                "Sì, Applica a Database"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

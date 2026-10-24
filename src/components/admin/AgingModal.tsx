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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CalendarClock,
  Users,
  TrendingDown,
  UserX,
  Hourglass,
  FileText,
  Search,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Table as TableIcon,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import {
  AGING_ATTRIBUTES,
  ATTRIBUTE_LABELS,
  DECAY_MATRIX,
  getAgingSimulationReport,
  executePlayerAgingRpc,
  AgingSimulationReport,
  DecayedPlayer,
  RetiringPlayer,
  FinalSeasonPlayer,
} from "@/services/playerAgingService";

interface AgingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  authorName: string;
}

export const AgingModal: React.FC<AgingModalProps> = ({
  open,
  onOpenChange,
  onSuccess,
  authorName,
}) => {
  const [report, setReport] = useState<AgingSimulationReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [confirmStepOpen, setConfirmStepOpen] = useState(false);

  // Filters
  const [searchDecayed, setSearchDecayed] = useState("");
  const [filterAgeTransition, setFilterAgeTransition] = useState<string>("all");
  const [searchRetiring, setSearchRetiring] = useState("");
  const [searchFinalSeason, setSearchFinalSeason] = useState("");

  useEffect(() => {
    if (open) {
      loadPreview();
    } else {
      setConfirmStepOpen(false);
    }
  }, [open]);

  const loadPreview = async () => {
    setIsLoading(true);
    try {
      const data = await getAgingSimulationReport();
      setReport(data);
    } catch (err: any) {
      toast.error(err.message || "Errore durante il caricamento della simulazione");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecute = async () => {
    if (!report) return;
    setIsExecuting(true);
    try {
      const res = await executePlayerAgingRpc(report, authorName);
      if (!res.success) {
        throw new Error(res.error || "Operazione di invecchiamento non riuscita");
      }

      toast.success(
        `Invecchiamento completato con successo! Invecchiati ${res.aged_count ?? report.totalActive} calciatori, applicati ${res.decayed_count ?? report.decayCount} decadimenti e ufficializzati ${res.retired_count ?? report.retireCount} ritiri.`,
        { icon: "⏳", duration: 6000 }
      );

      setConfirmStepOpen(false);
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Errore durante l'esecuzione dell'invecchiamento");
    } finally {
      setIsExecuting(false);
    }
  };

  // Filtered lists
  const filteredDecayed = useMemo(() => {
    if (!report) return [];
    return report.decayedPlayers.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchDecayed.toLowerCase()) ||
        (p.team && p.team.toLowerCase().includes(searchDecayed.toLowerCase())) ||
        p.pos.toLowerCase().includes(searchDecayed.toLowerCase());

      const matchAge =
        filterAgeTransition === "all" || `${p.fromAge}->${p.toAge}` === filterAgeTransition;

      return matchSearch && matchAge;
    });
  }, [report, searchDecayed, filterAgeTransition]);

  const filteredRetiring = useMemo(() => {
    if (!report) return [];
    return report.retiringPlayers.filter(
      (p) =>
        p.name.toLowerCase().includes(searchRetiring.toLowerCase()) ||
        (p.team && p.team.toLowerCase().includes(searchRetiring.toLowerCase())) ||
        p.pos.toLowerCase().includes(searchRetiring.toLowerCase())
    );
  }, [report, searchRetiring]);

  const filteredFinalSeason = useMemo(() => {
    if (!report) return [];
    return report.finalSeasonPlayers.filter(
      (p) =>
        p.name.toLowerCase().includes(searchFinalSeason.toLowerCase()) ||
        (p.team && p.team.toLowerCase().includes(searchFinalSeason.toLowerCase())) ||
        p.pos.toLowerCase().includes(searchFinalSeason.toLowerCase())
    );
  }, [report, searchFinalSeason]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden bg-card border-border shadow-2xl">
          {/* Header */}
          <DialogHeader className="p-6 pb-4 border-b border-border/80 bg-muted/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-sm">
                  <CalendarClock className="h-6 w-6" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-black tracking-tight flex items-center gap-2">
                    Invecchiamento Calciatori & Gestione Ritiri
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-xs">
                      Passaggio di Stagione
                    </Badge>
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    Incremento anagrafico (+1 anno), traslazione date EA FC 25, applicazione curve decadimento fisico/tecnico e annuncio ritiri.
                  </DialogDescription>
                </div>
              </div>
            </div>

            {/* Quick Metrics Cards */}
            {report && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mt-4">
                <div className="p-2.5 rounded-lg border border-border/60 bg-background/50 flex flex-col justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <Users className="h-3 w-3 text-sky-500" /> Totale Attivi
                  </span>
                  <span className="text-lg font-black text-foreground mt-1">
                    {report.totalActive}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 flex flex-col justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> Under 30 (No Decad.)
                  </span>
                  <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1">
                    {report.agedOnlyCount}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg border border-amber-500/20 bg-amber-500/5 flex flex-col justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <TrendingDown className="h-3 w-3" /> Decadimenti (31-34)
                  </span>
                  <span className="text-lg font-black text-amber-600 dark:text-amber-400 mt-1">
                    {report.decayCount}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg border border-purple-500/20 bg-purple-500/5 flex flex-col justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1">
                    <Hourglass className="h-3 w-3" /> Ultima Stag. (34)
                  </span>
                  <span className="text-lg font-black text-purple-600 dark:text-purple-400 mt-1">
                    {report.finalSeasonCount}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg border border-rose-500/20 bg-rose-500/5 flex flex-col justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    <UserX className="h-3 w-3" /> Nuovi Ritiri (35)
                  </span>
                  <span className="text-lg font-black text-rose-600 dark:text-rose-400 mt-1">
                    {report.retireCount}
                  </span>
                </div>
              </div>
            )}
          </DialogHeader>

          {/* Body Content */}
          <div className="flex-1 overflow-hidden p-6">
            {isLoading ? (
              <div className="py-24 flex flex-col items-center justify-center gap-3">
                <Loader2 className="h-9 w-9 text-amber-500 animate-spin" />
                <p className="text-sm font-semibold text-muted-foreground animate-pulse">
                  Calcolo simulazione invecchiamento, decadimenti e ricalcolo OVR...
                </p>
              </div>
            ) : !report ? (
              <div className="py-20 text-center space-y-2">
                <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto" />
                <p className="text-sm text-muted-foreground">Impossibile calcolare la simulazione.</p>
                <Button size="sm" variant="outline" onClick={loadPreview}>
                  Riprova
                </Button>
              </div>
            ) : (
              <Tabs defaultValue="matrix" className="h-full flex flex-col">
                <TabsList className="grid grid-cols-5 w-full bg-muted/60 p-1 mb-4">
                  <TabsTrigger value="matrix" className="text-xs font-bold gap-1.5">
                    <TableIcon className="h-3.5 w-3.5" /> Matrice Regole
                  </TabsTrigger>
                  <TabsTrigger value="decayed" className="text-xs font-bold gap-1.5">
                    <TrendingDown className="h-3.5 w-3.5 text-amber-500" /> Decadimenti ({report.decayCount})
                  </TabsTrigger>
                  <TabsTrigger value="retiring" className="text-xs font-bold gap-1.5">
                    <UserX className="h-3.5 w-3.5 text-rose-500" /> Ritiri ({report.retireCount})
                  </TabsTrigger>
                  <TabsTrigger value="final" className="text-xs font-bold gap-1.5">
                    <Hourglass className="h-3.5 w-3.5 text-purple-500" /> Ultima Stagione ({report.finalSeasonCount})
                  </TabsTrigger>
                  <TabsTrigger value="announcement" className="text-xs font-bold gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-sky-500" /> Comunicato
                  </TabsTrigger>
                </TabsList>

                {/* TAB 1: Matrice Regole */}
                <TabsContent value="matrix" className="flex-1 overflow-hidden m-0">
                  <ScrollArea className="h-[430px] pr-3">
                    <div className="space-y-4">
                      {/* Alert Regola Salvaguardia */}
                      <div className="p-3.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 flex items-start gap-3">
                        <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                        <div className="text-xs">
                          <span className="font-bold text-foreground">Regola di Salvaguardia Valore Minimo: </span>
                          <span className="text-muted-foreground">
                            I valori degli attributi dei calciatori non possono mai scendere al di sotto di <strong>30</strong>.
                            Se un attributo scenderebbe sotto tale valore a causa del decadimento, viene automaticamente bloccato a 30.
                          </span>
                        </div>
                      </div>

                      {/* Tabella Parametri Ufficiale */}
                      <div className="rounded-xl border border-border/80 overflow-hidden shadow-sm">
                        <div className="bg-muted/40 p-2.5 border-b border-border/80 flex items-center justify-between">
                          <span className="text-xs font-black tracking-wider uppercase">
                            Matrice Ufficiale Decadimenti Stagionali (LCSIM / EA FC 25)
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            11 Attributi Fisico/Tecnici
                          </span>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-center border-collapse">
                            <thead>
                              <tr className="bg-muted/60 text-muted-foreground border-b border-border/80 font-mono">
                                <th className="p-2.5 text-left font-sans font-bold pl-3">Passaggio Età</th>
                                {AGING_ATTRIBUTES.map((attr) => (
                                  <th key={attr} className="p-2 font-bold" title={ATTRIBUTE_LABELS[attr]}>
                                    {attr}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                              {/* Under 30 */}
                              <tr className="text-muted-foreground bg-background">
                                <td className="p-2 text-left font-semibold pl-3">24 ➔ 30 (Fascia Giovani/Prime)</td>
                                {AGING_ATTRIBUTES.map((attr) => (
                                  <td key={attr} className="p-2 font-mono text-muted-foreground/60">
                                    0
                                  </td>
                                ))}
                              </tr>

                              {/* 30 -> 31 */}
                              <tr className="bg-amber-500/5 font-semibold text-amber-700 dark:text-amber-300">
                                <td className="p-2 text-left font-bold pl-3 flex items-center gap-1.5">
                                  <span className="h-2 w-2 rounded-full bg-amber-500"></span> 30 ➔ 31
                                </td>
                                {AGING_ATTRIBUTES.map((attr) => {
                                  const val = DECAY_MATRIX[31][attr];
                                  return (
                                    <td key={attr} className={`p-2 font-mono ${val < 0 ? "font-bold text-amber-600 dark:text-amber-400" : "text-muted-foreground/60"}`}>
                                      {val === 0 ? "0" : val}
                                    </td>
                                  );
                                })}
                              </tr>

                              {/* 31 -> 32 */}
                              <tr className="bg-amber-500/5 font-semibold text-amber-700 dark:text-amber-300">
                                <td className="p-2 text-left font-bold pl-3 flex items-center gap-1.5">
                                  <span className="h-2 w-2 rounded-full bg-amber-500"></span> 31 ➔ 32
                                </td>
                                {AGING_ATTRIBUTES.map((attr) => {
                                  const val = DECAY_MATRIX[32][attr];
                                  return (
                                    <td key={attr} className={`p-2 font-mono ${val < 0 ? "font-bold text-amber-600 dark:text-amber-400" : "text-muted-foreground/60"}`}>
                                      {val === 0 ? "0" : val}
                                    </td>
                                  );
                                })}
                              </tr>

                              {/* 32 -> 33 */}
                              <tr className="bg-orange-500/10 font-semibold text-orange-700 dark:text-orange-300">
                                <td className="p-2 text-left font-bold pl-3 flex items-center gap-1.5">
                                  <span className="h-2 w-2 rounded-full bg-orange-500"></span> 32 ➔ 33
                                </td>
                                {AGING_ATTRIBUTES.map((attr) => {
                                  const val = DECAY_MATRIX[33][attr];
                                  return (
                                    <td key={attr} className={`p-2 font-mono ${val < 0 ? "font-bold text-orange-600 dark:text-orange-400" : "text-muted-foreground/60"}`}>
                                      {val === 0 ? "0" : val}
                                    </td>
                                  );
                                })}
                              </tr>

                              {/* 33 -> 34 */}
                              <tr className="bg-orange-500/10 font-semibold text-orange-700 dark:text-orange-300">
                                <td className="p-2 text-left font-bold pl-3 flex items-center gap-1.5">
                                  <span className="h-2 w-2 rounded-full bg-orange-500"></span> 33 ➔ 34
                                </td>
                                {AGING_ATTRIBUTES.map((attr) => {
                                  const val = DECAY_MATRIX[34][attr];
                                  return (
                                    <td key={attr} className={`p-2 font-mono ${val < 0 ? "font-bold text-orange-600 dark:text-orange-400" : "text-muted-foreground/60"}`}>
                                      {val === 0 ? "0" : val}
                                    </td>
                                  );
                                })}
                              </tr>

                              {/* 34 -> 35 */}
                              <tr className="bg-rose-500/10 font-bold text-rose-700 dark:text-rose-400">
                                <td className="p-2 text-left pl-3 flex items-center gap-1.5">
                                  <span className="h-2 w-2 rounded-full bg-rose-500"></span> 34 ➔ 35
                                </td>
                                <td colSpan={11} className="p-2 tracking-widest uppercase font-black text-rose-600 dark:text-rose-400">
                                  🛑 RITIRO UFFICIALE (Squadra = &apos;RITIRATO&apos;)
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Legenda attributi */}
                      <div className="p-3 bg-muted/20 rounded-lg border border-border/60">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                          Legenda Attributi Impattati:
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          {AGING_ATTRIBUTES.map((attr) => (
                            <div key={attr} className="flex items-center gap-1.5">
                              <Badge variant="outline" className="font-mono text-[10px] px-1 py-0">
                                {attr}
                              </Badge>
                              <span className="text-muted-foreground truncate">{ATTRIBUTE_LABELS[attr]}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                </TabsContent>

                {/* TAB 2: Decadimenti Over 30 */}
                <TabsContent value="decayed" className="flex-1 overflow-hidden m-0 flex flex-col">
                  {/* Toolbar */}
                  <div className="flex flex-col sm:flex-row items-center gap-2 mb-3">
                    <div className="relative flex-1 w-full">
                      <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
                      <Input
                        placeholder="Cerca calciatore, ruolo o squadra..."
                        value={searchDecayed}
                        onChange={(e) => setSearchDecayed(e.target.value)}
                        className="pl-8 text-xs h-9"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 w-full sm:w-auto">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">Transizione:</span>
                      <select
                        value={filterAgeTransition}
                        onChange={(e) => setFilterAgeTransition(e.target.value)}
                        className="text-xs h-9 rounded-md border border-input bg-background px-2.5 py-1 text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      >
                        <option value="all">Tutte ({report.decayCount})</option>
                        <option value="30->31">30 ➔ 31</option>
                        <option value="31->32">31 ➔ 32</option>
                        <option value="32->33">32 ➔ 33</option>
                        <option value="33->34">33 ➔ 34</option>
                      </select>
                    </div>
                  </div>

                  <ScrollArea className="flex-1 rounded-lg border border-border/80">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-muted/60 text-muted-foreground sticky top-0 border-b border-border/80 z-10">
                        <tr>
                          <th className="p-2.5 font-bold pl-3">Calciatore</th>
                          <th className="p-2.5 font-bold">Squadra</th>
                          <th className="p-2.5 font-bold">Ruolo</th>
                          <th className="p-2.5 font-bold text-center">Età</th>
                          <th className="p-2.5 font-bold text-center">OVR (Pre ➔ Post)</th>
                          <th className="p-2.5 font-bold">Variazioni Attributi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {filteredDecayed.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-muted-foreground">
                              Nessun calciatore trovato con i filtri applicati.
                            </td>
                          </tr>
                        ) : (
                          filteredDecayed.map((p) => (
                            <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                              <td className="p-2.5 pl-3 font-semibold text-foreground">
                                {p.name}
                              </td>
                              <td className="p-2.5">
                                {p.team ? (
                                  <Badge variant="outline" className="font-mono text-[10px]">
                                    {p.team}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground italic text-[11px]">Free Agent</span>
                                )}
                              </td>
                              <td className="p-2.5">
                                <Badge variant="secondary" className="font-bold text-[10px]">
                                  {p.pos}
                                </Badge>
                              </td>
                              <td className="p-2.5 text-center font-mono">
                                <span className="text-muted-foreground">{p.fromAge}</span>
                                <span className="mx-1 text-muted-foreground/60">➔</span>
                                <span className="font-bold text-amber-500">{p.toAge}</span>
                              </td>
                              <td className="p-2.5 text-center font-mono">
                                <span className="text-muted-foreground">{p.oldOvr}</span>
                                <span className="mx-1 text-muted-foreground/60">➔</span>
                                <span className="font-black text-foreground">{p.newOvr}</span>
                                <Badge
                                  variant="outline"
                                  className={`ml-1.5 font-mono text-[10px] ${
                                    p.ovrDelta < 0
                                      ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30"
                                      : "bg-muted text-muted-foreground"
                                  }`}
                                >
                                  {p.ovrDelta > 0 ? `+${p.ovrDelta}` : p.ovrDelta}
                                </Badge>
                              </td>
                              <td className="p-2.5">
                                <div className="flex flex-wrap gap-1 max-w-sm">
                                  {Object.entries(p.statDeltas)
                                    .filter(([_, d]) => d !== 0)
                                    .map(([stat, d]) => (
                                      <span
                                        key={stat}
                                        className="inline-flex items-center gap-0.5 text-[10px] font-mono px-1 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                                      >
                                        {stat} {d}
                                      </span>
                                    ))}
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </ScrollArea>
                </TabsContent>

                {/* TAB 3: Nuovi Ritiri Ufficiali */}
                <TabsContent value="retiring" className="flex-1 overflow-hidden m-0 flex flex-col">
                  <div className="mb-3">
                    <div className="relative w-full max-w-md">
                      <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
                      <Input
                        placeholder="Cerca tra i 29 calciatori che si ritirano..."
                        value={searchRetiring}
                        onChange={(e) => setSearchRetiring(e.target.value)}
                        className="pl-8 text-xs h-9"
                      />
                    </div>
                  </div>

                  <ScrollArea className="flex-1 rounded-lg border border-border/80">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-muted/60 text-muted-foreground sticky top-0 border-b border-border/80 z-10">
                        <tr>
                          <th className="p-2.5 font-bold pl-3">Calciatore</th>
                          <th className="p-2.5 font-bold">Ultima Squadra</th>
                          <th className="p-2.5 font-bold">Ruolo</th>
                          <th className="p-2.5 font-bold text-center">Età Finale</th>
                          <th className="p-2.5 font-bold text-center">OVR Finale</th>
                          <th className="p-2.5 font-bold text-right pr-3">Nuovo Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {filteredRetiring.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-muted-foreground">
                              Nessun calciatore trovato.
                            </td>
                          </tr>
                        ) : (
                          filteredRetiring.map((p) => (
                            <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                              <td className="p-2.5 pl-3 font-semibold text-foreground flex items-center gap-2">
                                <UserX className="h-3.5 w-3.5 text-rose-500" />
                                {p.name}
                              </td>
                              <td className="p-2.5">
                                {p.team ? (
                                  <Badge variant="outline" className="font-mono text-[10px]">
                                    {p.team}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground italic text-[11px]">Free Agent</span>
                                )}
                              </td>
                              <td className="p-2.5">
                                <Badge variant="secondary" className="font-bold text-[10px]">
                                  {p.pos}
                                </Badge>
                              </td>
                              <td className="p-2.5 text-center font-mono font-bold text-rose-500">
                                {p.toAge}
                              </td>
                              <td className="p-2.5 text-center font-mono font-bold">
                                {p.ovr}
                              </td>
                              <td className="p-2.5 text-right pr-3">
                                <Badge variant="outline" className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 text-[10px] font-bold uppercase tracking-wider">
                                  RITIRATO
                                </Badge>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </ScrollArea>
                </TabsContent>

                {/* TAB 4: Veterani Ultima Stagione */}
                <TabsContent value="final" className="flex-1 overflow-hidden m-0 flex flex-col">
                  <div className="mb-3">
                    <div className="relative w-full max-w-md">
                      <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
                      <Input
                        placeholder="Cerca tra i 40 veterani al loro ultimo anno..."
                        value={searchFinalSeason}
                        onChange={(e) => setSearchFinalSeason(e.target.value)}
                        className="pl-8 text-xs h-9"
                      />
                    </div>
                  </div>

                  <ScrollArea className="flex-1 rounded-lg border border-border/80">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-muted/60 text-muted-foreground sticky top-0 border-b border-border/80 z-10">
                        <tr>
                          <th className="p-2.5 font-bold pl-3">Calciatore</th>
                          <th className="p-2.5 font-bold">Squadra</th>
                          <th className="p-2.5 font-bold">Ruolo</th>
                          <th className="p-2.5 font-bold text-center">Nuova Età</th>
                          <th className="p-2.5 font-bold text-center">Nuovo OVR</th>
                          <th className="p-2.5 font-bold text-right pr-3">Annuncio Ritiro</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {filteredFinalSeason.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-muted-foreground">
                              Nessun calciatore trovato.
                            </td>
                          </tr>
                        ) : (
                          filteredFinalSeason.map((p) => (
                            <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                              <td className="p-2.5 pl-3 font-semibold text-foreground flex items-center gap-2">
                                <Hourglass className="h-3.5 w-3.5 text-purple-500" />
                                {p.name}
                              </td>
                              <td className="p-2.5">
                                {p.team ? (
                                  <Badge variant="outline" className="font-mono text-[10px]">
                                    {p.team}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground italic text-[11px]">Free Agent</span>
                                )}
                              </td>
                              <td className="p-2.5">
                                <Badge variant="secondary" className="font-bold text-[10px]">
                                  {p.pos}
                                </Badge>
                              </td>
                              <td className="p-2.5 text-center font-mono font-bold text-purple-500">
                                34
                              </td>
                              <td className="p-2.5 text-center font-mono">
                                <span className="font-black text-foreground">{p.newOvr}</span>
                                <Badge
                                  variant="outline"
                                  className="ml-1.5 font-mono text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                                >
                                  {p.ovrDelta}
                                </Badge>
                              </td>
                              <td className="p-2.5 text-right pr-3">
                                <Badge variant="outline" className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30 text-[10px] font-bold">
                                  Ultima Stagione (34)
                                </Badge>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </ScrollArea>
                </TabsContent>

                {/* TAB 5: Comunicato Bacheca */}
                <TabsContent value="announcement" className="flex-1 overflow-hidden m-0">
                  <div className="h-full flex flex-col space-y-3">
                    <div className="p-3 bg-sky-500/10 border border-sky-500/20 rounded-lg flex items-center justify-between text-xs text-sky-700 dark:text-sky-300">
                      <span className="flex items-center gap-2 font-semibold">
                        <FileText className="h-4 w-4" /> Anteprima automatica del comunicato in bacheca
                      </span>
                      <Badge variant="outline" className="bg-sky-500/20 text-sky-600 dark:text-sky-400 border-sky-500/40 text-[10px]">
                        Pubblicazione Automatica
                      </Badge>
                    </div>

                    <ScrollArea className="flex-1 rounded-lg border border-border/80 p-4 bg-muted/10">
                      <div className="text-xs whitespace-pre-wrap font-sans leading-relaxed text-foreground/90">
                        {report.announcementContent}
                      </div>
                    </ScrollArea>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </div>

          {/* Footer */}
          <DialogFooter className="p-4 px-6 border-t border-border/80 bg-muted/20 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
              <span>Operazione globale irreversibile sul database di lega.</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                disabled={isExecuting}
                className="text-xs font-semibold"
              >
                Chiudi
              </Button>
              <Button
                size="sm"
                onClick={() => setConfirmStepOpen(true)}
                disabled={isLoading || isExecuting || !report}
                className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold gap-1.5 shadow-sm"
              >
                <CalendarClock className="h-3.5 w-3.5" />
                Applica Invecchiamento Stagionale
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Step Dialog */}
      <Dialog open={confirmStepOpen} onOpenChange={setConfirmStepOpen}>
        <DialogContent className="max-w-md bg-card border-border shadow-2xl">
          <DialogHeader>
            <div className="p-3 rounded-full bg-amber-500/10 text-amber-500 w-fit mb-2">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <DialogTitle className="text-lg font-black">
              Confermi l&apos;Invecchiamento di Lega?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              L&apos;operazione eseguirà le seguenti azioni atomiche irreversibili:
            </DialogDescription>
          </DialogHeader>

          {report && (
            <div className="space-y-2 py-2 text-xs">
              <div className="p-2.5 rounded-lg border border-border/60 bg-muted/20 flex items-center justify-between">
                <span>Calciatori attivi che invecchieranno (+1 anno, DOB -365):</span>
                <span className="font-bold text-foreground">{report.totalActive}</span>
              </div>
              <div className="p-2.5 rounded-lg border border-amber-500/20 bg-amber-500/5 flex items-center justify-between">
                <span>Calciatori che subiranno il decadimento attributi (31-34):</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">{report.decayCount}</span>
              </div>
              <div className="p-2.5 rounded-lg border border-rose-500/20 bg-rose-500/5 flex items-center justify-between">
                <span>Calciatori che passano ufficialmente a RITIRATO (35+):</span>
                <span className="font-bold text-rose-600 dark:text-rose-400">{report.retireCount}</span>
              </div>
              <div className="p-2.5 rounded-lg border border-sky-500/20 bg-sky-500/5 flex items-center justify-between">
                <span>Pubblicazione automatica comunicato in bacheca di lega:</span>
                <Badge variant="outline" className="text-[10px] bg-sky-500/10 text-sky-600 border-sky-500/30">
                  SI
                </Badge>
              </div>
            </div>
          )}

          <DialogFooter className="mt-4 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmStepOpen(false)}
              disabled={isExecuting}
              className="text-xs"
            >
              Annulla
            </Button>
            <Button
              size="sm"
              onClick={handleExecute}
              disabled={isExecuting}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold gap-1.5"
            >
              {isExecuting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Esecuzione in corso...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" /> Conferma ed Esegui
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

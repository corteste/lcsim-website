import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import RequireAuthPrompt from "@/components/RequireAuthPrompt";
import {
  Download,
  Database,
  CalendarClock,
  Store,
  Lock,
  Unlock,
  ShieldCheck,
  AlertTriangle,
  FileSpreadsheet,
  Cpu,
  Info,
  UploadCloud,
  FileText,
  Clock,
  Sparkles,
  CheckCircle2,
  Scissors,
  Loader2,
  Users
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/supabaseClient";
import { exportEADatabaseTSV } from "@/services/eaPlayerDbService";
import { ImportRookieModal } from "@/components/admin/ImportRookieModal";
import { AgingModal } from "@/components/admin/AgingModal";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getCutsComplianceReport, executeOfficialCutsRpc } from "@/services/cutsService";
import { generatePressQuestionsForMatchday, generateRandomMarketRumors } from "@/services/aiJournalistService";
import { Newspaper, Mic2, Flame } from "lucide-react";

interface AutomationStateItem {
  id: string;
  action_name: string;
  last_run_at: string | null;
  last_run_by: string | null;
  details?: Record<string, any>;
}

export default function AdminAutomazioni() {
  const { user, isAdmin } = useAuth();

  // State timestamps
  const [stateMap, setStateMap] = useState<Record<string, AutomationStateItem>>({});
  const [isLoadingState, setIsLoadingState] = useState(true);

  // Export States
  const [isExportingFull, setIsExportingFull] = useState(false);
  const [isExportingSnippet, setIsExportingSnippet] = useState(false);
  const [patchModalOpen, setPatchModalOpen] = useState(false);
  const [patchFile, setPatchFile] = useState<File | null>(null);
  const [isPatching, setIsPatching] = useState(false);
  const [rookieModalOpen, setRookieModalOpen] = useState(false);
  const [agingModalOpen, setAgingModalOpen] = useState(false);

  // Official cuts state & query
  const queryClient = useQueryClient();
  const [cutsConfirmOpen, setCutsConfirmOpen] = useState(false);
  const [isExecutingCuts, setIsExecutingCuts] = useState(false);

  const {
    data: cutsReport,
    isLoading: isLoadingCuts,
    refetch: refetchCutsReport,
  } = useQuery({
    queryKey: ["cuts_compliance_report"],
    queryFn: () => getCutsComplianceReport(),
    enabled: Boolean(user && isAdmin),
  });

  const handleExecuteOfficialCuts = async () => {
    setIsExecutingCuts(true);
    try {
      const adminName = user?.name || user?.team || "Super Admin";
      const res = await executeOfficialCutsRpc(adminName);

      if (!res.success) {
        throw new Error(res.error || "Operazione non riuscita");
      }

      toast.success(
        `Tagli ufficializzati con successo! Svincolati ${res.released_count ?? 0} calciatori.`,
        { icon: "✂️" }
      );

      setCutsConfirmOpen(false);
      await loadAutomationStates();
      await refetchCutsReport();
      await queryClient.invalidateQueries({ queryKey: ["cuts_compliance_report"] });
      await queryClient.invalidateQueries({ queryKey: ["team_cuts"] });
      await queryClient.invalidateQueries({ queryKey: ["players"] });
    } catch (err: any) {
      toast.error(err.message || "Errore durante l'ufficializzazione dei tagli");
    } finally {
      setIsExecutingCuts(false);
    }
  };

  // Placeholder Dialog States
  const [infoModal, setInfoModal] = useState<{
    id: string;
    title: string;
    description: string;
    puntoApertoIndex: number;
    points: string[];
    actionLabel?: string;
    detailsToRecord?: Record<string, any>;
  } | null>(null);

  // Fetch automation states
  const loadAutomationStates = async () => {
    try {
      setIsLoadingState(true);
      const { data, error } = await supabase
        .from("league_automation_state")
        .select("*");

      if (error) throw error;

      const map: Record<string, AutomationStateItem> = {};
      for (const item of (data || []) as AutomationStateItem[]) {
        map[item.id] = item;
      }
      setStateMap(map);
    } catch (err) {
      console.warn("Impossibile caricare league_automation_state, uso fallback locale:", err);
      try {
        const raw = localStorage.getItem("lcsim_automation_state");
        if (raw) setStateMap(JSON.parse(raw));
      } catch (_) { }
    } finally {
      setIsLoadingState(false);
    }
  };

  useEffect(() => {
    loadAutomationStates();
  }, []);

  // Update and record an automation execution
  const recordAutomationRun = async (id: string, details: Record<string, any> = {}) => {
    const nowIso = new Date().toISOString();
    const author = user?.name || user?.team || "Super Admin";

    // Update local state immediately
    setStateMap((prev) => {
      const updated = {
        ...prev,
        [id]: {
          ...(prev[id] || { id, action_name: id }),
          last_run_at: nowIso,
          last_run_by: author,
          details: { ...(prev[id]?.details || {}), ...details },
        },
      };
      try {
        localStorage.setItem("lcsim_automation_state", JSON.stringify(updated));
      } catch (_) { }
      return updated;
    });

    // Persist to Supabase
    try {
      await supabase.from("league_automation_state").upsert({
        id,
        action_name: stateMap[id]?.action_name || id,
        last_run_at: nowIso,
        last_run_by: author,
        details,
        updated_at: nowIso,
      });
    } catch (err) {
      console.error("Errore salvataggio timestamp automazione su DB:", err);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <RequireAuthPrompt
            title="Accesso Riservato Amministrazione"
            description="Questa sezione è accessibile solo agli amministratori della Lega LCSIM."
          />
        </main>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <main className="container mx-auto px-4 py-16 text-center max-w-xl">
          <div className="p-4 rounded-full bg-rose-500/10 text-rose-500 w-16 h-16 mx-auto mb-4 flex items-center justify-center border border-rose-500/20">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-black mb-2">Accesso Non Autorizzato</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Questa pagina è riservata esclusivamente al Super Admin di Lega. Per gestire la tua squadra, visita la sezione dedicata.
          </p>
          <Button asChild variant="outline">
            <a href="/mia-squadra/roster">Vai a La Mia Squadra</a>
          </Button>
        </main>
      </div>
    );
  }

  // Format timestamp helper
  const formatLastRun = (isoStr: string | null | undefined, author: string | null | undefined) => {
    if (!isoStr) return "Nessuna esecuzione registrata";
    try {
      const d = new Date(isoStr);
      const datePart = d.toLocaleDateString("it-IT", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      const timePart = d.toLocaleTimeString("it-IT", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      const byPart = author ? ` • ${author}` : "";
      return `${datePart} ore ${timePart}${byPart}`;
    } catch {
      return isoStr;
    }
  };

  // Handler: Export Master Table (full 21,067 rows vs 318 rows)
  const handleExport = async (fullMaster: boolean) => {
    const isFull = fullMaster;
    const setLoading = isFull ? setIsExportingFull : setIsExportingSnippet;

    try {
      setLoading(true);
      toast.info(
        isFull
          ? "Unione automatica del template master (21.067 righe) con i dati LCSIM da Supabase..."
          : "Estrazione delle 318 righe calciatori LCSIM da Supabase..."
      );

      const result = await exportEADatabaseTSV({ fullMaster: isFull });

      const blob = new Blob([result.content], { type: "text/tab-separated-values;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const dateStr = new Date().toISOString().slice(0, 10);

      // Filename: DB_NEW.txt is the default expected by EA FC 25
      link.href = url;
      link.download = isFull ? `DB_NEW.txt` : `DB_NEW_LCSIM_ROSTERS_${dateStr}.tsv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Record timestamp
      await recordAutomationRun("export_master_table", {
        type: isFull ? "full_master_export" : "lcsim_rosters_only",
        total_rows: result.totalRows,
        lcsim_rows: result.lcsimRowsCount,
        format: isFull ? "txt (EA FC 25)" : "tsv",
      });

      toast.success(
        isFull
          ? `File master DB_NEW.txt generato con successo! ${result.totalRows.toLocaleString()} calciatori inclusi con le 318 righe LCSIM aggiornate.`
          : `Estratto LCSIM esportato con successo! Scaricati ${result.lcsimRowsCount} calciatori e 137 colonne.`
      );
    } catch (err: any) {
      console.error("Errore export Master Table:", err);
      toast.error(err.message || "Errore durante l'esportazione della Master Table.");
    } finally {
      setLoading(false);
    }
  };

  // Handler: Patch custom external file
  const handlePatchFullFile = async () => {
    if (!patchFile) {
      toast.error("Seleziona prima il file master originale DB_NEW.txt");
      return;
    }
    try {
      setIsPatching(true);
      toast.info("Lettura e iniezione dei dati LCSIM nel file caricato...");

      const rawText = await patchFile.text();
      const result = await exportEADatabaseTSV({ baseTsvContent: rawText });

      const blob = new Blob([result.content], { type: "text/tab-separated-values;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `DB_NEW.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Record timestamp
      await recordAutomationRun("export_master_table", {
        type: "custom_file_patch",
        source_filename: patchFile.name,
        total_rows: result.totalRows,
        lcsim_rows: result.lcsimRowsCount,
      });

      toast.success(`File patchato con successo! ${result.totalRows.toLocaleString()} righe pronte per EA FC 25.`);
      setPatchModalOpen(false);
      setPatchFile(null);
    } catch (err: any) {
      console.error("Errore patching file master:", err);
      toast.error(err.message || "Errore durante il patching del file.");
    } finally {
      setIsPatching(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="container mx-auto px-4 py-8 space-y-8 max-w-7xl">
        {/* Header Broadcast */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-border/80">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge
                variant="outline"
                className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 font-bold px-2.5 py-0.5 text-[11px] uppercase tracking-wider flex items-center gap-1.5"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Pannello Admin • Lega Calcio Simulato
              </Badge>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight flex items-center gap-3">
              <Cpu className="h-8 w-8 text-amber-500" />
              Centro Automazioni di Lega
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
              Supervisione e avvio delle procedure batch di lega, controllo del mercato, congelamento rose ed esportazione del Master Database sincronizzato per EA Sports FC 25.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              onClick={() => handleExport(true)}
              disabled={isExportingFull || isExportingSnippet}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 shadow-md shadow-emerald-600/20"
            >
              <Download className="h-4 w-4" />
              {isExportingFull ? "Elaborazione..." : "Scarica players.txt Completo"}
            </Button>
          </div>
        </div>

        {/* Griglia Funzionalità Automazioni */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* 1. EXPORT MASTER TABLE */}
          <Card className="border-emerald-500/30 bg-gradient-to-br from-card via-card/95 to-emerald-500/5 shadow-lg relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
            <div>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-1">
                  <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> Auto-Merge Template Attivo
                  </Badge>
                  <FileSpreadsheet className="h-6 w-6 text-emerald-500" />
                </div>
                <CardTitle className="text-xl font-black">Export Master Database EA FC 25</CardTitle>
                <CardDescription className="text-xs">
                  Genera il file completo pronto per la cartella di EA FC 25 unendo automaticamente il database base con gli aggiornamenti LCSIM e i rookie.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3.5 rounded-xl bg-muted/60 border border-border/70 text-xs space-y-2">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-muted-foreground">Righe generate:</span>
                    <span className="font-mono font-bold text-foreground">21.067+ (EA FC 25 + Rookie aggiunti)</span>
                  </div>
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-muted-foreground">Calciatori & Rookie LCSIM:</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">Aggiornati in tempo reale da ea_player_db</span>
                  </div>
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-muted-foreground">Tracciato colonne:</span>
                    <span className="font-mono font-bold text-foreground">137 Colonne native EA FC 25</span>
                  </div>
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-muted-foreground">Destinazione file:</span>
                    <span className="font-mono text-muted-foreground text-[11px]">Cartella di gioco EA FC 25 (`players.txt`)</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-1">
                  <Button
                    onClick={() => handleExport(true)}
                    disabled={isExportingFull || isExportingSnippet}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 text-xs py-2.5 shadow-sm shadow-emerald-600/20"
                  >
                    <Download className="h-4 w-4" />
                    {isExportingFull ? "Elaborazione in corso..." : "Scarica Database Completo"}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => handleExport(false)}
                    disabled={isExportingFull || isExportingSnippet}
                    className="w-full border-border/80 hover:bg-muted text-foreground font-semibold gap-2 text-xs"
                  >
                    <FileText className="h-3.5 w-3.5 text-blue-500" />
                    {isExportingSnippet ? "Esportazione..." : "Scarica solo Calciatori LCSIM (.tsv)"}
                  </Button>
                </div>
              </CardContent>
            </div>

            {/* Timestamp Footer */}
            <div className="px-6 py-2.5 bg-muted/30 border-t border-border/60 text-[11px] flex items-center justify-between text-muted-foreground font-mono">
              <span className="flex items-center gap-1.5 font-sans">
                <Clock className="h-3.5 w-3.5 text-emerald-500" />
                Ultima esecuzione:
              </span>
              <span className="font-semibold text-foreground truncate max-w-[240px]">
                {formatLastRun(stateMap["export_master_table"]?.last_run_at, stateMap["export_master_table"]?.last_run_by)}
              </span>
            </div>
          </Card>

          {/* 2. IMPORTA CLASSE ROOKIE */}
          <Card className="border-blue-500/30 bg-gradient-to-br from-card via-card/95 to-blue-500/5 shadow-lg relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
            <div>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-1">
                  <Badge className="bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/40 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> Procedura Ufficiale Draft
                  </Badge>
                  <Users className="h-6 w-6 text-blue-500" />
                </div>
                <CardTitle className="text-xl font-black">Importa Classe Rookie</CardTitle>
                <CardDescription className="text-xs">
                  Carica i 2 file sincronizzati (Master Data 137 colonne + Anagrafica) per aggiungere i rookie alla Master Table e popolare la tabella an_rookie.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3.5 rounded-xl bg-muted/60 border border-border/70 text-xs space-y-2">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-muted-foreground">File 1 (Master Data):</span>
                    <span className="font-mono font-bold text-foreground">137 Colonne EA (Aggiunte a Master Table)</span>
                  </div>
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-muted-foreground">File 2 (Anagrafica):</span>
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400">4 Colonne (ID, Nome, Cognome, Squadra)</span>
                  </div>
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-muted-foreground">Destinazione Draft:</span>
                    <span className="font-mono font-bold text-foreground">Tabella public.an_rookie</span>
                  </div>
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-muted-foreground">Integrità archivio:</span>
                    <span className="font-mono text-muted-foreground text-[11px]">Nessuna sovrascrittura su calciatori attivi</span>
                  </div>
                </div>

                <div className="pt-1">
                  <Button
                    onClick={() => setRookieModalOpen(true)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2 text-xs py-2.5 shadow-sm shadow-blue-600/20"
                  >
                    <UploadCloud className="h-4 w-4" />
                    Avvia Importazione Classe Rookie (2 File)
                  </Button>
                </div>
              </CardContent>
            </div>

            {/* Timestamp Footer */}
            <div className="px-6 py-2.5 bg-muted/30 border-t border-border/60 text-[11px] flex items-center justify-between text-muted-foreground font-mono">
              <span className="flex items-center gap-1.5 font-sans">
                <Clock className="h-3.5 w-3.5 text-blue-500" />
                Ultima esecuzione:
              </span>
              <span className="font-semibold text-foreground truncate max-w-[240px]">
                {formatLastRun(stateMap["import_rookie_class"]?.last_run_at, stateMap["import_rookie_class"]?.last_run_by)}
              </span>
            </div>
          </Card>

          {/* 2. APPLICA INVECCHIAMENTI */}
          <Card className="border-border/80 bg-card shadow-md relative overflow-hidden flex flex-col justify-between">
            <div>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-1">
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] font-bold uppercase tracking-wider">
                    🟢 Stagione &amp; Ritiri • Operativo
                  </Badge>
                  <CalendarClock className="h-6 w-6 text-amber-500" />
                </div>
                <CardTitle className="text-xl font-black">Applica Invecchiamento Calciatori</CardTitle>
                <CardDescription className="text-xs">
                  Passaggio di stagione: incremento anagrafico (+1 anno), traslazione date EA FC 25, applicazione curve decadimento e annuncio ritiri.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border/70 text-xs text-muted-foreground space-y-1.5 leading-relaxed">
                  <p>
                    Aumenta l'età (+1) di tutti i calciatori attivi, adegua la data di nascita (DOB -365), applica le penalità fisiche/tecniche su 11 attributi agli over 30 (con soglia minima di salvaguardia a 30) e ufficializza i ritiri per chi compie 35 anni.
                  </p>
                  <p className="font-semibold text-foreground flex items-center gap-1.5 pt-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    Include anteprima interattiva dei decadimenti, elenco ritiri e pubblicazione automatica in bacheca.
                  </p>
                </div>

                <div className="pt-1">
                  <Button
                    variant="secondary"
                    onClick={() => setAgingModalOpen(true)}
                    className="w-full font-bold gap-2 text-xs hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 border border-amber-500/20"
                  >
                    <CalendarClock className="h-3.5 w-3.5 text-amber-500" />
                    Configura &amp; Applica Invecchiamento Calciatori
                  </Button>
                </div>
              </CardContent>
            </div>

            {/* Timestamp Footer */}
            <div className="px-6 py-2.5 bg-muted/30 border-t border-border/60 text-[11px] flex items-center justify-between text-muted-foreground font-mono">
              <span className="flex items-center gap-1.5 font-sans">
                <Clock className="h-3.5 w-3.5 text-amber-500" />
                Ultima esecuzione:
              </span>
              <span className="font-semibold text-foreground truncate max-w-[240px]">
                {formatLastRun(stateMap["aging_players"]?.last_run_at, stateMap["aging_players"]?.last_run_by)}
              </span>
            </div>
          </Card>

          {/* 3. START / STOP CALCIOMERCATO */}
          {(() => {
            const isMarketClosed = stateMap["market_toggle"]?.details?.status === "closed";
            return (
              <Card className={`bg-card shadow-md relative overflow-hidden flex flex-col justify-between transition-colors ${isMarketClosed ? "border-rose-500/40 bg-gradient-to-br from-card via-card to-rose-500/5" : "border-emerald-500/30 bg-gradient-to-br from-card via-card to-emerald-500/5"
                }`}>
                <div>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between mb-1">
                      <Badge
                        variant="outline"
                        className={
                          isMarketClosed
                            ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"
                            : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"
                        }
                      >
                        {isMarketClosed ? "🔴 Mercato di Lega Chiuso" : "🟢 Mercato di Lega Aperto"}
                      </Badge>
                      <Store className={`h-6 w-6 ${isMarketClosed ? "text-rose-500" : "text-emerald-500"}`} />
                    </div>
                    <CardTitle className="text-xl font-black">Controllo Finestra Calciomercato</CardTitle>
                    <CardDescription className="text-xs">
                      Interruttore generale per aprire o chiudere ufficialmente le trattative e le proposte di scambio tra squadre.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-3.5 rounded-xl bg-muted/40 border border-border/70 text-xs space-y-2">
                      <div className="flex items-center justify-between font-semibold">
                        <span className="text-muted-foreground">Stato attuale mercato:</span>
                        <Badge
                          className={
                            isMarketClosed
                              ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-[10px] font-bold uppercase tracking-wider"
                              : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider"
                          }
                        >
                          {isMarketClosed ? "CHIUSO" : "APERTO"}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground leading-relaxed">
                        {isMarketClosed
                          ? "Il mercato è CHIUSO: ai manager è impedito l'invio di nuove proposte e l'accettazione o il rifiuto delle offerte."
                          : "Il mercato è APERTO: tutti i club possono formulare nuove proposte e accettare o rifiutare le trattative."}
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                      <Button
                        variant={isMarketClosed ? "default" : "outline"}
                        onClick={async () => {
                          await recordAutomationRun("market_toggle", { status: "closed" });
                          toast.error("Finestra di Calciomercato CHIUSA. Proposte e trattative sospese per tutti i club.", {
                            icon: "🔒",
                          });
                        }}
                        className={`flex-1 font-bold gap-2 text-xs border-rose-500/30 hover:bg-rose-500/15 text-rose-600 dark:text-rose-400 ${isMarketClosed ? "bg-rose-500/15 border-rose-500/50 shadow-sm" : ""
                          }`}
                      >
                        <Lock className="h-3.5 w-3.5" />
                        Chiudi Mercato di Lega
                      </Button>

                      <Button
                        variant={!isMarketClosed ? "default" : "outline"}
                        onClick={async () => {
                          await recordAutomationRun("market_toggle", { status: "open" });
                          toast.success("Finestra di Calciomercato APERTA. Scambi e trattative abilitati per tutti i club.", {
                            icon: "🔓",
                          });
                        }}
                        className={`flex-1 font-bold gap-2 text-xs border-emerald-500/30 hover:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ${!isMarketClosed ? "bg-emerald-500/15 border-emerald-500/50 shadow-sm" : ""
                          }`}
                      >
                        <Unlock className="h-3.5 w-3.5" />
                        Apri Mercato di Lega
                      </Button>
                    </div>
                  </CardContent>
                </div>

                {/* Timestamp Footer */}
                <div className="px-6 py-2.5 bg-muted/30 border-t border-border/60 text-[11px] flex items-center justify-between text-muted-foreground font-mono">
                  <span className="flex items-center gap-1.5 font-sans">
                    <Clock className="h-3.5 w-3.5 text-blue-500" />
                    Ultima esecuzione:
                  </span>
                  <span className="font-semibold text-foreground truncate max-w-[240px]">
                    {formatLastRun(stateMap["market_toggle"]?.last_run_at, stateMap["market_toggle"]?.last_run_by)}
                  </span>
                </div>
              </Card>
            );
          })()}

          {/* 4. BLOCCA / SBLOCCA ROSE */}
          {(() => {
            const isRosterLocked = stateMap["roster_lock"]?.details?.status === "locked";
            return (
              <Card
                className={`border shadow-md relative overflow-hidden flex flex-col justify-between transition-all ${isRosterLocked
                  ? "border-rose-500/40 bg-gradient-to-br from-card via-card to-rose-500/5"
                  : "border-purple-500/30 bg-gradient-to-br from-card via-card to-purple-500/5"
                  }`}
              >
                <div>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between mb-1">
                      <Badge
                        variant="outline"
                        className={
                          isRosterLocked
                            ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"
                            : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"
                        }
                      >
                        {isRosterLocked ? "🔒 Rose di Lega Bloccate (Congelate)" : "🔓 Rose di Lega Sbloccate"}
                      </Badge>
                      <Lock className={`h-6 w-6 ${isRosterLocked ? "text-rose-500" : "text-purple-500"}`} />
                    </div>
                    <CardTitle className="text-xl font-black">Controllo Congelamento Rose</CardTitle>
                    <CardDescription className="text-xs">
                      Interruttore per congelare le rose di lega: impedisce la selezione/modifica dei tagli dei giocatori e il salvataggio di nuovi allenamenti.
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div
                      className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${isRosterLocked
                        ? "bg-rose-500/10 border-rose-500/20 text-rose-800 dark:text-rose-300"
                        : "bg-muted/40 border-border/70 text-muted-foreground"
                        }`}
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span>Stato Operazioni Rose:</span>
                        <span className="font-mono uppercase">
                          {isRosterLocked ? "Operazioni Sospese" : "Operazioni Abilitate"}
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed">
                        {isRosterLocked
                          ? "I manager non possono aggiungere o rimuovere calciatori dalla lista tagli in Roster, né salvare nuovi piani di allenamento."
                          : "Tutti i club possono liberamente modificare la lista tagli e salvare i piani di allenamento (attributi, ruoli e tratti)."}
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                      <Button
                        variant={isRosterLocked ? "default" : "outline"}
                        onClick={async () => {
                          await recordAutomationRun("roster_lock", { status: "locked" });
                          toast.error("Rose di Lega BLOCCATE. Tagli e salvataggio allenamenti sospesi per tutti i club.", {
                            icon: "🔒",
                          });
                        }}
                        className={`flex-1 font-bold gap-2 text-xs border-rose-500/30 hover:bg-rose-500/15 text-rose-600 dark:text-rose-400 ${isRosterLocked ? "bg-rose-500/15 border-rose-500/50 shadow-sm" : ""
                          }`}
                      >
                        <Lock className="h-3.5 w-3.5" />
                        Blocca Tutte le Rose
                      </Button>

                      <Button
                        variant={!isRosterLocked ? "default" : "outline"}
                        onClick={async () => {
                          await recordAutomationRun("roster_lock", { status: "unlocked" });
                          toast.success("Rose di Lega SBLOCCATE. Tagli e allenamenti nuovamente attivi.", {
                            icon: "🔓",
                          });
                        }}
                        className={`flex-1 font-bold gap-2 text-xs border-emerald-500/30 hover:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ${!isRosterLocked ? "bg-emerald-500/15 border-emerald-500/50 shadow-sm" : ""
                          }`}
                      >
                        <Unlock className="h-3.5 w-3.5" />
                        Sblocca Tutte le Rose
                      </Button>
                    </div>
                  </CardContent>
                </div>

                {/* Timestamp Footer */}
                <div className="px-6 py-2.5 bg-muted/30 border-t border-border/60 text-[11px] flex items-center justify-between text-muted-foreground font-mono">
                  <span className="flex items-center gap-1.5 font-sans">
                    <Clock className="h-3.5 w-3.5 text-purple-500" />
                    Ultima esecuzione:
                  </span>
                  <span className="font-semibold text-foreground truncate max-w-[240px]">
                    {formatLastRun(stateMap["roster_lock"]?.last_run_at, stateMap["roster_lock"]?.last_run_by)}
                  </span>
                </div>
              </Card>
            );
          })()}

          {/* 6. UFFICIALIZZA TAGLI DI LEGA */}
          <Card className="border-rose-500/30 bg-gradient-to-br from-card via-card/95 to-rose-500/5 shadow-lg relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
            <div>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-1">
                  {isLoadingCuts ? (
                    <Badge variant="outline" className="text-[10px] font-bold">
                      Verifica in corso...
                    </Badge>
                  ) : cutsReport?.nonCompliantTeams && cutsReport.nonCompliantTeams.length > 0 ? (
                    <Badge variant="destructive" className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> Inadempienze ({cutsReport.nonCompliantTeams.length})
                    </Badge>
                  ) : cutsReport?.allCompliant ? (
                    <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Tutte le Squadre in Regola
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] font-bold">
                      Nessun Taglio
                    </Badge>
                  )}
                  <Scissors className="h-6 w-6 text-rose-500" />
                </div>
                <CardTitle className="text-xl font-black">Ufficializza Tagli di Lega</CardTitle>
                <CardDescription className="text-xs">
                  Svincola definitivamente i calciatori inseriti nelle liste tagli dai club, azzera le posizioni tattiche e pubblica l'annuncio ufficiale.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3.5 rounded-xl bg-muted/60 border border-border/70 text-xs space-y-2">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-muted-foreground">Parametri rosa post-tagli:</span>
                    <span className="font-mono font-bold text-foreground">13-16 giocatori, max 21 asset (giocatori + pick), min. 2 portieri</span>
                  </div>
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-muted-foreground">Calciatori in lista tagli:</span>
                    <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                      {cutsReport?.totalCuts || 0} totali
                    </span>
                  </div>
                </div>

                {isLoadingCuts ? (
                  <div className="flex items-center justify-center p-4 text-xs text-muted-foreground gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verifica tagli delle squadre...
                  </div>
                ) : cutsReport && cutsReport.nonCompliantTeams.length > 0 ? (
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-destructive flex items-center justify-between">
                      <span>Squadre Inadempienti:</span>
                      <Badge variant="outline" className="text-[10px] text-destructive border-destructive/40 font-mono">
                        {cutsReport.nonCompliantTeams.length} su {cutsReport.teams.length}
                      </Badge>
                    </div>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {cutsReport.nonCompliantTeams.map((team) => (
                        <div
                          key={team.teamId}
                          className="flex items-center justify-between p-2 rounded-lg bg-destructive/10 border border-destructive/20 text-xs"
                        >
                          <div className="flex flex-col min-w-0 pr-2">
                            <span className="font-bold text-foreground truncate">{team.teamName}</span>
                            {team.postGk !== undefined && team.postGk < 2 && (
                              <span className="text-[10px] text-destructive font-semibold">
                                Meno di 2 portieri rimasti ({team.postGk} POR)
                              </span>
                            )}
                            {team.assetReason && (
                              <span className="text-[10px] text-destructive font-semibold">
                                {team.assetReason}
                              </span>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-mono font-bold text-destructive block">
                              Tagliati: {team.cutsCount}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              Rosa: {team.postRoster} (POR: {team.postGk}) • Asset: {team.postAssets}/21
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] text-muted-foreground italic">
                      L'ufficializzazione è bloccata finché tutte le squadre non avranno, dopo i tagli, tra 13 e 16 giocatori, al massimo 21 asset tra giocatori e scelte draft, e almeno 2 portieri.
                    </p>
                    <Button
                      disabled={true}
                      className="w-full bg-muted text-muted-foreground cursor-not-allowed font-bold gap-2 text-xs py-2.5"
                    >
                      <Scissors className="h-4 w-4" />
                      Ufficializza Tagli (In attesa delle squadre)
                    </Button>
                  </div>
                ) : cutsReport && cutsReport.allCompliant ? (
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        Tutte le {cutsReport.teams.length} squadre sono in regola!
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Pronte allo svincolo: <strong>{cutsReport.totalCuts} calciatori</strong> da rimuovere definitivamente dalle rose.
                      </p>
                    </div>

                    <Button
                      onClick={() => setCutsConfirmOpen(true)}
                      disabled={isExecutingCuts}
                      className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold gap-2 text-xs py-2.5 shadow-sm shadow-rose-600/20"
                    >
                      {isExecutingCuts ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Svincolo in corso...
                        </>
                      ) : (
                        <>
                          <Scissors className="h-4 w-4" />
                          Ufficializza Tagli ({cutsReport.totalCuts} Calciatori)
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-muted/50 border border-border/70 text-xs text-muted-foreground">
                      Nessun calciatore inserito nella lista tagli al momento.
                    </div>
                    <Button
                      disabled={true}
                      className="w-full bg-muted text-muted-foreground cursor-not-allowed font-bold gap-2 text-xs py-2.5"
                    >
                      <Scissors className="h-4 w-4" />
                      Nessun Taglio da Ufficializzare
                    </Button>
                  </div>
                )}
              </CardContent>
            </div>

            {/* Timestamp Footer */}
            <div className="px-6 py-2.5 bg-muted/30 border-t border-border/60 text-[11px] flex items-center justify-between text-muted-foreground font-mono">
              <span className="flex items-center gap-1.5 font-sans">
                <Clock className="h-3.5 w-3.5 text-rose-500" />
                Ultima esecuzione:
              </span>
              <span className="font-semibold text-foreground truncate max-w-[240px]">
                {formatLastRun(stateMap["official_cuts"]?.last_run_at, stateMap["official_cuts"]?.last_run_by)}
              </span>
            </div>
          </Card>

          {/* 7. SALA STAMPA & GIORNALISTA AI */}
          <Card className="border border-amber-500/30 bg-gradient-to-br from-card via-card to-amber-500/5 shadow-md relative overflow-hidden flex flex-col justify-between">
            <div>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-1">
                  <Badge variant="outline" className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Agente AI Gratuito & Media
                  </Badge>
                  <Newspaper className="h-6 w-6 text-amber-500" />
                </div>
                <CardTitle className="text-xl font-black">Sala Stampa & Giornalista AI</CardTitle>
                <CardDescription className="text-xs">
                  Generazione delle interviste di giornata per i presidenti dei 12 club e pubblicazione rumor di calciomercato.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="p-3.5 rounded-xl border border-border/70 bg-muted/40 text-xs space-y-1.5 text-muted-foreground">
                  <div className="flex items-center justify-between font-bold text-foreground">
                    <span>Modello Attivo:</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400">
                      Google Gemini Flash / Procedurale
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Le domande vengono generate ad ogni nuovo turno in base al rendimento e alla prossima avversaria. I rumor vengono generati randomicamente quando il mercato è aperto.
                  </p>
                </div>

                <div className="pt-1">
                  <Button
                    variant="outline"
                    onClick={async () => {
                      toast.info("Generazione domande personalizzate per i 12 club in corso...");
                      const res = await generatePressQuestionsForMatchday(1);
                      if (res.error) toast.error(res.error);
                      else toast.success(`Generate ${res.generated} domande differenziate (${res.skipped} già presenti).`);
                    }}
                    className="w-full font-bold gap-2 text-xs border-primary/30 hover:bg-primary/10 text-primary py-2.5"
                  >
                    <Mic2 className="h-4 w-4" />
                    Genera Domande Differenziate per i 12 Club (Giornata 1)
                  </Button>
                </div>

                <Button
                  asChild
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold gap-2 text-xs py-2.5 shadow-sm shadow-amber-600/20"
                >
                  <Link to="/sala-stampa">
                    <Newspaper className="h-4 w-4" />
                    Vai alla Sala Stampa & Media Hub
                  </Link>
                </Button>
              </CardContent>
            </div>

            {/* Timestamp Footer */}
            <div className="px-6 py-2.5 bg-muted/30 border-t border-border/60 text-[11px] flex items-center justify-between text-muted-foreground font-mono">
              <span className="flex items-center gap-1.5 font-sans">
                <Clock className="h-3.5 w-3.5 text-amber-500" />
                Stato Feed:
              </span>
              <span className="font-semibold text-foreground">
                Attivo & Realtime
              </span>
            </div>
          </Card>

        </div>

        {/* Informazioni Architettura Master Table */}
        <div className="rounded-2xl border border-border/70 bg-card/60 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-foreground">Sincronizzazione Bidirezionale EA Sports FC 25 Attiva</div>
              <div className="text-xs text-muted-foreground">
                Tutte le modifiche salvate in Allenamenti, Rosa e Tattica aggiornano in tempo reale la tabella master <code className="text-foreground font-mono bg-muted px-1.5 py-0.5 rounded">ea_player_db</code>.
              </div>
            </div>
          </div>
          <Badge variant="outline" className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400 border-emerald-500/30 shrink-0">
            Trigger SQL Sincronizzati
          </Badge>
        </div>
      </main>

      {/* DIALOG: PATCH FILE MASTER PERSONALIZZATO */}
      <Dialog open={patchModalOpen} onOpenChange={setPatchModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-black">
              <UploadCloud className="h-5 w-5 text-emerald-500" />
              Patcha File Master Esterno (.txt)
            </DialogTitle>
            <DialogDescription className="text-xs">
              Carica una versione personalizzata di <code className="font-mono font-bold">DB_NEW.txt</code>: il sistema inietterà istantaneamente i 318 calciatori aggiornati della Lega e scaricherà il file pronto per il gioco.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-emerald-500/50 transition-colors">
              <input
                type="file"
                id="patchFileInput"
                accept=".txt,.tsv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setPatchFile(file);
                }}
              />
              <label htmlFor="patchFileInput" className="cursor-pointer flex flex-col items-center gap-2">
                <FileText className="h-8 w-8 text-muted-foreground" />
                <span className="text-xs font-bold text-foreground">
                  {patchFile ? patchFile.name : "Clicca per selezionare un file .txt / .tsv"}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Formato accettato: .txt / .tsv (separato da tabulazione)
                </span>
              </label>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setPatchModalOpen(false)}>
              Annulla
            </Button>
            <Button
              onClick={handlePatchFullFile}
              disabled={!patchFile || isPatching}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              {isPatching ? "Elaborazione..." : "Inietta & Scarica DB Completo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODALE: IMPORTA CLASSE ROOKIE */}
      <ImportRookieModal
        open={rookieModalOpen}
        onOpenChange={setRookieModalOpen}
        onSuccess={loadAutomationStates}
        authorName={user?.name || user?.team || "Super Admin"}
      />

      {/* MODALE: INVECCHIAMENTO CALCIATORI & GESTIONE RITIRI */}
      <AgingModal
        open={agingModalOpen}
        onOpenChange={setAgingModalOpen}
        onSuccess={async () => {
          await loadAutomationStates();
          await queryClient.invalidateQueries({ queryKey: ["cuts_compliance_report"] });
          await queryClient.invalidateQueries({ queryKey: ["players"] });
        }}
        authorName={user?.name || user?.team || "Super Admin"}
      />

      {/* DIALOG: INFO PUNTO APERTO PLACEHOLDER */}
      <Dialog open={!!infoModal} onOpenChange={(open) => !open && setInfoModal(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-black">
              <Info className="h-5 w-5 text-amber-500" />
              {infoModal?.title}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {infoModal?.description}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2.5 py-2">
            {infoModal?.points.map((pt, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs text-foreground bg-muted/50 p-2.5 rounded-lg border border-border/60">
                <div className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                <span className="leading-relaxed">{pt}</span>
              </div>
            ))}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button onClick={() => setInfoModal(null)} variant="outline">
              Chiudi
            </Button>
            {infoModal?.actionLabel && (
              <Button
                onClick={() => {
                  if (infoModal.id && infoModal.detailsToRecord) {
                    recordAutomationRun(infoModal.id, infoModal.detailsToRecord);
                    toast.success("Timestamp aggiornato con successo!");
                  }
                  setInfoModal(null);
                }}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs"
              >
                {infoModal.actionLabel}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG: CONFERMA UFFICIALIZZAZIONE TAGLI */}
      <Dialog open={cutsConfirmOpen} onOpenChange={setCutsConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-black">
              <Scissors className="h-5 w-5 text-rose-500" />
              Ufficializza Tagli di Lega
            </DialogTitle>
            <DialogDescription className="text-xs">
              Confermi lo svincolo definitivo dei calciatori inseriti nelle liste tagli di tutti i club?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" />
                Operazione Irreversibile
              </div>
              <p className="text-[11px] leading-relaxed">
                Verranno svincolati <strong>{cutsReport?.totalCuts} calciatori</strong>. I giocatori non apparterranno più ad alcun club (Squadra = NULL) e le posizioni titolari o in panchina verranno ripristinate a NULL.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-muted border border-border/70 space-y-1.5 text-muted-foreground">
              <div className="font-semibold text-foreground">Operazioni automatiche incluse:</div>
              <ul className="list-disc list-inside space-y-1 text-[11px]">
                <li>Aggiornamento anagrafica giocatori (Squadra e Numero Maglia azzerati)</li>
                <li>Rimozione dei giocatori svincolati dalla tabella di mercato (as_player_market)</li>
                <li>Pulizia formazioni titolari e panchina in an_team_tactic</li>
                <li>Pubblicazione annuncio ufficiale di svincolo nella bacheca di Lega</li>
                <li>Svuotamento registro dei tagli di lega</li>
              </ul>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setCutsConfirmOpen(false)} disabled={isExecutingCuts}>
              Annulla
            </Button>
            <Button
              onClick={handleExecuteOfficialCuts}
              disabled={isExecutingCuts}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              {isExecutingCuts ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  Ufficializzazione in corso...
                </>
              ) : (
                "Conferma Ufficializzazione"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

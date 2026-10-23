import { useState, useEffect } from "react";
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
  CheckCircle2
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/supabaseClient";
import { exportEADatabaseTSV } from "@/services/eaPlayerDbService";

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

  // Fetch automation states on load
  useEffect(() => {
    async function loadAutomationStates() {
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
        // Fallback localStorage
        try {
          const raw = localStorage.getItem("lcsim_automation_state");
          if (raw) setStateMap(JSON.parse(raw));
        } catch (_) {}
      } finally {
        setIsLoadingState(false);
      }
    }

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
      } catch (_) {}
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
                Pannello Super Admin • Lega Calcio Simulato
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
              {isExportingFull ? "Elaborazione..." : "Scarica DB_NEW.txt Completo"}
            </Button>
          </div>
        </div>

        {/* Griglia Funzionalità Automazioni */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* 1. EXPORT MASTER TABLE (OPERATIVO - OPZIONE B) */}
          <Card className="border-emerald-500/30 bg-gradient-to-br from-card via-card/95 to-emerald-500/5 shadow-lg relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
            <div>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-1">
                  <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> Auto-Merge Template Attivo (Opzione B)
                  </Badge>
                  <FileSpreadsheet className="h-6 w-6 text-emerald-500" />
                </div>
                <CardTitle className="text-xl font-black">Export Master Database EA FC 25</CardTitle>
                <CardDescription className="text-xs">
                  Genera il file completo pronto per la cartella di EA FC 25 unendo automaticamente il database base con gli aggiornamenti LCSIM.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3.5 rounded-xl bg-muted/60 border border-border/70 text-xs space-y-2">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-muted-foreground">Righe totali generate:</span>
                    <span className="font-mono font-bold text-foreground">21.067 (Tutto il gioco EA FC 25)</span>
                  </div>
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-muted-foreground">Calciatori LCSIM iniettati:</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">318 aggiornati in tempo reale</span>
                  </div>
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-muted-foreground">Tracciato colonne:</span>
                    <span className="font-mono font-bold text-foreground">137 Colonne native EA FC 25</span>
                  </div>
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-muted-foreground">Destinazione file:</span>
                    <span className="font-mono text-muted-foreground text-[11px]">Cartella di gioco EA FC 25 (`DB_NEW.txt`)</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-1">
                  <Button
                    onClick={() => handleExport(true)}
                    disabled={isExportingFull || isExportingSnippet}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 text-xs py-2.5 shadow-sm"
                  >
                    <Download className="h-4 w-4" />
                    {isExportingFull ? "Elaborazione in corso..." : "Scarica Database Completo (21.067 righe per EA FC 25)"}
                  </Button>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleExport(false)}
                      disabled={isExportingFull || isExportingSnippet}
                      className="flex-1 border-border/80 hover:bg-muted text-foreground font-semibold gap-2 text-xs"
                    >
                      <FileText className="h-3.5 w-3.5 text-blue-500" />
                      {isExportingSnippet ? "Esportazione..." : "Scarica solo 318 Calciatori LCSIM (.tsv)"}
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => setPatchModalOpen(true)}
                      className="border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold gap-2 text-xs"
                    >
                      <UploadCloud className="h-3.5 w-3.5" />
                      Patcha File Personalizzato
                    </Button>
                  </div>
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

          {/* 2. APPLICA INVECCHIAMENTI */}
          <Card className="border-border/80 bg-card shadow-md relative overflow-hidden flex flex-col justify-between">
            <div>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-1">
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] font-bold uppercase tracking-wider">
                    🟡 In Definizione • Punto Aperto #10
                  </Badge>
                  <CalendarClock className="h-6 w-6 text-amber-500" />
                </div>
                <CardTitle className="text-xl font-black">Applica Invecchiamento Calciatori</CardTitle>
                <CardDescription className="text-xs">
                  Passaggio di stagione: incremento anagrafico (+1 anno), traslazione date e applicazione curve di sviluppo/declino.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border/70 text-xs text-muted-foreground space-y-1.5 leading-relaxed">
                  <p>
                    Aumenta l'età di tutti i calciatori registrati e applica le variazioni sugli attributi fisici e tecnici in base alla fascia d'età (Giovani, Prime, Declino e Veterani).
                  </p>
                  <p className="font-semibold text-foreground flex items-center gap-1.5 pt-1">
                    <Info className="h-3.5 w-3.5 text-amber-500" />
                    Procedura batch da discutere e definire nei dettagli di regolamento.
                  </p>
                </div>

                <div className="pt-1">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      recordAutomationRun("aging_players", { note: "Richiesta consultazione parametri invecchiamento" });
                      setInfoModal({
                        id: "aging_players",
                        title: "Applica Invecchiamento Calciatori (Punto Aperto #10)",
                        description:
                          "La procedura automatizzata di invecchiamento è registrata nel backlog tecnico e sarà discussa con l'utente per definire i parametri esatti:",
                        puntoApertoIndex: 10,
                        points: [
                          "Incremento anagrafico di 1 anno per tutti i giocatori attivi (Età + 1).",
                          "Sfasamento giorni birthdate per mantenere l'allineamento con EA FC 25.",
                          "Curve di decadimento attributi (perdita velocità, accelerazione e resistenza per over 30).",
                          "Soglia di ritiro automatico e assegnazione dello status 'RITIRATO'.",
                          "Snapshot preventivo di sicurezza per reversibilità dell'operazione."
                        ],
                        actionLabel: "Registra Test Invecchiamento",
                        detailsToRecord: { test_triggered: true }
                      });
                    }}
                    className="w-full font-bold gap-2 text-xs"
                  >
                    <CalendarClock className="h-3.5 w-3.5 text-amber-500" />
                    Avvia Invecchiamento Calciatori (Dettagli)
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
          <Card className="border-border/80 bg-card shadow-md relative overflow-hidden flex flex-col justify-between">
            <div>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-1">
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] font-bold uppercase tracking-wider">
                    🟡 In Definizione • Punto Aperto #11
                  </Badge>
                  <Store className="h-6 w-6 text-blue-500" />
                </div>
                <CardTitle className="text-xl font-black">Controllo Finestra Calciomercato</CardTitle>
                <CardDescription className="text-xs">
                  Interruttore generale per aprire o chiudere ufficialmente le trattative, gli scambi e i tagli calciatore.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border/70 text-xs space-y-2">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-muted-foreground">Stato attuale mercato:</span>
                    <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                      {stateMap["market_toggle"]?.details?.status === "closed" ? "CHIUSO" : "APERTO (Predefinito)"}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    Quando il mercato è chiuso, i manager non possono inviare o accettare scambi e i tagli sono disabilitati.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                  <Button
                    variant="outline"
                    onClick={() => {
                      recordAutomationRun("market_toggle", { action: "close_market_clicked" });
                      setInfoModal({
                        id: "market_toggle",
                        title: "Chiusura Calciomercato (Punto Aperto #11)",
                        description:
                          "La gestione dello stato del calciomercato è registrata nel backlog tecnico e sarà discussa con l'utente per definire i parametri esatti:",
                        puntoApertoIndex: 11,
                        points: [
                          "Blocco dell'invio/accettazione trattative in /mia-squadra/trattative a mercato chiuso.",
                          "Blocco dei tagli giocatori in /mia-squadra/roster a mercato chiuso.",
                          "Countdown automatico alla scadenza della finestra di mercato per tutti gli utenti.",
                          "Permessi straordinari per l'Admin di forzare operazioni anche a mercato chiuso."
                        ],
                        actionLabel: "Imposta Stato Chiuso (Test)",
                        detailsToRecord: { status: "closed" }
                      });
                    }}
                    className="flex-1 font-bold gap-2 text-xs border-rose-500/30 hover:bg-rose-500/10 text-rose-600 dark:text-rose-400"
                  >
                    <Lock className="h-3.5 w-3.5" />
                    Chiudi Mercato di Lega
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      recordAutomationRun("market_toggle", { action: "open_market_clicked" });
                      setInfoModal({
                        id: "market_toggle",
                        title: "Apertura Calciomercato (Punto Aperto #11)",
                        description:
                          "La gestione dello stato del calciomercato è registrata nel backlog tecnico e sarà discussa con l'utente per definire i parametri esatti:",
                        puntoApertoIndex: 11,
                        points: [
                          "Apertura ufficiale con notifica broadcast e banner globale per tutti i manager.",
                          "Abilitazione scambi giocatori, scelte draft e tagli compensativi.",
                          "Impostazione data di termine sessione."
                        ],
                        actionLabel: "Imposta Stato Aperto (Test)",
                        detailsToRecord: { status: "open" }
                      });
                    }}
                    className="flex-1 font-bold gap-2 text-xs border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
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

          {/* 4. BLOCCA / SBLOCCA ROSE */}
          <Card className="border-border/80 bg-card shadow-md relative overflow-hidden flex flex-col justify-between">
            <div>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-1">
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] font-bold uppercase tracking-wider">
                    🟡 In Definizione • Punto Aperto #12
                  </Badge>
                  <Lock className="h-6 w-6 text-purple-500" />
                </div>
                <CardTitle className="text-xl font-black">Blocco / Sblocco Rose</CardTitle>
                <CardDescription className="text-xs">
                  Congelamento istantaneo delle rose prima delle simulazioni di giornata per prevenire modifiche durante le partite.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border/70 text-xs space-y-2">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-muted-foreground">Stato attuale rose:</span>
                    <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 text-[10px] font-bold">
                      {stateMap["roster_lock"]?.details?.status === "locked" ? "BLOCCATE" : "SBLOCCATE (Modificabili)"}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    Blocca numeri di maglia, divise, ruoli e formazioni durante lo svolgimento dei match settimanali.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                  <Button
                    variant="outline"
                    onClick={() => {
                      recordAutomationRun("roster_lock", { action: "lock_rosters_clicked" });
                      setInfoModal({
                        id: "roster_lock",
                        title: "Blocco Rose di Lega (Punto Aperto #12)",
                        description:
                          "La funzionalità di congelamento rose è registrata nel backlog tecnico e sarà discussa con l'utente per definire i parametri esatti:",
                        puntoApertoIndex: 12,
                        points: [
                          "Congelamento modifiche roster (numeri di maglia, cambi ruolo, accessori).",
                          "Rapporto con le scadenze formazioni (league_deadlines): blocco manuale o automatico.",
                          "Banner esplicito per i manager nelle pagine Roster e Tattica.",
                          "Sblocco automatico al termine della pubblicazione dei risultati settimanali."
                        ],
                        actionLabel: "Imposta Stato Bloccato (Test)",
                        detailsToRecord: { status: "locked" }
                      });
                    }}
                    className="flex-1 font-bold gap-2 text-xs border-purple-500/30 hover:bg-purple-500/10 text-purple-600 dark:text-purple-400"
                  >
                    <Lock className="h-3.5 w-3.5" />
                    Blocca Tutte le Rose
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      recordAutomationRun("roster_lock", { action: "unlock_rosters_clicked" });
                      setInfoModal({
                        id: "roster_lock",
                        title: "Sblocco Rose di Lega (Punto Aperto #12)",
                        description:
                          "La funzionalità di congelamento rose è registrata nel backlog tecnico e sarà discussa con l'utente per definire i parametri esatti:",
                        puntoApertoIndex: 12,
                        points: [
                          "Ripristino dei permessi di modifica per tutti i manager dei club.",
                          "Aggiornamento indicatori di stato nella navbar e nelle rose."
                        ],
                        actionLabel: "Imposta Stato Sbloccato (Test)",
                        detailsToRecord: { status: "unlocked" }
                      });
                    }}
                    className="flex-1 font-bold gap-2 text-xs border-blue-500/30 hover:bg-blue-500/10 text-blue-600 dark:text-blue-400"
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
    </div>
  );
}

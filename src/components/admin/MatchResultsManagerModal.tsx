import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Camera,
  FolderUp,
  FileSpreadsheet,
  Download,
  Upload,
  Save,
  Unlock,
  Lock,
  Clock,
  CheckCircle2,
  Loader2,
  Sparkles,
  Shield,
  Users,
  BarChart3,
  Calendar as CalendarIcon,
  Award,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import {
  AdminScheduleMatchSummary,
  AdminMatchFullReport,
  AdminTeamStatDraft,
  AdminPlayerStatDraft,
  ScreenshotProgress,
  fetchAvailableSeasons,
  fetchAdminSeasonSchedule,
  fetchAdminMatchReport,
  saveAdminMatchReport,
  updateAdminMatchSchedule,
  processMatchScreenshots,
  exportMatchReportToCSV,
  importMatchReportFromCSV,
} from "@/services/matchStatsImportService";
import { useSchedule } from "@/context/ScheduleContext";
import { useQueryClient } from "@tanstack/react-query";

interface MatchResultsManagerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  adminName: string;
  onSaved?: () => void;
}

function computePreviewUnlockDisplay(dateStr: string, timeStr: string): string {
  if (!dateStr) return "N/D";
  const cleanTime = /^\d{1,2}:\d{2}$/.test((timeStr || "").trim()) ? timeStr.trim() : "21:00";
  const dt = new Date(`${dateStr}T${cleanTime}:00`);
  if (isNaN(dt.getTime())) return "N/D";
  const unlock = new Date(dt.getTime() + 45 * 60 * 1000);
  return unlock.toLocaleString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MatchResultsManagerModal({
  open,
  onOpenChange,
  adminName,
  onSaved,
}: MatchResultsManagerModalProps) {
  const { reloadSchedule } = useSchedule();
  const queryClient = useQueryClient();

  const [seasons, setSeasons] = useState<number[]>([10, 11]);
  const [selectedSeason, setSelectedSeason] = useState<number>(10);
  const [scheduleList, setScheduleList] = useState<AdminScheduleMatchSummary[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [selectedMatchKey, setSelectedMatchKey] = useState<string>("");

  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);
  const [savingReport, setSavingReport] = useState(false);

  const [report, setReport] = useState<AdminMatchFullReport | null>(null);
  const [activeEditorTab, setActiveEditorTab] = useState<string>("team");

  // Screenshot OCR state
  const [isProcessingScreenshots, setIsProcessingScreenshots] = useState(false);
  const [ocrProgress, setOcrProgress] = useState<ScreenshotProgress | null>(null);
  const [lastExtractionSummary, setLastExtractionSummary] = useState<string | null>(null);

  const folderInputRef = useRef<HTMLInputElement | null>(null);
  const filesInputRef = useRef<HTMLInputElement | null>(null);
  const csvInputRef = useRef<HTMLInputElement | null>(null);

  // Carica stagioni disponibili all'apertura
  useEffect(() => {
    if (!open) return;
    fetchAvailableSeasons().then((list) => {
      setSeasons(list);
      if (list.length > 0 && !list.includes(selectedSeason)) {
        setSelectedSeason(list[0]);
      }
    });
  }, [open]);

  // Carica calendario della stagione selezionata
  const loadSeasonSchedule = async (stag: number, keepMatchKey?: string) => {
    setLoadingSchedule(true);
    try {
      const list = await fetchAdminSeasonSchedule(stag);
      setScheduleList(list);
      if (list.length > 0) {
        const weeks = Array.from(new Set(list.map((m) => m.week))).sort((a, b) => a - b);
        const targetWeek = weeks.includes(selectedWeek) ? selectedWeek : weeks[0];
        setSelectedWeek(targetWeek);
        const weekMatches = list.filter((m) => m.week === targetWeek);
        if (keepMatchKey && list.some((m) => `${m.week}_${m.home}_${m.away}` === keepMatchKey)) {
          setSelectedMatchKey(keepMatchKey);
        } else if (weekMatches.length > 0) {
          setSelectedMatchKey(`${weekMatches[0].week}_${weekMatches[0].home}_${weekMatches[0].away}`);
        }
      } else {
        setReport(null);
      }
    } catch (err: any) {
      toast.error(err.message || "Errore caricamento calendario Admin");
    } finally {
      setLoadingSchedule(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadSeasonSchedule(selectedSeason);
    }
  }, [open, selectedSeason]);

  const weeksAvailable = useMemo(() => {
    return Array.from(new Set(scheduleList.map((m) => m.week))).sort((a, b) => a - b);
  }, [scheduleList]);

  const matchesInSelectedWeek = useMemo(() => {
    return scheduleList.filter((m) => m.week === selectedWeek);
  }, [scheduleList, selectedWeek]);

  const activeMatchSummary = useMemo(() => {
    return (
      scheduleList.find((m) => `${m.week}_${m.home}_${m.away}` === selectedMatchKey) || null
    );
  }, [scheduleList, selectedMatchKey]);

  // Carica il report completo quando cambia il match selezionato
  useEffect(() => {
    if (!open || !activeMatchSummary) {
      setReport(null);
      return;
    }
    let mounted = true;
    setLoadingReport(true);
    setLastExtractionSummary(null);
    fetchAdminMatchReport(activeMatchSummary)
      .then((rep) => {
        if (mounted) setReport(rep);
      })
      .catch((err) => {
        toast.error(err.message || "Errore caricamento tabellino partita");
      })
      .finally(() => {
        if (mounted) setLoadingReport(false);
      });
    return () => {
      mounted = false;
    };
  }, [open, selectedMatchKey]);

  // Handler selezione giornata
  const handleSelectWeek = (w: number) => {
    setSelectedWeek(w);
    const wm = scheduleList.filter((m) => m.week === w);
    if (wm.length > 0) {
      setSelectedMatchKey(`${wm[0].week}_${wm[0].home}_${wm[0].away}`);
    }
  };

  // Handler elaborazione Screenshot (32 o 422+)
  const handleScreenshotsSelected = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0 || !report) return;
    const files = Array.from(fileList);
    setIsProcessingScreenshots(true);
    setLastExtractionSummary(null);
    try {
      toast.info(`Avvio analisi di ${files.length} screenshot EA Sports FC 25...`);
      const { report: updatedReport, summaryText } = await processMatchScreenshots(
        files,
        report,
        (prog) => setOcrProgress(prog)
      );
      setReport(updatedReport);
      setLastExtractionSummary(summaryText);
      toast.success("Screenshot elaborati con successo! Verifica i dati nella griglia e salva.");
    } catch (err: any) {
      console.error("Errore elaborazione screenshot:", err);
      toast.error(err.message || "Errore durante l'analisi degli screenshot.");
    } finally {
      setIsProcessingScreenshots(false);
      setOcrProgress(null);
      if (folderInputRef.current) folderInputRef.current.value = "";
      if (filesInputRef.current) filesInputRef.current.value = "";
    }
  };

  // Handler Export CSV (#27)
  const handleExportCSV = () => {
    if (!report) return;
    const csvContent = exportMatchReportToCSV(report);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `LCSIM_S${report.schedule.stag}_W${report.schedule.week}_${report.schedule.home}_${report.schedule.away}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("File CSV del referto esportato con successo!");
  };

  // Handler Import CSV (#1 & #27)
  const handleImportCSV = async (file: File | undefined) => {
    if (!file || !report) return;
    try {
      const text = await file.text();
      const updated = importMatchReportFromCSV(text, report);
      setReport(updated);
      setLastExtractionSummary(`Importato file CSV "${file.name}" con successo.`);
      toast.success("Statistiche importate dal file CSV! Verifica e clicca Salva.");
    } catch (err: any) {
      toast.error(err.message || "Errore durante la lettura del file CSV.");
    } finally {
      if (csvInputRef.current) csvInputRef.current.value = "";
    }
  };

  // Handler Salvataggio su DB
  const handleSaveReport = async (forceUnlockNow = false) => {
    if (!report) return;
    setSavingReport(true);
    try {
      const res = await saveAdminMatchReport(report, adminName, forceUnlockNow);
      if (!res.success) {
        throw new Error(res.error || "Salvataggio non riuscito");
      }

      if (res.is_unlocked_now) {
        toast.success(
          `Referto ${report.schedule.home} ${report.homeTeamStat.GOL}-${report.awayTeamStat.GOL} ${report.schedule.away} salvato e SBLOCCATO pubblicamente! (${res.players_saved} giocatori a referto)`
        );
      } else {
        const unlockFormatted = res.unlock_at
          ? new Date(res.unlock_at).toLocaleString("it-IT", {
              day: "2-digit",
              month: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "";
        toast.success(
          `Referto salvato in EMBARGO! Verrà sbloccato automaticamente il ${unlockFormatted} (+45' dall'inizio gara).`,
          { icon: "🔒" }
        );
      }

      await loadSeasonSchedule(selectedSeason, selectedMatchKey);
      await reloadSchedule();
      await queryClient.invalidateQueries();
      onSaved?.();
    } catch (err: any) {
      toast.error(err.message || "Errore durante il salvataggio del referto");
    } finally {
      setSavingReport(false);
    }
  };

  // Handler aggiornamento solo Data/Ora o Sblocco immediato
  const handleQuickUpdateSchedule = async (forceUnlock = false) => {
    if (!report) return;
    setSavingReport(true);
    try {
      const res = await updateAdminMatchSchedule(
        report.schedule.stag,
        report.schedule.week,
        report.schedule.home,
        report.schedule.away,
        report.schedule.date,
        report.schedule.match_time,
        forceUnlock
      );
      if (!res.success) throw new Error(res.error);
      toast.success(
        forceUnlock
          ? "Partita sbloccata immediatamente! Ora è visibile nel Calendario e in Classifica."
          : `Orario partita aggiornato! Sblocco programmato: ${computePreviewUnlockDisplay(
              report.schedule.date,
              report.schedule.match_time
            )}`
      );
      await loadSeasonSchedule(selectedSeason, selectedMatchKey);
      await reloadSchedule();
      await queryClient.invalidateQueries();
    } catch (err: any) {
      toast.error(err.message || "Errore aggiornamento orario");
    } finally {
      setSavingReport(false);
    }
  };

  // Helpers modifica campi
  const updateTeamStat = (
    side: "home" | "away",
    field: keyof AdminTeamStatDraft,
    value: any
  ) => {
    setReport((prev) => {
      if (!prev) return prev;
      const key = side === "home" ? "homeTeamStat" : "awayTeamStat";
      return {
        ...prev,
        [key]: {
          ...prev[key],
          [field]: value,
        },
      };
    });
  };

  const updatePlayerStat = (
    side: "home" | "away",
    playerId: number,
    field: keyof AdminPlayerStatDraft,
    value: any
  ) => {
    setReport((prev) => {
      if (!prev) return prev;
      const key = side === "home" ? "homePlayers" : "awayPlayers";
      return {
        ...prev,
        [key]: prev[key].map((p) => (p.ID === playerId ? { ...p, [field]: value } : p)),
      };
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[96vw] w-[1520px] max-h-[94vh] flex flex-col p-0 overflow-hidden bg-card border-border/80">
        {/* HEADER */}
        <DialogHeader className="px-6 py-4 border-b border-border/70 bg-muted/30 shrink-0">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider">
                  Punti #1 & #27 • Screenshot AI / CSV / Editor Manuale
                </Badge>
                <Badge variant="outline" className="text-[10px] font-mono">
                  Embargo Automatico: Inizio Match + 45 min
                </Badge>
              </div>
              <DialogTitle className="text-xl sm:text-2xl font-black flex items-center gap-2.5">
                <Camera className="h-6 w-6 text-emerald-500" />
                Gestione Risultati, Tabellini & Caricamento Screenshot FC 25
              </DialogTitle>
              <DialogDescription className="text-xs">
                Carica la cartella di screenshot della partita (da 32 a 422+ immagini), importa/esporta il CSV o modifica manualmente ogni statistica. I risultati restano nascosti al pubblico fino a 45 minuti dopo l'orario di inizio gara.
              </DialogDescription>
            </div>

            {/* Selettori Stagione e Giornata */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 bg-background border border-border/80 rounded-xl px-2.5 py-1">
                <span className="text-[11px] font-bold text-muted-foreground">Stagione:</span>
                <select
                  value={selectedSeason}
                  onChange={(e) => setSelectedSeason(Number(e.target.value))}
                  className="bg-transparent text-xs font-black focus:outline-none cursor-pointer"
                >
                  {seasons.map((s) => (
                    <option key={s} value={s} className="bg-card text-foreground">
                      Stagione {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1 bg-background border border-border/80 rounded-xl p-1 overflow-x-auto max-w-full">
                {weeksAvailable.map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => handleSelectWeek(w)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
                      selectedWeek === w
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    }`}
                  >
                    G.{w}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* BODY SCROLLABLE */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* 1. STRIP PARTITE DELLA GIORNATA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            {loadingSchedule ? (
              <div className="col-span-full flex items-center justify-center p-6 text-xs text-muted-foreground gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Caricamento calendario...
              </div>
            ) : matchesInSelectedWeek.length === 0 ? (
              <div className="col-span-full p-4 rounded-xl border border-border/70 text-center text-xs text-muted-foreground">
                Nessuna partita in calendario per la Stagione {selectedSeason}, Giornata {selectedWeek}.
              </div>
            ) : (
              matchesInSelectedWeek.map((m) => {
                const key = `${m.week}_${m.home}_${m.away}`;
                const isSelected = key === selectedMatchKey;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedMatchKey(key)}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-500/10 shadow-sm ring-1 ring-emerald-500/40"
                        : "border-border/70 bg-card/60 hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {m.date} • <strong>{m.match_time}</strong>
                      </span>
                      {!m.has_stats ? (
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                          Da caricare
                        </Badge>
                      ) : m.is_unlocked ? (
                        <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[9px] px-1.5 py-0">
                          Pubblicata
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[9px] px-1.5 py-0 flex items-center gap-0.5">
                          <Lock className="h-2.5 w-2.5" /> Embargo
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between font-black text-sm">
                      <div className="flex items-center gap-1.5 truncate">
                        <img
                          src={`/images/teams/${m.home}_Logo.png`}
                          alt={m.home}
                          className="h-5 w-5 object-contain shrink-0"
                          onError={(e) => ((e.target as HTMLImageElement).src = "/images/LCSIM_Logo_SMALL.png")}
                        />
                        <span>{m.home}</span>
                      </div>
                      <span className="font-mono px-2 py-0.5 rounded bg-background/80 border border-border/60 text-xs">
                        {m.has_stats ? `${m.home_gol} - ${m.away_gol}` : "vs"}
                      </span>
                      <div className="flex items-center gap-1.5 truncate">
                        <span>{m.away}</span>
                        <img
                          src={`/images/teams/${m.away}_Logo.png`}
                          alt={m.away}
                          className="h-5 w-5 object-contain shrink-0"
                          onError={(e) => ((e.target as HTMLImageElement).src = "/images/LCSIM_Logo_SMALL.png")}
                        />
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {loadingReport || !report ? (
            <div className="p-12 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
              <span>Caricamento dettagli partita e rose...</span>
            </div>
          ) : (
            <>
              {/* 2. BARRA ORARIO PARTITA, EMBARGO (+45') E SORGENTI DI INPUT */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 p-4 rounded-2xl bg-muted/30 border border-border/80">
                {/* Colonna Sinistra: Programmazione Data, Ora & Sblocco +45 min */}
                <div className="xl:col-span-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-foreground">
                      <Clock className="h-4 w-4 text-amber-500" />
                      Calendario Match & Sblocco Programmato (+45 min)
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[10px] font-mono font-bold border-amber-500/40 text-amber-600 dark:text-amber-400"
                    >
                      Sblocco: {computePreviewUnlockDisplay(report.schedule.date, report.schedule.match_time)}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">
                        Data Partita
                      </label>
                      <Input
                        type="date"
                        value={report.schedule.date}
                        onChange={(e) =>
                          setReport((prev) =>
                            prev ? { ...prev, schedule: { ...prev.schedule, date: e.target.value } } : prev
                          )
                        }
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">
                        Ora Inizio
                      </label>
                      <Input
                        type="time"
                        value={report.schedule.match_time}
                        onChange={(e) =>
                          setReport((prev) =>
                            prev
                              ? { ...prev, schedule: { ...prev.schedule, match_time: e.target.value } }
                              : prev
                          )
                        }
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">
                        Stadio
                      </label>
                      <Input
                        value={report.schedule.stadium}
                        onChange={(e) =>
                          setReport((prev) =>
                            prev ? { ...prev, schedule: { ...prev.schedule, stadium: e.target.value } } : prev
                          )
                        }
                        className="h-8 text-xs"
                        placeholder="Stadio..."
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">
                        Arbitro
                      </label>
                      <Input
                        value={report.schedule.referee}
                        onChange={(e) =>
                          setReport((prev) =>
                            prev ? { ...prev, schedule: { ...prev.schedule, referee: e.target.value } } : prev
                          )
                        }
                        className="h-8 text-xs"
                        placeholder="Arbitro..."
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={savingReport}
                      onClick={() => handleQuickUpdateSchedule(false)}
                      className="h-7 text-[11px] font-bold gap-1.5"
                    >
                      <CalendarIcon className="h-3 w-3 text-amber-500" />
                      Aggiorna Solo Data/Ora (+45' Embargo)
                    </Button>
                    {report.schedule.has_stats && !report.schedule.is_unlocked && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={savingReport}
                        onClick={() => handleQuickUpdateSchedule(true)}
                        className="h-7 text-[11px] font-bold gap-1.5 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                      >
                        <Unlock className="h-3 w-3" />
                        Sblocca Subito Risultato & Statistiche
                      </Button>
                    )}
                  </div>
                </div>

                {/* Colonna Destra: Acquisizione Screenshot FC 25 e CSV */}
                <div className="xl:col-span-6 space-y-3 border-t xl:border-t-0 xl:border-l border-border/70 pt-3 xl:pt-0 xl:pl-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-foreground">
                      <Sparkles className="h-4 w-4 text-emerald-500" />
                      Acquisizione Automatica da Screenshot o File CSV
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      Supporta 32 o 422+ screenshot
                    </span>
                  </div>

                  {/* Hidden File Inputs */}
                  <input
                    ref={folderInputRef}
                    type="file"
                    multiple
                    // @ts-expect-error webkitdirectory support for folder upload
                    webkitdirectory=""
                    directory=""
                    className="hidden"
                    onChange={(e) => handleScreenshotsSelected(e.target.files)}
                  />
                  <input
                    ref={filesInputRef}
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.webp"
                    className="hidden"
                    onChange={(e) => handleScreenshotsSelected(e.target.files)}
                  />
                  <input
                    ref={csvInputRef}
                    type="file"
                    accept=".csv,.tsv,.txt"
                    className="hidden"
                    onChange={(e) => handleImportCSV(e.target.files?.[0])}
                  />

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <Button
                      type="button"
                      disabled={isProcessingScreenshots}
                      onClick={() => folderInputRef.current?.click()}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 gap-1.5 shadow-xs"
                    >
                      <FolderUp className="h-4 w-4 shrink-0" />
                      <span className="truncate">Cartella Screenshot</span>
                    </Button>

                    <Button
                      type="button"
                      variant="secondary"
                      disabled={isProcessingScreenshots}
                      onClick={() => filesInputRef.current?.click()}
                      className="font-bold text-xs h-9 gap-1.5 border border-emerald-500/30"
                    >
                      <Camera className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span className="truncate">Seleziona Immagini</span>
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      disabled={isProcessingScreenshots}
                      onClick={() => csvInputRef.current?.click()}
                      className="font-bold text-xs h-9 gap-1.5"
                    >
                      <Upload className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                      <span className="truncate">Importa CSV</span>
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleExportCSV}
                      className="font-bold text-xs h-9 gap-1.5"
                    >
                      <Download className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      <span className="truncate">Esporta CSV</span>
                    </Button>
                  </div>

                  {/* Barra di progresso OCR */}
                  {isProcessingScreenshots && ocrProgress && (
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        <span className="flex items-center gap-1.5">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          {ocrProgress.phase}
                        </span>
                        <span className="font-mono">
                          {ocrProgress.current} / {ocrProgress.total}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-background rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 transition-all duration-150"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.round((ocrProgress.current / Math.max(1, ocrProgress.total)) * 100)
                            )}%`,
                          }}
                        />
                      </div>
                      {ocrProgress.detail && (
                        <div className="text-[10px] font-mono text-muted-foreground truncate">
                          {ocrProgress.detail}
                        </div>
                      )}
                    </div>
                  )}

                  {lastExtractionSummary && !isProcessingScreenshots && (
                    <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-emerald-700 dark:text-emerald-300 flex items-center gap-2 font-medium">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                      <span>{lastExtractionSummary}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 3. SCOREBOARD LIVE CONFRONTO RAPIDO */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-card via-muted/40 to-card border border-border/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src={`/images/teams/${report.schedule.home}_Logo.png`}
                    alt={report.schedule.home}
                    className="h-12 w-12 object-contain"
                    onError={(e) => ((e.target as HTMLImageElement).src = "/images/LCSIM_Logo_SMALL.png")}
                  />
                  <div>
                    <div className="text-lg font-black">{report.schedule.home_name}</div>
                    <div className="text-xs text-muted-foreground font-mono">
                      Casa ({report.schedule.home}) • {report.homePlayers.filter((p) => p.MINUTI > 0).length} giocatori a referto
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    min={0}
                    max={30}
                    value={report.homeTeamStat.GOL}
                    onChange={(e) => updateTeamStat("home", "GOL", parseInt(e.target.value || "0", 10))}
                    className="w-16 h-12 text-center text-2xl font-black font-mono border-emerald-500/40"
                  />
                  <span className="text-xl font-black text-muted-foreground">:</span>
                  <Input
                    type="number"
                    min={0}
                    max={30}
                    value={report.awayTeamStat.GOL}
                    onChange={(e) => updateTeamStat("away", "GOL", parseInt(e.target.value || "0", 10))}
                    className="w-16 h-12 text-center text-2xl font-black font-mono border-emerald-500/40"
                  />
                </div>

                <div className="flex items-center gap-3 text-right">
                  <div>
                    <div className="text-lg font-black">{report.schedule.away_name}</div>
                    <div className="text-xs text-muted-foreground font-mono">
                      Trasferta ({report.schedule.away}) • {report.awayPlayers.filter((p) => p.MINUTI > 0).length} giocatori a referto
                    </div>
                  </div>
                  <img
                    src={`/images/teams/${report.schedule.away}_Logo.png`}
                    alt={report.schedule.away}
                    className="h-12 w-12 object-contain"
                    onError={(e) => ((e.target as HTMLImageElement).src = "/images/LCSIM_Logo_SMALL.png")}
                  />
                </div>
              </div>

              {/* 4. TABS EDITOR: STATISTICHE DI SQUADRA / TABELLINO CASA / TABELLINO TRASFERTA */}
              <Tabs value={activeEditorTab} onValueChange={setActiveEditorTab} className="space-y-4">
                <TabsList className="grid grid-cols-3 w-full max-w-2xl">
                  <TabsTrigger value="team" className="text-xs font-bold gap-1.5">
                    <BarChart3 className="h-3.5 w-3.5" />
                    Statistiche Squadra (AS_TEAM_STAT)
                  </TabsTrigger>
                  <TabsTrigger value="home_players" className="text-xs font-bold gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    Giocatori {report.schedule.home} ({report.homePlayers.filter((p) => p.MINUTI > 0).length})
                  </TabsTrigger>
                  <TabsTrigger value="away_players" className="text-xs font-bold gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    Giocatori {report.schedule.away} ({report.awayPlayers.filter((p) => p.MINUTI > 0).length})
                  </TabsTrigger>
                </TabsList>

                {/* TAB 1: STATISTICHE DI SQUADRA */}
                <TabsContent value="team" className="space-y-4">
                  <div className="rounded-xl border border-border/80 overflow-hidden bg-background/50">
                    <div className="grid grid-cols-12 bg-muted/60 px-4 py-2 text-[11px] font-black uppercase tracking-wider border-b border-border/70">
                      <div className="col-span-4 text-right pr-4">{report.schedule.home_name}</div>
                      <div className="col-span-4 text-center text-muted-foreground">Parametro Squadra</div>
                      <div className="col-span-4 text-left pl-4">{report.schedule.away_name}</div>
                    </div>

                    <div className="divide-y divide-border/50 text-xs">
                      {[
                        { label: "Allenatore a Referto", field: "ALLENATORE", type: "text" },
                        { label: "Minuti Partita", field: "MINUTI", type: "number" },
                        { label: "Media Voto Squadra", field: "VOTO", type: "step" },
                        { label: "Possesso Palla (0.50 o 50%)", field: "POSS", type: "step" },
                        { label: "Expected Goals (xG)", field: "xG", type: "step" },
                        { label: "Tempo Recupero Palla (s)", field: "TEMPOREC", type: "number" },
                        { label: "Tiri in Porta (TIRI_SI)", field: "TIRI_SI", type: "number" },
                        { label: "Tiri Totali (TIRI_TOT)", field: "TIRI_TOT", type: "number" },
                        { label: "Passaggi Riusciti (PASS_SI)", field: "PASS_SI", type: "number" },
                        { label: "Passaggi Totali (PASS_TOT)", field: "PASS_TOT", type: "number" },
                        { label: "Dribbling Riusciti (DRIB_SI)", field: "DRIB_SI", type: "number" },
                        { label: "Dribbling Tentati (DRIB_TOT)", field: "DRIB_TOT", type: "number" },
                        { label: "Cross Riusciti (CROS_SI)", field: "CROS_SI", type: "number" },
                        { label: "Cross Tentati (CROS_TOT)", field: "CROS_TOT", type: "number" },
                        { label: "Contrasti Vinti (CTRS_SI)", field: "CTRS_SI", type: "number" },
                        { label: "Contrasti Tentati (CTRS_TOT)", field: "CTRS_TOT", type: "number" },
                        { label: "Intercettazioni (INTERC)", field: "INTERC", type: "number" },
                        { label: "Parate (PARA)", field: "PARA", type: "number" },
                        { label: "Calci d'Angolo (CANGL)", field: "CANGL", type: "number" },
                        { label: "Falli Commessi (FALLI)", field: "FALLI", type: "number" },
                        { label: "Fuorigioco (FGIOCO)", field: "FGIOCO", type: "number" },
                        { label: "Cartellini Gialli (GIALLI)", field: "GIALLI", type: "number" },
                        { label: "Cartellini Rossi (ROSSI)", field: "ROSSI", type: "number" },
                        { label: "Autogol a Favore (AGOL)", field: "AGOL", type: "number" },
                        { label: "Assist di Squadra (ASST)", field: "ASST", type: "number" },
                        { label: "Tagli Difesa (TAGLI)", field: "TAGLI", type: "number" },
                        { label: "Aggiramenti Difesa (AGGIR)", field: "AGGIR", type: "number" },
                        { label: "Scavalcamenti Difesa (SCAVAL)", field: "SCAVAL", type: "number" },
                        { label: "Incursioni Tentate (INCURS)", field: "INCURS", type: "number" },
                      ].map((row) => {
                        const f = row.field as keyof AdminTeamStatDraft;
                        return (
                          <div key={row.field} className="grid grid-cols-12 items-center px-4 py-1.5 hover:bg-muted/20">
                            <div className="col-span-4 flex justify-end pr-4">
                              <Input
                                type={row.type === "text" ? "text" : "number"}
                                step={row.type === "step" ? "0.01" : "1"}
                                value={(report.homeTeamStat[f] as any) ?? ""}
                                onChange={(e) =>
                                  updateTeamStat(
                                    "home",
                                    f,
                                    row.type === "text"
                                      ? e.target.value
                                      : row.type === "step"
                                      ? parseFloat(e.target.value || "0")
                                      : parseInt(e.target.value || "0", 10)
                                  )
                                }
                                className="h-7 w-32 text-right font-mono text-xs"
                              />
                            </div>
                            <div className="col-span-4 text-center font-semibold text-foreground">
                              {row.label}
                            </div>
                            <div className="col-span-4 flex justify-start pl-4">
                              <Input
                                type={row.type === "text" ? "text" : "number"}
                                step={row.type === "step" ? "0.01" : "1"}
                                value={(report.awayTeamStat[f] as any) ?? ""}
                                onChange={(e) =>
                                  updateTeamStat(
                                    "away",
                                    f,
                                    row.type === "text"
                                      ? e.target.value
                                      : row.type === "step"
                                      ? parseFloat(e.target.value || "0")
                                      : parseInt(e.target.value || "0", 10)
                                  )
                                }
                                className="h-7 w-32 text-left font-mono text-xs"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </TabsContent>

                {/* TAB 2 & 3: GIOCATORI CASA / TRASFERTA */}
                {(["home", "away"] as const).map((side) => {
                  const players = side === "home" ? report.homePlayers : report.awayPlayers;
                  const tabVal = side === "home" ? "home_players" : "away_players";
                  return (
                    <TabsContent key={tabVal} value={tabVal}>
                      <div className="rounded-xl border border-border/80 overflow-x-auto bg-background/50">
                        <table className="w-full text-[11px] border-collapse">
                          <thead>
                            <tr className="bg-muted/70 border-b border-border/80 font-black uppercase text-muted-foreground">
                              <th className="p-2 text-left sticky left-0 bg-muted/95 z-10 min-w-[170px]">Calciatore</th>
                              <th className="p-1.5 text-center">Pos</th>
                              <th className="p-1.5 text-center">Min'</th>
                              <th className="p-1.5 text-center">Voto</th>
                              <th className="p-1.5 text-center">G</th>
                              <th className="p-1.5 text-center">Ass</th>
                              <th className="p-1.5 text-center">AG</th>
                              <th className="p-1.5 text-center">Tiri In/Tot</th>
                              <th className="p-1.5 text-center">Pass Si/Tot</th>
                              <th className="p-1.5 text-center">Drib Si/Tot</th>
                              <th className="p-1.5 text-center">Cross Si/Tot</th>
                              <th className="p-1.5 text-center">Ctrs Si/Tot</th>
                              <th className="p-1.5 text-center">Par/GS</th>
                              <th className="p-1.5 text-center">Fal/FG</th>
                              <th className="p-1.5 text-center">Amm/Esp</th>
                              <th className="p-1.5 text-center">PV/PP</th>
                              <th className="p-1.5 text-center">Km (Scatto)</th>
                              <th className="p-1.5 text-center">MVP</th>
                              <th className="p-1.5 text-center">Extra</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/50">
                            {players.map((p) => {
                              const played = p.MINUTI > 0;
                              const extraKeysCount = Object.keys(p.EXTRA_STATS || {}).length;
                              return (
                                <tr
                                  key={p.ID}
                                  className={`transition-colors ${
                                    played ? "bg-emerald-500/5 hover:bg-emerald-500/10" : "opacity-60 hover:opacity-100"
                                  }`}
                                >
                                  <td className="p-2 sticky left-0 bg-card/95 z-10 font-bold border-r border-border/50">
                                    <div className="flex items-center justify-between gap-1">
                                      <span className="truncate">
                                        {p.Nome} {p.Cognome}
                                      </span>
                                      <Badge variant="outline" className="text-[9px] px-1 py-0 font-mono">
                                        {p.Posiz}
                                      </Badge>
                                    </div>
                                  </td>
                                  <td className="p-1 text-center">
                                    <Input
                                      value={p.POS_GIOCATA}
                                      onChange={(e) => updatePlayerStat(side, p.ID, "POS_GIOCATA", e.target.value)}
                                      className="h-6 w-12 text-center font-mono text-[10px] px-1"
                                    />
                                  </td>
                                  <td className="p-1 text-center">
                                    <Input
                                      type="number"
                                      min={0}
                                      max={130}
                                      value={p.MINUTI}
                                      onChange={(e) =>
                                        updatePlayerStat(side, p.ID, "MINUTI", parseInt(e.target.value || "0", 10))
                                      }
                                      className="h-6 w-12 text-center font-mono text-[11px] px-1"
                                    />
                                  </td>
                                  <td className="p-1 text-center">
                                    <Input
                                      type="number"
                                      step="0.1"
                                      min={0}
                                      max={10}
                                      value={p.VOTO}
                                      onChange={(e) =>
                                        updatePlayerStat(side, p.ID, "VOTO", parseFloat(e.target.value || "0"))
                                      }
                                      className="h-6 w-14 text-center font-mono font-bold text-[11px] px-1"
                                    />
                                  </td>
                                  <td className="p-1 text-center">
                                    <Input
                                      type="number"
                                      min={0}
                                      value={p.GOL}
                                      onChange={(e) =>
                                        updatePlayerStat(side, p.ID, "GOL", parseInt(e.target.value || "0", 10))
                                      }
                                      className="h-6 w-10 text-center font-mono text-[11px] px-1"
                                    />
                                  </td>
                                  <td className="p-1 text-center">
                                    <Input
                                      type="number"
                                      min={0}
                                      value={p.ASST}
                                      onChange={(e) =>
                                        updatePlayerStat(side, p.ID, "ASST", parseInt(e.target.value || "0", 10))
                                      }
                                      className="h-6 w-10 text-center font-mono text-[11px] px-1"
                                    />
                                  </td>
                                  <td className="p-1 text-center">
                                    <Input
                                      type="number"
                                      min={0}
                                      value={p.AGOL}
                                      onChange={(e) =>
                                        updatePlayerStat(side, p.ID, "AGOL", parseInt(e.target.value || "0", 10))
                                      }
                                      className="h-6 w-10 text-center font-mono text-[11px] px-1"
                                    />
                                  </td>
                                  <td className="p-1">
                                    <div className="flex items-center justify-center gap-0.5">
                                      <Input
                                        type="number"
                                        min={0}
                                        value={p.TIRI_IN}
                                        onChange={(e) =>
                                          updatePlayerStat(side, p.ID, "TIRI_IN", parseInt(e.target.value || "0", 10))
                                        }
                                        className="h-6 w-10 text-center font-mono text-[10px] px-0.5"
                                      />
                                      <span>/</span>
                                      <Input
                                        type="number"
                                        min={0}
                                        value={p.TIRI_TOT}
                                        onChange={(e) =>
                                          updatePlayerStat(side, p.ID, "TIRI_TOT", parseInt(e.target.value || "0", 10))
                                        }
                                        className="h-6 w-10 text-center font-mono text-[10px] px-0.5"
                                      />
                                    </div>
                                  </td>
                                  <td className="p-1">
                                    <div className="flex items-center justify-center gap-0.5">
                                      <Input
                                        type="number"
                                        min={0}
                                        value={p.PASS_SI}
                                        onChange={(e) =>
                                          updatePlayerStat(side, p.ID, "PASS_SI", parseInt(e.target.value || "0", 10))
                                        }
                                        className="h-6 w-11 text-center font-mono text-[10px] px-0.5"
                                      />
                                      <span>/</span>
                                      <Input
                                        type="number"
                                        min={0}
                                        value={p.PASS_TOT}
                                        onChange={(e) =>
                                          updatePlayerStat(side, p.ID, "PASS_TOT", parseInt(e.target.value || "0", 10))
                                        }
                                        className="h-6 w-11 text-center font-mono text-[10px] px-0.5"
                                      />
                                    </div>
                                  </td>
                                  <td className="p-1">
                                    <div className="flex items-center justify-center gap-0.5">
                                      <Input
                                        type="number"
                                        min={0}
                                        value={p.DRIB_SI}
                                        onChange={(e) =>
                                          updatePlayerStat(side, p.ID, "DRIB_SI", parseInt(e.target.value || "0", 10))
                                        }
                                        className="h-6 w-10 text-center font-mono text-[10px] px-0.5"
                                      />
                                      <span>/</span>
                                      <Input
                                        type="number"
                                        min={0}
                                        value={p.DRIB_TOT}
                                        onChange={(e) =>
                                          updatePlayerStat(side, p.ID, "DRIB_TOT", parseInt(e.target.value || "0", 10))
                                        }
                                        className="h-6 w-10 text-center font-mono text-[10px] px-0.5"
                                      />
                                    </div>
                                  </td>
                                  <td className="p-1">
                                    <div className="flex items-center justify-center gap-0.5">
                                      <Input
                                        type="number"
                                        min={0}
                                        value={p.CROS_SI}
                                        onChange={(e) =>
                                          updatePlayerStat(side, p.ID, "CROS_SI", parseInt(e.target.value || "0", 10))
                                        }
                                        className="h-6 w-10 text-center font-mono text-[10px] px-0.5"
                                      />
                                      <span>/</span>
                                      <Input
                                        type="number"
                                        min={0}
                                        value={p.CROS_TOT}
                                        onChange={(e) =>
                                          updatePlayerStat(side, p.ID, "CROS_TOT", parseInt(e.target.value || "0", 10))
                                        }
                                        className="h-6 w-10 text-center font-mono text-[10px] px-0.5"
                                      />
                                    </div>
                                  </td>
                                  <td className="p-1">
                                    <div className="flex items-center justify-center gap-0.5">
                                      <Input
                                        type="number"
                                        min={0}
                                        value={p.CTRS_SI}
                                        onChange={(e) =>
                                          updatePlayerStat(side, p.ID, "CTRS_SI", parseInt(e.target.value || "0", 10))
                                        }
                                        className="h-6 w-10 text-center font-mono text-[10px] px-0.5"
                                      />
                                      <span>/</span>
                                      <Input
                                        type="number"
                                        min={0}
                                        value={p.CTRS_TOT}
                                        onChange={(e) =>
                                          updatePlayerStat(side, p.ID, "CTRS_TOT", parseInt(e.target.value || "0", 10))
                                        }
                                        className="h-6 w-10 text-center font-mono text-[10px] px-0.5"
                                      />
                                    </div>
                                  </td>
                                  <td className="p-1">
                                    <div className="flex items-center justify-center gap-0.5">
                                      <Input
                                        type="number"
                                        min={0}
                                        value={p.PARA}
                                        onChange={(e) =>
                                          updatePlayerStat(side, p.ID, "PARA", parseInt(e.target.value || "0", 10))
                                        }
                                        className="h-6 w-9 text-center font-mono text-[10px] px-0.5"
                                      />
                                      <span>/</span>
                                      <Input
                                        type="number"
                                        min={0}
                                        value={p.GSUB}
                                        onChange={(e) =>
                                          updatePlayerStat(side, p.ID, "GSUB", parseInt(e.target.value || "0", 10))
                                        }
                                        className="h-6 w-9 text-center font-mono text-[10px] px-0.5"
                                      />
                                    </div>
                                  </td>
                                  <td className="p-1">
                                    <div className="flex items-center justify-center gap-0.5">
                                      <Input
                                        type="number"
                                        min={0}
                                        value={p.FALLI}
                                        onChange={(e) =>
                                          updatePlayerStat(side, p.ID, "FALLI", parseInt(e.target.value || "0", 10))
                                        }
                                        className="h-6 w-9 text-center font-mono text-[10px] px-0.5"
                                      />
                                      <span>/</span>
                                      <Input
                                        type="number"
                                        min={0}
                                        value={p.FGIOCO}
                                        onChange={(e) =>
                                          updatePlayerStat(side, p.ID, "FGIOCO", parseInt(e.target.value || "0", 10))
                                        }
                                        className="h-6 w-9 text-center font-mono text-[10px] px-0.5"
                                      />
                                    </div>
                                  </td>
                                  <td className="p-1">
                                    <div className="flex items-center justify-center gap-0.5">
                                      <Input
                                        type="number"
                                        min={0}
                                        value={p.GIALLI}
                                        onChange={(e) =>
                                          updatePlayerStat(side, p.ID, "GIALLI", parseInt(e.target.value || "0", 10))
                                        }
                                        className="h-6 w-9 text-center font-mono text-amber-500 font-bold text-[10px] px-0.5"
                                      />
                                      <span>/</span>
                                      <Input
                                        type="number"
                                        min={0}
                                        value={p.ROSSI}
                                        onChange={(e) =>
                                          updatePlayerStat(side, p.ID, "ROSSI", parseInt(e.target.value || "0", 10))
                                        }
                                        className="h-6 w-9 text-center font-mono text-rose-500 font-bold text-[10px] px-0.5"
                                      />
                                    </div>
                                  </td>
                                  <td className="p-1">
                                    <div className="flex items-center justify-center gap-0.5">
                                      <Input
                                        type="number"
                                        min={0}
                                        value={p.POSS_VINTI}
                                        onChange={(e) =>
                                          updatePlayerStat(side, p.ID, "POSS_VINTI", parseInt(e.target.value || "0", 10))
                                        }
                                        className="h-6 w-9 text-center font-mono text-[10px] px-0.5"
                                      />
                                      <span>/</span>
                                      <Input
                                        type="number"
                                        min={0}
                                        value={p.PALLE_PERSE}
                                        onChange={(e) =>
                                          updatePlayerStat(side, p.ID, "PALLE_PERSE", parseInt(e.target.value || "0", 10))
                                        }
                                        className="h-6 w-9 text-center font-mono text-[10px] px-0.5"
                                      />
                                    </div>
                                  </td>
                                  <td className="p-1">
                                    <div className="flex items-center justify-center gap-0.5">
                                      <Input
                                        type="number"
                                        step="0.1"
                                        min={0}
                                        value={p.DIST_TOT}
                                        onChange={(e) =>
                                          updatePlayerStat(side, p.ID, "DIST_TOT", parseFloat(e.target.value || "0"))
                                        }
                                        className="h-6 w-11 text-center font-mono text-[10px] px-0.5"
                                      />
                                      <Input
                                        type="number"
                                        step="0.1"
                                        min={0}
                                        value={p.DIST_SCATTO}
                                        onChange={(e) =>
                                          updatePlayerStat(side, p.ID, "DIST_SCATTO", parseFloat(e.target.value || "0"))
                                        }
                                        className="h-6 w-10 text-center font-mono text-[10px] px-0.5"
                                      />
                                    </div>
                                  </td>
                                  <td className="p-1 text-center">
                                    <input
                                      type="checkbox"
                                      checked={p.MOTM}
                                      onChange={(e) => updatePlayerStat(side, p.ID, "MOTM", e.target.checked)}
                                      className="h-4 w-4 accent-amber-500 cursor-pointer"
                                    />
                                  </td>
                                  <td className="p-1 text-center">
                                    {extraKeysCount > 0 ? (
                                      <Badge
                                        variant="outline"
                                        className="text-[9px] font-mono border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                                        title={JSON.stringify(p.EXTRA_STATS, null, 2)}
                                      >
                                        +{extraKeysCount}
                                      </Badge>
                                    ) : (
                                      <span className="text-muted-foreground">-</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </TabsContent>
                  );
                })}
              </Tabs>
            </>
          )}
        </div>

        {/* FOOTER ACTIONS */}
        <div className="px-6 py-3.5 border-t border-border/80 bg-muted/40 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <Lock className="h-4 w-4 text-amber-500 shrink-0" />
            <span>
              Salvataggio con embargo automatico a{" "}
              <strong className="text-foreground">
                {report
                  ? computePreviewUnlockDisplay(report.schedule.date, report.schedule.match_time)
                  : "+45 min"}
              </strong>
              . I dati saranno visibili nel Calendario e in Classifica solo dopo tale orario.
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={savingReport}>
              Chiudi
            </Button>
            <Button
              variant="outline"
              disabled={savingReport || !report}
              onClick={() => handleSaveReport(true)}
              className="font-bold text-xs gap-1.5 border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
            >
              <Unlock className="h-3.5 w-3.5" />
              Salva & Sblocca Subito
            </Button>
            <Button
              disabled={savingReport || !report}
              onClick={() => handleSaveReport(false)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow-md shadow-emerald-600/20"
            >
              {savingReport ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvataggio...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Salva Referto (Sblocco +45')
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

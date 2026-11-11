import { useState, useEffect, useMemo } from "react";
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
import {
  Calendar,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Clock,
  ShieldCheck,
  Loader2,
  Sparkles,
  CalendarDays,
  Table2,
} from "lucide-react";
import { toast } from "sonner";
import { SUPABASE_STORAGE_URL } from "@/constants/App";
import {
  ScheduleTeamInfo,
  GeneratedWeekSchedule,
  NEUTRAL_MATCHDAY_WEEK,
  NEUTRAL_STADIUM_NAME,
  fetchActiveScheduleTeams,
  generateBalancedSeasonSchedule,
  applyGlobalStartMondayToSchedule,
  addDaysToDateStr,
  getNextMondayDateStr,
  verifyGeneratedSchedule,
  saveGeneratedSeasonSchedule,
} from "@/services/scheduleGeneratorService";
import { supabase } from "@/supabaseClient";

interface ScheduleGeneratorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  adminName: string;
  onSaved?: () => Promise<void> | void;
}

export function ScheduleGeneratorModal({
  open,
  onOpenChange,
  adminName,
  onSaved,
}: ScheduleGeneratorModalProps) {
  const [stag, setStag] = useState<number>(11);
  const [startMondayDate, setStartMondayDate] = useState<string>(() =>
    getNextMondayDateStr()
  );
  const [defaultMatchTime, setDefaultMatchTime] = useState<string>("21:00");

  const [teams, setTeams] = useState<ScheduleTeamInfo[]>([]);
  const [weeks, setWeeks] = useState<GeneratedWeekSchedule[]>([]);
  const [existingScheduleCount, setExistingScheduleCount] = useState<number>(0);

  const [isLoadingTeams, setIsLoadingTeams] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"matches" | "verification">(
    "matches"
  );
  const [selectedWeekFilter, setSelectedWeekFilter] = useState<number | "all">(
    "all"
  );

  // Load active teams and generate initial preview when modal opens
  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    const init = async () => {
      try {
        setIsLoadingTeams(true);
        const [activeTeams, existingRes] = await Promise.all([
          fetchActiveScheduleTeams(),
          supabase
            .from("an_schedule")
            .select("id", { count: "exact", head: true })
            .eq("stag", stag)
            .gte("week", 1)
            .lte("week", 11),
        ]);

        if (cancelled) return;
        setTeams(activeTeams);
        setExistingScheduleCount(existingRes.count || 0);

        if (activeTeams.length === 12) {
          const generated = generateBalancedSeasonSchedule(
            activeTeams,
            startMondayDate
          );
          setWeeks(generated);
        }
      } catch (err: any) {
        if (!cancelled) {
          toast.error(
            err.message || "Errore durante l'inizializzazione del generatore"
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingTeams(false);
        }
      }
    };

    init();
    return () => {
      cancelled = true;
    };
  }, [open]);

  // Check existing schedule count when season number changes
  useEffect(() => {
    if (!open) return;
    supabase
      .from("an_schedule")
      .select("id", { count: "exact", head: true })
      .eq("stag", stag)
      .gte("week", 1)
      .lte("week", 11)
      .then(({ count }) => {
        setExistingScheduleCount(count || 0);
      });
  }, [stag, open]);

  // Regenerate pairings
  const handleRegeneratePairings = () => {
    if (teams.length !== 12) {
      toast.error("Sono necessarie 12 squadre attive per generare il calendario.");
      return;
    }
    try {
      const nextWeeks = generateBalancedSeasonSchedule(teams, startMondayDate);
      // Preserve current defaultMatchTime
      const withTime = nextWeeks.map((w) => ({
        ...w,
        matches: w.matches.map((m) => ({
          ...m,
          match_time: defaultMatchTime || "21:00",
        })),
      }));
      setWeeks(withTime);
      toast.success(
        "Nuovi accoppiamenti generati nel rispetto di tutti i vincoli!"
      );
    } catch (err: any) {
      toast.error(err.message || "Errore durante il sorteggio del calendario");
    }
  };

  // Update global Start Monday and cascade to all 11 weeks
  const handleGlobalStartMondayChange = (newDate: string) => {
    setStartMondayDate(newDate);
    if (!newDate) return;
    setWeeks((prev) => applyGlobalStartMondayToSchedule(prev, newDate));
  };

  // Apply default time to all matches
  const handleApplyTimeToAll = (timeStr: string) => {
    setDefaultMatchTime(timeStr);
    if (!timeStr) return;
    setWeeks((prev) =>
      prev.map((w) => ({
        ...w,
        matches: w.matches.map((m) => ({
          ...m,
          match_time: timeStr,
        })),
      }))
    );
  };

  // Update a specific week's Monday date (and auto-set Tuesday = Monday + 1)
  const handleWeekMondayChange = (weekNum: number, newMonday: string) => {
    if (!newMonday) return;
    const newTuesday = addDaysToDateStr(newMonday, 1);
    setWeeks((prev) =>
      prev.map((w) => {
        if (w.week !== weekNum) return w;
        return {
          ...w,
          mondayDate: newMonday,
          tuesdayDate: newTuesday,
          matches: w.matches.map((m) => ({
            ...m,
            date:
              m.daySlot === "monday"
                ? newMonday
                : m.daySlot === "tuesday"
                ? newTuesday
                : m.date,
          })),
        };
      })
    );
  };

  // Update a specific week's Tuesday date
  const handleWeekTuesdayChange = (weekNum: number, newTuesday: string) => {
    if (!newTuesday) return;
    setWeeks((prev) =>
      prev.map((w) => {
        if (w.week !== weekNum) return w;
        return {
          ...w,
          tuesdayDate: newTuesday,
          matches: w.matches.map((m) => ({
            ...m,
            date: m.daySlot === "tuesday" ? newTuesday : m.date,
          })),
        };
      })
    );
  };

  // Toggle a single match between Monday and Tuesday
  const handleMatchDaySlotChange = (
    weekNum: number,
    matchId: string,
    slot: "monday" | "tuesday"
  ) => {
    setWeeks((prev) =>
      prev.map((w) => {
        if (w.week !== weekNum) return w;
        const targetDate = slot === "monday" ? w.mondayDate : w.tuesdayDate;
        return {
          ...w,
          matches: w.matches.map((m) =>
            m.id === matchId ? { ...m, daySlot: slot, date: targetDate } : m
          ),
        };
      })
    );
  };

  // Custom date or time change on a single match
  const handleSingleMatchUpdate = (
    weekNum: number,
    matchId: string,
    patch: { date?: string; match_time?: string }
  ) => {
    setWeeks((prev) =>
      prev.map((w) => {
        if (w.week !== weekNum) return w;
        return {
          ...w,
          matches: w.matches.map((m) => {
            if (m.id !== matchId) return m;
            const nextDate = patch.date !== undefined ? patch.date : m.date;
            const nextSlot =
              nextDate === w.mondayDate
                ? "monday"
                : nextDate === w.tuesdayDate
                ? "tuesday"
                : "custom";
            return {
              ...m,
              ...patch,
              daySlot: nextSlot,
            };
          }),
        };
      })
    );
  };

  // Verification summary
  const verificationRows = useMemo(() => {
    if (teams.length === 0 || weeks.length === 0) return [];
    return verifyGeneratedSchedule(weeks, teams);
  }, [weeks, teams]);

  const allTeamsValid = useMemo(
    () =>
      verificationRows.length === 12 &&
      verificationRows.every((r) => r.isValid),
    [verificationRows]
  );

  const displayedWeeks = useMemo(() => {
    if (selectedWeekFilter === "all") return weeks;
    return weeks.filter((w) => w.week === selectedWeekFilter);
  }, [weeks, selectedWeekFilter]);

  const formatShortDateIt = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const [y, m, d] = dateStr.split("-").map(Number);
      const dt = new Date(Date.UTC(y, (m || 1) - 1, d || 1));
      return dt.toLocaleDateString("it-IT", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        timeZone: "UTC",
      });
    } catch {
      return dateStr;
    }
  };

  // Save approved schedule to DB
  const handleApproveAndSave = async () => {
    if (!allTeamsValid) {
      toast.error(
        "Il calendario presenta violazioni sui vincoli. Rigenera prima di salvare."
      );
      return;
    }

    setIsSaving(true);
    try {
      const res = await saveGeneratedSeasonSchedule(stag, weeks, adminName);
      if (!res.success) {
        throw new Error(res.error || "Errore durante il salvataggio");
      }

      toast.success(
        `Calendario Ufficiale Stagione ${stag} approvato e salvato! (${
          res.inserted_count ?? 66
        } partite registrate)`
      );

      if (onSaved) {
        await onSaved();
      }
      onOpenChange(false);
    } catch (err: any) {
      toast.error(
        err.message || "Impossibile salvare il calendario su database"
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[92vh] flex flex-col p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-border/80 bg-gradient-to-r from-card via-card to-cyan-500/5 shrink-0">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pr-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Regular Season • 11 Giornate
                  (Round-Robin)
                </Badge>
                <Badge
                  variant="outline"
                  className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] font-bold"
                >
                  🏟️ Giornata {NEUTRAL_MATCHDAY_WEEK}: {NEUTRAL_STADIUM_NAME}{" "}
                  (Campo Neutro)
                </Badge>
              </div>
              <DialogTitle className="text-xl md:text-2xl font-black flex items-center gap-2">
                <Calendar className="h-6 w-6 text-cyan-500" />
                Generatore &amp; Configurazione Calendario Stagionale
              </DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                Genera gli accoppiamenti bilanciati (5 Casa, 5 Trasferta, 1
                Neutro in G6, max 2 consecutive Casa/Trasferta esclusa G6) e
                definisci le date di Lunedì e Martedì prima dell&apos;approvazione
                ufficiale.
              </DialogDescription>
            </div>

            <Button
              type="button"
              onClick={handleRegeneratePairings}
              disabled={isLoadingTeams || isSaving}
              variant="outline"
              className="border-cyan-500/40 hover:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold text-xs gap-2 shrink-0"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Rigenera Accoppiamenti
            </Button>
          </div>
        </DialogHeader>

        {/* Top Config Controls & Validation Bar */}
        <div className="px-6 py-3 bg-muted/40 border-b border-border/70 space-y-3 shrink-0">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
            {/* Stagione */}
            <div>
              <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                Stagione
              </label>
              <input
                type="number"
                min={1}
                max={99}
                value={stag}
                onChange={(e) => setStag(Number(e.target.value) || 11)}
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs font-mono font-bold"
              />
            </div>

            {/* Lunedì Giornata 1 */}
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                Data Lunedì Giornata 1 (Auto-calcola Lunedì/Martedì G1–G11)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={startMondayDate}
                  onChange={(e) => handleGlobalStartMondayChange(e.target.value)}
                  className="flex-1 h-9 px-3 rounded-lg border border-border bg-background text-xs font-mono font-semibold"
                />
                <Badge
                  variant="outline"
                  className="h-9 px-2.5 text-[11px] font-mono bg-background shrink-0 hidden sm:flex items-center"
                >
                  {formatShortDateIt(startMondayDate)}
                </Badge>
              </div>
            </div>

            {/* Orario Default */}
            <div>
              <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                Orario Default Gare
              </label>
              <input
                type="time"
                value={defaultMatchTime}
                onChange={(e) => handleApplyTimeToAll(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs font-mono font-semibold"
              />
            </div>
          </div>

          {/* Validation Status & Tab Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2 flex-wrap">
              {allTeamsValid ? (
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    Vincoli Verificati: 66 gare • 5C / 5T / 1N • Max
                    Consecutività ≤ 2 (esclusa G6)
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-lg">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  <span>Verifica vincoli in corso...</span>
                </div>
              )}

              {existingScheduleCount > 0 && (
                <Badge
                  variant="outline"
                  className="text-[10px] border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10"
                >
                  ⚠️ Presenti {existingScheduleCount} gare S{stag} a DB (verranno
                  sostituite all&apos;approvazione)
                </Badge>
              )}
            </div>

            {/* View Switcher */}
            <div className="flex items-center bg-muted p-0.5 rounded-lg border border-border/70 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setActiveTab("matches")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                  activeTab === "matches"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <CalendarDays className="h-3.5 w-3.5 text-cyan-500" />
                Partite &amp; Date (G1–G11)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("verification")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                  activeTab === "verification"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Table2 className="h-3.5 w-3.5 text-emerald-500" />
                Verifica 12 Squadre
              </button>
            </div>
          </div>
        </div>

        {/* Main Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {isLoadingTeams ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
              <p className="text-xs font-semibold">
                Caricamento club Serie A e calcolo accoppiamenti bilanciati...
              </p>
            </div>
          ) : activeTab === "matches" ? (
            <>
              {/* Week Filter Bar */}
              <div className="flex items-center gap-1.5 flex-wrap pb-1">
                <button
                  type="button"
                  onClick={() => setSelectedWeekFilter("all")}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold border transition-colors ${
                    selectedWeekFilter === "all"
                      ? "bg-cyan-600 text-white border-cyan-600"
                      : "bg-card text-muted-foreground border-border hover:text-foreground"
                  }`}
                >
                  Tutte (11)
                </button>
                {weeks.map((w) => (
                  <button
                    key={w.week}
                    type="button"
                    onClick={() => setSelectedWeekFilter(w.week)}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold border transition-colors flex items-center gap-1 ${
                      selectedWeekFilter === w.week
                        ? w.isNeutralWeek
                          ? "bg-amber-600 text-white border-amber-600"
                          : "bg-cyan-600 text-white border-cyan-600"
                        : w.isNeutralWeek
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
                        : "bg-card text-muted-foreground border-border hover:text-foreground"
                    }`}
                  >
                    <span>G{w.week}</span>
                    {w.isNeutralWeek && (
                      <span className="text-[10px] uppercase">★ Neutro</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Matchday Cards */}
              <div className="space-y-4">
                {displayedWeeks.map((weekObj) => {
                  const monCount = weekObj.matches.filter(
                    (m) => m.daySlot === "monday"
                  ).length;
                  const tueCount = weekObj.matches.filter(
                    (m) => m.daySlot === "tuesday"
                  ).length;

                  return (
                    <div
                      key={weekObj.week}
                      className={`rounded-xl border overflow-hidden shadow-xs ${
                        weekObj.isNeutralWeek
                          ? "border-amber-500/50 bg-gradient-to-br from-card via-card to-amber-500/5"
                          : "border-border/80 bg-card"
                      }`}
                    >
                      {/* Matchday Header */}
                      <div
                        className={`px-4 py-2.5 border-b flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2.5 ${
                          weekObj.isNeutralWeek
                            ? "bg-amber-500/10 border-amber-500/30"
                            : "bg-muted/50 border-border/70"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <Badge
                            className={
                              weekObj.isNeutralWeek
                                ? "bg-amber-600 text-white font-black text-xs px-2.5 py-0.5"
                                : "bg-cyan-600 text-white font-black text-xs px-2.5 py-0.5"
                            }
                          >
                            GIORNATA {weekObj.week}
                          </Badge>

                          {weekObj.isNeutralWeek ? (
                            <Badge
                              variant="outline"
                              className="bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40 font-black text-[11px] flex items-center gap-1"
                            >
                              <MapPin className="h-3 w-3" />
                              CAMPO NEUTRO UNICO: {NEUTRAL_STADIUM_NAME}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground font-medium">
                              Regular Season • Stadio di casa
                            </span>
                          )}

                          <Badge
                            variant="outline"
                            className="text-[10px] font-mono font-bold"
                          >
                            {monCount} Lunedì • {tueCount} Martedì
                          </Badge>
                        </div>

                        {/* Week Monday & Tuesday Date Pickers */}
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <div className="flex items-center gap-1.5 bg-background/90 px-2.5 py-1 rounded-lg border border-border/80">
                            <span className="text-[10px] font-black uppercase text-cyan-600 dark:text-cyan-400">
                              Lunedì:
                            </span>
                            <input
                              type="date"
                              value={weekObj.mondayDate}
                              onChange={(e) =>
                                handleWeekMondayChange(
                                  weekObj.week,
                                  e.target.value
                                )
                              }
                              className="bg-transparent font-mono font-bold text-xs focus:outline-none"
                            />
                          </div>

                          <div className="flex items-center gap-1.5 bg-background/90 px-2.5 py-1 rounded-lg border border-border/80">
                            <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400">
                              Martedì:
                            </span>
                            <input
                              type="date"
                              value={weekObj.tuesdayDate}
                              onChange={(e) =>
                                handleWeekTuesdayChange(
                                  weekObj.week,
                                  e.target.value
                                )
                              }
                              className="bg-transparent font-mono font-bold text-xs focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      {/* 6 Matches Table/List */}
                      <div className="divide-y divide-border/60">
                        {weekObj.matches.map((match, idx) => (
                          <div
                            key={match.id}
                            className="px-4 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-muted/20 transition-colors"
                          >
                            {/* Match Teams */}
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <span className="text-[11px] font-mono text-muted-foreground w-5 shrink-0">
                                #{idx + 1}
                              </span>

                              {/* Home Team */}
                              <div className="flex items-center gap-2 min-w-[140px] sm:min-w-[175px] justify-end text-right">
                                <div className="min-w-0">
                                  <div className="text-xs font-bold text-foreground truncate">
                                    {match.homeName}
                                  </div>
                                  <div className="text-[10px] text-muted-foreground font-mono">
                                    {match.is_neutral ? (
                                      <span className="text-amber-600 dark:text-amber-400 font-bold">
                                        NEUTRO
                                      </span>
                                    ) : (
                                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                        CASA
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <img
                                  src={`${SUPABASE_STORAGE_URL}/images/teams/${match.home}_Logo.png`}
                                  alt={match.homeName}
                                  className="h-7 w-7 object-contain shrink-0"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = `${SUPABASE_STORAGE_URL}/images/LCSIM_Logo_SMALL.png`;
                                  }}
                                />
                              </div>

                              <span className="text-xs font-black text-muted-foreground px-1">
                                VS
                              </span>

                              {/* Away Team */}
                              <div className="flex items-center gap-2 min-w-[140px] sm:min-w-[175px]">
                                <img
                                  src={`${SUPABASE_STORAGE_URL}/images/teams/${match.away}_Logo.png`}
                                  alt={match.awayName}
                                  className="h-7 w-7 object-contain shrink-0"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = `${SUPABASE_STORAGE_URL}/images/LCSIM_Logo_SMALL.png`;
                                  }}
                                />
                                <div className="min-w-0">
                                  <div className="text-xs font-bold text-foreground truncate">
                                    {match.awayName}
                                  </div>
                                  <div className="text-[10px] text-muted-foreground font-mono">
                                    {match.is_neutral ? (
                                      <span className="text-amber-600 dark:text-amber-400 font-bold">
                                        NEUTRO
                                      </span>
                                    ) : (
                                      <span className="text-sky-600 dark:text-sky-400 font-bold">
                                        TRASFERTA
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Stadium */}
                              <div className="hidden xl:flex items-center gap-1 text-[11px] text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-md border border-border/60 ml-2 truncate max-w-[190px]">
                                <MapPin className="h-3 w-3 shrink-0 text-amber-500" />
                                <span className="truncate">{match.stadium}</span>
                              </div>
                            </div>

                            {/* Day Toggle (Lunedì / Martedì) + Date & Time Inputs */}
                            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
                              <div className="flex items-center bg-muted p-0.5 rounded-lg border border-border/70">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleMatchDaySlotChange(
                                      weekObj.week,
                                      match.id,
                                      "monday"
                                    )
                                  }
                                  className={`px-2 py-1 rounded text-[11px] font-bold transition-colors ${
                                    match.daySlot === "monday"
                                      ? "bg-cyan-600 text-white shadow-xs"
                                      : "text-muted-foreground hover:text-foreground"
                                  }`}
                                >
                                  Lun
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleMatchDaySlotChange(
                                      weekObj.week,
                                      match.id,
                                      "tuesday"
                                    )
                                  }
                                  className={`px-2 py-1 rounded text-[11px] font-bold transition-colors ${
                                    match.daySlot === "tuesday"
                                      ? "bg-indigo-600 text-white shadow-xs"
                                      : "text-muted-foreground hover:text-foreground"
                                  }`}
                                >
                                  Mar
                                </button>
                              </div>

                              <input
                                type="date"
                                value={match.date}
                                onChange={(e) =>
                                  handleSingleMatchUpdate(
                                    weekObj.week,
                                    match.id,
                                    { date: e.target.value }
                                  )
                                }
                                className="h-7 px-2 rounded-md border border-border bg-background text-[11px] font-mono font-semibold"
                              />

                              <div className="flex items-center gap-1 h-7 px-2 rounded-md border border-border bg-background">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                <input
                                  type="time"
                                  value={match.match_time}
                                  onChange={(e) =>
                                    handleSingleMatchUpdate(
                                      weekObj.week,
                                      match.id,
                                      { match_time: e.target.value }
                                    )
                                  }
                                  className="bg-transparent text-[11px] font-mono font-semibold focus:outline-none"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            /* Tab 2: Verification Table */
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border/70 text-xs space-y-1">
                <div className="font-bold text-foreground flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  Riepilogo Matematico Vincoli per Squadra
                </div>
                <p className="text-muted-foreground text-[11px]">
                  Ogni squadra disputa <strong>5 gare in Casa (C)</strong>,{" "}
                  <strong>5 in Trasferta (T)</strong> e{" "}
                  <strong>
                    1 in Campo Neutro (N) alla Giornata {NEUTRAL_MATCHDAY_WEEK} (
                    {NEUTRAL_STADIUM_NAME})
                  </strong>
                  . La Giornata {NEUTRAL_MATCHDAY_WEEK} è neutra e non viene
                  conteggiata per il limite massimo di 2 gare consecutive in
                  casa o in trasferta.
                </p>
              </div>

              <div className="rounded-xl border border-border/80 overflow-x-auto bg-card">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-muted/60 border-b border-border/80 text-[11px] font-black uppercase text-muted-foreground">
                      <th className="py-2.5 px-3 text-left">Squadra</th>
                      {Array.from({ length: 11 }, (_, i) => i + 1).map((w) => (
                        <th
                          key={w}
                          className={`py-2.5 px-1.5 text-center font-mono ${
                            w === NEUTRAL_MATCHDAY_WEEK
                              ? "text-amber-600 dark:text-amber-400 bg-amber-500/10"
                              : ""
                          }`}
                        >
                          G{w}
                        </th>
                      ))}
                      <th className="py-2.5 px-2.5 text-center">Casa</th>
                      <th className="py-2.5 px-2.5 text-center">Trasf.</th>
                      <th className="py-2.5 px-2.5 text-center">Neutro</th>
                      <th className="py-2.5 px-2.5 text-center">
                        Max Consec. (no G6)
                      </th>
                      <th className="py-2.5 px-3 text-center">Stato</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {verificationRows.map((row) => (
                      <tr
                        key={row.teamId}
                        className="hover:bg-muted/20 transition-colors"
                      >
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <img
                              src={`${SUPABASE_STORAGE_URL}/images/teams/${row.teamId}_Logo.png`}
                              alt={row.teamName}
                              className="h-6 w-6 object-contain shrink-0"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = `${SUPABASE_STORAGE_URL}/images/LCSIM_Logo_SMALL.png`;
                              }}
                            />
                            <div>
                              <div className="font-bold text-foreground">
                                {row.teamName}
                              </div>
                              <div className="text-[10px] text-muted-foreground">
                                {row.stadiumName}
                              </div>
                            </div>
                          </div>
                        </td>

                        {row.sequence.map((item) => (
                          <td
                            key={item.week}
                            className={`py-2 px-1 text-center ${
                              item.week === NEUTRAL_MATCHDAY_WEEK
                                ? "bg-amber-500/5"
                                : ""
                            }`}
                            title={`G${item.week}: vs ${item.opponentName} (${
                              item.role === "C"
                                ? "Casa"
                                : item.role === "T"
                                ? "Trasferta"
                                : "Campo Neutro"
                            })`}
                          >
                            <div className="flex flex-col items-center gap-0.5">
                              <span
                                className={`inline-flex items-center justify-center w-6 h-5 rounded text-[10px] font-black font-mono ${
                                  item.role === "C"
                                    ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                                    : item.role === "T"
                                    ? "bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/30"
                                    : "bg-amber-500/25 text-amber-600 dark:text-amber-400 border border-amber-500/40"
                                }`}
                              >
                                {item.role}
                              </span>
                              <span className="text-[9px] font-mono text-muted-foreground">
                                {item.opponentId}
                              </span>
                            </div>
                          </td>
                        ))}

                        <td className="py-2 px-2.5 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {row.homeCount}
                        </td>
                        <td className="py-2 px-2.5 text-center font-mono font-bold text-sky-600 dark:text-sky-400">
                          {row.awayCount}
                        </td>
                        <td className="py-2 px-2.5 text-center font-mono font-bold text-amber-600 dark:text-amber-400">
                          {row.neutralCount}
                        </td>
                        <td className="py-2 px-2.5 text-center font-mono text-[11px]">
                          <span className="font-bold">
                            {row.maxConsecutiveHome}C / {row.maxConsecutiveAway}T
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center">
                          {row.isValid ? (
                            <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                              OK
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="text-[10px]">
                              Errore
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-3.5 border-t border-border/80 bg-muted/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 shrink-0">
          <div className="text-[11px] text-muted-foreground">
            Il calendario verrà reso ufficiale e visibile a tutti i club solo
            cliccando su <strong>Approva e Salva Calendario</strong>.
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Annulla
            </Button>
            <Button
              type="button"
              onClick={handleApproveAndSave}
              disabled={isSaving || isLoadingTeams || !allTeamsValid}
              className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold gap-2 shadow-sm shadow-cyan-600/20"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvataggio in corso...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Approva e Salva Calendario Ufficiale (66 Gare)
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import React, { useState, useEffect, useCallback } from "react";
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Unlock,
  Settings2,
  Calendar,
  Sparkles,
  ShieldAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/supabaseClient";
import {
  fetchActiveDeadline,
  updateDeadline,
  calculateCountdown,
  upsertDeadline,
  getCachedActiveDeadline,
} from "@/services/deadlineService";
import { LeagueDeadline, DeadlineCountdownState } from "@/types/deadlines";
import { useAuth } from "@/context/AuthContext";

interface FormationCountdownProps {
  onStatusChange?: (isExpired: boolean, deadline: LeagueDeadline | null) => void;
  className?: string;
  compact?: boolean;
}

export const FormationCountdown: React.FC<FormationCountdownProps> = ({
  onStatusChange,
  className = "",
  compact = false,
}) => {
  const { user } = useAuth();
  const isAdmin = user?.isAdmin || false;

  const [activeDeadline, setActiveDeadline] = useState<LeagueDeadline | null>(() => getCachedActiveDeadline());
  const [countdown, setCountdown] = useState<DeadlineCountdownState>(() => {
    const cached = getCachedActiveDeadline();
    if (cached) {
      return calculateCountdown(cached.deadline, cached.is_force_closed);
    }
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalMs: 0,
      isExpired: false,
      isUrgent: false,
    };
  });

  // Admin Modal State
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [editWeek, setEditWeek] = useState<number>(1);
  const [editStag, setEditStag] = useState<number>(11);
  const [editDateStr, setEditDateStr] = useState<string>("");
  const [editForceClosed, setEditForceClosed] = useState<boolean>(false);
  const [editDescription, setEditDescription] = useState<string>("");
  const [isSavingAdmin, setIsSavingAdmin] = useState(false);

  // Caricamento della deadline attiva
  const loadDeadline = useCallback(async () => {
    const d = await fetchActiveDeadline();
    setActiveDeadline(d);
    if (d) {
      const state = calculateCountdown(d.deadline, d.is_force_closed);
      setCountdown(state);
      onStatusChange?.(state.isExpired, d);
    } else {
      onStatusChange?.(false, null);
    }
  }, [onStatusChange]);

  useEffect(() => {
    loadDeadline();

    // Sottoscrizione Realtime
    const channel = supabase
      .channel("lcsim-deadlines-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "league_deadlines" },
        () => {
          loadDeadline();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadDeadline]);

  // Tick del timer ogni secondo
  useEffect(() => {
    if (!activeDeadline) return;

    const interval = setInterval(() => {
      const state = calculateCountdown(activeDeadline.deadline, activeDeadline.is_force_closed);
      setCountdown(state);
      onStatusChange?.(state.isExpired, activeDeadline);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeDeadline, onStatusChange]);

  // Gestione apertura modale Admin
  const handleOpenAdminModal = () => {
    if (activeDeadline) {
      setEditWeek(activeDeadline.week);
      setEditStag(activeDeadline.stag);
      setEditForceClosed(activeDeadline.is_force_closed);
      setEditDescription(activeDeadline.description || `Giornata ${activeDeadline.week}`);

      // Converte data in formato YYYY-MM-DDTHH:mm per input datetime-local
      const d = new Date(activeDeadline.deadline);
      const pad = (n: number) => String(n).padStart(2, "0");
      const localIso = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
        d.getHours()
      )}:${pad(d.getMinutes())}`;
      setEditDateStr(localIso);
    }
    setIsAdminModalOpen(true);
  };

  const handleSaveAdminModal = async () => {
    if (!editDateStr) {
      toast.error("Inserisci una data e ora valida per la scadenza.");
      return;
    }

    setIsSavingAdmin(true);
    try {
      const parsedDate = new Date(editDateStr);
      if (isNaN(parsedDate.getTime())) {
        toast.error("Formato data non valido.");
        return;
      }

      const res = await upsertDeadline({
        stag: editStag,
        week: editWeek,
        deadline: parsedDate.toISOString(),
        is_active: true,
        is_force_closed: editForceClosed,
        description: editDescription.trim(),
      });

      if (!res.success) {
        throw new Error(res.error);
      }

      toast.success("Scadenza formazioni aggiornata con successo per tutta la Lega!");
      setIsAdminModalOpen(false);
      await loadDeadline();
    } catch (err: any) {
      console.error("Errore salvataggio scadenza:", err);
      toast.error(err?.message || "Errore durante il salvataggio.");
    } finally {
      setIsSavingAdmin(false);
    }
  };

  const handleQuickToggleClosed = async () => {
    if (!activeDeadline) return;
    const nextState = !activeDeadline.is_force_closed;
    try {
      const res = await updateDeadline(activeDeadline.id, {
        is_force_closed: nextState,
      });
      if (!res.success) throw new Error(res.error);
      toast.success(
        nextState
          ? "Formazioni chiuse forzatamente dall'Admin!"
          : "Consegna formazioni riaperta con successo!"
      );
      await loadDeadline();
    } catch (err: any) {
      toast.error("Errore modifica stato chiusura: " + err.message);
    }
  };

  if (!activeDeadline) return null;

  const isClosed = countdown.isExpired || activeDeadline.is_force_closed;
  const isUrgent = !isClosed && countdown.isUrgent;

  // Formatta data leggibile in italiano
  const deadlineDate = new Date(activeDeadline.deadline);
  const formattedDeadlineDate = deadlineDate.toLocaleDateString("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  // =========================================================================
  // VISTA COMPATTA (Per Navbar)
  // =========================================================================
  if (compact) {
    return (
      <div
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition-colors shadow-sm ${
          isClosed
            ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30"
            : isUrgent
            ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 animate-pulse"
            : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
        } ${className}`}
      >
        <Clock className="h-3.5 w-3.5 shrink-0" />
        <span>G{activeDeadline.week}:</span>
        {isClosed ? (
          <span className="uppercase tracking-wider text-[10px]">Chiuse</span>
        ) : (
          <span>
            {countdown.days > 0 ? `${countdown.days}g ` : ""}
            {String(countdown.hours).padStart(2, "0")}h:
            {String(countdown.minutes).padStart(2, "0")}m
          </span>
        )}
      </div>
    );
  }

  // =========================================================================
  // VISTA ESTESA (Per Tattica.tsx)
  // =========================================================================
  return (
    <>
      <div
        className={`rounded-2xl border p-4 sm:p-5 transition-all shadow-md ${
          isClosed
            ? "bg-gradient-to-r from-rose-950/20 via-background to-rose-950/10 border-rose-500/40"
            : isUrgent
            ? "bg-gradient-to-r from-amber-950/20 via-background to-amber-950/10 border-amber-500/40 ring-1 ring-amber-500/30"
            : "bg-gradient-to-r from-emerald-950/20 via-background to-emerald-950/10 border-emerald-500/30"
        } ${className}`}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Sezione Sinistra: Stato e Giornata */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant="outline"
                className={`text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 gap-1.5 ${
                  isClosed
                    ? "bg-rose-500/20 text-rose-500 border-rose-500/40"
                    : isUrgent
                    ? "bg-amber-500/20 text-amber-500 border-amber-500/40 animate-pulse"
                    : "bg-emerald-500/20 text-emerald-500 border-emerald-500/40"
                }`}
              >
                {isClosed ? (
                  <>
                    <Lock className="h-3 w-3" />
                    <span>Formazioni Chiuse</span>
                  </>
                ) : isUrgent ? (
                  <>
                    <AlertTriangle className="h-3 w-3" />
                    <span>In Scadenza Imminente</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Consegne Aperte</span>
                  </>
                )}
              </Badge>

              <span className="text-xs font-bold text-muted-foreground">
                {activeDeadline.description || `Giornata ${activeDeadline.week}`} • Stagione{" "}
                {activeDeadline.stag}
              </span>
            </div>

            <div className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>
                Termine di consegna:{" "}
                <strong className="text-foreground capitalize">{formattedDeadlineDate}</strong>
              </span>
            </div>

            <p className="text-xs text-muted-foreground">
              {isClosed
                ? "La deadline è terminata. Eventuali salvataggi saranno conteggiati solo per la giornata successiva."
                : "Schiera gli 11 titolari e salva la formazione prima del termine per renderla ufficiale."}
            </p>
          </div>

          {/* Sezione Destra: Countdown Boxes & Admin Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {!isClosed ? (
              <div className="flex items-center gap-2 font-mono">
                {/* Giorni */}
                {countdown.days > 0 && (
                  <div className="flex flex-col items-center bg-card/80 border border-border/80 px-3 py-1.5 rounded-xl min-w-[52px]">
                    <span className="text-lg font-black text-foreground">
                      {String(countdown.days).padStart(2, "0")}
                    </span>
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-sans font-bold">
                      Giorni
                    </span>
                  </div>
                )}

                {/* Ore */}
                <div className="flex flex-col items-center bg-card/80 border border-border/80 px-3 py-1.5 rounded-xl min-w-[52px]">
                  <span className="text-lg font-black text-foreground">
                    {String(countdown.hours).padStart(2, "0")}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-sans font-bold">
                    Ore
                  </span>
                </div>

                <span className="text-lg font-black text-muted-foreground">:</span>

                {/* Minuti */}
                <div className="flex flex-col items-center bg-card/80 border border-border/80 px-3 py-1.5 rounded-xl min-w-[52px]">
                  <span className="text-lg font-black text-foreground">
                    {String(countdown.minutes).padStart(2, "0")}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-sans font-bold">
                    Min
                  </span>
                </div>

                <span className="text-lg font-black text-muted-foreground">:</span>

                {/* Secondi */}
                <div className="flex flex-col items-center bg-card/80 border border-border/80 px-3 py-1.5 rounded-xl min-w-[52px]">
                  <span
                    className={`text-lg font-black ${
                      isUrgent ? "text-amber-500 animate-pulse" : "text-emerald-500"
                    }`}
                  >
                    {String(countdown.seconds).padStart(2, "0")}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-sans font-bold">
                    Sec
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 font-bold text-xs">
                <Lock className="h-4 w-4" />
                <span>Modifiche congelate per la Giornata {activeDeadline.week}</span>
              </div>
            )}

            {/* Pulsanti Riservati all'Admin */}
            {isAdmin && (
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleQuickToggleClosed}
                  className={`h-9 text-xs font-bold ${
                    isClosed
                      ? "border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                      : "border-rose-500/40 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
                  }`}
                >
                  {isClosed ? (
                    <>
                      <Unlock className="h-3.5 w-3.5 mr-1" />
                      Riapri
                    </>
                  ) : (
                    <>
                      <Lock className="h-3.5 w-3.5 mr-1" />
                      Chiudi Ora
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenAdminModal}
                  className="h-9 text-xs font-bold border-primary/40 hover:bg-primary/10"
                >
                  <Settings2 className="h-3.5 w-3.5 mr-1" />
                  Gestisci
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================================
          DIALOG ADMIN: GESTIONE SCADENZA FORMAZIONI
         ========================================================================= */}
      <Dialog open={isAdminModalOpen} onOpenChange={setIsAdminModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Settings2 className="h-5 w-5 text-primary" />
              <span>Gestione Scadenza Formazioni (Admin)</span>
            </DialogTitle>
            <DialogDescription>
              Configura la scadenza di consegna formazioni per tutta la Lega LCSIM.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="week-input" className="text-xs font-bold">
                  Giornata (Week)
                </Label>
                <Input
                  id="week-input"
                  type="number"
                  min={1}
                  max={38}
                  value={editWeek}
                  onChange={(e) => setEditWeek(Number(e.target.value))}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="stag-input" className="text-xs font-bold">
                  Stagione
                </Label>
                <Input
                  id="stag-input"
                  type="number"
                  min={1}
                  value={editStag}
                  onChange={(e) => setEditStag(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="desc-input" className="text-xs font-bold">
                Descrizione / Titolo
              </Label>
              <Input
                id="desc-input"
                placeholder="es. Giornata 1 - Andata"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="deadline-input" className="text-xs font-bold">
                Data & Ora Limite Consegna
              </Label>
              <Input
                id="deadline-input"
                type="datetime-local"
                value={editDateStr}
                onChange={(e) => setEditDateStr(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                I manager non potranno più modificare la formazione per questa giornata dopo questo
                istante.
              </p>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/30">
              <div className="space-y-0.5">
                <Label htmlFor="force-close-switch" className="text-xs font-bold cursor-pointer">
                  Chiusura Forzata Anticipata
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Blocca immediatamente le formazioni anche se il timer non è ancora scaduto.
                </p>
              </div>
              <Switch
                id="force-close-switch"
                checked={editForceClosed}
                onCheckedChange={setEditForceClosed}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsAdminModalOpen(false)}
              disabled={isSavingAdmin}
            >
              Annulla
            </Button>
            <Button onClick={handleSaveAdminModal} disabled={isSavingAdmin}>
              {isSavingAdmin ? "Salvataggio..." : "Salva e Applica"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

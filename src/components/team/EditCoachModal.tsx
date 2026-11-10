import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { UserCheck, Shield, Sparkles, Loader2, Crown, Landmark, MapPin, Users } from "lucide-react";
import { supabase } from "@/supabaseClient";
import { TEAM_TABLE } from "@/constants/App";
import { updateTeamProfile } from "@/services/teamService";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";

interface EditCoachModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  teamName?: string;
  currentCoachName?: string | null;
  currentPresidentName?: string | null;
  currentStadiumName?: string | null;
  currentStadiumCity?: string | null;
  currentStadiumCapacity?: number | null;
  currentStadiumSurface?: string | null;
  currentStadiumYear?: number | null;
  onSuccess?: (newCoachName: string, newPresidentName?: string) => void;
}

export function parseCoachName(fullName?: string | null): { prefix: "Sig." | "Mister"; surname: string } {
  if (!fullName) return { prefix: "Sig.", surname: "" };
  const trimmed = fullName.trim();
  if (/^mister\b/i.test(trimmed)) {
    return {
      prefix: "Mister",
      surname: trimmed.replace(/^mister\.?\s*/i, "").trim(),
    };
  }
  if (/^sig\b/i.test(trimmed)) {
    return {
      prefix: "Sig.",
      surname: trimmed.replace(/^sig\.?\s*/i, "").trim(),
    };
  }
  return { prefix: "Sig.", surname: trimmed };
}

export function EditCoachModal({
  open,
  onOpenChange,
  teamId,
  teamName,
  currentCoachName,
  currentPresidentName,
  currentStadiumName,
  currentStadiumCity,
  currentStadiumCapacity,
  currentStadiumSurface,
  currentStadiumYear,
  onSuccess,
}: EditCoachModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [presidentName, setPresidentName] = useState<string>("");
  const [prefix, setPrefix] = useState<"Sig." | "Mister">("Sig.");
  const [surname, setSurname] = useState<string>("");
  const [stadiumName, setStadiumName] = useState<string>("");
  const [stadiumCity, setStadiumCity] = useState<string>("");

  const [isLoadingInitial, setIsLoadingInitial] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasRegisteredUser, setHasRegisteredUser] = useState<boolean>(true);

  // Initialize or fetch current coach, president and stadium when modal opens
  useEffect(() => {
    if (!open || !teamId) return;

    let isCancelled = false;
    setIsLoadingInitial(true);

    const loadData = async () => {
      try {
        let loadedCoach = currentCoachName;
        let loadedPresident = currentPresidentName;
        let loadedStadiumName = currentStadiumName;
        let loadedStadiumCity = currentStadiumCity;
        let loadedStadiumCapacity = currentStadiumCapacity;
        let loadedStadiumSurface = currentStadiumSurface;
        let loadedStadiumYear = currentStadiumYear;

        // Fetch from Supabase
        const [teamRes, statusRes] = await Promise.all([
          supabase.from(TEAM_TABLE).select("*").eq("TEAM_ID", teamId).maybeSingle(),
          supabase.rpc("rpc_get_all_teams_status"),
        ]);

        if (!isCancelled && teamRes.data) {
          loadedCoach = teamRes.data.MANAGER;
          loadedStadiumName = teamRes.data.stadium_name || loadedStadiumName;
          loadedStadiumCity = teamRes.data.stadium_city || loadedStadiumCity;
          loadedStadiumCapacity = teamRes.data.stadium_capacity || loadedStadiumCapacity;
          loadedStadiumSurface = teamRes.data.stadium_surface || loadedStadiumSurface;
          loadedStadiumYear = teamRes.data.stadium_year || loadedStadiumYear;
        }

        if (!isCancelled && statusRes.data) {
          const foundStatus = (statusRes.data as any[]).find((t) => t.team_id === teamId);
          if (foundStatus) {
            setHasRegisteredUser(Boolean(foundStatus.is_claimed));
            loadedPresident = foundStatus.claimed_by_name || "";
          }
        }

        if (!isCancelled) {
          const parsed = parseCoachName(loadedCoach);
          setPrefix(parsed.prefix);
          setSurname(parsed.surname);
          setPresidentName(loadedPresident || "");
          setStadiumName(loadedStadiumName || "");
          setStadiumCity(loadedStadiumCity || "");
        }
      } catch (err) {
        console.error("Errore caricamento staff squadra:", err);
      } finally {
        if (!isCancelled) setIsLoadingInitial(false);
      }
    };

    loadData();

    return () => {
      isCancelled = true;
    };
  }, [open, teamId, currentCoachName, currentPresidentName, currentStadiumName]);

  const handleSurnameChange = (val: string) => {
    let cleaned = val;
    if (/^mister\b/i.test(cleaned)) {
      setPrefix("Mister");
      cleaned = cleaned.replace(/^mister\.?\s*/i, "");
    } else if (/^sig\b/i.test(cleaned)) {
      setPrefix("Sig.");
      cleaned = cleaned.replace(/^sig\.?\s*/i, "");
    }
    setSurname(cleaned);
  };

  const fullFormattedCoach = surname.trim() ? `${prefix} ${surname.trim()}` : "";

  const handleSave = async () => {
    const cleanSurname = surname.trim();
    if (!cleanSurname) {
      toast.error("Inserisci il cognome dell'allenatore.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await updateTeamProfile({
        teamId,
        coachName: fullFormattedCoach,
        presidentName: presidentName.trim() || undefined,
        stadiumName: stadiumName.trim() || undefined,
        stadiumCity: stadiumCity.trim() || undefined,
        actingUsername: user?.username,
      });

      if (!res.success) {
        toast.error(res.error || "Impossibile aggiornare le informazioni del club.");
        return;
      }

      toast.success(`Profilo club e stadio aggiornati con successo!`);
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["all_teams_status"] });
      queryClient.invalidateQueries({ queryKey: ["team", teamId] });
      queryClient.invalidateQueries({ queryKey: ["all_teams_stadiums"] });
      queryClient.invalidateQueries({ queryKey: ["admin_teams_coach_list"] });
      queryClient.invalidateQueries({ queryKey: ["press_conferences"] });
      queryClient.invalidateQueries({ queryKey: ["pending_conference"] });
      queryClient.invalidateQueries({ queryKey: ["press_conferences_replies"] });

      onSuccess?.(fullFormattedCoach, presidentName.trim());
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message || "Errore imprevisto durante il salvataggio.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Landmark className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-black">
                Staff &amp; Informazioni Impianto
              </DialogTitle>
              <DialogDescription className="text-xs">
                {teamName ? `${teamName} (${teamId})` : `Squadra ${teamId}`} • Serie A
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isLoadingInitial ? (
          <div className="py-8 flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
            <span>Caricamento dati club...</span>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {/* SEZIONE 1: PRESIDENTE */}
            <div className="p-3.5 rounded-xl bg-muted/30 border border-border/70 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                <Crown className="h-4 w-4 text-amber-500 shrink-0" />
                <span>Presidente del Club:</span>
              </div>
              <Input
                value={presidentName}
                onChange={(e) => setPresidentName(e.target.value)}
                placeholder="Es. Mario Rossi, Stefano Cortese"
                className="h-9 text-xs font-semibold bg-background"
              />
              <p className="text-[11px] text-muted-foreground">
                {hasRegisteredUser
                  ? "Modifica il nome del Presidente mostrato nella scheda squadra e nei comunicati."
                  : "Squadra attualmente non registrata: il nome verrà salvato alla creazione dell'account."}
              </p>
            </div>

            {/* SEZIONE 2: ALLENATORE */}
            <div className="p-3.5 rounded-xl bg-muted/30 border border-border/70 space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <UserCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Titolo / Appellativo Allenatore:</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPrefix("Sig.")}
                    className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      prefix === "Sig."
                        ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-xs"
                        : "border-border/70 bg-card hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    <Shield className="h-3.5 w-3.5" />
                    <span>Sig.</span>
                    <span className="text-[10px] font-normal text-muted-foreground">
                      (Sig. Rossi)
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPrefix("Mister")}
                    className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      prefix === "Mister"
                        ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-xs"
                        : "border-border/70 bg-card hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Mister</span>
                    <span className="text-[10px] font-normal text-muted-foreground">
                      (Mister Rossi)
                    </span>
                  </button>
                </div>
              </div>

              {/* Inserimento Cognome Allenatore */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  Cognome dell'Allenatore:
                </label>
                <Input
                  value={surname}
                  onChange={(e) => handleSurnameChange(e.target.value)}
                  placeholder="Es. Guardiola, Rossi, Brown"
                  className="h-9 text-xs font-semibold bg-background"
                />
              </div>

              {/* Box Anteprima Nome Ufficiale Allenatore */}
              <div className="p-2.5 rounded-lg bg-background/80 border border-border/80 flex items-center justify-between gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                  In Panchina:
                </span>
                <Badge
                  variant="outline"
                  className="text-xs px-2 py-0.5 font-mono font-bold border-emerald-500/40 text-foreground"
                >
                  {fullFormattedCoach || "(Cognome mancante)"}
                </Badge>
              </div>
            </div>

            {/* SEZIONE 3: STADIO (PUNTO #45) */}
            <div className="p-3.5 rounded-xl bg-muted/30 border border-border/70 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                <Landmark className="h-4 w-4 text-sky-500 shrink-0" />
                <span>Impianto di Gioco &amp; Stadio:</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">
                    Nome Stadio:
                  </label>
                  <Input
                    value={stadiumName}
                    onChange={(e) => setStadiumName(e.target.value)}
                    placeholder="Es. Arena Conti"
                    className="h-8 text-xs font-semibold bg-background"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">
                    Città:
                  </label>
                  <Input
                    value={stadiumCity}
                    onChange={(e) => setStadiumCity(e.target.value)}
                    placeholder="Es. Roma, Milano"
                    className="h-8 text-xs font-semibold bg-background"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
            className="text-xs"
          >
            Annulla
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={isSaving || !surname.trim()}
            className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
          >
            {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Salva Modifiche
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

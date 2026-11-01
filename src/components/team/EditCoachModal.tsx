import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { UserCheck, Shield, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/supabaseClient";
import { TEAM_TABLE } from "@/constants/App";
import { updateTeamCoach } from "@/services/teamService";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";

interface EditCoachModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  teamName?: string;
  currentCoachName?: string | null;
  onSuccess?: (newCoachName: string) => void;
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
  onSuccess,
}: EditCoachModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [prefix, setPrefix] = useState<"Sig." | "Mister">("Sig.");
  const [surname, setSurname] = useState<string>("");
  const [isLoadingInitial, setIsLoadingInitial] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize or fetch current coach name when modal opens
  useEffect(() => {
    if (!open || !teamId) return;

    if (currentCoachName !== undefined) {
      const parsed = parseCoachName(currentCoachName);
      setPrefix(parsed.prefix);
      setSurname(parsed.surname);
      return;
    }

    // Fetch from Supabase
    let isCancelled = false;
    setIsLoadingInitial(true);
    supabase
      .from(TEAM_TABLE)
      .select("MANAGER")
      .eq("TEAM_ID", teamId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!isCancelled && !error && data) {
          const parsed = parseCoachName(data.MANAGER);
          setPrefix(parsed.prefix);
          setSurname(parsed.surname);
        }
        if (!isCancelled) setIsLoadingInitial(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [open, teamId, currentCoachName]);

  const handleSurnameChange = (val: string) => {
    // If user writes "Sig. Rossi" or "Mister Rossi", auto-strip prefix and switch title
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
      const res = await updateTeamCoach(teamId, fullFormattedCoach, user?.username);
      if (!res.success) {
        toast.error(res.error || "Impossibile aggiornare l'allenatore.");
        return;
      }

      toast.success(`Allenatore impostato su "${fullFormattedCoach}"`);
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["all_teams_status"] });
      queryClient.invalidateQueries({ queryKey: ["team", teamId] });
      queryClient.invalidateQueries({ queryKey: ["all_teams_stadiums"] });
      queryClient.invalidateQueries({ queryKey: ["admin_teams_coach_list"] });

      onSuccess?.(fullFormattedCoach);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message || "Errore imprevisto durante il salvataggio.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-black">
                Imposta Allenatore
              </DialogTitle>
              <DialogDescription className="text-xs">
                {teamName ? `${teamName} (${teamId})` : `Squadra ${teamId}`}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isLoadingInitial ? (
          <div className="py-8 flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
            <span>Caricamento dati allenatore...</span>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {/* Scelta Titolo / Prefisso */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                Titolo / Appellativo:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPrefix("Sig.")}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    prefix === "Sig."
                      ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-xs"
                      : "border-border/70 bg-card hover:bg-muted text-muted-foreground"
                  }`}
                >
                  <Shield className="h-4 w-4" />
                  <span>Sig.</span>
                  <span className="text-[10px] font-normal text-muted-foreground">
                    (Es. Sig. Rossi)
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setPrefix("Mister")}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    prefix === "Mister"
                      ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-xs"
                      : "border-border/70 bg-card hover:bg-muted text-muted-foreground"
                  }`}
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Mister</span>
                  <span className="text-[10px] font-normal text-muted-foreground">
                    (Es. Mister Rossi)
                  </span>
                </button>
              </div>
            </div>

            {/* Inserimento Cognome */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                Cognome dell'Allenatore:
              </label>
              <Input
                value={surname}
                onChange={(e) => handleSurnameChange(e.target.value)}
                placeholder="Es. Guardiola, Rossi, Brown"
                className="h-10 text-xs font-semibold"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSave();
                  }
                }}
              />
              <p className="text-[11px] text-muted-foreground">
                Inserisci solo il cognome: il titolo scelto verrà anteposto automaticamente.
              </p>
            </div>

            {/* Box Anteprima Nome Ufficiale */}
            <div className="p-3.5 rounded-xl bg-muted/40 border border-border/80 space-y-1.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">
                Anteprima Referti &amp; Scheda Squadra:
              </span>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="text-xs px-2.5 py-1 font-mono font-bold bg-background text-foreground border-emerald-500/40"
                >
                  {fullFormattedCoach || "(Inserisci un cognome)"}
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed pt-1">
                Questo nome comparirà nel Calendario, nei tabellini partita e nella scheda della squadra Serie A.
              </p>
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
            Salva Allenatore
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

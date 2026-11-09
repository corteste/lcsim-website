import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Users,
  Crown,
  Target,
  Flag,
  Sparkles,
  Ban,
  Clock,
  ArrowRight,
  Save,
  Loader2,
} from "lucide-react";
import { FormationValidationResult, ValidationCheckItem } from "@/utils/formationValidation";

interface FormationValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  validationResult: FormationValidationResult | null;
  onConfirmSave: () => void;
  isSaving: boolean;
  teamName?: string;
  onNavigateToTab?: (tab: "lineup" | "tactics") => void;
}

export const FormationValidationModal: React.FC<FormationValidationModalProps> = ({
  isOpen,
  onClose,
  validationResult,
  onConfirmSave,
  isSaving,
  teamName,
  onNavigateToTab,
}) => {
  if (!validationResult) return null;

  const { isValid, passedChecks, failedChecks, items } = validationResult;

  const getCategoryIcon = (category: ValidationCheckItem["category"]) => {
    switch (category) {
      case "starters":
        return <Users className="w-4 h-4 text-emerald-500 shrink-0" />;
      case "discipline":
        return <Ban className="w-4 h-4 text-rose-500 shrink-0" />;
      case "captain":
        return <Crown className="w-4 h-4 text-amber-500 shrink-0" />;
      case "shooters":
        return <Target className="w-4 h-4 text-emerald-500 shrink-0" />;
      case "corners":
        return <Flag className="w-4 h-4 text-sky-500 shrink-0" />;
      case "jumpers":
        return <Sparkles className="w-4 h-4 text-purple-500 shrink-0" />;
      case "conflicts":
        return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />;
      case "deadline":
        return <Clock className="w-4 h-4 text-rose-500 shrink-0" />;
      default:
        return <ShieldCheck className="w-4 h-4 text-primary shrink-0" />;
    }
  };

  const handleFixRedirect = (suggestedTab?: "lineup" | "tactics") => {
    if (suggestedTab && onNavigateToTab) {
      onNavigateToTab(suggestedTab);
    } else {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isSaving && !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden border-border/80 bg-background shadow-2xl">
        {/* Header con gradiente dinamico */}
        <DialogHeader
          className={`p-5 sm:p-6 border-b shrink-0 ${
            isValid
              ? "bg-gradient-to-r from-emerald-500/15 via-emerald-500/5 to-transparent border-emerald-500/30"
              : "bg-gradient-to-r from-rose-500/15 via-rose-500/5 to-transparent border-rose-500/30"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl border shrink-0 ${
                isValid
                  ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 shadow-emerald-500/20 shadow-md"
                  : "bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30 shadow-rose-500/20 shadow-md"
              }`}
            >
              {isValid ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
            </div>
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <DialogTitle className="text-lg sm:text-xl font-black tracking-tight text-foreground">
                  Verifica Schieramento {teamName ? `• ${teamName}` : ""}
                </DialogTitle>
                <Badge
                  variant="outline"
                  className={`text-[10px] font-extrabold px-2 py-0.5 uppercase tracking-wider ${
                    isValid
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40"
                      : "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/40"
                  }`}
                >
                  {isValid ? "Conforme" : `${failedChecks} ${failedChecks === 1 ? "Errore" : "Errori"}`}
                </Badge>
              </div>
              <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
                {isValid
                  ? "Tutti i controlli di integrità e regolamentari sono stati superati con successo."
                  : "Sono state rilevate violazioni alle regole di Lega. Correggi gli errori per salvare."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Corpo Scrollabile con la checklist */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {/* Banner riepilogativo */}
          <div
            className={`p-3.5 rounded-xl border text-xs sm:text-sm flex items-start gap-3 ${
              isValid
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-200"
                : "bg-rose-500/10 border-rose-500/30 text-rose-950 dark:text-rose-200"
            }`}
          >
            {isValid ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            )}
            <div className="space-y-0.5">
              <div className="font-bold">
                {isValid
                  ? `Checklist completata con successo (${passedChecks}/${items.length} verifiche valide)`
                  : `Schieramento non valido (${failedChecks} su ${items.length} verifiche fallite)`}
              </div>
              <p className="text-xs opacity-90 leading-relaxed">
                {isValid
                  ? "La distinta di gara è pronta per essere registrata e congelata per la giornata ufficiale."
                  : "Il regolamento LCSIM impone 11 titolari, capitano e calci piazzati titolari, nessun conflitto corner e assenza di squalificati."}
              </p>
            </div>
          </div>

          {/* Elenco dei singoli controlli */}
          <div className="space-y-2.5 pt-1">
            {items.map((item) => {
              const isError = item.status === "error";
              return (
                <div
                  key={item.id}
                  className={`p-3 sm:p-3.5 rounded-xl border transition-colors ${
                    isError
                      ? "bg-rose-500/5 dark:bg-rose-500/10 border-rose-500/40 hover:border-rose-500/60"
                      : "bg-card hover:bg-muted/30 border-border/70"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="mt-0.5">{getCategoryIcon(item.category)}</div>
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs sm:text-sm font-black text-foreground">
                            {item.title}
                          </span>
                          {isError ? (
                            <Badge
                              variant="outline"
                              className="text-[9px] px-1.5 py-0 h-4 bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 font-bold"
                            >
                              Non Valido
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-[9px] px-1.5 py-0 h-4 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-bold"
                            >
                              Valido
                            </Badge>
                          )}
                        </div>
                        <p
                          className={`text-xs ${
                            isError
                              ? "text-rose-600 dark:text-rose-300 font-semibold"
                              : "text-muted-foreground"
                          }`}
                        >
                          {item.description}
                        </p>

                        {/* Dettagli dell'errore se presenti */}
                        {isError && item.details && item.details.length > 0 && (
                          <div className="mt-2 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 space-y-1">
                            {item.details.map((detail, dIdx) => (
                              <div
                                key={dIdx}
                                className="flex items-start gap-1.5 text-xs text-rose-700 dark:text-rose-200"
                              >
                                <span className="font-bold">•</span>
                                <span>{detail}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottone rapido per correggere se in errore */}
                    {isError && item.suggestedTab && onNavigateToTab && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleFixRedirect(item.suggestedTab)}
                        className="text-[11px] font-bold h-7 px-2 shrink-0 border-rose-500/30 hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 gap-1 ml-auto"
                      >
                        <span>
                          {item.suggestedTab === "lineup" ? "Schiera" : "Incarichi"}
                        </span>
                        <ArrowRight className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer con bottoni di conferma o annulla */}
        <DialogFooter className="p-4 sm:p-5 bg-muted/30 border-t border-border/70 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
            className="text-xs font-bold w-full sm:w-auto"
          >
            {isValid ? "Modifica ancora" : "Chiudi e Correggi"}
          </Button>

          <Button
            type="button"
            onClick={onConfirmSave}
            disabled={!isValid || isSaving}
            className={`text-xs font-extrabold gap-1.5 shadow-md w-full sm:w-auto ${
              isValid
                ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
            }`}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                Salvataggio in corso...
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5 mr-1" />
                Conferma e Salva Formazione
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FormationValidationModal;

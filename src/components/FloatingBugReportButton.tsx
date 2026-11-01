import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { Bug, Send, Loader2, CheckCircle2, HelpCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/context/AuthContext";
import {
  sendBugReport,
  BUG_CATEGORIES,
  BugReportCategory,
} from "@/services/bugReportService";
import { toast } from "sonner";

export function FloatingBugReportButton() {
  const location = useLocation();
  const { user, isAdmin } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [category, setCategory] = useState<BugReportCategory>("bug");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [customSender, setCustomSender] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Inserisci un titolo per la segnalazione.");
      return;
    }
    if (!description.trim()) {
      toast.error("Descrivi il problema riscontrato.");
      return;
    }

    setIsSubmitting(true);
    try {
      const senderName = user
        ? user.name || user.username || (isAdmin ? "Admin" : "Manager")
        : customSender.trim() || "Utente Ospite";

      const res = await sendBugReport({
        title,
        description,
        category,
        page_url: location.pathname + location.search,
        sender_username: senderName,
        sender_team: user?.team || undefined,
      });

      if (!res.success) {
        throw new Error(res.error);
      }

      toast.success("Segnalazione inviata con successo all'Admin! Grazie per il feedback.", {
        icon: "🐞",
      });

      setTitle("");
      setDescription("");
      setCategory("bug");
      setCustomSender("");
      setIsOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Errore durante l'invio della segnalazione.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* FLOATING ACTION BUTTON (IN BASSO A DESTRA) */}
      <div className="fixed bottom-6 right-6 z-40 print:hidden">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              aria-label="Segnala un Bug o Feedback"
              className="group relative flex items-center justify-center h-13 w-13 rounded-full bg-gradient-to-tr from-rose-600 to-amber-600 text-white shadow-xl hover:shadow-2xl hover:scale-110 active:scale-95 transition-all duration-200 border-2 border-white/20 focus:outline-none focus:ring-4 focus:ring-rose-500/30 cursor-pointer"
            >
              <Bug className="h-6 w-6 group-hover:rotate-12 transition-transform duration-200" />
              {/* Pulse animation dot */}
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500 border border-white/50" />
              </span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="left" className="font-bold text-xs">
            Segnala un Bug o Feedback 🐞
          </TooltipContent>
        </Tooltip>
      </div>

      {/* MODALE SEGNALAZIONE BUG */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border/80">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400">
                <Bug className="h-5 w-5" />
              </div>
              <DialogTitle className="text-lg font-black">
                Segnala un Bug o Feedback
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              Hai riscontrato un'anomalia o un errore? Invia un report diretto all'amministrazione: verrà recapitato istantaneamente nei messaggi dell'Admin.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {/* Context bar (pagina + mittente) */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-muted/40 border border-border/70 text-xs">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-muted-foreground font-semibold">Pagina:</span>
                <Badge variant="outline" className="font-mono text-[10px] truncate max-w-[200px]">
                  {location.pathname}
                </Badge>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground font-semibold">Mittente:</span>
                <span className="font-bold text-foreground">
                  {user ? `${user.username || user.name} ${user.team ? `(${user.team})` : ""}` : "Ospite"}
                </span>
              </div>
            </div>

            {/* Mittente opzionale se utente non loggato */}
            {!user && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  Il tuo Nome o Squadra:
                </label>
                <Input
                  placeholder="Es. Mario Rossi (Squadra X)"
                  value={customSender}
                  onChange={(e) => setCustomSender(e.target.value)}
                  className="text-xs h-9"
                />
              </div>
            )}

            {/* Categoria */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                Tipologia Segnalazione:
              </label>
              <Select
                value={category}
                onValueChange={(v: BugReportCategory) => setCategory(v)}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Seleziona tipologia" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(BUG_CATEGORIES) as BugReportCategory[]).map((catKey) => {
                    const c = BUG_CATEGORIES[catKey];
                    return (
                      <SelectItem key={catKey} value={catKey} className="text-xs">
                        <span className="mr-1.5">{c.icon}</span>
                        <span>{c.label}</span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Titolo breve */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                Titolo Breve:
              </label>
              <Input
                placeholder="Es. Il tasto Conferma Scelta non risponde, oppure testo sovrapposto..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
                required
                className="text-xs h-9 font-medium"
              />
            </div>

            {/* Descrizione */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                Descrizione Dettagliata:
              </label>
              <Textarea
                placeholder="Cosa stavi facendo? Qual è stato il comportamento inatteso riscontrato?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                required
                className="text-xs resize-none"
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/70">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting}
                className="text-xs"
              >
                Annulla
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting || !title.trim() || !description.trim()}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs gap-1.5 shadow-md shadow-rose-600/20"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Invio in corso...
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    Invia Segnalazione
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

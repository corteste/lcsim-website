import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { XCircle } from "lucide-react";

interface TradeRejectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: (reason: string) => Promise<void> | void;
}

/**
 * Modale integrato per confermare il rifiuto di una trattativa inserendo una motivazione opzionale.
 */
export const TradeRejectDialog: React.FC<TradeRejectDialogProps> = ({
  open,
  onOpenChange,
  title = "Rifiuta Proposta di Scambio",
  description = "Inserisci una motivazione opzionale del rifiuto (verrà mostrata nella scheda della trattativa).",
  confirmLabel = "Conferma Rifiuto",
  loading = false,
  onConfirm,
}) => {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (open) {
      setReason("");
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onConfirm(reason.trim());
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !loading && onOpenChange(next)}>
      <DialogContent className="sm:max-w-md border-border/80 bg-card">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-extrabold text-foreground">
              <XCircle className="h-5 w-5 text-rose-500 shrink-0" />
              <span>{title}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {description}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <label
              htmlFor="trade-reject-reason"
              className="text-xs font-bold text-muted-foreground"
            >
              Motivazione del rifiuto (opzionale)
            </label>
            <Textarea
              id="trade-reject-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Es. Valutiamo il giocatore diversamente, prova ad aggiungere una scelta..."
              rows={3}
              disabled={loading}
              autoFocus
              className="resize-none text-xs sm:text-sm bg-background"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="text-xs font-semibold"
            >
              Annulla
            </Button>
            <Button
              type="submit"
              variant="destructive"
              size="sm"
              disabled={loading}
              className="text-xs font-bold gap-1.5"
            >
              <XCircle className="h-3.5 w-3.5" />
              <span>{loading ? "Invio..." : confirmLabel}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

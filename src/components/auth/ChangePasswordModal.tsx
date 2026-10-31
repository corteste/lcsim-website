import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import {
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  User,
} from "lucide-react";

interface ChangePasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  open,
  onOpenChange,
}) => {
  const { user, isAdmin, effectiveTeam, changePassword } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
    setError(null);
  };

  const handleClose = () => {
    if (!loading) {
      resetForm();
      onOpenChange(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentPassword) {
      setError("Inserisci la tua password attuale.");
      return;
    }

    if (!newPassword || newPassword.trim().length < 6) {
      setError("La nuova password deve contenere almeno 6 caratteri.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Le due nuove password non coincidono.");
      return;
    }

    if (currentPassword === newPassword) {
      setError("La nuova password deve essere diversa da quella attuale.");
      return;
    }

    setLoading(true);
    try {
      const res = await changePassword(currentPassword, newPassword);
      if (res.success) {
        toast.success("Password modificata con successo!", {
          description: "Le nuove credenziali sono attive immediatamente.",
        });
        resetForm();
        onOpenChange(false);
      } else {
        setError(res.error || "Errore durante l'aggiornamento della password.");
      }
    } catch (err: any) {
      setError(err?.message || "Si è verificato un errore imprevisto.");
    } finally {
      setLoading(false);
    }
  };

  const isMinLength = newPassword.length >= 6;
  const isMatch = confirmPassword.length > 0 && newPassword === confirmPassword;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[440px] p-6 bg-card border border-border shadow-2xl rounded-2xl">
        <DialogHeader className="space-y-2.5 pb-2 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-black text-foreground">
                Cambia Password
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Aggiorna le credenziali di accesso al tuo account.
              </DialogDescription>
            </div>
          </div>

          {/* Account Profile Pill */}
          {user && (
            <div className="flex items-center justify-between p-2 rounded-xl bg-muted/40 border border-border/60 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-6 w-6 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-[11px] shrink-0">
                  <User className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-foreground truncate block text-xs">
                    {user.name} ({user.username})
                  </span>
                </div>
              </div>
              {effectiveTeam ? (
                <Badge variant="outline" className="text-[10px] font-mono font-bold shrink-0">
                  {effectiveTeam}
                </Badge>
              ) : isAdmin ? (
                <Badge variant="outline" className="text-[10px] font-mono font-bold text-amber-500 border-amber-500/30 shrink-0">
                  ADMIN
                </Badge>
              ) : null}
            </div>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {error && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          {/* Password Attuale */}
          <div className="space-y-1.5">
            <Label htmlFor="current-pw" className="text-xs font-bold text-foreground">
              Password Attuale
            </Label>
            <div className="relative">
              <Input
                id="current-pw"
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Inserisci la password attuale"
                autoComplete="current-password"
                disabled={loading}
                className="pr-10 h-10 text-xs bg-muted/30 border-border"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                tabIndex={-1}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                aria-label={showCurrent ? "Nascondi password" : "Mostra password"}
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Nuova Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="new-pw" className="text-xs font-bold text-foreground">
                Nuova Password
              </Label>
              <span className={`text-[10px] font-mono flex items-center gap-1 ${
                isMinLength ? "text-emerald-500 font-bold" : "text-muted-foreground"
              }`}>
                {isMinLength ? (
                  <>
                    <CheckCircle2 className="h-3 w-3" /> Minimo 6 caratteri
                  </>
                ) : (
                  "Minimo 6 caratteri"
                )}
              </span>
            </div>
            <div className="relative">
              <Input
                id="new-pw"
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nuova password (min. 6 caratteri)"
                autoComplete="new-password"
                disabled={loading}
                className="pr-10 h-10 text-xs bg-muted/30 border-border"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                tabIndex={-1}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                aria-label={showNew ? "Nascondi password" : "Mostra password"}
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Conferma Nuova Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="confirm-pw" className="text-xs font-bold text-foreground">
                Conferma Nuova Password
              </Label>
              {confirmPassword.length > 0 && (
                <span className={`text-[10px] font-mono flex items-center gap-1 ${
                  isMatch ? "text-emerald-500 font-bold" : "text-rose-500"
                }`}>
                  {isMatch ? (
                    <>
                      <CheckCircle2 className="h-3 w-3" /> Password coincidenti
                    </>
                  ) : (
                    "Le password non coincidono"
                  )}
                </span>
              )}
            </div>
            <div className="relative">
              <Input
                id="confirm-pw"
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ripeti la nuova password"
                autoComplete="new-password"
                disabled={loading}
                className="pr-10 h-10 text-xs bg-muted/30 border-border"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                tabIndex={-1}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                aria-label={showConfirm ? "Nascondi password" : "Mostra password"}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <DialogFooter className="pt-2 sm:justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="w-full sm:w-auto h-9 text-xs font-bold"
            >
              Annulla
            </Button>
            <Button
              type="submit"
              disabled={loading || !currentPassword || !newPassword || !confirmPassword || !isMinLength || !isMatch}
              className="w-full sm:w-auto h-9 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Salvataggio...</span>
                </>
              ) : (
                <>
                  <Lock className="h-3.5 w-3.5" />
                  <span>Aggiorna Password</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ChangePasswordModal;

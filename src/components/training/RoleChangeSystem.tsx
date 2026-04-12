import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, ArrowRight } from "lucide-react";
import { Player } from "@/types/player";
import {
  AVAILABLE_ROLES,
  AVAILABLE_SUBROLES,
  XP_COSTS,
  savePlayerRoleChange,
  deductPlayerXP,
} from "@/types/training";
import { toast } from "sonner";

interface RoleChangeSystemProps {
  player: Player | null;
  xpAvailable: number;
  onXpChange: (cost: number) => void;
}

export default function RoleChangeSystem({ player, xpAvailable, onXpChange }: RoleChangeSystemProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [newRole, setNewRole] = useState("");
  const [newSubRole, setNewSubRole] = useState("");

  const currentRole = player?.Posiz ?? "—";

  // Subroles compatible with the new role
  const compatibleSubRoles = AVAILABLE_SUBROLES.filter((sr) =>
    sr.positions.some((p) => newRole.includes(p) || p.includes(newRole))
  );

  const openDialog = () => {
    setNewRole("");
    setNewSubRole("");
    setStep(1);
    setShowDialog(true);
  };

  const handleNext = () => {
    if (!newRole) { toast.error("Seleziona un nuovo ruolo!"); return; }
    setNewSubRole("");
    setStep(2);
  };

  const handleConfirm = () => {
    if (!player) return;
    if (!newSubRole) { toast.error("Seleziona un Ruolo+!"); return; }
    if (xpAvailable < XP_COSTS.ROLE_CHANGE) { toast.error("XP insufficienti!"); return; }

    onXpChange(XP_COSTS.ROLE_CHANGE);
    savePlayerRoleChange(player.ID, newRole, newSubRole);
    deductPlayerXP(player.ID, XP_COSTS.ROLE_CHANGE);
    toast.success(`Ruolo cambiato a ${newRole} con Ruolo+ ${AVAILABLE_SUBROLES.find(s => s.id === newSubRole)?.name}!`);
    setShowDialog(false);
  };

  return (
    <Card className="shadow-lg border-primary/10">
      <CardHeader className="bg-gradient-to-r from-green-500/10 to-primary/5">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 text-green-500" />
          <CardTitle>Cambio Ruolo</CardTitle>
        </div>
        <CardDescription>Cambia il ruolo principale del giocatore ({XP_COSTS.ROLE_CHANGE} XP)</CardDescription>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border">
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Ruolo Attuale</div>
            <div className="text-2xl font-bold mt-1">{currentRole}</div>
          </div>
          <Button onClick={openDialog} disabled={!player}>
            <RefreshCw className="h-4 w-4 mr-2" /> Cambia Ruolo
          </Button>
        </div>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{step === 1 ? "Scegli Nuovo Ruolo" : "Scegli Ruolo+"}</DialogTitle>
              <DialogDescription>
                {step === 1
                  ? `Seleziona il nuovo ruolo per il giocatore. Costo: ${XP_COSTS.ROLE_CHANGE} XP`
                  : `Scegli il Ruolo+ associato al nuovo ruolo ${newRole}`}
              </DialogDescription>
            </DialogHeader>

            {step === 1 ? (
              <div className="space-y-3">
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona ruolo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_ROLES.filter((r) => r !== currentRole).map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {newRole && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
                    <Badge variant="outline">{currentRole}</Badge>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <Badge>{newRole}</Badge>
                  </div>
                )}
              </div>
            ) : (
              <Select value={newSubRole} onValueChange={setNewSubRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona Ruolo+..." />
                </SelectTrigger>
                <SelectContent>
                  {compatibleSubRoles.map((sr) => (
                    <SelectItem key={sr.id} value={sr.id}>
                      {sr.name} — {sr.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>Annulla</Button>
              {step === 1 ? (
                <Button onClick={handleNext} disabled={!newRole}>Avanti</Button>
              ) : (
                <Button onClick={handleConfirm} disabled={!newSubRole}>
                  Conferma ({XP_COSTS.ROLE_CHANGE} XP)
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

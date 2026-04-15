import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, ArrowRight, UserPlus, Crown, ArrowRightLeft, Shield, Trash2 } from "lucide-react";
import { Player } from "@/types/player";
import {
  AVAILABLE_ROLES,
  AVAILABLE_SUBROLES,
  PlayerSubRole,
  XP_COSTS,
  savePlayerRoleChange,
  savePlayerSubRoles,
  deductPlayerXP,
} from "@/types/training";
import { toast } from "sonner";

interface RoleSystemProps {
  player: Player | null;
  xpAvailable: number;
  onXpChange: (cost: number) => void;
}

const MAX_ROLE_PLUS = 2;
const OVR_PLUSPLUS_THRESHOLD = 85;

export default function RoleSystem({ player, xpAvailable, onXpChange }: RoleSystemProps) {
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [roleStep, setRoleStep] = useState<1 | 2>(1);
  const [newRole, setNewRole] = useState("");
  const [newSubRole, setNewSubRole] = useState("");

  const [ownedSubRoles, setOwnedSubRoles] = useState<PlayerSubRole[]>([]);
  const [dialogMode, setDialogMode] = useState<"add" | "swap" | "upgrade" | null>(null);
  const [selectedSubRoleId, setSelectedSubRoleId] = useState("");
  const [swapTargetIndex, setSwapTargetIndex] = useState(0);

  const currentRole = player?.Posiz ?? "—";
  const playerPos = player?.Posiz ?? "";
  const playerOvr = player?.OVR ?? 0;
  const canUpgradePlusPlus = playerOvr >= OVR_PLUSPLUS_THRESHOLD;
  const hasPlusPlus = ownedSubRoles.some((r) => r.tier === "plusplus");

  const compatibleSubRolesForNewRole = AVAILABLE_SUBROLES.filter((sr) =>
    sr.positions.some((p) => newRole.includes(p) || p.includes(newRole))
  );

  const openRoleDialog = () => {
    setNewRole("");
    setNewSubRole("");
    setRoleStep(1);
    setShowRoleDialog(true);
  };

  const handleRoleNext = () => {
    if (!newRole) { toast.error("Seleziona un nuovo ruolo!"); return; }
    setNewSubRole("");
    setRoleStep(2);
  };

  const handleRoleConfirm = () => {
    if (!player) return;
    if (!newSubRole) { toast.error("Seleziona un Ruolo+!"); return; }
    if (xpAvailable < XP_COSTS.ROLE_CHANGE) { toast.error("XP insufficienti!"); return; }
    onXpChange(XP_COSTS.ROLE_CHANGE);
    savePlayerRoleChange(player.ID, newRole, newSubRole);
    deductPlayerXP(player.ID, XP_COSTS.ROLE_CHANGE);
    toast.success(`Ruolo cambiato a ${newRole} con Ruolo+ ${AVAILABLE_SUBROLES.find(s => s.id === newSubRole)?.name}!`);
    setShowRoleDialog(false);
  };

  const compatibleSubRoles = useMemo(
    () => AVAILABLE_SUBROLES.filter((sr) => sr.positions.some((p) => playerPos.includes(p) || p.includes(playerPos))),
    [playerPos]
  );

  const availableForAdd = compatibleSubRoles.filter(
    (sr) => !ownedSubRoles.some((o) => o.subRoleId === sr.id)
  );

  const getSubRoleInfo = (id: string) => AVAILABLE_SUBROLES.find((sr) => sr.id === id);

  const openAddDialog = () => {
    if (ownedSubRoles.length >= MAX_ROLE_PLUS) { toast.error("Massimo 2 Ruoli+ raggiunto!"); return; }
    setSelectedSubRoleId("");
    setDialogMode("add");
  };

  const openSwapDialog = (index: number) => {
    setSwapTargetIndex(index);
    setSelectedSubRoleId("");
    setDialogMode("swap");
  };

  const openUpgradeDialog = (index: number) => {
    if (!canUpgradePlusPlus) { toast.error("Serve 85 OVR per Ruolo++!"); return; }
    if (hasPlusPlus) { toast.error("Già possiedi un Ruolo++!"); return; }
    setSwapTargetIndex(index);
    setDialogMode("upgrade");
  };

  const handleRemoveSubRole = (index: number) => {
    if (!player) return;
    const updated = ownedSubRoles.filter((_, i) => i !== index);
    setOwnedSubRoles(updated);
    savePlayerSubRoles(player.ID, updated);
    toast.success("Ruolo+ rimosso!");
  };

  const confirmSubRoleAction = () => {
    if (!player) return;
    if (dialogMode === "add") {
      if (!selectedSubRoleId) { toast.error("Seleziona un ruolo!"); return; }
      const cost = ownedSubRoles.length === 0 ? 0 : XP_COSTS.ROLE_PLUS_ADD;
      if (xpAvailable < cost) { toast.error("XP insufficienti!"); return; }
      const updated = [...ownedSubRoles, { subRoleId: selectedSubRoleId, tier: "plus" as const }];
      setOwnedSubRoles(updated);
      if (cost > 0) onXpChange(cost);
      savePlayerSubRoles(player.ID, updated);
      if (cost > 0) deductPlayerXP(player.ID, cost);
      toast.success(`Ruolo+ aggiunto!${cost === 0 ? " (primo gratuito)" : ""}`);
    } else if (dialogMode === "swap") {
      if (!selectedSubRoleId) { toast.error("Seleziona un ruolo!"); return; }
      if (xpAvailable < XP_COSTS.ROLE_PLUS_SWAP) { toast.error("XP insufficienti!"); return; }
      const updated = [...ownedSubRoles];
      updated[swapTargetIndex] = { ...updated[swapTargetIndex], subRoleId: selectedSubRoleId };
      setOwnedSubRoles(updated);
      onXpChange(XP_COSTS.ROLE_PLUS_SWAP);
      savePlayerSubRoles(player.ID, updated);
      deductPlayerXP(player.ID, XP_COSTS.ROLE_PLUS_SWAP);
      toast.success("Ruolo+ cambiato!");
    } else if (dialogMode === "upgrade") {
      if (xpAvailable < XP_COSTS.ROLE_PLUSPLUS) { toast.error("XP insufficienti!"); return; }
      const updated = [...ownedSubRoles];
      updated[swapTargetIndex] = { ...updated[swapTargetIndex], tier: "plusplus" };
      setOwnedSubRoles(updated);
      onXpChange(XP_COSTS.ROLE_PLUSPLUS);
      savePlayerSubRoles(player.ID, updated);
      deductPlayerXP(player.ID, XP_COSTS.ROLE_PLUSPLUS);
      toast.success("Ruolo++ sbloccato!");
    }
    setDialogMode(null);
  };

  return (
    <Card className="shadow-lg border-primary/10">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/5">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <CardTitle>Ruolo & Ruolo+</CardTitle>
        </div>
        <CardDescription>Gestisci ruolo principale e sotto-ruoli del giocatore</CardDescription>
      </CardHeader>
      <CardContent className="pt-4 space-y-6">
        {/* Sezione Cambio Ruolo */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <RefreshCw className="h-3.5 w-3.5" /> Cambio Ruolo
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border">
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Ruolo Attuale</div>
              <div className="text-2xl font-bold mt-1">{currentRole}</div>
            </div>
            <Button onClick={openRoleDialog} disabled={!player}>
              <RefreshCw className="h-4 w-4 mr-2" /> Cambia Ruolo
            </Button>
          </div>
          <div className="text-xs text-muted-foreground p-2 bg-muted/20 rounded">
            Costo: {XP_COSTS.ROLE_CHANGE} XP — include la scelta di un nuovo Ruolo+
          </div>
        </div>

        <div className="border-t" />

        {/* Sezione Ruolo+ */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <UserPlus className="h-3.5 w-3.5" /> Ruolo+
          </div>

          {ownedSubRoles.length > 0 ? (
            <div className="space-y-2">
              {ownedSubRoles.map((sr, idx) => {
                const info = getSubRoleInfo(sr.subRoleId);
                if (!info) return null;
                return (
                  <div
                    key={sr.subRoleId}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                      sr.tier === "plusplus" ? "bg-accent/20 border-accent/40" : "bg-muted/30 border-border"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {sr.tier === "plusplus" ? (
                        <Crown className="h-4 w-4 text-accent-foreground" />
                      ) : (
                        <UserPlus className="h-4 w-4 text-primary" />
                      )}
                      <div>
                        <div className="text-sm font-medium">{info.name}</div>
                        <div className="text-xs text-muted-foreground">{info.description}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge variant={sr.tier === "plusplus" ? "default" : "secondary"}>
                        {sr.tier === "plusplus" ? "Ruolo++" : "Ruolo+"}
                      </Badge>
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => openSwapDialog(idx)}>
                        <ArrowRightLeft className="h-3 w-3 mr-1" /> Cambia
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs text-destructive hover:bg-destructive/10"
                        onClick={() => handleRemoveSubRole(idx)}
                      >
                        <Trash2 className="h-3 w-3 mr-1" /> Rimuovi
                      </Button>
                      {sr.tier === "plus" && canUpgradePlusPlus && !hasPlusPlus && (
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => openUpgradeDialog(idx)}>
                          <Crown className="h-3 w-3 mr-1" /> ++
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground text-sm border rounded-lg border-dashed">
              Nessun Ruolo+ assegnato. Aggiungine uno gratuitamente!
            </div>
          )}

          {ownedSubRoles.length < MAX_ROLE_PLUS && (
            <Button variant="outline" className="w-full" onClick={openAddDialog}>
              <UserPlus className="h-4 w-4 mr-2" />
              Aggiungi Ruolo+ {ownedSubRoles.length === 0 ? "(Gratis)" : `(${XP_COSTS.ROLE_PLUS_ADD} XP)`}
            </Button>
          )}

          {canUpgradePlusPlus && !hasPlusPlus && (
            <div className="text-xs text-muted-foreground p-2 bg-accent/10 rounded border border-accent/20">
              ⭐ OVR ≥ 85 — Upgrade Ruolo++ disponibile!
            </div>
          )}
        </div>

        <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{roleStep === 1 ? "Scegli Nuovo Ruolo" : "Scegli Ruolo+"}</DialogTitle>
              <DialogDescription>
                {roleStep === 1
                  ? `Seleziona il nuovo ruolo. Costo: ${XP_COSTS.ROLE_CHANGE} XP`
                  : `Scegli il Ruolo+ associato al nuovo ruolo ${newRole}`}
              </DialogDescription>
            </DialogHeader>
            {roleStep === 1 ? (
              <div className="space-y-3">
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger><SelectValue placeholder="Seleziona ruolo..." /></SelectTrigger>
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
                <SelectTrigger><SelectValue placeholder="Seleziona Ruolo+..." /></SelectTrigger>
                <SelectContent>
                  {compatibleSubRolesForNewRole.map((sr) => (
                    <SelectItem key={sr.id} value={sr.id}>{sr.name} — {sr.description}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRoleDialog(false)}>Annulla</Button>
              {roleStep === 1 ? (
                <Button onClick={handleRoleNext} disabled={!newRole}>Avanti</Button>
              ) : (
                <Button onClick={handleRoleConfirm} disabled={!newSubRole}>
                  Conferma ({XP_COSTS.ROLE_CHANGE} XP)
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!dialogMode} onOpenChange={() => setDialogMode(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {dialogMode === "add" && "Aggiungi Ruolo+"}
                {dialogMode === "swap" && "Cambia Ruolo+"}
                {dialogMode === "upgrade" && "Upgrade a Ruolo++"}
              </DialogTitle>
              <DialogDescription>
                {dialogMode === "add" && (ownedSubRoles.length === 0 ? "Il primo Ruolo+ è gratuito!" : `Costo: ${XP_COSTS.ROLE_PLUS_ADD} XP`)}
                {dialogMode === "swap" && `Costo: ${XP_COSTS.ROLE_PLUS_SWAP} XP`}
                {dialogMode === "upgrade" && `Costo: ${XP_COSTS.ROLE_PLUSPLUS} XP`}
              </DialogDescription>
            </DialogHeader>
            {dialogMode !== "upgrade" && (
              <Select value={selectedSubRoleId} onValueChange={setSelectedSubRoleId}>
                <SelectTrigger><SelectValue placeholder="Seleziona un sotto-ruolo..." /></SelectTrigger>
                <SelectContent>
                  {availableForAdd.map((sr) => (
                    <SelectItem key={sr.id} value={sr.id}>{sr.name} — {sr.description}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogMode(null)}>Annulla</Button>
              <Button onClick={confirmSubRoleAction}>Conferma</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

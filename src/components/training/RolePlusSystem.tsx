import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Crown, ArrowRightLeft } from "lucide-react";
import { Player } from "@/types/player";
import {
  AVAILABLE_SUBROLES,
  PlayerSubRole,
  SubRole,
  XP_COSTS,
  savePlayerSubRoles,
  deductPlayerXP,
} from "@/types/training";
import { toast } from "sonner";

interface RolePlusSystemProps {
  player: Player | null;
  xpAvailable: number;
  onXpChange: (cost: number) => void;
}

const MAX_ROLE_PLUS = 2;
const OVR_PLUSPLUS_THRESHOLD = 85;

export default function RolePlusSystem({ player, xpAvailable, onXpChange }: RolePlusSystemProps) {
  const [ownedSubRoles, setOwnedSubRoles] = useState<PlayerSubRole[]>([]);
  const [dialogMode, setDialogMode] = useState<"add" | "swap" | "upgrade" | null>(null);
  const [selectedSubRoleId, setSelectedSubRoleId] = useState<string>("");
  const [swapTargetIndex, setSwapTargetIndex] = useState<number>(0);

  const playerPos = player?.Posiz ?? "";
  const playerOvr = player?.OVR ?? 0;
  const canUpgradePlusPlus = playerOvr >= OVR_PLUSPLUS_THRESHOLD;
  const hasPlusPlus = ownedSubRoles.some((r) => r.tier === "plusplus");

  // Compatible subroles for player's position
  const compatibleSubRoles = useMemo(
    () => AVAILABLE_SUBROLES.filter((sr) => sr.positions.some((p) => playerPos.includes(p) || p.includes(playerPos))),
    [playerPos]
  );

  const availableForAdd = compatibleSubRoles.filter(
    (sr) => !ownedSubRoles.some((o) => o.subRoleId === sr.id)
  );

  const getSubRoleInfo = (id: string) => AVAILABLE_SUBROLES.find((sr) => sr.id === id);

  const openAddDialog = () => {
    if (ownedSubRoles.length >= MAX_ROLE_PLUS) {
      toast.error("Massimo 2 Ruoli+ raggiunto!");
      return;
    }
    setSelectedSubRoleId("");
    setDialogMode("add");
  };

  const openSwapDialog = (index: number) => {
    setSwapTargetIndex(index);
    setSelectedSubRoleId("");
    setDialogMode("swap");
  };

  const openUpgradeDialog = (index: number) => {
    if (!canUpgradePlusPlus) {
      toast.error("Serve 85 OVR per Ruolo++!");
      return;
    }
    if (hasPlusPlus) {
      toast.error("Già possiedi un Ruolo++!");
      return;
    }
    setSwapTargetIndex(index);
    setDialogMode("upgrade");
  };

  const confirmAction = () => {
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
      <CardHeader className="bg-gradient-to-r from-blue-500/10 to-primary/5">
        <div className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-blue-500" />
          <CardTitle>Ruolo+</CardTitle>
        </div>
        <CardDescription>
          Gestisci i sotto-ruoli (max {MAX_ROLE_PLUS}). Il primo è gratuito.
          {canUpgradePlusPlus && !hasPlusPlus && " ⭐ Upgrade Ruolo++ disponibile!"}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {/* Owned Sub-Roles */}
        {ownedSubRoles.length > 0 ? (
          <div className="space-y-2">
            {ownedSubRoles.map((sr, idx) => {
              const info = getSubRoleInfo(sr.subRoleId);
              if (!info) return null;
              return (
                <div
                  key={sr.subRoleId}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                    sr.tier === "plusplus" ? "bg-amber-500/10 border-amber-500/30" : "bg-muted/30 border-border"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {sr.tier === "plusplus" ? (
                      <Crown className="h-4 w-4 text-amber-500" />
                    ) : (
                      <UserPlus className="h-4 w-4 text-blue-500" />
                    )}
                    <div>
                      <div className="text-sm font-medium">{info.name}</div>
                      <div className="text-xs text-muted-foreground">{info.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge variant={sr.tier === "plusplus" ? "default" : "secondary"} className={sr.tier === "plusplus" ? "bg-amber-500" : ""}>
                      {sr.tier === "plusplus" ? "Ruolo++" : "Ruolo+"}
                    </Badge>
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => openSwapDialog(idx)}>
                      <ArrowRightLeft className="h-3 w-3 mr-1" /> Cambia
                    </Button>
                    {sr.tier === "plus" && canUpgradePlusPlus && !hasPlusPlus && (
                      <Button size="sm" variant="outline" className="h-7 text-xs border-amber-400 text-amber-600" onClick={() => openUpgradeDialog(idx)}>
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

        {/* Dialog */}
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
                {dialogMode === "upgrade" && `Costo: ${XP_COSTS.ROLE_PLUSPLUS} XP. Upgrade del ruolo selezionato.`}
              </DialogDescription>
            </DialogHeader>

            {dialogMode !== "upgrade" && (
              <Select value={selectedSubRoleId} onValueChange={setSelectedSubRoleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona un sotto-ruolo..." />
                </SelectTrigger>
                <SelectContent>
                  {availableForAdd.map((sr) => (
                    <SelectItem key={sr.id} value={sr.id}>
                      {sr.name} — {sr.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogMode(null)}>Annulla</Button>
              <Button onClick={confirmAction}>Conferma</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

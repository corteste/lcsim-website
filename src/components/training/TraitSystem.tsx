import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, Lock, ShieldCheck, Sparkles, AlertTriangle } from "lucide-react";
import { Player } from "@/types/player";
import {
  AVAILABLE_TRAITS,
  PlayerTrait,
  Trait,
  XP_COSTS,
  savePlayerTraits,
  deductPlayerXP,
  dbToId,
} from "@/types/training";
import { toast } from "sonner";

interface TraitSystemProps {
  player: Player | null;
  xpAvailable: number;
  onXpChange: (cost: number) => void;
  onPlayerUpdate?: (updatedPlayer: Player) => void;
}

const CATEGORIES = [
  { key: "all", label: "Tutti" },
  { key: "offensive", label: "Offensivi" },
  { key: "defensive", label: "Difensivi" },
  { key: "physical", label: "Fisici" },
  { key: "mental", label: "Mentali" },
  { key: "goalkeeper", label: "Portiere" },
] as const;

const MAX_TRAITS = 5;
const MAX_GOLD = 1;
const OVR_GOLD_THRESHOLD = 85;

export default function TraitSystem({ player, xpAvailable, onXpChange, onPlayerUpdate }: TraitSystemProps) {
  const [ownedTraits, setOwnedTraits] = useState<PlayerTrait[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<{
    type: "buy" | "upgrade_gold" | "swap_gold";
    trait: Trait;
    replaceTrait?: PlayerTrait;
  } | null>(null);

  const playerOvr = player?.OVR ?? 0;
  const canGetGold = playerOvr >= OVR_GOLD_THRESHOLD;
  const goldCount = ownedTraits.filter((t) => t.tier === "gold").length;
  const hasUsedFreeGold = ownedTraits.some((t) => t.tier === "gold");

  // Load traits from player database fields when player changes
  useEffect(() => {
    if (!player) {
      setOwnedTraits([]);
      return;
    }

    const traitsList: PlayerTrait[] = [];

    const parseTraitsField = (fieldValue: string | null | undefined, tier: "silver" | "gold") => {
      if (!fieldValue) return;
      const parts = fieldValue.split(",").map(p => p.trim()).filter(Boolean);
      for (const part of parts) {
        const id = dbToId(part);
        if (!traitsList.some(t => t.traitId === id)) {
          traitsList.push({ traitId: id, tier });
        }
      }
    };

    parseTraitsField(player.IconTrait1, "gold");
    parseTraitsField(player.IconTrait2, "gold");
    parseTraitsField(player.Trait1, "silver");
    parseTraitsField(player.Trait2, "silver");

    setOwnedTraits(traitsList);
  }, [player]);

  // Check if a trait's attribute requirements are met
  const meetsRequirements = (trait: Trait): boolean => {
    if (!player) return false;
    return Object.entries(trait.requirements).every(([attr, minVal]) => {
      const val = (player as any)[attr] ?? 0;
      return val >= minVal;
    });
  };

  const handleBuyTrait = (trait: Trait) => {
    if (ownedTraits.length >= MAX_TRAITS) {
      toast.error("Massimo 5 tratti raggiunto!");
      return;
    }
    if (ownedTraits.some((t) => t.traitId === trait.id)) {
      toast.error("Tratto già posseduto!");
      return;
    }
    if (!meetsRequirements(trait)) {
      toast.error("Requisiti attributo non soddisfatti!");
      return;
    }
    setConfirmDialog({ type: "buy", trait });
  };

  const handleSwapGold = (newTrait: Trait, oldGoldTrait: PlayerTrait) => {
    setConfirmDialog({ type: "swap_gold", trait: newTrait, replaceTrait: oldGoldTrait });
  };

  const confirmAction = async () => {
    if (!confirmDialog || !player) return;
    const { type, trait, replaceTrait } = confirmDialog;

    if (type === "buy") {
      const shouldBeGold = canGetGold && !hasUsedFreeGold;
      const cost = shouldBeGold ? 0 : XP_COSTS.TRAIT_SILVER;

      if (xpAvailable < cost) {
        toast.error("XP insufficienti!");
        setConfirmDialog(null);
        return;
      }

      const newTrait: PlayerTrait = { traitId: trait.id, tier: shouldBeGold ? "gold" : "silver" };
      const updated = [...ownedTraits, newTrait];
      
      try {
        let updatedPlayer = await savePlayerTraits(player.ID, updated);
        if (cost > 0) {
          updatedPlayer = await deductPlayerXP(player.ID, cost);
        }
        setOwnedTraits(updated);
        if (cost > 0) onXpChange(cost);
        if (onPlayerUpdate) onPlayerUpdate(updatedPlayer);
        toast.success(shouldBeGold ? `${trait.name} sbloccato come ORO (gratis a 85 OVR)!` : `${trait.name} sbloccato!`);
      } catch (err) {
        console.error(err);
        toast.error("Errore durante il salvataggio dei tratti.");
      }
    } else if (type === "swap_gold" && replaceTrait) {
      if (xpAvailable < XP_COSTS.TRAIT_GOLD_SWAP) {
        toast.error("XP insufficienti!");
        setConfirmDialog(null);
        return;
      }
      const updated = ownedTraits.map((t) => {
        if (t.traitId === replaceTrait.traitId) return { ...t, tier: "silver" as const };
        if (t.traitId === trait.id) return { ...t, tier: "gold" as const };
        return t;
      });
      
      try {
        let updatedPlayer = await savePlayerTraits(player.ID, updated);
        updatedPlayer = await deductPlayerXP(player.ID, XP_COSTS.TRAIT_GOLD_SWAP);
        setOwnedTraits(updated);
        onXpChange(XP_COSTS.TRAIT_GOLD_SWAP);
        if (onPlayerUpdate) onPlayerUpdate(updatedPlayer);
        toast.success(`${trait.name} promosso a ORO!`);
      } catch (err) {
        console.error(err);
        toast.error("Errore durante lo scambio del tratto.");
      }
    }
    setConfirmDialog(null);
  };

  const removeTrait = async (traitId: string) => {
    if (!player) return;
    const updated = ownedTraits.filter((t) => t.traitId !== traitId);
    try {
      const updatedPlayer = await savePlayerTraits(player.ID, updated);
      setOwnedTraits(updated);
      if (onPlayerUpdate) onPlayerUpdate(updatedPlayer);
      toast.info("Tratto rimosso");
    } catch (err) {
      console.error(err);
      toast.error("Errore durante la rimozione del tratto.");
    }
  };

  const getTraitInfo = (id: string) => AVAILABLE_TRAITS.find((t) => t.id === id);
  const currentGoldTrait = ownedTraits.find((t) => t.tier === "gold");

  return (
    <Card className="shadow-lg border-primary/10">
      <CardHeader className="bg-gradient-to-r from-amber-500/10 to-primary/5">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-amber-500" />
          <CardTitle>Tratti</CardTitle>
        </div>
        <CardDescription>
          Acquista fino a {MAX_TRAITS} tratti ({ownedTraits.length}/{MAX_TRAITS}). 
          {canGetGold && !hasUsedFreeGold && " 🎁 Upgrade ORO gratuito disponibile!"}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {/* Owned Traits */}
        {ownedTraits.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">I tuoi tratti</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ownedTraits.map((pt) => {
                const info = getTraitInfo(pt.traitId);
                if (!info) return null;
                return (
                  <div
                    key={pt.traitId}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                      pt.tier === "gold"
                        ? "bg-amber-500/10 border-amber-500/30"
                        : "bg-muted/30 border-border"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {pt.tier === "gold" ? (
                        <Sparkles className="h-4 w-4 text-amber-500" />
                      ) : (
                        <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                      )}
                      <div>
                        <div className="text-sm font-medium">{info.name}</div>
                        <div className="text-xs text-muted-foreground">{info.description}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant={pt.tier === "gold" ? "default" : "secondary"} className={pt.tier === "gold" ? "bg-amber-500 hover:bg-amber-600" : ""}>
                        {pt.tier === "gold" ? "ORO" : "ARGENTO"}
                      </Badge>
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive" onClick={() => removeTrait(pt.traitId)}>
                        ×
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Available Traits */}
        <Tabs defaultValue="all">
          <TabsList className="grid grid-cols-3 lg:grid-cols-6">
            {CATEGORIES.map((c) => (
              <TabsTrigger key={c.key} value={c.key} className="text-xs">{c.label}</TabsTrigger>
            ))}
          </TabsList>
          {CATEGORIES.map((cat) => (
            <TabsContent key={cat.key} value={cat.key} className="mt-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[400px] overflow-y-auto pr-1">
                {AVAILABLE_TRAITS
                  .filter((t) => cat.key === "all" || t.category === cat.key)
                  .map((trait) => {
                    const owned = ownedTraits.find((o) => o.traitId === trait.id);
                    const meets = meetsRequirements(trait);
                    const canBuy = !owned && meets && ownedTraits.length < MAX_TRAITS;
                    const canSwapToGold = owned?.tier === "silver" && canGetGold && goldCount > 0 && currentGoldTrait;

                    return (
                      <div
                        key={trait.id}
                        className={`p-3 rounded-lg border transition-all hover:shadow-sm ${
                          owned ? "bg-primary/5 border-primary/20" : meets ? "border-border hover:border-primary/30" : "border-border opacity-60"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              {!meets && <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                              <span className="text-sm font-medium truncate">{trait.name}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{trait.description}</p>
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {Object.entries(trait.requirements).map(([attr, val]) => {
                                const playerVal = (player as any)?.[attr] ?? 0;
                                const met = playerVal >= val;
                                return (
                                  <Badge key={attr} variant="outline" className={`text-[10px] ${met ? "text-green-600 border-green-300" : "text-red-500 border-red-300"}`}>
                                    {attr} {playerVal}/{val}
                                  </Badge>
                                );
                              })}
                            </div>
                          </div>
                          <div className="flex flex-col gap-1 shrink-0">
                            {owned ? (
                              canSwapToGold ? (
                                <Button size="sm" variant="outline" className="text-xs h-7 border-amber-400 text-amber-600" onClick={() => handleSwapGold(trait, currentGoldTrait!)}>
                                  <Sparkles className="h-3 w-3 mr-1" /> → ORO
                                </Button>
                              ) : (
                                <Badge variant="outline" className="text-xs">Posseduto</Badge>
                              )
                            ) : (
                              <Button size="sm" disabled={!canBuy} onClick={() => handleBuyTrait(trait)} className="text-xs h-7">
                                {canGetGold && !hasUsedFreeGold ? "Gratis ORO" : `${trait.cost} XP`}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Confirm Dialog */}
        <Dialog open={!!confirmDialog} onOpenChange={() => setConfirmDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {confirmDialog?.type === "buy" ? "Conferma Acquisto" : "Conferma Scambio ORO"}
              </DialogTitle>
              <DialogDescription>
                {confirmDialog?.type === "buy" && (
                  <>
                    Vuoi acquistare <strong>{confirmDialog.trait.name}</strong>
                    {canGetGold && !hasUsedFreeGold
                      ? " come tratto ORO (gratuito a 85 OVR)?"
                      : ` per ${confirmDialog.trait.cost} XP?`}
                  </>
                )}
                {confirmDialog?.type === "swap_gold" && (
                  <>
                    Vuoi promuovere <strong>{confirmDialog.trait.name}</strong> a ORO e degradare{" "}
                    <strong>{getTraitInfo(confirmDialog.replaceTrait!.traitId)?.name}</strong> ad ARGENTO
                    per {XP_COSTS.TRAIT_GOLD_SWAP} XP?
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmDialog(null)}>Annulla</Button>
              <Button onClick={confirmAction}>Conferma</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

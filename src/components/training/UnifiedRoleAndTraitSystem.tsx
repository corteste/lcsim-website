import React, { useState, useMemo } from "react";
import { Player } from "@/types/player";
import {
  StatKey,
  TraitDef,
  SubRoleDef,
  PlayerSpecializationDraft,
  OFFICIAL_POSITIONS,
  OFFICIAL_SUBROLES,
  OFFICIAL_TRAITS,
  TRAINING_COSTS,
  checkTraitRequirements,
  calculateSpecializationsCost,
  findTraitDef,
} from "@/types/training";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Shield,
  Zap,
  Flame,
  Dumbbell,
  Target,
  Sparkles,
  Star,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  ArrowRightLeft,
  Search,
  AlertCircle,
  ArrowRight,
  RotateCcw,
  Crown,
} from "lucide-react";
import { toast } from "sonner";
import { getRoleColor } from "@/utils/functions";

interface UnifiedRoleAndTraitSystemProps {
  player: Player;
  postStats: Record<StatKey, number>;
  postOverall: number;
  draft: PlayerSpecializationDraft;
  onDraftChange: (newDraft: PlayerSpecializationDraft) => void;
  xpAvailable: number; // remaining XP from parent
  isRosterLocked?: boolean;
}

const CATEGORIES = [
  "Tutti",
  "Tiro",
  "Passaggi",
  "Difesa",
  "Fisico",
  "Dribbling",
  "Portiere",
  "Piazzati",
] as const;

export default function UnifiedRoleAndTraitSystem({
  player,
  postStats,
  postOverall,
  draft,
  onDraftChange,
  xpAvailable,
  isRosterLocked,
}: UnifiedRoleAndTraitSystemProps) {
  // Category & search filter for Trait catalog
  const [selectedCategory, setSelectedCategory] = useState<string>("Tutti");
  const [searchTraitQuery, setSearchTraitQuery] = useState<string>("");

  // Dialog state for Change Main Role
  const [roleChangeDialogOpen, setRoleChangeDialogOpen] = useState(false);
  const [pendingNewPos, setPendingNewPos] = useState<string>(draft.posiz);
  const [pendingNewSubRole, setPendingNewSubRole] = useState<string>("");

  // Dialog state for Swap / Select SubRole
  const [subRoleDialogOpen, setSubRoleDialogOpen] = useState(false);
  const [targetSlot, setTargetSlot] = useState<1 | 2>(1);
  const [pendingSubRoleId, setPendingSubRoleId] = useState<number | null>(null);

  // Dialog state for Remove Base Trait confirmation (costs 40 XP)
  const [traitToRemove, setTraitToRemove] = useState<string | null>(null);

  // Active sub-roles array for requirement checkers
  const activeSubRoles = useMemo(() => [draft.role1, draft.role2], [draft.role1, draft.role2]);

  // Is player eligible for Elite tier (OVR >= 84)
  const isEliteEligible = postOverall >= TRAINING_COSTS.OVR_THRESHOLD;

  // Has gold trait currently
  const currentGoldTrait = draft.traits.find((t) => t.tier === "gold");
  const currentGoldCount = currentGoldTrait ? 1 : 0;
  const currentTraitsCount = draft.traits.length;

  // Cost breakdown
  const costSummary = useMemo(
    () => calculateSpecializationsCost(player, draft, postOverall),
    [player, draft, postOverall]
  );

  // Compatible subroles for the current draft position
  const compatibleSubRoles = useMemo(() => {
    return OFFICIAL_SUBROLES.filter((sr) => sr.position === draft.posiz);
  }, [draft.posiz]);

  // Compatible subroles for pending role in dialog
  const pendingCompatibleSubRoles = useMemo(() => {
    return OFFICIAL_SUBROLES.filter((sr) => sr.position === pendingNewPos);
  }, [pendingNewPos]);

  // -------------------------------------------------------------
  // ACTIONS: MAIN ROLE & SUB-ROLES
  // -------------------------------------------------------------

  const handleOpenRoleChangeDialog = () => {
    if (isRosterLocked) {
      toast.error("Rose congelate dalla Lega");
      return;
    }
    setPendingNewPos(draft.posiz);
    const firstSub = OFFICIAL_SUBROLES.find((sr) => sr.position === draft.posiz);
    setPendingNewSubRole(firstSub ? `${firstSub.name} +` : "");
    setRoleChangeDialogOpen(true);
  };

  const handleConfirmRoleChange = () => {
    if (!pendingNewPos || !pendingNewSubRole) {
      toast.error("Seleziona una posizione e il primo Ruolo+");
      return;
    }
    const isNew = pendingNewPos !== player.Posiz;
    const addedCost = isNew ? TRAINING_COSTS.ROLE_CHANGE : 0;
    if (xpAvailable < addedCost) {
      toast.error(`XP insufficienti! Servono ${addedCost} XP.`);
      return;
    }

    onDraftChange({
      ...draft,
      posiz: pendingNewPos,
      role1: pendingNewSubRole,
      role2: null, // Reset 2nd role on main role switch
    });
    setRoleChangeDialogOpen(false);
    toast.success(`Ruolo impostato a ${pendingNewPos} (${pendingNewSubRole})`);
  };

  const handleRevertMainRole = () => {
    onDraftChange({
      ...draft,
      posiz: player.Posiz || "CC",
      role1: player.Role1 || null,
      role2: player.Role2 || null,
    });
    toast.info("Ruolo principale ripristinato a quello di base.");
  };

  const handleOpenSubRoleDialog = (slot: 1 | 2) => {
    if (isRosterLocked) {
      toast.error("Rose congelate dalla Lega");
      return;
    }
    setTargetSlot(slot);
    const existing = slot === 1 ? draft.role1 : draft.role2;
    if (existing) {
      const clean = existing.replace(/\+\+$/, "").replace(/\+$/, "").trim();
      const found = compatibleSubRoles.find((sr) => sr.name.toLowerCase() === clean.toLowerCase());
      setPendingSubRoleId(found ? found.id : null);
    } else {
      setPendingSubRoleId(null);
    }
    setSubRoleDialogOpen(true);
  };

  const handleConfirmSubRoleChange = () => {
    if (!pendingSubRoleId) {
      toast.error("Seleziona un Ruolo+");
      return;
    }
    const chosen = compatibleSubRoles.find((sr) => sr.id === pendingSubRoleId);
    if (!chosen) return;

    const roleName = `${chosen.name} +`;

    // Prevent duplicate subroles
    if (targetSlot === 1 && draft.role2 && draft.role2.includes(chosen.name)) {
      toast.error("Questo Ruolo+ è già assegnato al 2° slot!");
      return;
    }
    if (targetSlot === 2 && draft.role1 && draft.role1.includes(chosen.name)) {
      toast.error("Questo Ruolo+ è già assegnato al 1° slot!");
      return;
    }

    if (targetSlot === 1) {
      onDraftChange({
        ...draft,
        role1: roleName,
      });
    } else {
      onDraftChange({
        ...draft,
        role2: roleName,
      });
    }

    setSubRoleDialogOpen(false);
    toast.success(`Ruolo+ aggiornato: ${roleName}`);
  };

  const handleToggleUpgradePlusPlus = (slot: 1 | 2) => {
    if (isRosterLocked) return;
    if (!isEliteEligible) {
      toast.error(`Upgrade a ++ riservato a giocatori con OVR ≥ ${TRAINING_COSTS.OVR_THRESHOLD}!`);
      return;
    }

    const current = slot === 1 ? draft.role1 : draft.role2;
    if (!current) return;

    const isCurrentlyPlusPlus = current.endsWith("++");

    if (isCurrentlyPlusPlus) {
      // Downgrade to +
      const downgraded = current.replace(/\+\+$/, "+");
      if (slot === 1) {
        onDraftChange({ ...draft, role1: downgraded });
      } else {
        onDraftChange({ ...draft, role2: downgraded });
      }
      toast.info(`Ruolo impostato a ${downgraded}`);
    } else {
      // Check if player already has a ++ in the other slot
      const otherSlot = slot === 1 ? draft.role2 : draft.role1;
      if (otherSlot && otherSlot.endsWith("++")) {
        toast.error("È consentito al massimo 1 Ruolo++ per giocatore!");
        return;
      }

      if (xpAvailable < TRAINING_COSTS.ROLE_PLUSPLUS) {
        toast.error(`XP insufficienti! Servono ${TRAINING_COSTS.ROLE_PLUSPLUS} XP.`);
        return;
      }

      const upgraded = current.replace(/\+$/, "++");
      if (slot === 1) {
        onDraftChange({ ...draft, role1: upgraded });
      } else {
        onDraftChange({ ...draft, role2: upgraded });
      }
      toast.success(`Ruolo promosso a ${upgraded}! (+${TRAINING_COSTS.ROLE_PLUSPLUS} XP)`);
    }
  };

  const handleRemoveSecondRole = () => {
    if (isRosterLocked) return;
    onDraftChange({
      ...draft,
      role2: null,
    });
    toast.info("Secondo Ruolo+ rimosso.");
  };

  // -------------------------------------------------------------
  // ACTIONS: TRAITS (ACQUISTO, PROMOZIONE ORO, RIMOZIONE)
  // -------------------------------------------------------------

  const handleBuyTrait = (trait: TraitDef) => {
    if (isRosterLocked) {
      toast.error("Rose congelate dalla Lega");
      return;
    }
    if (currentTraitsCount >= TRAINING_COSTS.MAX_TRAITS) {
      toast.error(`Massimo ${TRAINING_COSTS.MAX_TRAITS} tratti consentiti!`);
      return;
    }
    if (draft.traits.some((t) => t.id === trait.id)) {
      toast.error("Tratto già posseduto!");
      return;
    }

    const reqCheck = checkTraitRequirements(
      trait,
      postStats,
      draft.posiz,
      player.Altezza ?? 180,
      activeSubRoles
    );
    if (!reqCheck.ok) {
      toast.error(`Requisiti non soddisfatti: ${reqCheck.missing.join(", ")}`);
      return;
    }

    if (xpAvailable < TRAINING_COSTS.TRAIT_SILVER_ADD) {
      toast.error(`XP insufficienti! Servono ${TRAINING_COSTS.TRAIT_SILVER_ADD} XP per acquistare un tratto argento.`);
      return;
    }

    // Rule: "se ne hai 0 aspetta finché non ne compri uno e diventa oro"
    // If player has OVR >= 84, exactly 0 traits currently, this 1st trait becomes Gold for free!
    const shouldBecomeGold = isEliteEligible && currentTraitsCount === 0;

    const nextTraits = [
      ...draft.traits,
      { id: trait.id, tier: shouldBecomeGold ? ("gold" as const) : ("silver" as const) },
    ];

    onDraftChange({
      ...draft,
      traits: nextTraits,
    });

    if (shouldBecomeGold) {
      toast.success(`Tratto ${trait.name} acquistato e promosso ad ORO gratuitamente! (OVR ≥ 84)`);
    } else {
      toast.success(`Tratto ${trait.name} acquistato (Argento)!`);
    }
  };

  const handlePromoteToGold = (traitId: string) => {
    if (isRosterLocked) return;
    if (!isEliteEligible) {
      toast.error(`Tratto Oro riservato a giocatori con OVR ≥ ${TRAINING_COSTS.OVR_THRESHOLD}!`);
      return;
    }

    const targetTrait = draft.traits.find((t) => t.id === traitId);
    if (!targetTrait) return;
    if (targetTrait.tier === "gold") return;

    // Check if swap cost applies
    const baseGold = player.IconTrait1 || player.IconTrait2;
    const isSwapFromExistingGold = currentGoldCount > 0;
    const cost = isSwapFromExistingGold && baseGold ? TRAINING_COSTS.TRAIT_GOLD_SWAP : 0;

    if (cost > 0 && xpAvailable < cost) {
      toast.error(`XP insufficienti per lo scambio a Oro! Servono ${cost} XP.`);
      return;
    }

    // Set all other traits to silver, promote target to gold
    const nextTraits = draft.traits.map((t) => {
      if (t.id === traitId) return { ...t, tier: "gold" as const };
      return { ...t, tier: "silver" as const };
    });

    onDraftChange({
      ...draft,
      traits: nextTraits,
    });

    const def = findTraitDef(traitId);
    if (cost > 0) {
      toast.success(`Tratto ${def?.name} promosso ad ORO! (+${cost} XP per lo scambio)`);
    } else {
      toast.success(`Tratto ${def?.name} promosso ad ORO gratuitamente! (1° Sblocco Oro)`);
    }
  };

  const handleDemoteGoldToSilver = (traitId: string) => {
    if (isRosterLocked) return;
    const nextTraits = draft.traits.map((t) => {
      if (t.id === traitId) return { ...t, tier: "silver" as const };
      return t;
    });
    onDraftChange({ ...draft, traits: nextTraits });
    toast.info("Tratto reimpostato ad Argento.");
  };

  const handleInitiateRemoveTrait = (traitId: string) => {
    if (isRosterLocked) return;
    // Check if trait is from base player
    const baseSpec = player;
    const isFromBase =
      (baseSpec.Trait1 && baseSpec.Trait1.toLowerCase().includes(traitId.replace(/_/g, " "))) ||
      (baseSpec.Trait2 && baseSpec.Trait2.toLowerCase().includes(traitId.replace(/_/g, " "))) ||
      (baseSpec.IconTrait1 && baseSpec.IconTrait1.toLowerCase().includes(traitId.replace(/_/g, " "))) ||
      (baseSpec.IconTrait2 && baseSpec.IconTrait2.toLowerCase().includes(traitId.replace(/_/g, " ")));

    if (isFromBase) {
      // Requires 40 XP confirmation
      setTraitToRemove(traitId);
    } else {
      // Newly added in draft -> free remove
      const nextTraits = draft.traits.filter((t) => t.id !== traitId);
      onDraftChange({ ...draft, traits: nextTraits });
      toast.info("Tratto rimosso dalla bozza.");
    }
  };

  const handleConfirmRemoveBaseTrait = () => {
    if (!traitToRemove) return;
    if (xpAvailable < TRAINING_COSTS.TRAIT_REMOVE) {
      toast.error(`XP insufficienti per eliminare il tratto! Servono ${TRAINING_COSTS.TRAIT_REMOVE} XP.`);
      setTraitToRemove(null);
      return;
    }

    const nextTraits = draft.traits.filter((t) => t.id !== traitToRemove);
    const nextRemoved = Array.from(new Set([...(draft.removedBaseTraits || []), traitToRemove]));

    onDraftChange({
      ...draft,
      traits: nextTraits,
      removedBaseTraits: nextRemoved,
    });

    const def = findTraitDef(traitToRemove);
    setTraitToRemove(null);
    toast.success(`Tratto ${def?.name} contrassegnato per eliminazione (+${TRAINING_COSTS.TRAIT_REMOVE} XP)`);
  };

  const handleCancelRemoveBaseTrait = (traitId: string) => {
    const nextRemoved = (draft.removedBaseTraits || []).filter((id) => id !== traitId);
    // Restore trait into draft traits list
    const def = findTraitDef(traitId);
    const wasGold =
      player.IconTrait1?.toLowerCase().includes(traitId.replace(/_/g, " ")) ||
      player.IconTrait2?.toLowerCase().includes(traitId.replace(/_/g, " "));

    const nextTraits = [...draft.traits, { id: traitId, tier: wasGold ? ("gold" as const) : ("silver" as const) }];

    onDraftChange({
      ...draft,
      traits: nextTraits,
      removedBaseTraits: nextRemoved,
    });
    toast.info(`Eliminazione di ${def?.name} annullata.`);
  };

  // Filtered traits catalog
  const filteredCatalog = useMemo(() => {
    return OFFICIAL_TRAITS.filter((t) => {
      if (selectedCategory !== "Tutti" && t.category !== selectedCategory) {
        return false;
      }
      if (searchTraitQuery.trim()) {
        const q = searchTraitQuery.toLowerCase();
        if (!t.name.toLowerCase().includes(q) && !t.description.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [selectedCategory, searchTraitQuery]);

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* BANNER INFORMATIVO OVR & SBLOCCHI ELITE                                    */}
      {/* ========================================================================= */}
      <div
        className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-3 ${
          isEliteEligible
            ? "bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-transparent border-amber-500/40 shadow-sm"
            : "bg-muted/20 border-border/70"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-xl border ${
              isEliteEligible
                ? "bg-amber-500/20 border-amber-500/40 text-amber-500"
                : "bg-muted border-border text-muted-foreground"
            }`}
          >
            {isEliteEligible ? <Crown className="h-5 w-5" /> : <Star className="h-5 w-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-foreground">
                Overall Allenato Stimato: <span className="font-mono text-emerald-500">{postOverall}</span>
              </span>
              {isEliteEligible ? (
                <Badge className="bg-amber-500 text-black font-extrabold text-[10px] px-2 py-0">
                  TIER ELITE SBLOCCATO (≥ 84)
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] px-2 py-0 text-muted-foreground">
                  Soglia Elite: 84 OVR ({TRAINING_COSTS.OVR_THRESHOLD - postOverall} punti mancanti)
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isEliteEligible
                ? "Giocatore idoneo: puoi potenziare 1 Ruolo+ a Ruolo++ (100 XP) e sbloccare/promuovere 1 Tratto ORO (PlayStyle+)!"
                : "Aumenta gli attributi nella prima scheda per raggiungere 84 OVR e sbloccare Ruolo++ e il 1° Tratto Oro gratis."}
            </p>
          </div>
        </div>

        {/* Breakdown XP Specializzazioni in tempo reale */}
        <div className="flex items-center gap-2 bg-background/80 p-2 rounded-xl border border-border/70 text-xs shrink-0">
          <div className="px-2 py-1 text-center">
            <span className="text-[10px] text-muted-foreground block uppercase font-bold">Ruoli</span>
            <span className="font-mono font-bold text-foreground">+{costSummary.roleCost} XP</span>
          </div>
          <div className="h-6 w-px bg-border/60" />
          <div className="px-2 py-1 text-center">
            <span className="text-[10px] text-muted-foreground block uppercase font-bold">Tratti</span>
            <span className="font-mono font-bold text-foreground">+{costSummary.traitCost} XP</span>
          </div>
          <div className="h-6 w-px bg-border/60" />
          <div className="px-2 py-1 text-center">
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block uppercase font-bold">Totale</span>
            <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
              {costSummary.totalCost} XP
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SEZIONE 1: RUOLO PRINCIPALE & RUOLI+                                      */}
      {/* ========================================================================= */}
      <Card className="border-border/80 shadow-md overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border/60 py-3.5 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-500" />
              <CardTitle className="text-sm font-bold">Ruolo Principale & Ruoli Tattici (+ / ++)</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {draft.posiz !== player.Posiz && (
                <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-500 border-amber-500/30">
                  Ruolo Modificato (+{TRAINING_COSTS.ROLE_CHANGE} XP)
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          {/* Riga Ruolo Principale */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-muted/20 border border-border/60">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black font-mono text-base border shadow-inner bg-background">
                <span className={getRoleColor(draft.posiz)}>{draft.posiz}</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-foreground">Ruolo Principale in Campo</span>
                  {draft.posiz !== player.Posiz && (
                    <span className="text-[10px] text-muted-foreground line-through">
                      (Base: {player.Posiz})
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Determina la posizione primaria, i compiti tattici e il set di Ruoli+ compatibili.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {draft.posiz !== player.Posiz && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRevertMainRole}
                  className="h-8 text-xs font-semibold text-rose-500 hover:text-rose-600"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1" />
                  Annulla Cambio
                </Button>
              )}
              <Button
                size="sm"
                onClick={handleOpenRoleChangeDialog}
                disabled={isRosterLocked}
                className="h-8 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <ArrowRightLeft className="h-3.5 w-3.5 mr-1.5" />
                Cambia Ruolo ({TRAINING_COSTS.ROLE_CHANGE} XP)
              </Button>
            </div>
          </div>

          {/* Griglia Slot 1 e Slot 2 Ruoli+ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* SLOT 1 */}
            <div className="p-3.5 rounded-xl border border-border/70 bg-card/60 flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                  <Badge variant="outline" className="text-[10px] h-4 px-1 py-0 font-mono">
                    SLOT 1
                  </Badge>
                  Ruolo+ Principale
                </span>
                {draft.role1?.endsWith("++") && (
                  <Badge className="bg-amber-500 text-black text-[9px] font-black px-1.5 py-0">
                    RUOLO++ (ELITE)
                  </Badge>
                )}
              </div>

              <div>
                <div className="text-sm font-extrabold text-foreground">
                  {draft.role1 || "Nessun Ruolo+ assegnato"}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {draft.role1
                    ? OFFICIAL_SUBROLES.find((sr) => draft.role1?.includes(sr.name))?.description ||
                      "Interpretazione tattica del ruolo."
                    : "Seleziona il primo Ruolo+ compatibile."}
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-border/40">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenSubRoleDialog(1)}
                  disabled={isRosterLocked}
                  className="h-7 text-xs flex-1"
                >
                  <ArrowRightLeft className="h-3 w-3 mr-1" />
                  {draft.role1 ? "Cambia (60 XP)" : "Assegna (Gratis)"}
                </Button>

                {draft.role1 && (
                  <Button
                    size="sm"
                    variant={draft.role1.endsWith("++") ? "secondary" : "outline"}
                    onClick={() => handleToggleUpgradePlusPlus(1)}
                    disabled={isRosterLocked || (!isEliteEligible && !draft.role1.endsWith("++"))}
                    title={
                      !isEliteEligible
                        ? "Richiede OVR ≥ 84"
                        : draft.role1.endsWith("++")
                        ? "Ripristina a Ruolo+"
                        : "Promuovi a Ruolo++ (+100 XP)"
                    }
                    className={`h-7 text-xs font-bold px-2.5 ${
                      draft.role1.endsWith("++")
                        ? "bg-amber-500/20 text-amber-500 border-amber-500/40"
                        : "hover:border-amber-500/50 hover:text-amber-500"
                    }`}
                  >
                    <Crown className="h-3 w-3 mr-1" />
                    {draft.role1.endsWith("++") ? "Downgrade a +" : "Upgrade ++ (100 XP)"}
                  </Button>
                )}
              </div>
            </div>

            {/* SLOT 2 */}
            <div className="p-3.5 rounded-xl border border-border/70 bg-card/60 flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                  <Badge variant="outline" className="text-[10px] h-4 px-1 py-0 font-mono">
                    SLOT 2
                  </Badge>
                  Ruolo+ Secondario
                </span>
                {draft.role2?.endsWith("++") && (
                  <Badge className="bg-amber-500 text-black text-[9px] font-black px-1.5 py-0">
                    RUOLO++ (ELITE)
                  </Badge>
                )}
              </div>

              <div>
                <div className="text-sm font-extrabold text-foreground">
                  {draft.role2 || "Nessun Ruolo+ Secondario"}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {draft.role2
                    ? OFFICIAL_SUBROLES.find((sr) => draft.role2?.includes(sr.name))?.description ||
                      "Secondo compito tattico per alternare stili di gioco."
                    : "Aggiungi un 2° Ruolo+ per massima versatilità in partita (100 XP)."}
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-border/40">
                {draft.role2 ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenSubRoleDialog(2)}
                      disabled={isRosterLocked}
                      className="h-7 text-xs flex-1"
                    >
                      <ArrowRightLeft className="h-3 w-3 mr-1" />
                      Cambia (60 XP)
                    </Button>

                    <Button
                      size="sm"
                      variant={draft.role2.endsWith("++") ? "secondary" : "outline"}
                      onClick={() => handleToggleUpgradePlusPlus(2)}
                      disabled={isRosterLocked || (!isEliteEligible && !draft.role2.endsWith("++"))}
                      title={
                        !isEliteEligible
                          ? "Richiede OVR ≥ 84"
                          : draft.role2.endsWith("++")
                          ? "Ripristina a Ruolo+"
                          : "Promuovi a Ruolo++ (+100 XP)"
                      }
                      className={`h-7 text-xs font-bold px-2.5 ${
                        draft.role2.endsWith("++")
                          ? "bg-amber-500/20 text-amber-500 border-amber-500/40"
                          : "hover:border-amber-500/50 hover:text-amber-500"
                      }`}
                    >
                      <Crown className="h-3 w-3 mr-1" />
                      {draft.role2.endsWith("++") ? "Downgrade a +" : "Upgrade ++ (100 XP)"}
                    </Button>

                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={handleRemoveSecondRole}
                      disabled={isRosterLocked}
                      className="h-7 w-7 text-muted-foreground hover:text-rose-500"
                      title="Rimuovi 2° Ruolo+"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenSubRoleDialog(2)}
                    disabled={isRosterLocked}
                    className="h-7 text-xs flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Aggiungi 2° Ruolo+ (+{TRAINING_COSTS.ROLE_PLUS_SECOND} XP)
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* SEZIONE 2: TRATTI & STILI DI GIOCO (PLAYSTYLES)                           */}
      {/* ========================================================================= */}
      <Card className="border-border/80 shadow-md overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border/60 py-3.5 px-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-500" />
              <CardTitle className="text-sm font-bold">Tratti & Stili di Gioco (PlayStyles)</CardTitle>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Badge variant="outline" className="font-mono text-[11px] px-2 py-0.5">
                Tratti: <strong>{currentTraitsCount}</strong> / {TRAINING_COSTS.MAX_TRAITS}
              </Badge>
              <Badge
                variant="outline"
                className={`font-mono text-[11px] px-2 py-0.5 ${
                  currentGoldCount > 0 ? "bg-amber-500/15 text-amber-500 border-amber-500/40" : ""
                }`}
              >
                Oro ⭐: <strong>{currentGoldCount}</strong> / {TRAINING_COSTS.MAX_GOLD_TRAITS}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-5">
          {/* Sottosezione A: Tratti Attivi del Giocatore */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center justify-between">
              <span>Tratti Attualmente Assegnati</span>
              <span className="text-[11px] font-normal normal-case">
                Max 5 Tratti • Max 1 Tratto Oro
              </span>
            </h4>

            {draft.traits.length === 0 && (draft.removedBaseTraits || []).length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-border/80 text-center text-xs text-muted-foreground">
                Nessun tratto speciale posseduto al momento. Scegli fino a 5 tratti dal catalogo sottostante.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* Tratti Attivi */}
                {draft.traits.map((t) => {
                  const def = findTraitDef(t.id);
                  if (!def) return null;
                  const isGold = t.tier === "gold";

                  return (
                    <div
                      key={t.id}
                      className={`p-3 rounded-xl border transition-all flex flex-col justify-between gap-2.5 ${
                        isGold
                          ? "bg-gradient-to-br from-amber-500/15 to-transparent border-amber-500/50 shadow-sm"
                          : "bg-card border-border/70 hover:border-border"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-extrabold text-xs text-foreground truncate">
                              {def.name}
                            </span>
                            {isGold ? (
                              <Badge className="bg-amber-500 text-black font-black text-[9px] px-1.5 py-0 flex items-center gap-0.5">
                                <Star className="h-2.5 w-2.5 fill-black" />
                                ORO (PlayStyle+)
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[9px] px-1.5 py-0 text-muted-foreground">
                                Argento
                              </Badge>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground line-clamp-2 mt-1">
                            {def.description}
                          </p>
                        </div>
                      </div>

                      {/* Bottoni Azione sul tratto posseduto */}
                      <div className="flex items-center gap-1.5 pt-2 border-t border-border/40">
                        {isGold ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDemoteGoldToSilver(t.id)}
                            disabled={isRosterLocked}
                            className="h-6 text-[10px] font-semibold text-muted-foreground hover:text-foreground flex-1"
                          >
                            Reimposta ad Argento
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePromoteToGold(t.id)}
                            disabled={isRosterLocked || !isEliteEligible}
                            title={
                              !isEliteEligible
                                ? "Richiede OVR ≥ 84"
                                : currentGoldCount > 0
                                ? "Scambia lo status ORO con questo tratto (+70 XP)"
                                : "Promuovi ad ORO gratuitamente!"
                            }
                            className={`h-6 text-[10px] font-bold flex-1 ${
                              isEliteEligible
                                ? "hover:border-amber-500/60 hover:text-amber-500 text-amber-500 bg-amber-500/10"
                                : "opacity-40"
                            }`}
                          >
                            <Star className="h-3 w-3 mr-1 fill-amber-500/20" />
                            {currentGoldCount > 0
                              ? "Scambia a Oro (70 XP)"
                              : "Promuovi a Oro (Gratis)"}
                          </Button>
                        )}

                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleInitiateRemoveTrait(t.id)}
                          disabled={isRosterLocked}
                          className="h-6 w-6 text-muted-foreground hover:text-rose-500"
                          title="Elimina questo tratto"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}

                {/* Tratti di base rimossi (mostrati con possibilità di annullare) */}
                {(draft.removedBaseTraits || []).map((removedId) => {
                  const def = findTraitDef(removedId);
                  return (
                    <div
                      key={removedId}
                      className="p-3 rounded-xl border border-rose-500/40 bg-rose-500/5 flex flex-col justify-between gap-2 opacity-75"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs line-through text-rose-500">
                            {def?.name || removedId}
                          </span>
                          <Badge variant="outline" className="text-[9px] text-rose-500 border-rose-500/30">
                            Eliminato (+{TRAINING_COSTS.TRAIT_REMOVE} XP)
                          </Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          Questo tratto sarà rimosso dal giocatore dopo il salvataggio.
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCancelRemoveBaseTrait(removedId)}
                        disabled={isRosterLocked}
                        className="h-6 text-[10px] font-semibold text-muted-foreground hover:text-foreground"
                      >
                        <RotateCcw className="h-2.5 w-2.5 mr-1" />
                        Annulla Eliminazione
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sottosezione B: Catalogo 36 Tratti Ufficiali */}
          <div className="pt-3 border-t border-border/60">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Catalogo Tratti Disponibili (36 Tratti Ufficiali)
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  I requisiti minimi vengono verificati in tempo reale in base agli attributi post-allenamento.
                </p>
              </div>

              {/* Ricerca Rapida Tratto */}
              <div className="relative w-full md:w-56">
                <Search className="absolute left-2.5 top-2.5 h-3 w-3 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Cerca tratto..."
                  value={searchTraitQuery}
                  onChange={(e) => setSearchTraitQuery(e.target.value)}
                  className="pl-8 h-8 text-xs bg-muted/20 border-border/70"
                />
              </div>
            </div>

            {/* Categorie Tratti */}
            <div className="flex flex-wrap gap-1 mb-4">
              {CATEGORIES.map((cat) => (
                <Button
                  key={cat}
                  size="sm"
                  variant={selectedCategory === cat ? "default" : "outline"}
                  onClick={() => setSelectedCategory(cat)}
                  className={`h-7 text-[11px] px-2.5 font-bold ${
                    selectedCategory === cat
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {cat}
                </Button>
              ))}
            </div>

            {/* Griglia Catalogo Tratti */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredCatalog.map((trait) => {
                const isOwned = draft.traits.some((t) => t.id === trait.id);
                const isRemovedFromBase = (draft.removedBaseTraits || []).includes(trait.id);
                const reqCheck = checkTraitRequirements(
                  trait,
                  postStats,
                  draft.posiz,
                  player.Altezza ?? 180,
                  activeSubRoles
                );
                const canBuy =
                  !isOwned &&
                  reqCheck.ok &&
                  currentTraitsCount < TRAINING_COSTS.MAX_TRAITS &&
                  xpAvailable >= TRAINING_COSTS.TRAIT_SILVER_ADD &&
                  !isRosterLocked;

                return (
                  <div
                    key={trait.id}
                    className={`p-3.5 rounded-xl border flex flex-col justify-between gap-3 transition-all ${
                      isOwned
                        ? "bg-muted/30 border-emerald-500/30 opacity-70"
                        : reqCheck.ok
                        ? "bg-card hover:border-emerald-500/50 border-border/80 shadow-sm"
                        : "bg-muted/15 border-border/50 opacity-60"
                    }`}
                  >
                    <div>
                      {/* Titolo e Categoria */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-extrabold text-xs text-foreground">
                          {trait.name}
                        </span>
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 text-muted-foreground">
                          {trait.category}
                        </Badge>
                      </div>

                      {/* Descrizione */}
                      <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
                        {trait.description}
                      </p>

                      {/* Verifica Requisiti Minimi */}
                      <div className="mt-2.5 pt-2 border-t border-border/40 space-y-1">
                        <span className="text-[10px] font-bold text-muted-foreground block uppercase">
                          Requisiti Minimi:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(trait.statReqs).map(([stKey, minThreshold]) => {
                            const currentVal = postStats[stKey as StatKey] ?? 0;
                            const isMet = currentVal > (minThreshold ?? 0);
                            return (
                              <span
                                key={stKey}
                                className={`text-[10px] font-mono px-1.5 py-0.5 rounded flex items-center gap-1 ${
                                  isMet
                                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold"
                                    : "bg-rose-500/15 text-rose-500"
                                }`}
                              >
                                {isMet ? (
                                  <CheckCircle2 className="h-2.5 w-2.5 shrink-0" />
                                ) : (
                                  <XCircle className="h-2.5 w-2.5 shrink-0" />
                                )}
                                {stKey}&gt;{minThreshold} ({currentVal})
                              </span>
                            );
                          })}

                          {trait.roleReqs && (
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 ${
                                trait.roleReqs.includes(draft.posiz)
                                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold"
                                  : "bg-rose-500/15 text-rose-500"
                              }`}
                            >
                              Ruolo {trait.roleReqs.join("/")}
                            </span>
                          )}

                          {trait.minHeight && (
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 ${
                                (player.Altezza ?? 180) > trait.minHeight
                                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold"
                                  : "bg-rose-500/15 text-rose-500"
                              }`}
                            >
                              Altezza&gt;{trait.minHeight}cm
                            </span>
                          )}

                          {trait.subRoleReq && (
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 ${
                                activeSubRoles.some(
                                  (sr) => sr && sr.toLowerCase().includes(trait.subRoleReq!.toLowerCase())
                                )
                                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold"
                                  : "bg-rose-500/15 text-rose-500"
                              }`}
                            >
                              {trait.subRoleReq}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bottone Acquista */}
                    <div className="pt-2">
                      {isOwned ? (
                        <div className="w-full py-1 text-center text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 rounded-lg">
                          ✓ Già Posseduto
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleBuyTrait(trait)}
                          disabled={!canBuy}
                          className={`w-full h-7 text-xs font-bold ${
                            reqCheck.ok
                              ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                              : "opacity-40"
                          }`}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Acquista Tratto (+{TRAINING_COSTS.TRAIT_SILVER_ADD} XP)
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* DIALOG: CAMBIO RUOLO PRINCIPALE                                           */}
      {/* ========================================================================= */}
      <Dialog open={roleChangeDialogOpen} onOpenChange={setRoleChangeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4 text-emerald-500" />
              Cambio Ruolo Principale
            </DialogTitle>
            <DialogDescription className="text-xs">
              Il cambio del ruolo principale costa <strong>{TRAINING_COSTS.ROLE_CHANGE} XP</strong> e include
              la scelta del 1° Ruolo+ della nuova posizione.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Selettore Posizione Principale */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Nuova Posizione:</label>
              <Select
                value={pendingNewPos}
                onValueChange={(val) => {
                  setPendingNewPos(val);
                  const firstSub = OFFICIAL_SUBROLES.find((sr) => sr.position === val);
                  setPendingNewSubRole(firstSub ? `${firstSub.name} +` : "");
                }}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Seleziona posizione" />
                </SelectTrigger>
                <SelectContent>
                  {OFFICIAL_POSITIONS.map((pos) => (
                    <SelectItem key={pos} value={pos} className="text-xs font-bold">
                      {pos}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Selettore 1° Ruolo+ Iniziale */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Primo Ruolo+ (Incluso Gratis):</label>
              <Select
                value={pendingNewSubRole}
                onValueChange={(val) => setPendingNewSubRole(val)}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Seleziona Ruolo+" />
                </SelectTrigger>
                <SelectContent>
                  {pendingCompatibleSubRoles.map((sr) => (
                    <SelectItem key={sr.id} value={`${sr.name} +`} className="text-xs">
                      {sr.name} +
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="p-3 rounded-lg bg-muted/30 border border-border/60 text-xs text-muted-foreground">
              • Costo Totale Cambio Ruolo: <strong>{TRAINING_COSTS.ROLE_CHANGE} XP</strong>
              <br />
              • Un eventuale 2° Ruolo+ potrà essere aggiunto in seguito a 100 XP.
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRoleChangeDialogOpen(false)}
              className="text-xs"
            >
              Annulla
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmRoleChange}
              className="text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Conferma Cambio Ruolo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* DIALOG: ASSEGNA / CAMBIA RUOLO+ (SWAP)                                    */}
      {/* ========================================================================= */}
      <Dialog open={subRoleDialogOpen} onOpenChange={setSubRoleDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-500" />
              {targetSlot === 1 ? "Ruolo+ Slot 1" : "Ruolo+ Slot 2"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Seleziona uno dei compiti tattici compatibili con la posizione <strong>{draft.posiz}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 max-h-[350px] overflow-y-auto pr-1">
            {compatibleSubRoles.map((sr) => {
              const isSelected = pendingSubRoleId === sr.id;
              return (
                <div
                  key={sr.id}
                  onClick={() => setPendingSubRoleId(sr.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? "bg-emerald-500/15 border-emerald-500 shadow-sm"
                      : "bg-card hover:bg-muted/40 border-border/70"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-foreground">
                      {sr.name} +
                    </span>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      ID {sr.id}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {sr.description}
                  </p>
                </div>
              );
            })}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSubRoleDialogOpen(false)}
              className="text-xs"
            >
              Annulla
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmSubRoleChange}
              disabled={!pendingSubRoleId}
              className="text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Assegna Ruolo+
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* DIALOG: CONFERMA ELIMINAZIONE TRATTO DI BASE (40 XP)                       */}
      {/* ========================================================================= */}
      <Dialog open={!!traitToRemove} onOpenChange={(open) => !open && setTraitToRemove(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-rose-500">
              <AlertCircle className="h-4 w-4" />
              Conferma Eliminazione Tratto
            </DialogTitle>
            <DialogDescription className="text-xs">
              L'eliminazione di un tratto pre-esistente costa <strong>{TRAINING_COSTS.TRAIT_REMOVE} XP</strong>.
            </DialogDescription>
          </DialogHeader>

          {traitToRemove && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs space-y-1">
              <span className="font-bold text-foreground">
                Tratto da eliminare: {findTraitDef(traitToRemove)?.name || traitToRemove}
              </span>
              <p className="text-[11px] text-muted-foreground">
                Il tratto verrà rimosso dal set attivo del calciatore, liberando 1 slot per l'acquisto di un nuovo tratto.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTraitToRemove(null)}
              className="text-xs"
            >
              Annulla
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleConfirmRemoveBaseTrait}
              className="text-xs font-bold"
            >
              Elimina per {TRAINING_COSTS.TRAIT_REMOVE} XP
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

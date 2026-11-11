import React from "react";
import { Player } from "@/types/player";
import { TRAINING_COSTS, formatStars } from "@/types/training";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Star,
  Zap,
  Sparkles,
  RotateCcw,
  Plus,
  Minus,
  CheckCircle2,
  AlertCircle,
  Footprints,
  Info,
} from "lucide-react";

interface SkillMovesAndWeakFootSystemProps {
  player: Player;
  baseSkillMoves: number;
  baseWeakFoot: number;
  currentSkillMoves: number;
  currentWeakFoot: number;
  onSkillMovesChange: (newVal: number) => void;
  onWeakFootChange: (newVal: number) => void;
  xpAvailable: number; // XP residui disponibili dal parent
  isRosterLocked?: boolean;
}

export const SkillMovesAndWeakFootSystem: React.FC<SkillMovesAndWeakFootSystemProps> = ({
  player,
  baseSkillMoves,
  baseWeakFoot,
  currentSkillMoves,
  currentWeakFoot,
  onSkillMovesChange,
  onWeakFootChange,
  xpAvailable,
  isRosterLocked = false,
}) => {
  const addedSkillMoves = Math.max(0, currentSkillMoves - baseSkillMoves);
  const addedWeakFoot = Math.max(0, currentWeakFoot - baseWeakFoot);

  const costSkillMoves = addedSkillMoves * TRAINING_COSTS.SKILL_MOVES_STAR;
  const costWeakFoot = addedWeakFoot * TRAINING_COSTS.WEAK_FOOT_STAR;
  const totalStarsCost = costSkillMoves + costWeakFoot;

  const canIncrementSkill =
    currentSkillMoves < TRAINING_COSTS.MAX_STARS &&
    xpAvailable >= TRAINING_COSTS.SKILL_MOVES_STAR &&
    !isRosterLocked;

  const canDecrementSkill = currentSkillMoves > baseSkillMoves && !isRosterLocked;

  const canIncrementWeakFoot =
    currentWeakFoot < TRAINING_COSTS.MAX_STARS &&
    xpAvailable >= TRAINING_COSTS.WEAK_FOOT_STAR &&
    !isRosterLocked;

  const canDecrementWeakFoot = currentWeakFoot > baseWeakFoot && !isRosterLocked;

  const handleResetSkillMoves = () => {
    onSkillMovesChange(baseSkillMoves);
  };

  const handleResetWeakFoot = () => {
    onWeakFootChange(baseWeakFoot);
  };

  const handleResetAllStars = () => {
    onSkillMovesChange(baseSkillMoves);
    onWeakFootChange(baseWeakFoot);
  };

  return (
    <div className="space-y-4">
      {/* ========================================================================= */}
      {/* BANNER INFORMATIVO DI SEZIONE                                             */}
      {/* ========================================================================= */}
      <Card className="border-border/80 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent overflow-hidden shadow-sm">
        <CardContent className="p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-500 border border-amber-500/30 shrink-0">
              <Star className="h-5 w-5 fill-amber-500" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-black tracking-tight text-foreground flex items-center gap-2">
                Abilità Tecniche &amp; Piede Debole
                <Badge variant="outline" className="text-[10px] font-mono border-amber-500/40 text-amber-600 dark:text-amber-400">
                  Max 5 ⭐
                </Badge>
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Migliora il repertorio di numeri acrobatici (Mosse Abilità) e l'efficacia del piede debole. I valori non possono mai scendere sotto il rating originale di fabbrica.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
            {(addedSkillMoves > 0 || addedWeakFoot > 0) && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetAllStars}
                disabled={isRosterLocked}
                className="h-8 text-xs font-semibold text-muted-foreground hover:text-rose-500 hover:border-rose-500/40"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                Reset Tecnico
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* GRIGLIA DELLE DUE CARATTERISTICHE (MOSSE ABILITÀ & PIEDE DEBOLE)          */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* ------------------------------------------------------------- */}
        {/* CARD 1: MOSSE ABILITÀ (SKILL MOVES)                          */}
        {/* ------------------------------------------------------------- */}
        <Card
          className={`border transition-all duration-200 overflow-hidden shadow-sm ${
            addedSkillMoves > 0
              ? "border-amber-500/60 bg-gradient-to-b from-amber-500/[0.08] to-transparent shadow-md ring-1 ring-amber-500/20"
              : "border-border/80 bg-card hover:border-border"
          }`}
        >
          <CardHeader className="p-4 border-b border-border/50 bg-muted/20 pb-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-500 shrink-0">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-sm sm:text-base font-extrabold text-foreground flex items-center gap-1.5">
                    Mosse Abilità (Skill Moves)
                  </CardTitle>
                  <CardDescription className="text-[11px] text-muted-foreground">
                    Valore base naturale: <strong className="text-foreground">{formatStars(baseSkillMoves)} ({baseSkillMoves}⭐)</strong>
                  </CardDescription>
                </div>
              </div>

              <Badge
                variant="outline"
                className="text-[10px] font-mono font-bold border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10 shrink-0"
              >
                {TRAINING_COSTS.SKILL_MOVES_STAR} XP / stella
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-4 sm:p-5 space-y-4">
            {/* Visualizzatore Stelle Interattive */}
            <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 flex flex-col items-center justify-center gap-3">
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((starIndex) => {
                  const isFilled = starIndex <= currentSkillMoves;
                  const isUpgraded = starIndex > baseSkillMoves && starIndex <= currentSkillMoves;
                  const isBase = starIndex <= baseSkillMoves;

                  return (
                    <div
                      key={starIndex}
                      className={`relative flex items-center justify-center transition-transform ${
                        isUpgraded ? "scale-110" : ""
                      }`}
                    >
                      <Star
                        className={`h-7 w-7 sm:h-8 sm:w-8 transition-colors ${
                          isUpgraded
                            ? "text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]"
                            : isBase
                            ? "text-amber-500 fill-amber-500"
                            : "text-muted-foreground/30 fill-transparent"
                        }`}
                      />
                      {starIndex === baseSkillMoves && (
                        <span
                          title={`Valore originale: ${baseSkillMoves} stelle`}
                          className="absolute -bottom-2 text-[8px] font-black font-mono text-muted-foreground uppercase px-1 py-0 rounded bg-muted border border-border/80"
                        >
                          Base
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="font-extrabold text-foreground text-sm">
                  {currentSkillMoves} / 5 Stelle
                </span>
                {addedSkillMoves > 0 ? (
                  <Badge className="bg-amber-500 text-slate-950 font-black text-[10px] px-1.5 py-0">
                    +{addedSkillMoves} ⭐ (+{costSkillMoves} XP)
                  </Badge>
                ) : (
                  <span className="text-[11px] text-muted-foreground font-sans">
                    (Valore di fabbrica)
                  </span>
                )}
              </div>
            </div>

            {/* Stepper Controlli [-] e [+] */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onSkillMovesChange(currentSkillMoves - 1)}
                  disabled={!canDecrementSkill}
                  title={
                    currentSkillMoves <= baseSkillMoves
                      ? `Non puoi scendere sotto il valore di fabbrica originale (${baseSkillMoves}⭐)`
                      : `Diminuisci a ${currentSkillMoves - 1}⭐ (recuperi ${TRAINING_COSTS.SKILL_MOVES_STAR} XP)`
                  }
                  className="h-9 px-3 text-xs font-bold"
                >
                  <Minus className="h-3.5 w-3.5 mr-1" />
                  Riduci (-65 XP)
                </Button>

                <Button
                  size="sm"
                  variant="default"
                  onClick={() => onSkillMovesChange(currentSkillMoves + 1)}
                  disabled={!canIncrementSkill}
                  title={
                    currentSkillMoves >= TRAINING_COSTS.MAX_STARS
                      ? "Raggiunto il limite massimo di 5 stelle"
                      : xpAvailable < TRAINING_COSTS.SKILL_MOVES_STAR
                      ? `XP insufficienti: servono ${TRAINING_COSTS.SKILL_MOVES_STAR} XP (disponibili: ${xpAvailable})`
                      : `Aumenta a ${currentSkillMoves + 1}⭐ (costo: ${TRAINING_COSTS.SKILL_MOVES_STAR} XP)`
                  }
                  className="h-9 px-3 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Aumenta (+65 XP)
                </Button>
              </div>

              {addedSkillMoves > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleResetSkillMoves}
                  disabled={isRosterLocked}
                  className="h-8 text-[11px] text-muted-foreground hover:text-rose-500"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Default ({baseSkillMoves}⭐)
                </Button>
              )}
            </div>

            {/* Descrizione Tecnica */}
            <div className="p-3 rounded-xl bg-muted/20 border border-border/50 text-[11px] text-muted-foreground space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-foreground">
                <Info className="h-3.5 w-3.5 text-amber-500" />
                <span>Impatto in Partita</span>
              </div>
              <p>
                Sblocca l'esecuzione delle finte speciali in FC 25: roulette, elastico, bicicletta, rainbow flick e sombreri. Giocatori con 4⭐ o 5⭐ saltano l'uomo con estrema facilità.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* ------------------------------------------------------------- */}
        {/* CARD 2: PIEDE DEBOLE (WEAK FOOT)                              */}
        {/* ------------------------------------------------------------- */}
        <Card
          className={`border transition-all duration-200 overflow-hidden shadow-sm ${
            addedWeakFoot > 0
              ? "border-cyan-500/60 bg-gradient-to-b from-cyan-500/[0.08] to-transparent shadow-md ring-1 ring-cyan-500/20"
              : "border-border/80 bg-card hover:border-border"
          }`}
        >
          <CardHeader className="p-4 border-b border-border/50 bg-muted/20 pb-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-500 shrink-0">
                  <Footprints className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-sm sm:text-base font-extrabold text-foreground flex items-center gap-1.5">
                    Piede Debole (Weak Foot)
                  </CardTitle>
                  <CardDescription className="text-[11px] text-muted-foreground">
                    Valore base naturale: <strong className="text-foreground">{formatStars(baseWeakFoot)} ({baseWeakFoot}⭐)</strong>
                  </CardDescription>
                </div>
              </div>

              <Badge
                variant="outline"
                className="text-[10px] font-mono font-bold border-cyan-500/40 text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 shrink-0"
              >
                {TRAINING_COSTS.WEAK_FOOT_STAR} XP / stella
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-4 sm:p-5 space-y-4">
            {/* Visualizzatore Stelle Interattive */}
            <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 flex flex-col items-center justify-center gap-3">
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((starIndex) => {
                  const isFilled = starIndex <= currentWeakFoot;
                  const isUpgraded = starIndex > baseWeakFoot && starIndex <= currentWeakFoot;
                  const isBase = starIndex <= baseWeakFoot;

                  return (
                    <div
                      key={starIndex}
                      className={`relative flex items-center justify-center transition-transform ${
                        isUpgraded ? "scale-110" : ""
                      }`}
                    >
                      <Star
                        className={`h-7 w-7 sm:h-8 sm:w-8 transition-colors ${
                          isUpgraded
                            ? "text-cyan-400 fill-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]"
                            : isBase
                            ? "text-amber-500 fill-amber-500"
                            : "text-muted-foreground/30 fill-transparent"
                        }`}
                      />
                      {starIndex === baseWeakFoot && (
                        <span
                          title={`Valore originale: ${baseWeakFoot} stelle`}
                          className="absolute -bottom-2 text-[8px] font-black font-mono text-muted-foreground uppercase px-1 py-0 rounded bg-muted border border-border/80"
                        >
                          Base
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="font-extrabold text-foreground text-sm">
                  {currentWeakFoot} / 5 Stelle
                </span>
                {addedWeakFoot > 0 ? (
                  <Badge className="bg-cyan-500 text-slate-950 font-black text-[10px] px-1.5 py-0">
                    +{addedWeakFoot} ⭐ (+{costWeakFoot} XP)
                  </Badge>
                ) : (
                  <span className="text-[11px] text-muted-foreground font-sans">
                    (Valore di fabbrica)
                  </span>
                )}
              </div>
            </div>

            {/* Stepper Controlli [-] e [+] */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onWeakFootChange(currentWeakFoot - 1)}
                  disabled={!canDecrementWeakFoot}
                  title={
                    currentWeakFoot <= baseWeakFoot
                      ? `Non puoi scendere sotto il valore di fabbrica originale (${baseWeakFoot}⭐)`
                      : `Diminuisci a ${currentWeakFoot - 1}⭐ (recuperi ${TRAINING_COSTS.WEAK_FOOT_STAR} XP)`
                  }
                  className="h-9 px-3 text-xs font-bold"
                >
                  <Minus className="h-3.5 w-3.5 mr-1" />
                  Riduci (-90 XP)
                </Button>

                <Button
                  size="sm"
                  variant="default"
                  onClick={() => onWeakFootChange(currentWeakFoot + 1)}
                  disabled={!canIncrementWeakFoot}
                  title={
                    currentWeakFoot >= TRAINING_COSTS.MAX_STARS
                      ? "Raggiunto il limite massimo di 5 stelle"
                      : xpAvailable < TRAINING_COSTS.WEAK_FOOT_STAR
                      ? `XP insufficienti: servono ${TRAINING_COSTS.WEAK_FOOT_STAR} XP (disponibili: ${xpAvailable})`
                      : `Aumenta a ${currentWeakFoot + 1}⭐ (costo: ${TRAINING_COSTS.WEAK_FOOT_STAR} XP)`
                  }
                  className="h-9 px-3 text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Aumenta (+90 XP)
                </Button>
              </div>

              {addedWeakFoot > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleResetWeakFoot}
                  disabled={isRosterLocked}
                  className="h-8 text-[11px] text-muted-foreground hover:text-rose-500"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Default ({baseWeakFoot}⭐)
                </Button>
              )}
            </div>

            {/* Descrizione Tecnica */}
            <div className="p-3 rounded-xl bg-muted/20 border border-border/50 text-[11px] text-muted-foreground space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-foreground">
                <Info className="h-3.5 w-3.5 text-cyan-500" />
                <span>Piede Dominante: {player.Piede === "SX" ? "Sinistro (Mancino)" : "Destro"}</span>
              </div>
              <p>
                Aumenta la precisione dei tiri al volo, conclusioni a rete e lanci lunghi effettuati con il piede non dominante ({player.Piede === "SX" ? "Destro" : "Sinistro"}), riducendo gli errori tecnici sotto pressione.
              </p>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* ========================================================================= */}
      {/* BOX RIEPILOGATIVO STATO TECNICO CALCIATORE                                */}
      {/* ========================================================================= */}
      <div className="p-3.5 rounded-xl border border-border/70 bg-muted/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          {totalStarsCost > 0 ? (
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-500 border border-amber-500/30">
              <Sparkles className="h-4 w-4" />
            </div>
          ) : (
            <div className="p-1.5 rounded-lg bg-muted text-muted-foreground border border-border/60">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          )}
          <div>
            <div className="font-bold text-foreground">
              {totalStarsCost > 0
                ? `Potenziamenti Tecnici Attivi: spesa di ${totalStarsCost} XP`
                : "Valori Originali di Fabbrica Mantenuti"}
            </div>
            <div className="text-[11px] text-muted-foreground">
              {totalStarsCost > 0
                ? `${addedSkillMoves > 0 ? `Mosse Abilità: ${baseSkillMoves}⭐ ➔ ${currentSkillMoves}⭐ (+${costSkillMoves} XP)` : ""}${
                    addedSkillMoves > 0 && addedWeakFoot > 0 ? " • " : ""
                  }${addedWeakFoot > 0 ? `Piede Debole: ${baseWeakFoot}⭐ ➔ ${currentWeakFoot}⭐ (+${costWeakFoot} XP)` : ""}`
                : `Il calciatore gioca con le sue ${baseSkillMoves}⭐ di abilità e ${baseWeakFoot}⭐ di piede debole naturali.`}
            </div>
          </div>
        </div>

        {totalStarsCost > 0 && (
          <Badge className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-mono text-xs px-2.5 py-1">
            Totale: -{totalStarsCost} XP
          </Badge>
        )}
      </div>
    </div>
  );
};

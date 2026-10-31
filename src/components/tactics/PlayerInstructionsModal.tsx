import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Player } from "@/types/player";
import { calcOverall } from "@/utils/playerOvrCalculator";
import { evaluateRoleFit } from "@/types/tactics";
import {
  TacticalSettings,
  getRolesForPosition,
  PlayerRoleOption,
  RoleFocusOption,
} from "@/types/tactics";
import {
  getPlayerImage,
  getRoleColor,
  getValueColor,
} from "@/utils/functions";
import {
  Shield,
  Zap,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Sparkles,
  Info,
  CheckCircle2,
  Check,
} from "lucide-react";

interface PlayerInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  slotIndex: number;
  slotRole: string; // es. "POR", "DC", "CC", "ATT"
  occupant: Player | null;
  totalSlots?: number;
  tacticalSettings: TacticalSettings;
  onUpdateInstruction: (slotIndex: number, roleId: string, focusId: string) => void;
  onNavigateSlot?: (newSlotIndex: number) => void;
  onOpenPlayerDetails?: (player: Player) => void;
  disabled?: boolean;
}

export const PlayerInstructionsModal: React.FC<PlayerInstructionsModalProps> = ({
  isOpen,
  onClose,
  slotIndex,
  slotRole,
  occupant,
  totalSlots = 11,
  tacticalSettings,
  onUpdateInstruction,
  onNavigateSlot,
  onOpenPlayerDetails,
  disabled = false,
}) => {
  const availableRoles: PlayerRoleOption[] = getRolesForPosition(slotRole);

  const currentInstruction = tacticalSettings.playerInstructions[slotIndex] || {
    slotRole,
    roleId: availableRoles[0]?.id || "",
    focusId: availableRoles[0]?.focuses[0]?.id || "",
  };

  const selectedRole =
    availableRoles.find((r) => r.id === currentInstruction.roleId) ||
    availableRoles[0] || {
      id: "default",
      name: "Ruolo Base",
      description: "Istruzioni base di posizione",
      focuses: [{ id: "equilibrato", name: "Equilibrato", description: "Comportamento bilanciato" }],
    };

  const selectedFocus =
    selectedRole.focuses.find((f) => f.id === currentInstruction.focusId) ||
    selectedRole.focuses[0];

  const handleSelectRole = (role: PlayerRoleOption) => {
    if (disabled) return;
    const defaultFocus = role.focuses[0];
    onUpdateInstruction(slotIndex, role.id, defaultFocus?.id || "equilibrato");
  };

  const handleSelectFocus = (focus: RoleFocusOption) => {
    if (disabled) return;
    onUpdateInstruction(slotIndex, selectedRole.id, focus.id);
  };

  const handlePrev = () => {
    if (!onNavigateSlot) return;
    const prev = (slotIndex - 1 + totalSlots) % totalSlots;
    onNavigateSlot(prev);
  };

  const handleNext = () => {
    if (!onNavigateSlot) return;
    const next = (slotIndex + 1) % totalSlots;
    onNavigateSlot(next);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-5 sm:p-6 bg-card text-card-foreground border-border/80 shadow-2xl">
        <DialogHeader className="space-y-3 pb-3 border-b border-border/60">
          {/* BARRA SUPERIORE NAVIGAZIONE SLOT */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5 font-bold">
              <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-mono text-[11px]">
                {slotIndex + 1}
              </span>
              <span>
                Slot #{slotIndex + 1} di {totalSlots}
              </span>
              <Badge
                variant="outline"
                className={`text-[10px] py-0 px-1.5 font-extrabold ${getRoleColor(slotRole)}`}
              >
                {slotRole}
              </Badge>
            </div>

            {onNavigateSlot && (
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handlePrev}
                  className="h-7 px-2 text-xs gap-1 font-semibold"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Prec
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleNext}
                  className="h-7 px-2 text-xs gap-1 font-semibold"
                >
                  Succ
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}
          </div>

          {/* TITOLO + INFORMAZIONI GIOCATORE OCCUPANTE */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              {occupant ? (
                <div className="relative">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-900 border-2 border-primary/50 shadow">
                    <img
                      src={getPlayerImage(Number(occupant.ID))}
                      alt={occupant.Cognome}
                      className="w-full h-full object-cover object-top"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/images/players/MConti.png";
                      }}
                    />
                  </div>
                  {(() => {
                    const dynOvr = calcOverall(slotRole, occupant, occupant.OVR ?? 70);
                    const baseOvr = occupant.OVR ?? 70;
                    const diff = dynOvr - baseOvr;
                    return (
                      <span
                        className={`absolute -top-1 -right-1 text-[10px] font-black font-mono px-1.5 py-0.2 rounded-full border shadow ${
                          diff < 0
                            ? "bg-rose-950 text-rose-300 border-rose-500/80"
                            : diff > 0
                            ? "bg-emerald-950 text-emerald-300 border-emerald-500/80"
                            : "bg-slate-950 text-white border-white/40"
                        }`}
                        title={
                          diff < 0
                            ? `OVR nel ruolo ${slotRole}: ${dynOvr} (${diff} per adattamento fuori ruolo, Base: ${baseOvr})`
                            : `OVR nel ruolo: ${dynOvr}`
                        }
                      >
                        {dynOvr}
                      </span>
                    );
                  })()}
                </div>
              ) : (
                <div className="w-14 h-14 rounded-full border-2 border-dashed border-border bg-muted/30 flex items-center justify-center text-muted-foreground text-xs font-bold">
                  {slotRole}
                </div>
              )}

              <div>
                <DialogTitle className="text-lg font-black tracking-tight flex items-center gap-2">
                  {occupant ? (
                    <>
                      <span>{occupant.Nome} {occupant.Cognome}</span>
                      {occupant.NumeroMaglia && (
                        <span className="text-xs font-mono text-muted-foreground font-normal">
                          #{occupant.NumeroMaglia}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-muted-foreground italic">Slot non assegnato</span>
                  )}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                  <span>Istruzioni FC IQ per la posizione</span>
                  <Badge variant="outline" className="text-[10px] py-0 px-1 font-mono font-bold">
                    {slotRole}
                  </Badge>
                  {occupant && (() => {
                    const fit = evaluateRoleFit(occupant.Posiz, slotRole, occupant);
                    const dynOvr = calcOverall(slotRole, occupant, occupant.OVR ?? 70);
                    const diff = dynOvr - (occupant.OVR ?? 70);
                    return (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] text-muted-foreground">
                          Ruolo naturale: <b>{occupant.Posiz}</b>
                        </span>
                        {fit === "natural" ? (
                          <Badge className="text-[9px] px-1 py-0 h-3.5 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                            Naturale (OVR {dynOvr})
                          </Badge>
                        ) : fit === "adaptable" ? (
                          <Badge className="text-[9px] px-1 py-0 h-3.5 bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30">
                            Adattato (OVR {dynOvr}{diff < 0 ? ` ${diff}` : ""})
                          </Badge>
                        ) : (
                          <Badge className="text-[9px] px-1 py-0 h-3.5 bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30">
                            Fuori Ruolo (OVR {dynOvr} {diff})
                          </Badge>
                        )}
                      </div>
                    );
                  })()}
                </DialogDescription>
              </div>
            </div>

            {occupant && onOpenPlayerDetails && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenPlayerDetails(occupant)}
                className="h-8 text-xs font-semibold gap-1.5 shrink-0"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Vedi Scheda
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* CONTENUTO MODALE: RUOLO & FOCUS FC IQ */}
        <div className="space-y-5 py-3">
          {/* BANNER INFORMATIVO FC IQ */}
          <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs text-muted-foreground flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-foreground">
                Sistema Ufficiale FC IQ EA Sports FC 25
              </p>
              <p className="text-[11px] mt-0.5 leading-relaxed">
                Assegna al giocatore il suo <b>Ruolo</b> tattico (come interpreta la posizione) e il relativo <b>Compito / Focus</b> (comportamento con o senza palla). L'admin della lega replicherà esattamente questi settaggi nel gioco.
              </p>
            </div>
          </div>

          {/* 1. SELEZIONE RUOLO (PLAYER ROLE) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <span>1. Ruolo Giocatore (Role)</span>
              </label>
              <span className="text-[11px] text-muted-foreground">
                {availableRoles.length} ruoli disponibili per {slotRole}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {availableRoles.map((role) => {
                const isSelected = selectedRole.id === role.id;
                return (
                  <button
                    key={role.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => handleSelectRole(role)}
                    className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between gap-1.5 ${
                      isSelected
                        ? "bg-primary/10 border-primary text-foreground ring-2 ring-primary/25 shadow-sm"
                        : "bg-muted/15 border-border/70 text-muted-foreground hover:bg-muted/30 hover:border-primary/40"
                    } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-xs text-foreground">
                        {role.name}
                      </span>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                      {role.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. SELEZIONE FOCUS / COMPITO (ROLE FOCUS) */}
          <div className="space-y-2.5 pt-2 border-t border-border/60">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <span>2. Compito / Focus</span>
                <Badge variant="secondary" className="text-[10px] py-0 px-1 font-bold">
                  {selectedRole.name}
                </Badge>
              </label>
              <span className="text-[11px] text-muted-foreground">
                Seleziona il compito attivo
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {selectedRole.focuses.map((focus) => {
                const isSelected = selectedFocus.id === focus.id;
                return (
                  <button
                    key={focus.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => handleSelectFocus(focus)}
                    className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between gap-1.5 ${
                      isSelected
                        ? "bg-emerald-500/10 border-emerald-500 text-foreground ring-2 ring-emerald-500/25 shadow-sm"
                        : "bg-muted/15 border-border/70 text-muted-foreground hover:bg-muted/30 hover:border-emerald-500/40"
                    } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-xs text-foreground">
                          {focus.name}
                        </span>
                        {focus.name === "Difesa" && (
                          <Badge variant="outline" className="text-[9px] py-0 px-1 text-sky-500 border-sky-500/30">
                            Difensivo
                          </Badge>
                        )}
                        {focus.name === "Attacco" && (
                          <Badge variant="outline" className="text-[9px] py-0 px-1 text-rose-500 border-rose-500/30">
                            Offensivo
                          </Badge>
                        )}
                        {focus.name === "Equilibrato" && (
                          <Badge variant="outline" className="text-[9px] py-0 px-1 text-emerald-500 border-emerald-500/30">
                            Bilanciato
                          </Badge>
                        )}
                        {focus.name === "Costruzione" && (
                          <Badge variant="outline" className="text-[9px] py-0 px-1 text-amber-500 border-amber-500/30">
                            Manovra
                          </Badge>
                        )}
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                      {focus.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIEPILOGO ISTRUZIONE ATTIVA */}
          <div className="p-3 rounded-xl bg-muted/30 border border-border/60 flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground font-medium">
              Assetto attuale per lo slot:
            </span>
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className="font-bold text-xs bg-card">
                {selectedRole.name}
              </Badge>
              <span className="text-muted-foreground text-xs">•</span>
              <Badge variant="secondary" className="font-bold text-xs">
                {selectedFocus.name}
              </Badge>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-3 border-t border-border/60 flex sm:justify-between items-center gap-2">
          <div className="text-[11px] text-muted-foreground">
            Le modifiche verranno salvate premendo "Salva Formazione".
          </div>
          <Button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto font-bold px-5"
          >
            Fatto
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

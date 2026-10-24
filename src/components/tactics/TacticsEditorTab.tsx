import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Player } from "@/types/player";
import { FormationDef } from "@/pages/Tattica";
import {
  TacticalSettings,
  FC25_ROLES_BY_POSITION,
  getRolesForPosition,
} from "@/types/tactics";
import { TeamTacticsCard } from "@/components/tactics/TeamTacticsCard";
import { getPlayerImage, getRoleColor } from "@/utils/functions";
import {
  SlidersHorizontal,
  Sparkles,
  Info,
  Maximize2,
  CheckCircle2,
} from "lucide-react";

interface TacticsEditorTabProps {
  formation: FormationDef;
  formationSlots: (Player | null)[];
  tacticalSettings: TacticalSettings;
  onChangeTacticalSettings: (settings: TacticalSettings) => void;
  onOpenInstructionModal: (slotIndex: number) => void;
  disabled?: boolean;
}

export const TacticsEditorTab: React.FC<TacticsEditorTabProps> = ({
  formation,
  formationSlots,
  tacticalSettings,
  onChangeTacticalSettings,
  onOpenInstructionModal,
  disabled = false,
}) => {
  const handleRoleChange = (slotIndex: number, newRoleId: string) => {
    if (disabled) return;
    const posLabel = formation.positions[slotIndex]?.label || "CC";
    const availableRoles = getRolesForPosition(posLabel);
    const targetRole = availableRoles.find((r) => r.id === newRoleId) || availableRoles[0];
    const defaultFocus = targetRole?.focuses[0]?.id || "equilibrato";

    onChangeTacticalSettings({
      ...tacticalSettings,
      playerInstructions: {
        ...tacticalSettings.playerInstructions,
        [slotIndex]: {
          slotRole: posLabel,
          roleId: targetRole?.id || newRoleId,
          focusId: defaultFocus,
        },
      },
    });
  };

  const handleFocusChange = (slotIndex: number, newFocusId: string) => {
    if (disabled) return;
    const current = tacticalSettings.playerInstructions[slotIndex];
    if (!current) return;

    onChangeTacticalSettings({
      ...tacticalSettings,
      playerInstructions: {
        ...tacticalSettings.playerInstructions,
        [slotIndex]: {
          ...current,
          focusId: newFocusId,
        },
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. TATTICHE DI SQUADRA GLOBALI (BUILD-UP & DIFESA) */}
      <TeamTacticsCard
        tacticalSettings={tacticalSettings}
        onChange={onChangeTacticalSettings}
        disabled={disabled}
      />

      {/* 2. ISTRUZIONI INDIVIDUALI FC IQ (11 TITOLARI) */}
      <Card className="shadow-lg border-border/80 overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border/60 py-4 px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
              <CardTitle className="text-base sm:text-lg font-black tracking-tight">
                Istruzioni Ruolo & Compito FC IQ (11 Titolari)
              </CardTitle>
              <Badge
                variant="outline"
                className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 text-[10px] font-bold"
              >
                EA FC 25
              </Badge>
            </div>
            <CardDescription className="text-xs mt-1">
              Personalizza il Ruolo e il Focus per ogni posizione del modulo <b>{formation.name}</b>.
            </CardDescription>
          </div>

          <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>Puoi usare i menù a tendina o cliccare sul pulsante modale.</span>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {formation.positions.map((pos, slotIdx) => {
              const occupant = formationSlots[slotIdx];
              const availableRoles = getRolesForPosition(pos.label);
              const currentInstr = tacticalSettings.playerInstructions[slotIdx] || {
                slotRole: pos.label,
                roleId: availableRoles[0]?.id || "",
                focusId: availableRoles[0]?.focuses[0]?.id || "equilibrato",
              };

              const activeRoleDef =
                availableRoles.find((r) => r.id === currentInstr.roleId) ||
                availableRoles[0];
              const availableFocuses = activeRoleDef?.focuses || [];
              const activeFocusDef =
                availableFocuses.find((f) => f.id === currentInstr.focusId) ||
                availableFocuses[0];

              return (
                <div
                  key={slotIdx}
                  className="p-3.5 rounded-xl border border-border/70 bg-card hover:border-primary/40 transition-all shadow-sm space-y-3"
                >
                  {/* Riga Superiore: Posizione + Calciatore + Pulsante Dettaglio */}
                  <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-6 h-6 rounded-md bg-muted/70 border border-border flex items-center justify-center font-mono text-[10px] font-black text-foreground shrink-0">
                        {slotIdx + 1}
                      </div>

                      <Badge
                        variant="outline"
                        className={`w-11 justify-center text-[10px] py-0.5 font-extrabold shrink-0 ${getRoleColor(
                          pos.label
                        )}`}
                      >
                        {pos.label}
                      </Badge>

                      {occupant ? (
                        <div className="flex items-center gap-2 min-w-0 truncate">
                          <img
                            src={getPlayerImage(Number(occupant.ID))}
                            alt={occupant.Cognome}
                            className="w-6 h-6 rounded-full object-cover object-top border border-border shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "/images/players/MConti.png";
                            }}
                          />
                          <span className="font-bold text-xs text-foreground truncate">
                            {occupant.Nome} {occupant.Cognome}
                          </span>
                          <span className="font-mono text-[10px] font-bold text-primary shrink-0">
                            ({occupant.OVR})
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">
                          Slot non assegnato
                        </span>
                      )}
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onOpenInstructionModal(slotIdx)}
                      className="h-7 px-2 text-xs text-muted-foreground hover:text-primary gap-1 shrink-0"
                      title="Apri modale a schermo intero"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline text-[11px]">Dettagli</span>
                    </Button>
                  </div>

                  {/* Selettori Ruolo e Focus */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Select Ruolo */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Ruolo FC IQ
                      </label>
                      <Select
                        value={activeRoleDef?.id || ""}
                        onValueChange={(val) => handleRoleChange(slotIdx, val)}
                        disabled={disabled}
                      >
                        <SelectTrigger className="h-8 text-xs font-bold bg-background/80">
                          <SelectValue placeholder="Seleziona Ruolo" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableRoles.map((r) => (
                            <SelectItem
                              key={r.id}
                              value={r.id}
                              className="text-xs font-semibold"
                            >
                              {r.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Select Focus */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Compito / Focus
                      </label>
                      <Select
                        value={activeFocusDef?.id || ""}
                        onValueChange={(val) => handleFocusChange(slotIdx, val)}
                        disabled={disabled || availableFocuses.length === 0}
                      >
                        <SelectTrigger className="h-8 text-xs font-bold bg-background/80">
                          <SelectValue placeholder="Seleziona Focus" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableFocuses.map((f) => (
                            <SelectItem
                              key={f.id}
                              value={f.id}
                              className="text-xs font-semibold"
                            >
                              {f.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Descrizione comportamento in campo */}
                  <div className="text-[10.5px] leading-relaxed text-muted-foreground bg-muted/20 p-2 rounded-lg border border-border/40">
                    <span className="font-semibold text-foreground">
                      {activeRoleDef?.name} ({activeFocusDef?.name}):{" "}
                    </span>
                    <span>{activeFocusDef?.description || activeRoleDef?.description}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

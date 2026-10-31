import { SUPABASE_STORAGE_URL } from "@/constants/App";
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
  SetPiecesSettings,
  FC25_ROLES_BY_POSITION,
  getRolesForPosition,
} from "@/types/tactics";
import { TeamTacticsCard } from "@/components/tactics/TeamTacticsCard";
import { SetPiecesCard } from "@/components/tactics/SetPiecesCard";
import { getPlayerImage, getRoleColor } from "@/utils/functions";
import {
  SlidersHorizontal,
  Sparkles,
  Maximize2,
  Users,
} from "lucide-react";

interface TacticsEditorTabProps {
  formation: FormationDef;
  formationSlots: (Player | null)[];
  roster: Player[];
  tacticalSettings: TacticalSettings;
  onChangeTacticalSettings: (settings: TacticalSettings) => void;
  onOpenInstructionModal: (slotIndex: number) => void;
  disabled?: boolean;
}

export const TacticsEditorTab: React.FC<TacticsEditorTabProps> = ({
  formation,
  formationSlots,
  roster,
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

  const handleSetPiecesChange = (updatedSetPieces: SetPiecesSettings) => {
    if (disabled) return;
    onChangeTacticalSettings({
      ...tacticalSettings,
      setPieces: updatedSetPieces,
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

      {/* 2. INCARICHI (CALCI PIAZZATI, RIGORI, CAPITANO) */}
      <SetPiecesCard
        setPieces={tacticalSettings.setPieces || {}}
        starters={formationSlots}
        roster={roster}
        onChange={handleSetPiecesChange}
        disabled={disabled}
      />

      {/* 3. ISTRUZIONI INDIVIDUALI FC IQ - UNA RIGA PER OGNI GIOCATORE */}
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
              Imposta il Ruolo e il Focus per ogni giocatore in campo nel modulo <b>{formation.name}</b>.
            </CardDescription>
          </div>

          <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>1 riga per ciascun titolare con spiegazione immediata.</span>
          </div>
        </CardHeader>

        <CardContent className="p-3 sm:p-4 space-y-2.5">
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
                className="p-3 rounded-xl border border-border/70 bg-card hover:border-primary/40 transition-all shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-3"
              >
                {/* 1. Slot # + Badge Posizione + Calciatore Titolare */}
                <div className="flex items-center gap-3 w-full lg:w-[260px] shrink-0">
                  <div className="w-7 h-7 rounded-lg bg-muted/70 border border-border flex items-center justify-center font-mono text-xs font-black text-foreground shrink-0">
                    {slotIdx + 1}
                  </div>

                  <Badge
                    variant="outline"
                    className={`w-12 justify-center text-[10px] py-0.5 font-extrabold shrink-0 ${getRoleColor(
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
                        className="w-8 h-8 rounded-full object-cover object-top border border-border shrink-0 shadow-sm"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `${SUPABASE_STORAGE_URL}/images/players/MConti.png`;
                        }}
                      />
                      <div className="truncate">
                        <div className="font-bold text-xs text-foreground truncate">
                          {occupant.Nome} {occupant.Cognome}
                        </div>
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1 font-mono">
                          <span className="font-bold text-primary">OVR {occupant.OVR}</span>
                          <span>•</span>
                          <span>[{occupant.Posiz}]</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground italic truncate">
                      Slot non assegnato
                    </span>
                  )}
                </div>

                {/* 2. Selettori Ruolo FC IQ + Compito / Focus */}
                <div className="grid grid-cols-2 gap-2 w-full lg:w-[320px] shrink-0">
                  {/* Select Ruolo */}
                  <div>
                    <Select
                      value={activeRoleDef?.id || ""}
                      onValueChange={(val) => handleRoleChange(slotIdx, val)}
                      disabled={disabled}
                    >
                      <SelectTrigger className="h-9 text-xs font-bold bg-background/90 border-border/80">
                        <SelectValue placeholder="Ruolo" />
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
                  <div>
                    <Select
                      value={activeFocusDef?.id || ""}
                      onValueChange={(val) => handleFocusChange(slotIdx, val)}
                      disabled={disabled || availableFocuses.length === 0}
                    >
                      <SelectTrigger className="h-9 text-xs font-bold bg-background/90 border-border/80">
                        <SelectValue placeholder="Focus" />
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

                {/* 3. Spiegazione sintetica del comportamento in campo */}
                <div className="flex-1 min-w-0 text-[11px] text-muted-foreground bg-muted/20 px-3 py-1.5 rounded-lg border border-border/40 truncate">
                  <span className="font-semibold text-foreground">
                    {activeRoleDef?.name} ({activeFocusDef?.name}):{" "}
                  </span>
                  <span className="text-muted-foreground">
                    {activeFocusDef?.description || activeRoleDef?.description}
                  </span>
                </div>

                {/* 4. Bottone Dettagli / Modale a Schermo Intero */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onOpenInstructionModal(slotIdx)}
                  className="h-8 px-2.5 text-xs text-muted-foreground hover:text-primary gap-1 shrink-0 self-end lg:self-auto"
                  title="Apri modale di configurazione per questo slot"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[11px]">Dettagli</span>
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
};

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Player } from "@/types/player";
import { FormationDef } from "@/pages/Tattica";
import {
  TacticalSettings,
  BUILD_UP_STYLES,
  DEFENSIVE_APPROACHES,
  FC25_ROLES_BY_POSITION,
  SET_PIECES_DEFINITIONS,
  evaluateRoleFit,
} from "@/types/tactics";
import {
  getPlayerImage,
  getRoleColor,
  getValueColor,
} from "@/utils/functions";
import {
  Shield,
  Zap,
  SlidersHorizontal,
  ArrowRight,
  Info,
  Crown,
  Target,
  Flag,
  Sparkles,
} from "lucide-react";

interface TacticsOverviewTabProps {
  formation: FormationDef;
  formationSlots: (Player | null)[];
  roster?: Player[];
  tacticalSettings: TacticalSettings;
  onEditFormation: () => void;
  onEditTactics: () => void;
  onOpenPlayerModal: (player: Player) => void;
  onOpenInstructionModal: (slotIndex: number) => void;
}

export const TacticsOverviewTab: React.FC<TacticsOverviewTabProps> = ({
  formation,
  formationSlots,
  roster = [],
  tacticalSettings,
  onEditFormation,
  onEditTactics,
  onOpenPlayerModal,
  onOpenInstructionModal,
}) => {
  const { buildUpStyle, defensiveApproach, defensiveLine } =
    tacticalSettings.teamTactics;

  const currentBuildUp =
    BUILD_UP_STYLES.find((b) => b.id === buildUpStyle) || BUILD_UP_STYLES[1];
  const currentDef =
    DEFENSIVE_APPROACHES.find((d) => d.id === defensiveApproach) ||
    DEFENSIVE_APPROACHES[1];

  const assignedCount = formationSlots.filter(Boolean).length;
  const setPieces = tacticalSettings.setPieces || {};

  // Helper per trovare il calciatore assegnato a un incarico
  const getAssignedPlayer = (key: keyof typeof setPieces) => {
    const pId = setPieces[key];
    if (!pId) return null;
    return (
      formationSlots.find((p) => p && Number(p.ID) === pId) ||
      roster.find((p) => Number(p.ID) === pId) ||
      null
    );
  };

  return (
    <div className="space-y-6">
      {/* ===================================================================== */}
      {/* 1. HEADER BANNER RIEPILOGATIVO SQUADRA                                */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Modulo */}
        <Card className="border-border/70 bg-gradient-to-br from-card to-muted/20 shadow-sm p-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Modulo Selezionato
            </div>
            <div className="text-xl font-black tracking-tight text-foreground mt-0.5">
              {formation.name}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {assignedCount}/11 titolari schierati
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={onEditFormation}
            className="text-xs font-semibold gap-1 h-8"
          >
            Cambia
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Card>

        {/* Stile di Costruzione */}
        <Card className="border-border/70 bg-gradient-to-br from-card to-muted/20 shadow-sm p-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Costruzione Manovra</span>
            </div>
            <div className="text-xl font-black tracking-tight text-foreground mt-0.5">
              {currentBuildUp.name}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
              {currentBuildUp.shortDesc}
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={onEditTactics}
            className="text-xs font-semibold gap-1 h-8"
          >
            Tattiche
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Card>

        {/* Approccio Difensivo & Linea */}
        <Card className="border-border/70 bg-gradient-to-br from-card to-muted/20 shadow-sm p-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-sky-500" />
              <span>Assetto Difensivo</span>
            </div>
            <div className="text-xl font-black tracking-tight text-foreground mt-0.5">
              {currentDef.name}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Linea Difensiva: <b>{defensiveLine}/100</b>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={onEditTactics}
            className="text-xs font-semibold gap-1 h-8"
          >
            Tattiche
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Card>
      </div>

      {/* ===================================================================== */}
      {/* 2. GRIGLIA PRINCIPALE: CAMPO TITOLARI (6) + RIEPILOGO ISTRUZIONI (6)   */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-12 gap-6 items-start">
        {/* COLONNA SINISTRA: CAMPO DA CALCIO 2D CON SOLI TITOLARI (ICON & FONT PIÙ GRANDI) */}
        <div className="col-span-12 lg:col-span-6">
          <Card className="shadow-lg border-border/80 overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border/60 py-3.5 px-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <span>Schieramento Titolari</span>
                  <Badge variant="outline" className="text-xs font-mono font-extrabold">
                    {formation.id}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  I soli 11 titolari in campo con i rispettivi Ruoli FC IQ
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="p-3 sm:p-4">
              {/* Contenitore Campo da Calcio con proporzioni ampie e spaziate */}
              <div
                className="relative w-full rounded-2xl overflow-hidden shadow-2xl border-4 border-slate-900 select-none bg-gradient-to-b from-emerald-800 via-emerald-700 to-emerald-900"
                style={{ aspectRatio: "3 / 4.1", minHeight: "560px" }}
              >
                {/* Texture erba a strisce verticali realistiche */}
                <div
                  className="absolute inset-0 opacity-20 pointer-events-none"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(to right, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 40px, transparent 40px, transparent 80px)",
                  }}
                />

                {/* Vignettatura scura sui bordi del campo */}
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(0,0,0,0.45)_100%)]" />

                {/* Linee regolamentari del campo */}
                <div className="pointer-events-none absolute inset-4 border-2 border-white/55 rounded-sm">
                  {/* Linea di metà campo */}
                  <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-white/55" />
                  {/* Cerchio di centrocampo */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 border-2 border-white/55 rounded-full" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white/80 rounded-full" />

                  {/* Area di rigore superiore (Attacco) */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 border-2 border-white/55 border-t-0" />
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-10 border-2 border-white/55 border-t-0" />

                  {/* Area di rigore inferiore (Porta) */}
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-24 border-2 border-white/55 border-b-0" />
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-28 h-10 border-2 border-white/55 border-b-0" />
                </div>

                {/* 11 Pedine Titolari sul Campo (DIMENSIONI E FONT MAGGIORATI) */}
                <div className="relative w-full h-full">
                  {formation.positions.map((pos, slotIdx) => {
                    const occupant = formationSlots[slotIdx];
                    const fit = occupant
                      ? evaluateRoleFit(occupant.Posiz, pos.label)
                      : null;

                    const ringColor =
                      fit === "natural"
                        ? "border-emerald-400 shadow-emerald-500/40"
                        : fit === "adaptable"
                        ? "border-amber-400 shadow-amber-500/40"
                        : "border-rose-400 shadow-rose-500/40";

                    const instr = tacticalSettings.playerInstructions[slotIdx];
                    const roleDef = FC25_ROLES_BY_POSITION[pos.label]?.find(
                      (r) => r.id === instr?.roleId
                    );
                    const roleName = roleDef?.name || "FC IQ";

                    return (
                      <div
                        key={slotIdx}
                        onClick={() => {
                          if (occupant) onOpenPlayerModal(occupant);
                        }}
                        style={{ left: pos.x, top: pos.y }}
                        className="absolute -translate-x-1/2 -translate-y-1/2 z-10 transition-all duration-300 hover:scale-115 hover:z-30 cursor-pointer"
                        title={
                          occupant
                            ? `${occupant.Nome} ${occupant.Cognome} (${pos.label}) - FC IQ: ${roleName}`
                            : `Slot ${pos.label} Vuoto`
                        }
                      >
                        {occupant ? (
                          <div className="flex flex-col items-center group">
                            {/* Avatar Pedina con Icona Dimensione Esatta Uniforme */}
                            <div className="relative shrink-0" style={{ width: "52px", height: "52px" }}>
                              <div
                                className={`w-[52px] h-[52px] rounded-full overflow-hidden bg-slate-900 border-2 ${ringColor} shadow-xl shrink-0`}
                              >
                                <img
                                  src={getPlayerImage(Number(occupant.ID))}
                                  alt={occupant.Cognome}
                                  className="w-full h-full object-cover object-top block pointer-events-none"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src =
                                      "/images/players/MConti.png";
                                  }}
                                />
                              </div>

                              {/* Pillola OVR */}
                              <span className="absolute -top-1 -right-1.5 bg-slate-950 text-white border border-white/50 text-[10px] font-black font-mono px-1 py-0 rounded-full shadow-md z-10">
                                {occupant.OVR}
                              </span>

                              {/* Numero Maglia */}
                              <span className="absolute -bottom-1 -left-1.5 bg-emerald-600 text-white text-[9px] font-bold font-mono min-w-4 h-4 px-1 rounded-full flex items-center justify-center border border-white/70 shadow-md z-10">
                                {occupant.NumeroMaglia ?? slotIdx + 1}
                              </span>
                            </div>

                            {/* Targhetta Cognome + Ruolo Posizione */}
                            <div className="mt-1 px-1.5 py-0.5 rounded-md bg-slate-950/95 backdrop-blur-sm border border-white/30 text-white shadow-lg flex items-center gap-1 max-w-[110px]">
                              <span className="text-[9px] font-black text-emerald-400 font-mono shrink-0">
                                {pos.label}
                              </span>
                              <span className="text-[10.5px] font-bold truncate">
                                {occupant.Cognome}
                              </span>
                            </div>

                            {/* Badge Ruolo FC IQ */}
                            <div className="mt-0.5 px-1.5 py-0.5 rounded bg-primary text-primary-foreground text-[8.5px] font-black tracking-tight shadow flex items-center gap-1 border border-primary/40 truncate max-w-[110px]">
                              <SlidersHorizontal className="w-2.5 h-2.5 shrink-0" />
                              <span className="truncate">{roleName}</span>
                            </div>
                          </div>
                        ) : (
                          /* Slot Vuoto sul Campo */
                          <div className="flex flex-col items-center">
                            <div className="w-[48px] h-[48px] rounded-full border-2 border-dashed border-white/70 bg-black/45 text-white/95 flex flex-col items-center justify-center shadow-md shrink-0">
                              <span className="text-[9px] font-mono font-bold opacity-80">
                                #{slotIdx + 1}
                              </span>
                              <span className="text-xs font-black">{pos.label}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-3 text-xs text-muted-foreground flex items-center justify-between px-1">
                <span className="flex items-center gap-1.5 font-medium">
                  <Info className="w-4 h-4 text-primary" />
                  Clicca su una pedina per aprire la scheda calciatore
                </span>
                <span className="font-mono text-xs font-bold text-foreground">11 Titolari</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* COLONNA DESTRA: ISTRUZIONI FC IQ + INCARICHI PARTITA */}
        <div className="col-span-12 lg:col-span-6 space-y-5">
          {/* A) ELENCO ISTRUZIONI INDIVIDUALI FC IQ */}
          <Card className="shadow-lg border-border/80 overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border/60 py-3.5 px-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-primary" />
                  <span>Istruzioni Individuali FC IQ</span>
                  <Badge
                    variant="outline"
                    className="text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/30 font-bold"
                  >
                    11 Ruoli Attivi
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Riepilogo delle indicazioni tattiche impostate per ciascun titolare
                </CardDescription>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={onEditTactics}
                className="text-xs font-semibold gap-1.5 h-8 shrink-0"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Modifica
              </Button>
            </CardHeader>

            <CardContent className="p-3 divide-y divide-border/50">
              {formation.positions.map((pos, slotIdx) => {
                const occupant = formationSlots[slotIdx];
                const instr = tacticalSettings.playerInstructions[slotIdx];
                const roleDef = FC25_ROLES_BY_POSITION[pos.label]?.find(
                  (r) => r.id === instr?.roleId
                );
                const roleName = roleDef?.name || "Ruolo Base";
                const focusDef = roleDef?.focuses?.find((f) => f.id === instr?.focusId);
                const focusName = focusDef?.name || instr?.focusId || "Equilibrato";
                const focusDesc = focusDef?.description || roleDef?.description || "";

                return (
                  <div
                    key={slotIdx}
                    className="py-2.5 px-2 hover:bg-muted/15 rounded-lg transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                  >
                    {/* Posizione + Calciatore */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-6 h-6 rounded-md bg-muted/60 border border-border/70 flex items-center justify-center font-mono text-[10px] font-extrabold shrink-0">
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
                            className="w-7 h-7 rounded-full object-cover object-top border border-border shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "/images/players/MConti.png";
                            }}
                          />
                          <div className="truncate">
                            <div className="font-bold text-xs text-foreground truncate">
                              {occupant.Nome} {occupant.Cognome}
                            </div>
                            <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <span>OVR</span>
                              <span className="font-mono font-bold text-primary">
                                {occupant.OVR}
                              </span>
                              {occupant.NumeroMaglia && (
                                <span>• Maglia #{occupant.NumeroMaglia}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">
                          Slot #{slotIdx + 1} ({pos.label}) vuoto
                        </span>
                      )}
                    </div>

                    {/* Istruzione FC IQ assegnata allo slot */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                      <div className="text-right">
                        <div className="flex items-center gap-1.5 justify-end">
                          <Badge
                            variant="secondary"
                            className="font-black text-xs py-0 px-2 bg-primary/10 text-primary border border-primary/20"
                          >
                            {roleName}
                          </Badge>
                          <span className="text-muted-foreground text-xs">•</span>
                          <Badge
                            variant="outline"
                            className="font-bold text-[10px] py-0 px-1.5 border-border/80"
                          >
                            {focusName}
                          </Badge>
                        </div>
                        <p className="text-[10.5px] text-muted-foreground max-w-[260px] truncate mt-0.5">
                          {focusDesc}
                        </p>
                      </div>

                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => onOpenInstructionModal(slotIdx)}
                        className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0"
                        title="Modifica istruzione per questo slot"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* B) RIEPILOGO INCARICHI PARTITA (CALCI PIAZZATI & CAPITANO) */}
          <Card className="shadow-lg border-border/80 overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border/60 py-3 px-4 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-500" />
                <CardTitle className="text-sm font-bold">Incarichi & Piazzati</CardTitle>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={onEditTactics}
                className="text-xs font-semibold gap-1 h-7"
              >
                Incarichi
                <ArrowRight className="w-3 h-3" />
              </Button>
            </CardHeader>

            <CardContent className="p-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {SET_PIECES_DEFINITIONS.map((def) => {
                  const assigned = getAssignedPlayer(def.key);
                  return (
                    <div
                      key={def.key}
                      className="p-2 rounded-lg bg-muted/20 border border-border/50 flex items-center justify-between gap-2"
                    >
                      <span className="text-muted-foreground text-[11px] font-medium truncate">
                        {def.label}:
                      </span>
                      {assigned ? (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="font-bold text-foreground text-xs">
                            {assigned.Cognome}
                          </span>
                          <span className="font-mono text-[10px] text-primary font-bold">
                            ({assigned.OVR})
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic text-[10px]">
                          Non assegnato
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

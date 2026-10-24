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
    <div className="space-y-6 w-full max-w-[1480px] mx-auto">
      {/* ===================================================================== */}
      {/* 1. HEADER BANNER: TATTICHE GENERALI DI SQUADRA                        */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Modulo */}
        <Card className="border-border/70 bg-gradient-to-br from-card to-muted/20 shadow-sm p-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Modulo EA Sports FC 25
            </div>
            <div className="text-xl font-black tracking-tight text-foreground mt-0.5">
              {formation.name}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5 font-medium">
              <span className="text-emerald-500 font-bold">{assignedCount}</span>/11 titolari in campo
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={onEditFormation}
            className="text-xs font-bold gap-1.5 h-8 bg-background/80"
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
            className="text-xs font-bold gap-1.5 h-8 bg-background/80"
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
              Altezza Linea: <b className="text-foreground">{defensiveLine}/100</b>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={onEditTactics}
            className="text-xs font-bold gap-1.5 h-8 bg-background/80"
          >
            Tattiche
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Card>
      </div>

      {/* ===================================================================== */}
      {/* 2. LAYOUT PRINCIPALE: CAMPETTO AMPIO A SINISTRA + INCARICHI A DESTRA */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* COLONNA SINISTRA: IL GRANDE CAMPO DA CALCIO 2D DEI TITOLARI (AMPLIATO) */}
        <div className="lg:col-span-8 xl:col-span-8 2xl:col-span-9">
          <Card className="shadow-2xl border-border/80 overflow-hidden bg-card">
            <CardHeader className="bg-muted/30 border-b border-border/60 py-3.5 px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base sm:text-lg font-black tracking-tight">
                    Schieramento Titolari & FC IQ
                  </CardTitle>
                  <Badge
                    variant="outline"
                    className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 text-[10px] font-extrabold uppercase tracking-wider font-mono"
                  >
                    {formation.id}
                  </Badge>
                </div>
                <CardDescription className="text-xs mt-0.5">
                  11 titolari con <b>Ruolo</b> e <b>Stile Tattico</b> EA FC 25
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onEditTactics}
                  className="text-xs font-bold gap-1.5 h-8 bg-background/80"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
                  Istruzioni FC IQ
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onEditFormation}
                  className="text-xs font-bold gap-1.5 h-8 bg-background/80"
                >
                  Modifica 11
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-3 sm:p-5 flex flex-col items-center">
              {/* Contenitore Campo da Calcio a sinistra allungato per evitare qualsiasi sovrapposizione */}
              <div
                className="relative w-full max-w-[760px] mx-auto rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-900 select-none bg-gradient-to-b from-emerald-800 via-emerald-700 to-emerald-900"
                style={{ aspectRatio: "3.1 / 4.1", minHeight: "820px" }}
              >
                {/* Texture erba a strisce verticali realistiche */}
                <div
                  className="absolute inset-0 opacity-20 pointer-events-none"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(to right, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 45px, transparent 45px, transparent 90px)",
                  }}
                />

                {/* Vignettatura scura sui bordi del campo */}
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(0,0,0,0.45)_100%)]" />

                {/* Linee regolamentari del campo proporzionate */}
                <div className="pointer-events-none absolute inset-5 border-2 border-white/60 rounded-md">
                  {/* Linea di metà campo */}
                  <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-white/60" />
                  {/* Cerchio di centrocampo */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-36 border-2 border-white/60 rounded-full" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white/85 rounded-full" />

                  {/* Area di rigore superiore (Attacco) */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-32 border-2 border-white/60 border-t-0" />
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-14 border-2 border-white/60 border-t-0" />

                  {/* Area di rigore inferiore (Porta) */}
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-72 h-32 border-2 border-white/60 border-b-0" />
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-40 h-14 border-2 border-white/60 border-b-0" />
                </div>

                {/* 11 Pedine Titolari sul Campo: ICONE GRANDI + RUOLO (RIGA 1) + STILE TATTICO (RIGA 2) */}
                <div className="relative w-full h-full">
                  {formation.positions.map((pos, slotIdx) => {
                    const occupant = formationSlots[slotIdx];
                    const fit = occupant
                      ? evaluateRoleFit(occupant.Posiz, pos.label)
                      : null;

                    const ringColor =
                      fit === "natural"
                        ? "border-emerald-400 shadow-emerald-500/50 ring-2 ring-emerald-500/30"
                        : fit === "adaptable"
                        ? "border-amber-400 shadow-amber-500/50 ring-2 ring-amber-500/30"
                        : "border-rose-400 shadow-rose-500/50 ring-2 ring-rose-500/30";

                    const instr = tacticalSettings.playerInstructions[slotIdx];
                    const roleDef = FC25_ROLES_BY_POSITION[pos.label]?.find(
                      (r) => r.id === instr?.roleId
                    );
                    const roleName = roleDef?.name || "Ruolo Base";
                    const focusDef = roleDef?.focuses?.find((f) => f.id === instr?.focusId);
                    const focusName = focusDef?.name || instr?.focusId || "Equilibrato";

                    // Calibra la posizione Y del portiere su 89% per aria ideale dai difensori e dal fondo
                    const posY = pos.label === "POR" ? "89%" : pos.y;

                    return (
                      <div
                        key={slotIdx}
                        onClick={() => {
                          if (occupant) {
                            onOpenPlayerModal(occupant);
                          } else {
                            onOpenInstructionModal(slotIdx);
                          }
                        }}
                        style={{ left: pos.x, top: posY }}
                        className="absolute -translate-x-1/2 -translate-y-1/2 z-10 transition-transform duration-200 hover:scale-110 hover:z-30 cursor-pointer pointer-events-auto"
                        title={
                          occupant
                            ? `${occupant.Nome} ${occupant.Cognome} (${pos.label})\nRuolo: ${roleName}\nStile Tattico: ${focusName}`
                            : `Slot #${slotIdx + 1} (${pos.label}) Vuoto`
                        }
                      >
                        {occupant ? (
                          <div className="flex flex-col items-center group">
                            {/* Avatar Pedina: Icona Calciatore Grande (66px) */}
                            <div
                              className="relative shrink-0"
                              style={{ width: "66px", height: "66px" }}
                            >
                              <div
                                className={`w-[66px] h-[66px] rounded-full overflow-hidden bg-slate-900 border-[3px] ${ringColor} shadow-2xl shrink-0`}
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

                              {/* Pillola OVR Grande e Nitida */}
                              <span className="absolute -top-1.5 -right-2 bg-slate-950 text-white border border-white/60 text-xs font-black font-mono px-1.5 py-0.5 rounded-full shadow-lg z-10">
                                {occupant.OVR}
                              </span>

                              {/* Numero Maglia */}
                              <span className="absolute -bottom-1 -left-2 bg-emerald-600 text-white text-[10px] font-bold font-mono min-w-5 h-5 px-1 rounded-full flex items-center justify-center border border-white/70 shadow-lg z-10">
                                {occupant.NumeroMaglia ?? slotIdx + 1}
                              </span>
                            </div>

                            {/* Targhetta 1: Posizione nel Modulo + Cognome Calciatore */}
                            <div className="mt-1 px-2.5 py-0.5 rounded-md bg-slate-950/95 backdrop-blur-md border border-white/35 text-white shadow-xl flex items-center justify-center gap-1.5 max-w-[130px] z-20">
                              <span className="text-[10px] font-black text-emerald-400 font-mono shrink-0">
                                {pos.label}
                              </span>
                              <span className="text-[11px] font-bold truncate tracking-tight">
                                {occupant.Cognome}
                              </span>
                            </div>

                            {/* Targhetta 2: FC IQ - Riga 1 = Ruolo | Riga 2 = Stile Tattico (Focus) */}
                            <div
                              className="mt-0.5 px-2 py-0.5 rounded-md bg-slate-950/95 backdrop-blur-md border border-amber-500/40 text-center shadow-xl flex flex-col items-center justify-center min-w-[90px] max-w-[130px] z-20"
                              title={`Ruolo: ${roleName}\nStile Tattico: ${focusName}`}
                            >
                              {/* Riga 1: Ruolo FC IQ */}
                              <span className="text-[10px] font-black text-amber-400 tracking-tight leading-tight block w-full text-center truncate">
                                {roleName}
                              </span>
                              {/* Riga 2: Stile Tattico / Focus */}
                              <span className="text-[9px] font-bold text-slate-100 tracking-tight leading-tight mt-0.5 flex items-center justify-center gap-1 w-full text-center truncate">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                                <span className="truncate">{focusName}</span>
                              </span>
                            </div>
                          </div>
                        ) : (
                          /* Slot Vuoto sul Campo */
                          <div className="flex flex-col items-center">
                            <div className="w-[60px] h-[60px] rounded-full border-2 border-dashed border-white/75 bg-black/50 text-white/95 flex flex-col items-center justify-center shadow-xl shrink-0">
                              <span className="text-[10px] font-mono font-bold opacity-80">
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

              {/* Legenda Ruoli */}
              <div className="mt-4 w-full max-w-[760px] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground px-2">
                <span className="flex items-center gap-1.5 font-medium">
                  <Info className="w-4 h-4 text-primary shrink-0" />
                  Clicca su un calciatore per la scheda attributi.
                </span>
                <div className="flex items-center gap-3 font-semibold shrink-0">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                    Naturale
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                    Adattato
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                    Fuori Ruolo
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* COLONNA DESTRA: RIEPILOGO DEGLI INCARICHI IN SINGOLA COLONNA */}
        <div className="lg:col-span-4 xl:col-span-4 2xl:col-span-3">
          <Card className="shadow-2xl border-border/80 overflow-hidden bg-card lg:sticky lg:top-20">
            <CardHeader className="bg-muted/30 border-b border-border/60 py-3.5 px-4 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  <Crown className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold">Incarichi Partita</CardTitle>
                  <CardDescription className="text-[11px]">
                    Capitano e calci piazzati
                  </CardDescription>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={onEditTactics}
                className="text-xs font-bold gap-1 h-7 px-2 bg-background/80"
              >
                <Crown className="w-3 h-3 text-amber-500" />
                Gestisci
              </Button>
            </CardHeader>

            <CardContent className="p-3 sm:p-3.5">
              {/* Incolonnato in verticale in una sola colonna */}
              <div className="space-y-1.5 text-xs">
                {SET_PIECES_DEFINITIONS.map((def) => {
                  const assigned = getAssignedPlayer(def.key);
                  return (
                    <div
                      key={def.key}
                      className="px-2.5 py-2 rounded-xl bg-muted/20 border border-border/50 hover:bg-muted/35 hover:border-border transition-colors flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="p-1.5 rounded-lg bg-background/80 border border-border/50 shrink-0 shadow-xs">
                          {def.key === "capitano" ? (
                            <Crown className="w-3.5 h-3.5 text-amber-500" />
                          ) : def.key.includes("corner") ? (
                            <Flag className="w-3.5 h-3.5 text-sky-400" />
                          ) : def.key.includes("punizione") || def.key === "rigore" ? (
                            <Target className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider truncate">
                            {def.label}
                          </div>
                          {assigned ? (
                            <div className="text-xs font-black text-foreground truncate">
                              {assigned.Cognome}{" "}
                              <span className="text-[10px] text-muted-foreground font-semibold">
                                ({assigned.Posiz})
                              </span>
                            </div>
                          ) : (
                            <div className="text-[10.5px] italic text-muted-foreground/60 leading-tight">
                              Non assegnato
                            </div>
                          )}
                        </div>
                      </div>

                      {assigned ? (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <img
                            src={getPlayerImage(Number(assigned.ID))}
                            alt={assigned.Cognome}
                            className="w-6 h-6 rounded-full object-cover object-top border border-border shrink-0 shadow-xs"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "/images/players/MConti.png";
                            }}
                          />
                          <span className="font-mono text-xs text-primary font-black">
                            {assigned.OVR}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground/40 font-mono text-xs shrink-0">—</span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 pt-2.5 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1 text-[10.5px]">
                  <Info className="w-3 h-3 text-primary shrink-0" />
                  Admin riproduce in FC 25
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onEditTactics}
                  className="h-6 text-[11px] font-bold gap-1 text-primary hover:text-primary px-1.5"
                >
                  Modifica
                  <ArrowRight className="w-2.5 h-2.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

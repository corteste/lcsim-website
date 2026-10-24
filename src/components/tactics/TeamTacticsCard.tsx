import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  BUILD_UP_STYLES,
  DEFENSIVE_APPROACHES,
  TacticalSettings,
} from "@/types/tactics";
import {
  SlidersHorizontal,
  Shield,
  Zap,
  ChevronDown,
  ChevronUp,
  Info,
  Layers,
  Sparkles,
} from "lucide-react";

interface TeamTacticsCardProps {
  tacticalSettings: TacticalSettings;
  onChange: (updated: TacticalSettings) => void;
  disabled?: boolean;
}

export const TeamTacticsCard: React.FC<TeamTacticsCardProps> = ({
  tacticalSettings,
  onChange,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(true);

  const { buildUpStyle, defensiveApproach, defensiveLine } =
    tacticalSettings.teamTactics;

  const currentBuildUp =
    BUILD_UP_STYLES.find((b) => b.id === buildUpStyle) || BUILD_UP_STYLES[1];
  const currentDef =
    DEFENSIVE_APPROACHES.find((d) => d.id === defensiveApproach) ||
    DEFENSIVE_APPROACHES[1];

  const handleBuildUpChange = (id: "short_passing" | "balanced" | "counter") => {
    if (disabled) return;
    onChange({
      ...tacticalSettings,
      teamTactics: {
        ...tacticalSettings.teamTactics,
        buildUpStyle: id,
      },
    });
  };

  const handleDefensiveApproachChange = (id: "deep" | "balanced" | "high") => {
    if (disabled) return;
    onChange({
      ...tacticalSettings,
      teamTactics: {
        ...tacticalSettings.teamTactics,
        defensiveApproach: id,
      },
    });
  };

  const handleDefensiveLineChange = (val: number[]) => {
    if (disabled) return;
    onChange({
      ...tacticalSettings,
      teamTactics: {
        ...tacticalSettings.teamTactics,
        defensiveLine: val[0] ?? 50,
      },
    });
  };

  const getDefensiveLineLabel = (val: number) => {
    if (val < 35) return "Bassa / Prudente";
    if (val <= 65) return "Media / Bilanciata";
    return "Alta / Fuorigioco";
  };

  return (
    <Card className="border-border/80 bg-gradient-to-br from-card via-card/95 to-muted/20 shadow-sm overflow-hidden">
      <CardHeader
        className="p-4 cursor-pointer select-none border-b border-border/50 hover:bg-muted/10 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base sm:text-lg font-black tracking-tight">
                  Tattiche di Squadra FC IQ
                </CardTitle>
                <Badge
                  variant="outline"
                  className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 text-[10px] font-black uppercase tracking-wider"
                >
                  EA FC 25
                </Badge>
              </div>
              <CardDescription className="text-xs">
                Imposta lo stile di costruzione e l'approccio difensivo globale della squadra
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {/* Riepilogo compatto quando chiuso */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge variant="secondary" className="text-[11px] font-bold px-2 py-0.5">
                <Zap className="w-3 h-3 mr-1 text-amber-500" />
                {currentBuildUp.name}
              </Badge>
              <Badge variant="secondary" className="text-[11px] font-bold px-2 py-0.5">
                <Shield className="w-3 h-3 mr-1 text-sky-500" />
                {currentDef.name}
              </Badge>
              <Badge variant="secondary" className="text-[11px] font-mono font-bold px-2 py-0.5">
                Linea: {defensiveLine}
              </Badge>
            </div>

            <button
              type="button"
              className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors ml-1"
              aria-label="Espandi/Riduci tattiche di squadra"
            >
              {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </CardHeader>

      {isOpen && (
        <CardContent className="p-4 space-y-6 animate-in fade-in-50 duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* SEZIONE 1: STILE DI COSTRUZIONE */}
            <div className="space-y-3 bg-muted/20 p-3.5 rounded-xl border border-border/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-black uppercase tracking-wider text-foreground">
                    Stile di Costruzione
                  </span>
                </div>
                <Badge variant="outline" className="text-[10px] font-bold">
                  Fase Offensiva
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {BUILD_UP_STYLES.map((style) => {
                  const isSelected = buildUpStyle === style.id;
                  return (
                    <button
                      key={style.id}
                      type="button"
                      disabled={disabled}
                      onClick={() => handleBuildUpChange(style.id)}
                      className={`relative flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
                        isSelected
                          ? "bg-amber-500/10 border-amber-500/80 text-foreground ring-2 ring-amber-500/20 shadow-sm"
                          : "bg-card/70 border-border/70 text-muted-foreground hover:border-amber-500/40 hover:bg-card"
                      } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      <span className="text-xs font-black tracking-tight mb-1">
                        {style.name}
                      </span>
                      <span className="text-[10px] leading-tight text-muted-foreground line-clamp-2">
                        {style.shortDesc}
                      </span>
                      {isSelected && (
                        <div className="absolute top-1 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-500" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="text-[11px] text-muted-foreground bg-background/50 p-2 rounded-lg border border-border/40 flex items-start gap-1.5">
                <Info className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                <span>{currentBuildUp.description}</span>
              </div>
            </div>

            {/* SEZIONE 2: APPROCCIO DIFENSIVO */}
            <div className="space-y-3 bg-muted/20 p-3.5 rounded-xl border border-border/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-sky-500" />
                  <span className="text-xs font-black uppercase tracking-wider text-foreground">
                    Approccio Difensivo
                  </span>
                </div>
                <Badge variant="outline" className="text-[10px] font-bold">
                  Fase Non Possesso
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {DEFENSIVE_APPROACHES.map((approach) => {
                  const isSelected = defensiveApproach === approach.id;
                  return (
                    <button
                      key={approach.id}
                      type="button"
                      disabled={disabled}
                      onClick={() => handleDefensiveApproachChange(approach.id)}
                      className={`relative flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
                        isSelected
                          ? "bg-sky-500/10 border-sky-500/80 text-foreground ring-2 ring-sky-500/20 shadow-sm"
                          : "bg-card/70 border-border/70 text-muted-foreground hover:border-sky-500/40 hover:bg-card"
                      } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      <span className="text-xs font-black tracking-tight mb-1">
                        {approach.name.split("/")[0].trim()}
                      </span>
                      <span className="text-[10px] leading-tight text-muted-foreground line-clamp-2">
                        {approach.shortDesc}
                      </span>
                      {isSelected && (
                        <div className="absolute top-1 right-1.5 w-1.5 h-1.5 rounded-full bg-sky-500" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="text-[11px] text-muted-foreground bg-background/50 p-2 rounded-lg border border-border/40 flex items-start gap-1.5">
                <Info className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                <span>{currentDef.description}</span>
              </div>
            </div>
          </div>

          {/* SLIDER ALTEZZA LINEA DIFENSIVA */}
          <div className="p-3.5 rounded-xl bg-muted/15 border border-border/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-black uppercase tracking-wider text-foreground">
                  Altezza Linea Difensiva
                </span>
                <Badge variant="secondary" className="font-mono text-xs px-2 py-0">
                  {defensiveLine}/100
                </Badge>
              </div>
              <span className="text-xs font-bold text-muted-foreground">
                {getDefensiveLineLabel(defensiveLine)}
              </span>
            </div>

            <div className="pt-2 pb-1 px-1">
              <Slider
                value={[defensiveLine]}
                min={1}
                max={100}
                step={1}
                disabled={disabled}
                onValueChange={handleDefensiveLineChange}
                className="w-full"
              />
            </div>

            <div className="flex justify-between text-[10px] font-mono text-muted-foreground px-1">
              <span>1 (Molto Bassa)</span>
              <span>50 (Media)</span>
              <span>100 (Altissima)</span>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

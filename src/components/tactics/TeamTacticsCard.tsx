import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BUILD_UP_STYLES,
  DEFENSIVE_LINE_OPTIONS,
  getDefensiveLineOption,
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

  const { buildUpStyle, defensiveLine } =
    tacticalSettings.teamTactics;

  const currentBuildUp =
    BUILD_UP_STYLES.find((b) => b.id === buildUpStyle) || BUILD_UP_STYLES[1];
  const currentLineOption = getDefensiveLineOption(defensiveLine);

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

  const handleDefensiveLineSelect = (optionValue: number) => {
    if (disabled) return;
    onChange({
      ...tacticalSettings,
      teamTactics: {
        ...tacticalSettings.teamTactics,
        defensiveLine: optionValue,
      },
    });
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
                Imposta lo stile di costruzione e l'altezza della linea difensiva della squadra
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
                <Shield className="w-3 h-3 mr-1 text-emerald-500" />
                Linea: {currentLineOption.name}
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

            {/* SEZIONE 2: ALTEZZA LINEA DIFENSIVA (4 OPZIONI FISSE) */}
            <div className="space-y-3 bg-muted/20 p-3.5 rounded-xl border border-border/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-black uppercase tracking-wider text-foreground">
                    Altezza Linea Difensiva
                  </span>
                </div>
                <Badge variant="outline" className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                  {currentLineOption.name} ({currentLineOption.value})
                </Badge>
              </div>

              {/* 4 Opzioni Fisse Selezionabili */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {DEFENSIVE_LINE_OPTIONS.map((opt) => {
                  const isSelected = currentLineOption.id === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={disabled}
                      onClick={() => handleDefensiveLineSelect(opt.value)}
                      className={`flex flex-col text-left p-2.5 rounded-xl border transition-all text-xs relative ${
                        isSelected
                          ? "bg-emerald-500/15 border-emerald-500/80 ring-2 ring-emerald-500/20 text-foreground shadow-xs"
                          : "bg-card/70 border-border/70 text-muted-foreground hover:border-emerald-500/40 hover:bg-card"
                      } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-extrabold text-foreground text-xs">
                          {opt.name}
                        </span>
                        <span className="font-mono text-[10px] text-muted-foreground font-semibold">
                          {opt.value}
                        </span>
                      </div>
                      <span className="text-[10px] leading-tight text-muted-foreground line-clamp-2">
                        {opt.shortDesc}
                      </span>
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="text-[11px] text-muted-foreground bg-background/50 p-2 rounded-lg border border-border/40 flex items-start gap-1.5">
                <Info className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                <span>{currentLineOption.description}</span>
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

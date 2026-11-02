import React, { useEffect, useState, useMemo } from "react";
import {
  X,
  Sparkles,
  Ruler,
  Weight,
  Footprints,
  Star,
  Calendar,
  Activity,
  Award,
  Shield,
  Zap,
  PauseCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPlayerImage, getRoleColor, getValueColor } from "@/utils/functions";
import { SUPABASE_STORAGE_URL } from "@/constants/App";
import { Player } from "@/types/player";

export interface CombineMetric {
  id: string;
  label: string;
  value: string | number;
  unit?: string;
  grade?: string;
  score?: number; // 0-100 per barra visiva
}

export interface DraftPickAnnouncementData {
  pickOverall: number;
  round: number;
  teamId: string;
  teamAbbr?: string;
  teamName?: string;
  rookie: Partial<Player> & {
    ID: number;
    Nome: string;
    Cognome: string;
    Posiz: string;
    OVR: number;
  };
  combineMetrics?: CombineMetric[];
}

interface DraftPickAnnouncementModalProps {
  pickData: DraftPickAnnouncementData | null;
  onClose: () => void;
  autoCloseDuration?: number; // ms, default 12000
}

const calcPillarAvg = (vals: (number | null | undefined)[]): number | null => {
  const valid = vals.filter(
    (v): v is number => v !== null && v !== undefined && !isNaN(Number(v)) && Number(v) > 0
  );
  if (!valid.length) return null;
  return Math.round(valid.reduce((a, b) => a + Number(b), 0) / valid.length);
};

/**
 * Predisposizione per i 5 valori della Draft Combine che verranno passati/configurati.
 * Accetta eventuale override da `pickData.combineMetrics` oppure calcola/mostra i 5 slot predisposti.
 */
export const buildCombineMetrics = (
  rookie: DraftPickAnnouncementData["rookie"],
  customMetrics?: CombineMetric[]
): CombineMetric[] => {
  if (customMetrics && customMetrics.length === 5) {
    return customMetrics;
  }

  // 5 slot predisposti per i valori della Combine (pronti per essere popolati con le metriche specifiche)
  const defaultSlots: CombineMetric[] = [
    {
      id: "combine_1",
      label: "Test Combine 1",
      value: customMetrics?.[0]?.value ?? "—",
      unit: customMetrics?.[0]?.unit ?? "",
      grade: customMetrics?.[0]?.grade ?? "N/D",
      score: customMetrics?.[0]?.score ?? 0,
    },
    {
      id: "combine_2",
      label: "Test Combine 2",
      value: customMetrics?.[1]?.value ?? "—",
      unit: customMetrics?.[1]?.unit ?? "",
      grade: customMetrics?.[1]?.grade ?? "N/D",
      score: customMetrics?.[1]?.score ?? 0,
    },
    {
      id: "combine_3",
      label: "Test Combine 3",
      value: customMetrics?.[2]?.value ?? "—",
      unit: customMetrics?.[2]?.unit ?? "",
      grade: customMetrics?.[2]?.grade ?? "N/D",
      score: customMetrics?.[2]?.score ?? 0,
    },
    {
      id: "combine_4",
      label: "Test Combine 4",
      value: customMetrics?.[3]?.value ?? "—",
      unit: customMetrics?.[3]?.unit ?? "",
      grade: customMetrics?.[3]?.grade ?? "N/D",
      score: customMetrics?.[3]?.score ?? 0,
    },
    {
      id: "combine_5",
      label: "Test Combine 5",
      value: customMetrics?.[4]?.value ?? "—",
      unit: customMetrics?.[4]?.unit ?? "",
      grade: customMetrics?.[4]?.grade ?? "N/D",
      score: customMetrics?.[4]?.score ?? 0,
    },
  ];

  return defaultSlots;
};

export const DraftPickAnnouncementModal: React.FC<DraftPickAnnouncementModalProps> = ({
  pickData,
  onClose,
  autoCloseDuration = 12000,
}) => {
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!pickData) {
      setProgress(100);
      setIsPaused(false);
      return;
    }
    setProgress(100);
  }, [pickData]);

  useEffect(() => {
    if (!pickData || isPaused) return;

    const intervalTime = 50;
    const step = (intervalTime / autoCloseDuration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= step) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return prev - step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [pickData, autoCloseDuration, onClose, isPaused]);

  const macroStats = useMemo(() => {
    if (!pickData) return [];
    const r = pickData.rookie;
    const isGK = r.Posiz === "POR";

    if (isGK) {
      const gkFis =
        r.FIS ?? calcPillarAvg([r.FRZA, r.RESI, r.ELEV]) ?? r.FRZA ?? null;
      return [
        { code: "TUF", label: "Tuffo", value: r.TUFP ?? null },
        { code: "PRE", label: "Presa", value: r.PREP ?? null },
        { code: "RIN", label: "Rinvio", value: r.RINP ?? null },
        { code: "RIF", label: "Riflessi", value: r.RIFP ?? null },
        { code: "POS", label: "Piazzam.", value: r.POSP ?? null },
        { code: "FIS", label: "Fisico", value: gkFis },
      ];
    }

    const vel =
      r.VELO && r.ACCL ? calcPillarAvg([r.VELO, r.ACCL]) : r.VELO ?? null;
    const tir =
      r.ATT ?? calcPillarAvg([r.FINA, r.PTIR, r.TIRD, r.PIAZ]);
    const pas =
      r.CEN ?? calcPillarAvg([r.PASC, r.PASL, r.CTRP, r.VISI]);
    const drb =
      r.DRBL && (r.CTRP || r.AGIL)
        ? calcPillarAvg([r.DRBL, r.CTRP, r.AGIL])
        : r.DRBL ?? null;
    const dif =
      r.DIF ?? calcPillarAvg([r.CONT, r.MARC, r.INTR, r.SCIV]);
    const fis =
      r.FIS ?? calcPillarAvg([r.FRZA, r.RESI, r.ELEV]);

    return [
      { code: "VEL", label: "Velocità", value: vel },
      { code: "TIR", label: "Tiro", value: tir },
      { code: "PAS", label: "Passaggio", value: pas },
      { code: "DRI", label: "Dribbling", value: drb },
      { code: "DIF", label: "Difesa", value: dif },
      { code: "FIS", label: "Fisico", value: fis },
    ];
  }, [pickData]);

  if (!pickData) return null;

  const { rookie, teamId, teamAbbr, teamName, pickOverall, round } = pickData;
  const displayAbbr = teamAbbr || teamId;
  const displayTeamName = teamName || displayAbbr;

  const secondaryPositions = [
    rookie.PreferredPosition2,
    rookie.PreferredPosition3,
    rookie.PreferredPosition4,
  ].filter((p): p is string => Boolean(p && p.trim() && p !== "-" && p !== "NONE"));

  const rolesPlus = [rookie.Role1, rookie.Role2, rookie.Role3].filter(
    (rl): rl is string => Boolean(rl && rl.trim() && rl !== "-" && rl !== "Nessuno")
  );

  const goldTraits = [rookie.IconTrait1, rookie.IconTrait2]
    .filter((t): t is string => Boolean(t && t.trim() && t !== "-" && t !== "Nessuno"))
    .flatMap((t) => t.split(",").map((s) => s.trim()))
    .filter(Boolean);

  const silverTraits = [rookie.Trait1, rookie.Trait2]
    .filter((t): t is string => Boolean(t && t.trim() && t !== "-" && t !== "Nessuno"))
    .flatMap((t) => t.split(",").map((s) => s.trim()))
    .filter(Boolean);

  const combineList = buildCombineMetrics(rookie, pickData.combineMetrics);

  const getStatBarColor = (val: number | null) => {
    if (!val) return "bg-muted-foreground/30";
    if (val >= 85) return "bg-emerald-500";
    if (val >= 78) return "bg-green-500";
    if (val >= 70) return "bg-amber-500";
    return "bg-orange-500";
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl bg-card border border-primary/30 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col my-auto"
        onClick={(e) => e.stopPropagation()}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Intestazione Scelta */}
        <div className="relative px-4 sm:px-5 py-3 bg-gradient-to-r from-primary/15 via-muted/50 to-primary/15 border-b border-border flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500 animate-pulse shrink-0" />
            <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-foreground">
              Scelta Ufficiale al Draft!
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[11px] font-bold bg-background/80">
              Pick #{pickOverall} • Round {round}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground -mr-1"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Banner Squadra Selezionatrice */}
        <div className="px-5 py-2.5 bg-muted/30 border-b border-border/60 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <img
              src={`${SUPABASE_STORAGE_URL}/images/teams/${teamId}_Logo.png`}
              alt={displayAbbr}
              className="h-7 w-7 object-contain drop-shadow"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-muted-foreground font-medium">Selezionato da:</span>
              <span className="font-black text-foreground text-sm">{displayTeamName}</span>
              <Badge variant="secondary" className="text-[10px] font-mono px-1.5 py-0">
                {displayAbbr}
              </Badge>
            </div>
          </div>

          {rookie.POTN && rookie.POTN > rookie.OVR ? (
            <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[10px] font-bold">
              Potenziale: {rookie.POTN}
            </Badge>
          ) : null}
        </div>

        {/* Corpo Principale: 2 Colonne su Desktop */}
        <div className="p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
            {/* COLONNA SINISTRA: Identità, Fisico, Piede, Stelle, Ruoli+ e Tratti (5 col) */}
            <div className="md:col-span-5 flex flex-col items-center text-center p-3.5 rounded-xl bg-muted/20 border border-border/60 justify-between">
              <div className="w-full flex flex-col items-center">
                {/* Avatar con badge posizione e OVR */}
                <div className="relative mb-2.5">
                  <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl overflow-hidden bg-gradient-to-b from-muted/50 to-muted border-2 border-border/80 shadow-md flex items-center justify-center">
                    <img
                      src={getPlayerImage(rookie.ID)}
                      alt={`${rookie.Nome} ${rookie.Cognome}`}
                      onError={(e) => {
                        e.currentTarget.src = `${SUPABASE_STORAGE_URL}/images/players/MConti.png`;
                      }}
                      className="h-full w-full object-cover object-top"
                    />
                  </div>

                  {/* Posizione Primaria */}
                  <Badge
                    variant="outline"
                    className={`absolute -bottom-2 -left-2 text-xs font-black px-2.5 py-0.5 shadow-md border ${getRoleColor(
                      rookie.Posiz
                    )}`}
                  >
                    {rookie.Posiz}
                  </Badge>

                  {/* Overall (OVR) */}
                  <div
                    className={`absolute -top-2 -right-2 text-sm font-black font-mono px-2.5 py-0.5 rounded-full shadow-md border border-border/60 ${getValueColor(
                      rookie.OVR
                    )}`}
                  >
                    {rookie.OVR}
                  </div>
                </div>

                {/* Nome e Cognome */}
                <h3 className="text-lg sm:text-xl font-black text-foreground tracking-tight leading-tight mt-1">
                  {rookie.Nome} {rookie.Cognome}
                </h3>

                {/* Posizioni Secondarie */}
                {secondaryPositions.length > 0 && (
                  <div className="flex items-center justify-center gap-1 mt-1 flex-wrap">
                    <span className="text-[10px] text-muted-foreground">Altri ruoli:</span>
                    {secondaryPositions.map((pos) => (
                      <Badge
                        key={pos}
                        variant="outline"
                        className="text-[10px] font-bold px-1.5 py-0 h-4"
                      >
                        {pos}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Griglia Info Tecnico-Fisiche */}
                <div className="w-full grid grid-cols-2 gap-1.5 mt-3 text-[11px] font-mono">
                  <div className="flex items-center justify-center gap-1.5 bg-background/70 px-2 py-1.5 rounded-lg border border-border/50">
                    <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="truncate">
                      {rookie.Età ? `${rookie.Età} anni` : "Età N/D"}
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-1.5 bg-background/70 px-2 py-1.5 rounded-lg border border-border/50">
                    <Footprints className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="truncate font-sans font-semibold">
                      {rookie.Piede || "N/D"}
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-1.5 bg-background/70 px-2 py-1.5 rounded-lg border border-border/50">
                    <Ruler className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>{rookie.Altezza ? `${rookie.Altezza} cm` : "N/D"}</span>
                  </div>
                  <div className="flex items-center justify-center gap-1.5 bg-background/70 px-2 py-1.5 rounded-lg border border-border/50">
                    <Weight className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>{rookie.Peso ? `${rookie.Peso} kg` : "N/D"}</span>
                  </div>
                </div>

                {/* Skill Moves & Piede Debole */}
                <div className="w-full grid grid-cols-2 gap-1.5 mt-1.5 text-[11px]">
                  <div className="flex items-center justify-between bg-background/70 px-2.5 py-1 rounded-lg border border-border/50">
                    <span className="text-muted-foreground text-[10px]">Skill</span>
                    <span className="font-mono font-bold text-amber-500 flex items-center gap-0.5">
                      {rookie.MABI ?? "—"}
                      <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-background/70 px-2.5 py-1 rounded-lg border border-border/50">
                    <span className="text-muted-foreground text-[10px]">P. Deb.</span>
                    <span className="font-mono font-bold text-amber-500 flex items-center gap-0.5">
                      {rookie.PiedeDebole ?? "—"}
                      <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                    </span>
                  </div>
                </div>
              </div>

              {/* Ruoli+ e Tratti */}
              {(rolesPlus.length > 0 || goldTraits.length > 0 || silverTraits.length > 0) && (
                <div className="w-full mt-3 pt-2.5 border-t border-border/50 space-y-1.5 text-left">
                  {rolesPlus.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap">
                      <Shield className="h-3 w-3 text-emerald-500 shrink-0" />
                      {rolesPlus.map((r, i) => (
                        <Badge
                          key={i}
                          variant="outline"
                          className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 px-1.5 py-0"
                        >
                          {r}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {(goldTraits.length > 0 || silverTraits.length > 0) && (
                    <div className="flex items-center gap-1 flex-wrap">
                      <Award className="h-3 w-3 text-amber-500 shrink-0" />
                      {goldTraits.map((gt, i) => (
                        <Badge
                          key={`g-${i}`}
                          variant="outline"
                          className="text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40 px-1.5 py-0"
                        >
                          ★ {gt}
                        </Badge>
                      ))}
                      {silverTraits.map((st, i) => (
                        <Badge
                          key={`s-${i}`}
                          variant="outline"
                          className="text-[10px] font-medium bg-slate-500/10 text-foreground/80 border-border px-1.5 py-0"
                        >
                          {st}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* COLONNA DESTRA: 6 Macro-Statistiche (7 col) */}
            <div className="md:col-span-7 flex flex-col justify-between p-3.5 rounded-xl bg-muted/20 border border-border/60">
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-1.5">
                    <Activity className="h-4 w-4 text-primary" />
                    <span className="text-xs font-black uppercase tracking-wider text-foreground">
                      Valori Macro-Reparto
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {rookie.Posiz === "POR" ? "Profilo Portiere" : "Profilo Movimento"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {macroStats.map((st) => {
                    const num = st.value !== null && st.value !== undefined ? Number(st.value) : null;
                    const pct = num ? Math.min(Math.max(num, 0), 99) : 0;
                    return (
                      <div
                        key={st.code}
                        className="p-2.5 rounded-xl bg-background/80 border border-border/60 flex flex-col gap-1.5 shadow-2xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono font-black px-1.5 py-0.5 rounded bg-muted text-foreground">
                              {st.code}
                            </span>
                            <span className="text-xs font-semibold text-muted-foreground">
                              {st.label}
                            </span>
                          </div>
                          <span
                            className={`font-mono font-black text-sm ${
                              num !== null ? getValueColor(num) : "text-muted-foreground"
                            }`}
                          >
                            {num !== null ? num : "—"}
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${getStatBarColor(
                              num
                            )}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Riepilogo sintetico pilastri */}
              <div className="mt-3 pt-2.5 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Stato Contratto: <strong className="text-foreground">Rookie / Tesserato</strong></span>
                <span className="font-mono">ID #{rookie.ID}</span>
              </div>
            </div>
          </div>

          {/* SEZIONE DEDICATA: 5 VALORI DRAFT COMBINE */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-primary/5 via-muted/30 to-primary/5 border border-primary/20">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-amber-500" />
                <span className="text-xs font-black uppercase tracking-wider text-foreground">
                  Risultati Draft Combine
                </span>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono bg-background/70">
                5 Misurazioni Ufficiali
              </Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {combineList.map((item) => {
                const barWidth =
                  item.score !== undefined && item.score !== null
                    ? Math.min(Math.max(Number(item.score), 0), 100)
                    : 0;
                return (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-lg bg-background/85 border border-border/70 flex flex-col justify-between gap-1.5 text-center shadow-2xs"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight truncate">
                        {item.label}
                      </span>
                      {item.grade && (
                        <span className="text-[9px] font-mono font-black px-1 py-0 rounded bg-primary/10 text-primary shrink-0">
                          {item.grade}
                        </span>
                      )}
                    </div>

                    <div className="font-mono font-black text-sm sm:text-base text-foreground my-0.5">
                      {item.value}
                      {item.unit ? (
                        <span className="text-[10px] font-normal text-muted-foreground ml-0.5">
                          {item.unit}
                        </span>
                      ) : null}
                    </div>

                    <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all duration-500"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer con Barra di Auto-chiusura, indicatore Pausa e pulsante Chiudi */}
        <div className="px-4 py-2.5 bg-muted/20 border-t border-border flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
            {isPaused ? (
              <span className="flex items-center gap-1 text-amber-500 font-semibold">
                <PauseCircle className="h-3.5 w-3.5" />
                Timer in pausa (passaggio mouse)
              </span>
            ) : (
              <span>
                Chiusura automatica in{" "}
                {Math.ceil((progress / 100) * (autoCloseDuration / 1000))}s
              </span>
            )}
          </div>
          <Button size="sm" variant="outline" className="h-7 text-xs px-3" onClick={onClose}>
            Chiudi
          </Button>
        </div>

        {/* Barra di Progresso Temporizzata */}
        <div className="h-1 w-full bg-muted overflow-hidden">
          <div
            className={`h-full transition-all ease-linear ${
              isPaused ? "bg-amber-500" : "bg-primary"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};

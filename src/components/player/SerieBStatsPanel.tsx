import React, { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Activity,
  Award,
  BarChart3,
  Clock,
  Shield,
  Target,
} from "lucide-react";
import {
  aggregateSerieBStats,
  SerieBMatchStat,
} from "@/services/serieBStatsService";

interface SerieBStatsPanelProps {
  matches: SerieBMatchStat[];
  loading?: boolean;
  isGoalkeeper?: boolean;
  compact?: boolean;
}

/**
 * Pannello riutilizzabile per visualizzare le statistiche Serie B (LCSIM 2)
 * sia nel tab dedicato di PlayerDetails sia nel popup Scouting/Draft Rookie.
 */
export const SerieBStatsPanel: React.FC<SerieBStatsPanelProps> = ({
  matches,
  loading = false,
  isGoalkeeper = false,
  compact = false,
}) => {
  const seasons = useMemo(
    () => Array.from(new Set(matches.map((m) => m.STAG))),
    [matches]
  );
  const [selectedSeason, setSelectedSeason] = useState<string>("all");

  const effectiveSeason =
    selectedSeason === "all" || !seasons.includes(selectedSeason)
      ? undefined
      : selectedSeason;

  const stats = useMemo(
    () => aggregateSerieBStats(matches, effectiveSeason),
    [matches, effectiveSeason]
  );

  const visibleMatches = useMemo(
    () =>
      effectiveSeason
        ? matches.filter((m) => m.STAG === effectiveSeason)
        : matches,
    [matches, effectiveSeason]
  );

  if (loading) {
    return (
      <div className="p-6 text-center text-xs text-muted-foreground font-mono space-y-2">
        <Clock className="h-5 w-5 animate-spin mx-auto text-amber-500" />
        <p>Caricamento statistiche LCSIM 2 (Serie B)...</p>
      </div>
    );
  }

  if (!stats || stats.matches === 0) {
    if (compact) return null;
    return (
      <Card className="p-8 text-center border border-border/70 bg-card/60 rounded-2xl space-y-2">
        <BarChart3 className="h-6 w-6 text-muted-foreground mx-auto" />
        <h4 className="text-sm font-bold text-foreground">
          Nessuna statistica LCSIM 2 (Serie B) registrata
        </h4>
        <p className="text-xs text-muted-foreground max-w-md mx-auto">
          Non risultano presenze ufficiali nei tabellini della Serie B per questo giocatore.
        </p>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/25 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-amber-500" />
            <span className="text-xs font-extrabold uppercase tracking-wider text-foreground">
              Statistiche LCSIM 2 (Serie B)
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {stats.seasons.map((s) => (
              <Badge
                key={s}
                variant="outline"
                className="font-mono text-[10px] border-amber-500/40 text-amber-600 dark:text-amber-400"
              >
                {s}
              </Badge>
            ))}
            <Badge variant="secondary" className="font-mono text-[10px]">
              {stats.matches} PG • {stats.minuti}&apos;
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
          <div className="p-2 rounded-lg bg-background/70 border border-border/60">
            <div className="text-[10px] uppercase text-muted-foreground">Media Voto</div>
            <div className="text-sm font-black font-mono text-amber-600 dark:text-amber-400">
              {stats.avgVoto !== null ? stats.avgVoto.toFixed(2) : "-"}
            </div>
          </div>
          <div className="p-2 rounded-lg bg-background/70 border border-border/60">
            <div className="text-[10px] uppercase text-muted-foreground">
              {isGoalkeeper ? "Parate" : "Gol"}
            </div>
            <div className="text-sm font-black font-mono text-foreground">
              {isGoalkeeper ? stats.para : stats.gol}
            </div>
          </div>
          <div className="p-2 rounded-lg bg-background/70 border border-border/60">
            <div className="text-[10px] uppercase text-muted-foreground">
              {isGoalkeeper ? "Gol Sub." : "Assist"}
            </div>
            <div className="text-sm font-black font-mono text-foreground">
              {isGoalkeeper ? stats.gsub : stats.asst}
            </div>
          </div>
          <div className="p-2 rounded-lg bg-background/70 border border-border/60">
            <div className="text-[10px] uppercase text-muted-foreground">Passaggi</div>
            <div className="text-sm font-black font-mono text-foreground">
              {stats.passPct !== null ? `${stats.passPct}%` : "-"}
            </div>
          </div>
          <div className="p-2 rounded-lg bg-background/70 border border-border/60">
            <div className="text-[10px] uppercase text-muted-foreground">Dribbling</div>
            <div className="text-sm font-black font-mono text-foreground">
              {stats.dribPct !== null ? `${stats.dribPct}%` : "-"}
            </div>
          </div>
          <div className="p-2 rounded-lg bg-background/70 border border-border/60">
            <div className="text-[10px] uppercase text-muted-foreground">Contrasti</div>
            <div className="text-sm font-black font-mono text-foreground">
              {stats.ctrsPct !== null ? `${stats.ctrsPct}%` : "-"}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground font-mono pt-0.5">
          <span>
            Tiri: <strong className="text-foreground">{stats.tiriIn}/{stats.tiriTot}</strong>
          </span>
          <span>
            Palle Vinte/Perse:{" "}
            <strong className="text-foreground">
              {stats.possVinti}/{stats.pallePerse}
            </strong>
          </span>
          <span>
            Distanza:{" "}
            <strong className="text-foreground">{stats.distTot} km</strong>
          </span>
          <span>
            Cartellini:{" "}
            <strong className="text-amber-500">{stats.gialli}G</strong> /{" "}
            <strong className="text-rose-500">{stats.rossi}R</strong>
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Serie B */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-foreground">
                Statistiche Serie B — LCSIM 2
              </h3>
              {stats.seasons.map((s) => (
                <Badge
                  key={s}
                  variant="outline"
                  className="font-mono text-[10px] font-bold border-amber-500/40 text-amber-600 dark:text-amber-400"
                >
                  {s}
                </Badge>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
              {stats.matches} presenze a referto • {stats.minuti}&apos; minuti giocati
            </p>
          </div>
        </div>

        {seasons.length > 1 && (
          <div className="flex items-center gap-1 p-1 bg-background/80 rounded-xl border border-border/70 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setSelectedSeason("all")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                selectedSeason === "all"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Tutte
            </button>
            {seasons.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSelectedSeason(s)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  selectedSeason === s
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* KPI Principali */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="p-3.5 text-center border-border/70 bg-card/70">
          <div className="text-[10px] uppercase font-bold text-muted-foreground">Presenze</div>
          <div className="text-2xl font-black font-mono mt-1">{stats.matches}</div>
          <div className="text-[10px] text-muted-foreground font-mono">{stats.minuti}&apos;</div>
        </Card>
        <Card className="p-3.5 text-center border-amber-500/30 bg-amber-500/5">
          <div className="text-[10px] uppercase font-bold text-muted-foreground flex items-center justify-center gap-1">
            <Award className="h-3 w-3 text-amber-500" /> Media Voto
          </div>
          <div className="text-2xl font-black font-mono mt-1 text-amber-600 dark:text-amber-400">
            {stats.avgVoto !== null ? stats.avgVoto.toFixed(2) : "-"}
          </div>
        </Card>
        <Card className="p-3.5 text-center border-border/70 bg-card/70">
          <div className="text-[10px] uppercase font-bold text-muted-foreground">
            {isGoalkeeper ? "Parate" : "Gol"}
          </div>
          <div className="text-2xl font-black font-mono mt-1 text-emerald-600 dark:text-emerald-400">
            {isGoalkeeper ? stats.para : stats.gol}
          </div>
          {!isGoalkeeper && stats.agol > 0 && (
            <div className="text-[10px] text-rose-500 font-mono">{stats.agol} autogol</div>
          )}
        </Card>
        <Card className="p-3.5 text-center border-border/70 bg-card/70">
          <div className="text-[10px] uppercase font-bold text-muted-foreground">
            {isGoalkeeper ? "Gol Subiti" : "Assist"}
          </div>
          <div className="text-2xl font-black font-mono mt-1 text-sky-600 dark:text-sky-400">
            {isGoalkeeper ? stats.gsub : stats.asst}
          </div>
        </Card>
        <Card className="p-3.5 text-center border-border/70 bg-card/70">
          <div className="text-[10px] uppercase font-bold text-muted-foreground">Passaggi</div>
          <div className="text-2xl font-black font-mono mt-1">
            {stats.passPct !== null ? `${stats.passPct}%` : "-"}
          </div>
          <div className="text-[10px] text-muted-foreground font-mono">
            {stats.passSi}/{stats.passTot}
          </div>
        </Card>
        <Card className="p-3.5 text-center border-border/70 bg-card/70">
          <div className="text-[10px] uppercase font-bold text-muted-foreground">Dribbling</div>
          <div className="text-2xl font-black font-mono mt-1">
            {stats.dribPct !== null ? `${stats.dribPct}%` : "-"}
          </div>
          <div className="text-[10px] text-muted-foreground font-mono">
            {stats.dribSi}/{stats.dribTot}
          </div>
        </Card>
      </div>

      {/* Dettagli Tecnici & Fisici */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border-border/70 bg-card/60 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-500">
            <Target className="h-4 w-4" /> Fase Offensiva
          </div>
          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tiri in porta / Totali</span>
              <span className="font-bold">
                {stats.tiriIn} / {stats.tiriTot}
                {stats.shotAccuracyPct !== null ? ` (${stats.shotAccuracyPct}%)` : ""}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cross riusciti / Totali</span>
              <span className="font-bold">
                {stats.crosSi} / {stats.crosTot}
                {stats.crosPct !== null ? ` (${stats.crosPct}%)` : ""}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fuorigioco</span>
              <span className="font-bold">{stats.fgioco}</span>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-border/70 bg-card/60 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-500">
            <Shield className="h-4 w-4" /> Fase Difensiva &amp; Disciplina
          </div>
          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Contrasti vinti / Totali</span>
              <span className="font-bold">
                {stats.ctrsSi} / {stats.ctrsTot}
                {stats.ctrsPct !== null ? ` (${stats.ctrsPct}%)` : ""}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Palle Vinte / Perse</span>
              <span className="font-bold">
                {stats.possVinti} / {stats.pallePerse}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Falli • Gialli • Rossi</span>
              <span className="font-bold">
                {stats.falli} • <span className="text-amber-500">{stats.gialli}</span> •{" "}
                <span className="text-rose-500">{stats.rossi}</span>
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-border/70 bg-card/60 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-500">
            <Activity className="h-4 w-4" /> Atletica &amp; Porta
          </div>
          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Distanza totale</span>
              <span className="font-bold">{stats.distTot} km</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Distanza in scatto</span>
              <span className="font-bold">{stats.distScatto} km</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Parate / Gol Subiti</span>
              <span className="font-bold">
                {stats.para} / {stats.gsub}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabella Partite (Week) */}
      <Card className="border-border/70 bg-card/60 overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border/60 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Rendimento Giornata per Giornata ({visibleMatches.length})
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead className="bg-muted/40 text-muted-foreground border-b border-border/60">
              <tr>
                <th className="py-2 px-3 text-left">Stag</th>
                <th className="py-2 px-2 text-center">Wk</th>
                <th className="py-2 px-2 text-center">Min</th>
                <th className="py-2 px-2 text-center">Voto</th>
                <th className="py-2 px-2 text-center">{isGoalkeeper ? "Par" : "Gol"}</th>
                <th className="py-2 px-2 text-center">{isGoalkeeper ? "GS" : "Ass"}</th>
                <th className="py-2 px-2 text-center">Tiri</th>
                <th className="py-2 px-2 text-center">Pass</th>
                <th className="py-2 px-2 text-center">Drib</th>
                <th className="py-2 px-2 text-center">Ctrs</th>
                <th className="py-2 px-2 text-center">PV/PP</th>
                <th className="py-2 px-3 text-right">Km</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {visibleMatches.map((m) => (
                <tr key={`${m.STAG}-${m.WEEK}`} className="hover:bg-muted/20">
                  <td className="py-1.5 px-3 font-bold">{m.STAG}</td>
                  <td className="py-1.5 px-2 text-center">{m.WEEK}</td>
                  <td className="py-1.5 px-2 text-center">{m.MINUTI}&apos;</td>
                  <td className="py-1.5 px-2 text-center font-bold text-amber-600 dark:text-amber-400">
                    {m.VOTO !== null ? m.VOTO.toFixed(1) : "-"}
                  </td>
                  <td className="py-1.5 px-2 text-center">
                    {isGoalkeeper ? m.PARA : m.GOL}
                  </td>
                  <td className="py-1.5 px-2 text-center">
                    {isGoalkeeper ? m.GSUB : m.ASST}
                  </td>
                  <td className="py-1.5 px-2 text-center">
                    {m.TIRI_IN}/{m.TIRI_TOT}
                  </td>
                  <td className="py-1.5 px-2 text-center">
                    {m.PASS_SI}/{m.PASS_TOT}
                  </td>
                  <td className="py-1.5 px-2 text-center">
                    {m.DRIB_SI}/{m.DRIB_TOT}
                  </td>
                  <td className="py-1.5 px-2 text-center">
                    {m.CTRS_SI}/{m.CTRS_TOT}
                  </td>
                  <td className="py-1.5 px-2 text-center">
                    {m.POSS_VINTI}/{m.PALLE_PERSE}
                  </td>
                  <td className="py-1.5 px-3 text-right">{m.DIST_TOT.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

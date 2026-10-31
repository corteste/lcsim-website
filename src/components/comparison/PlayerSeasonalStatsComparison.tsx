import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/supabaseClient";
import { ComparisonPlayer } from "@/pages/ConfrontoGiocatori";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  Target,
  Shield,
  Clock,
  Award,
  Zap,
  Flame,
  AlertTriangle,
  Loader2,
  Calendar,
  Sparkles,
} from "lucide-react";
import { getValueColor } from "@/utils/functions";

interface PlayerSeasonalStatsComparisonProps {
  leftPlayer: ComparisonPlayer;
  rightPlayer: ComparisonPlayer;
}

interface PlayerStatsSummary {
  matchCount: number;
  minuti: number;
  mediaVoto: string;
  numMediaVoto: number | null;
  gol: number;
  asst: number;
  tiriIn: number;
  tiriTot: number;
  tiriPerc: string;
  passSi: number;
  passTot: number;
  passPerc: string;
  dribSi: number;
  dribTot: number;
  dribPerc: string;
  ctrsSi: number;
  ctrsTot: number;
  ctrsPerc: string;
  falli: number;
  gsub: number;
  gsubMedia: string;
  numGsubMedia: number | null;
  para: number;
  paraMedia: string;
  numParaMedia: number | null;
  gialli: number;
  rossi: number;
  motm: number;
  cleanSheets: number;
}

function computeStats(matches: any[]): PlayerStatsSummary {
  const matchCount = matches?.length || 0;
  let minuti = 0;
  let sumVoto = 0;
  let countVoto = 0;
  let gol = 0;
  let asst = 0;
  let tiriIn = 0;
  let tiriTot = 0;
  let passSi = 0;
  let passTot = 0;
  let dribSi = 0;
  let dribTot = 0;
  let ctrsSi = 0;
  let ctrsTot = 0;
  let falli = 0;
  let gsub = 0;
  let para = 0;
  let gialli = 0;
  let rossi = 0;
  let motm = 0;
  let cleanSheets = 0;

  for (const m of matches) {
    minuti += Number(m.MINUTI) || 0;
    if (m.VOTO && Number(m.VOTO) > 0) {
      sumVoto += Number(m.VOTO);
      countVoto++;
    }
    gol += Number(m.GOL) || 0;
    asst += Number(m.ASST) || 0;
    tiriIn += Number(m.TIRI_IN) || 0;
    tiriTot += Number(m.TIRI_TOT) || 0;
    passSi += Number(m.PASS_SI) || 0;
    passTot += Number(m.PASS_TOT) || 0;
    dribSi += Number(m.DRIB_SI) || 0;
    dribTot += Number(m.DRIB_TOT) || 0;
    ctrsSi += Number(m.CTRS_SI) || 0;
    ctrsTot += Number(m.CTRS_TOT) || 0;
    falli += Number(m.FALLI) || 0;
    gsub += Number(m.GSUB) || 0;
    para += Number(m.PARA) || 0;
    gialli += Number(m.GIALLI) || 0;
    rossi += Number(m.ROSSI) || 0;
    if (m.MOTM) motm++;
    if ((Number(m.MINUTI) || 0) >= 45 && (Number(m.GSUB) || 0) === 0) {
      cleanSheets++;
    }
  }

  const mediaVoto = countVoto > 0 ? (sumVoto / countVoto).toFixed(2) : "—";
  const passPerc = passTot > 0 ? `${Math.round((passSi / passTot) * 100)}%` : "—";
  const tiriPerc = tiriTot > 0 ? `${Math.round((tiriIn / tiriTot) * 100)}%` : "—";
  const dribPerc = dribTot > 0 ? `${Math.round((dribSi / dribTot) * 100)}%` : "—";
  const ctrsPerc = ctrsTot > 0 ? `${Math.round((ctrsSi / ctrsTot) * 100)}%` : "—";
  const gsubMedia = matchCount > 0 ? (gsub / matchCount).toFixed(2) : "—";
  const paraMedia = matchCount > 0 ? (para / matchCount).toFixed(1) : "—";

  return {
    matchCount,
    minuti,
    mediaVoto,
    numMediaVoto: countVoto > 0 ? sumVoto / countVoto : null,
    gol,
    asst,
    tiriIn,
    tiriTot,
    tiriPerc,
    passSi,
    passTot,
    passPerc,
    dribSi,
    dribTot,
    dribPerc,
    ctrsSi,
    ctrsTot,
    ctrsPerc,
    falli,
    gsub,
    gsubMedia,
    numGsubMedia: matchCount > 0 ? gsub / matchCount : null,
    para,
    paraMedia,
    numParaMedia: matchCount > 0 ? para / matchCount : null,
    gialli,
    rossi,
    motm,
    cleanSheets,
  };
}

export const PlayerSeasonalStatsComparison: React.FC<PlayerSeasonalStatsComparisonProps> = ({
  leftPlayer,
  rightPlayer,
}) => {
  const [selectedSeason, setSelectedSeason] = useState<string>("all");
  const [availableSeasons, setAvailableSeasons] = useState<number[]>([]);
  const [allMatches, setAllMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const isLeftGk = leftPlayer.Posiz === "POR";
  const isRightGk = rightPlayer.Posiz === "POR";
  const isGkVsOutfield = isLeftGk !== isRightGk;

  // Carica i dati da view_player_stats
  useEffect(() => {
    let isCancelled = false;

    async function fetchStats() {
      setLoading(true);
      try {
        const ids = [Number(leftPlayer.ID), Number(rightPlayer.ID)].filter(Boolean);
        if (ids.length === 0) {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("view_player_stats")
          .select("*")
          .in("ID", ids)
          .order("WEEK", { ascending: true });

        if (error) throw error;
        if (isCancelled) return;

        const rows = data || [];
        setAllMatches(rows);

        // Estrai le stagioni uniche
        const seasons = Array.from(
          new Set(
            rows
              .map((r: any) => Number(r.STAG))
              .filter((s: number) => !isNaN(s) && s > 0)
          )
        ).sort((a: number, b: number) => b - a);

        setAvailableSeasons(seasons);
      } catch (err) {
        console.error("Errore fetchStats in PlayerSeasonalStatsComparison:", err);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    fetchStats();

    return () => {
      isCancelled = true;
    };
  }, [leftPlayer.ID, rightPlayer.ID]);

  // Filtra i match in base alla stagione selezionata
  const filteredMatches = useMemo(() => {
    if (selectedSeason === "all") return allMatches;
    const sNum = Number(selectedSeason);
    return allMatches.filter((m) => Number(m.STAG) === sNum);
  }, [allMatches, selectedSeason]);

  const leftMatches = useMemo(() => {
    return filteredMatches.filter((m) => Number(m.ID) === Number(leftPlayer.ID));
  }, [filteredMatches, leftPlayer.ID]);

  const rightMatches = useMemo(() => {
    return filteredMatches.filter((m) => Number(m.ID) === Number(rightPlayer.ID));
  }, [filteredMatches, rightPlayer.ID]);

  const statsLeft = useMemo(() => computeStats(leftMatches), [leftMatches]);
  const statsRight = useMemo(() => computeStats(rightMatches), [rightMatches]);

  const totalMatchesFound = leftMatches.length + rightMatches.length;

  return (
    <div className="space-y-6">
      {/* Header Barra di Controllo con Selettore Stagione */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-muted/20 border border-border/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-extrabold text-foreground uppercase tracking-wider">
                Rendimento sul Campo
              </h4>
              <Badge variant="outline" className="font-mono text-[10px] font-bold">
                {selectedSeason === "all"
                  ? "Carriera Completa"
                  : `Stagione ${selectedSeason}`}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tabellini ufficiali estratti dalle partite di campionato (as_player_stat)
            </p>
          </div>
        </div>

        {/* Selettore Stagione */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" /> Stagione:
          </span>
          <Select value={selectedSeason} onValueChange={setSelectedSeason}>
            <SelectTrigger className="h-9 w-[170px] text-xs font-mono font-bold bg-background">
              <SelectValue placeholder="Seleziona..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutte le Stagioni</SelectItem>
              {availableSeasons.map((s) => (
                <SelectItem key={s} value={String(s)}>
                  Stagione {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center space-y-3">
          <Loader2 className="h-7 w-7 animate-spin mx-auto text-primary" />
          <p className="text-xs font-mono text-muted-foreground">
            Caricamento statistiche partite in corso...
          </p>
        </div>
      ) : totalMatchesFound === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-border/80 bg-muted/10 space-y-2">
          <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto" />
          <h4 className="text-sm font-bold text-foreground">
            Nessun tabellino disponibile
          </h4>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Nessuno dei due calciatori ha disputato partite a referto nella stagione selezionata{" "}
            {selectedSeason !== "all" && `(Stagione ${selectedSeason})`}.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 1. SEZIONE METRICHE GENERALI / CONDIVISE */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
              <Award className="h-4 w-4 text-emerald-500" />
              Presenze &amp; Rendimento Generale
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <StatRow
                label="Partite Giocate"
                icon={Clock}
                valA={statsLeft.matchCount}
                valB={statsRight.matchCount}
                numA={statsLeft.matchCount}
                numB={statsRight.matchCount}
                leftName={leftPlayer.Cognome}
                rightName={rightPlayer.Cognome}
              />
              <StatRow
                label="Minuti Disputati"
                icon={Clock}
                valA={`${statsLeft.minuti}'`}
                valB={`${statsRight.minuti}'`}
                numA={statsLeft.minuti}
                numB={statsRight.minuti}
                leftName={leftPlayer.Cognome}
                rightName={rightPlayer.Cognome}
              />
              <StatRow
                label="Media Voto"
                icon={Sparkles}
                valA={statsLeft.mediaVoto}
                valB={statsRight.mediaVoto}
                numA={statsLeft.numMediaVoto}
                numB={statsRight.numMediaVoto}
                leftName={leftPlayer.Cognome}
                rightName={rightPlayer.Cognome}
                formatDelta={(d) => `${d > 0 ? "+" : ""}${d.toFixed(2)}`}
              />
              <StatRow
                label="Migliore in Campo (MOTM)"
                icon={Award}
                valA={statsLeft.motm}
                valB={statsRight.motm}
                numA={statsLeft.motm}
                numB={statsRight.motm}
                leftName={leftPlayer.Cognome}
                rightName={rightPlayer.Cognome}
              />
              <StatRow
                label="Cartellini Gialli"
                icon={AlertTriangle}
                valA={statsLeft.gialli}
                valB={statsRight.gialli}
                numA={statsLeft.gialli}
                numB={statsRight.gialli}
                leftName={leftPlayer.Cognome}
                rightName={rightPlayer.Cognome}
                lowerIsBetter
              />
              <StatRow
                label="Cartellini Rossi"
                icon={AlertTriangle}
                valA={statsLeft.rossi}
                valB={statsRight.rossi}
                numA={statsLeft.rossi}
                numB={statsRight.rossi}
                leftName={leftPlayer.Cognome}
                rightName={rightPlayer.Cognome}
                lowerIsBetter
              />
              <StatRow
                label="Falli Commessi"
                icon={Zap}
                valA={statsLeft.falli}
                valB={statsRight.falli}
                numA={statsLeft.falli}
                numB={statsRight.falli}
                leftName={leftPlayer.Cognome}
                rightName={rightPlayer.Cognome}
                lowerIsBetter
              />
            </div>
          </div>

          {/* 2. SPECIFICHE: SE ENTRAMBI SONO GIOCATORI DI MOVIMENTO */}
          {!isLeftGk && !isRightGk && (
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <Target className="h-4 w-4 text-rose-500" />
                Manovra, Realizzazione &amp; Fase Difensiva
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <StatRow
                  label="Gol Realizzati"
                  icon={Flame}
                  valA={statsLeft.gol}
                  valB={statsRight.gol}
                  numA={statsLeft.gol}
                  numB={statsRight.gol}
                  leftName={leftPlayer.Cognome}
                  rightName={rightPlayer.Cognome}
                />
                <StatRow
                  label="Assist Vincenti"
                  icon={Zap}
                  valA={statsLeft.asst}
                  valB={statsRight.asst}
                  numA={statsLeft.asst}
                  numB={statsRight.asst}
                  leftName={leftPlayer.Cognome}
                  rightName={rightPlayer.Cognome}
                />
                <StatRow
                  label="Partecipazione ai Gol (G+A)"
                  icon={Award}
                  valA={statsLeft.gol + statsLeft.asst}
                  valB={statsRight.gol + statsRight.asst}
                  numA={statsLeft.gol + statsLeft.asst}
                  numB={statsRight.gol + statsRight.asst}
                  leftName={leftPlayer.Cognome}
                  rightName={rightPlayer.Cognome}
                />
                <StatRow
                  label="Tiri Totali (In Porta)"
                  icon={Target}
                  valA={`${statsLeft.tiriTot} (${statsLeft.tiriIn})`}
                  valB={`${statsRight.tiriTot} (${statsRight.tiriIn})`}
                  numA={statsLeft.tiriTot}
                  numB={statsRight.tiriTot}
                  leftName={leftPlayer.Cognome}
                  rightName={rightPlayer.Cognome}
                />
                <StatRow
                  label="Precisione Tiro %"
                  icon={Target}
                  valA={statsLeft.tiriPerc}
                  valB={statsRight.tiriPerc}
                  numA={statsLeft.tiriTot > 0 ? (statsLeft.tiriIn / statsLeft.tiriTot) * 100 : null}
                  numB={statsRight.tiriTot > 0 ? (statsRight.tiriIn / statsRight.tiriTot) * 100 : null}
                  leftName={leftPlayer.Cognome}
                  rightName={rightPlayer.Cognome}
                  formatDelta={(d) => `${d > 0 ? "+" : ""}${Math.round(d)}%`}
                />
                <StatRow
                  label="Passaggi Riusciti"
                  icon={Zap}
                  valA={`${statsLeft.passSi} / ${statsLeft.passTot} (${statsLeft.passPerc})`}
                  valB={`${statsRight.passSi} / ${statsRight.passTot} (${statsRight.passPerc})`}
                  numA={statsLeft.passTot > 0 ? (statsLeft.passSi / statsLeft.passTot) * 100 : null}
                  numB={statsRight.passTot > 0 ? (statsRight.passSi / statsRight.passTot) * 100 : null}
                  leftName={leftPlayer.Cognome}
                  rightName={rightPlayer.Cognome}
                  formatDelta={(d) => `${d > 0 ? "+" : ""}${Math.round(d)}%`}
                />
                <StatRow
                  label="Dribbling Riusciti"
                  icon={Sparkles}
                  valA={`${statsLeft.dribSi} / ${statsLeft.dribTot} (${statsLeft.dribPerc})`}
                  valB={`${statsRight.dribSi} / ${statsRight.dribTot} (${statsRight.dribPerc})`}
                  numA={statsLeft.dribSi}
                  numB={statsRight.dribSi}
                  leftName={leftPlayer.Cognome}
                  rightName={rightPlayer.Cognome}
                />
                <StatRow
                  label="Contrasti Vinti"
                  icon={Shield}
                  valA={`${statsLeft.ctrsSi} / ${statsLeft.ctrsTot} (${statsLeft.ctrsPerc})`}
                  valB={`${statsRight.ctrsSi} / ${statsRight.ctrsTot} (${statsRight.ctrsPerc})`}
                  numA={statsLeft.ctrsSi}
                  numB={statsRight.ctrsSi}
                  leftName={leftPlayer.Cognome}
                  rightName={rightPlayer.Cognome}
                />
              </div>
            </div>
          )}

          {/* 3. SPECIFICHE: SE ENTRAMBI SONO PORTIERI */}
          {isLeftGk && isRightGk && (
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-amber-500" />
                Difesa della Porta &amp; Efficacia Difensiva
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <StatRow
                  label="Gol Subiti"
                  icon={Shield}
                  valA={statsLeft.gsub}
                  valB={statsRight.gsub}
                  numA={statsLeft.gsub}
                  numB={statsRight.gsub}
                  leftName={leftPlayer.Cognome}
                  rightName={rightPlayer.Cognome}
                  lowerIsBetter
                />
                <StatRow
                  label="Media Gol Subiti / Gara"
                  icon={Shield}
                  valA={statsLeft.gsubMedia}
                  valB={statsRight.gsubMedia}
                  numA={statsLeft.numGsubMedia}
                  numB={statsRight.numGsubMedia}
                  leftName={leftPlayer.Cognome}
                  rightName={rightPlayer.Cognome}
                  lowerIsBetter
                  formatDelta={(d) => `${d > 0 ? "+" : ""}${d.toFixed(2)}`}
                />
                <StatRow
                  label="Parate Totali"
                  icon={Zap}
                  valA={statsLeft.para}
                  valB={statsRight.para}
                  numA={statsLeft.para}
                  numB={statsRight.para}
                  leftName={leftPlayer.Cognome}
                  rightName={rightPlayer.Cognome}
                />
                <StatRow
                  label="Media Parate / Gara"
                  icon={Zap}
                  valA={statsLeft.paraMedia}
                  valB={statsRight.paraMedia}
                  numA={statsLeft.numParaMedia}
                  numB={statsRight.numParaMedia}
                  leftName={leftPlayer.Cognome}
                  rightName={rightPlayer.Cognome}
                  formatDelta={(d) => `${d > 0 ? "+" : ""}${d.toFixed(1)}`}
                />
                <StatRow
                  label="Clean Sheets (Porta Inviolata)"
                  icon={Award}
                  valA={statsLeft.cleanSheets}
                  valB={statsRight.cleanSheets}
                  numA={statsLeft.cleanSheets}
                  numB={statsRight.cleanSheets}
                  leftName={leftPlayer.Cognome}
                  rightName={rightPlayer.Cognome}
                />
                <StatRow
                  label="Passaggi &amp; Rinvii Riusciti"
                  icon={Target}
                  valA={`${statsLeft.passSi} / ${statsLeft.passTot} (${statsLeft.passPerc})`}
                  valB={`${statsRight.passSi} / ${statsRight.passTot} (${statsRight.passPerc})`}
                  numA={statsLeft.passTot > 0 ? (statsLeft.passSi / statsLeft.passTot) * 100 : null}
                  numB={statsRight.passTot > 0 ? (statsRight.passSi / statsRight.passTot) * 100 : null}
                  leftName={leftPlayer.Cognome}
                  rightName={rightPlayer.Cognome}
                  formatDelta={(d) => `${d > 0 ? "+" : ""}${Math.round(d)}%`}
                />
              </div>
            </div>
          )}

          {/* 4. SPECIFICHE SE POR VS MOVIMENTO: BLOCCHI AFFIANCATI PER RUOLO */}
          {isGkVsOutfield && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl border border-border/80 bg-muted/20 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Specializzazioni di Ruolo a Confronto Diretto
                </span>
                <Badge variant="outline" className="text-[10px] font-mono">
                  Portiere vs Giocatore di Movimento
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Colonna Giocatore Sinistro */}
                <div
                  className={`p-4 rounded-xl border ${
                    isLeftGk
                      ? "border-amber-500/30 bg-amber-500/5"
                      : "border-blue-500/30 bg-blue-500/5"
                  } space-y-3`}
                >
                  <div className="flex items-center justify-between border-b border-border/60 pb-2">
                    <span className="font-extrabold text-xs text-foreground flex items-center gap-1.5">
                      {isLeftGk ? (
                        <Shield className="h-4 w-4 text-amber-500" />
                      ) : (
                        <Target className="h-4 w-4 text-blue-500" />
                      )}
                      {leftPlayer.Cognome} ({leftPlayer.Posiz})
                    </span>
                    <Badge variant="outline" className="text-[10px] font-mono font-bold">
                      {isLeftGk ? "Fase Portiere" : "Fase Offensiva"}
                    </Badge>
                  </div>

                  {isLeftGk ? (
                    <div className="space-y-2 text-xs font-mono">
                      <div className="flex justify-between items-center py-1 border-b border-border/40">
                        <span className="text-muted-foreground">Gol Subiti Totali:</span>
                        <span className="font-bold text-foreground">{statsLeft.gsub}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-border/40">
                        <span className="text-muted-foreground">Media Gol Subiti / Gara:</span>
                        <span className="font-bold text-foreground">{statsLeft.gsubMedia}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-border/40">
                        <span className="text-muted-foreground">Parate Effettuate:</span>
                        <span className="font-bold text-foreground">{statsLeft.para} (media {statsLeft.paraMedia}/g)</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-border/40">
                        <span className="text-muted-foreground">Clean Sheets:</span>
                        <span className="font-bold text-emerald-500">{statsLeft.cleanSheets}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-muted-foreground">Passaggi / Rinvii Riusciti:</span>
                        <span className="font-bold text-foreground">{statsLeft.passSi}/{statsLeft.passTot} ({statsLeft.passPerc})</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 text-xs font-mono">
                      <div className="flex justify-between items-center py-1 border-b border-border/40">
                        <span className="text-muted-foreground">Gol Realizzati:</span>
                        <span className="font-bold text-foreground">{statsLeft.gol}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-border/40">
                        <span className="text-muted-foreground">Assist Serviti:</span>
                        <span className="font-bold text-foreground">{statsLeft.asst}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-border/40">
                        <span className="text-muted-foreground">Tiri Totali (In Porta):</span>
                        <span className="font-bold text-foreground">{statsLeft.tiriTot} ({statsLeft.tiriIn})</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-border/40">
                        <span className="text-muted-foreground">Passaggi Riusciti %:</span>
                        <span className="font-bold text-foreground">{statsLeft.passSi}/{statsLeft.passTot} ({statsLeft.passPerc})</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-muted-foreground">Dribbling Riusciti:</span>
                        <span className="font-bold text-foreground">{statsLeft.dribSi}/{statsLeft.dribTot} ({statsLeft.dribPerc})</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Colonna Giocatore Destro */}
                <div
                  className={`p-4 rounded-xl border ${
                    isRightGk
                      ? "border-amber-500/30 bg-amber-500/5"
                      : "border-emerald-500/30 bg-emerald-500/5"
                  } space-y-3`}
                >
                  <div className="flex items-center justify-between border-b border-border/60 pb-2">
                    <span className="font-extrabold text-xs text-foreground flex items-center gap-1.5">
                      {isRightGk ? (
                        <Shield className="h-4 w-4 text-amber-500" />
                      ) : (
                        <Target className="h-4 w-4 text-emerald-500" />
                      )}
                      {rightPlayer.Cognome} ({rightPlayer.Posiz})
                    </span>
                    <Badge variant="outline" className="text-[10px] font-mono font-bold">
                      {isRightGk ? "Fase Portiere" : "Fase Offensiva"}
                    </Badge>
                  </div>

                  {isRightGk ? (
                    <div className="space-y-2 text-xs font-mono">
                      <div className="flex justify-between items-center py-1 border-b border-border/40">
                        <span className="text-muted-foreground">Gol Subiti Totali:</span>
                        <span className="font-bold text-foreground">{statsRight.gsub}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-border/40">
                        <span className="text-muted-foreground">Media Gol Subiti / Gara:</span>
                        <span className="font-bold text-foreground">{statsRight.gsubMedia}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-border/40">
                        <span className="text-muted-foreground">Parate Effettuate:</span>
                        <span className="font-bold text-foreground">{statsRight.para} (media {statsRight.paraMedia}/g)</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-border/40">
                        <span className="text-muted-foreground">Clean Sheets:</span>
                        <span className="font-bold text-emerald-500">{statsRight.cleanSheets}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-muted-foreground">Passaggi / Rinvii Riusciti:</span>
                        <span className="font-bold text-foreground">{statsRight.passSi}/{statsRight.passTot} ({statsRight.passPerc})</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 text-xs font-mono">
                      <div className="flex justify-between items-center py-1 border-b border-border/40">
                        <span className="text-muted-foreground">Gol Realizzati:</span>
                        <span className="font-bold text-foreground">{statsRight.gol}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-border/40">
                        <span className="text-muted-foreground">Assist Serviti:</span>
                        <span className="font-bold text-foreground">{statsRight.asst}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-border/40">
                        <span className="text-muted-foreground">Tiri Totali (In Porta):</span>
                        <span className="font-bold text-foreground">{statsRight.tiriTot} ({statsRight.tiriIn})</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-border/40">
                        <span className="text-muted-foreground">Passaggi Riusciti %:</span>
                        <span className="font-bold text-foreground">{statsRight.passSi}/{statsRight.passTot} ({statsRight.passPerc})</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-muted-foreground">Dribbling Riusciti:</span>
                        <span className="font-bold text-foreground">{statsRight.dribSi}/{statsRight.dribTot} ({statsRight.dribPerc})</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Sub-component riga comparativa statistica
interface StatRowProps {
  label: string;
  icon?: any;
  valA: number | string;
  valB: number | string;
  numA: number | null;
  numB: number | null;
  leftName: string;
  rightName: string;
  lowerIsBetter?: boolean;
  formatDelta?: (diff: number) => string;
}

const StatRow: React.FC<StatRowProps> = ({
  label,
  icon: Icon,
  valA,
  valB,
  numA,
  numB,
  leftName,
  rightName,
  lowerIsBetter = false,
  formatDelta,
}) => {
  const bothValid = numA !== null && numB !== null;
  let aWins = false;
  let bWins = false;
  let isTie = false;
  let deltaText: string | null = null;

  if (bothValid) {
    if (lowerIsBetter) {
      aWins = numA < numB;
      bWins = numB < numA;
      isTie = numA === numB;
      const diff = numB - numA;
      deltaText = aWins
        ? `${formatDelta ? formatDelta(diff) : `-${diff}`} ${leftName}`
        : bWins
        ? `${formatDelta ? formatDelta(numA - numB) : `-${numA - numB}`} ${rightName}`
        : "=";
    } else {
      aWins = numA > numB;
      bWins = numB > numA;
      isTie = numA === numB;
      const diff = numA - numB;
      deltaText = aWins
        ? `${formatDelta ? formatDelta(diff) : `+${diff}`} ${leftName}`
        : bWins
        ? `${formatDelta ? formatDelta(numB - numA) : `+${numB - numA}`} ${rightName}`
        : "=";
    }
  }

  // Percentuali barra grafica
  let percentA = 50;
  let percentB = 50;
  if (bothValid && numA + numB > 0) {
    if (lowerIsBetter) {
      // Per valori dove il minore è migliore, invertiamo il peso relativo
      percentA = Math.round((numB / (numA + numB)) * 100);
      percentB = 100 - percentA;
    } else {
      percentA = Math.round((numA / (numA + numB)) * 100);
      percentB = 100 - percentA;
    }
  }

  return (
    <div className="p-3 rounded-xl bg-card border border-border/70 hover:border-border transition-colors">
      <div className="flex items-center justify-between mb-1.5 text-xs">
        {/* Valore Giocatore Sinistro */}
        <div className="flex items-center gap-1.5 w-1/3 justify-start font-mono">
          <span
            className={`font-black text-sm ${
              aWins ? "text-blue-500" : "text-foreground"
            }`}
          >
            {valA}
          </span>
          {aWins && (
            <Badge
              variant="outline"
              className="text-[9px] font-extrabold px-1 py-0 bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30"
            >
              ★
            </Badge>
          )}
        </div>

        {/* Etichetta Metrica Centrata */}
        <div className="w-1/3 text-center text-xs font-black text-foreground uppercase tracking-wider truncate flex items-center justify-center gap-1.5">
          {Icon && <Icon className="h-3.5 w-3.5 text-primary shrink-0" />}
          <span className="truncate">{label}</span>
        </div>

        {/* Valore Giocatore Destro */}
        <div className="flex items-center gap-1.5 w-1/3 justify-end font-mono">
          {bWins && (
            <Badge
              variant="outline"
              className="text-[9px] font-extrabold px-1 py-0 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
            >
              ★
            </Badge>
          )}
          <span
            className={`font-black text-sm ${
              bWins ? "text-emerald-500" : "text-foreground"
            }`}
          >
            {valB}
          </span>
        </div>
      </div>

      {/* Barra Proporzionale */}
      <div className="h-2 w-full bg-muted/40 rounded-full overflow-hidden flex">
        <div
          className={`h-full transition-all duration-300 ${
            aWins ? "bg-blue-500" : "bg-blue-400/40"
          }`}
          style={{ width: `${percentA}%` }}
        />
        <div
          className={`h-full transition-all duration-300 ${
            bWins ? "bg-emerald-500" : "bg-emerald-400/40"
          }`}
          style={{ width: `${percentB}%` }}
        />
      </div>

      {/* Delta sotto la barra */}
      {bothValid && deltaText && deltaText !== "=" && (
        <div className="flex justify-center mt-1">
          <span
            className={`text-[9px] font-mono font-bold ${
              aWins
                ? "text-blue-500"
                : bWins
                ? "text-emerald-500"
                : "text-muted-foreground"
            }`}
          >
            Vantaggio: {deltaText}
          </span>
        </div>
      )}
    </div>
  );
};

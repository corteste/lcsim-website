import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TrendingUp,
  Search,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Info,
  Clock,
  Award,
  Zap,
  Users,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { Player } from "@/types/player";
import { getPlayerImage, getRoleColor } from "@/utils/functions";
import {
  fetchTeamSeasonXpReport,
  PlayerSeasonXpSummary,
  getSeasonFormatConfig,
} from "@/services/playerXpService";

interface SeasonalXpReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  teamName?: string;
  players: Player[];
  defaultSeason?: number;
}

export const SeasonalXpReportModal: React.FC<SeasonalXpReportModalProps> = ({
  open,
  onOpenChange,
  teamId,
  teamName,
  players,
  defaultSeason = 10,
}) => {
  const [season, setSeason] = useState<number>(defaultSeason);
  const [loading, setLoading] = useState<boolean>(false);
  const [reportData, setReportData] = useState<PlayerSeasonXpSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [expandedPlayerId, setExpandedPlayerId] = useState<number | null>(null);
  const [showFormulaInfo, setShowFormulaInfo] = useState<boolean>(false);

  const formatConfig = useMemo(() => getSeasonFormatConfig(season), [season]);

  // Caricamento report ogni volta che cambiano stagione o giocatori
  useEffect(() => {
    if (!open || !teamId || players.length === 0) return;

    let isMounted = true;
    setLoading(true);

    fetchTeamSeasonXpReport(season, players)
      .then((data) => {
        if (isMounted) {
          setReportData(data);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [open, season, teamId, players]);

  // Statistiche complessive di squadra
  const teamStats = useMemo(() => {
    let totalXp = 0;
    let activePlayersCount = 0;
    let totalMinutes = 0;
    let totalYouthBonus = 0;
    let topEarner: PlayerSeasonXpSummary | null = null;

    for (const p of reportData) {
      totalXp += p.finalSeasonXp;
      totalMinutes += p.totalMinutes;
      totalYouthBonus += p.youthBonusXp;
      if (p.matches.length > 0) {
        activePlayersCount++;
      }
      if (!topEarner || p.finalSeasonXp > topEarner.finalSeasonXp) {
        topEarner = p;
      }
    }

    const avgXp = activePlayersCount > 0 ? Math.round(totalXp / activePlayersCount) : 0;

    return {
      totalXp,
      activePlayersCount,
      totalMinutes,
      totalYouthBonus,
      avgXp,
      topEarner,
    };
  }, [reportData]);

  // Filtro ricerca e ruolo
  const filteredReport = useMemo(() => {
    return reportData.filter((p) => {
      if (roleFilter !== "ALL") {
        if (roleFilter === "POR" && p.playerRole !== "POR") return false;
        if (roleFilter === "DIF" && !["DC", "TD", "TS"].includes(p.playerRole)) return false;
        if (
          roleFilter === "CEN" &&
          !["CDC", "CC", "ED", "ES", "COC"].includes(p.playerRole)
        )
          return false;
        if (roleFilter === "ATT" && !["AD", "AS", "AT", "ATT"].includes(p.playerRole))
          return false;
      }

      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase().trim();
        const full = `${p.playerName} ${p.playerRole}`.toLowerCase();
        return full.includes(q);
      }

      return true;
    });
  }, [reportData, roleFilter, searchQuery]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl xl:max-w-5xl max-h-[92vh] overflow-hidden flex flex-col p-0 gap-0">
        {/* Header Modale */}
        <DialogHeader className="p-5 pb-4 border-b border-border/70 bg-gradient-to-r from-emerald-500/10 via-card to-emerald-500/5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <DialogTitle className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2">
                  Report Calcolo XP Stagionali
                </DialogTitle>
                <Badge variant="outline" className="font-mono text-xs font-bold">
                  {teamId}
                </Badge>
              </div>
              <DialogDescription className="text-xs text-muted-foreground">
                Riepilogo analitico dei punti esperienza guadagnati partita per partita per{" "}
                <span className="font-semibold text-foreground">{teamName || teamId}</span>.
              </DialogDescription>
            </div>

            {/* Selettore Stagione */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> Stagione:
              </span>
              <Select
                value={String(season)}
                onValueChange={(v) => setSeason(Number(v))}
              >
                <SelectTrigger className="w-[125px] h-8 text-xs font-mono font-bold bg-background/90">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="11">Stagione 11</SelectItem>
                  <SelectItem value="10">Stagione 10</SelectItem>
                  <SelectItem value="9">Stagione 9</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Banner Parametri Formato Stagione */}
          <div className="mt-3 pt-2.5 border-t border-border/50 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground font-mono">
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3 text-emerald-500" />
                Regular Season: <strong>{formatConfig.regularSeasonWeeks} match</strong>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Award className="h-3 w-3 text-emerald-500" />
                Playoff: <strong>Migliori {formatConfig.playoffBestMatchesToKeep} match</strong>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-amber-500" />
                Under 25: <strong>+10% XP (x1.1)</strong>
              </span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFormulaInfo(!showFormulaInfo)}
              className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground gap-1"
            >
              <Info className="h-3 w-3 text-primary" />
              {showFormulaInfo ? "Nascondi Formula" : "Come si calcolano gli XP?"}
            </Button>
          </div>

          {/* Box spiegazione formula dettagliata */}
          {showFormulaInfo && (
            <div className="mt-2.5 p-3 rounded-xl bg-muted/40 border border-border/80 text-xs space-y-1.5 animate-in fade-in duration-200">
              <div className="font-bold text-foreground flex items-center gap-1.5 text-[11px] uppercase tracking-wide">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Regole Ufficiali di Calcolo XP
              </div>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground text-[11px] leading-relaxed">
                <li>
                  <strong>XP Minuti in campo</strong>: se il calciatore non entra riceve <strong>0 XP</strong>, altrimenti <strong>1 XP ogni 20 minuti</strong> (arrotondato per eccesso) fino a un massimo di <strong>5 XP</strong> (81+ min = 5 XP).
                </li>
                <li>
                  <strong>XP dal Voto</strong>: se non ha ricevuto voto riceve <strong>2 XP</strong>, altrimenti <code>(Voto - 3) × 2</code> arrotondato per difetto all'unità.
                </li>
                <li>
                  <strong>Totale Partita</strong> = <code>XP Minuti + XP Voto</code> (sempre numero intero).
                </li>
                <li>
                  <strong>Aggregazione Stagione</strong> = Tutte le {formatConfig.regularSeasonWeeks} partite di Regular Season + le migliori {formatConfig.playoffBestMatchesToKeep} prestazioni dei Playoff.
                </li>
                <li>
                  <strong>Bonus Giovani</strong>: i calciatori di 24 e 25 anni ricevono un moltiplicatore <strong>×1.1 (+10%)</strong> per simulare la crescita accelerata.
                </li>
              </ul>
            </div>
          )}
        </DialogHeader>

        {/* Dashboard Statistiche Squadra */}
        <div className="p-4 bg-muted/20 border-b border-border/60 grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
          <Card className="border border-border/70 shadow-xs bg-card/80">
            <CardContent className="p-3">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                XP Totali Squadra
              </span>
              <div className="text-xl sm:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                {teamStats.totalXp} XP
              </div>
              <span className="text-[9px] text-muted-foreground font-mono">
                {teamStats.totalYouthBonus > 0 ? `(inclusi +${teamStats.totalYouthBonus} XP giovani)` : "stagione completa"}
              </span>
            </CardContent>
          </Card>

          <Card className="border border-border/70 shadow-xs bg-card/80">
            <CardContent className="p-3">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                Calciatori a Referto
              </span>
              <div className="text-xl sm:text-2xl font-black font-mono text-foreground mt-0.5">
                {teamStats.activePlayersCount} / {players.length}
              </div>
              <span className="text-[9px] text-muted-foreground font-mono">
                hanno disputato match
              </span>
            </CardContent>
          </Card>

          <Card className="border border-border/70 shadow-xs bg-card/80">
            <CardContent className="p-3">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                Media per Giocatore
              </span>
              <div className="text-xl sm:text-2xl font-black font-mono text-foreground mt-0.5">
                {teamStats.avgXp} XP
              </div>
              <span className="text-[9px] text-muted-foreground font-mono">
                tra i giocatori scesi in campo
              </span>
            </CardContent>
          </Card>

          <Card className="border border-border/70 shadow-xs bg-card/80">
            <CardContent className="p-3">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                Top Performer
              </span>
              <div className="text-sm sm:text-base font-extrabold text-foreground truncate mt-0.5">
                {teamStats.topEarner ? teamStats.topEarner.playerName : "-"}
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {teamStats.topEarner ? `${teamStats.topEarner.finalSeasonXp} XP` : "-"}
              </span>
            </CardContent>
          </Card>
        </div>

        {/* Barra Filtri & Ricerca */}
        <div className="p-3 px-5 border-b border-border/60 bg-card flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Cerca calciatore..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-xs bg-muted/20 border-border/70"
            />
          </div>

          <div className="flex items-center gap-1 w-full sm:w-auto justify-end">
            {["ALL", "POR", "DIF", "CEN", "ATT"].map((r) => (
              <Button
                key={r}
                size="sm"
                variant={roleFilter === r ? "default" : "outline"}
                onClick={() => setRoleFilter(r)}
                className={`h-7 text-[10px] px-2.5 font-bold ${
                  roleFilter === r
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {r}
              </Button>
            ))}
          </div>
        </div>

        {/* Tabella Calciatori con Accordion per il Dettaglio Partite */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="p-12 text-center text-muted-foreground text-xs font-mono space-y-2">
              <Clock className="h-6 w-6 animate-spin mx-auto text-primary" />
              <p>Calcolo e caricamento statistiche partite in corso...</p>
            </div>
          ) : filteredReport.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground text-xs">
              Nessun calciatore trovato per i filtri selezionati.
            </div>
          ) : (
            filteredReport.map((p) => {
              const isExpanded = expandedPlayerId === p.playerId;

              return (
                <div
                  key={p.playerId}
                  className="rounded-xl border border-border/70 bg-card overflow-hidden shadow-xs hover:border-border transition-all"
                >
                  {/* Riga Principale Calciatore */}
                  <div
                    onClick={() =>
                      setExpandedPlayerId(isExpanded ? null : p.playerId)
                    }
                    className="p-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-muted/30 transition-colors"
                  >
                    {/* Anagrafica e Avatar */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="h-10 w-10 rounded-full overflow-hidden bg-muted/50 border border-border/80 shrink-0 flex items-center justify-center">
                        <img
                          src={getPlayerImage(p.playerId)}
                          alt={p.playerName}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              "/images/players/MConti.png";
                          }}
                          className="h-full w-full object-cover object-top"
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge
                            variant="outline"
                            className={`text-[9px] font-extrabold px-1.5 py-0 h-4 ${getRoleColor(
                              p.playerRole
                            )}`}
                          >
                            {p.playerRole}
                          </Badge>
                          <span className="font-bold text-sm text-foreground truncate">
                            {p.playerName}
                          </span>
                          {p.isYouth && (
                            <Badge
                              variant="outline"
                              className="text-[9px] font-bold px-1.5 py-0 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                              title="Calciatore di 24-25 anni: moltiplicatore x1.1 (+10% XP)"
                            >
                              Under 25 (+10%)
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-mono mt-0.5">
                          <span>{p.age} anni</span>
                          <span>•</span>
                          <span>
                            {p.rsMatchesCount + p.poMatchesCount} presenze ({p.totalMinutes} min)
                          </span>
                          {p.averageGrade !== null && (
                            <>
                              <span>•</span>
                              <span>Media: {p.averageGrade}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Breakdown XP e Bottone Espandi */}
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="hidden sm:flex items-center gap-3 text-xs font-mono text-muted-foreground">
                        <div className="text-right">
                          <span className="text-[10px] block opacity-70">Reg. Season</span>
                          <span className="font-bold text-foreground">{p.rsXp} XP</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] block opacity-70">Playoff</span>
                          <span className="font-bold text-foreground">+{p.poXp} XP</span>
                        </div>
                        {p.isYouth && (
                          <div className="text-right text-amber-500">
                            <span className="text-[10px] block opacity-70">Bonus Giovani</span>
                            <span className="font-bold">+{p.youthBonusXp} XP</span>
                          </div>
                        )}
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] block font-mono uppercase tracking-wider text-muted-foreground">
                          Totale
                        </span>
                        <span className="text-base sm:text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
                          {p.finalSeasonXp} XP
                        </span>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Dettaglio Espanso: Partita per Partita */}
                  {isExpanded && (
                    <div className="p-3.5 bg-muted/30 border-t border-border/60 space-y-2 animate-in slide-in-from-top-2 duration-150">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-primary" />
                          Rendimento Partita per Partita ({p.matches.length} giornate disputate)
                        </span>
                        <span className="text-[10px] font-normal lowercase font-mono">
                          * Playoff: conteggiate solo le {formatConfig.playoffBestMatchesToKeep} migliori prestazioni
                        </span>
                      </div>

                      {p.matches.length === 0 ? (
                        <div className="p-4 text-center text-xs text-muted-foreground bg-card/60 rounded-lg border border-border/50">
                          Nessun dato a referto per questo calciatore nella Stagione {season}.
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs font-mono">
                            <thead>
                              <tr className="border-b border-border/60 text-[10px] uppercase text-muted-foreground">
                                <th className="py-1.5 px-2">Giornata</th>
                                <th className="py-1.5 px-2">Fase</th>
                                <th className="py-1.5 px-2">Minuti</th>
                                <th className="py-1.5 px-2">Voto</th>
                                <th className="py-1.5 px-2">XP Minuti</th>
                                <th className="py-1.5 px-2">XP Voto</th>
                                <th className="py-1.5 px-2">Totale</th>
                                <th className="py-1.5 px-2 text-right">Stato</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40">
                              {p.matches.map((m) => {
                                const isIncluded = !m.isPlayoff || m.isCountedInPlayoff;

                                return (
                                  <tr
                                    key={m.week}
                                    className={`hover:bg-muted/40 transition-colors ${
                                      !isIncluded ? "opacity-40" : ""
                                    }`}
                                  >
                                    <td className="py-2 px-2 font-bold text-foreground">
                                      Giornata #{m.week}
                                    </td>
                                    <td className="py-2 px-2">
                                      {m.isPlayoff ? (
                                        <Badge
                                          variant="outline"
                                          className="text-[9px] px-1 py-0 bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30"
                                        >
                                          Playoff
                                        </Badge>
                                      ) : (
                                        <Badge
                                          variant="secondary"
                                          className="text-[9px] px-1 py-0"
                                        >
                                          Reg. Season
                                        </Badge>
                                      )}
                                    </td>
                                    <td className="py-2 px-2">
                                      {m.minuti > 0 ? `${m.minuti}'` : "0'"}
                                    </td>
                                    <td className="py-2 px-2 font-bold">
                                      {m.voto !== null ? m.voto : "S.V."}
                                    </td>
                                    <td className="py-2 px-2 text-muted-foreground">
                                      +{m.xpMinuti} XP
                                    </td>
                                    <td className="py-2 px-2 text-muted-foreground">
                                      +{m.xpVoto} XP
                                    </td>
                                    <td className="py-2 px-2 font-bold text-foreground">
                                      {m.matchXp} XP
                                    </td>
                                    <td className="py-2 px-2 text-right">
                                      {m.isPlayoff ? (
                                        m.isCountedInPlayoff ? (
                                          <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[9px] gap-1">
                                            <CheckCircle2 className="h-2.5 w-2.5" /> Top {formatConfig.playoffBestMatchesToKeep}
                                          </Badge>
                                        ) : (
                                          <Badge
                                            variant="outline"
                                            className="text-[9px] text-muted-foreground"
                                          >
                                            Scartata
                                          </Badge>
                                        )
                                      ) : (
                                        <Badge
                                          variant="outline"
                                          className="text-[9px] text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                                        >
                                          Conteggiata
                                        </Badge>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

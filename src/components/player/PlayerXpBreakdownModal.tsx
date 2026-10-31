import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TrendingUp, Clock, Calendar, CheckCircle2, Sparkles, Award } from "lucide-react";
import { Player } from "@/types/player";
import { getPlayerImage, getRoleColor } from "@/utils/functions";
import {
  fetchSeasonMatchStats,
  computePlayerSeasonXp,
  PlayerSeasonXpSummary,
  getSeasonFormatConfig,
} from "@/services/playerXpService";

interface PlayerXpBreakdownModalProps {
  player: Player | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultSeason?: number;
}

export const PlayerXpBreakdownModal: React.FC<PlayerXpBreakdownModalProps> = ({
  player,
  open,
  onOpenChange,
  defaultSeason = 10,
}) => {
  const [season, setSeason] = useState<number>(defaultSeason);
  const [loading, setLoading] = useState<boolean>(false);
  const [summary, setSummary] = useState<PlayerSeasonXpSummary | null>(null);

  const formatConfig = useMemo(() => getSeasonFormatConfig(season), [season]);

  useEffect(() => {
    if (!open || !player) return;

    let isMounted = true;
    setLoading(true);

    fetchSeasonMatchStats(season, [Number(player.ID)])
      .then((rows) => {
        if (isMounted) {
          const res = computePlayerSeasonXp(player, rows, season);
          setSummary(res);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [open, player, season]);

  if (!player) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[88vh] overflow-hidden flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 border-b border-border/70 bg-gradient-to-r from-emerald-500/10 via-card to-emerald-500/5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-10 w-10 rounded-full overflow-hidden bg-muted border border-border shrink-0">
                <img
                  src={getPlayerImage(Number(player.ID))}
                  alt={`${player.Nome} ${player.Cognome}`}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = `${SUPABASE_STORAGE_URL}/images/players/MConti.png`;
                  }}
                  className="h-full w-full object-cover object-top"
                />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-base sm:text-lg font-black text-foreground truncate flex items-center gap-1.5">
                  <span>{player.Nome} {player.Cognome}</span>
                  <Badge variant="outline" className={`text-[9px] px-1 py-0 ${getRoleColor(player.Posiz)}`}>
                    {player.Posiz}
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                  <span>{player.Età} anni</span>
                  <span>•</span>
                  <span>{player.Squadra || "Svincolato"}</span>
                </DialogDescription>
              </div>
            </div>

            {/* Selettore Stagione */}
            <Select value={String(season)} onValueChange={(v) => setSeason(Number(v))}>
              <SelectTrigger className="w-[110px] h-7 text-xs font-mono font-bold bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="11">Stagione 11</SelectItem>
                <SelectItem value="10">Stagione 10</SelectItem>
                <SelectItem value="9">Stagione 9</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quick Recap Pills */}
          {summary && (
            <div className="mt-3 pt-3 border-t border-border/50 grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-lg bg-card border border-border/60">
                <span className="text-[9px] uppercase font-bold text-muted-foreground block">
                  Reg. Season ({formatConfig.regularSeasonWeeks}w)
                </span>
                <span className="text-sm font-black font-mono text-foreground">
                  {summary.rsXp} XP
                </span>
              </div>
              <div className="p-2 rounded-lg bg-card border border-border/60">
                <span className="text-[9px] uppercase font-bold text-muted-foreground block">
                  Playoff (Top {formatConfig.playoffBestMatchesToKeep})
                </span>
                <span className="text-sm font-black font-mono text-foreground">
                  +{summary.poXp} XP
                </span>
              </div>
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                <span className="text-[9px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">
                  XP Guadagnati
                </span>
                <span className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400">
                  {summary.finalSeasonXp} XP
                </span>
              </div>
            </div>
          )}

          {summary?.isYouth && (
            <div className="mt-2 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-600 dark:text-amber-400 font-mono flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Bonus Crescita Giovani (24-25 anni): +10%
              </span>
              <strong>+{summary.youthBonusXp} XP</strong>
            </div>
          )}
        </DialogHeader>

        {/* Tabella Partite */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="p-8 text-center text-xs text-muted-foreground font-mono space-y-1.5">
              <Clock className="h-5 w-5 animate-spin mx-auto text-primary" />
              <p>Caricamento statistiche partite...</p>
            </div>
          ) : !summary || summary.matches.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              Nessun match a referto per questo calciatore nella Stagione {season}.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-border/60 text-[10px] uppercase text-muted-foreground">
                    <th className="py-1 px-1.5">Giornata</th>
                    <th className="py-1 px-1.5">Minuti</th>
                    <th className="py-1 px-1.5">Voto</th>
                    <th className="py-1 px-1.5">XP Min</th>
                    <th className="py-1 px-1.5">XP Voto</th>
                    <th className="py-1 px-1.5 font-bold">Totale</th>
                    <th className="py-1 px-1.5 text-right">Fase</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {summary.matches.map((m) => {
                    const isIncluded = !m.isPlayoff || m.isCountedInPlayoff;

                    return (
                      <tr
                        key={m.week}
                        className={`hover:bg-muted/40 transition-colors ${
                          !isIncluded ? "opacity-35" : ""
                        }`}
                      >
                        <td className="py-2 px-1.5 font-bold text-foreground">
                          #{m.week}
                        </td>
                        <td className="py-2 px-1.5">{m.minuti > 0 ? `${m.minuti}'` : "0'"}</td>
                        <td className="py-2 px-1.5 font-bold">
                          {m.voto !== null ? m.voto : "S.V."}
                        </td>
                        <td className="py-2 px-1.5 text-muted-foreground">+{m.xpMinuti}</td>
                        <td className="py-2 px-1.5 text-muted-foreground">+{m.xpVoto}</td>
                        <td className="py-2 px-1.5 font-black text-foreground">{m.matchXp} XP</td>
                        <td className="py-2 px-1.5 text-right">
                          {m.isPlayoff ? (
                            m.isCountedInPlayoff ? (
                              <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[9px]">
                                Top {formatConfig.playoffBestMatchesToKeep}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[9px] text-muted-foreground">
                                Scartata
                              </Badge>
                            )
                          ) : (
                            <Badge variant="secondary" className="text-[9px]">
                              RS
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
      </DialogContent>
    </Dialog>
  );
};

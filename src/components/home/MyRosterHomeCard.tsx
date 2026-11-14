import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowUpRight, Scissors, Users } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getPlayers } from "@/hooks/use-players";
import { getTeamCutPlayerIds } from "@/services/cutsService";
import {
  getNationalityFlag,
  getPlayerImage,
  getRoleColor,
  getValueColor,
  isRetiringSoon,
} from "@/utils/functions";
import { RetiringBadge } from "@/components/player/RetiringBadge";

const ROLE_ORDER: Record<string, number> = {
  POR: 0,
  DC: 1,
  TD: 2,
  TS: 3,
  CDC: 4,
  CC: 5,
  ED: 6,
  ES: 7,
  COC: 8,
  AD: 9,
  AS: 10,
  AT: 11,
  ATT: 12,
};

/**
 * Widget della Home Offseason (8 colonne) dedicato al riepilogo compatto del Roster societario.
 */
export const MyRosterHomeCard: React.FC = () => {
  const { user, effectiveTeam, effectiveTeamFullName } = useAuth();
  const teamId = effectiveTeam || user?.team || "";

  const { players: allPlayers, loading: loadingPlayers } = getPlayers(teamId || undefined);

  const { data: cutIds = [] } = useQuery<number[]>({
    queryKey: ["team_cuts_home", teamId],
    queryFn: () => getTeamCutPlayerIds(teamId),
    enabled: Boolean(teamId),
    staleTime: 30 * 1000,
  });

  const cutSet = useMemo(() => new Set(cutIds), [cutIds]);

  const sortedRoster = useMemo(() => {
    if (!teamId) return [];
    return [...allPlayers]
      .filter((p) => p.Squadra === teamId)
      .sort((a, b) => {
        const roleDiff = (ROLE_ORDER[a.Posiz] ?? 99) - (ROLE_ORDER[b.Posiz] ?? 99);
        if (roleDiff !== 0) return roleDiff;
        return (Number(b.OVR) || 0) - (Number(a.OVR) || 0);
      });
  }, [allPlayers, teamId]);

  const countsByDept = useMemo(() => {
    const active = sortedRoster.filter((p) => !cutSet.has(Number(p.ID)));
    const dept = { POR: 0, DIF: 0, CEN: 0, ATT: 0 };
    for (const p of active) {
      if (p.Posiz === "POR") dept.POR += 1;
      else if (["DC", "TD", "TS"].includes(p.Posiz)) dept.DIF += 1;
      else if (["CDC", "CC", "ED", "ES", "COC"].includes(p.Posiz)) dept.CEN += 1;
      else dept.ATT += 1;
    }
    return dept;
  }, [sortedRoster, cutSet]);

  return (
    <Card className="rounded-2xl border border-border/80 bg-card p-5 md:p-6 shadow-sm space-y-5 flex flex-col justify-between h-full">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
              <Users className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-bold text-base md:text-lg text-foreground truncate">
                  Il Mio Roster{effectiveTeamFullName ? ` • ${effectiveTeamFullName}` : ""}
                </h2>
                {teamId && cutSet.size > 0 && (
                  <Badge
                    variant="outline"
                    className="text-[10px] font-mono font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 flex items-center gap-1"
                  >
                    <Scissors className="h-2.5 w-2.5" />
                    {cutSet.size} {cutSet.size === 1 ? "Tagliato" : "Tagliati"}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {teamId
                  ? "Panoramica rosa attuale"
                  : "Accedi con la tua squadra per gestire il roster e i tagli offseason"}
              </p>
            </div>
          </div>

          <Link
            to={teamId ? "/mia-squadra/roster" : "/rose"}
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:opacity-80 flex items-center gap-1 transition-opacity shrink-0"
          >
            <span>{teamId ? "Gestisci Roster" : "Vedi Tutte le Rose"}</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Body */}
        {!user || !teamId ? (
          <div className="p-8 rounded-xl border border-dashed border-border bg-muted/20 text-center space-y-2">
            <Users className="h-8 w-8 text-muted-foreground/40 mx-auto" />
            <p className="text-xs text-muted-foreground">
              Effettua l'accesso per visualizzare qui i tuoi giocatori, gli OVR e i tagli programmati.
            </p>
          </div>
        ) : loadingPlayers ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-12 rounded-xl bg-muted/40 animate-pulse" />
            ))}
          </div>
        ) : sortedRoster.length === 0 ? (
          <div className="p-6 rounded-xl border border-dashed border-border text-center text-xs text-muted-foreground">
            Nessun giocatore attualmente a roster per {teamId}.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[265px] overflow-y-auto pr-1">
            {sortedRoster.map((player) => {
              const isCut = cutSet.has(Number(player.ID));
              const retiring = isRetiringSoon(player);

              return (
                <div
                  key={player.ID}
                  className={`p-2.5 rounded-xl border transition-colors flex items-center justify-between gap-2 ${
                    isCut
                      ? "bg-rose-500/5 border-rose-500/30 opacity-75"
                      : "bg-muted/20 hover:bg-muted/40 border-border/60"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar className="h-8 w-8 border border-border/60 shrink-0">
                      <AvatarImage src={getPlayerImage(player.ID)} alt={player.Cognome} />
                      <AvatarFallback className="text-[10px] font-bold">
                        {(player.Nome?.[0] || "") + (player.Cognome?.[0] || "")}
                      </AvatarFallback>
                    </Avatar>

                    <Badge
                      className={`${getRoleColor(
                        player.Posiz
                      )} text-[10px] font-bold px-1.5 py-0 h-5 shrink-0`}
                    >
                      {player.Posiz}
                    </Badge>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className={`text-xs font-bold truncate ${
                            isCut ? "line-through text-muted-foreground" : "text-foreground"
                          }`}
                        >
                          {player.Nome} {player.Cognome}
                        </span>
                        {retiring && <RetiringBadge variant="iconOnly" />}
                        {isCut && (
                          <Badge
                            variant="outline"
                            className="text-[9px] px-1 py-0 h-4 border-rose-500/40 text-rose-500 bg-rose-500/10 shrink-0"
                          >
                            Taglio
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <span>{player.Età}a</span>
                        {player.Nazionalità && (
                          <img
                            src={getNationalityFlag(player.Nazionalità)}
                            alt={player.Nazionalità}
                            title={player.Nazionalità}
                            className="h-3 w-4 object-cover rounded-[2px] border border-border/50"
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  <Badge
                    variant="outline"
                    className={`font-mono font-black text-xs px-2 py-0.5 shrink-0 ${getValueColor(
                      Number(player.OVR) || 0
                    )}`}
                  >
                    {player.OVR}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer reparti + azioni */}
      <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground border-t border-border/40">
        {teamId ? (
          <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
            <span className="px-2 py-0.5 rounded bg-muted/50 border border-border/60">
              POR: <strong className="text-foreground">{countsByDept.POR}</strong>
            </span>
            <span className="px-2 py-0.5 rounded bg-muted/50 border border-border/60">
              DIF: <strong className="text-foreground">{countsByDept.DIF}</strong>
            </span>
            <span className="px-2 py-0.5 rounded bg-muted/50 border border-border/60">
              CEN: <strong className="text-foreground">{countsByDept.CEN}</strong>
            </span>
            <span className="px-2 py-0.5 rounded bg-muted/50 border border-border/60">
              ATT: <strong className="text-foreground">{countsByDept.ATT}</strong>
            </span>
          </div>
        ) : (
          <span>Stagione Offseason LCSIM</span>
        )}
        <Link to="/mia-squadra/roster">
          <Button variant="ghost" size="sm" className="h-7 text-xs">
            Apri Scheda Roster &rarr;
          </Button>
        </Link>
      </div>
    </Card>
  );
};

import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeftRight, ArrowRight, CheckCircle2, Layers } from "lucide-react";
import { supabase } from "@/supabaseClient";
import { DRAFT_BOARD_TABLE } from "@/constants/App";
import { useAuth } from "@/context/AuthContext";
import { getTeamLogo, LCSIM_LOGO_SMALL } from "@/utils/functions";
import { DraftPickRow } from "@/pages/Draft";

/**
 * Fascia orizzontale compatta della Home Offseason con le scelte Draft possedute dalla squadra.
 */
export const OwnedPicksHomeCard: React.FC = () => {
  const { user, effectiveTeam, effectiveTeamFullName } = useAuth();
  const teamId = effectiveTeam || user?.team || "";

  const [picks, setPicks] = useState<DraftPickRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!teamId) {
      setPicks([]);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    supabase
      .from(DRAFT_BOARD_TABLE)
      .select(
        "*, rookie:an_rookie(ID, Nome, Cognome, Posiz, Squadra), player:an_player(ID, Nome, Cognome, Posiz, Squadra, OVR)"
      )
      .eq("team_id", teamId)
      .order("pick_overall", { ascending: true })
      .then(({ data, error }) => {
        if (!isMounted) return;
        if (error) {
          console.error("Errore caricamento scelte Draft possedute:", error);
          setPicks([]);
        } else {
          setPicks((data ?? []) as DraftPickRow[]);
        }
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [teamId]);

  const { availableCount, usedCount } = useMemo(() => {
    let available = 0;
    let used = 0;
    for (const pick of picks) {
      if (pick.rookie_id != null || pick.player_id != null) {
        used += 1;
      } else {
        available += 1;
      }
    }
    return { availableCount: available, usedCount: used };
  }, [picks]);

  if (!user || !teamId) {
    return (
      <Card className="rounded-2xl border border-border/80 bg-card p-4 md:px-6 md:py-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-foreground">
              Scelte Draft Possedute
            </h2>
            <p className="text-xs text-muted-foreground">
              Accedi con la tua squadra per visualizzare le tue scelte nel prossimo Draft LCSIM.
            </p>
          </div>
        </div>
        <Link to="/draft">
          <Button variant="outline" size="sm" className="h-8 text-xs font-bold gap-1.5">
            Apri Draft Board <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-r from-card via-card/95 to-amber-500/[0.04] p-4 md:px-6 md:py-4 shadow-md">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Sinistra: Logo + Titolo + Conteggio */}
        <div className="flex items-center gap-3 shrink-0 min-w-0">
          <div className="h-9 w-9 rounded-xl bg-muted/40 border border-border/60 p-1 flex items-center justify-center shrink-0">
            <img
              src={getTeamLogo(teamId)}
              alt={teamId}
              className="h-full w-full object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = LCSIM_LOGO_SMALL;
              }}
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 flex items-center gap-1">
                <Layers className="h-3 w-3" />
                Scelte Possedute
              </span>
              <Badge variant="outline" className="text-[10px] font-mono font-bold">
                {picks.length} {usedCount > 0 ? `(${availableCount} disp.)` : "tot."}
              </Badge>
            </div>
            <p className="text-xs font-bold text-foreground truncate mt-0.5">
              {effectiveTeamFullName || teamId}
            </p>
          </div>
        </div>

        {/* Centro: Pill compatte orizzontali delle scelte */}
        <div className="flex-1 flex flex-wrap items-center gap-1.5 min-w-0">
          {loading ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className="h-7 w-20 rounded-lg bg-muted/40 animate-pulse border border-border/50" />
            ))
          ) : picks.length === 0 ? (
            <span className="text-xs text-muted-foreground italic">
              Nessuna scelta Draft in possesso di {teamId}.
            </span>
          ) : (
            picks.map((pick) => {
              const drafted = pick.rookie || pick.player;
              const isUsed = pick.rookie_id != null || pick.player_id != null;
              const isAcquired = pick.original_team_id && pick.original_team_id !== teamId;

              return (
                <div
                  key={pick.pick_overall}
                  title={
                    isUsed && drafted
                      ? `Round ${pick.round} (#${pick.pick_overall}) • Scelto: ${drafted.Nome} ${drafted.Cognome}`
                      : `Round ${pick.round}.${pick.pick_in_round} (#${pick.pick_overall} assoluto)${
                          isAcquired ? ` • via ${pick.original_team_id}` : ""
                        }`
                  }
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs transition-colors ${
                    isUsed
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                      : isAcquired
                      ? "bg-amber-500/10 border-amber-500/30 text-foreground"
                      : "bg-muted/30 border-border/70 text-foreground"
                  }`}
                >
                  <span className="font-mono font-black text-[11px]">
                    R{pick.round} #{pick.pick_overall}
                  </span>
                  {isUsed && drafted ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold truncate max-w-[90px]">
                      <CheckCircle2 className="h-3 w-3 shrink-0" />
                      {drafted.Cognome}
                    </span>
                  ) : isAcquired ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-600 dark:text-amber-400">
                      <img
                        src={getTeamLogo(pick.original_team_id)}
                        alt={pick.original_team_id}
                        className="h-3 w-3 object-contain"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = "none";
                        }}
                      />
                      <span>{pick.original_team_id}</span>
                    </span>
                  ) : null}
                </div>
              );
            })
          )}
        </div>

        {/* Destra: Azioni rapide */}
        <div className="flex items-center gap-2 shrink-0">
          <Link to="/mia-squadra/trattative">
            <Button variant="outline" size="sm" className="h-8 px-2.5 text-xs font-bold gap-1">
              <ArrowLeftRight className="h-3.5 w-3.5 text-emerald-500" />
              <span>Scambia</span>
            </Button>
          </Link>
          <Link to="/draft">
            <Button
              size="sm"
              className="h-8 px-3 text-xs font-bold gap-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl"
            >
              <span>Draft Board</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
};

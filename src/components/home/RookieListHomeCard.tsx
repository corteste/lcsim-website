import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Compass, Sparkles } from "lucide-react";
import { supabase } from "@/supabaseClient";
import { ROOKIE_SCOUTING_TABLE, ROOKIE_TABLE } from "@/constants/App";
import { useAuth } from "@/context/AuthContext";
import { Player } from "@/types/player";
import { getNationalityFlag, getRoleColor } from "@/utils/functions";
import { getTierBadgeStyle } from "@/utils/scoutingConfig";
import { renderStars } from "@/components/scouting/StarRating";

/**
 * Widget della Home Offseason (4 colonne) dedicato alla lista compatta dei migliori Rookie disponibili.
 */
export const RookieListHomeCard: React.FC = () => {
  const { user, effectiveTeam } = useAuth();
  const teamId = user ? effectiveTeam || user.team || "" : "";

  const [rookies, setRookies] = useState<Player[]>([]);
  const [scoutingByRookie, setScoutingByRookie] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    async function loadRookies() {
      try {
        const rookiesQuery = teamId
          ? supabase.rpc("rpc_get_scouted_rookies", { p_team_id: teamId })
          : supabase.from(ROOKIE_TABLE).select("ID, Nome, Cognome, Età, Nazionalità, Posiz, Squadra, Stelle");

        const scoutingPromise = teamId
          ? supabase
              .from(ROOKIE_SCOUTING_TABLE)
              .select("rookie_id, tokens_spent")
              .eq("team_id", teamId)
          : Promise.resolve({ data: [] as { rookie_id: number; tokens_spent: number }[], error: null });

        const [rkRes, scRes] = await Promise.all([rookiesQuery, scoutingPromise]);
        if (!isMounted) return;

        if (!rkRes.error && rkRes.data) {
          setRookies(rkRes.data as Player[]);
        } else {
          setRookies([]);
        }

        const map: Record<number, number> = {};
        if (!scRes.error && scRes.data) {
          for (const row of scRes.data as { rookie_id: number; tokens_spent: number }[]) {
            map[Number(row.rookie_id)] = Number(row.tokens_spent) || 0;
          }
        }
        setScoutingByRookie(map);
      } catch (err) {
        console.error("Errore caricamento Rookie Home:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadRookies();
    return () => {
      isMounted = false;
    };
  }, [teamId]);

  const sortedAvailableRookies = useMemo(() => {
    return rookies
      .filter((r) => !r.Squadra)
      .sort((a, b) => {
        const tokensA = scoutingByRookie[Number(a.ID)] ?? 0;
        const tokensB = scoutingByRookie[Number(b.ID)] ?? 0;
        const hasOvrA = tokensA >= 5 && a.OVR !== null && a.OVR !== undefined;
        const hasOvrB = tokensB >= 5 && b.OVR !== null && b.OVR !== undefined;

        if (hasOvrA && hasOvrB) {
          const diff = (Number(b.OVR) || 0) - (Number(a.OVR) || 0);
          if (diff !== 0) return diff;
        }

        const starsDiff = (Number(b.Stelle) || 0) - (Number(a.Stelle) || 0);
        if (starsDiff !== 0) return starsDiff;

        if (hasOvrA || hasOvrB) {
          const ovrA = hasOvrA ? Number(a.OVR) || 0 : 0;
          const ovrB = hasOvrB ? Number(b.OVR) || 0 : 0;
          if (ovrB !== ovrA) return ovrB - ovrA;
        }

        if (tokensB !== tokensA) return tokensB - tokensA;
        return Number(a.ID) - Number(b.ID);
      });
  }, [rookies, scoutingByRookie]);

  const scoutedCount = useMemo(
    () => sortedAvailableRookies.filter((r) => (scoutingByRookie[Number(r.ID)] ?? 0) > 0).length,
    [sortedAvailableRookies, scoutingByRookie]
  );

  return (
    <Card className="rounded-2xl border border-border/80 bg-card p-5 md:p-6 shadow-sm space-y-4 flex flex-col justify-between h-full">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base text-foreground truncate">
                  Classe Rookie
                </h2>
                <Badge
                  variant="outline"
                  className="text-[10px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 shrink-0"
                >
                  {sortedAvailableRookies.length}
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground truncate">
                Top prospetti per stelle{teamId ? ` • ${scoutedCount} osservati` : ""}
              </p>
            </div>
          </div>

          <Link
            to="/mia-squadra/scouting"
            className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:opacity-80 flex items-center gap-1 shrink-0"
          >
            <Compass className="h-3.5 w-3.5" />
            <span>Scouting</span>
          </Link>
        </div>

        {/* Lista compatta scrollabile */}
        {loading ? (
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-11 rounded-xl bg-muted/40 animate-pulse" />
            ))}
          </div>
        ) : sortedAvailableRookies.length === 0 ? (
          <div className="p-6 rounded-xl border border-dashed border-border text-center text-xs text-muted-foreground">
            Nessun rookie disponibile al momento.
          </div>
        ) : (
          <div className="space-y-2 max-h-[265px] overflow-y-auto pr-1">
            {sortedAvailableRookies.map((rookie) => {
              const tokens = scoutingByRookie[Number(rookie.ID)] ?? 0;
              const showExactOvr = tokens >= 5 && rookie.OVR !== null && rookie.OVR !== undefined;

              return (
                <div
                  key={rookie.ID}
                  className="p-2.5 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Badge
                      className={`${getRoleColor(
                        rookie.Posiz
                      )} text-[10px] font-bold px-1.5 py-0 h-5 shrink-0`}
                    >
                      {rookie.Posiz}
                    </Badge>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">
                        {rookie.Nome} {rookie.Cognome}
                      </p>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <span>{rookie.Età}a</span>
                        {rookie.Nazionalità && (
                          <img
                            src={getNationalityFlag(rookie.Nazionalità)}
                            alt={rookie.Nazionalità}
                            title={rookie.Nazionalità}
                            className="h-3 w-4 object-cover rounded-[2px] border border-border/50"
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {tokens > 0 && (
                      <Badge
                        variant="outline"
                        className={`text-[9px] font-mono px-1.5 py-0 shrink-0 ${getTierBadgeStyle(
                          tokens
                        )}`}
                      >
                        {tokens}G
                      </Badge>
                    )}
                    {showExactOvr ? (
                      <Badge
                        variant="outline"
                        className="font-mono font-black text-[10px] px-1.5 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                      >
                        OVR {rookie.OVR}
                      </Badge>
                    ) : rookie.Stelle ? (
                      <span className="flex items-center text-amber-500">
                        {renderStars(rookie.Stelle, "h-3 w-3")}
                      </span>
                    ) : (
                      <Badge variant="outline" className="text-[9px] font-mono px-1 py-0">
                        1-5⭐
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="pt-2 flex items-center justify-between text-xs text-muted-foreground border-t border-border/40">
        <Link to="/mia-squadra/scouting" className="hover:text-foreground font-semibold transition-colors">
          Sala Scouting
        </Link>
        <Link to="/draft">
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
            Vai al Draft <ArrowRight className="h-3 w-3" />
          </Button>
        </Link>
      </div>
    </Card>
  );
};

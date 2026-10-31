import { SUPABASE_STORAGE_URL } from "@/constants/App";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  MapPin,
  Swords,
  ChevronRight,
  Sparkles,
  Layers,
  Activity,
  ShieldAlert,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  findNextOpponentMatch,
  fetchOpponentScoutData,
  OpponentMatchInfo,
  OpponentScoutData,
} from "@/services/opponentScoutService";

export const NextOpponentCard: React.FC = () => {
  const navigate = useNavigate();
  const { user, effectiveTeam, effectiveTeamFullName } = useAuth();

  const [matchInfo, setMatchInfo] = useState<OpponentMatchInfo | null>(null);
  const [scoutData, setScoutData] = useState<OpponentScoutData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const teamId = effectiveTeam || user?.team || "";

  useEffect(() => {
    if (!teamId) {
      setMatchInfo(null);
      setScoutData(null);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    async function loadOpponent() {
      try {
        const next = await findNextOpponentMatch(teamId);
        if (!isMounted) return;
        setMatchInfo(next);

        if (next?.opponentTeamId) {
          const scout = await fetchOpponentScoutData(next.opponentTeamId);
          if (isMounted) {
            setScoutData(scout);
          }
        }
      } catch (err) {
        console.error("Error loading next opponent for home:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadOpponent();

    return () => {
      isMounted = false;
    };
  }, [teamId]);

  // Non mostrare nulla se l'utente non è autenticato o non ha una squadra
  if (!user || !teamId) return null;

  if (loading) {
    return (
      <div className="rounded-2xl border border-border/80 bg-card p-5 animate-pulse flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-muted" />
          <div className="space-y-2">
            <div className="h-3 w-32 bg-muted rounded" />
            <div className="h-5 w-48 bg-muted rounded" />
          </div>
        </div>
        <div className="h-8 w-28 bg-muted rounded" />
      </div>
    );
  }

  if (!matchInfo) return null;

  return (
    <Card
      onClick={() => navigate("/prossimo-avversario")}
      className="group relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-r from-card via-card/95 to-emerald-500/[0.04] p-5 md:p-6 shadow-md hover:border-emerald-500/50 hover:shadow-lg transition-all cursor-pointer"
    >
        {/* Glow ambient background on hover */}
        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-44 h-44 rounded-full bg-emerald-500/10 blur-2xl group-hover:bg-emerald-500/20 transition-all pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          {/* Top Label & Matchday */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                <Swords className="h-3 w-3" />
                Prossimo Incontro • Giornata {matchInfo.week}
              </span>
              <Badge variant="outline" className="text-[10px] font-mono">
                {matchInfo.isHome ? "Partita in Casa" : "Partita in Trasferta"}
              </Badge>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3 text-muted-foreground/70" />
                {matchInfo.stadium}
              </span>
              {matchInfo.date && (
                <>
                  <span>•</span>
                  <span>{matchInfo.date}</span>
                </>
              )}
            </div>
          </div>

          {/* Showdown Teams Micro-Bar */}
          <div className="flex items-center justify-center gap-3 sm:gap-6 bg-muted/30 p-3 sm:px-6 sm:py-2.5 rounded-2xl border border-border/60 shadow-inner">
            {/* My Team */}
            <div className="flex items-center gap-2.5">
              <img
                src={`${SUPABASE_STORAGE_URL}/images/teams/${teamId}_Logo.png`}
                alt={teamId}
                className="h-10 w-10 object-contain filter drop-shadow shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `${SUPABASE_STORAGE_URL}/images/LCSIM_Logo_SMALL.png`;
                }}
              />
              <div className="text-left hidden sm:block">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  La Tua Squadra
                </span>
                <span className="text-xs font-black text-foreground">
                  {effectiveTeamFullName || user?.teamFullName || teamId}
                </span>
              </div>
            </div>

            {/* VS Badge */}
            <div className="flex flex-col items-center px-1">
              <span className="font-mono font-black text-xs text-emerald-600 dark:text-emerald-400 tracking-wider">
                VS
              </span>
            </div>

            {/* Opponent Team */}
            <div className="flex items-center gap-2.5">
              <div className="text-right hidden sm:block">
                <div className="flex items-center justify-end gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Avversaria
                  </span>
                  {scoutData?.standings && (
                    <Badge variant="secondary" className="text-[9px] px-1 py-0 font-mono">
                      {scoutData.standings.rank}°
                    </Badge>
                  )}
                </div>
                <span className="text-xs font-black text-foreground">
                  {matchInfo.opponentTeamName}
                </span>
              </div>
              <img
                src={`${SUPABASE_STORAGE_URL}/images/teams/${matchInfo.opponentTeamId}_Logo.png`}
                alt={matchInfo.opponentTeamName}
                className="h-10 w-10 object-contain filter drop-shadow shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `${SUPABASE_STORAGE_URL}/images/LCSIM_Logo_SMALL.png`;
                }}
              />
            </div>
          </div>

          {/* Action Callout & Form Pills */}
          <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-start sm:items-center md:items-end lg:items-center gap-3">
            {/* Form pills */}
            {scoutData?.form && scoutData.form.length > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase mr-1">
                  Forma:
                </span>
                {scoutData.form.slice(0, 5).map((res, i) => (
                  <span
                    key={i}
                    className={`h-5 w-5 rounded-full text-[9px] font-mono font-black flex items-center justify-center text-white shadow-2xs ${
                      res === "V"
                        ? "bg-emerald-600"
                        : res === "N"
                        ? "bg-amber-500"
                        : "bg-rose-600"
                    }`}
                  >
                    {res}
                  </span>
                ))}
              </div>
            )}

            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                navigate("/prossimo-avversario");
              }}
              className="h-9 px-3.5 text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md group-hover:scale-[1.02] transition-transform"
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Report Completo Avversaria</span>
              <ChevronRight className="h-4 w-4 ml-0.5" />
            </Button>
          </div>
        </div>
      </Card>
  );
};

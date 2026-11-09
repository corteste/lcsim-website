import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Trophy, Crown, ArrowRight, Loader2 } from "lucide-react";
import { SUPABASE_STORAGE_URL } from "@/constants/App";
import { getRoleColor, getPlayerImage } from "@/utils/functions";
import { fetchAvailableTotwWeeks, fetchTotwForWeek, TotwResult } from "@/services/totwService";

export function TotwHomeCard() {
  const [totwData, setTotwData] = useState<TotwResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isCancelled = false;

    async function loadLatestTotw() {
      setIsLoading(true);
      try {
        // First try Season 11
        let targetSeason = 11;
        let weeks = await fetchAvailableTotwWeeks(targetSeason);
        
        // If Season 11 has no completed weeks, fall back to Season 10
        if (weeks.length === 0) {
          targetSeason = 10;
          weeks = await fetchAvailableTotwWeeks(targetSeason);
        }

        if (weeks.length > 0) {
          const latestWeek = weeks[weeks.length - 1];
          const result = await fetchTotwForWeek(targetSeason, latestWeek);
          if (!isCancelled) {
            setTotwData(result);
          }
        }
      } catch (err) {
        console.error("Errore caricamento TOTW Home Card:", err);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    loadLatestTotw();
    return () => {
      isCancelled = true;
    };
  }, []);

  if (isLoading) {
    return (
      <Card className="rounded-2xl border border-border/80 bg-card p-5 md:p-6 shadow-sm flex items-center justify-center h-full min-h-[280px]">
        <div className="flex flex-col items-center gap-2 text-muted-foreground text-xs">
          <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
          <span>Caricamento Squadra della Settimana...</span>
        </div>
      </Card>
    );
  }

  if (!totwData || totwData.players.length === 0) {
    return null;
  }

  const { mvp, week, season, players } = totwData;

  return (
    <Card className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-card via-card/95 to-amber-950/10 p-5 md:p-6 shadow-sm hover:border-amber-500/50 transition-all duration-300 h-full flex flex-col justify-between">
      {/* Ambient background glow */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-56 h-56 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

      {/* HEADER */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <Star className="h-5 w-5 fill-amber-400 text-amber-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 font-mono">
                Team of the Week • 4-3-3
              </span>
              <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-amber-500/30 text-amber-600 dark:text-amber-400">
                Stag. {season}
              </Badge>
            </div>
            <h2 className="font-extrabold text-base md:text-lg text-foreground flex items-center gap-2">
              Top 11 — Giornata {week}
            </h2>
          </div>
        </div>

        <Link
          to={`/statistiche?tab=totw`}
          className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:text-amber-500 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all group"
        >
          <Trophy className="h-3.5 w-3.5 text-amber-500" />
          <span>Vedi Formazione 2D</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* BODY CONTENT: MVP SPOTLIGHT + 11 AVATARS STRIP */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-4 items-center flex-1 my-auto">
        {/* MVP Spotlight Banner (5 cols) */}
        {mvp ? (
          <div className="md:col-span-5 p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 backdrop-blur-sm flex items-center gap-3.5 h-full">
            <div className="relative shrink-0">
              <div className="h-16 w-16 rounded-full overflow-hidden bg-slate-950 border-2 border-amber-400 ring-4 ring-amber-400/30">
                <img
                  src={getPlayerImage(mvp.id)}
                  alt={mvp.surname}
                  className="h-full w-full object-cover object-top"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `${SUPABASE_STORAGE_URL}/images/players/MConti.png`;
                  }}
                />
              </div>
              <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-amber-500 text-slate-950 shadow-md">
                <Crown className="h-3.5 w-3.5 fill-slate-950" />
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300">
                  MVP di Giornata
                </span>
                <Badge variant="outline" className={`text-[9px] px-1 py-0 ${getRoleColor(mvp.position)}`}>
                  {mvp.position}
                </Badge>
              </div>
              <h3 className="text-sm font-black text-foreground truncate mt-0.5">
                {mvp.fullName}
              </h3>
              <p className="text-[11px] text-muted-foreground truncate">
                {mvp.teamName || mvp.team} • OVR {mvp.ovr}
              </p>
            </div>

            <div className="text-right shrink-0">
              <span className="text-2xl font-black font-mono text-amber-500 block leading-tight">
                {mvp.vote.toFixed(1)}
              </span>
              <span className="text-[9px] font-bold uppercase text-muted-foreground">
                Voto
              </span>
            </div>
          </div>
        ) : (
          <div className="md:col-span-5 text-xs text-muted-foreground">
            Top 11 calcolata con successo
          </div>
        )}

        {/* 11 Players Compact Visual Grid (7 cols) */}
        <div className="md:col-span-7 flex flex-wrap items-center justify-between gap-1.5 p-3 rounded-xl bg-muted/30 border border-border/40 h-full">
          {players.map((p) => (
            <div
              key={p.id}
              className="flex flex-col items-center text-center group cursor-pointer"
              title={`${p.fullName} (${p.position}) - Voto ${p.vote}`}
            >
              <div
                className={`relative h-9 w-9 sm:h-10 sm:w-10 rounded-full overflow-hidden bg-slate-950 border transition-all ${
                  p.isMvp
                    ? "border-amber-400 ring-2 ring-amber-400/50"
                    : "border-border/80 group-hover:border-amber-400"
                }`}
              >
                <img
                  src={getPlayerImage(p.id)}
                  alt={p.surname}
                  className="h-full w-full object-cover object-top"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `${SUPABASE_STORAGE_URL}/images/players/MConti.png`;
                  }}
                />
              </div>
              <span className="text-[9px] font-mono font-bold text-foreground truncate max-w-[46px] leading-tight mt-1">
                {p.surname}
              </span>
              <span className="text-[9px] font-mono text-amber-500 font-extrabold leading-none mt-0.5">
                {p.vote.toFixed(1)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

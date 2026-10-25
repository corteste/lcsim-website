import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Newspaper, Mic2, Flame, ArrowRight, Sparkles, Clock } from "lucide-react";
import {
  fetchPressConferences,
  fetchMarketRumors,
  PressConference,
  MarketRumor,
} from "@/services/aiJournalistService";

interface PressAndRumorsHomeCardProps {
  className?: string;
  layout?: "stacked" | "side-by-side";
}

export const PressAndRumorsHomeCard: React.FC<PressAndRumorsHomeCardProps> = ({
  className = "",
  layout = "side-by-side",
}) => {
  const [latestConference, setLatestConference] = useState<PressConference | null>(null);
  const [latestRumor, setLatestRumor] = useState<MarketRumor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const [press, rumors] = await Promise.all([
          fetchPressConferences(undefined, 11),
          fetchMarketRumors(3),
        ]);
        if (isMounted) {
          const answered = press.find((p) => p.status === "ANSWERED") || null;
          setLatestConference(answered);
          setLatestRumor(rumors[0] || null);
        }
      } catch (e) {
        console.error("Errore caricamento widget home Sala Stampa:", e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const isStacked = layout === "stacked";

  return (
    <Card className={`border border-border/80 bg-card shadow-sm overflow-hidden flex flex-col justify-between ${className}`}>
      <CardHeader className="py-3 px-4 sm:px-5 border-b border-border/60 bg-muted/20 flex flex-row items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
            <Newspaper className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-xs sm:text-sm font-bold flex items-center gap-2 truncate">
              <span>LCSIM Media & Sala Stampa</span>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            </CardTitle>
            <p className="text-[10px] text-muted-foreground truncate hidden sm:block">
              Dichiarazioni ufficiali e indiscrezioni del Giornalista AI
            </p>
          </div>
        </div>

        <Link to="/sala-stampa" className="shrink-0">
          <Button variant="ghost" size="sm" className="h-7 text-[11px] gap-1 text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 font-bold px-2">
            Apri <ArrowRight className="h-3 w-3" />
          </Button>
        </Link>
      </CardHeader>

      <CardContent className={`p-3.5 sm:p-4 flex-1 flex flex-col justify-between ${
        isStacked ? "space-y-3" : "grid grid-cols-1 sm:grid-cols-2 gap-3"
      }`}>
        {/* Blocco 1: Sala Stampa */}
        <div className={`p-3 sm:p-3.5 rounded-xl bg-muted/30 border border-border/70 flex flex-col justify-between space-y-2 ${
          isStacked ? "flex-1 min-h-[120px]" : "min-h-[145px]"
        }`}>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-bold flex items-center gap-1 py-0 px-1.5">
                <Mic2 className="h-2.5 w-2.5" />
                Sala Stampa
              </Badge>
              {latestConference && (
                <span className="text-[10px] font-mono text-muted-foreground font-bold">
                  G{latestConference.matchday}
                </span>
              )}
            </div>

            {loading ? (
              <p className="text-xs text-muted-foreground italic py-1">Caricamento...</p>
            ) : latestConference ? (
              <div>
                <p className="text-xs font-bold text-foreground line-clamp-1">
                  {latestConference.team?.NAME || latestConference.team_id}
                  <span className="text-muted-foreground font-normal ml-1">
                    ({latestConference.manager_name || latestConference.team?.MANAGER || "Presidente"})
                  </span>
                </p>
                <p className="text-xs italic text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                  "{latestConference.answer || latestConference.question}"
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic py-1">
                Nessuna dichiarazione recente registrata.
              </p>
            )}
          </div>

          <Link to="/sala-stampa" className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 pt-0.5">
            Tutte le interviste &rarr;
          </Link>
        </div>

        {/* Blocco 2: Gossip di Mercato */}
        <div className={`p-3 sm:p-3.5 rounded-xl bg-muted/30 border border-border/70 flex flex-col justify-between space-y-2 ${
          isStacked ? "flex-1 min-h-[120px]" : "min-h-[145px]"
        }`}>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-[9px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-bold flex items-center gap-1 py-0 px-1.5">
                <Flame className="h-2.5 w-2.5 text-amber-500" />
                Gossip AI
              </Badge>
              {latestRumor && (
                <Badge variant="outline" className="text-[9px] font-mono py-0 px-1.5">
                  {latestRumor.credibility_badge}
                </Badge>
              )}
            </div>

            {loading ? (
              <p className="text-xs text-muted-foreground italic py-1">Caricamento...</p>
            ) : latestRumor ? (
              <div>
                <p className="text-xs font-bold text-foreground line-clamp-1">
                  {latestRumor.headline}
                </p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                  {latestRumor.content}
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic py-1">
                Nessun rumor recente. Entra in Sala Stampa!
              </p>
            )}
          </div>

          <Link to="/sala-stampa" className="text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 pt-0.5">
            Leggi le indiscrezioni &rarr;
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

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

export const PressAndRumorsHomeCard: React.FC = () => {
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

  return (
    <Card className="border border-border/80 bg-gradient-to-br from-card via-card/95 to-muted/30 shadow-md overflow-hidden">
      <CardHeader className="py-4 px-6 border-b border-border/60 bg-muted/10 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
            <Newspaper className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-sm md:text-base font-bold flex items-center gap-2">
              LCSIM Media & Sala Stampa
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </CardTitle>
            <p className="text-[11px] text-muted-foreground">
              Dichiarazioni ufficiali dei presidenti e indiscrezioni del Giornalista AI
            </p>
          </div>
        </div>

        <Link to="/sala-stampa">
          <Button variant="ghost" size="sm" className="h-8 text-xs gap-1 text-primary hover:text-primary font-bold">
            Apri Sala Stampa <ArrowRight className="h-3 w-3" />
          </Button>
        </Link>
      </CardHeader>

      <CardContent className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Blocco 1: Sala Stampa */}
        <div className="p-4 rounded-xl bg-background/60 border border-border/70 flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20 font-bold flex items-center gap-1">
                <Mic2 className="h-3 w-3" />
                Sala Stampa
              </Badge>
              {latestConference && (
                <span className="text-[10px] font-mono text-muted-foreground font-bold">
                  Giornata {latestConference.matchday}
                </span>
              )}
            </div>

            {loading ? (
              <p className="text-xs text-muted-foreground italic py-2">Caricamento...</p>
            ) : latestConference ? (
              <div>
                <p className="text-xs font-bold text-foreground">
                  {latestConference.team?.NAME || latestConference.team_id}
                  <span className="text-muted-foreground font-normal ml-1">
                    ({latestConference.manager_name || latestConference.team?.MANAGER || "Presidente"})
                  </span>
                </p>
                <p className="text-xs italic text-muted-foreground mt-1 line-clamp-3">
                  "{latestConference.answer || latestConference.question}"
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic py-2">
                Nessuna dichiarazione recente registrata.
              </p>
            )}
          </div>

          <Link to="/sala-stampa" className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1">
            Tutte le interviste dei 12 club &rarr;
          </Link>
        </div>

        {/* Blocco 2: Gossip di Mercato */}
        <div className="p-4 rounded-xl bg-background/60 border border-border/70 flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20 font-bold flex items-center gap-1">
                <Flame className="h-3 w-3 text-amber-500" />
                Gossip del Giornalista AI
              </Badge>
              {latestRumor && (
                <Badge variant="outline" className="text-[10px] font-mono">
                  {latestRumor.credibility_badge}
                </Badge>
              )}
            </div>

            {loading ? (
              <p className="text-xs text-muted-foreground italic py-2">Caricamento...</p>
            ) : latestRumor ? (
              <div>
                <p className="text-xs font-bold text-foreground line-clamp-1">
                  {latestRumor.headline}
                </p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {latestRumor.content}
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic py-2">
                Nessun rumor recente. Entra in Sala Stampa per consultare le indiscrezioni di mercato!
              </p>
            )}
          </div>

          <Link to="/sala-stampa" className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1">
            Leggi le indiscrezioni complete &rarr;
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

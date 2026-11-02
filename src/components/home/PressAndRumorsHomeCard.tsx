import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Newspaper,
  Mic2,
  Flame,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
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
  const [conferences, setConferences] = useState<PressConference[]>([]);
  const [rumors, setRumors] = useState<MarketRumor[]>([]);
  const [pressIndex, setPressIndex] = useState(0);
  const [rumorIndex, setRumorIndex] = useState(0);
  const [isPressPaused, setIsPressPaused] = useState(false);
  const [isRumorPaused, setIsRumorPaused] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const [press, rumorsData] = await Promise.all([
          fetchPressConferences(undefined, 11, true),
          fetchMarketRumors(10),
        ]);
        if (isMounted) {
          const answered = press.filter((p) => p.status === "ANSWERED");
          setConferences(answered.slice(0, 8));
          setRumors(rumorsData.slice(0, 8));
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

  // Timer automatico carosello Sala Stampa (30s)
  useEffect(() => {
    if (conferences.length <= 1 || isPressPaused) return;

    const timer = setInterval(() => {
      setPressIndex((prev) => (prev + 1) % conferences.length);
    }, 30000);

    return () => clearInterval(timer);
  }, [conferences.length, isPressPaused, pressIndex]);

  // Timer automatico carosello Notizie di Mercato (30s)
  useEffect(() => {
    if (rumors.length <= 1 || isRumorPaused) return;

    const timer = setInterval(() => {
      setRumorIndex((prev) => (prev + 1) % rumors.length);
    }, 30000);

    return () => clearInterval(timer);
  }, [rumors.length, isRumorPaused, rumorIndex]);

  const handlePrevPress = () => {
    if (conferences.length <= 1) return;
    setPressIndex((prev) => (prev - 1 + conferences.length) % conferences.length);
  };

  const handleNextPress = () => {
    if (conferences.length <= 1) return;
    setPressIndex((prev) => (prev + 1) % conferences.length);
  };

  const handlePrevRumor = () => {
    if (rumors.length <= 1) return;
    setRumorIndex((prev) => (prev - 1 + rumors.length) % rumors.length);
  };

  const handleNextRumor = () => {
    if (rumors.length <= 1) return;
    setRumorIndex((prev) => (prev + 1) % rumors.length);
  };

  const currentPress = conferences[pressIndex] || null;
  const currentRumor = rumors[rumorIndex] || null;
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
              Dichiarazioni ufficiali e indiscrezioni di mercato.
            </p>
          </div>
        </div>

        <Link to="/sala-stampa" className="shrink-0">
          <Button variant="ghost" size="sm" className="h-7 text-[11px] gap-1 text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 font-bold px-2">
            Apri <ArrowRight className="h-3 w-3" />
          </Button>
        </Link>
      </CardHeader>

      <CardContent
        className={`p-3.5 sm:p-4 flex-1 flex flex-col justify-between ${
          isStacked ? "space-y-3" : "grid grid-cols-1 sm:grid-cols-2 gap-3"
        }`}
      >
        {/* Blocco 1: Sala Stampa */}
        <div
          onMouseEnter={() => setIsPressPaused(true)}
          onMouseLeave={() => setIsPressPaused(false)}
          className={`p-3.5 sm:p-4 rounded-xl bg-muted/30 border border-border/70 flex flex-col justify-between space-y-2 relative transition-all ${
            isStacked ? "flex-1 min-h-[160px]" : "min-h-[160px]"
          }`}
        >
          <div className="space-y-2 flex-1 min-h-0 flex flex-col">
            <div className="flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-1.5">
                <Badge
                  variant="outline"
                  className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-bold flex items-center gap-1 py-0 px-1.5"
                >
                  <Mic2 className="h-2.5 w-2.5" />
                  Sala Stampa
                </Badge>
                {currentPress?.matchday && (
                  <span className="text-[10px] font-mono text-muted-foreground/80">
                    G{currentPress.matchday}
                  </span>
                )}
              </div>

              {/* Controlli manuali carosello */}
              {conferences.length > 1 && (
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-mono text-muted-foreground/70 mr-0.5">
                    {pressIndex + 1}/{conferences.length}
                  </span>
                  <button
                    type="button"
                    onClick={handlePrevPress}
                    className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                    title="Dichiarazione precedente"
                    aria-label="Precedente"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextPress}
                    className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                    title="Dichiarazione successiva"
                    aria-label="Successiva"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            {loading ? (
              <p className="text-xs text-muted-foreground italic py-1">Caricamento...</p>
            ) : currentPress ? (
              <div key={currentPress.id || pressIndex} className="animate-in fade-in duration-300 flex-1 min-h-0 flex flex-col justify-start">
                <p className="text-xs sm:text-[13px] font-bold text-foreground line-clamp-1">
                  {currentPress.team?.NAME || currentPress.team_id}
                  <span className="text-muted-foreground font-normal ml-1">
                    ({currentPress.manager_name || currentPress.team?.MANAGER || "Presidente"})
                  </span>
                </p>
                <p className="text-xs sm:text-[13px] italic text-muted-foreground mt-1.5 line-clamp-4 lg:line-clamp-5 leading-relaxed">
                  "{currentPress.answer || currentPress.question}"
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic py-1">
                Nessuna dichiarazione recente registrata.
              </p>
            )}
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-border/40 shrink-0">
            <Link
              to="/sala-stampa"
              className="text-[10px] sm:text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              Tutte le interviste &rarr;
            </Link>

            {/* Indicatori a pallini */}
            {conferences.length > 1 && (
              <div className="flex items-center gap-1">
                {conferences.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPressIndex(idx)}
                    className={`h-1.5 rounded-full transition-all ${
                      idx === pressIndex
                        ? "w-4 bg-emerald-500"
                        : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                    }`}
                    title={`Vai a dichiarazione ${idx + 1}`}
                    aria-label={`Dichiarazione ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Blocco 2: Gossip di Mercato */}
        <div
          onMouseEnter={() => setIsRumorPaused(true)}
          onMouseLeave={() => setIsRumorPaused(false)}
          className={`p-3.5 sm:p-4 rounded-xl bg-muted/30 border border-border/70 flex flex-col justify-between space-y-2 relative transition-all ${
            isStacked ? "flex-1 min-h-[160px]" : "min-h-[160px]"
          }`}
        >
          <div className="space-y-2 flex-1 min-h-0 flex flex-col">
            <div className="flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-1.5">
                <Badge
                  variant="outline"
                  className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-bold flex items-center gap-1 py-0 px-1.5"
                >
                  <Flame className="h-2.5 w-2.5 text-amber-500" />
                  Ultime Notizie
                </Badge>
              </div>

              {/* Controlli manuali carosello */}
              {rumors.length > 1 && (
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-mono text-muted-foreground/70 mr-0.5">
                    {rumorIndex + 1}/{rumors.length}
                  </span>
                  <button
                    type="button"
                    onClick={handlePrevRumor}
                    className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                    title="Notizia precedente"
                    aria-label="Precedente"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextRumor}
                    className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                    title="Notizia successiva"
                    aria-label="Successiva"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            {loading ? (
              <p className="text-xs text-muted-foreground italic py-1">Caricamento...</p>
            ) : currentRumor ? (
              <div key={currentRumor.id || rumorIndex} className="animate-in fade-in duration-300 flex-1 min-h-0 flex flex-col justify-start">
                <p className="text-xs sm:text-[13px] font-bold text-foreground line-clamp-2 leading-snug">
                  {currentRumor.headline}
                </p>
                <p className="text-xs sm:text-[13px] text-muted-foreground mt-1.5 line-clamp-4 lg:line-clamp-5 leading-relaxed">
                  {currentRumor.content}
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic py-1">
                Nessun rumor recente. Entra in Sala Stampa!
              </p>
            )}
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-border/40 shrink-0">
            <Link
              to="/sala-stampa"
              className="text-[10px] sm:text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
            >
              Leggi le indiscrezioni &rarr;
            </Link>

            {/* Indicatori a pallini */}
            {rumors.length > 1 && (
              <div className="flex items-center gap-1">
                {rumors.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setRumorIndex(idx)}
                    className={`h-1.5 rounded-full transition-all ${
                      idx === rumorIndex
                        ? "w-4 bg-amber-500"
                        : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                    }`}
                    title={`Vai a notizia ${idx + 1}`}
                    aria-label={`Notizia ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

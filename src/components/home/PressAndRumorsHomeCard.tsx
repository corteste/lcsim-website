import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Inbox,
  Mic2,
  Flame,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Swords,
  ArrowLeftRight,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { fetchInboxFeed, InboxItem } from "@/services/inboxService";
import { getTeamLogo } from "@/utils/functions";

interface PressAndRumorsHomeCardProps {
  className?: string;
  layout?: "stacked" | "side-by-side";
}

export const PressAndRumorsHomeCard: React.FC<PressAndRumorsHomeCardProps> = ({
  className = "",
}) => {
  const { effectiveTeam, isAdmin } = useAuth();
  const [items, setItems] = useState<InboxItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const feed = await fetchInboxFeed({
          teamId: effectiveTeam,
          isAdmin,
          season: 11,
        });
        if (isMounted) {
          // Mostra le prime 10 notizie più rilevanti dell'inbox
          setItems(feed.slice(0, 10));
        }
      } catch (e) {
        console.error("Errore caricamento widget home Inbox:", e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [effectiveTeam, isAdmin]);

  // Rotazione automatica carosello (ogni 10 secondi, con pausa on hover)
  useEffect(() => {
    if (items.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 10000);

    return () => clearInterval(timer);
  }, [items.length, isPaused, currentIndex]);

  const handlePrev = () => {
    if (items.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const handleNext = () => {
    if (items.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  const currentItem = items[currentIndex] || null;

  // Altre notizie da mostrare nel mini-feed inferiore per riempire ed ottimizzare lo spazio
  const otherRecentItems = useMemo(() => {
    return items.filter((_, idx) => idx !== currentIndex).slice(0, 2);
  }, [items, currentIndex]);

  // Icona categoria dinamica
  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case "press":
        return <Mic2 className="h-3.5 w-3.5" />;
      case "rumors":
        return <Flame className="h-3.5 w-3.5" />;
      case "preview":
        return <Swords className="h-3.5 w-3.5" />;
      case "trades":
        return <ArrowLeftRight className="h-3.5 w-3.5" />;
      default:
        return <Inbox className="h-3.5 w-3.5" />;
    }
  };

  return (
    <Card className={`border border-border/80 bg-card shadow-sm overflow-hidden flex flex-col justify-between ${className}`}>
      {/* Header Widget */}
      <CardHeader className="py-3 px-4 sm:px-5 border-b border-border/60 bg-muted/20 flex flex-row items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
            <Inbox className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-xs sm:text-sm font-bold flex items-center gap-2 truncate">
              <span>Inbox Personale</span>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            </CardTitle>
            <p className="text-[10px] text-muted-foreground truncate hidden sm:block">
              Notizie ufficiali, rumor, anteprime e trattative.
            </p>
          </div>
        </div>

        <Link to="/sala-stampa" className="shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-[11px] gap-1 text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 font-bold px-2"
          >
            Apri Inbox <ArrowRight className="h-3 w-3" />
          </Button>
        </Link>
      </CardHeader>

      {/* Contenuto Carosello Notizie Unificate */}
      <CardContent
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        className="p-4 flex-1 flex flex-col justify-between space-y-3"
      >
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-xs text-muted-foreground italic">
            <div className="h-5 w-5 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mb-2" />
            <p>Caricamento notizie dell'Inbox...</p>
          </div>
        ) : currentItem ? (
          <div className="flex-1 flex flex-col justify-between space-y-3">
            {/* Box Notizia in Evidenza Attiva */}
            <div className="p-3.5 rounded-xl bg-muted/25 border border-border/70 space-y-2.5 transition-all shadow-xs">
              {/* Top Row: Badge Categoria + Controlli Carosello */}
              <div className="flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-bold flex items-center gap-1 py-0.5 px-2 border ${currentItem.badgeColor || ""}`}
                  >
                    {getCategoryIcon(currentItem.category)}
                    <span>{currentItem.badgeText || "Notizia"}</span>
                  </Badge>
                  {currentItem.matchday && (
                    <span className="text-[10px] font-mono text-muted-foreground">
                      G{currentItem.matchday}
                    </span>
                  )}
                </div>

                {items.length > 1 && (
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[10px] font-mono text-muted-foreground/70 mr-0.5">
                      {currentIndex + 1}/{items.length}
                    </span>
                    <button
                      type="button"
                      onClick={handlePrev}
                      className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                      title="Notizia precedente"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNext}
                      className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                      title="Notizia successiva"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Mittente + Titolo + Snippet */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  {currentItem.senderTeamId ? (
                    <img
                      src={getTeamLogo(currentItem.senderTeamId)}
                      alt={currentItem.senderTeamId}
                      className="h-6 w-6 object-contain rounded shrink-0"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="h-6 w-6 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      {getCategoryIcon(currentItem.category)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-foreground truncate">
                      {currentItem.senderName}
                    </p>
                    <p className="text-[9px] text-muted-foreground truncate">
                      {currentItem.senderRole || "Notifica di Lega"}
                    </p>
                  </div>
                </div>

                <h4 className="text-xs sm:text-sm font-black text-foreground leading-snug line-clamp-2">
                  {currentItem.title}
                </h4>

                <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                  {currentItem.snippet}
                </p>
              </div>
            </div>

            {/* Sezione Altre Notifiche Recenti dell'Inbox (Riempie ed ottimizza lo spazio verticale) */}
            {otherRecentItems.length > 0 && (
              <div className="space-y-1.5 flex-1 min-h-0 flex flex-col justify-center">
                <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground px-0.5">
                  <span className="uppercase tracking-wider flex items-center gap-1 text-[10px]">
                    <Inbox className="h-3 w-3 text-emerald-500" />
                    Altre Notizie in Bacheca
                  </span>
                  <span className="font-mono text-muted-foreground/60 text-[9px]">
                    Clicca per leggere
                  </span>
                </div>

                <div className="space-y-1.5">
                  {otherRecentItems.map((item) => {
                    const originalIndex = items.findIndex((it) => it.id === item.id);
                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          if (originalIndex !== -1) setCurrentIndex(originalIndex);
                        }}
                        className="p-2 rounded-lg bg-muted/20 hover:bg-muted/50 border border-border/50 cursor-pointer transition-colors flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="shrink-0 text-muted-foreground">
                            {getCategoryIcon(item.category)}
                          </span>
                          <span className="text-[11px] font-medium text-foreground truncate">
                            {item.title}
                          </span>
                        </div>
                        <Badge
                          variant="secondary"
                          className="text-[9px] px-1.5 py-0 font-mono shrink-0 hidden sm:inline-flex"
                        >
                          {item.badgeText || "Notifica"}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Footer Widget con Link e Indicatori Pallini */}
            <div className="flex items-center justify-between pt-2 border-t border-border/50 shrink-0">
              <Link
                to="/sala-stampa"
                className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <span>Leggi nell'Inbox</span>
                <ArrowRight className="h-3 w-3" />
              </Link>

              {items.length > 1 && (
                <div className="flex items-center gap-1">
                  {items.slice(0, 8).map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentIndex(idx)}
                      className={`h-1.5 rounded-full transition-all ${
                        idx === currentIndex
                          ? "w-4 bg-emerald-500"
                          : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                      }`}
                      title={`Vai a notizia ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-xs text-muted-foreground text-center">
            <Inbox className="h-8 w-8 text-muted-foreground/40 mb-1" />
            <p>Nessuna notizia recente nell'Inbox.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

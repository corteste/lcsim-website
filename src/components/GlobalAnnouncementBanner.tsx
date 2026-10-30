import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { Megaphone, ChevronRight, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/supabaseClient";
import { fetchAnnouncements } from "@/services/announcementsService";
import { LeagueAnnouncement } from "@/types/announcements";

let memoryGlobalBanner: LeagueAnnouncement | null = null;

export const GlobalAnnouncementBanner: React.FC = () => {
  const [activeBanner, setActiveBanner] = useState<LeagueAnnouncement | null>(() => memoryGlobalBanner);

  // Marquee overflow detection
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState<boolean>(false);
  const [animationDuration, setAnimationDuration] = useState<number>(24);

  const loadBanner = useCallback(async () => {
    const all = await fetchAnnouncements();
    const now = new Date();
    // Banner fisso permanente: non chiudibile localmente dall'utente (#60)
    // Scompare solo quando l'Admin lo rimuove o lo disattiva (is_banner = false) o se è scaduto
    const banner = all.find((a) => {
      if (!a.is_banner) return false;
      if (a.expires_at && new Date(a.expires_at) < now) return false;
      return true;
    }) || null;
    memoryGlobalBanner = banner;
    setActiveBanner(banner);
  }, []);

  useEffect(() => {
    loadBanner();

    const channel = supabase
      .channel("lcsim-global-banner")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "league_announcements" },
        () => {
          loadBanner();
        }
      )
      .subscribe();

    const handleSync = () => loadBanner();
    window.addEventListener("lcsim-notifications-updated", handleSync);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("lcsim-notifications-updated", handleSync);
    };
  }, [loadBanner]);

  // Misura se il testo eccede lo spazio disponibile per attivare lo scorrimento
  useEffect(() => {
    if (!activeBanner) return;

    const checkOverflow = () => {
      if (!containerRef.current || !textRef.current) return;
      const containerWidth = containerRef.current.clientWidth;
      const textWidth = textRef.current.scrollWidth;

      if (textWidth > containerWidth) {
        setIsOverflowing(true);
        // Velocità calcolata dinamicamente: circa 50px al secondo per una lettura agevole
        const duration = Math.max(16, Math.min(60, Math.round(textWidth / 45)));
        setAnimationDuration(duration);
      } else {
        setIsOverflowing(false);
      }
    };

    // Controllo immediato e con micro-timeout per assicurare che i font siano renderizzati
    checkOverflow();
    const timer = setTimeout(checkOverflow, 100);
    window.addEventListener("resize", checkOverflow);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", checkOverflow);
    };
  }, [activeBanner]);

  if (!activeBanner) return null;

  const isUrgent = activeBanner.priority === "urgent";
  const fullText = activeBanner.content
    ? `${activeBanner.title} — ${activeBanner.content}`
    : activeBanner.title;

  return (
    <div
      className={`w-full border-b select-none transition-all ${
        isUrgent
          ? "bg-gradient-to-r from-rose-600/15 via-rose-500/10 to-amber-500/15 border-rose-500/30 text-foreground"
          : "bg-gradient-to-r from-amber-500/15 via-emerald-500/10 to-blue-500/15 border-amber-500/30 text-foreground"
      }`}
    >
      <div className="container mx-auto px-4 py-2 flex items-center justify-between gap-3 text-xs">
        {/* LATO SINISTRO: BADGE UFFICIALE (FISSO) */}
        <Badge
          variant="outline"
          className={`shrink-0 text-[10px] font-black uppercase px-2 py-0.5 flex items-center gap-1 ${
            isUrgent
              ? "bg-rose-500 text-white border-rose-600 shadow-xs"
              : "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/40"
          }`}
        >
          {isUrgent ? <AlertTriangle className="h-3 w-3" /> : <Megaphone className="h-3 w-3" />}
          <span>{isUrgent ? "Avviso Urgente Lega" : "Comunicato Ufficiale"}</span>
        </Badge>

        {/* CENTRO: CONTENITORE MARQUEE / TESTO STATICO */}
        <div ref={containerRef} className="flex-1 min-w-0 overflow-hidden relative">
          {isOverflowing ? (
            <div
              className="animate-marquee-infinite py-0.5"
              style={{ "--marquee-duration": `${animationDuration}s` } as React.CSSProperties}
            >
              {/* Primo segmento di testo */}
              <span className="font-bold text-foreground pr-16 inline-flex items-center">
                <span>{activeBanner.title}</span>
                {activeBanner.content && (
                  <span className="font-normal text-muted-foreground ml-2">
                    — {activeBanner.content}
                  </span>
                )}
              </span>

              {/* Secondo segmento gemello per loop continuo senza scatti */}
              <span className="font-bold text-foreground pr-16 inline-flex items-center" aria-hidden="true">
                <span>{activeBanner.title}</span>
                {activeBanner.content && (
                  <span className="font-normal text-muted-foreground ml-2">
                    — {activeBanner.content}
                  </span>
                )}
              </span>
            </div>
          ) : (
            <div ref={textRef} className="truncate font-bold text-foreground">
              {activeBanner.title}
              {activeBanner.content && (
                <span className="font-normal text-muted-foreground hidden sm:inline ml-2">
                  — {activeBanner.content}
                </span>
              )}
            </div>
          )}
        </div>

        {/* LATO DESTRO: LINK DETTAGLIO FISSO (SENZA TASTO CHIUDI) */}
        <div className="shrink-0 flex items-center pl-1">
          <Link
            to="/comunicati"
            className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5 whitespace-nowrap bg-background/50 px-2 py-1 rounded-md border border-border/50"
          >
            <span>Leggi</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};

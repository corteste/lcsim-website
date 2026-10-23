import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Megaphone, X, ChevronRight, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/supabaseClient";
import {
  fetchAnnouncements,
  isBannerDismissed,
  dismissBannerLocally,
} from "@/services/announcementsService";
import { LeagueAnnouncement } from "@/types/announcements";

export const GlobalAnnouncementBanner: React.FC = () => {
  const [activeBanner, setActiveBanner] = useState<LeagueAnnouncement | null>(null);

  const loadBanner = useCallback(async () => {
    const all = await fetchAnnouncements();
    const now = new Date();
    const banner = all.find((a) => {
      if (!a.is_banner) return false;
      if (isBannerDismissed(a.id)) return false;
      if (a.expires_at && new Date(a.expires_at) < now) return false;
      return true;
    });
    setActiveBanner(banner || null);
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

  if (!activeBanner) return null;

  const isUrgent = activeBanner.priority === "urgent";

  const handleDismiss = () => {
    dismissBannerLocally(activeBanner.id);
    setActiveBanner(null);
  };

  return (
    <div
      className={`w-full border-b transition-all ${
        isUrgent
          ? "bg-gradient-to-r from-rose-600/15 via-rose-500/10 to-amber-500/15 border-rose-500/30 text-foreground"
          : "bg-gradient-to-r from-amber-500/15 via-emerald-500/10 to-blue-500/15 border-amber-500/30 text-foreground"
      }`}
    >
      <div className="container mx-auto px-4 py-2 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <Badge
            variant="outline"
            className={`shrink-0 text-[10px] font-black uppercase px-2 py-0.5 flex items-center gap-1 ${
              isUrgent
                ? "bg-rose-500 text-white border-rose-600"
                : "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/40"
            }`}
          >
            {isUrgent ? <AlertTriangle className="h-3 w-3" /> : <Megaphone className="h-3 w-3" />}
            <span>{isUrgent ? "Avviso Urgente Lega" : "Comunicato Ufficiale"}</span>
          </Badge>

          <div className="truncate font-bold text-foreground">
            {activeBanner.title}
            <span className="font-normal text-muted-foreground hidden md:inline ml-2">
              — {activeBanner.content}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            to="/comunicati"
            className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5 whitespace-nowrap"
          >
            <span>Leggi tutto</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>

          <button
            onClick={handleDismiss}
            title="Nascondi questo avviso"
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

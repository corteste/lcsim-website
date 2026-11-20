import { ExternalLink, Play, Radio, Tv } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getMatchBroadcastStatus,
  getYouTubeEmbedUrl,
  getYouTubeWatchUrl,
} from "@/utils/youtube";

interface MatchVideoStatusBadgeProps {
  youtubeUrl?: string | null;
  date?: string | Date | null;
  matchTime?: string | null;
  isPlayed?: boolean;
  compact?: boolean;
}

/**
 * Badge compatto per indicare lo stato della trasmissione YouTube:
 * - 🔴 IN ONDA ORA (durante i 45 min dall'orario Premiere)
 * - Premiere HH:mm (prima dell'inizio)
 * - Video / On-Demand (dopo la messa in onda)
 */
export const MatchVideoStatusBadge = ({
  youtubeUrl,
  date,
  matchTime,
  isPlayed,
  compact = false,
}: MatchVideoStatusBadgeProps) => {
  const status = getMatchBroadcastStatus({
    youtubeUrl,
    date,
    matchTime,
    isPlayed,
  });

  if (status === "none") return null;

  if (status === "live") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-sm animate-pulse">
        <span className="h-1.5 w-1.5 rounded-full bg-white" />
        <span>IN ONDA ORA</span>
      </span>
    );
  }

  if (status === "upcoming") {
    const timeLabel = matchTime ? String(matchTime).slice(0, 5) : "21:00";
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
        <Radio className="h-3 w-3" />
        <span>{compact ? `Premiere ${timeLabel}` : `Premiere ore ${timeLabel}`}</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/25">
      <Play className="h-2.5 w-2.5 fill-current" />
      <span>Video</span>
    </span>
  );
};

interface MatchVideoEmbedProps {
  youtubeUrl?: string | null;
  title?: string;
  date?: string | Date | null;
  matchTime?: string | null;
  isPlayed?: boolean;
}

/**
 * Player YouTube responsive (16:9) con header stato Premiere/Live/On-Demand e link diretto.
 */
export const MatchVideoEmbed = ({
  youtubeUrl,
  title = "Video Partita",
  date,
  matchTime,
  isPlayed,
}: MatchVideoEmbedProps) => {
  const embedUrl = getYouTubeEmbedUrl(youtubeUrl);
  const watchUrl = getYouTubeWatchUrl(youtubeUrl);
  const status = getMatchBroadcastStatus({
    youtubeUrl,
    date,
    matchTime,
    isPlayed,
  });

  if (!embedUrl || !watchUrl) {
    return (
      <div className="p-10 text-center rounded-2xl border border-dashed border-border/80 bg-muted/15 space-y-2">
        <Tv className="h-8 w-8 text-muted-foreground mx-auto opacity-60" />
        <p className="text-sm font-bold text-foreground">Nessun video disponibile</p>
        <p className="text-xs text-muted-foreground max-w-md mx-auto">
          Il link YouTube per questa partita non è ancora stato collegato dall&apos;Amministrazione.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <MatchVideoStatusBadge
            youtubeUrl={youtubeUrl}
            date={date}
            matchTime={matchTime}
            isPlayed={isPlayed}
          />
          <span className="text-xs font-semibold text-muted-foreground">
            {status === "live"
              ? "Trasmissione in corso su YouTube"
              : status === "upcoming"
              ? "Premiere programmata — attiva il promemoria su YouTube per la notifica di inizio"
              : "Replica integrale on-demand"}
          </span>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          asChild
          className="h-8 text-xs font-bold gap-1.5 border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10"
        >
          <a href={watchUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Apri su YouTube</span>
          </a>
        </Button>
      </div>

      <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-border/80 bg-black shadow-xl">
        <iframe
          src={embedUrl}
          title={title}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
    </div>
  );
};

export type MatchBroadcastStatus = "none" | "upcoming" | "live" | "vod";

const YOUTUBE_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

/**
 * Estrae l'ID video YouTube (11 caratteri) da URL watch, youtu.be, live, embed, shorts o ID diretto.
 */
export function extractYouTubeVideoId(rawUrl?: string | null): string | null {
  if (!rawUrl || typeof rawUrl !== "string") return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  if (YOUTUBE_ID_REGEX.test(trimmed)) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();

    if (host === "youtu.be") {
      const seg = parsed.pathname.split("/").filter(Boolean)[0];
      return seg && YOUTUBE_ID_REGEX.test(seg) ? seg : null;
    }

    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      const vParam = parsed.searchParams.get("v");
      if (vParam && YOUTUBE_ID_REGEX.test(vParam)) return vParam;

      const parts = parsed.pathname.split("/").filter(Boolean);
      if (parts.length >= 2 && ["live", "embed", "shorts", "v"].includes(parts[0])) {
        const candidate = parts[1];
        return candidate && YOUTUBE_ID_REGEX.test(candidate) ? candidate : null;
      }
    }
  } catch {
    return null;
  }

  return null;
}

export function getYouTubeEmbedUrl(rawUrl?: string | null): string | null {
  const id = extractYouTubeVideoId(rawUrl);
  return id ? `https://www.youtube.com/embed/${id}?rel=0` : null;
}

export function getYouTubeWatchUrl(rawUrl?: string | null): string | null {
  const id = extractYouTubeVideoId(rawUrl);
  return id ? `https://www.youtube.com/watch?v=${id}` : null;
}

function parseMatchStartMs(
  dateInput?: string | Date | null,
  matchTime?: string | null
): number | null {
  if (!dateInput) return null;

  let dateStr = "";
  if (dateInput instanceof Date) {
    if (isNaN(dateInput.getTime())) return null;
    dateStr = dateInput.toISOString().slice(0, 10);
  } else {
    dateStr = String(dateInput).slice(0, 10);
  }

  const mDate = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!mDate) return null;

  const [hhStr, mmStr] = String(matchTime || "21:00").split(":");
  const hh = parseInt(hhStr || "21", 10);
  const mm = parseInt(mmStr || "0", 10);

  const d = new Date(
    Number(mDate[1]),
    Number(mDate[2]) - 1,
    Number(mDate[3]),
    isNaN(hh) ? 21 : hh,
    isNaN(mm) ? 0 : mm,
    0,
    0
  );
  return isNaN(d.getTime()) ? null : d.getTime();
}

/**
 * Determina lo stato della trasmissione YouTube rispetto all'orario partita:
 * - "none": nessun video collegato
 * - "upcoming": Premiere programmata (prima di date + matchTime)
 * - "live": IN ONDA ORA (da matchTime per 45 minuti, allineato all'unlock_at)
 * - "vod": On-Demand (dopo 45 min dall'inizio o a partita già conclusa)
 */
export function getMatchBroadcastStatus(params: {
  youtubeUrl?: string | null;
  date?: string | Date | null;
  matchTime?: string | null;
  isPlayed?: boolean;
  nowMs?: number;
}): MatchBroadcastStatus {
  const videoId = extractYouTubeVideoId(params.youtubeUrl);
  if (!videoId) return "none";

  const startMs = parseMatchStartMs(params.date, params.matchTime);
  if (startMs === null) {
    return params.isPlayed ? "vod" : "upcoming";
  }

  const now = params.nowMs ?? Date.now();
  const liveWindowEnd = startMs + 45 * 60 * 1000;

  if (now >= startMs && now < liveWindowEnd) {
    return "live";
  }
  if (now < startMs) {
    return params.isPlayed ? "vod" : "upcoming";
  }
  return "vod";
}

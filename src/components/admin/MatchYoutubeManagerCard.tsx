import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, ExternalLink, Loader2, Save, Tv, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
  AdminScheduleMatchSummary,
  batchSaveAdminMatchYoutubeUrls,
  fetchAdminSeasonSchedule,
  fetchAvailableSeasons,
} from "@/services/matchStatsImportService";
import { extractYouTubeVideoId, getYouTubeWatchUrl } from "@/utils/youtube";
import { MatchVideoStatusBadge } from "@/components/schedule/MatchVideoBadge";

/**
 * Card compatta per l'Amministrazione in /admin/automazioni:
 * consente di incollare e salvare in blocco i link YouTube (Premiere o On-Demand)
 * delle partite di una singola giornata.
 */
export const MatchYoutubeManagerCard = () => {
  const queryClient = useQueryClient();
  const [seasons, setSeasons] = useState<number[]>([11, 10]);
  const [selectedSeason, setSelectedSeason] = useState<number>(11);
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [matches, setMatches] = useState<AdminScheduleMatchSummary[]>([]);
  const [urlDrafts, setUrlDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    fetchAvailableSeasons()
      .then((list) => {
        if (list.length > 0) {
          setSeasons(list);
          if (!list.includes(selectedSeason)) setSelectedSeason(list[0]);
        }
      })
      .catch(() => {});
  }, []);

  const loadMatches = async (stag: number) => {
    setLoading(true);
    try {
      const list = await fetchAdminSeasonSchedule(stag);
      setMatches(list);
      const drafts: Record<string, string> = {};
      for (const m of list) {
        drafts[`${m.week}_${m.home}_${m.away}`] = m.youtube_url || "";
      }
      setUrlDrafts(drafts);

      const availableWeeks = Array.from(new Set(list.map((m) => m.week))).sort((a, b) => a - b);
      if (availableWeeks.length > 0 && !availableWeeks.includes(selectedWeek)) {
        setSelectedWeek(availableWeeks[0]);
      }
    } catch (err: any) {
      toast.error(err?.message || "Errore caricamento calendario YouTube");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatches(selectedSeason);
  }, [selectedSeason]);

  const weeks = useMemo(
    () => Array.from(new Set(matches.map((m) => m.week))).sort((a, b) => a - b),
    [matches]
  );

  const weekMatches = useMemo(
    () => matches.filter((m) => m.week === selectedWeek),
    [matches, selectedWeek]
  );

  const handleSaveWeek = async () => {
    if (weekMatches.length === 0) return;

    for (const m of weekMatches) {
      const key = `${m.week}_${m.home}_${m.away}`;
      const raw = (urlDrafts[key] || "").trim();
      if (raw && !extractYouTubeVideoId(raw)) {
        toast.error(`Link YouTube non valido per ${m.home} vs ${m.away}`);
        return;
      }
    }

    setSaving(true);
    try {
      const payload = weekMatches.map((m) => {
        const key = `${m.week}_${m.home}_${m.away}`;
        return {
          stag: m.stag,
          week: m.week,
          home: m.home,
          away: m.away,
          youtube_url: (urlDrafts[key] || "").trim(),
        };
      });

      const res = await batchSaveAdminMatchYoutubeUrls(payload);
      if (!res.success) throw new Error(res.error);

      toast.success(`Link YouTube salvati per la Giornata ${selectedWeek} (S${selectedSeason})`);
      await loadMatches(selectedSeason);
      await queryClient.invalidateQueries({ queryKey: ["schedule"] });
      await queryClient.invalidateQueries({ queryKey: ["season_schedule"] });
    } catch (err: any) {
      toast.error(err?.message || "Errore durante il salvataggio dei link YouTube");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-red-500/40 bg-gradient-to-br from-card via-card/95 to-red-500/10 shadow-lg relative overflow-hidden md:col-span-2">
      <div className="absolute top-0 right-0 w-40 h-40 bg-red-500/10 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none" />
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
          <Badge className="bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
            <Tv className="h-3 w-3" /> Premiere &amp; Videoteca Partite
          </Badge>
          <div className="flex items-center gap-2">
            <Select
              value={String(selectedSeason)}
              onValueChange={(v) => setSelectedSeason(Number(v))}
            >
              <SelectTrigger className="h-8 w-[125px] text-xs font-bold bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {seasons.map((s) => (
                  <SelectItem key={s} value={String(s)}>
                    Stagione {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={String(selectedWeek)}
              onValueChange={(v) => setSelectedWeek(Number(v))}
              disabled={weeks.length === 0}
            >
              <SelectTrigger className="h-8 w-[130px] text-xs font-bold bg-background">
                <SelectValue placeholder="Giornata" />
              </SelectTrigger>
              <SelectContent>
                {weeks.map((w) => (
                  <SelectItem key={w} value={String(w)}>
                    Giornata {w}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <CardTitle className="text-xl font-black">Gestione Video YouTube per Giornata</CardTitle>
        <CardDescription className="text-xs">
          Incolla l&apos;URL YouTube (es. watch, youtu.be, live o ID) per ciascuna partita del turno: attiva in automatico il badge &quot;IN ONDA ORA&quot; all&apos;orario di gioco e il player nel Match Center.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {loading ? (
          <div className="py-8 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Caricamento partite...</span>
          </div>
        ) : weekMatches.length === 0 ? (
          <div className="py-6 text-center text-xs text-muted-foreground rounded-xl border border-dashed border-border/70">
            Nessuna partita trovata in an_schedule per la Stagione {selectedSeason}.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
              {weekMatches.map((m) => {
                const key = `${m.week}_${m.home}_${m.away}`;
                const val = urlDrafts[key] ?? "";
                const trimmed = val.trim();
                const isValid = !trimmed || Boolean(extractYouTubeVideoId(trimmed));
                const watchUrl = getYouTubeWatchUrl(trimmed);

                return (
                  <div
                    key={key}
                    className="p-3 rounded-xl bg-muted/40 border border-border/70 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="font-bold text-foreground truncate">
                        {m.home_name} <span className="text-muted-foreground font-normal">vs</span>{" "}
                        {m.away_name}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {m.date} • {m.match_time}
                        </span>
                        <MatchVideoStatusBadge
                          youtubeUrl={trimmed}
                          date={m.date}
                          matchTime={m.match_time}
                          isPlayed={m.has_stats}
                          compact
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Input
                        value={val}
                        onChange={(e) =>
                          setUrlDrafts((prev) => ({ ...prev, [key]: e.target.value }))
                        }
                        placeholder="https://www.youtube.com/watch?v=..."
                        className={`h-8 text-xs font-mono ${
                          !isValid ? "border-destructive focus-visible:ring-destructive" : ""
                        }`}
                      />
                      {trimmed && (
                        isValid && watchUrl ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            asChild
                            className="h-8 w-8 shrink-0"
                            title="Apri su YouTube"
                          >
                            <a href={watchUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3.5 w-3.5 text-emerald-500" />
                            </a>
                          </Button>
                        ) : (
                          <span
                            className="h-8 w-8 shrink-0 flex items-center justify-center text-destructive"
                            title="Link YouTube non valido"
                          >
                            <AlertCircle className="h-4 w-4" />
                          </span>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end pt-1">
              <Button
                type="button"
                onClick={handleSaveWeek}
                disabled={saving}
                className="bg-red-600 hover:bg-red-700 text-white font-bold gap-2 text-xs h-9 px-4"
              >
                {saving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                <span>Salva Link Giornata {selectedWeek}</span>
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import {
  History,
  UserCheck,
  UserX,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Calendar,
} from "lucide-react";
import {
  fetchClubHistoricalData,
  getHistoricalTeamMeta,
  HISTORICAL_TEAMS_META,
} from "@/services/archiveService";

export function useClubHistory(teamId?: string) {
  const { data, isLoading } = useQuery({
    queryKey: ["club_historical_data", teamId],
    queryFn: () => fetchClubHistoricalData(teamId!),
    enabled: !!teamId,
    staleTime: 5 * 60 * 1000,
  });

  const rebrands = data?.rebrands || [];
  const coaches = data?.coaches || [];
  const currentMeta = getHistoricalTeamMeta(teamId);
  const franchiseEras = Object.values(HISTORICAL_TEAMS_META).filter(
    (m) => m.franchiseCode === currentMeta.franchiseCode
  );

  return {
    rebrands,
    coaches,
    currentMeta,
    franchiseEras,
    isLoading,
    hasHistory: rebrands.length > 0 || coaches.length > 0,
  };
}

interface ClubHistoryInlineControlsProps {
  teamId: string;
  isOpen: boolean;
  onToggle: () => void;
}

export const ClubHistoryInlineControls = ({
  teamId,
  isOpen,
  onToggle,
}: ClubHistoryInlineControlsProps) => {
  const { hasHistory } = useClubHistory(teamId);

  if (!hasHistory) return null;

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all duration-200 border cursor-pointer select-none shadow-sm ${
        isOpen
          ? "bg-primary text-primary-foreground border-primary/80 shadow-primary/20"
          : "bg-muted/50 dark:bg-black/25 hover:bg-muted/80 dark:hover:bg-black/40 text-foreground dark:text-white border-border/70 dark:border-white/20"
      }`}
      title="Mostra/Nascondi Storia Squadra"
    >
      <History className="h-3.5 w-3.5 shrink-0" />
      <span>Storia Squadra</span>
      {isOpen ? (
        <ChevronUp className="h-3.5 w-3.5 shrink-0" />
      ) : (
        <ChevronDown className="h-3.5 w-3.5 shrink-0" />
      )}
    </button>
  );
};

interface ClubHistoryExpandedDrawerProps {
  teamId: string;
  teamName: string;
  isOpen: boolean;
}

export const ClubHistoryExpandedDrawer = ({
  teamId,
  teamName,
  isOpen,
}: ClubHistoryExpandedDrawerProps) => {
  const { rebrands, coaches, currentMeta, hasHistory } = useClubHistory(teamId);

  if (!isOpen || !hasHistory) return null;

  return (
    <div className="mt-5 pt-4 border-t border-border/60 dark:border-white/15 grid grid-cols-1 lg:grid-cols-3 gap-4 animate-fade-in">
      {/* Left Column: Rebranding History */}
      <div className="space-y-2.5">
        <h4 className="text-[11px] font-black uppercase tracking-wider text-muted-foreground dark:text-white/80 flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
          Evoluzione Denominazione Club
        </h4>

        {rebrands.length === 0 ? (
          <div className="p-3.5 rounded-xl bg-muted/40 dark:bg-black/25 backdrop-blur-md border border-border/60 dark:border-white/15 text-xs text-muted-foreground dark:text-white/75">
            Il club <strong className="text-foreground dark:text-white">{teamName} ({teamId})</strong> ha mantenuto la propria identità e sigla societaria originale fin dal suo ingresso in Lega ({currentMeta.eraSeasons}).
          </div>
        ) : (
          <div className="space-y-2">
            {rebrands.map((rb) => {
              const preMeta = getHistoricalTeamMeta(rb.pre_team_id);
              const postMeta = getHistoricalTeamMeta(rb.post_team_id);
              return (
                <div
                  key={rb.id}
                  className="p-3 rounded-xl bg-muted/40 dark:bg-black/25 backdrop-blur-md border border-border/60 dark:border-white/15 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground dark:text-white/70 font-mono">
                    <span>📅 {rb.rebrand_date}</span>
                    {rb.season_before && rb.season_after && (
                      <span>
                        Fine S{rb.season_before} ➔ Inizio S{rb.season_after}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={`${preMeta.badgeClass} text-xs font-bold`}>
                      {preMeta.code} • {preMeta.fullName}
                    </Badge>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground dark:text-white/70 shrink-0" />
                    <Badge className={`${postMeta.badgeClass} text-xs font-bold`}>
                      {postMeta.code} • {postMeta.fullName}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Right 2 Columns: Coach Bench History */}
      <div className="lg:col-span-2 space-y-2.5">
        <h4 className="text-[11px] font-black uppercase tracking-wider text-muted-foreground dark:text-white/80 flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-primary dark:text-emerald-400" />
          Cronologia Allenatori ({coaches.length})
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1">
          {coaches.map((c) => {
            const isHired = c.effetto.toLowerCase().includes("assunz");
            const tMeta = getHistoricalTeamMeta(c.team_id);
            return (
              <div
                key={c.id}
                className="p-3 rounded-xl bg-muted/40 dark:bg-black/25 backdrop-blur-md border border-border/60 dark:border-white/15 flex flex-col justify-between gap-1.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {isHired ? (
                      <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0">
                        <UserCheck className="h-3 w-3 mr-1" />
                        Assunzione
                      </Badge>
                    ) : (
                      <Badge className="bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30 text-[10px] font-bold px-2 py-0">
                        <UserX className="h-3 w-3 mr-1" />
                        Esonero / Addio
                      </Badge>
                    )}
                    <Badge className={`${tMeta.badgeClass} text-[10px] px-1.5 py-0 font-bold`}>
                      {c.team_id}
                    </Badge>
                  </div>
                  <span className="text-[11px] font-bold text-muted-foreground dark:text-white/75">
                    S{c.stagione}
                    {c.giornata ? ` • G${c.giornata}` : ""}
                  </span>
                </div>

                <div className="flex items-baseline justify-between gap-2 mt-0.5">
                  <span className="text-sm font-black text-foreground dark:text-white">
                    {c.nome}
                  </span>
                  {c.event_date && (
                    <span className="text-[10px] font-mono text-muted-foreground dark:text-white/70">
                      {c.event_date}
                    </span>
                  )}
                </div>

                {c.note && (
                  <p className="text-[11px] text-muted-foreground dark:text-white/75 italic border-t border-border/50 dark:border-white/10 pt-1 mt-0.5">
                    "{c.note}"
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

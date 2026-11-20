import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SUPABASE_STORAGE_URL } from "@/constants/App";
import { getHistoricalTeamMeta } from "@/services/archiveService";
import { LCSIM_LOGO_SMALL } from "@/utils/functions";

const SERIE_B_TEAMS: Record<string, string> = {
  "B - KEY": "Key",
  "B - ASP": "AS Pradalunga",
  "B - SLM": "AS San Lombardo",
  "B - FFC": "Flamingo FC",
  "B - CSF": "Colle Salvetti FC",
  "B - CYD": "Cydonia FC",
  "B - BFC": "Borcelle FC",
};

interface HistoricalTeamBadgeProps {
  teamCode: string;
  showFranchiseHint?: boolean;
}

/**
 * Mostra lo stemma storico della squadra (Serie A, rebrand storici o Serie B)
 * con tooltip informativo sulla denominazione e franchigia attuale.
 */
export const HistoricalTeamBadge = ({
  teamCode,
  showFranchiseHint = true,
}: HistoricalTeamBadgeProps) => {
  if (!teamCode || teamCode === "/" || teamCode === "N/D") {
    return <span className="text-muted-foreground text-xs">—</span>;
  }
  if (teamCode === "Rookie") {
    return (
      <Badge
        variant="outline"
        className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 font-semibold text-xs"
      >
        🎓 Rookie
      </Badge>
    );
  }
  if (teamCode === "Svincolati") {
    return (
      <Badge
        variant="outline"
        className="bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30 font-semibold text-xs"
      >
        Svincolati
      </Badge>
    );
  }
  if (teamCode === "Ritiro" || teamCode === "Ritirati" || teamCode === "RITIRATO") {
    return (
      <Badge
        variant="outline"
        className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 font-semibold text-xs"
      >
        Ritirato
      </Badge>
    );
  }

  const cleanCode = teamCode.trim().toUpperCase();
  const isSerieB = cleanCode.startsWith("B -") || cleanCode.startsWith("B-");

  if (isSerieB) {
    const bName = SERIE_B_TEAMS[cleanCode] || cleanCode.replace(/^B\s*-\s*/i, "");
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center gap-1.5 cursor-help">
            <div className="h-7 w-7 rounded-lg bg-card/80 border border-border/70 p-0.5 shrink-0 flex items-center justify-center overflow-hidden shadow-2xs hover:border-primary/50 transition-colors">
              <img
                src={LCSIM_LOGO_SMALL}
                alt={`${bName} (Serie B)`}
                className="h-full w-full object-contain"
              />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs space-y-1 p-2.5 shadow-md">
          <div className="flex items-center gap-2">
            <img
              src={LCSIM_LOGO_SMALL}
              alt="LCSIM Logo"
              className="h-4 w-4 object-contain shrink-0"
            />
            <p className="font-bold text-foreground">
              {bName} ({cleanCode})
            </p>
          </div>
          <p className="text-muted-foreground text-[11px]">
            Campionato cadetto / Serie B
          </p>
        </TooltipContent>
      </Tooltip>
    );
  }

  const meta = getHistoricalTeamMeta(teamCode);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="inline-flex items-center gap-1.5 cursor-help">
          <div className="h-7 w-7 rounded-lg bg-card/80 border border-border/70 p-0.5 shrink-0 flex items-center justify-center overflow-hidden shadow-2xs hover:border-primary/50 transition-colors">
            <img
              src={`${SUPABASE_STORAGE_URL}/images/teams/${meta.code}_Logo.png`}
              alt={meta.fullName || meta.code}
              className="h-full w-full object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (meta.franchiseCode && !target.src.includes(`${meta.franchiseCode}_Logo.png`)) {
                  target.src = `${SUPABASE_STORAGE_URL}/images/teams/${meta.franchiseCode}_Logo.png`;
                } else {
                  target.src = LCSIM_LOGO_SMALL;
                }
              }}
            />
          </div>
          {showFranchiseHint && meta.isHistoricalRebrand && (
            <span className="text-[10px] text-muted-foreground font-mono font-medium">
              ({meta.code})
            </span>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs space-y-1 p-2.5 shadow-md">
        <div className="flex items-center gap-2">
          <img
            src={`${SUPABASE_STORAGE_URL}/images/teams/${meta.code}_Logo.png`}
            alt={meta.code}
            className="h-4 w-4 object-contain shrink-0"
            onError={(e) => {
              (e.target as HTMLImageElement).src = LCSIM_LOGO_SMALL;
            }}
          />
          <p className="font-bold text-foreground">
            {meta.fullName} ({meta.code})
          </p>
        </div>
        {meta.isHistoricalRebrand ? (
          <p className="text-muted-foreground text-[11px]">
            Denominazione storica ({meta.eraSeasons}) • Franchigia attuale:{" "}
            <strong className="text-foreground">
              {meta.franchiseName} ({meta.franchiseCode})
            </strong>
          </p>
        ) : (
          <p className="text-muted-foreground text-[11px]">Attiva in {meta.eraSeasons}</p>
        )}
      </TooltipContent>
    </Tooltip>
  );
};

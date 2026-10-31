import React from "react";
import { FormationDifferences } from "@/services/formationComparisonService";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  ArrowDownRight,
  RefreshCw,
  CheckCircle2,
  ShieldAlert,
  Layers,
} from "lucide-react";
import { getRoleColor } from "@/utils/functions";
import { Player } from "@/types/player";

interface FormationChangesSummaryProps {
  diffs: FormationDifferences;
  teamName?: string;
  customPrevLabel?: string;
  onSelectPlayer?: (player: Player) => void;
}

export const FormationChangesSummary: React.FC<FormationChangesSummaryProps> = ({
  diffs,
  teamName,
  customPrevLabel,
  onSelectPlayer,
}) => {
  if (!diffs || !diffs.hasPrevious) return null;

  const noChanges =
    !diffs.isFormationChanged &&
    diffs.newStarters.length === 0 &&
    diffs.roleChangedStarters.length === 0 &&
    diffs.demotedToBench.length === 0 &&
    diffs.demotedToTribuna.length === 0;

  const prevLabel = customPrevLabel || (diffs.prevWeek ? `Giornata ${diffs.prevWeek}` : "Turno Precedente");

  return (
    <div className="p-3.5 rounded-2xl border border-border/80 bg-muted/20 space-y-2.5">
      <div className="flex items-center justify-between border-b border-border/60 pb-2">
        <span className="text-xs font-black uppercase text-foreground flex items-center gap-1.5">
          <Layers className="h-3.5 w-3.5 text-primary" />
          Scelte Tattiche vs {prevLabel}
          {teamName && <span className="text-muted-foreground font-normal">({teamName})</span>}
        </span>
        {diffs.isFormationChanged && (
          <Badge
            variant="outline"
            className="text-[10px] font-mono border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1"
          >
            <RefreshCw className="h-2.5 w-2.5" /> Modulo: {diffs.prevFormationId} ➔ {diffs.prevFormationName ? "" : ""}
          </Badge>
        )}
      </div>

      {noChanges ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground py-1">
          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
          <span>Formazione confermata in blocco: nessun cambio negli 11 titolari rispetto al turno precedente.</span>
        </div>
      ) : (
        <div className="space-y-2 text-xs">
          {/* Nuovi Titolari */}
          {diffs.newStarters.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 shrink-0">
                <Sparkles className="h-3 w-3" /> Nuovi Titolari ({diffs.newStarters.length}):
              </span>
              {diffs.newStarters.map((p) => (
                <Badge
                  key={p.ID}
                  variant="outline"
                  onClick={() => onSelectPlayer?.(p)}
                  className={`text-[10px] px-2 py-0.5 bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-1 ${
                    onSelectPlayer ? "cursor-pointer hover:bg-emerald-500/20" : ""
                  }`}
                >
                  <span className={`text-[9px] font-black ${getRoleColor(p.Posiz)} px-1 py-0 rounded`}>
                    {p.Posiz}
                  </span>
                  {p.Cognome || p.Nome}
                </Badge>
              ))}
            </div>
          )}

          {/* Cambi Ruolo / Posizione */}
          {diffs.roleChangedStarters.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 shrink-0">
                <RefreshCw className="h-3 w-3" /> Cambio Ruolo ({diffs.roleChangedStarters.length}):
              </span>
              {diffs.roleChangedStarters.map(({ player, oldPos, newPos }) => (
                <Badge
                  key={player.ID}
                  variant="outline"
                  onClick={() => onSelectPlayer?.(player)}
                  className={`text-[10px] px-2 py-0.5 bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300 font-bold flex items-center gap-1 ${
                    onSelectPlayer ? "cursor-pointer hover:bg-blue-500/20" : ""
                  }`}
                >
                  {player.Cognome || player.Nome}
                  <span className="text-[9px] font-mono text-muted-foreground">
                    ({oldPos} ➔ {newPos})
                  </span>
                </Badge>
              ))}
            </div>
          )}

          {/* Dalla formazione titolare alla panchina */}
          {diffs.demotedToBench.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 shrink-0">
                <ArrowDownRight className="h-3 w-3" /> In Panchina ({diffs.demotedToBench.length}):
              </span>
              {diffs.demotedToBench.map((p) => (
                <Badge
                  key={p.ID}
                  variant="outline"
                  onClick={() => onSelectPlayer?.(p)}
                  className={`text-[10px] px-2 py-0.5 bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300 font-bold flex items-center gap-1 ${
                    onSelectPlayer ? "cursor-pointer hover:bg-amber-500/20" : ""
                  }`}
                >
                  <span className={`text-[9px] font-black ${getRoleColor(p.Posiz)} px-1 py-0 rounded`}>
                    {p.Posiz}
                  </span>
                  {p.Cognome || p.Nome}
                </Badge>
              ))}
            </div>
          )}

          {/* Non Convocati / In Tribuna */}
          {diffs.demotedToTribuna.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1 shrink-0">
                <ShieldAlert className="h-3 w-3" /> Non Convocati / Tribuna ({diffs.demotedToTribuna.length}):
              </span>
              {diffs.demotedToTribuna.map((p) => (
                <Badge
                  key={p.ID}
                  variant="outline"
                  onClick={() => onSelectPlayer?.(p)}
                  className={`text-[10px] px-2 py-0.5 bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300 font-bold flex items-center gap-1 ${
                    onSelectPlayer ? "cursor-pointer hover:bg-rose-500/20" : ""
                  }`}
                >
                  <span className={`text-[9px] font-black ${getRoleColor(p.Posiz)} px-1 py-0 rounded`}>
                    {p.Posiz}
                  </span>
                  {p.Cognome || p.Nome}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Player } from "@/types/player";
import { SetPiecesSettings, SET_PIECES_DEFINITIONS } from "@/types/tactics";
import { getPlayerImage, getRoleColor } from "@/utils/functions";
import { Crown, Target, Flag, ShieldAlert, Sparkles, Check } from "lucide-react";

interface SetPiecesCardProps {
  setPieces: SetPiecesSettings;
  starters: (Player | null)[];
  roster: Player[];
  onChange: (updated: SetPiecesSettings) => void;
  disabled?: boolean;
}

export const SetPiecesCard: React.FC<SetPiecesCardProps> = ({
  setPieces,
  starters,
  roster,
  onChange,
  disabled = false,
}) => {
  const activeStarters = starters.filter((p): p is Player => Boolean(p));

  const handleSelect = (key: keyof SetPiecesSettings, value: string) => {
    if (disabled) return;
    const numId = value === "NONE" ? null : Number(value);
    onChange({
      ...setPieces,
      [key]: numId,
    });
  };

  const leftItems = SET_PIECES_DEFINITIONS.filter((d) => d.column === "left");
  const rightItems = SET_PIECES_DEFINITIONS.filter((d) => d.column === "right");

  const renderDropdown = (def: (typeof SET_PIECES_DEFINITIONS)[0]) => {
    const assignedId = setPieces[def.key];
    const assignedPlayer =
      assignedId !== null && assignedId !== undefined
        ? roster.find((p) => Number(p.ID) === assignedId) || null
        : null;

    const isStarter =
      assignedPlayer && activeStarters.some((p) => Number(p.ID) === Number(assignedPlayer.ID));

    return (
      <div
        key={def.key}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-lg bg-card/60 hover:bg-card border border-border/60 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0 sm:w-[190px] shrink-0">
          {def.key === "capitano" && <Crown className="w-4 h-4 text-amber-500 shrink-0" />}
          {def.key.includes("punizione") && <Target className="w-4 h-4 text-emerald-500 shrink-0" />}
          {def.key === "rigore" && <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />}
          {def.key.includes("corner") && <Flag className="w-4 h-4 text-sky-500 shrink-0" />}
          {def.key.includes("angolo") && <Sparkles className="w-4 h-4 text-purple-500 shrink-0" />}
          <span className="text-xs font-bold text-foreground truncate">
            {def.label}:
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <Select
            value={assignedId !== null && assignedId !== undefined ? String(assignedId) : "NONE"}
            onValueChange={(val) => handleSelect(def.key, val)}
            disabled={disabled}
          >
            <SelectTrigger className="h-8 text-xs font-medium bg-background/90 border-border/80">
              {assignedPlayer ? (
                <div className="flex items-center gap-2 min-w-0 truncate">
                  <img
                    src={getPlayerImage(Number(assignedPlayer.ID))}
                    alt={assignedPlayer.Cognome}
                    className="w-5 h-5 rounded-full object-cover object-top border border-border shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/images/players/MConti.png";
                    }}
                  />
                  <span className="font-bold truncate text-foreground">
                    {assignedPlayer.Cognome}, {assignedPlayer.Nome}
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-[9px] px-1 py-0 h-4 shrink-0 font-extrabold ${getRoleColor(
                      assignedPlayer.Posiz
                    )}`}
                  >
                    {assignedPlayer.Posiz}
                  </Badge>
                  <span className="text-[10px] font-mono text-primary font-bold shrink-0">
                    {assignedPlayer.OVR}
                  </span>
                  {!isStarter && (
                    <span className="text-[9px] text-amber-500 font-semibold italic shrink-0">
                      (Panchina)
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-muted-foreground italic text-[11px]">
                  — Nessuno assegnato —
                </span>
              )}
            </SelectTrigger>

            <SelectContent className="max-h-[300px]">
              <SelectItem value="NONE" className="text-xs text-muted-foreground italic">
                — Nessuno assegnato —
              </SelectItem>

              {activeStarters.length > 0 && (
                <SelectGroup>
                  <SelectLabel className="text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-extrabold bg-muted/40 py-1">
                    Titolari in Campo ({activeStarters.length})
                  </SelectLabel>
                  {activeStarters.map((p) => (
                    <SelectItem
                      key={p.ID}
                      value={String(p.ID)}
                      className="text-xs font-semibold"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold w-7">
                          [{p.Posiz}]
                        </span>
                        <span>
                          {p.Cognome}, {p.Nome}
                        </span>
                        <span className="font-mono font-bold text-primary ml-auto">
                          OVR {p.OVR}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectGroup>
              )}

              <SelectGroup>
                <SelectLabel className="text-[10px] uppercase tracking-wider text-muted-foreground font-extrabold bg-muted/30 py-1">
                  Resto della Rosa
                </SelectLabel>
                {roster
                  .filter((p) => !activeStarters.some((s) => Number(s.ID) === Number(p.ID)))
                  .map((p) => (
                    <SelectItem
                      key={p.ID}
                      value={String(p.ID)}
                      className="text-xs text-muted-foreground"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] w-7">[{p.Posiz}]</span>
                        <span>
                          {p.Cognome}, {p.Nome}
                        </span>
                        <span className="font-mono text-xs ml-auto">OVR {p.OVR}</span>
                      </div>
                    </SelectItem>
                  ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  };

  return (
    <Card className="shadow-lg border-border/80 overflow-hidden bg-card">
      <CardHeader className="bg-muted/30 border-b border-border/60 py-3.5 px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <Crown className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-base sm:text-lg font-black tracking-tight">
              Incarichi
            </CardTitle>
            <CardDescription className="text-xs">
              Assegna i battitori di calci piazzati, i saltatori sugli angoli e la fascia di capitano
            </CardDescription>
          </div>
        </div>
        <Badge
          variant="outline"
          className="text-[10px] font-bold bg-background/80 self-start sm:self-auto"
        >
          EA Sports FC 25
        </Badge>
      </CardHeader>

      <CardContent className="p-4 sm:p-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8">
          {/* COLONNA SINISTRA */}
          <div className="space-y-2.5">
            {leftItems.map((def) => renderDropdown(def))}
          </div>

          {/* COLONNA DESTRA */}
          <div className="space-y-2.5">
            {rightItems.map((def) => renderDropdown(def))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

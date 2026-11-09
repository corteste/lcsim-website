import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { PlayerDisciplinaryStatus } from "@/services/disciplineService";
import { getPlayerImage, getRoleColor } from "@/utils/functions";
import {
  Crown,
  Target,
  Flag,
  ShieldAlert,
  Sparkles,
  AlertTriangle,
  Wand2,
  Check,
} from "lucide-react";
import { SUPABASE_STORAGE_URL } from "@/constants/App";

interface SetPiecesCardProps {
  setPieces: SetPiecesSettings;
  starters: (Player | null)[];
  roster: Player[];
  onChange: (updated: SetPiecesSettings) => void;
  disabled?: boolean;
  disciplinaryMap?: Record<number, PlayerDisciplinaryStatus>;
}

export const SetPiecesCard: React.FC<SetPiecesCardProps> = ({
  setPieces,
  starters,
  roster,
  onChange,
  disabled = false,
  disciplinaryMap = {},
}) => {
  // Filtra rigorosamente solo gli 11 titolari attivi e non squalificati (Punto #82)
  const activeStarters = starters.filter(
    (p): p is Player => Boolean(p) && !disciplinaryMap[Number(p.ID)]?.isSuspended
  );

  const handleSelect = (key: keyof SetPiecesSettings, value: string) => {
    if (disabled) return;
    const numId = value === "NONE" ? null : Number(value);
    onChange({
      ...setPieces,
      [key]: numId,
    });
  };

  // Funzione per autocompilare in 1 click tutti i calci piazzati mancanti tra i titolari evitando conflitti
  const handleAutoAssignAll = () => {
    if (disabled || activeStarters.length === 0) return;

    const updated: SetPiecesSettings = { ...setPieces };

    // 1. Capitano: priorità a chi ha più OVR o età o già selezionato
    if (!updated.capitano || !activeStarters.some((p) => Number(p.ID) === updated.capitano)) {
      const sortedByOvr = [...activeStarters].sort((a, b) => (b.OVR ?? 70) - (a.OVR ?? 70));
      updated.capitano = Number(sortedByOvr[0]?.ID) || null;
    }

    // 2. Rigorista: attaccante o centrocampista con OVR più alto
    if (!updated.rigore || !activeStarters.some((p) => Number(p.ID) === updated.rigore)) {
      const attCc = activeStarters.filter((p) => ["ATT", "AS", "AD", "COC", "CC"].includes(p.Posiz));
      const candidates = attCc.length > 0 ? attCc : activeStarters;
      const sorted = [...candidates].sort((a, b) => (b.OVR ?? 70) - (a.OVR ?? 70));
      updated.rigore = Number(sorted[0]?.ID) || null;
    }

    // 3. Battitori Corner SX e DX (preferibilmente esterni o centrocampisti, NON difensori centrali)
    const cornerCandidates = activeStarters.filter((p) => !["DC", "POR"].includes(p.Posiz));
    const pool = cornerCandidates.length >= 2 ? cornerCandidates : activeStarters;

    if (!updated.corner_sx || !activeStarters.some((p) => Number(p.ID) === updated.corner_sx)) {
      const sxCandidates = pool.filter((p) => ["TS", "ES", "AS", "CC", "COC"].includes(p.Posiz));
      const chosen = sxCandidates[0] || pool[0];
      if (chosen) updated.corner_sx = Number(chosen.ID);
    }

    if (!updated.corner_dx || !activeStarters.some((p) => Number(p.ID) === updated.corner_dx)) {
      const dxCandidates = pool.filter(
        (p) => ["TD", "ED", "AD", "CC", "COC"].includes(p.Posiz) && Number(p.ID) !== updated.corner_sx
      );
      const chosen = dxCandidates[0] || pool.find((p) => Number(p.ID) !== updated.corner_sx) || pool[0];
      if (chosen) updated.corner_dx = Number(chosen.ID);
    }

    // 4. Punizioni: Corta SX, Corta DX, Lunga
    const freekickPool = pool.length > 0 ? pool : activeStarters;
    if (!updated.punizione_corta_sx || !activeStarters.some((p) => Number(p.ID) === updated.punizione_corta_sx)) {
      updated.punizione_corta_sx = updated.corner_sx || Number(freekickPool[0]?.ID) || null;
    }
    if (!updated.punizione_corta_dx || !activeStarters.some((p) => Number(p.ID) === updated.punizione_corta_dx)) {
      updated.punizione_corta_dx = updated.corner_dx || Number(freekickPool[0]?.ID) || null;
    }
    if (!updated.punizione_lunga || !activeStarters.some((p) => Number(p.ID) === updated.punizione_lunga)) {
      updated.punizione_lunga = updated.punizione_corta_dx || updated.punizione_corta_sx || Number(freekickPool[0]?.ID) || null;
    }

    // 5. Saltatori Corner (Torre, Primo Palo, Secondo Palo):
    // REQUISITO TASSATIVO: NON possono essere i battitori di Corner SX o DX!
    const cornerIds = new Set([updated.corner_sx, updated.corner_dx].filter(Boolean));
    const jumperPool = activeStarters.filter(
      (p) => !cornerIds.has(Number(p.ID)) && p.Posiz !== "POR"
    );

    // Preferisci DC, ATT, CDC
    const sortedJumpers = [...jumperPool].sort((a, b) => {
      const roleWeight = (r: string) => (["DC"].includes(r) ? 3 : ["ATT", "CDC"].includes(r) ? 2 : 1);
      return roleWeight(b.Posiz) - roleWeight(a.Posiz);
    });

    if (!updated.torre_angolo || cornerIds.has(updated.torre_angolo) || !activeStarters.some((p) => Number(p.ID) === updated.torre_angolo)) {
      updated.torre_angolo = sortedJumpers[0] ? Number(sortedJumpers[0].ID) : null;
    }
    if (!updated.primo_palo_angolo || cornerIds.has(updated.primo_palo_angolo) || !activeStarters.some((p) => Number(p.ID) === updated.primo_palo_angolo)) {
      const cand = sortedJumpers.find((p) => Number(p.ID) !== updated.torre_angolo) || sortedJumpers[0];
      updated.primo_palo_angolo = cand ? Number(cand.ID) : null;
    }
    if (!updated.secondo_palo_angolo || cornerIds.has(updated.secondo_palo_angolo) || !activeStarters.some((p) => Number(p.ID) === updated.secondo_palo_angolo)) {
      const cand = sortedJumpers.find(
        (p) => Number(p.ID) !== updated.torre_angolo && Number(p.ID) !== updated.primo_palo_angolo
      ) || sortedJumpers[0];
      updated.secondo_palo_angolo = cand ? Number(cand.ID) : null;
    }

    onChange(updated);
  };

  const leftItems = SET_PIECES_DEFINITIONS.filter((d) => d.column === "left");
  const rightItems = SET_PIECES_DEFINITIONS.filter((d) => d.column === "right");

  const cornerSxId = setPieces.corner_sx;
  const cornerDxId = setPieces.corner_dx;
  const torreId = setPieces.torre_angolo;
  const primoPaloId = setPieces.primo_palo_angolo;
  const secondoPaloId = setPieces.secondo_palo_angolo;

  const renderDropdown = (def: (typeof SET_PIECES_DEFINITIONS)[0]) => {
    const assignedId = setPieces[def.key];
    const assignedPlayer =
      assignedId !== null && assignedId !== undefined
        ? roster.find((p) => Number(p.ID) === assignedId) || null
        : null;

    // Verifica se è ancora tra i titolari arruolabili
    const isStarter =
      assignedPlayer && activeStarters.some((p) => Number(p.ID) === Number(assignedPlayer.ID));

    const isSuspended = assignedId ? Boolean(disciplinaryMap[assignedId]?.isSuspended) : false;

    // Verifica conflitti d'angolo (Punto #82)
    const isJumperDef = ["torre_angolo", "primo_palo_angolo", "secondo_palo_angolo"].includes(def.key);
    const isCornerDef = ["corner_sx", "corner_dx"].includes(def.key);

    const hasCornerConflict =
      assignedId &&
      ((isJumperDef && (assignedId === cornerSxId || assignedId === cornerDxId)) ||
        (isCornerDef &&
          (assignedId === torreId || assignedId === primoPaloId || assignedId === secondoPaloId)));

    const isUnassigned = assignedId === null || assignedId === undefined;
    const hasError = !isStarter || isSuspended || hasCornerConflict;

    return (
      <div
        key={def.key}
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl border transition-colors ${
          hasError
            ? "bg-rose-500/10 border-rose-500/40"
            : isUnassigned
            ? "bg-amber-500/5 border-amber-500/30"
            : "bg-card/70 hover:bg-card border-border/70"
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 sm:w-[195px] shrink-0">
          {def.key === "capitano" && <Crown className="w-4 h-4 text-amber-500 shrink-0" />}
          {def.key.includes("punizione") && <Target className="w-4 h-4 text-emerald-500 shrink-0" />}
          {def.key === "rigore" && <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />}
          {def.key.includes("corner") && <Flag className="w-4 h-4 text-sky-500 shrink-0" />}
          {def.key.includes("angolo") && <Sparkles className="w-4 h-4 text-purple-500 shrink-0" />}
          <span className="text-xs font-black text-foreground truncate">
            {def.label}:
          </span>
          <span className="text-[10px] text-rose-500 font-extrabold" title="Assegnazione obbligatoria">*</span>
        </div>

        <div className="flex-1 min-w-0">
          <Select
            value={assignedId !== null && assignedId !== undefined ? String(assignedId) : "NONE"}
            onValueChange={(val) => handleSelect(def.key, val)}
            disabled={disabled}
          >
            <SelectTrigger
              className={`h-8 text-xs font-medium bg-background border ${
                hasError
                  ? "border-rose-500 text-rose-600 dark:text-rose-400 font-bold"
                  : isUnassigned
                  ? "border-amber-500/50 text-amber-600 dark:text-amber-400"
                  : "border-border/80"
              }`}
            >
              {assignedPlayer && isStarter && !isSuspended && !hasCornerConflict ? (
                <div className="flex items-center gap-2 min-w-0 truncate">
                  <img
                    src={getPlayerImage(Number(assignedPlayer.ID))}
                    alt={assignedPlayer.Cognome}
                    className="w-5 h-5 rounded-full object-cover object-top border border-border shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `${SUPABASE_STORAGE_URL}/images/players/MConti.png`;
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
                    OVR {assignedPlayer.OVR}
                  </span>
                </div>
              ) : assignedPlayer && hasCornerConflict ? (
                <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-bold text-[11px] truncate">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{assignedPlayer.Cognome} (Conflitto Corner/Saltatore)</span>
                </div>
              ) : assignedPlayer && (!isStarter || isSuspended) ? (
                <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-bold text-[11px] truncate">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {assignedPlayer.Cognome} ({isSuspended ? "Squalificato" : "Non Titolare"})
                  </span>
                </div>
              ) : (
                <span className="text-amber-600 dark:text-amber-400 italic text-[11px] font-semibold">
                  — Non Assegnato (Obbligatorio) —
                </span>
              )}
            </SelectTrigger>

            <SelectContent className="max-h-[300px]">
              <SelectItem value="NONE" className="text-xs text-muted-foreground italic">
                — Nessuno assegnato —
              </SelectItem>

              {activeStarters.length > 0 ? (
                <SelectGroup>
                  <SelectLabel className="text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-extrabold bg-muted/40 py-1">
                    11 Titolari Arruolabili ({activeStarters.length})
                  </SelectLabel>
                  {activeStarters.map((p) => {
                    const pId = Number(p.ID);

                    // Verifica se il giocatore è incompatibile (battitore corner vs saltatore)
                    let isForbidden = false;
                    let forbiddenReason = "";

                    if (isJumperDef) {
                      if (pId === cornerSxId || pId === cornerDxId) {
                        isForbidden = true;
                        forbiddenReason = "Battitore Corner";
                      }
                    } else if (isCornerDef) {
                      if (pId === torreId || pId === primoPaloId || pId === secondoPaloId) {
                        isForbidden = true;
                        forbiddenReason = "Saltatore Angolo";
                      }
                    }

                    return (
                      <SelectItem
                        key={p.ID}
                        value={String(p.ID)}
                        disabled={isForbidden}
                        className="text-xs font-semibold"
                      >
                        <div className="flex items-center gap-2 w-full">
                          <span className="font-mono text-[10px] font-bold w-7 shrink-0">
                            [{p.Posiz}]
                          </span>
                          <span className="truncate">
                            {p.Cognome}, {p.Nome}
                          </span>
                          {isForbidden && (
                            <span className="text-[10px] text-rose-500 font-bold ml-1">
                              ({forbiddenReason})
                            </span>
                          )}
                          <span className="font-mono font-bold text-primary ml-auto pl-2 shrink-0">
                            OVR {p.OVR}
                          </span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectGroup>
              ) : (
                <div className="p-3 text-xs text-muted-foreground text-center italic">
                  Nessun titolare arruolabile disponibile. Schiera prima i titolari sul campo.
                </div>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  };

  return (
    <Card className="shadow-lg border-border/80 overflow-hidden bg-card">
      <CardHeader className="bg-muted/30 border-b border-border/60 py-3.5 px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
            <Crown className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-base sm:text-lg font-black tracking-tight">
              Incarichi & Calci Piazzati (Titolari Obbligatori)
            </CardTitle>
            <CardDescription className="text-xs">
              Tutti i 10 ruoli devono essere assegnati agli 11 titolari. I battitori di corner non possono saltare in area.
            </CardDescription>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleAutoAssignAll}
            disabled={disabled || activeStarters.length === 0}
            className="text-xs font-bold gap-1.5 h-8 bg-background/80 hover:bg-muted text-foreground"
            title="Assegna automaticamente i migliori titolari evitando conflitti"
          >
            <Wand2 className="w-3.5 h-3.5 text-primary" />
            <span>Auto-assegna Titolari</span>
          </Button>
          <Badge
            variant="outline"
            className="text-[10px] font-bold bg-background/80 shrink-0"
          >
            Punto #82
          </Badge>
        </div>
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

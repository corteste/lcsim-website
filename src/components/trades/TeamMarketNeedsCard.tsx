import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Target,
  Check,
  Plus,
  Save,
  RotateCcw,
  ExternalLink,
  Sparkles,
  Info,
  Clock,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  MACRO_MARKET_CATEGORIES,
  MacroNeedId,
} from "@/types/marketNeeds";
import {
  fetchSingleTeamNeeds,
  updateTeamMarketNeeds,
} from "@/services/marketNeedsService";
import { toast } from "sonner";

interface TeamMarketNeedsCardProps {
  teamId: string;
  teamName?: string;
  userName?: string;
  compact?: boolean;
  onSaved?: () => void;
}

export const TeamMarketNeedsCard: React.FC<TeamMarketNeedsCardProps> = ({
  teamId,
  teamName,
  userName,
  compact = false,
  onSaved,
}) => {
  const [selectedNeeds, setSelectedNeeds] = useState<MacroNeedId[]>([]);
  const [originalNeeds, setOriginalNeeds] = useState<MacroNeedId[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      const data = await fetchSingleTeamNeeds(teamId);
      if (isMounted) {
        setSelectedNeeds(data);
        setOriginalNeeds(data);
        setLoading(false);
      }
    }
    if (teamId) {
      load();
    }
    return () => {
      isMounted = false;
    };
  }, [teamId]);

  const hasChanges =
    selectedNeeds.length !== originalNeeds.length ||
    selectedNeeds.some((id) => !originalNeeds.includes(id));

  const toggleCategory = (catId: MacroNeedId) => {
    setSelectedNeeds((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  const handleReset = () => {
    setSelectedNeeds(originalNeeds);
  };

  const handleSave = async () => {
    if (!teamId) return;
    setSaving(true);
    const res = await updateTeamMarketNeeds(teamId, selectedNeeds, userName || teamName || teamId);
    setSaving(false);

    if (res.success) {
      setOriginalNeeds([...selectedNeeds]);
      toast.success("Bisogni di mercato aggiornati con successo!");
      if (onSaved) onSaved();
    } else {
      toast.error(res.error || "Errore durante il salvataggio dei bisogni.");
    }
  };

  return (
    <Card className="overflow-hidden border-border/80 bg-gradient-to-br from-card via-card/95 to-muted/30 shadow-lg">
      <CardHeader className={`${compact ? "p-4 pb-3" : "pb-3"} border-b border-border/60`}>
        {compact ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-xs">
                  <Target className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <CardTitle className="text-sm font-black tracking-tight">
                      I Miei Bisogni
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px] font-mono font-bold">
                      {teamId}
                    </Badge>
                  </div>
                  {selectedNeeds.length > 0 ? (
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                      {selectedNeeds.length} categorie ricercate
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">
                      Nessun bisogno impostato
                    </span>
                  )}
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                asChild
                className="h-7 text-[10px] font-bold border-border/80 px-2 text-muted-foreground hover:text-foreground"
                title="Apri la bacheca bisogni di Serie A in /mercato/scambi"
              >
                <Link to="/mercato/scambi?tab=needs">
                  <ExternalLink className="h-2.5 w-2.5 mr-1 text-emerald-500" />
                  Bacheca Lega
                </Link>
              </Button>
            </div>
            <CardDescription className="text-[11px] text-muted-foreground leading-tight">
              Seleziona i reparti su cui desideri ricevere offerte di scambio dagli altri club.
            </CardDescription>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-xs">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base sm:text-lg font-black tracking-tight">
                    I Miei Bisogni di Mercato
                  </CardTitle>
                  <Badge variant="outline" className="text-[10px] font-mono font-bold">
                    {teamId}
                  </Badge>
                  {selectedNeeds.length > 0 && (
                    <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-black">
                      {selectedNeeds.length} Categorie Attive
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Indica alle altre società i reparti su cui concentrare eventuali proposte di scambio.
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <Button
                variant="outline"
                size="sm"
                asChild
                className="h-8 text-[11px] font-bold border-border/80 hover:bg-muted text-muted-foreground hover:text-foreground"
                title="Apri la bacheca pubblica dei bisogni per vedere cosa cercano gli altri 11 club"
              >
                <Link to="/mercato/scambi?tab=needs">
                  <ExternalLink className="h-3 w-3 mr-1 text-emerald-500" />
                  Vedi Bacheca Lega
                </Link>
              </Button>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className={`${compact ? "p-4 pt-3 space-y-3" : "pt-4 space-y-4"}`}>
        {/* Info Banner */}
        {!compact && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 flex items-start gap-2.5 text-xs text-muted-foreground">
            <Info className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Clicca sulle macro-categorie per contrassegnarle come <strong className="text-foreground">"Ricercate"</strong>.
              I club che dispongono di esuberi in tali ruoli potranno individuare la tua società nella
              <strong className="text-foreground"> Bacheca Mercato</strong> e formularti offerte mirate.
            </p>
          </div>
        )}

        {/* 8 Macro-Categories Grid */}
        <div className={compact ? "grid grid-cols-2 gap-2" : "grid grid-cols-2 sm:grid-cols-4 gap-2.5"}>
          {MACRO_MARKET_CATEGORIES.map((cat) => {
            const isSelected = selectedNeeds.includes(cat.id);
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => toggleCategory(cat.id)}
                disabled={loading}
                className={`relative flex flex-col items-start text-left ${compact ? "p-2.5 rounded-lg" : "p-3 rounded-xl"} border transition-all duration-200 cursor-pointer select-none outline-hidden ${
                  isSelected
                    ? `bg-card border-emerald-500/60 shadow-md ring-2 ring-emerald-500/20`
                    : "bg-card/50 border-border/70 hover:border-border hover:bg-muted/40 text-muted-foreground"
                }`}
              >
                {/* Header categoria con indicatore */}
                <div className="w-full flex items-center justify-between gap-1 mb-1">
                  <span
                    className={`font-black text-xs tracking-tight ${
                      isSelected ? "text-foreground font-extrabold" : "text-foreground/75"
                    }`}
                  >
                    {cat.label}
                  </span>
                  <div
                    className={`h-4.5 w-4.5 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                      isSelected
                        ? "bg-emerald-500 text-white shadow-xs"
                        : "bg-muted text-muted-foreground/60 border border-border/60"
                    }`}
                  >
                    {isSelected ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                  </div>
                </div>

                {/* Sub ruoli inclusi */}
                <span
                  className={`text-[9px] font-mono font-bold tracking-tight px-1.5 py-0.5 rounded-sm ${
                    isSelected
                      ? cat.colorClass.badge
                      : "bg-muted/60 text-muted-foreground border border-border/40"
                  }`}
                >
                  {cat.subRolesLabel}
                </span>

                {/* Badge stato attivo */}
                {isSelected && (
                  <span className="mt-1.5 text-[8.5px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Cercato
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className={`flex ${compact ? "flex-col gap-2.5 pt-2" : "flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3"} border-t border-border/60`}>
          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span className="text-[11px]">
              <strong className="text-foreground">{selectedNeeds.length}</strong> su 8 attive
            </span>
            {hasChanges && (
              <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[9.5px] font-bold">
                Modifiche non salvate
              </Badge>
            )}
          </div>

          <div className={`flex items-center gap-2 ${compact ? "w-full justify-between" : "self-end sm:self-auto"}`}>
            {hasChanges && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                disabled={saving}
                className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                Annulla
              </Button>
            )}

            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className={`h-8 px-3 text-xs font-bold transition-all ${compact ? "flex-1" : ""} ${
                hasChanges
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/25"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <Save className="h-3.5 w-3.5 mr-1.5" />
              {saving ? "Salvataggio..." : "Salva Bisogni"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

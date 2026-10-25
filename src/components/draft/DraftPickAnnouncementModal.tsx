import React, { useEffect, useState } from "react";
import { X, Sparkles, Ruler, Weight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPlayerImage, getRoleColor, getValueColor } from "@/utils/functions";

export interface DraftPickAnnouncementData {
  pickOverall: number;
  round: number;
  teamId: string;
  teamAbbr?: string;
  teamName?: string;
  rookie: {
    ID: number;
    Nome: string;
    Cognome: string;
    Posiz: string;
    OVR: number;
    Altezza?: number | null;
    Peso?: number | null;
  };
}

interface DraftPickAnnouncementModalProps {
  pickData: DraftPickAnnouncementData | null;
  onClose: () => void;
  autoCloseDuration?: number; // ms, default 7000
}

export const DraftPickAnnouncementModal: React.FC<DraftPickAnnouncementModalProps> = ({
  pickData,
  onClose,
  autoCloseDuration = 7000,
}) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!pickData) {
      setProgress(100);
      return;
    }

    setProgress(100);
    const intervalTime = 50;
    const step = (intervalTime / autoCloseDuration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= step) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return prev - step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [pickData, autoCloseDuration, onClose]);

  if (!pickData) return null;

  const { rookie, teamId, teamAbbr, pickOverall, round } = pickData;
  const displayAbbr = teamAbbr || teamId;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm sm:max-w-md rounded-2xl bg-card border border-primary/30 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Intestazione Scelta */}
        <div className="relative px-4 py-3 bg-gradient-to-r from-primary/15 via-muted/50 to-primary/15 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500 animate-pulse shrink-0" />
            <span className="text-xs font-black uppercase tracking-wider text-foreground">
              Scelta Effettuata!
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className="text-[11px] font-bold bg-background/80">
              Scelta #{pickOverall} • Round {round}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-full text-muted-foreground hover:text-foreground -mr-1"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Squadra Selezionatrice: Stemma + Abbreviazione */}
        <div className="px-5 pt-4 pb-2 flex items-center justify-center gap-3">
          <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-muted/60 border border-border shadow-sm">
            <img
              src={`/images/teams/${teamId}_Logo.png`}
              alt={displayAbbr}
              className="h-7 w-7 object-contain drop-shadow"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            <span className="text-xs font-medium text-muted-foreground">Selezionato da:</span>
            <span className="text-sm font-black tracking-wider text-foreground">{displayAbbr}</span>
          </div>
        </div>

        {/* Contenuto Rookie */}
        <div className="p-5 flex flex-col items-center text-center">
          {/* Avatar con badge posizione e OVR */}
          <div className="relative mb-3">
            <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-2xl overflow-hidden bg-gradient-to-b from-muted/50 to-muted border-2 border-border/80 shadow-md flex items-center justify-center">
              <img
                src={getPlayerImage(rookie.ID)}
                alt={`${rookie.Nome} ${rookie.Cognome}`}
                onError={(e) => {
                  e.currentTarget.src = "/images/players/MConti.png";
                }}
                className="h-full w-full object-cover object-top"
              />
            </div>

            {/* Posizione (Ruolo) in basso a sinistra */}
            <Badge
              variant="outline"
              className={`absolute -bottom-2 -left-2 text-xs font-black px-2.5 py-0.5 shadow-md border ${getRoleColor(
                rookie.Posiz
              )}`}
            >
              {rookie.Posiz}
            </Badge>

            {/* Overall (OVR) in alto a destra */}
            <div
              className={`absolute -top-2 -right-2 text-sm font-black font-mono px-2.5 py-0.5 rounded-full shadow-md border border-border/60 ${getValueColor(
                rookie.OVR
              )}`}
            >
              {rookie.OVR}
            </div>
          </div>

          {/* Nome e Cognome */}
          <h3 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
            {rookie.Nome} {rookie.Cognome}
          </h3>

          {/* Dettagli Fisici: Altezza e Peso */}
          <div className="mt-2.5 flex items-center justify-center gap-4 text-xs text-muted-foreground font-mono">
            <div className="flex items-center gap-1.5 bg-muted/40 px-3 py-1 rounded-md border border-border/50">
              <Ruler className="h-3.5 w-3.5 text-primary" />
              <span>{rookie.Altezza ? `${rookie.Altezza} cm` : "N/D"}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-muted/40 px-3 py-1 rounded-md border border-border/50">
              <Weight className="h-3.5 w-3.5 text-primary" />
              <span>{rookie.Peso ? `${rookie.Peso} kg` : "N/D"}</span>
            </div>
          </div>
        </div>

        {/* Footer con Barra di Auto-chiusura e pulsante Chiudi */}
        <div className="p-3 bg-muted/20 border-t border-border flex items-center justify-between gap-3">
          <span className="text-[10px] text-muted-foreground font-mono">
            Chiusura in {Math.ceil((progress / 100) * (autoCloseDuration / 1000))}s
          </span>
          <Button size="sm" variant="outline" className="h-7 text-xs px-3" onClick={onClose}>
            Chiudi
          </Button>
        </div>

        {/* Barra di Progresso Temporizzata */}
        <div className="h-1 w-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary transition-all ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};

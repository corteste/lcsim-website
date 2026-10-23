import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Shield,
  Trophy,
  Swords,
  Users,
  Calendar,
  Activity,
  Flame,
  Search,
  MapPin,
  Clock,
  Layers,
  Sparkles,
  ChevronRight,
  Info,
} from "lucide-react";
import { OpponentScoutData, OpponentMatchInfo } from "@/services/opponentScoutService";
import { Player } from "@/types/player";
import { getRoleColor, getValueColor, getNationalityFlag } from "@/utils/functions";
import { EA_FC25_FORMATIONS } from "@/pages/Tattica";

interface OpponentScoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matchInfo: OpponentMatchInfo | null;
  scoutData: OpponentScoutData | null;
  loading: boolean;
}

const ROLE_GROUPS = [
  { id: "ALL", label: "Tutti" },
  { id: "POR", label: "POR", roles: ["POR"] },
  { id: "DIF", label: "DIF", roles: ["DC", "TD", "TS"] },
  { id: "CEN", label: "CEN", roles: ["CDC", "CC", "ED", "ES", "COC"] },
  { id: "ATT", label: "ATT", roles: ["AD", "AS", "AT", "ATT"] },
];

export const OpponentScoutModal: React.FC<OpponentScoutModalProps> = ({
  open,
  onOpenChange,
  matchInfo,
  scoutData,
  loading,
}) => {
  const [activeTab, setActiveTab] = useState<"formations" | "roster" | "matches">("formations");
  const [selectedFormationIdx, setSelectedFormationIdx] = useState<number>(0);
  const [rookieSearch, setRookieSearch] = useState<string>("");
  const [rosterRoleFilter, setRosterRoleFilter] = useState<string>("ALL");

  const team = scoutData?.team;
  const standings = scoutData?.standings;
  const formations = scoutData?.formations || [];
  const currentFormation = formations[selectedFormationIdx] || formations[0];

  // Roster filtrato
  const filteredRoster = useMemo(() => {
    if (!scoutData?.roster) return [];
    return scoutData.roster.filter((p) => {
      if (rosterRoleFilter !== "ALL") {
        const grp = ROLE_GROUPS.find((g) => g.id === rosterRoleFilter);
        if (grp?.roles && !grp.roles.includes(p.Posiz)) return false;
      }
      if (rookieSearch.trim()) {
        const q = rookieSearch.toLowerCase().trim();
        const full = `${p.Nome} ${p.Cognome} ${p.Posiz}`.toLowerCase();
        return full.includes(q);
      }
      return true;
    });
  }, [scoutData?.roster, rosterRoleFilter, rookieSearch]);

  // Posizioni del campo per la formazione selezionata
  const formationDef = useMemo(() => {
    if (!currentFormation) return EA_FC25_FORMATIONS[0];
    return (
      EA_FC25_FORMATIONS.find((f) => f.id === currentFormation.formationId) ||
      EA_FC25_FORMATIONS[0]
    );
  }, [currentFormation]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0 border-border bg-card">
        {/* ========================================================= */}
        {/* MODAL HEADER                                              */}
        {/* ========================================================= */}
        <div className="p-5 border-b border-border bg-gradient-to-r from-card via-card to-muted/30">
          <DialogHeader className="text-left space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                {matchInfo?.opponentTeamId && (
                  <img
                    src={`/images/teams/${matchInfo.opponentTeamId}_Logo.png`}
                    alt={matchInfo.opponentTeamName}
                    className="h-14 w-14 object-contain filter drop-shadow shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/images/LCSIM_Logo_SMALL.png";
                    }}
                  />
                )}
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      Prossima Avversaria • Giornata {matchInfo?.week}
                    </span>
                    <Badge variant="outline" className="font-mono text-[10px] font-bold">
                      {matchInfo?.opponentTeamId}
                    </Badge>
                  </div>
                  <DialogTitle className="text-2xl font-black tracking-tight text-foreground mt-1">
                    {team?.name || matchInfo?.opponentTeamName}
                  </DialogTitle>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-muted-foreground/70" />
                      {matchInfo?.stadium || team?.stadium || "Stadio di Casa"}
                    </span>
                    <span>•</span>
                    <span>{matchInfo?.isHome ? "Giochi in Casa" : "Trasferta"}</span>
                  </div>
                </div>
              </div>

              {/* QUICK TELEMETRY PILLS */}
              <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                {standings && (
                  <div className="px-3 py-1.5 rounded-xl border border-border/80 bg-muted/40 text-center">
                    <div className="text-[10px] uppercase font-bold text-muted-foreground">Classifica</div>
                    <div className="font-mono font-black text-xs text-foreground">
                      {standings.rank}° • {standings.points} PT
                    </div>
                  </div>
                )}

                {scoutData?.form && scoutData.form.length > 0 && (
                  <div className="px-3 py-1.5 rounded-xl border border-border/80 bg-muted/40 text-center">
                    <div className="text-[10px] uppercase font-bold text-muted-foreground mb-1">
                      Forma Recente
                    </div>
                    <div className="flex items-center gap-1 justify-center">
                      {scoutData.form.map((res, i) => (
                        <span
                          key={i}
                          className={`h-5 w-5 rounded-full text-[10px] font-mono font-black flex items-center justify-center text-white shadow-xs ${
                            res === "V"
                              ? "bg-emerald-600"
                              : res === "N"
                              ? "bg-amber-500"
                              : "bg-rose-600"
                          }`}
                        >
                          {res}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* ========================================================= */}
        {/* NAVIGATION TABS                                           */}
        {/* ========================================================= */}
        <div className="px-5 pt-3 border-b border-border bg-muted/15">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
            <TabsList className="bg-card border border-border p-1 h-auto flex flex-wrap gap-1">
              <TabsTrigger
                value="formations"
                className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white font-bold text-xs sm:text-sm px-3.5 py-1.5 rounded-lg gap-2"
              >
                <Layers className="h-4 w-4" />
                <span>Ultime Formazioni ({formations.length})</span>
              </TabsTrigger>
              <TabsTrigger
                value="roster"
                className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white font-bold text-xs sm:text-sm px-3.5 py-1.5 rounded-lg gap-2"
              >
                <Users className="h-4 w-4" />
                <span>Rosa Giocatori ({scoutData?.roster?.length || 0})</span>
              </TabsTrigger>
              <TabsTrigger
                value="matches"
                className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white font-bold text-xs sm:text-sm px-3.5 py-1.5 rounded-lg gap-2"
              >
                <Activity className="h-4 w-4" />
                <span>Andamento &amp; Risultati ({scoutData?.recentMatches?.length || 0})</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* ========================================================= */}
        {/* TAB 1: ULTIME 3 FORMAZIONI INSERITE (CAMPO 2D + PANCHINA) */}
        {/* ========================================================= */}
        {activeTab === "formations" && (
          <div className="p-5 space-y-5">
            {formations.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground space-y-2">
                <Layers className="h-10 w-10 mx-auto text-muted-foreground/40" />
                <p className="font-bold text-sm">Nessuna formazione registrata per questa squadra</p>
                <p className="text-xs">Le formazioni appariranno non appena la squadra salverà una tattica o giocherà una partita.</p>
              </div>
            ) : (
              <>
                {/* Formations Selector Pills */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mr-1">
                    Seleziona:
                  </span>
                  {formations.map((f, idx) => (
                    <Button
                      key={f.id}
                      type="button"
                      size="sm"
                      variant={selectedFormationIdx === idx ? "default" : "outline"}
                      onClick={() => setSelectedFormationIdx(idx)}
                      className={`h-8 text-xs font-bold gap-1.5 rounded-xl transition-all ${
                        selectedFormationIdx === idx
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "bg-muted/40 text-foreground"
                      }`}
                    >
                      <span>#{idx + 1} {f.formationId}</span>
                      <span className="text-[10px] opacity-75 hidden sm:inline">
                        ({f.source === "tactic_history" ? "Storicizzata" : f.source === "active_tactic" ? "Attiva" : "In Campo"})
                      </span>
                    </Button>
                  ))}
                </div>

                {/* Active Formation Banner */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border text-xs">
                  <div>
                    <span className="font-extrabold text-foreground text-sm block">
                      {currentFormation.title} • Modulo {currentFormation.formationName}
                    </span>
                    {currentFormation.date && (
                      <span className="text-[11px] text-muted-foreground">
                        Registrata il: {new Date(currentFormation.date).toLocaleDateString("it-IT", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    )}
                  </div>
                  <Badge variant="secondary" className="font-mono text-xs font-bold">
                    {currentFormation.formationId}
                  </Badge>
                </div>

                {/* 2D PITCH CONTAINER */}
                <div className="relative w-full rounded-2xl shadow-inner overflow-hidden border-2 border-emerald-950/60 select-none bg-emerald-900/40">
                  {/* SVG PITCH MARKINGS */}
                  <svg
                    viewBox="0 0 100 140"
                    preserveAspectRatio="none"
                    className="w-full h-[400px] sm:h-[460px] pointer-events-none block"
                  >
                    <defs>
                      <linearGradient id="opScoutPitchGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#064e3b" stopOpacity="0.95" />
                        <stop offset="50%" stopColor="#047857" stopOpacity="0.88" />
                        <stop offset="100%" stopColor="#064e3b" stopOpacity="0.95" />
                      </linearGradient>
                      <pattern id="opScoutStripes" width="100" height="20" patternUnits="userSpaceOnUse">
                        <rect width="100" height="10" fill="#ffffff" fillOpacity="0.03" />
                        <rect y="10" width="100" height="10" fill="transparent" />
                      </pattern>
                    </defs>

                    <rect width="100" height="140" fill="url(#opScoutPitchGrad)" />
                    <rect width="100" height="140" fill="url(#opScoutStripes)" />
                    <rect x="5" y="5" width="90" height="130" fill="none" stroke="#ffffff" strokeWidth="0.8" strokeOpacity="0.45" />
                    <line x1="5" y1="70" x2="95" y2="70" stroke="#ffffff" strokeWidth="0.8" strokeOpacity="0.45" />
                    <circle cx="50" cy="70" r="14" fill="none" stroke="#ffffff" strokeWidth="0.8" strokeOpacity="0.45" />
                    <circle cx="50" cy="70" r="1" fill="#ffffff" strokeOpacity="0.6" />
                    <rect x="22" y="5" width="56" height="24" fill="none" stroke="#ffffff" strokeWidth="0.8" strokeOpacity="0.45" />
                    <rect x="34" y="5" width="32" height="10" fill="none" stroke="#ffffff" strokeWidth="0.8" strokeOpacity="0.45" />
                    <rect x="22" y="111" width="56" height="24" fill="none" stroke="#ffffff" strokeWidth="0.8" strokeOpacity="0.45" />
                    <rect x="34" y="125" width="32" height="10" fill="none" stroke="#ffffff" strokeWidth="0.8" strokeOpacity="0.45" />
                  </svg>

                  {/* 11 STARTERS POSITIONS */}
                  {formationDef.positions.map((pos, slotIdx) => {
                    const player = currentFormation.starters[slotIdx];

                    return (
                      <div
                        key={slotIdx}
                        style={{
                          position: "absolute",
                          left: pos.x,
                          top: pos.y,
                          transform: "translate(-50%, -50%)",
                        }}
                        className="flex flex-col items-center group cursor-default z-10"
                      >
                        {player ? (
                          <div className="flex flex-col items-center">
                            {/* Player Jersey Badge */}
                            <div className="relative flex items-center justify-center h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-slate-900/90 border-2 border-emerald-400 text-white shadow-lg transition-transform group-hover:scale-110">
                              <span className="font-mono font-black text-xs sm:text-sm">
                                {player.NumeroMaglia || slotIdx + 1}
                              </span>
                              <Badge
                                variant="outline"
                                className={`absolute -top-1.5 -right-1 text-[8px] font-black px-1 py-0 leading-none ${getValueColor(
                                  Number(player.OVR) || 0
                                )} bg-background/95`}
                              >
                                {player.OVR}
                              </Badge>
                            </div>

                            {/* Player Name and Role Label */}
                            <div className="mt-1 px-1.5 py-0.5 rounded-md bg-slate-950/85 backdrop-blur-xs border border-white/20 text-center max-w-[85px] sm:max-w-[105px] truncate shadow">
                              <span className="text-[10px] sm:text-[11px] font-extrabold text-white truncate block">
                                {player.Cognome || player.Nome}
                              </span>
                              <span
                                className={`text-[8px] sm:text-[9px] font-bold block ${getRoleColor(
                                  player.Posiz || pos.label
                                )}`}
                              >
                                {player.Posiz || pos.label}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center opacity-60">
                            <div className="h-9 w-9 rounded-full border border-dashed border-white/40 flex items-center justify-center text-white/50 text-[10px] font-mono">
                              {pos.label}
                            </div>
                            <span className="text-[9px] text-white/60 font-semibold mt-0.5">
                              {pos.label}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* BENCH SECTION */}
                {currentFormation.bench && currentFormation.bench.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-emerald-500" />
                      Panchina a disposizione ({currentFormation.bench.length})
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {currentFormation.bench.map((bp) => (
                        <div
                          key={bp.ID}
                          className="p-2 rounded-xl border border-border/80 bg-muted/20 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <Badge
                              variant="secondary"
                              className={`text-[9px] px-1 py-0 font-bold shrink-0 ${getRoleColor(bp.Posiz)}`}
                            >
                              {bp.Posiz}
                            </Badge>
                            <span className="font-bold truncate">
                              {bp.Nome} {bp.Cognome}
                            </span>
                          </div>
                          <span className={`font-mono font-bold ml-1.5 ${getValueColor(Number(bp.OVR) || 0)}`}>
                            {bp.OVR}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: ROSA COMPLETA                                      */}
        {/* ========================================================= */}
        {activeTab === "roster" && (
          <div className="p-5 space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  placeholder="Cerca calciatore per nome o ruolo..."
                  value={rookieSearch}
                  onChange={(e) => setRookieSearch(e.target.value)}
                  className="h-8 pl-9 text-xs"
                />
              </div>
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                {ROLE_GROUPS.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setRosterRoleFilter(g.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors shrink-0 ${
                      rosterRoleFilter === g.id
                        ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40"
                        : "bg-muted/60 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Roster Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-[440px] overflow-y-auto pr-1">
              {filteredRoster.map((player) => (
                <div
                  key={player.ID}
                  className="p-3 rounded-xl border border-border/80 bg-card hover:border-emerald-500/40 transition-all flex items-center justify-between gap-2 shadow-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center font-mono font-bold text-xs text-muted-foreground shrink-0">
                      {player.NumeroMaglia || "#"}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-xs truncate flex items-center gap-1.5">
                        <Badge
                          variant="secondary"
                          className={`text-[9px] px-1 py-0 font-bold shrink-0 ${getRoleColor(player.Posiz)}`}
                        >
                          {player.Posiz}
                        </Badge>
                        <span className="truncate">{player.Nome} {player.Cognome}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground flex items-center gap-2 mt-0.5">
                        <span>{player.Età} anni</span>
                        <span>{getNationalityFlag(player.Nazionalità)} {player.Nazionalità}</span>
                      </div>
                    </div>
                  </div>

                  <Badge
                    variant="outline"
                    className={`font-mono text-xs font-black shrink-0 ${getValueColor(Number(player.OVR) || 0)}`}
                  >
                    {player.OVR}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: ANDAMENTO & ULTIMI INCONTRI                       */}
        {/* ========================================================= */}
        {activeTab === "matches" && (
          <div className="p-5 space-y-5">
            {/* Team Telemetry Stats Summary */}
            {standings && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl border border-border bg-muted/20 text-center">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Vinte / Nulle / Perse</span>
                  <div className="font-mono font-extrabold text-sm text-foreground mt-0.5">
                    {standings.wins}V - {standings.draws}N - {standings.losses}P
                  </div>
                </div>
                <div className="p-3 rounded-xl border border-border bg-muted/20 text-center">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Gol Fatti / Subiti</span>
                  <div className="font-mono font-extrabold text-sm text-foreground mt-0.5">
                    {standings.goalsFor} : {standings.goalsAgainst}
                  </div>
                </div>
                <div className="p-3 rounded-xl border border-border bg-muted/20 text-center">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Differenza Reti</span>
                  <div className={`font-mono font-extrabold text-sm mt-0.5 ${standings.goalDiff > 0 ? "text-emerald-500" : standings.goalDiff < 0 ? "text-rose-500" : "text-muted-foreground"}`}>
                    {standings.goalDiff > 0 ? `+${standings.goalDiff}` : standings.goalDiff}
                  </div>
                </div>
                <div className="p-3 rounded-xl border border-border bg-muted/20 text-center">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Punti in Classifica</span>
                  <div className="font-mono font-extrabold text-sm text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {standings.points} PT
                  </div>
                </div>
              </div>
            )}

            {/* Matches List */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-emerald-500" />
                Ultimi Incontri Giocati ({scoutData?.recentMatches?.length || 0})
              </span>

              {scoutData?.recentMatches?.length === 0 ? (
                <div className="text-center py-8 text-xs text-muted-foreground">
                  Nessun incontro disputato registrato di recente.
                </div>
              ) : (
                <div className="divide-y divide-border/60 rounded-xl border border-border/80 bg-card overflow-hidden">
                  {scoutData?.recentMatches?.map((match, i) => (
                    <div
                      key={i}
                      className="p-3.5 flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Result pill */}
                        <span
                          className={`h-7 w-7 rounded-xl text-xs font-mono font-black flex items-center justify-center text-white shrink-0 shadow-xs ${
                            match.result === "V"
                              ? "bg-emerald-600"
                              : match.result === "N"
                              ? "bg-amber-500"
                              : "bg-rose-600"
                          }`}
                        >
                          {match.result}
                        </span>

                        <div className="min-w-0">
                          <div className="font-bold text-sm text-foreground flex items-center gap-2">
                            <span>vs {match.opponentVsName}</span>
                            <Badge variant="outline" className="text-[9px] font-mono px-1 py-0">
                              {match.isHome ? "Casa" : "Trasferta"}
                            </Badge>
                          </div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">
                            Giornata {match.week} • Stagione {match.stag}
                          </div>
                        </div>
                      </div>

                      {/* Final Score */}
                      <div className="font-mono font-black text-base px-3 py-1 rounded-lg bg-muted/60 border border-border">
                        {match.homeGoals} - {match.awayGoals}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

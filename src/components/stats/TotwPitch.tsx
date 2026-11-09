import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, Star, Crown, ChevronLeft, ChevronRight, Loader2, Sparkles, Shield, Target, Flame } from "lucide-react";
import { SUPABASE_STORAGE_URL } from "@/constants/App";
import { getRoleColor, getPlayerImage } from "@/utils/functions";
import { fetchAvailableTotwWeeks, fetchTotwForWeek, TotwResult, TotwPlayer } from "@/services/totwService";

interface TotwPitchProps {
  initialSeason?: number;
  initialWeek?: number;
  onSelectPlayer?: (playerId: number) => void;
}

export function TotwPitch({ initialSeason = 11, initialWeek, onSelectPlayer }: TotwPitchProps) {
  const [season, setSeason] = useState<number>(initialSeason);
  const [availableWeeks, setAvailableWeeks] = useState<number[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [totwData, setTotwData] = useState<TotwResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Available seasons in the system
  const seasonsList = [11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

  // Load available weeks whenever season changes
  useEffect(() => {
    let isCancelled = false;
    async function loadWeeks() {
      setIsLoading(true);
      const weeks = await fetchAvailableTotwWeeks(season);
      if (isCancelled) return;

      setAvailableWeeks(weeks);

      // Determine initial week to pick
      let targetW = 1;
      if (initialWeek && weeks.includes(initialWeek)) {
        targetW = initialWeek;
      } else if (weeks.length > 0) {
        // Pick latest played week by default
        targetW = weeks[weeks.length - 1];
      }
      setSelectedWeek(targetW);

      // If no weeks found in season 11, fallback to 10
      if (weeks.length === 0 && season === 11) {
        setSeason(10);
      }
    }

    loadWeeks();
    return () => {
      isCancelled = true;
    };
  }, [season]);

  // Load TOTW for the selected week
  useEffect(() => {
    if (!selectedWeek) return;
    let isCancelled = false;
    async function loadTotw() {
      setIsLoading(true);
      const res = await fetchTotwForWeek(season, selectedWeek);
      if (!isCancelled) {
        setTotwData(res);
        setIsLoading(false);
      }
    }
    loadTotw();
    return () => {
      isCancelled = true;
    };
  }, [season, selectedWeek]);

  const currentWeekIdx = availableWeeks.indexOf(selectedWeek);
  const hasPrev = currentWeekIdx > 0;
  const hasNext = currentWeekIdx >= 0 && currentWeekIdx < availableWeeks.length - 1;

  const handlePrevWeek = () => {
    if (hasPrev) setSelectedWeek(availableWeeks[currentWeekIdx - 1]);
  };

  const handleNextWeek = () => {
    if (hasNext) setSelectedWeek(availableWeeks[currentWeekIdx + 1]);
  };

  return (
    <div className="space-y-6">
      {/* HEADER & CONTROLS */}
      <Card className="border-border/80 bg-gradient-to-r from-card via-card/95 to-background shadow-md overflow-hidden">
        <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/40 text-xs font-black uppercase tracking-wider flex items-center gap-1">
                <Crown className="h-3.5 w-3.5 fill-amber-500/30" /> Team of the Week
              </Badge>
              <span className="text-xs text-muted-foreground font-mono">
                Modulo Tattico Ufficiale 4-3-3
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
              Squadra della Settimana
              {totwData && (
                <span className="text-amber-500 font-mono text-lg sm:text-xl">
                  • G{totwData.week}
                </span>
              )}
            </h2>
            <p className="text-xs text-muted-foreground">
              I migliori 11 calciatori del turno selezionati automaticamente per voto e rendimento sul campo.
            </p>
          </div>

          {/* SEASON & WEEK SELECTORS */}
          <div className="flex items-center gap-2.5 flex-wrap self-start md:self-center">
            {/* Season select */}
            <Select value={String(season)} onValueChange={(val) => setSeason(Number(val))}>
              <SelectTrigger className="w-[125px] h-9 text-xs font-bold bg-background">
                <SelectValue placeholder="Stagione" />
              </SelectTrigger>
              <SelectContent>
                {seasonsList.map((s) => (
                  <SelectItem key={s} value={String(s)} className="text-xs font-semibold">
                    Stagione {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Week navigation buttons & select */}
            <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border/80">
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrevWeek}
                disabled={!hasPrev}
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                title="Giornata precedente"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <Select
                value={String(selectedWeek)}
                onValueChange={(val) => setSelectedWeek(Number(val))}
              >
                <SelectTrigger className="w-[110px] h-7 text-xs font-bold border-none bg-transparent shadow-none px-2">
                  <SelectValue placeholder="Giornata" />
                </SelectTrigger>
                <SelectContent>
                  {availableWeeks.map((w) => (
                    <SelectItem key={w} value={String(w)} className="text-xs font-semibold">
                      Giornata {w}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleNextWeek}
                disabled={!hasNext}
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                title="Giornata successiva"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* STATS STRIP */}
        {totwData && (
          <div className="px-5 py-2.5 bg-muted/30 border-t border-border/60 flex items-center justify-between gap-4 text-xs font-medium flex-wrap">
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground">
                Rating Medio Formazione:{" "}
                <strong className="text-amber-500 font-mono font-bold text-sm">
                  ★ {totwData.averageRating}
                </strong>
              </span>
              <span>•</span>
              <span className="text-muted-foreground">
                Giocatori Selezionati: <strong className="text-foreground">11 titolari</strong>
              </span>
            </div>
            {totwData.mvp && (
              <div className="flex items-center gap-1.5 text-xs text-amber-500 font-bold">
                <Crown className="h-4 w-4 fill-amber-500" />
                <span>MVP della Settimana:</span>
                <span className="text-foreground underline underline-offset-2">
                  {totwData.mvp.fullName} ({totwData.mvp.vote})
                </span>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* TACTICAL 2D PITCH */}
      {isLoading ? (
        <Card className="p-16 border-dashed flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          <span className="text-xs font-semibold">Calcolo Top 11 di Giornata in corso...</span>
        </Card>
      ) : !totwData || totwData.players.length === 0 ? (
        <Card className="p-16 border-dashed text-center space-y-2">
          <Trophy className="h-8 w-8 mx-auto text-muted-foreground/40" />
          <h3 className="text-base font-bold text-foreground">Nessun dato disponibile</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Non sono presenti voti o referti gara registrati per la Giornata {selectedWeek} della Stagione {season}.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: 2D PITCH (8 Cols on Desktop) */}
          <div className="lg:col-span-8">
            <div className="relative w-full rounded-2xl shadow-xl overflow-hidden border-2 border-emerald-950/80 select-none bg-gradient-to-b from-emerald-900/50 via-emerald-950/80 to-emerald-900/60">
              {/* SVG PITCH MARKINGS */}
              <svg
                viewBox="0 0 100 135"
                preserveAspectRatio="none"
                className="w-full h-[580px] sm:h-[660px] pointer-events-none block opacity-85"
              >
                {/* Grass stripe bands */}
                <defs>
                  <pattern id="totw-stripes" width="100" height="20" patternUnits="userSpaceOnUse">
                    <rect width="100" height="10" fill="rgba(255,255,255,0.015)" />
                    <rect y="10" width="100" height="10" fill="transparent" />
                  </pattern>
                </defs>
                <rect width="100" height="135" fill="url(#totw-stripes)" />

                {/* Outer pitch boundary line */}
                <rect
                  x="5"
                  y="5"
                  width="90"
                  height="125"
                  fill="none"
                  stroke="rgba(255,255,255,0.35)"
                  strokeWidth="0.8"
                />

                {/* Halfway line */}
                <line
                  x1="5"
                  y1="67.5"
                  x2="95"
                  y2="67.5"
                  stroke="rgba(255,255,255,0.35)"
                  strokeWidth="0.8"
                />

                {/* Center circle */}
                <circle
                  cx="50"
                  cy="67.5"
                  r="12"
                  fill="none"
                  stroke="rgba(255,255,255,0.35)"
                  strokeWidth="0.8"
                />
                <circle cx="50" cy="67.5" r="0.9" fill="rgba(255,255,255,0.5)" />

                {/* Top Goal & Penalty Area (Opponent side) */}
                <rect
                  x="26"
                  y="5"
                  width="48"
                  height="22"
                  fill="none"
                  stroke="rgba(255,255,255,0.35)"
                  strokeWidth="0.8"
                />
                <rect
                  x="37"
                  y="5"
                  width="26"
                  height="8"
                  fill="none"
                  stroke="rgba(255,255,255,0.35)"
                  strokeWidth="0.8"
                />
                <path
                  d="M 40 27 A 10 10 0 0 0 60 27"
                  fill="none"
                  stroke="rgba(255,255,255,0.35)"
                  strokeWidth="0.8"
                />

                {/* Bottom Goal & Penalty Area (Our side - GK side) */}
                <rect
                  x="26"
                  y="108"
                  width="48"
                  height="22"
                  fill="none"
                  stroke="rgba(255,255,255,0.35)"
                  strokeWidth="0.8"
                />
                <rect
                  x="37"
                  y="122"
                  width="26"
                  height="8"
                  fill="none"
                  stroke="rgba(255,255,255,0.35)"
                  strokeWidth="0.8"
                />
                <path
                  d="M 40 108 A 10 10 0 0 1 60 108"
                  fill="none"
                  stroke="rgba(255,255,255,0.35)"
                  strokeWidth="0.8"
                />
              </svg>

              {/* 11 PLAYERS OVERLAY */}
              {totwData.players.map((p) => {
                const isGk = p.position === "POR";
                return (
                  <div
                    key={`${p.slotLabel}-${p.id}`}
                    onClick={() => onSelectPlayer?.(p.id)}
                    style={{
                      left: `${p.coordinates.x}%`,
                      top: `${p.coordinates.y}%`,
                      transform: "translate(-50%, -50%)",
                    }}
                    className={`absolute z-10 flex flex-col items-center cursor-pointer transition-transform duration-200 hover:scale-110 group ${
                      onSelectPlayer ? "cursor-pointer" : "cursor-default"
                    }`}
                  >
                    {/* Circle Avatar with Glowing Border */}
                    <div className="relative">
                      {/* MVP Crown */}
                      {p.isMvp && (
                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 text-[8px] font-black uppercase tracking-wider shadow-lg border border-yellow-200">
                          <Crown className="h-2.5 w-2.5 fill-slate-950" />
                          MVP
                        </div>
                      )}

                      {/* Photo / Avatar Circle */}
                      <div
                        className={`h-11 w-11 sm:h-13 sm:w-13 rounded-full overflow-hidden bg-slate-950 border-2 shadow-xl relative transition-all ${
                          p.isMvp
                            ? "border-amber-400 ring-4 ring-amber-400/40"
                            : "border-emerald-400 group-hover:border-white ring-2 ring-emerald-500/20"
                        }`}
                      >
                        <img
                          src={getPlayerImage(p.id)}
                          alt={p.surname}
                          className="h-full w-full object-cover object-top"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `${SUPABASE_STORAGE_URL}/images/players/MConti.png`;
                          }}
                        />
                      </div>

                      {/* Team Logo Badge (Top-Left) */}
                      <img
                        src={`${SUPABASE_STORAGE_URL}/images/teams/${p.team}_Logo.png`}
                        alt={p.teamName || p.team}
                        title={`Club: ${p.teamName || p.team}`}
                        className="absolute -top-1 -left-1.5 h-5 w-5 object-contain drop-shadow-md rounded-full bg-slate-950/80 p-0.5 border border-white/20"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `${SUPABASE_STORAGE_URL}/images/LCSIM_Logo_SMALL.png`;
                        }}
                      />

                      {/* Role Pill Badge (Top-Right) */}
                      <span
                        className={`absolute -top-1 -right-1 text-[8.5px] font-black px-1 py-0 rounded border leading-none shadow ${getRoleColor(
                          p.position
                        )}`}
                      >
                        {p.position}
                      </span>

                      {/* Rating Badge (Bottom-Right / Golden) */}
                      <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-mono font-black text-[10px] shadow-lg border border-yellow-200 flex items-center gap-0.5">
                        <Star className="h-2.5 w-2.5 fill-slate-950" />
                        {p.vote.toFixed(1)}
                      </div>
                    </div>

                    {/* Name + Performance Capsule */}
                    <div className="mt-1 px-2 py-0.5 rounded-md bg-slate-950/90 backdrop-blur-md border border-white/20 text-center max-w-[85px] sm:max-w-[105px] truncate shadow-lg">
                      <span className="text-[10px] sm:text-[11px] font-black text-white truncate block leading-tight">
                        {p.surname || p.name}
                      </span>
                      <div className="text-[9px] font-mono font-bold text-amber-400 truncate flex items-center justify-center gap-1">
                        {isGk ? (
                          p.saves > 0 ? (
                            <span>{p.saves} parate</span>
                          ) : (
                            <span>Clean sheet</span>
                          )
                        ) : p.goals > 0 ? (
                          <span>⚽ {p.goals > 1 ? `x${p.goals}` : "Gol"}</span>
                        ) : p.assists > 0 ? (
                          <span>🎯 {p.assists > 1 ? `x${p.assists}` : "Assist"}</span>
                        ) : p.tackles > 0 ? (
                          <span>🛡️ {p.tackles} contr.</span>
                        ) : (
                          <span className="text-slate-400 font-normal">{p.minutes}' min</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT: MVP CARD & COMPLETE SQUAD LIST (4 Cols on Desktop) */}
          <div className="lg:col-span-4 space-y-4">
            {/* MVP HIGHLIGHT BOX */}
            {totwData.mvp && (
              <Card
                onClick={() => onSelectPlayer?.(totwData.mvp!.id)}
                className={`overflow-hidden border-2 border-amber-500/60 bg-gradient-to-br from-amber-500/10 via-card to-card shadow-lg relative ${
                  onSelectPlayer ? "cursor-pointer hover:border-amber-400 transition-colors" : ""
                }`}
              >
                <div className="p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider flex items-center gap-1">
                      <Crown className="h-3 w-3 fill-slate-950" /> Migliore della Settimana
                    </Badge>
                    <div className="flex items-center gap-1 font-mono font-black text-lg text-amber-500">
                      <Star className="h-4 w-4 fill-amber-500" />
                      {totwData.mvp.vote.toFixed(1)}
                    </div>
                  </div>

                  <div className="flex items-center gap-3.5">
                    <div className="h-16 w-16 rounded-2xl overflow-hidden border-2 border-amber-400 bg-slate-950 shrink-0 shadow-md">
                      <img
                        src={getPlayerImage(totwData.mvp.id)}
                        alt={totwData.mvp.surname}
                        className="h-full w-full object-cover object-top"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `${SUPABASE_STORAGE_URL}/images/players/MConti.png`;
                        }}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge
                          variant="outline"
                          className={`${getRoleColor(totwData.mvp.position)} text-[10px] font-bold px-1.5 py-0`}
                        >
                          {totwData.mvp.position}
                        </Badge>
                        <span className="text-xs font-semibold text-muted-foreground truncate">
                          {totwData.mvp.teamName || totwData.mvp.team}
                        </span>
                      </div>
                      <h3 className="text-base font-black text-foreground truncate mt-0.5">
                        {totwData.mvp.fullName}
                      </h3>
                      <p className="text-[11px] text-muted-foreground font-mono">
                        {totwData.mvp.minutes}' giocati
                        {totwData.mvp.goals > 0 && ` • ⚽ ${totwData.mvp.goals} gol`}
                        {totwData.mvp.assists > 0 && ` • 🎯 ${totwData.mvp.assists} assist`}
                        {totwData.mvp.saves > 0 && ` • 🧤 ${totwData.mvp.saves} parate`}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* SQUAD BREAKDOWN BY DEPARTMENT */}
            <Card className="border-border/80 bg-card shadow-sm">
              <CardHeader className="py-3 px-4 border-b border-border/60 bg-muted/20">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                  <span>I Magnifici 11 del Turno</span>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    G{selectedWeek}
                  </Badge>
                </CardTitle>
              </CardHeader>

              <CardContent className="p-2 space-y-1 divide-y divide-border/40">
                {totwData.players.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => onSelectPlayer?.(p.id)}
                    className={`pt-1.5 pb-1 px-2 rounded-lg flex items-center justify-between gap-2 hover:bg-muted/40 transition-colors ${
                      onSelectPlayer ? "cursor-pointer" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge
                        variant="outline"
                        className={`text-[9px] font-mono px-1 py-0 shrink-0 ${getRoleColor(p.position)}`}
                      >
                        {p.slotLabel}
                      </Badge>
                      <img
                        src={`${SUPABASE_STORAGE_URL}/images/teams/${p.team}_Logo.png`}
                        alt={p.teamName || p.team}
                        title={p.teamName || p.team}
                        className="h-5 w-5 object-contain shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `${SUPABASE_STORAGE_URL}/images/LCSIM_Logo_SMALL.png`;
                        }}
                      />
                      <span className="text-xs font-bold text-foreground truncate">
                        {p.surname}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {p.goals > 0
                          ? `⚽ x${p.goals}`
                          : p.assists > 0
                          ? `🎯 x${p.assists}`
                          : p.saves > 0
                          ? `🧤 ${p.saves}`
                          : `${p.tackles} c.`}
                      </span>
                      <Badge
                        className={`font-mono text-xs font-black px-1.5 py-0 ${
                          p.isMvp
                            ? "bg-amber-500 text-slate-950 font-black border-amber-300"
                            : "bg-muted text-foreground border-border/80"
                        }`}
                      >
                        {p.vote.toFixed(1)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

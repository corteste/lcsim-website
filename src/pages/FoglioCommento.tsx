import React, { useState, useEffect, useMemo } from "react";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tv,
  Calendar,
  MapPin,
  Clock,
  Shield,
  Users,
  Lock,
  Unlock,
  AlertTriangle,
  Info,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Swords,
  CloudSun,
  ShieldCheck,
  UserCheck,
  Ban,
} from "lucide-react";
import {
  fetchTeamDisciplinaryStatus,
  PlayerDisciplinaryStatus,
} from "@/services/disciplineService";
import { useAuth } from "@/context/AuthContext";
import { Player } from "@/types/player";
import {
  fetchAvailableSeasonsAndWeeks,
  fetchDeadlineInfo,
  fetchWeekMatches,
  fetchTeamSheetFormation,
  SheetMatch,
  SheetTeamFormation,
  DeadlineInfo,
} from "@/services/foglioCommentoService";
import { EA_FC25_FORMATIONS } from "@/pages/Tattica";
import {
  getRoleColor,
  getValueColor,
  getPlayerImage,
  getNationalityFlag,
  getTeamBackground,
} from "@/utils/functions";
import PlayerDetails from "@/components/player/playerDetails";

export const FoglioCommento: React.FC = () => {
  const { user, isAdmin } = useAuth();

  // 1. Dati disponibilità (Stagioni e Giornate)
  const [availableData, setAvailableData] = useState<{
    seasons: number[];
    weeksBySeason: Record<number, number[]>;
  }>({
    seasons: [10],
    weeksBySeason: { 10: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
  });

  const [selectedSeason, setSelectedSeason] = useState<number>(10);
  const [selectedWeek, setSelectedWeek] = useState<number>(1);

  // 2. Partite della giornata selezionata
  const [matches, setMatches] = useState<SheetMatch[]>([]);
  const [selectedMatchIndex, setSelectedMatchIndex] = useState<number>(0);

  // 3. Info scadenza / blocco
  const [deadlineInfo, setDeadlineInfo] = useState<DeadlineInfo>({
    hasDeadline: false,
    deadlineIso: null,
    isForceClosed: false,
    isExpired: true,
    isLockedForManagers: false,
    description: null,
  });

  // 4. Formazioni Casa & Trasferta
  const [homeFormation, setHomeFormation] = useState<SheetTeamFormation | null>(null);
  const [awayFormation, setAwayFormation] = useState<SheetTeamFormation | null>(null);

  // Provvedimenti Disciplinari (Squalifiche e Diffide #38)
  const [homeDisciplinaryMap, setHomeDisciplinaryMap] = useState<Record<number, PlayerDisciplinaryStatus>>({});
  const [awayDisciplinaryMap, setAwayDisciplinaryMap] = useState<Record<number, PlayerDisciplinaryStatus>>({});

  // 5. Stati UI & caricamento
  const [isLoadingMeta, setIsLoadingMeta] = useState<boolean>(true);
  const [isLoadingFormations, setIsLoadingFormations] = useState<boolean>(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  // Inizializzazione stagioni & giornate disponibili
  useEffect(() => {
    async function loadMeta() {
      setIsLoadingMeta(true);
      try {
        const meta = await fetchAvailableSeasonsAndWeeks();
        setAvailableData(meta);

        // Seleziona la stagione più recente
        if (meta.seasons.length > 0) {
          const defaultStag = meta.seasons[0];
          setSelectedSeason(defaultStag);
          const weeks = meta.weeksBySeason[defaultStag] || [1];
          setSelectedWeek(weeks[0]);
        }
      } catch (err) {
        console.error("Errore caricamento metadata foglio commento:", err);
      } finally {
        setIsLoadingMeta(false);
      }
    }
    loadMeta();
  }, []);

  // Quando cambiano stagione o giornata: ricarica partite e scadenza
  useEffect(() => {
    let isCancelled = false;

    async function loadWeekData() {
      setIsLoadingFormations(true);
      try {
        const [dInfo, weekMatches] = await Promise.all([
          fetchDeadlineInfo(selectedSeason, selectedWeek),
          fetchWeekMatches(selectedSeason, selectedWeek),
        ]);

        if (isCancelled) return;
        setDeadlineInfo(dInfo);
        setMatches(weekMatches);
        setSelectedMatchIndex(0);
      } catch (err) {
        console.error("Errore caricamento partite giornata:", err);
      } finally {
        if (!isCancelled) setIsLoadingFormations(false);
      }
    }

    loadWeekData();

    return () => {
      isCancelled = true;
    };
  }, [selectedSeason, selectedWeek]);

  // Partita attualmente selezionata
  const currentMatch = useMemo(() => {
    if (matches.length === 0) return null;
    return matches[selectedMatchIndex] || matches[0];
  }, [matches, selectedMatchIndex]);

  // Quando cambia l'incontro selezionato: carica formazioni dei due club
  useEffect(() => {
    let isCancelled = false;

    async function loadFormations() {
      if (!currentMatch) {
        setHomeFormation(null);
        setAwayFormation(null);
        return;
      }

      setIsLoadingFormations(true);
      try {
        const [homeRes, awayRes, homeDisc, awayDisc] = await Promise.all([
          fetchTeamSheetFormation(
            currentMatch.homeTeamId,
            selectedSeason,
            selectedWeek,
            currentMatch.isPlayed
          ),
          fetchTeamSheetFormation(
            currentMatch.awayTeamId,
            selectedSeason,
            selectedWeek,
            currentMatch.isPlayed
          ),
          fetchTeamDisciplinaryStatus(
            currentMatch.homeTeamId,
            selectedSeason,
            selectedWeek
          ),
          fetchTeamDisciplinaryStatus(
            currentMatch.awayTeamId,
            selectedSeason,
            selectedWeek
          ),
        ]);

        if (isCancelled) return;
        setHomeFormation(homeRes);
        setAwayFormation(awayRes);
        setHomeDisciplinaryMap(homeDisc);
        setAwayDisciplinaryMap(awayDisc);
      } catch (err) {
        console.error("Errore caricamento formazioni incontro:", err);
      } finally {
        if (!isCancelled) setIsLoadingFormations(false);
      }
    }

    loadFormations();

    return () => {
      isCancelled = true;
    };
  }, [currentMatch, selectedSeason, selectedWeek]);

  // Formato data scadenza
  const formattedDeadline = useMemo(() => {
    if (!deadlineInfo.deadlineIso) return null;
    try {
      const d = new Date(deadlineInfo.deadlineIso);
      return d.toLocaleDateString("it-IT", {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return deadlineInfo.deadlineIso;
    }
  }, [deadlineInfo.deadlineIso]);

  // Giocatori squalificati e diffidati dei due club
  const homeSuspended = useMemo(() => {
    if (!homeFormation) return [];
    return homeFormation.allRoster.filter(
      (p) => homeDisciplinaryMap[Number(p.ID)]?.isSuspended
    );
  }, [homeFormation, homeDisciplinaryMap]);

  const homeWarned = useMemo(() => {
    if (!homeFormation) return [];
    return homeFormation.allRoster.filter(
      (p) => homeDisciplinaryMap[Number(p.ID)]?.isWarned
    );
  }, [homeFormation, homeDisciplinaryMap]);

  const awaySuspended = useMemo(() => {
    if (!awayFormation) return [];
    return awayFormation.allRoster.filter(
      (p) => awayDisciplinaryMap[Number(p.ID)]?.isSuspended
    );
  }, [awayFormation, awayDisciplinaryMap]);

  const awayWarned = useMemo(() => {
    if (!awayFormation) return [];
    return awayFormation.allRoster.filter(
      (p) => awayDisciplinaryMap[Number(p.ID)]?.isWarned
    );
  }, [awayFormation, awayDisciplinaryMap]);

  // Risoluzione posizioni tattiche per il modulo di casa e trasferta
  const homeFormationDef = useMemo(() => {
    if (!homeFormation) return EA_FC25_FORMATIONS[0];
    return (
      EA_FC25_FORMATIONS.find((f) => f.id === homeFormation.formationId) ||
      EA_FC25_FORMATIONS[0]
    );
  }, [homeFormation]);

  const awayFormationDef = useMemo(() => {
    if (!awayFormation) return EA_FC25_FORMATIONS[0];
    return (
      EA_FC25_FORMATIONS.find((f) => f.id === awayFormation.formationId) ||
      EA_FC25_FORMATIONS[0]
    );
  }, [awayFormation]);

  // Verifica visibilità protetta: se bloccata e non admin
  const isProtectedFromUser = deadlineInfo.isLockedForManagers && !isAdmin;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      <main className="container mx-auto px-4 py-8 space-y-6 max-w-7xl flex-1">
        {/* Header Broadcast */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-border/80">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge
                variant="outline"
                className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30 font-bold px-2.5 py-0.5 text-[11px] uppercase tracking-wider flex items-center gap-1.5"
              >
                <Tv className="h-3.5 w-3.5" />
                Campionato LCSIM • Sala Stampa &amp; Telecronaca
              </Badge>
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight flex items-center gap-3">
              Foglio Commento Partita
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              Schieramenti ufficiali degli 11 titolari e panchina a disposizione per la telecronaca, analisi e diretta streaming.
            </p>
          </div>

          {/* Selettori Stagione & Giornata */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Selettore Stagione */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Stagione:
              </span>
              <Select
                value={String(selectedSeason)}
                onValueChange={(val) => {
                  const s = Number(val);
                  setSelectedSeason(s);
                  const weeks = availableData.weeksBySeason[s] || [1];
                  setSelectedWeek(weeks[0]);
                }}
              >
                <SelectTrigger className="w-[130px] h-9 text-xs font-bold bg-card border-border">
                  <SelectValue placeholder="Stagione" />
                </SelectTrigger>
                <SelectContent>
                  {availableData.seasons.map((s) => (
                    <SelectItem key={s} value={String(s)} className="text-xs font-semibold">
                      Stagione {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Selettore Giornata */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Giornata:
              </span>
              <Select
                value={String(selectedWeek)}
                onValueChange={(val) => setSelectedWeek(Number(val))}
              >
                <SelectTrigger className="w-[140px] h-9 text-xs font-bold bg-card border-border">
                  <SelectValue placeholder="Giornata" />
                </SelectTrigger>
                <SelectContent>
                  {(availableData.weeksBySeason[selectedSeason] || [1]).map((w) => (
                    <SelectItem key={w} value={String(w)} className="text-xs font-semibold">
                      Giornata {w}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Barra di Stato Scadenza & Protezione Formazioni */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-card border border-border/80 shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            {deadlineInfo.isLockedForManagers ? (
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
                <Lock className="h-4 w-4" />
              </div>
            ) : (
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shrink-0">
                <Unlock className="h-4 w-4" />
              </div>
            )}
            <div className="min-w-0 text-xs">
              <div className="font-bold text-foreground flex items-center gap-1.5">
                <span>Stato Consegna Giornata {selectedWeek}</span>
                {deadlineInfo.description && (
                  <span className="text-muted-foreground font-normal">({deadlineInfo.description})</span>
                )}
              </div>
              <div className="text-muted-foreground truncate">
                {deadlineInfo.hasDeadline ? (
                  deadlineInfo.isExpired ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      Termine consegna concluso • Formazioni ufficiali pubbliche
                    </span>
                  ) : (
                    <span>
                      Scadenza formazioni: <strong>{formattedDeadline}</strong>
                    </span>
                  )
                ) : (
                  <span>Partite concluse • Formazioni storicizzate disponibili</span>
                )}
              </div>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            {deadlineInfo.isLockedForManagers ? (
              isAdmin ? (
                <Badge className="bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" /> Anteprima Admin (Scadenza in corso)
                </Badge>
              ) : (
                <Badge variant="destructive" className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                  <Lock className="h-3 w-3" /> Formazioni Riservate
                </Badge>
              )
            ) : (
              <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                <Unlock className="h-3 w-3" /> Formazioni Sbloccate
              </Badge>
            )}
          </div>
        </div>

        {/* Selettore Rapido Match della Giornata (Opzione A1 richiesta) */}
        {matches.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs px-1">
              <span className="font-extrabold uppercase tracking-wider text-muted-foreground">
                Incontri in Programma ({matches.length}):
              </span>
              <span className="text-muted-foreground font-mono text-[11px]">
                Incontro {selectedMatchIndex + 1} di {matches.length}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {matches.map((m, idx) => {
                const isSelected = selectedMatchIndex === idx;

                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMatchIndex(idx)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between gap-1.5 ${
                      isSelected
                        ? "bg-primary/10 border-primary text-foreground shadow-sm ring-1 ring-primary/30"
                        : "bg-card border-border hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono font-black text-xs">
                      <span className="truncate">{m.homeTeamAbbr}</span>
                      <span className="text-[10px] text-muted-foreground mx-1">vs</span>
                      <span className="truncate">{m.awayTeamAbbr}</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-border/40">
                      {m.isPlayed ? (
                        <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
                          {m.homeScore} - {m.awayScore}
                        </span>
                      ) : (
                        <span className="text-muted-foreground font-semibold truncate text-[10px]">
                          {m.stadium ? m.stadium.replace("Stadio ", "") : "In programma"}
                        </span>
                      )}
                      {isSelected && (
                        <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Gestione Blocco Riservatezza per i Manager */}
        {isProtectedFromUser ? (
          <Card className="border-border/80 bg-card p-10 text-center space-y-4 max-w-2xl mx-auto shadow-md">
            <div className="p-4 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 w-16 h-16 mx-auto flex items-center justify-center border border-purple-500/20">
              <Lock className="h-8 w-8" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-2xl font-black">Formazioni Riservate</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Le formazioni ufficiali consegnate dai club per la <strong>Giornata {selectedWeek}</strong> sono attualmente segrete per garantire la massima regolarità sportiva e prevenire lo scouting anticipato.
              </p>
            </div>

            {deadlineInfo.deadlineIso && (
              <div className="p-3.5 rounded-xl bg-muted/60 border border-border/70 text-xs inline-block max-w-md mx-auto">
                <span className="text-muted-foreground block text-[11px]">Sblocco e consultazione pubblica a partire da:</span>
                <span className="font-mono font-bold text-foreground text-sm">
                  {formattedDeadline}
                </span>
              </div>
            )}

            <div className="pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  // Passa a una giornata passata sbloccata
                  setSelectedSeason(10);
                  setSelectedWeek(1);
                }}
                className="text-xs font-semibold gap-1.5"
              >
                <Calendar className="h-3.5 w-3.5" />
                Consulta Formazioni Stagione 10 (Sbloccate)
              </Button>
            </div>
          </Card>
        ) : (
          /* SCHERMATA COMPLETA FOGLIO COMMENTO (CASA VS TRASFERTA) */
          <div className="space-y-6">
            {/* Banner Match Selezionato */}
            {currentMatch && (
              <Card className="border-border/80 bg-card shadow-sm overflow-hidden">
                <CardContent className="p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
                    <div className="flex items-center gap-2">
                      <span className="text-base sm:text-lg font-black text-foreground">
                        {currentMatch.homeTeamName}
                      </span>
                      <Badge variant="outline" className="text-[10px] font-mono font-bold">
                        CASA
                      </Badge>
                    </div>

                    <div className="px-3 py-1 rounded-xl bg-muted font-mono font-black text-sm shrink-0 border border-border">
                      {currentMatch.isPlayed
                        ? `${currentMatch.homeScore} - ${currentMatch.awayScore}`
                        : "VS"}
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] font-mono font-bold">
                        TRASFERTA
                      </Badge>
                      <span className="text-base sm:text-lg font-black text-foreground">
                        {currentMatch.awayTeamName}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground border-t md:border-t-0 pt-2 md:pt-0 w-full md:w-auto justify-between md:justify-end">
                    {currentMatch.stadium && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                        {currentMatch.stadium}
                      </span>
                    )}
                    {currentMatch.referee && (
                      <span className="flex items-center gap-1">
                        <UserCheck className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                        Arbitro: {currentMatch.referee}
                      </span>
                    )}
                    {currentMatch.weather && (
                      <span className="flex items-center gap-1">
                        <CloudSun className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                        {currentMatch.weather}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Layout a 2 Colonne Affiancate: Squadra Casa vs Squadra Trasferta */}
            {isLoadingFormations ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-xs font-semibold">Caricamento formazioni e schieramenti in corso...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. COLONNA SQUADRA CASA */}
                {/* Box Provvedimenti Disciplinari: Squalificati & Diffidati */}
                <div className="lg:col-span-2">
                  <Card className="border-border/80 bg-card shadow-sm overflow-hidden">
                    <CardHeader className="py-2.5 px-4 border-b border-border/60 bg-muted/30">
                      <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-foreground font-black">
                          <Ban className="h-4 w-4 text-rose-500" />
                          Provvedimenti Disciplinari &amp; Squalifiche (Giornata {selectedWeek})
                        </span>
                        <Badge variant="outline" className="text-[10px] font-mono border-border/80">
                          Regolamento Cartellini
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Lato Casa */}
                      <div className="p-3.5 rounded-xl border border-border/70 bg-muted/20 space-y-3">
                        <div className="flex items-center justify-between border-b border-border/60 pb-2">
                          <span className="text-xs font-black uppercase text-foreground flex items-center gap-1.5">
                            <Shield className="h-3.5 w-3.5 text-blue-500" />
                            {homeFormation?.teamName}
                          </span>
                          <Badge variant="outline" className="text-[10px] font-mono">
                            {homeSuspended.length} Squalificati • {homeWarned.length} Diffidati
                          </Badge>
                        </div>

                        {/* Squalificati Casa */}
                        <div className="space-y-1.5">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 block flex items-center gap-1">
                            <Ban className="h-3 w-3" /> Calciatori Squalificati (Assenti):
                          </span>
                          {homeSuspended.length === 0 ? (
                            <p className="text-xs text-muted-foreground italic">Nessun calciatore squalificato</p>
                          ) : (
                            <div className="space-y-1">
                              {homeSuspended.map((p) => {
                                const disc = homeDisciplinaryMap[Number(p.ID)];
                                return (
                                  <div key={p.ID} className="flex items-center justify-between p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <Badge variant="outline" className={`text-[9px] px-1.5 py-0 font-bold ${getRoleColor(p.Posiz)}`}>{p.Posiz}</Badge>
                                      <span className="font-bold text-foreground truncate">{p.Nome} {p.Cognome}</span>
                                    </div>
                                    <Badge variant="destructive" className="text-[9px] px-1.5 py-0 bg-rose-500 text-white shrink-0 font-semibold" title={disc?.suspensionDetails}>
                                      {disc?.suspensionReason === "red_card" ? "Espulsione" : "2 Gialli di fila"}
                                    </Badge>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Diffidati Casa */}
                        <div className="space-y-1.5 pt-1 border-t border-border/50">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" /> Calciatori Diffidati (A rischio squalifica):
                          </span>
                          {homeWarned.length === 0 ? (
                            <p className="text-xs text-muted-foreground italic">Nessun calciatore diffidato</p>
                          ) : (
                            <div className="flex flex-wrap gap-1.5">
                              {homeWarned.map((p) => (
                                <Badge key={p.ID} variant="outline" className="px-2 py-0.5 text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 flex items-center gap-1">
                                  <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
                                  <span>{p.Cognome} ({p.Posiz})</span>
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Lato Trasferta */}
                      <div className="p-3.5 rounded-xl border border-border/70 bg-muted/20 space-y-3">
                        <div className="flex items-center justify-between border-b border-border/60 pb-2">
                          <span className="text-xs font-black uppercase text-foreground flex items-center gap-1.5">
                            <Shield className="h-3.5 w-3.5 text-purple-500" />
                            {awayFormation?.teamName}
                          </span>
                          <Badge variant="outline" className="text-[10px] font-mono">
                            {awaySuspended.length} Squalificati • {awayWarned.length} Diffidati
                          </Badge>
                        </div>

                        {/* Squalificati Trasferta */}
                        <div className="space-y-1.5">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 block flex items-center gap-1">
                            <Ban className="h-3 w-3" /> Calciatori Squalificati (Assenti):
                          </span>
                          {awaySuspended.length === 0 ? (
                            <p className="text-xs text-muted-foreground italic">Nessun calciatore squalificato</p>
                          ) : (
                            <div className="space-y-1">
                              {awaySuspended.map((p) => {
                                const disc = awayDisciplinaryMap[Number(p.ID)];
                                return (
                                  <div key={p.ID} className="flex items-center justify-between p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <Badge variant="outline" className={`text-[9px] px-1.5 py-0 font-bold ${getRoleColor(p.Posiz)}`}>{p.Posiz}</Badge>
                                      <span className="font-bold text-foreground truncate">{p.Nome} {p.Cognome}</span>
                                    </div>
                                    <Badge variant="destructive" className="text-[9px] px-1.5 py-0 bg-rose-500 text-white shrink-0 font-semibold" title={disc?.suspensionDetails}>
                                      {disc?.suspensionReason === "red_card" ? "Espulsione" : "2 Gialli di fila"}
                                    </Badge>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Diffidati Trasferta */}
                        <div className="space-y-1.5 pt-1 border-t border-border/50">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" /> Calciatori Diffidati (A rischio squalifica):
                          </span>
                          {awayWarned.length === 0 ? (
                            <p className="text-xs text-muted-foreground italic">Nessun calciatore diffidato</p>
                          ) : (
                            <div className="flex flex-wrap gap-1.5">
                              {awayWarned.map((p) => (
                                <Badge key={p.ID} variant="outline" className="px-2 py-0.5 text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 flex items-center gap-1">
                                  <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
                                  <span>{p.Cognome} ({p.Posiz})</span>
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {homeFormation && (
                  <TeamSheetColumn
                    teamFormation={homeFormation}
                    formationDef={homeFormationDef}
                    isHome={true}
                    onSelectPlayer={setSelectedPlayer}
                    disciplinaryMap={homeDisciplinaryMap}
                  />
                )}

                {/* 2. COLONNA SQUADRA TRASFERTA */}
                {awayFormation && (
                  <TeamSheetColumn
                    teamFormation={awayFormation}
                    formationDef={awayFormationDef}
                    isHome={false}
                    onSelectPlayer={setSelectedPlayer}
                    disciplinaryMap={awayDisciplinaryMap}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal Ispezione Dettaglio Calciatore */}
      {selectedPlayer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setSelectedPlayer(null)}
        >
          <PlayerDetails
            currentPlayer={selectedPlayer}
            onClose={() => setSelectedPlayer(null)}
          />
        </div>
      )}
    </div>
  );
};

// ============================================================================
// COMPONENTE COLONNA SCHIERAMENTO SINGOLA SQUADRA (CAMPO 2D + PANCHINA)
// ============================================================================
interface TeamSheetColumnProps {
  teamFormation: SheetTeamFormation;
  formationDef: {
    id: string;
    name: string;
    positions: { x: string; y: string; label: string }[];
  };
  isHome: boolean;
  onSelectPlayer: (p: Player) => void;
  disciplinaryMap?: Record<number, PlayerDisciplinaryStatus>;
}

const TeamSheetColumn: React.FC<TeamSheetColumnProps> = ({
  teamFormation,
  formationDef,
  isHome,
  onSelectPlayer,
  disciplinaryMap,
}) => {
  return (
    <div className="space-y-4">
      {/* Header Squadra */}
      <Card className="border-border/80 bg-card shadow-sm overflow-hidden">
        <div className={`p-4 flex items-center justify-between gap-3 ${getTeamBackground(teamFormation.teamId)}`}>
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={`text-[10px] font-mono font-black uppercase tracking-wider ${
                  isHome
                    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30"
                    : "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30"
                }`}
              >
                {isHome ? "Casa" : "Trasferta"}
              </Badge>
              <h2 className="text-lg font-black text-foreground truncate">
                {teamFormation.teamName}
              </h2>
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
              <span>Modulo:</span>
              <strong className="text-foreground">{teamFormation.formationName}</strong>
            </div>
          </div>

          <Badge variant="secondary" className="font-mono text-xs font-black shrink-0 px-2.5 py-1">
            {teamFormation.formationId}
          </Badge>
        </div>
      </Card>

      {/* Campetto Tattico 2D */}
      <Card className="border-border/80 bg-card shadow-sm overflow-hidden">
        <CardHeader className="py-2.5 px-4 border-b border-border/60 bg-muted/30">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-emerald-500" />
              11 Titolari Schierati
            </span>
            <span className="font-mono text-[10px] font-semibold text-muted-foreground">
              {formationDef.name}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          {/* 2D PITCH CONTAINER */}
          <div className="relative w-full rounded-2xl shadow-lg overflow-hidden border-2 border-emerald-950/70 select-none bg-emerald-900/40">
            {/* SVG PITCH MARKINGS */}
            <svg
              viewBox="0 0 100 140"
              preserveAspectRatio="none"
              className="w-full h-[460px] sm:h-[500px] pointer-events-none block"
            >
              <defs>
                <linearGradient id={`sheetGrad-${teamFormation.teamId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#064e3b" stopOpacity="0.95" />
                  <stop offset="50%" stopColor="#047857" stopOpacity="0.88" />
                  <stop offset="100%" stopColor="#064e3b" stopOpacity="0.95" />
                </linearGradient>
                <pattern id={`sheetStripes-${teamFormation.teamId}`} width="100" height="20" patternUnits="userSpaceOnUse">
                  <rect width="100" height="10" fill="#ffffff" fillOpacity="0.03" />
                  <rect y="10" width="100" height="10" fill="transparent" />
                </pattern>
              </defs>

              <rect width="100" height="140" fill={`url(#sheetGrad-${teamFormation.teamId})`} />
              <rect width="100" height="140" fill={`url(#sheetStripes-${teamFormation.teamId})`} />
              <rect x="5" y="5" width="90" height="130" fill="none" stroke="#ffffff" strokeWidth="0.8" strokeOpacity="0.45" />
              <line x1="5" y1="70" x2="95" y2="70" stroke="#ffffff" strokeWidth="0.8" strokeOpacity="0.45" />
              <circle cx="50" cy="70" r="14" fill="none" stroke="#ffffff" strokeWidth="0.8" strokeOpacity="0.45" />
              <circle cx="50" cy="70" r="1" fill="#ffffff" strokeOpacity="0.6" />
              <rect x="22" y="5" width="56" height="24" fill="none" stroke="#ffffff" strokeWidth="0.8" strokeOpacity="0.45" />
              <rect x="34" y="5" width="32" height="10" fill="none" stroke="#ffffff" strokeWidth="0.8" strokeOpacity="0.45" />
              <rect x="22" y="111" width="56" height="24" fill="none" stroke="#ffffff" strokeWidth="0.8" strokeOpacity="0.45" />
              <rect x="34" y="125" width="32" height="10" fill="none" stroke="#ffffff" strokeWidth="0.8" strokeOpacity="0.45" />
            </svg>

            {/* 11 TITOLARI SUL CAMPO */}
            {formationDef.positions.map((pos, slotIdx) => {
              const player = teamFormation.starters[slotIdx];

              return (
                <div
                  key={slotIdx}
                  style={{
                    position: "absolute",
                    left: pos.x,
                    top: pos.y,
                    transform: "translate(-50%, -50%)",
                  }}
                  onClick={() => player && onSelectPlayer(player)}
                  className={`flex flex-col items-center group z-10 ${
                    player ? "cursor-pointer hover:scale-105 transition-transform" : "cursor-default"
                  }`}
                  title={player ? `${player.Nome} ${player.Cognome} (OVR ${player.OVR}) - Clicca per scheda` : "Slot vuoto"}
                >
                  {player ? (
                    <div className="flex flex-col items-center">
                      {/* Jersey badge con numero e OVR */}
                      <div className="relative flex items-center justify-center h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-slate-900/90 border-2 border-emerald-400 text-white shadow-lg transition-colors group-hover:border-white">
                        <span className="font-mono font-black text-xs sm:text-sm">
                          {player.NumeroMaglia || slotIdx + 1}
                        </span>
                        <Badge
                          variant="outline"
                          className={`absolute -top-1.5 -right-1.5 text-[8px] font-black px-1 py-0 leading-none ${getValueColor(
                            Number(player.OVR) || 0
                          )} bg-background shadow-xs`}
                        >
                          {player.OVR}
                        </Badge>
                      </div>

                      {/* Nome e Ruolo */}
                      <div className="mt-1 px-1.5 py-0.5 rounded-md bg-slate-950/85 backdrop-blur-xs border border-white/20 text-center max-w-[85px] sm:max-w-[95px] truncate shadow">
                        <span className="text-[10px] sm:text-[11px] font-black text-white truncate block leading-tight flex items-center justify-center gap-0.5">
                          {disciplinaryMap?.[Number(player.ID)]?.isWarned && (
                            <span title="Diffidato (ammonito nella scorsa gara)" className="text-amber-400 font-bold shrink-0">⚠️</span>
                          )}
                          {player.Cognome || player.Nome}
                        </span>
                        <span className="text-[9px] font-bold text-emerald-400 block font-mono">
                          {player.Posiz}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-10 w-10 rounded-full border border-dashed border-white/40 bg-white/5 flex items-center justify-center text-white/50 text-[10px] font-mono">
                      {pos.label}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Box Panchina (Riserve) */}
      <Card className="border-border/80 bg-card shadow-sm overflow-hidden">
        <CardHeader className="py-2.5 px-4 border-b border-border/60 bg-muted/30">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
            <span>Panchina &amp; Riserve</span>
            <Badge variant="secondary" className="font-mono text-[10px] font-bold">
              {teamFormation.bench.length} Giocatori
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          {teamFormation.bench.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted-foreground italic">
              Nessuna riserva a disposizione registrata.
            </div>
          ) : (
            <div className="space-y-1.5">
              {teamFormation.bench.map((player, idx) => (
                <div
                  key={player.ID || idx}
                  onClick={() => onSelectPlayer(player)}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/40 hover:bg-muted/80 border border-border/60 transition-colors cursor-pointer text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="font-mono font-bold text-[11px] text-muted-foreground w-6 text-center shrink-0">
                      #{player.NumeroMaglia || idx + 12}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[9px] font-bold px-1.5 py-0 shrink-0 ${getRoleColor(
                        player.Posiz
                      )}`}
                    >
                      {player.Posiz}
                    </Badge>
                    <span className="font-bold text-foreground truncate">
                      {player.Nome} {player.Cognome}
                    </span>
                    {disciplinaryMap?.[Number(player.ID)]?.isWarned && (
                      <Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5 bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 font-bold shrink-0 flex items-center gap-0.5" title="Diffidato (a rischio squalifica)">
                        <AlertTriangle className="h-2 w-2 text-amber-500 shrink-0" /> Diffidato
                      </Badge>
                    )}
                    {player.Nazionalità && (
                      <img
                        src={getNationalityFlag(player.Nazionalità)}
                        alt={player.Nazionalità}
                        className="h-3 w-4 object-cover rounded-xs shrink-0"
                      />
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] text-muted-foreground hidden sm:inline">
                      {player.Età} anni • {player.Piede}
                    </span>
                    <span className={`font-mono font-black text-xs px-1.5 py-0.5 rounded border ${getValueColor(Number(player.OVR) || 0)}`}>
                      {player.OVR}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FoglioCommento;

import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Swords,
  Layers,
  Users,
  Activity,
  Search,
  ChevronRight,
  Shield,
  Trophy,
  Tag,
  Sparkles,
  Info,
  Clock,
  CloudSun,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  findNextOpponentMatch,
  fetchOpponentScoutData,
  OpponentMatchInfo,
  OpponentScoutData,
} from "@/services/opponentScoutService";
import { Player } from "@/types/player";
import {
  getRoleColor,
  getValueColor,
  getNationalityFlag,
  getPlayerImage,
} from "@/utils/functions";
import { getMarketStatusOption } from "@/types/marketStatus";
import { EA_FC25_FORMATIONS } from "@/pages/Tattica";
import PlayerDetails from "@/components/player/playerDetails";

const ROLE_GROUPS = [
  { id: "ALL", label: "Tutti i Ruoli", roles: [] as string[] },
  { id: "POR", label: "Portieri", roles: ["POR"] },
  { id: "DIF", label: "Difensori", roles: ["DC", "TD", "TS"] },
  { id: "CEN", label: "Centrocampisti", roles: ["CDC", "CC", "ED", "ES", "COC"] },
  { id: "ATT", label: "Attaccanti", roles: ["AD", "AS", "AT", "ATT"] },
];

export const OpponentScout: React.FC = () => {
  const navigate = useNavigate();
  const { teamId: paramTeamId } = useParams<{ teamId?: string }>();
  const { user, effectiveTeam, effectiveTeamFullName } = useAuth();

  const myTeamId = effectiveTeam || user?.team || "";

  const [matchInfo, setMatchInfo] = useState<OpponentMatchInfo | null>(null);
  const [scoutData, setScoutData] = useState<OpponentScoutData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Filtri Roster
  const [activeTab, setActiveTab] = useState<string>("roster");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  // Formazioni
  const [selectedFormationIdx, setSelectedFormationIdx] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    async function loadData() {
      try {
        let opponentId = paramTeamId;
        let match: OpponentMatchInfo | null = null;

        if (myTeamId) {
          match = await findNextOpponentMatch(myTeamId);
          if (!opponentId && match?.opponentTeamId) {
            opponentId = match.opponentTeamId;
          }
        }

        if (isMounted) {
          setMatchInfo(match);
        }

        if (opponentId) {
          const scout = await fetchOpponentScoutData(opponentId);
          if (isMounted) {
            setScoutData(scout);
          }
        }
      } catch (err) {
        console.error("Error loading opponent scout page:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [myTeamId, paramTeamId]);

  const opponentTeam = scoutData?.team;
  const standings = scoutData?.standings;
  const rawRoster = scoutData?.roster || [];
  const formations = scoutData?.formations || [];
  const currentFormation = formations[selectedFormationIdx] || formations[0];

  // Roster filtrato
  const filteredRoster = useMemo(() => {
    return rawRoster.filter((p) => {
      if (roleFilter !== "ALL") {
        const group = ROLE_GROUPS.find((g) => g.id === roleFilter);
        if (group && group.roles.length > 0 && !group.roles.includes(p.Posiz)) {
          return false;
        }
      }
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase().trim();
        const num = p.NumeroMaglia ? String(p.NumeroMaglia) : "";
        const full = `${p.Nome} ${p.Cognome} ${p.Posiz} ${num}`.toLowerCase();
        return full.includes(q);
      }
      return true;
    });
  }, [rawRoster, roleFilter, searchQuery]);

  // Posizioni tattiche per il campo 2D
  const formationDef = useMemo(() => {
    if (!currentFormation) return EA_FC25_FORMATIONS[0];
    return (
      EA_FC25_FORMATIONS.find((f) => f.id === currentFormation.formationId) ||
      EA_FC25_FORMATIONS[0]
    );
  }, [currentFormation]);

  // Statistiche rapide dell'avversaria
  const avgOvr = useMemo(() => {
    if (rawRoster.length === 0) return 0;
    const sum = rawRoster.reduce((acc, p) => acc + (Number(p.OVR) || 0), 0);
    return Math.round(sum / rawRoster.length);
  }, [rawRoster]);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <Navbar />

      <main className="container mx-auto px-4 py-6 sm:py-8 space-y-6">
        {/* TOP BAR / BACK NAVIGATION */}
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="gap-2 text-xs font-semibold hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Torna Indietro</span>
          </Button>

          <Badge variant="outline" className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
            Centro Scout Avversaria
          </Badge>
        </div>

        {/* LOADING STATE */}
        {loading ? (
          <div className="space-y-6 animate-pulse">
            <div className="h-44 rounded-2xl bg-card border border-border" />
            <div className="h-96 rounded-2xl bg-card border border-border" />
          </div>
        ) : !scoutData ? (
          <Card className="border border-border p-12 text-center space-y-4">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground/40" />
            <h2 className="text-xl font-bold">Nessun dato avversaria disponibile</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Non è stato possibile caricare il report scout per la squadra richiesta. Verifica di essere autenticato con una squadra valida.
            </p>
            <Link to="/">
              <Button className="mt-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold">
                Ritorna alla Homepage
              </Button>
            </Link>
          </Card>
        ) : (
          <>
            {/* ========================================================= */}
            {/* SHOWDOWN BROADCAST HERO BANNER                            */}
            {/* ========================================================= */}
            <section className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-br from-card via-card/95 to-emerald-500/[0.04] p-6 sm:p-8 shadow-xl">
              {/* Glow effects */}
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-80 h-80 rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />

              <div className="relative z-10 space-y-6">
                {/* Meta Matchday & Venue header */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border/60">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
                      <Swords className="h-3.5 w-3.5" />
                      Prossimo Incontro • Serie A (Giornata {matchInfo?.week || 2})
                    </span>
                    {matchInfo && (
                      <Badge variant="outline" className="text-xs font-mono">
                        {matchInfo.isHome ? "Partita in Casa" : "Partita in Trasferta"}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground/70" />
                      {matchInfo?.stadium || "Stadio di Campionato"}
                    </span>
                    {matchInfo?.weather && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <CloudSun className="h-3.5 w-3.5 text-muted-foreground/70" />
                          {matchInfo.weather}
                        </span>
                      </>
                    )}
                    {matchInfo?.referee && (
                      <>
                        <span>•</span>
                        <span>Arbitro: {matchInfo.referee}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Face-off Showdown Display */}
                <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-6 py-2">
                  {/* Left: My Team */}
                  <div className="flex items-center gap-4 md:justify-start">
                    <img
                      src={`/images/teams/${myTeamId}_Logo.png`}
                      alt={myTeamId}
                      className="h-16 w-16 sm:h-20 sm:w-20 object-contain filter drop-shadow shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/images/LCSIM_Logo_SMALL.png";
                      }}
                    />
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                        La Tua Squadra
                      </span>
                      <h2 className="text-lg sm:text-xl font-black text-foreground truncate">
                        {effectiveTeamFullName || myTeamId}
                      </h2>
                      <span className="text-xs font-mono font-bold text-muted-foreground">
                        {myTeamId}
                      </span>
                    </div>
                  </div>

                  {/* Center: VS & Clash Status */}
                  <div className="flex flex-col items-center justify-center text-center px-4 py-2 bg-muted/40 rounded-2xl border border-border/80">
                    <span className="font-mono font-black text-2xl text-emerald-600 dark:text-emerald-400 tracking-wider">
                      VS
                    </span>
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mt-0.5">
                      Stagione 10
                    </span>
                  </div>

                  {/* Right: Opponent Team */}
                  <div className="flex items-center gap-4 md:justify-end md:text-right">
                    <div className="min-w-0 order-2 md:order-1">
                      <div className="flex items-center gap-1.5 md:justify-end">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Prossima Avversaria
                        </span>
                        {standings && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-mono font-bold">
                            {standings.rank}° in Classifica
                          </Badge>
                        )}
                      </div>
                      <h2 className="text-lg sm:text-xl font-black text-foreground truncate">
                        {opponentTeam?.name || matchInfo?.opponentTeamName || scoutData.team.id}
                      </h2>
                      <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {scoutData.team.id} • {standings?.points ?? 0} Punti
                      </span>
                    </div>
                    <img
                      src={`/images/teams/${scoutData.team.id}_Logo.png`}
                      alt={scoutData.team.name}
                      className="h-16 w-16 sm:h-20 sm:w-20 object-contain filter drop-shadow shrink-0 order-1 md:order-2"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/images/LCSIM_Logo_SMALL.png";
                      }}
                    />
                  </div>
                </div>

                {/* Telemetry Strip Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-border/60">
                  <div className="p-3 rounded-xl bg-card border border-border/70 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                      OVR Medio Rosa
                    </span>
                    <span className={`text-xl font-black font-mono ${getValueColor(avgOvr)}`}>
                      {avgOvr}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-card border border-border/70 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                      Giocatori Censiti
                    </span>
                    <span className="text-xl font-black font-mono text-foreground">
                      {rawRoster.length}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-card border border-border/70 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                      Gol Fatti / Subiti
                    </span>
                    <span className="text-xl font-black font-mono text-foreground">
                      {standings ? `${standings.goalsFor} : ${standings.goalsAgainst}` : "0 : 0"}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-card border border-border/70 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                      Forma Recente
                    </span>
                    <div className="flex items-center justify-center gap-1">
                      {scoutData.form && scoutData.form.length > 0 ? (
                        scoutData.form.map((res, i) => (
                          <span
                            key={i}
                            className={`h-5 w-5 rounded-full text-[10px] font-mono font-black flex items-center justify-center text-white shadow-2xs ${
                              res === "V"
                                ? "bg-emerald-600"
                                : res === "N"
                                ? "bg-amber-500"
                                : "bg-rose-600"
                            }`}
                          >
                            {res}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">Inizio Stagione</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ========================================================= */}
            {/* MAIN CONTENT TABS                                         */}
            {/* ========================================================= */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <TabsList className="bg-card border border-border p-1 h-auto flex flex-wrap gap-1">
                  <TabsTrigger
                    value="roster"
                    className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-lg gap-2"
                  >
                    <Users className="h-4 w-4" />
                    <span>Rosa Giocatori ({rawRoster.length})</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="formations"
                    className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-lg gap-2"
                  >
                    <Layers className="h-4 w-4" />
                    <span>Ultime Formazioni ({formations.length})</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="matches"
                    className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-lg gap-2"
                  >
                    <Activity className="h-4 w-4" />
                    <span>Andamento &amp; Risultati ({scoutData.recentMatches.length})</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* ========================================================= */}
              {/* TAB 1: ROSA COMPLETA - UN GIOCATORE PER RIGA              */}
              {/* ========================================================= */}
              <TabsContent value="roster" className="space-y-4">
                {/* Search & Filters */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-4 rounded-2xl border border-border/80 shadow-sm">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Cerca giocatore per nome, cognome, ruolo o numero..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 h-10 text-xs sm:text-sm bg-muted/30 border-border"
                    />
                  </div>

                  {/* Role filter pills */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {ROLE_GROUPS.map((grp) => (
                      <Button
                        key={grp.id}
                        type="button"
                        size="sm"
                        variant={roleFilter === grp.id ? "default" : "outline"}
                        onClick={() => setRoleFilter(grp.id)}
                        className={`h-8 text-xs font-bold rounded-xl transition-all ${
                          roleFilter === grp.id
                            ? "bg-emerald-600 text-white"
                            : "bg-muted/30 text-foreground hover:bg-muted"
                        }`}
                      >
                        {grp.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Informative hint banner */}
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-400">
                  <Info className="h-4 w-4 shrink-0" />
                  <span>
                    Clicca su una riga qualsiasi della tabella per aprire la <strong>Scheda Giocatore Completa</strong> con tutti gli attributi, i tratti e la telemetria.
                  </span>
                </div>

                {/* Table View (1 Giocatore per Riga) */}
                <Card className="border border-border/80 shadow-md overflow-hidden bg-card">
                  <CardContent className="p-0 overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                      <thead>
                        <tr className="border-b border-border bg-muted/50 text-[11px] font-bold uppercase text-muted-foreground tracking-wider select-none">
                          <th className="py-3.5 px-3 text-center w-12">#</th>
                          <th className="py-3.5 px-4">Giocatore</th>
                          <th className="py-3.5 px-3 text-center w-16">Ruolo</th>
                          <th className="py-3.5 px-3 text-center w-16">OVR</th>
                          <th className="py-3.5 px-3 text-center w-16">Età</th>
                          <th className="py-3.5 px-3 text-center w-20">Altezza</th>
                          <th className="py-3.5 px-3 text-center w-20">Piede</th>
                          <th className="py-3.5 px-3 text-center w-16">XP</th>
                          <th className="py-3.5 px-4 text-center w-40">Status Mercato</th>
                          <th className="py-3.5 px-4 text-right">Azione</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {filteredRoster.length === 0 ? (
                          <tr>
                            <td colSpan={10} className="py-12 text-center text-muted-foreground text-sm font-semibold">
                              Nessun giocatore trovato con i filtri correnti.
                            </td>
                          </tr>
                        ) : (
                          filteredRoster.map((player) => {
                            const marketOpt = getMarketStatusOption(player.MarketStatus);

                            return (
                              <tr
                                key={player.ID}
                                onClick={() => setSelectedPlayer(player)}
                                className="hover:bg-emerald-500/[0.06] transition-colors group cursor-pointer"
                                title={`Clicca per visualizzare la scheda tecnica di ${player.Nome} ${player.Cognome}`}
                              >
                                {/* Maglia # */}
                                <td className="py-3 px-3 text-center font-mono font-black text-xs text-foreground">
                                  {player.NumeroMaglia ? (
                                    <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold">
                                      #{player.NumeroMaglia}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground/40">—</span>
                                  )}
                                </td>

                                {/* Giocatore Avatar & Nome & Bandiera */}
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9 border border-border shrink-0 shadow-xs">
                                      <AvatarImage
                                        src={getPlayerImage(player.ID)}
                                        alt={`${player.Nome} ${player.Cognome}`}
                                      />
                                      <AvatarFallback className="text-[10px] font-bold">
                                        {player.Nome?.[0]}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                      <div className="font-bold text-foreground text-sm group-hover:text-emerald-600 transition-colors flex items-center gap-1.5">
                                        <span className="truncate">
                                          {player.Nome} {player.Cognome}
                                        </span>
                                        <img
                                          src={getNationalityFlag(player.Nazionalità)}
                                          alt={player.Nazionalità}
                                          className="h-3 w-4 object-cover rounded-xs shrink-0 shadow-2xs"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                {/* Ruolo */}
                                <td className="py-3 px-3 text-center">
                                  <Badge
                                    variant="outline"
                                    className={`text-[10px] font-bold px-2 py-0.5 ${getRoleColor(player.Posiz)}`}
                                  >
                                    {player.Posiz}
                                  </Badge>
                                </td>

                                {/* OVR */}
                                <td className="py-3 px-3 text-center font-mono font-black text-sm">
                                  <span className={`inline-block px-2 py-0.5 rounded-md border text-xs font-black shadow-2xs ${getValueColor(player.OVR ?? 0)} bg-background`}>
                                    {player.OVR}
                                  </span>
                                </td>

                                {/* Età */}
                                <td className="py-3 px-3 text-center font-mono text-muted-foreground font-semibold">
                                  {player.Età ?? "—"}
                                </td>

                                {/* Altezza */}
                                <td className="py-3 px-3 text-center font-mono text-muted-foreground">
                                  {player.Altezza ? `${player.Altezza} cm` : "—"}
                                </td>

                                {/* Piede */}
                                <td className="py-3 px-3 text-center text-muted-foreground font-semibold">
                                  <span>{player.Piede || "—"}</span>
                                  {player.PiedeDebole && (
                                    <span className="text-[9px] block text-amber-500 font-mono">
                                      {player.PiedeDebole}
                                    </span>
                                  )}
                                </td>

                                {/* XP */}
                                <td className="py-3 px-3 text-center font-mono text-muted-foreground font-semibold">
                                  {player.XP ?? 0}
                                </td>

                                {/* Status Mercato */}
                                <td className="py-3 px-4 text-center">
                                  {marketOpt ? (
                                    <span
                                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${marketOpt.badgeClass}`}
                                    >
                                      <Tag className="h-2.5 w-2.5" />
                                      {marketOpt.label}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-muted-foreground/50 italic">
                                      Standard
                                    </span>
                                  )}
                                </td>

                                {/* Pulsante Azione */}
                                <td className="py-3 px-4 text-right">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 text-xs font-bold text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-all gap-1 rounded-lg"
                                  >
                                    <span>Scheda</span>
                                    <ChevronRight className="h-3.5 w-3.5" />
                                  </Button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ========================================================= */}
              {/* TAB 2: ULTIME FORMAZIONI INSERITE (CAMPO 2D + DETTAGLI)   */}
              {/* ========================================================= */}
              <TabsContent value="formations" className="space-y-6">
                {formations.length === 0 ? (
                  <Card className="p-12 text-center text-muted-foreground space-y-2 border border-border">
                    <Layers className="h-10 w-10 mx-auto text-muted-foreground/40" />
                    <p className="font-bold text-base">Nessuna formazione registrata per questa squadra</p>
                    <p className="text-xs">
                      Le formazioni appariranno non appena la squadra avversaria salverà la propria tattica o disputerà una partita.
                    </p>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    {/* Selector Pills */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mr-1">
                        Seleziona Formazione:
                      </span>
                      {formations.map((f, idx) => (
                        <Button
                          key={f.id}
                          type="button"
                          variant={selectedFormationIdx === idx ? "default" : "outline"}
                          onClick={() => setSelectedFormationIdx(idx)}
                          className={`h-9 text-xs font-bold gap-2 rounded-xl transition-all ${
                            selectedFormationIdx === idx
                              ? "bg-emerald-600 text-white shadow-sm"
                              : "bg-card text-foreground border-border hover:bg-muted"
                          }`}
                        >
                          <span>#{idx + 1} {f.formationId}</span>
                          <span className="text-[10px] opacity-80">
                            ({f.source === "tactic_history" ? "Storicizzata" : f.source === "active_tactic" ? "Attiva" : "In Campo"})
                          </span>
                        </Button>
                      ))}
                    </div>

                    {/* Dual Column Layout: Pitch & Bench */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      {/* Left: 2D Tactical Pitch (8 cols on lg) */}
                      <div className="lg:col-span-7 xl:col-span-8 space-y-3">
                        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-card border border-border text-xs">
                          <div>
                            <span className="font-black text-foreground text-sm block">
                              {currentFormation.title}
                            </span>
                            <span className="text-muted-foreground text-xs">
                              Modulo: <strong className="text-foreground">{currentFormation.formationName}</strong>
                              {currentFormation.date && ` • Registrata il ${new Date(currentFormation.date).toLocaleDateString("it-IT")}`}
                            </span>
                          </div>
                          <Badge variant="secondary" className="font-mono text-xs font-black">
                            {currentFormation.formationId}
                          </Badge>
                        </div>

                        {/* 2D PITCH CONTAINER */}
                        <div className="relative w-full rounded-2xl shadow-xl overflow-hidden border-2 border-emerald-950/70 select-none bg-emerald-900/40">
                          {/* SVG PITCH MARKINGS */}
                          <svg
                            viewBox="0 0 100 140"
                            preserveAspectRatio="none"
                            className="w-full h-[480px] sm:h-[540px] pointer-events-none block"
                          >
                            <defs>
                              <linearGradient id="opScoutPageGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#064e3b" stopOpacity="0.95" />
                                <stop offset="50%" stopColor="#047857" stopOpacity="0.88" />
                                <stop offset="100%" stopColor="#064e3b" stopOpacity="0.95" />
                              </linearGradient>
                              <pattern id="opScoutPageStripes" width="100" height="20" patternUnits="userSpaceOnUse">
                                <rect width="100" height="10" fill="#ffffff" fillOpacity="0.03" />
                                <rect y="10" width="100" height="10" fill="transparent" />
                              </pattern>
                            </defs>

                            <rect width="100" height="140" fill="url(#opScoutPageGrad)" />
                            <rect width="100" height="140" fill="url(#opScoutPageStripes)" />
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
                                onClick={() => player && setSelectedPlayer(player)}
                                className={`flex flex-col items-center group z-10 ${
                                  player ? "cursor-pointer hover:scale-110 transition-transform" : "cursor-default"
                                }`}
                              >
                                {player ? (
                                  <div className="flex flex-col items-center">
                                    {/* Player Jersey Badge */}
                                    <div className="relative flex items-center justify-center h-11 w-11 sm:h-12 sm:w-12 rounded-full bg-slate-900/90 border-2 border-emerald-400 text-white shadow-xl transition-shadow group-hover:border-white">
                                      <span className="font-mono font-black text-xs sm:text-sm">
                                        {player.NumeroMaglia || slotIdx + 1}
                                      </span>
                                      <Badge
                                        variant="outline"
                                        className={`absolute -top-1.5 -right-1.5 text-[8px] font-black px-1.5 py-0 leading-none ${getValueColor(
                                          Number(player.OVR) || 0
                                        )} bg-background`}
                                      >
                                        {player.OVR}
                                      </Badge>
                                    </div>

                                    {/* Player Name and Role Label */}
                                    <div className="mt-1 px-2 py-0.5 rounded-md bg-slate-950/85 backdrop-blur-xs border border-white/20 text-center max-w-[90px] sm:max-w-[110px] truncate shadow">
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
                                    <div className="h-10 w-10 rounded-full border border-dashed border-white/40 flex items-center justify-center text-white/50 text-[11px] font-mono">
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
                      </div>

                      {/* Right: Bench and Formation info (5 cols on lg) */}
                      <div className="lg:col-span-5 xl:col-span-4 space-y-4">
                        <Card className="border border-border/80 p-4 rounded-2xl bg-card">
                          <h3 className="font-bold text-sm text-foreground flex items-center gap-2 mb-3">
                            <Users className="h-4 w-4 text-emerald-600" />
                            <span>Panchina &amp; Riserve ({currentFormation.bench.length})</span>
                          </h3>

                          {currentFormation.bench.length === 0 ? (
                            <p className="text-xs text-muted-foreground italic py-4 text-center">
                              Nessuna riserva specificata per questa formazione.
                            </p>
                          ) : (
                            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                              {currentFormation.bench.map((sub, idx) => (
                                <div
                                  key={sub.ID || idx}
                                  onClick={() => setSelectedPlayer(sub)}
                                  className="flex items-center justify-between p-2.5 rounded-xl border border-border/70 bg-muted/20 hover:bg-emerald-500/[0.08] transition-all cursor-pointer group"
                                  title={`Clicca per aprire la scheda di ${sub.Nome} ${sub.Cognome}`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <span className="text-xs font-mono font-bold text-muted-foreground w-5 text-center">
                                      {sub.NumeroMaglia ? `#${sub.NumeroMaglia}` : idx + 1}
                                    </span>
                                    <Avatar className="h-8 w-8 border border-border shrink-0">
                                      <AvatarImage src={getPlayerImage(sub.ID)} alt={sub.Cognome} />
                                      <AvatarFallback className="text-[9px] font-bold">
                                        {sub.Nome?.[0]}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                      <span className="text-xs font-bold text-foreground group-hover:text-emerald-600 block truncate">
                                        {sub.Nome} {sub.Cognome}
                                      </span>
                                      <Badge
                                        variant="outline"
                                        className={`text-[9px] px-1.5 py-0 font-bold ${getRoleColor(sub.Posiz)}`}
                                      >
                                        {sub.Posiz}
                                      </Badge>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`text-xs font-mono font-black px-2 py-0.5 rounded border ${getValueColor(
                                        Number(sub.OVR) || 0
                                      )} bg-background`}
                                    >
                                      {sub.OVR}
                                    </span>
                                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-emerald-600 transition-colors" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </Card>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* ========================================================= */}
              {/* TAB 3: ULTIMI INCONTRI DISPUTATI & FORMA                  */}
              {/* ========================================================= */}
              <TabsContent value="matches" className="space-y-4">
                {scoutData.recentMatches.length === 0 ? (
                  <Card className="p-12 text-center text-muted-foreground space-y-2 border border-border">
                    <Activity className="h-10 w-10 mx-auto text-muted-foreground/40" />
                    <p className="font-bold text-base">Nessun match disputato trovato per questa squadra</p>
                    <p className="text-xs">
                      Le statistiche delle partite compariranno non appena la squadra giocherà in campionato.
                    </p>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {scoutData.recentMatches.map((m, idx) => (
                      <Card
                        key={idx}
                        className="p-5 rounded-2xl border border-border/80 bg-card hover:border-emerald-500/40 transition-all shadow-sm space-y-3"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold uppercase tracking-wider text-muted-foreground">
                            Giornata {m.week} • Stagione {m.stag}
                          </span>
                          <Badge
                            className={`font-black font-mono text-xs px-2.5 py-0.5 text-white ${
                              m.result === "V"
                                ? "bg-emerald-600"
                                : m.result === "N"
                                ? "bg-amber-500"
                                : "bg-rose-600"
                            }`}
                          >
                            {m.result === "V" ? "Vittoria" : m.result === "N" ? "Pareggio" : "Sconfitta"}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between gap-4 py-2 border-y border-border/60">
                          {/* Opponent club team */}
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={`/images/teams/${scoutData.team.id}_Logo.png`}
                              alt={scoutData.team.name}
                              className="h-9 w-9 object-contain filter drop-shadow shrink-0"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "/images/LCSIM_Logo_SMALL.png";
                              }}
                            />
                            <span className="font-bold text-sm text-foreground truncate">
                              {scoutData.team.id}
                            </span>
                          </div>

                          {/* Score */}
                          <div className="text-center px-3 py-1 rounded-xl bg-muted/40 font-mono font-black text-lg">
                            {m.isHome ? `${m.homeGoals} - ${m.awayGoals}` : `${m.awayGoals} - ${m.homeGoals}`}
                          </div>

                          {/* Match Opponent */}
                          <div className="flex items-center gap-2.5 min-w-0 justify-end">
                            <span className="font-bold text-sm text-foreground truncate">
                              {m.opponentVsName || m.opponentVsId}
                            </span>
                            <img
                              src={`/images/teams/${m.opponentVsId}_Logo.png`}
                              alt={m.opponentVsId}
                              className="h-9 w-9 object-contain filter drop-shadow shrink-0"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "/images/LCSIM_Logo_SMALL.png";
                              }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <span>{m.isHome ? "Giocata in Casa" : "Giocata in Trasferta"}</span>
                          {m.date && <span>{m.date}</span>}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>

      {/* ========================================================= */}
      {/* FULL PLAYER DETAILS INSPECTOR MODAL                       */}
      {/* ========================================================= */}
      {selectedPlayer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedPlayer(null)}
        >
          <div onClick={(e) => e.stopPropagation()} className="max-w-2xl w-full">
            <PlayerDetails
              currentPlayer={selectedPlayer}
              onClose={() => setSelectedPlayer(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default OpponentScout;

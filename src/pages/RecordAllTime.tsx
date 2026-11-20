import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Star,
  Crown,
  Trophy,
  Target,
  Flame,
  Clock,
  Shield,
  Award,
  Users,
  ChevronRight,
} from "lucide-react";
import {
  getPlayerImage,
  getRoleColor,
} from "@/utils/functions";
import {
  fetchAllPlayersCareerSummary,
  fetchAllPlayersTeamGoalsSummary,
  getHistoricalTeamMeta,
  PlayerCareerSummary,
  PlayerTeamGoalsSummary,
} from "@/services/archiveService";
import { HistoricalTeamBadge } from "@/components/archive/HistoricalTeamBadge";

type LeaderboardCategory =
  | "gol"
  | "gol_squadra"
  | "assist"
  | "ga"
  | "presenze"
  | "capitano"
  | "media_voto"
  | "portieri";

interface EnrichedTeamGoalsRow extends PlayerTeamGoalsSummary {
  nome: string;
  cognome: string;
  posiz: string;
  is_hof: boolean;
}

const LEADERBOARD_CATEGORIES: Array<{
  id: LeaderboardCategory;
  label: string;
  subtitle: string;
  unit: string;
  icon: any;
  colorClass: string;
}> = [
  {
    id: "gol",
    label: "Marcatori All-Time",
    subtitle: "Classifica perpetua dei bomber nella storia LCSIM (S1–S11)",
    unit: "Gol",
    icon: Trophy,
    colorClass: "text-emerald-500",
  },
  {
    id: "gol_squadra",
    label: "Marcatori per Squadra",
    subtitle: "Migliori realizzatori con la maglia di ciascuna squadra storica",
    unit: "Gol",
    icon: Users,
    colorClass: "text-teal-500",
  },
  {
    id: "assist",
    label: "Assist-man All-Time",
    subtitle: "I migliori rifinitori di sempre per passaggi vincenti",
    unit: "Assist",
    icon: Target,
    colorClass: "text-blue-500",
  },
  {
    id: "ga",
    label: "Partecipazione Gol (G+A)",
    subtitle: "Somma di reti segnate e assist forniti in carriera",
    unit: "G+A",
    icon: Flame,
    colorClass: "text-orange-500",
  },
  {
    id: "presenze",
    label: "Presenze & Minutaggio",
    subtitle: "I fedelissimi con il maggior numero di gare disputate",
    unit: "Pres",
    icon: Clock,
    colorClass: "text-purple-500",
  },
  {
    id: "capitano",
    label: "Capitani Storici",
    subtitle: "Maggior numero di partite disputate con la fascia al braccio",
    unit: "Cap",
    icon: Crown,
    colorClass: "text-amber-500",
  },
  {
    id: "media_voto",
    label: "Media Voto Carriera",
    subtitle: "Rendimento medio più alto in carriera (minimo 20 presenze)",
    unit: "MV",
    icon: Star,
    colorClass: "text-yellow-500",
  },
  {
    id: "portieri",
    label: "Clean Sheet & Parate",
    subtitle: "I portieri più impenetrabili per porte inviolate e interventi",
    unit: "CS",
    icon: Shield,
    colorClass: "text-cyan-500",
  },
];

const RecordAllTime = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<LeaderboardCategory>("gol");
  const [teamFilter, setTeamFilter] = useState<string>("all");

  const { data: allPlayers = [], isLoading: loadingPlayers } = useQuery({
    queryKey: ["archive_players_career_summary"],
    queryFn: fetchAllPlayersCareerSummary,
    staleTime: 60 * 1000,
  });

  const { data: teamGoalsRaw = [], isLoading: loadingTeamGoals } = useQuery({
    queryKey: ["archive_players_team_goals_summary"],
    queryFn: fetchAllPlayersTeamGoalsSummary,
    enabled: activeCategory === "gol_squadra",
    staleTime: 60 * 1000,
  });

  const playersById = useMemo(() => {
    const map = new Map<number, PlayerCareerSummary>();
    for (const p of allPlayers) {
      map.set(p.player_id, p);
    }
    return map;
  }, [allPlayers]);

  const allTeamScorers = useMemo<EnrichedTeamGoalsRow[]>(() => {
    return teamGoalsRaw.map((r) => {
      const player = playersById.get(r.player_id);
      return {
        ...r,
        nome: player?.nome ?? "",
        cognome: player?.cognome ?? `#${r.player_id}`,
        posiz: player?.posiz ?? "—",
        is_hof: Boolean(player?.is_hof),
      };
    });
  }, [teamGoalsRaw, playersById]);

  const availableTeamOptions = useMemo(() => {
    const codes = Array.from(new Set(allTeamScorers.map((r) => r.team_id)));
    return codes
      .map((code) => ({
        code,
        meta: getHistoricalTeamMeta(code),
      }))
      .sort((a, b) => a.meta.fullName.localeCompare(b.meta.fullName));
  }, [allTeamScorers]);

  const filteredTeamScorers = useMemo(() => {
    const list =
      teamFilter === "all"
        ? allTeamScorers
        : allTeamScorers.filter((r) => r.team_id === teamFilter);
    return list.slice(0, 20);
  }, [allTeamScorers, teamFilter]);

  const currentCatMeta = useMemo(
    () => LEADERBOARD_CATEGORIES.find((c) => c.id === activeCategory)!,
    [activeCategory]
  );

  const isLoadingActive =
    loadingPlayers || (activeCategory === "gol_squadra" && loadingTeamGoals);

  const leaderboardList = useMemo(() => {
    const list = allPlayers.slice();

    switch (activeCategory) {
      case "gol":
        return list
          .filter((p) => p.gol > 0)
          .sort((a, b) => b.gol - a.gol || a.presenze - b.presenze)
          .slice(0, 20);
      case "assist":
        return list
          .filter((p) => p.assist > 0)
          .sort((a, b) => b.assist - a.assist || a.presenze - b.presenze)
          .slice(0, 20);
      case "ga":
        return list
          .filter((p) => p.gol + p.assist > 0)
          .sort((a, b) => b.gol + b.assist - (a.gol + a.assist) || b.gol - a.gol)
          .slice(0, 20);
      case "presenze":
        return list
          .filter((p) => p.presenze > 0)
          .sort((a, b) => b.presenze - a.presenze || b.minuti - a.minuti)
          .slice(0, 20);
      case "capitano":
        return list
          .filter((p) => p.presenze_capitano > 0)
          .sort((a, b) => b.presenze_capitano - a.presenze_capitano || b.presenze - a.presenze)
          .slice(0, 20);
      case "media_voto":
        return list
          .filter((p) => p.presenze >= 20 && p.media_voto !== null)
          .sort((a, b) => (b.media_voto ?? 0) - (a.media_voto ?? 0) || b.presenze - a.presenze)
          .slice(0, 20);
      case "portieri":
        return list
          .filter((p) => p.posiz === "POR" && p.presenze > 0)
          .sort((a, b) => b.clean_sheets - a.clean_sheets || b.parate - a.parate)
          .slice(0, 20);
      default:
        return [];
    }
  }, [allPlayers, activeCategory]);

  const getMetricValue = (p: PlayerCareerSummary): string | number => {
    switch (activeCategory) {
      case "gol":
        return p.gol;
      case "assist":
        return p.assist;
      case "ga":
        return p.gol + p.assist;
      case "presenze":
        return p.presenze;
      case "capitano":
        return p.presenze_capitano;
      case "media_voto":
        return p.media_voto ? p.media_voto.toFixed(2) : "—";
      case "portieri":
        return p.clean_sheets;
    }
  };

  const getMetricSubLabel = (p: PlayerCareerSummary): string => {
    switch (activeCategory) {
      case "gol":
        return `${p.presenze} pres • ${(p.gol / Math.max(1, p.presenze)).toFixed(2)} gol/partita`;
      case "assist":
        return `${p.presenze} pres • ${p.pass_si} passaggi riusciti`;
      case "ga":
        return `${p.gol} Gol + ${p.assist} Assist in ${p.presenze} pres`;
      case "presenze":
        return `${p.minuti.toLocaleString()}' min • ${p.titolare} da titolare (${p.stagioni_giocate} stag.)`;
      case "capitano":
        return `Fascia in campo • ${p.presenze} presenze totali`;
      case "media_voto":
        return `${p.presenze} presenze • ${p.motm}x MOTM`;
      case "portieri":
        return `${p.parate} parate • ${p.gol_subiti} gol subiti in ${p.presenze} pres`;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/60 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
              <Award className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
                Albo dei Record & Classifiche All-Time
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Primati storici calcolati su tutte le partite ufficiali disputate dalla Stagione 1 alla Stagione 11
              </p>
            </div>
          </div>
        </div>

        {/* Category Selector Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {LEADERBOARD_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap border transition-all cursor-pointer ${
                  isActive
                    ? "bg-primary text-primary-foreground border-primary shadow-md"
                    : "bg-card hover:bg-muted/60 text-foreground border-border/70"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-primary-foreground" : cat.colorClass}`} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {isLoadingActive ? (
          <Card className="p-16 text-center text-muted-foreground">
            Caricamento classifiche All-Time...
          </Card>
        ) : activeCategory === "gol_squadra" ? (
          <>
            {/* Filtro Squadra Rapido */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-card border border-border/70">
              <div className="text-xs text-muted-foreground">
                Ogni riga rappresenta i gol segnati da un calciatore con la maglia di una specifica squadra storica.
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-semibold text-muted-foreground">Squadra:</span>
                <Select value={teamFilter} onValueChange={setTeamFilter}>
                  <SelectTrigger className="w-[230px] h-9 text-xs font-semibold">
                    <SelectValue placeholder="Tutte le squadre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutte le Squadre</SelectItem>
                    {availableTeamOptions.map(({ code, meta }) => (
                      <SelectItem key={code} value={code}>
                        {meta.code} — {meta.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Top 3 Podium Cards (Marcatori per Squadra) */}
            {filteredTeamScorers.length >= 3 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {filteredTeamScorers.slice(0, 3).map((r, idx) => {
                  const rankColors = [
                    "border-yellow-500/50 bg-gradient-to-br from-yellow-500/15 via-card to-card",
                    "border-slate-400/50 bg-gradient-to-br from-slate-400/15 via-card to-card",
                    "border-amber-700/50 bg-gradient-to-br from-amber-700/15 via-card to-card",
                  ];
                  const medalLabels = ["🥇 1°", "🥈 2°", "🥉 3°"];
                  const meta = getHistoricalTeamMeta(r.team_id);
                  const seasonsLabel =
                    r.first_stag === r.last_stag
                      ? `S${r.first_stag}`
                      : `S${r.first_stag}–S${r.last_stag}`;
                  return (
                    <Card
                      key={`${r.player_id}-${r.team_id}`}
                      onClick={() => navigate(`/archivio/giocatori?player=${r.player_id}`)}
                      className={`cursor-pointer hover:shadow-lg transition-all ${rankColors[idx]}`}
                    >
                      <CardContent className="p-5 flex items-center gap-4">
                        <img
                          src={getPlayerImage(r.player_id)}
                          alt={`${r.nome} ${r.cognome}`}
                          className="h-20 w-20 rounded-2xl object-cover border-2 border-border shrink-0 shadow-md"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/placeholder.svg";
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <Badge variant="secondary" className="text-[11px] font-black">
                              {medalLabels[idx]}
                            </Badge>
                            <Badge variant="outline" className={`${getRoleColor(r.posiz)} text-[10px] font-bold`}>
                              {r.posiz}
                            </Badge>
                          </div>
                          <h3 className="text-lg font-black text-foreground truncate mt-1">
                            {r.nome} {r.cognome}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <div
                              className="inline-flex items-center gap-1.5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <HistoricalTeamBadge teamCode={r.team_id} showFranchiseHint={false} />
                            </div>
                            <span className="text-xs font-semibold text-muted-foreground truncate">
                              {meta.fullName} ({meta.code})
                            </span>
                          </div>
                          <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-2xl font-black text-primary">{r.gol}</span>
                            <span className="text-xs font-bold text-muted-foreground">Gol</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {r.presenze} pres • {(r.gol / Math.max(1, r.presenze)).toFixed(2)} gol/partita • {seasonsLabel}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Top 20 Table (Marcatori per Squadra) */}
            <Card className="shadow-lg border-border/80 overflow-hidden">
              <CardHeader className="py-4 px-5 bg-muted/30 border-b border-border/60">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-black">
                      {teamFilter === "all"
                        ? `${currentCatMeta.label} — Top 20`
                        : `${currentCatMeta.label} (${getHistoricalTeamMeta(teamFilter).fullName}) — Top ${filteredTeamScorers.length}`}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">{currentCatMeta.subtitle}</p>
                  </div>
                </div>
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="text-center p-3 font-bold w-14">#</th>
                      <th className="text-left p-3 font-bold">Calciatore</th>
                      <th className="text-center p-3 font-bold">Ruolo</th>
                      <th className="text-left p-3 font-bold">Squadra</th>
                      <th className="text-center p-3 font-bold">Stagioni</th>
                      <th className="text-center p-3 font-bold text-primary">Gol</th>
                      <th className="text-left p-3 font-bold">Dettaglio</th>
                      <th className="text-right p-3 font-bold">Archivio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTeamScorers.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-10 text-center text-muted-foreground">
                          Nessun marcatore registrato per i criteri selezionati.
                        </td>
                      </tr>
                    ) : (
                      filteredTeamScorers.map((r, idx) => {
                        const meta = getHistoricalTeamMeta(r.team_id);
                        const seasonsLabel =
                          r.first_stag === r.last_stag
                            ? `S${r.first_stag}`
                            : `S${r.first_stag}–S${r.last_stag}`;
                        return (
                          <tr
                            key={`${r.player_id}-${r.team_id}`}
                            onClick={() => navigate(`/archivio/giocatori?player=${r.player_id}`)}
                            className="border-b border-border/50 hover:bg-muted/40 transition-colors cursor-pointer"
                          >
                            <td className="text-center p-3 font-black text-muted-foreground">
                              {idx + 1}°
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-3">
                                <img
                                  src={getPlayerImage(r.player_id)}
                                  alt={`${r.nome} ${r.cognome}`}
                                  className="h-9 w-9 rounded-lg object-cover border border-border shrink-0"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = "/placeholder.svg";
                                  }}
                                />
                                <div>
                                  <div className="font-bold text-foreground flex items-center gap-1.5">
                                    <span>
                                      {r.cognome}, {r.nome}
                                    </span>
                                    {r.is_hof && (
                                      <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                                    )}
                                  </div>
                                  <span className="text-[11px] text-muted-foreground font-mono">
                                    #{r.player_id}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="text-center p-3">
                              <Badge variant="outline" className={`${getRoleColor(r.posiz)} font-bold text-xs`}>
                                {r.posiz}
                              </Badge>
                            </td>
                            <td className="p-3">
                              <div
                                className="flex items-center gap-2"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <HistoricalTeamBadge teamCode={r.team_id} showFranchiseHint={false} />
                                <span className="font-semibold text-foreground text-xs sm:text-sm">
                                  {meta.fullName}
                                </span>
                              </div>
                            </td>
                            <td className="text-center p-3 text-xs font-semibold">
                              {seasonsLabel}
                            </td>
                            <td className="text-center p-3 text-base font-black text-primary">
                              {r.gol}
                            </td>
                            <td className="p-3 text-xs text-muted-foreground">
                              {r.presenze} pres • {(r.gol / Math.max(1, r.presenze)).toFixed(2)} gol/partita
                            </td>
                            <td className="text-right p-3">
                              <Button variant="ghost" size="sm" className="h-8 text-xs font-bold gap-1">
                                Scheda
                                <ChevronRight className="h-3.5 w-3.5" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        ) : (
          <>
            {/* Top 3 Podium Cards */}
            {leaderboardList.length >= 3 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {leaderboardList.slice(0, 3).map((p, idx) => {
                  const rankColors = [
                    "border-yellow-500/50 bg-gradient-to-br from-yellow-500/15 via-card to-card",
                    "border-slate-400/50 bg-gradient-to-br from-slate-400/15 via-card to-card",
                    "border-amber-700/50 bg-gradient-to-br from-amber-700/15 via-card to-card",
                  ];
                  const medalLabels = ["🥇 1° All-Time", "🥈 2° All-Time", "🥉 3° All-Time"];
                  const distinctTeams = Array.from(new Set(p.season_teams));
                  return (
                    <Card
                      key={p.player_id}
                      onClick={() => navigate(`/archivio/giocatori?player=${p.player_id}`)}
                      className={`cursor-pointer hover:shadow-lg transition-all ${rankColors[idx]}`}
                    >
                      <CardContent className="p-5 flex items-center gap-4">
                        <img
                          src={getPlayerImage(p.player_id)}
                          alt={`${p.nome} ${p.cognome}`}
                          className="h-20 w-20 rounded-2xl object-cover border-2 border-border shrink-0 shadow-md"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/placeholder.svg";
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <Badge variant="secondary" className="text-[11px] font-black">
                              {medalLabels[idx]}
                            </Badge>
                            <Badge variant="outline" className={`${getRoleColor(p.posiz)} text-[10px] font-bold`}>
                              {p.posiz}
                            </Badge>
                          </div>
                          <h3 className="text-lg font-black text-foreground truncate mt-1">
                            {p.nome} {p.cognome}
                          </h3>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {distinctTeams.join(" ➔ ")}
                          </p>
                          <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-2xl font-black text-primary">
                              {getMetricValue(p)}
                            </span>
                            <span className="text-xs font-bold text-muted-foreground">
                              {currentCatMeta.unit}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {getMetricSubLabel(p)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Top 20 Table */}
            <Card className="shadow-lg border-border/80 overflow-hidden">
              <CardHeader className="py-4 px-5 bg-muted/30 border-b border-border/60">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-black">{currentCatMeta.label} — Top 20</CardTitle>
                    <p className="text-xs text-muted-foreground">{currentCatMeta.subtitle}</p>
                  </div>
                </div>
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="text-center p-3 font-bold w-14">#</th>
                      <th className="text-left p-3 font-bold">Calciatore</th>
                      <th className="text-center p-3 font-bold">Ruolo</th>
                      <th className="text-left p-3 font-bold">Squadre in Carriera</th>
                      <th className="text-center p-3 font-bold">Stagioni</th>
                      <th className="text-center p-3 font-bold text-primary">{currentCatMeta.unit}</th>
                      <th className="text-left p-3 font-bold">Dettaglio Carriera</th>
                      <th className="text-right p-3 font-bold">Archivio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboardList.map((p, idx) => {
                      const distinctTeams = Array.from(new Set(p.season_teams));
                      return (
                        <tr
                          key={p.player_id}
                          onClick={() => navigate(`/archivio/giocatori?player=${p.player_id}`)}
                          className="border-b border-border/50 hover:bg-muted/40 transition-colors cursor-pointer"
                        >
                          <td className="text-center p-3 font-black text-muted-foreground">
                            {idx + 1}°
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <img
                                src={getPlayerImage(p.player_id)}
                                alt={`${p.nome} ${p.cognome}`}
                                className="h-9 w-9 rounded-lg object-cover border border-border shrink-0"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "/placeholder.svg";
                                }}
                              />
                              <div>
                                <div className="font-bold text-foreground flex items-center gap-1.5">
                                  <span>
                                    {p.cognome}, {p.nome}
                                  </span>
                                  {p.is_hof && (
                                    <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                                  )}
                                </div>
                                <span className="text-[11px] text-muted-foreground font-mono">
                                  #{p.player_id}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="text-center p-3">
                            <Badge variant="outline" className={`${getRoleColor(p.posiz)} font-bold text-xs`}>
                              {p.posiz}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <div
                              className="flex items-center gap-1 flex-wrap"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {distinctTeams.length > 0 ? (
                                distinctTeams.map((t) => (
                                  <HistoricalTeamBadge
                                    key={t}
                                    teamCode={t}
                                    showFranchiseHint={false}
                                  />
                                ))
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </div>
                          </td>
                          <td className="text-center p-3 text-xs font-semibold">
                            {p.first_stag && p.last_stag ? `S${p.first_stag}–S${p.last_stag}` : "—"}
                          </td>
                          <td className="text-center p-3 text-base font-black text-primary">
                            {getMetricValue(p)}
                          </td>
                          <td className="p-3 text-xs text-muted-foreground">
                            {getMetricSubLabel(p)}
                          </td>
                          <td className="text-right p-3">
                            <Button variant="ghost" size="sm" className="h-8 text-xs font-bold gap-1">
                              Scheda
                              <ChevronRight className="h-3.5 w-3.5" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </main>
    </div>
  );
};

export default RecordAllTime;

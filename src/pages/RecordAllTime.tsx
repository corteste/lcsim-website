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
  CalendarDays,
  Shield,
  ShieldCheck,
  Award,
  Users,
  Swords,
  AlertTriangle,
  AlertOctagon,
  AlertCircle,
  Sparkles,
  Lock,
  Medal,
  ChevronRight,
} from "lucide-react";
import {
  getPlayerImage,
  getRoleColor,
} from "@/utils/functions";
import {
  fetchAllPlayersCareerSummary,
  fetchAllPlayersMultiGoalSummary,
  fetchAllPlayersTeamCareerSummary,
  fetchAllGoalkeepersUnbeatenStreakSummary,
  getHistoricalTeamMeta,
  GoalkeeperUnbeatenStreakSummary,
  PlayerCareerSummary,
  PlayerMultiGoalSummary,
  PlayerTeamCareerSummary,
} from "@/services/archiveService";
import {
  fetchAllPlayersPalmaresLeaderboard,
  PlayerPalmaresLeaderboardRow,
} from "@/services/playerPalmaresService";
import { HistoricalTeamBadge } from "@/components/archive/HistoricalTeamBadge";

type LeaderboardCategory =
  | "gol"
  | "gol_squadra"
  | "multi_gol"
  | "assist"
  | "ga"
  | "presenze"
  | "presenze_squadra"
  | "minutaggio"
  | "capitano"
  | "media_voto"
  | "contrasti"
  | "falli"
  | "gialli"
  | "rossi"
  | "autogol"
  | "clean_sheet"
  | "parate"
  | "imbattibilita"
  | "palmares";

interface EnrichedTeamCareerRow extends PlayerTeamCareerSummary {
  nome: string;
  cognome: string;
  posiz: string;
  is_hof: boolean;
}

interface EnrichedMultiGoalRow extends PlayerMultiGoalSummary {
  nome: string;
  cognome: string;
  posiz: string;
  is_hof: boolean;
  season_teams: string[];
  first_stag: number | null;
  last_stag: number | null;
  presenze: number;
  gol_totali: number;
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
    label: "Marcatori",
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
    id: "multi_gol",
    label: "Doppiette & Triplette",
    subtitle: "Partite ufficiali con almeno 2 gol segnati in un singolo match",
    unit: "2+G",
    icon: Sparkles,
    colorClass: "text-amber-500",
  },
  {
    id: "assist",
    label: "Assist-man",
    subtitle: "I migliori rifinitori di sempre per passaggi vincenti",
    unit: "Assist",
    icon: Target,
    colorClass: "text-blue-500",
  },
  {
    id: "ga",
    label: "Partecipazione Goal",
    subtitle: "Somma di reti segnate e assist forniti in carriera",
    unit: "G+A",
    icon: Flame,
    colorClass: "text-orange-500",
  },
  {
    id: "presenze",
    label: "Presenze",
    subtitle: "I fedelissimi con il maggior numero di gare disputate",
    unit: "Pres",
    icon: CalendarDays,
    colorClass: "text-purple-500",
  },
  {
    id: "presenze_squadra",
    label: "Presenze per Squadra",
    subtitle: "Maggior numero di presenze raccolte con la maglia di ciascuna squadra storica",
    unit: "Pres",
    icon: Users,
    colorClass: "text-violet-500",
  },
  {
    id: "minutaggio",
    label: "Minutaggio",
    subtitle: "Gli stacanovisti con il maggior numero di minuti giocati in campo",
    unit: "Min",
    icon: Clock,
    colorClass: "text-indigo-500",
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
    id: "contrasti",
    label: "Contrasti",
    subtitle: "I migliori recuperatori di palloni per contrasti vinti in carriera",
    unit: "Ctrs",
    icon: Swords,
    colorClass: "text-emerald-600",
  },
  {
    id: "falli",
    label: "Falli Commessi",
    subtitle: "Classifica dei giocatori con il maggior numero di falli fischiati",
    unit: "Falli",
    icon: AlertTriangle,
    colorClass: "text-orange-600",
  },
  {
    id: "gialli",
    label: "Cartellini Gialli",
    subtitle: "Classifica dei giocatori più ammoniti nella storia LCSIM",
    unit: "Gialli",
    icon: AlertOctagon,
    colorClass: "text-amber-500",
  },
  {
    id: "rossi",
    label: "Cartellini Rossi",
    subtitle: "Classifica dei giocatori con il maggior numero di espulsioni",
    unit: "Rossi",
    icon: AlertOctagon,
    colorClass: "text-red-600",
  },
  {
    id: "autogol",
    label: "Autogol",
    subtitle: "I giocatori con il maggior numero di autoreti commesse in carriera",
    unit: "AG",
    icon: AlertCircle,
    colorClass: "text-rose-500",
  },
  {
    id: "clean_sheet",
    label: "Clean Sheet",
    subtitle: "I portieri più impenetrabili per porte inviolate in carriera",
    unit: "CS",
    icon: ShieldCheck,
    colorClass: "text-cyan-500",
  },
  {
    id: "parate",
    label: "Parate",
    subtitle: "I numeri 1 con il maggior numero di interventi decisivi in carriera",
    unit: "Par",
    icon: Shield,
    colorClass: "text-sky-500",
  },
  {
    id: "imbattibilita",
    label: "Imbattibilità Portieri",
    subtitle: "Striscia record di partite intere consecutive senza subire gol",
    unit: "Gare",
    icon: Lock,
    colorClass: "text-emerald-400",
  },
  {
    id: "palmares",
    label: "Palmarès & Trofei",
    subtitle: "Somma di campionati, supercoppe e premi individuali vinti in carriera",
    unit: "Trofei",
    icon: Medal,
    colorClass: "text-amber-400",
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

  const isPerTeamCategory =
    activeCategory === "gol_squadra" || activeCategory === "presenze_squadra";

  const { data: teamCareerRaw = [], isLoading: loadingTeamCareer } = useQuery({
    queryKey: ["archive_players_team_career_summary"],
    queryFn: fetchAllPlayersTeamCareerSummary,
    enabled: isPerTeamCategory,
    staleTime: 60 * 1000,
  });

  const { data: multiGoalRaw = [], isLoading: loadingMultiGoal } = useQuery({
    queryKey: ["archive_players_multi_goal_summary"],
    queryFn: fetchAllPlayersMultiGoalSummary,
    enabled: activeCategory === "multi_gol",
    staleTime: 60 * 1000,
  });

  const porIds = useMemo(
    () => allPlayers.filter((p) => p.posiz === "POR").map((p) => p.player_id),
    [allPlayers]
  );

  const { data: unbeatenRaw = [], isLoading: loadingUnbeaten } = useQuery({
    queryKey: ["archive_gk_unbeaten_streak", porIds],
    queryFn: () => fetchAllGoalkeepersUnbeatenStreakSummary(porIds),
    enabled: activeCategory === "imbattibilita" && porIds.length > 0,
    staleTime: 60 * 1000,
  });

  const unbeatenByPlayerId = useMemo(() => {
    const map = new Map<number, GoalkeeperUnbeatenStreakSummary>();
    for (const r of unbeatenRaw) {
      map.set(r.player_id, r);
    }
    return map;
  }, [unbeatenRaw]);

  const { data: palmaresRaw = [], isLoading: loadingPalmares } = useQuery({
    queryKey: ["archive_players_palmares_leaderboard"],
    queryFn: fetchAllPlayersPalmaresLeaderboard,
    enabled: activeCategory === "palmares",
    staleTime: 60 * 1000,
  });

  const palmaresByPlayerId = useMemo(() => {
    const map = new Map<number, PlayerPalmaresLeaderboardRow>();
    for (const r of palmaresRaw) {
      map.set(r.playerId, r);
    }
    return map;
  }, [palmaresRaw]);

  const playersById = useMemo(() => {
    const map = new Map<number, PlayerCareerSummary>();
    for (const p of allPlayers) {
      map.set(p.player_id, p);
    }
    return map;
  }, [allPlayers]);

  const allTeamRows = useMemo<EnrichedTeamCareerRow[]>(() => {
    const base = teamCareerRaw.map((r) => {
      const player = playersById.get(r.player_id);
      return {
        ...r,
        nome: player?.nome ?? "",
        cognome: player?.cognome ?? `#${r.player_id}`,
        posiz: player?.posiz ?? "—",
        is_hof: Boolean(player?.is_hof),
      };
    });

    if (activeCategory === "gol_squadra") {
      return base
        .filter((r) => r.gol > 0)
        .sort((a, b) => b.gol - a.gol || a.presenze - b.presenze || a.minuti - b.minuti);
    }
    if (activeCategory === "presenze_squadra") {
      return base
        .filter((r) => r.presenze > 0)
        .sort((a, b) => b.presenze - a.presenze || b.minuti - a.minuti);
    }
    return [];
  }, [teamCareerRaw, playersById, activeCategory]);

  const availableTeamOptions = useMemo(() => {
    const codes = Array.from(new Set(allTeamRows.map((r) => r.team_id)));
    return codes
      .map((code) => ({
        code,
        meta: getHistoricalTeamMeta(code),
      }))
      .sort((a, b) => a.meta.fullName.localeCompare(b.meta.fullName));
  }, [allTeamRows]);

  const filteredTeamRows = useMemo(() => {
    const list =
      teamFilter === "all"
        ? allTeamRows
        : allTeamRows.filter((r) => r.team_id === teamFilter);
    return list.slice(0, 20);
  }, [allTeamRows, teamFilter]);

  const multiGoalRows = useMemo<EnrichedMultiGoalRow[]>(() => {
    if (activeCategory !== "multi_gol") return [];
    return multiGoalRaw.slice(0, 20).map((r) => {
      const player = playersById.get(r.player_id);
      return {
        ...r,
        nome: player?.nome ?? "",
        cognome: player?.cognome ?? `#${r.player_id}`,
        posiz: player?.posiz ?? "—",
        is_hof: Boolean(player?.is_hof),
        season_teams: player?.season_teams ?? [],
        first_stag: player?.first_stag ?? null,
        last_stag: player?.last_stag ?? null,
        presenze: player?.presenze ?? 0,
        gol_totali: player?.gol ?? 0,
      };
    });
  }, [multiGoalRaw, playersById, activeCategory]);

  const currentCatMeta = useMemo(
    () => LEADERBOARD_CATEGORIES.find((c) => c.id === activeCategory)!,
    [activeCategory]
  );

  const isLoadingActive =
    loadingPlayers ||
    (isPerTeamCategory && loadingTeamCareer) ||
    (activeCategory === "multi_gol" && loadingMultiGoal) ||
    (activeCategory === "imbattibilita" && loadingUnbeaten) ||
    (activeCategory === "palmares" && loadingPalmares);

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
      case "minutaggio":
        return list
          .filter((p) => p.minuti > 0)
          .sort((a, b) => b.minuti - a.minuti || b.presenze - a.presenze)
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
      case "contrasti":
        return list
          .filter((p) => p.ctrs_si > 0)
          .sort((a, b) => b.ctrs_si - a.ctrs_si || a.presenze - b.presenze)
          .slice(0, 20);
      case "falli":
        return list
          .filter((p) => p.falli > 0)
          .sort((a, b) => b.falli - a.falli || a.presenze - b.presenze)
          .slice(0, 20);
      case "gialli":
        return list
          .filter((p) => p.gialli > 0)
          .sort((a, b) => b.gialli - a.gialli || a.presenze - b.presenze)
          .slice(0, 20);
      case "rossi":
        return list
          .filter((p) => p.rossi > 0)
          .sort((a, b) => b.rossi - a.rossi || a.presenze - b.presenze)
          .slice(0, 20);
      case "autogol":
        return list
          .filter((p) => p.autogol > 0)
          .sort((a, b) => b.autogol - a.autogol || a.presenze - b.presenze)
          .slice(0, 20);
      case "clean_sheet":
        return list
          .filter((p) => p.posiz === "POR" && p.clean_sheets > 0)
          .sort((a, b) => b.clean_sheets - a.clean_sheets || a.gol_subiti - b.gol_subiti || a.presenze - b.presenze)
          .slice(0, 20);
      case "parate":
        return list
          .filter((p) => p.posiz === "POR" && p.parate > 0)
          .sort((a, b) => b.parate - a.parate || a.presenze - b.presenze)
          .slice(0, 20);
      case "imbattibilita":
        return list
          .filter((p) => p.posiz === "POR" && unbeatenByPlayerId.has(p.player_id))
          .sort(
            (a, b) =>
              (unbeatenByPlayerId.get(b.player_id)?.best_streak ?? 0) -
                (unbeatenByPlayerId.get(a.player_id)?.best_streak ?? 0) ||
              b.clean_sheets - a.clean_sheets ||
              a.presenze - b.presenze
          )
          .slice(0, 20);
      case "palmares":
        return list
          .filter((p) => palmaresByPlayerId.has(p.player_id))
          .sort((a, b) => {
            const pa = palmaresByPlayerId.get(a.player_id)!;
            const pb = palmaresByPlayerId.get(b.player_id)!;
            return (
              pb.totalCount - pa.totalCount ||
              pb.scudettiCount - pa.scudettiCount ||
              pb.individualAwardsCount - pa.individualAwardsCount ||
              a.presenze - b.presenze
            );
          })
          .slice(0, 20);
      default:
        return [];
    }
  }, [allPlayers, activeCategory, unbeatenByPlayerId, palmaresByPlayerId]);

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
      case "minutaggio":
        return p.minuti.toLocaleString("it-IT");
      case "capitano":
        return p.presenze_capitano;
      case "media_voto":
        return p.media_voto ? p.media_voto.toFixed(2) : "—";
      case "contrasti":
        return p.ctrs_si;
      case "falli":
        return p.falli;
      case "gialli":
        return p.gialli;
      case "rossi":
        return p.rossi;
      case "autogol":
        return p.autogol;
      case "clean_sheet":
        return p.clean_sheets;
      case "parate":
        return p.parate;
      case "imbattibilita":
        return unbeatenByPlayerId.get(p.player_id)?.best_streak ?? 0;
      case "palmares":
        return palmaresByPlayerId.get(p.player_id)?.totalCount ?? 0;
      default:
        return "—";
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
        return `${p.titolare} da titolare • ${p.minuti.toLocaleString("it-IT")}' min (${p.stagioni_giocate} stag.)`;
      case "minutaggio":
        return `${p.presenze} pres • ${Math.round(p.minuti / Math.max(1, p.presenze))}'/partita (${p.stagioni_giocate} stag.)`;
      case "capitano":
        return `Fascia in campo • ${p.presenze} presenze totali`;
      case "media_voto":
        return `${p.presenze} presenze • ${p.motm}x MOTM`;
      case "contrasti": {
        const ctrsPct = p.ctrs_tot > 0 ? Math.round((p.ctrs_si / p.ctrs_tot) * 100) : 0;
        return `${p.ctrs_tot} tentati (${ctrsPct}% successo) in ${p.presenze} pres`;
      }
      case "falli":
        return `${(p.falli / Math.max(1, p.presenze)).toFixed(2)} falli/partita in ${p.presenze} pres`;
      case "gialli":
        return `${p.falli} falli commessi • ${(p.gialli / Math.max(1, p.presenze)).toFixed(2)} gialli/gara in ${p.presenze} pres`;
      case "rossi":
        return `${p.gialli} gialli • ${p.falli} falli in ${p.presenze} pres`;
      case "autogol":
        return `${p.presenze} pres • ${(p.autogol / Math.max(1, p.presenze)).toFixed(2)} ag/partita`;
      case "clean_sheet": {
        const csPct = p.presenze > 0 ? Math.round((p.clean_sheets / p.presenze) * 100) : 0;
        return `${csPct}% porte inviolate • ${p.gol_subiti} gol subiti in ${p.presenze} pres`;
      }
      case "parate": {
        const shotsAgainst = p.parate + p.gol_subiti;
        const savePct = shotsAgainst > 0 ? Math.round((p.parate / shotsAgainst) * 100) : 0;
        const perMatch = (p.parate / Math.max(1, p.presenze)).toFixed(2);
        return `${perMatch} parate/gara • ${savePct}% parate in ${p.presenze} pres`;
      }
      case "imbattibilita": {
        const s = unbeatenByPlayerId.get(p.player_id);
        return s
          ? `Striscia ${s.streak_span} • ${p.clean_sheets} CS in ${p.presenze} pres`
          : `${p.clean_sheets} CS in ${p.presenze} pres`;
      }
      case "palmares": {
        const pal = palmaresByPlayerId.get(p.player_id);
        return pal
          ? `${pal.scudettiCount} Scudetti • ${pal.supercoppeCount} Supercoppe • ${pal.individualAwardsCount} Premi Ind.`
          : "";
      }
      default:
        return "";
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

        {/* Category Selector: Dropdown on mobile/tablet */}
        <div className="lg:hidden">
          <Select
            value={activeCategory}
            onValueChange={(val) => setActiveCategory(val as LeaderboardCategory)}
          >
            <SelectTrigger className="w-full h-11 text-sm font-bold bg-card border-border/80 rounded-xl shadow-xs">
              <SelectValue placeholder="Seleziona classifica" />
            </SelectTrigger>
            <SelectContent>
              {LEADERBOARD_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                return (
                  <SelectItem key={cat.id} value={cat.id} className="text-xs sm:text-sm font-semibold">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${cat.colorClass}`} />
                      <span>{cat.label}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Desktop Left Sidebar */}
          <aside className="hidden lg:block w-64 xl:w-72 shrink-0 sticky top-24">
            <Card className="border-border/80 shadow-md overflow-hidden">
              <CardHeader className="py-3.5 px-4 bg-muted/30 border-b border-border/60">
                <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                  Classifiche
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 space-y-1">
                {LEADERBOARD_CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isActive = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setActiveCategory(cat.id)}
                      className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-lg text-left text-xs xl:text-sm font-bold transition-all cursor-pointer ${
                        isActive
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-foreground hover:bg-muted/70"
                      }`}
                    >
                      <span className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={`h-4 w-4 shrink-0 ${
                            isActive ? "text-primary-foreground" : cat.colorClass
                          }`}
                        />
                        <span className="truncate">{cat.label}</span>
                      </span>
                      {isActive && (
                        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-primary-foreground" />
                      )}
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          </aside>

          {/* Main Content Column */}
          <div className="flex-1 min-w-0 w-full space-y-6">
        {isLoadingActive ? (
          <Card className="p-16 text-center text-muted-foreground">
            Caricamento classifiche All-Time...
          </Card>
        ) : isPerTeamCategory ? (
          <>
            {/* Filtro Squadra Rapido */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-card border border-border/70">
              <div className="text-xs text-muted-foreground">
                {activeCategory === "gol_squadra"
                  ? "Ogni riga rappresenta i gol segnati da un calciatore con la maglia di una specifica squadra storica."
                  : "Ogni riga rappresenta le presenze disputate da un calciatore con la maglia di una specifica squadra storica."}
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

            {/* Top 3 Podium Cards (Per Squadra) */}
            {filteredTeamRows.length >= 3 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {filteredTeamRows.slice(0, 3).map((r, idx) => {
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
                  const primaryVal = activeCategory === "gol_squadra" ? r.gol : r.presenze;
                  const detailLine =
                    activeCategory === "gol_squadra"
                      ? `${r.presenze} pres • ${(r.gol / Math.max(1, r.presenze)).toFixed(2)} gol/partita • ${seasonsLabel}`
                      : `${r.titolare} da titolare • ${r.minuti.toLocaleString("it-IT")}' min • ${seasonsLabel}`;
                  return (
                    <Card
                      key={`${r.player_id}-${r.team_id}`}
                      onClick={() => navigate(`/archivio/giocatori?player=${r.player_id}`)}
                      className={`cursor-pointer hover:shadow-lg transition-all ${rankColors[idx]}`}
                    >
                      <CardContent className="p-4 xl:p-5 flex items-center gap-3.5 xl:gap-4">
                        <img
                          src={getPlayerImage(r.player_id)}
                          alt={`${r.nome} ${r.cognome}`}
                          className="h-16 w-16 xl:h-20 xl:w-20 rounded-2xl object-cover border-2 border-border shrink-0 shadow-md"
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
                              {meta.fullName}
                            </span>
                          </div>
                          <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-2xl font-black text-primary">{primaryVal}</span>
                            <span className="text-xs font-bold text-muted-foreground">{currentCatMeta.unit}</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {detailLine}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Top 20 Table (Per Squadra) */}
            <Card className="shadow-lg border-border/80 overflow-hidden">
              <CardHeader className="py-4 px-5 bg-muted/30 border-b border-border/60">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-black">
                      {teamFilter === "all"
                        ? `${currentCatMeta.label} — Top 20`
                        : `${currentCatMeta.label} (${getHistoricalTeamMeta(teamFilter).fullName}) — Top ${filteredTeamRows.length}`}
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
                      <th className="text-center p-3 font-bold text-primary">{currentCatMeta.unit}</th>
                      <th className="text-left p-3 font-bold">Dettaglio</th>
                      <th className="text-right p-3 font-bold">Archivio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTeamRows.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-10 text-center text-muted-foreground">
                          Nessun record registrato per i criteri selezionati.
                        </td>
                      </tr>
                    ) : (
                      filteredTeamRows.map((r, idx) => {
                        const meta = getHistoricalTeamMeta(r.team_id);
                        const seasonsLabel =
                          r.first_stag === r.last_stag
                            ? `S${r.first_stag}`
                            : `S${r.first_stag}–S${r.last_stag}`;
                        const primaryVal = activeCategory === "gol_squadra" ? r.gol : r.presenze;
                        const detailLine =
                          activeCategory === "gol_squadra"
                            ? `${r.presenze} pres • ${(r.gol / Math.max(1, r.presenze)).toFixed(2)} gol/partita`
                            : `${r.titolare} da titolare • ${r.minuti.toLocaleString("it-IT")}' min`;
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
                              {primaryVal}
                            </td>
                            <td className="p-3 text-xs text-muted-foreground">
                              {detailLine}
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
        ) : activeCategory === "multi_gol" ? (
          <>
            {/* Top 3 Podium Cards (Doppiette & Triplette) */}
            {multiGoalRows.length >= 3 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {multiGoalRows.slice(0, 3).map((r, idx) => {
                  const rankColors = [
                    "border-yellow-500/50 bg-gradient-to-br from-yellow-500/15 via-card to-card",
                    "border-slate-400/50 bg-gradient-to-br from-slate-400/15 via-card to-card",
                    "border-amber-700/50 bg-gradient-to-br from-amber-700/15 via-card to-card",
                  ];
                  const medalLabels = ["🥇 1°", "🥈 2°", "🥉 3°"];
                  const distinctTeams = Array.from(new Set(r.season_teams));
                  const pokerNote = r.poker > 0 ? ` (${r.poker} poker+)` : "";
                  return (
                    <Card
                      key={r.player_id}
                      onClick={() => navigate(`/archivio/giocatori?player=${r.player_id}`)}
                      className={`cursor-pointer hover:shadow-lg transition-all ${rankColors[idx]}`}
                    >
                      <CardContent className="p-4 xl:p-5 flex items-center gap-3.5 xl:gap-4">
                        <img
                          src={getPlayerImage(r.player_id)}
                          alt={`${r.nome} ${r.cognome}`}
                          className="h-16 w-16 xl:h-20 xl:w-20 rounded-2xl object-cover border-2 border-border shrink-0 shadow-md"
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
                          <div
                            className="flex items-center gap-1 flex-wrap mt-1"
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
                          <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-2xl font-black text-primary">{r.totale}</span>
                            <span className="text-xs font-bold text-muted-foreground">Partite 2+ Gol</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {r.doppiette} doppiette • {r.triplette} triplette+{pokerNote}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Top 20 Table (Doppiette & Triplette) */}
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
                      <th className="text-center p-3 font-bold">Doppiette</th>
                      <th className="text-center p-3 font-bold">Triplette+</th>
                      <th className="text-center p-3 font-bold text-primary">Totale</th>
                      <th className="text-left p-3 font-bold">Dettaglio</th>
                      <th className="text-right p-3 font-bold">Archivio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {multiGoalRows.map((r, idx) => {
                      const distinctTeams = Array.from(new Set(r.season_teams));
                      const pokerNote = r.poker > 0 ? ` (${r.poker}× 4+ gol)` : "";
                      return (
                        <tr
                          key={r.player_id}
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
                            {r.first_stag && r.last_stag ? `S${r.first_stag}–S${r.last_stag}` : "—"}
                          </td>
                          <td className="text-center p-3 font-bold text-foreground">
                            {r.doppiette}
                          </td>
                          <td className="text-center p-3 font-bold text-amber-500">
                            {r.triplette}
                          </td>
                          <td className="text-center p-3 text-base font-black text-primary">
                            {r.totale}
                          </td>
                          <td className="p-3 text-xs text-muted-foreground">
                            Max {r.max_gol_match} gol/gara{pokerNote} • {r.gol_totali} gol in {r.presenze} pres
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
                      <CardContent className="p-4 xl:p-5 flex items-center gap-3.5 xl:gap-4">
                        <img
                          src={getPlayerImage(p.player_id)}
                          alt={`${p.nome} ${p.cognome}`}
                          className="h-16 w-16 xl:h-20 xl:w-20 rounded-2xl object-cover border-2 border-border shrink-0 shadow-md"
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
                          <div
                            className="flex items-center gap-1 flex-wrap mt-1"
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
          </div>
        </div>
      </main>
    </div>
  );
};

export default RecordAllTime;

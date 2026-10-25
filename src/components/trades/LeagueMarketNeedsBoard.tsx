import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Target,
  Search,
  Filter,
  RefreshCw,
  ArrowLeftRight,
  Shield,
  Sparkles,
  Users,
  CheckCircle2,
  Clock,
  Layers,
  ChevronRight,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  MACRO_MARKET_CATEGORIES,
  MacroNeedId,
  EnrichedTeamMarketNeed,
} from "@/types/marketNeeds";
import { fetchAllTeamMarketNeeds } from "@/services/marketNeedsService";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/supabaseClient";

interface LeagueMarketNeedsBoardProps {
  onOpenTradeWithTeam?: (teamId: string) => void;
}

export const LeagueMarketNeedsBoard: React.FC<LeagueMarketNeedsBoardProps> = ({
  onOpenTradeWithTeam,
}) => {
  const { user, effectiveTeam, openLogin } = useAuth();
  const currentTeamId = user?.team || effectiveTeam;

  const [teamNeeds, setTeamNeeds] = useState<EnrichedTeamMarketNeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<MacroNeedId | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = async () => {
    setLoading(true);
    const data = await fetchAllTeamMarketNeeds();
    setTeamNeeds(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();

    const handleSync = () => loadData();
    window.addEventListener("lcsim-market-needs-updated", handleSync);

    const channel = supabase
      .channel("lcsim-market-needs-board-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "team_market_needs" },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      window.removeEventListener("lcsim-market-needs-updated", handleSync);
      supabase.removeChannel(channel);
    };
  }, []);

  // Calcolo conteggio club per ciascuna macro-categoria
  const countsPerCategory = useMemo(() => {
    const map: Record<string, number> = {};
    MACRO_MARKET_CATEGORIES.forEach((cat) => {
      map[cat.id] = 0;
    });
    teamNeeds.forEach((team) => {
      team.needs.forEach((needId) => {
        if (map[needId] !== undefined) {
          map[needId] += 1;
        }
      });
    });
    return map;
  }, [teamNeeds]);

  // Filtro squadre
  const filteredTeams = useMemo(() => {
    return teamNeeds.filter((team) => {
      // Filtro categoria
      if (selectedCategory !== "ALL" && !team.needs.includes(selectedCategory)) {
        return false;
      }
      // Filtro ricerca testo
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = team.team_name.toLowerCase().includes(q);
        const matchesId = team.team_id.toLowerCase().includes(q);
        const matchesManager = team.manager_name?.toLowerCase().includes(q);
        const matchesNeeds = team.needs.some((needId) => {
          const cat = MACRO_MARKET_CATEGORIES.find((c) => c.id === needId);
          return (
            cat?.label.toLowerCase().includes(q) ||
            cat?.subRoles.some((r) => r.toLowerCase().includes(q))
          );
        });
        if (!matchesName && !matchesId && !matchesManager && !matchesNeeds) {
          return false;
        }
      }
      return true;
    });
  }, [teamNeeds, selectedCategory, searchQuery]);

  return (
    <div className="space-y-6">
      {/* FILTER CONTROLS BAR */}
      <div className="rounded-2xl border border-border/80 bg-card/60 p-4 space-y-3.5 backdrop-blur-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-emerald-500" />
            <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              Filtra per Reparto Cercato:
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={loading}
              className="h-8 text-xs font-bold border-border/80 hover:bg-muted"
            >
              <RefreshCw className={`h-3 w-3 mr-1.5 ${loading ? "animate-spin" : ""}`} />
              Aggiorna
            </Button>
          </div>
        </div>

        {/* Category Pills Slider / Flex */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCategory("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              selectedCategory === "ALL"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-muted/70 text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            Tutti i Reparti ({teamNeeds.length})
          </button>

          {MACRO_MARKET_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const count = countsPerCategory[cat.id] || 0;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? "bg-emerald-600 text-white shadow-sm"
                    : count > 0
                    ? "bg-card border border-border/80 text-foreground hover:bg-muted/60"
                    : "bg-muted/40 text-muted-foreground/60 border border-transparent"
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0 rounded-full font-bold ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : count > 0
                      ? cat.colorClass.badge
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Text Search Bar */}
        <div className="relative pt-1">
          <Search className="h-4 w-4 absolute left-3 top-3.5 text-muted-foreground" />
          <Input
            placeholder="Cerca per club, sigla o ruolo (es. Attaccanti, VFC, Terzini)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 pl-9 text-xs bg-background/80"
          />
        </div>
      </div>

      {/* CLUBS GRID */}
      {loading ? (
        <div className="p-16 text-center text-xs text-muted-foreground">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground/40" />
          Caricamento bisogni di mercato dei club...
        </div>
      ) : filteredTeams.length === 0 ? (
        <div className="p-16 text-center rounded-3xl border border-dashed border-border bg-card/40">
          <Target className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <h3 className="text-base font-bold">Nessuna società corrispondente</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
            Nessun club al momento ha indicato bisogni di mercato corrispondenti ai filtri impostati.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedCategory("ALL");
              setSearchQuery("");
            }}
            className="mt-4 text-xs font-bold"
          >
            Azzera Filtri
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTeams.map((team) => {
            const isMyTeam = currentTeamId === team.team_id;
            const needsCategories = team.needs
              .map((id) => MACRO_MARKET_CATEGORIES.find((c) => c.id === id))
              .filter(Boolean) as (typeof MACRO_MARKET_CATEGORIES)[number][];

            return (
              <Card
                key={team.team_id}
                className={`overflow-hidden border transition-all duration-200 flex flex-col justify-between ${
                  isMyTeam
                    ? "border-emerald-500/50 bg-gradient-to-br from-card via-card to-emerald-500/5 shadow-md ring-1 ring-emerald-500/20"
                    : "border-border/80 bg-card hover:border-border hover:shadow-md"
                }`}
              >
                <CardHeader className="p-4 pb-3 border-b border-border/60">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={`/images/teams/${team.team_id}_Logo.png`}
                        alt={team.team_name}
                        className="h-8 w-8 object-contain shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/images/LCSIM_Logo_SMALL.png";
                        }}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-extrabold text-sm text-foreground truncate">
                            {team.team_name}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          <span className="font-mono font-bold">{team.team_id}</span>
                          {team.manager_name && (
                            <>
                              <span>•</span>
                              <span className="truncate flex items-center gap-1">
                                <User className="h-3 w-3 text-muted-foreground/60 shrink-0" />
                                {team.manager_name}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {isMyTeam ? (
                      <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-mono font-bold shrink-0">
                        La Tua Rosa
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] font-mono font-bold shrink-0">
                        Serie A
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="p-4 flex-1 flex flex-col justify-between space-y-4">
                  {/* Needs Badges */}
                  <div>
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground mb-2 flex items-center justify-between">
                      <span>Macro-Categorie Ricercate:</span>
                      <span className="font-mono font-bold text-foreground">
                        {needsCategories.length > 0 ? `${needsCategories.length} attive` : "0 attive"}
                      </span>
                    </div>

                    {needsCategories.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {needsCategories.map((cat) => (
                          <div
                            key={cat.id}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-bold ${cat.colorClass.badge}`}
                            title={`${cat.label} (${cat.subRolesLabel})`}
                          >
                            <span className="font-black">{cat.label}</span>
                            <span className="text-[9px] opacity-75 font-mono font-normal">
                              ({cat.subRolesLabel})
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl border border-dashed border-border/80 bg-muted/20 text-center">
                        <p className="text-xs text-muted-foreground">
                          Nessun bisogno prioritario indicato al momento.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Card Action */}
                  <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {team.updated_at
                        ? `Agg. ${new Date(team.updated_at).toLocaleDateString("it-IT")}`
                        : "Non specificato"}
                    </span>

                    {isMyTeam ? (
                      <Button
                        size="sm"
                        variant="outline"
                        asChild
                        className="h-8 text-xs font-bold border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                      >
                        <Link to="/mia-squadra/trattative">
                          Modifica Bisogni
                        </Link>
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => {
                          if (!user) {
                            openLogin("login");
                            return;
                          }
                          if (onOpenTradeWithTeam) {
                            onOpenTradeWithTeam(team.team_id);
                          }
                        }}
                        asChild={!onOpenTradeWithTeam && !!user}
                        className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs"
                      >
                        {!onOpenTradeWithTeam && user ? (
                          <Link to={`/mia-squadra/trattative?recipient=${team.team_id}`}>
                            <ArrowLeftRight className="h-3 w-3 mr-1.5" />
                            Proponi Scambio
                          </Link>
                        ) : (
                          <span>
                            <ArrowLeftRight className="h-3 w-3 mr-1.5" />
                            Proponi Scambio
                          </span>
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

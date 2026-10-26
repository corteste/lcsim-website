import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Compass,
  Search,
  Star,
  Lock,
  Unlock,
  CheckCircle2,
  Coins,
  Eye,
  Sparkles,
  User,
  Ruler,
  Weight,
  Footprints,
  Award,
  ArrowUpRight,
  Layers,
  Shield,
  RefreshCw,
  RotateCcw,
  Bot,
  ListOrdered,
} from "lucide-react";
import { supabase } from "@/supabaseClient";
import {
  ROOKIE_TABLE,
  ROOKIE_SCOUTING_TABLE,
  MAX_SCOUTING_TOKENS,
} from "@/constants/App";
import { useAuth } from "@/context/AuthContext";
import AdminTeamSelector from "@/components/AdminTeamSelector";
import RequireAuthPrompt from "@/components/RequireAuthPrompt";
import { ScoutingAutopickTab } from "@/components/scouting/ScoutingAutopickTab";
import { Player } from "@/types/player";
import {
  getRoleColor,
  getValueColor,
  getNationalityFlag,
} from "@/utils/functions";
import {
  SCOUTING_TIERS,
  SCOUTING_DEPARTMENTS,
  isDepartmentUnlocked,
  getRequiredTokensForDepartment,
  getRequiredTokensForField,
  getOvrDisplayByTokens,
  getTierBadgeStyle,
  getStatDisplayByTokens,
  getRookieTraitsCount,
  isWeakFootUnlocked,
  isSkillMovesUnlocked,
  isRole1Unlocked,
  isEmotionUnlocked,
  isExactOvrUnlocked,
  isOvrPerRoleUnlocked,
  getTraitVisibility,
} from "@/utils/scoutingConfig";
import { calculatePlayerRoleOveralls } from "@/utils/playerOvrCalculator";
import { getEmotionLabel } from "@/constants/accessories";
import { renderStars } from "@/components/scouting/StarRating";
import { toast } from "sonner";
import {
  fetchTeamFavorites,
  toggleTeamFavorite,
} from "@/services/draftWishlistService";

export interface RookieScoutingRecord {
  team_id: string;
  rookie_id: number;
  tokens_spent: 1 | 2 | 3 | 5;
  updated_at: string;
  updated_by: string | null;
}

const ROLE_PRIORITY: Record<string, number> = {
  POR: 0,
  DC: 1,
  TD: 2,
  TS: 3,
  CDC: 4,
  CC: 5,
  ED: 6,
  ES: 7,
  COC: 8,
  AD: 9,
  AS: 10,
  AT: 11,
  ATT: 12,
};

const ROLE_GROUPS: { id: string; label: string; roles: string[] }[] = [
  { id: "ALL", label: "Tutti", roles: [] },
  { id: "POR", label: "POR", roles: ["POR"] },
  { id: "DIF", label: "DIF", roles: ["DC", "TD", "TS"] },
  { id: "CEN", label: "CEN", roles: ["CDC", "CC", "ED", "ES", "COC"] },
  { id: "ATT", label: "ATT", roles: ["AD", "AS", "AT", "ATT"] },
];

const ScoutingStatBar = ({
  label,
  code,
  value,
  tokensSpent,
}: {
  label: string;
  code: string;
  value: number | null | undefined;
  tokensSpent: number;
}) => {
  const displayInfo = getStatDisplayByTokens(value, tokensSpent);

  if (!displayInfo.isUnlocked) {
    return (
      <div className="p-2.5 rounded-lg bg-muted/25 border border-dashed border-border/60 flex items-center justify-between gap-2 opacity-75">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-bold border border-border/40">
            {code}
          </span>
          <span className="text-xs font-medium text-muted-foreground truncate">
            {label}
          </span>
        </div>
        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-muted-foreground bg-background/80 px-2 py-0.5 rounded border border-border/50 shrink-0">
          <Lock className="h-2.5 w-2.5" /> 1G
        </span>
      </div>
    );
  }

  const pct = Math.min(Math.max(displayInfo.midpoint, 0), 99);

  return (
    <div className="p-2.5 rounded-lg bg-card/80 border border-border/70 shadow-sm">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-bold border border-border/40 shrink-0">
            {code}
          </span>
          <span className="text-xs font-semibold text-foreground truncate">
            {label}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[9px] font-mono uppercase px-1 py-0.5 rounded bg-muted/70 text-muted-foreground font-semibold">
            {displayInfo.rangeType === "10" ? "Range 10" : "Range 3"}
          </span>
          <span
            className={`text-xs sm:text-sm font-black font-mono ${getValueColor(
              displayInfo.midpoint
            )}`}
          >
            {displayInfo.label}
          </span>
        </div>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${displayInfo.midpoint >= 90
            ? "bg-gradient-to-r from-purple-500 to-violet-500"
            : displayInfo.midpoint >= 85
              ? "bg-gradient-to-r from-blue-500 to-cyan-500"
              : displayInfo.midpoint >= 78
                ? "bg-gradient-to-r from-emerald-500 to-green-500"
                : displayInfo.midpoint >= 70
                  ? "bg-gradient-to-r from-amber-500 to-yellow-500"
                  : "bg-gradient-to-r from-orange-500 to-rose-500"
            }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

const Scouting = () => {
  const { user, isAdmin, effectiveTeam, availableTeams } = useAuth();
  const activeTeamId = effectiveTeam;

  const [rookies, setRookies] = useState<Player[]>([]);
  const [scoutingMap, setScoutingMap] = useState<Record<number, RookieScoutingRecord>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  // Active tab: "single" (Scheda Singolo Rookie), "recap" (Recap Rookie Scoutati) o "autopick" (Graduatoria Draft)
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "single";
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (newTab === "single") next.delete("tab");
        else next.set("tab", newTab);
        return next;
      },
      { replace: true }
    );
  };

  // Filters for Left Rookie List in "single" tab
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL"); // ALL | SCOUTED | UNSCOUTED
  const [selectedRookieId, setSelectedRookieId] = useState<number | null>(null);

  // Watchlist / Preferiti (Punto 6)
  const [favoriteRookieIds, setFavoriteRookieIds] = useState<Set<number>>(new Set());
  const [favoritesOnly, setFavoritesOnly] = useState<boolean>(false);

  // Filters for "recap" tab
  const [recapTierFilter, setRecapTierFilter] = useState<string>("ALL");
  const [recapRoleFilter, setRecapRoleFilter] = useState<string>("ALL");

  const fetchScoutingData = useCallback(
    async (silent = false) => {
      if (!activeTeamId) return;
      if (!silent) setLoading(true);
      try {
        const [rookiesRes, scoutingRes] = await Promise.all([
          supabase.rpc("rpc_get_scouted_rookies", { p_team_id: activeTeamId }),
          supabase
            .from(ROOKIE_SCOUTING_TABLE)
            .select("*")
            .eq("team_id", activeTeamId),
        ]);

        if (rookiesRes.error) throw rookiesRes.error;
        if (scoutingRes.error) throw scoutingRes.error;

        const rookieList = (rookiesRes.data ?? []) as Player[];
        setRookies(rookieList);

        const map: Record<number, RookieScoutingRecord> = {};
        for (const row of (scoutingRes.data ?? []) as RookieScoutingRecord[]) {
          map[Number(row.rookie_id)] = row;
        }
        setScoutingMap(map);

        setSelectedRookieId((prev) => {
          if (prev && rookieList.some((r) => Number(r.ID) === Number(prev))) {
            return prev;
          }
          return rookieList[0] ? Number(rookieList[0].ID) : null;
        });
      } catch (err) {
        console.error("Errore caricamento Scouting:", err);
        toast.error("Errore nel caricamento dei dati di scouting");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [activeTeamId]
  );

  useEffect(() => {
    if (user && activeTeamId) {
      fetchScoutingData(false);
    }
  }, [user, activeTeamId, fetchScoutingData]);

  // Caricamento preferiti
  const loadFavorites = useCallback(async () => {
    if (!activeTeamId) return;
    try {
      const favs = await fetchTeamFavorites(activeTeamId, "rookie");
      setFavoriteRookieIds(favs);
    } catch (err) {
      console.error("Errore caricamento preferiti:", err);
    }
  }, [activeTeamId]);

  useEffect(() => {
    if (activeTeamId) {
      loadFavorites();
    }
  }, [activeTeamId, loadFavorites]);

  const handleToggleFavorite = async (rookieId: number) => {
    if (!activeTeamId) {
      toast.error("Seleziona o accedi con una squadra per gestire i preferiti.");
      return;
    }

    setFavoriteRookieIds((prev) => {
      const next = new Set(prev);
      if (next.has(rookieId)) next.delete(rookieId);
      else next.add(rookieId);
      return next;
    });

    const res = await toggleTeamFavorite(activeTeamId, rookieId, "rookie");
    if (res.error) {
      toast.error("Errore salvataggio preferito");
      loadFavorites();
    } else {
      toast.success(
        res.isFavorite
          ? "Rookie aggiunto ai preferiti (⭐) e sincronizzato con il Draft!"
          : "Rookie rimosso dai preferiti"
      );
    }
  };

  // Total tokens spent by activeTeamId (sum of max tokens per rookie)
  const totalTokensSpent = useMemo(() => {
    return Object.values(scoutingMap).reduce(
      (acc, r) => acc + (Number(r.tokens_spent) || 0),
      0
    );
  }, [scoutingMap]);

  const remainingTokens = Math.max(0, MAX_SCOUTING_TOKENS - totalTokensSpent);

  const scoutedRookiesCount = useMemo(
    () => Object.keys(scoutingMap).length,
    [scoutingMap]
  );

  // Filtered rookies for the left sidebar
  const filteredRookies = useMemo(() => {
    return rookies
      .filter((r) => {
        if (favoritesOnly && !favoriteRookieIds.has(Number(r.ID))) return false;
        const tokens = scoutingMap[Number(r.ID)]?.tokens_spent ?? 0;
        if (statusFilter === "SCOUTED" && tokens === 0) return false;
        if (statusFilter === "UNSCOUTED" && tokens > 0) return false;
        if (roleFilter !== "ALL") {
          const group = ROLE_GROUPS.find((g) => g.id === roleFilter);
          if (group && group.roles.length > 0 && !group.roles.includes(r.Posiz)) {
            return false;
          }
        }
        if (searchQuery.trim() !== "") {
          const q = searchQuery.toLowerCase().trim();
          const full = `${r.Nome} ${r.Cognome} ${r.Posiz}`.toLowerCase();
          return full.includes(q);
        }
        return true;
      })
      .sort((a, b) => {
        const starsA = Number(a.Stelle) || 0;
        const starsB = Number(b.Stelle) || 0;
        return starsB - starsA;
      });
  }, [rookies, scoutingMap, statusFilter, roleFilter, searchQuery, favoritesOnly, favoriteRookieIds]);

  // Currently selected rookie in the Single Rookie Inspector
  const selectedRookie = useMemo(() => {
    if (selectedRookieId === null) return filteredRookies[0] ?? null;
    return (
      rookies.find((r) => Number(r.ID) === Number(selectedRookieId)) ??
      filteredRookies[0] ??
      null
    );
  }, [selectedRookieId, rookies, filteredRookies]);

  const selectedRookieTokens = useMemo(() => {
    if (!selectedRookie) return 0;
    return scoutingMap[Number(selectedRookie.ID)]?.tokens_spent ?? 0;
  }, [selectedRookie, scoutingMap]);

  // Upgrade scouting tier handler (strictly monotonic: newTier > currentTokens)
  const handleUpgradeScouting = async (
    rookie: Player,
    newTier: 1 | 2 | 3 | 5
  ) => {
    if (!user || !activeTeamId) return;
    const rookieId = Number(rookie.ID);
    const currentTokens = scoutingMap[rookieId]?.tokens_spent ?? 0;

    if (newTier <= currentTokens) {
      toast.error(
        "Non è possibile diminuire i gettoni scouting già spesi su un rookie."
      );
      return;
    }

    const deltaCost = newTier - currentTokens;
    if (deltaCost > remainingTokens) {
      toast.error(
        `Gettoni insufficienti! Servono +${deltaCost} gettoni ma ne hai solo ${remainingTokens} disponibili.`
      );
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from(ROOKIE_SCOUTING_TABLE).upsert(
        {
          team_id: activeTeamId,
          rookie_id: rookieId,
          tokens_spent: newTier,
          updated_at: new Date().toISOString(),
          updated_by: user.username,
        },
        { onConflict: "team_id,rookie_id" }
      );

      if (error) throw error;

      toast.success(
        currentTokens > 0
          ? `Scouting potenziato su ${rookie.Nome} ${rookie.Cognome}: da ${currentTokens}G a ${newTier}G (+${deltaCost} gettoni usati).`
          : `Scouting avviato su ${rookie.Nome} ${rookie.Cognome}: Fascia ${newTier} Getton${newTier === 1 ? "e" : "i"
          }!`
      );
      await fetchScoutingData(true);
    } catch (err: unknown) {
      console.error("Errore salvataggio scouting:", err);
      const msg =
        err instanceof Error ? err.message : "Errore nel salvataggio dello scouting";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // Admin: update a rookie's Stelle (1..5)
  const handleAdminUpdateStars = async (rookie: Player, newStars: number) => {
    if (!isAdmin) return;
    try {
      const { error } = await supabase
        .from(ROOKIE_TABLE)
        .update({ Stelle: newStars })
        .eq("ID", rookie.ID);
      if (error) throw error;
      toast.success(
        `Stelle di ${rookie.Nome} ${rookie.Cognome} aggiornate a ${newStars} ⭐`
      );
      await fetchScoutingData(true);
    } catch (err) {
      console.error("Errore aggiornamento stelle:", err);
      toast.error("Impossibile aggiornare le stelle");
    }
  };

  // Admin: reset scouting for a specific rookie on activeTeamId (for admin corrections)
  const handleAdminResetRookieScouting = async (rookie: Player) => {
    if (!isAdmin || !activeTeamId) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from(ROOKIE_SCOUTING_TABLE)
        .delete()
        .eq("team_id", activeTeamId)
        .eq("rookie_id", rookie.ID);
      if (error) throw error;
      toast.success(
        `Scouting di ${rookie.Nome} ${rookie.Cognome} azzerato per ${activeTeamId} (Admin)`
      );
      await fetchScoutingData(true);
    } catch (err) {
      console.error("Errore reset scouting:", err);
      toast.error("Errore durante il reset dello scouting");
    } finally {
      setSaving(false);
    }
  };

  // All scouted rookies for the Recap tab
  const scoutedRookiesList = useMemo(() => {
    return rookies
      .filter((r) => (scoutingMap[Number(r.ID)]?.tokens_spent ?? 0) > 0)
      .filter((r) => {
        const t = scoutingMap[Number(r.ID)]?.tokens_spent ?? 0;
        if (recapTierFilter !== "ALL" && String(t) !== recapTierFilter) {
          return false;
        }
        if (recapRoleFilter !== "ALL") {
          const group = ROLE_GROUPS.find((g) => g.id === recapRoleFilter);
          if (group && group.roles.length > 0 && !group.roles.includes(r.Posiz)) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        const ta = scoutingMap[Number(a.ID)]?.tokens_spent ?? 0;
        const tb = scoutingMap[Number(b.ID)]?.tokens_spent ?? 0;
        if (tb !== ta) return tb - ta;
        return (ROLE_PRIORITY[a.Posiz] ?? 99) - (ROLE_PRIORITY[b.Posiz] ?? 99);
      });
  }, [rookies, scoutingMap, recapTierFilter, recapRoleFilter]);

  // Helper to get top unlocked attributes for a scouted rookie in the Recap view
  const getTopUnlockedAttributes = (rookie: Player, tokensSpent: number) => {
    if (tokensSpent < 1) return [];
    const unlockedStats: {
      code: string;
      label: string;
      val: number;
      rangeLabel: string;
      midpoint: number;
    }[] = [];
    for (const dept of SCOUTING_DEPARTMENTS) {
      for (const st of dept.stats) {
        const v = Number(rookie[st.code]) || 0;
        const display = getStatDisplayByTokens(v, tokensSpent);
        unlockedStats.push({
          code: String(st.code),
          label: st.label,
          val: v,
          rangeLabel: display.label,
          midpoint: display.midpoint,
        });
      }
    }
    return unlockedStats.sort((a, b) => b.val - a.val).slice(0, 6);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <RequireAuthPrompt />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <Navbar />

      <main className="container mx-auto px-4 py-6 space-y-6">
        <AdminTeamSelector />

        {/* TOP TELEMETRY COMMAND HUD */}
        <div className="rounded-2xl border border-border/80 bg-card shadow-lg overflow-hidden">
          <div className="p-5 md:p-6 bg-gradient-to-r from-emerald-500/10 via-card to-sky-500/5 border-b border-border/70">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1.5">
                    <Compass className="h-3 w-3" /> La Mia Squadra • Intelligence &amp; Osservatori
                  </span>
                  <Badge variant="outline" className="font-mono text-[11px]">
                    Squadra: {activeTeamId}
                  </Badge>
                </div>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-3">
                  <Eye className="h-7 w-7 text-emerald-500 shrink-0" />
                  Centro Scouting Rookie
                </h1>
                <p className="text-xs md:text-sm text-muted-foreground mt-1">
                  Investi i tuoi <strong>60 gettoni</strong> sulle 4 fasce di visibilità (1G, 2G, 3G, 5G). Fa fede la fascia massima raggiunta sul singolo rookie; non è mai possibile diminuire i gettoni assegnati.
                </p>
              </div>

              {/* Telemetry Budget Widgets */}
              <div className="grid grid-cols-3 gap-2.5 sm:gap-3 shrink-0">
                <div className="px-3.5 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Gettoni Rimasti
                  </div>
                  <div className="text-xl sm:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {remainingTokens}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono">
                    su {MAX_SCOUTING_TOKENS} totali
                  </div>
                </div>

                <div className="px-3.5 py-2.5 rounded-xl bg-muted/50 border border-border text-center">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Gettoni Spesi
                  </div>
                  <div className="text-xl sm:text-2xl font-black font-mono text-foreground mt-0.5">
                    {totalTokensSpent}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono">
                    {Math.round((totalTokensSpent / MAX_SCOUTING_TOKENS) * 100)}% budget
                  </div>
                </div>

                <div className="px-3.5 py-2.5 rounded-xl bg-muted/50 border border-border text-center">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Rookie Scoutati
                  </div>
                  <div className="text-xl sm:text-2xl font-black font-mono text-foreground mt-0.5">
                    {scoutedRookiesCount}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono">
                    su {rookies.length} rookie
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar & Tier Legend */}
          <div className="px-5 py-3 bg-muted/30 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-xs">
            </div>

            <div className="flex items-center gap-2 self-end md:self-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchScoutingData(false)}
                disabled={loading}
                className="h-7 text-xs gap-1.5"
              >
                <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
                Sincronizza
              </Button>
            </div>
          </div>
        </div>

        {/* MAIN TABS: 1) SCHEDA SINGOLO ROOKIE | 2) RECAP ROOKIE SCOUTATI | 3) GRADUATORIA & AUTOPICK */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-5">
          <TabsList className="bg-card border border-border/80 p-1 h-auto flex flex-wrap gap-1 w-full sm:w-auto">
            <TabsTrigger
              value="single"
              className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-lg gap-2"
            >
              <Eye className="h-4 w-4" />
              Scheda Singolo Rookie &amp; Assegnazione Gettoni
            </TabsTrigger>
            <TabsTrigger
              value="recap"
              className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-lg gap-2"
            >
              <Layers className="h-4 w-4" />
              Recap Rookie Scoutati ({scoutedRookiesCount})
            </TabsTrigger>
            <TabsTrigger
              value="autopick"
              className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-lg gap-2"
            >
              <Bot className="h-4 w-4" />
              Graduatoria Draft &amp; Autopick
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: SINGLE ROOKIE INSPECTOR */}
          <TabsContent value="single" className="m-0">
            <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 items-start">
              {/* LEFT SIDEBAR: ROOKIE LIST */}
              <Card className="border border-border/80 shadow-md overflow-hidden bg-card lg:sticky lg:top-20">
                <CardHeader className="p-3.5 bg-muted/30 border-b border-border/70 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-extrabold uppercase tracking-wider">
                      Lista Rookie ({filteredRookies.length})
                    </CardTitle>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setFavoritesOnly((prev) => !prev)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors flex items-center gap-1 ${favoritesOnly
                          ? "bg-amber-500/25 text-amber-600 dark:text-amber-400 border border-amber-500/50 shadow-xs"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                          }`}
                        title="Filtra solo rookie contrassegnati con la stella"
                      >
                        <Star className={`h-2.5 w-2.5 ${favoritesOnly ? "fill-amber-500 text-amber-500" : ""}`} />
                        <span>★ ({favoriteRookieIds.size})</span>
                      </button>
                      {(
                        [
                          { id: "ALL", label: "Tutti" },
                          { id: "SCOUTED", label: "Scoutati" },
                          { id: "UNSCOUTED", label: "0G" },
                        ] as const
                      ).map((st) => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => setStatusFilter(st.id)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${statusFilter === st.id
                            ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40"
                            : "bg-muted text-muted-foreground hover:text-foreground"
                            }`}
                        >
                          {st.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="relative">
                    <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <Input
                      placeholder="Cerca rookie per nome o ruolo..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-8 pl-8 text-xs"
                    />
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {ROLE_GROUPS.map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setRoleFilter(g.id)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors ${roleFilter === g.id
                          ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40"
                          : "bg-muted/60 text-muted-foreground hover:text-foreground"
                          }`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </CardHeader>

                <CardContent className="p-0 max-h-[620px] overflow-y-auto divide-y divide-border/50">
                  {filteredRookies.length === 0 ? (
                    <div className="p-8 text-center text-xs text-muted-foreground">
                      Nessun rookie trovato con questi filtri.
                    </div>
                  ) : (
                    filteredRookies.map((r) => {
                      const rId = Number(r.ID);
                      const isSelected = Number(selectedRookie?.ID) === rId;
                      const tokens = scoutingMap[rId]?.tokens_spent ?? 0;
                      const isFav = favoriteRookieIds.has(rId);

                      return (
                        <div
                          key={r.ID}
                          onClick={() => setSelectedRookieId(rId)}
                          className={`w-full p-3 text-left flex items-center justify-between gap-2 transition-colors cursor-pointer ${isSelected
                            ? "bg-emerald-500/15 border-l-4 border-l-emerald-500"
                            : "hover:bg-muted/50"
                            }`}
                        >
                          <div className="min-w-0 space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className={`text-[10px] font-bold px-1.5 py-0 w-10 justify-center shrink-0 ${getRoleColor(
                                  r.Posiz
                                )}`}
                              >
                                {r.Posiz}
                              </Badge>
                              <span className="font-bold text-xs sm:text-sm truncate">
                                {r.Nome} {r.Cognome}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground pl-0.5">
                              <span>{r.Età}a</span>
                              <span>•</span>
                              <span>{r.Altezza}cm</span>
                              <span>•</span>
                              <span>{r.Piede}</span>
                              <span>•</span>
                              {renderStars(r.Stelle, "h-3 w-3")}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* BOTTONE STELLA PREFERITI */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleFavorite(rId);
                              }}
                              className={`p-1.5 rounded-lg border transition-all ${isFav
                                ? "bg-amber-500/20 text-amber-500 border-amber-500/40 shadow-xs"
                                : "text-muted-foreground/40 border-transparent hover:border-border hover:bg-muted hover:text-amber-500"
                                }`}
                              title={isFav ? "Rimuovi dai preferiti" : "Salva tra i preferiti (⭐)"}
                            >
                              <Star className={`h-4 w-4 ${isFav ? "fill-amber-500 text-amber-500" : ""}`} />
                            </button>

                            <Badge
                              variant="outline"
                              className={`font-mono text-[10px] font-extrabold ${getTierBadgeStyle(
                                tokens
                              )}`}
                            >
                              {tokens}G
                            </Badge>
                          </div>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>

              {/* RIGHT MAIN AREA: SINGLE ROOKIE FULL SCOUTING INTERFACE */}
              {selectedRookie ? (
                <div className="space-y-5 min-w-0">
                  {/* 1. ROOKIE HERO BIO & BASE INFO CARD (Always visible at 0 tokens) */}
                  <Card className="border border-border/80 shadow-md overflow-hidden bg-card">
                    <div className="p-5 md:p-6 bg-gradient-to-br from-emerald-500/10 via-card to-muted/30 border-b border-border/70">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                        <div className="flex items-start sm:items-center gap-4">
                          {/* OVR / Star System Badge */}
                          {(() => {
                            const ovrInfo = getOvrDisplayByTokens(
                              selectedRookie.OVR,
                              selectedRookieTokens,
                              selectedRookie.Stelle
                            );
                            return (
                              <div
                                className={`h-20 w-24 rounded-2xl flex flex-col items-center justify-center border-2 shadow-lg shrink-0 ${ovrInfo.isExact
                                  ? "bg-emerald-600 text-white border-emerald-400"
                                  : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40"
                                  }`}
                              >
                                <span className="text-[9px] font-bold uppercase tracking-widest opacity-85">
                                  {ovrInfo.isExact ? "OVR Esatto" : "Valutazione"}
                                </span>
                                {ovrInfo.isExact ? (
                                  <span className="text-2xl font-black font-mono leading-tight mt-0.5 text-white">
                                    {ovrInfo.label}
                                  </span>
                                ) : (
                                  <div className="flex items-center gap-0.5 mt-1">
                                    {renderStars(selectedRookie.Stelle, "h-4 w-4")}
                                  </div>
                                )}
                                <span className="text-[8px] font-mono opacity-80 mt-0.5">
                                  {ovrInfo.isExact ? "Scouting 100%" : "Esatto a 5G"}
                                </span>
                              </div>
                            );
                          })()}

                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge
                                variant="outline"
                                className={`${getRoleColor(
                                  selectedRookie.Posiz
                                )} text-xs font-extrabold px-2.5 py-0.5`}
                              >
                                {selectedRookie.Posiz}
                              </Badge>
                              <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight">
                                {selectedRookie.Nome} {selectedRookie.Cognome}
                              </h2>

                              {/* PULSANTE PREFERITO BEN VISIBILE */}
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => handleToggleFavorite(Number(selectedRookie.ID))}
                                className={`h-8 px-3 text-xs font-bold gap-1.5 rounded-xl transition-all shadow-xs ${favoriteRookieIds.has(Number(selectedRookie.ID))
                                  ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/50 hover:bg-amber-500/30 ring-1 ring-amber-500/30"
                                  : "border-border/80 text-muted-foreground hover:text-amber-500 hover:border-amber-500/40 hover:bg-amber-500/10"
                                  }`}
                              >
                                <Star
                                  className={`h-4 w-4 ${favoriteRookieIds.has(Number(selectedRookie.ID))
                                    ? "fill-amber-500 text-amber-500"
                                    : ""
                                    }`}
                                />
                                <span>
                                  {favoriteRookieIds.has(Number(selectedRookie.ID))
                                    ? "Salvato nei Preferiti"
                                    : "Aggiungi ai Preferiti"}
                                </span>
                              </Button>
                              {selectedRookie.Nazionalità && (
                                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted border border-border/60 text-xs font-semibold">
                                  <img
                                    src={getNationalityFlag(selectedRookie.Nazionalità)}
                                    alt={selectedRookie.Nazionalità}
                                    className="h-3.5 w-5 object-cover rounded-sm"
                                  />
                                  <span>{selectedRookie.Nazionalità}</span>
                                </div>
                              )}
                              {selectedRookie.Squadra && (
                                <Badge variant="secondary" className="font-mono text-xs">
                                  Draftato: {selectedRookie.Squadra}
                                </Badge>
                              )}
                            </div>

                            {/* Base Biometrics Strip (Always visible at 0G: Età, Altezza, Peso, Posizione, Piede, Stelle) */}
                            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm pt-1">
                              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-background/80 border border-border/60">
                                <User className="h-3.5 w-3.5 text-emerald-500" />
                                <span className="text-muted-foreground">Età:</span>
                                <strong className="text-foreground">
                                  {selectedRookie.Età} anni
                                </strong>
                              </div>

                              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-background/80 border border-border/60">
                                <Ruler className="h-3.5 w-3.5 text-emerald-500" />
                                <span className="text-muted-foreground">Altezza:</span>
                                <strong className="text-foreground">
                                  {selectedRookie.Altezza} cm
                                </strong>
                              </div>

                              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-background/80 border border-border/60">
                                <Weight className="h-3.5 w-3.5 text-emerald-500" />
                                <span className="text-muted-foreground">Peso:</span>
                                <strong className="text-foreground">
                                  {selectedRookie.Peso} kg
                                </strong>
                              </div>

                              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-background/80 border border-border/60">
                                <Footprints className="h-3.5 w-3.5 text-emerald-500" />
                                <span className="text-muted-foreground">Piede:</span>
                                <strong className="text-foreground">
                                  {selectedRookie.Piede}
                                </strong>
                              </div>

                              <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30">
                                <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                                  Stelle:
                                </span>
                                {renderStars(selectedRookie.Stelle, "h-4 w-4")}
                                {isAdmin && (
                                  <select
                                    value={selectedRookie.Stelle ?? 3}
                                    onChange={(e) =>
                                      handleAdminUpdateStars(
                                        selectedRookie,
                                        Number(e.target.value)
                                      )
                                    }
                                    title="Modifica Stelle (Admin)"
                                    className="ml-1 bg-background border border-border rounded px-1 py-0 text-[11px] font-mono"
                                  >
                                    {[1, 2, 3, 4, 5].map((s) => (
                                      <option key={s} value={s}>
                                        {s}★
                                      </option>
                                    ))}
                                  </select>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Current Scouting Level Badge + Admin Reset */}
                        <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
                          <Badge
                            variant="outline"
                            className={`px-3 py-1 text-xs font-mono font-extrabold ${getTierBadgeStyle(
                              selectedRookieTokens
                            )}`}
                          >
                            Livello Scouting Attuale: {selectedRookieTokens} Getton
                            {selectedRookieTokens === 1 ? "e" : "i"}
                          </Badge>
                          {isAdmin && selectedRookieTokens > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleAdminResetRookieScouting(selectedRookie)
                              }
                              className="h-7 text-[11px] text-muted-foreground hover:text-destructive gap-1"
                            >
                              <RotateCcw className="h-3 w-3" /> Azzera gettoni rookie (Admin)
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 2. THE 4 SCOUTING TIERS BAR (1G, 2G, 3G, 5G) - Monotonic Upgrade Only */}
                    <CardContent className="p-4 md:p-5 bg-muted/15">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <Coins className="h-4 w-4 text-emerald-500" />
                          Potenzia Fascia di Scouting su {selectedRookie.Nome}{" "}
                          {selectedRookie.Cognome}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          Paghi solo la differenza rispetto alla fascia attuale ({selectedRookieTokens}G). Non è possibile diminuire i gettoni.
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                        {SCOUTING_TIERS.map((tier) => {
                          const isUnlocked = selectedRookieTokens >= tier.tokens;
                          const isCurrent = selectedRookieTokens === tier.tokens;
                          const deltaCost = Math.max(
                            0,
                            tier.tokens - selectedRookieTokens
                          );
                          const canAfford = remainingTokens >= deltaCost;

                          return (
                            <div
                              key={tier.tokens}
                              className={`p-3.5 rounded-xl border flex flex-col justify-between gap-3 transition-all ${isCurrent
                                ? "bg-emerald-500/15 border-2 border-emerald-500 shadow-sm"
                                : isUnlocked
                                  ? "bg-muted/40 border-emerald-500/30 opacity-85"
                                  : "bg-card border-border/80 hover:border-emerald-500/40"
                                }`}
                            >
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between gap-2">
                                  <Badge
                                    variant="outline"
                                    className={`font-mono font-extrabold text-xs ${tier.badgeClass}`}
                                  >
                                    {tier.label}
                                  </Badge>
                                  {isUnlocked ? (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                      <CheckCircle2 className="h-3.5 w-3.5" />
                                      {isCurrent ? "Fascia Attiva" : "Incluso"}
                                    </span>
                                  ) : (
                                    <span className="text-[11px] font-mono font-bold text-muted-foreground">
                                      Costo: +{deltaCost}G
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs font-bold text-foreground">
                                  {tier.title}
                                </div>
                                <p className="text-[11px] text-muted-foreground leading-relaxed">
                                  {tier.description}
                                </p>
                              </div>

                              {isUnlocked ? (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  disabled
                                  className="w-full h-8 text-xs font-bold gap-1.5"
                                >
                                  <Unlock className="h-3.5 w-3.5 text-emerald-500" />
                                  {isCurrent
                                    ? `Attivo (${tier.tokens}G spesi)`
                                    : "Fascia Superata"}
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  disabled={!canAfford || saving}
                                  onClick={() =>
                                    handleUpgradeScouting(selectedRookie, tier.tokens)
                                  }
                                  className="w-full h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                                >
                                  <Coins className="h-3.5 w-3.5" />
                                  {selectedRookieTokens > 0
                                    ? `Passa a ${tier.tokens}G (+${deltaCost}G)`
                                    : `Sblocca con ${tier.tokens}G`}
                                </Button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* 3. SECONDARY PROFILE FIELDS: ROLES, WEAK FOOT, SKILL MOVES & EMOTION */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Ruolo Tattico, Piede Debole, Skill (3G) & Emotion (2G) */}
                    <Card className="border border-border/80 bg-card shadow-sm">
                      <CardHeader className="py-3 px-4 bg-muted/30 border-b border-border/60 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-2">
                          <Compass className="h-4 w-4 text-sky-500" />
                          Specializzazione, Tecnica &amp; Emotion
                        </CardTitle>
                        <Badge
                          variant="outline"
                          className="text-[10px] font-mono bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30"
                        >
                          Emotion 2G • Tecnica 3G
                        </Badge>
                      </CardHeader>
                      <CardContent className="p-4 grid grid-cols-2 gap-2.5">
                        {[
                          {
                            label: "Piede Debole",
                            val: selectedRookie.PiedeDebole || "⭐⭐⭐",
                            req: 3,
                            unlocked: isWeakFootUnlocked(selectedRookieTokens),
                          },
                          {
                            label: "Mosse Abilità",
                            val: selectedRookie.MABI || "⭐⭐⭐",
                            req: 3,
                            unlocked: isSkillMovesUnlocked(selectedRookieTokens),
                          },
                          {
                            label: "Ruolo Tattico (Role 1)",
                            val: selectedRookie.Role1 || "Standard",
                            req: 3,
                            unlocked: isRole1Unlocked(selectedRookieTokens),
                          },
                          {
                            label: "Emotion (Temperamento)",
                            val: getEmotionLabel(selectedRookie.Emotion),
                            req: 2,
                            unlocked: isEmotionUnlocked(selectedRookieTokens),
                          },
                        ].map((item, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-xl border border-border/70 bg-muted/20 flex flex-col justify-between"
                          >
                            <span className="text-[10px] font-semibold uppercase text-muted-foreground">
                              {item.label}
                            </span>
                            {item.unlocked ? (
                              <span className="text-xs sm:text-sm font-bold text-foreground mt-1">
                                {item.val}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-mono text-muted-foreground mt-1">
                                <Lock className="h-3 w-3" /> Sblocca a {item.req}G
                              </span>
                            )}
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                    {/* Tratti & PlayStyles (Conteggio a 2G • Nomi esatti a 3G) */}
                    <Card className="border border-border/80 bg-card shadow-sm">
                      <CardHeader className="py-3 px-4 bg-muted/30 border-b border-border/60 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-2">
                          <Award className="h-4 w-4 text-amber-500" />
                          Tratti &amp; PlayStyles
                        </CardTitle>
                        <Badge
                          variant="outline"
                          className="text-[10px] font-mono bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30"
                        >
                          Conteggio 2G • Esatti 3G
                        </Badge>
                      </CardHeader>
                      <CardContent className="p-4">
                        {(() => {
                          const traitVis = getTraitVisibility(selectedRookieTokens);
                          const traitsCount = getRookieTraitsCount(selectedRookie);

                          if (traitVis === "none") {
                            return (
                              <div className="p-4 rounded-xl bg-muted/20 border border-dashed border-border/70 text-center space-y-1.5">
                                <Lock className="h-5 w-5 text-muted-foreground mx-auto opacity-60" />
                                <div className="text-xs font-semibold text-muted-foreground">
                                  Tratti oscurati
                                </div>
                                <p className="text-[11px] text-muted-foreground/80">
                                  Richiede almeno 2 Gettoni per svelare il numero di tratti e 3 Gettoni per i nomi completi.
                                </p>
                              </div>
                            );
                          }

                          if (traitVis === "count") {
                            return (
                              <div className="space-y-3">
                                <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-between">
                                  <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
                                      Numero di Tratti
                                    </span>
                                    <span className="text-base font-extrabold text-foreground">
                                      {traitsCount} {traitsCount === 1 ? "Tratto posseduto" : "Tratti posseduti"}
                                    </span>
                                  </div>
                                  <Badge variant="outline" className="font-mono text-xs text-indigo-500 border-indigo-500/40">
                                    Fascia 2G
                                  </Badge>
                                </div>
                                <div className="p-2 rounded-lg bg-muted/30 border border-dashed border-border/60 text-center text-[11px] text-muted-foreground flex items-center justify-center gap-1.5">
                                  <Lock className="h-3 w-3" /> I nomi esatti e i PlayStyles sono sbloccabili a 3 Gettoni.
                                </div>
                              </div>
                            );
                          }

                          // traitVis === "exact" (3G o 5G)
                          return (
                            <div className="grid grid-cols-2 gap-2.5">
                              {[
                                {
                                  label: "Tratto 1",
                                  val: selectedRookie.Trait1 || "Nessuno",
                                  isIcon: false,
                                },
                                {
                                  label: "Tratto 2",
                                  val: selectedRookie.Trait2 || "Nessuno",
                                  isIcon: false,
                                },
                                {
                                  label: "Tratto Icona 1",
                                  val: selectedRookie.IconTrait1 || "Nessuno",
                                  isIcon: true,
                                },
                                {
                                  label: "Tratto Icona 2",
                                  val: selectedRookie.IconTrait2 || "Nessuno",
                                  isIcon: true,
                                },
                              ].map((item, idx) => (
                                <div
                                  key={idx}
                                  className={`p-2.5 rounded-xl border flex flex-col justify-between ${item.isIcon
                                    ? "border-amber-500/30 bg-amber-500/5"
                                    : "border-border/70 bg-muted/20"
                                    }`}
                                >
                                  <span className="text-[10px] font-semibold uppercase text-muted-foreground flex items-center gap-1">
                                    {item.isIcon && (
                                      <Sparkles className="h-3 w-3 text-amber-500" />
                                    )}
                                    {item.label}
                                  </span>
                                  <span className="text-xs sm:text-sm font-bold text-foreground mt-1">
                                    {item.val}
                                  </span>
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  </div>

                  {/* 4. ALL 6 ATTRIBUTE DEPARTMENTS (33 INDIVIDUAL STATS) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {SCOUTING_DEPARTMENTS.map((dept) => {
                      const isUnlocked = selectedRookieTokens >= 1;
                      const rangeBadge =
                        selectedRookieTokens >= 2
                          ? "Dettaglio (Range 3)"
                          : selectedRookieTokens === 1
                            ? "Stima (Range 10)"
                            : "Bloccato (1G)";

                      return (
                        <Card
                          key={dept.key}
                          className="border border-border/80 bg-card shadow-sm overflow-hidden flex flex-col"
                        >
                          <div
                            className={`px-4 py-2.5 border-b border-border/60 flex items-center justify-between ${dept.colorClass}`}
                          >
                            <span className="text-xs font-extrabold uppercase tracking-wider">
                              {dept.title}
                            </span>
                            <Badge
                              variant="outline"
                              className="text-[10px] font-mono bg-background/80"
                            >
                              {isUnlocked ? (
                                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                                  <Unlock className="h-2.5 w-2.5" /> {rangeBadge}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-muted-foreground">
                                  <Lock className="h-2.5 w-2.5" /> {rangeBadge}
                                </span>
                              )}
                            </Badge>
                          </div>

                          <CardContent className="p-3 space-y-2 flex-1">
                            {dept.stats.map((st) => (
                              <ScoutingStatBar
                                key={String(st.code)}
                                code={String(st.code)}
                                label={st.label}
                                value={selectedRookie[st.code] as number | null}
                                tokensSpent={selectedRookieTokens}
                              />
                            ))}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  {/* 5. OVERALL PER RUOLO (Sbloccato a 5 Gettoni) */}
                  <Card className="border border-border/80 bg-card shadow-sm overflow-hidden">
                    <CardHeader className="py-3 px-4 bg-muted/30 border-b border-border/60 flex flex-row items-center justify-between space-y-0">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-emerald-500" />
                        <CardTitle className="text-xs font-extrabold uppercase tracking-wider">
                          Overall per Ruolo (Rendimento Tattico Simulatore)
                        </CardTitle>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-mono ${selectedRookieTokens >= 5
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                          : "bg-muted text-muted-foreground border-border"
                          }`}
                      >
                        {selectedRookieTokens >= 5 ? "Sbloccato (5G)" : "Richiede 5G"}
                      </Badge>
                    </CardHeader>
                    <CardContent className="p-4">
                      {selectedRookieTokens >= 5 ? (() => {
                        const roleEval = calculatePlayerRoleOveralls(selectedRookie);
                        return (
                          <div className="space-y-4">
                            {/* Ruolo Principale + Ruoli Secondari Riconosciuti */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                              <div className="p-3 rounded-xl bg-emerald-500/10 border-2 border-emerald-500/40 flex items-center justify-between">
                                <div>
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                                    Ruolo Principale
                                  </span>
                                  <span className="text-sm font-extrabold">{roleEval.primaryRole.role}</span>
                                </div>
                                <span className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                                  {roleEval.primaryRole.ovr}
                                </span>
                              </div>

                              {roleEval.secondaryRoles.length > 0 ? (
                                roleEval.secondaryRoles.map((sec) => (
                                  <div
                                    key={sec.role}
                                    className="p-3 rounded-xl bg-card border border-border/80 flex items-center justify-between"
                                  >
                                    <div>
                                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                                        Ruolo Secondario
                                      </span>
                                      <span className="text-sm font-extrabold">{sec.role}</span>
                                    </div>
                                    <span
                                      className={`text-xl font-black font-mono ${getValueColor(
                                        sec.ovr
                                      )}`}
                                    >
                                      {sec.ovr}
                                    </span>
                                  </div>
                                ))
                              ) : (
                                <div className="p-3 rounded-xl bg-muted/20 border border-dashed border-border/70 flex items-center justify-center text-xs text-muted-foreground col-span-2">
                                  Nessuna posizione secondaria specificata nei dati master.
                                </div>
                              )}
                            </div>

                            {/* Griglia completa di adattabilità sul campo */}
                            <div>
                              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                                Adattabilità &amp; OVR su tutte le posizioni in campo:
                              </span>
                              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-1.5">
                                {roleEval.allPitchRoles.map((item) => (
                                  <div
                                    key={item.role}
                                    className={`p-2 rounded-lg border text-center transition-all ${item.isPrimary
                                      ? "bg-emerald-500/20 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-extrabold ring-1 ring-emerald-500/40"
                                      : item.isSecondary
                                        ? "bg-sky-500/15 border-sky-500/40 text-foreground font-bold"
                                        : "bg-muted/30 border-border/60 text-muted-foreground"
                                      }`}
                                  >
                                    <div className="text-[10px] font-mono uppercase">{item.role}</div>
                                    <div
                                      className={`text-xs sm:text-sm font-black font-mono mt-0.5 ${item.isPrimary
                                        ? "text-emerald-600 dark:text-emerald-400"
                                        : getValueColor(item.ovr)
                                        }`}
                                    >
                                      {item.ovr}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })() : (
                        <div className="p-6 rounded-xl bg-muted/20 border border-dashed border-border text-center space-y-2">
                          <Lock className="h-6 w-6 text-muted-foreground mx-auto opacity-60" />
                          <div className="text-xs font-bold text-foreground">
                            Overall per Ruolo non disponibile
                          </div>
                          <p className="text-[11px] text-muted-foreground max-w-md mx-auto">
                            Spendendo 5 gettoni scouting su questo rookie sbloccherai l&apos;Overall calcolato per ciascun ruolo in campo (posizioni secondarie e mappa tattica completa).
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card className="p-12 text-center text-muted-foreground">
                  Seleziona un rookie dalla colonna di sinistra per visualizzare la scheda di scouting.
                </Card>
              )}
            </div>
          </TabsContent>

          {/* TAB 2: RECAP OF ALL SCOUTED ROOKIES */}
          <TabsContent value="recap" className="m-0 space-y-4">
            <Card className="border border-border/80 bg-card shadow-sm">
              <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mr-1">
                    Filtra per Fascia:
                  </span>
                  {[
                    { id: "ALL", label: "Tutti gli Scoutati" },
                    { id: "5", label: "5 Gettoni (100%)" },
                    { id: "3", label: "3 Gettoni" },
                    { id: "2", label: "2 Gettoni" },
                    { id: "1", label: "1 Gettone" },
                  ].map((f) => (
                    <Button
                      key={f.id}
                      size="sm"
                      variant={recapTierFilter === f.id ? "default" : "outline"}
                      onClick={() => setRecapTierFilter(f.id)}
                      className={`h-8 text-xs font-semibold ${recapTierFilter === f.id
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : ""
                        }`}
                    >
                      {f.label}
                    </Button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-1">
                  {ROLE_GROUPS.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setRecapRoleFilter(g.id)}
                      className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors ${recapRoleFilter === g.id
                        ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40"
                        : "bg-muted/60 text-muted-foreground hover:text-foreground"
                        }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {scoutedRookiesList.length === 0 ? (
              <Card className="p-12 text-center space-y-3 border border-border/80 bg-card">
                <Compass className="h-10 w-10 text-muted-foreground mx-auto opacity-50" />
                <div className="text-base font-bold">
                  Nessun rookie scoutato trovato
                </div>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Non hai ancora speso gettoni scouting (o nessun rookie corrisponde ai filtri selezionati). Vai nella scheda &ldquo;Scheda Singolo Rookie&rdquo; per assegnare i tuoi gettoni!
                </p>
                <Button
                  size="sm"
                  onClick={() => setActiveTab("single")}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Vai alla Selezione Rookie
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {scoutedRookiesList.map((r) => {
                  const rId = Number(r.ID);
                  const tokens = scoutingMap[rId]?.tokens_spent ?? 0;
                  const ovrInfo = getOvrDisplayByTokens(r.OVR, tokens, r.Stelle);
                  const topStats = getTopUnlockedAttributes(r, tokens);
                  const nextTiers = SCOUTING_TIERS.filter(
                    (t) => t.tokens > tokens
                  );

                  return (
                    <Card
                      key={r.ID}
                      className="border border-border/80 bg-card shadow-md hover:shadow-lg transition-all overflow-hidden flex flex-col justify-between"
                    >
                      <div>
                        {/* Card Header */}
                        <div className="p-4 bg-muted/30 border-b border-border/60 flex items-start justify-between gap-3">
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className={`text-[10px] font-extrabold px-2 py-0 ${getRoleColor(
                                  r.Posiz
                                )}`}
                              >
                                {r.Posiz}
                              </Badge>
                              <h3 className="font-extrabold text-base truncate">
                                {r.Nome} {r.Cognome}
                              </h3>
                              <button
                                type="button"
                                onClick={() => handleToggleFavorite(rId)}
                                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-amber-500 transition-colors"
                                title={favoriteRookieIds.has(rId) ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti"}
                              >
                                <Star className={`h-4 w-4 ${favoriteRookieIds.has(rId) ? "fill-amber-500 text-amber-500" : "text-muted-foreground/30 hover:text-amber-500"}`} />
                              </button>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                              <span>{r.Età} anni</span>
                              <span>•</span>
                              <span>{r.Altezza} cm</span>
                              <span>•</span>
                              <span>{r.Peso} kg</span>
                              <span>•</span>
                              <span>Piede {r.Piede}</span>
                            </div>
                            <div className="pt-0.5 flex items-center gap-2">
                              {renderStars(r.Stelle, "h-3.5 w-3.5")}
                              {r.Squadra && (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] font-mono"
                                >
                                  Draft: {r.Squadra}
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            <Badge
                              variant="outline"
                              className={`font-mono font-extrabold text-xs ${getTierBadgeStyle(
                                tokens
                              )}`}
                            >
                              {tokens} Getton{tokens === 1 ? "e" : "i"}
                            </Badge>
                            <div className="px-2.5 py-1 rounded-lg bg-background border border-border/80 text-center">
                              <span className="text-[9px] uppercase font-bold text-muted-foreground block leading-none">
                                {ovrInfo.isExact ? "OVR Esatto" : "Valutazione"}
                              </span>
                              <span className="font-mono font-black text-sm">
                                {ovrInfo.label}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Unlocked Role/Traits summary */}
                        <CardContent className="p-4 space-y-3">
                          <div className="flex flex-wrap gap-1.5 text-[11px]">
                            {tokens >= 3 && (
                              <>
                                <Badge variant="secondary" className="font-medium">
                                  Role 1: {r.Role1 || "Standard"}
                                </Badge>
                                <Badge variant="secondary" className="font-medium">
                                  P. Debole: {r.PiedeDebole || "⭐⭐⭐"}
                                </Badge>
                                <Badge variant="secondary" className="font-medium">
                                  Skill: {r.MABI || "⭐⭐⭐"}
                                </Badge>
                              </>
                            )}
                            {tokens >= 2 && (
                              <Badge
                                variant="outline"
                                className="bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30"
                              >
                                Emotion: {getEmotionLabel(r.Emotion)}
                              </Badge>
                            )}
                            {tokens === 2 && (
                              <Badge
                                variant="outline"
                                className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30"
                              >
                                {getRookieTraitsCount(r)} Tratti posseduti
                              </Badge>
                            )}
                            {tokens >= 3 && r.Trait1 && (
                              <Badge
                                variant="outline"
                                className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30"
                              >
                                {r.Trait1}
                              </Badge>
                            )}
                            {tokens >= 3 && r.IconTrait1 && (
                              <Badge
                                variant="outline"
                                className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                              >
                                ★ {r.IconTrait1}
                              </Badge>
                            )}
                          </div>

                          {/* Top unlocked attributes */}
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                              Migliori Attributi Rivelati:
                            </span>
                            <div className="grid grid-cols-3 gap-1.5">
                              {topStats.map((st) => (
                                <div
                                  key={st.code}
                                  className="px-2 py-1.5 rounded-lg bg-muted/40 border border-border/60 flex items-center justify-between"
                                >
                                  <span className="font-mono text-[10px] font-bold text-muted-foreground">
                                    {st.code}
                                  </span>
                                  <span
                                    className={`font-mono text-xs font-black ${getValueColor(
                                      st.midpoint
                                    )}`}
                                  >
                                    {st.rangeLabel}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </div>

                      {/* Card Footer: Open Full Inspector OR Quick Upgrade */}
                      <div className="p-3 bg-muted/20 border-t border-border/60 flex flex-wrap items-center justify-between gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedRookieId(rId);
                            setActiveTab("single");
                          }}
                          className="h-8 text-xs font-bold gap-1"
                        >
                          Scheda Completa
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </Button>

                        {nextTiers.length > 0 && (
                          <div className="flex items-center gap-1">
                            {nextTiers.map((nt) => {
                              const diff = nt.tokens - tokens;
                              return (
                                <Button
                                  key={nt.tokens}
                                  size="sm"
                                  disabled={remainingTokens < diff || saving}
                                  onClick={() => handleUpgradeScouting(r, nt.tokens)}
                                  className="h-7 px-2 text-[11px] font-mono bg-emerald-600 hover:bg-emerald-700 text-white"
                                  title={`Passa a ${nt.tokens} gettoni (+${diff}G dal budget)`}
                                >
                                  →{nt.tokens}G (+{diff})
                                </Button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* TAB 3: GRADUATORIA DRAFT & AUTOPICK (PUNTO 7) */}
          <TabsContent value="autopick" className="m-0">
            <ScoutingAutopickTab
              teamId={activeTeamId}
              teamFullName={
                isAdmin
                  ? availableTeams?.find((t) => t.team_id === activeTeamId)?.name
                  : user?.teamFullName
              }
              allRookies={rookies}
              favoriteRookieIds={favoriteRookieIds}
              scoutingTokensByRookie={useMemo(() => {
                const map: Record<number, number> = {};
                Object.entries(scoutingMap).forEach(([id, rec]) => {
                  map[Number(id)] = rec.tokens_spent || 0;
                });
                return map;
              }, [scoutingMap])}
              onInspectRookie={(rookieId) => {
                setSelectedRookieId(rookieId);
                handleTabChange("single");
              }}
              onFavoritesUpdated={loadFavorites}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Scouting;

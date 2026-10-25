import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sparkles,
  Trophy,
  Star,
  ListOrdered,
  Bot,
  Search,
  CheckCircle2,
  Clock,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Settings2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  ShieldCheck,
  Lock,
  UserPlus,
  Layers,
  EyeOff,
  Eye,
  Repeat,
  LayoutGrid,
  Compass,
  AlertTriangle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/supabaseClient";
import { DRAFT_BOARD_TABLE, ROOKIE_TABLE, ROOKIE_SCOUTING_TABLE } from "@/constants/App";
import { useAuth } from "@/context/AuthContext";
import { getTeams } from "@/hooks/use-teams";
import { getStandings } from "@/hooks/use-standings";
import { getPlayerImage, getRoleColor, getValueColor } from "@/utils/functions";
import { Player } from "@/types/player";
import PlayerDetails from "@/components/player/playerDetails";
import {
  SCOUTING_DEPARTMENTS,
  isDepartmentUnlocked,
  getOvrDisplayByTokens,
  getTierBadgeStyle,
  getStatDisplayByTokens,
  getRookieTraitsCount,
  isWeakFootUnlocked,
  isSkillMovesUnlocked,
  isRole1Unlocked,
  isEmotionUnlocked,
} from "@/utils/scoutingConfig";
import { getEmotionLabel } from "@/constants/accessories";
import { renderStars } from "@/components/scouting/StarRating";
import { toast } from "sonner";
import {
  DraftPickAnnouncementModal,
  DraftPickAnnouncementData,
} from "@/components/draft/DraftPickAnnouncementModal";
import {
  fetchTeamFavorites,
  toggleTeamFavorite,
  fetchAutopickSetting,
  fetchAllAutopickSettings,
  executeAutopick,
} from "@/services/draftWishlistService";

export interface DraftPickRow {
  pick_overall: number;
  round: number;
  pick_in_round: number;
  team_id: string;
  original_team_id: string;
  rookie_id: number | null;
  player_id?: number | null;
  player_type?: "rookie" | "free_agent" | null;
  picked_at: string | null;
  picked_by: string | null;
  rookie?: Pick<Player, "ID" | "Nome" | "Cognome" | "Posiz" | "Squadra"> | null;
  player?: Pick<Player, "ID" | "Nome" | "Cognome" | "Posiz" | "Squadra" | "OVR"> | null;
}

export interface DraftPoolItem {
  id: number;
  type: "rookie" | "free_agent";
  player: Player;
  isFavorite: boolean;
}

type ViewMode = "board" | "r1" | "r2" | "r3" | "r4" | "r5";

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

const Draft = () => {
  const { user, isAdmin, effectiveTeam, adminSelectedTeam, setAdminSelectedTeam } = useAuth();
  const { teams } = getTeams();
  const { standings } = getStandings();

  const [picks, setPicks] = useState<DraftPickRow[]>([]);
  const [rookies, setRookies] = useState<Player[]>([]);
  const [scoutingByRookie, setScoutingByRookie] = useState<Record<number, number>>({});
  const [inspectedRookie, setInspectedRookie] = useState<Player | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Default view is the unified 60-square board ("board"), or single round ("r1".."r5")
  const [viewMode, setViewMode] = useState<ViewMode>("board");
  const [teamFilter, setTeamFilter] = useState<string>("ALL");

  // Right panel player & free agent selection state
  const [freeAgents, setFreeAgents] = useState<Player[]>([]);
  const [poolTypeFilter, setPoolTypeFilter] = useState<"ALL" | "ROOKIE" | "FREE_AGENT">("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [selectedPlayerItem, setSelectedPlayerItem] = useState<{ id: number; type: "rookie" | "free_agent"; player: Player } | null>(null);
  const [inspectedFreeAgent, setInspectedFreeAgent] = useState<Player | null>(null);
  const [teamGoalkeepersMap, setTeamGoalkeepersMap] = useState<Record<string, number>>({});

  // Apertura modale dettagli per calciatore svincolato (con caricamento lazy attributi completi se necessario)
  const handleOpenFreeAgentDetails = useCallback(async (player: Player) => {
    if (!player) return;
    if (player.VELO === undefined && player.TUFP === undefined && player.ID) {
      const { data } = await supabase.from("an_player").select("*").eq("ID", player.ID).single();
      if (data) {
        setInspectedFreeAgent(data as Player);
        return;
      }
    }
    setInspectedFreeAgent(player);
  }, []);

  // Watchlist & Autopick State (Punti 6, 7 e 40)
  const [favoriteRookieIds, setFavoriteRookieIds] = useState<Set<number>>(new Set());
  const [favoriteFreeAgentIds, setFavoriteFreeAgentIds] = useState<Set<number>>(new Set());
  const [favoritesOnly, setFavoritesOnly] = useState<boolean>(false);
  const [isUserAutopickEnabled, setIsUserAutopickEnabled] = useState<boolean>(false);
  const [allAutopickSettings, setAllAutopickSettings] = useState<Record<string, boolean>>({});
  const [isAutopicking, setIsAutopicking] = useState<boolean>(false);
  const [announcementPick, setAnnouncementPick] = useState<DraftPickAnnouncementData | null>(null);
  const lastAnnouncedPickKeyRef = useRef<string>("");

  // Admin dialog state
  const [adminModalOpen, setAdminModalOpen] = useState<boolean>(false);
  const [adminTab, setAdminTab] = useState<"order" | "trades">("trades");
  const [customRound1Order, setCustomRound1Order] = useState<string[]>([]);
  const [tradeFilterRound, setTradeFilterRound] = useState<string>("1");
  const [adminSaving, setAdminSaving] = useState<boolean>(false);

  // Map of TEAM_ID -> Team object
  const teamMap = useMemo(() => {
    const map = new Map<string, (typeof teams)[number]>();
    for (const t of teams) {
      map.set(t.TEAM_ID, t);
    }
    return map;
  }, [teams]);

  // Compute inverse standings order for the 12 active teams
  const inverseStandingsOrder = useMemo(() => {
    if (teams.length === 0) return [];
    const activeIds = new Set(teams.map((t) => t.TEAM_ID));

    const rankedActiveIds: string[] = [];
    for (const s of standings) {
      const rawId =
        (s as unknown as { team?: { TEAM_ID?: string } | string }).team &&
        typeof (s as unknown as { team?: { TEAM_ID?: string } }).team === "object"
          ? (s as unknown as { team: { TEAM_ID: string } }).team.TEAM_ID
          : String((s as unknown as { team?: string }).team || "");
      const mappedId = rawId === "ASK" ? "SKA" : rawId;
      if (activeIds.has(mappedId) && !rankedActiveIds.includes(mappedId)) {
        rankedActiveIds.push(mappedId);
      }
    }

    const unrankedIds = teams
      .map((t) => t.TEAM_ID)
      .filter((id) => !rankedActiveIds.includes(id))
      .sort();

    return [...unrankedIds, ...rankedActiveIds.reverse()];
  }, [teams, standings]);

  const fetchDraftData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [boardRes, rookiesRes, freeAgentsRes, gkRes] = await Promise.all([
        supabase
          .from(DRAFT_BOARD_TABLE)
          .select("*, rookie:an_rookie(ID, Nome, Cognome, Posiz, Squadra), player:an_player(ID, Nome, Cognome, Posiz, Squadra, OVR)")
          .order("pick_overall", { ascending: true }),
        supabase
          .from(ROOKIE_TABLE)
          .select("*")
          .order("Cognome", { ascending: true }),
        supabase
          .from("an_player")
          .select("*")
          .is("Squadra", null)
          .order("OVR", { ascending: false }),
        supabase
          .from("an_player")
          .select("Squadra")
          .eq("Posiz", "POR")
          .not("Squadra", "is", null),
      ]);

      if (boardRes.error) throw boardRes.error;
      if (rookiesRes.error) throw rookiesRes.error;
      if (freeAgentsRes.error) throw freeAgentsRes.error;

      let boardRows = (boardRes.data ?? []) as DraftPickRow[];
      if (boardRows.length < 60) {
        // Ripristino automatico e garantito delle 60 caselle della draft board
        await supabase.rpc("rpc_ensure_draft_board");
        const recheck = await supabase
          .from(DRAFT_BOARD_TABLE)
          .select("*, rookie:an_rookie(ID, Nome, Cognome, Posiz, Squadra), player:an_player(ID, Nome, Cognome, Posiz, Squadra, OVR)")
          .order("pick_overall", { ascending: true });
        if (!recheck.error && recheck.data) {
          boardRows = recheck.data as DraftPickRow[];
        }
      }
      setPicks(boardRows);
      const rkList = ((rookiesRes.data ?? []) as Player[]).sort((a, b) => (a.Cognome || "").localeCompare(b.Cognome || ""));
      setRookies(rkList);
      setFreeAgents((freeAgentsRes.data ?? []) as Player[]);

      const gkCounts: Record<string, number> = {};
      ((gkRes.data || []) as { Squadra: string }[]).forEach((r) => {
        if (r.Squadra) gkCounts[r.Squadra] = (gkCounts[r.Squadra] || 0) + 1;
      });
      setTeamGoalkeepersMap(gkCounts);

      const r1 = boardRows
        .filter((p) => p.round === 1)
        .sort((a, b) => a.pick_in_round - b.pick_in_round)
        .map((p) => p.original_team_id);
      if (r1.length === 12) {
        setCustomRound1Order(r1);
      }
    } catch (err) {
      console.error("Errore caricamento Draft:", err);
      toast.error("Errore nel caricamento dei dati del Draft");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDraftData();
  }, [fetchDraftData]);

  // Current active pick ("On the Clock") = first pick with rookie_id === null and player_id === null
  const currentOnTheClockPick = useMemo(() => {
    return picks.find((p) => p.rookie_id === null && (!p.player_id || p.player_id === null)) ?? null;
  }, [picks]);

  // Effective team for the right-hand user panel
  const activeUserTeamId = useMemo(() => {
    if (!user) return null;
    return effectiveTeam || null;
  }, [user, effectiveTeam]);

  const activeUserTeam = useMemo(() => {
    if (!activeUserTeamId) return null;
    return teamMap.get(activeUserTeamId) ?? null;
  }, [activeUserTeamId, teamMap]);

  useEffect(() => {
    if (!activeUserTeamId) {
      setScoutingByRookie({});
      return;
    }
    supabase
      .from(ROOKIE_SCOUTING_TABLE)
      .select("rookie_id, tokens_spent")
      .eq("team_id", activeUserTeamId)
      .then(({ data }) => {
        const map: Record<number, number> = {};
        for (const row of data ?? []) {
          map[Number(row.rookie_id)] = Number(row.tokens_spent) || 0;
        }
        setScoutingByRookie(map);
      });
  }, [activeUserTeamId]);

  // Caricamento preferiti squadra (⭐ Punto 6 e 40)
  const loadFavorites = useCallback(async () => {
    if (!activeUserTeamId) {
      setFavoriteRookieIds(new Set());
      setFavoriteFreeAgentIds(new Set());
      return;
    }
    try {
      const [favRookies, favPlayers] = await Promise.all([
        fetchTeamFavorites(activeUserTeamId, "rookie"),
        fetchTeamFavorites(activeUserTeamId, "player"),
      ]);
      setFavoriteRookieIds(favRookies);
      setFavoriteFreeAgentIds(favPlayers);
    } catch (err) {
      console.error("Errore caricamento preferiti draft:", err);
    }
  }, [activeUserTeamId]);

  useEffect(() => {
    if (activeUserTeamId) {
      loadFavorites();
    } else {
      setFavoriteRookieIds(new Set());
      setFavoriteFreeAgentIds(new Set());
    }
  }, [activeUserTeamId, loadFavorites]);

  // Caricamento impostazioni autopick squadra (Punto 7)
  const loadAutopickSettings = useCallback(async () => {
    try {
      const all = await fetchAllAutopickSettings();
      setAllAutopickSettings(all);
      if (activeUserTeamId) {
        setIsUserAutopickEnabled(Boolean(all[activeUserTeamId]));
      }
    } catch (err) {
      console.error("Errore caricamento autopick settings:", err);
    }
  }, [activeUserTeamId]);

  useEffect(() => {
    loadAutopickSettings();
  }, [loadAutopickSettings]);

  // Helper per mostrare il popup in mezzo allo schermo della pick effettuata
  const triggerPickAnnouncement = useCallback(
    async (pickOverall: number, round: number, teamId: string, rookieId: number) => {
      const key = `${pickOverall}-${rookieId}`;
      if (lastAnnouncedPickKeyRef.current === key) return;
      lastAnnouncedPickKeyRef.current = key;

      let rookieData: DraftPickAnnouncementData["rookie"] | null = null;

      // 1. Cerca in an_player per avere i dati decifrati ufficiali (OVR, Altezza, Peso)
      try {
        const { data: pData } = await supabase
          .from("an_player")
          .select("ID, Nome, Cognome, Posiz, OVR, Altezza, Peso")
          .eq("ID", rookieId)
          .maybeSingle();

        if (pData) {
          rookieData = {
            ID: Number(pData.ID),
            Nome: pData.Nome || "",
            Cognome: pData.Cognome || "",
            Posiz: pData.Posiz || "",
            OVR: Number(pData.OVR) || 0,
            Altezza: pData.Altezza ? Number(pData.Altezza) : null,
            Peso: pData.Peso ? Number(pData.Peso) : null,
          };
        }
      } catch (err) {
        console.error("Errore fetch giocatore decifrato per annuncio pick:", err);
      }

      // 2. Fallback su an_rookie o stato rookies se la query su an_player non ha ancora sincronizzato
      if (!rookieData) {
        const local = rookies.find((r) => Number(r.ID) === Number(rookieId));
        if (local) {
          rookieData = {
            ID: Number(local.ID),
            Nome: local.Nome || "",
            Cognome: local.Cognome || "",
            Posiz: local.Posiz || "",
            OVR: Number(local.OVR) || 0,
            Altezza: local.Altezza ? Number(local.Altezza) : null,
            Peso: local.Peso ? Number(local.Peso) : null,
          };
        } else {
          try {
            const { data: rkRow } = await supabase
              .from(ROOKIE_TABLE)
              .select("ID, Nome, Cognome, Posiz, OVR, Altezza, Peso")
              .eq("ID", rookieId)
              .maybeSingle();
            if (rkRow) {
              rookieData = {
                ID: Number(rkRow.ID),
                Nome: rkRow.Nome || "",
                Cognome: rkRow.Cognome || "",
                Posiz: rkRow.Posiz || "",
                OVR: Number(rkRow.OVR) || 0,
                Altezza: rkRow.Altezza ? Number(rkRow.Altezza) : null,
                Peso: rkRow.Peso ? Number(rkRow.Peso) : null,
              };
            }
          } catch (err) {
            console.error("Errore fallback an_rookie per annuncio pick:", err);
          }
        }
      }

      if (rookieData) {
        const teamObj = teamMap.get(teamId);
        setAnnouncementPick({
          pickOverall,
          round,
          teamId,
          teamAbbr: teamObj?.NAME_ABBR || teamObj?.TEAM_ID || teamId,
          teamName: teamObj?.NAME || teamId,
          rookie: rookieData,
        });
      }
    },
    [rookies, teamMap]
  );

  // Supabase Realtime: aggiornamento automatico della Draft Board per tutti gli utenti connessi
  useEffect(() => {
    const channel = supabase
      .channel("lcsim-draft-board-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: DRAFT_BOARD_TABLE },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            const newRow = payload.new as DraftPickRow;
            const oldRow = payload.old as Partial<DraftPickRow> | undefined;

            const newPid = newRow?.player_id || newRow?.rookie_id;
            const oldPid = oldRow?.player_id || oldRow?.rookie_id;
            if (newPid && (!oldPid || oldPid !== newPid)) {
              triggerPickAnnouncement(
                newRow.pick_overall,
                newRow.round,
                newRow.team_id,
                Number(newPid)
              );
            }
          }

          // Aggiorna istantaneamente la draft board e liste collegate per tutti i client
          fetchDraftData(true);
          loadFavorites();
          loadAutopickSettings();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: ROOKIE_TABLE },
        () => {
          fetchDraftData(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchDraftData, loadFavorites, loadAutopickSettings, triggerPickAnnouncement]);

  // Toggle preferiti (⭐) sia per Rookie sia per Svincolati
  const handleToggleFavorite = async (id: number, type: "rookie" | "free_agent") => {
    if (!activeUserTeamId) {
      toast.error("Accedi o seleziona una squadra per salvare i preferiti.");
      return;
    }

    const playerType = type === "free_agent" ? "player" : "rookie";

    if (type === "free_agent") {
      setFavoriteFreeAgentIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    } else {
      setFavoriteRookieIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    }

    const res = await toggleTeamFavorite(activeUserTeamId, id, playerType);
    if (res.error) {
      toast.error("Errore salvataggio preferito");
      loadFavorites();
    } else {
      toast.success(
        res.isFavorite
          ? `${type === "free_agent" ? "Calciatore" : "Rookie"} aggiunto ai preferiti (⭐)!`
          : `${type === "free_agent" ? "Calciatore" : "Rookie"} rimosso dai preferiti`
      );
    }
  };

  // Esecuzione Autopick (Punto 7)
  const handleTriggerAutopick = async (targetPick?: DraftPickRow | null) => {
    const pick = targetPick || currentOnTheClockPick;
    if (!user) return;
    if (!pick || pick.rookie_id !== null || (pick.player_id !== undefined && pick.player_id !== null)) {
      toast.error("Nessuna scelta attiva da assegnare con l'autopick.");
      return;
    }

    setIsAutopicking(true);
    try {
      const res = await executeAutopick({
        pickOverall: pick.pick_overall,
        pickingTeamId: pick.team_id,
        executedBy: user.username,
      });

      if (!res.success || !res.rookie) {
        toast.error(res.error || "Errore durante l'esecuzione dell'autopick");
        return;
      }

      // Notifica visuale gestita dalla card popup centrale al posto dei toast

      await fetchDraftData(true);
      await loadFavorites();
      await loadAutopickSettings();
      await triggerPickAnnouncement(
        pick.pick_overall,
        pick.round,
        pick.team_id,
        Number(res.rookie.ID)
      );
    } catch (err: any) {
      console.error("Errore autopick:", err);
      toast.error("Errore imprevisto durante l'autopick");
    } finally {
      setIsAutopicking(false);
    }
  };

  // Check if the logged-in user (or Admin) can currently confirm the pick
  const isUserTeamOnTheClock = useMemo(() => {
    if (!user || !currentOnTheClockPick) return false;
    if (isAdmin) return true;
    return currentOnTheClockPick.team_id === user.team;
  }, [user, isAdmin, currentOnTheClockPick]);

  // Pick that will be filled when confirming
  const targetPickForConfirmation = useMemo(() => {
    if (!currentOnTheClockPick) return null;
    if (isAdmin) return currentOnTheClockPick;
    if (user && currentOnTheClockPick.team_id === user.team) return currentOnTheClockPick;
    return null;
  }, [currentOnTheClockPick, isAdmin, user]);

  // Squadra attiva al turno di scelta
  const activePickingTeamId = targetPickForConfirmation?.team_id || currentOnTheClockPick?.team_id || null;

  // Scelte ancora da effettuare per la squadra al turno (inclusa la corrente)
  const activeTeamRemainingPicks = useMemo(() => {
    if (!activePickingTeamId) return 0;
    return picks.filter(
      (p) => p.team_id === activePickingTeamId && p.rookie_id === null && (!p.player_id || p.player_id === null)
    ).length;
  }, [picks, activePickingTeamId]);

  // Portieri attualmente sotto contratto per la franchigia
  const activeTeamGkCount = useMemo(() => {
    if (!activePickingTeamId) return 0;
    return teamGoalkeepersMap[activePickingTeamId] || 0;
  }, [teamGoalkeepersMap, activePickingTeamId]);

  // Punto #42: Obbligo Portiere se all'ultima pick rimasta possiede 1 solo portiere a roster
  const isGkDraftMandatory = useMemo(() => {
    return activeTeamRemainingPicks === 1 && activeTeamGkCount === 1;
  }, [activeTeamRemainingPicks, activeTeamGkCount]);

  // Punto #43: Tetto massimo 3 portieri in squadra
  const isGkDraftForbidden = useMemo(() => {
    return activeTeamGkCount >= 3;
  }, [activeTeamGkCount]);

  // All picks owned by activeUserTeamId (for the right-hand recap)
  const userTeamPicks = useMemo(() => {
    if (!activeUserTeamId) return [];
    return picks.filter((p) => p.team_id === activeUserTeamId);
  }, [picks, activeUserTeamId]);

  const nextUserPendingPick = useMemo(() => {
    return userTeamPicks.find((p) => p.rookie_id === null && (!p.player_id || p.player_id === null)) ?? null;
  }, [userTeamPicks]);

  // Drafted player IDs set (both rookies and free agents)
  const draftedPlayerIds = useMemo(() => {
    const set = new Set<number>();
    for (const p of picks) {
      if (p.rookie_id !== null) set.add(Number(p.rookie_id));
      if (p.player_id !== null && p.player_id !== undefined) set.add(Number(p.player_id));
    }
    return set;
  }, [picks]);

  // Conteggi per le pillole del tipo
  const undraftedRookiesCount = useMemo(() => {
    return rookies.filter((r) => !draftedPlayerIds.has(Number(r.ID)) && !r.Squadra).length;
  }, [rookies, draftedPlayerIds]);

  const undraftedFreeAgentsCount = useMemo(() => {
    return freeAgents.filter((fa) => !draftedPlayerIds.has(Number(fa.ID)) && !fa.Squadra).length;
  }, [freeAgents, draftedPlayerIds]);

  // Available unified draft pool (Rookies + Calciatori Svincolati)
  const availableDraftPool = useMemo(() => {
    const items: DraftPoolItem[] = [];

    // 1. Rookie disponibili
    if (poolTypeFilter === "ALL" || poolTypeFilter === "ROOKIE") {
      for (const rk of rookies) {
        const id = Number(rk.ID);
        if (draftedPlayerIds.has(id) || rk.Squadra) continue;
        // Punto #42: se c'è l'obbligo portiere, escludi i giocatori di movimento
        if (isGkDraftMandatory && rk.Posiz !== "POR") continue;
        const isFav = favoriteRookieIds.has(id);
        if (favoritesOnly && !isFav) continue;
        if (roleFilter !== "ALL") {
          const group = ROLE_GROUPS.find((g) => g.id === roleFilter);
          if (group && group.roles.length > 0 && !group.roles.includes(rk.Posiz)) continue;
        }
        if (searchQuery.trim() !== "") {
          const q = searchQuery.toLowerCase().trim();
          const full = `${rk.Nome || ""} ${rk.Cognome || ""} ${rk.Posiz || ""}`.toLowerCase();
          if (!full.includes(q)) continue;
        }
        items.push({ id, type: "rookie", player: rk, isFavorite: isFav });
      }
    }

    // 2. Calciatori Svincolati disponibili
    if (poolTypeFilter === "ALL" || poolTypeFilter === "FREE_AGENT") {
      for (const fa of freeAgents) {
        const id = Number(fa.ID);
        if (draftedPlayerIds.has(id) || fa.Squadra) continue;
        // Punto #42: se c'è l'obbligo portiere, escludi i giocatori di movimento
        if (isGkDraftMandatory && fa.Posiz !== "POR") continue;
        const isFav = favoriteFreeAgentIds.has(id);
        if (favoritesOnly && !isFav) continue;
        if (roleFilter !== "ALL") {
          const group = ROLE_GROUPS.find((g) => g.id === roleFilter);
          if (group && group.roles.length > 0 && !group.roles.includes(fa.Posiz)) continue;
        }
        if (searchQuery.trim() !== "") {
          const q = searchQuery.toLowerCase().trim();
          const full = `${fa.Nome || ""} ${fa.Cognome || ""} ${fa.Posiz || ""}`.toLowerCase();
          if (!full.includes(q)) continue;
        }
        items.push({ id, type: "free_agent", player: fa, isFavorite: isFav });
      }
    }

    return items.sort((a, b) => {
      const rp = (ROLE_PRIORITY[a.player.Posiz] ?? 99) - (ROLE_PRIORITY[b.player.Posiz] ?? 99);
      if (rp !== 0) return rp;
      const ovrA = Number(a.player.OVR) || 0;
      const ovrB = Number(b.player.OVR) || 0;
      if (ovrB !== ovrA) return ovrB - ovrA;
      return (a.player.Cognome || "").localeCompare(b.player.Cognome || "");
    });
  }, [
    rookies,
    freeAgents,
    draftedPlayerIds,
    poolTypeFilter,
    roleFilter,
    favoritesOnly,
    favoriteRookieIds,
    favoriteFreeAgentIds,
    searchQuery,
    isGkDraftMandatory,
  ]);

  // Backward-compat alias for rookie count
  const availableRookies = useMemo(() => {
    return availableDraftPool.filter((i) => i.type === "rookie").map((i) => i.player);
  }, [availableDraftPool]);

  // Confirm Draft Pick handler (supporta sia Rookie sia Svincolati)
  const handleConfirmPick = async () => {
    if (!user) return;
    if (!targetPickForConfirmation) {
      toast.error("Non è ancora il turno della tua squadra!");
      return;
    }
    if (!selectedPlayerItem) {
      toast.error("Seleziona prima un calciatore o un rookie dalla lista!");
      return;
    }

    if (isGkDraftMandatory && selectedPlayerItem.player.Posiz !== "POR") {
      toast.error("Obbligo Portiere: hai un solo portiere a roster ed è la tua ultima scelta. Devi selezionare un portiere (POR).");
      return;
    }

    if (isGkDraftForbidden && selectedPlayerItem.player.Posiz === "POR") {
      toast.error("Limite massimo portieri: la squadra possiede già 3 portieri in rosa. Non è consentito selezionarne altri.");
      return;
    }

    setSubmitting(true);
    try {
      const pickNo = targetPickForConfirmation.pick_overall;
      const pickingTeamId = targetPickForConfirmation.team_id;
      const pId = Number(selectedPlayerItem.id);
      const isFa = selectedPlayerItem.type === "free_agent";

      if (isFa) {
        // Scelta calciatore svincolato
        const { error: rpcErr } = await supabase.rpc("rpc_draft_free_agent", {
          p_pick_overall: pickNo,
          p_player_id: pId,
          p_team_id: pickingTeamId,
          p_picked_by: user.username || user.name || "Manager",
        });
        if (rpcErr) throw rpcErr;
      } else {
        // Scelta rookie con decifratura vault
        const { error: rpcErr } = await supabase.rpc("rpc_draft_rookie", {
          p_pick_overall: pickNo,
          p_rookie_id: pId,
          p_team_id: pickingTeamId,
          p_picked_by: user.username || user.name || "Manager",
        });
        if (rpcErr) throw rpcErr;
      }

      setSelectedPlayerItem(null);
      await fetchDraftData(true);
      await triggerPickAnnouncement(
        pickNo,
        targetPickForConfirmation.round,
        pickingTeamId,
        pId
      );
    } catch (err: any) {
      console.error("Errore scelta draft:", err);
      toast.error(err.message || "Errore durante la scelta al Draft");
    } finally {
      setSubmitting(false);
    }
  };

  // Admin: Undo a specific pick (supporta sia Rookie sia Svincolati)
  const handleAdminUndoPick = async (pick: DraftPickRow) => {
    const targetId = Number(pick.player_id || pick.rookie_id);
    if (!isAdmin || !targetId) return;
    setSubmitting(true);
    try {
      // Undo atomico: resetta slot e gestisce svincolo su an_player o ripristino an_rookie
      const { error: rpcErr } = await supabase.rpc("rpc_undo_draft_rookie", {
        p_pick_overall: pick.pick_overall,
        p_rookie_id: targetId,
      });
      if (rpcErr) throw rpcErr;

      toast.success(`Pick #${pick.pick_overall} annullata. Il giocatore è tornato disponibile.`);
      await fetchDraftData(true);
    } catch (err: any) {
      console.error("Errore annullamento pick:", err);
      toast.error(err.message || "Impossibile annullare la scelta");
    } finally {
      setSubmitting(false);
    }
  };

  // Admin: Reassign pick owner (for pick trades)
  const handleAdminTradePick = async (pickOverall: number, newTeamId: string) => {
    if (!isAdmin) return;
    setAdminSaving(true);
    try {
      const targetPick = picks.find((p) => p.pick_overall === pickOverall);
      const { error } = await supabase
        .from(DRAFT_BOARD_TABLE)
        .update({ team_id: newTeamId })
        .eq("pick_overall", pickOverall);
      if (error) throw error;

      if (targetPick?.rookie_id) {
        await supabase
          .from(ROOKIE_TABLE)
          .update({ Squadra: newTeamId })
          .eq("ID", targetPick.rookie_id);

        await supabase
          .from("an_player")
          .update({ Squadra: newTeamId })
          .eq("ID", targetPick.rookie_id);
      }

      toast.success(`Pick #${pickOverall} assegnata a ${newTeamId}`);
      await fetchDraftData(true);
    } catch (err) {
      console.error("Errore modifica proprietario scelta:", err);
      toast.error("Errore nell'aggiornamento della scelta");
    } finally {
      setAdminSaving(false);
    }
  };

  // Admin: Apply base order (1->12) to all 5 rounds (linear inverse standings order)
  const handleAdminApplyBaseOrder = async (orderToApply: string[]) => {
    if (!isAdmin || orderToApply.length !== 12) return;
    setAdminSaving(true);
    try {
      for (let round = 1; round <= 5; round++) {
        for (let i = 0; i < 12; i++) {
          const pickInRound = i + 1;
          const pickOverall = (round - 1) * 12 + pickInRound;
          const teamId = orderToApply[i];
          const { error } = await supabase
            .from(DRAFT_BOARD_TABLE)
            .update({
              team_id: teamId,
              original_team_id: teamId,
            })
            .eq("pick_overall", pickOverall);
          if (error) throw error;
        }
      }
      setCustomRound1Order(orderToApply);
      toast.success("Ordine base (1→12) aggiornato su tutti i 5 round!");
      await fetchDraftData(true);
    } catch (err) {
      console.error("Errore applicazione ordine base:", err);
      toast.error("Errore durante il ricalcolo dell'ordine dei round");
    } finally {
      setAdminSaving(false);
    }
  };

  const moveTeamInRound1Order = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= customRound1Order.length) return;
    const next = [...customRound1Order];
    const temp = next[index];
    next[index] = next[targetIndex];
    next[targetIndex] = temp;
    setCustomRound1Order(next);
  };

  const roundModes: { id: ViewMode; label: string; roundNum: number }[] = [
    { id: "r1", label: "Round 1", roundNum: 1 },
    { id: "r2", label: "Round 2", roundNum: 2 },
    { id: "r3", label: "Round 3", roundNum: 3 },
    { id: "r4", label: "Round 4", roundNum: 4 },
    { id: "r5", label: "Round 5", roundNum: 5 },
  ];

  const activeSingleRound = useMemo(() => {
    const found = roundModes.find((r) => r.id === viewMode);
    return found ? found.roundNum : null;
  }, [viewMode]);

  const completedPicksCount = useMemo(
    () => picks.filter((p) => p.rookie_id !== null).length,
    [picks]
  );

  const upcomingQueue = useMemo(() => {
    return picks.filter((p) => p.rookie_id === null).slice(1, 6);
  }, [picks]);

  // Column header teams (from Round 1 original_team_id 1..12)
  const columnHeaderTeams = useMemo(() => {
    const r1 = picks
      .filter((p) => p.round === 1)
      .sort((a, b) => a.pick_in_round - b.pick_in_round);
    return r1.map((p) => ({
      slot: p.pick_in_round,
      teamId: p.original_team_id,
      team: teamMap.get(p.original_team_id),
    }));
  }, [picks, teamMap]);

  // Reusable Square Pick Card component (6 per row layout -> much wider & clearer)
  const renderPickSquare = (pick: DraftPickRow, large = false) => {
    const isOnTheClock = currentOnTheClockPick?.pick_overall === pick.pick_overall;
    const isDrafted = (pick.rookie_id !== null || pick.player_id !== null) && (!!pick.rookie || !!pick.player);
    const isTraded = pick.team_id !== pick.original_team_id;
    const isMyTeamPick = !!activeUserTeamId && pick.team_id === activeUserTeamId;
    const isFilteredOut = teamFilter !== "ALL" && pick.team_id !== teamFilter;
    const teamObj = teamMap.get(pick.team_id);

    return (
      <div
        key={pick.pick_overall}
        className={`group relative flex flex-col justify-between rounded-xl border transition-all ${
          large ? "min-h-[138px] p-3.5" : "min-h-[116px] p-3"
        } ${
          isFilteredOut ? "opacity-25 scale-[0.98]" : "opacity-100"
        } ${
          isOnTheClock
            ? "bg-emerald-500/15 border-2 border-emerald-500 shadow-md ring-2 ring-emerald-500/20"
            : isDrafted
            ? isMyTeamPick
              ? "bg-emerald-500/[0.08] border-emerald-500/40 shadow-sm"
              : "bg-card border-border/90 shadow-sm"
            : isMyTeamPick
            ? "bg-primary/[0.04] border-emerald-500/35 border-dashed"
            : "bg-muted/25 border-border/60 hover:bg-muted/40"
        }`}
      >
        {/* Top Row: Progressive Pick Number + Team Owner Logo & Name */}
        <div className="flex items-start justify-between gap-1.5">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-mono font-black text-sm sm:text-base leading-none ${
                isOnTheClock
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-foreground"
              }`}
            >
              #{pick.pick_overall}
            </span>
          </div>

          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1.5">
              <img
                src={`/images/teams/${pick.team_id}_Logo.png`}
                alt={pick.team_id}
                className="h-5 w-5 object-contain shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/images/LCSIM_Logo_SMALL.png";
                }}
              />
              <span
                className={`font-mono font-extrabold text-xs ${
                  isTraded
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-foreground"
                }`}
              >
                {pick.team_id}
              </span>
            </div>
            {isTraded && (
              <span
                title={`Scelta scambiata (originaria di ${pick.original_team_id})`}
                className="text-[9px] font-mono text-amber-600 dark:text-amber-400 leading-none mt-0.5 flex items-center gap-0.5"
              >
                <Repeat className="h-2.5 w-2.5" /> da {pick.original_team_id}
              </span>
            )}
          </div>
        </div>

        {/* Center/Bottom Content: Drafted Player or Rookie or Status */}
        <div className="mt-2.5 pt-2 border-t border-border/50 flex flex-col justify-end">
          {((pick.rookie_id !== null || pick.player_id !== null) && (pick.rookie || pick.player)) ? (() => {
            const dp = pick.rookie || pick.player!;
            const isFa = pick.player_type === "free_agent";
            return (
              <div
                className="flex items-center gap-2 cursor-pointer hover:opacity-85 transition-opacity"
                onClick={() => {
                  if (isFa) {
                    handleOpenFreeAgentDetails(dp as Player);
                  } else {
                    const fullRookie = rookies.find((r) => Number(r.ID) === Number(dp.ID)) || (dp as Player);
                    setInspectedRookie(fullRookie);
                  }
                }}
              >
                <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full overflow-hidden bg-muted/50 border border-border/80 shrink-0 shadow-xs flex items-center justify-center">
                  <img
                    src={getPlayerImage(Number(pick.player_id || pick.rookie_id || dp.ID))}
                    alt={`${dp.Nome} ${dp.Cognome}`}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = "/images/players/MConti.png";
                    }}
                    className="h-full w-full object-cover object-top"
                  />
                </div>

                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1">
                      <Badge
                        variant="outline"
                        className={`text-[9px] font-extrabold px-1.5 py-0 h-3.5 leading-none ${getRoleColor(
                          dp.Posiz
                        )}`}
                      >
                        {dp.Posiz}
                      </Badge>
                      {isFa && (
                        <Badge
                          variant="outline"
                          className="text-[8px] font-bold px-1 py-0 h-3 leading-none bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30"
                        >
                          FA
                        </Badge>
                      )}
                    </div>

                    {isAdmin && (
                      <button
                        type="button"
                        title="Annulla questa scelta (Admin)"
                        onClick={() => handleAdminUndoPick(pick)}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <div
                    className="font-extrabold text-foreground text-xs leading-tight truncate"
                    title={`${dp.Nome} ${dp.Cognome}`}
                  >
                    {dp.Nome} {dp.Cognome}
                  </div>
                </div>
              </div>
            );
          })() : isOnTheClock ? (
            <div className="flex items-center justify-between gap-1 py-1">
              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 animate-pulse">
                <Clock className="h-3.5 w-3.5" /> On Clock
              </span>
              <span className="text-[11px] font-semibold text-foreground truncate">
                {teamObj?.NAME_ABBR || pick.team_id}
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-1 text-xs text-muted-foreground/75 py-1">
              <span className="truncate font-medium">
                {teamObj?.NAME_ABBR || pick.team_id}
              </span>
              {isMyTeamPick && (
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0">
                  TUA
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <Navbar />

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* TOP TELEMETRY & ON-THE-CLOCK BROADCAST HUD */}
        <div className="rounded-2xl border border-border/80 bg-card shadow-lg overflow-hidden">
          <div className="p-5 md:p-6 bg-gradient-to-r from-emerald-500/10 via-card to-blue-500/5 border-b border-border/70">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3" /> LCSIM Official Rookie Draft
                  </span>
                  <Badge variant="outline" className="font-mono text-[11px] border-border/80">
                    Classifica Inversa • 5 Round × 12 Squadre (60 Pick)
                  </Badge>
                </div>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-3">
                  <Trophy className="h-7 w-7 text-emerald-500 shrink-0" />
                  Draft Board &amp; Rookie Selection
                </h1>
                <p className="text-xs md:text-sm text-muted-foreground mt-1">
                  Ordine di scelta basato sulla classifica inversa in ogni round (stile NFL Draft). I valori dei rookie sono coperti fino al completamento dello scouting.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchDraftData(false)}
                  disabled={loading}
                  className="gap-1.5 text-xs"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                  Aggiorna Board
                </Button>

                {isAdmin && (
                  <Button
                    size="sm"
                    onClick={() => setAdminModalOpen(true)}
                    className="gap-1.5 text-xs bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
                  >
                    <Settings2 className="h-3.5 w-3.5" />
                    Ordine &amp; Scambi Scelte (Admin)
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* LIVE ON THE CLOCK STATUS BAR */}
          <div className="px-5 py-3.5 bg-muted/30 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
            {currentOnTheClockPick ? (
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-xs font-extrabold uppercase tracking-wider">
                    ON THE CLOCK
                  </span>
                  <span className="font-mono font-black text-sm ml-1">
                    SCELTA #{currentOnTheClockPick.pick_overall}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-card border border-border shadow-sm">
                  <img
                    src={`/images/teams/${currentOnTheClockPick.team_id}_Logo.png`}
                    alt={currentOnTheClockPick.team_id}
                    className="h-6 w-6 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/images/LCSIM_Logo_SMALL.png";
                    }}
                  />
                  <span className="font-bold text-sm">
                    {teamMap.get(currentOnTheClockPick.team_id)?.NAME || currentOnTheClockPick.team_id}
                  </span>
                  <Badge variant="secondary" className="font-mono text-[10px]">
                    {currentOnTheClockPick.team_id}
                  </Badge>
                  {currentOnTheClockPick.team_id !== currentOnTheClockPick.original_team_id && (
                    <Badge
                      variant="outline"
                      className="text-[10px] bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1"
                    >
                      <Repeat className="h-2.5 w-2.5" />
                      da {currentOnTheClockPick.original_team_id}
                    </Badge>
                  )}
                </div>

                {/* Autopick Squadra Badge */}
                {allAutopickSettings[currentOnTheClockPick.team_id] && (
                  <Badge
                    variant="outline"
                    className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1 text-[11px] font-bold"
                  >
                    <Bot className="h-3.5 w-3.5" />
                    Autopick Attivo
                  </Badge>
                )}

                {/* Pulsante Emergenza Admin per Autopick */}
                {isAdmin && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleTriggerAutopick(currentOnTheClockPick)}
                    disabled={isAutopicking || submitting}
                    className="h-8 text-xs font-bold border-amber-500/50 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 gap-1.5"
                    title="Esegui scelta automatica da lista preferenze squadra o miglior OVR"
                  >
                    <Bot className="h-3.5 w-3.5 text-amber-500" />
                    <span>{isAutopicking ? "Selezione..." : `Autopick per ${currentOnTheClockPick.team_id}`}</span>
                  </Button>
                )}

                {upcomingQueue.length > 0 && (
                  <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground pl-2">
                    <span className="font-semibold uppercase tracking-wider text-[10px]">
                      Prossime:
                    </span>
                    {upcomingQueue.map((q) => (
                      <span
                        key={q.pick_overall}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-background/80 border border-border/60 font-mono text-[11px]"
                      >
                        <span className="text-muted-foreground">#{q.pick_overall}</span>
                        <span className="font-bold text-foreground">{q.team_id}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="h-5 w-5" />
                Draft Completato! Tutte le 60 scelte sono state ufficializzate.
              </div>
            )}

            <div className="flex items-center gap-3 self-start xl:self-auto">
              <div className="text-right">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Avanzamento Draft
                </div>
                <div className="text-xs font-mono font-bold">
                  {completedPicksCount} / 60 Scelte ({Math.round((completedPicksCount / 60) * 100)}%)
                </div>
              </div>
              <div className="w-28 h-2.5 rounded-full bg-muted overflow-hidden border border-border/60">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${Math.min(100, (completedPicksCount / 60) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* MAIN CONTENT GRID: Full width if logged out, 2 columns (Board Left + User Team Right) if logged in */}
        <div
          className={`grid gap-6 items-start ${
            user ? "grid-cols-1 xl:grid-cols-[1fr_390px]" : "grid-cols-1"
          }`}
        >
          {/* LEFT SECTION: DRAFT BOARD (Unified 60-Square Grid OR Single Round View) */}
          <div className="space-y-4 min-w-0">
            {/* View Switcher Bar: Tabellone Completo (60 Quadrati) + Round 1..5 */}
            <Card className="border border-border/80 shadow-sm bg-card">
              <CardContent className="p-3.5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Button
                    variant={viewMode === "board" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("board")}
                    className={`h-8 text-xs font-bold gap-1.5 ${
                      viewMode === "board"
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : ""
                    }`}
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                    Tabellone Completo (60 Scelte)
                  </Button>

                  <div className="h-5 w-px bg-border mx-1 hidden sm:block" />

                  {roundModes.map((rm) => (
                    <Button
                      key={rm.id}
                      variant={viewMode === rm.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode(rm.id)}
                      className={`h-8 px-3 text-xs font-semibold ${
                        viewMode === rm.id
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                          : ""
                      }`}
                    >
                      {rm.label}
                    </Button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <Select value={teamFilter} onValueChange={setTeamFilter}>
                    <SelectTrigger className="h-8 w-[165px] text-xs">
                      <SelectValue placeholder="Evidenzia squadra" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Tutte le 12 squadre</SelectItem>
                      {teams.map((t) => (
                        <SelectItem key={t.TEAM_ID} value={t.TEAM_ID}>
                          {t.NAME} ({t.TEAM_ID})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {loading ? (
              <Card className="p-12 text-center text-muted-foreground">
                Caricamento Draft Board in corso...
              </Card>
            ) : viewMode === "board" ? (
              /* UNIFIED 60-SQUARE BIG BOARD: 6 Picks per Row -> Each Round is 2 coupled rows */
              <Card className="border border-border/80 shadow-md overflow-hidden bg-card">
                <CardHeader className="py-3.5 px-4 bg-muted/30 border-b border-border/70 flex flex-row items-center justify-between space-y-0">
                  <div className="flex items-center gap-2">
                    <LayoutGrid className="h-4 w-4 text-emerald-500" />
                    <CardTitle className="text-sm md:text-base font-extrabold">
                      Riepilogo Completo Draft Board (5 Round • 6 Scelte per Riga)
                    </CardTitle>
                  </div>
                  <span className="text-[11px] text-muted-foreground font-mono hidden sm:inline">
                    Ogni Round è diviso su 2 righe accoppiate (Pick 1–6 e Pick 7–12)
                  </span>
                </CardHeader>

                <CardContent className="p-3.5 md:p-4 space-y-4">
                  {[1, 2, 3, 4, 5].map((roundNum) => {
                    const roundPicks = picks
                      .filter((p) => p.round === roundNum)
                      .sort((a, b) => a.pick_in_round - b.pick_in_round);
                    const firstRowPicks = roundPicks.slice(0, 6);
                    const secondRowPicks = roundPicks.slice(6, 12);
                    const completedInRound = roundPicks.filter(
                      (p) => p.rookie_id !== null
                    ).length;

                    return (
                      <div
                        key={roundNum}
                        className="rounded-2xl border border-border/80 bg-muted/15 p-3 space-y-2.5"
                      >
                        <div className="grid grid-cols-1 lg:grid-cols-[68px_1fr] gap-3 items-stretch">
                          {/* Coupled Round Badge spanning the 2 rows */}
                          <button
                            type="button"
                            onClick={() => setViewMode(`r${roundNum}` as ViewMode)}
                            title={`Clicca per aprire il dettaglio del Round ${roundNum}`}
                            className="flex lg:flex-col items-center justify-between lg:justify-center gap-1 px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 transition-colors"
                          >
                            <span className="font-mono font-black text-base leading-none">
                              R{roundNum}
                            </span>
                            <span className="text-[10px] font-mono font-bold opacity-85">
                              {completedInRound}/12
                            </span>
                            <span className="text-[9px] font-mono opacity-70 hidden lg:inline">
                              1→12
                            </span>
                          </button>

                          {/* 2 Coupled Rows of 6 Squares each */}
                          <div className="space-y-2.5">
                            {/* Row 1 of Round: Picks 1 to 6 */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                              {firstRowPicks.map((pick) => renderPickSquare(pick, false))}
                            </div>

                            {/* Row 2 of Round: Picks 7 to 12 */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                              {secondRowPicks.map((pick) => renderPickSquare(pick, false))}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ) : (
              /* SINGLE ROUND ZOOMED SQUARE VIEW (Round 1..5) */
              activeSingleRound && (
                <Card className="border border-border/80 shadow-md overflow-hidden bg-card">
                  <CardHeader className="py-3.5 px-4 bg-muted/30 border-b border-border/70 flex flex-row items-center justify-between space-y-0">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center font-mono font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
                        R{activeSingleRound}
                      </div>
                      <div>
                        <CardTitle className="text-base font-extrabold tracking-tight flex items-center gap-2">
                          Dettaglio Round {activeSingleRound}
                          <Badge
                            variant="outline"
                            className="text-[10px] font-mono px-1.5 py-0 flex items-center gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                          >
                            <ArrowRight className="h-2.5 w-2.5" /> Ordine 1→12 (Classifica Inversa)
                          </Badge>
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Scelte #{(activeSingleRound - 1) * 12 + 1} – #{activeSingleRound * 12}
                        </CardDescription>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={activeSingleRound <= 1}
                        onClick={() =>
                          setViewMode(`r${activeSingleRound - 1}` as ViewMode)
                        }
                        className="h-8 px-2.5 text-xs"
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Round Prec
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={activeSingleRound >= 5}
                        onClick={() =>
                          setViewMode(`r${activeSingleRound + 1}` as ViewMode)
                        }
                        className="h-8 px-2.5 text-xs"
                      >
                        Round Succ
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {picks
                        .filter((p) => p.round === activeSingleRound)
                        .sort((a, b) => a.pick_in_round - b.pick_in_round)
                        .map((pick) => renderPickSquare(pick, true))}
                    </div>
                  </CardContent>
                </Card>
              )
            )}
          </div>

          {/* RIGHT SECTION: USER TEAM WAR ROOM & RECAP (Visible ONLY when logged in) */}
          {user && (
            <div className="space-y-5 xl:sticky xl:top-20">
              {/* 1. USER TEAM HEADER & TURN STATUS */}
              <Card className="border border-border/80 shadow-md overflow-hidden bg-card">
                <CardHeader className="p-4 bg-gradient-to-br from-emerald-500/15 via-card to-card border-b border-border/70">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      {activeUserTeamId && (
                        <img
                          src={`/images/teams/${activeUserTeamId}_Logo.png`}
                          alt={activeUserTeamId}
                          className="h-11 w-11 object-contain filter drop-shadow"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/images/LCSIM_Logo_SMALL.png";
                          }}
                        />
                      )}
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                            War Room Squadra
                          </span>
                          {isAdmin && (
                            <Badge
                              variant="outline"
                              className="text-[9px] px-1 py-0 bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/40"
                            >
                              ADMIN MODE
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-lg font-extrabold">
                          {activeUserTeam?.NAME || activeUserTeamId}
                        </CardTitle>
                      </div>
                    </div>

                    {isAdmin && (
                      <Select
                        value={activeUserTeamId || ""}
                        onValueChange={(val) => setAdminSelectedTeam(val)}
                      >
                        <SelectTrigger className="h-8 w-[125px] text-xs font-mono">
                          <SelectValue placeholder="Squadra" />
                        </SelectTrigger>
                        <SelectContent>
                          {teams.map((t) => (
                            <SelectItem key={t.TEAM_ID} value={t.TEAM_ID}>
                              {t.TEAM_ID} - {t.NAME_ABBR}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  {/* Turn Banner */}
                  <div className="mt-3">
                    {currentOnTheClockPick &&
                    currentOnTheClockPick.team_id === activeUserTeamId ? (
                      <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                          È IL TUO TURNO DI SCEGLIERE!
                        </span>
                        <span className="font-mono">
                          Scelta #{currentOnTheClockPick.pick_overall}
                        </span>
                      </div>
                    ) : nextUserPendingPick ? (
                      <div className="p-2.5 rounded-xl bg-muted/60 border border-border text-xs flex items-center justify-between text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-amber-500" />
                          Prossima scelta {activeUserTeamId}:
                        </span>
                        <span className="font-mono font-bold text-foreground">
                          Scelta #{nextUserPendingPick.pick_overall}
                        </span>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-xl bg-muted/60 border border-border text-xs text-muted-foreground text-center">
                        Tutte le scelte per {activeUserTeamId} sono state completate.
                      </div>
                    )}
                  </div>

                  {/* Badge Notifica Autopick per la squadra attiva */}
                  <div className="mt-3 pt-3 border-t border-border/50 flex flex-wrap items-center justify-between gap-2 text-xs">
                    {isUserAutopickEnabled ? (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold">
                        <Bot className="h-4 w-4 text-emerald-500 shrink-0" />
                        <span>Autopick Attivo per {activeUserTeamId}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-muted-foreground py-0.5">
                        <Bot className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                        <span>Autopick non attivo</span>
                      </div>
                    )}

                    <Link
                      to="/mia-squadra/scouting?tab=autopick"
                      className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 ml-auto"
                    >
                      <span>Imposta Graduatoria in Scouting</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </CardHeader>

                {/* 2. DRAFT SELECTOR (ROOKIE & CALCIATORI SVINCOLATI - PUNTO 40) */}
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <UserPlus className="h-3.5 w-3.5 text-emerald-500" />
                      Disponibili al Draft ({availableDraftPool.length})
                    </span>
                    <Link
                      to="/mia-squadra/scouting"
                      className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      <Compass className="h-3 w-3" /> Vai allo Scouting
                    </Link>
                  </div>

                  {/* Filter Pills for Type: Tutti, 🌟 Rookie, 🆓 Svincolati */}
                  <div className="flex items-center gap-1.5 p-1 bg-muted/50 rounded-lg border border-border/60">
                    <button
                      type="button"
                      onClick={() => setPoolTypeFilter("ALL")}
                      className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all flex-1 text-center ${
                        poolTypeFilter === "ALL"
                          ? "bg-background text-foreground shadow-xs border border-border/80"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Tutti ({undraftedRookiesCount + undraftedFreeAgentsCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setPoolTypeFilter("ROOKIE")}
                      className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all flex-1 text-center flex items-center justify-center gap-1 ${
                        poolTypeFilter === "ROOKIE"
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <span>🌟 Rookie</span>
                      <span className="text-[10px] opacity-75">({undraftedRookiesCount})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPoolTypeFilter("FREE_AGENT")}
                      className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all flex-1 text-center flex items-center justify-center gap-1 ${
                        poolTypeFilter === "FREE_AGENT"
                          ? "bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/40 shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <span>🆓 Svincolati</span>
                      <span className="text-[10px] opacity-75">({undraftedFreeAgentsCount})</span>
                    </button>
                  </div>

                  {/* Banner Avviso Obbligo Portiere (Punto #42) */}
                  {isGkDraftMandatory && (
                    <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5 shadow-sm animate-in fade-in">
                      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <div className="font-extrabold text-[12px] flex items-center gap-1.5">
                          <span>Obbligo Portiere Attivo (Punto #42)</span>
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40 font-bold">Ultima Scelta</Badge>
                        </div>
                        <p className="leading-snug text-muted-foreground text-[11px]">
                          La squadra <strong>{activePickingTeamId}</strong> ha solo 1 portiere a roster ed è alla sua ultima scelta al Draft. Il regolamento impone la selezione esclusiva di un portiere (Rookie o Svincolato).
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Banner Avviso Limite Portieri (Punto #43) */}
                  {isGkDraftForbidden && (
                    <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-900 dark:text-blue-200 text-xs flex items-start gap-2 shadow-sm animate-in fade-in">
                      <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <span className="font-extrabold text-[12px]">Tetto Massimo 3 Portieri Raggiunto (Punto #43)</span>
                        <p className="leading-snug text-muted-foreground text-[11px]">
                          La squadra <strong>{activePickingTeamId}</strong> ha già 3 portieri in rosa. I portieri non sono selezionabili.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Search & Role group filter */}
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <Input
                        placeholder="Cerca calciatore o rookie per nome..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-8 pl-8 text-xs"
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setFavoritesOnly((prev) => !prev)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1.5 ${
                          favoritesOnly
                            ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/50 ring-1 ring-amber-500/30 shadow-xs"
                            : "bg-muted/60 text-muted-foreground hover:text-foreground border border-transparent"
                        }`}
                        title="Filtra solo i tuoi preferiti (⭐)"
                      >
                        <Star className={`h-3.5 w-3.5 ${favoritesOnly ? "fill-amber-500 text-amber-500" : ""}`} />
                        <span>Preferiti ({favoriteRookieIds.size + favoriteFreeAgentIds.size})</span>
                      </button>

                      {ROLE_GROUPS.map((g) => (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => setRoleFilter(g.id)}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors ${
                            roleFilter === g.id
                              ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40"
                              : "bg-muted/60 text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {g.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Scrollable Draft Pool List */}
                  <div className="max-h-[340px] overflow-y-auto rounded-xl border border-border/80 divide-y divide-border/40 bg-background/50">
                    {availableDraftPool.length === 0 ? (
                      <div className="p-6 text-center text-xs text-muted-foreground">
                        Nessun calciatore o rookie disponibile con questi filtri.
                      </div>
                    ) : (
                      availableDraftPool.map((item) => {
                        const pId = Number(item.id);
                        const isSelected = selectedPlayerItem?.id === pId;
                        const scoutTokens = item.type === "rookie" ? (scoutingByRookie[pId] ?? 0) : 0;
                        const isItemGkForbidden = isGkDraftForbidden && item.player.Posiz === "POR";
                        return (
                          <div
                            key={`${item.type}-${item.id}`}
                            onClick={() => {
                              if (isItemGkForbidden) {
                                toast.error("Limite massimo portieri: la squadra ha già 3 portieri in rosa.");
                                return;
                              }
                              setSelectedPlayerItem(
                                isSelected ? null : { id: pId, type: item.type, player: item.player }
                              );
                            }}
                            className={`w-full px-3 py-2.5 flex flex-col gap-1.5 transition-colors ${isItemGkForbidden ? "opacity-60 cursor-not-allowed bg-muted/20" : "cursor-pointer select-none"} ${
                              isSelected
                                ? "bg-emerald-500/15 border-l-4 border-l-emerald-500"
                                : "hover:bg-muted/60"
                            }`}
                          >
                            {/* RIGA 1: Avatar + Ruolo + NOME E COGNOME COMPLETO (priorità assoluta) + Azioni */}
                            <div className="flex items-center justify-between gap-2 min-w-0">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <div className="h-7 w-7 rounded-full overflow-hidden bg-muted/60 border border-border/70 shrink-0 flex items-center justify-center">
                                  <img
                                    src={getPlayerImage(pId)}
                                    alt={item.player.Nome || ""}
                                    className="h-full w-full object-cover object-top"
                                    onError={(e) => {
                                      (e.currentTarget as HTMLImageElement).src = "/images/players/MConti.png";
                                    }}
                                  />
                                </div>

                                <Badge
                                  variant="outline"
                                  className={`text-[10px] font-bold w-10 justify-center shrink-0 ${getRoleColor(
                                    item.player.Posiz
                                  )}`}
                                >
                                  {item.player.Posiz}
                                </Badge>

                                <span className="text-xs sm:text-sm font-extrabold text-foreground leading-snug flex-1 break-words">
                                  {item.player.Nome} {item.player.Cognome}
                                </span>

                                {item.isFavorite && (
                                  <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500 shrink-0" />
                                )}
                              </div>

                              {/* Azioni rapide a destra: Preferito, Scheda, Scegli */}
                              <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                                <button
                                  type="button"
                                  onClick={() => handleToggleFavorite(pId, item.type)}
                                  className={`p-1 rounded-md transition-all ${
                                    item.isFavorite
                                      ? "text-amber-500 hover:text-amber-600 hover:scale-110"
                                      : "text-muted-foreground/35 hover:text-amber-500 hover:scale-110"
                                  }`}
                                  title={
                                    item.isFavorite
                                      ? "Rimuovi dai preferiti"
                                      : "Salva tra i preferiti (⭐)"
                                  }
                                >
                                  <Star
                                    className={`h-4 w-4 ${
                                      item.isFavorite ? "fill-amber-500" : ""
                                    }`}
                                  />
                                </button>

                                <button
                                  type="button"
                                  title={item.type === "free_agent" ? "Apri scheda tecnica svincolato" : "Apri Report Scouting del rookie"}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (item.type === "free_agent") {
                                      handleOpenFreeAgentDetails(item.player);
                                    } else {
                                      setInspectedRookie(item.player);
                                    }
                                  }}
                                  className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </button>

                                {isItemGkForbidden ? (
                                  <span
                                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-muted/60 text-muted-foreground/60 border border-dashed border-border shrink-0 cursor-not-allowed"
                                    title="Limite 3 portieri raggiunto: non puoi selezionare altri portieri"
                                  >
                                    Max 3 POR
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setSelectedPlayerItem(
                                        isSelected ? null : { id: pId, type: item.type, player: item.player }
                                      )
                                    }
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                                      isSelected
                                        ? "bg-emerald-500 text-white shadow-xs"
                                        : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
                                    }`}
                                  >
                                    {isSelected ? (
                                      <span className="flex items-center gap-1">
                                        <CheckCircle2 className="h-3 w-3" /> Scelto
                                      </span>
                                    ) : (
                                      "Scegli"
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* RIGA 2: Badges (Svincolato/Rookie), Dati anagrafici e Rating OVR / Stelle */}
                            <div className="flex items-center justify-between gap-1.5 pl-9 text-xs">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {item.type === "free_agent" ? (
                                  <Badge
                                    variant="outline"
                                    className="text-[9px] px-1.5 py-0 h-4 leading-none bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30 font-bold shrink-0"
                                  >
                                    Svincolato
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="text-[9px] px-1.5 py-0 h-4 leading-none bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-bold shrink-0"
                                  >
                                    Rookie
                                  </Badge>
                                )}

                                <span className="text-[11px] text-muted-foreground">
                                  {item.player.Età}a • {item.player.Nazionalità}
                                </span>
                              </div>

                              {/* Rating: OVR noto per svincolati, Stelle / Scouting per Rookie */}
                              <div className="shrink-0 flex items-center gap-1">
                                {item.type === "free_agent" ? (
                                  <Badge
                                    variant="outline"
                                    className="font-mono font-black text-[11px] px-1.5 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                                  >
                                    OVR {item.player.OVR}
                                  </Badge>
                                ) : (
                                  <div className="flex items-center gap-1">
                                    {item.player.Stelle ? (
                                      <span className="text-xs text-amber-500 font-bold flex items-center">
                                        {renderStars(item.player.Stelle, "h-3 w-3")}
                                      </span>
                                    ) : (
                                      <Badge variant="outline" className="text-[9px] font-mono px-1 py-0">
                                        1-5⭐
                                      </Badge>
                                    )}
                                    {scoutTokens > 0 && (
                                      <Badge
                                        variant="outline"
                                        className={`text-[9px] font-mono px-1 py-0 shrink-0 ${getTierBadgeStyle(
                                          scoutTokens
                                        )}`}
                                      >
                                        🔭 {scoutTokens}G
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Selection Box & Confirm Button */}
                  <div className="p-3 rounded-xl border border-border/80 bg-muted/30 space-y-2.5">
                    {selectedPlayerItem ? (
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-xs">
                          <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                            {selectedPlayerItem.type === "free_agent" ? "Svincolato Selezionato:" : "Rookie Selezionato:"}
                          </span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-bold ${getRoleColor(
                                selectedPlayerItem.player.Posiz
                              )}`}
                            >
                              {selectedPlayerItem.player.Posiz}
                            </Badge>
                            <span className="font-extrabold text-sm flex items-center gap-1.5">
                              {selectedPlayerItem.player.Nome} {selectedPlayerItem.player.Cognome}
                              {selectedPlayerItem.type === "free_agent" && (
                                <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30 font-bold">
                                  OVR {selectedPlayerItem.player.OVR}
                                </Badge>
                              )}
                              <button
                                type="button"
                                onClick={() => handleToggleFavorite(Number(selectedPlayerItem.id), selectedPlayerItem.type)}
                                className="p-0.5 rounded text-muted-foreground hover:text-amber-500 transition-colors"
                                title={
                                  (selectedPlayerItem.type === "free_agent"
                                    ? favoriteFreeAgentIds.has(Number(selectedPlayerItem.id))
                                    : favoriteRookieIds.has(Number(selectedPlayerItem.id)))
                                    ? "Rimuovi dai preferiti"
                                    : "Aggiungi ai preferiti"
                                }
                              >
                                <Star
                                  className={`h-3.5 w-3.5 ${
                                    (selectedPlayerItem.type === "free_agent"
                                      ? favoriteFreeAgentIds.has(Number(selectedPlayerItem.id))
                                      : favoriteRookieIds.has(Number(selectedPlayerItem.id)))
                                      ? "fill-amber-500 text-amber-500"
                                      : "text-muted-foreground/40 hover:text-amber-500"
                                  }`}
                                />
                              </button>
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedPlayerItem(null)}
                          className="h-7 text-xs text-muted-foreground"
                        >
                          Cambia
                        </Button>
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground text-center py-1">
                        Clicca su un calciatore o rookie nella lista sopra per prepararlo alla scelta.
                      </div>
                    )}

                    <Button
                      className="w-full font-bold gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                      disabled={
                        !selectedPlayerItem ||
                        !isUserTeamOnTheClock ||
                        !targetPickForConfirmation ||
                        submitting
                      }
                      onClick={handleConfirmPick}
                    >
                      {!isUserTeamOnTheClock ? (
                        <>
                          <Lock className="h-4 w-4" />
                          In attesa del turno di {user?.team || "Squadra"}
                        </>
                      ) : targetPickForConfirmation ? (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          Conferma Scelta #{targetPickForConfirmation.pick_overall} per{" "}
                          {targetPickForConfirmation.team_id}
                        </>
                      ) : (
                        "Draft Completato"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* 3. USER TEAM DRAFT RECAP (Strictly showing ONLY Player Name & Position!) */}
              <Card className="border border-border/80 shadow-md overflow-hidden bg-card">
                <CardHeader className="py-3.5 px-4 bg-muted/30 border-b border-border/70 flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle className="text-sm font-extrabold uppercase tracking-wider flex items-center gap-2">
                      <Layers className="h-4 w-4 text-emerald-500" />
                      Recap Scelte • {activeUserTeam?.NAME_ABBR || activeUserTeamId}
                    </CardTitle>
                    <CardDescription className="text-[11px]">
                      Rookie selezionati (Nome e Posizione) e scelte a disposizione
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="font-mono text-xs">
                    {userTeamPicks.filter((p) => p.rookie_id !== null).length} /{" "}
                    {userTeamPicks.length}
                  </Badge>
                </CardHeader>

                <CardContent className="p-3 divide-y divide-border/50">
                  {userTeamPicks.length === 0 ? (
                    <div className="p-4 text-center text-xs text-muted-foreground">
                      Nessuna scelta assegnata a questa squadra.
                    </div>
                  ) : (
                    userTeamPicks.map((pick) => {
                      const drafted = pick.rookie || pick.player;
                      const isPicked = (pick.rookie_id !== null || (pick.player_id !== undefined && pick.player_id !== null)) && !!drafted;
                      const isCurrent =
                        currentOnTheClockPick?.pick_overall === pick.pick_overall;
                      const isTraded = pick.team_id !== pick.original_team_id;
                      const isFa = pick.player_type === "free_agent";

                      return (
                        <div
                          key={pick.pick_overall}
                          className={`py-2.5 px-2.5 flex items-center justify-between gap-2 rounded-lg ${
                            isCurrent ? "bg-emerald-500/10 border border-emerald-500/30" : ""
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold px-2 py-1 rounded bg-muted border border-border/70">
                              #{pick.pick_overall}
                            </span>
                            <span className="text-[11px] font-mono text-muted-foreground">
                              (R{pick.round})
                            </span>
                            {isTraded && (
                              <Badge
                                variant="outline"
                                className="text-[9px] px-1.5 py-0 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                              >
                                da {pick.original_team_id}
                              </Badge>
                            )}
                          </div>

                          {isPicked && drafted ? (
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-full overflow-hidden bg-muted/50 border border-border/80 shrink-0 shadow-xs flex items-center justify-center">
                                <img
                                  src={getPlayerImage(Number(pick.player_id || pick.rookie_id || drafted.ID))}
                                  alt={`${drafted.Nome} ${drafted.Cognome}`}
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).src = "/images/players/MConti.png";
                                  }}
                                  className="h-full w-full object-cover object-top"
                                />
                              </div>
                              <div className="flex items-center gap-1">
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] font-bold px-1.5 py-0 ${getRoleColor(
                                    drafted.Posiz
                                  )}`}
                                >
                                  {drafted.Posiz}
                                </Badge>
                                {isFa && (
                                  <Badge
                                    variant="outline"
                                    className="text-[8px] font-bold px-1 py-0 h-3 leading-none bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30"
                                  >
                                    FA
                                  </Badge>
                                )}
                              </div>
                              <span
                                className="text-xs sm:text-sm font-bold text-foreground truncate cursor-pointer hover:underline"
                                onClick={() => {
                                  if (isFa) {
                                    handleOpenFreeAgentDetails(drafted as Player);
                                  } else {
                                    const fullRookie = rookies.find((r) => Number(r.ID) === Number(drafted.ID)) || (drafted as Player);
                                    setInspectedRookie(fullRookie);
                                  }
                                }}
                              >
                                {drafted.Nome} {drafted.Cognome}
                              </span>
                            </div>
                          ) : isCurrent ? (
                            <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 text-[10px]">
                              On the Clock
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">
                              Da scegliere
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      {/* ADMIN MODAL: MANAGE BASE ORDER & PICK TRADES */}
      <Dialog open={adminModalOpen} onOpenChange={setAdminModalOpen}>
        <DialogContent className="max-w-4xl xl:max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-extrabold">
              <ShieldCheck className="h-5 w-5 text-amber-500" />
              Gestione Admin Draft • Ordine &amp; Scambi Scelte
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configura l&apos;ordine base 1→12 (da Classifica Inversa o personalizzato) oppure assegna singole scelte scambiate tra le 12 squadre. Tutto viene salvato su Supabase.
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-2 border-b border-border pb-3">
            <Button
              size="sm"
              variant={adminTab === "trades" ? "default" : "outline"}
              onClick={() => setAdminTab("trades")}
              className="text-xs gap-1.5"
            >
              <Repeat className="h-3.5 w-3.5" />
              Scambi Singole Scelte (Pick 1–60)
            </Button>
            <Button
              size="sm"
              variant={adminTab === "order" ? "default" : "outline"}
              onClick={() => setAdminTab("order")}
              className="text-xs gap-1.5"
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              Ordine Base Round 1–5 (Classifica Inversa)
            </Button>
          </div>

          {adminTab === "trades" ? (
            <div className="space-y-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-muted-foreground">
                  Seleziona il Round per riassegnare le scelte scambiate:
                </span>
                <div className="flex gap-1">
                  {["1", "2", "3", "4", "5"].map((r) => (
                    <Button
                      key={r}
                      size="sm"
                      variant={tradeFilterRound === r ? "default" : "outline"}
                      onClick={() => setTradeFilterRound(r)}
                      className="h-7 px-2.5 text-xs font-mono"
                    >
                      R{r}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="divide-y divide-border rounded-xl border border-border max-h-[380px] overflow-y-auto">
                {picks
                  .filter((p) => String(p.round) === tradeFilterRound)
                  .sort((a, b) => a.pick_in_round - b.pick_in_round)
                  .map((pick) => {
                    const isTraded = pick.team_id !== pick.original_team_id;
                    return (
                      <div
                        key={pick.pick_overall}
                        className="p-2.5 flex items-center justify-between gap-3 hover:bg-muted/40"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono text-xs font-bold px-2 py-1 rounded bg-muted border">
                            #{pick.pick_overall} (R{pick.round})
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Originaria:{" "}
                            <strong className="text-foreground">{pick.original_team_id}</strong>
                          </span>
                          {isTraded && (
                            <Badge
                              variant="outline"
                              className="text-[10px] bg-amber-500/15 text-amber-600 border-amber-500/30"
                            >
                              Scambiata → {pick.team_id}
                            </Badge>
                          )}
                        </div>

                        <Select
                          value={pick.team_id}
                          disabled={adminSaving}
                          onValueChange={(newTeam) =>
                            handleAdminTradePick(pick.pick_overall, newTeam)
                          }
                        >
                          <SelectTrigger className="h-8 w-[190px] text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {teams.map((t) => (
                              <SelectItem key={t.TEAM_ID} value={t.TEAM_ID}>
                                {t.NAME} ({t.TEAM_ID})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  })}
              </div>
            </div>
          ) : (
            <div className="space-y-3 py-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">
                  Ordine Pick 1–12 applicato a ogni Round (1→12):
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCustomRound1Order(inverseStandingsOrder)}
                  className="h-7 text-xs gap-1.5"
                >
                  <RotateCcw className="h-3 w-3" />
                  Carica da Classifica Inversa
                </Button>
              </div>

              <div className="divide-y divide-border rounded-xl border border-border max-h-[340px] overflow-y-auto">
                {customRound1Order.map((teamId, idx) => {
                  const t = teamMap.get(teamId);
                  return (
                    <div
                      key={teamId}
                      className="p-2 px-3 flex items-center justify-between gap-2 hover:bg-muted/40"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 text-center font-mono text-xs font-bold text-muted-foreground">
                          #{idx + 1}
                        </span>
                        <img
                          src={`/images/teams/${teamId}_Logo.png`}
                          alt={teamId}
                          className="h-6 w-6 object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/images/LCSIM_Logo_SMALL.png";
                          }}
                        />
                        <span className="text-xs font-bold">{t?.NAME || teamId}</span>
                        <Badge variant="secondary" className="text-[10px] font-mono">
                          {teamId}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={idx === 0}
                          onClick={() => moveTeamInRound1Order(idx, -1)}
                          className="h-7 w-7 p-0"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={idx === customRound1Order.length - 1}
                          onClick={() => moveTeamInRound1Order(idx, 1)}
                          className="h-7 w-7 p-0"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Button
                onClick={() => handleAdminApplyBaseOrder(customRound1Order)}
                disabled={adminSaving || customRound1Order.length !== 12}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
              >
                Applica Ordine (1→12) su tutti i 5 Round
              </Button>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setAdminModalOpen(false)}>
              Chiudi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* REALTIME DRAFT PICK ANNOUNCEMENT POPUP */}
      <DraftPickAnnouncementModal
        pickData={announcementPick}
        onClose={() => setAnnouncementPick(null)}
      />

      {/* MODAL DETTAGLIO COMPLETO CALCIATORE SVINCOLATO (Punto 40) */}
      {inspectedFreeAgent &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
            onClick={() => setInspectedFreeAgent(null)}
          >
            <div onClick={(e) => e.stopPropagation()} className="w-full max-w-7xl flex items-center justify-center">
              <PlayerDetails
                currentPlayer={inspectedFreeAgent}
                onClose={() => setInspectedFreeAgent(null)}
              />
            </div>
          </div>,
          document.body
        )}

      {/* QUICK SCOUTING REPORT MODAL */}
      <Dialog
        open={!!inspectedRookie}
        onOpenChange={(open) => !open && setInspectedRookie(null)}
      >
        <DialogContent className="max-w-3xl xl:max-w-4xl max-h-[88vh] overflow-y-auto">
          {inspectedRookie && (() => {
            const tokens = scoutingByRookie[Number(inspectedRookie.ID)] ?? 0;
            const ovrInfo = getOvrDisplayByTokens(
              inspectedRookie.OVR,
              tokens,
              inspectedRookie.Stelle
            );
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`text-xs font-extrabold ${getRoleColor(
                          inspectedRookie.Posiz
                        )}`}
                      >
                        {inspectedRookie.Posiz}
                      </Badge>
                      <span>
                        {inspectedRookie.Nome} {inspectedRookie.Cognome}
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className={`font-mono text-xs ${getTierBadgeStyle(tokens)}`}
                    >
                      Scouting {activeUserTeamId}: {tokens}G
                    </Badge>
                  </DialogTitle>
                  <DialogDescription className="text-xs flex flex-wrap items-center gap-3 pt-1">
                    <span>Età: <strong>{inspectedRookie.Età}a</strong></span>
                    <span>•</span>
                    <span>Altezza: <strong>{inspectedRookie.Altezza}cm</strong></span>
                    <span>•</span>
                    <span>Peso: <strong>{inspectedRookie.Peso}kg</strong></span>
                    <span>•</span>
                    <span>Piede: <strong>{inspectedRookie.Piede}</strong></span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1">
                      Stelle: {renderStars(inspectedRookie.Stelle, "h-3.5 w-3.5")}
                    </span>
                    <span>•</span>
                    <span>OVR: <strong className="font-mono">{ovrInfo.isExact ? ovrInfo.label : `${ovrInfo.stars}★ (Valore esatto a 5G)`}</strong></span>
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 py-2">
                  {tokens === 0 ? (
                    <div className="p-4 rounded-xl bg-muted/40 border border-dashed border-border text-center space-y-2">
                      <p className="text-xs text-muted-foreground">
                        Non hai ancora speso gettoni scouting su questo rookie. Sono visibili solo i dati fisici di base e le Stelle.
                      </p>
                      <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
                        <Link to="/mia-squadra/scouting">
                          Vai al Centro Scouting per sbloccare gli attributi
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-1.5 text-xs">
                        {tokens >= 3 && (
                          <>
                            <Badge variant="secondary">Role 1: {inspectedRookie.Role1 || "Standard"}</Badge>
                            <Badge variant="secondary">P. Debole: {inspectedRookie.PiedeDebole || "⭐⭐⭐"}</Badge>
                            <Badge variant="secondary">Skill: {inspectedRookie.MABI || "⭐⭐⭐"}</Badge>
                          </>
                        )}
                        {tokens >= 2 && (
                          <Badge variant="outline" className="bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30">
                            Emotion: {getEmotionLabel(inspectedRookie.Emotion)}
                          </Badge>
                        )}
                        {tokens === 2 && (
                          <Badge variant="outline" className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30">
                            {getRookieTraitsCount(inspectedRookie)} Tratti posseduti
                          </Badge>
                        )}
                        {tokens >= 3 && inspectedRookie.Trait1 && (
                          <Badge variant="outline">{inspectedRookie.Trait1}</Badge>
                        )}
                        {tokens >= 3 && inspectedRookie.IconTrait1 && (
                          <Badge variant="outline" className="text-amber-500 border-amber-500/40">
                            ★ {inspectedRookie.IconTrait1}
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {SCOUTING_DEPARTMENTS.map((dept) => {
                          const unlocked = isDepartmentUnlocked(
                            dept.key,
                            inspectedRookie.Posiz,
                            tokens
                          );
                          const rangeLabel = tokens >= 2 ? "Range 3" : "Range 10";
                          return (
                            <div
                              key={dept.key}
                              className="p-2.5 rounded-xl border border-border/80 bg-muted/20 space-y-1.5"
                            >
                              <div className="text-[11px] font-bold uppercase flex items-center justify-between">
                                <span>{dept.title}</span>
                                <span className="font-mono text-[10px] text-muted-foreground">
                                  {unlocked ? rangeLabel : "Bloccato"}
                                </span>
                              </div>
                              {unlocked ? (
                                <div className="grid grid-cols-2 gap-1">
                                  {dept.stats.map((st) => {
                                    const v = Number(inspectedRookie[st.code]) || 0;
                                    const disp = getStatDisplayByTokens(v, tokens);
                                    return (
                                      <div
                                        key={String(st.code)}
                                        className="flex items-center justify-between text-xs px-1.5 py-0.5 rounded bg-background/80 border border-border/50"
                                      >
                                        <span className="font-mono text-[10px] text-muted-foreground">
                                          {String(st.code)}
                                        </span>
                                        <span className={`font-mono font-bold ${getValueColor(disp.midpoint)}`}>
                                          {disp.label}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="text-[11px] text-muted-foreground italic py-1">
                                  Attributi coperti per questa fascia
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <DialogFooter className="flex items-center justify-between gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link to="/mia-squadra/scouting">Apri in Centro Scouting</Link>
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedPlayerItem({
                        id: Number(inspectedRookie.ID),
                        type: "rookie",
                        player: inspectedRookie,
                      });
                      setInspectedRookie(null);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Seleziona per il Draft
                  </Button>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default Draft;

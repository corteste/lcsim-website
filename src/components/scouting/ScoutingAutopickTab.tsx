import React, { useState, useEffect, useCallback, useMemo } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Bot,
  ListOrdered,
  Star,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Trash2,
  Plus,
  Search,
  Info,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  RefreshCw,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import {
  fetchTeamWishlist,
  addToWishlist,
  removeFromWishlist,
  moveWishlistItem,
  clearWishlist,
  fetchAutopickSetting,
  setAutopickSetting,
} from "@/services/draftWishlistService";
import { DraftWishlistItem } from "@/types/draftWishlist";
import { Player } from "@/types/player";
import { getRoleColor, getValueColor, getNationalityFlag, getPlayerImage } from "@/utils/functions";
// renderStars removed to avoid confusing tokens with stars
import { getTierFromTokens, getTierBadgeStyle, getTopUnlockedAttributes, getOvrDisplayByTokens } from "@/utils/scoutingConfig";

interface ScoutingAutopickTabProps {
  teamId: string;
  teamFullName?: string;
  allRookies: Player[];
  allFreeAgents?: Player[];
  scoutingTokensByRookie?: Record<number, number>;
  onInspectRookie?: (rookieId: number) => void;
  onInspectFreeAgent?: (player: Player) => void;
  onWishlistUpdated?: () => void;
}

const ROLE_GROUPS = [
  { id: "ALL", label: "Tutti" },
  { id: "POR", label: "POR", roles: ["POR"] },
  { id: "DIF", label: "DIF", roles: ["DC", "TD", "TS"] },
  { id: "CEN", label: "CEN", roles: ["CDC", "CC", "ED", "ES", "COC"] },
  { id: "ATT", label: "ATT", roles: ["AD", "AS", "ATT"] },
];

export const ScoutingAutopickTab: React.FC<ScoutingAutopickTabProps> = ({
  teamId,
  teamFullName,
  allRookies,
  allFreeAgents = [],
  scoutingTokensByRookie = {},
  onInspectRookie,
  onInspectFreeAgent,
  onWishlistUpdated,
}) => {
  const [wishlist, setWishlist] = useState<DraftWishlistItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [autopickEnabled, setAutopickEnabled] = useState<boolean>(false);
  const [savingAutopick, setSavingAutopick] = useState<boolean>(false);

  // Search and manual addition state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [poolTypeFilter, setPoolTypeFilter] = useState<"ALL" | "ROOKIE" | "FREE_AGENT">("ALL");

  // Carica i dati della graduatoria e l'impostazione autopick
  const loadData = useCallback(async () => {
    if (!teamId) return;
    setLoading(true);
    try {
      const [list, autopick] = await Promise.all([
        fetchTeamWishlist(teamId),
        fetchAutopickSetting(teamId),
      ]);
      setWishlist(list);
      setAutopickEnabled(autopick);
    } catch (err) {
      console.error("Errore caricamento dati autopick:", err);
      toast.error("Errore nel caricamento della graduatoria autopick");
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Gestione Switch Autopick
  const handleToggleAutopick = async (checked: boolean) => {
    setSavingAutopick(true);
    setAutopickEnabled(checked);
    try {
      const res = await setAutopickSetting(teamId, checked);
      if (res.success) {
        toast.success(
          checked
            ? "🤖 Autopick attivato! In caso di assenza, il sistema sceglierà automaticamente."
            : "Autopick disattivato per questa squadra."
        );
      } else {
        toast.error("Errore salvataggio impostazione autopick: " + res.error);
        setAutopickEnabled(!checked);
      }
    } catch {
      toast.error("Errore durante il salvataggio");
      setAutopickEnabled(!checked);
    } finally {
      setSavingAutopick(false);
    }
  };

  // Sposta elemento in graduatoria (Su / Giù)
  const handleMove = async (rookieId: number, direction: "up" | "down") => {
    const res = await moveWishlistItem(teamId, rookieId, direction);
    if (res.success) {
      await loadData();
      onWishlistUpdated?.();
    } else {
      toast.error(res.error || "Errore spostamento elemento");
    }
  };

  // Rimuovi singolo elemento
  const handleRemove = async (rookieId: number) => {
    const res = await removeFromWishlist(teamId, rookieId);
    if (res.success) {
      toast.info("Calciatore rimosso dalla graduatoria");
      await loadData();
      onWishlistUpdated?.();
    } else {
      toast.error(res.error || "Errore rimozione elemento");
    }
  };

  // Svuota l'intera graduatoria
  const handleClear = async () => {
    if (wishlist.length === 0) return;
    if (!window.confirm("Sei sicuro di voler svuotare l'intera graduatoria di priorità?")) {
      return;
    }
    const res = await clearWishlist(teamId);
    if (res.success) {
      toast.info("Graduatoria svuotata con successo");
      setWishlist([]);
      onWishlistUpdated?.();
    } else {
      toast.error(res.error || "Errore svuotamento graduatoria");
    }
  };

  // Aggiungi manualmente un calciatore cercato (Rookie o Svincolato)
  const handleAddPlayer = async (player: Player, isFreeAgent: boolean) => {
    const res = await addToWishlist(teamId, Number(player.ID));
    if (res.success) {
      toast.success(`${player.Nome} ${player.Cognome} (${isFreeAgent ? "Svincolato" : "Rookie"}) aggiunto in fondo alla graduatoria!`);
      setSearchQuery("");
      await loadData();
      onWishlistUpdated?.();
    } else {
      toast.error(res.error || "Errore aggiunta calciatore");
    }
  };

  // Set di ID attualmente in graduatoria
  const wishlistIdsSet = useMemo(() => new Set(wishlist.map((w) => w.rookie_id)), [wishlist]);

  // Candidati per l'aggiunta manuale (Rookie e Svincolati)
  const candidatePool = useMemo(() => {
    const list: Array<{ player: Player; isFreeAgent: boolean }> = [];
    if (poolTypeFilter === "ALL" || poolTypeFilter === "ROOKIE") {
      allRookies.forEach((r) => {
        if (!wishlistIdsSet.has(Number(r.ID))) {
          list.push({ player: r, isFreeAgent: false });
        }
      });
    }
    if (poolTypeFilter === "ALL" || poolTypeFilter === "FREE_AGENT") {
      (allFreeAgents || []).forEach((fa) => {
        if (!wishlistIdsSet.has(Number(fa.ID))) {
          list.push({ player: fa, isFreeAgent: true });
        }
      });
    }
    return list;
  }, [allRookies, allFreeAgents, wishlistIdsSet, poolTypeFilter]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim() && roleFilter === "ALL" && poolTypeFilter === "ALL") return [];

    return candidatePool
      .filter(({ player: p }) => {
        if (roleFilter !== "ALL") {
          const group = ROLE_GROUPS.find((g) => g.id === roleFilter);
          if (group && group.roles && !group.roles.includes(p.Posiz)) return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const fullName = `${p.Nome} ${p.Cognome} ${p.Posiz}`.toLowerCase();
          return fullName.includes(q);
        }
        return true;
      })
      .slice(0, 16);
  }, [candidatePool, searchQuery, roleFilter, poolTypeFilter]);

  return (
    <div className="space-y-6">
      {/* =================================================================== */}
      {/* 1. HERO CARD: AUTOPICK PER ASSENZA (SETTING CENTRALE)               */}
      {/* =================================================================== */}
      <Card className="border border-border/80 shadow-md bg-gradient-to-br from-card via-card to-emerald-500/[0.04] overflow-hidden">
        <CardHeader className="p-5 pb-4 border-b border-border/70">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div
                className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                  autopickEnabled
                    ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 shadow-md shadow-emerald-500/10"
                    : "bg-muted border border-border text-muted-foreground"
                }`}
              >
                <Bot className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <CardTitle className="text-lg font-black tracking-tight text-foreground">
                    Autopick per Assenza la sera del Draft
                  </CardTitle>
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                      autopickEnabled
                        ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/50"
                        : "bg-muted text-muted-foreground border-border"
                    }`}
                  >
                    {autopickEnabled ? "ATTIVO" : "DISATTIVATO"}
                  </Badge>
                  {teamFullName && (
                    <Badge variant="secondary" className="text-[10px] font-mono">
                      {teamFullName} ({teamId})
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Se abilitato, durante la serata del Draft il sito effettuerà in automatico la scelta per la tua squadra seguendo la graduatoria di priorità.
                </CardDescription>
              </div>
            </div>

            {/* Switch on/off */}
            <div className="flex items-center gap-3 self-end md:self-auto bg-muted/40 p-2.5 rounded-xl border border-border/80 shrink-0">
              <Label
                htmlFor="autopick-main-toggle"
                className="text-xs font-bold cursor-pointer select-none"
              >
                {autopickEnabled ? "Autopick Abilitato" : "Autopick Disattivato"}
              </Label>
              <Switch
                id="autopick-main-toggle"
                checked={autopickEnabled}
                onCheckedChange={handleToggleAutopick}
                disabled={savingAutopick || !teamId}
              />
            </div>
          </div>
        </CardHeader>

        {/* Informazioni sulle regole di fallback approvate */}
        <CardContent className="p-4 bg-muted/15 text-xs text-muted-foreground space-y-1.5 border-t border-border/50">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold text-foreground">Come funziona l'algoritmo di selezione:</span>
              <ul className="list-disc list-inside mt-1 space-y-0.5 pl-1">
                <li>
                  <strong className="text-foreground">Scelta 1:</strong> Quando è il tuo turno, il sistema scorre la tua graduatoria dal <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">Rank #1</span> in giù e assegna il primo rookie ancora non draftato da altri.
                </li>
                <li>
                  <strong className="text-foreground">Fallback A (Approvato):</strong> Se tutti i giocatori in graduatoria sono già stati selezionati nei turni precedenti (o se la lista è vuota), il sistema assegna in automatico il rookie rimasto disponibile con l'<strong className="text-foreground">Overall (OVR) più alto</strong>.
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* =================================================================== */}
      {/* 3. RICERCA E AGGIUNTA MANUALE DI ROOKIE / SVINCOLATI ALLA CODA    */}
      {/* =================================================================== */}
      <Card className="border border-border/80 shadow-sm bg-card">
        <CardHeader className="p-4 pb-3 border-b border-border/70">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-emerald-500" />
              <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                Aggiungi Rookie o Svincolato alla Graduatoria
              </CardTitle>
            </div>
            <span className="text-[11px] text-muted-foreground">
              I nuovi profili vengono inseriti in fondo alla coda
            </span>
          </div>

          <div className="mt-2.5 flex flex-col lg:flex-row items-stretch lg:items-center gap-2">
            <div className="relative flex-1">
              <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Cerca per nome, cognome o ruolo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 pl-9 text-xs"
              />
            </div>

            {/* Filtro Pool: Tutti / Rookie / Svincolati */}
            <div className="flex items-center gap-1 p-0.5 bg-muted/60 rounded-lg border border-border/70 shrink-0">
              <button
                type="button"
                onClick={() => setPoolTypeFilter("ALL")}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                  poolTypeFilter === "ALL"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Tutti
              </button>
              <button
                type="button"
                onClick={() => setPoolTypeFilter("ROOKIE")}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                  poolTypeFilter === "ROOKIE"
                    ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Rookie
              </button>
              <button
                type="button"
                onClick={() => setPoolTypeFilter("FREE_AGENT")}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                  poolTypeFilter === "FREE_AGENT"
                    ? "bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/40 shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Svincolati
              </button>
            </div>

            {/* Filtro Ruoli */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 flex-wrap lg:flex-nowrap">
              {ROLE_GROUPS.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setRoleFilter(g.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 ${
                    roleFilter === g.id
                      ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40"
                      : "bg-muted/60 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {g.label}
                </button>
              ))}

              {wishlist.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClear}
                  className="h-7.5 px-2.5 text-xs font-bold gap-1 text-muted-foreground hover:text-destructive hover:border-destructive/40 shrink-0 ml-auto sm:ml-1"
                  title="Svuota l'intera graduatoria"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Svuota</span>
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        {/* Risultati della ricerca */}
        {searchResults.length > 0 && (
          <CardContent className="p-3 bg-muted/20 border-b border-border/50 divide-y divide-border/50">
            <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-2 py-1 flex items-center justify-between">
              <span>Risultati trovati ({searchResults.length})</span>
              <span className="text-[10px] normal-case text-muted-foreground">
                Clicca su "+ Aggiungi" per inserire in fondo alla graduatoria
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2">
              {searchResults.map(({ player: p, isFreeAgent }) => {
                const pId = Number(p.ID);
                const tokens = isFreeAgent ? 0 : (scoutingTokensByRookie[pId] ?? (p as any)?.tokens_spent ?? 0);

                return (
                  <div
                    key={p.ID}
                    className="p-2.5 rounded-xl border border-border/80 bg-card flex items-center justify-between gap-2 hover:border-emerald-500/40 transition-all shadow-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar className="h-9 w-9 rounded-lg border border-border shrink-0 bg-muted overflow-hidden">
                        <AvatarImage
                          src={getPlayerImage(pId)}
                          alt={`${p.Nome} ${p.Cognome}`}
                          className="object-cover object-top"
                        />
                        <AvatarFallback className="text-[10px] font-bold">
                          {p.Nome?.[0]}{p.Cognome?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] font-bold shrink-0 ${getRoleColor(p.Posiz)}`}
                      >
                        {p.Posiz}
                      </Badge>
                      <div className="min-w-0">
                        <div className="font-bold text-xs truncate flex items-center gap-1.5">
                          <span className="truncate">{p.Nome} {p.Cognome}</span>
                          {isFreeAgent ? (
                            <Badge variant="outline" className="text-[8.5px] px-1 py-0 h-3.5 bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30 font-bold shrink-0">
                              Svincolato
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[8.5px] px-1 py-0 h-3.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-bold shrink-0">
                              Rookie
                            </Badge>
                          )}
                        </div>
                        <div className="text-[10px] text-muted-foreground flex items-center gap-2">
                          <span>{p.Età} anni</span>
                          <span className="flex items-center gap-1 font-mono">
                            <img
                              src={getNationalityFlag(p.Nazionalità)}
                              alt={p.Nazionalità}
                              className="h-3 w-4.5 object-cover rounded-xs border border-border/60 shrink-0 inline-block"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                            <span>{p.Nazionalità}</span>
                          </span>
                          {!isFreeAgent && (
                            <Badge
                              variant="outline"
                              className={`font-mono text-[9.5px] font-extrabold px-1.5 py-0 ${getTierBadgeStyle(tokens)}`}
                            >
                              {tokens > 0 ? `${tokens} ${tokens === 1 ? "gettone" : "gettoni"}` : "0 gettoni"}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge
                        variant="outline"
                        className={`font-mono text-xs font-black ${getValueColor(Number(p.OVR) || 0)}`}
                      >
                        {isFreeAgent ? p.OVR : getOvrDisplayByTokens(p.OVR, tokens, p.Stelle).label}
                      </Badge>
                      <Button
                        type="button"
                        size="sm"
                        variant="default"
                        onClick={() => handleAddPlayer(p, isFreeAgent)}
                        className="h-7 px-2.5 text-xs font-bold gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Aggiungi</span>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        )}
      </Card>

      {/* =================================================================== */}
      {/* 4. LISTA GRADUATORIA ORDINATA                                      */}
      {/* =================================================================== */}
      {wishlist.length === 0 ? (
        <Card className="border border-border/70 border-dashed bg-muted/15 p-10 text-center">
          <div className="max-w-md mx-auto space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
              <ListOrdered className="h-6 w-6" />
            </div>
            <h4 className="font-extrabold text-base text-foreground">
              Nessun profilo in graduatoria
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Costruisci la tua lista di preferenza aggiungendo Rookie o Svincolati: in caso di assenza, il sistema sceglierà il primo profilo libero partendo dall'ordine che imposti qui.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1 text-xs text-muted-foreground font-semibold">
            <span>Calciatori in graduatoria ({wishlist.length})</span>
            <span className="text-[11px]">Ordinati per priorità di scelta</span>
          </div>
          {wishlist.map((item, index) => {
            const player =
              allRookies.find((r) => Number(r.ID) === Number(item.rookie_id)) ||
              (allFreeAgents || []).find((fa) => Number(fa.ID) === Number(item.rookie_id)) ||
              item.rookie;
            if (!player) return null;

            const pId = Number(item.rookie_id);
            const isFreeAgent = Boolean(
              (allFreeAgents || []).some((fa) => Number(fa.ID) === Number(pId)) ||
              (!allRookies.some((r) => Number(r.ID) === Number(pId)))
            );
            const isDrafted = Boolean(
              player.Squadra &&
              player.Squadra.trim() !== "" &&
              player.Squadra.toUpperCase() !== "SVINCOLATI" &&
              player.Squadra !== "-"
            );
            const tokens = isFreeAgent ? 0 : (scoutingTokensByRookie[pId] ?? (player as any)?.tokens_spent ?? 0);
            const topStats = !isFreeAgent && tokens > 0 ? getTopUnlockedAttributes(player, tokens, 5) : [];

            return (
              <div
                key={item.id}
                className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 shadow-xs ${
                  isDrafted
                    ? "bg-muted/30 border-border/50 opacity-60"
                    : "border-border/80 bg-card hover:border-emerald-500/40"
                }`}
              >
                {/* RANK E DETTAGLI CALCIATORE */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Numero di priorità (Rank) */}
                  <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-mono font-black text-sm shrink-0 shadow-xs">
                    #{index + 1}
                  </div>

                  {/* Avatar Calciatore */}
                  <Avatar className="h-9 w-9 rounded-lg border border-border shrink-0 bg-muted overflow-hidden">
                    <AvatarImage
                      src={getPlayerImage(pId)}
                      alt={`${player.Nome} ${player.Cognome}`}
                      className="object-cover object-top"
                    />
                    <AvatarFallback className="text-[10px] font-bold">
                      {player.Nome?.[0]}{player.Cognome?.[0]}
                    </AvatarFallback>
                  </Avatar>

                  {/* Ruolo */}
                  <Badge
                    variant="secondary"
                    className={`text-xs font-extrabold px-2 py-0.5 shrink-0 ${getRoleColor(player.Posiz)}`}
                  >
                    {player.Posiz}
                  </Badge>

                  {/* Anagrafica in linea */}
                  <div className="flex items-center gap-2.5 flex-wrap min-w-0">
                    <span className="font-extrabold text-sm truncate text-foreground">
                      {player.Nome} {player.Cognome}
                    </span>
                    {isFreeAgent ? (
                      <Badge variant="outline" className="text-[10px] bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30 font-bold shrink-0">
                        Svincolato
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-bold shrink-0">
                        Rookie
                      </Badge>
                    )}
                    {isDrafted ? (
                      <Badge variant="outline" className="text-[10px] bg-destructive/10 text-destructive border-destructive/30 font-bold shrink-0">
                        Draftato da {player.Squadra}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-bold shrink-0">
                        Disponibile
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground/60">•</span>
                    <span className="text-xs text-muted-foreground shrink-0">{player.Età} anni</span>
                    <span className="flex items-center gap-1 font-mono text-xs text-muted-foreground shrink-0">
                      <img
                        src={getNationalityFlag(player.Nazionalità)}
                        alt={player.Nazionalità}
                        className="h-3.5 w-5 object-cover rounded-xs border border-border/80 shrink-0 inline-block shadow-2xs"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                      <span>{player.Nazionalità}</span>
                    </span>
                    {!isFreeAgent && (
                      <Badge
                        variant="outline"
                        className={`font-mono text-[10px] font-extrabold px-1.5 py-0.5 shrink-0 ${getTierBadgeStyle(tokens)}`}
                      >
                        {tokens > 0 ? `${tokens} ${tokens === 1 ? "gettone" : "gettoni"}` : "0 gettoni"}
                      </Badge>
                    )}
                  </div>

                  {/* TOP 5 STATISTICHE SBLOCCATE (se rookie scoutato) */}
                  {!isFreeAgent && tokens > 0 && (
                    <div className="hidden md:flex items-center gap-1.5 ml-auto mr-3">
                      {topStats.map((st) => (
                        <div
                          key={st.code}
                          className="px-2 py-1 rounded-md bg-muted/50 border border-border/60 flex items-center gap-1.5 shrink-0 shadow-2xs"
                          title={`${st.label}: ${st.rangeLabel}`}
                        >
                          <span className="font-mono text-[10px] font-bold text-muted-foreground">
                            {st.code}
                          </span>
                          <span className={`font-mono text-xs font-black ${getValueColor(st.midpoint)}`}>
                            {st.rangeLabel}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* STATS E PULSANTI ORDINAMENTO */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* OVR */}
                  <div className="text-right hidden sm:block mr-2">
                    <div className="text-[10px] uppercase font-bold text-muted-foreground">OVR</div>
                    <div className={`font-mono font-black text-sm ${getValueColor(Number(player.OVR) || 0)}`}>
                      {isFreeAgent ? player.OVR : getOvrDisplayByTokens(player.OVR, tokens, player.Stelle).label}
                    </div>
                  </div>

                  {/* Ispeziona Giocatore */}
                  {isFreeAgent && onInspectFreeAgent && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => onInspectFreeAgent(player)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                      title="Apri scheda calciatore svincolato"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                  {!isFreeAgent && onInspectRookie && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => onInspectRookie(pId)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                      title="Apri scheda rookie nello Scouting"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}

                  {/* Frecce Su / Giù */}
                  <div className="flex items-center bg-muted/60 rounded-lg p-0.5 border border-border/80">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => handleMove(pId, "up")}
                      disabled={index === 0}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground disabled:opacity-30"
                      title="Sposta su"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => handleMove(pId, "down")}
                      disabled={index === wishlist.length - 1}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground disabled:opacity-30"
                      title="Sposta giù"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {/* Rimuovi */}
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemove(pId)}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    title="Rimuovi dalla graduatoria"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

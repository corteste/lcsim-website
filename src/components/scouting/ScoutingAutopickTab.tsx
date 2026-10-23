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
  addMultipleToWishlist,
  removeFromWishlist,
  moveWishlistItem,
  clearWishlist,
  fetchAutopickSetting,
  setAutopickSetting,
} from "@/services/draftWishlistService";
import { DraftWishlistItem } from "@/types/draftWishlist";
import { Player } from "@/types/player";
import { getRoleColor, getValueColor, getNationalityFlag } from "@/utils/functions";
import { renderStars } from "@/components/scouting/StarRating";
import { getTierFromTokens, getTierBadgeStyle } from "@/utils/scoutingConfig";

interface ScoutingAutopickTabProps {
  teamId: string;
  teamFullName?: string;
  allRookies: Player[];
  favoriteRookieIds: Set<number>;
  scoutingTokensByRookie?: Record<number, number>;
  onInspectRookie?: (rookieId: number) => void;
  onFavoritesUpdated?: () => void;
}

const ROLE_GROUPS = [
  { id: "ALL", label: "Tutti" },
  { id: "POR", label: "POR", roles: ["POR"] },
  { id: "DIF", label: "DIF", roles: ["DC", "TD", "TS"] },
  { id: "CEN", label: "CEN", roles: ["CDC", "CC", "ED", "ES", "COC"] },
  { id: "ATT", label: "ATT", roles: ["AD", "AS", "AT", "ATT"] },
];

export const ScoutingAutopickTab: React.FC<ScoutingAutopickTabProps> = ({
  teamId,
  teamFullName,
  allRookies,
  favoriteRookieIds,
  scoutingTokensByRookie = {},
  onInspectRookie,
  onFavoritesUpdated,
}) => {
  const [wishlist, setWishlist] = useState<DraftWishlistItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [autopickEnabled, setAutopickEnabled] = useState<boolean>(false);
  const [savingAutopick, setSavingAutopick] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);

  // Search and manual addition state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");

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
    } else {
      toast.error(res.error || "Errore spostamento elemento");
    }
  };

  // Rimuovi singolo elemento
  const handleRemove = async (rookieId: number) => {
    const res = await removeFromWishlist(teamId, rookieId);
    if (res.success) {
      toast.info("Rookie rimosso dalla graduatoria");
      await loadData();
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
    } else {
      toast.error(res.error || "Errore svuotamento graduatoria");
    }
  };

  // Importa tutti i rookie preferiti (⭐)
  const handleImportFavorites = async () => {
    if (favoriteRookieIds.size === 0) {
      toast.info("Non hai ancora nessun rookie tra i preferiti (⭐). Clicca sulla stella dei rookie per aggiungerli.");
      return;
    }

    setIsImporting(true);
    try {
      const ids = Array.from(favoriteRookieIds);
      const res = await addMultipleToWishlist(teamId, ids);
      if (res.count > 0) {
        toast.success(`Importati con successo ${res.count} rookie preferiti in fondo alla graduatoria!`);
        await loadData();
      } else {
        toast.info("Tutti i rookie preferiti sono già presenti nella tua graduatoria.");
      }
    } catch {
      toast.error("Errore durante l'importazione dei preferiti");
    } finally {
      setIsImporting(false);
    }
  };

  // Aggiungi manualmente un rookie cercato
  const handleAddRookie = async (rookie: Player) => {
    const res = await addToWishlist(teamId, Number(rookie.ID));
    if (res.success) {
      toast.success(`${rookie.Nome} ${rookie.Cognome} aggiunto in fondo alla graduatoria!`);
      setSearchQuery("");
      await loadData();
    } else {
      toast.error(res.error || "Errore aggiunta rookie");
    }
  };

  // Set di ID attualmente in graduatoria
  const wishlistIdsSet = useMemo(() => new Set(wishlist.map((w) => w.rookie_id)), [wishlist]);

  // Candidati per l'aggiunta manuale
  const searchResults = useMemo(() => {
    if (!searchQuery.trim() && roleFilter === "ALL") return [];

    return allRookies
      .filter((r) => !wishlistIdsSet.has(Number(r.ID)))
      .filter((r) => {
        if (roleFilter !== "ALL") {
          const group = ROLE_GROUPS.find((g) => g.id === roleFilter);
          if (group && group.roles && !group.roles.includes(r.Posiz)) return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const fullName = `${r.Nome} ${r.Cognome} ${r.Posiz}`.toLowerCase();
          return fullName.includes(q);
        }
        return true;
      })
      .slice(0, 10);
  }, [allRookies, wishlistIdsSet, searchQuery, roleFilter]);

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
      {/* 2. TOOLBAR E GESTIONE GRADUATORIA                                  */}
      {/* =================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-4 rounded-xl border border-border/80 shadow-sm">
        <div className="flex items-center gap-2.5">
          <ListOrdered className="h-5 w-5 text-emerald-500 shrink-0" />
          <div>
            <h3 className="font-extrabold text-sm text-foreground">
              Graduatoria Ordinata di Priorità
            </h3>
            <p className="text-xs text-muted-foreground">
              {wishlist.length === 0
                ? "Nessun prospetto in lista. Aggiungine o importa dai preferiti."
                : `${wishlist.length} ${wishlist.length === 1 ? "rookie in graduatoria" : "rookie in graduatoria (ordinati per priorità)"}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleImportFavorites}
            disabled={isImporting || favoriteRookieIds.size === 0}
            className="h-8 text-xs font-bold gap-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
            title="Importa tutti i rookie a cui hai assegnato la stella ⭐ nello Scouting o nel Draft"
          >
            <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
            <span>Importa dai Preferiti ({favoriteRookieIds.size})</span>
          </Button>

          {wishlist.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClear}
              className="h-8 text-xs font-bold gap-1 text-muted-foreground hover:text-destructive hover:border-destructive/40"
              title="Svuota l'intera graduatoria"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Svuota</span>
            </Button>
          )}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="h-8 px-2 text-xs text-muted-foreground"
            title="Ricarica lista dal server"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 3. RICERCA E AGGIUNTA MANUALE DI ROOKIE ALLA CODA                  */}
      {/* =================================================================== */}
      <Card className="border border-border/80 shadow-sm bg-card">
        <CardHeader className="p-4 pb-3 border-b border-border/70">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-emerald-500" />
              <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                Aggiungi Rookie alla Graduatoria
              </CardTitle>
            </div>
            <span className="text-[11px] text-muted-foreground">
              I nuovi rookie vengono inseriti in fondo alla coda
            </span>
          </div>

          <div className="mt-2.5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Cerca per nome, cognome o ruolo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 pl-9 text-xs"
              />
            </div>
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
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
              {searchResults.map((r) => {
                const rId = Number(r.ID);
                const tokens = scoutingTokensByRookie[rId] || 0;
                const isFav = favoriteRookieIds.has(rId);

                return (
                  <div
                    key={r.ID}
                    className="p-2.5 rounded-xl border border-border/80 bg-card flex items-center justify-between gap-2 hover:border-emerald-500/40 transition-all shadow-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge
                        variant="secondary"
                        className={`text-[10px] font-bold shrink-0 ${getRoleColor(r.Posiz)}`}
                      >
                        {r.Posiz}
                      </Badge>
                      <div className="min-w-0">
                        <div className="font-bold text-xs truncate flex items-center gap-1">
                          <span>{r.Nome} {r.Cognome}</span>
                          {isFav && (
                            <Star className="h-3 w-3 fill-amber-500 text-amber-500 shrink-0 inline" />
                          )}
                        </div>
                        <div className="text-[10px] text-muted-foreground flex items-center gap-2">
                          <span>{r.Età} anni</span>
                          <span>{getNationalityFlag(r.Nazionalità)} {r.Nazionalità}</span>
                          {tokens > 0 && (
                            <span className="text-amber-500 font-bold flex items-center gap-0.5">
                              {renderStars(tokens)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge
                        variant="outline"
                        className={`font-mono text-xs font-black ${getValueColor(Number(r.OVR) || 0)}`}
                      >
                        {r.OVR}
                      </Badge>
                      <Button
                        type="button"
                        size="sm"
                        variant="default"
                        onClick={() => handleAddRookie(r)}
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
              Nessun rookie in graduatoria
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Costruisci la tua lista di preferenza: in caso di assenza, il sistema sceglierà il primo rookie libero partendo dall'ordine che imposti qui.
            </p>
            <div className="pt-2 flex items-center justify-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleImportFavorites}
                disabled={favoriteRookieIds.size === 0}
                className="text-xs font-bold gap-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/40 hover:bg-amber-500/20"
              >
                <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                <span>Importa dai Preferiti ({favoriteRookieIds.size})</span>
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {wishlist.map((item, index) => {
            const rookie = item.rookie;
            if (!rookie) return null;

            const rId = item.rookie_id;
            const isDrafted = Boolean(rookie.Squadra);
            const tokens = scoutingTokensByRookie[rId] || 0;
            const isFav = favoriteRookieIds.has(rId);

            return (
              <div
                key={item.id}
                className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 shadow-xs ${
                  isDrafted
                    ? "bg-muted/30 border-border/50 opacity-60"
                    : "bg-card border-border hover:border-emerald-500/40"
                }`}
              >
                {/* RANK E DETTAGLI ROOKIE */}
                <div className="flex items-center gap-3 min-w-0">
                  {/* Numero di priorità (Rank) */}
                  <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-mono font-black text-sm shrink-0 shadow-xs">
                    #{index + 1}
                  </div>

                  {/* Ruolo */}
                  <Badge
                    variant="secondary"
                    className={`text-xs font-extrabold px-2 py-0.5 shrink-0 ${getRoleColor(rookie.Posiz)}`}
                  >
                    {rookie.Posiz}
                  </Badge>

                  {/* Anagrafica */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm truncate text-foreground">
                        {rookie.Nome} {rookie.Cognome}
                      </span>
                      {isFav && (
                        <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500 shrink-0" />
                      )}
                      {isDrafted ? (
                        <Badge variant="outline" className="text-[10px] bg-destructive/10 text-destructive border-destructive/30 font-bold shrink-0">
                          Draftato da {rookie.Squadra}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-bold shrink-0">
                          Disponibile
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 text-xs text-muted-foreground mt-0.5">
                      <span>{rookie.Età} anni</span>
                      <span>{getNationalityFlag(rookie.Nazionalità)} {rookie.Nazionalità}</span>
                      {tokens > 0 ? (
                        <span className="text-amber-500 font-bold flex items-center gap-1">
                          Scouting: {renderStars(tokens)}
                        </span>
                      ) : (
                        <span className="text-[10px] italic text-muted-foreground/70">
                          Non scoutato
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* STATS E PULSANTI ORDINAMENTO */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* OVR */}
                  <div className="text-right hidden sm:block mr-2">
                    <div className="text-[10px] uppercase font-bold text-muted-foreground">OVR</div>
                    <div className={`font-mono font-black text-sm ${getValueColor(Number(rookie.OVR) || 0)}`}>
                      {rookie.OVR}
                    </div>
                  </div>

                  {/* Ispeziona Rookie nello Scouting */}
                  {onInspectRookie && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => onInspectRookie(rId)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                      title="Apri scheda rookie"
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
                      onClick={() => handleMove(rId, "up")}
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
                      onClick={() => handleMove(rId, "down")}
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
                    onClick={() => handleRemove(rId)}
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

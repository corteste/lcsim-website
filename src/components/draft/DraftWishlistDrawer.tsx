import React, { useState, useEffect, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  ListOrdered,
  Star,
  ArrowUp,
  ArrowDown,
  Trash2,
  Plus,
  Search,
  Bot,
  Sparkles,
  Info,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
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
import { getRoleColor, getValueColor } from "@/utils/functions";

interface DraftWishlistDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  teamFullName?: string;
  availableRookies: Player[];
  favoriteRookieIds: Set<number>;
  onWishlistChanged?: () => void;
}

export const DraftWishlistDrawer: React.FC<DraftWishlistDrawerProps> = ({
  open,
  onOpenChange,
  teamId,
  teamFullName,
  availableRookies,
  favoriteRookieIds,
  onWishlistChanged,
}) => {
  const [wishlist, setWishlist] = useState<DraftWishlistItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [autopickEnabled, setAutopickEnabled] = useState<boolean>(false);
  const [searchRookieQuery, setSearchRookieQuery] = useState<string>("");
  const [isImporting, setIsImporting] = useState<boolean>(false);

  // Carica la wishlist e l'impostazione autopick
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
      console.error("Errore caricamento wishlist:", err);
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open, loadData]);

  // Gestione Toggle Autopick
  const handleToggleAutopick = async (checked: boolean) => {
    setAutopickEnabled(checked);
    const res = await setAutopickSetting(teamId, checked);
    if (res.success) {
      toast.success(
        checked
          ? "🤖 Autopick attivato! Se sarai assente, la selezione avverrà automaticamente."
          : "Autopick disattivato. Dovrai scegliere manualmente al tuo turno."
      );
      onWishlistChanged?.();
    } else {
      toast.error("Errore aggiornamento impostazione autopick: " + res.error);
      setAutopickEnabled(!checked);
    }
  };

  // Sposta in su o in giù
  const handleMove = async (rookieId: number, direction: "up" | "down") => {
    const res = await moveWishlistItem(teamId, rookieId, direction);
    if (res.success) {
      await loadData();
      onWishlistChanged?.();
    } else {
      toast.error(res.error || "Errore spostamento");
    }
  };

  // Rimuovi singolo elemento
  const handleRemove = async (rookieId: number) => {
    const res = await removeFromWishlist(teamId, rookieId);
    if (res.success) {
      toast.info("Rookie rimosso dalla graduatoria");
      await loadData();
      onWishlistChanged?.();
    } else {
      toast.error(res.error || "Errore rimozione");
    }
  };

  // Svuota lista
  const handleClear = async () => {
    if (wishlist.length === 0) return;
    const res = await clearWishlist(teamId);
    if (res.success) {
      toast.info("Graduatoria svuotata");
      setWishlist([]);
      onWishlistChanged?.();
    }
  };

  // Importa dai preferiti
  const handleImportFavorites = async () => {
    if (favoriteRookieIds.size === 0) {
      toast.info("Non hai ancora salvato nessun rookie tra i preferiti (⭐).");
      return;
    }

    setIsImporting(true);
    try {
      const ids = Array.from(favoriteRookieIds);
      const res = await addMultipleToWishlist(teamId, ids);
      if (res.count > 0) {
        toast.success(`Aggiunti ${res.count} rookie dai preferiti alla tua lista!`);
        await loadData();
        onWishlistChanged?.();
      } else {
        toast.info("Tutti i rookie preferiti sono già presenti nella tua graduatoria.");
      }
    } finally {
      setIsImporting(false);
    }
  };

  // Aggiungi manualmente un rookie dalla ricerca
  const handleAddRookie = async (rookie: Player) => {
    const res = await addToWishlist(teamId, Number(rookie.ID));
    if (res.success) {
      toast.success(`${rookie.Nome} ${rookie.Cognome} aggiunto in coda alla lista!`);
      setSearchRookieQuery("");
      await loadData();
      onWishlistChanged?.();
    } else {
      toast.error(res.error || "Errore aggiunta rookie");
    }
  };

  // Set di ID già in wishlist
  const wishlistIdsSet = new Set(wishlist.map((w) => w.rookie_id));

  // Rookie disponibili filtrati per la ricerca interna
  const searchResults = searchRookieQuery.trim()
    ? availableRookies
        .filter((r) => !wishlistIdsSet.has(Number(r.ID)))
        .filter(
          (r) =>
            r.Nome.toLowerCase().includes(searchRookieQuery.toLowerCase()) ||
            r.Cognome.toLowerCase().includes(searchRookieQuery.toLowerCase()) ||
            r.Posiz.toLowerCase().includes(searchRookieQuery.toLowerCase())
        )
        .slice(0, 8)
    : [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl p-0 flex flex-col justify-between bg-card overflow-hidden"
      >
        {/* =================================================================== */}
        {/* HEADER CASSETTO                                                     */}
        {/* =================================================================== */}
        <div className="p-5 border-b border-border/80 bg-muted/20">
          <SheetHeader className="text-left">
            <div className="flex items-center justify-between gap-2">
              <SheetTitle className="flex items-center gap-2 text-lg font-black text-foreground">
                <ListOrdered className="h-5 w-5 text-emerald-500" />
                <span>Lista Priorità Draft & Autopick</span>
              </SheetTitle>
              <Badge variant="outline" className="text-[10px] font-mono font-bold">
                {teamFullName || teamId}
              </Badge>
            </div>
            <SheetDescription className="text-xs text-muted-foreground">
              Ordina la graduatoria dei rookie desiderati. In caso di tua assenza durante il turno,
              il sistema selezionerà in automatico il primo rookie disponibile da questa lista.
            </SheetDescription>
          </SheetHeader>

          {/* BOX TOGGLE AUTOPICK */}
          <div className="mt-4 p-3.5 rounded-xl border border-border/80 bg-card flex items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-xl transition-colors ${
                  autopickEnabled
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <Bot className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <Label
                    htmlFor="autopick-toggle"
                    className="text-xs font-black cursor-pointer text-foreground"
                  >
                    Autopick per Assenza
                  </Label>
                  <span
                    className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${
                      autopickEnabled
                        ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {autopickEnabled ? "ATTIVO" : "DISATTIVATO"}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  {autopickEnabled
                    ? "Se sarai assente, il bot sceglierà per te seguendo l'ordine sottostante."
                    : "Attiva se sai di non poter presenziare alla serata del Draft."}
                </p>
              </div>
            </div>

            <Switch
              id="autopick-toggle"
              checked={autopickEnabled}
              onCheckedChange={handleToggleAutopick}
            />
          </div>
        </div>

        {/* =================================================================== */}
        {/* TOOLBAR: IMPORTA DAI PREFERITI & CERCA ROOKIE                       */}
        {/* =================================================================== */}
        <div className="p-4 border-b border-border/70 bg-card space-y-3">
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleImportFavorites}
              disabled={isImporting || favoriteRookieIds.size === 0}
              className="h-8 text-xs font-bold border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
            >
              <Star className="h-3.5 w-3.5 mr-1.5 fill-amber-500 text-amber-500" />
              Importa Preferiti ({favoriteRookieIds.size})
            </Button>

            {wishlist.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-8 text-xs text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Svuota Lista
              </Button>
            )}
          </div>

          {/* Campo di ricerca per inserire un rookie alla volta */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Cerca un rookie da aggiungere alla graduatoria..."
              value={searchRookieQuery}
              onChange={(e) => setSearchRookieQuery(e.target.value)}
              className="pl-8 text-xs h-8.5 rounded-xl bg-muted/40"
            />
          </div>

          {/* Dropdown Risultati Ricerca */}
          {searchResults.length > 0 && (
            <div className="rounded-xl border border-border/80 bg-popover shadow-lg max-h-48 overflow-y-auto divide-y divide-border/60">
              {searchResults.map((r) => (
                <div
                  key={r.ID}
                  className="p-2 flex items-center justify-between hover:bg-muted/50 transition-colors text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Badge
                      variant="outline"
                      className={`text-[9px] font-black px-1.5 py-0 ${getRoleColor(r.Posiz)}`}
                    >
                      {r.Posiz}
                    </Badge>
                    <span className="font-bold text-foreground truncate">
                      {r.Nome} {r.Cognome}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      OVR {r.OVR ?? "?"}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleAddRookie(r)}
                    className="h-7 px-2 text-xs font-bold text-emerald-600 hover:bg-emerald-500/10"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Aggiungi
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* =================================================================== */}
        {/* CORPO: LISTA DEI ROOKIE ORDINATA                                    */}
        {/* =================================================================== */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              Caricamento graduatoria...
            </div>
          ) : wishlist.length === 0 ? (
            <div className="py-12 px-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                <ListOrdered className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-bold text-foreground">Nessun rookie in graduatoria</h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                Aggiungi i tuoi prospetti ideali o clicca su{" "}
                <strong>"Importa Preferiti"</strong> per pre-caricare i rookie che hai salvato con
                la stellina.
              </p>
              <div className="pt-2">
                <div className="inline-flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20">
                  <Info className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    <strong>Fallback A:</strong> se la lista è vuota, l'autopick sceglierà il
                    miglior rookie per OVR.
                  </span>
                </div>
              </div>
            </div>
          ) : (
            wishlist.map((item, index) => {
              const r = item.rookie;
              const isAvailable = availableRookies.some((ar) => Number(ar.ID) === item.rookie_id);

              return (
                <div
                  key={item.rookie_id}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                    isAvailable
                      ? "bg-card border-border/80 hover:border-emerald-500/40"
                      : "bg-muted/40 border-border/40 opacity-50"
                  }`}
                >
                  {/* Rank e Dati Giocatore */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="font-black text-xs font-mono w-6 text-center text-muted-foreground shrink-0">
                      #{index + 1}
                    </span>

                    {r ? (
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge
                            variant="outline"
                            className={`text-[9px] font-black px-1.5 py-0 ${getRoleColor(
                              r.Posiz
                            )}`}
                          >
                            {r.Posiz}
                          </Badge>
                          <span className="font-extrabold text-xs text-foreground truncate">
                            {r.Nome} {r.Cognome}
                          </span>
                          {!isAvailable && (
                            <Badge
                              variant="secondary"
                              className="text-[8px] uppercase tracking-wider px-1 py-0 bg-muted text-muted-foreground"
                            >
                              Già Draftato
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                          <span>
                            OVR:{" "}
                            <strong className={getValueColor(r.OVR ?? 0)}>{r.OVR ?? "?"}</strong>
                          </span>
                          <span>• Età: {r.Età || "?"}</span>
                          <span>• {r.Nazionalità || ""}</span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Rookie #{item.rookie_id}
                      </span>
                    )}
                  </div>

                  {/* Pulsanti Ordinamento e Rimozione */}
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleMove(item.rookie_id, "up")}
                      disabled={index === 0}
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      title="Sposta in alto"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleMove(item.rookie_id, "down")}
                      disabled={index === wishlist.length - 1}
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      title="Sposta in basso"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemove(item.rookie_id)}
                      className="h-7 w-7 text-muted-foreground hover:text-rose-500"
                      title="Rimuovi"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* =================================================================== */}
        {/* FOOTER INFORMATIVO SUL FALLBACK                                     */}
        {/* =================================================================== */}
        <div className="p-3 border-t border-border/80 bg-muted/20 text-[11px] text-muted-foreground flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            <span>
              Regola Fallback A: se tutti i rookie della lista sono già stati draftati, il bot
              seleziona il miglior rookie per Overall (OVR).
            </span>
          </div>
          <Badge variant="outline" className="text-[10px] font-mono shrink-0">
            {wishlist.length} in lista
          </Badge>
        </div>
      </SheetContent>
    </Sheet>
  );
};

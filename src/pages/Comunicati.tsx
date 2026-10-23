import React, { useState, useEffect, useMemo } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Megaphone,
  Pin,
  Sparkles,
  Clock,
  Search,
  Plus,
  Trash2,
  Edit3,
  CheckCheck,
  CheckCircle2,
  AlertTriangle,
  Radio,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  fetchAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  markAnnouncementAsRead,
  markAllAnnouncementsAsRead,
} from "@/services/announcementsService";
import {
  LeagueAnnouncement,
  AnnouncementCategory,
  AnnouncementPriority,
  ANNOUNCEMENT_CATEGORIES,
  ANNOUNCEMENT_PRIORITIES,
} from "@/types/announcements";
import { toast } from "sonner";

export default function Comunicati() {
  const { user, isAdmin } = useAuth();
  const userKey = user?.id || user?.username || user?.team || undefined;

  const [announcements, setAnnouncements] = useState<LeagueAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Admin Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LeagueAnnouncement | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<AnnouncementCategory>("generale");
  const [priority, setPriority] = useState<AnnouncementPriority>("normal");
  const [isPinned, setIsPinned] = useState(false);
  const [isBanner, setIsBanner] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchAnnouncements(userKey);
    setAnnouncements(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [userKey]);

  const unreadList = useMemo(
    () => announcements.filter((a) => !a.is_read),
    [announcements]
  );

  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((a) => {
      if (selectedCategory !== "ALL" && a.category !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = a.title.toLowerCase().includes(q);
        const matchContent = a.content.toLowerCase().includes(q);
        if (!matchTitle && !matchContent) return false;
      }
      return true;
    });
  }, [announcements, selectedCategory, searchQuery]);

  const handleMarkRead = async (ann: LeagueAnnouncement) => {
    if (ann.is_read) return;
    await markAnnouncementAsRead(ann.id, userKey);
    setAnnouncements((prev) =>
      prev.map((item) => (item.id === ann.id ? { ...item, is_read: true } : item))
    );
    window.dispatchEvent(new Event("lcsim-notifications-updated"));
  };

  const handleMarkAllRead = async () => {
    const ids = unreadList.map((a) => a.id);
    if (ids.length === 0) return;
    await markAllAnnouncementsAsRead(ids, userKey);
    setAnnouncements((prev) => prev.map((item) => ({ ...item, is_read: true })));
    window.dispatchEvent(new Event("lcsim-notifications-updated"));
    toast.success("Tutti i comunicati sono stati segnati come letti.");
  };

  // Admin: Open create modal
  const handleOpenCreate = () => {
    setEditingItem(null);
    setTitle("");
    setContent("");
    setCategory("generale");
    setPriority("normal");
    setIsPinned(false);
    setIsBanner(false);
    setModalOpen(true);
  };

  // Admin: Open edit modal
  const handleOpenEdit = (ann: LeagueAnnouncement) => {
    setEditingItem(ann);
    setTitle(ann.title);
    setContent(ann.content);
    setCategory(ann.category);
    setPriority(ann.priority);
    setIsPinned(ann.is_pinned);
    setIsBanner(ann.is_banner);
    setModalOpen(true);
  };

  const handleSaveAnnouncement = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Inserisci sia il titolo che il testo del comunicato.");
      return;
    }

    setSaving(true);
    if (editingItem) {
      const res = await updateAnnouncement(editingItem.id, {
        title,
        content,
        category,
        priority,
        is_pinned: isPinned,
        is_banner: isBanner,
      });
      setSaving(false);
      if (res.success) {
        toast.success("Comunicato aggiornato con successo!");
        setModalOpen(false);
        loadData();
        window.dispatchEvent(new Event("lcsim-notifications-updated"));
      } else {
        toast.error(res.error || "Errore durante l'aggiornamento.");
      }
    } else {
      const res = await createAnnouncement({
        title,
        content,
        category,
        priority,
        is_pinned: isPinned,
        is_banner: isBanner,
        author_name: user?.name || "Commissione Lega LCSIM",
      });
      setSaving(false);
      if (res.success) {
        toast.success("Comunicato ufficiale pubblicato a tutta la Lega!");
        setModalOpen(false);
        loadData();
        window.dispatchEvent(new Event("lcsim-notifications-updated"));
      } else {
        toast.error(res.error || "Errore durante la pubblicazione.");
      }
    }
  };

  const handleTogglePin = async (ann: LeagueAnnouncement) => {
    const res = await updateAnnouncement(ann.id, { is_pinned: !ann.is_pinned });
    if (res.success) {
      toast.success(ann.is_pinned ? "Comunicato rimosso dai fissati." : "Comunicato fissato in alto!");
      loadData();
    }
  };

  const handleToggleBanner = async (ann: LeagueAnnouncement) => {
    const res = await updateAnnouncement(ann.id, { is_banner: !ann.is_banner });
    if (res.success) {
      toast.success(
        ann.is_banner
          ? "Banner globale disattivato."
          : "Comunicato attivato come Banner Globale in cima al sito!"
      );
      loadData();
      window.dispatchEvent(new Event("lcsim-notifications-updated"));
    }
  };

  const handleDelete = async (ann: LeagueAnnouncement) => {
    if (!window.confirm(`Sei sicuro di voler eliminare il comunicato "${ann.title}"?`)) return;
    const res = await deleteAnnouncement(ann.id);
    if (res.success) {
      toast.info("Comunicato eliminato.");
      loadData();
      window.dispatchEvent(new Event("lcsim-notifications-updated"));
    } else {
      toast.error(res.error || "Impossibile eliminare il comunicato.");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        {/* HERO HEADER */}
        <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-card via-card/90 to-muted/40 p-6 md:p-8 shadow-xl mb-8">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center border border-amber-500/30 shadow-inner">
                <Megaphone className="h-8 w-8 md:h-10 md:w-10" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-500 font-mono">
                    LCSIM Serie A · Organo Ufficiale
                  </span>
                  <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] font-bold">
                    Bacheca Lega
                  </Badge>
                </div>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight">
                  Comunicati Ufficiali & Avvisi di Lega
                </h1>
                <p className="text-xs md:text-sm text-muted-foreground mt-1 max-w-2xl">
                  Tutte le decisioni ufficiali della Commissione, aggiornamenti al regolamento, scadenze di mercato e provvedimenti disciplinari.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={loadData}
                disabled={loading}
                className="h-10 text-xs font-bold"
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
                Aggiorna
              </Button>

              {unreadList.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAllRead}
                  className="h-10 text-xs font-bold text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                >
                  <CheckCheck className="h-4 w-4 mr-1.5" />
                  Segna tutti letti ({unreadList.length})
                </Button>
              )}

              {isAdmin && (
                <Button
                  size="sm"
                  onClick={handleOpenCreate}
                  className="h-10 text-xs font-black bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 px-4"
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Pubblica Comunicato
                </Button>
              )}
            </div>
          </div>

          {/* FILTERS & SEARCH */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mt-6 pt-6 border-t border-border/60">
            <Tabs
              value={selectedCategory}
              onValueChange={setSelectedCategory}
              className="w-full md:w-auto"
            >
              <TabsList className="bg-muted p-1 rounded-xl h-auto flex flex-wrap gap-1">
                <TabsTrigger value="ALL" className="text-xs font-bold py-1.5 px-3 rounded-lg">
                  Tutti ({announcements.length})
                </TabsTrigger>
                {(Object.keys(ANNOUNCEMENT_CATEGORIES) as AnnouncementCategory[]).map((cat) => (
                  <TabsTrigger
                    key={cat}
                    value={cat}
                    className="text-xs font-bold py-1.5 px-3 rounded-lg"
                  >
                    {ANNOUNCEMENT_CATEGORIES[cat].label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <div className="relative w-full md:w-64">
              <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Cerca nei comunicati..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 pl-9 text-xs bg-background/80"
              />
            </div>
          </div>
        </div>

        {/* ANNOUNCEMENTS FEED */}
        {loading ? (
          <div className="p-16 text-center text-xs text-muted-foreground">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground/40" />
            Caricamento comunicati ufficiali...
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          <div className="p-16 text-center rounded-3xl border border-dashed border-border bg-card/40">
            <Megaphone className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <h3 className="text-base font-bold">Nessun comunicato presente</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
              Non ci sono comunicazioni ufficiali per la categoria o i filtri selezionati.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAnnouncements.map((ann) => {
              const catCfg = ANNOUNCEMENT_CATEGORIES[ann.category] || ANNOUNCEMENT_CATEGORIES.generale;
              const prioCfg = ANNOUNCEMENT_PRIORITIES[ann.priority] || ANNOUNCEMENT_PRIORITIES.normal;

              return (
                <Card
                  key={ann.id}
                  onClick={() => handleMarkRead(ann)}
                  className={`overflow-hidden transition-all shadow-md ${
                    ann.is_pinned
                      ? "border-amber-500/50 bg-gradient-to-br from-amber-500/5 via-card to-card"
                      : !ann.is_read
                      ? "border-emerald-500/40 bg-card"
                      : "border-border/80 bg-card/90"
                  }`}
                >
                  <CardContent className="p-5 sm:p-6 flex flex-col gap-3">
                    {/* Top Metadata Bar */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {!ann.is_read && (
                          <Badge className="bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5">
                            NUOVO
                          </Badge>
                        )}
                        {ann.is_pinned && (
                          <Badge className="bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/40 text-[10px] font-bold flex items-center gap-1">
                            <Pin className="h-3 w-3" /> Fissato in Alto
                          </Badge>
                        )}
                        {ann.is_banner && (
                          <Badge className="bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 text-[10px] font-bold flex items-center gap-1">
                            <Radio className="h-3 w-3" /> Banner Globale Attivo
                          </Badge>
                        )}
                        <Badge className={`text-[10px] font-bold ${catCfg.badgeClass}`}>
                          {catCfg.label}
                        </Badge>
                        {ann.priority !== "normal" && (
                          <Badge className={`text-[10px] font-bold ${prioCfg.badgeClass}`}>
                            {prioCfg.label}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                        <Clock className="h-3.5 w-3.5" />
                        <span>
                          {new Date(ann.created_at).toLocaleDateString("it-IT", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Title & Body */}
                    <div className="pt-1">
                      <h2 className="text-lg sm:text-xl font-black tracking-tight text-foreground">
                        {ann.title}
                      </h2>
                      <div className="mt-2 text-xs sm:text-sm text-foreground/90 whitespace-pre-line leading-relaxed">
                        {ann.content}
                      </div>
                    </div>

                    {/* Footer: Author & Admin Controls */}
                    <div className="flex items-center justify-between flex-wrap gap-3 pt-3 mt-1 border-t border-border/60 text-xs">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="font-mono text-[11px]">
                          Firmato: <strong className="text-foreground">{ann.author_name}</strong>
                        </span>
                        {ann.is_read && (
                          <span className="text-[10px] text-emerald-500 flex items-center gap-1 font-semibold ml-2">
                            <CheckCircle2 className="h-3 w-3" /> Letto
                          </span>
                        )}
                      </div>

                      {isAdmin && (
                        <div
                          className="flex items-center gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleTogglePin(ann)}
                            className="h-7 text-[11px] font-bold"
                          >
                            <Pin className="h-3 w-3 mr-1" />
                            {ann.is_pinned ? "Sblocca" : "Fissa"}
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleBanner(ann)}
                            className={`h-7 text-[11px] font-bold ${
                              ann.is_banner ? "border-rose-500/40 text-rose-500" : ""
                            }`}
                          >
                            <Radio className="h-3 w-3 mr-1" />
                            {ann.is_banner ? "Togli Banner" : "Imposta Banner"}
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenEdit(ann)}
                            className="h-7 text-[11px] font-bold"
                          >
                            <Edit3 className="h-3 w-3 mr-1" /> Modifica
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(ann)}
                            className="h-7 text-[11px] font-bold text-rose-600 hover:bg-rose-500/10"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* ADMIN MODAL: CREATE / EDIT ANNOUNCEMENT */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl bg-card border-border/80 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black">
              {editingItem ? "Modifica Comunicato Ufficiale" : "Nuovo Comunicato Ufficiale di Lega"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Il comunicato sarà immediatamente visibile a tutti i manager della Serie A e notificato in tempo reale.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-bold mb-1.5 block">Titolo del Comunicato</label>
              <Input
                placeholder="Es. Apertura Sessione Scambi Stagione 11..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-xs font-semibold"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold mb-1.5 block">Categoria</label>
                <Select
                  value={category}
                  onValueChange={(v) => setCategory(v as AnnouncementCategory)}
                >
                  <SelectTrigger className="text-xs font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(ANNOUNCEMENT_CATEGORIES) as AnnouncementCategory[]).map((cat) => (
                      <SelectItem key={cat} value={cat} className="text-xs font-semibold">
                        {ANNOUNCEMENT_CATEGORIES[cat].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-bold mb-1.5 block">Livello di Priorità</label>
                <Select
                  value={priority}
                  onValueChange={(v) => setPriority(v as AnnouncementPriority)}
                >
                  <SelectTrigger className="text-xs font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(ANNOUNCEMENT_PRIORITIES) as AnnouncementPriority[]).map((p) => (
                      <SelectItem key={p} value={p} className="text-xs font-semibold">
                        {ANNOUNCEMENT_PRIORITIES[p].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold mb-1.5 block">Contenuto Ufficiale</label>
              <Textarea
                rows={6}
                placeholder="Scrivi qui il testo integrale del comunicato della Commissione di Lega..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="text-xs leading-relaxed"
              />
            </div>

            {/* Opzioni Evidenza */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div
                onClick={() => setIsPinned(!isPinned)}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                  isPinned
                    ? "bg-amber-500/15 border-amber-500/40"
                    : "bg-muted/30 border-border/60 hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Pin className={`h-4 w-4 ${isPinned ? "text-amber-500" : "text-muted-foreground"}`} />
                  <div>
                    <div className="text-xs font-bold">Fissa in Alto</div>
                    <div className="text-[10px] text-muted-foreground">
                      Mantieni in cima alla bacheca
                    </div>
                  </div>
                </div>
                <input type="checkbox" checked={isPinned} readOnly className="h-4 w-4 accent-amber-500" />
              </div>

              <div
                onClick={() => setIsBanner(!isBanner)}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                  isBanner
                    ? "bg-rose-500/15 border-rose-500/40"
                    : "bg-muted/30 border-border/60 hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Radio className={`h-4 w-4 ${isBanner ? "text-rose-500" : "text-muted-foreground"}`} />
                  <div>
                    <div className="text-xs font-bold">Banner Globale Sito</div>
                    <div className="text-[10px] text-muted-foreground">
                      Mostra avviso in cima a tutte le pagine
                    </div>
                  </div>
                </div>
                <input type="checkbox" checked={isBanner} readOnly className="h-4 w-4 accent-rose-500" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/60">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setModalOpen(false)}
              className="text-xs"
            >
              Annulla
            </Button>
            <Button
              size="sm"
              disabled={saving}
              onClick={handleSaveAnnouncement}
              className="text-xs font-black bg-amber-500 hover:bg-amber-400 text-slate-950 px-5"
            >
              {saving
                ? "Salvataggio..."
                : editingItem
                ? "Salva Modifiche"
                : "Pubblica Comunicato Ufficiale"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import React, { useState, useEffect, useMemo } from "react";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Inbox,
  Newspaper,
  Mic2,
  Sparkles,
  Flame,
  Laugh,
  HelpCircle,
  Radio,
  Send,
  RefreshCw,
  Clock,
  CheckCircle2,
  Search,
  Filter,
  MessageSquare,
  Zap,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  ArrowLeftRight,
  Swords,
  Trophy,
  Shield,
  ExternalLink,
  CornerDownRight,
  AlertCircle,
  User,
  MapPin,
  Calendar,
} from "lucide-react";
import { getTeamLogo } from "@/utils/functions";
import { supabase } from "@/supabaseClient";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import {
  fetchInboxFeed,
  InboxItem,
  InboxCategory,
} from "@/services/inboxService";
import {
  submitPressAnswer,
  submitConferenceReply,
  reactToRumor,
  generatePressQuestionsForMatchday,
  maybeTriggerRandomRumor,
  checkIsMarketOpen,
} from "@/services/aiJournalistService";

export default function SalaStampa() {
  const { user, isAdmin, effectiveTeam, availableTeams } = useAuth();
  const navigate = useNavigate();

  // Stato Feed & Notizie
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Filtri Inbox
  const [selectedCategory, setSelectedCategory] = useState<InboxCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [readItemIds, setReadItemIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem("lcsim_fm24_inbox_read");
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Stato Risposta Intervista Pending
  const [myAnswerText, setMyAnswerText] = useState("");
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);

  // Stato Repliche Sala Stampa (#69)
  const [replyDraft, setReplyDraft] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  // Amministrazione
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [isMarketOpen, setIsMarketOpen] = useState(true);

  // Caricamento Notizie Unificate
  const loadInbox = async () => {
    setLoading(true);
    try {
      maybeTriggerRandomRumor();
      const [feed, marketStatus] = await Promise.all([
        fetchInboxFeed({
          teamId: effectiveTeam,
          isAdmin,
          season: 11,
        }),
        checkIsMarketOpen(),
      ]);

      setItems(feed);
      setIsMarketOpen(marketStatus);

      // Seleziona la prima notizia di default su desktop
      setSelectedItemId((prev) => {
        if (prev && feed.some((it) => it.id === prev)) return prev;
        return feed[0]?.id || null;
      });
    } catch (err) {
      console.error("Errore caricamento Inbox FM24:", err);
      toast.error("Impossibile caricare l'Inbox delle notizie.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInbox();

    // Sottoscrizione realtime a nuove repliche o interviste
    const channel = supabase
      .channel("inbox-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "press_conference_replies" },
        () => loadInbox()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "press_conferences" },
        () => loadInbox()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "market_rumors" },
        () => loadInbox()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [effectiveTeam, isAdmin]);

  // Gestione Letto / Non Letto
  const markAsRead = (id: string) => {
    setReadItemIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev).add(id);
      try {
        localStorage.setItem("lcsim_fm24_inbox_read", JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  };

  const handleSelectItem = (id: string) => {
    setSelectedItemId(id);
    markAsRead(id);
  };

  // Notizia Selezionata
  const selectedItem = useMemo(() => {
    return items.find((it) => it.id === selectedItemId) || items[0] || null;
  }, [items, selectedItemId]);

  // Filtro Notizie
  const filteredItems = useMemo(() => {
    return items.filter((it) => {
      if (selectedCategory !== "all" && it.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = it.title.toLowerCase().includes(q);
        const matchesSender = it.senderName.toLowerCase().includes(q);
        const matchesSnippet = it.snippet.toLowerCase().includes(q);
        const matchesTeam = (it.senderTeamId || "").toLowerCase().includes(q);
        if (!matchesTitle && !matchesSender && !matchesSnippet && !matchesTeam) return false;
      }
      return true;
    });
  }, [items, selectedCategory, searchQuery]);

  // Conteggi per categoria
  const counts = useMemo(() => {
    const c = {
      all: items.length,
      trades: 0,
      press: 0,
      rumors: 0,
      preview: 0,
    };
    items.forEach((it) => {
      if (it.category in c) {
        c[it.category]++;
      }
    });
    return c;
  }, [items]);

  // Invio Risposta Intervista Ufficiale (Pending)
  const handleAnswerSubmit = async (conferenceId: number) => {
    if (!myAnswerText.trim()) {
      toast.error("Inserisci una dichiarazione valida prima di inviare.");
      return;
    }

    try {
      setIsSubmittingAnswer(true);
      const managerDisplayName =
        user?.name ||
        user?.username ||
        (effectiveTeam ? availableTeams.find((t) => (t.team_id || (t as any).id) === effectiveTeam)?.name : undefined) ||
        "Presidente";

      const res = await submitPressAnswer(conferenceId, myAnswerText.trim(), managerDisplayName);

      if (res.success) {
        toast.success("Dichiarazione ufficiale registrata e pubblicata in Sala Stampa!");
        setMyAnswerText("");
        await loadInbox();
      } else {
        toast.error(res.error || "Errore durante il salvataggio.");
      }
    } catch (err: any) {
      toast.error(err.message || "Errore imprevisto.");
    } finally {
      setIsSubmittingAnswer(false);
    }
  };

  // Invio Replica Presidente (#69)
  const handleReplySubmit = async (confId: number) => {
    const draft = replyDraft.trim();
    if (!draft) {
      toast.error("Inserisci una replica prima di inviare.");
      return;
    }
    if (!effectiveTeam) {
      toast.error("Devi possedere o selezionare una squadra per replicare.");
      return;
    }

    try {
      setIsSubmittingReply(true);
      const managerDisplayName =
        user?.name ||
        user?.username ||
        availableTeams.find((t) => (t.team_id || (t as any).id) === effectiveTeam)?.name ||
        "Presidente";

      const res = await submitConferenceReply(confId, effectiveTeam, draft, managerDisplayName);

      if (res.success) {
        toast.success("Replica ufficiale registrata!");
        setReplyDraft("");
        await loadInbox();
      } else {
        toast.error(res.error || "Errore durante l'invio della replica.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Errore durante l'invio della replica.");
    } finally {
      setIsSubmittingReply(false);
    }
  };

  // Reazione al Rumor
  const handleReaction = async (rumorId: number, type: "fire" | "laugh" | "shock" | "doubt") => {
    const res = await reactToRumor(rumorId, type);
    if (res.success && res.reactions) {
      setItems((prev) =>
        prev.map((it) => {
          if (it.rumorData && it.rumorData.id === rumorId) {
            return {
              ...it,
              rumorData: {
                ...it.rumorData,
                reactions: res.reactions!,
              },
            };
          }
          return it;
        })
      );
    }
  };

  // Generazione Domande (Admin)
  const handleGenerateQuestions = async () => {
    try {
      setIsGeneratingQuestions(true);
      toast.info("Generazione domande differenziate per i club in corso...");
      const res = await generatePressQuestionsForMatchday(1);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(`Generate ${res.generated} domande personalizzate (${res.skipped} già presenti).`);
        await loadInbox();
      }
    } catch (err: any) {
      toast.error(err.message || "Errore imprevisto.");
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  // Formattazione data orario stile FM24
  const formatFMDate = (isoString?: string) => {
    if (!isoString) return "";
    try {
      const d = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

      if (diffHours < 24 && d.getDate() === now.getDate()) {
        return d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
      }
      return d.toLocaleDateString("it-IT", { day: "numeric", month: "short" });
    } catch {
      return "";
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      <main className="container mx-auto px-2 sm:px-4 py-4 flex-1 flex flex-col max-w-7xl">
        {/* ========================================================================= */}
        {/* TOP COMMAND BAR (FM24 STYLE HEADER & CONTROLS)                            */}
        {/* ========================================================================= */}
        <div className="mb-3 p-3 sm:p-4 rounded-2xl border border-border/80 bg-card/95 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-xs">
                <Inbox className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-black text-foreground tracking-tight flex items-center gap-2">
                    Inbox di Lega
                  </h1>
                  <Badge variant="outline" className="text-[10px] font-mono border-emerald-500/40 text-emerald-600 dark:text-emerald-400">
                    FM24 Edition
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground truncate">
                  Comunicazioni ufficiali, interviste, gossip di mercato e report tattici unificati.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={loadInbox}
                disabled={loading}
                className="h-8 text-xs font-semibold gap-1.5 rounded-xl border-border/70"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Aggiorna</span>
              </Button>

              {isAdmin && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleGenerateQuestions}
                  disabled={isGeneratingQuestions}
                  className="h-8 text-xs font-bold gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow-xs"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Genera Domande AI</span>
                </Button>
              )}
            </div>
          </div>

          {/* Filtri Categoria a Pillole + Search Box */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 pt-2 border-t border-border/50">
            {/* Pillole Categoria */}
            <div className="flex flex-wrap gap-1.5 items-center">
              {[
                { id: "all", label: "Tutte le Notizie", count: counts.all, icon: Inbox },
                { id: "trades", label: "Trattative", count: counts.trades, icon: ArrowLeftRight },
                { id: "press", label: "Sala Stampa", count: counts.press, icon: Mic2 },
                { id: "rumors", label: "Voci di Mercato", count: counts.rumors, icon: Flame },
                { id: "preview", label: "Match Preview", count: counts.preview, icon: Swords },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = selectedCategory === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSelectedCategory(tab.id as InboxCategory)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                      isActive
                        ? "bg-foreground text-background shadow-xs font-black"
                        : "bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted/70"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{tab.label}</span>
                    <span
                      className={`text-[10px] font-mono px-1 rounded ${
                        isActive ? "bg-background text-foreground" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Ricerca Rapida */}
            <div className="relative w-full md:w-64">
              <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Cerca nella inbox..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-xs bg-muted/20 border-border/60 rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SPLIT SCREEN INBOX FM24 (COLONNA SINISTRA FEED + COLONNA DESTRA DETTAGLIO) */}
        {/* ========================================================================= */}
        <div className="flex-1 min-h-[580px] grid grid-cols-1 md:grid-cols-12 gap-3 items-stretch">
          {/* ------------------------------------------------------------- */}
          {/* COLONNA SINISTRA: ELENCO NOTIZIE (40% desktop, full su mobile)*/}
          {/* ------------------------------------------------------------- */}
          <div
            className={`md:col-span-5 lg:col-span-4 rounded-2xl border border-border/80 bg-card overflow-hidden flex flex-col shadow-sm ${
              selectedItemId && "hidden md:flex"
            }`}
          >
            <div className="p-3 border-b border-border/60 bg-muted/20 flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                {filteredItems.length} {filteredItems.length === 1 ? "Notizia" : "Notizie"}
              </span>
              <span className="text-[11px] text-muted-foreground font-mono">
                {readItemIds.size}/{items.length} lette
              </span>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-border/50 max-h-[calc(100vh-250px)]">
              {loading ? (
                <div className="p-8 text-center text-xs text-muted-foreground italic space-y-2">
                  <RefreshCw className="h-5 w-5 animate-spin mx-auto text-emerald-500" />
                  <p>Caricamento messaggi e notizie...</p>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground space-y-2">
                  <Inbox className="h-8 w-8 mx-auto text-muted-foreground/40" />
                  <p className="font-semibold text-foreground">Nessuna notizia trovata</p>
                  <p className="text-[11px]">Prova a reimpostare i filtri o la ricerca.</p>
                </div>
              ) : (
                filteredItems.map((item) => {
                  const isSelected = item.id === selectedItemId;
                  const isRead = readItemIds.has(item.id);

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelectItem(item.id)}
                      className={`p-3.5 cursor-pointer transition-all flex items-start gap-3 relative ${
                        isSelected
                          ? "bg-muted/70 border-l-4 border-l-emerald-500 shadow-xs"
                          : "hover:bg-muted/30"
                      }`}
                    >
                      {/* Pallino di lettura o urgenza */}
                      <div className="pt-1 shrink-0">
                        {item.priority === "urgent" ? (
                          <span
                            title="Azione Urgente"
                            className="h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-rose-500/30 animate-pulse block"
                          />
                        ) : !isRead ? (
                          <span
                            title="Nuovo / Non Letto"
                            className="h-2 w-2 rounded-full bg-blue-500 block"
                          />
                        ) : (
                          <span className="h-2 w-2 rounded-full bg-muted-foreground/20 block" />
                        )}
                      </div>

                      {/* Logo club o Icona Notizia */}
                      <div className="shrink-0 pt-0.5">
                        {item.senderTeamId ? (
                          <img
                            src={getTeamLogo(item.senderTeamId)}
                            alt={item.senderTeamId}
                            className="h-7 w-7 object-contain rounded-md"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                        ) : item.category === "rumors" ? (
                          <div className="h-7 w-7 rounded-lg bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                            <Flame className="h-4 w-4" />
                          </div>
                        ) : item.category === "preview" ? (
                          <div className="h-7 w-7 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                            <Swords className="h-4 w-4" />
                          </div>
                        ) : (
                          <div className="h-7 w-7 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                            <Mic2 className="h-4 w-4" />
                          </div>
                        )}
                      </div>

                      {/* Info sintetiche riga */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-1.5">
                          <span
                            className={`text-xs truncate ${
                              !isRead ? "font-black text-foreground" : "font-medium text-muted-foreground"
                            }`}
                          >
                            {item.senderName}
                          </span>
                          <span className="text-[10px] font-mono text-muted-foreground/70 shrink-0">
                            {formatFMDate(item.timestamp)}
                          </span>
                        </div>

                        <p
                          className={`text-xs line-clamp-1 leading-snug ${
                            !isRead ? "font-bold text-foreground" : "text-foreground/90 font-medium"
                          }`}
                        >
                          {item.title}
                        </p>

                        <div className="flex items-center justify-between gap-2 pt-0.5">
                          <p className="text-[11px] text-muted-foreground truncate flex-1">
                            {item.snippet}
                          </p>
                          {item.badgeText && (
                            <Badge
                              variant="outline"
                              className={`text-[9px] px-1.5 py-0 shrink-0 font-bold border ${item.badgeColor || ""}`}
                            >
                              {item.badgeText}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* COLONNA DESTRA: DETTAGLIO NOTIZIA SELEZIONATA (60-65% desktop) */}
          {/* ------------------------------------------------------------- */}
          <div
            className={`md:col-span-7 lg:col-span-8 rounded-2xl border border-border/80 bg-card overflow-hidden flex flex-col shadow-sm ${
              !selectedItemId && "hidden md:flex"
            }`}
          >
            {selectedItem ? (
              <div className="flex-1 flex flex-col min-h-0 overflow-y-auto max-h-[calc(100vh-250px)]">
                {/* Header Pannello Dettaglio */}
                <div className="p-4 sm:p-6 border-b border-border/60 bg-muted/20 space-y-3 shrink-0">
                  {/* Mobile Back Button */}
                  <div className="md:hidden flex items-center gap-2 mb-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedItemId(null)}
                      className="h-8 text-xs font-bold gap-1 pl-1"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <span>Torna alla lista</span>
                    </Button>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-bold border ${selectedItem.badgeColor || ""}`}
                      >
                        {selectedItem.badgeText || selectedItem.category.toUpperCase()}
                      </Badge>
                      {selectedItem.matchday && (
                        <span className="text-xs font-mono text-muted-foreground">
                          Giornata {selectedItem.matchday}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                      <Clock className="h-3.5 w-3.5" />
                      <span>
                        {new Date(selectedItem.timestamp).toLocaleDateString("it-IT", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>

                  <h2 className="text-lg sm:text-2xl font-black text-foreground tracking-tight leading-snug">
                    {selectedItem.title}
                  </h2>

                  {/* Scheda Mittente */}
                  <div className="p-3 rounded-xl bg-card border border-border/70 flex items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      {selectedItem.senderTeamId ? (
                        <img
                          src={getTeamLogo(selectedItem.senderTeamId)}
                          alt={selectedItem.senderTeamId}
                          className="h-10 w-10 object-contain rounded-lg shrink-0"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0">
                          <User className="h-5 w-5" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-extrabold text-sm text-foreground truncate">
                          {selectedItem.senderName}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {selectedItem.senderRole || "Notifica di Lega"}
                        </div>
                      </div>
                    </div>

                    {selectedItem.tradeData && (
                      <Button
                        size="sm"
                        asChild
                        className="h-8 text-xs font-bold gap-1 bg-blue-600 hover:bg-blue-500 text-white shrink-0"
                      >
                        <Link to="/mia-squadra/trattative">
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span>Vai alle Trattative</span>
                        </Link>
                      </Button>
                    )}

                    {selectedItem.previewData && (
                      <Button
                        size="sm"
                        asChild
                        className="h-8 text-xs font-bold gap-1 bg-amber-500 hover:bg-amber-400 text-slate-950 shrink-0"
                      >
                        <Link to="/prossimo-avversario">
                          <Swords className="h-3.5 w-3.5" />
                          <span>Report Tattico Completo</span>
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>

                {/* Contenuto Dinamico Notizia */}
                <div className="p-4 sm:p-6 space-y-6 flex-1">
                  {/* ========================================================= */}
                  {/* TIPO 1: RUMOR & GOSSIP DI CALCIOMERCATO                   */}
                  {/* ========================================================= */}
                  {selectedItem.rumorData && (
                    <div className="space-y-5">
                      <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 block">
                            Indice di Affidabilità Fonte
                          </span>
                          <span className="text-sm font-extrabold text-foreground">
                            {selectedItem.rumorData.credibility_badge} ({selectedItem.rumorData.credibility_score}%)
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedItem.rumorData.involved_team_ids?.map((tId) => (
                            <Badge key={tId} variant="outline" className="text-xs font-bold">
                              Club: {tId}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="prose prose-sm dark:prose-invert max-w-none text-foreground/90 text-sm sm:text-base leading-relaxed bg-muted/20 p-4 rounded-xl border border-border/50">
                        {selectedItem.rumorData.content}
                      </div>

                      {/* Barra Reazioni della Community */}
                      <div className="pt-2">
                        <span className="text-xs font-bold text-muted-foreground block mb-2">
                          Reazioni dei Manager della Lega:
                        </span>
                        <div className="flex flex-wrap items-center gap-2">
                          {[
                            { type: "fire", emoji: "🔥", label: "Colpaccio", count: selectedItem.rumorData.reactions?.fire || 0 },
                            { type: "laugh", emoji: "😂", label: "Fake", count: selectedItem.rumorData.reactions?.laugh || 0 },
                            { type: "shock", emoji: "😱", label: "Choc", count: selectedItem.rumorData.reactions?.shock || 0 },
                            { type: "doubt", emoji: "🤔", label: "Dubbio", count: selectedItem.rumorData.reactions?.doubt || 0 },
                          ].map((rx) => (
                            <Button
                              key={rx.type}
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleReaction(selectedItem.rumorData!.id, rx.type as any)}
                              className="h-8 text-xs font-bold gap-1.5 rounded-xl border-border/80 hover:bg-muted/80"
                            >
                              <span>{rx.emoji}</span>
                              <span className="text-muted-foreground">{rx.label}</span>
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-mono">
                                {rx.count}
                              </Badge>
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ========================================================= */}
                  {/* TIPO 2: SALA STAMPA (INTERVISTA O PENDING QUESTION)        */}
                  {/* ========================================================= */}
                  {selectedItem.pressData && (
                    <div className="space-y-5">
                      {/* Intervista da rilasciare (PENDING) */}
                      {selectedItem.pressData.status === "PENDING" ? (
                        <Card className="border-amber-500/40 bg-gradient-to-b from-amber-500/10 to-transparent shadow-sm">
                          <CardHeader className="p-4 sm:p-5 border-b border-amber-500/20">
                            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs uppercase tracking-wider">
                              <Radio className="h-4 w-4 animate-pulse" />
                              <span>Intervista Ufficiale In Attesa</span>
                            </div>
                            <CardTitle className="text-base sm:text-lg font-black text-foreground mt-1">
                              Domanda del Giornalista AI:
                            </CardTitle>
                            <p className="text-sm italic text-foreground/90 mt-1 leading-relaxed">
                              "{selectedItem.pressData.question}"
                            </p>
                          </CardHeader>
                          <CardContent className="p-4 sm:p-5 space-y-3">
                            <label className="text-xs font-bold text-foreground block">
                              La tua dichiarazione ufficiale da pubblicare in Sala Stampa:
                            </label>
                            <Textarea
                              placeholder="Rispondi alla domanda del giornalista per chiarire gli obiettivi, commentare la prestazione o mandare un messaggio ai rivali..."
                              value={myAnswerText}
                              onChange={(e) => setMyAnswerText(e.target.value)}
                              rows={4}
                              className="text-sm bg-background border-border/80 rounded-xl"
                            />
                            <div className="flex justify-end">
                              <Button
                                onClick={() => handleAnswerSubmit(selectedItem.pressData!.id)}
                                disabled={isSubmittingAnswer || !myAnswerText.trim()}
                                className="h-9 px-4 text-xs font-bold gap-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-xs"
                              >
                                <Send className="h-3.5 w-3.5" />
                                <span>{isSubmittingAnswer ? "Pubblicazione..." : "Rilascia Dichiarazione"}</span>
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ) : (
                        /* Intervista già rilasciata */
                        <div className="space-y-4">
                          <div className="p-4 rounded-xl bg-muted/30 border border-border/70 space-y-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                              <Mic2 className="h-3.5 w-3.5 text-emerald-500" />
                              Domanda Ufficiale
                            </span>
                            <p className="text-sm font-semibold italic text-muted-foreground">
                              "{selectedItem.pressData.question}"
                            </p>
                          </div>

                          <div className="p-4 sm:p-5 rounded-2xl bg-card border-2 border-emerald-500/30 shadow-xs space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                                Risposta Ufficiale di {selectedItem.pressData.manager_name || "Presidente"}
                              </span>
                              {selectedItem.pressData.answered_at && (
                                <span className="text-[10px] font-mono text-muted-foreground">
                                  {new Date(selectedItem.pressData.answered_at).toLocaleTimeString("it-IT", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              )}
                            </div>
                            <p className="text-sm sm:text-base leading-relaxed text-foreground font-medium">
                              "{selectedItem.pressData.answer}"
                            </p>
                          </div>

                          {/* Sezione Repliche e Botta e Risposta (#69) */}
                          <div className="pt-4 border-t border-border/60 space-y-4">
                            <div className="flex items-center justify-between">
                              <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                <MessageSquare className="h-3.5 w-3.5 text-blue-500" />
                                Botta e Risposta tra Presidenti ({selectedItem.pressData.replies?.length || 0})
                              </h3>
                            </div>

                            {/* Thread repliche esistenti */}
                            {selectedItem.pressData.replies && selectedItem.pressData.replies.length > 0 && (
                              <div className="space-y-2.5">
                                {selectedItem.pressData.replies.map((rep) => (
                                  <div
                                    key={rep.id}
                                    className="p-3.5 rounded-xl bg-muted/30 border border-border/60 flex items-start gap-3"
                                  >
                                    <img
                                      src={getTeamLogo(rep.team_id)}
                                      alt={rep.team_id}
                                      className="h-6 w-6 object-contain rounded shrink-0 mt-0.5"
                                      onError={(e) => {
                                        (e.target as HTMLElement).style.display = "none";
                                      }}
                                    />
                                    <div className="flex-1 min-w-0 space-y-1">
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="text-xs font-bold text-foreground">
                                          {rep.team?.NAME || rep.team_id} ({rep.manager_name || rep.team?.MANAGER || "Presidente"})
                                        </span>
                                        <span className="text-[10px] font-mono text-muted-foreground">
                                          {new Date(rep.created_at).toLocaleDateString("it-IT", {
                                            day: "numeric",
                                            month: "short",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })}
                                        </span>
                                      </div>
                                      <p className="text-xs text-foreground/90 leading-relaxed">
                                        {rep.reply_text}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Form per inviare una replica */}
                            {effectiveTeam && (
                              <div className="p-3.5 rounded-xl bg-card border border-border/70 space-y-2">
                                <label className="text-[11px] font-bold text-muted-foreground block">
                                  Replica come Presidente del {effectiveTeam}:
                                </label>
                                <div className="flex gap-2">
                                  <Textarea
                                    placeholder="Scrivi la tua replica alle dichiarazioni..."
                                    value={replyDraft}
                                    onChange={(e) => setReplyDraft(e.target.value)}
                                    rows={2}
                                    className="text-xs bg-muted/20 rounded-xl"
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() => handleReplySubmit(selectedItem.pressData!.id)}
                                    disabled={isSubmittingReply || !replyDraft.trim()}
                                    className="h-auto px-3 text-xs font-bold self-end bg-blue-600 hover:bg-blue-500 text-white rounded-xl"
                                  >
                                    <Send className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ========================================================= */}
                  {/* TIPO 3: MESSAGGIO / TRATTATIVA DI MERCATO                  */}
                  {/* ========================================================= */}
                  {selectedItem.tradeData && (
                    <div className="space-y-4">
                      {/* Matchup Banner Scambio */}
                      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 via-card to-blue-500/10 border border-blue-500/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                        <div className="flex items-center gap-3">
                          <img
                            src={getTeamLogo(selectedItem.tradeData.sender_team)}
                            alt={selectedItem.tradeData.sender_team}
                            className="h-10 w-10 object-contain rounded-lg"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                          <div>
                            <div className="text-xs text-muted-foreground uppercase font-bold">Proponente</div>
                            <div className="font-extrabold text-sm text-foreground">
                              {selectedItem.tradeData.sender_team_name || selectedItem.tradeData.sender_team}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <ArrowLeftRight className="h-5 w-5 text-blue-500" />
                          <Badge variant="outline" className="text-xs font-mono font-bold">
                            {selectedItem.tradeData.status.toUpperCase()}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-3 sm:flex-row-reverse text-center sm:text-right">
                          <img
                            src={getTeamLogo(selectedItem.tradeData.receiver_team)}
                            alt={selectedItem.tradeData.receiver_team}
                            className="h-10 w-10 object-contain rounded-lg"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                          <div>
                            <div className="text-xs text-muted-foreground uppercase font-bold">Destinataria</div>
                            <div className="font-extrabold text-sm text-foreground">
                              {selectedItem.tradeData.receiver_team_name || selectedItem.tradeData.receiver_team}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Griglia Asset Offerti vs Richiesti */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3.5 rounded-xl bg-muted/20 border border-border/70 space-y-2">
                          <span className="text-xs font-bold text-foreground block">
                            Asset Offerti ({selectedItem.tradeData.offered_players?.length || 0} calciatori):
                          </span>
                          <div className="space-y-1">
                            {selectedItem.tradeData.offered_players?.map((p) => (
                              <div key={p.ID} className="p-2 rounded-lg bg-card border border-border/50 flex items-center justify-between text-xs font-mono">
                                <span className="font-bold text-foreground">{p.Cognome} {p.Nome}</span>
                                <Badge variant="outline" className="text-[10px]">{p.Posiz} • {p.OVR} OVR</Badge>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-muted/20 border border-border/70 space-y-2">
                          <span className="text-xs font-bold text-foreground block">
                            Asset Richiesti ({selectedItem.tradeData.requested_players?.length || 0} calciatori):
                          </span>
                          <div className="space-y-1">
                            {selectedItem.tradeData.requested_players?.map((p) => (
                              <div key={p.ID} className="p-2 rounded-lg bg-card border border-border/50 flex items-center justify-between text-xs font-mono">
                                <span className="font-bold text-foreground">{p.Cognome} {p.Nome}</span>
                                <Badge variant="outline" className="text-[10px]">{p.Posiz} • {p.OVR} OVR</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {selectedItem.tradeData.notes && (
                        <div className="p-3.5 rounded-xl bg-muted/30 border border-border/60 text-xs text-muted-foreground space-y-1">
                          <span className="font-bold text-foreground block">Note & Messaggi:</span>
                          <p>{selectedItem.tradeData.notes}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ========================================================= */}
                  {/* TIPO 4: MATCH PREVIEW & ANALISI PROSSIMA GIORNATA          */}
                  {/* ========================================================= */}
                  {selectedItem.previewData && (
                    <div className="space-y-5">
                      {/* Big Matchup Card */}
                      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-card to-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={getTeamLogo(selectedItem.previewData.matchInfo.myTeamId)}
                            alt={selectedItem.previewData.matchInfo.myTeamId}
                            className="h-12 w-12 object-contain"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                          <div>
                            <span className="text-[10px] font-bold uppercase text-muted-foreground">La Tua Squadra</span>
                            <div className="text-base font-black text-foreground">
                              {selectedItem.previewData.matchInfo.myTeamId}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-center justify-center font-mono">
                          <span className="text-xs font-black text-amber-500 tracking-wider">VS</span>
                          <Badge variant="outline" className="text-[10px] mt-1">
                            {selectedItem.previewData.matchInfo.isHome ? "IN CASA" : "IN TRASFERTA"}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-3 sm:flex-row-reverse text-center sm:text-right">
                          <img
                            src={getTeamLogo(selectedItem.previewData.matchInfo.opponentTeamId)}
                            alt={selectedItem.previewData.matchInfo.opponentTeamId}
                            className="h-12 w-12 object-contain"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                          <div>
                            <span className="text-[10px] font-bold uppercase text-muted-foreground">Avversario</span>
                            <div className="text-base font-black text-foreground">
                              {selectedItem.previewData.matchInfo.opponentTeamName}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Dati Pre-partita (Stadio, Arbitro) */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs font-mono">
                        <div className="p-2.5 rounded-xl bg-muted/20 border border-border/60">
                          <span className="text-[10px] text-muted-foreground block flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> Stadio
                          </span>
                          <span className="font-bold text-foreground">
                            {selectedItem.previewData.matchInfo.stadium || "Comunale"}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-muted/20 border border-border/60">
                          <span className="text-[10px] text-muted-foreground block flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> Turno
                          </span>
                          <span className="font-bold text-foreground">
                            Giornata {selectedItem.previewData.matchInfo.week}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-muted/20 border border-border/60 col-span-2 sm:col-span-1">
                          <span className="text-[10px] text-muted-foreground block">Fattore Campo</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {selectedItem.previewData.matchInfo.isHome ? "Vantaggio Casa" : "Insidia Trasferta"}
                          </span>
                        </div>
                      </div>

                      {/* Statistiche Avversario */}
                      {selectedItem.previewData.scoutData?.standings && (
                        <div className="p-4 rounded-xl bg-muted/20 border border-border/60 space-y-2">
                          <span className="text-xs font-bold text-foreground block">
                            Rendimento Avversario in Campionato:
                          </span>
                          <div className="grid grid-cols-4 gap-2 text-center font-mono text-xs">
                            <div className="p-2 rounded bg-card border border-border/50">
                              <span className="text-[10px] text-muted-foreground block">Posiz.</span>
                              <span className="font-black text-foreground">
                                #{selectedItem.previewData.scoutData.standings.rank || "-"}
                              </span>
                            </div>
                            <div className="p-2 rounded bg-card border border-border/50">
                              <span className="text-[10px] text-muted-foreground block">Punti</span>
                              <span className="font-black text-foreground">
                                {selectedItem.previewData.scoutData.standings.points || 0} pt
                              </span>
                            </div>
                            <div className="p-2 rounded bg-card border border-border/50">
                              <span className="text-[10px] text-muted-foreground block">Gol Fatti</span>
                              <span className="font-black text-emerald-600 dark:text-emerald-400">
                                {selectedItem.previewData.scoutData.standings.goalsFor || 0}
                              </span>
                            </div>
                            <div className="p-2 rounded bg-card border border-border/50">
                              <span className="text-[10px] text-muted-foreground block">Gol Subiti</span>
                              <span className="font-black text-rose-600 dark:text-rose-400">
                                {selectedItem.previewData.scoutData.standings.goalsAgainst || 0}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Forma Recente Avversario */}
                      {selectedItem.previewData.scoutData?.form && selectedItem.previewData.scoutData.form.length > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-muted-foreground">Forma recente avversario:</span>
                          <div className="flex gap-1 font-mono text-xs font-black">
                            {selectedItem.previewData.scoutData.form.map((res, i) => (
                              <span
                                key={i}
                                className={`h-6 w-6 rounded-md flex items-center justify-center text-white ${
                                  res === "V"
                                    ? "bg-emerald-600"
                                    : res === "N"
                                    ? "bg-amber-500"
                                    : "bg-rose-600"
                                }`}
                              >
                                {res}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground space-y-3">
                <div className="h-16 w-16 rounded-2xl bg-muted/40 border border-border/70 flex items-center justify-center">
                  <Inbox className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-foreground text-sm">Nessuna Notizia Selezionata</h3>
                  <p className="text-xs max-w-xs text-muted-foreground">
                    Seleziona un elemento dall'elenco a sinistra per visualizzarne i dettagli e interagire.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

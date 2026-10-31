import React, { useState, useEffect, useMemo } from "react";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Newspaper,
  Mic2,
  Sparkles,
  Flame,
  Laugh,
  HelpCircle,
  Radio,
  Send,
  RefreshCw,
  Key,
  Clock,
  CheckCircle2,
  Filter,
  MessageSquare,
  Zap,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import {
  fetchPressConferences,
  fetchPendingConferenceForTeam,
  fetchMarketRumors,
  submitPressAnswer,
  generatePressQuestionsForMatchday,
  maybeTriggerRandomRumor,
  reactToRumor,
  getGeminiApiKey,
  setGeminiApiKey,
  checkIsMarketOpen,
  PressConference,
  MarketRumor,
} from "@/services/aiJournalistService";

export default function SalaStampa() {
  const { user, isAdmin, effectiveTeam, availableTeams } = useAuth();

  const [activeTab, setActiveTab] = useState<"press" | "rumors">("press");
  const [conferences, setConferences] = useState<PressConference[]>([]);
  const [rumors, setRumors] = useState<MarketRumor[]>([]);
  const [loadingPress, setLoadingPress] = useState(true);
  const [loadingRumors, setLoadingRumors] = useState(true);
  const [isMarketOpen, setIsMarketOpen] = useState(true);

  // Filtri Sala Stampa (mostrate solo interviste a cui un manager ha risposto)
  const [selectedMatchday, setSelectedMatchday] = useState<string>("ALL");
  const [selectedTeam, setSelectedTeam] = useState<string>("ALL");

  // Intervista in attesa per la squadra del manager loggato
  const [pendingForMyTeam, setPendingForMyTeam] = useState<PressConference | null>(null);
  const [myAnswerText, setMyAnswerText] = useState("");
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);

  // Paginazione Gossip & Rumor (5 rumor per pagina)
  const [rumorPage, setRumorPage] = useState(1);
  const RUMORS_PER_PAGE = 5;

  const totalRumorPages = Math.max(1, Math.ceil(rumors.length / RUMORS_PER_PAGE));
  const paginatedRumors = useMemo(() => {
    const start = (rumorPage - 1) * RUMORS_PER_PAGE;
    return rumors.slice(start, start + RUMORS_PER_PAGE);
  }, [rumors, rumorPage]);

  // Azioni Amministrazione (solo per generare le domande di inizio giornata per i club)
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);

  // Caricamento Dati
  const loadData = async () => {
    setLoadingPress(true);
    setLoadingRumors(true);

    try {
      // Trigger automatico silenzioso per rumor randomici durante la giornata se il mercato è aperto
      maybeTriggerRandomRumor();

      const [pressData, rumorsData, marketStatus, myPending] = await Promise.all([
        fetchPressConferences(undefined, 11, true), // onlyAnswered = true
        fetchMarketRumors(40),
        checkIsMarketOpen(),
        effectiveTeam ? fetchPendingConferenceForTeam(effectiveTeam, 11) : Promise.resolve(null),
      ]);

      setConferences(pressData);
      setRumors(rumorsData);
      setIsMarketOpen(marketStatus);
      setPendingForMyTeam(myPending);
    } catch (err) {
      console.error("Errore caricamento Sala Stampa:", err);
      toast.error("Errore durante il caricamento dei contenuti.");
    } finally {
      setLoadingPress(false);
      setLoadingRumors(false);
    }
  };

  useEffect(() => {
    loadData();
    
  }, [effectiveTeam]);

  // Invio Risposta Manager
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
        (effectiveTeam ? availableTeams.find((t) => t.id === effectiveTeam)?.name : undefined) ||
        "Presidente";

      const res = await submitPressAnswer(
        conferenceId,
        myAnswerText.trim(),
        managerDisplayName
      );

      if (res.success) {
        toast.success("Dichiarazione ufficiale registrata! Ora è visibile nella Sala Stampa pubblica.");
        setMyAnswerText("");
        setPendingForMyTeam(null);
        await loadData();
      } else {
        toast.error(res.error || "Errore durante il salvataggio.");
      }
    } catch (err: any) {
      toast.error(err.message || "Errore imprevisto.");
    } finally {
      setIsSubmittingAnswer(false);
    }
  };

  // Reazione al Rumor
  const handleReaction = async (
    rumorId: number,
    type: "fire" | "laugh" | "shock" | "doubt"
  ) => {
    const res = await reactToRumor(rumorId, type);
    if (res.success && res.reactions) {
      setRumors((prev) =>
        prev.map((r) => (r.id === rumorId ? { ...r, reactions: res.reactions! } : r))
      );
    }
  };

  // Generazione Domande (Solo Admin da interfaccia o automazione turno)
  const handleGenerateQuestions = async () => {
    try {
      setIsGeneratingQuestions(true);
      toast.info("Generazione domande differenziate per ciascun club in corso...");
      const matchday = selectedMatchday !== "ALL" ? Number(selectedMatchday) : 1;
      const res = await generatePressQuestionsForMatchday(matchday);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(
          `Generate ${res.generated} domande personalizzate (${res.skipped} già inviate ai manager).`
        );
        loadData();
      }
    } catch (err: any) {
      toast.error(err.message || "Errore imprevisto.");
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  // Filtro Conferenze (mostrate solo le interviste con risposta effettiva)
  const filteredConferences = useMemo(() => {
    return conferences.filter((c) => {
      if (selectedMatchday !== "ALL" && String(c.matchday) !== selectedMatchday) return false;
      if (selectedTeam !== "ALL" && c.team_id !== selectedTeam) return false;
      return true;
    });
  }, [conferences, selectedMatchday, selectedTeam]);

  // Giornate disponibili per dropdown
  const matchdaysList = useMemo(() => {
    const set = new Set(conferences.map((c) => c.matchday));
    if (set.size === 0) return [1];
    return Array.from(set).sort((a, b) => b - a);
  }, [conferences]);

  const getJournalisticBadgeStyle = (badge: string) => {
    switch (badge) {
      case "ESCLUSIVA":
        return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30";
      case "ULTIM'ORA":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30";
      case "RETROSCENA":
        return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30";
      case "RADAR MERCATO":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
      default:
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30";
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <Navbar />

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* ========================================================= */}
        {/* HEADER SALA STAMPA & MEDIA */}
        {/* ========================================================= */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-border/80">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
                <Radio className="h-3 w-3 animate-pulse text-emerald-500" />
                LCSIM Media Hub • Live
              </span>
              <span className="text-xs text-muted-foreground">
                Conferenze Stampa Ufficiali & Notiziario Calciomercato
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight flex items-center gap-3">
              <Newspaper className="h-8 w-8 text-primary" />
              Sala Stampa & Rumor di Mercato
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Spazio ufficiale dedicato alle interviste dei presidenti e alle indiscrezioni esclusive del Giornalista AI.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              className="gap-1.5 text-xs"
              title="Aggiorna contenuti"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Aggiorna
            </Button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* BOX INTERATTIVO PER IL MANAGER SE HA UNA DOMANDA DA RISPONDERE */}
        {/* ========================================================= */}
        {pendingForMyTeam && (
          <Card className="border-2 border-primary/40 bg-gradient-to-r from-primary/5 via-card to-primary/10 shadow-lg animate-in fade-in">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-primary text-primary-foreground shadow-sm">
                    <Mic2 className="h-5 w-5 animate-pulse" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold">
                      Microfono Aperto: Intervista Giornata {pendingForMyTeam.matchday}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Il Giornalista AI della Lega ti ha rivolto una domanda ufficiale. Rilascia la tua dichiarazione per pubblicarla in Sala Stampa.
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 font-bold">
                  In Attesa della tua risposta
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-xl bg-background/80 border border-border/80 relative">
                <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Domanda del Giornalista AI
                </div>
                <p className="text-sm font-medium italic text-foreground">
                  "{pendingForMyTeam.question}"
                </p>
                {pendingForMyTeam.context_summary && (
                  <div className="mt-2 text-[11px] text-muted-foreground border-t border-border/40 pt-1.5">
                    <strong>Focus:</strong> {pendingForMyTeam.context_summary}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>La tua risposta ufficiale da Presidente / Allenatore:</span>
                  <span className="text-[11px] text-muted-foreground">
                    {myAnswerText.length}/400 caratteri
                  </span>
                </label>
                <Textarea
                  placeholder="Inserisci la tua dichiarazione (es. 'Siamo pienamente focalizzati sulla prestazione. In campo vogliamo imporre la nostra identità e daremo tutto fino all'ultimo minuto...')"
                  value={myAnswerText}
                  onChange={(e) => setMyAnswerText(e.target.value.slice(0, 400))}
                  rows={3}
                  className="resize-none"
                />
              </div>
            </CardContent>
            <CardFooter className="pt-0 justify-end">
              <Button
                onClick={() => handleAnswerSubmit(pendingForMyTeam.id)}
                disabled={isSubmittingAnswer || !myAnswerText.trim()}
                className="gap-2 font-bold"
              >
                {isSubmittingAnswer ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Pubblica Dichiarazione Ufficiale
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* ========================================================= */}
        {/* TABS PRINCIPALI: SALA STAMPA vs GOSSIP & RUMOR */}
        {/* ========================================================= */}
        <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="space-y-6">
          <TabsList className="grid grid-cols-2 max-w-md h-11 p-1 bg-muted/60 border border-border/80">
            <TabsTrigger value="press" className="gap-2 text-xs font-bold">
              <Mic2 className="h-4 w-4 text-primary" />
              Interviste & Conferenze ({conferences.length})
            </TabsTrigger>
            <TabsTrigger value="rumors" className="gap-2 text-xs font-bold">
              <Flame className="h-4 w-4 text-amber-500" />
              Gossip & Rumor ({rumors.length})
            </TabsTrigger>
          </TabsList>

          {/* ------------------------------------------------------------- */}
          {/* TAB 1: INTERVISTE & CONFERENZE STAMPA (SOLO RISPOSTE) */}
          {/* ------------------------------------------------------------- */}
          <TabsContent value="press" className="space-y-6">
            {/* Barra filtri */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-card border border-border/80 shadow-sm">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-semibold text-muted-foreground">Filtra dichiarazioni:</span>
                </div>

                {/* Filtro Giornata */}
                <Select value={selectedMatchday} onValueChange={setSelectedMatchday}>
                  <SelectTrigger className="w-[150px] h-8 text-xs">
                    <SelectValue placeholder="Giornata" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tutte le Giornate</SelectItem>
                    {matchdaysList.map((m) => (
                      <SelectItem key={m} value={String(m)}>
                        Giornata {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Filtro Squadra */}
                <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                  <SelectTrigger className="w-[170px] h-8 text-xs">
                    <SelectValue placeholder="Squadra" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tutti i Club</SelectItem>
                    {availableTeams.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Azione Admin per generare il blocco domande di un turno */}
              {isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateQuestions}
                  disabled={isGeneratingQuestions}
                  className="gap-2 text-xs border-primary/30 text-primary hover:bg-primary/5 self-start md:self-auto font-bold"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {isGeneratingQuestions ? "Generazione in corso..." : "Genera Domande Giornata"}
                </Button>
              )}
            </div>

            {/* Griglia Conferenze (Vengono mostrate ESCLUSIVAMENTE quelle risposte) */}
            {loadingPress ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-3">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Caricamento dichiarazioni ufficiali...</p>
              </div>
            ) : filteredConferences.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl border border-dashed border-border/80 bg-muted/20">
                <Mic2 className="h-12 w-12 text-muted-foreground/40 mb-3" />
                <h3 className="text-base font-semibold">Nessuna conferenza stampa rilasciata al momento</h3>
                <p className="text-xs text-muted-foreground max-w-sm mt-1">
                  Vengono pubblicate qui solo le interviste a cui i presidenti hanno effettivamente risposto.
                  {pendingForMyTeam ? " Puoi rilasciare subito la tua dichiarazione nel box in alto!" : " Le risposte dei manager compariranno qui non appena registrate."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredConferences.map((conf) => (
                  <Card
                    key={conf.id}
                    className="border border-border/80 bg-card transition-all duration-200 hover:shadow-md"
                  >
                    <CardHeader className="pb-3 border-b border-border/60 bg-muted/10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary font-black text-xs flex items-center justify-center border border-primary/20">
                            {conf.team_id}
                          </div>
                          <div>
                            <CardTitle className="text-sm font-bold leading-tight">
                              {conf.team?.NAME || conf.team_id}
                            </CardTitle>
                            <CardDescription className="text-[11px]">
                              {conf.manager_name || conf.team?.MANAGER || "Presidente"}
                            </CardDescription>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] font-bold">
                            Giornata {conf.matchday}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold flex items-center gap-1">
                            <CheckCircle2 className="h-2.5 w-2.5" />
                            Ufficiale
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-4 space-y-4">
                      {/* Domanda Giornalista */}
                      <div className="space-y-1.5">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                          <Mic2 className="h-3 w-3 text-primary" />
                          Domanda Giornalista AI:
                        </div>
                        <p className="text-xs font-semibold italic text-foreground bg-muted/30 p-2.5 rounded-lg border border-border/60">
                          "{conf.question}"
                        </p>
                      </div>

                      {/* Risposta Presidente */}
                      <div className="space-y-1.5">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          Dichiarazione Presidente:
                        </div>

                        <div className="text-xs text-foreground bg-primary/5 border border-primary/20 p-3 rounded-lg relative">
                          <p className="font-normal leading-relaxed">
                            "{conf.answer}"
                          </p>
                          <div className="text-[10px] text-muted-foreground text-right mt-1.5 font-mono">
                            {conf.answered_at ? new Date(conf.answered_at).toLocaleString("it-IT", { dateStyle: "short", timeStyle: "short" }) : ""}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

              </div>
            )}
          </TabsContent>

          {/* ------------------------------------------------------------- */}
          {/* TAB 2: GOSSIP & RUMOR DI CALCIOMERCATO */}
          {/* ------------------------------------------------------------- */}
          <TabsContent value="rumors" className="space-y-6">
            {/* Banner Stato Mercato & Info Feed */}
            <div className="p-4 rounded-xl bg-card border border-border/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    isMarketOpen ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                  }`}
                />
                <span className="text-xs font-bold uppercase tracking-wider">
                  {isMarketOpen ? "Calciomercato LCSIM Aperto" : "Calciomercato Chiuso"}
                </span>
                <span className="text-muted-foreground text-xs">•</span>
                <span className="text-xs text-muted-foreground">
                  I rumor emergono spontaneamente durante la giornata dal monitoraggio di trattative e spogliatoi.
                </span>
              </div>

              <div className="text-[11px] font-mono text-muted-foreground">
                Feed aggiornato automaticamente
              </div>
            </div>

            {/* Feed Rumor */}
            {loadingRumors ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-3">
                <RefreshCw className="h-8 w-8 animate-spin text-amber-500" />
                <p className="text-sm text-muted-foreground">Scansione bacheca e indiscrezioni in corso...</p>
              </div>
            ) : rumors.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl border border-dashed border-border/80 bg-muted/20">
                <Flame className="h-12 w-12 text-muted-foreground/40 mb-3" />
                <h3 className="text-base font-semibold">Nessun rumor registrato al momento</h3>
                <p className="text-xs text-muted-foreground max-w-sm mt-1">
                  Il giornalista sta setacciando le trattative. Nuove indiscrezioni appariranno spontaneamente durante la giornata.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {paginatedRumors.map((rumor) => (
                  <Card
                    key={rumor.id}
                    className="border border-border/80 bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    <CardHeader className="py-3 px-5 border-b border-border/60 bg-muted/10">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-extrabold text-foreground tracking-wide flex items-center gap-1.5">
                            <Sparkles className="h-3 w-3 text-amber-500" />
                            {rumor.source_label}
                          </span>
                          <span className="text-muted-foreground text-xs">•</span>
                          <Badge variant="outline" className={`text-[10px] font-bold ${getJournalisticBadgeStyle(rumor.credibility_badge)}`}>
                            {rumor.credibility_badge}
                          </Badge>
                        </div>

                        <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(rumor.created_at).toLocaleString("it-IT", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="p-5 space-y-3">
                      <h3 className="text-base font-bold text-foreground leading-snug">
                        {rumor.headline}
                      </h3>

                      <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                        {rumor.content}
                      </p>

                      {/* Tag Calciatori & Club Coinvolti */}
                      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border/40">
                        {rumor.involved_player_names && rumor.involved_player_names.length > 0 && (
                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <strong>Nomi caldi:</strong>
                            <span className="font-semibold text-foreground">
                              {rumor.involved_player_names.join(", ")}
                            </span>
                          </div>
                        )}

                        {rumor.involved_team_ids && rumor.involved_team_ids.length > 0 && (
                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground ml-auto">
                            <strong>Società interessate:</strong>
                            {rumor.involved_team_ids.map((tid) => (
                              <Badge key={tid} variant="secondary" className="text-[10px] px-1.5 py-0 font-bold">
                                {tid}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>

                    <CardFooter className="py-2.5 px-5 bg-muted/5 border-t border-border/60 flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-muted-foreground">
                        Reazioni dei Manager:
                      </span>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReaction(rumor.id, "fire")}
                          className="h-7 px-2 text-xs gap-1 hover:bg-orange-500/10 hover:text-orange-600"
                          title="Trattativa caldissima!"
                        >
                          <Flame className="h-3.5 w-3.5 text-orange-500" />
                          <span className="font-mono text-[11px] font-bold">{rumor.reactions?.fire || 0}</span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReaction(rumor.id, "laugh")}
                          className="h-7 px-2 text-xs gap-1 hover:bg-yellow-500/10 hover:text-yellow-600"
                          title="Buffonata / Risate!"
                        >
                          <Laugh className="h-3.5 w-3.5 text-yellow-500" />
                          <span className="font-mono text-[11px] font-bold">{rumor.reactions?.laugh || 0}</span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReaction(rumor.id, "shock")}
                          className="h-7 px-2 text-xs gap-1 hover:bg-purple-500/10 hover:text-purple-600"
                          title="Colpo incredibile / Shock!"
                        >
                          <Zap className="h-3.5 w-3.5 text-purple-500" />
                          <span className="font-mono text-[11px] font-bold">{rumor.reactions?.shock || 0}</span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReaction(rumor.id, "doubt")}
                          className="h-7 px-2 text-xs gap-1 hover:bg-blue-500/10 hover:text-blue-600"
                          title="Ho forti dubbi..."
                        >
                          <HelpCircle className="h-3.5 w-3.5 text-blue-500" />
                          <span className="font-mono text-[11px] font-bold">{rumor.reactions?.doubt || 0}</span>
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}

                {/* Pager Rumor (5 alla volta) */}
                {totalRumorPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-border/60">
                    <div className="text-xs text-muted-foreground font-medium">
                      Mostrando <strong className="text-foreground">{(rumorPage - 1) * RUMORS_PER_PAGE + 1}</strong> - <strong className="text-foreground">{Math.min(rumorPage * RUMORS_PER_PAGE, rumors.length)}</strong> di <strong className="text-foreground">{rumors.length}</strong> rumor
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setRumorPage((p) => Math.max(1, p - 1));
                          window.scrollTo({ top: 200, behavior: "smooth" });
                        }}
                        disabled={rumorPage === 1}
                        className="h-8 px-2.5 text-xs gap-1 font-semibold rounded-lg"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                        <span>Precedente</span>
                      </Button>

                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalRumorPages }, (_, i) => i + 1).map((p) => {
                          if (
                            p === 1 ||
                            p === totalRumorPages ||
                            (p >= rumorPage - 1 && p <= rumorPage + 1)
                          ) {
                            return (
                              <Button
                                key={p}
                                variant={p === rumorPage ? "default" : "outline"}
                                size="sm"
                                onClick={() => {
                                  setRumorPage(p);
                                  window.scrollTo({ top: 200, behavior: "smooth" });
                                }}
                                className={`h-8 w-8 p-0 text-xs font-mono font-bold rounded-lg ${
                                  p === rumorPage
                                    ? "bg-primary text-primary-foreground"
                                    : "hover:bg-muted"
                                }`}
                              >
                                {p}
                              </Button>
                            );
                          } else if (p === rumorPage - 2 || p === rumorPage + 2) {
                            return (
                              <span key={p} className="text-xs text-muted-foreground px-0.5">
                                …
                              </span>
                            );
                          }
                          return null;
                        })}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setRumorPage((p) => Math.min(totalRumorPages, p + 1));
                          window.scrollTo({ top: 200, behavior: "smooth" });
                        }}
                        disabled={rumorPage === totalRumorPages}
                        className="h-8 px-2.5 text-xs gap-1 font-semibold rounded-lg"
                      >
                        <span>Successivo</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>

        
      </main>
    </div>
  );
}

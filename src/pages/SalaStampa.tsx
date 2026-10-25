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
  ShieldAlert,
  Clock,
  CheckCircle2,
  Filter,
  MessageSquare,
  AlertTriangle,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import {
  fetchPressConferences,
  fetchMarketRumors,
  submitPressAnswer,
  generatePressQuestionsForMatchday,
  generateRandomMarketRumors,
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

  // Filtri Sala Stampa
  const [selectedMatchday, setSelectedMatchday] = useState<string>("ALL");
  const [selectedTeam, setSelectedTeam] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  // Filtri Rumor
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  // Risposta Manager
  const [myAnswerText, setMyAnswerText] = useState("");
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);

  // Modale Chiave API Gemini
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");

  // Azioni Generative
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [isGeneratingRumors, setIsGeneratingRumors] = useState(false);

  // Caricamento Dati
  const loadData = async () => {
    setLoadingPress(true);
    setLoadingRumors(true);

    try {
      const [pressData, rumorsData, marketStatus] = await Promise.all([
        fetchPressConferences(),
        fetchMarketRumors(50),
        checkIsMarketOpen(),
      ]);

      setConferences(pressData);
      setRumors(rumorsData);
      setIsMarketOpen(marketStatus);
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
    const currentKey = getGeminiApiKey();
    if (currentKey) setApiKeyInput(currentKey);
  }, []);

  // Identifica se c'è un'intervista in attesa per la squadra dell'utente connesso
  const pendingForMyTeam = useMemo(() => {
    if (!effectiveTeam) return null;
    return conferences.find(
      (c) => c.team_id === effectiveTeam && c.status === "PENDING"
    );
  }, [conferences, effectiveTeam]);

  // Invio Risposta Manager
  const handleAnswerSubmit = async (conferenceId: number) => {
    if (!myAnswerText.trim()) {
      toast.error("Inserisci una dichiarazione valida prima di inviare.");
      return;
    }

    try {
      setIsSubmittingAnswer(true);
      const res = await submitPressAnswer(
        conferenceId,
        myAnswerText.trim(),
        user?.user_metadata?.manager_name || user?.email?.split("@")[0] || "Presidente"
      );

      if (res.success) {
        toast.success("Dichiarazione ufficiale registrata e pubblicata in Sala Stampa!");
        setMyAnswerText("");
        loadData();
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

  // Generazione Manuale Domande (Admin o quando lista vuota)
  const handleGenerateQuestions = async () => {
    try {
      setIsGeneratingQuestions(true);
      toast.info("Generazione domande della Sala Stampa in corso con l'AI...");
      const matchday = selectedMatchday !== "ALL" ? Number(selectedMatchday) : 1;
      const res = await generatePressQuestionsForMatchday(matchday);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(
          `Completato! ${res.generated} nuove domande generate (${res.skipped} già presenti).`
        );
        loadData();
      }
    } catch (err: any) {
      toast.error(err.message || "Errore imprevisto.");
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  // Generazione Rumor AI
  const handleGenerateRumors = async () => {
    try {
      setIsGeneratingRumors(true);
      toast.info("Il Giornalista AI sta scandagliando il mercato alla ricerca di rumor...");
      const res = await generateRandomMarketRumors(2, isAdmin);
      if (res.success) {
        toast.success(`Generati ${res.generated} nuovi rumor di calciomercato!`);
        loadData();
      } else {
        toast.error(res.error || "Impossibile generare rumor.");
      }
    } catch (err: any) {
      toast.error(err.message || "Errore imprevisto.");
    } finally {
      setIsGeneratingRumors(false);
    }
  };

  // Salvataggio Chiave API
  const handleSaveApiKey = () => {
    setGeminiApiKey(apiKeyInput.trim());
    toast.success("Chiave API Google Gemini aggiornata con successo.");
    setApiKeyModalOpen(false);
  };

  // Filtro Conferenze
  const filteredConferences = useMemo(() => {
    return conferences.filter((c) => {
      if (selectedMatchday !== "ALL" && String(c.matchday) !== selectedMatchday) return false;
      if (selectedTeam !== "ALL" && c.team_id !== selectedTeam) return false;
      if (selectedStatus !== "ALL" && c.status !== selectedStatus) return false;
      return true;
    });
  }, [conferences, selectedMatchday, selectedTeam, selectedStatus]);

  // Filtro Rumor
  const filteredRumors = useMemo(() => {
    return rumors.filter((r) => {
      if (selectedCategory !== "ALL" && r.category !== selectedCategory) return false;
      return true;
    });
  }, [rumors, selectedCategory]);

  // Giornate disponibili per dropdown
  const matchdaysList = useMemo(() => {
    const set = new Set(conferences.map((c) => c.matchday));
    if (set.size === 0) return [1];
    return Array.from(set).sort((a, b) => b - a);
  }, [conferences]);

  const getBadgeVariant = (category: string) => {
    switch (category) {
      case "TRATTATIVA_REALE":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case "TRATTATIVA_DISTORTA":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      case "FAKE_NEWS":
        return "bg-rose-500/10 text-rose-600 border-rose-500/20";
      case "COLPO_A_SORPRESA":
        return "bg-purple-500/10 text-purple-600 border-purple-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getCredibilityBadgeColor = (score: number) => {
    if (score >= 70) return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
    if (score >= 40) return "text-amber-500 bg-amber-500/10 border-amber-500/20";
    return "text-rose-500 bg-rose-500/10 border-rose-500/20";
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
                Conferenze Stampa, Interviste AI & Gossip di Mercato
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight flex items-center gap-3">
              <Newspaper className="h-8 w-8 text-primary" />
              Sala Stampa & Rumor di Mercato
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Spazio ufficiale dedicato alle dichiarazioni dei presidenti e alle indiscrezioni esclusive del Giornalista AI.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setApiKeyModalOpen(true)}
              className="gap-2 text-xs"
              title="Configura Google Gemini API Key"
            >
              <Key className="h-3.5 w-3.5 text-amber-500" />
              <span>Chiave AI</span>
              {getGeminiApiKey() && (
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
              )}
            </Button>

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
        {/* CARD DICHIARAZIONE IN ATTESA PER IL MANAGER COLLEGATO */}
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
                      Microfono Aperto: Sala Stampa Giornata {pendingForMyTeam.matchday}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Il Giornalista AI della Lega ti attende per la conferenza ufficiale pre/post gara.
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 font-bold">
                  In Attesa di Risposta
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
                    <strong>Contesto gara:</strong> {pendingForMyTeam.context_summary}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>La tua dichiarazione ufficiale da Presidente / Allenatore:</span>
                  <span className="text-[11px] text-muted-foreground">
                    {myAnswerText.length}/400 caratteri
                  </span>
                </label>
                <Textarea
                  placeholder="Rispondi alla domanda dei media (es. 'Siamo concentrati sull'obiettivo, il gruppo ha lavorato duramente in settimana e in campo daremo tutto...')"
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
                className="gap-2"
              >
                {isSubmittingAnswer ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Rilascia Dichiarazione Ufficiale
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
          {/* TAB 1: INTERVISTE & CONFERENZE STAMPA */}
          {/* ------------------------------------------------------------- */}
          <TabsContent value="press" className="space-y-6">
            {/* Barra filtri & Azioni Admin */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-card border border-border/80 shadow-sm">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-semibold text-muted-foreground">Filtra per:</span>
                </div>

                {/* Filtro Giornata */}
                <Select value={selectedMatchday} onValueChange={setSelectedMatchday}>
                  <SelectTrigger className="w-[140px] h-8 text-xs">
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
                  <SelectTrigger className="w-[160px] h-8 text-xs">
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

                {/* Filtro Stato */}
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-[140px] h-8 text-xs">
                    <SelectValue placeholder="Stato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tutti gli Stati</SelectItem>
                    <SelectItem value="ANSWERED">Dichiarati</SelectItem>
                    <SelectItem value="PENDING">In Attesa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Azioni Amministrazione */}
              {isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateQuestions}
                  disabled={isGeneratingQuestions}
                  className="gap-2 text-xs border-primary/30 text-primary hover:bg-primary/5 self-start md:self-auto"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {isGeneratingQuestions ? "Generazione in corso..." : "Genera Domande Giornata"}
                </Button>
              )}
            </div>

            {/* Griglia Conferenze */}
            {loadingPress ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-3">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Caricamento conferenze stampa in corso...</p>
              </div>
            ) : filteredConferences.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl border border-dashed border-border/80 bg-muted/20">
                <Mic2 className="h-12 w-12 text-muted-foreground/40 mb-3" />
                <h3 className="text-base font-semibold">Nessuna conferenza stampa trovata</h3>
                <p className="text-xs text-muted-foreground max-w-sm mt-1">
                  Non ci sono ancora interviste registrate con i filtri selezionati.
                  {isAdmin && " Come Admin, puoi cliccare sul pulsante 'Genera Domande Giornata' in alto a destra."}
                </p>
                {isAdmin && (
                  <Button
                    size="sm"
                    onClick={handleGenerateQuestions}
                    disabled={isGeneratingQuestions}
                    className="mt-4 gap-2 text-xs"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Genera Domande per la Giornata
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredConferences.map((conf) => {
                  const isAnswered = conf.status === "ANSWERED";
                  return (
                    <Card
                      key={conf.id}
                      className={`border transition-all duration-200 hover:shadow-md ${
                        isAnswered ? "border-border/80 bg-card" : "border-amber-500/30 bg-amber-500/[0.02]"
                      }`}
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
                              G{conf.matchday}
                            </Badge>
                            {isAnswered ? (
                              <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold flex items-center gap-1">
                                <CheckCircle2 className="h-2.5 w-2.5" />
                                Rilasciata
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20 font-bold flex items-center gap-1">
                                <Clock className="h-2.5 w-2.5" />
                                In Attesa
                              </Badge>
                            )}
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
                          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                            <MessageSquare className="h-3 w-3 text-emerald-500" />
                            Dichiarazione Presidente:
                          </div>

                          {isAnswered && conf.answer ? (
                            <div className="text-xs text-foreground bg-primary/5 border border-primary/20 p-3 rounded-lg relative">
                              <p className="font-normal leading-relaxed">
                                "{conf.answer}"
                              </p>
                              <div className="text-[10px] text-muted-foreground text-right mt-1.5 font-mono">
                                {conf.answered_at ? new Date(conf.answered_at).toLocaleString("it-IT", { dateStyle: "short", timeStyle: "short" }) : ""}
                              </div>
                            </div>
                          ) : (
                            <div className="text-xs text-muted-foreground italic bg-muted/20 border border-dashed border-border/80 p-3 rounded-lg flex items-center justify-between">
                              <span>In attesa che il Presidente rilasci la dichiarazione...</span>
                              {effectiveTeam === conf.team_id && (
                                <Badge className="text-[10px] bg-primary text-primary-foreground">
                                  Tocca a te
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ------------------------------------------------------------- */}
          {/* TAB 2: GOSSIP & RUMOR DI CALCIOMERCATO */}
          {/* ------------------------------------------------------------- */}
          <TabsContent value="rumors" className="space-y-6">
            {/* Market Banner & Controls */}
            <div className="p-4 rounded-xl bg-card border border-border/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      isMarketOpen ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                    }`}
                  />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {isMarketOpen ? "Calciomercato LCSIM Aperto" : "Calciomercato Chiuso"}
                  </span>
                </div>

                {/* Filtro Categoria */}
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[180px] h-8 text-xs">
                    <SelectValue placeholder="Categoria Rumor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tutti i Rumor</SelectItem>
                    <SelectItem value="TRATTATIVA_REALE">Trattative Reali</SelectItem>
                    <SelectItem value="TRATTATIVA_DISTORTA">Trattative Distorte</SelectItem>
                    <SelectItem value="FAKE_NEWS">Fake News</SelectItem>
                    <SelectItem value="COLPO_A_SORPRESA">Colpi a Sorpresa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 self-start md:self-auto">
                <Button
                  size="sm"
                  onClick={handleGenerateRumors}
                  disabled={isGeneratingRumors || (!isMarketOpen && !isAdmin)}
                  className="gap-2 text-xs bg-amber-600 hover:bg-amber-700 text-white font-bold"
                >
                  <Flame className="h-3.5 w-3.5" />
                  {isGeneratingRumors ? "Il giornalista indaga..." : "Scatena Rumor (AI)"}
                </Button>
              </div>
            </div>

            {/* Feed Rumor */}
            {loadingRumors ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-3">
                <RefreshCw className="h-8 w-8 animate-spin text-amber-500" />
                <p className="text-sm text-muted-foreground">Scansione bacheca e indiscrezioni in corso...</p>
              </div>
            ) : filteredRumors.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl border border-dashed border-border/80 bg-muted/20">
                <Flame className="h-12 w-12 text-muted-foreground/40 mb-3" />
                <h3 className="text-base font-semibold">Nessun rumor di mercato presente</h3>
                <p className="text-xs text-muted-foreground max-w-sm mt-1">
                  Non ci sono ancora voci o scoop registrati. Clicca su 'Scatena Rumor (AI)' per generare notizie fresche.
                </p>
                <Button
                  size="sm"
                  onClick={handleGenerateRumors}
                  disabled={isGeneratingRumors}
                  className="mt-4 gap-2 text-xs bg-amber-600 hover:bg-amber-700 text-white"
                >
                  <Flame className="h-3.5 w-3.5" />
                  Genera i Primi Rumor
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRumors.map((rumor) => (
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
                          <Badge variant="outline" className={`text-[10px] font-bold ${getBadgeVariant(rumor.category)}`}>
                            {rumor.category.replace(/_/g, " ")}
                          </Badge>
                          <Badge variant="outline" className={`text-[10px] font-mono font-bold ${getCredibilityBadgeColor(rumor.credibility_score)}`}>
                            {rumor.credibility_badge} ({rumor.credibility_score}%)
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

                      {/* Tag Club e Calciatori */}
                      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/40">
                        {rumor.involved_team_ids && rumor.involved_team_ids.length > 0 && (
                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <strong>Club coinvolti:</strong>
                            {rumor.involved_team_ids.map((tid) => (
                              <Badge key={tid} variant="secondary" className="text-[10px] px-1.5 py-0 font-bold">
                                {tid}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {rumor.involved_player_names && rumor.involved_player_names.length > 0 && (
                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground ml-auto">
                            <strong>Protagonisti:</strong>
                            <span className="font-semibold text-foreground">
                              {rumor.involved_player_names.join(", ")}
                            </span>
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
                          title="Fake news totale / Risate!"
                        >
                          <Laugh className="h-3.5 w-3.5 text-yellow-500" />
                          <span className="font-mono text-[11px] font-bold">{rumor.reactions?.laugh || 0}</span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReaction(rumor.id, "shock")}
                          className="h-7 px-2 text-xs gap-1 hover:bg-purple-500/10 hover:text-purple-600"
                          title="Shock / Colpo incredibile!"
                        >
                          <Zap className="h-3.5 w-3.5 text-purple-500" />
                          <span className="font-mono text-[11px] font-bold">{rumor.reactions?.shock || 0}</span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReaction(rumor.id, "doubt")}
                          className="h-7 px-2 text-xs gap-1 hover:bg-blue-500/10 hover:text-blue-600"
                          title="Ho seri dubbi..."
                        >
                          <HelpCircle className="h-3.5 w-3.5 text-blue-500" />
                          <span className="font-mono text-[11px] font-bold">{rumor.reactions?.doubt || 0}</span>
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* ========================================================= */}
        {/* MODALE CONFIGURAZIONE CHIAVE GEMINI */}
        {/* ========================================================= */}
        <Dialog open={apiKeyModalOpen} onOpenChange={setApiKeyModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-amber-500" />
                Chiave API Google Gemini (Gratuita)
              </DialogTitle>
              <DialogDescription className="text-xs">
                Inserisci la tua API Key di <strong>Google AI Studio</strong> per abilitare la generazione iper-realistica e contestuale delle interviste e dei rumor di mercato.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold">Gemini API Key:</label>
                <Input
                  type="password"
                  placeholder="AIzaSy..."
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                />
              </div>

              <div className="p-3 rounded-lg bg-muted/40 border border-border/80 text-xs space-y-2">
                <p className="font-semibold text-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
                  100% Gratuito & Istantaneo
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Puoi ottenere gratuitamente una chiave API in 1 minuto su{" "}
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary underline font-medium"
                  >
                    Google AI Studio
                  </a>
                  . Il tier gratuito offre fino a 1.500 richieste al giorno (più che sufficienti per tutta la stagione).
                </p>
                <p className="text-[11px] text-muted-foreground italic">
                  Se non inserisci alcuna chiave, il sistema utilizzerà automaticamente il <strong>generatore procedurale interno</strong> senza alcuna interruzione.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setApiKeyModalOpen(false)}>
                Annulla
              </Button>
              <Button onClick={handleSaveApiKey}>Salva Chiave</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}

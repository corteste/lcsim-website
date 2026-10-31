import React, { useState, useEffect, useMemo } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeftRight,
  Shield,
  Sparkles,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Inbox,
  Send,
  History,
  ShieldAlert,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Lock,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  fetchTeamTrades,
  fetchAdminPendingTrades,
  fetchAllTradesForAdmin,
  fetchCompletedTrades,
  adminApproveTrade,
  adminRejectTrade,
} from "@/services/tradesService";
import { EnrichedTrade, TRADE_STATUS_CONFIG } from "@/types/trades";
import { getMarketState } from "@/services/marketStateService";
import { NewTradeModal } from "@/components/trades/NewTradeModal";
import { TradeDetailsModal } from "@/components/trades/TradeDetailsModal";
import { Link, useSearchParams } from "react-router-dom";
import { TeamMarketNeedsCard } from "@/components/trades/TeamMarketNeedsCard";
import { toast } from "sonner";
import { SUPABASE_STORAGE_URL } from "@/constants/App";

export default function Trattative() {
  const { user, isAdmin, effectiveTeam, effectiveTeamFullName, openLogin } = useAuth();
  const currentTeam = user?.team || effectiveTeam;

  const [trades, setTrades] = useState<EnrichedTrade[]>([]);
  const [adminPendingTrades, setAdminPendingTrades] = useState<EnrichedTrade[]>([]);
  const [completedTradesList, setCompletedTradesList] = useState<EnrichedTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isMarketOpen, setIsMarketOpen] = useState(true);

  // Modals state
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<EnrichedTrade | null>(null);
  const [counterOfferSource, setCounterOfferSource] = useState<EnrichedTrade | null>(null);
  const [searchParams] = useSearchParams();
  const recipientParam = searchParams.get("recipient") || "";
  const [initialRecipient, setInitialRecipient] = useState<string>(recipientParam);

  useEffect(() => {
    if (recipientParam) {
      setInitialRecipient(recipientParam);
      setNewModalOpen(true);
    }
  }, [recipientParam]);

  const loadData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const [teamTrades, pendingAdmin, completed, marketState] = await Promise.all([
      user.team ? fetchTeamTrades(user.team) : Promise.resolve([]),
      isAdmin ? fetchAdminPendingTrades() : Promise.resolve([]),
      fetchCompletedTrades(),
      getMarketState(),
    ]);
    setTrades(teamTrades);
    setAdminPendingTrades(pendingAdmin);
    setCompletedTradesList(completed);
    setIsMarketOpen(marketState.isOpen);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [user, isAdmin]);

  // Categorize trades for current user
  const receivedTrades = useMemo(() => {
    if (!user?.team) return [];
    return trades.filter((t) => t.receiver_team === user.team && t.status !== "completed");
  }, [trades, user]);

  const pendingReceivedCount = useMemo(() => {
    return receivedTrades.filter((t) => t.status === "pending").length;
  }, [receivedTrades]);

  const sentTrades = useMemo(() => {
    if (!user?.team) return [];
    return trades.filter((t) => t.sender_team === user.team && t.status !== "completed");
  }, [trades, user]);

  const myCompletedTrades = useMemo(() => {
    if (!user?.team) return completedTradesList;
    return completedTradesList.filter(
      (t) => t.sender_team === user.team || t.receiver_team === user.team
    );
  }, [completedTradesList, user]);

  const handleOpenDetails = (trade: EnrichedTrade) => {
    setSelectedTrade(trade);
    setDetailsModalOpen(true);
  };

  const handleOpenCounterOffer = (trade: EnrichedTrade) => {
    setCounterOfferSource(trade);
    setNewModalOpen(true);
  };

  const handleOpenNewTrade = () => {
    setCounterOfferSource(null);
    setNewModalOpen(true);
  };

  // Quick action from Admin Card
  const handleQuickApprove = async (trade: EnrichedTrade) => {
    if (!window.confirm(`Confermi l'approvazione ufficiale dello scambio tra ${trade.sender_team} e ${trade.receiver_team}? Le rose e le scelte verranno trasferite a sistema.`)) {
      return;
    }
    setActionLoading(true);
    const adminUser = user?.name || user?.username || "Admin Lega";
    const res = await adminApproveTrade(trade, adminUser);
    setActionLoading(false);

    if (res.success) {
      toast.success("Scambio approvato ed eseguito ufficialmente in Serie A!");
      loadData();
    } else {
      toast.error(res.error || "Errore durante l'approvazione dello scambio.");
    }
  };

  const handleQuickReject = async (trade: EnrichedTrade) => {
    const reason = window.prompt("Motivazione del rifiuto della Lega:");
    if (reason === null) return;

    setActionLoading(true);
    const adminUser = user?.name || user?.username || "Admin Lega";
    const res = await adminRejectTrade(trade.id, adminUser, reason);
    setActionLoading(false);

    if (res.success) {
      toast.info("Scambio respinto dalla Lega.");
      loadData();
    } else {
      toast.error(res.error || "Errore durante il rifiuto.");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        {/* HERO SECTION */}
        <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-card via-card/90 to-muted/40 p-6 md:p-8 shadow-xl mb-8">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              {isAdmin ? (
                <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30 flex items-center justify-center shadow-inner">
                  <ShieldAlert className="h-8 w-8 md:h-10 md:w-10" />
                </div>
              ) : currentTeam ? (
                <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-muted/60 border border-border flex items-center justify-center p-2 shadow-inner">
                  <img
                    src={`${SUPABASE_STORAGE_URL}/images/teams/${currentTeam}_Logo.png`}
                    alt={currentTeam}
                    className="max-h-full max-w-full object-contain drop-shadow"
                    onError={(e) => ((e.target as HTMLElement).style.display = "none")}
                  />
                </div>
              ) : (
                <div className="h-16 w-16 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20">
                  <ArrowLeftRight className="h-8 w-8" />
                </div>
              )}

              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-[11px] font-black uppercase tracking-wider text-blue-500 font-mono">
                    {isAdmin ? "Amministrazione Lega · Controllo Scambi" : "La Mia Squadra · Mercato & Scambi"}
                  </span>
                  {user?.team && (
                    <Badge variant="outline" className="font-mono text-[10px] font-bold">
                      {user.team}
                    </Badge>
                  )}
                  {isAdmin && (
                    <Badge className="bg-purple-600/15 text-purple-600 dark:text-purple-400 border-purple-500/30 text-[10px] font-black">
                      Super Admin di Lega
                    </Badge>
                  )}
                  <Badge
                    variant="outline"
                    className={
                      isMarketOpen
                        ? "text-[10px] font-bold border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 flex items-center gap-1.5 uppercase font-mono"
                        : "text-[10px] font-bold border-rose-500/40 text-rose-600 dark:text-rose-400 bg-rose-500/10 flex items-center gap-1.5 uppercase font-mono"
                    }
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${isMarketOpen ? "bg-emerald-500" : "bg-rose-500 animate-pulse"}`} />
                    Mercato {isMarketOpen ? "Aperto" : "Chiuso"}
                  </Badge>
                </div>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight">
                  {isAdmin ? "Pannello Convalida & Controllo Scambi" : "Trattative & Proposte di Scambio"}
                </h1>
                <p className="text-xs md:text-sm text-muted-foreground mt-1 max-w-2xl">
                  {isAdmin
                    ? "In qualità di Amministratore di Lega puoi esaminare, convalidare ed eseguire all'istante qualsiasi scambio attivo o concordato in Serie A."
                    : "Negozia calciatori e scelte del draft con le altre società. Tutte le trattative rimangono segrete fino all'approvazione finale della Lega."}
                </p>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex flex-wrap items-center gap-3">
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

              {user ? (
                <Button
                  size="sm"
                  onClick={() => {
                    if (!isMarketOpen && !isAdmin) {
                      toast.error("Il Calciomercato è attualmente chiuso dalla Lega. Non è possibile creare nuove proposte.");
                      return;
                    }
                    handleOpenNewTrade();
                  }}
                  disabled={!isMarketOpen && !isAdmin}
                  className={`h-10 text-xs font-black px-4 ${
                    !isMarketOpen && !isAdmin
                      ? "opacity-60 cursor-not-allowed bg-muted text-muted-foreground border border-border"
                      : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                  }`}
                  title={!isMarketOpen && !isAdmin ? "Calciomercato chiuso dalla Lega" : "Crea una nuova proposta di scambio"}
                >
                  {!isMarketOpen && !isAdmin ? <Lock className="h-4 w-4 mr-1.5" /> : <Plus className="h-4 w-4 mr-1.5" />}
                  Nuova Proposta
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => openLogin("login")}
                  className="h-10 text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  Accedi per Negoziare
                </Button>
              )}
            </div>
          </div>

          {/* Quick Metrics Cards */}
          {user && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-border/60">
              {isAdmin ? (
                <>
                  <div className="p-3 rounded-xl bg-purple-500/15 border border-purple-500/30 flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-purple-700 dark:text-purple-300 font-mono">
                      In Attesa Convalida Lega
                    </span>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-2xl font-black text-purple-700 dark:text-purple-300">
                        {adminPendingTrades.length}
                      </span>
                      <Badge className="bg-purple-600 text-white text-[10px] font-black animate-pulse">
                        Azione Richiesta
                      </Badge>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-card/60 border border-border/60 flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground font-mono">
                      Scambi Ufficiali Eseguiti
                    </span>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-2xl font-black text-emerald-500">{completedTradesList.length}</span>
                      <Link
                        to="/mercato/scambi"
                        className="text-[10px] text-blue-500 hover:underline flex items-center gap-1 font-bold"
                      >
                        Bacheca <ExternalLink className="h-2.5 w-2.5" />
                      </Link>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-card/60 border border-border/60 flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground font-mono">
                      Club Attivi in Trattativa
                    </span>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-2xl font-black text-blue-500">
                        {new Set(adminPendingTrades.flatMap((t) => [t.sender_team, t.receiver_team])).size}
                      </span>
                      <span className="text-xs text-muted-foreground">società</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-card/60 border border-border/60 flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground font-mono">
                      Stato Mercato
                    </span>
                    <div className="flex items-center justify-between mt-1">
                      <span className={`text-xs font-black uppercase ${isMarketOpen ? "text-emerald-500" : "text-rose-500"}`}>
                        {isMarketOpen ? "Aperto" : "Chiuso"}
                      </span>
                      <Badge
                        variant="outline"
                        className={
                          isMarketOpen
                            ? "text-[10px] font-mono border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                            : "text-[10px] font-mono border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-500/10 font-bold"
                        }
                      >
                        {isMarketOpen ? "Sessione S11" : "Bloccato"}
                      </Badge>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-3 rounded-xl bg-card/60 border border-border/60 flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground font-mono">
                      Proposte Ricevute
                    </span>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xl font-black">{receivedTrades.length}</span>
                      {pendingReceivedCount > 0 && (
                        <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30 text-[10px] font-black animate-pulse">
                          {pendingReceivedCount} da valutare
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-card/60 border border-border/60 flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground font-mono">
                      Proposte Inviate
                    </span>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xl font-black">{sentTrades.length}</span>
                      <span className="text-xs text-muted-foreground">in corso</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-card/60 border border-border/60 flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground font-mono">
                      I Miei Scambi Conclusi
                    </span>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xl font-black text-emerald-500">{myCompletedTrades.length}</span>
                      <Link
                        to="/mercato/scambi"
                        className="text-[10px] text-blue-500 hover:underline flex items-center gap-1 font-bold"
                      >
                        Bacheca <ExternalLink className="h-2.5 w-2.5" />
                      </Link>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-card/60 border border-border/60 flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground font-mono">
                      La Tua Società
                    </span>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-base font-black truncate">{effectiveTeamFullName}</span>
                      <span className="text-[10px] font-mono text-muted-foreground">({currentTeam})</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Banner Avviso Calciomercato Chiuso */}
        {!isMarketOpen && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 flex items-start sm:items-center gap-3.5 shadow-sm">
            <div className="h-10 w-10 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/30">
              <Lock className="h-5 w-5" />
            </div>
            <div className="text-xs leading-relaxed">
              <strong className="font-extrabold text-sm block text-rose-600 dark:text-rose-400 mb-0.5">
                Finestra di Calciomercato Chiusa dalla Lega
              </strong>
              La sessione di calciomercato è attualmente chiusa: l'invio di nuove proposte e l'accettazione o il rifiuto delle trattative sono sospesi per tutti i club. Le società possono comunque consultare lo storico e le schede delle trattative.
            </div>
          </div>
        )}

        {/* BISOGNI DI MERCATO DEL CLUB */}
        {user && currentTeam && (
          <div className="mb-8">
            <TeamMarketNeedsCard
              teamId={currentTeam}
              teamName={effectiveTeamFullName}
              userName={user?.name || user?.username}
            />
          </div>
        )}

        {/* TABS TRATTATIVE */}
        {!user ? (
          <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card/50">
            <Shield className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <h3 className="text-base font-bold">Autenticazione Richiesta</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
              Per accedere alla tua bacheca delle trattative e formulare proposte di mercato, accedi con le credenziali del tuo account.
            </p>
            <Button
              size="sm"
              onClick={() => openLogin("login")}
              className="mt-4 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              Accedi alla Piattaforma
            </Button>
          </div>
        ) : (
          <Tabs defaultValue={isAdmin ? "admin_approval" : "received"} className="space-y-6">
            <TabsList className="bg-muted p-1 rounded-xl h-auto flex flex-wrap gap-1">
              {isAdmin && (
                <TabsTrigger
                  value="admin_approval"
                  className="text-xs font-bold py-2 px-4 rounded-lg data-[state=active]:bg-purple-600 data-[state=active]:text-white font-mono"
                >
                  <ShieldAlert className="h-3.5 w-3.5 mr-1.5" />
                  Scambi da Convalidare ({adminPendingTrades.length})
                </TabsTrigger>
              )}

              {user.team && (
                <>
                  <TabsTrigger
                    value="received"
                    className="text-xs font-bold py-2 px-4 rounded-lg data-[state=active]:bg-background"
                  >
                    <Inbox className="h-3.5 w-3.5 mr-1.5" />
                    Ricevute ({receivedTrades.length})
                    {pendingReceivedCount > 0 && (
                      <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-mono font-bold">
                        {pendingReceivedCount}
                      </span>
                    )}
                  </TabsTrigger>

                  <TabsTrigger
                    value="sent"
                    className="text-xs font-bold py-2 px-4 rounded-lg data-[state=active]:bg-background"
                  >
                    <Send className="h-3.5 w-3.5 mr-1.5" />
                    Inviate ({sentTrades.length})
                  </TabsTrigger>
                </>
              )}

              <TabsTrigger
                value="completed"
                className="text-xs font-bold py-2 px-4 rounded-lg data-[state=active]:bg-background"
              >
                <History className="h-3.5 w-3.5 mr-1.5" />
                Storico Conclusi ({isAdmin ? completedTradesList.length : myCompletedTrades.length})
              </TabsTrigger>
            </TabsList>

            {/* TAB ADMIN APPROVAL */}
            {isAdmin && (
              <TabsContent value="admin_approval" className="space-y-4">
                <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-700 dark:text-purple-300 flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 shrink-0 text-purple-600" />
                    <span>
                      <strong>Pannello Esecutivo Admin</strong>: In questa sezione compaiono tutte le trattative concluse tra le società o in corso. Puoi cliccare <strong>"Approva"</strong> direttamente su ciascuna card o aprire la scheda per esaminare i dettagli e i messaggi.
                    </span>
                  </div>
                </div>

                {adminPendingTrades.length === 0 ? (
                  <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card/40">
                    <CheckCircle2 className="h-10 w-10 text-emerald-500/40 mx-auto mb-2" />
                    <div className="text-sm font-bold">Nessuno scambio in attesa di approvazione</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Tutte le proposte concordate tra i club sono già state convalidate ed eseguite.
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {adminPendingTrades.map((trade) => (
                      <TradeCard
                        key={trade.id}
                        trade={trade}
                        currentTeam={currentTeam}
                        isAdminView={true}
                        onOpenDetails={() => handleOpenDetails(trade)}
                        onQuickApprove={() => handleQuickApprove(trade)}
                        onQuickReject={() => handleQuickReject(trade)}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            )}

            {/* TAB RICEVUTE (Manager) */}
            {user.team && (
              <TabsContent value="received" className="space-y-4">
                {receivedTrades.length === 0 ? (
                  <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card/40">
                    <Inbox className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                    <div className="text-sm font-bold">Nessuna proposta ricevuta</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Non hai ancora ricevuto offerte di scambio da altre squadre.
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {receivedTrades.map((trade) => (
                      <TradeCard
                        key={trade.id}
                        trade={trade}
                        currentTeam={currentTeam}
                        onOpenDetails={() => handleOpenDetails(trade)}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            )}

            {/* TAB INVIATE (Manager) */}
            {user.team && (
              <TabsContent value="sent" className="space-y-4">
                {sentTrades.length === 0 ? (
                  <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card/40">
                    <Send className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                    <div className="text-sm font-bold">Nessuna proposta inviata</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Non hai trattative attive inviate ad altri club.
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        if (!isMarketOpen && !isAdmin) {
                          toast.error("Il Calciomercato è attualmente chiuso dalla Lega.");
                          return;
                        }
                        handleOpenNewTrade();
                      }}
                      disabled={!isMarketOpen && !isAdmin}
                      className={`mt-3 text-xs font-bold ${
                        !isMarketOpen && !isAdmin
                          ? "opacity-60 cursor-not-allowed bg-muted text-muted-foreground border border-border"
                          : "bg-blue-600 hover:bg-blue-500 text-white"
                      }`}
                    >
                      {!isMarketOpen && !isAdmin ? <Lock className="h-3.5 w-3.5 mr-1" /> : null}
                      Crea Proposta
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sentTrades.map((trade) => (
                      <TradeCard
                        key={trade.id}
                        trade={trade}
                        currentTeam={currentTeam}
                        onOpenDetails={() => handleOpenDetails(trade)}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            )}

            {/* TAB STORICO */}
            <TabsContent value="completed" className="space-y-4">
              {(isAdmin ? completedTradesList : myCompletedTrades).length === 0 ? (
                <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card/40">
                  <History className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                  <div className="text-sm font-bold">Nessuno scambio concluso</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Le trattative accettate ed eseguite ufficialmente compariranno qui.
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(isAdmin ? completedTradesList : myCompletedTrades).map((trade) => (
                    <TradeCard
                      key={trade.id}
                      trade={trade}
                      currentTeam={currentTeam}
                      onOpenDetails={() => handleOpenDetails(trade)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>

      {/* NEW TRADE MODAL */}
      <NewTradeModal
        open={newModalOpen}
        onOpenChange={setNewModalOpen}
        onTradeCreated={loadData}
        counterOfferTrade={counterOfferSource}
        isMarketOpen={isMarketOpen}
      />

      {/* TRADE DETAILS / NEGOTIATION MODAL */}
      <TradeDetailsModal
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        trade={selectedTrade}
        onTradeUpdated={loadData}
        onOpenCounterOffer={handleOpenCounterOffer}
        isMarketOpen={isMarketOpen}
      />
    </div>
  );
}

// ----------------------------------------------------------------------
// SUB-COMPONENT: TRADE CARD
// ----------------------------------------------------------------------
interface TradeCardProps {
  trade: EnrichedTrade;
  currentTeam: string;
  isAdminView?: boolean;
  onOpenDetails: () => void;
  onQuickApprove?: () => void;
  onQuickReject?: () => void;
}

const TradeCard: React.FC<TradeCardProps> = ({
  trade,
  currentTeam,
  isAdminView,
  onOpenDetails,
  onQuickApprove,
  onQuickReject,
}) => {
  const isSender = trade.sender_team === currentTeam;
  const partnerTeam = isSender ? trade.receiver_team : trade.sender_team;
  const partnerTeamName = isSender ? trade.receiver_team_name : trade.sender_team_name;
  const statusCfg = TRADE_STATUS_CONFIG[trade.status] || {
    label: trade.status,
    badgeClass: "bg-muted text-muted-foreground",
    description: "",
  };

  const totalOffered = trade.offered_players.length + trade.offered_picks.length;
  const totalRequested = trade.requested_players.length + trade.requested_picks.length;

  return (
    <Card className="overflow-hidden border-border/80 bg-card hover:border-purple-500/40 transition-all shadow-sm">
      <CardContent className="p-4 flex flex-col justify-between gap-4 h-full">
        {/* Card Header */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            {isAdminView ? (
              <div className="flex items-center gap-2">
                <img
                  src={`${SUPABASE_STORAGE_URL}/images/teams/${trade.sender_team}_Logo.png`}
                  alt={trade.sender_team}
                  className="h-5 w-5 object-contain"
                  onError={(e) => ((e.target as HTMLElement).style.display = "none")}
                />
                <span className="font-black text-xs">{trade.sender_team}</span>
                <ArrowLeftRight className="h-3 w-3 text-muted-foreground" />
                <img
                  src={`${SUPABASE_STORAGE_URL}/images/teams/${trade.receiver_team}_Logo.png`}
                  alt={trade.receiver_team}
                  className="h-5 w-5 object-contain"
                  onError={(e) => ((e.target as HTMLElement).style.display = "none")}
                />
                <span className="font-black text-xs">{trade.receiver_team}</span>
              </div>
            ) : (
              <>
                <img
                  src={`${SUPABASE_STORAGE_URL}/images/teams/${partnerTeam}_Logo.png`}
                  alt={partnerTeam}
                  className="h-6 w-6 object-contain"
                  onError={(e) => ((e.target as HTMLElement).style.display = "none")}
                />
                <div className="min-w-0">
                  <span className="text-[10px] font-mono text-muted-foreground uppercase">
                    {isSender ? "Inviata a" : "Ricevuta da"}
                  </span>
                  <div className="font-extrabold text-xs truncate">{partnerTeamName}</div>
                </div>
              </>
            )}
          </div>

          <Badge className={`text-[10px] font-bold ${statusCfg.badgeClass}`}>
            {statusCfg.label}
          </Badge>
        </div>

        {/* Assets Summary */}
        <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-muted/30 border border-border/50 text-xs">
          <div>
            <div className="text-[10px] font-mono text-blue-500 font-bold uppercase mb-1">
              {trade.sender_team} cede ({totalOffered}):
            </div>
            <div className="space-y-0.5">
              {trade.offered_players.map((p) => (
                <div key={p.ID} className="truncate text-[11px] font-medium">
                  • {p.Nome} {p.Cognome} ({p.Posiz} {p.OVR})
                </div>
              ))}
              {trade.offered_picks.map((pk) => (
                <div key={pk.pick_overall} className="truncate text-[11px] font-medium text-amber-500">
                  • Scelta #{pk.pick_overall} (R{pk.round})
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[10px] font-mono text-emerald-500 font-bold uppercase mb-1">
              {trade.receiver_team} cede ({totalRequested}):
            </div>
            <div className="space-y-0.5">
              {trade.requested_players.map((p) => (
                <div key={p.ID} className="truncate text-[11px] font-medium">
                  • {p.Nome} {p.Cognome} ({p.Posiz} {p.OVR})
                </div>
              ))}
              {trade.requested_picks.map((pk) => (
                <div key={pk.pick_overall} className="truncate text-[11px] font-medium text-amber-500">
                  • Scelta #{pk.pick_overall} (R{pk.round})
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-1 border-t border-border/50 text-[11px] text-muted-foreground flex-wrap gap-2">
          <div className="flex items-center gap-1 font-mono">
            <Clock className="h-3 w-3" />
            <span>{new Date(trade.created_at).toLocaleDateString("it-IT")}</span>
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            <Button
              size="sm"
              variant="outline"
              onClick={onOpenDetails}
              className="h-7 text-xs font-bold"
            >
              Scheda Dettagli
            </Button>

            {isAdminView && onQuickReject && trade.status !== "completed" && (
              <Button
                size="sm"
                variant="outline"
                onClick={onQuickReject}
                className="h-7 text-xs font-bold text-rose-600 hover:bg-rose-500/10 hover:text-rose-700"
              >
                <XCircle className="h-3.5 w-3.5 mr-1" /> Respingi
              </Button>
            )}

            {isAdminView && onQuickApprove && trade.status !== "completed" && (
              <Button
                size="sm"
                onClick={onQuickApprove}
                className="h-7 text-xs font-black bg-purple-600 hover:bg-purple-500 text-white shadow-xs"
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approva Scambio
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

import React, { useState, useEffect, useMemo } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  const [adminAllTrades, setAdminAllTrades] = useState<EnrichedTrade[]>([]);
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

  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (tabParam && ["received", "sent", "history", "admin_approval"].includes(tabParam)) {
      return tabParam;
    }
    return isAdmin ? "admin_approval" : "received";
  });

  useEffect(() => {
    if (tabParam && ["received", "sent", "history", "admin_approval"].includes(tabParam)) {
      setActiveTab(tabParam);
    } else if (isAdmin) {
      setActiveTab("admin_approval");
    } else {
      setActiveTab("received");
    }
  }, [isAdmin, tabParam]);

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
    const [teamTrades, pendingAdmin, adminAll, completed, marketState] = await Promise.all([
      user.team ? fetchTeamTrades(user.team) : Promise.resolve([]),
      isAdmin ? fetchAdminPendingTrades() : Promise.resolve([]),
      isAdmin ? fetchAllTradesForAdmin() : Promise.resolve([]),
      fetchCompletedTrades(),
      getMarketState(),
    ]);
    setTrades(teamTrades);
    setAdminPendingTrades(pendingAdmin);
    setAdminAllTrades(adminAll);
    setCompletedTradesList(completed);
    setIsMarketOpen(marketState.isOpen);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [user, isAdmin]);

  const CLOSED_STATUSES = ["completed", "rejected", "admin_rejected", "cancelled"];

  // Categorize trades for current user: only active proposals
  const receivedTrades = useMemo(() => {
    if (!user?.team) return [];
    return trades.filter((t) => t.receiver_team === user.team && !CLOSED_STATUSES.includes(t.status));
  }, [trades, user]);

  const pendingReceivedCount = useMemo(() => {
    return receivedTrades.filter((t) => t.status === "pending").length;
  }, [receivedTrades]);

  const sentTrades = useMemo(() => {
    if (!user?.team) return [];
    return trades.filter((t) => t.sender_team === user.team && !CLOSED_STATUSES.includes(t.status));
  }, [trades, user]);

  // Closed trades history (completed, rejected, admin_rejected, cancelled)
  const historyTrades = useMemo(() => {
    if (isAdmin) {
      return adminAllTrades.filter((t) => CLOSED_STATUSES.includes(t.status));
    }
    if (!user?.team) return [];
    return trades.filter(
      (t) => (t.sender_team === user.team || t.receiver_team === user.team) && CLOSED_STATUSES.includes(t.status)
    );
  }, [isAdmin, adminAllTrades, trades, user]);

  const handleOpenDetails = (trade: EnrichedTrade) => {
    setSelectedTrade(trade);
    setDetailsModalOpen(true);
  };

  const handleOpenCounterOffer = (trade: EnrichedTrade) => {
    setDetailsModalOpen(false);
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

          {/* Quick Metrics & Nav Cards */}
          {user && (
            <div className={`grid gap-3 mt-6 pt-6 border-t border-border/60 ${isAdmin ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-1 sm:grid-cols-3"}`}>
              {isAdmin ? (
                <>
                  <button
                    type="button"
                    onClick={() => setActiveTab("admin_approval")}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      activeTab === "admin_approval"
                        ? "bg-purple-500/20 border-purple-500 shadow-md ring-2 ring-purple-500/30"
                        : "bg-card/60 border-border/60 hover:bg-muted/50 hover:border-purple-500/40"
                    } flex flex-col justify-between`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-purple-700 dark:text-purple-300 font-mono">
                        In Attesa Convalida Lega
                      </span>
                      <ShieldAlert className="h-3.5 w-3.5 text-purple-500" />
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-2xl font-black text-purple-700 dark:text-purple-300">
                        {adminPendingTrades.length}
                      </span>
                      {adminPendingTrades.length > 0 && (
                        <Badge className="bg-purple-600 text-white text-[10px] font-black animate-pulse">
                          Azione Richiesta
                        </Badge>
                      )}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("history")}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      activeTab === "history"
                        ? "bg-emerald-500/20 border-emerald-500 shadow-md ring-2 ring-emerald-500/30"
                        : "bg-card/60 border-border/60 hover:bg-muted/50 hover:border-emerald-500/40"
                    } flex flex-col justify-between`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground font-mono">
                        Storico Trattative
                      </span>
                      <History className="h-3.5 w-3.5 text-emerald-500" />
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-2xl font-black text-emerald-500">{historyTrades.length}</span>
                      <span className="text-[10px] font-bold text-muted-foreground">Vedi tutto</span>
                    </div>
                  </button>

                  <div className="p-3 rounded-xl bg-card/60 border border-border/60 flex flex-col justify-between">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground font-mono">
                      Club Attivi in Trattativa
                    </span>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-2xl font-black text-blue-500">
                        {new Set(adminPendingTrades.flatMap((t) => [t.sender_team, t.receiver_team])).size}
                      </span>
                      <span className="text-xs text-muted-foreground">società</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-card/60 border border-border/60 flex flex-col justify-between">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground font-mono">
                      Stato Mercato
                    </span>
                    <div className="flex items-center justify-between mt-2">
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
                  <button
                    type="button"
                    onClick={() => setActiveTab("received")}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      activeTab === "received"
                        ? "bg-blue-500/15 border-blue-500 shadow-md ring-2 ring-blue-500/25"
                        : "bg-card/60 border-border/60 hover:bg-muted/50 hover:border-blue-500/40"
                    } flex flex-col justify-between`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground font-mono">
                        Proposte Ricevute
                      </span>
                      <Inbox className={`h-4 w-4 ${activeTab === "received" ? "text-blue-500" : "text-muted-foreground/60"}`} />
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-2xl font-black">{receivedTrades.length}</span>
                      {pendingReceivedCount > 0 ? (
                        <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30 text-[10px] font-black animate-pulse">
                          {pendingReceivedCount} da valutare
                        </Badge>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">ricevute</span>
                      )}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("sent")}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      activeTab === "sent"
                        ? "bg-blue-500/15 border-blue-500 shadow-md ring-2 ring-blue-500/25"
                        : "bg-card/60 border-border/60 hover:bg-muted/50 hover:border-blue-500/40"
                    } flex flex-col justify-between`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground font-mono">
                        Proposte Inviate
                      </span>
                      <Send className={`h-4 w-4 ${activeTab === "sent" ? "text-blue-500" : "text-muted-foreground/60"}`} />
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-2xl font-black">{sentTrades.length}</span>
                      <span className="text-[11px] text-muted-foreground">in corso</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("history")}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      activeTab === "history"
                        ? "bg-emerald-500/15 border-emerald-500 shadow-md ring-2 ring-emerald-500/25"
                        : "bg-card/60 border-border/60 hover:bg-muted/50 hover:border-emerald-500/40"
                    } flex flex-col justify-between`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground font-mono">
                        Storico Trattative
                      </span>
                      <History className={`h-4 w-4 ${activeTab === "history" ? "text-emerald-500" : "text-muted-foreground/60"}`} />
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-2xl font-black text-emerald-500">{historyTrades.length}</span>
                      <span className="text-[11px] text-muted-foreground">concluse / archiviate</span>
                    </div>
                  </button>
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

        {/* CORPO PRINCIPALE A DUE COLONNE */}
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* COLONNA SINISTRA / PRINCIPALE (PROPOSTE DI SCAMBIO - UNA PER RIGA) */}
            <div className={currentTeam ? "lg:col-span-7 xl:col-span-8 space-y-4" : "col-span-full space-y-4"}>
              {/* Intestazione Sezione Selezionata */}
              <div className="flex items-center justify-between pb-3 border-b border-border/70 flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  {activeTab === "admin_approval" && (
                    <>
                      <ShieldAlert className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      <div>
                        <h2 className="text-base sm:text-lg font-black tracking-tight">Trattative in Convalida Lega</h2>
                        <p className="text-xs text-muted-foreground">Scambi formalizzati dai club che necessitano dell'approvazione finale</p>
                      </div>
                    </>
                  )}
                  {activeTab === "received" && (
                    <>
                      <Inbox className="h-5 w-5 text-blue-500" />
                      <div>
                        <h2 className="text-base sm:text-lg font-black tracking-tight">Proposte Ricevute</h2>
                        <p className="text-xs text-muted-foreground">Offerte di scambio inviate da altre squadre alla tua società</p>
                      </div>
                    </>
                  )}
                  {activeTab === "sent" && (
                    <>
                      <Send className="h-5 w-5 text-blue-500" />
                      <div>
                        <h2 className="text-base sm:text-lg font-black tracking-tight">Proposte Inviate</h2>
                        <p className="text-xs text-muted-foreground">Offerte formulate dalla tua società in attesa di risposta</p>
                      </div>
                    </>
                  )}
                  {activeTab === "history" && (
                    <>
                      <History className="h-5 w-5 text-emerald-500" />
                      <div>
                        <h2 className="text-base sm:text-lg font-black tracking-tight">Storico Trattative</h2>
                        <p className="text-xs text-muted-foreground">Registro delle trattative concluse, archiviate o respinte</p>
                      </div>
                    </>
                  )}
                </div>

                <Badge variant="outline" className="font-mono text-xs font-bold">
                  {activeTab === "admin_approval" && `${adminPendingTrades.length} trattative`}
                  {activeTab === "received" && `${receivedTrades.length} trattative`}
                  {activeTab === "sent" && `${sentTrades.length} trattative`}
                  {activeTab === "history" && `${historyTrades.length} trattative`}
                </Badge>
              </div>

              {/* LISTA TRATTATIVE DELLA SEZIONE ATTIVA */}
              {activeTab === "admin_approval" && (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-700 dark:text-purple-300 flex items-center gap-2.5">
                    <ShieldAlert className="h-4 w-4 shrink-0 text-purple-600" />
                    <span>
                      <strong>Pannello Esecutivo Admin</strong>: In questa sezione compaiono le trattative formalmente concordate tra i due club. Puoi approvare o respingere direttamente oppure aprire la scheda per verificare l'intera cronologia.
                    </span>
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
                    <div className="flex flex-col gap-3">
                      {adminPendingTrades.map((trade) => (
                        <TradeRow
                          key={trade.id}
                          trade={trade}
                          currentTeam={currentTeam || ""}
                          isAdminView={true}
                          onOpenDetails={() => handleOpenDetails(trade)}
                          onQuickApprove={() => handleQuickApprove(trade)}
                          onQuickReject={() => handleQuickReject(trade)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "received" && (
                <div className="space-y-3">
                  {receivedTrades.length === 0 ? (
                    <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card/40">
                      <Inbox className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                      <div className="text-sm font-bold">Nessuna proposta ricevuta</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Non hai ancora ricevuto offerte di scambio da altre squadre.
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {receivedTrades.map((trade) => (
                        <TradeRow
                          key={trade.id}
                          trade={trade}
                          currentTeam={currentTeam}
                          onOpenDetails={() => handleOpenDetails(trade)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "sent" && (
                <div className="space-y-3">
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
                    <div className="flex flex-col gap-3">
                      {sentTrades.map((trade) => (
                        <TradeRow
                          key={trade.id}
                          trade={trade}
                          currentTeam={currentTeam}
                          onOpenDetails={() => handleOpenDetails(trade)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "history" && (
                <div className="space-y-3">
                  {historyTrades.length === 0 ? (
                    <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card/40">
                      <History className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                      <div className="text-sm font-bold">Nessuna trattativa nello storico</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Le trattative concluse, rifiutate o respinte dalla Lega compariranno qui.
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {historyTrades.map((trade) => (
                        <TradeRow
                          key={trade.id}
                          trade={trade}
                          currentTeam={currentTeam}
                          isAdminView={isAdmin}
                          onOpenDetails={() => handleOpenDetails(trade)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* COLONNA DESTRA / SIDEBAR (I MIEI BISOGNI DI MERCATO) */}
            {currentTeam && (
              <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-6 space-y-4">
                <TeamMarketNeedsCard
                  teamId={currentTeam}
                  teamName={effectiveTeamFullName}
                  userName={user?.name || user?.username}
                  compact={true}
                />
              </div>
            )}
          </div>
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
// SUB-COMPONENT: TRADE ROW
// ----------------------------------------------------------------------
interface TradeRowProps {
  trade: EnrichedTrade;
  currentTeam: string;
  isAdminView?: boolean;
  onOpenDetails: () => void;
  onQuickApprove?: () => void;
  onQuickReject?: () => void;
}

const TradeRow: React.FC<TradeRowProps> = ({
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
    <div className="group relative overflow-hidden rounded-2xl border border-border/80 bg-card hover:border-blue-500/40 dark:hover:border-blue-500/40 transition-all p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* SEZIONE 1: SQUADRE E STATO */}
      <div className="flex items-center gap-3.5 md:w-56 shrink-0">
        {isAdminView ? (
          <div className="flex items-center gap-2">
            <div className="flex flex-col items-center min-w-10">
              <img
                src={`${SUPABASE_STORAGE_URL}/images/teams/${trade.sender_team}_Logo.png`}
                alt={trade.sender_team}
                className="h-8 w-8 object-contain drop-shadow-xs"
                onError={(e) => ((e.target as HTMLElement).style.display = "none")}
              />
              <span className="font-black text-[11px] mt-0.5">{trade.sender_team}</span>
            </div>
            <ArrowLeftRight className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex flex-col items-center min-w-10">
              <img
                src={`${SUPABASE_STORAGE_URL}/images/teams/${trade.receiver_team}_Logo.png`}
                alt={trade.receiver_team}
                className="h-8 w-8 object-contain drop-shadow-xs"
                onError={(e) => ((e.target as HTMLElement).style.display = "none")}
              />
              <span className="font-black text-[11px] mt-0.5">{trade.receiver_team}</span>
            </div>
            <div className="hidden sm:block ml-2">
              <Badge className={`text-[10px] font-bold ${statusCfg.badgeClass}`}>
                {statusCfg.label}
              </Badge>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-12 w-12 rounded-xl bg-muted/60 border border-border/80 flex items-center justify-center p-1.5 shrink-0 shadow-inner">
              <img
                src={`${SUPABASE_STORAGE_URL}/images/teams/${partnerTeam}_Logo.png`}
                alt={partnerTeam}
                className="max-h-full max-w-full object-contain"
                onError={(e) => ((e.target as HTMLElement).style.display = "none")}
              />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-mono text-muted-foreground uppercase block font-bold">
                {isSender ? "Inviata a" : "Ricevuta da"}
              </span>
              <div className="font-black text-sm truncate text-foreground" title={partnerTeamName}>
                {partnerTeamName}
              </div>
              <Badge className={`text-[10px] font-bold mt-1 ${statusCfg.badgeClass}`}>
                {statusCfg.label}
              </Badge>
            </div>
          </div>
        )}
      </div>

      {/* SEZIONE 2: ASSET SCAMBIATI (Offerti vs Richiesti) */}
      <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-muted/30 border border-border/60 text-xs">
        {/* Offerta Sender */}
        <div className="min-w-0">
          <div className="text-[10px] font-mono text-blue-500 font-bold uppercase flex items-center gap-1.5 mb-1.5">
            <span className="truncate">{trade.sender_team} cede ({totalOffered}):</span>
          </div>
          <div className="space-y-1">
            {trade.offered_players.map((p) => (
              <div key={p.ID} className="truncate text-xs font-semibold flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                <span className="truncate">{p.Nome} {p.Cognome}</span>
                <span className="text-[10px] font-mono text-muted-foreground shrink-0 font-normal">({p.Posiz} {p.OVR})</span>
              </div>
            ))}
            {trade.offered_picks.map((pk) => (
              <div key={pk.pick_overall} className="truncate text-xs font-semibold text-amber-500 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                <span className="truncate">Scelta #{pk.pick_overall} (R{pk.round})</span>
              </div>
            ))}
            {totalOffered === 0 && (
              <span className="text-xs text-muted-foreground italic">Nessun asset</span>
            )}
          </div>
        </div>

        {/* Richiesta / Cessione Receiver */}
        <div className="min-w-0 sm:border-l sm:border-border/50 sm:pl-3">
          <div className="text-[10px] font-mono text-emerald-500 font-bold uppercase flex items-center gap-1.5 mb-1.5">
            <span className="truncate">{trade.receiver_team} cede ({totalRequested}):</span>
          </div>
          <div className="space-y-1">
            {trade.requested_players.map((p) => (
              <div key={p.ID} className="truncate text-xs font-semibold flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="truncate">{p.Nome} {p.Cognome}</span>
                <span className="text-[10px] font-mono text-muted-foreground shrink-0 font-normal">({p.Posiz} {p.OVR})</span>
              </div>
            ))}
            {trade.requested_picks.map((pk) => (
              <div key={pk.pick_overall} className="truncate text-xs font-semibold text-amber-500 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                <span className="truncate">Scelta #{pk.pick_overall} (R{pk.round})</span>
              </div>
            ))}
            {totalRequested === 0 && (
              <span className="text-xs text-muted-foreground italic">Nessun asset</span>
            )}
          </div>
        </div>
      </div>

      {/* SEZIONE 3: DATA E AZIONI */}
      <div className="flex items-center justify-between md:flex-col md:items-end md:justify-center gap-2.5 md:w-44 shrink-0 pt-2 md:pt-0 border-t border-border/50 md:border-t-0">
        <div className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{new Date(trade.created_at).toLocaleDateString("it-IT")}</span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          <Button
            size="sm"
            variant="outline"
            onClick={onOpenDetails}
            className="h-8 text-xs font-bold hover:bg-accent"
          >
            Scheda Dettagli
          </Button>

          {isAdminView && onQuickReject && trade.status === "pending_admin" && (
            <Button
              size="sm"
              variant="outline"
              onClick={onQuickReject}
              className="h-8 text-xs font-bold text-rose-600 hover:bg-rose-500/10 hover:text-rose-700"
            >
              <XCircle className="h-3.5 w-3.5 mr-1" /> Respingi
            </Button>
          )}

          {isAdminView && onQuickApprove && trade.status === "pending_admin" && (
            <Button
              size="sm"
              onClick={onQuickApprove}
              className="h-8 text-xs font-black bg-purple-600 hover:bg-purple-500 text-white shadow-xs"
            >
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approva
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

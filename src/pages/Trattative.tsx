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
  Clock,
  Plus,
  Inbox,
  Send,
  History,
  ShieldAlert,
  AlertCircle,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  fetchTeamTrades,
  fetchAdminPendingTrades,
} from "@/services/tradesService";
import { EnrichedTrade, TRADE_STATUS_CONFIG } from "@/types/trades";
import { NewTradeModal } from "@/components/trades/NewTradeModal";
import { TradeDetailsModal } from "@/components/trades/TradeDetailsModal";
import { Link } from "react-router-dom";

export default function Trattative() {
  const { user, isAdmin, effectiveTeam, effectiveTeamFullName, openLogin } = useAuth();
  const currentTeam = user?.team || effectiveTeam;

  const [trades, setTrades] = useState<EnrichedTrade[]>([]);
  const [adminPendingTrades, setAdminPendingTrades] = useState<EnrichedTrade[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<EnrichedTrade | null>(null);
  const [counterOfferSource, setCounterOfferSource] = useState<EnrichedTrade | null>(null);

  const loadData = async () => {
    if (!currentTeam) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const [teamTrades, pendingAdmin] = await Promise.all([
      fetchTeamTrades(currentTeam),
      isAdmin ? fetchAdminPendingTrades() : Promise.resolve([]),
    ]);
    setTrades(teamTrades);
    setAdminPendingTrades(pendingAdmin);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [currentTeam, isAdmin]);

  // Categorize trades for current user
  const receivedTrades = useMemo(() => {
    return trades.filter((t) => t.receiver_team === currentTeam && t.status !== "completed");
  }, [trades, currentTeam]);

  const pendingReceivedCount = useMemo(() => {
    return receivedTrades.filter((t) => t.status === "pending").length;
  }, [receivedTrades]);

  const sentTrades = useMemo(() => {
    return trades.filter((t) => t.sender_team === currentTeam && t.status !== "completed");
  }, [trades, currentTeam]);

  const completedTrades = useMemo(() => {
    return trades.filter((t) => t.status === "completed");
  }, [trades]);

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

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        {/* HERO SECTION */}
        <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-card via-card/90 to-muted/40 p-6 md:p-8 shadow-xl mb-8">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              {currentTeam ? (
                <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-muted/60 border border-border flex items-center justify-center p-2 shadow-inner">
                  <img
                    src={`/images/teams/${currentTeam}_Logo.png`}
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
                    La Mia Squadra · Mercato & Scambi
                  </span>
                  {currentTeam && (
                    <Badge variant="outline" className="font-mono text-[10px] font-bold">
                      {currentTeam}
                    </Badge>
                  )}
                  {isAdmin && (
                    <Badge className="bg-purple-600/15 text-purple-600 dark:text-purple-400 border-purple-500/30 text-[10px] font-bold">
                      Admin Mode
                    </Badge>
                  )}
                </div>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight">
                  Trattative & Proposte di Scambio
                </h1>
                <p className="text-xs md:text-sm text-muted-foreground mt-1 max-w-2xl">
                  Negozia calciatori e scelte del draft con le altre società. Tutte le trattative rimangono segrete fino all'approvazione finale della Lega.
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
                  onClick={handleOpenNewTrade}
                  className="h-10 text-xs font-black bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 px-4"
                >
                  <Plus className="h-4 w-4 mr-1.5" />
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
                  Scambi Conclusi
                </span>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xl font-black text-emerald-500">{completedTrades.length}</span>
                  <Link
                    to="/mercato/scambi"
                    className="text-[10px] text-blue-500 hover:underline flex items-center gap-1 font-bold"
                  >
                    Bacheca <ExternalLink className="h-2.5 w-2.5" />
                  </Link>
                </div>
              </div>

              {isAdmin && (
                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400 font-mono">
                    In Attesa Firma Lega
                  </span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xl font-black text-purple-600 dark:text-purple-400">
                      {adminPendingTrades.length}
                    </span>
                    <Badge className="bg-purple-600 text-white text-[10px] font-black">
                      Admin Hub
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* TABS TRATTATIVE */}
        {!user ? (
          <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card/50">
            <Shield className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <h3 className="text-base font-bold">Autenticazione Richiesta</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
              Per accedere alla tua bacheca privata delle trattative e formulare proposte di mercato, accedi con le credenziali della tua squadra.
            </p>
            <Button
              size="sm"
              onClick={() => openLogin("login")}
              className="mt-4 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              Accedi alla Squadra
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="received" className="space-y-6">
            <TabsList className="bg-muted p-1 rounded-xl h-auto flex flex-wrap gap-1">
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

              <TabsTrigger
                value="completed"
                className="text-xs font-bold py-2 px-4 rounded-lg data-[state=active]:bg-background"
              >
                <History className="h-3.5 w-3.5 mr-1.5" />
                Storico ({completedTrades.length})
              </TabsTrigger>

              {isAdmin && (
                <TabsTrigger
                  value="admin_approval"
                  className="text-xs font-bold py-2 px-4 rounded-lg data-[state=active]:bg-purple-600 data-[state=active]:text-white ml-auto"
                >
                  <ShieldAlert className="h-3.5 w-3.5 mr-1.5" />
                  Convalida Lega ({adminPendingTrades.length})
                </TabsTrigger>
              )}
            </TabsList>

            {/* TAB RICEVUTE */}
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

            {/* TAB INVIATE */}
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
                    onClick={handleOpenNewTrade}
                    className="mt-3 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white"
                  >
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

            {/* TAB STORICO */}
            <TabsContent value="completed" className="space-y-4">
              {completedTrades.length === 0 ? (
                <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card/40">
                  <History className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                  <div className="text-sm font-bold">Nessuno scambio concluso</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Le trattative accettate ed eseguite ufficialmente compariranno qui.
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {completedTrades.map((trade) => (
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

            {/* TAB ADMIN APPROVAL */}
            {isAdmin && (
              <TabsContent value="admin_approval" className="space-y-4">
                <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-700 dark:text-purple-300 flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <span>
                    Queste trattative sono state concordate da entrambe le società e attendono la tua firma definitiva. Una volta approvato uno scambio, i calciatori in <code>an_player</code> e le scelte in <code>an_draft_board</code> verranno trasferiti all'istante.
                  </span>
                </div>

                {adminPendingTrades.length === 0 ? (
                  <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card/40">
                    <CheckCircle2 className="h-10 w-10 text-emerald-500/40 mx-auto mb-2" />
                    <div className="text-sm font-bold">Nessuno scambio in attesa di approvazione</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Tutte le proposte concluse tra i manager sono già state elaborate.
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
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            )}
          </Tabs>
        )}
      </main>

      {/* NEW TRADE MODAL */}
      <NewTradeModal
        open={newModalOpen}
        onOpenChange={setNewModalOpen}
        onTradeCreated={loadData}
        counterOfferTrade={counterOfferSource}
      />

      {/* TRADE DETAILS / NEGOTIATION MODAL */}
      <TradeDetailsModal
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        trade={selectedTrade}
        onTradeUpdated={loadData}
        onOpenCounterOffer={handleOpenCounterOffer}
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
}

const TradeCard: React.FC<TradeCardProps> = ({
  trade,
  currentTeam,
  isAdminView,
  onOpenDetails,
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
    <Card className="overflow-hidden border-border/80 bg-card hover:border-blue-500/40 transition-all shadow-sm">
      <CardContent className="p-4 flex flex-col justify-between gap-4 h-full">
        {/* Card Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <img
              src={`/images/teams/${partnerTeam}_Logo.png`}
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

        {/* Footer */}
        <div className="flex items-center justify-between pt-1 border-t border-border/50 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1 font-mono">
            <Clock className="h-3 w-3" />
            <span>{new Date(trade.created_at).toLocaleDateString("it-IT")}</span>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={onOpenDetails}
            className="h-7 text-xs font-bold"
          >
            {isAdminView ? "Esamina & Convalida" : "Visualizza Dettagli"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

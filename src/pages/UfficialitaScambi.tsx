import React, { useState, useEffect, useMemo } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeftRight,
  Shield,
  Sparkles,
  Users,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  Target,
  Send,
} from "lucide-react";
import { fetchCompletedTrades } from "@/services/tradesService";
import { EnrichedTrade } from "@/types/trades";
import { useAuth } from "@/context/AuthContext";
import { TradeDetailsModal } from "@/components/trades/TradeDetailsModal";
import { LeagueMarketNeedsBoard } from "@/components/trades/LeagueMarketNeedsBoard";
import { Link, useSearchParams, useNavigate } from "react-router-dom";

export default function UfficialitaScambi() {
  const { availableTeams, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = searchParams.get("tab") || "needs";

  const handleTabChange = (val: string) => {
    setSearchParams({ tab: val });
  };

  const [completedTrades, setCompletedTrades] = useState<EnrichedTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [teamFilter, setTeamFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [selectedTrade, setSelectedTrade] = useState<EnrichedTrade | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  const loadTrades = async () => {
    setLoading(true);
    const data = await fetchCompletedTrades();
    setCompletedTrades(data);
    setLoading(false);
  };

  useEffect(() => {
    loadTrades();
  }, []);

  const filteredTrades = useMemo(() => {
    return completedTrades.filter((t) => {
      // Team filter
      if (teamFilter !== "ALL" && t.sender_team !== teamFilter && t.receiver_team !== teamFilter) {
        return false;
      }
      // Search query (player name, pick, or team name)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesSender = t.sender_team_name?.toLowerCase().includes(q) || t.sender_team.toLowerCase().includes(q);
        const matchesReceiver = t.receiver_team_name?.toLowerCase().includes(q) || t.receiver_team.toLowerCase().includes(q);
        const matchesOfferedPlayer = t.offered_players.some(
          (p) => p.Nome.toLowerCase().includes(q) || p.Cognome.toLowerCase().includes(q)
        );
        const matchesRequestedPlayer = t.requested_players.some(
          (p) => p.Nome.toLowerCase().includes(q) || p.Cognome.toLowerCase().includes(q)
        );
        if (!matchesSender && !matchesReceiver && !matchesOfferedPlayer && !matchesRequestedPlayer) {
          return false;
        }
      }
      return true;
    });
  }, [completedTrades, teamFilter, searchQuery]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        {/* HERO SECTION */}
        <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-card via-card/90 to-muted/40 p-6 md:p-8 shadow-xl mb-8">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 shadow-inner shrink-0">
                <ArrowLeftRight className="h-8 w-8 md:h-10 md:w-10" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-[11px] font-black uppercase tracking-wider text-emerald-500 font-mono">
                    LCSIM Serie A · Hub Calciomercato
                  </span>
                  <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold">
                    12 Club Ufficiali
                  </Badge>
                </div>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight">
                  Bacheca Mercato: Bisogni & Scambi Ufficiali
                </h1>
                <p className="text-xs md:text-sm text-muted-foreground mt-1 max-w-2xl">
                  Consulta a colpo d'occhio cosa cercano le altre società per proporre scambi mirati ed esamina il registro di tutti i trasferimenti approvati dalla Lega.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={loadTrades}
                disabled={loading}
                className="h-10 text-xs font-bold"
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
                Aggiorna
              </Button>

              {user ? (
                <Button
                  size="sm"
                  asChild
                  className="h-10 text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 px-4"
                >
                  <Link to="/mia-squadra/trattative">
                    <Target className="h-3.5 w-3.5 mr-1.5" />
                    I Miei Bisogni & Trattative
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        {/* TABS: BISOGNI DI MERCATO vs UFFICIALITÀ SCAMBI */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="bg-muted p-1 rounded-2xl h-auto flex flex-wrap gap-1 w-full sm:w-auto">
            <TabsTrigger
              value="needs"
              className="text-xs font-black py-2.5 px-4 rounded-xl data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm flex items-center gap-2"
            >
              <Target className="h-4 w-4 text-emerald-500" />
              <span>Bisogni di Squadra (12 Club)</span>
              <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-mono font-bold ml-1">
                Recap Attivo
              </Badge>
            </TabsTrigger>

            <TabsTrigger
              value="trades"
              className="text-xs font-black py-2.5 px-4 rounded-xl data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm flex items-center gap-2"
            >
              <CheckCircle2 className="h-4 w-4 text-blue-500" />
              <span>Ufficialità & Storico Scambi</span>
              <Badge variant="outline" className="text-[10px] font-mono font-bold ml-1">
                {completedTrades.length} Conclusi
              </Badge>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: BISOGNI DI MERCATO */}
          <TabsContent value="needs" className="space-y-4 outline-hidden">
            <LeagueMarketNeedsBoard
              onOpenTradeWithTeam={(targetTeamId) => {
                navigate(`/mia-squadra/trattative?recipient=${targetTeamId}`);
              }}
            />
          </TabsContent>

          {/* TAB 2: UFFICIALITÀ SCAMBI */}
          <TabsContent value="trades" className="space-y-6 outline-hidden">
            {/* FILTERS BAR */}
            <div className="rounded-2xl border border-border/80 bg-card/60 p-4 backdrop-blur-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="relative sm:col-span-2">
                  <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    placeholder="Cerca operazione per calciatore, squadra o scelta..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-10 pl-9 text-xs bg-background/80"
                  />
                </div>

                <Select value={teamFilter} onValueChange={setTeamFilter}>
                  <SelectTrigger className="h-10 text-xs font-bold bg-background/80">
                    <SelectValue placeholder="Filtra per Club..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL" className="text-xs font-bold">Tutte le Società</SelectItem>
                    {availableTeams.map((t) => (
                      <SelectItem key={t.team_id} value={t.team_id} className="text-xs font-semibold">
                        {t.name} ({t.team_id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* TRADES FEED */}
            {loading ? (
              <div className="p-16 text-center text-xs text-muted-foreground">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground/40" />
                Caricamento operazioni ufficiali...
              </div>
            ) : filteredTrades.length === 0 ? (
              <div className="p-16 text-center rounded-3xl border border-dashed border-border bg-card/40">
                <ArrowLeftRight className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <h3 className="text-base font-bold">Nessuna operazione registrata</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                  Non risultano ancora scambi conclusi corrispondenti ai filtri impostati.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTrades.map((trade) => {
                  const totalAssets = trade.offered_players.length + trade.offered_picks.length;
                  return (
                    <Card
                      key={trade.id}
                      className="overflow-hidden border-border/80 bg-card hover:border-emerald-500/40 transition-all shadow-md"
                    >
                      <CardContent className="p-5 flex flex-col gap-4">
                        {/* Header */}
                        <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-border/60">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs font-bold">
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Ufficiale
                            </Badge>
                            <Badge variant="outline" className="font-mono text-[11px] font-bold">
                              Parità {totalAssets}:{totalAssets}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                            <Clock className="h-3.5 w-3.5" />
                            <span>
                              {trade.completed_at
                                ? new Date(trade.completed_at).toLocaleDateString("it-IT", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "Data non disponibile"}
                            </span>
                          </div>
                        </div>

                        {/* Trade Teams and Assets Exchange */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Sender Side */}
                          <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 space-y-3">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={`/images/teams/${trade.sender_team}_Logo.png`}
                                alt={trade.sender_team}
                                className="h-8 w-8 object-contain shrink-0"
                                onError={(e) => ((e.target as HTMLElement).style.display = "none")}
                              />
                              <div>
                                <h4 className="font-black text-sm text-foreground">
                                  {trade.sender_team_name || trade.sender_team}
                                </h4>
                                <span className="text-[10px] font-mono text-muted-foreground uppercase font-bold">
                                  Cede a {trade.receiver_team}:
                                </span>
                              </div>
                            </div>

                            <div className="space-y-1.5 pt-1">
                              {trade.offered_players.map((p) => (
                                <div
                                  key={p.ID}
                                  className="flex items-center justify-between gap-2 p-2 rounded-xl bg-card border border-border/60 text-xs"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0 font-bold shrink-0">
                                      {p.Posiz}
                                    </Badge>
                                    <span className="font-bold truncate">
                                      {p.Nome} {p.Cognome}
                                    </span>
                                  </div>
                                  <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-mono font-bold shrink-0">
                                    {p.OVR} OVR
                                  </Badge>
                                </div>
                              ))}

                              {trade.offered_picks.map((pk) => (
                                <div
                                  key={pk.pick_overall}
                                  className="flex items-center justify-between gap-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <Sparkles className="h-3.5 w-3.5 shrink-0" />
                                    <span className="font-bold">
                                      Scelta Draft #{pk.pick_overall}
                                    </span>
                                  </div>
                                  <span className="text-[10px] font-mono font-bold">
                                    Giro {pk.round}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Receiver Side */}
                          <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 space-y-3">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={`/images/teams/${trade.receiver_team}_Logo.png`}
                                alt={trade.receiver_team}
                                className="h-8 w-8 object-contain shrink-0"
                                onError={(e) => ((e.target as HTMLElement).style.display = "none")}
                              />
                              <div>
                                <h4 className="font-black text-sm text-foreground">
                                  {trade.receiver_team_name || trade.receiver_team}
                                </h4>
                                <span className="text-[10px] font-mono text-muted-foreground uppercase font-bold">
                                  Cede a {trade.sender_team}:
                                </span>
                              </div>
                            </div>

                            <div className="space-y-1.5 pt-1">
                              {trade.requested_players.map((p) => (
                                <div
                                  key={p.ID}
                                  className="flex items-center justify-between gap-2 p-2 rounded-xl bg-card border border-border/60 text-xs"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0 font-bold shrink-0">
                                      {p.Posiz}
                                    </Badge>
                                    <span className="font-bold truncate">
                                      {p.Nome} {p.Cognome}
                                    </span>
                                  </div>
                                  <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-mono font-bold shrink-0">
                                    {p.OVR} OVR
                                  </Badge>
                                </div>
                              ))}

                              {trade.requested_picks.map((pk) => (
                                <div
                                  key={pk.pick_overall}
                                  className="flex items-center justify-between gap-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <Sparkles className="h-3.5 w-3.5 shrink-0" />
                                    <span className="font-bold">
                                      Scelta Draft #{pk.pick_overall}
                                    </span>
                                  </div>
                                  <span className="text-[10px] font-mono font-bold">
                                    Giro {pk.round}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Trade Footer Actions */}
                        <div className="flex items-center justify-between pt-2 border-t border-border/40">
                          <span className="text-[11px] font-mono text-muted-foreground">
                            ID Operazione: #{trade.id.slice(0, 8)}
                          </span>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedTrade(trade);
                              setDetailsModalOpen(true);
                            }}
                            className="h-8 text-xs font-bold text-muted-foreground hover:text-foreground"
                          >
                            Dettagli Completi
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* TRADE DETAILS MODAL */}
      <TradeDetailsModal
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        trade={selectedTrade}
        onTradeUpdated={loadTrades}
        isMarketOpen={true}
      />
    </div>
  );
}

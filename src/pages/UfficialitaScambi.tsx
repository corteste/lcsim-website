import React, { useState, useEffect, useMemo } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
} from "lucide-react";
import { fetchCompletedTrades } from "@/services/tradesService";
import { EnrichedTrade } from "@/types/trades";
import { useAuth } from "@/context/AuthContext";
import { TradeDetailsModal } from "@/components/trades/TradeDetailsModal";
import { Link } from "react-router-dom";

export default function UfficialitaScambi() {
  const { availableTeams, user } = useAuth();
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
              <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 shadow-inner">
                <ArrowLeftRight className="h-8 w-8 md:h-10 md:w-10" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-[11px] font-black uppercase tracking-wider text-emerald-500 font-mono">
                    LCSIM Serie A · Registro Ufficiale
                  </span>
                  <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold">
                    Operazioni Ufficiali
                  </Badge>
                </div>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight">
                  Bacheca Scambi & Ufficialità di Mercato
                </h1>
                <p className="text-xs md:text-sm text-muted-foreground mt-1 max-w-2xl">
                  Riepilogo pubblico di tutti i trasferimenti, scambi di calciatori e passaggi di scelte del draft approvati e registrati dalla Lega.
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

              {user && (
                <Button
                  size="sm"
                  asChild
                  className="h-10 text-xs font-black bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 px-4"
                >
                  <Link to="/mia-squadra/trattative">
                    Le Mie Trattative
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {/* FILTERS BAR */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-border/60">
            <div className="relative sm:col-span-2">
              <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Cerca per calciatore, squadra o scelta..."
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
                                month: "long",
                                year: "numeric",
                              })
                            : new Date(trade.created_at).toLocaleDateString("it-IT")}
                        </span>
                        {trade.completed_by && (
                          <span className="text-foreground font-bold">
                            · Convalidato da {trade.completed_by}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Dual Team Trade Box */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* TEAM A */}
                      <div className="p-3.5 rounded-2xl bg-muted/20 border border-border/60 flex flex-col gap-2">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={`/images/teams/${trade.sender_team}_Logo.png`}
                            alt={trade.sender_team}
                            className="h-6 w-6 object-contain"
                            onError={(e) => ((e.target as HTMLElement).style.display = "none")}
                          />
                          <div>
                            <span className="font-black text-sm">{trade.sender_team_name}</span>
                            <span className="text-[10px] text-muted-foreground block font-mono">
                              Riceve da {trade.receiver_team}:
                            </span>
                          </div>
                        </div>

                        {/* What Team A receives (requested assets) */}
                        <div className="space-y-1 pt-1">
                          {trade.requested_players.map((p) => (
                            <div
                              key={p.ID}
                              className="p-1.5 rounded-lg bg-card border border-border/60 text-xs flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-[10px] px-1 py-0.5 rounded bg-muted">
                                  {p.Posiz}
                                </span>
                                <span className="font-bold">{p.Nome} {p.Cognome}</span>
                              </div>
                              <Badge variant="outline" className="text-[10px] font-mono">
                                OVR {p.OVR}
                              </Badge>
                            </div>
                          ))}
                          {trade.requested_picks.map((pk) => (
                            <div
                              key={pk.pick_overall}
                              className="p-1.5 rounded-lg bg-card border border-border/60 text-xs flex items-center justify-between text-amber-500 font-bold"
                            >
                              <div className="flex items-center gap-1.5">
                                <Sparkles className="h-3.5 w-3.5" />
                                <span>Giro {pk.round} · Scelta {pk.pick_in_round}</span>
                              </div>
                              <Badge variant="secondary" className="text-[10px] font-mono">
                                #{pk.pick_overall}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* TEAM B */}
                      <div className="p-3.5 rounded-2xl bg-muted/20 border border-border/60 flex flex-col gap-2">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={`/images/teams/${trade.receiver_team}_Logo.png`}
                            alt={trade.receiver_team}
                            className="h-6 w-6 object-contain"
                            onError={(e) => ((e.target as HTMLElement).style.display = "none")}
                          />
                          <div>
                            <span className="font-black text-sm">{trade.receiver_team_name}</span>
                            <span className="text-[10px] text-muted-foreground block font-mono">
                              Riceve da {trade.sender_team}:
                            </span>
                          </div>
                        </div>

                        {/* What Team B receives (offered assets) */}
                        <div className="space-y-1 pt-1">
                          {trade.offered_players.map((p) => (
                            <div
                              key={p.ID}
                              className="p-1.5 rounded-lg bg-card border border-border/60 text-xs flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-[10px] px-1 py-0.5 rounded bg-muted">
                                  {p.Posiz}
                                </span>
                                <span className="font-bold">{p.Nome} {p.Cognome}</span>
                              </div>
                              <Badge variant="outline" className="text-[10px] font-mono">
                                OVR {p.OVR}
                              </Badge>
                            </div>
                          ))}
                          {trade.offered_picks.map((pk) => (
                            <div
                              key={pk.pick_overall}
                              className="p-1.5 rounded-lg bg-card border border-border/60 text-xs flex items-center justify-between text-amber-500 font-bold"
                            >
                              <div className="flex items-center gap-1.5">
                                <Sparkles className="h-3.5 w-3.5" />
                                <span>Giro {pk.round} · Scelta {pk.pick_in_round}</span>
                              </div>
                              <Badge variant="secondary" className="text-[10px] font-mono">
                                #{pk.pick_overall}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-muted-foreground italic font-mono">
                        Trattativa #{trade.id.slice(0, 8)}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedTrade(trade);
                          setDetailsModalOpen(true);
                        }}
                        className="h-7 text-xs font-bold"
                      >
                        Scheda Completa
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* DETAILS MODAL */}
      <TradeDetailsModal
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        trade={selectedTrade}
        onTradeUpdated={loadTrades}
      />
    </div>
  );
}

import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  AlertTriangle,
  X,
  Search,
  Plus,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  fetchTeamAssets,
  createTrade,
} from "@/services/tradesService";
import { TradePlayerAsset, TradePickAsset, EnrichedTrade } from "@/types/trades";
import { MARKET_STATUS_OPTIONS } from "@/types/marketStatus";
import { toast } from "sonner";

interface NewTradeModalProps {
  open: boolean;
  isMarketOpen?: boolean;
  onOpenChange: (open: boolean) => void;
  onTradeCreated: () => void;
  counterOfferTrade?: EnrichedTrade | null;
  initialTargetTeam?: string;
}

export const NewTradeModal: React.FC<NewTradeModalProps> = ({
  open,
  onOpenChange,
  onTradeCreated,
  counterOfferTrade,
  initialTargetTeam,
  isMarketOpen = true,
}) => {
  const { user, isAdmin, effectiveTeam, availableTeams } = useAuth();
  const currentTeam = user?.team || effectiveTeam;

  const [targetTeam, setTargetTeam] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  // My team assets
  const [myPlayers, setMyPlayers] = useState<TradePlayerAsset[]>([]);
  const [myPicks, setMyPicks] = useState<TradePickAsset[]>([]);
  const [loadingMyAssets, setLoadingMyAssets] = useState(false);

  // Target team assets
  const [targetPlayers, setTargetPlayers] = useState<TradePlayerAsset[]>([]);
  const [targetPicks, setTargetPicks] = useState<TradePickAsset[]>([]);
  const [loadingTargetAssets, setLoadingTargetAssets] = useState(false);

  // Selected assets
  const [selectedOfferedPlayerIds, setSelectedOfferedPlayerIds] = useState<number[]>([]);
  const [selectedOfferedPickNums, setSelectedOfferedPickNums] = useState<number[]>([]);
  const [selectedRequestedPlayerIds, setSelectedRequestedPlayerIds] = useState<number[]>([]);
  const [selectedRequestedPickNums, setSelectedRequestedPickNums] = useState<number[]>([]);

  // Search filters
  const [mySearch, setMySearch] = useState("");
  const [targetSearch, setTargetSearch] = useState("");

  // Teams to propose trade to (exclude own team)
  const otherTeams = useMemo(() => {
    return availableTeams.filter((t) => t.team_id !== currentTeam);
  }, [availableTeams, currentTeam]);

  // Load my assets when modal opens
  useEffect(() => {
    if (open && currentTeam) {
      setLoadingMyAssets(true);
      fetchTeamAssets(currentTeam).then(({ players, picks }) => {
        setMyPlayers(players);
        setMyPicks(picks);
        setLoadingMyAssets(false);
      });
    }
  }, [open, currentTeam]);

  // If counterOfferTrade is passed, pre-populate inverse
  useEffect(() => {
    if (open && counterOfferTrade) {
      // For a counter offer, target is the sender of original
      const originalPartner =
        counterOfferTrade.sender_team === currentTeam
          ? counterOfferTrade.receiver_team
          : counterOfferTrade.sender_team;

      setTargetTeam(originalPartner);

      // What was requested from us becomes offered, what was offered to us becomes requested
      if (counterOfferTrade.receiver_team === currentTeam) {
        setSelectedOfferedPlayerIds([...counterOfferTrade.requested_player_ids]);
        setSelectedOfferedPickNums([...counterOfferTrade.requested_pick_numbers]);
        setSelectedRequestedPlayerIds([...counterOfferTrade.offered_player_ids]);
        setSelectedRequestedPickNums([...counterOfferTrade.offered_pick_numbers]);
      } else {
        setSelectedOfferedPlayerIds([...counterOfferTrade.offered_player_ids]);
        setSelectedOfferedPickNums([...counterOfferTrade.offered_pick_numbers]);
        setSelectedRequestedPlayerIds([...counterOfferTrade.requested_player_ids]);
        setSelectedRequestedPickNums([...counterOfferTrade.requested_pick_numbers]);
      }
      setNotes(`Controproposta rispetto alla trattativa #${counterOfferTrade.id.slice(0, 8)}`);
    } else if (open && !counterOfferTrade) {
      // Reset
      setTargetTeam(initialTargetTeam || "");
      setSelectedOfferedPlayerIds([]);
      setSelectedOfferedPickNums([]);
      setSelectedRequestedPlayerIds([]);
      setSelectedRequestedPickNums([]);
      setNotes("");
    }
  }, [open, counterOfferTrade, currentTeam]);

  // Load target team assets when targetTeam changes
  useEffect(() => {
    if (targetTeam) {
      setLoadingTargetAssets(true);
      fetchTeamAssets(targetTeam).then(({ players, picks }) => {
        setTargetPlayers(players);
        setTargetPicks(picks);
        setLoadingTargetAssets(false);
      });
    } else {
      setTargetPlayers([]);
      setTargetPicks([]);
    }
  }, [targetTeam]);

  // Calculations for parity rule
  const totalOffered = selectedOfferedPlayerIds.length + selectedOfferedPickNums.length;
  const totalRequested = selectedRequestedPlayerIds.length + selectedRequestedPickNums.length;
  const isParityValid = totalOffered > 0 && totalOffered === totalRequested;

  // Toggle selection helpers
  const toggleOfferedPlayer = (id: number) => {
    setSelectedOfferedPlayerIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const toggleOfferedPick = (num: number) => {
    setSelectedOfferedPickNums((prev) =>
      prev.includes(num) ? prev.filter((p) => p !== num) : [...prev, num]
    );
  };

  const toggleRequestedPlayer = (id: number) => {
    setSelectedRequestedPlayerIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const toggleRequestedPick = (num: number) => {
    setSelectedRequestedPickNums((prev) =>
      prev.includes(num) ? prev.filter((p) => p !== num) : [...prev, num]
    );
  };

  // Filtered lists
  const filteredMyPlayers = useMemo(() => {
    if (!mySearch.trim()) return myPlayers;
    const q = mySearch.toLowerCase();
    return myPlayers.filter(
      (p) =>
        p.Nome.toLowerCase().includes(q) ||
        p.Cognome.toLowerCase().includes(q) ||
        p.Posiz.toLowerCase().includes(q)
    );
  }, [myPlayers, mySearch]);

  const filteredTargetPlayers = useMemo(() => {
    if (!targetSearch.trim()) return targetPlayers;
    const q = targetSearch.toLowerCase();
    return targetPlayers.filter(
      (p) =>
        p.Nome.toLowerCase().includes(q) ||
        p.Cognome.toLowerCase().includes(q) ||
        p.Posiz.toLowerCase().includes(q)
    );
  }, [targetPlayers, targetSearch]);

  const handleSendProposal = async () => {
    if (!currentTeam) {
      toast.error("Devi essere autenticato con una squadra per formulare uno scambio.");
      return;
    }
    if (!targetTeam) {
      toast.error("Seleziona la squadra con cui intendi scambiare.");
      return;
    }
    if (!isParityValid) {
      toast.error("Lo scambio deve avere esatta parità di asset (es. 1 per 1, 2 per 2).");
      return;
    }

    setSubmitting(true);
    const res = await createTrade({
      sender_team: currentTeam,
      receiver_team: targetTeam,
      offered_player_ids: selectedOfferedPlayerIds,
      offered_pick_numbers: selectedOfferedPickNums,
      requested_player_ids: selectedRequestedPlayerIds,
      requested_pick_numbers: selectedRequestedPickNums,
      notes,
      parent_trade_id: counterOfferTrade?.id,
    });
    setSubmitting(false);

    if (res.success) {
      toast.success("Proposta di scambio inviata con successo!");
      onTradeCreated();
      onOpenChange(false);
    } else {
      toast.error(res.error || "Impossibile inviare la proposta.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[96vw] max-h-[92vh] p-0 flex flex-col gap-0 overflow-hidden bg-card border-border/80 shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-border/70 bg-gradient-to-r from-muted/50 via-background to-muted/50 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-500/15 text-blue-500 flex items-center justify-center border border-blue-500/20">
                <ArrowLeftRight className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black tracking-tight">
                  {counterOfferTrade ? "Formula una Controproposta" : "Nuova Proposta di Scambio"}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Trattativa privata tra manager. Rimarrà segreta alle altre squadre finché non approvata dalla Lega.
                </DialogDescription>
              </div>
            </div>

            {/* Target Team Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground hidden sm:inline">Società Destinataria:</span>
              <Select value={targetTeam} onValueChange={setTargetTeam}>
                <SelectTrigger className="w-[190px] h-9 text-xs font-bold bg-background">
                  <SelectValue placeholder="Seleziona Club..." />
                </SelectTrigger>
                <SelectContent>
                  {otherTeams.map((t) => (
                    <SelectItem key={t.team_id} value={t.team_id} className="text-xs font-semibold">
                      <div className="flex items-center gap-2">
                        <img
                          src={`/images/teams/${t.team_id}_Logo.png`}
                          alt={t.team_id}
                          className="h-4 w-4 object-contain"
                          onError={(e) => ((e.target as HTMLElement).style.display = "none")}
                        />
                        <span>{t.name} ({t.team_id})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* PARITY HUD BAR */}
          <div className="mt-2 p-2.5 rounded-xl border bg-muted/30 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground font-semibold">Offerti da te:</span>
                <Badge variant="outline" className="font-mono font-black text-xs px-2 bg-blue-500/10 text-blue-500 border-blue-500/30">
                  {totalOffered} asset
                </Badge>
              </div>
              <ArrowLeftRight className="h-3.5 w-3.5 text-muted-foreground" />
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground font-semibold">Richiesti a controparte:</span>
                <Badge variant="outline" className="font-mono font-black text-xs px-2 bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
                  {totalRequested} asset
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {totalOffered === 0 && totalRequested === 0 ? (
                <span className="text-[11px] text-muted-foreground italic">
                  Seleziona almeno un giocatore o scelta da entrambi i lati.
                </span>
              ) : isParityValid ? (
                <div className="flex items-center gap-1.5 text-emerald-500 font-bold text-xs bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Parità Asset Rispettata ({totalOffered} per {totalRequested})</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-amber-500 font-bold text-xs bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>Differenza: {Math.abs(totalOffered - totalRequested)} asset (Richiesta parità esatta)</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Two-Column Grid: My Team vs Target Team */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border flex-1 min-h-[380px] overflow-hidden">
          {/* LATO SINISTRO: I TUOI ASSET OFFERTI */}
          <div className="flex flex-col h-full p-4 overflow-hidden bg-background">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {currentTeam && (
                  <img
                    src={`/images/teams/${currentTeam}_Logo.png`}
                    alt={currentTeam}
                    className="h-5 w-5 object-contain"
                  />
                )}
                <span className="text-xs font-black uppercase tracking-wider text-blue-500">
                  I Tuoi Asset ({currentTeam})
                </span>
              </div>
              <Badge variant="secondary" className="text-[10px] font-mono">
                {selectedOfferedPlayerIds.length} giocatori, {selectedOfferedPickNums.length} scelte
              </Badge>
            </div>

            <Tabs defaultValue="players" className="flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between gap-2 mb-2">
                <TabsList className="h-7 p-0.5 bg-muted">
                  <TabsTrigger value="players" className="text-[11px] h-6 px-2.5 font-bold">
                    <Users className="h-3 w-3 mr-1" /> Rosa ({myPlayers.length})
                  </TabsTrigger>
                  <TabsTrigger value="picks" className="text-[11px] h-6 px-2.5 font-bold">
                    <Sparkles className="h-3 w-3 mr-1" /> Scelte ({myPicks.length})
                  </TabsTrigger>
                </TabsList>
                <div className="relative w-36">
                  <Search className="h-3 w-3 absolute left-2 top-2 text-muted-foreground" />
                  <Input
                    placeholder="Cerca..."
                    value={mySearch}
                    onChange={(e) => setMySearch(e.target.value)}
                    className="h-7 pl-7 text-[11px]"
                  />
                </div>
              </div>

              {/* Tab Giocatori */}
              <TabsContent value="players" className="flex-1 m-0 overflow-hidden">
                <ScrollArea className="h-[280px] pr-2">
                  <div className="space-y-1.5">
                    {filteredMyPlayers.map((player) => {
                      const isSelected = selectedOfferedPlayerIds.includes(player.ID);
                      const marketOpt = MARKET_STATUS_OPTIONS.find((m) => m.code === player.marketStatus);
                      return (
                        <div
                          key={player.ID}
                          onClick={() => toggleOfferedPlayer(player.ID)}
                          className={`p-2 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-all ${
                            isSelected
                              ? "bg-blue-500/15 border-blue-500/50 shadow-sm"
                              : "hover:bg-muted/60 border-border/60"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-9 text-center font-black font-mono text-[11px] px-1 py-0.5 rounded bg-muted">
                              {player.Posiz}
                            </span>
                            <div className="min-w-0">
                              <div className="font-bold truncate">
                                {player.Nome} {player.Cognome}
                              </div>
                              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                <span>OVR: <strong className="text-foreground">{player.OVR}</strong></span>
                                {marketOpt && (
                                  <span className={`px-1 rounded text-[9px] font-bold ${marketOpt.badgeClass}`}>
                                    {marketOpt.shortLabel}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant={isSelected ? "default" : "outline"}
                            className={`h-6 text-[10px] px-2 font-bold ${
                              isSelected ? "bg-blue-600 hover:bg-blue-500 text-white" : ""
                            }`}
                          >
                            {isSelected ? "Offerto ✓" : "+ Offri"}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* Tab Scelte Draft */}
              <TabsContent value="picks" className="flex-1 m-0 overflow-hidden">
                <ScrollArea className="h-[280px] pr-2">
                  {myPicks.length === 0 ? (
                    <div className="p-8 text-center text-xs text-muted-foreground">
                      Nessuna scelta del Draft in tuo possesso.
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {myPicks.map((pick) => {
                        const isSelected = selectedOfferedPickNums.includes(pick.pick_overall);
                        return (
                          <div
                            key={pick.pick_overall}
                            onClick={() => toggleOfferedPick(pick.pick_overall)}
                            className={`p-2 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-all ${
                              isSelected
                                ? "bg-blue-500/15 border-blue-500/50 shadow-sm"
                                : "hover:bg-muted/60 border-border/60"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="font-mono font-bold text-[10px]">
                                #{pick.pick_overall}
                              </Badge>
                              <div>
                                <div className="font-bold">Giro {pick.round} · Scelta {pick.pick_in_round}</div>
                                <div className="text-[10px] text-muted-foreground">
                                  Origine: {pick.original_team_id}
                                </div>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant={isSelected ? "default" : "outline"}
                              className={`h-6 text-[10px] px-2 font-bold ${
                                isSelected ? "bg-blue-600 hover:bg-blue-500 text-white" : ""
                              }`}
                            >
                              {isSelected ? "Offerta ✓" : "+ Offri"}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>

          {/* LATO DESTRO: ASSET RICHIESTI ALLA SQUADRA PARTNER */}
          <div className="flex flex-col h-full p-4 overflow-hidden bg-background">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {targetTeam ? (
                  <>
                    <img
                      src={`/images/teams/${targetTeam}_Logo.png`}
                      alt={targetTeam}
                      className="h-5 w-5 object-contain"
                    />
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-500">
                      Asset Richiesti ({targetTeam})
                    </span>
                  </>
                ) : (
                  <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                    Seleziona prima la squadra destinataria in alto
                  </span>
                )}
              </div>
              {targetTeam && (
                <Badge variant="secondary" className="text-[10px] font-mono">
                  {selectedRequestedPlayerIds.length} giocatori, {selectedRequestedPickNums.length} scelte
                </Badge>
              )}
            </div>

            {!targetTeam ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
                <Shield className="h-10 w-10 text-muted-foreground/30 mb-2" />
                <p className="text-xs font-semibold">Scegli una squadra dal menu in alto a destra</p>
                <p className="text-[11px] text-muted-foreground/70 mt-1">
                  Potrai consultare la sua rosa e le scelte del draft per comporre l'offerta.
                </p>
              </div>
            ) : (
              <Tabs defaultValue="players" className="flex-1 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <TabsList className="h-7 p-0.5 bg-muted">
                    <TabsTrigger value="players" className="text-[11px] h-6 px-2.5 font-bold">
                      <Users className="h-3 w-3 mr-1" /> Rosa ({targetPlayers.length})
                    </TabsTrigger>
                    <TabsTrigger value="picks" className="text-[11px] h-6 px-2.5 font-bold">
                      <Sparkles className="h-3 w-3 mr-1" /> Scelte ({targetPicks.length})
                    </TabsTrigger>
                  </TabsList>
                  <div className="relative w-36">
                    <Search className="h-3 w-3 absolute left-2 top-2 text-muted-foreground" />
                    <Input
                      placeholder="Cerca..."
                      value={targetSearch}
                      onChange={(e) => setTargetSearch(e.target.value)}
                      className="h-7 pl-7 text-[11px]"
                    />
                  </div>
                </div>

                {/* Tab Giocatori Target */}
                <TabsContent value="players" className="flex-1 m-0 overflow-hidden">
                  <ScrollArea className="h-[280px] pr-2">
                    <div className="space-y-1.5">
                      {filteredTargetPlayers.map((player) => {
                        const isSelected = selectedRequestedPlayerIds.includes(player.ID);
                        const marketOpt = MARKET_STATUS_OPTIONS.find((m) => m.code === player.marketStatus);
                        return (
                          <div
                            key={player.ID}
                            onClick={() => toggleRequestedPlayer(player.ID)}
                            className={`p-2 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-all ${
                              isSelected
                                ? "bg-emerald-500/15 border-emerald-500/50 shadow-sm"
                                : "hover:bg-muted/60 border-border/60"
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-9 text-center font-black font-mono text-[11px] px-1 py-0.5 rounded bg-muted">
                                {player.Posiz}
                              </span>
                              <div className="min-w-0">
                                <div className="font-bold truncate">
                                  {player.Nome} {player.Cognome}
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                  <span>OVR: <strong className="text-foreground">{player.OVR}</strong></span>
                                  {marketOpt && (
                                    <span className={`px-1 rounded text-[9px] font-bold ${marketOpt.badgeClass}`}>
                                      {marketOpt.shortLabel}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant={isSelected ? "default" : "outline"}
                              className={`h-6 text-[10px] px-2 font-bold ${
                                isSelected ? "bg-emerald-600 hover:bg-emerald-500 text-white" : ""
                              }`}
                            >
                              {isSelected ? "Richiesto ✓" : "+ Richiedi"}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </TabsContent>

                {/* Tab Scelte Target */}
                <TabsContent value="picks" className="flex-1 m-0 overflow-hidden">
                  <ScrollArea className="h-[280px] pr-2">
                    {targetPicks.length === 0 ? (
                      <div className="p-8 text-center text-xs text-muted-foreground">
                        Nessuna scelta del Draft disponibile per questo club.
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {targetPicks.map((pick) => {
                          const isSelected = selectedRequestedPickNums.includes(pick.pick_overall);
                          return (
                            <div
                              key={pick.pick_overall}
                              onClick={() => toggleRequestedPick(pick.pick_overall)}
                              className={`p-2 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-all ${
                                isSelected
                                  ? "bg-emerald-500/15 border-emerald-500/50 shadow-sm"
                                  : "hover:bg-muted/60 border-border/60"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="font-mono font-bold text-[10px]">
                                  #{pick.pick_overall}
                                </Badge>
                                <div>
                                  <div className="font-bold">Giro {pick.round} · Scelta {pick.pick_in_round}</div>
                                  <div className="text-[10px] text-muted-foreground">
                                    Origine: {pick.original_team_id}
                                  </div>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant={isSelected ? "default" : "outline"}
                                className={`h-6 text-[10px] px-2 font-bold ${
                                  isSelected ? "bg-emerald-600 hover:bg-emerald-500 text-white" : ""
                                }`}
                              >
                                {isSelected ? "Richiesta ✓" : "+ Richiedi"}
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>

        {/* Footer: Note & Submit */}
        {!isMarketOpen && !isAdmin && (
          <div className="px-4 py-2.5 bg-rose-500/10 border-t border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>Calciomercato Chiuso dalla Lega: l'invio di nuove proposte di scambio è al momento sospeso.</span>
          </div>
        )}
        <div className="p-4 border-t border-border/70 bg-muted/20 flex flex-col sm:flex-row items-center gap-3">
          <div className="flex-1 w-full">
            <Input
              placeholder="Messaggio o motivazione per il manager avversario (opzionale)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              Annulla
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={!isParityValid || !targetTeam || submitting || (!isMarketOpen && !isAdmin)}
              onClick={handleSendProposal}
              className="text-xs font-black bg-blue-600 hover:bg-blue-500 text-white px-5"
            >
              {submitting ? "Invio in corso..." : "Invia Proposta Ufficiale"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

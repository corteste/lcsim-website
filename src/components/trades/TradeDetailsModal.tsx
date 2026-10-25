import React, { useState } from "react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeftRight,
  Shield,
  Sparkles,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MessageSquare,
  Send,
  Clock,
  RotateCcw,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  acceptTrade,
  rejectTrade,
  cancelTrade,
  adminApproveTrade,
  adminRejectTrade,
  sendTradeMessage,
} from "@/services/tradesService";
import { EnrichedTrade, TRADE_STATUS_CONFIG } from "@/types/trades";
import { toast } from "sonner";

interface TradeDetailsModalProps {
  open: boolean;
  isMarketOpen?: boolean;
  onOpenChange: (open: boolean) => void;
  trade: EnrichedTrade | null;
  onTradeUpdated: () => void;
  onOpenCounterOffer?: (trade: EnrichedTrade) => void;
}

export const TradeDetailsModal: React.FC<TradeDetailsModalProps> = ({
  open,
  onOpenChange,
  trade,
  onTradeUpdated,
  onOpenCounterOffer,
  isMarketOpen = true,
}) => {
  const { user, isAdmin, effectiveTeam } = useAuth();
  const currentTeam = user?.team || effectiveTeam;

  const [messageText, setMessageText] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [gkValidationNotice, setGkValidationNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!trade || !open) {
      setGkValidationNotice(null);
      return;
    }

    async function checkGkBalance() {
      if (!trade) return;
      const { data } = await supabase
        .from("an_player")
        .select("Posiz, Squadra")
        .in("Squadra", [trade.sender_team, trade.receiver_team])
        .eq("Posiz", "POR");

      if (data) {
        const senderCur = data.filter((p) => p.Squadra === trade.sender_team).length;
        const receiverCur = data.filter((p) => p.Squadra === trade.receiver_team).length;

        const offeredGK = (trade.offered_players || []).filter((p) => p.Posiz === "POR").length;
        const requestedGK = (trade.requested_players || []).filter((p) => p.Posiz === "POR").length;

        const senderPost = senderCur - offeredGK + requestedGK;
        const receiverPost = receiverCur - requestedGK + offeredGK;

        if (senderPost > 3 || senderPost < 2 || receiverPost > 3 || receiverPost < 2) {
          const reasons: string[] = [];
          if (senderPost > 3) reasons.push(`${trade.sender_team} avrebbe ${senderPost} portieri (max 3)`);
          if (senderPost < 2) reasons.push(`${trade.sender_team} avrebbe ${senderPost} portieri (min 2)`);
          if (receiverPost > 3) reasons.push(`${trade.receiver_team} avrebbe ${receiverPost} portieri (max 3)`);
          if (receiverPost < 2) reasons.push(`${trade.receiver_team} avrebbe ${receiverPost} portieri (min 2)`);
          setGkValidationNotice(reasons.join(", "));
        } else {
          setGkValidationNotice(null);
        }
      }
    }

    checkGkBalance();
  }, [trade, open]);

  if (!trade) return null;

  const isSender = currentTeam === trade.sender_team;
  const isReceiver = currentTeam === trade.receiver_team;
  const statusCfg = TRADE_STATUS_CONFIG[trade.status] || {
    label: trade.status,
    badgeClass: "bg-muted text-muted-foreground",
    description: "",
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;
    setSendingMsg(true);
    const senderName = user?.name || user?.username || currentTeam;
    const res = await sendTradeMessage(trade.id, currentTeam, senderName, messageText);
    setSendingMsg(false);
    if (res.success) {
      setMessageText("");
      onTradeUpdated();
    } else {
      toast.error(res.error || "Impossibile inviare il messaggio.");
    }
  };

  const handleAccept = async () => {
    setActionLoading(true);
    const res = await acceptTrade(trade.id, currentTeam);
    setActionLoading(false);
    if (res.success) {
      toast.success("Proposta accettata! Inviata alla Lega per la convalida ufficiale.");
      onTradeUpdated();
      onOpenChange(false);
    } else {
      toast.error(res.error || "Errore durante l'accettazione.");
    }
  };

  const handleReject = async () => {
    const reason = window.prompt("Motivazione del rifiuto (opzionale):");
    if (reason === null) return; // User cancelled prompt

    setActionLoading(true);
    const res = await rejectTrade(trade.id, currentTeam, reason);
    setActionLoading(false);
    if (res.success) {
      toast.info("Proposta di scambio rifiutata.");
      onTradeUpdated();
      onOpenChange(false);
    } else {
      toast.error(res.error || "Errore durante il rifiuto.");
    }
  };

  const handleCancel = async () => {
    if (!window.confirm("Sei sicuro di voler ritirare questa proposta di scambio?")) return;

    setActionLoading(true);
    const res = await cancelTrade(trade.id, currentTeam);
    setActionLoading(false);
    if (res.success) {
      toast.info("Proposta di scambio ritirata.");
      onTradeUpdated();
      onOpenChange(false);
    } else {
      toast.error(res.error || "Errore durante l'annullamento.");
    }
  };

  const handleAdminApprove = async () => {
    if (!window.confirm("Confermi l'approvazione ufficiale di questo scambio? Le rose e le scelte a database verranno trasferite immediatamente.")) return;

    setActionLoading(true);
    const adminUser = user?.name || user?.username || "Admin Lega";
    const res = await adminApproveTrade(trade, adminUser);
    setActionLoading(false);
    if (res.success) {
      toast.success("Scambio approvato ed eseguito ufficialmente in Serie A!");
      onTradeUpdated();
      onOpenChange(false);
    } else {
      toast.error(res.error || "Errore durante l'esecuzione dello scambio.");
    }
  };

  const handleAdminReject = async () => {
    const reason = window.prompt("Motivazione del rifiuto della Lega:");
    if (reason === null) return;

    setActionLoading(true);
    const adminUser = user?.name || user?.username || "Admin Lega";
    const res = await adminRejectTrade(trade.id, adminUser, reason);
    setActionLoading(false);
    if (res.success) {
      toast.info("Scambio respinto dalla Lega.");
      onTradeUpdated();
      onOpenChange(false);
    } else {
      toast.error(res.error || "Errore durante la reiezione dello scambio.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[96vw] max-h-[92vh] p-0 flex flex-col gap-0 overflow-hidden bg-card border-border/80 shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-border/70 bg-gradient-to-r from-muted/50 via-background to-muted/50 flex flex-col gap-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <img
                  src={`/images/teams/${trade.sender_team}_Logo.png`}
                  alt={trade.sender_team}
                  className="h-8 w-8 object-contain"
                />
                <span className="font-black text-sm">{trade.sender_team_name}</span>
              </div>

              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center">
                <ArrowLeftRight className="h-3.5 w-3.5 text-muted-foreground" />
              </div>

              <div className="flex items-center gap-2">
                <img
                  src={`/images/teams/${trade.receiver_team}_Logo.png`}
                  alt={trade.receiver_team}
                  className="h-8 w-8 object-contain"
                />
                <span className="font-black text-sm">{trade.receiver_team_name}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge className={`text-xs px-2.5 py-1 font-bold ${statusCfg.badgeClass}`}>
                {statusCfg.label}
              </Badge>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground flex-wrap gap-2">
            <div>{statusCfg.description}</div>
            <div className="flex items-center gap-1 font-mono text-[11px]">
              <Clock className="h-3 w-3" />
              <span>Inviata: {new Date(trade.created_at).toLocaleString("it-IT")}</span>
              {trade.completed_at && (
                <span> · Conclusa: {new Date(trade.completed_at).toLocaleString("it-IT")}</span>
              )}
            </div>
          </div>
        </div>

        {/* Content: 2-Columns Assets breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border flex-1 overflow-y-auto">
          {/* LATO MITTENTE (OFFERTI) */}
          <div className="p-4 bg-muted/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-black uppercase tracking-wider text-blue-500 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                Cosa cede {trade.sender_team_name} ({trade.offered_players.length + trade.offered_picks.length} asset)
              </div>
            </div>

            {/* Giocatori offerti */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold uppercase text-muted-foreground font-mono">
                Calciatori ({trade.offered_players.length})
              </div>
              {trade.offered_players.length === 0 ? (
                <div className="text-xs text-muted-foreground italic pl-2">Nessun calciatore</div>
              ) : (
                trade.offered_players.map((p) => (
                  <div key={p.ID} className="p-2 rounded-lg border bg-card text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-8 text-center font-black font-mono text-[11px] px-1 py-0.5 rounded bg-muted">
                        {p.Posiz}
                      </span>
                      <span className="font-bold">{p.Nome} {p.Cognome}</span>
                    </div>
                    <Badge variant="outline" className="font-mono font-bold text-[11px]">
                      OVR {p.OVR}
                    </Badge>
                  </div>
                ))
              )}
            </div>

            {/* Scelte offerte */}
            <div className="space-y-1.5 pt-2">
              <div className="text-[10px] font-bold uppercase text-muted-foreground font-mono">
                Scelte Draft ({trade.offered_picks.length})
              </div>
              {trade.offered_picks.length === 0 ? (
                <div className="text-xs text-muted-foreground italic pl-2">Nessuna scelta</div>
              ) : (
                trade.offered_picks.map((pk) => (
                  <div key={pk.pick_overall} className="p-2 rounded-lg border bg-card text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                      <span className="font-bold">Giro {pk.round} · Scelta {pk.pick_in_round}</span>
                    </div>
                    <Badge variant="secondary" className="font-mono text-[10px]">
                      #{pk.pick_overall}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* LATO RICEVENTE (RICHIESTI) */}
          <div className="p-4 bg-muted/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-black uppercase tracking-wider text-emerald-500 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                Cosa cede {trade.receiver_team_name} ({trade.requested_players.length + trade.requested_picks.length} asset)
              </div>
            </div>

            {/* Giocatori richiesti */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold uppercase text-muted-foreground font-mono">
                Calciatori ({trade.requested_players.length})
              </div>
              {trade.requested_players.length === 0 ? (
                <div className="text-xs text-muted-foreground italic pl-2">Nessun calciatore</div>
              ) : (
                trade.requested_players.map((p) => (
                  <div key={p.ID} className="p-2 rounded-lg border bg-card text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-8 text-center font-black font-mono text-[11px] px-1 py-0.5 rounded bg-muted">
                        {p.Posiz}
                      </span>
                      <span className="font-bold">{p.Nome} {p.Cognome}</span>
                    </div>
                    <Badge variant="outline" className="font-mono font-bold text-[11px]">
                      OVR {p.OVR}
                    </Badge>
                  </div>
                ))
              )}
            </div>

            {/* Scelte richieste */}
            <div className="space-y-1.5 pt-2">
              <div className="text-[10px] font-bold uppercase text-muted-foreground font-mono">
                Scelte Draft ({trade.requested_picks.length})
              </div>
              {trade.requested_picks.length === 0 ? (
                <div className="text-xs text-muted-foreground italic pl-2">Nessuna scelta</div>
              ) : (
                trade.requested_picks.map((pk) => (
                  <div key={pk.pick_overall} className="p-2 rounded-lg border bg-card text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                      <span className="font-bold">Giro {pk.round} · Scelta {pk.pick_in_round}</span>
                    </div>
                    <Badge variant="secondary" className="font-mono text-[10px]">
                      #{pk.pick_overall}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Chat / Messages Thread */}
        <div className="border-t border-border/70 p-4 bg-background flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Registro Negoziazione & Messaggi Privati ({trade.messages?.length || 0})</span>
          </div>

          <ScrollArea className="max-h-36 pr-2">
            <div className="space-y-2">
              {(!trade.messages || trade.messages.length === 0) ? (
                <div className="text-xs text-muted-foreground italic">Nessun messaggio in questa trattativa.</div>
              ) : (
                trade.messages.map((m) => {
                  const isMine = m.sender_team === currentTeam;
                  const isSystem = m.sender_team === "LEGA" || m.sender_name === "Sistema";
                  return (
                    <div
                      key={m.id}
                      className={`p-2 rounded-lg text-xs flex flex-col gap-1 ${
                        isSystem
                          ? "bg-muted/80 border border-border"
                          : isMine
                          ? "bg-blue-500/10 border border-blue-500/20 ml-6"
                          : "bg-muted/40 border border-border mr-6"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span className="font-bold text-foreground">
                          {m.sender_name || m.sender_team}
                        </span>
                        <span className="font-mono">{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="text-foreground leading-relaxed">{m.message}</div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>

          {/* Send message form */}
          {trade.status !== "completed" && trade.status !== "cancelled" && (
            <div className="flex items-center gap-2">
              <Input
                placeholder="Scrivi una risposta o chiarimento al manager..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                className="h-8 text-xs flex-1"
              />
              <Button
                size="sm"
                variant="outline"
                disabled={!messageText.trim() || sendingMsg}
                onClick={handleSendMessage}
                className="h-8 text-xs"
              >
                <Send className="h-3 w-3 mr-1" /> Invia
              </Button>
            </div>
          )}
        </div>

        {/* Banner avviso vincolo portieri */}
        {gkValidationNotice && (
          <div className="px-4 py-2.5 bg-amber-500/15 border-t border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>⛔ Vincolo Portieri non rispettato: {gkValidationNotice}. Lo scambio non può essere accettato né approvato.</span>
          </div>
        )}

        {/* Footer Actions */}
        {!isMarketOpen && !isAdmin && isReceiver && trade.status === "pending" && (
          <div className="px-4 py-2 bg-rose-500/10 border-t border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Calciomercato Chiuso dalla Lega: accettazione e rifiuto delle proposte sono bloccati.</span>
          </div>
        )}
        <div className="p-4 border-t border-border/70 bg-muted/20 flex flex-wrap items-center justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            Chiudi
          </Button>

          <div className="flex items-center gap-2">
            {/* Azioni Ricevente quando 'pending' */}
            {isReceiver && trade.status === "pending" && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleReject}
                  disabled={actionLoading || (!isMarketOpen && !isAdmin)}
                  className="h-8 text-xs text-rose-600 hover:bg-rose-500/10 hover:text-rose-700"
                >
                  <XCircle className="h-3.5 w-3.5 mr-1" /> Rifiuta
                </Button>
                {onOpenCounterOffer && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      onOpenChange(false);
                      onOpenCounterOffer(trade);
                    }}
                    disabled={actionLoading || (!isMarketOpen && !isAdmin)}
                    className="h-8 text-xs text-amber-600 hover:bg-amber-500/10 hover:text-amber-700"
                  >
                    <RotateCcw className="h-3.5 w-3.5 mr-1" /> Controproposta
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={handleAccept}
                  disabled={actionLoading || (!isMarketOpen && !isAdmin) || !!gkValidationNotice}
                  className="h-8 text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Accetta Proposta
                </Button>
              </>
            )}

            {/* Azioni Mittente quando 'pending' */}
            {isSender && trade.status === "pending" && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancel}
                disabled={actionLoading}
                className="h-8 text-xs text-slate-600 hover:bg-slate-500/10"
              >
                <XCircle className="h-3.5 w-3.5 mr-1" /> Ritira Proposta
              </Button>
            )}

            {/* Azioni Admin: sempre abilitate finché lo scambio non è concluso */}
            {isAdmin && trade.status !== "completed" && trade.status !== "cancelled" && trade.status !== "admin_rejected" && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAdminReject}
                  disabled={actionLoading}
                  className="h-8 text-xs font-bold text-rose-600 hover:bg-rose-500/10 hover:text-rose-700"
                >
                  <XCircle className="h-3.5 w-3.5 mr-1" /> Respingi dalla Lega
                </Button>
                <Button
                  size="sm"
                  onClick={handleAdminApprove}
                  disabled={actionLoading || !!gkValidationNotice}
                  className="h-8 text-xs font-black bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-500/20 px-3"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approva & Registra Scambio Ufficiale
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

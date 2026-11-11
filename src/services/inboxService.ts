import { supabase } from "@/supabaseClient";
import {
  fetchPressConferences,
  fetchPendingConferenceForTeam,
  fetchMarketRumors,
  PressConference,
  MarketRumor,
} from "@/services/aiJournalistService";
import {
  findNextOpponentMatch,
  fetchOpponentScoutData,
  OpponentMatchInfo,
  OpponentScoutData,
} from "@/services/opponentScoutService";
import {
  fetchTeamTrades,
  fetchAdminPendingTrades,
  fetchAllTradesForAdmin,
} from "@/services/tradesService";
import { EnrichedTrade } from "@/types/trades";

export type InboxCategory = "all" | "trades" | "press" | "rumors" | "preview";

export interface InboxItem {
  id: string;
  category: "trades" | "press" | "rumors" | "preview";
  title: string;
  snippet: string;
  senderName: string;
  senderTeamId?: string;
  senderRole?: string;
  timestamp: string;
  matchday?: number;
  priority?: "urgent" | "high" | "normal";
  badgeText?: string;
  badgeColor?: string;
  isRead?: boolean;
  pressData?: PressConference;
  rumorData?: MarketRumor;
  tradeData?: EnrichedTrade;
  previewData?: {
    matchInfo: OpponentMatchInfo;
    scoutData: OpponentScoutData | null;
  };
}

/**
 * Aggrega in un unico feed FM24 tutte le notizie di lega, rumor, conferenze stampa,
 * match preview pre-partita e messaggi di trattativa della squadra loggata.
 */
export async function fetchInboxFeed(params: {
  teamId?: string | null;
  isAdmin?: boolean;
  season?: number;
}): Promise<InboxItem[]> {
  const { teamId, isAdmin, season = 11 } = params;
  const items: InboxItem[] = [];

  try {
    // 1. Chiamate parallele a tutte le sorgenti informative
    const promises: [
      Promise<PressConference[]>,
      Promise<PressConference | null>,
      Promise<MarketRumor[]>,
      Promise<OpponentMatchInfo | null>,
      Promise<EnrichedTrade[]>
    ] = [
      fetchPressConferences(undefined, season, true),
      teamId ? fetchPendingConferenceForTeam(teamId, season) : Promise.resolve(null),
      fetchMarketRumors(25),
      teamId ? findNextOpponentMatch(teamId) : Promise.resolve(null),
      teamId
        ? fetchTeamTrades(teamId)
        : isAdmin
        ? fetchAdminPendingTrades()
        : Promise.resolve([]),
    ];

    const [pressList, pendingPress, rumorsList, nextMatch, tradesList] = await Promise.all(promises);

    // 2. Intervista in attesa per la squadra dell'utente (Massima priorità)
    if (pendingPress) {
      items.push({
        id: `press_pending_${pendingPress.id}`,
        category: "press",
        title: `🎤 Richiesta di Dichiarazione Ufficiale: Giornata ${pendingPress.matchday}`,
        snippet: pendingPress.question,
        senderName: "Giornalista Ufficiale Lega LCSIM",
        senderRole: "Sala Stampa LCSIM",
        senderTeamId: pendingPress.team_id,
        timestamp: pendingPress.created_at,
        matchday: pendingPress.matchday,
        priority: "urgent",
        badgeText: "In Attesa di Risposta",
        badgeColor: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
        pressData: pendingPress,
      });
    }

    // 3. Interviste rilasciate (Sala Stampa)
    pressList.forEach((conf) => {
      const teamName = conf.team?.NAME || conf.team_id;
      const managerName = conf.manager_name || conf.team?.MANAGER || "Presidente";
      const snippet = conf.answer
        ? `"${conf.answer.length > 130 ? conf.answer.slice(0, 130) + "..." : conf.answer}"`
        : conf.question;

      items.push({
        id: `press_${conf.id}`,
        category: "press",
        title: `Dichiarazione Ufficiale: ${teamName} (${managerName})`,
        snippet,
        senderName: `${managerName} (${teamName})`,
        senderRole: "Dichiarazione Post-Partita",
        senderTeamId: conf.team_id,
        timestamp: conf.answered_at || conf.created_at,
        matchday: conf.matchday,
        priority: "normal",
        badgeText: `G${conf.matchday} • Sala Stampa`,
        badgeColor: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
        pressData: conf,
      });
    });

    // 4. Rumor & Indiscrezioni di Calciomercato (Badge unificato "Voci di Mercato")
    rumorsList.forEach((rumor) => {
      items.push({
        id: `rumor_${rumor.id}`,
        category: "rumors",
        title: rumor.headline,
        snippet: rumor.content.length > 130 ? rumor.content.slice(0, 130) + "..." : rumor.content,
        senderName: rumor.source_label || "LCSIM Gossip / Notizie di Mercato",
        senderRole: "Indiscrezione di Mercato",
        senderTeamId: rumor.involved_team_ids?.[0],
        timestamp: rumor.created_at,
        priority: "normal",
        badgeText: "Voci di Mercato",
        badgeColor: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30",
        rumorData: rumor,
      });
    });

    // 5. Anticipazioni & Match Preview (della propria squadra)
    if (nextMatch && nextMatch.opponentTeamId) {
      let scoutData: OpponentScoutData | null = null;
      try {
        scoutData = await fetchOpponentScoutData(nextMatch.opponentTeamId);
      } catch (e) {
        console.warn("Errore caricamento scout avversario per preview:", e);
      }

      const matchVersus = nextMatch.isHome
        ? `${nextMatch.myTeamId} vs ${nextMatch.opponentTeamId}`
        : `${nextMatch.opponentTeamId} vs ${nextMatch.myTeamId}`;

      items.push({
        id: `preview_${nextMatch.week}_${nextMatch.myTeamId}`,
        category: "preview",
        title: `⚔️ Match Preview: ${matchVersus} (Giornata ${nextMatch.week})`,
        snippet: `Analisi tattica, rendimento recente e statistiche pre-partita in vista della sfida contro ${nextMatch.opponentTeamName}. Stadio: ${nextMatch.stadium || "Comunale"}.`,
        senderName: "Ufficio Tattico & Match Analysis",
        senderRole: "Anticipazione Prossima Giornata",
        senderTeamId: nextMatch.opponentTeamId,
        timestamp: new Date().toISOString(),
        matchday: nextMatch.week,
        priority: "high",
        badgeText: `G${nextMatch.week} • Match Preview`,
        badgeColor: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
        previewData: {
          matchInfo: nextMatch,
          scoutData,
        },
      });
    }

    // 6. Messaggi & Trattative di Squadra (o approvazioni Admin)
    tradesList.forEach((trade) => {
      const isMyTrade = teamId && (trade.sender_team === teamId || trade.receiver_team === teamId);
      const isReceived = teamId && trade.receiver_team === teamId && trade.status === "pending";

      let tradeTitle = `Trattativa: ${trade.sender_team} ↔ ${trade.receiver_team}`;
      let tradeBadge = "Trattativa";
      let tradeColor = "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30";
      let priority: "urgent" | "high" | "normal" = "normal";

      if (isReceived) {
        tradeTitle = `📥 Nuova Offerta di Scambio ricevuta da ${trade.sender_team_name || trade.sender_team}`;
        tradeBadge = "Offerta Ricevuta";
        tradeColor = "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/40 font-bold";
        priority = "urgent";
      } else if (trade.status === "pending_admin") {
        tradeTitle = `🤝 Accordo Raggiunto: in attesa di firma Admin (${trade.sender_team} ↔ ${trade.receiver_team})`;
        tradeBadge = "In Convalida Lega";
        tradeColor = "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30";
        priority = isAdmin ? "urgent" : "high";
      } else if (trade.status === "completed") {
        tradeTitle = `🏆 Scambio Ufficiale Convalidato: ${trade.sender_team} ↔ ${trade.receiver_team}`;
        tradeBadge = "Trasferimento Ufficiale";
        tradeColor = "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
      } else if (trade.status === "rejected" || trade.status === "admin_rejected") {
        tradeTitle = `❌ Scambio Declinato: ${trade.sender_team} ↔ ${trade.receiver_team}`;
        tradeBadge = "Non Concluso";
        tradeColor = "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30";
      }

      const offeredNames = (trade.offered_players || []).map((p) => p.Cognome).join(", ");
      const requestedNames = (trade.requested_players || []).map((p) => p.Cognome).join(", ");
      const snippet = `Offerti: ${offeredNames || "Scelte Draft"} ➔ Richiesti: ${requestedNames || "Scelte Draft"}`;

      items.push({
        id: `trade_${trade.id}`,
        category: "trades",
        title: tradeTitle,
        snippet,
        senderName: trade.sender_team_name || trade.sender_team,
        senderRole: "Canale Calciomercato",
        senderTeamId: trade.sender_team,
        timestamp: trade.updated_at || trade.created_at,
        priority,
        badgeText: tradeBadge,
        badgeColor: tradeColor,
        tradeData: trade,
      });
    });

    // 7. Ordinamento cronologico ponderato per priorità:
    // Urgenti sempre in cima, poi in ordine di data decrescente
    items.sort((a, b) => {
      const pScore = (p?: string) => (p === "urgent" ? 3 : p === "high" ? 2 : 1);
      const scoreDiff = pScore(b.priority) - pScore(a.priority);
      if (scoreDiff !== 0) return scoreDiff;

      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  } catch (err) {
    console.error("Errore aggregazione feed inbox:", err);
  }

  return items;
}

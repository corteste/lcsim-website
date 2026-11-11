import { supabase } from "@/supabaseClient";
import {
  fetchPressConferences,
  fetchPendingConferenceForTeam,
  fetchMarketRumors,
  PressConference,
  MarketRumor,
} from "@/services/aiJournalistService";
import {
  fetchTeamTrades,
  fetchAdminPendingTrades,
} from "@/services/tradesService";
import { fetchStandings } from "@/services/standingsService";
import { EnrichedTrade } from "@/types/trades";

export type InboxCategory = "all" | "trades" | "press" | "rumors" | "preview";

export interface MatchdayScheduleMatch {
  homeTeamId: string;
  homeTeamName: string;
  homeRank?: number;
  homePoints?: number;
  awayTeamId: string;
  awayTeamName: string;
  awayRank?: number;
  awayPoints?: number;
  stadium?: string;
  referee?: string;
  weather?: string;
  date?: string;
  matchTime?: string;
  isPlayed?: boolean;
}

export interface MatchdayTalkingPoint {
  title: string;
  content: string;
  highlight?: string;
}

export interface MatchdayPreviewData {
  week: number;
  season: number;
  headline: string;
  leadParagraph: string;
  bigMatch?: MatchdayScheduleMatch;
  talkingPoints: MatchdayTalkingPoint[];
  matches: MatchdayScheduleMatch[];
}

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
  previewData?: MatchdayPreviewData;
}

/**
 * Aggrega in un unico feed FM24 tutte le notizie di lega, rumor, conferenze stampa,
 * preview editoriale con spunti di analisi della prossima giornata e messaggi di trattativa.
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
    const [
      pressList,
      pendingPress,
      rumorsList,
      tradesList,
      deadlineRes,
      scheduleRes,
      standingsList,
      teamsRes,
    ] = await Promise.all([
      fetchPressConferences(undefined, season, true),
      teamId ? fetchPendingConferenceForTeam(teamId, season) : Promise.resolve(null),
      fetchMarketRumors(25),
      teamId
        ? fetchTeamTrades(teamId)
        : isAdmin
        ? fetchAdminPendingTrades()
        : Promise.resolve([]),
      supabase
        .from("league_deadlines")
        .select("week, stag, is_active")
        .eq("stag", season)
        .eq("is_active", true)
        .maybeSingle(),
      supabase
        .from("an_schedule")
        .select("id, week, stag, home, away, stadium, referee, weather, date, match_time, standings_processed")
        .eq("stag", season)
        .order("week", { ascending: true })
        .order("id", { ascending: true }),
      fetchStandings(season).catch(() => []),
      supabase
        .from("an_team")
        .select("TEAM_ID, NAME, NAME_ABBR"),
    ]);

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

    // 5. Notizia Editoriale di Analisi della Prossima Giornata
    const scheduleRows = scheduleRes?.data || [];
    const teams = teamsRes?.data || [];
    const standings = standingsList || [];

    const teamMap = new Map<string, { name: string; abbr?: string }>();
    teams.forEach((t) => {
      teamMap.set(t.TEAM_ID, { name: t.NAME || t.TEAM_ID, abbr: t.NAME_ABBR });
    });

    const standingMap = new Map<string, { rank: number; points: number }>();
    standings.forEach((st, idx) => {
      const tid = st.team?.TEAM_ID;
      if (tid) {
        standingMap.set(tid, {
          rank: idx + 1,
          points: st.points ?? 0,
        });
      }
    });

    // Determina targetWeek del prossimo turno
    let targetWeek: number | null = deadlineRes?.data?.week ?? null;
    if (!targetWeek && scheduleRows.length > 0) {
      const unplayed = scheduleRows.find((m) => !m.standings_processed);
      targetWeek = unplayed ? unplayed.week : scheduleRows[scheduleRows.length - 1].week;
    }

    if (targetWeek) {
      const weekMatches = scheduleRows.filter((m) => m.week === targetWeek && m.home && m.away);
      if (weekMatches.length > 0) {
        const matchItems: MatchdayScheduleMatch[] = weekMatches.map((m) => {
          const homeInfo = standingMap.get(m.home);
          const awayInfo = standingMap.get(m.away);
          return {
            homeTeamId: m.home,
            homeTeamName: teamMap.get(m.home)?.name || m.home,
            homeRank: homeInfo?.rank,
            homePoints: homeInfo?.points,
            awayTeamId: m.away,
            awayTeamName: teamMap.get(m.away)?.name || m.away,
            awayRank: awayInfo?.rank,
            awayPoints: awayInfo?.points,
            stadium: m.stadium || undefined,
            referee: m.referee || undefined,
            weather: m.weather || undefined,
            date: m.date ? String(m.date) : undefined,
            matchTime: m.match_time || undefined,
            isPlayed: Boolean(m.standings_processed),
          };
        });

        // 5.1 Identifica il Big Match della giornata (somma posizioni in classifica più bassa)
        const sortedByRankSum = [...matchItems].sort((a, b) => {
          const rankA = (a.homeRank ?? 15) + (a.awayRank ?? 15);
          const rankB = (b.homeRank ?? 15) + (b.awayRank ?? 15);
          return rankA - rankB;
        });
        const bigMatch = sortedByRankSum[0] || matchItems[0];

        // 5.2 Scontri diretti e distanze corte (distanza <= 3 punti)
        const closeMatches = matchItems.filter(
          (m) =>
            m !== bigMatch &&
            m.homePoints !== undefined &&
            m.awayPoints !== undefined &&
            Math.abs(m.homePoints - m.awayPoints) <= 3
        );

        // 5.3 Match della squadra utente
        const userMatch = teamId
          ? matchItems.find((m) => m.homeTeamId === teamId || m.awayTeamId === teamId)
          : null;

        // 5.4 Costruzione spunti di analisi editoriale
        const talkingPoints: MatchdayTalkingPoint[] = [];

        // Spunto 1: Big Match
        if (bigMatch) {
          const diffPt = Math.abs((bigMatch.homePoints ?? 0) - (bigMatch.awayPoints ?? 0));
          const homeRankStr = bigMatch.homeRank ? `#${bigMatch.homeRank}` : "";
          const awayRankStr = bigMatch.awayRank ? `#${bigMatch.awayRank}` : "";
          talkingPoints.push({
            title: `Riflettori sul Big Match: ${bigMatch.homeTeamName} contro ${bigMatch.awayTeamName}`,
            content: `La sfida di cartello del turno mette a confronto due tra le formazioni più ambiziose della lega (${homeRankStr} contro ${awayRankStr}). Distanziate da ${
              diffPt === 0 ? "pari punti" : `soli ${diffPt} punti`
            }, la posta in palio allo Stadio ${bigMatch.stadium || "Comunale"} vale un deciso scatto nella corsa al vertice.`,
            highlight: "Scontro al Vertice",
          });
        }

        // Spunto 2: Scontri diretti
        if (closeMatches.length > 0) {
          const matchupsNames = closeMatches
            .slice(0, 2)
            .map((m) => `${m.homeTeamName} vs ${m.awayTeamName}`)
            .join(" e ");
          talkingPoints.push({
            title: "Scontri Diretti e Punti Salvezza/Playoff",
            content: `Turno ad altissima intensità con duelli sul filo di lana: ${matchupsNames}. La cortissima forbice in graduatoria trasforma ogni singolo dettaglio in potenziale spartiacque per la griglia finale.`,
            highlight: "Equilibrio Totale",
          });
        }

        // Spunto 3: Fattore campo & Tattica
        talkingPoints.push({
          title: "Fattore Campo e Gestione delle Rotazioni",
          content: `In questa ${targetWeek}ª giornata il rendimento tra le mura amiche e la solidità delle difese saranno l'ago della bilancia. Chi riuscirà a mantenere alta l'intensità atletica senza sbilanciarsi trarrà il massimo dividendo dal turno.`,
          highlight: "Chiave Tattica",
        });

        // Spunto 4: Focus sul club dell'utente (se applicabile)
        if (userMatch && userMatch !== bigMatch) {
          const isHome = userMatch.homeTeamId === teamId;
          const oppName = isHome ? userMatch.awayTeamName : userMatch.homeTeamName;
          talkingPoints.push({
            title: `Focus Squadra: L'impegno contro ${oppName}`,
            content: `Per il tuo club si profila una prova di maturità importante ${
              isHome ? "davanti ai propri tifosi" : "in trasferta"
            }. Impostare un pressing ragionato e concretizzare le ripartenze saranno i fattori chiave del match.`,
            highlight: "Il Tuo Club",
          });
        }

        const headline = `Speciale Giornata ${targetWeek}: Analisi, Big Match e Spunti del Prossimo Turno`;
        const leadParagraph = `Il campionato di Serie A LCSIM si prepara a vivere la sua ${targetWeek}ª giornata. Con ${matchItems.length} partite in programma, il turno offre incroci determinanti per le gerarchie della classifica e la lotta alle posizioni nobili.`;

        items.push({
          id: `preview_matchday_${targetWeek}`,
          category: "preview",
          title: `🗞️ Speciale Giornata ${targetWeek}: Analisi del Turno e Spunti Tattici`,
          snippet: `Riflettori puntati sul big match ${bigMatch.homeTeamName}-${bigMatch.awayTeamName} e i temi caldi del prossimo turno di campionato.`,
          senderName: "Redazione Sportiva LCSIM",
          senderRole: "Ufficio Stampa & Analisi",
          timestamp: new Date().toISOString(),
          matchday: targetWeek,
          priority: "high",
          badgeText: `G${targetWeek} • Speciale Turno`,
          badgeColor: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
          previewData: {
            week: targetWeek,
            season,
            headline,
            leadParagraph,
            bigMatch,
            talkingPoints,
            matches: matchItems,
          },
        });
      }
    }

    // 6. Messaggi & Trattative di Squadra (o approvazioni Admin)
    tradesList.forEach((trade) => {
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

      const formatAssetSnippet = (
        players?: { Cognome: string }[],
        picks?: { pick_overall: number }[]
      ) => {
        const playerNames = (players || []).map((p) => p.Cognome);
        const pickCount = (picks || []).length;

        if (playerNames.length > 0 && pickCount > 0) {
          const pickLabel = pickCount === 1 ? "+1 Scelta" : `+${pickCount} Scelte`;
          return `${playerNames.join(", ")} (${pickLabel})`;
        } else if (playerNames.length > 0) {
          return playerNames.join(", ");
        } else if (pickCount > 0) {
          return pickCount === 1 ? "1 Scelta Draft" : `${pickCount} Scelte Draft`;
        }
        return "Nessun asset";
      };

      const offeredSnippet = formatAssetSnippet(trade.offered_players, trade.offered_picks);
      const requestedSnippet = formatAssetSnippet(trade.requested_players, trade.requested_picks);
      const snippet = `Offerti: ${offeredSnippet} ➔ Richiesti: ${requestedSnippet}`;

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

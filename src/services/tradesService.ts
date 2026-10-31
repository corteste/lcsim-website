import { invalidateRostersAndTrades } from "@/queryClient";
import { supabase } from "@/supabaseClient";
import { getMarketState } from "@/services/marketStateService";
import {
  Trade,
  EnrichedTrade,
  TradeMessage,
  TradePlayerAsset,
  TradePickAsset,
  CreateTradePayload,
} from "@/types/trades";
import { PLAYER_TABLE, DRAFT_BOARD_TABLE, TEAM_TABLE, PLAYER_MARKET_TABLE } from "@/constants/App";

const TRADES_TABLE = "market_trades";
const MESSAGES_TABLE = "trade_messages";

/**
 * Carica gli asset disponibili per una determinata squadra (calciatori e scelte del draft).
 */
export async function fetchTeamAssets(teamId: string): Promise<{
  players: TradePlayerAsset[];
  picks: TradePickAsset[];
}> {
  try {
    // 1. Calciatori in rosa
    const { data: playersData, error: playersErr } = await supabase
      .from(PLAYER_TABLE)
      .select('ID, Nome, Cognome, Posiz, OVR, Squadra, Età')
      .eq("Squadra", teamId)
      .order("OVR", { ascending: false });

    if (playersErr) {
      console.error("fetchTeamAssets players error:", playersErr);
    }

    // Status di mercato
    const playerIds = (playersData || []).map((p: any) => p.ID);
    let marketMap: Record<number, string> = {};
    if (playerIds.length > 0) {
      const { data: marketData } = await supabase
        .from(PLAYER_MARKET_TABLE)
        .select("PLAYER_ID_FK, Status")
        .in("PLAYER_ID_FK", playerIds);

      (marketData || []).forEach((m: any) => {
        marketMap[m.PLAYER_ID_FK] = m.Status;
      });
    }

    const players: TradePlayerAsset[] = (playersData || []).map((p: any) => ({
      ID: p.ID,
      Nome: p.Nome,
      Cognome: p.Cognome,
      Posiz: p.Posiz,
      OVR: p.OVR,
      Squadra: p.Squadra,
      Età: p.Età,
      marketStatus: marketMap[p.ID] || null,
    }));

    // 2. Scelte del draft possedute dalla squadra
    const { data: picksData, error: picksErr } = await supabase
      .from(DRAFT_BOARD_TABLE)
      .select("pick_overall, round, pick_in_round, team_id, original_team_id, rookie_id")
      .eq("team_id", teamId)
      .order("pick_overall", { ascending: true });

    if (picksErr) {
      console.error("fetchTeamAssets picks error:", picksErr);
    }

    const picks: TradePickAsset[] = (picksData || []).map((p: any) => ({
      pick_overall: p.pick_overall,
      round: p.round,
      pick_in_round: p.pick_in_round,
      team_id: p.team_id,
      original_team_id: p.original_team_id,
      rookie_id: p.rookie_id,
    }));

    return { players, picks };
  } catch (err) {
    console.error("fetchTeamAssets exception:", err);
    return { players: [], picks: [] };
  }
}

/**
 * Helper interno per idratare le trattative con nomi completi, dettagli calciatori, scelte e messaggi.
 */
async function hydrateTrades(rawTrades: any[]): Promise<EnrichedTrade[]> {
  if (!rawTrades || rawTrades.length === 0) return [];

  // 1. Raccogli tutti gli ID di giocatori, scelte e squadre coinvolte
  const allPlayerIds = new Set<number>();
  const allPickNums = new Set<number>();
  const allTeamIds = new Set<string>();
  const tradeIds = rawTrades.map((t) => t.id);

  rawTrades.forEach((t) => {
    allTeamIds.add(t.sender_team);
    allTeamIds.add(t.receiver_team);
    (t.offered_player_ids || []).forEach((id: number) => allPlayerIds.add(id));
    (t.requested_player_ids || []).forEach((id: number) => allPlayerIds.add(id));
    (t.offered_pick_numbers || []).forEach((num: number) => allPickNums.add(num));
    (t.requested_pick_numbers || []).forEach((num: number) => allPickNums.add(num));
  });

  // 2. Query parallele per metadati
  const [teamsRes, playersRes, picksRes, messagesRes] = await Promise.all([
    supabase.from(TEAM_TABLE).select("TEAM_ID, NAME").in("TEAM_ID", Array.from(allTeamIds)),
    allPlayerIds.size > 0
      ? supabase.from(PLAYER_TABLE).select("ID, Nome, Cognome, Posiz, OVR, Squadra, Età").in("ID", Array.from(allPlayerIds))
      : Promise.resolve({ data: [] }),
    allPickNums.size > 0
      ? supabase.from(DRAFT_BOARD_TABLE).select("pick_overall, round, pick_in_round, team_id, original_team_id, rookie_id").in("pick_overall", Array.from(allPickNums))
      : Promise.resolve({ data: [] }),
    tradeIds.length > 0
      ? supabase.from(MESSAGES_TABLE).select("*").in("trade_id", tradeIds).order("created_at", { ascending: true })
      : Promise.resolve({ data: [] }),
  ]);

  const teamNameMap: Record<string, string> = {};
  (teamsRes.data || []).forEach((t: any) => {
    teamNameMap[t.TEAM_ID] = t.NAME;
  });

  const playerMap: Record<number, TradePlayerAsset> = {};
  (playersRes.data || []).forEach((p: any) => {
    playerMap[p.ID] = {
      ID: p.ID,
      Nome: p.Nome,
      Cognome: p.Cognome,
      Posiz: p.Posiz,
      OVR: p.OVR,
      Squadra: p.Squadra,
    };
  });

  const pickMap: Record<number, TradePickAsset> = {};
  (picksRes.data || []).forEach((pk: any) => {
    pickMap[pk.pick_overall] = {
      pick_overall: pk.pick_overall,
      round: pk.round,
      pick_in_round: pk.pick_in_round,
      team_id: pk.team_id,
      original_team_id: pk.original_team_id,
      rookie_id: pk.rookie_id,
    };
  });

  const messageMap: Record<string, TradeMessage[]> = {};
  (messagesRes.data || []).forEach((m: any) => {
    if (!messageMap[m.trade_id]) messageMap[m.trade_id] = [];
    messageMap[m.trade_id].push({
      id: m.id,
      trade_id: m.trade_id,
      sender_team: m.sender_team,
      sender_name: m.sender_name,
      message: m.message,
      created_at: m.created_at,
    });
  });

  // 3. Mappa finale
  return rawTrades.map((t) => ({
    id: t.id,
    sender_team: t.sender_team,
    receiver_team: t.receiver_team,
    sender_team_name: teamNameMap[t.sender_team] || t.sender_team,
    receiver_team_name: teamNameMap[t.receiver_team] || t.receiver_team,
    offered_player_ids: t.offered_player_ids || [],
    offered_pick_numbers: t.offered_pick_numbers || [],
    requested_player_ids: t.requested_player_ids || [],
    requested_pick_numbers: t.requested_pick_numbers || [],
    status: t.status,
    notes: t.notes,
    rejection_reason: t.rejection_reason,
    parent_trade_id: t.parent_trade_id,
    created_at: t.created_at,
    updated_at: t.updated_at,
    completed_at: t.completed_at,
    completed_by: t.completed_by,
    offered_players: (t.offered_player_ids || []).map((id: number) => playerMap[id]).filter(Boolean),
    offered_picks: (t.offered_pick_numbers || []).map((num: number) => pickMap[num]).filter(Boolean),
    requested_players: (t.requested_player_ids || []).map((id: number) => playerMap[id]).filter(Boolean),
    requested_picks: (t.requested_pick_numbers || []).map((num: number) => pickMap[num]).filter(Boolean),
    messages: messageMap[t.id] || [],
  }));
}

/**
 * Carica tutte le trattative per una determinata squadra (sia inviate che ricevute).
 */
export async function fetchTeamTrades(teamId: string): Promise<EnrichedTrade[]> {
  try {
    const { data, error } = await supabase
      .from(TRADES_TABLE)
      .select("*")
      .or(`sender_team.eq.${teamId},receiver_team.eq.${teamId}`)
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("fetchTeamTrades query error:", error);
      return [];
    }

    return await hydrateTrades(data || []);
  } catch (err) {
    console.error("fetchTeamTrades exception:", err);
    return [];
  }
}

/**
 * Carica le trattative in attesa di approvazione Admin (status = 'pending_admin').
 */
export async function fetchAdminPendingTrades(): Promise<EnrichedTrade[]> {
  try {
    const { data, error } = await supabase
      .from(TRADES_TABLE)
      .select("*")
      .in("status", ["pending_admin", "pending"])
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("fetchAdminPendingTrades query error:", error);
      return [];
    }

    return await hydrateTrades(data || []);
  } catch (err) {
    console.error("fetchAdminPendingTrades exception:", err);
    return [];
  }
}

/**
 * Carica tutte le trattative ufficiali concluse con successo (Bacheca pubblica).
 */
/**
 * Carica tutte le trattative per l'Admin (tutti gli stati).
 */
export async function fetchAllTradesForAdmin(): Promise<EnrichedTrade[]> {
  try {
    const { data, error } = await supabase
      .from(TRADES_TABLE)
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("fetchAllTradesForAdmin query error:", error);
      return [];
    }

    return await hydrateTrades(data || []);
  } catch (err) {
    console.error("fetchAllTradesForAdmin exception:", err);
    return [];
  }
}

export async function fetchCompletedTrades(): Promise<EnrichedTrade[]> {
  try {
    const { data, error } = await supabase
      .from(TRADES_TABLE)
      .select("*")
      .eq("status", "completed")
      .order("completed_at", { ascending: false });

    if (error) {
      console.warn("fetchCompletedTrades query error:", error);
      return [];
    }

    return await hydrateTrades(data || []);
  } catch (err) {
    console.error("fetchCompletedTrades exception:", err);
    return [];
  }
}

/**
 * Crea una nuova proposta di scambio con controllo ferreo di parità asset.
 */
export async function createTrade(payload: CreateTradePayload): Promise<{
  success: boolean;
  trade?: Trade;
  error?: string;
}> {
  try {
    // Controllo stato finestra di mercato
    const marketState = await getMarketState();
    if (!marketState.isOpen) {
      return {
        success: false,
        error: "Il Calciomercato è attualmente chiuso dalla Lega. Non è possibile inviare nuove proposte di scambio.",
      };
    }

    const totalOffered = payload.offered_player_ids.length + payload.offered_pick_numbers.length;
    const totalRequested = payload.requested_player_ids.length + payload.requested_pick_numbers.length;

    if (totalOffered === 0 || totalRequested === 0) {
      return { success: false, error: "Devi selezionare almeno un asset offerto e uno richiesto." };
    }

    if (totalOffered !== totalRequested) {
      return {
        success: false,
        error: `Regola di parità di asset non rispettata: stai offrendo ${totalOffered} asset per ${totalRequested} asset. Il totale deve essere identico (es. 1 per 1, 2 per 2).`,
      };
    }

    if (payload.sender_team === payload.receiver_team) {
      return { success: false, error: "Non puoi proporre uno scambio alla tua stessa squadra." };
    }

    // Controllo vincoli Portieri per entrambe le squadre (Punto #43: min 2, max 3)
    const allTradedPlayerIds = [...payload.offered_player_ids, ...payload.requested_player_ids];
    const { data: tradedPlayersData } = await supabase
      .from("an_player")
      .select("ID, Posiz, Squadra")
      .or(
        `Squadra.eq.${payload.sender_team},Squadra.eq.${payload.receiver_team}${
          allTradedPlayerIds.length > 0 ? `,ID.in.(${allTradedPlayerIds.join(",")})` : ""
        }`
      );

    if (tradedPlayersData) {
      const senderCurGK = tradedPlayersData.filter((p) => p.Squadra === payload.sender_team && p.Posiz === "POR").length;
      const receiverCurGK = tradedPlayersData.filter((p) => p.Squadra === payload.receiver_team && p.Posiz === "POR").length;

      const offeredGK = tradedPlayersData.filter((p) => payload.offered_player_ids.includes(Number(p.ID)) && p.Posiz === "POR").length;
      const requestedGK = tradedPlayersData.filter((p) => payload.requested_player_ids.includes(Number(p.ID)) && p.Posiz === "POR").length;

      const senderPostGK = senderCurGK - offeredGK + requestedGK;
      const receiverPostGK = receiverCurGK - requestedGK + offeredGK;

      if (senderPostGK > 3) {
        return {
          success: false,
          error: `Operazione non consentita: la tua squadra (${payload.sender_team}) supererebbe il limite massimo di 3 portieri in rosa (ne avrebbe ${senderPostGK}).`,
        };
      }
      if (senderPostGK < 2) {
        return {
          success: false,
          error: `Operazione non consentita: la tua squadra (${payload.sender_team}) scenderebbe sotto il minimo obbligatorio di 2 portieri in rosa (ne avrebbe ${senderPostGK}).`,
        };
      }
      if (receiverPostGK > 3) {
        return {
          success: false,
          error: `Operazione non consentita: la squadra destinataria (${payload.receiver_team}) supererebbe il limite massimo di 3 portieri in rosa (ne avrebbe ${receiverPostGK}).`,
        };
      }
      if (receiverPostGK < 2) {
        return {
          success: false,
          error: `Operazione non consentita: la squadra destinataria (${payload.receiver_team}) scenderebbe sotto il minimo obbligatorio di 2 portieri in rosa (ne avrebbe ${receiverPostGK}).`,
        };
      }
    }

    const { data, error } = await supabase
      .from(TRADES_TABLE)
      .insert({
        sender_team: payload.sender_team,
        receiver_team: payload.receiver_team,
        offered_player_ids: payload.offered_player_ids,
        offered_pick_numbers: payload.offered_pick_numbers,
        requested_player_ids: payload.requested_player_ids,
        requested_pick_numbers: payload.requested_pick_numbers,
        status: "pending",
        notes: payload.notes?.trim() || null,
        parent_trade_id: payload.parent_trade_id || null,
      })
      .select()
      .single();

    if (error || !data) {
      return { success: false, error: error?.message || "Errore durante la creazione dello scambio." };
    }

    // Se c'è una nota iniziale, inseriscila anche come primo messaggio della trattativa
    if (payload.notes?.trim()) {
      await supabase.from(MESSAGES_TABLE).insert({
        trade_id: data.id,
        sender_team: payload.sender_team,
        sender_name: "Proposta Iniziale",
        message: payload.notes.trim(),
      });
    }

    return { success: true, trade: data };
  } catch (err: any) {
    console.error("createTrade exception:", err);
    return { success: false, error: err?.message || "Errore imprevisto." };
  }
}

/**
 * La squadra ricevente accetta la proposta: passa a 'pending_admin'.
 */
export async function acceptTrade(tradeId: string, teamId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Controllo stato finestra di mercato
    const marketState = await getMarketState();
    if (!marketState.isOpen) {
      return {
        success: false,
        error: "Il Calciomercato è attualmente chiuso dalla Lega. Non è possibile accettare proposte di scambio.",
      };
    }

    const { data: tradeData } = await supabase
      .from(TRADES_TABLE)
      .select("*")
      .eq("id", tradeId)
      .single();

    if (!tradeData) {
      return { success: false, error: "Trattativa non trovata." };
    }

    // Verifica vincoli portieri al momento dell'accettazione
    const offeredIds: number[] = tradeData.offered_player_ids || [];
    const requestedIds: number[] = tradeData.requested_player_ids || [];
    const allIds = [...offeredIds, ...requestedIds];

    const { data: playersData } = await supabase
      .from("an_player")
      .select("ID, Posiz, Squadra")
      .or(
        `Squadra.eq.${tradeData.sender_team},Squadra.eq.${tradeData.receiver_team}${
          allIds.length > 0 ? `,ID.in.(${allIds.join(",")})` : ""
        }`
      );

    if (playersData) {
      const senderCurGK = playersData.filter((p) => p.Squadra === tradeData.sender_team && p.Posiz === "POR").length;
      const receiverCurGK = playersData.filter((p) => p.Squadra === tradeData.receiver_team && p.Posiz === "POR").length;

      const offeredGK = playersData.filter((p) => offeredIds.includes(Number(p.ID)) && p.Posiz === "POR").length;
      const requestedGK = playersData.filter((p) => requestedIds.includes(Number(p.ID)) && p.Posiz === "POR").length;

      const senderPostGK = senderCurGK - offeredGK + requestedGK;
      const receiverPostGK = receiverCurGK - requestedGK + offeredGK;

      if (senderPostGK > 3 || senderPostGK < 2 || receiverPostGK > 3 || receiverPostGK < 2) {
        return {
          success: false,
          error: "Impossibile accettare lo scambio: una delle due squadre violerebbe il limite regolamentare sui portieri (minimo 2, massimo 3).",
        };
      }
    }

    const { error } = await supabase
      .from(TRADES_TABLE)
      .update({
        status: "pending_admin",
        updated_at: new Date().toISOString(),
      })
      .eq("id", tradeId)
      .eq("receiver_team", teamId);

    if (error) {
      return { success: false, error: error.message };
    }

    await supabase.from(MESSAGES_TABLE).insert({
      trade_id: tradeId,
      sender_team: teamId,
      sender_name: "Sistema",
      message: "✅ Proposta accettata da entrambe le società. Inviata all'Admin per l'approvazione ufficiale e registrazione in Serie A.",
    });

    invalidateRostersAndTrades();
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Errore durante l'accettazione." };
  }
}

/**
 * La squadra ricevente rifiuta la proposta.
 */
export async function rejectTrade(
  tradeId: string,
  teamId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Controllo stato finestra di mercato
    const marketState = await getMarketState();
    if (!marketState.isOpen) {
      return {
        success: false,
        error: "Il Calciomercato è attualmente chiuso dalla Lega. Non è possibile rifiutare proposte a mercato chiuso.",
      };
    }

    const { error } = await supabase
      .from(TRADES_TABLE)
      .update({
        status: "rejected",
        rejection_reason: reason?.trim() || "Nessuna motivazione specificata",
        updated_at: new Date().toISOString(),
      })
      .eq("id", tradeId)
      .eq("receiver_team", teamId);

    if (error) {
      return { success: false, error: error.message };
    }

    if (reason?.trim()) {
      await supabase.from(MESSAGES_TABLE).insert({
        trade_id: tradeId,
        sender_team: teamId,
        sender_name: "Motivazione Rifiuto",
        message: `❌ Offerta declinata: "${reason.trim()}"`,
      });
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Errore durante il rifiuto." };
  }
}

/**
 * Il mittente ritira/annulla la proposta prima che venga accettata.
 */
export async function cancelTrade(tradeId: string, teamId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from(TRADES_TABLE)
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", tradeId)
      .eq("sender_team", teamId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Errore durante l'annullamento." };
  }
}

/**
 * L'Admin approva ed esegue lo scambio.
 * Tenta prima l'RPC atomica rpc_execute_trade; se non presente, esegue il fallback client-side.
 */
/**
 * Funzione di supporto per il fallback client-side: trasferisce calciatori gestendo
 * i conflitti di numero di maglia assegnando un numero casuale (1..99) libero nella destinazione.
 */
async function transferPlayersWithJerseyResolution(
  playerIds: number[],
  targetTeam: string
) {
  if (playerIds.length === 0) return;

  // 1. Numeri attualmente occupati nella squadra di destinazione
  const { data: existingPlayers, error: exErr } = await supabase
    .from(PLAYER_TABLE)
    .select("NumeroMaglia")
    .eq("Squadra", targetTeam);

  if (exErr) throw exErr;

  const takenNumbers = new Set<number>();
  (existingPlayers || []).forEach((p: any) => {
    if (p.NumeroMaglia != null) {
      takenNumbers.add(Number(p.NumeroMaglia));
    }
  });

  // 2. Dati dei giocatori da trasferire
  const { data: incomingPlayers, error: inErr } = await supabase
    .from(PLAYER_TABLE)
    .select("ID, NumeroMaglia")
    .in("ID", playerIds);

  if (inErr) throw inErr;

  // 3. Assegna squadra ed eventuale numero casuale tra 1 e 99 se in conflitto
  for (const p of incomingPlayers || []) {
    const curJersey = p.NumeroMaglia != null ? Number(p.NumeroMaglia) : null;
    let newJersey = curJersey;

    if (curJersey !== null && takenNumbers.has(curJersey)) {
      // Trova un numero libero tra 1 e 99
      const available: number[] = [];
      for (let n = 1; n <= 99; n++) {
        if (!takenNumbers.has(n)) {
          available.push(n);
        }
      }
      newJersey = available.length > 0 ? available[Math.floor(Math.random() * available.length)] : null;
    }

    if (newJersey !== null) {
      takenNumbers.add(newJersey);
    }

    const payload: { Squadra: string; NumeroMaglia?: number | null } = { Squadra: targetTeam };
    if (newJersey !== curJersey) {
      payload.NumeroMaglia = newJersey;
    }

    const { error: updErr } = await supabase
      .from(PLAYER_TABLE)
      .update(payload)
      .eq("ID", p.ID);

    if (updErr) throw updErr;
  }
}

export async function adminApproveTrade(
  trade: EnrichedTrade,
  adminUsername: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Tentativo RPC su Supabase
    const { data: rpcData, error: rpcError } = await supabase.rpc("rpc_execute_trade", {
      p_trade_id: trade.id,
      p_admin_user: adminUsername,
    });

    if (!rpcError && rpcData?.success) {
      invalidateRostersAndTrades();
      return { success: true };
    }

    // 2. Se l'RPC non esiste o fallisce per mancanza di migrazione SQL, fallback client-side
    console.warn("RPC rpc_execute_trade not available or failed, executing client-side trade execution fallback:", rpcError);

    const allTradedPlayerIds = [...trade.offered_player_ids, ...trade.requested_player_ids];

    // Disassocia temporaneamente tutti i calciatori per azzerare conflitti intermedi su uq_an_player_team_jersey
    if (allTradedPlayerIds.length > 0) {
      await supabase
        .from(PLAYER_TABLE)
        .update({ Squadra: null })
        .in("ID", allTradedPlayerIds);
    }

    // a. Sposta calciatori offerti dal sender al receiver con risoluzione conflitti numero di maglia
    if (trade.offered_player_ids.length > 0) {
      await transferPlayersWithJerseyResolution(trade.offered_player_ids, trade.receiver_team);
    }

    // b. Sposta calciatori richiesti dal receiver al sender con risoluzione conflitti numero di maglia
    if (trade.requested_player_ids.length > 0) {
      await transferPlayersWithJerseyResolution(trade.requested_player_ids, trade.sender_team);
    }

    // c. Sposta scelte del draft offerte dal sender al receiver
    if (trade.offered_pick_numbers.length > 0) {
      const { error: dErr1 } = await supabase
        .from(DRAFT_BOARD_TABLE)
        .update({ team_id: trade.receiver_team })
        .in("pick_overall", trade.offered_pick_numbers);
      if (dErr1) throw dErr1;
    }

    // d. Sposta scelte del draft richieste dal receiver al sender
    if (trade.requested_pick_numbers.length > 0) {
      const { error: dErr2 } = await supabase
        .from(DRAFT_BOARD_TABLE)
        .update({ team_id: trade.sender_team })
        .in("pick_overall", trade.requested_pick_numbers);
      if (dErr2) throw dErr2;
    }

    // e. Aggiorna lo stato dello scambio a 'completed'
    const { error: tErr } = await supabase
      .from(TRADES_TABLE)
      .update({
        status: "completed",
        updated_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        completed_by: adminUsername,
      })
      .eq("id", trade.id);

    if (tErr) throw tErr;

    // f. Messaggio di conferma nel thread
    await supabase.from(MESSAGES_TABLE).insert({
      trade_id: trade.id,
      sender_team: "LEGA",
      sender_name: "Admin Lega",
      message: `🏆 Scambio approvato ed eseguito ufficialmente in Serie A da ${adminUsername}! Le rose e le scelte sono state aggiornate con successo.`,
    });

    return { success: true };
  } catch (err: any) {
    console.error("adminApproveTrade error:", err);
    return { success: false, error: err?.message || "Errore durante l'approvazione dello scambio." };
  }
}

/**
 * L'Admin respinge lo scambio.
 */
export async function adminRejectTrade(
  tradeId: string,
  adminUsername: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from(TRADES_TABLE)
      .update({
        status: "admin_rejected",
        rejection_reason: reason?.trim() || "Non approvato dalla Commissione Tecnica di Lega",
        updated_at: new Date().toISOString(),
      })
      .eq("id", tradeId);

    if (error) {
      return { success: false, error: error.message };
    }

    await supabase.from(MESSAGES_TABLE).insert({
      trade_id: tradeId,
      sender_team: "LEGA",
      sender_name: "Admin Lega",
      message: `⛔ Trattativa respinta dalla Commissione Tecnica: ${reason?.trim() || "Decisione della Lega."}`,
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Errore durante il rifiuto Admin." };
  }
}

/**
 * Invia un messaggio nel thread di una trattativa.
 */
export async function sendTradeMessage(
  tradeId: string,
  senderTeam: string,
  senderName: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from(MESSAGES_TABLE).insert({
      trade_id: tradeId,
      sender_team: senderTeam,
      sender_name: senderName,
      message: message.trim(),
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Errore durante l'invio del messaggio." };
  }
}

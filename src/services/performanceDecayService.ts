import { supabase } from "@/supabaseClient";
import { calcOverall } from "@/utils/playerOvrCalculator";

export const PERFORMANCE_DECAY_ATTRIBUTES = [
  // Portiere (5)
  "RIFP", "PREP", "TUFP", "POSP", "RINP",
  // Difesa / Contrasti (5)
  "MARC", "CONT", "AGGR", "SCIV", "INTR",
  // Passaggi / Regia (6)
  "PASC", "PASL", "CRSS", "CTRP", "VISI", "EFFT",
  // Tiro / Finalizzazione (8)
  "POTN", "PIAZ", "PTIR", "TIRD", "DRBL", "TIRV", "TSTA", "FINA",
  // Fisico / Atletismo (8)
  "ACCL", "VELO", "RESI", "FRZA", "AGIL", "ELEV", "RIFL", "EQLB",
  // Speciali (3)
  "PNIZ", "CRIG", "FRED"
] as const;

export type PerformanceDecayAttribute = (typeof PERFORMANCE_DECAY_ATTRIBUTES)[number];

export const ATTRIBUTE_NAME_MAP: Record<PerformanceDecayAttribute, string> = {
  RIFP: "Riflessi Portiere",
  PREP: "Presa Portiere",
  TUFP: "Tuffo Portiere",
  POSP: "Piazzamento Portiere",
  RINP: "Rinvio Portiere",
  MARC: "Marcatura",
  CONT: "Contrasto in Piedi",
  AGGR: "Aggressività",
  SCIV: "Scivolata",
  INTR: "Intercettazioni",
  PASC: "Passaggi Corti",
  PASL: "Passaggi Lunghi",
  CRSS: "Cross",
  CTRP: "Controllo Palla",
  VISI: "Visione di Gioco",
  EFFT: "Effetto",
  POTN: "Potenza Tiro",
  PIAZ: "Posizionamento Offensivo",
  PTIR: "Precisione Punizioni",
  TIRD: "Tiri dalla Distanza",
  DRBL: "Dribbling",
  TIRV: "Tiri al Volo",
  TSTA: "Precisione Colpo di Testa",
  FINA: "Finalizzazione",
  ACCL: "Accelerazione",
  VELO: "Velocità Scatto",
  RESI: "Resistenza",
  FRZA: "Forza Fisica",
  AGIL: "Agilità",
  ELEV: "Elevazione",
  RIFL: "Reattività / Riflessi",
  EQLB: "Equilibrio",
  PNIZ: "Rigori",
  CRIG: "Freddezza Rigori",
  FRED: "Freddezza"
};

export interface DecayMatchHistory {
  week: number;
  minutes: number;
  points: number;
}

export interface DecayedPlayerReport {
  id: number;
  name: string;
  firstName: string;
  lastName: string;
  team: string;
  pos: string;
  matchesPlayedByTeam: number;
  totalAbsencePoints: number;
  avgAbsence: number;
  penalty: number; // 0, 1, or 2
  oldOvr: number;
  newOvr: number;
  ovrDelta: number;
  oldStats: Record<string, number>;
  newStats: Record<string, number>;
  statDeltas: Record<string, number>;
  matchHistory: DecayMatchHistory[];
}

export interface PerformanceDecaySimulationReport {
  season: number;
  totalEvaluated: number;
  penalty2Count: number;
  penalty1Count: number;
  exemptCount: number;
  players: DecayedPlayerReport[];
}

/**
 * Calcola la simulazione del decadimento prestazionale in-season (Punto #25).
 * Formula:
 * - Denominatore: numero di partite giocate dalla squadra di cui il giocatore fa parte.
 * - Numeratore: per ogni partita della squadra in ordine cronologico:
 *     - se il giocatore gioca (MINUTI > 0) -> punti = 0 (reset serie assenze)
 *     - se non gioca: 1 se prima partita di assenza, 2 se 2a assenza consecutiva, 3 se 3a o oltre consecutiva (cap a 3)
 * - Media = Numeratore / Denominatore
 *     - Media > 2.0  => Penalità -2 a tutti gli attributi
 *     - 1.5 < Media <= 2.0 => Penalità -1 a tutti gli attributi
 *     - Media <= 1.5 => Nessuna penalità
 * - Nessun attributo scende sotto il valore di 30.
 * - Esclusi calciatori senza squadra o squadre LCSIM 2 ("B - xxx").
 */
export async function calculatePerformanceDecaySimulation(
  season: number
): Promise<PerformanceDecaySimulationReport> {
  // 1. Carica tutti i calciatori dal DB
  const { data: playersData, error: playersError } = await supabase
    .from("an_player")
    .select("*")
    .order("Squadra", { ascending: true });

  if (playersError) {
    throw new Error(`Errore caricamento an_player: ${playersError.message}`);
  }

  // 2. Carica partite disputate dai club per la stagione indicata
  const { data: teamStatsData, error: teamStatsError } = await supabase
    .from("as_team_stat")
    .select("WEEK, ID")
    .eq("STAG", season);

  if (teamStatsError) {
    throw new Error(`Errore caricamento as_team_stat: ${teamStatsError.message}`);
  }

  // 3. Carica tabellini individuali dei calciatori per la stagione
  const { data: playerStatsData, error: playerStatsError } = await supabase
    .from("as_player_stat")
    .select("WEEK, ID, MINUTI, TEAM_ID")
    .eq("STAG", season);

  if (playerStatsError) {
    throw new Error(`Errore caricamento as_player_stat: ${playerStatsError.message}`);
  }

  // Mappa delle settimane giocate da ciascun club
  const teamWeeksMap = new Map<string, number[]>();
  (teamStatsData || []).forEach((row: any) => {
    const teamId = String(row.ID || "").trim();
    if (!teamId) return;
    if (!teamWeeksMap.has(teamId)) {
      teamWeeksMap.set(teamId, []);
    }
    const currentList = teamWeeksMap.get(teamId)!;
    const weekNum = Number(row.WEEK);
    if (!currentList.includes(weekNum)) {
      currentList.push(weekNum);
    }
  });

  // Ordina cronologicamente le settimane per ciascun team
  teamWeeksMap.forEach((weeks, teamId) => {
    weeks.sort((a, b) => a - b);
  });

  // Mappa minuti per giocatore e settimana: `${playerId}_${week}` => minuti
  const playerMinutesMap = new Map<string, number>();
  (playerStatsData || []).forEach((ps: any) => {
    const key = `${ps.ID}_${ps.WEEK}`;
    playerMinutesMap.set(key, Number(ps.MINUTI) || 0);
  });

  // Calciatori eleggibili: appartenenti a club di Serie A (esclusi svincolati, ritirati, e serie B "B - ")
  const eligiblePlayers = (playersData || []).filter((p: any) => {
    const sq = p["Squadra"];
    if (!sq || typeof sq !== "string") return false;
    const trimmed = sq.trim();
    if (trimmed === "" || trimmed === "RITIRATO" || trimmed === "SVINCOLATO") return false;
    if (trimmed.startsWith("B - ") || trimmed.startsWith("B-")) return false;
    return true;
  });

  let penalty2Count = 0;
  let penalty1Count = 0;
  let exemptCount = 0;

  const playerReports: DecayedPlayerReport[] = [];

  for (const p of eligiblePlayers) {
    const teamId = p["Squadra"].trim();
    const weeks = teamWeeksMap.get(teamId) || [];

    const oldOvr = Number(p["OVR"]) || 70;
    const pos = p["Posiz"] || "CC";
    const firstName = p["Nome"] || "";
    const lastName = p["Cognome"] || "";
    const fullName = `${firstName} ${lastName}`.trim();

    // Se la squadra non ha disputato partite in questa stagione, media = 0
    if (weeks.length === 0) {
      exemptCount++;
      const oldStats: Record<string, number> = {};
      const newStats: Record<string, number> = {};
      const statDeltas: Record<string, number> = {};
      PERFORMANCE_DECAY_ATTRIBUTES.forEach((attr) => {
        const val = Number(p[attr]) || 30;
        oldStats[attr] = val;
        newStats[attr] = val;
        statDeltas[attr] = 0;
      });

      playerReports.push({
        id: Number(p["ID"]),
        name: fullName,
        firstName,
        lastName,
        team: teamId,
        pos,
        matchesPlayedByTeam: 0,
        totalAbsencePoints: 0,
        avgAbsence: 0,
        penalty: 0,
        oldOvr,
        newOvr: oldOvr,
        ovrDelta: 0,
        oldStats,
        newStats,
        statDeltas,
        matchHistory: []
      });
      continue;
    }

    // Calcolo sequenziale dei punti assenza secondo la formula LCSIM #25
    let consecutiveAbsences = 0;
    let totalAbsencePoints = 0;
    const matchHistory: DecayMatchHistory[] = [];

    for (const week of weeks) {
      const minutes = playerMinutesMap.get(`${p["ID"]}_${week}`) ?? 0;
      let points = 0;
      if (minutes > 0) {
        consecutiveAbsences = 0;
        points = 0;
      } else {
        consecutiveAbsences += 1;
        if (consecutiveAbsences === 1) points = 1;
        else if (consecutiveAbsences === 2) points = 2;
        else points = 3;
      }
      totalAbsencePoints += points;
      matchHistory.push({ week, minutes, points });
    }

    const avgAbsence = totalAbsencePoints / weeks.length;
    let penalty = 0;

    if (avgAbsence > 2.0) {
      penalty = 2;
      penalty2Count++;
    } else if (avgAbsence > 1.5) {
      penalty = 1;
      penalty1Count++;
    } else {
      exemptCount++;
    }

    // Calcolo attributi prima e dopo con limite inferiore a 30
    const oldStats: Record<string, number> = {};
    const newStats: Record<string, number> = {};
    const statDeltas: Record<string, number> = {};

    PERFORMANCE_DECAY_ATTRIBUTES.forEach((attr) => {
      const val = Number(p[attr]) || 30;
      oldStats[attr] = val;
      if (penalty > 0 && val > 30) {
        const newVal = Math.max(30, val - penalty);
        newStats[attr] = newVal;
        statDeltas[attr] = newVal - val;
      } else {
        newStats[attr] = val;
        statDeltas[attr] = 0;
      }
    });

    let newOvr = oldOvr;
    let ovrDelta = 0;

    if (penalty > 0) {
      newOvr = calcOverall(pos, { ...p, ...newStats }, oldOvr);
      ovrDelta = newOvr - oldOvr;
    }

    playerReports.push({
      id: Number(p["ID"]),
      name: fullName,
      firstName,
      lastName,
      team: teamId,
      pos,
      matchesPlayedByTeam: weeks.length,
      totalAbsencePoints,
      avgAbsence,
      penalty,
      oldOvr,
      newOvr,
      ovrDelta,
      oldStats,
      newStats,
      statDeltas,
      matchHistory
    });
  }

  // Ordina per penalità decrescente (prima i -2, poi i -1, poi media desc)
  playerReports.sort((a, b) => {
    if (b.penalty !== a.penalty) return b.penalty - a.penalty;
    return b.avgAbsence - a.avgAbsence;
  });

  return {
    season,
    totalEvaluated: eligiblePlayers.length,
    penalty2Count,
    penalty1Count,
    exemptCount,
    players: playerReports
  };
}

/**
 * Applica atomicamente i peggioramenti calcolati al database Supabase
 * (aggiorna an_player, ea_player_db e league_automation_state).
 */
export async function executePerformanceDecay(
  report: PerformanceDecaySimulationReport,
  adminName: string = "Amministratore LCSIM"
): Promise<{
  success: boolean;
  updatedCount?: number;
  error?: string;
}> {
  try {
    const penalizedPlayers = report.players.filter((p) => p.penalty > 0);

    if (penalizedPlayers.length === 0) {
      return { success: true, updatedCount: 0 };
    }

    // Prepara payload per l'aggiornamento
    const decayUpdatesPayload = penalizedPlayers.map((p) => {
      const payload: Record<string, any> = {
        id: p.id,
        ovr: p.newOvr
      };
      PERFORMANCE_DECAY_ATTRIBUTES.forEach((attr) => {
        payload[attr.toLowerCase()] = p.newStats[attr];
      });
      return payload;
    });

    const details = {
      season: report.season,
      total_evaluated: report.totalEvaluated,
      penalty_2_count: report.penalty2Count,
      penalty_1_count: report.penalty1Count,
      exempt_count: report.exemptCount,
      penalized_players_count: penalizedPlayers.length,
      executed_at: new Date().toISOString()
    };

    // 1. Tentativo tramite RPC atomica Postgres
    const { data, error } = await supabase.rpc("rpc_apply_performance_decay", {
      p_admin_name: adminName,
      p_season: report.season,
      p_decay_updates: decayUpdatesPayload,
      p_details: details
    });

    if (!error && data && data.success) {
      return {
        success: true,
        updatedCount: data.updated_count ?? penalizedPlayers.length
      };
    }

    console.warn("RPC rpc_apply_performance_decay non disponibile o fallita, applicazione diretta client fallback:", error?.message);

    // 2. Fallback diretto client-side: aggiorna an_player in batch
    let updatedCount = 0;
    for (const p of penalizedPlayers) {
      const updateData: Record<string, any> = {
        OVR: p.newOvr
      };
      PERFORMANCE_DECAY_ATTRIBUTES.forEach((attr) => {
        updateData[attr] = p.newStats[attr];
      });

      const { error: updErr } = await supabase
        .from("an_player")
        .update(updateData)
        .eq("ID", p.id);

      if (!updErr) {
        updatedCount++;
      }

      // Aggiorna anche ea_player_db
      const eaUpdateData: Record<string, any> = {
        overallrating: p.newOvr,
        gkreflexes: p.newStats["RIFP"],
        gkhandling: p.newStats["PREP"],
        gkdiving: p.newStats["TUFP"],
        gkpositioning: p.newStats["POSP"],
        gkkicking: p.newStats["RINP"],
        defensiveawareness: p.newStats["MARC"],
        standingtackle: p.newStats["CONT"],
        aggression: p.newStats["AGGR"],
        slidingtackle: p.newStats["SCIV"],
        interceptions: p.newStats["INTR"],
        shortpassing: p.newStats["PASC"],
        longpassing: p.newStats["PASL"],
        crossing: p.newStats["CRSS"],
        ballcontrol: p.newStats["CTRP"],
        vision: p.newStats["VISI"],
        curve: p.newStats["EFFT"],
        shotpower: p.newStats["POTN"],
        positioning: p.newStats["PIAZ"],
        freekickaccuracy: p.newStats["PTIR"],
        longshots: p.newStats["TIRD"],
        dribbling: p.newStats["DRBL"],
        volleys: p.newStats["TIRV"],
        headingaccuracy: p.newStats["TSTA"],
        finishing: p.newStats["FINA"],
        acceleration: p.newStats["ACCL"],
        sprintspeed: p.newStats["VELO"],
        stamina: p.newStats["RESI"],
        strength: p.newStats["FRZA"],
        agility: p.newStats["AGIL"],
        jumping: p.newStats["ELEV"],
        reactions: p.newStats["RIFL"],
        balance: p.newStats["EQLB"],
        penalties: p.newStats["PNIZ"],
        composure: p.newStats["CRIG"]
      };

      await supabase
        .from("ea_player_db")
        .update(eaUpdateData)
        .eq("playerid", p.id);
    }

    // 3. Aggiorna league_automation_state
    await supabase.from("league_automation_state").upsert({
      id: "performance_decay",
      action_name: "Peggioramenti Prestazionali In-Season",
      last_run_at: new Date().toISOString(),
      last_run_by: adminName,
      details,
      updated_at: new Date().toISOString()
    });

    return {
      success: true,
      updatedCount
    };
  } catch (err: any) {
    console.error("Errore esecuzione decadimento prestazionale:", err);
    return {
      success: false,
      error: err.message || "Errore sconosciuto durante l'applicazione dei peggioramenti"
    };
  }
}

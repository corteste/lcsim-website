import { supabase } from "@/supabaseClient";
import { calcOverall } from "@/utils/playerOvrCalculator";

export const AGING_ATTRIBUTES = [
  "RIFP",
  "TUFP",
  "TSTA",
  "ACCL",
  "VELO",
  "RESI",
  "FRZA",
  "AGIL",
  "ELEV",
  "RIFL",
  "EQLB",
] as const;

export type AgingAttribute = (typeof AGING_ATTRIBUTES)[number];

export const ATTRIBUTE_LABELS: Record<AgingAttribute, string> = {
  RIFP: "Riflessi Portiere",
  TUFP: "Tuffo Portiere",
  TSTA: "Precisione Colpo di Testa",
  ACCL: "Accelerazione",
  VELO: "Velocità Scatto",
  RESI: "Resistenza",
  FRZA: "Forza Fisica",
  AGIL: "Agilità",
  ELEV: "Elevazione",
  RIFL: "Riflessi / Reattività",
  EQLB: "Equilibrio",
};

export const DECAY_MATRIX: Record<number, Record<AgingAttribute, number>> = {
  // 30 -> 31
  31: {
    RIFP: -2,
    TUFP: -2,
    TSTA: 0,
    ACCL: -5,
    VELO: -5,
    RESI: -5,
    FRZA: -1,
    AGIL: -1,
    ELEV: -3,
    RIFL: -2,
    EQLB: -1,
  },
  // 31 -> 32
  32: {
    RIFP: -2,
    TUFP: -2,
    TSTA: 0,
    ACCL: -5,
    VELO: -5,
    RESI: -5,
    FRZA: -1,
    AGIL: -1,
    ELEV: -3,
    RIFL: -2,
    EQLB: -1,
  },
  // 32 -> 33
  33: {
    RIFP: -3,
    TUFP: -3,
    TSTA: -1,
    ACCL: -8,
    VELO: -8,
    RESI: -10,
    FRZA: -3,
    AGIL: -2,
    ELEV: -5,
    RIFL: -4,
    EQLB: -2,
  },
  // 33 -> 34
  34: {
    RIFP: -3,
    TUFP: -3,
    TSTA: -1,
    ACCL: -8,
    VELO: -8,
    RESI: -10,
    FRZA: -3,
    AGIL: -2,
    ELEV: -5,
    RIFL: -4,
    EQLB: -2,
  },
};

/**
 * Applica il decadimento a un singolo attributo garantendo la soglia minima di sicurezza di 30.
 * Se il valore era già inferiore a 30 (es. attributi da portiere su giocatori di movimento),
 * non viene mai aumentato artificialmente né fatto scendere sotto 1.
 */
export function applyDecay(val: number, delta: number): number {
  if (delta >= 0) return val;
  const decayed = val + delta;
  if (val >= 30) {
    return Math.max(30, decayed);
  }
  return Math.max(1, Math.min(val, decayed));
}

export interface DecayedPlayer {
  id: number;
  name: string;
  firstName: string;
  lastName: string;
  team: string | null;
  pos: string;
  fromAge: number;
  toAge: number;
  oldOvr: number;
  newOvr: number;
  ovrDelta: number;
  newStats: Record<AgingAttribute, number>;
  statDeltas: Record<AgingAttribute, number>;
}

export interface RetiringPlayer {
  id: number;
  name: string;
  team: string | null;
  pos: string;
  ovr: number;
  fromAge: number;
  toAge: number;
}

export interface FinalSeasonPlayer {
  id: number;
  name: string;
  team: string | null;
  pos: string;
  fromAge: number;
  toAge: number;
  oldOvr: number;
  newOvr: number;
  ovrDelta: number;
}

export interface AgeGroupSummary {
  fromAge: number;
  toAge: number;
  count: number;
  avgOvrChange: number;
  type: "youth" | "decay" | "retire";
}

export interface AgingSimulationReport {
  totalActive: number;
  agedOnlyCount: number;
  decayCount: number;
  retireCount: number;
  finalSeasonCount: number;
  ageDistribution: AgeGroupSummary[];
  decayedPlayers: DecayedPlayer[];
  retiringPlayers: RetiringPlayer[];
  finalSeasonPlayers: FinalSeasonPlayer[];
  announcementTitle: string;
  announcementContent: string;
}

/**
 * Genera il contenuto formattato del comunicato ufficiale automatico di fine stagione.
 */
export function buildAgingAnnouncementContent(
  retiringPlayers: RetiringPlayer[],
  finalSeasonPlayers: FinalSeasonPlayer[],
  totalActive: number,
  agedOnlyCount: number,
  decayCount: number,
  retireCount: number
): string {
  let md = `La Lega LCSIM ha completato la procedura annuale di **invecchiamento anagrafico** (+1 anno) e adeguamento temporale delle date di nascita per tutti i calciatori della lega.\n\n`;

  md += `### 🛑 Calciatori Ritirati Ufficialmente (${retireCount})\n`;
  md += `Al termine della stagione, i seguenti calciatori hanno raggiunto i **35 anni di età**, concludendo ufficialmente la loro carriera agonistica in LCSIM e passando allo status di **RITIRATO**:\n\n`;

  const retiredByTeam: Record<string, RetiringPlayer[]> = {};
  for (const p of retiringPlayers) {
    const t = p.team ? `Squadra: ${p.team}` : "Svincolati / Free Agent";
    if (!retiredByTeam[t]) retiredByTeam[t] = [];
    retiredByTeam[t].push(p);
  }

  for (const [team, pList] of Object.entries(retiredByTeam)) {
    md += `**${team}**\n`;
    for (const p of pList) {
      md += `• **${p.name}** (${p.pos}, OVR ${p.ovr})\n`;
    }
    md += `\n`;
  }

  md += `### ⏳ Veterani all'Ultima Stagione (${finalSeasonPlayers.length})\n`;
  md += `I seguenti calciatori hanno compiuto **34 anni** ed entrano ufficialmente nella loro **ultima stagione agonistica** prima del ritiro definitivo previsto al termine della prossima annata:\n\n`;

  const finalByTeam: Record<string, FinalSeasonPlayer[]> = {};
  for (const p of finalSeasonPlayers) {
    const t = p.team ? `Squadra: ${p.team}` : "Svincolati / Free Agent";
    if (!finalByTeam[t]) finalByTeam[t] = [];
    finalByTeam[t].push(p);
  }

  for (const [team, pList] of Object.entries(finalByTeam)) {
    md += `**${team}**\n`;
    for (const p of pList) {
      md += `• **${p.name}** (${p.pos}, OVR ${p.newOvr})\n`;
    }
    md += `\n`;
  }

  md += `### 📉 Curve di Sviluppo e Decadimento Attributi\n`;
  md += `• **Calciatori Totali Invecchiati**: ${totalActive}\n`;
  md += `• **Fascia Under/Equal 30 (Nessun Decadimento)**: ${agedOnlyCount} calciatori\n`;
  md += `• **Fascia Over 30 (Decadimenti Fisico/Tecnici applicati)**: ${decayCount} calciatori\n`;
  md += `• **Soglia di Sicurezza Valori Minimi**: Nessun attributo è sceso al di sotto del punteggio minimo di **30**.\n\n`;
  md += `Tutti i valori complessivi (OVR) sono stati ricalcolati secondo le formule ufficiali di ruolo LCSIM ed EA FC 25.`;

  return md;
}

/**
 * Calcola l'anteprima completa (simulazione) dell'invecchiamento dei calciatori.
 * Non scrive nel database.
 */
export async function getAgingSimulationReport(): Promise<AgingSimulationReport> {
  const { data: playersData, error: playersError } = await supabase
    .from("an_player")
    .select("*")
    .or("Squadra.neq.RITIRATO,Squadra.is.null")
    .order("Età", { ascending: false });

  if (playersError) {
    throw new Error(`Errore caricamento calciatori attivi: ${playersError.message}`);
  }

  const players = playersData || [];
  const totalActive = players.length;

  const decayedPlayers: DecayedPlayer[] = [];
  const retiringPlayers: RetiringPlayer[] = [];
  const finalSeasonPlayers: FinalSeasonPlayer[] = [];
  let agedOnlyCount = 0;

  const ageMap: Record<number, { count: number; ovrDeltas: number[] }> = {};

  for (const p of players) {
    const fromAge = Number(p["Età"]) || 0;
    const toAge = fromAge + 1;
    const oldOvr = Number(p["OVR"]) || 70;
    const fullName = `${p["Nome"] || ""} ${p["Cognome"] || ""}`.trim();

    if (!ageMap[toAge]) {
      ageMap[toAge] = { count: 0, ovrDeltas: [] };
    }
    ageMap[toAge].count++;

    if (toAge >= 35) {
      retiringPlayers.push({
        id: Number(p["ID"]),
        name: fullName,
        team: p["Squadra"] || null,
        pos: p["Posiz"] || "CC",
        ovr: oldOvr,
        fromAge,
        toAge,
      });
      ageMap[toAge].ovrDeltas.push(0);
    } else if (toAge in DECAY_MATRIX) {
      const decay = DECAY_MATRIX[toAge];
      const newStatsObj: Record<string, any> = { ...p };
      const newAgingStats: Partial<Record<AgingAttribute, number>> = {};
      const statDeltas: Partial<Record<AgingAttribute, number>> = {};

      for (const attr of AGING_ATTRIBUTES) {
        const delta = decay[attr] ?? 0;
        const curVal = Number(p[attr]) || 0;
        const newVal = applyDecay(curVal, delta);
        newStatsObj[attr] = newVal;
        newAgingStats[attr] = newVal;
        statDeltas[attr] = newVal - curVal;
      }

      const newOvr = calcOverall(p["Posiz"], newStatsObj, oldOvr);
      const ovrDelta = newOvr - oldOvr;

      ageMap[toAge].ovrDeltas.push(ovrDelta);

      const decayedRecord: DecayedPlayer = {
        id: Number(p["ID"]),
        name: fullName,
        firstName: p["Nome"] || "",
        lastName: p["Cognome"] || "",
        team: p["Squadra"] || null,
        pos: p["Posiz"] || "CC",
        fromAge,
        toAge,
        oldOvr,
        newOvr,
        ovrDelta,
        newStats: newAgingStats as Record<AgingAttribute, number>,
        statDeltas: statDeltas as Record<AgingAttribute, number>,
      };

      decayedPlayers.push(decayedRecord);

      if (toAge === 34) {
        finalSeasonPlayers.push({
          id: Number(p["ID"]),
          name: fullName,
          team: p["Squadra"] || null,
          pos: p["Posiz"] || "CC",
          fromAge,
          toAge,
          oldOvr,
          newOvr,
          ovrDelta,
        });
      }
    } else {
      agedOnlyCount++;
      ageMap[toAge].ovrDeltas.push(0);
    }
  }

  // Costruzione distribuzione per età
  const ageDistribution: AgeGroupSummary[] = Object.entries(ageMap)
    .map(([toAgeStr, info]) => {
      const toAge = Number(toAgeStr);
      const fromAge = toAge - 1;
      const totalDelta = info.ovrDeltas.reduce((a, b) => a + b, 0);
      const avgOvrChange = info.ovrDeltas.length > 0 ? totalDelta / info.ovrDeltas.length : 0;

      let type: "youth" | "decay" | "retire" = "youth";
      if (toAge >= 35) type = "retire";
      else if (toAge in DECAY_MATRIX) type = "decay";

      return {
        fromAge,
        toAge,
        count: info.count,
        avgOvrChange,
        type,
      };
    })
    .sort((a, b) => a.toAge - b.toAge);

  const announcementTitle = "Passaggio di Stagione: Invecchiamento Calciatori e Annuncio Ritiri";
  const announcementContent = buildAgingAnnouncementContent(
    retiringPlayers,
    finalSeasonPlayers,
    totalActive,
    agedOnlyCount,
    decayedPlayers.length,
    retiringPlayers.length
  );

  return {
    totalActive,
    agedOnlyCount,
    decayCount: decayedPlayers.length,
    retireCount: retiringPlayers.length,
    finalSeasonCount: finalSeasonPlayers.length,
    ageDistribution,
    decayedPlayers,
    retiringPlayers,
    finalSeasonPlayers,
    announcementTitle,
    announcementContent,
  };
}

/**
 * Esegue atomicamente l'invecchiamento e i ritiri chiamando la funzione RPC Postgres.
 */
export async function executePlayerAgingRpc(
  report: AgingSimulationReport,
  adminName: string = "Amministratore LCSIM"
): Promise<{
  success: boolean;
  aged_count?: number;
  ea_aged_count?: number;
  decayed_count?: number;
  ea_decayed_count?: number;
  retired_count?: number;
  ea_retired_count?: number;
  error?: string;
}> {
  try {
    // 1. Preparazione array aggiornamenti per i calciatori che subiscono decadimento
    const decayUpdatesPayload = report.decayedPlayers.map((p) => ({
      id: p.id,
      ovr: p.newOvr,
      rifp: p.newStats.RIFP,
      tufp: p.newStats.TUFP,
      tsta: p.newStats.TSTA,
      accl: p.newStats.ACCL,
      velo: p.newStats.VELO,
      resi: p.newStats.RESI,
      frza: p.newStats.FRZA,
      agil: p.newStats.AGIL,
      elev: p.newStats.ELEV,
      rifl: p.newStats.RIFL,
      eqlb: p.newStats.EQLB,
    }));

    // 2. ID calciatori da ritirare
    const retiringIds = report.retiringPlayers.map((p) => p.id);

    // 3. Chiamata RPC atomica Postgres
    const { data, error } = await supabase.rpc("rpc_apply_player_aging", {
      p_admin_name: adminName,
      p_decay_updates: decayUpdatesPayload,
      p_retiring_ids: retiringIds,
      p_announcement_title: report.announcementTitle,
      p_announcement_content: report.announcementContent,
      p_details: {
        total_active: report.totalActive,
        decay_count: report.decayCount,
        retire_count: report.retireCount,
        final_season_count: report.finalSeasonCount,
        aged_only_count: report.agedOnlyCount,
        executed_at: new Date().toISOString(),
      },
    });

    if (error) throw error;
    return (data as any) || { success: true };
  } catch (err: any) {
    console.error("Errore esecuzione RPC invecchiamento calciatori:", err);
    return {
      success: false,
      error: err.message || "Errore sconosciuto durante l'esecuzione dell'invecchiamento",
    };
  }
}

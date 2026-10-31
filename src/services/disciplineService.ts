import { supabase } from "@/supabaseClient";

export interface PlayerDisciplinaryStatus {
  playerId: number;
  isSuspended: boolean;
  suspensionReason: "red_card" | "consecutive_yellows" | null;
  suspensionDetails?: string;
  isWarned: boolean; // Diffidato (1 giallo nell'ultima partita giocata prima di questa giornata)
  warningDetails?: string;
  currentYellowStreak: number;
  totalYellowsSeason: number;
  totalRedsSeason: number;
}

/**
 * Determina la prossima giornata di campionato da disputare per una squadra e stagione
 */
export async function getNextMatchWeek(teamId: string, season: number): Promise<number> {
  try {
    // 1. Controlla scadenza attiva da league_deadlines
    const { data: deadline } = await supabase
      .from("league_deadlines")
      .select("week")
      .eq("stag", season)
      .eq("is_active", true)
      .maybeSingle();

    if (deadline?.week) return deadline.week;

    // 2. Controlla la prima partita non disputata a calendario
    const { data: schedule } = await supabase
      .from("an_schedule")
      .select("week, standings_processed")
      .eq("stag", season)
      .or(`home.eq.${teamId},away.eq.${teamId}`)
      .order("week", { ascending: true });

    if (schedule && schedule.length > 0) {
      const unplayed = schedule.find((m) => !m.standings_processed);
      if (unplayed) return unplayed.week;
      return schedule[schedule.length - 1].week + 1;
    }

    return 1;
  } catch (err) {
    console.error("Errore getNextMatchWeek:", err);
    return 1;
  }
}

/**
 * Calcola lo stato disciplinare (squalifiche e diffide) per i giocatori di una squadra
 * in vista di una determinata giornata di campionato (targetWeek) di una stagione (season).
 *
 * Regole ufficiali LCSIM:
 * 1. Squalifica per 2 Gialli Consecutivi:
 *    Se un calciatore riceve un cartellino giallo in 2 partite consecutive disputate,
 *    viene squalificato per la giornata successiva (1 turno di squalifica).
 * 2. Squalifica per Espulsione (Cartellino Rosso):
 *    Un cartellino rosso diretto o per doppio giallo comporta 1 giornata di squalifica nel turno successivo.
 * 3. Diffida:
 *    Un calciatore è in diffida se ha ricevuto un cartellino giallo nell'ultima partita disputata (a rischio squalifica al prossimo giallo di fila).
 * 4. Sconto Squalifica:
 *    Una volta scontata la giornata di squalifica (cioè la squadra ha disputato il match in cui era squalificato),
 *    la serie di cartellini gialli consecutivi si azzera e il calciatore torna arruolabile.
 */
export async function fetchTeamDisciplinaryStatus(
  teamId: string,
  season: number,
  targetWeek: number,
  playerIds?: number[]
): Promise<Record<number, PlayerDisciplinaryStatus>> {
  const result: Record<number, PlayerDisciplinaryStatus> = {};

  if (!teamId || targetWeek <= 1) {
    if (playerIds) {
      for (const id of playerIds) {
        result[id] = {
          playerId: id,
          isSuspended: false,
          suspensionReason: null,
          isWarned: false,
          currentYellowStreak: 0,
          totalYellowsSeason: 0,
          totalRedsSeason: 0,
        };
      }
    }
    return result;
  }

  try {
    // 1. Recupera le giornate effettivamente giocate dalla squadra in questa stagione prima di targetWeek
    const { data: schedData, error: schedErr } = await supabase
      .from("an_schedule")
      .select("week, standings_processed")
      .eq("stag", season)
      .lt("week", targetWeek)
      .or(`home.eq.${teamId},away.eq.${teamId}`)
      .order("week", { ascending: true });

    if (schedErr) {
      console.error("Errore fetchTeamDisciplinaryStatus an_schedule:", schedErr);
    }

    const playedWeeks = (schedData || [])
      .filter((m) => m.standings_processed)
      .map((m) => m.week);

    if (playedWeeks.length === 0) {
      if (playerIds) {
        for (const id of playerIds) {
          result[id] = {
            playerId: id,
            isSuspended: false,
            suspensionReason: null,
            isWarned: false,
            currentYellowStreak: 0,
            totalYellowsSeason: 0,
            totalRedsSeason: 0,
          };
        }
      }
      return result;
    }

    const lastPlayedWeek = playedWeeks[playedWeeks.length - 1];

    // 2. Recupera tutti i tabellini delle partite della stagione fino a lastPlayedWeek
    let query = supabase
      .from("as_player_stat")
      .select("ID, STAG, WEEK, GIALLI, ROSSI, MINUTI, VOTO")
      .eq("STAG", season)
      .lte("WEEK", lastPlayedWeek)
      .order("WEEK", { ascending: true });

    if (playerIds && playerIds.length > 0) {
      query = query.in("ID", playerIds);
    }

    const { data: statsData, error: statsErr } = await query;
    if (statsErr) {
      console.error("Errore fetchTeamDisciplinaryStatus as_player_stat:", statsErr);
    }

    // Raggruppa le statistiche per giocatore
    const statsByPlayer = new Map<number, any[]>();
    for (const row of statsData || []) {
      const pId = Number(row.ID);
      if (!statsByPlayer.has(pId)) {
        statsByPlayer.set(pId, []);
      }
      statsByPlayer.get(pId)!.push(row);
    }

    // 3. Calcolo dello stato disciplinare per ogni calciatore
    const allPlayerIds = playerIds && playerIds.length > 0
      ? playerIds
      : Array.from(statsByPlayer.keys());

    for (const pId of allPlayerIds) {
      const pStats = statsByPlayer.get(pId) || [];
      const totalYellowsSeason = pStats.reduce((sum, s) => sum + (Number(s.GIALLI) || 0), 0);
      const totalRedsSeason = pStats.reduce((sum, s) => sum + (Number(s.ROSSI) || 0), 0);

      // Partite in cui il calciatore è effettivamente sceso in campo
      const appearances = pStats.filter(
        (s) => Number(s.MINUTI) > 0 || s.VOTO !== null
      );

      let isSuspended = false;
      let suspensionReason: "red_card" | "consecutive_yellows" | null = null;
      let suspensionDetails: string | undefined = undefined;
      let isWarned = false;
      let warningDetails: string | undefined = undefined;
      let currentYellowStreak = 0;

      // Verifica se ha giocato nell'ultimo turno disputato dalla squadra
      const lastWeekMatch = pStats.find((s) => s.WEEK === lastPlayedWeek);
      const lastWeekPlayed = lastWeekMatch && (Number(lastWeekMatch.MINUTI) > 0 || lastWeekMatch.VOTO !== null);

      if (lastWeekMatch && (Number(lastWeekMatch.ROSSI) || 0) > 0) {
        // A) Espulsione nell'ultima partita giocata dalla squadra
        isSuspended = true;
        suspensionReason = "red_card";
        suspensionDetails = `Espulso nell'ultimo turno di campionato (Giornata ${lastPlayedWeek})`;
      } else if (lastWeekMatch && (Number(lastWeekMatch.GIALLI) || 0) > 0) {
        // Ha preso un giallo nell'ultima partita. Controlliamo se ha preso giallo anche nella presenza precedente!
        const prevAppearances = appearances.filter((s) => s.WEEK < lastPlayedWeek);
        const prevMatch = prevAppearances.length > 0 ? prevAppearances[prevAppearances.length - 1] : null;

        if (prevMatch && (Number(prevMatch.GIALLI) || 0) > 0) {
          // B) 2 Gialli Consecutivi! Squalifica per la prossima giornata!
          isSuspended = true;
          suspensionReason = "consecutive_yellows";
          suspensionDetails = `Squalificato per 2 cartellini gialli consecutivi (Giornata ${prevMatch.WEEK} e Giornata ${lastPlayedWeek})`;
        } else {
          // C) Solo 1 giallo nell'ultima partita -> DIFFIDATO per il prossimo turno!
          isWarned = true;
          currentYellowStreak = 1;
          warningDetails = `Ammonito nella Giornata ${lastPlayedWeek}: a rischio squalifica al prossimo giallo`;
        }
      } else if (!lastWeekPlayed) {
        // Se non ha giocato nell'ultimo turno:
        // Controlliamo l'ultima sua presenza in campo:
        if (appearances.length > 0) {
          const latestAppearance = appearances[appearances.length - 1];
          // Se la sua ultima presenza aveva un giallo e non era già una squalifica scontata
          if ((Number(latestAppearance.GIALLI) || 0) > 0) {
            isWarned = true;
            currentYellowStreak = 1;
            warningDetails = `Ammonito nella Giornata ${latestAppearance.WEEK}: a rischio squalifica al prossimo giallo`;
          }
        }
      }

      result[pId] = {
        playerId: pId,
        isSuspended,
        suspensionReason,
        suspensionDetails,
        isWarned,
        warningDetails,
        currentYellowStreak,
        totalYellowsSeason,
        totalRedsSeason,
      };
    }

    return result;
  } catch (err) {
    console.error("Errore fetchTeamDisciplinaryStatus:", err);
    return result;
  }
}

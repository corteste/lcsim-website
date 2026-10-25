import { supabase } from "@/supabaseClient";

export interface PressConference {
  id: number;
  season: number;
  matchday: number;
  team_id: string;
  manager_name: string | null;
  opponent_team_id: string | null;
  context_summary: string | null;
  question: string;
  answer: string | null;
  answered_at: string | null;
  status: 'PENDING' | 'ANSWERED';
  created_at: string;
  updated_at: string;
  team?: {
    NAME: string;
    MANAGER: string;
    LOGO?: string;
  };
  opponent?: {
    NAME: string;
    MANAGER: string;
    LOGO?: string;
  };
}

export type RumorCategory = 'TRATTATIVA_REALE' | 'TRATTATIVA_DISTORTA' | 'FAKE_NEWS' | 'COLPO_A_SORPRESA';

export interface MarketRumor {
  id: number;
  category: RumorCategory;
  headline: string;
  content: string;
  involved_team_ids: string[];
  involved_player_names: string[];
  credibility_score: number;
  credibility_badge: string;
  source_label: string;
  reactions: {
    fire: number;
    laugh: number;
    shock: number;
    doubt: number;
  };
  is_active: boolean;
  created_at: string;
}

// -----------------------------------------------------------------------------
// CHIAVE API GEMINI & CHIAMATA AL MODELLO GRATUITO
// -----------------------------------------------------------------------------
const GEMINI_STORAGE_KEY = 'lcsim_gemini_api_key';

export async function getGeminiApiKey(): Promise<string | null> {
  // 1. Variabile d'ambiente Vite (.env o .env.local)
  const envKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
  if (envKey && String(envKey).trim().length > 5) return String(envKey).trim();

  // 2. LocalStorage browser
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem(GEMINI_STORAGE_KEY);
    if (local && local.trim().length > 5) return local.trim();
  }

  // 3. Configurazione globale su Supabase DB (attiva per tutti i manager)
  try {
    const { data } = await supabase
      .from('league_automation_state')
      .select('details')
      .eq('id', 'ai_settings')
      .maybeSingle();

    if (data?.details?.gemini_api_key && String(data.details.gemini_api_key).trim().length > 5) {
      return String(data.details.gemini_api_key).trim();
    }
  } catch {}

  return null;
}

export function setGeminiApiKey(key: string): void {
  if (typeof window !== 'undefined') {
    if (!key || key.trim() === '') {
      localStorage.removeItem(GEMINI_STORAGE_KEY);
    } else {
      localStorage.setItem(GEMINI_STORAGE_KEY, key.trim());
    }
  }
}

export async function saveGeminiApiKeyToSupabase(apiKey: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('league_automation_state')
      .upsert({
        id: 'ai_settings',
        action_name: 'Configurazione Chiave Google Gemini',
        details: { gemini_api_key: apiKey.trim() },
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });
    return !error;
  } catch {
    return false;
  }
}

async function callGeminiApi(prompt: string, apiKey?: string): Promise<string | null> {
  const activeKey = apiKey || (await getGeminiApiKey());
  if (!activeKey) return null;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${activeKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 600,
        },
      }),
    });

    if (!response.ok) {
      console.warn('Gemini API call failed with status:', response.status);
      return null;
    }

    const json = await response.json();
    const candidate = json.candidates?.[0]?.content?.parts?.[0]?.text;
    return candidate ? candidate.trim() : null;
  } catch (err) {
    console.warn('Errore durante la chiamata a Gemini:', err);
    return null;
  }
}

// -----------------------------------------------------------------------------
// 1. SALA STAMPA (PRESS CONFERENCES)
// -----------------------------------------------------------------------------

/**
 * Recupera le interviste. Di default mostra SOLO quelle a cui un manager ha risposto.
 */
export async function fetchPressConferences(
  matchday?: number,
  season = 11,
  onlyAnswered = true
): Promise<PressConference[]> {
  try {
    let query = supabase
      .from('press_conferences')
      .select('*, team:an_team!press_conferences_team_id_fkey(NAME, MANAGER), opponent:an_team!press_conferences_opponent_team_id_fkey(NAME, MANAGER)')
      .eq('season', season)
      .order('matchday', { ascending: false })
      .order('answered_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (onlyAnswered) {
      query = query.eq('status', 'ANSWERED');
    }

    if (matchday !== undefined && matchday > 0) {
      query = query.eq('matchday', matchday);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Errore fetchPressConferences:', error);
      return [];
    }
    return (data as PressConference[]) || [];
  } catch (err) {
    console.error('Errore imprevisto fetchPressConferences:', err);
    return [];
  }
}

/**
 * Recupera l'eventuale conferenza stampa ancora in attesa per la squadra specificata
 */
export async function fetchPendingConferenceForTeam(
  teamId: string,
  season = 11
): Promise<PressConference | null> {
  try {
    const { data, error } = await supabase
      .from('press_conferences')
      .select('*, team:an_team!press_conferences_team_id_fkey(NAME, MANAGER), opponent:an_team!press_conferences_opponent_team_id_fkey(NAME, MANAGER)')
      .eq('season', season)
      .eq('team_id', teamId)
      .eq('status', 'PENDING')
      .order('matchday', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) return null;
    return (data as PressConference) || null;
  } catch {
    return null;
  }
}

export async function submitPressAnswer(
  conferenceId: number,
  answer: string,
  managerName?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!answer || answer.trim().length === 0) {
      return { success: false, error: 'Il commento non può essere vuoto.' };
    }

    const updatePayload: Record<string, any> = {
      answer: answer.trim(),
      status: 'ANSWERED',
      answered_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    if (managerName) {
      updatePayload.manager_name = managerName;
    }

    const { error } = await supabase
      .from('press_conferences')
      .update(updatePayload)
      .eq('id', conferenceId);

    if (error) {
      console.error('Errore submitPressAnswer:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function generatePressQuestionsForMatchday(
  matchday: number,
  season = 11
): Promise<{ generated: number; skipped: number; error?: string }> {
  try {
    // 1. Recupera tutti i team attivi
    const { data: teams, error: teamsErr } = await supabase
      .from('an_team')
      .select('TEAM_ID, NAME, MANAGER')
      .eq('ACTIVE', true);

    if (teamsErr || !teams || teams.length === 0) {
      return { generated: 0, skipped: 0, error: 'Nessuna squadra attiva trovata.' };
    }

    // 2. Recupera schedule per determinare l'avversaria di giornata
    const { data: schedule } = await supabase
      .from('an_schedule')
      .select('*')
      .eq('week', matchday);

    // 3. Recupera classifica per contesto
    const { data: standings } = await supabase
      .from('an_standings')
      .select('team_id, points, won, lost, draw, goals_for, goals_against')
      .order('points', { ascending: false });

    const standingsMap = new Map<string, { rank: number; points: number; won: number; lost: number; draw: number }>();
    (standings || []).forEach((st, idx) => {
      standingsMap.set(st.team_id, {
        rank: idx + 1,
        points: st.points || 0,
        won: st.won || 0,
        lost: st.lost || 0,
        draw: st.draw || 0,
      });
    });

    // 4. Recupera alcuni giocatori di punta per ciascun club per arricchire la specificità della domanda
    const { data: topPlayers } = await supabase
      .from('an_player')
      .select('Nome, Cognome, Squadra, Posiz, OVR')
      .in('Squadra', teams.map((t: any) => t.TEAM_ID))
      .order('OVR', { ascending: false })
      .limit(60);

    const playersByTeam = new Map<string, any[]>();
    (topPlayers || []).forEach((p: any) => {
      if (!playersByTeam.has(p.Squadra)) playersByTeam.set(p.Squadra, []);
      playersByTeam.get(p.Squadra)!.push(p);
    });

    // 5. Recupera interviste già presenti per matchday
    const { data: existing } = await supabase
      .from('press_conferences')
      .select('team_id')
      .eq('season', season)
      .eq('matchday', matchday);

    const existingTeamIds = new Set((existing || []).map((e: any) => e.team_id));

    let generatedCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < teams.length; i++) {
      const team = teams[i];
      if (existingTeamIds.has(team.TEAM_ID)) {
        skippedCount++;
        continue;
      }

      let opponentId: string | null = null;
      let isHome = true;
      if (schedule) {
        const match = schedule.find((m: any) => m.home === team.TEAM_ID || m.away === team.TEAM_ID);
        if (match) {
          isHome = match.home === team.TEAM_ID;
          opponentId = isHome ? match.away : match.home;
        }
      }

      const oppTeam = opponentId ? teams.find((t: any) => t.TEAM_ID === opponentId) : null;
      const st = standingsMap.get(team.TEAM_ID);
      const rankText = st ? `${st.rank}° in classifica con ${st.points} pt` : 'inizio campionato';
      const oppText = oppTeam ? `${oppTeam.NAME} (${isHome ? 'in casa' : 'in trasferta'})` : 'prossima avversaria';
      const managerName = team.MANAGER || 'Presidente';

      const teamStarPlayer = (playersByTeam.get(team.TEAM_ID) || [])[0];
      const starPlayerText = teamStarPlayer ? `${teamStarPlayer.Nome} ${teamStarPlayer.Cognome} (${teamStarPlayer.Posiz})` : 'i suoi uomini chiave';

      const contextSummary = `Giornata ${matchday}. ${team.NAME} (${rankText}). Prossima sfida vs ${oppText}. Stella: ${starPlayerText}.`;

      // Prompt unico e fortemente differenziato
      let question: string | null = null;
      const geminiPrompt = `Sei un giornalista sportivo di spicco della Lega LCSIM.
Fai UNA SOLA domanda giornalistica ORIGINALE, pungente e su misura per il Presidente/Mister ${managerName} del "${team.NAME}".
Contesto:
- Turno di Serie A: Giornata ${matchday}
- Situazione attuale della squadra: ${rankText}
- Prossima partita in programma: contro ${oppText}
- Calciatore faro della rosa: ${starPlayerText}
- Indice squadra nel turno: ${i + 1} di 12

Istruzioni speciali per differenziare le domande tra i manager:
- NON fare domande standard o generiche tipo "quali sono i vostri obiettivi?".
- Alterna temi diversi per ciascun presidente: tattica e modulo, pressione psicologica della piazza, rivalità con ${oppText}, dipendenza dai gol di ${starPlayerText}, turnover, mercato e futuro della panchina.
- Rispondi ESCLUSIVAMENTE con il testo della domanda tra virgolette, senza frasi di contorno.`;

      const aiText = await callGeminiApi(geminiPrompt);
      if (aiText) {
        question = aiText.replace(/^["'\s]+|["'\s]+$/g, '');
      }

      if (!question) {
        question = generateDifferentiatedProceduralPressQuestion(
          i,
          team.NAME,
          managerName,
          rankText,
          oppText,
          starPlayerText,
          st?.rank || 6
        );
      }

      const { error: insErr } = await supabase.from('press_conferences').insert({
        season,
        matchday,
        team_id: team.TEAM_ID,
        manager_name: managerName,
        opponent_team_id: opponentId,
        context_summary: contextSummary,
        question,
        status: 'PENDING',
      });

      if (!insErr) {
        generatedCount++;
      } else {
        console.error('Errore inserimento press conference:', insErr);
      }
    }

    return { generated: generatedCount, skipped: skippedCount };
  } catch (err: any) {
    console.error('Errore in generatePressQuestionsForMatchday:', err);
    return { generated: 0, skipped: 0, error: err.message };
  }
}

/**
 * Generatore procedurale con 12 angolazioni giornalistiche completamente diverse
 */
function generateDifferentiatedProceduralPressQuestion(
  teamIndex: number,
  teamName: string,
  managerName: string,
  rankText: string,
  oppText: string,
  starPlayerText: string,
  rank: number
): string {
  const angles = [
    // 0: Pressione e ambizioni
    `Presidente ${managerName}, il ${teamName} viaggia ${rankText}. La sfida con ${oppText} è considerata da tutti la prova del nove per capire se potete puntare al titolo: avverte la pressione dello spogliatoio?`,
    // 1: Tattica e modulo
    `Mister ${managerName}, contro ${oppText} vedremo un atteggiamento coraggioso a viso aperto o punterete su compattezza e ripartenze veloci per imbrigliare il loro gioco?`,
    // 2: Dipendenza dal leader
    `${managerName}, tutti gli occhi sono puntati su ${starPlayerText}. Non teme che la squadra rischi di diventare troppo prevedibile appoggiandosi sempre alle sue giocate?`,
    // 3: Calciomercato & rosa
    `Presidente ${managerName}, in vista del big match contro ${oppText}, si ritiene pienamente soddisfatto della profondità della rosa o sfrutterà queste ore di mercato per qualche innesto last-minute?`,
    // 4: Clima e psicologia
    `Alla vigilia della gara contro ${oppText}, quale messaggio ha voluto dare al gruppo nei giorni scorsi per tenere alta la concentrazione ed evitare cali di tensione?`,
    // 5: Scontro diretto
    `${managerName}, i tre punti contro ${oppText} varrebbero doppio per la classifica. Firmerebbe per un pareggio o giocherete soltanto per vincere?`,
    // 6: Gestione delle energie
    `Mister ${managerName}, con il calendario serrato della Lega, contro ${oppText} ci sarà spazio per qualche rotazione a sorpresa o confermerà in blocco i fedelissimi?`,
    // 7: Reazione d'orgoglio
    `Presidente ${managerName}, i tifosi del ${teamName} chiedono una prestazione di carattere. Contro ${oppText} che tipo di risposta si aspetta dai leader storici della squadra?`,
    // 8: Fase difensiva
    `${managerName}, l'attacco di ${oppText} fa paura a mezza lega. Avete studiato contromisure specifiche per neutralizzare le loro bocche di fuoco?`,
    // 9: Filosofia di gioco
    `Mister ${managerName}, preferisce vedere un ${teamName} bello e spettacolare o una squadra cinica capace di portare a casa il risultato sporco contro ${oppText}?`,
    // 10: Rivalità accesa
    `Presidente ${managerName}, la sfida contro ${oppText} è tradizionalmente ricca di tensione e scintille. Che clima si aspetta in campo e sugli spalti?`,
    // 11: Fiducia nel progetto
    `${managerName}, ${rankText} è il vostro attuale biglietto da visita. Dove può arrivare realmente questo ${teamName} al termine della stagione?`,
  ];

  const chosenAngle = angles[teamIndex % angles.length];
  return chosenAngle;
}

// -----------------------------------------------------------------------------
// 2. GIORNALISTA AI DI LEGA: RUMOR & GOSSIP DI CALCIOMERCATO
// -----------------------------------------------------------------------------

export async function fetchMarketRumors(limit = 40): Promise<MarketRumor[]> {
  try {
    const { data, error } = await supabase
      .from('league_market_rumors')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Errore fetchMarketRumors:', error);
      return [];
    }
    return (data as MarketRumor[]) || [];
  } catch (err) {
    console.error('Errore imprevisto fetchMarketRumors:', err);
    return [];
  }
}

export async function reactToRumor(
  rumorId: number,
  reactionType: 'fire' | 'laugh' | 'shock' | 'doubt'
): Promise<{ success: boolean; reactions?: Record<string, number> }> {
  try {
    const { data: current, error: readErr } = await supabase
      .from('league_market_rumors')
      .select('reactions')
      .eq('id', rumorId)
      .single();

    if (readErr || !current) return { success: false };

    const rx = current.reactions || { fire: 0, laugh: 0, shock: 0, doubt: 0 };
    rx[reactionType] = (rx[reactionType] || 0) + 1;

    const { error: updErr } = await supabase
      .from('league_market_rumors')
      .update({ reactions: rx })
      .eq('id', rumorId);

    if (updErr) return { success: false };
    return { success: true, reactions: rx };
  } catch (err) {
    console.error('Errore reazione rumor:', err);
    return { success: false };
  }
}

export async function checkIsMarketOpen(): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('league_automation_state')
      .select('details')
      .eq('automation_key', 'market_toggle')
      .maybeSingle();

    if (!data || !data.details) return true;
    return data.details.status !== 'closed';
  } catch {
    return true;
  }
}

/**
 * Controllo automatico per generare rumor randomici durante la giornata:
 * Viene eseguito in background quando un utente naviga sul sito.
 * Se il mercato è aperto e sono passate più di 3-4 ore dall'ultimo rumor (oppure con probabilità casuale),
 * genera silenziosamente 1 nuovo scoop con giocatori reali.
 */
export async function maybeTriggerRandomRumor(): Promise<void> {
  try {
    const isOpen = await checkIsMarketOpen();
    if (!isOpen) return;

    // Controlla data dell'ultimo rumor
    const { data: latest } = await supabase
      .from('league_market_rumors')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const now = Date.now();
    let shouldGenerate = false;

    if (!latest) {
      shouldGenerate = true;
    } else {
      const lastCreated = new Date(latest.created_at).getTime();
      const hoursDiff = (now - lastCreated) / (1000 * 60 * 60);

      // Se sono passate più di 3.5 ore genera sempre; oppure se sono passati almeno 45 min con 30% di probabilità
      if (hoursDiff >= 3.5) {
        shouldGenerate = true;
      } else if (hoursDiff >= 0.75 && Math.random() < 0.3) {
        shouldGenerate = true;
      }
    }

    if (shouldGenerate) {
      await generateRandomMarketRumors(1, false);
    }
  } catch (err) {
    // Silenzioso in background
  }
}

export async function generateRandomMarketRumors(
  count = 1,
  force = false
): Promise<{ success: boolean; generated: number; error?: string }> {
  try {
    const isOpen = await checkIsMarketOpen();
    if (!isOpen && !force) {
      return { success: false, generated: 0, error: 'Il calciomercato è chiuso. I rumor sono sospesi.' };
    }

    // 1. Recupera club attivi
    const { data: teams } = await supabase
      .from('an_team')
      .select('TEAM_ID, NAME, MANAGER')
      .eq('ACTIVE', true);

    if (!teams || teams.length < 2) {
      return { success: false, generated: 0, error: 'Dati squadre insufficienti.' };
    }

    // 2. Recupera giocatori reali sotto contratto dalle rose dei club attivi
    const { data: players } = await supabase
      .from('an_player')
      .select('ID, Nome, Cognome, Squadra, Posiz, OVR')
      .in('Squadra', teams.map((t: any) => t.TEAM_ID))
      .not('OVR', 'is', null)
      .order('OVR', { ascending: false })
      .limit(80);

    if (!players || players.length === 0) {
      return { success: false, generated: 0, error: 'Nessun giocatore reale trovato.' };
    }

    // 3. Recupera eventuali proposte reali aperte o recenti
    const { data: activeTrades } = await supabase
      .from('market_trades')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(8);

    let generatedCount = 0;

    for (let i = 0; i < count; i++) {
      // Scegli due club reali differenti
      const teamA = teams[Math.floor(Math.random() * teams.length)];
      let teamB = teams[Math.floor(Math.random() * teams.length)];
      while (teamB.TEAM_ID === teamA.TEAM_ID) {
        teamB = teams[Math.floor(Math.random() * teams.length)];
      }

      // Prendi giocatori reali dei rispettivi due club
      const teamAPlayers = players.filter((p: any) => p.Squadra === teamA.TEAM_ID);
      const teamBPlayers = players.filter((p: any) => p.Squadra === teamB.TEAM_ID);

      const playerA = teamAPlayers.length > 0
        ? teamAPlayers[Math.floor(Math.random() * teamAPlayers.length)]
        : players[Math.floor(Math.random() * players.length)];

      const playerB = teamBPlayers.length > 0
        ? teamBPlayers[Math.floor(Math.random() * teamBPlayers.length)]
        : players[Math.floor(Math.random() * players.length)];

      const playerAName = `${playerA.Nome} ${playerA.Cognome}`.trim();
      const playerBName = `${playerB.Nome} ${playerB.Cognome}`.trim();

      // Categoria interna (utilizzata dall'AI per dosare il realismo, ma NON esposta in UI con etichette rivelatrici)
      const roll = Math.random();
      let internalCategory: RumorCategory = 'FAKE_NEWS';
      if (roll < 0.40 && activeTrades && activeTrades.length > 0) {
        internalCategory = 'TRATTATIVA_DISTORTA';
      } else if (roll < 0.70) {
        internalCategory = 'FAKE_NEWS';
      } else if (roll < 0.90) {
        internalCategory = 'TRATTATIVA_REALE';
      } else {
        internalCategory = 'COLPO_A_SORPRESA';
      }

      // Badge giornalistici autentici (senza rivelare se è fake o vero!)
      const journalisticBadges = ['ESCLUSIVA', 'INDISCREZIONE', 'RETROSCENA', 'RADAR MERCATO', 'ULTIM\'ORA'];
      const credibilityBadge = journalisticBadges[Math.floor(Math.random() * journalisticBadges.length)];
      const sourceLabel = ['Gianluca Di LCSIM', 'Fabrizio Romano LCSIM Edition', 'Gazzetta del Manager', 'Insider LCSIM TV'][Math.floor(Math.random() * 4)];

      let headline = '';
      let content = '';
      const credibilityScore = Math.floor(Math.random() * 45) + 45; // punteggio neutro verosimile (45-90)

      // Prompt per Gemini con nomi reali di calciatori
      const prompt = `Sei il più celebre insider di calciomercato della Lega LCSIM (stile Di Marzio / Fabrizio Romano).
Scrivi una notizia di mercato breve e accattivante in lingua italiana.
Dettagli reali dei club e dei calciatori:
- Club 1: ${teamA.NAME} (${teamA.TEAM_ID}) - Presidente: ${teamA.MANAGER || 'N/A'}
- Club 2: ${teamB.NAME} (${teamB.TEAM_ID}) - Presidente: ${teamB.MANAGER || 'N/A'}
- Calciatore 1 del ${teamA.NAME}: ${playerAName} (${playerA.Posiz}, OVR ${playerA.OVR})
- Calciatore 2 del ${teamB.NAME}: ${playerBName} (${playerB.Posiz}, OVR ${playerB.OVR})

Linee guida:
- Usa SEMPRE i nomi e cognomi reali dei calciatori forniti (${playerAName} e/o ${playerBName}) e delle squadre.
- Stile verosimile e narrativo: parla di contatti telefonici notturni, nodi sull'ingaggio, contropartite tecniche, clausole o vertici improvvisi.
- IMPORTANTE: NON scrivere mai nel testo che si tratta di una "fake news" o di una notizia finta! Il lettore non deve sapere a priori se è una trattativa reale, una voce distorta o una speculazione infondata.
- Rispondi ESCLUSIVAMENTE in formato JSON:
{
  "headline": "Titolo d'impatto stile breaking news con emoji (massimo 15 parole)",
  "content": "Articolo di 2 o 3 paragrafi brevi con dettagli succosi sulla trattativa o sull'interesse"
}`;

      const aiJson = await callGeminiApi(prompt);
      let parsed = false;

      if (aiJson) {
        try {
          const cleanJson = aiJson.replace(/```json/g, '').replace(/```/g, '').trim();
          const obj = JSON.parse(cleanJson);
          if (obj.headline && obj.content) {
            headline = obj.headline;
            content = obj.content;
            parsed = true;
          }
        } catch {
          // Fallback procedurale
        }
      }

      if (!parsed) {
        const proc = generateImmersiveProceduralRumor(
          internalCategory,
          teamA.NAME,
          teamB.NAME,
          playerAName,
          playerBName,
          playerA.Posiz,
          playerB.Posiz
        );
        headline = proc.headline;
        content = proc.content;
      }

      const { error: insErr } = await supabase.from('league_market_rumors').insert({
        category: internalCategory,
        headline,
        content,
        involved_team_ids: [teamA.TEAM_ID, teamB.TEAM_ID],
        involved_player_names: [playerAName, playerBName],
        credibility_score: credibilityScore,
        credibility_badge: credibilityBadge,
        source_label: sourceLabel,
        reactions: { fire: 0, laugh: 0, shock: 0, doubt: 0 },
        is_active: true,
      });

      if (!insErr) {
        generatedCount++;
      } else {
        console.error('Errore inserimento rumor:', insErr);
      }
    }

    return { success: true, generated: generatedCount };
  } catch (err: any) {
    console.error('Errore generateRandomMarketRumors:', err);
    return { success: false, generated: 0, error: err.message };
  }
}

/**
 * Generatore procedurale realistico con nomi veri di calciatori (senza indizi rivelatori)
 */
function generateImmersiveProceduralRumor(
  category: RumorCategory,
  teamAName: string,
  teamBName: string,
  playerAName: string,
  playerBName: string,
  posA: string,
  posB: string
): { headline: string; content: string } {
  const templates = [
    {
      headline: `🔥 ASSE CALDO: ${teamAName} punta dritto su ${playerBName}!`,
      content: `Contatti frenetici sull'asse tra ${teamAName} e ${teamBName}. La dirigenza del ${teamAName} è alla ricerca di rinforzi nel ruolo di ${posB} e avrebbe individuato in ${playerBName} il profilo ideale. Sul tavolo si ragiona su una possibile contropartita tecnica o su un accordo con opzione di riscatto a fine stagione. Le parti si aggiorneranno in serata.`
    },
    {
      headline: `⚡ RETROSCENA: Maxi-scambio tra ${playerAName} e ${playerBName}?`,
      content: `Indiscrezione clamorosa trapelata dai corridoi di mercato: ${teamAName} e ${teamBName} avrebbero discusso a sorpresa un clamoroso scambio che coinvolgerebbe ${playerAName} e ${playerBName}. Secondo gli addetti ai lavori, l'intesa tra i due club sarebbe vicina, ma resta ancora da limare l'accordo con gli entourage dei due calciatori.`
    },
    {
      headline: `🚨 ULTIM'ORA: Sondaggio improvviso del ${teamBName} per ${playerAName}!`,
      content: `Blitz a sorpresa nelle ultime ore: il ${teamBName} avrebbe effettuato una mossa ufficiale per capire la fattibilità dell'operazione ${playerAName}. Il calciatore del ${teamAName} piace moltissimo per duttilità e valore in campo. Dalla società filtra prudenza, ma i rumors su un'offerta imminente continuano a rimbalzare con insistenza.`
    },
    {
      headline: `💬 TENSIONE MERCATO: ${playerBName} nel mirino del ${teamAName}, muro del ${teamBName}`,
      content: `Non si placano le voci sul futuro di ${playerBName}. Il ${teamAName} avrebbe recapitato una proposta allettante, trovando però per ora la ferma opposizione del ${teamBName}, che considera il giocatore incedibile. La sensazione tra gli addetti ai lavori è che la partita sia appena cominciata.`
    },
    {
      headline: `🔎 RADAR MERCATO: ${teamAName} valuta la mossa per ${playerBName} in extremis`,
      content: `Attenzione alle sorprese dell'ultima ora: ${teamAName} sta monitorando con attenzione la situazione di ${playerBName} del ${teamBName}. Se dovesse sbloccarsi un'uscita in quella zona di campo, il presidente potrebbe dare il via libera all'affondo decisivo prima del gong.`
    }
  ];

  return templates[Math.floor(Math.random() * templates.length)];
}

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

export function getGeminiApiKey(): string | null {
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem(GEMINI_STORAGE_KEY);
    if (local && local.trim().length > 5) return local.trim();
  }
  const envKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
  if (envKey && String(envKey).trim().length > 5) return String(envKey).trim();
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

async function callGeminiApi(prompt: string, apiKey?: string): Promise<string | null> {
  const activeKey = apiKey || getGeminiApiKey();
  if (!activeKey) return null;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${activeKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.85,
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

export async function fetchPressConferences(matchday?: number, season = 11): Promise<PressConference[]> {
  try {
    let query = supabase
      .from('press_conferences')
      .select('*, team:an_team!press_conferences_team_id_fkey(NAME, MANAGER), opponent:an_team!press_conferences_opponent_team_id_fkey(NAME, MANAGER)')
      .eq('season', season)
      .order('matchday', { ascending: false })
      .order('answered_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

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

export async function submitPressAnswer(conferenceId: number, answer: string, managerName?: string): Promise<{ success: boolean; error?: string }> {
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

export async function generatePressQuestionsForMatchday(matchday: number, season = 11): Promise<{ generated: number; skipped: number; error?: string }> {
  try {
    // 1. Recupera tutti i team attivi
    const { data: teams, error: teamsErr } = await supabase
      .from('an_team')
      .select('TEAM_ID, NAME, MANAGER')
      .eq('ACTIVE', true);

    if (teamsErr || !teams || teams.length === 0) {
      return { generated: 0, skipped: 0, error: 'Nessuna squadra attiva trovata.' };
    }

    // 2. Recupera partite in programma o concluse per determinare l'avversaria
    const { data: schedule } = await supabase
      .from('an_schedule')
      .select('*')
      .eq('week', matchday);

    // 3. Recupera classifica per contesto posizioni
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

    // 4. Recupera interviste già presenti per matchday
    const { data: existing } = await supabase
      .from('press_conferences')
      .select('team_id')
      .eq('season', season)
      .eq('matchday', matchday);

    const existingTeamIds = new Set((existing || []).map((e: any) => e.team_id));

    let generatedCount = 0;
    let skippedCount = 0;

    for (const team of teams) {
      if (existingTeamIds.has(team.TEAM_ID)) {
        skippedCount++;
        continue;
      }

      // Trova avversaria dal calendario
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
      const rankText = st ? `${st.rank}° posto con ${st.points} pt (${st.won}V-${st.draw}P-${st.lost}S)` : 'Inizio stagione';
      const oppText = oppTeam ? `${oppTeam.NAME} (${isHome ? 'in casa' : 'in trasferta'})` : 'prossima avversaria';
      const managerName = team.MANAGER || 'Presidente';

      const contextSummary = `Giornata ${matchday}. Squadra: ${team.NAME}. Rendimento: ${rankText}. Prossima sfida vs: ${oppText}.`;

      // Generazione Domanda via Gemini o Fallback procedurale
      let question: string | null = null;
      const geminiPrompt = `Sei un giornalista sportivo esperto, pungente ed educato della Lega LCSIM (stile Sky Sport / Gazzetta).
Fai UNA SOLA domanda diretta e incalzante al Presidente/Allenatore ${managerName} della squadra "${team.NAME}".
Contesto della squadra:
- Campionato: Serie A LCSIM (Giornata ${matchday})
- Situazione in classifica e rendimento: ${rankText}
- Prossimo match: contro ${oppText}

La domanda deve stimolare una dichiarazione sincera sulle ambizioni, sulla gestione della rosa o sulla pressione della sfida imminente.
Rispondi SOLO con il testo della domanda tra virgolette, senza preamboli né spiegazioni.`;

      const aiText = await callGeminiApi(geminiPrompt);
      if (aiText) {
        question = aiText.replace(/^["'\s]+|["'\s]+$/g, '');
      }

      if (!question) {
        // Fallback procedurale di qualità
        question = generateProceduralPressQuestion(team.NAME, managerName, rankText, oppText, st?.rank || 6);
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

function generateProceduralPressQuestion(
  teamName: string,
  managerName: string,
  rankText: string,
  oppText: string,
  rank: number
): string {
  const templatesTop = [
    `Presidente ${managerName}, la vetta della classifica premia la continuità del ${teamName}. La prossima sfida contro ${oppText} rappresenta la vera prova di maturità per blindare le vostre ambizioni scudetto?`,
    `${managerName}, il ruolino di marcia recente è impressionante (${rankText}). Teme che l'entusiasmo della piazza possa trasformarsi in un calo di concentrazione in vista del duello con ${oppText}?`,
    `I tifosi del ${teamName} sognano in grande. Contro ${oppText} si aspetta una prestazione di autorità o punterete sul pragmatismo per portare a casa i tre punti?`,
  ];

  const templatesMid = [
    `Presidente ${managerName}, il rendimento attuale (${rankText}) tiene il ${teamName} a metà classifica. Cosa manca ancora alla squadra per compiere il definitivo salto di qualità verso la zona podio?`,
    `La sfida alle porte contro ${oppText} ha il sapore del crocevia stagionale. Che messaggio ha dato al gruppo durante gli allenamenti settimanali?`,
    `Mister ${managerName}, tra rotazioni necessarie e ricerca di continuità, quale sarà la chiave tattica per scardinare la resistenza di ${oppText}?`,
  ];

  const templatesBottom = [
    `Presidente ${managerName}, la classifica attuale (${rankText}) richiede una pronta scossa emotiva. Lo scontro con ${oppText} può essere la partita della svolta per allontanare le polemiche?`,
    `Il momento non è dei più facili per il ${teamName}. Sente ancora la piena fiducia della dirigenza e quale risposta si aspetta dai leader dello spogliatoio nel match contro ${oppText}?`,
    `Tifosi e addetti ai lavori attendono una reazione d'orgoglio. Con quale atteggiamento mentale scenderà in campo il ${teamName} contro ${oppText}?`,
  ];

  const list = rank <= 4 ? templatesTop : rank <= 8 ? templatesMid : templatesBottom;
  return list[Math.floor(Math.random() * list.length)];
}

// -----------------------------------------------------------------------------
// 2. GIORNALISTA AI DI LEGA: RUMOR DI CALCIOMERCATO & GOSSIP
// -----------------------------------------------------------------------------

export async function fetchMarketRumors(limit = 30): Promise<MarketRumor[]> {
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
    // Leggi reazioni attuali
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

    if (!data || !data.details) return true; // Default aperto
    return data.details.status !== 'closed';
  } catch {
    return true;
  }
}

export async function generateRandomMarketRumors(
  count = 2,
  force = false
): Promise<{ success: boolean; generated: number; error?: string }> {
  try {
    // 1. Verifica stato mercato
    const isOpen = await checkIsMarketOpen();
    if (!isOpen && !force) {
      return { success: false, generated: 0, error: 'Il calciomercato è attualmente chiuso. I rumor sono sospesi.' };
    }

    // 2. Recupera club attivi
    const { data: teams } = await supabase
      .from('an_team')
      .select('TEAM_ID, NAME, MANAGER')
      .eq('ACTIVE', true);

    if (!teams || teams.length < 2) {
      return { success: false, generated: 0, error: 'Dati squadre insufficienti.' };
    }

    // 3. Recupera giocatori cedibili o sotto contratto per arricchire i rumor
    const { data: players } = await supabase
      .from('an_player')
      .select('ID, Nome, Cognome, Squadra, Posiz, OVR')
      .not('Squadra', 'is', null)
      .order('OVR', { ascending: false })
      .limit(60);

    // 4. Recupera eventuali trattative in corso
    const { data: activeTrades } = await supabase
      .from('market_trades')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    // 5. Recupera bisogni dichiarati
    const { data: teamNeeds } = await supabase
      .from('team_market_needs')
      .select('*')
      .limit(20);

    let generatedCount = 0;

    for (let i = 0; i < count; i++) {
      // Determina categoria
      // 40% TRATTATIVA_DISTORTA, 30% FAKE_NEWS, 20% TRATTATIVA_REALE, 10% COLPO_A_SORPRESA
      const roll = Math.random();
      let category: RumorCategory = 'FAKE_NEWS';
      if (roll < 0.40 && activeTrades && activeTrades.length > 0) {
        category = 'TRATTATIVA_DISTORTA';
      } else if (roll < 0.70) {
        category = 'FAKE_NEWS';
      } else if (roll < 0.90) {
        category = 'TRATTATIVA_REALE';
      } else {
        category = 'COLPO_A_SORPRESA';
      }

      // Scegli due team casuali
      const teamA = teams[Math.floor(Math.random() * teams.length)];
      let teamB = teams[Math.floor(Math.random() * teams.length)];
      while (teamB.TEAM_ID === teamA.TEAM_ID) {
        teamB = teams[Math.floor(Math.random() * teams.length)];
      }

      // Scegli giocatori casuali appartenenti a uno dei due team se disponibili
      const teamAPlayers = (players || []).filter((p: any) => p.Squadra === teamA.TEAM_ID);
      const teamBPlayers = (players || []).filter((p: any) => p.Squadra === teamB.TEAM_ID);

      const playerA = teamAPlayers.length > 0 ? teamAPlayers[Math.floor(Math.random() * teamAPlayers.length)] : (players ? players[0] : null);
      const playerB = teamBPlayers.length > 0 ? teamBPlayers[Math.floor(Math.random() * teamBPlayers.length)] : (players ? players[1] : null);

      const playerAName = playerA ? `${playerA.Nome} ${playerA.Cognome}`.trim() : 'il top player';
      const playerBName = playerB ? `${playerB.Nome} ${playerB.Cognome}`.trim() : 'la stella emergente';

      let headline = '';
      let content = '';
      let credibilityScore = 50;
      let credibilityBadge = 'Indiscrezione';
      const sourceLabel = ['Gianluca Di LCSIM', 'Fabrizio Romano LCSIM Edition', 'Gazzetta del Manager', 'Insider LCSIM TV'][Math.floor(Math.random() * 4)];

      // Prova generazione con Gemini
      const prompt = `Sei il più famoso giornalista esperto di calciomercato della Lega di Calcio Virtuale LCSIM.
Scrivi una "Breaking News" di mercato breve, pungente e realistica in lingua italiana.
Dati a disposizione:
- Categoria richiesta: ${category}
- Squadra 1: ${teamA.NAME} (Presidente: ${teamA.MANAGER || 'N/A'})
- Squadra 2: ${teamB.NAME} (Presidente: ${teamB.MANAGER || 'N/A'})
- Calciatore 1 coinvolto: ${playerAName} (${playerA?.Posiz || 'ATT'}, OVR ${playerA?.OVR || 78})
- Calciatore 2 coinvolto: ${playerBName} (${playerB?.Posiz || 'CC'}, OVR ${playerB?.OVR || 76})

Regole per categoria:
- TRATTATIVA_REALE: Notizia credibile e fondata su contatti reali tra i due club. Credibilità tra 75% e 90%.
- TRATTATIVA_DISTORTA: La trattativa esiste ma tu "sbagli apposta" o ingigantisci un dettaglio (es. scambi le contropartite, inserisci cifre folli o sostieni che sia saltato tutto per un malinteso). Credibilità tra 45% e 65%.
- FAKE_NEWS: Notizia inventata di sana pianta, clamorosa, scandalistica o divertente per infiammare la chat della lega (es. tradimento shock, veto presidenziale, clausole assurde). Credibilità tra 10% e 35%.
- COLPO_A_SORPRESA: Blitz improvviso nella notte per sfilare il giocatore a sorpresa. Credibilità tra 50% e 70%.

Rispondi ESCLUSIVAMENTE in formato JSON valido con questa struttura:
{
  "headline": "Titolo accattivante stile breaking news con emoji",
  "content": "Articolo di 2 o 3 paragrafi brevi con dettagli, retroscena e indiscrezioni",
  "credibility_score": numero intero da 1 a 100,
  "credibility_badge": "una tra: Pista Calda, Voce di Corridoio, Fake News, Bomba di Mercato, Indiscrezione"
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
            credibilityScore = Math.max(1, Math.min(100, Number(obj.credibility_score) || 50));
            credibilityBadge = obj.credibility_badge || 'Indiscrezione';
            parsed = true;
          }
        } catch (e) {
          console.warn('Fallback al parser procedurale rumor dopo fallimento JSON Gemini');
        }
      }

      if (!parsed) {
        // Generatore procedurale realistico
        const proc = generateProceduralRumor(category, teamA.NAME, teamB.NAME, playerAName, playerBName);
        headline = proc.headline;
        content = proc.content;
        credibilityScore = proc.credibility_score;
        credibilityBadge = proc.credibility_badge;
      }

      const { error: insErr } = await supabase.from('league_market_rumors').insert({
        category,
        headline,
        content,
        involved_team_ids: [teamA.TEAM_ID, teamB.TEAM_ID],
        involved_player_names: [playerAName, playerBName].filter(Boolean),
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

function generateProceduralRumor(
  category: RumorCategory,
  teamAName: string,
  teamBName: string,
  playerAName: string,
  playerBName: string
): { headline: string; content: string; credibility_score: number; credibility_badge: string } {
  switch (category) {
    case 'TRATTATIVA_REALE':
      return {
        headline: `🔥 CONTATTI AVANZATI: ${teamAName} spinge per ${playerBName}`,
        content: `Secondo le ultime indiscrezioni raccolte a tarda notte, ${teamAName} ha allacciato contatti diretti con la dirigenza del ${teamBName}. L'obiettivo numero uno per rinforzare l'organico è ${playerBName}. Le due società stanno discutendo la formula: prestito con diritto di riscatto o trasferimento a titolo definitivo. Filtra ottimismo da entrambe le parti.`,
        credibility_score: Math.floor(Math.random() * 15) + 75, // 75 - 90
        credibility_badge: 'Pista Calda',
      };

    case 'TRATTATIVA_DISTORTA':
      return {
        headline: `⚠️ GIALLO DI MERCATO: Maxiscambio tra ${teamAName} e ${teamBName}?`,
        content: `Clamoroso retroscena sull'asse tra ${teamAName} e ${teamBName}. Una voce di corridoio insistente riferisce che il passaggio di ${playerAName} al ${teamBName} sarebbe bloccato a causa della richiesta di inserire ${playerBName} come contropartita tecnica obbligatoria. Fonti vicine alla trattativa parlano di un accordo quasi raggiunto, ma i manager smentiscono categoricamente l'esistenza della clausola!`,
        credibility_score: Math.floor(Math.random() * 20) + 45, // 45 - 65
        credibility_badge: 'Indiscrezione',
      };

    case 'FAKE_NEWS':
      return {
        headline: `🚨 BOMBA SHOCK: Rottura improvvisa! ${playerAName} pronto a firmare per ${teamBName}?`,
        content: `Scoppia la bomba del calciomercato LCSIM! Voci clamorose provenienti dall'ambiente del ${teamAName} raccontano di un violento diverbio nello spogliatoio e di ${playerAName} che avrebbe svuotato l'armadietto per accasarsi immediatamente dai rivali storici del ${teamBName}. Gli addetti ai lavori invitano alla calma: sembra a tutti gli effetti la classica fake news di mezza estate orchestrata da agenti provocatori!`,
        credibility_score: Math.floor(Math.random() * 25) + 10, // 10 - 35
        credibility_badge: 'Fake News',
      };

    case 'COLPO_A_SORPRESA':
      return {
        headline: `⚡ BLITZ NOTTURNO: ${teamAName} piomba a fari spenti su ${playerBName}!`,
        content: `Mossa a sorpresa nella notte per il ${teamAName}: approfittando dell'impasse nelle altre trattative, la dirigenza ha recapitato un'offerta formale a sorpresa per ${playerBName} del ${teamBName}. Resta da capire se il ${teamBName} deciderà di sacrificare il proprio giocatore o se rispedirà la proposta al mittente.`,
        credibility_score: Math.floor(Math.random() * 20) + 50, // 50 - 70
        credibility_badge: 'Bomba di Mercato',
      };
  }
}

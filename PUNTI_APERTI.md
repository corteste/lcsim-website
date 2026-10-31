# Registro Punti Aperti & Backlog Tecnico LCSIM

Questo documento tiene traccia di tutte le attività, requisiti aperti, logiche da implementare e miglioramenti pianificati per il progetto LCSIM.



---

## 📌 1. Logica di Caricamento & Importazione Risultati (CSV & Screenshot Admin)
- **Stato**: 🟢 Completato & Integrato in Amministrazione (Screenshot OCR 32/422+ file + CSV Import/Export + Sblocco Programmato +45 min)
- **Priorità**: Alta (Funzionalità chiave per la gestione della nuova stagione)
- **File di riferimento**: `src/services/matchStatsImportService.ts`, `src/components/admin/MatchResultsManagerModal.tsx`, `src/pages/admin/AdminAutomazioni.tsx`, `supabase/migrations/20261030_match_stats_and_unlock.sql`
- **Tabelle coinvolte**: `an_schedule`, `"AS_TEAM_STAT"`, `"AS_PLAYER_STAT"`, `an_team`, `an_player`, `an_standings`
Descrizione
L'Admin caricherà settimanalmente un file CSV contenente i dati e i risultati delle partite della giornata di campionato. Il file ha una struttura peculiare a blocchi verticali (foglio di calcolo esportato) e necessita di un parser dedicato per distribuire correttamente i record nel database relazionale Supabase.
Struttura del CSV analizzata
6 Blocchi Partita (34 righe per blocco, totale 204 righe per giornata da 12 squadre):
Lato Sinistro (Colonne 1-28 - Calciatori): Fino a 32 righe per incontro (titolari e panchinari delle due squadre).
Mappatura su "AS_PLAYER_STAT":
ID $\to$ ID calciatore (coerente con an_player.ID)
Voto $\to$ VOTO
Gol $\to$ GOL
Assist $\to$ ASST
Tiri ✅ $\to$ TIRI_IN (tiri in porta)
Tiri Tot $\to$ TIRI_TOT
Pass ✅ $\to$ PASS_SI (passaggi completati)
Pass Tot $\to$ PASS_TOT
Drib ✅ $\to$ DRIB_SI (dribbling riusciti)
Drib Tot $\to$ DRIB_TOT
Cont ✅ $\to$ CTRS_SI (contrasti vinti)
Cont Tot $\to$ CTRS_TOT
Falli $\to$ FALLI
Parate $\to$ PARA
Subiti $\to$ GSUB (gol subiti dal portiere)
Giallo $\to$ GIALLI
Rosso $\to$ ROSSI
Fuorigioco $\to$ FGIOCO
Minuti $\to$ MINUTI
Valori predefiniti a 0 per colonne DB non nel CSV: AGOL, CROS_SI, CROS_TOT.
Lato Destro (Colonne 30-32 - Statistiche Squadra):
Mappatura su "AS_TEAM_STAT" (vengono inseriti 2 record per match, uno per la squadra di casa e uno per la squadra in trasferta):
Team1 / Team2 $\to$ Risoluzione automatica di TEAM_ID (3 lettere) tramite la tabella an_team.
Allenatore $\to$ ALLENATORE
Gol $\to$ GOL (e GSUB della squadra corrisponde al GOL dell'avversaria)
Possesso $\to$ POSS (valore decimale, es. 0.52)
Tiri / % Tiri $\to$ TIRI_TOT e TIRI_SI
Passaggi / % Passaggi $\to$ PASS_TOT e PASS_SI
Contrasti / Contrasti Vinti $\to$ CTRS_TOT e CTRS_SI
Dribbling / % Dribbling $\to$ DRIB_TOT e DRIB_SI
Falli Commessi $\to$ FALLI
Parate $\to$ PARA
Calci d'Angolo $\to$ CANGL
Gialli, Rossi, Fuorigioco $\to$ GIALLI, ROSSI, FGIOCO
Media Voto $\to$ VOTO
Minuti $\to$ MINUTI (standard 90)
Prerequisiti & Aspetti da Gestire
Calendario Stagione 11 (an_schedule):
Attualmente la tabella an_schedule ha partite popolate solo per le stagioni 9 e 10.
Prima o durante il caricamento dei risultati della Stagione 11, le partite devono essere create o aggiornate in an_schedule con stag = 11, week = 1..22, home, away, stadium, weather, date.
Interfaccia / Modalità di Caricamento:
Valutare se implementare:
Opzione A: Schermata o modale Admin nel sito web con Drag & Drop del CSV, tabella di anteprima con validazione degli errori e bottone "Pubblica Giornata su Supabase".
Opzione B: Script CLI automatico (npm run import-week --file=...).
(Opzione raccomandata: Opzione A integrata nell'area Admin del sito per massima comodità).
Calcolo Classifiche:
Assicurarsi che dopo l'inserimento delle statistiche venga invocata o attivata la procedura di aggiornamento classifica (standings_processed = true).



---

## 📌 2. Sistema di Messaggistica Interna, Proposte di Scambio & Comunicazioni Admin
- **Stato**: 🟢 Completato (2.1 in prod, 2.2 e 2.3 su branch dev)
- **Priorità**: Media-Alta (Potente miglioramento dell'esperienza utente e della gestione di lega)
- **Moduli coinvolti**: Navbar (Badge notifiche), Nuova sezione Posta/Messaggi (/inbox o /mercato/scambi), Bacheca Comunicazioni Admin
2.1 Modulo Proposte di Scambio Giocatori (Market Trades)
- **Stato**: 🟢 Implementato su branch dev (Pronto per test)

### Funzionalità completate
Area Riservata: /mia-squadra/trattative (proposte segrete, ricevute, inviate, storico e thread negoziazione).
Bacheca Pubblica Ufficiale: /mercato/scambi (riepilogo pubblico scambi convalidati dalla Lega).
Asset Supportati: Calciatori in rosa (an_player) e Scelte del Draft (an_draft_board).
Regola di Parità Asset: Controllo ferreo frontend/backend: $N$ asset ceduti $\iff N$ asset ricevuti (1:1, 2:2, ecc.).
Workflow di Trattativa Completo: Invio, Notifiche ricevute, Accetta $\to$ stato pending_admin, Rifiuta con motivazione, Controproposta automatica invertita, Ritiro/Annullamento del mittente.
Pannello Convalida Admin: Approvazione ufficiale con trasferimento atomico dei giocatori in an_player e delle scelte in an_draft_board.
Script SQL Migrazione: supabase/migrations/20261023_market_trades.sql con tabelle market_trades, trade_messages, indici, RLS e funzione atomica rpc_execute_trade.
2.2 Modulo Comunicazioni Ufficiali Admin (Broadcast & Bacheca Lega)
- **Stato**: 🟢 Implementato su branch dev (Eseguito su Supabase)

### Funzionalità completate
Bacheca Comunicati Ufficiali (/comunicati): Feed pubblico con filtro categorie (Regolamento, Mercato, Giornate, Disciplinare, Generale), ricerca, stato letto/non letto e gestione completa per l'Admin (Creazione, Modifica, Eliminazione, Fissa in alto, Imposta Banner).
Banner Globale in Cima al Sito: Mostrato automaticamente sotto la Navbar per i comunicati marcati come is_banner = true, chiudibile dall'utente.
Tabelle Supabase create: league_announcements e announcement_reads (supabase/migrations/20261023_announcements_and_notifications.sql).
2.3 Integrazione Notifiche Realtime
- **Stato**: 🟢 Implementato su branch dev

### Funzionalità completate
Campana Notifiche nella Navbar (NotificationsMenu): Contatore Badge numerico animato e pannello a discesa unificato (Comunicati Lega non letti, nuove proposte di scambio, cambi di stato scambi, nuovi messaggi chat trattativa e scambi da convalidare per l'Admin).
Supabase Realtime Channels: Sottoscrizione live a league_announcements, market_trades e trade_messages con alert toast istantanei.



---

## 📌 3. Scadenza Consegna Formazioni, Countdown & Blocco Modifiche (Punti 7 e 7b)
- **Stato**: 🟢 Completato & Rilasciato in Produzione
- **Priorità**: Alta (Fondamentale per la regolarità delle partite e del calendario settimanale)
- **Moduli coinvolti**: src/pages/Tattica.tsx, Navbar.tsx (o banner home), Supabase (configurazione scadenze di lega)
Valutazione Fattibilità: 🟢 Pienamente Fattibile

### Descrizione
Ogni settimana c'è un termine perentorio per la consegna della formazione per le partite in programma.
Countdown UI (Punto 7):
Widget con conto alla rovescia (giorni, ore, minuti, secondi) mostrato in evidenza nella pagina Tattica e/o nella Navbar (es. "Scadenza Consegna Giornata X: Giovedì ore 20:00 - Tempo rimasto: 1g 4h 12m").
Data/ora di scadenza configurabile dall'Admin per ciascuna giornata di campionato (memorizzata in tabella league_settings o per giornata in an_schedule).
Blocco & Avviso Post-Scadenza (Punto 7b):
Una volta superato il momento limite (es. Mercoledì/Giovedì all'orario fissato):
Se un utente accede a Tattica.tsx, compare un banner di allerta giallo/arancione:

⚠️ Formazioni Chiuse per la Giornata in corso: La scadenza per la Giornata X è terminata. Qualsiasi modifica apportata adesso e salvata entrerà in vigore solo per la Giornata successiva (X+1) e non influenzerà la partita di questa settimana.

La formazione per la giornata in corso viene congelata nello snapshot ufficiale (vedi punto 5).



---

## 📌 4. Pagina "Foglio Commento" con Formazioni Ufficiali Pubbliche (Punto 8)
- **Stato**: 🟢 Completato & Rilasciato in Produzione
- **Priorità**: Alta (Strumento centrale per caster, commentatori, spettatori e manager)
- **Moduli coinvolti**: src/pages/FoglioCommento.tsx (/campionato/foglio-commento), src/services/foglioCommentoService.ts, Navbar.tsx (sottosezione Campionato)
- **Tabelle coinvolte**: an_schedule, league_deadlines, an_team_tactic, team_formation_history, VIEW_PLAYER_STATS, an_player, an_team
Specifiche Implementate
Collocazione & Navigazione:
Inserita come voce ufficiale nella sottosezione Campionato della Navbar (/campionato/foglio-commento e alias /foglio-commento).
Selettore Match Rapido & Confronto Affiancato:
Barra di selezione rapida in alto per navigare istantaneamente tra i 6 incontri della giornata.
Vista affiancata Casa vs Trasferta (grid-cols-2 su desktop):
Campetto Tattico 2D: 11 titolari posizionati con precisione secondo il modulo FC IQ (EA_FC25_FORMATIONS), visualizzando numero di maglia, OVR, cognome/nome e ruolo specifico. Come da richiesta, esclusi calci piazzati e indicazioni tattiche.
Panchina / Riserve: Elenco ordinato delle riserve a disposizione con numero maglia, ruolo, OVR, età e piede.
Ispezione Calciatore: Cliccando su qualsiasi titolare o panchinaro si apre la modale di dettaglio con tutti gli attributi.
Visibilità Protetta & Scadenza Formazioni:
Collegamento con league_deadlines: se la deadline per la giornata in corso non è ancora scaduta, le formazioni sono oscurate per i manager (🔒 Formazioni Riservate) con indicazione della data/ora di sblocco.
L'Admin dispone dell'accesso di anteprima con badge dedicato (🛡️ Anteprima Admin).
Per le giornate concluse o passate la visualizzazione è sempre sbloccata e pubblica per tutta la community.



---

## 📌 5. Archivio Storico delle Formazioni Salvate & Report Avversaria Homepage
- **Stato**: 🟢 Completato & Rilasciato in Produzione (Tabella creata su Supabase & Collegata)
- **Priorità**: Media-Alta (Essenziale per alimentare il Foglio Commento, il report scouting avversaria e lo storico stagionale)
- **Tabelle coinvolte**: Nuova tabella team_formation_history, an_team_tactic, VIEW_PLAYER_STATS
Valutazione Fattibilità: 🟢 Pienamente Implementato

### Descrizione
Creata la tabella team_formation_history su Supabase (supabase/migrations/20261023_team_formation_history.sql) con indici e RLS.
Ogni salvataggio effettuato da un manager in Tattica.tsx crea automaticamente un record di snapshot (formation, starters, bench_order, created_at, created_by).
Blocco Prossimo Incontro & Popup Scouting Avversaria nella Homepage:
Per i manager loggati, compare il blocco del prossimo turno con la squadra rivale, stadio, stato casa/trasferta e andamento recente.
Cliccando sul blocco si apre il popup modale con:
Ultime 3 Formazioni Inserite: con selettore e campo tattico 2D interattivo (EA_FC25_FORMATIONS), titolari e panchina (con fallback automatico sulle formazioni scese in campo nelle partite precedenti da VIEW_PLAYER_STATS).
Rosa Completa: ordinata per OVR con filtri per ruolo e anagrafica.
Andamento & Ultimi Incontri: con statistiche e badge forma (V, N, P).



---

## 📌 6. Sistema Giocatori Preferiti / Watchlist (Draft, Scouting & Free Agent)
- **Stato**: 🟢 Completato & Rilasciato in Produzione
- **Priorità**: Media-Alta (Miglioramento essenziale per l'usabilità durante il mercato e il draft)
- **Moduli coinvolti**: src/pages/Draft.tsx, src/pages/Scouting.tsx, src/pages/ListaGiocatori.tsx (Free Agent), Supabase
- **Tabelle coinvolte**: Tabella team_player_favorites
Valutazione Fattibilità: 🟢 Pienamente Implementato

### Descrizione
Permette a ciascun manager di contrassegnare rapidamente qualsiasi calciatore (Rookie al Draft, prospetto nella pagina Scouting, o Free Agent svincolato) con una stellina / segnalibro (⭐).
Integrazione Trasversale:
Pagina Scouting (/scouting): Il manager mentre spende token di scouting o analizza i report può cliccare sulla stellina per salvare il rookie tra i suoi preferiti.
Pagina Draft (/draft):
Nel tabellone o nella modale di selezione della scelta compare il filtro rapido "⭐ Solo Preferiti".
I rookie preferiti hanno un'evidenziazione visiva distinta (bordo dorato e badge stellina) per essere individuati all'istante senza dover scorrere decine di profili durante il proprio turno.
Lista Giocatori / Mercato Free Agent: Funziona identicamente per tenere d'occhio svincolati o talenti di altre squadre.
Architettura Tecnica:
Tabella Supabase: team_player_favorites(id, team_id, player_id, player_type, created_at) con vincolo univoco (team_id, player_id, player_type).
RLS per garantire che ciascun manager veda e modifichi solo la propria lista privata.



---

## 📌 7. Lista di Priorità Draft & Autopick per Manager Assenti
- **Stato**: 🟢 Completato & Rilasciato in Produzione
- **Priorità**: Alta (Risolve il problema critico dei blocchi del Draft Live dovuti all'assenza di un manager)
- **Moduli coinvolti**: src/pages/Scouting.tsx (tab graduatoria & autopick), src/pages/Draft.tsx (badge notifica & trigger emergenza), Supabase
- **Tabelle coinvolte**: Tabelle draft_team_wishlist, draft_autopick_settings, collegamento con team_player_favorites
Specifiche Implementate: 🟢 Rilasciate in Produzione

### Descrizione
Trasforma l'esperienza del Draft consentendo di comporre la propria Graduatoria Personale di Rookie.
Scheda Dedicata nello Scouting (/mia-squadra/scouting?tab=autopick):
Permette di ordinare i rookie preferiti dal Rank #1 in giù, con frecce Su/Giù e rimozione.
Pulsante rapido "⭐ Importa dai Preferiti": carica con un clic tutti i prospetti con la stella nella lista di priorità.
Ricerca e inserimento manuale di ulteriori rookie con filtri per ruolo.
Attivazione Autopick:
Manager: Toggle dedicato nella scheda Scouting ("Autopick per Assenza la sera del Draft").
Admin: Pulsante d'emergenza nella barra "ON THE CLOCK" della Draft Room per forzare l'esecuzione dell'autopick sulla squadra al turno corrente.
Draft Room (/draft):
Badge di notifica per la propria squadra (🤖 Autopick Attivo per [Team]) con link alla configurazione in Scouting.
Badge 🤖 Autopick Attivo nella barra in evidenza per la squadra On The Clock.
Esecuzione Selezione Automatica:
Il sistema scorre la graduatoria della squadra a partire dal Rank 1 e seleziona il primo rookie non ancora draftato.
Strategia di Fallback (Fallback A Approvato): Se tutti i rookie presenti nella graduatoria personale sono già stati chiamati da altre squadre nei turni precedenti (o se la lista è vuota), il sistema assegna in automatico il rookie rimasto disponibile con l'Overall (OVR) più alto.



---

## 📌 8. Gestione Tagli dei Giocatori nel Periodo di Calciomercato
- **Stato**: 🟢 Completato & Rilasciato in Produzione
- **Priorità**: Alta (Funzionalità fondamentale per la gestione della rosa e delle finestre di mercato)
- **Moduli coinvolti**: src/pages/Roster.tsx (/mia-squadra/roster), src/pages/admin/AdminAutomazioni.tsx (/admin/automazioni), src/services/cutsService.ts, Supabase
- **Tabelle coinvolte**: public.team_cuts_registry, public.an_player, public.as_player_market, public.an_team_tactic, public.league_announcements, public.league_automation_state
Specifiche Implementate & Architettura
Regola di Rosa (Opzione A approvata):
Ogni squadra al termine dei tagli deve avere minimo 13 e massimo 16 calciatori in rosa.
Formule dinamiche: min_cuts = max(0, N - 16) e max_cuts = max(0, N - 13). Tiene conto automaticamente dei ritiri a inizio stagione.
Interfaccia Manager (/mia-squadra/roster - Tab "Status di Mercato"):
Contatore essenziale: Badge Giocatori Tagliati: X, rosso quando la rosa post-tagli supera 16 giocatori, verde quando è conforme (13-16).
Filtro rapido: 6° tab "In Taglio" con contatore in tempo reale per consultare solo i giocatori designati al taglio.
Azione Taglio: Pulsante ✂️ Taglia / Annulla Taglio su ogni calciatore. Il sistema blocca/disabilita l'opzione di tagliare quando la squadra raggiunge la soglia minima di 13 giocatori. Il manager può modificare la propria selezione in ogni momento fino all'ufficializzazione.
Pannello Admin (/admin/automazioni - Card "Ufficializza Tagli di Lega"):
Opzione A: L'Admin visualizza esclusivamente l'elenco delle squadre inadempienti con il relativo totale dei giocatori tagliati da ciascuna.
Pulsante "Ufficializza Tagli" disabilitato finché tutte le squadre non sono in regola.
Quando tutte le 12 squadre sono in regola, compare il badge verde con il totale dei giocatori pronti per lo svincolo e il pulsante abilitato con modale di conferma.
Procedura Atomica SQL (execute_official_cuts):
Svincola i calciatori (an_player.Squadra = NULL, NumeroMaglia = NULL).
Rimuove i record da as_player_market.
Azzera i titolari e pulisce la panchina in an_team_tactic.
Genera il comunicato ufficiale di svincolo in bacheca (league_announcements).
Registra l'operazione in league_automation_state e svuota team_cuts_registry.



---

## 📌 9. Gestione Tattiche Avanzate nella Pagina Tattica (FC IQ EA Sports FC 25)
- **Stato**: 🟢 Completato & Rilasciato in Produzione
- **Priorità**: Media-Alta (Arricchimento profondo della componente manageriale e tattica in stile EA FC 25)
- **Moduli coinvolti**: src/pages/Tattica.tsx (/mia-squadra/tattica), src/pages/OpponentScout.tsx, eventuale Foglio Commento
- **Tabelle coinvolte**: an_team_tactic, team_formation_history
Descrizione
Espansione della pagina Tattica per andare oltre la semplice selezione del modulo e lo schieramento degli 11 titolari, consentendo ai manager di configurare l'intero assetto tattico della squadra (tattiche di squadra, istruzioni individuali e incarichi) in coerenza con le opzioni di simulazione EA Sports FC 25.
Requisiti & Specifiche da Implementare
Tattiche di Squadra (Team Tactics & Style):
Fase Difensiva:
Stile difensivo (es. Equilibrato, Pressing sul primo controllo, Pressing costante, Ripiegamento).
Ampiezza difensiva (slider 1-100 o preset) e Profondità della linea (linea alta, media, bassa).
Fase Offensiva:
Costruzione di manovra (es. Manovra veloce, Possesso palla, Lancio lungo, Equilibrato).
Creazione occasioni (es. Passaggi diretti, Inserimenti offensivi, Equilibrato).
Ampiezza offensiva e presenza in area sui cross e sui calci piazzati (corner e punizioni).
Istruzioni Individuali per Ruolo / Calciatore (Player Roles & Instructions):
Cliccando su un calciatore nel campo 2D, apertura di un pannello laterale o tab con istruzioni specifiche:
Portiere: Uscite sui cross (Prudente / Aggressivo), Ruolo portiere-libero.
Terzini (TD/TS): Tipo di attacco (Resta dietro in attacco, Equilibrato, Partecipa all'attacco), Tipo di corsa (Sovrapposizione, Invertito).
Difensori Centrali (DC): Intercettazioni (Normali, Aggressive), Posizione difensiva.
Centrocampisti (CDC/CC/COC): Copertura (Al centro, Sulle fasce), Supporto offensivo (Resta dietro, Avanza, Libero di svariare).
Esterni & Attaccanti (ED/ES/AD/AS/ATT): Tagli e movimenti (Taglia dentro, Resta largo, Inserisciti alle spalle), Supporto in difesa (Rientra, Resta in avanti).
Incarichi Partita (Set Pieces & Hierarchy):
Assegnazione formale dei ruoli chiave: Capitano (C), Vice-Capitano, Rigorista primario/secondario, Punizione corta, Punizione lunga, Calcio d'angolo sinistro, Calcio d'angolo destro.
Persistenza & Integrazione:
Salvataggio delle configurazioni avanzate nel record di an_team_tactic (come campo JSONB strutturato tactical_settings o colonne dedicate) e tracciamento negli snapshot di team_formation_history.
Visualizzazione dei preset tattici nel report avversaria (/prossimo-avversario) e nel futuro Foglio Commento per commentatori e spettatori.



---

## 📌 10. Automatizzazione Applica Invecchiamenti Calciatori & Gestione Ritiri
- **Stato**: 🟢 Completato & Rilasciato in Produzione
- **Priorità**: Alta (Procedura chiave di transizione tra stagioni sportive)
- **Moduli coinvolti**: src/pages/admin/AdminAutomazioni.tsx (/admin/automazioni), src/components/admin/AgingModal.tsx, src/services/playerAgingService.ts, bacheca comunicati (/comunicati), tabelle an_player, ea_player_db
- **Tabelle coinvolte**: an_player, ea_player_db, an_team_tactic, as_player_market, team_cuts_registry, league_announcements, league_automation_state
Descrizione
Procedura batch atomica eseguibile dal Super Admin per effettuare il passaggio d'anno/stagione sportiva su tutti i calciatori registrati nella Lega.
Funzionalità Implementate
Incremento Anagrafico & Allineamento EA FC 25:
Aumento anagrafico di 1 anno (Età = Età + 1) per tutti i 449 calciatori attivi (Squadra != 'RITIRATO' OR Squadra IS NULL).
Sfasamento date di nascita (DOB = DOB - 365 su an_player e birthdate = birthdate - 365 su ea_player_db) per mantenere la sincronizzazione anagrafica con il motore EA FC 25.
I calciatori già nello status RITIRATO rimangono invariati e non vengono invecchiati.
Matrice Ufficiale Decadimenti Fisico/Tecnici (11 Attributi):
Curve di decadimento fedeli alla matrice approvata:
Fascia Giovani & Prime (<= 30 anni): nessun decadimento (250 calciatori).
Transizioni 30 ➔ 31 e 31 ➔ 32: RIFP: -2, TUFP: -2, TSTA: 0, ACCL: -5, VELO: -5, RESI: -5, FRZA: -1, AGIL: -1, ELEV: -3, RIFL: -2, EQLB: -1.
Transizioni 32 ➔ 33 e 33 ➔ 34: RIFP: -3, TUFP: -3, TSTA: -1, ACCL: -8, VELO: -8, RESI: -10, FRZA: -3, AGIL: -2, ELEV: -5, RIFL: -4, EQLB: -2.
Regola di Salvaguardia (Floor Minimo): Nessun attributo scende al di sotto del valore minimo di 30 (applyDecay(val, delta)).
Ricalcolo Automatico OVR: Ricalcolo istantaneo del valore complessivo (OVR su an_player e overallrating su ea_player_db) basato sulle formule ponderate di ruolo ufficiali LCSIM (calcOverall).
Gestione Ritiri Ufficiali (34 ➔ 35 anni):
I calciatori che raggiungono o superano i 35 anni (29 calciatori) passano immediatamente allo status Squadra = 'RITIRATO' e NumeroMaglia = NULL in an_player.
In ea_player_db viene impostato isretiring = 1.
Rimozione automatica dei calciatori ritirati dalle formazioni attive in an_team_tactic (starters, panchina e calci piazzati) e svincolo da mercati pendenti.
Comunicato Ufficiale Automatico in Bacheca (league_announcements):
Pubblicazione automatica del comunicato ufficiale che include:
Elenco dei 29 calciatori ritirati con ruolo, OVR e squadra di appartenenza.
Elenco preventivo dei 40 veterani al loro ultimo anno di carriera (che hanno compiuto 34 anni ed entreranno nella loro ultima stagione prima del ritiro).
Riepilogo statistico delle curve applicate e dei calciatori coinvolti.
Interfaccia Interattiva (AgingModal) nel Centro Automazioni:
Card 2 in /admin/automazioni operativa con badge verde 🟢 Stagione & Ritiri • Operativo.
Modale a schede con: Matrice Regole parametrizzata, Anteprima Decadimenti filtrabile e ricercabile, Elenco Ritiri Ufficiali, Elenco Veterani Ultima Stagione, Anteprima live del comunicato e Step di conferma prima dell'esecuzione atomica.
Funzione RPC Postgres public.rpc_apply_player_aging atomica con rollback automatico in caso di errore e aggiornamento di league_automation_state.



---

## 📌 11. Automatizzazione Start / Stop Calciomercato
- **Stato**: 🟢 Completato & Rilasciato in Produzione (Interruttore e blocco scambi/trattative attivi)
- **Priorità**: Alta (Regolamentazione ufficiale delle sessioni di mercato)
- **Moduli coinvolti**: src/pages/admin/AdminAutomazioni.tsx, src/pages/Trattative.tsx, src/services/tradesService.ts, src/services/marketStateService.ts
- **Tabelle coinvolte**: league_automation_state (record market_toggle), market_trades
Descrizione
Interruttore globale controllato dal Super Admin nel Centro Automazioni di Lega per aprire o chiudere ufficialmente la finestra di mercato.
Funzionalità Implementate
Interruttore Pannello Admin:
Badge dinamico che diventa Rosso ("CHIUSO") quando il mercato è chiuso e Verde ("APERTO") quando è aperto.
Pulsanti "Chiudi Mercato di Lega" e "Apri Mercato di Lega" collegati direttamente a Supabase con aggiornamento istantaneo del timestamp e dell'autore.
Blocco Operazioni a Mercato Chiuso:
I manager non possono inviare nuove proposte di scambio (pulsante disabilitato e alert in Trattative.tsx e NewTradeModal.tsx).
I manager non possono accettare o rifiutare proposte in sospeso (pulsanti disabilitati e alert in TradeDetailsModal.tsx).
Guardie server/service a livello di tradesService.ts (createTrade, acceptTrade, rejectTrade) che rifiutano transazioni se il mercato è chiuso.
Banner informativo ben visibile in testata a /mia-squadra/trattative per comunicare la chiusura della sessione a tutti i manager.
Punti Futuri per Ulteriori Estensioni:
Possibilità di impostare data/ora di chiusura automatica con countdown per tutti gli utenti.
Eventuale blocco dei tagli calciatore in /mia-squadra/roster se previsto dal regolamento.



---

## 📌 12. Automatizzazione Blocca / Sblocca Rose & Blocco Formazioni Automatico
- **Stato**: 🟢 Completato & Rilasciato in Produzione
- **Priorità**: Media-Alta (Integrità delle rose e regolarità delle formazioni di campionato)
- **Moduli coinvolti**: src/pages/admin/AdminAutomazioni.tsx, src/services/rosterLockService.ts, src/pages/Roster.tsx, src/pages/Allenamenti.tsx, src/pages/Tattica.tsx, src/components/FormationCountdown.tsx
- **Tabelle coinvolte**: league_automation_state, league_deadlines, team_cuts_registry, an_player_training, an_team_tactic, team_lineup_snapshots
Specifiche Implementate
Blocco Rose (Roster Lock):
Controllato dall'Amministratore tramite toggle dedicato in /admin/automazioni ("Controllo Congelamento Rose").
Memorizzato nella tabella di sistema league_automation_state con sottoscrizione Realtime attiva (rosterLockService.ts).
Tagli Calciatori: impedisce ai manager in /mia-squadra/roster (scheda "Status di Mercato & Tagli") di aggiungere o rimuovere calciatori dalla lista tagli, disabilitando i pulsanti e visualizzando un banner informativo di blocco lega.
Allenamenti & Punti XP: impedisce ai manager in /mia-squadra/allenamenti di salvare nuovi piani di sviluppo o allocazioni XP finché le rose sono congelate, con banner e pulsanti di salvataggio disabilitati.
Blocco Formazioni Automatico (Lineup Deadline Lock):
Funziona in maniera completamente automatica ed indipendente dal blocco manuale delle rose.
Si attiva allo scadere della data/ora impostata per la giornata in league_deadlines (o in caso di chiusura forzata d'emergenza impostata dall'admin).
Mostra il countdown dinamico in tempo reale (FormationCountdown) direttamente in cima alla lavagna tattica (/mia-squadra/tattica).
A scadenza avvenuta, per tutti i manager non-admin vengono bloccati i salvataggi della formazione, il pulsante "Auto-Schiera Miglior 11" e lo svuotamento, con relativo banner di avviso.
L'utente Amministratore mantiene un Bypass Amministrativo protetto per poter inserire formazioni d'ufficio o correggere eventuali problemi tecnici, con badge visivo esplicito Admin Bypass.
All'atto del salvataggio in tattica, viene generato o aggiornato automaticamente lo snapshot immutabile di giornata in team_lineup_snapshots.



---

## 📌 13. Hub Amministrazione Automazioni, Export Master Table & Import Classe Rookie
- **Stato**: 🟢 Completato & Rilasciato in Produzione (Export autonomo & Procedura Import Rookie 2-File integrata)
- **Priorità**: Alta
- **Moduli coinvolti**: src/pages/admin/AdminAutomazioni.tsx (/admin/automazioni), src/components/admin/ImportRookieModal.tsx, src/services/rookieImportService.ts, src/services/eaPlayerDbService.ts
- **Tabelle coinvolte**: ea_player_db, an_rookie, an_player, league_automation_state
Descrizione & Architettura
Sezione riservata al Super Admin con blocchi separati per:

Export Master Table EA FC 25:
Generazione file completo DB_NEW.txt a 137 colonne (21.067 righe base EA FC 25 + calciatori e rookie LCSIM aggiornati in tempo reale).
Download opzionale del solo snippet calciatori LCSIM.
Importa Classe Rookie (Procedura a 2 File):
File 1 (Master Data): file con le 137 colonne EA FC 25 dei nuovi rookie, aggiunto alla master table (ea_player_db) senza sovrascrivere l'archivio esistente.
File 2 (Anagrafica): file a 4 colonne (ID, Nome, Cognome, Squadra), associato tramite l'ID al Master Data.
Destinazione Rookie: i dati decodificati vengono inseriti direttamente in public.an_rookie per popolare la lista dei rookie del Draft.



---

## 📌 14. Recap Calciomercato & Bisogni di Squadra a Macro-Categorie (Sezione Scambi)
- **Stato**: 🟢 Completato & Testato
- **Priorità**: Media-Alta (Miglioramento dell'interazione sul mercato tra società)
- **Moduli coinvolti**: src/pages/Trattative.tsx, src/pages/UfficialitaScambi.tsx, src/components/trades/TeamMarketNeedsCard.tsx, src/components/trades/LeagueMarketNeedsBoard.tsx, src/services/marketNeedsService.ts, src/types/marketNeeds.ts
- **Tabelle coinvolte**: public.team_market_needs (supabase/migrations/20261025_team_market_needs.sql)
Descrizione & Implementazione
Pannello Manager (TeamMarketNeedsCard in /mia-squadra/trattative):
Card interattiva posizionata in testata alla pagina trattative del manager per configurare e salvare in tempo reale i propri bisogni di mercato.
Toggle istantanei per le 8 Macro-Categorie Ufficiali:
Portieri (POR)
Terzini (TD, TS)
Difesa Interni (DC)
Mediani (CDC)
Centrocampisti (CC)
Esterni (ED, ES, AD, AS)
Trequartisti (COC)
Attaccanti (ATT, AT)
Gestione stato modifiche non salvate, pulsante ripristino, salvataggio atomico su Supabase e link rapido alla Bacheca di Lega.
Bacheca Pubblica Unificata (LeagueMarketNeedsBoard in /mercato/scambi):
Sezione /mercato/scambi ristrutturata a schede:
Tab 1 (Default / In Primo Piano): Bisogni di Squadra (12 Club) con panoramica interattiva delle 12 società, filtri rapidi per macro-categoria con contatori live di club interessati, ricerca testuale per squadra/ruolo e pulsante diretto "Proponi Scambio" (che pre-seleziona il destinatario in /mia-squadra/trattative).
Tab 2: Ufficialità & Storico Scambi con il feed degli scambi approvati e convalidati dalla Lega.
Database Supabase:
Creata tabella public.team_market_needs con vincolo di foreign key su an_team("TEAM_ID"), indici, RLS e inizializzazione automatica dei 12 club. Migrazione e rispettivo rollback archiviati in supabase/migrations/20261025_team_market_needs.sql e applicati con successo.



---

## 📌 15. Finestra "Lista Tratti" nello Scouting & Revisione Decodifica Maschere Bit
- **Stato**: 🟢 Completato (31/10/2026)
- **Priorità**: Media-Alta (Usabilità e fedeltà dei PlayStyles/Traits dei rookie)
- **Moduli coinvolti**: `src/pages/Scouting.tsx`, `src/utils/scoutingConfig.ts`, `src/components/player/playerDetails.tsx`, `src/pages/Draft.tsx`
- **Tabelle coinvolte**: `an_rookie`, `an_player`, `ea_player_db`
Descrizione & Implementazione
1. **Unificazione delle Sezioni Tratti**:
   - Eliminata la frammentazione a 4 box distinti ("Tratto 1", "Tratto 2", "Tratto Icona 1", "Tratto Icona 2") che separava artificialmente i campi `Trait1`/`Trait2` e `IconTrait1`/`IconTrait2`.
   - Strutturato il pannello in due sezioni a piena larghezza:
     - **Tratti Standard (PlayStyles)**: aggrega dinamicamente tutti i PlayStyles standard posseduti.
     - **Tratti Icona / PlayStyles+**: aggrega dinamicamente tutti i PlayStyles+ dorati posseduti.
2. **Layout a Badge / Pillole a Flusso (Opzione A)**:
   - I tratti aggregati vengono suddivisi per virgola e renderizzati singolarmente come pillole badge eleganti e ordinate.
   - Badge neutri/scuri con icona per i PlayStyles standard e badge dorati/ambra (`bg-amber-500/20 text-amber-500`) con stella per i PlayStyles+.
   - Messaggi di fallback discreti (*"Nessun tratto standard presente"*, *"Nessun tratto icona presente"*) in caso di assenza di tratti.
3. **Livelli di Sblocco Gettoni (Fascia 2G & 3G+)**:
   - A 2G: conteggio cumulativo corretto con `getRookieTraitsCount` (che ora suddivide le stringhe e conta accuratamente i singoli tratti reali posseduti).
   - A 3G e 5G (nonché per l'admin): sblocco integrale dei badge con i nomi esatti.
4. **Estensione a PlayerDetails & Draft Board**:
   - Layout a sezioni unificate esteso con coerenza grafica anche alla scheda del calciatore (`playerDetails.tsx`) e ai badge nella vista Draft board (`Draft.tsx`).



---

## 📌 16. Pulsante e Modale per il Cambio Password
- **Stato**: 🟡 In attesa di implementazione
- **Priorità**: Media (Sicurezza e autonomia degli account manager)
- **Moduli coinvolti**: Navbar.tsx (menu utente/squadra), src/context/AuthContext.tsx, modale dedicato ChangePasswordModal.tsx
- **Tabelle coinvolte**: Tabella utenti Supabase (auth.users o public.an_users / app_users)
Descrizione
Aggiunta di un'azione accessibile dal menu profilo/squadra nella Navbar (o in impostazioni squadra) per consentire a ciascun manager autenticato (e all'admin) di modificare in autonomia la propria password:

Campo per password attuale (verifica di sicurezza).
Campo per nuova password con conferma.
Hashing/aggiornamento sicuro su Supabase e feedback visivo immediato con toast di conferma.



---

## 📌 17. Spostamento Rookie in an_player & Gestione Archivio Storico Draft
- **Stato**: 🟢 Completato & Rilasciato in Produzione (Scelta integrata con de-crittografia atomica in an_player ed ea_player_db)
- **Priorità**: Alta (Ciclo completo di integrazione dei rookie nella Lega)
- **Moduli coinvolti**: src/pages/Draft.tsx, src/pages/Scouting.tsx, src/pages/admin/AdminAutomazioni.tsx
- **Tabelle coinvolte**: an_rookie, an_player, an_draft_board, eventuale colonna stagione in an_rookie o tabella archivio
Descrizione
La tabella an_player è il registro ufficiale e centralizzato da cui dipendono tutte le rose, i moduli tattici e l'export del master file.

Durante il Draft (Scelta Effettuata): Quando una squadra seleziona un rookie, il record deve essere spostato/inserito in public.an_player con Squadra = pickingTeamId, comparendo istantaneamente nella Rosa della squadra.
Chiusura Automatica a Fine Draft: Non appena viene effettuata l'ultima scelta del Draft (scelta #60 al termine del Round 5), tutti i rookie rimanenti non draftati vengono automaticamente trasferiti nella tabella public.an_player come svincolati (Squadra = NULL).
Archivio & Storico Draft: Per non perdere lo storico delle scelte e dei dati di scouting tra stagioni diverse, valutazione congiunta della soluzione migliore:
Opzione A: Aggiungere la colonna stagione a public.an_rookie (lo scouting mostrerà solo i rookie della stagione attiva, ma l'archivio storico rimarrà intatto e consultabile per gli anni passati).
Opzione B: Creazione di una tabella archivio an_rookie_history / an_draft_history.



---

## 📌 18. Match Center & Tabellino Partita Avanzato (SofaScore / Diretta.it Style)
- **Stato**: 🟡 Da Progettare / In Backlog
- **Priorità**: Bassa (Coinvolgimento visivo e analisi approfondita dei match)
- **Moduli coinvolti**: src/pages/Calendario.tsx, eventuale nuova pagina o modale /partita/:id
- **Tabelle coinvolte**: view_team_stats, VIEW_PLAYER_STATS, "AS_TEAM_STAT", "AS_PLAYER_STAT"
Descrizione
Evoluzione della schermata di dettaglio partita per trasformarla in un vero e proprio Match Center moderno:

Barre Statistiche Comparative:
Confronto visivo a barre percentuali affiancate Casa vs Trasferta: Possesso palla %, Tiri totali / in porta, Contrasti vinti %, Precisione passaggi %, Dribbling riusciti, Calci d'angolo, Falli e Fuorigioco.
Timeline & Tabellino Eventi:
Cronologia verticale con marcatori, assistman, cartellini gialli/rossi con minutaggio indicativo.
Migliore in Campo (MVP):
Elezione automatica del migliore in campo della partita basato sul rating/voto più alto di giornata con badge dorato e statistiche chiave dell'incontro.



---

## 📌 19. Squadra della Settimana (Top 11 / TOTW) & Premi Speciali
- **Stato**: 🟡 Da Progettare / In Backlog
- **Priorità**: Bassa (Coinvolgimento community e riconoscimento performance manageriali)
- **Moduli coinvolti**: src/pages/Statistiche.tsx, widget dedicato in Homepage
- **Tabelle coinvolte**: VIEW_PLAYER_STATS, an_player, an_team
Descrizione
Top 11 di Giornata (Team of the Week):
Al termine di ogni giornata disputata, generazione automatica di un campo tattico 2D con la formazione ideale del turno: il portiere con voto/parate più alte, i 3 o 4 migliori difensori, i migliori centrocampisti e i migliori attaccanti.
Badge celebrativo TOTW temporaneo o storico per i calciatori selezionati.
Classifiche Premi Stagionali Speciali:
🧤 Golden Glove: Classifica dei portieri con il maggior numero di Clean Sheet (partite a rete inviolata).
🎯 Re degli Assist: Classifica dedicata ai rifinitori della Lega.
⭐ Miglior Rating Medio: Top 10 assoluta per media voto (con soglia minima presenze es. 50% delle partite).



---

## 📌 20. Sala Stampa & Interviste Presidenti (Domande AI & Risposte Ufficiali)
- **Stato**: 🟢 Completato & Rilasciato in Produzione (Pagina dedicata unificata /sala-stampa & DB Supabase)
- **Priorità**: Media-Alta (Roleplay manageriale ed elemento social immersivo della Lega)
- **Moduli coinvolti**: src/pages/SalaStampa.tsx, src/services/aiJournalistService.ts, src/components/home/PressAndRumorsHomeCard.tsx, src/pages/admin/AdminAutomazioni.tsx
- **Tabelle coinvolte**: press_conferences, an_team, an_standings, an_schedule
Migrazione SQL: supabase/migrations/20261025_press_and_ai_rumors.sql
Descrizione & Risoluzione Tecnica
Domande Differenziate per Club: Ad ogni nuovo turno di campionato, il Giornalista AI genera domande uniche e su misura per ciascuno dei 12 presidenti/allenatori (variando temi: tattica, psicologia, scontro diretto, gestione dei leader, mercato, turnover).
Visibilità Esclusiva Interviste Risposte: Nella bacheca pubblica vengono mostrate soltanto le interviste a cui il presidente ha effettivamente risposto, garantendo pulizia e valore editoriale.
Microfono Aperto: Il manager autenticato la cui squadra ha una domanda pendente visualizza un box interattivo prioritario in cima alla pagina per rilasciare la dichiarazione ufficiale della società.



---

## 📌 21. Giornalista AI di Lega: Gossip & Rumor di Calciomercato (Always-On con Calciatori Reali)
- **Stato**: 🟢 Completato & Rilasciato in Produzione (Feed spontaneo, Reazioni Realtime & Zero Spoiler)
- **Priorità**: Media-Alta (Dinamismo dell'ecosistema, gossip e intrattenimento sportivo)
Tecnologie & Provider: Motore ibrido: Google Gemini Flash (memorizzato in league_automation_state e .env.local) con generatore procedurale avanzato always-on (zero crash/downtime)
- **Moduli coinvolti**: src/pages/SalaStampa.tsx, src/services/aiJournalistService.ts, src/pages/UfficialitaScambi.tsx, src/components/home/PressAndRumorsHomeCard.tsx, src/pages/admin/AdminAutomazioni.tsx
- **Tabelle coinvolte**: league_market_rumors, an_player, market_trades, team_market_needs, league_automation_state
Migrazione SQL: supabase/migrations/20261025_press_and_ai_rumors.sql
Descrizione & Risoluzione Tecnica
Generazione Spontanea durante la Giornata: Rimossi i pulsanti manuali "a comando". Quando il mercato è aperto, i rumor emergono spontaneamente in background a intervalli temporali regolari durante la giornata.
Inclusione di Calciatori Reali di Serie A: Le notizie pescano ed integrano nomi e cognomi reali dei calciatori sotto contratto (an_player), ruoli e squadre di appartenenza (es. Dave Lancaster, Francesco Ambrosio, Manuel Perdomo, Lars Svensson, ecc.).
Zero Spoiler & Badge Giornalistici Autentici: Rimossi filtri di categoria ed etichette rivelatrici (Fake News / Trattativa Distorta). Ogni indiscrezione si presenta con veste verosimile ("ESCLUSIVA", "INDISCREZIONE", "RETROSCENA", "RADAR MERCATO", "ULTIM'ORA"), lasciando ai manager il gusto del dibattito.
Reazioni Live: I manager possono reagire istantaneamente ad ogni scoop con emoji (🔥 Fuoco, 😂 Fake, 😱 Shock, 🤔 Dubbio).



---

## 📌 22. Crittografia Zero-Knowledge Classe Rookie (AES-256) & Blind Database
- **Stato**: 🟢 Completato & Rilasciato in Produzione
- **Priorità**: Massima (Fair-play, trasparenza sportiva e protezione dati contro leakage da DB)
- **Moduli coinvolti**: src/components/admin/ImportRookieModal.tsx, src/services/rookieImportService.ts, src/pages/Scouting.tsx, src/pages/Draft.tsx, src/services/draftWishlistService.ts, src/pages/ConfrontoGiocatori.tsx
- **Tabelle & Funzioni coinvolte**: an_rookie, internal_vault.rookie_key, rpc_import_encrypted_rookies, rpc_get_scouted_rookies, rpc_draft_rookie, rpc_undo_draft_rookie
Migrazione SQL: supabase/migrations/20261024_rookie_encryption.sql e rispettivo rollback
Descrizione & Risoluzione Tecnica
Blind Database: Tutti i campi sensibili (OVR, POTN, Role1, Role2, Role3, Tratti, Emotion e tutti i 35 attributi fisici/tecnici) nella tabella public.an_rookie sono rigorosamente NULL. Qualsiasi utente o sviluppatore con accesso diretto al Table Editor di Supabase vede solo NULL e il blob binario crittografato encrypted_data.
Passphrase Admin: La passphrase segreta viene impostata dall'Admin neutrale della Lega nel modale di importazione in /admin/automazioni.
Disclosure Selettiva nello Scouting: La funzione rpc_get_scouted_rookies decifra in memoria i dati sul server PostgreSQL ed espone unicamente i dati autorizzati in base ai gettoni spesi dalla squadra chiamante (0G: solo anagrafica; 1G: range di 10; 2G: range di 3 + conteggio tratti + emotion; 3G: nomi tratti completi + ruoli tattici + piede debole/mabi; 5G: tutto sbloccato esatto).
Protezione Network DevTools: Le rappresentazioni dei range inviano al client valori punto medio del range, impedendo a chiunque di estrapolare il valore reale dal tab Network di Chrome.
Integrazione Draft: Quando un rookie viene scelto (rpc_draft_rookie), le sue statistiche vengono decifrate e scritte in public.an_player (entrando nella rosa della squadra) e in public.ea_player_db. In an_rookie i dati continuano a rimanere perennemente cifrati.



---

## 📌 23. Calcolo Stelle per Rookie (Formula Ufficiale a Percentili di Ruolo)
- **Stato**: 🟢 Completato & Testato (Implementato nell'Importazione Rookie & Allineato a DB)
- **Priorità**: Media-Alta
- **Moduli coinvolti**: src/services/rookieImportService.ts, src/components/admin/ImportRookieModal.tsx, src/pages/Scouting.tsx, src/pages/Draft.tsx
- **Tabelle coinvolte**: an_rookie, an_player, an_team
Descrizione & Regole Ufficiali
Le stelle dei rookie (da 1 a 5 ⭐), impiegate per oscurare l'overall esatto ai manager prima dello scouting (Blind Database), vengono calcolate in base al rank del loro Overall rispetto alla distribuzione degli Overall dei calciatori sotto contratto all'inizio dell'offseason (Serie A attiva), raggruppati per posizione in campo (Posiz):

1 Stella (⭐): Se l'overall del rookie è strettamente peggiore di tutti quanti i giocatori sotto contratto nel suo ruolo ($OVR < \min$).
2 Stelle (⭐⭐): Se il rookie si posiziona tra il 75° ed il 100° percentile dal top dei giocatori sotto contratto nel suo ruolo.
3 Stelle (⭐⭐⭐): Se il rookie si posiziona tra il 50° ed il 75° percentile dal top dei giocatori sotto contratto nel suo ruolo.
4 Stelle (⭐⭐⭐⭐): Se il rookie si posiziona tra il 25° ed il 50° percentile dal top dei giocatori sotto contratto nel suo ruolo.
5 Stelle (⭐⭐⭐⭐⭐): Se il rookie si posiziona tra il 1° ed il 25° percentile dal top dei giocatori sotto contratto nel suo ruolo (top tier).

[!NOTE] Il calcolo valuta la posizione effettiva dell'overall del rookie come rank all'interno della graduatoria ordinata in modo decrescente (quanti giocatori nel ruolo sono strettamente migliori $+ 1$, rapportato a $N$ giocatori), non come scostamento numerico lineare tra massimo e minimo. Ruoli EA speciali come 'AT' vengono mappati su 'ATT'.
Implementazione Architetturale
fetchContractedPlayersRankings(): Funzione asincrona in src/services/rookieImportService.ts che interroga Supabase (an_player per squadre attive in an_team con OVR non nullo) e genera la mappa decrescente degli OVR per ruolo.
calculateStelle(ovr, posiz, rankings): Algoritmo che applica le 5 fasce di percentile con fallback sui range statici qualora i ranking di ruolo non siano disponibili.
Integrazione Import Modal (ImportRookieModal.tsx): L'analisi dei file e la preview import caricano dinamicamente i ranking aggiornati prima di generare l'anteprima e cifrare i dati.
Allineamento DB: I record già censiti in an_rookie (es. Tiago Teixeira, ATT OVR 71, con $\min(\text{ATT}) = 74$) sono stati aggiornati a 1 ⭐.



---

## 📌 24. Calcolo XP Giocatori (Punti Esperienza Settimanali / Stagionali)
- **Stato**: 🟢 Completato & Testato (Formula ufficiale implementata, Service & Report UI in Allenamenti e Dettaglio Calciatore)
- **Priorità**: Alta
- **Moduli coinvolti**: src/services/playerXpService.ts, src/pages/Allenamenti.tsx (SeasonalXpReportModal.tsx), src/components/player/playerDetails.tsx (PlayerXpBreakdownModal.tsx)
- **Tabelle coinvolte**: "AS_PLAYER_STAT", an_player, an_schedule
Formula Ufficiale Implementata
La formula aggrega per ciascun calciatore i punti XP maturati in ogni singola giornata disputata:

XP Minuti in campo (singola partita):
Se il calciatore non è entrato in campo (0 minuti): 0 XP.
Altrimenti: 1 XP ogni 20 minuti giocati (arrotondato per eccesso all'unità), fino a un massimo di 5 XP (es. 1-20 min $\to$ 1 XP; 21-40 min $\to$ 2 XP; 41-60 min $\to$ 3 XP; 61-80 min $\to$ 4 XP; 81+ min $\to$ 5 XP).
XP dal Voto (singola partita):
Se il calciatore non ha ricevuto voto (S.V. o assente): 2 XP.
Altrimenti: $\lfloor (\text{Voto} - 3) \times 2 \rfloor$ (arrotondato per difetto all'unità).
Totale Singola Partita:
$\text{XP}{\text{partita}} = \text{XP}{\text{minuti}} + \text{XP}_{\text{voto}}$ (sempre numero intero).
Aggregazione Stagionale (Regular Season vs Playoff):
Regular Season: somma di tutte le partite disputate (11 giornate nella Lega a 12 squadre della Stagione 11; 9 giornate per la Lega a 10 squadre delle Stagioni $\le$ 10).
Playoff: si considerano solamente le migliori prestazioni per ovviare al diverso numero di incontri tra le squadre:
Dalla Stagione 11 (12 squadre): top 3 migliori match di playoff.
Fino alla Stagione 10 (10 squadre): top 2 migliori match di playoff.
Bonus Crescita Giovani (24 e 25 anni):
Ai calciatori che all'atto della stagione hanno 24 o 25 anni viene applicato un moltiplicatore di $\times 1.1$ (+10%), simulando la crescita aumentata dei giovani.
Moltiplicatore Generale di Lega & Target Pool:
Calibrato per garantire uniformità e comparabilità statistica tra stagioni diverse a prescindere da variazioni di gameplay:
Target storico per Lega a 10 squadre $\times$ 21 giocatori: circa 20.000 XP.
Target per la nuova Lega a 12 squadre $\times$ 21 giocatori: circa 24.000 XP.
$\text{XP}{\text{finali}} = \text{round}(\text{XP}{\text{giovane}} \times \text{MoltiplicatoreStagionale})$.
Componenti & Interfaccia
src/services/playerXpService.ts: motore di calcolo puro con supporto per formati dinamici per stagione, fetch delle statistiche da AS_PLAYER_STAT e riepiloghi di squadra/lega.
SeasonalXpReportModal.tsx in Allenamenti (/mia-squadra/allenamenti): dashboard analitica con statistiche di squadra (totale XP, media, top earner, bonus giovani), tabella rosa filtrabile per ruolo/nome ed espansione a fisarmonica con il referto partita per partita (minuti, voto, XP parziali, badge per match inclusi o scartati nei playoff).
PlayerXpBreakdownModal.tsx in Dettaglio Calciatore (playerDetails.tsx): pill interattiva XP: {valore} nell'intestazione della scheda calciatore che apre il popup dedicato con la timeline stagionale delle sue prestazioni.



---

## 📌 25. Calcolo Peggioramenti Giocatori (In-Season / Prestazionali)
- **Stato**: 🟡 In attesa di definizione & implementazione
- **Priorità**: Media-Alta
- **Moduli coinvolti**: Gestione Rose, Allenamenti, Automazioni Admin
- **Tabelle coinvolte**: an_player, ea_player_db, an_player_training
Descrizione
Meccanica di decadimento/peggioramento dinamico degli attributi nel corso dell'anno (distinta dall'invecchiamento anagrafico di fine stagione):

Criteri di calo prestazionale legati a scarso impiego (mancate convocazioni, scarso minutaggio prolungato), infortuni o rendimento gravemente insufficiente per fasce over 30.
Definizione della soglia minima di salvaguardia e modalità di applicazione (manuale via Admin o calcolata a milestone).



---

## 📌 26. Curva di Crescita ed Esperienza del Calciatore (Popup Dettaglio Giocatore)
- **Stato**: 🟢 Completato (Assorbito dal Punto #24: pill XP e PlayerXpBreakdownModal con timeline stagionale nel popup giocatore)
- **Priorità**: Media
- **Moduli coinvolti**: Modale dettaglio calciatore (src/components/player/PlayerDetailModal.tsx o componenti correlati in Rose/Scouting)
- **Tabelle coinvolte**: an_player, an_player_training, storico XP
Descrizione
Visualizzazione grafica intuitiva (grafico temporale o progression bar multi-stadio) della curva di crescita del calciatore:

Mostrare all'interno del popup di dettaglio l'evoluzione dell'esperienza (XP attuali, XP necessari per il prossimo step di OVR/attributo).
Visualizzazione della curva di potenziale e trend di sviluppo teorico in base all'età del giocatore.



---

## 📌 27. Inserimento Partite Manuale da Interfaccia Web & Export CSV
- **Stato**: 🟢 Completato & Integrato in Amministrazione (`MatchResultsManagerModal.tsx` in `/admin/automazioni`)
- **Priorità**: Alta
- **Moduli coinvolti**: Area Amministrazione Partite (`src/pages/admin/AdminAutomazioni.tsx`, `src/components/admin/MatchResultsManagerModal.tsx`, `src/services/matchStatsImportService.ts`)
- **Tabelle coinvolte**: `an_schedule`, `"AS_TEAM_STAT"`, `"AS_PLAYER_STAT"`, `an_standings`
Descrizione
Interfaccia web dedicata per l'inserimento manuale dei dati e dei referti delle partite:

Possibilità per l'Admin di compilare direttamente da form web il tabellino partita (risultato, statistiche squadra, voti, gol, cartellini e dettagli individuali).
Tasto dedicato "Export CSV" in grado di esportare i match inseriti o l'intera giornata in un formato CSV standard predefinito (compatibile sia con il parser di importazione sia con gli archivi storici).



---

## 📌 28. Unificazione & Perfezionamento Sezione Allenamenti (Ruoli, Ruoli+ e Tratti Ufficiali)
- **Stato**: 🟢 Completato & Testato
- **Priorità**: Alta
- **Moduli coinvolti**: src/pages/Allenamenti.tsx, src/components/training/UnifiedRoleAndTraitSystem.tsx, src/types/training.ts
- **Tabelle coinvolte**: an_player_training, an_player, ea_player_db
- **Migrazioni**: supabase/migrations/20261024_sync_training_specializations.sql
Specifiche Implementate
Unificazione UI e Architettura Bozza (Zero scritture premature su an_player e ea_player_db):
Riscrittura completa della logica: eliminata qualsiasi modifica diretta su an_player durante la fase di composizione dell'allenamento.
Bozza memorizzata in React state e salvata atomicamente in public.an_player_training come semplice bozza utente (status = 'draft').
Isolamento Master Data EA FC 25: la tabella master public.ea_player_db NON viene modificata durante i salvataggi di bozza dell'utente. La funzione di sincronizzazione recompute_ea_player_from_an_and_training proietta gli aumenti e le specializzazioni su ea_player_db esclusivamente quando l'allenamento viene confermato/approvato dall'Amministratore (status = 'confirmed').
Il pulsante "Reset ai Valori Originali" rimuove la bozza da an_player_training e ripristina la visualizzazione pulita senza corrompere la scheda base.
Schede unificate da 3 a 2: Scheda 1 "Gruppi Attributi" e Scheda 2 "Ruoli & Tratti Speciali" (UnifiedRoleAndTraitSystem.tsx).
Ruolo Principale & Ruoli+ Ufficiali (44 Ruoli da FC 25):
Cambio Ruolo Principale: 40 XP (include la scelta del 1° Ruolo+ della nuova posizione).
1° Ruolo+: Gratuito se assente nella scheda di base.
2° Ruolo+: 100 XP (massimo 2 Ruoli+ totali).
Swap Ruolo+: 60 XP per scambiare un ruolo tattico con un altro compatibile.
Upgrade a Ruolo++: 100 XP riservato a calciatori con $\ge 84$ OVR stimato (massimo 1 Ruolo++ per giocatore).
Tratti & Stili di Gioco (36 Tratti Ufficiali con Requisiti Dinamici):
Tratto Argento: 60 XP per l'acquisto; 40 XP per l'eliminazione di un tratto pre-esistente dalla scheda base.
Tratto Oro (PlayStyle+):
Gratuito al raggiungimento di $\ge 84$ OVR per il 1° sblocco (promozione automatica a Oro con 1 solo tratto posseduto; selezione gratuita a scelta con 2 o più tratti; promozione automatica del 1° tratto acquistato se ne ha 0).
70 XP per scambiare lo status Oro tra due tratti quando uno è già presente (lo status Oro si sposta al nuovo e il precedente torna Argento).
Massimo 5 tratti totali per giocatore, massimo 1 Tratto Oro.
Verifica dinamica dei requisiti minimi in tempo reale calcolata su postStats, consentendo di sbloccare tratti nel momento esatto in cui vengono potenziati gli attributi collegati.



---

## 📌 29. Ottimizzazione Barra Superiore (Navbar Sticky, Rimozione Layout Shift & Dropdown Non-Modal)
- **Stato**: 🟢 Completato & Testato
- **Priorità**: Alta
- **Moduli coinvolti**: src/components/Navbar.tsx, src/components/NotificationsMenu.tsx, src/components/ui/dropdown-menu.tsx, src/index.css
Descrizione & Risoluzione Bug
Rimozione Scostamento Orizzontale (UI Shift / Jitter):
I menu a discesa Radix UI (DropdownMenu) usavano il default modal={true}, scatenando la rimozione della scrollbar e l'iniezione di margini sul body calcolati da react-remove-scroll (causando il salto a sinistra di 17px).
Impostato modal={false} come default per tutti i dropdown in dropdown-menu.tsx e applicato esplicitamente su tutti i menu della Navbar e NotificationsMenu.
In index.css aggiunto scrollbar-gutter: stable e azzerato --removed-body-scroll-bar-size e padding/margin sul body bloccato.
Permanenza Barra Superiore allo Scrolling (Top Bar Permanentemente Visibile):
Quando l'utente era sceso con lo scroll e cliccava sulla barra superiore, il precedente scroll lock modale applicava overflow: hidden a livello di body, rompendo la proprietà CSS position: sticky del container <nav> e provocando la scomparsa della barra (rimasta ancorata a Y=0 fuori dal viewport) e il congelamento dello scroll.
Con la navigazione non-modale e <nav className="sticky top-0 z-50 w-full ...">, la barra superiore rimane permanentemente visibile, ancorata in cima durante qualsiasi livello di scorrimento, e l'interazione con i menu non blocca mai lo scorrimento della pagina.



---

## 📌 30. Sconto su Cambio Ruolo per Calciatori con Presenze da Titolari
- **Stato**: 🟡 In attesa di definizione & implementazione
- **Priorità**: Media-Alta (Valorizzazione dell'esperienza in campo e continuità tattica)
- **Moduli coinvolti**: src/pages/Allenamenti.tsx, src/services/playerXpService.ts, an_player_training
- **Tabelle coinvolte**: "AS_PLAYER_STAT", an_player_training, an_player
Descrizione
Meccanica nella sezione Allenamenti (/mia-squadra/allenamenti) che premia la continuità di impiego dei calciatori:

Se un calciatore ha disputato almeno $X$ partite da titolare (con minutaggio $\ge 60'$ o titolare da distinta) nel corso della stagione, il costo XP per il Cambio di Ruolo Principale (attualmente standard a 40 XP) viene ridotto o azzerato.
Definizione della soglia minima di match (es. 5 o 7 partite) e calcolo dinamico dello sconto all'apertura della scheda di allenamento.



---

## 📌 31. Ridenominazione File di Export Master DB in players.txt
- **Stato**: 🟢 Completato
- **Priorità**: Media (Allineamento con standard di importazione EA FC 25)
- **Moduli coinvolti**: src/pages/admin/AdminAutomazioni.tsx, src/services/eaPlayerDbService.ts
- **Tabelle coinvolte**: ea_player_db, an_player, an_rookie
Descrizione
Nella card dell'Hub Automazioni Admin dedicata all'Export Master Table EA FC 25, il download del file tabellare a 137 colonne (attualmente salvato come DB_NEW.txt) deve essere ridenominato ufficialmente in players.txt:

Garantisce l'immediata compatibilità "drag & drop" con i tool e gli editor interni di EA Sports FC 25 senza richiedere rinomine manuali da parte dell'Admin.



---

## 📌 32. Logica Scelte Compensatorie al Draft
- **Stato**: 🟢 Completato & Testato (Automazione SQL atomica in `execute_official_cuts`, bilanciamento asset in Roster e recap Admin Draft)
- **Priorità**: Media-Alta (Equità sportiva e bilanciamento rose)
- **Moduli coinvolti**: `src/pages/Draft.tsx`, `src/pages/Roster.tsx`, `src/services/cutsService.ts`, `src/pages/admin/AdminAutomazioni.tsx`
- **Tabelle & Funzioni coinvolte**: `public.an_draft_board`, `public.execute_official_cuts`, `public.rpc_ensure_draft_board`
- **Migrazioni**: `supabase/migrations/20261031_compensatory_draft_picks.sql` e rollback `20261031_compensatory_draft_picks_rollback.sql`
Descrizione & Regolamento Ufficiale
Integrazione e regolamentazione automatica delle scelte compensatorie nel tabellone del Draft in base alla dimensione finale della rosa post-tagli:

- **Matrice di Assegnazione Ufficiale**:
  - **16 giocatori in rosa**: 5 scelte standard (0 compensatorie).
  - **15 giocatori in rosa**: 5 scelte standard + **1 scelta compensatoria aggiuntiva al termine del Round 4**.
  - **14 giocatori in rosa**: 5 scelte standard + **2 scelte compensatorie aggiuntive (una al termine del Round 3 e una del Round 4)**.
  - **13 giocatori in rosa**: 5 scelte standard + **3 scelte compensatorie aggiuntive (una al termine del Round 2, una del Round 3 ed una del Round 4)**.
- **Inserimento Automatico & Ordinamento nel Draft**:
  - Le scelte compensatorie vengono create ed inserite automaticamente in `an_draft_board` al momento in cui l'Admin clicca su *"Ufficializza Tagli di Lega"* in Amministrazione (`execute_official_cuts`).
  - L'ordine tra le squadre beneficiarie nello stesso round segue fedelmente l'ordine base del Round 1 per garantire assoluta equità.
  - La numerazione `pick_overall` viene ricalcolata in modo atomico e sequenziale (1..60+), preservando l'avanzamento naturale del turno *"On The Clock"* e dell'Autopick.
- **Bilanciamento Asset in Roster (`Roster.tsx`)**:
  - Il badge degli asset post-tagli (`Asset: X/21`) bilancia dinamicamente le scelte compensatorie attese: ad esempio, per una squadra che taglia fino a 15 giocatori, il conteggio proietta `15 giocatori + 6 pick = 21/21 Asset`.
- **Visualizzazione nella Draft Board (`Draft.tsx`)**:
  - Nella casella della scelta compare il badge visivo dorato/ambra `⚖️ COMP` con tooltip recante la motivazione specifica.
  - Nel tabellone generale a 60+ caselle, le scelte compensatorie vengono posizionate in una fila dedicata in calce al rispettivo Round.
  - Aggiunto un tab dedicato *"Scelte Compensatorie"* nel modale Admin della Draft Board riservato al Super Admin per monitorare lo stato di tutte le scelte generate.

---

## 📌 33. Tagli di Calciomercato su Numero Totale di Asset (Calciatori + Scelte Draft)
- **Stato**: 🟢 Completato & Testato (Migrazione SQL RPC, Service, Badge Rosa & Dashboard Admin)
- **Priorità**: Alta (Evoluzione strategica del calciomercato e del roster management)
- **Moduli coinvolti**: src/pages/Roster.tsx, src/services/cutsService.ts, src/pages/admin/AdminAutomazioni.tsx
- **Tabelle & Funzioni coinvolte**: team_cuts_registry, an_player, an_draft_board, execute_official_cuts
- **Migrazioni**: supabase/migrations/20261026_cuts_total_assets.sql e rollback 20261026_cuts_total_assets_rollback.sql
Regole Approvate
Dopo i tagli ogni squadra deve rispettare contemporaneamente:

Rosa tra 13 e 16 giocatori (vincolo precedente mantenuto).
Totale Asset ≤ 21, dove $\text{Totale Asset} = \text{Giocatori in Rosa} + \text{Scelte Draft non ancora utilizzate}$ (pick con rookie_id e player_id nulli).
Almeno 2 portieri (Punto #41).

Tagli minimi e massimi: $\text{minCuts} = \max(0,\ N-16,\ N+P-21)$, $\text{maxCuts} = \max(0,\ N-13)$.
Specifiche Implementate
Servizio (cutsService.ts): costanti CUTS_MIN_ROSTER, CUTS_MAX_ROSTER, CUTS_MAX_ASSETS, CUTS_MIN_GK; nuova getTeamAvailablePicksCount; TeamCutCompliance esteso con picksCount, postAssets e assetReason; getCutsComplianceReport include il vincolo asset.
Rosa (Roster.tsx, tab Status di Mercato): badge unico "Asset: X/21 (Y giocatori + Z pick)", verde se in regola e rosso altrimenti, con tooltip che spiega la regola e i tagli minimi/massimi.
Pannello Admin (AdminAutomazioni.tsx): parametri aggiornati e motivo esplicito per le squadre inadempienti ("Asset oltre il limite: 22/21 (17 giocatori + 5 pick)").
PostgreSQL (execute_official_cuts): conteggio delle pick libere per club e blocco dell'ufficializzazione se v_post_assets > 21.



---

## 📌 34. Visualizzazione Magliette Ufficiali nella Pagina Rosa
- **Stato**: 🟡 In attesa di implementazione
- **Priorità**: Media (Arricchimento estetico e immersione grafica del club)
- **Moduli coinvolti**: src/pages/Roster.tsx (/mia-squadra/roster), src/pages/Squadre.tsx, componenti profilo calciatore
Tabelle & Asset coinvolti: Cartella /images/teams/ o /images/jerseys/, colonna NumeroMaglia in an_player
Descrizione
Introduzione della grafica delle magliette di gioco nella scheda dei calciatori:

Mostrare accanto all'avatar del volto (o come badge grafico dedicato) la maglietta ufficiale del club (divisa Home/Away) con il numero di maglia effettivo impresso sopra.
Migliora l'impatto visivo della rosa e consente un colpo d'occhio immediato sulla numerazione assegnata ai giocatori.



---

## 📌 35. Invecchiamento Solo Anagrafico per Calciatori Ritirati (Senza Decadimenti Statistiche)
- **Stato**: 🟢 Completato & Testato (Migrazione SQL & RPC aggiornata)
- **Priorità**: Alta (Integrità storica dei dati delle vecchie glorie)
- **Moduli coinvolti**: src/services/playerAgingService.ts, src/components/admin/AgingModal.tsx, funzione SQL Postgres rpc_apply_player_aging
- **Tabelle coinvolte**: public.an_player, public.ea_player_db
- **Migrazioni**: supabase/migrations/20261025_player_aging_retired.sql e rollback 20261025_player_aging_retired_rollback.sql
Descrizione & Risoluzione Tecnica
Aggiornamento Procedura Batch (rpc_apply_player_aging):
Nella funzione RPC su Supabase, il passaggio stagionale è stato scorporato in due step chiari:
Calciatori Attivi: incremento anagrafico ("Età" = "Età" + 1), traslazione data ("DOB" = "DOB" - 365), decadimenti fisici/tecnici per over 30 (p_decay_updates) e sincronizzazione ea_player_db.
Calciatori Già Ritirati (Squadra = 'RITIRATO'): incremento anagrafico ("Età" = "Età" + 1) e traslazione temporale ("DOB" = "DOB" - 365 e ea_player_db.birthdate - 365).
Gli 11 attributi fisici/tecnici e il valore di OVR dei calciatori ritirati rimangono rigorosamente congelati ed inalterati, preservando immutata la scheda tecnica storica del calciatore.
Coerenza Metriche & Toast Admin:
L'anteprima dell'AgingModal rimane focalizzata sui calciatori attivi e sulla gestione dei ritiri del campionato, mentre l'esecuzione a DB riporta nel toast di conferma e nei metadati lo scorporo trasparente (attivi vs ritirati storici).



---

## 📌 36. Segnalazione Calciatori con Ritiro Annunciato (Veterani all'Ultimo Anno)
- **Stato**: 🟢 Completato & Testato (Badge ⏳ Ultima Stagione in Dettaglio Calciatore, Rosa, Trattative, Lista e Confronto)
- **Priorità**: Media-Alta (Trasparenza contrattuale, valutazioni di mercato e pianificazione rosa)
- **Moduli coinvolti**: `src/components/player/RetiringBadge.tsx`, `src/components/player/playerDetails.tsx`, `src/pages/Roster.tsx`, `src/components/trades/NewTradeModal.tsx`, `src/components/trades/TradeDetailsModal.tsx`, `src/pages/ListaGiocatori.tsx`, `src/pages/ConfrontoGiocatori.tsx`
- **Tabelle coinvolte**: `an_player`
Descrizione & Implementazione
Identificazione visiva esplicita di tutti i calciatori di 34 anni attivi in rosa che disputeranno la loro ultima stagione agonistica prima del ritiro obbligatorio al compimento dei 35 anni:

- **Badge Distintivo (`RetiringBadge.tsx`)**:
  - Badge in stile ambra/arancio (`bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40`) con icona clessidra e dicitura **`⏳ Ultima Stagione`**.
  - Tooltip informativo su hover: *"34 anni: questo calciatore disputerà la sua ultima stagione e si ritirerà al termine del campionato."*
- **Integrazione Trasversale**:
  - **Scheda Dettaglio Calciatore (`playerDetails.tsx`)**: presente nella barra principale dei badge in testata accanto a ruolo, squadra, status mercato e XP.
  - **Pagina Rosa (`Roster.tsx`)**:
    - Nella vista a griglia (*Grid View*) accanto all'età anagrafica sulla card.
    - Nella vista tabellare (*Table View*) come icona clessidra interattiva accanto agli anni.
  - **Calciomercato & Trattative Scambi (`NewTradeModal.tsx`, `TradeDetailsModal.tsx`)**: esposto sia per i giocatori offerti sia per quelli richiesti per garantire piena trasparenza durante le negoziazioni.
  - **Lista Giocatori (`ListaGiocatori.tsx`) & Confronto (`ConfrontoGiocatori.tsx`)**: segnalazione integrata nelle viste tabellari, schede comparative e card.

---

## 📌 37. Evidenziazione Modifiche Formazione Rispetto alla Settimana Precedente
- **Stato**: 🟡 In attesa di implementazione
- **Priorità**: Media-Alta (Supporto avanzato per caster, commentatori e analisi avversaria)
- **Moduli coinvolti**: src/pages/FoglioCommento.tsx, src/components/home/OpponentScoutModal.tsx, src/pages/Tattica.tsx
- **Tabelle coinvolte**: public.team_formation_history, public.an_team_tactic
Descrizione
Confronto automatico tra la formazione schierata nella settimana corrente e quella della settimana precedente:

Nel Foglio Commento (/campionato/foglio-commento) e nel popup di Scouting Avversaria in Homepage:
Evidenziare sul campo 2D con icone/badge cromatici le novità rispetto all'ultimo incontro (es. "Nuovo Titolare", "Sostituzione Ruolo", "Modulo Variato").
Segnalare chi tra i titolari della settimana precedente è finito in panchina o in tribuna, fornendo una lettura immediata delle scelte tecniche dell'allenatore.



---

## 📌 38. Sistema Diffide e Squalifiche da Cartellini
- **Stato**: 🟡 In attesa di definizione & implementazione
- **Priorità**: Alta (Regolarità disciplinare del campionato)
- **Moduli coinvolti**: src/pages/Tattica.tsx, src/pages/FoglioCommento.tsx, gestione partite
- **Tabelle coinvolte**: "AS_PLAYER_STAT", an_player, team_formation_history
Descrizione
Tracciamento e applicazione automatica dei provvedimenti del Giudice Sportivo:

Conteggio progressivo delle ammonizioni (GIALLI) ed espulsioni dirette o per doppio giallo (ROSSI) dal tabellino partite.
Diffida: badge visivo di avvertimento quando il calciatore è a 1 giallo dalla squalifica.
Squalifica: al raggiungimento della soglia disciplinare (es. 4 ammonizioni) o a seguito di cartellino rosso, il calciatore viene squalificato per la giornata successiva:
In Tattica.tsx compare un badge rosso 🚫 Squalificato con divieto assoluto di schierarlo tra gli 11 titolari o in panchina.
Avviso nel Foglio Commento per i commentatori.



---

## 📌 39. Panchina da 9 Calciatori e 1 Giocatore in Tribuna
- **Stato**: 🟢 Completato & Testato (Panchina a 9 slot fissi P1..P9 e card Tribuna dedicata in Tattica.tsx, distinte gara a 9 riserve)
- **Priorità**: Alta (Adeguamento al regolamento ufficiale e alle rose da 21)
- **Moduli coinvolti**: `src/pages/Tattica.tsx`, `src/pages/FoglioCommento.tsx`, `src/services/foglioCommentoService.ts`
- **Tabelle coinvolte**: `an_team_tactic`, `team_formation_history`
Descrizione
Adeguata la distinta gara alle rose da 21 della nuova stagione (11 titolari, 9 riserve e 1 in tribuna):

- **Panchina a 9 Slot Fissi**: la schermata Tattica espone 9 slot numerati ordinati (`P1` .. `P9`) con priorità esplicita di subentro, visualizzando gli slot vuoti o occupati.
- **Sezione Tribuna / Non Convocati**: creata una card distinta e dedicata per i calciatori non inseriti nei 9 slot della panchina (il 21° calciatore o esuberi).
- **Interazione Intuitiva**:
  - Drag & drop diretto di un calciatore sulla card Tribuna per escluderlo.
  - Tasto rapido "Manda in Tribuna" (↘) su ogni panchinaro.
  - Tasto rapido "Promuovi in Panchina" (↗) sui giocatori in tribuna per reintegrarli nello slot `P1` libero.
- **Foglio Commento & Calendario**: nelle viste pubbliche vengono mostrate esclusivamente le 9 riserve ufficiali a disposizione per la partita (i primi 9 di `bench_order`).



---

## 📌 40. Possibilità di Scegliere Giocatori Svincolati al Draft (Oltre ai Rookie)
- **Stato**: 🟢 Completato & Testato (Migrazione SQL, RPC draft/undo svincolati & UI unificata)
- **Priorità**: Alta (Flessibilità delle chiamate al Draft)
- **Moduli coinvolti**: src/pages/Draft.tsx, src/services/draftWishlistService.ts, src/components/player/playerDetails.tsx
- **Tabelle & Funzioni coinvolte**: public.an_draft_board, public.an_player, public.an_rookie, rpc_draft_free_agent, rpc_draft_rookie, rpc_undo_draft_rookie
- **Migrazioni**: supabase/migrations/20261025_draft_free_agents.sql e rollback 20261025_draft_free_agents_rollback.sql
Descrizione & Risoluzione Tecnica
Estensione Schema Draft Board & Funzioni RPC:
Tabella an_draft_board estesa con colonne player_id BIGINT REFERENCES an_player("ID") e player_type TEXT DEFAULT 'rookie'.
rpc_draft_free_agent: funzione atomica di tesseramento che assegna la franchigia direttamente su an_player.Squadra (senza toccare o inquinare an_rookie) e scrive la scelta su an_draft_board.
rpc_undo_draft_rookie: estesa per riconoscere automaticamente il tipo di scelta: se era uno svincolato reimposta an_player.Squadra = NULL senza cancellare il calciatore; se era un rookie ripristina an_rookie e rimuove il record temporaneo.
Interfaccia Unificata nel Pannello Draft (Draft.tsx):
Filtri Tipo: pillole di selezione Tutti, 🌟 Rookie e 🆓 Svincolati con contatori in tempo reale degli elementi disponibili.
Visualizzazione Lista: anagrafica uniforme con Volto, Ruolo, Nome, Cognome, Età, Nazionalità e badge distintivo ([Rookie] / [Svincolato]). Per gli svincolati viene esposto l'OVR noto, mentre per i rookie le stelle ⭐ e i gettoni spesi.
Schede di Dettaglio: l'icona occhio apre il consueto profilo tecnico completo (PlayerDetails) per i calciatori svincolati e il report scouting a disclosure selettiva per i rookie.
Wishlist & Autopick Integrati: supporto ai preferiti (⭐) sia per i rookie sia per i calciatori svincolati con prelazione automatica durante l'Autopick.



---

## 📌 41. Controllo di Salvaguardia Portieri sui Tagli di Calciomercato
- **Stato**: 🟢 Completato & Testato (Migrazione SQL RPC, Service, Blocco UI Roster & Dashboard Admin)
- **Priorità**: Alta (Integrità sportiva delle rose e prevenzione blocchi formazioni)
- **Moduli coinvolti**: src/pages/Roster.tsx (/mia-squadra/roster), src/services/cutsService.ts, src/pages/admin/AdminAutomazioni.tsx
- **Tabelle coinvolte**: team_cuts_registry, an_player, execute_official_cuts
- **Migrazioni**: supabase/migrations/20261025_cuts_goalkeeper_protection.sql e rollback
Specifiche Implementate & Risoluzione Tecnica
Regola di Salvaguardia Portieri sui Tagli:
Nessun club può tagliare un portiere se questo riduce i portieri di ruolo (Posiz = 'POR') rimanenti al di sotto del minimo regolamentare di 2.
Interfaccia Rosa Club (Roster.tsx):
Calcolo real-time di totalGks, cutGks e remainingGks.
Disabilitazione condizionale del pulsante di taglio (✂️ Taglia) sui portieri quando remainingGks <= 2, con tooltip esplicito: "Obbligatorio mantenere almeno 2 portieri in rosa".
Blocco preventivo con notifica toast in handleTogglePlayerCut.
Badge riassuntivo arricchito con conteggio portieri rimanenti ({currentCutCount} ({remainingGks} POR rimasti)) e banner di allerta se la squadra scende sotto la soglia.
Servizio Tagli (cutsService.ts):
Estensione interfaccia TeamCutCompliance con currentGk, cutGk, postGk e gkReason.
In togglePlayerCut: verifica preventiva su Supabase che blocca l'inserimento nel registro tagli se rimarrebbero $< 2$ portieri.
In getCutsComplianceReport: calcolo dell'adempienza che richiede congiuntamente $13 le 	ext{postRoster} le 16$ e $	ext{postGk} ge 2$.
Pannello Admin Automazioni (AdminAutomazioni.tsx):
Card "Ufficializza Tagli di Lega" con specifica dei parametri: 13-16 giocatori (min. 2 portieri).
Lista delle squadre non conformi con evidenziazione del motivo specifico (es. "Meno di 2 portieri rimasti (1 POR)").
Verifica Atomica PostgreSQL (execute_official_cuts):
Controllo server-side sulle squadre attive: se per qualsiasi club v_post_gk < 2, la transazione viene respinta restituendo l'elenco dei club inadempienti.



---

## 📌 42. Obbligo Portiere all'Ultima Scelta del Draft (Salvaguardia Minimo 2 Portieri)
- **Stato**: 🟢 Completato & Testato (Migrazione SQL, RPC draft & Blocco UI)
- **Priorità**: Alta (Integrità della rosa e rispetto dei requisiti di ruolo)
- **Moduli coinvolti**: src/pages/Draft.tsx, src/services/draftWishlistService.ts, rpc_draft_rookie, rpc_draft_free_agent
- **Tabelle coinvolte**: public.an_draft_board, public.an_player, public.an_rookie
- **Migrazioni**: supabase/migrations/20261025_goalkeeper_draft_and_trade_rules.sql e rollback
Specifiche Implementate & Risoluzione Tecnica
Rilevamento Dinamico Pick Residue & Portieri:
Conteggio portieri attualmente sotto contratto in an_player per la squadra al turno (Squadra = teamId AND Posiz = 'POR').
Calcolo delle scelte residue per la squadra (rookie_id IS NULL AND player_id IS NULL).
Se remainingPicks === 1 e gkCount === 1, scatta l'obbligo portiere (isGkDraftMandatory = true).
Interfaccia Draft & Lista Filtrata:
Banner prominente di avviso regolamento in cima al pannello di scelta.
Esclusione automatica di tutti i giocatori di movimento da availableDraftPool, mostrando solo portieri (POR) disponibili tra rookie e svincolati.
Blocco preventivo con toast esplicito in handleConfirmPick.
Autopick Intelligente:
In executeAutopick, cerca il primo portiere (POR) presente nella graduatoria/wishlist del club.
Se assente in wishlist, attiva il fallback automatico selezionando il miglior portiere rimasto disponibile (rating per Stelle/OVR tra rookie e svincolati).
Guardia Atomica Server-Side (PostgreSQL):
Funzioni rpc_draft_rookie e rpc_draft_free_agent sollevano un'eccezione bloccante se una squadra all'ultima scelta con 1 solo portiere tenta di chiamare un giocatore non portiere.



---

## 📌 43. Tetto Massimo di 3 Portieri in Rosa (Blocco Scambi e Blocco Chiamata al Draft)
- **Stato**: 🟢 Completato & Testato (Migrazione SQL, Regola Scambi 2..3 POR & Blocco Draft)
- **Priorità**: Alta (Regolamento composizione rosa ed equilibrio numerico)
- **Moduli coinvolti**: src/pages/Trattative.tsx, src/components/trades/NewTradeModal.tsx, src/components/trades/TradeDetailsModal.tsx, src/services/tradesService.ts, src/pages/Draft.tsx, src/services/draftWishlistService.ts
- **Tabelle & Funzioni coinvolte**: public.an_player, public.market_trades, public.an_draft_board, rpc_execute_trade, rpc_draft_rookie, rpc_draft_free_agent
- **Migrazioni**: supabase/migrations/20261025_goalkeeper_draft_and_trade_rules.sql e rollback
Specifiche Implementate & Risoluzione Tecnica
Calciomercato & Trattative Scambi (Vincolo Min 2, Max 3 Portieri per Club):
Nuovo Scambio (NewTradeModal.tsx):
Calcolo in tempo reale del saldo per entrambe le franchigie: $\text{PostGK} = \text{CurGK} - \text{Ceduti} + \text{Ricevuti}$.
Se per il mittente o per il destinatario $\text{PostGK} < 2$ o $\text{PostGK} > 3$, compare un banner d'errore dedicato e il pulsante "Invia Proposta Ufficiale" viene disabilitato.
Dettagli & Accettazione (TradeDetailsModal.tsx / acceptTrade):
Verifica automatica delle rose al momento dell'accettazione: se il saldo viola il range $2..3$ portieri, l'accettazione viene bloccata.
Service & Database (tradesService.ts / rpc_execute_trade):
Validazione con guardie server e controllo atomico in rpc_execute_trade con rollback in caso di non conformità.
Draft di Lega (Draft.tsx & Autopick):
Se una franchigia possiede già 3 portieri in rosa, per quella squadra:
Banner d'avviso: "Tetto Massimo 3 Portieri Raggiunto: i portieri non sono selezionabili".
Le schede dei portieri in lista sono disabilitate con badge "Max 3 POR".
In executeAutopick, tutti i portieri vengono esclusi dalla selezione automatica.
Funzioni RPC sollevano eccezione in caso di chiamata di un 4° portiere.


---

## 📌 44. Distinzione tra Manager e Allenatore (Impostabile da Admin o Manager)
- **Stato**: 🟡 In attesa di definizione & implementazione
- **Priorità**: Media-Alta (Coerenza del ruolo manageriale con referti e statistiche di squadra)
- **Moduli coinvolti**: src/pages/Squadre.tsx, src/pages/admin/AdminAutomazioni.tsx (o gestione squadre Admin), src/pages/Calendario.tsx
- **Tabelle coinvolte**: an_team, "AS_TEAM_STAT" (campo ALLENATORE)
Descrizione
Separare in modo esplicito le due figure oggi sovrapposte: il Manager (utente che gestisce la squadra) e l'Allenatore (nome mostrato nei referti e nelle schede squadra):

Aggiunta di un campo dedicato "Allenatore" distinto dal nome del manager.
Il campo deve essere modificabile sia dall'Admin sia dal manager della squadra.
Il valore deve alimentare scheda squadra, calendario e referti partita.



---

## 📌 45. Scheda Squadra Ampliata con Palmarès e Stadio (Stile Football Manager)
- **Stato**: 🟡 Da Progettare / In Backlog
- **Priorità**: Media (Immersione e identità del club)
- **Moduli coinvolti**: src/pages/Squadre.tsx
- **Tabelle coinvolte**: an_team, an_schedule, an_standings
Descrizione
Espansione della scheda squadra sul modello delle schede club di Football Manager:

Palmarès: titoli vinti, piazzamenti e storico delle stagioni.
Stadio: nome, capienza e informazioni dell'impianto.
Layout più ampio con sezioni dedicate (informazioni club, allenatore, palmarès, stadio).



---

## 📌 46. Valore "Freddezza" Mancante in Scouting e Confronto Rookie
- **Stato**: 🟢 Completato & Testato (Incluso in `SCOUTING_DEPARTMENTS`, Scouting, Draft e Confronto Giocatori con decifrazione a gettoni)
- **Priorità**: Media-Alta (Completezza degli attributi mostrati)
- **Moduli coinvolti**: `src/utils/scoutingConfig.ts`, `src/pages/Scouting.tsx`, `src/pages/Draft.tsx`, `src/pages/ConfrontoGiocatori.tsx`
- **Tabelle coinvolte**: `an_rookie`, `ea_player_db`, RPC `rpc_get_scouted_rookies`
Descrizione
L'attributo Freddezza (`FRED`) è ora pienamente integrato nel reparto Calci Piazzati (`CPZ`) in tutte le viste di Scouting, nel Draft e nel Confronto Giocatori:

- Inserito in `SCOUTING_DEPARTMENTS` (`src/utils/scoutingConfig.ts`) con codice `FRED` e label "Freddezza".
- Rispettata la disclosure selettiva del Blind Database: 0 gettoni (`??`), 1 gettone (Range 10 es. `80-89`), 2+ gettoni (Range 3 es. `80-82`), 5 gettoni o Admin (valore esatto `83`).
- Incluso e decifrato sia da `rpc_get_scouted_rookies` sia visualizzato nei grafici e nelle barre statistiche del Confronto Giocatori.



---

## 📌 47. Scouting: Ridondanza Graduatoria/Preferiti & Calcolo Valore per Ruolo
- **Stato**: 🟡 In attesa di definizione & implementazione
- **Priorità**: Media-Alta (Usabilità dello scouting e correttezza dei valori mostrati)
- **Moduli coinvolti**: src/pages/Scouting.tsx (tab graduatoria & autopick), src/pages/Draft.tsx, src/services/draftWishlistService.ts, src/utils/scoutingConfig.ts
- **Tabelle coinvolte**: team_player_favorites, draft_team_wishlist, an_rookie
Descrizione
Ridondanza Graduatoria e Preferiti: oggi la Graduatoria per il Draft e i Preferiti dello scouting si sovrappongono (vedi punti #6 e #7). Valutare l'unificazione o una distinzione più netta tra le due liste per evitare doppio lavoro al manager.
Valore per Ruolo: in Scouting il valore per ruolo risulta calcolato sul minimo del range mostrato. Deve invece essere calcolato sul valore esatto del giocatore, mantenendo comunque la protezione del Blind Database (nessuna esposizione del valore reale al client).



---

## 📌 48. Tattica: Altezza della Linea Difensiva
- **Stato**: 🟢 Completato & Testato (Unificato assetto difensivo e sostituito slider libero con 4 altezze fisse e definite: Bassa, Media, Alta, Aggressiva)
- **Priorità**: Media-Alta
- **Moduli coinvolti**: `src/types/tactics.ts`, `src/components/tactics/TeamTacticsCard.tsx`, `src/components/tactics/TacticsOverviewTab.tsx`, `src/pages/Tattica.tsx`
- **Tabelle coinvolte**: `an_team_tactic`, `team_formation_history`
Descrizione
Riorganizzata la gestione dell'assetto difensivo nella pagina Tattica (`/mia-squadra/tattica`):

- **Unificazione**: rimosso il selettore ridondante "Approccio Difensivo" mantenendo unicamente **Altezza Linea Difensiva**.
- **Altezza Linea Difensiva**: rimosso lo slider continuo (1-100) e introdotte **4 opzioni predefinite fisse** con descrizione e badge:
  1. **Bassa** (valore 25): Protezione dell'area di rigore e limitazione dei varchi alle spalle dei difensori centrali.
  2. **Media** (valore 50): Assetto equilibrato con blocco compatto sulla propria trequarti.
  3. **Alta** (valore 75): Difesa a ridosso della linea di metà campo con pressing avanzato.
  4. **Aggressiva** (valore 95): Difensori che salgono nella metà campo avversaria applicando la trappola sistematica del fuorigioco.
- Garantita piena retrocompatibilità sia per i valori numerici storici sia per il simulatore e gli snapshot di `team_formation_history` tramite la funzione helper `getDefensiveLineOption`.



---

## 📌 49. Tattica: Descrizioni Istruzioni, Info di Gioco, Adattamenti Posizioni & Valore sul Campetto
- **Stato**: 🟢 Completato & Integrato (Testi Ufficiali FC IQ, Ruoli Secondari Naturali & OVR Dinamico sul Campetto)
- **Priorità**: Media-Alta (Chiarezza e fedeltà con EA Sports FC 25)
- **Moduli coinvolti**: `src/pages/Tattica.tsx`, `src/types/tactics.ts`, `src/components/tactics/TacticsOverviewTab.tsx`, `src/components/tactics/PlayerInstructionsModal.tsx`, `src/utils/playerOvrCalculator.ts`
- **Tabelle coinvolte**: `an_team_tactic`, `an_player`
Descrizione
- **Valore Dinamico sul Campetto 2D**: l'indicatore OVR sulla pedina del giocatore mostra ora in tempo reale l'Overall ricalcolato in base alla posizione effettivamente assegnata (`pos.label`) tramite `calcOverall`. Se il calciatore è fuori ruolo e subisce una perdita di efficacia, il badge OVR si evidenzia in allerta (ambra/rosso) con tooltip esplicativo completo (es. *OVR nel ruolo ATT: 74 (-8 Fuori Ruolo, Base: 82)*).
- **Adattamento Fuori Ruolo & Ruoli Secondari**:
  - `evaluateRoleFit` aggiornato per riconoscere a pieno titolo come **Naturali** (anello verde) tutti i ruoli secondari dichiarati della scheda (`PreferredPosition2, 3, 4`).
  - Ruoli affini limitrofi (es. DC $\to$ TD/TS/CDC, CC $\to$ CDC/COC/ED/ES) contrassegnati come **Adattati** (anello ambra).
  - Posizioni incompatibili o reparti opposti contrassegnati come **Fuori Ruolo** (anello rosso).
  - La media OVR di reparto (Difesa, Centrocampo, Attacco) nelle statistiche della formazione calcola i valori dinamici effettivi delle posizioni occupate anziché i valori statici di base.
- **Testi & Compiti Ufficiali FC IQ (EA FC 25)**:
  - Integrata la copertura completa del ruolo **AT** (Seconda Punta, Falso 9, Attaccante Ombra) con i relativi focus tattici in `FC25_ROLES_BY_POSITION`.
  - Descrizioni dettagliate di ciascun ruolo e compito/focus nel modale istruzioni e nelle schede tattiche.



## 📌 51. Classifica: Campo Neutro, Accesso Diretto alle Semifinali & Tabellone Playoff
- **Stato**: 🟡 In attesa di implementazione
- **Priorità**: Alta (Correttezza della classifica e dei playoff)
- **Moduli coinvolti**: src/pages/Classifica.tsx (da verificare), src/pages/Calendario.tsx, tabellone playoff
- **Tabelle coinvolte**: an_standings, an_schedule, "AS_TEAM_STAT"
Descrizione
Partite in Casa / Campo Neutro: correggere il conteggio delle partite in casa quando la partita si gioca in campo neutro.
Accesso Diretto alle Semifinali Playoff: sistemare la logica e la visualizzazione dell'accesso diretto in classifica.
Tabellone Playoff: collegare il tabellone ai risultati effettivi, in modo che si aggiorni automaticamente.



---

## 📌 52. Statistiche: Ridondanza Presenze/Media Voto & Dettaglio Giocatore
- **Stato**: 🟡 In attesa di implementazione
- **Priorità**: Media
- **Moduli coinvolti**: src/pages/Statistiche.tsx, src/components/player/playerDetails.tsx
- **Tabelle coinvolte**: VIEW_PLAYER_STATS, an_player
Descrizione
Ridondanza Presenze: nella tabella con la media voto le presenze compaiono in modo ridondante. Semplificare la tabella.
Click sul Giocatore: valutare quali informazioni aggiuntive mostrare al click su un giocatore (es. andamento, ultime partite, grafico voti).



---

## 📌 53. Calendario: Correzioni Referti, Formazioni e Tabella Offseason
- **Stato**: 🟡 In attesa di implementazione
- **Priorità**: Alta (Correttezza dei dati mostrati)
- **Moduli coinvolti**: src/pages/Calendario.tsx
- **Tabelle coinvolte**: an_schedule, "AS_TEAM_STAT", "AS_PLAYER_STAT", an_player, an_team
Descrizione
Etichetta Allenatore: correggere "Mister Signor" (vedi anche punto #44).
Giocatore Subentrato Errato: nelle formazioni in campo, il giocatore indicato come subentrato è sbagliato.
Gol di Ex Giocatori: mancano i gol dei giocatori che non fanno più parte della squadra.
Terzini Invertiti: terzino destro e sinistro risultano scambiati nella formazione.
Date Offseason: la tabella del calendario deve ospitare anche le date dell'offseason (mercato, draft, tagli, ecc.), non solo le partite.



---

## 📌 54. Sala Stampa: Interviste Differenziate per Manager
- **Stato**: 🟡 In attesa di verifica & correzione
- **Priorità**: Media
- **Moduli coinvolti**: src/pages/SalaStampa.tsx, src/services/aiJournalistService.ts
- **Tabelle coinvolte**: press_conferences, an_team, an_standings, an_schedule
Descrizione
Le interviste devono essere diverse per ciascun manager. Il punto #20 le dichiara già differenziate per club, quindi va verificato se si tratta di un malfunzionamento (domande ripetute o simili tra squadre) o se serve una maggiore varietà nei temi e nel tono.



---

## 📌 55. Confronto Serie A: Statistiche Stagionali & Errore Portiere vs Giocatore di Movimento
- **Stato**: 🟡 In attesa di implementazione
- **Priorità**: Alta (Bug bloccante nel confronto)
- **Moduli coinvolti**: src/pages/ConfrontoGiocatori.tsx
- **Tabelle coinvolte**: VIEW_PLAYER_STATS, an_player
Descrizione
Statistiche Stagionali: aggiungere al confronto la sezione con le statistiche stagionali dei due giocatori.
Bug Portiere vs Movimento: confrontando un giocatore di movimento con un portiere il confronto si rompe (attributi e statistiche non coincidono). Gestire il caso con set di attributi dedicati o con gestione dei campi mancanti.



---

## 📌 56. Pagina Scambi Non Funzionante
- **Stato**: 🟡 In attesa di diagnosi & correzione
- **Priorità**: Alta (Bug)
- **Moduli coinvolti**: src/pages/UfficialitaScambi.tsx (/mercato/scambi), src/components/trades/LeagueMarketNeedsBoard.tsx
- **Tabelle coinvolte**: market_trades, team_market_needs
Descrizione
La pagina degli scambi risulta rotta. Individuare l'errore (console, query Supabase, RLS) e ripristinare le schede Bisogni di Squadra e Ufficialità & Storico Scambi (vedi punto #14).



---

## 📌 57. Archivio da Rifare & Aggiornamento Hall of Fame
- **Stato**: 🟡 Da Progettare / In Backlog
- **Priorità**: Media
- **Moduli coinvolti**: pagina Archivio, pagina Hall of Fame (da verificare)
- **Tabelle coinvolte**: an_standings, an_schedule, VIEW_PLAYER_STATS (da definire)
Descrizione
Archivio: ripensare l'archivio storico delle stagioni.
Hall of Fame: aggiornarla con le stagioni e i dati recenti.
Da definire il contenuto di entrambe e il collegamento con il palmarès delle squadre (vedi punto #45).



---

## 📌 58. Roster: Etichetta POR e Rimozione Opzioni Vuote in Accessori
- **Stato**: 🟢 Completato
- **Priorità**: Bassa-Media (Rifinitura UI)
- **Moduli coinvolti**: src/pages/Roster.tsx (/mia-squadra/roster)
- **Tabelle coinvolte**: an_player
Descrizione
Cambiare l'etichetta POR nel Roster (nuova dicitura da definire).
Rimuovere le opzioni vuote presenti nel menu Accessori.



---

## 📌 59. Verifica Colori Associati ai Ruoli
- **Stato**: 🟢 Completato & Centralizzato
- **Priorità**: Bassa
- **Moduli coinvolti**: `src/utils/functions.ts`, `src/pages/Tattica.tsx`, `src/components/tactics/TacticsOverviewTab.tsx`, `src/pages/OpponentScout.tsx`, Roster, Scouting, Statistiche, ecc.
- **Descrizione**:
  - Centralizzazione completa della configurazione cromatica in `src/utils/functions.ts` con la palette classica LCSIM / EA FC:
    - 🧤 **Portiere (POR)**: Giallo / Ambra (`bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20`)
    - 🛡️ **Difesa (DIF, DC, TD, TS, DFC, TER, ecc.)**: Blu (`bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20`)
    - ⚙️ **Centrocampo (CEN, CDC, CC, COC, ED, ES, MED, TRQ, ecc.)**: Verde / Smeraldo (`bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20`)
    - 🎯 **Attacco (ATT, AT, AD, AS, PC, SP, ecc.)**: Rosso / Corallo (`bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20`)
  - Aggiunto il pieno supporto e fallback intelligente ai macro-ruoli (`DIF`, `CEN`, `ATT`, `POR`), eliminando il fallback anonimo a `bg-muted`.
  - Introdotte funzioni helper dedicate per ogni contesto visivo: `getRoleColor` (soft badge), `getRoleTextColor` (testo puro per campetti e sfondi scuri), `getRoleSolidColor` (badge pieni/saturi) e `getRoleDepartmentLabel`.
  - Uniformata la colorazione dei ruoli anche sul campo tattico (in `Tattica.tsx` e `TacticsOverviewTab.tsx`) e nella schermata `OpponentScout.tsx`.


---

## 📌 60. Barra Annunci Fissa, Non Chiudibile & Testo Scorrevole (Marquee)
- **Stato**: 🟢 Completato & Testato (Banner permanente non chiudibile, rilevamento overflow automatico & animazione marquee orizzontale)
- **Priorità**: Media-Alta (Visibilità garantita dei comunicati di Lega)
- **Moduli coinvolti**: `src/components/GlobalAnnouncementBanner.tsx`, `src/index.css`, `src/components/Navbar.tsx`
- **Tabelle coinvolte**: `league_announcements` (campo `is_banner`)
Descrizione
Evoluzione del Banner Globale in Cima al Sito (sotto la Navbar):

- **Barra Fissa e Non Chiudibile**: rimosso il pulsante "X" di chiusura locale a disposizione dell'utente; il banner rimane permanente e scompare unicamente quando l'Admin disattiva la spunta `is_banner` o quando il comunicato supera la data di scadenza.
- **Testo Scorrevole Automatico (Marquee)**:
  - Il componente misura dinamicamente la larghezza del testo rispetto allo spazio orizzontale disponibile nel viewport.
  - Se il testo eccede lo spazio (su mobile o con messaggi lunghi), si attiva l'animazione marquee orizzontale continua e fluida (senza scatti grazie al doppio segmento gemello loopato).
  - La velocità è calibrata dinamicamente in base alla lunghezza del messaggio (~45-50px al secondo per massima leggibilità).
  - **Pausa su Hover**: al passaggio del mouse o touch l'animazione va in pausa per consentire la lettura o il click.
  - Rispetto dell'accessibilità (`prefers-reduced-motion`).
  - Se il testo è breve, rimane statico e perfettamente centrato/visibile.


---

## 📌 61. Prospetto Riepilogativo Overall per Ruolo/Posizione in Schermata Allenamento
- **Stato**: 🟢 Completato
- **Priorità**: Media
- **Moduli coinvolti**: `src/pages/Allenamenti.tsx`, `src/utils/playerOvrCalculator.ts`
- **Descrizione**:
  - Aggiunto nella schermata di Allenamento (`/allenamenti`), sulla colonna di destra sotto la card *Riepilogo Avanzamento*, il prospetto riassuntivo che mostra in tempo reale l'Overall (OVR) calcolato del calciatore selezionato in tutte le 12 posizioni di campo (POR, DC, TD, TS, CDC, CC, COC, ED, ES, AD, AS, ATT).
  - Il prospetto è organizzato per reparti (Portiere, Difesa, Centrocampo, Attacco) con layout tattico, badge distintivi per Ruolo Naturale (`NAT`) e Ruolo Secondario (`SEC`), e calcolo dinamico in tempo reale: mostra il valore Base (`Pre`), il nuovo valore stimato (`Post`) e il delta verde (`+X`) non appena il manager incrementa qualsiasi attributo o cambia ruolo.

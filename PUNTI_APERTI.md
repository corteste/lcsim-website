# Registro Punti Aperti & Backlog Tecnico LCSIM

Questo documento tiene traccia di tutte le attività, requisiti aperti, logiche da implementare e miglioramenti pianificati per il progetto LCSIM.

---

## 📌 1. Logica di Caricamento & Importazione Risultati (CSV Admin)
- **Stato**: 🟡 In attesa di implementazione
- **Priorità**: Alta (Funzionalità chiave per la gestione della nuova stagione)
- **File di riferimento**: `context/LCSIM Stagione 11 - Week1.csv`
- **Tabelle coinvolte**: `an_schedule`, `"AS_TEAM_STAT"`, `"AS_PLAYER_STAT"`, `an_team`, `an_player`

### Descrizione
L'Admin caricherà settimanalmente un file CSV contenente i dati e i risultati delle partite della giornata di campionato. Il file ha una struttura peculiare a blocchi verticali (foglio di calcolo esportato) e necessita di un parser dedicato per distribuire correttamente i record nel database relazionale Supabase.

### Struttura del CSV analizzata
1. **6 Blocchi Partita** (34 righe per blocco, totale 204 righe per giornata da 12 squadre):
   - **Lato Sinistro (Colonne 1-28 - Calciatori)**: Fino a 32 righe per incontro (titolari e panchinari delle due squadre).
     - Mappatura su `"AS_PLAYER_STAT"`:
       - `ID` $\to$ ID calciatore (coerente con `an_player.ID`)
       - `Voto` $\to$ `VOTO`
       - `Gol` $\to$ `GOL`
       - `Assist` $\to$ `ASST`
       - `Tiri ✅` $\to$ `TIRI_IN` (tiri in porta)
       - `Tiri Tot` $\to$ `TIRI_TOT`
       - `Pass ✅` $\to$ `PASS_SI` (passaggi completati)
       - `Pass Tot` $\to$ `PASS_TOT`
       - `Drib ✅` $\to$ `DRIB_SI` (dribbling riusciti)
       - `Drib Tot` $\to$ `DRIB_TOT`
       - `Cont ✅` $\to$ `CTRS_SI` (contrasti vinti)
       - `Cont Tot` $\to$ `CTRS_TOT`
       - `Falli` $\to$ `FALLI`
       - `Parate` $\to$ `PARA`
       - `Subiti` $\to$ `GSUB` (gol subiti dal portiere)
       - `Giallo` $\to$ `GIALLI`
       - `Rosso` $\to$ `ROSSI`
       - `Fuorigioco` $\to$ `FGIOCO`
       - `Minuti` $\to$ `MINUTI`
       - Valori predefiniti a `0` per colonne DB non nel CSV: `AGOL`, `CROS_SI`, `CROS_TOT`.
   - **Lato Destro (Colonne 30-32 - Statistiche Squadra)**:
     - Mappatura su `"AS_TEAM_STAT"` (vengono inseriti **2 record** per match, uno per la squadra di casa e uno per la squadra in trasferta):
       - `Team1` / `Team2` $\to$ Risoluzione automatica di `TEAM_ID` (3 lettere) tramite la tabella `an_team`.
       - `Allenatore` $\to$ `ALLENATORE`
       - `Gol` $\to$ `GOL` (e `GSUB` della squadra corrisponde al `GOL` dell'avversaria)
       - `Possesso` $\to$ `POSS` (valore decimale, es. `0.52`)
       - `Tiri` / `% Tiri` $\to$ `TIRI_TOT` e `TIRI_SI`
       - `Passaggi` / `% Passaggi` $\to$ `PASS_TOT` e `PASS_SI`
       - `Contrasti` / `Contrasti Vinti` $\to$ `CTRS_TOT` e `CTRS_SI`
       - `Dribbling` / `% Dribbling` $\to$ `DRIB_TOT` e `DRIB_SI`
       - `Falli Commessi` $\to$ `FALLI`
       - `Parate` $\to$ `PARA`
       - `Calci d'Angolo` $\to$ `CANGL`
       - `Gialli`, `Rossi`, `Fuorigioco` $\to$ `GIALLI`, `ROSSI`, `FGIOCO`
       - `Media Voto` $\to$ `VOTO`
       - `Minuti` $\to$ `MINUTI` (standard `90`)

### Prerequisiti & Aspetti da Gestire
1. **Calendario Stagione 11 (`an_schedule`)**:
   - Attualmente la tabella `an_schedule` ha partite popolate solo per le stagioni 9 e 10.
   - Prima o durante il caricamento dei risultati della Stagione 11, le partite devono essere create o aggiornate in `an_schedule` con `stag = 11`, `week = 1..22`, `home`, `away`, `stadium`, `weather`, `date`.
2. **Interfaccia / Modalità di Caricamento**:
   - Valutare se implementare:
     - **Opzione A**: Schermata o modale Admin nel sito web con Drag & Drop del CSV, tabella di anteprima con validazione degli errori e bottone "Pubblica Giornata su Supabase".
     - **Opzione B**: Script CLI automatico (`npm run import-week --file=...`).
     - *(Opzione raccomandata: Opzione A integrata nell'area Admin del sito per massima comodità)*.
3. **Calcolo Classifiche**:
   - Assicurarsi che dopo l'inserimento delle statistiche venga invocata o attivata la procedura di aggiornamento classifica (`standings_processed = true`).


---

## 📌 2. Sistema di Messaggistica Interna, Proposte di Scambio & Comunicazioni Admin
- **Stato**: 🟢 Completato (2.1 in prod, 2.2 e 2.3 su branch `dev`)
- **Priorità**: Media-Alta (Potente miglioramento dell'esperienza utente e della gestione di lega)
- **Moduli coinvolti**: Navbar (Badge notifiche), Nuova sezione Posta/Messaggi (`/inbox` o `/mercato/scambi`), Bacheca Comunicazioni Admin

### 2.1 Modulo Proposte di Scambio Giocatori (Market Trades)
- **Stato**: 🟢 Implementato su branch `dev` (Pronto per test)
- **Funzionalità completate**:
  - **Area Riservata**: `/mia-squadra/trattative` (proposte segrete, ricevute, inviate, storico e thread negoziazione).
  - **Bacheca Pubblica Ufficiale**: `/mercato/scambi` (riepilogo pubblico scambi convalidati dalla Lega).
  - **Asset Supportati**: Calciatori in rosa (`an_player`) e Scelte del Draft (`an_draft_board`).
  - **Regola di Parità Asset**: Controllo ferreo frontend/backend: $N$ asset ceduti $\iff N$ asset ricevuti (1:1, 2:2, ecc.).
  - **Workflow di Trattativa Completo**: Invio, Notifiche ricevute, Accetta $\to$ stato `pending_admin`, Rifiuta con motivazione, Controproposta automatica invertita, Ritiro/Annullamento del mittente.
  - **Pannello Convalida Admin**: Approvazione ufficiale con trasferimento atomico dei giocatori in `an_player` e delle scelte in `an_draft_board`.
  - **Script SQL Migrazione**: `supabase/migrations/20261023_market_trades.sql` con tabelle `market_trades`, `trade_messages`, indici, RLS e funzione atomica `rpc_execute_trade`.

### 2.2 Modulo Comunicazioni Ufficiali Admin (Broadcast & Bacheca Lega)
- **Stato**: 🟢 Implementato su branch `dev` (Eseguito su Supabase)
- **Funzionalità completate**:
  - **Bacheca Comunicati Ufficiali (`/comunicati`)**: Feed pubblico con filtro categorie (Regolamento, Mercato, Giornate, Disciplinare, Generale), ricerca, stato letto/non letto e gestione completa per l'Admin (Creazione, Modifica, Eliminazione, Fissa in alto, Imposta Banner).
  - **Banner Globale in Cima al Sito**: Mostrato automaticamente sotto la Navbar per i comunicati marcati come `is_banner = true`, chiudibile dall'utente.
  - **Tabelle Supabase create**: `league_announcements` e `announcement_reads` (`supabase/migrations/20261023_announcements_and_notifications.sql`).

### 2.3 Integrazione Notifiche Realtime
- **Stato**: 🟢 Implementato su branch `dev`
- **Funzionalità completate**:
  - **Campana Notifiche nella Navbar (`NotificationsMenu`)**: Contatore `Badge` numerico animato e pannello a discesa unificato (Comunicati Lega non letti, nuove proposte di scambio, cambi di stato scambi, nuovi messaggi chat trattativa e scambi da convalidare per l'Admin).
  - **Supabase Realtime Channels**: Sottoscrizione live a `league_announcements`, `market_trades` e `trade_messages` con alert toast istantanei.


---

## 📌 3. Scadenza Consegna Formazioni, Countdown & Blocco Modifiche (Punti 7 e 7b)
- **Stato**: 🟢 Completato & Rilasciato in Produzione
- **Priorità**: Alta (Fondamentale per la regolarità delle partite e del calendario settimanale)
- **Moduli coinvolti**: `src/pages/Tattica.tsx`, `Navbar.tsx` (o banner home), Supabase (configurazione scadenze di lega)

### Valutazione Fattibilità: 🟢 Pienamente Fattibile
- **Descrizione**:
  - Ogni settimana c'è un termine perentorio per la consegna della formazione per le partite in programma.
  - **Countdown UI (Punto 7)**:
    - Widget con conto alla rovescia (giorni, ore, minuti, secondi) mostrato in evidenza nella pagina Tattica e/o nella Navbar (es. *"Scadenza Consegna Giornata X: Giovedì ore 20:00 - Tempo rimasto: 1g 4h 12m"*).
    - Data/ora di scadenza configurabile dall'Admin per ciascuna giornata di campionato (memorizzata in tabella `league_settings` o per giornata in `an_schedule`).
  - **Blocco & Avviso Post-Scadenza (Punto 7b)**:
    - Una volta superato il momento limite (es. Mercoledì/Giovedì all'orario fissato):
      - Se un utente accede a `Tattica.tsx`, compare un **banner di allerta giallo/arancione**:
        > ⚠️ **Formazioni Chiuse per la Giornata in corso**: La scadenza per la Giornata X è terminata. Qualsiasi modifica apportata adesso e salvata entrerà in vigore solo per la **Giornata successiva (X+1)** e non influenzerà la partita di questa settimana.
      - La formazione per la giornata in corso viene congelata nello snapshot ufficiale (vedi punto 5).

---

## 📌 4. Pagina "Foglio Commento" con Formazioni Ufficiali Pubbliche (Punto 8)
- **Stato**: 🟢 Completato & Rilasciato in Produzione
- **Priorità**: Alta (Strumento centrale per caster, commentatori, spettatori e manager)
- **Moduli coinvolti**: `src/pages/FoglioCommento.tsx` (`/campionato/foglio-commento`), `src/services/foglioCommentoService.ts`, `Navbar.tsx` (sottosezione Campionato)
- **Tabelle coinvolte**: `an_schedule`, `league_deadlines`, `an_team_tactic`, `team_formation_history`, `VIEW_PLAYER_STATS`, `an_player`, `an_team`

### Specifiche Implementate
1. **Collocazione & Navigazione**:
   - Inserita come voce ufficiale nella sottosezione **Campionato** della Navbar (`/campionato/foglio-commento` e alias `/foglio-commento`).
2. **Selettore Match Rapido & Confronto Affiancato**:
   - Barra di selezione rapida in alto per navigare istantaneamente tra i 6 incontri della giornata.
   - Vista affiancata Casa vs Trasferta (`grid-cols-2` su desktop):
     - **Campetto Tattico 2D**: 11 titolari posizionati con precisione secondo il modulo FC IQ (`EA_FC25_FORMATIONS`), visualizzando numero di maglia, OVR, cognome/nome e ruolo specifico. Come da richiesta, esclusi calci piazzati e indicazioni tattiche.
     - **Panchina / Riserve**: Elenco ordinato delle riserve a disposizione con numero maglia, ruolo, OVR, età e piede.
     - **Ispezione Calciatore**: Cliccando su qualsiasi titolare o panchinaro si apre la modale di dettaglio con tutti gli attributi.
3. **Visibilità Protetta & Scadenza Formazioni**:
   - Collegamento con `league_deadlines`: se la deadline per la giornata in corso non è ancora scaduta, le formazioni sono oscurate per i manager (`🔒 Formazioni Riservate`) con indicazione della data/ora di sblocco.
   - L'Admin dispone dell'accesso di anteprima con badge dedicato (`🛡️ Anteprima Admin`).
   - Per le giornate concluse o passate la visualizzazione è sempre sbloccata e pubblica per tutta la community.

---

## 📌 5. Archivio Storico delle Formazioni Salvate & Report Avversaria Homepage
- **Stato**: 🟢 Implementato su branch dev (Tabella creata su Supabase & Collegata)
- **Priorità**: Media-Alta (Essenziale per alimentare il Foglio Commento, il report scouting avversaria e lo storico stagionale)
- **Tabelle coinvolte**: Nuova tabella `team_formation_history`, `an_team_tactic`, `VIEW_PLAYER_STATS`

### Valutazione Fattibilità: 🟢 Pienamente Implementato
- **Descrizione**:
  - Creata la tabella `team_formation_history` su Supabase (`supabase/migrations/20261023_team_formation_history.sql`) con indici e RLS.
  - Ogni salvataggio effettuato da un manager in `Tattica.tsx` crea automaticamente un record di snapshot (`formation`, `starters`, `bench_order`, `created_at`, `created_by`).
  - **Blocco Prossimo Incontro & Popup Scouting Avversaria nella Homepage**:
    - Per i manager loggati, compare il blocco del prossimo turno con la squadra rivale, stadio, stato casa/trasferta e andamento recente.
    - Cliccando sul blocco si apre il popup modale con:
      1. **Ultime 3 Formazioni Inserite**: con selettore e campo tattico 2D interattivo (`EA_FC25_FORMATIONS`), titolari e panchina (con fallback automatico sulle formazioni scese in campo nelle partite precedenti da `VIEW_PLAYER_STATS`).
      2. **Rosa Completa**: ordinata per OVR con filtri per ruolo e anagrafica.
      3. **Andamento & Ultimi Incontri**: con statistiche e badge forma (`V`, `N`, `P`).


---

## 📌 6. Sistema Giocatori Preferiti / Watchlist (Draft, Scouting & Free Agent)
- **Stato**: 🟢 Completato & Rilasciato in Produzione
- **Priorità**: Media-Alta (Miglioramento essenziale per l'usabilità durante il mercato e il draft)
- **Moduli coinvolti**: `src/pages/Draft.tsx`, `src/pages/Scouting.tsx`, `src/pages/ListaGiocatori.tsx` (Free Agent), Supabase
- **Tabelle coinvolte**: Tabella `team_player_favorites`

### Valutazione Fattibilità: 🟢 Pienamente Implementato
- **Descrizione**:
  - Permette a ciascun manager di contrassegnare rapidamente qualsiasi calciatore (Rookie al Draft, prospetto nella pagina Scouting, o Free Agent svincolato) con una **stellina / segnalibro** (⭐).
  - **Integrazione Trasversale**:
    - **Pagina Scouting (`/scouting`)**: Il manager mentre spende token di scouting o analizza i report può cliccare sulla stellina per salvare il rookie tra i suoi preferiti.
    - **Pagina Draft (`/draft`)**:
      - Nel tabellone o nella modale di selezione della scelta compare il filtro rapido **"⭐ Solo Preferiti"**.
      - I rookie preferiti hanno un'evidenziazione visiva distinta (bordo dorato e badge stellina) per essere individuati all'istante senza dover scorrere decine di profili durante il proprio turno.
    - **Lista Giocatori / Mercato Free Agent**: Funziona identicamente per tenere d'occhio svincolati o talenti di altre squadre.
  - **Architettura Tecnica**:
    - Tabella Supabase: `team_player_favorites(id, team_id, player_id, player_type, created_at)` con vincolo univoco `(team_id, player_id, player_type)`.
    - RLS per garantire che ciascun manager veda e modifichi solo la propria lista privata.

---

## 📌 7. Lista di Priorità Draft & Autopick per Manager Assenti
- **Stato**: 🟢 Completato & Rilasciato in Produzione
- **Priorità**: Alta (Risolve il problema critico dei blocchi del Draft Live dovuti all'assenza di un manager)
- **Moduli coinvolti**: `src/pages/Scouting.tsx` (tab graduatoria & autopick), `src/pages/Draft.tsx` (badge notifica & trigger emergenza), Supabase
- **Tabelle coinvolte**: Tabelle `draft_team_wishlist`, `draft_autopick_settings`, collegamento con `team_player_favorites`

### Specifiche Implementate: 🟢 Rilasciate in Produzione
- **Descrizione**:
  - Trasforma l'esperienza del Draft consentendo di comporre la propria **Graduatoria Personale di Rookie**.
  - **Scheda Dedicata nello Scouting (`/mia-squadra/scouting?tab=autopick`)**:
    - Permette di ordinare i rookie preferiti dal Rank #1 in giù, con frecce Su/Giù e rimozione.
    - Pulsante rapido **"⭐ Importa dai Preferiti"**: carica con un clic tutti i prospetti con la stella nella lista di priorità.
    - Ricerca e inserimento manuale di ulteriori rookie con filtri per ruolo.
  - **Attivazione Autopick**:
    - **Manager**: Toggle dedicato nella scheda Scouting (*"Autopick per Assenza la sera del Draft"*).
    - **Admin**: Pulsante d'emergenza nella barra "ON THE CLOCK" della Draft Room per forzare l'esecuzione dell'autopick sulla squadra al turno corrente.
  - **Draft Room (`/draft`)**:
    - Badge di notifica per la propria squadra (`🤖 Autopick Attivo per [Team]`) con link alla configurazione in Scouting.
    - Badge `🤖 Autopick Attivo` nella barra in evidenza per la squadra On The Clock.
  - **Esecuzione Selezione Automatica**:
    1. Il sistema scorre la graduatoria della squadra a partire dal Rank 1 e seleziona il primo rookie non ancora draftato.
    2. **Strategia di Fallback (Fallback A Approvato)**: Se tutti i rookie presenti nella graduatoria personale sono già stati chiamati da altre squadre nei turni precedenti (o se la lista è vuota), il sistema assegna in automatico il rookie rimasto disponibile con l'**Overall (OVR) più alto**.


---

## 📌 8. Gestione Tagli dei Giocatori nel Periodo di Calciomercato
- **Stato**: 🟢 Completato & Rilasciato in Produzione
- **Priorità**: Alta (Funzionalità fondamentale per la gestione della rosa e delle finestre di mercato)
- **Moduli coinvolti**: `src/pages/Roster.tsx` (`/mia-squadra/roster`), `src/pages/admin/AdminAutomazioni.tsx` (`/admin/automazioni`), `src/services/cutsService.ts`, Supabase
- **Tabelle coinvolte**: `public.team_cuts_registry`, `public.an_player`, `public.as_player_market`, `public.an_team_tactic`, `public.league_announcements`, `public.league_automation_state`

### Specifiche Implementate & Architettura
1. **Regola di Rosa (Opzione A approvata)**:
   - Ogni squadra al termine dei tagli deve avere **minimo 13 e massimo 16 calciatori** in rosa.
   - Formule dinamiche: `min_cuts = max(0, N - 16)` e `max_cuts = max(0, N - 13)`. Tiene conto automaticamente dei ritiri a inizio stagione.
2. **Interfaccia Manager (`/mia-squadra/roster` - Tab "Status di Mercato")**:
   - **Contatore essenziale**: Badge `Giocatori Tagliati: X`, rosso quando la rosa post-tagli supera 16 giocatori, verde quando è conforme (13-16).
   - **Filtro rapido**: 6° tab **"In Taglio"** con contatore in tempo reale per consultare solo i giocatori designati al taglio.
   - **Azione Taglio**: Pulsante `✂️ Taglia` / `Annulla Taglio` su ogni calciatore. Il sistema blocca/disabilita l'opzione di tagliare quando la squadra raggiunge la soglia minima di 13 giocatori. Il manager può modificare la propria selezione in ogni momento fino all'ufficializzazione.
3. **Pannello Admin (`/admin/automazioni` - Card "Ufficializza Tagli di Lega")**:
   - **Opzione A**: L'Admin visualizza esclusivamente l'elenco delle **squadre inadempienti** con il relativo totale dei giocatori tagliati da ciascuna.
   - Pulsante "Ufficializza Tagli" disabilitato finché tutte le squadre non sono in regola.
   - Quando tutte le 12 squadre sono in regola, compare il badge verde con il totale dei giocatori pronti per lo svincolo e il pulsante abilitato con modale di conferma.
4. **Procedura Atomica SQL (`execute_official_cuts`)**:
   - Svincola i calciatori (`an_player.Squadra = NULL`, `NumeroMaglia = NULL`).
   - Rimuove i record da `as_player_market`.
   - Azzera i titolari e pulisce la panchina in `an_team_tactic`.
   - Genera il comunicato ufficiale di svincolo in bacheca (`league_announcements`).
   - Registra l'operazione in `league_automation_state` e svuota `team_cuts_registry`.

---

## 📌 9. Gestione Tattiche Avanzate nella Pagina Tattica (FC IQ EA Sports FC 25)
- **Stato**: 🟢 Completato & Rilasciato in Produzione
- **Priorità**: Media-Alta (Arricchimento profondo della componente manageriale e tattica in stile EA FC 25)
- **Moduli coinvolti**: `src/pages/Tattica.tsx` (`/mia-squadra/tattica`), `src/pages/OpponentScout.tsx`, eventuale Foglio Commento
- **Tabelle coinvolte**: `an_team_tactic`, `team_formation_history`

### Descrizione
Espansione della pagina Tattica per andare oltre la semplice selezione del modulo e lo schieramento degli 11 titolari, consentendo ai manager di configurare l'intero assetto tattico della squadra (tattiche di squadra, istruzioni individuali e incarichi) in coerenza con le opzioni di simulazione EA Sports FC 25.

### Requisiti & Specifiche da Implementare
1. **Tattiche di Squadra (Team Tactics & Style)**:
   - **Fase Difensiva**:
     - Stile difensivo (es. *Equilibrato*, *Pressing sul primo controllo*, *Pressing costante*, *Ripiegamento*).
     - Ampiezza difensiva (slider 1-100 o preset) e Profondità della linea (linea alta, media, bassa).
   - **Fase Offensiva**:
     - Costruzione di manovra (es. *Manovra veloce*, *Possesso palla*, *Lancio lungo*, *Equilibrato*).
     - Creazione occasioni (es. *Passaggi diretti*, *Inserimenti offensivi*, *Equilibrato*).
     - Ampiezza offensiva e presenza in area sui cross e sui calci piazzati (corner e punizioni).
2. **Istruzioni Individuali per Ruolo / Calciatore (Player Roles & Instructions)**:
   - Cliccando su un calciatore nel campo 2D, apertura di un pannello laterale o tab con istruzioni specifiche:
     - **Portiere**: Uscite sui cross (*Prudente* / *Aggressivo*), Ruolo portiere-libero.
     - **Terzini (TD/TS)**: Tipo di attacco (*Resta dietro in attacco*, *Equilibrato*, *Partecipa all'attacco*), Tipo di corsa (*Sovrapposizione*, *Invertito*).
     - **Difensori Centrali (DC)**: Intercettazioni (*Normali*, *Aggressive*), Posizione difensiva.
     - **Centrocampisti (CDC/CC/COC)**: Copertura (*Al centro*, *Sulle fasce*), Supporto offensivo (*Resta dietro*, *Avanza*, *Libero di svariare*).
     - **Esterni & Attaccanti (ED/ES/AD/AS/ATT)**: Tagli e movimenti (*Taglia dentro*, *Resta largo*, *Inserisciti alle spalle*), Supporto in difesa (*Rientra*, *Resta in avanti*).
3. **Incarichi Partita (Set Pieces & Hierarchy)**:
   - Assegnazione formale dei ruoli chiave: Capitano (C), Vice-Capitano, Rigorista primario/secondario, Punizione corta, Punizione lunga, Calcio d'angolo sinistro, Calcio d'angolo destro.
4. **Persistenza & Integrazione**:
   - Salvataggio delle configurazioni avanzate nel record di `an_team_tactic` (come campo JSONB strutturato `tactical_settings` o colonne dedicate) e tracciamento negli snapshot di `team_formation_history`.
   - Visualizzazione dei preset tattici nel report avversaria (`/prossimo-avversario`) e nel futuro Foglio Commento per commentatori e spettatori.


---

## 📌 10. Automatizzazione Applica Invecchiamenti Calciatori & Gestione Ritiri
- **Stato**: 🟡 Da Discutere & Definire
- **Priorità**: Alta (Procedura chiave di transizione tra stagioni sportive)
- **Moduli coinvolti**: `src/pages/admin/AdminAutomazioni.tsx` (`/admin/automazioni`), bacheca comunicati (`/comunicati`), tabelle `an_player`, `ea_player_db`
- **Tabelle coinvolte**: `an_player`, `ea_player_db`, `league_announcements`, eventuale colonna o tabella `retirements`

### Descrizione
Procedura batch eseguibile dall'Admin per effettuare il passaggio d'anno/stagione sportiva su tutti i calciatori registrati nella Lega.

### Funzionalità & Integrazione Ritiri
1. **Incremento Anagrafico**:
   - Aumento di 1 anno (`Età = Età + 1`) per tutti i giocatori attivi.
   - Sfasamento `DOB` / `birthdate` per mantenere l'esatta corrispondenza con il motore anagrafico di EA FC 25.
2. **Curve di Decadimento & Sviluppo Attributi**:
   - Definire se e come cambiano le statistiche fisiche e tecniche in base alla fascia d'età:
     - *Fascia Giovani (Under 23)*: bonus naturale o stabilità?
     - *Fascia Prime (24-29)*: mantenimento del picco di rendimento.
     - *Fascia Declino (30-33)*: calo graduale degli attributi di velocità, accelerazione e resistenza?
     - *Fascia Veterani (34+)*: decrementi più marcati e valutazione del ritiro.
3. **Automazione Annuncio Ritiri Futuri & Esecuzione**:
   - **Annuncio Automatico Preventivo**: Alla pressione del pulsante invecchiamento, il sistema identifica in automatico i calciatori che si ritireranno a fine stagione (in base a età/soglie stabilite) e genera contestualmente un avviso/comunicato ufficiale di Lega in bacheca (`league_announcements`) con badge visivo nella rosa della squadra.
   - **Esecuzione Ritiri**: Passaggio di stato a `Squadra = 'RITIRATO'`, rimozione da formazioni/rose attive e inserimento nell'albo storico.
4. **Reversibilità e Sicurezza**:
   - Backup automatico / snapshot dello stato delle rose prima del lancio, per poter annullare l'operazione in caso di errore.

---

## 📌 11. Automatizzazione Start / Stop Calciomercato
- **Stato**: 🟢 Implementato su branch dev (Interruttore e blocco scambi/trattative attivi)
- **Priorità**: Alta (Regolamentazione ufficiale delle sessioni di mercato)
- **Moduli coinvolti**: `src/pages/admin/AdminAutomazioni.tsx`, `src/pages/Trattative.tsx`, `src/services/tradesService.ts`, `src/services/marketStateService.ts`
- **Tabelle coinvolte**: `league_automation_state` (record `market_toggle`), `market_trades`

### Descrizione
Interruttore globale controllato dal Super Admin nel Centro Automazioni di Lega per aprire o chiudere ufficialmente la finestra di mercato.

### Funzionalità Implementate
1. **Interruttore Pannello Admin**:
   - Badge dinamico che diventa **Rosso ("CHIUSO")** quando il mercato è chiuso e **Verde ("APERTO")** quando è aperto.
   - Pulsanti "Chiudi Mercato di Lega" e "Apri Mercato di Lega" collegati direttamente a Supabase con aggiornamento istantaneo del timestamp e dell'autore.
2. **Blocco Operazioni a Mercato Chiuso**:
   - I manager non possono inviare nuove proposte di scambio (pulsante disabilitato e alert in `Trattative.tsx` e `NewTradeModal.tsx`).
   - I manager non possono accettare o rifiutare proposte in sospeso (pulsanti disabilitati e alert in `TradeDetailsModal.tsx`).
   - Guardie server/service a livello di `tradesService.ts` (`createTrade`, `acceptTrade`, `rejectTrade`) che rifiutano transazioni se il mercato è chiuso.
   - Banner informativo ben visibile in testata a `/mia-squadra/trattative` per comunicare la chiusura della sessione a tutti i manager.
3. **Punti Futuri per Ulteriori Estensioni**:
   - Possibilità di impostare data/ora di chiusura automatica con countdown per tutti gli utenti.
   - Eventuale blocco dei tagli calciatore in `/mia-squadra/roster` se previsto dal regolamento.

---

## 📌 12. Automatizzazione Blocca / Sblocca Rose
- **Stato**: 🟡 Da Discutere & Definire
- **Priorità**: Media-Alta (Integrità delle rose durante lo svolgimento delle giornate di campionato)
- **Moduli coinvolti**: `src/pages/admin/AdminAutomazioni.tsx`, `src/pages/Roster.tsx`, `src/pages/Tattica.tsx`
- **Tabelle coinvolte**: `league_settings`, `an_player`, `an_team_tactic`

### Descrizione
Funzione per congelare istantaneamente l'intero organico di tutte le squadre (numeri di maglia, cambi ruoli, accessori, titolari e panchina) prima che le partite vengano simulate su EA FC 25.

### Punti Chiave da Discutere con l'Utente
1. **Perimetro del Blocco**:
   - Blocca solo numeri di maglia e kit in Rosa, oppure anche l'inserimento/modifica delle formazioni in Tattica?
   - Rapporto con le scadenze automatiche di giornata (`league_deadlines`): il blocco rose è un override manuale di emergenza o un'azione programmata autonoma?
2. **Feedback per i Manager**:
   - Banner esplicito in `/mia-squadra/roster` e `/mia-squadra/tattica`: *"Rose congelate dalla Lega per lo svolgimento delle partite"*.

---

## 📌 13. Hub Amministrazione Automazioni, Export Master Table & Import Classe Rookie
- **Stato**: 🟢 Operativo su dev (Export autonomo & Procedura Import Rookie 2-File integrata)
- **Priorità**: Alta
- **Moduli coinvolti**: `src/pages/admin/AdminAutomazioni.tsx` (`/admin/automazioni`), `src/components/admin/ImportRookieModal.tsx`, `src/services/rookieImportService.ts`, `src/services/eaPlayerDbService.ts`
- **Tabelle coinvolte**: `ea_player_db`, `an_rookie`, `an_player`, `league_automation_state`

### Descrizione & Architettura
Sezione riservata al Super Admin con blocchi separati per:
1. **Export Master Table EA FC 25**:
   - Generazione file completo `DB_NEW.txt` a 137 colonne (21.067 righe base EA FC 25 + calciatori e rookie LCSIM aggiornati in tempo reale).
   - Download opzionale del solo snippet calciatori LCSIM.
2. **Importa Classe Rookie (Procedura a 2 File)**:
   - **File 1 (Master Data)**: file con le 137 colonne EA FC 25 dei nuovi rookie, aggiunto alla master table (`ea_player_db`) senza sovrascrivere l'archivio esistente.
   - **File 2 (Anagrafica)**: file a 4 colonne (`ID`, `Nome`, `Cognome`, `Squadra`), associato tramite l'`ID` al Master Data.
   - **Destinazione Rookie**: i dati decodificati vengono inseriti direttamente in `public.an_rookie` per popolare la lista dei rookie del Draft.

---

## 📌 14. Recap Calciomercato & Bisogni di Squadra a Macro-Categorie (Sezione Scambi)
- **Stato**: 🟡 Da Progettare / In Backlog
- **Priorità**: Media-Alta (Miglioramento dell'interazione sul mercato tra società)
- **Moduli coinvolti**: `src/pages/Trattative.tsx`, `src/pages/UfficialitaScambi.tsx` o nuova tab dedicata a `/mercato/scambi`
- **Tabelle coinvolte**: Tabella `team_market_needs` (o campo JSONB in `an_team`)

### Descrizione
Nella sezione scambi/calciomercato, introduzione del **Recap Calciomercato**: ciascuna società può impostare e aggiornare i propri **Bisogni di Mercato**, specificando a quali macro-categorie di ruoli è prioritariamente interessata:
- **8 Macro-Categorie Selezionabili**:
  1. *Portieri* (`POR`)
  2. *Terzini* (`TD`, `TS`)
  3. *Difesa Interni* (`DC`)
  4. *Mediani* (`CDC`)
  5. *Centrocampisti* (`CC`)
  6. *Esterni* (`ED`, `ES`, `AD`, `AS`)
  7. *Trequartisti* (`COC`)
  8. *Attaccanti* (`ATT`, `AT`)
- **Flusso & Visualizzazione**:
  - **Pannello Manager**: Selezione immediata tramite badge/toggle delle macro-categorie ricercate (senza note libere per la massima semplicità).
  - **Griglia Recap di Lega**: Vista aggregata accessibile a tutte le squadre che mostra a colpo d'occhio cosa cerca ogni club, facilitando le proposte di scambio mirate.

---

## 📌 15. Finestra "Lista Tratti" nello Scouting & Revisione Decodifica Maschere Bit
- **Stato**: 🟡 Da Progettare / In Backlog
- **Priorità**: Media-Alta (Usabilità e fedeltà dei PlayStyles/Traits dei rookie)
- **Moduli coinvolti**: `src/pages/Scouting.tsx`, `src/utils/scoutingConfig.ts`, `src/services/rookieImportService.ts`
- **Tabelle coinvolte**: `an_rookie`, `ea_player_db`

### Descrizione
1. **Finestra "Lista Tratti" (UI)**: Nella scheda di scouting del rookie, raggruppamento di tutti i tratti posseduti all'interno di una finestra/pannello dedicato denominato **"Lista Tratti"**, visualizzati chiaramente incolonnati uno sotto l'altro con icona e descrizione (rispettando lo sblocco per gettoni: conteggio a 2G, elenco completo a 3G e 5G).
2. **Revisione Decodifica Tratti**: Riesame dell'estrazione e decodifica dalle maschere bit EA FC 25 del file Master (`trait1`, `trait2`, `icontrait1`, `icontrait2`) per garantire che tutti i PlayStyles e PlayStyles+ vengano interpretati correttamente e salvati in `an_rookie` senza perdite o disallineamenti.

---

## 📌 16. Pulsante e Modale per il Cambio Password
- **Stato**: 🟡 In attesa di implementazione
- **Priorità**: Media (Sicurezza e autonomia degli account manager)
- **Moduli coinvolti**: `Navbar.tsx` (menu utente/squadra), `src/context/AuthContext.tsx`, modale dedicato `ChangePasswordModal.tsx`
- **Tabelle coinvolte**: Tabella utenti Supabase (`auth.users` o `public.an_users` / `app_users`)

### Descrizione
Aggiunta di un'azione accessibile dal menu profilo/squadra nella Navbar (o in impostazioni squadra) per consentire a ciascun manager autenticato (e all'admin) di modificare in autonomia la propria password:
- Campo per password attuale (verifica di sicurezza).
- Campo per nuova password con conferma.
- Hashing/aggiornamento sicuro su Supabase e feedback visivo immediato con toast di conferma.

---

## 📌 17. Spostamento Rookie in `an_player` & Gestione Archivio Storico Draft
- **Stato**: 🟡 Da Implementare
- **Priorità**: Alta (Ciclo completo di integrazione dei rookie nella Lega)
- **Moduli coinvolti**: `src/pages/Draft.tsx`, `src/pages/Scouting.tsx`, `src/pages/admin/AdminAutomazioni.tsx`
- **Tabelle coinvolte**: `an_rookie`, `an_player`, `an_draft_board`, eventuale colonna `stagione` in `an_rookie` o tabella archivio

### Descrizione
La tabella `an_player` è il registro ufficiale e centralizzato da cui dipendono tutte le rose, i moduli tattici e l'export del master file.
1. **Durante il Draft (Scelta Effettuata)**: Quando una squadra seleziona un rookie, il record deve essere spostato/inserito in `public.an_player` con `Squadra = pickingTeamId`, comparendo istantaneamente nella Rosa della squadra.
2. **Chiusura Automatica a Fine Draft**: Non appena viene effettuata l'ultima scelta del Draft (scelta #60 al termine del Round 5), tutti i rookie rimanenti non draftati vengono automaticamente trasferiti nella tabella `public.an_player` come svincolati (`Squadra = NULL`).
3. **Archivio & Storico Draft**: Per non perdere lo storico delle scelte e dei dati di scouting tra stagioni diverse, valutazione congiunta della soluzione migliore:
   - *Opzione A*: Aggiungere la colonna `stagione` a `public.an_rookie` (lo scouting mostrerà solo i rookie della stagione attiva, ma l'archivio storico rimarrà intatto e consultabile per gli anni passati).
   - *Opzione B*: Creazione di una tabella archivio `an_rookie_history` / `an_draft_history`.

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
- **Stato**: 🟢 Completato & Rilasciato in Produzione (Tabella creata su Supabase & Collegata)
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
- **Stato**: 🟢 Completato & Rilasciato in Produzione
- **Priorità**: Alta (Procedura chiave di transizione tra stagioni sportive)
- **Moduli coinvolti**: `src/pages/admin/AdminAutomazioni.tsx` (`/admin/automazioni`), `src/components/admin/AgingModal.tsx`, `src/services/playerAgingService.ts`, bacheca comunicati (`/comunicati`), tabelle `an_player`, `ea_player_db`
- **Tabelle coinvolte**: `an_player`, `ea_player_db`, `an_team_tactic`, `as_player_market`, `team_cuts_registry`, `league_announcements`, `league_automation_state`

### Descrizione
Procedura batch atomica eseguibile dal Super Admin per effettuare il passaggio d'anno/stagione sportiva su tutti i calciatori registrati nella Lega.

### Funzionalità Implementate
1. **Incremento Anagrafico & Allineamento EA FC 25**:
   - Aumento anagrafico di 1 anno (`Età = Età + 1`) per tutti i 449 calciatori attivi (`Squadra != 'RITIRATO' OR Squadra IS NULL`).
   - Sfasamento date di nascita (`DOB = DOB - 365` su `an_player` e `birthdate = birthdate - 365` su `ea_player_db`) per mantenere la sincronizzazione anagrafica con il motore EA FC 25.
   - I calciatori già nello status `RITIRATO` rimangono invariati e non vengono invecchiati.
2. **Matrice Ufficiale Decadimenti Fisico/Tecnici (11 Attributi)**:
   - Curve di decadimento fedeli alla matrice approvata:
     - *Fascia Giovani & Prime (<= 30 anni)*: nessun decadimento (250 calciatori).
     - *Transizioni 30 ➔ 31 e 31 ➔ 32*: RIFP: -2, TUFP: -2, TSTA: 0, ACCL: -5, VELO: -5, RESI: -5, FRZA: -1, AGIL: -1, ELEV: -3, RIFL: -2, EQLB: -1.
     - *Transizioni 32 ➔ 33 e 33 ➔ 34*: RIFP: -3, TUFP: -3, TSTA: -1, ACCL: -8, VELO: -8, RESI: -10, FRZA: -3, AGIL: -2, ELEV: -5, RIFL: -4, EQLB: -2.
   - **Regola di Salvaguardia (Floor Minimo)**: Nessun attributo scende al di sotto del valore minimo di **30** (`applyDecay(val, delta)`).
   - **Ricalcolo Automatico OVR**: Ricalcolo istantaneo del valore complessivo (`OVR` su `an_player` e `overallrating` su `ea_player_db`) basato sulle formule ponderate di ruolo ufficiali LCSIM (`calcOverall`).
3. **Gestione Ritiri Ufficiali (34 ➔ 35 anni)**:
   - I calciatori che raggiungono o superano i 35 anni (29 calciatori) passano immediatamente allo status `Squadra = 'RITIRATO'` e `NumeroMaglia = NULL` in `an_player`.
   - In `ea_player_db` viene impostato `isretiring = 1`.
   - Rimozione automatica dei calciatori ritirati dalle formazioni attive in `an_team_tactic` (starters, panchina e calci piazzati) e svincolo da mercati pendenti.
4. **Comunicato Ufficiale Automatico in Bacheca (`league_announcements`)**:
   - Pubblicazione automatica del comunicato ufficiale che include:
     - Elenco dei 29 calciatori ritirati con ruolo, OVR e squadra di appartenenza.
     - Elenco preventivo dei 40 veterani al loro ultimo anno di carriera (che hanno compiuto 34 anni ed entreranno nella loro ultima stagione prima del ritiro).
     - Riepilogo statistico delle curve applicate e dei calciatori coinvolti.
5. **Interfaccia Interattiva (`AgingModal`) nel Centro Automazioni**:
   - Card 2 in `/admin/automazioni` operativa con badge verde `🟢 Stagione & Ritiri • Operativo`.
   - Modale a schede con: Matrice Regole parametrizzata, Anteprima Decadimenti filtrabile e ricercabile, Elenco Ritiri Ufficiali, Elenco Veterani Ultima Stagione, Anteprima live del comunicato e Step di conferma prima dell'esecuzione atomica.
   - Funzione RPC Postgres `public.rpc_apply_player_aging` atomica con rollback automatico in caso di errore e aggiornamento di `league_automation_state`.

---

## 📌 11. Automatizzazione Start / Stop Calciomercato
- **Stato**: 🟢 Completato & Rilasciato in Produzione (Interruttore e blocco scambi/trattative attivi)
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

## 📌 12. Automatizzazione Blocca / Sblocca Rose & Blocco Formazioni Automatico
- **Stato**: 🟢 Completato & Rilasciato in Produzione
- **Priorità**: Media-Alta (Integrità delle rose e regolarità delle formazioni di campionato)
- **Moduli coinvolti**: `src/pages/admin/AdminAutomazioni.tsx`, `src/services/rosterLockService.ts`, `src/pages/Roster.tsx`, `src/pages/Allenamenti.tsx`, `src/pages/Tattica.tsx`, `src/components/FormationCountdown.tsx`
- **Tabelle coinvolte**: `league_automation_state`, `league_deadlines`, `team_cuts_registry`, `an_player_training`, `an_team_tactic`, `team_lineup_snapshots`

### Specifiche Implementate
1. **Blocco Rose (Roster Lock)**:
   - Controllato dall'Amministratore tramite toggle dedicato in `/admin/automazioni` (*"Controllo Congelamento Rose"*).
   - Memorizzato nella tabella di sistema `league_automation_state` con sottoscrizione Realtime attiva (`rosterLockService.ts`).
   - **Tagli Calciatori**: impedisce ai manager in `/mia-squadra/roster` (scheda *"Status di Mercato & Tagli"*) di aggiungere o rimuovere calciatori dalla lista tagli, disabilitando i pulsanti e visualizzando un banner informativo di blocco lega.
   - **Allenamenti & Punti XP**: impedisce ai manager in `/mia-squadra/allenamenti` di salvare nuovi piani di sviluppo o allocazioni XP finché le rose sono congelate, con banner e pulsanti di salvataggio disabilitati.
2. **Blocco Formazioni Automatico (Lineup Deadline Lock)**:
   - Funziona in maniera **completamente automatica ed indipendente** dal blocco manuale delle rose.
   - Si attiva allo scadere della data/ora impostata per la giornata in `league_deadlines` (o in caso di chiusura forzata d'emergenza impostata dall'admin).
   - Mostra il countdown dinamico in tempo reale (`FormationCountdown`) direttamente in cima alla lavagna tattica (`/mia-squadra/tattica`).
   - A scadenza avvenuta, per tutti i manager non-admin vengono bloccati i salvataggi della formazione, il pulsante *"Auto-Schiera Miglior 11"* e lo svuotamento, con relativo banner di avviso.
   - L'utente Amministratore mantiene un **Bypass Amministrativo** protetto per poter inserire formazioni d'ufficio o correggere eventuali problemi tecnici, con badge visivo esplicito `Admin Bypass`.
   - All'atto del salvataggio in tattica, viene generato o aggiornato automaticamente lo snapshot immutabile di giornata in `team_lineup_snapshots`.

---

## 📌 13. Hub Amministrazione Automazioni, Export Master Table & Import Classe Rookie
- **Stato**: 🟢 Completato & Rilasciato in Produzione (Export autonomo & Procedura Import Rookie 2-File integrata)
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
- **Stato**: 🟢 Completato & Testato
- **Priorità**: Media-Alta (Miglioramento dell'interazione sul mercato tra società)
- **Moduli coinvolti**: `src/pages/Trattative.tsx`, `src/pages/UfficialitaScambi.tsx`, `src/components/trades/TeamMarketNeedsCard.tsx`, `src/components/trades/LeagueMarketNeedsBoard.tsx`, `src/services/marketNeedsService.ts`, `src/types/marketNeeds.ts`
- **Tabelle coinvolte**: `public.team_market_needs` (`supabase/migrations/20261025_team_market_needs.sql`)

### Descrizione & Implementazione
1. **Pannello Manager (`TeamMarketNeedsCard` in `/mia-squadra/trattative`)**:
   - Card interattiva posizionata in testata alla pagina trattative del manager per configurare e salvare in tempo reale i propri bisogni di mercato.
   - Toggle istantanei per le **8 Macro-Categorie Ufficiali**:
     1. *Portieri* (`POR`)
     2. *Terzini* (`TD`, `TS`)
     3. *Difesa Interni* (`DC`)
     4. *Mediani* (`CDC`)
     5. *Centrocampisti* (`CC`)
     6. *Esterni* (`ED`, `ES`, `AD`, `AS`)
     7. *Trequartisti* (`COC`)
     8. *Attaccanti* (`ATT`, `AT`)
   - Gestione stato modifiche non salvate, pulsante ripristino, salvataggio atomico su Supabase e link rapido alla Bacheca di Lega.
2. **Bacheca Pubblica Unificata (`LeagueMarketNeedsBoard` in `/mercato/scambi`)**:
   - Sezione `/mercato/scambi` ristrutturata a schede:
     - **Tab 1 (Default / In Primo Piano)**: *Bisogni di Squadra (12 Club)* con panoramica interattiva delle 12 società, filtri rapidi per macro-categoria con contatori live di club interessati, ricerca testuale per squadra/ruolo e pulsante diretto *"Proponi Scambio"* (che pre-seleziona il destinatario in `/mia-squadra/trattative`).
     - **Tab 2**: *Ufficialità & Storico Scambi* con il feed degli scambi approvati e convalidati dalla Lega.
3. **Database Supabase**:
   - Creata tabella `public.team_market_needs` con vincolo di foreign key su `an_team("TEAM_ID")`, indici, RLS e inizializzazione automatica dei 12 club. Migrazione e rispettivo rollback archiviati in `supabase/migrations/20261025_team_market_needs.sql` e applicati con successo.

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
- **Stato**: 🟢 Completato & Rilasciato in Produzione (Scelta integrata con de-crittografia atomica in `an_player` ed `ea_player_db`)
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

---

## 📌 18. Match Center & Tabellino Partita Avanzato (SofaScore / Diretta.it Style)
- **Stato**: 🟡 Da Progettare / In Backlog
- **Priorità**: Bassa (Coinvolgimento visivo e analisi approfondita dei match)
- **Moduli coinvolti**: `src/pages/Calendario.tsx`, eventuale nuova pagina o modale `/partita/:id`
- **Tabelle coinvolte**: `view_team_stats`, `VIEW_PLAYER_STATS`, `"AS_TEAM_STAT"`, `"AS_PLAYER_STAT"`

### Descrizione
Evoluzione della schermata di dettaglio partita per trasformarla in un vero e proprio Match Center moderno:
1. **Barre Statistiche Comparative**:
   - Confronto visivo a barre percentuali affiancate Casa vs Trasferta: Possesso palla %, Tiri totali / in porta, Contrasti vinti %, Precisione passaggi %, Dribbling riusciti, Calci d'angolo, Falli e Fuorigioco.
2. **Timeline & Tabellino Eventi**:
   - Cronologia verticale con marcatori, assistman, cartellini gialli/rossi con minutaggio indicativo.
3. **Migliore in Campo (MVP)**:
   - Elezione automatica del migliore in campo della partita basato sul rating/voto più alto di giornata con badge dorato e statistiche chiave dell'incontro.

---

## 📌 19. Squadra della Settimana (Top 11 / TOTW) & Premi Speciali
- **Stato**: 🟡 Da Progettare / In Backlog
- **Priorità**: Bassa (Coinvolgimento community e riconoscimento performance manageriali)
- **Moduli coinvolti**: `src/pages/Statistiche.tsx`, widget dedicato in Homepage
- **Tabelle coinvolte**: `VIEW_PLAYER_STATS`, `an_player`, `an_team`

### Descrizione
1. **Top 11 di Giornata (Team of the Week)**:
   - Al termine di ogni giornata disputata, generazione automatica di un campo tattico 2D con la formazione ideale del turno: il portiere con voto/parate più alte, i 3 o 4 migliori difensori, i migliori centrocampisti e i migliori attaccanti.
   - Badge celebrativo TOTW temporaneo o storico per i calciatori selezionati.
2. **Classifiche Premi Stagionali Speciali**:
   - 🧤 **Golden Glove**: Classifica dei portieri con il maggior numero di Clean Sheet (partite a rete inviolata).
   - 🎯 **Re degli Assist**: Classifica dedicata ai rifinitori della Lega.
   - ⭐ **Miglior Rating Medio**: Top 10 assoluta per media voto (con soglia minima presenze es. 50% delle partite).

---

## 📌 20. Sala Stampa & Interviste Presidenti (Domande AI & Risposte Ufficiali)
- **Stato**: 🟢 Completato & Rilasciato in Produzione (Pagina dedicata unificata `/sala-stampa` & DB Supabase)
- **Priorità**: Media-Alta (Roleplay manageriale ed elemento social immersivo della Lega)
- **Moduli coinvolti**: `src/pages/SalaStampa.tsx`, `src/services/aiJournalistService.ts`, `src/components/home/PressAndRumorsHomeCard.tsx`, `src/pages/admin/AdminAutomazioni.tsx`
- **Tabelle coinvolte**: `press_conferences`, `an_team`, `an_standings`, `an_schedule`
- **Migrazione SQL**: `supabase/migrations/20261025_press_and_ai_rumors.sql`

### Descrizione & Risoluzione Tecnica
1. **Domande Differenziate per Club**: Ad ogni nuovo turno di campionato, il Giornalista AI genera domande uniche e su misura per ciascuno dei 12 presidenti/allenatori (variando temi: tattica, psicologia, scontro diretto, gestione dei leader, mercato, turnover).
2. **Visibilità Esclusiva Interviste Risposte**: Nella bacheca pubblica vengono mostrate **soltanto le interviste a cui il presidente ha effettivamente risposto**, garantendo pulizia e valore editoriale.
3. **Microfono Aperto**: Il manager autenticato la cui squadra ha una domanda pendente visualizza un box interattivo prioritario in cima alla pagina per rilasciare la dichiarazione ufficiale della società.

---

## 📌 21. Giornalista AI di Lega: Gossip & Rumor di Calciomercato (Always-On con Calciatori Reali)
- **Stato**: 🟢 Completato & Rilasciato in Produzione (Feed spontaneo, Reazioni Realtime & Zero Spoiler)
- **Priorità**: Media-Alta (Dinamismo dell'ecosistema, gossip e intrattenimento sportivo)
- **Tecnologie & Provider**: Motore ibrido: Google Gemini Flash (memorizzato in `league_automation_state` e `.env.local`) con generatore procedurale avanzato always-on (zero crash/downtime)
- **Moduli coinvolti**: `src/pages/SalaStampa.tsx`, `src/services/aiJournalistService.ts`, `src/pages/UfficialitaScambi.tsx`, `src/components/home/PressAndRumorsHomeCard.tsx`, `src/pages/admin/AdminAutomazioni.tsx`
- **Tabelle coinvolte**: `league_market_rumors`, `an_player`, `market_trades`, `team_market_needs`, `league_automation_state`
- **Migrazione SQL**: `supabase/migrations/20261025_press_and_ai_rumors.sql`

### Descrizione & Risoluzione Tecnica
1. **Generazione Spontanea durante la Giornata**: Rimossi i pulsanti manuali "a comando". Quando il mercato è aperto, i rumor emergono spontaneamente in background a intervalli temporali regolari durante la giornata.
2. **Inclusione di Calciatori Reali di Serie A**: Le notizie pescano ed integrano nomi e cognomi reali dei calciatori sotto contratto (`an_player`), ruoli e squadre di appartenenza (es. *Dave Lancaster, Francesco Ambrosio, Manuel Perdomo, Lars Svensson*, ecc.).
3. **Zero Spoiler & Badge Giornalistici Autentici**: Rimossi filtri di categoria ed etichette rivelatrici (*Fake News / Trattativa Distorta*). Ogni indiscrezione si presenta con veste verosimile (*"ESCLUSIVA"*, *"INDISCREZIONE"*, *"RETROSCENA"*, *"RADAR MERCATO"*, *"ULTIM'ORA"*), lasciando ai manager il gusto del dibattito.
4. **Reazioni Live**: I manager possono reagire istantaneamente ad ogni scoop con emoji (**🔥 Fuoco, 😂 Fake, 😱 Shock, 🤔 Dubbio**).

---

## 📌 22. Crittografia Zero-Knowledge Classe Rookie (AES-256) & Blind Database
- **Stato**: 🟢 Completato & Rilasciato in Produzione
- **Priorità**: Massima (Fair-play, trasparenza sportiva e protezione dati contro leakage da DB)
- **Moduli coinvolti**: `src/components/admin/ImportRookieModal.tsx`, `src/services/rookieImportService.ts`, `src/pages/Scouting.tsx`, `src/pages/Draft.tsx`, `src/services/draftWishlistService.ts`, `src/pages/ConfrontoGiocatori.tsx`
- **Tabelle & Funzioni coinvolte**: `an_rookie`, `internal_vault.rookie_key`, `rpc_import_encrypted_rookies`, `rpc_get_scouted_rookies`, `rpc_draft_rookie`, `rpc_undo_draft_rookie`
- **Migrazione SQL**: `supabase/migrations/20261024_rookie_encryption.sql` e rispettivo rollback

### Descrizione & Risoluzione Tecnica
1. **Blind Database**: Tutti i campi sensibili (OVR, POTN, Role1, Role2, Role3, Tratti, Emotion e tutti i 35 attributi fisici/tecnici) nella tabella `public.an_rookie` sono rigorosamente `NULL`. Qualsiasi utente o sviluppatore con accesso diretto al Table Editor di Supabase vede solo `NULL` e il blob binario crittografato `encrypted_data`.
2. **Passphrase Admin**: La passphrase segreta viene impostata dall'Admin neutrale della Lega nel modale di importazione in `/admin/automazioni`.
3. **Disclosure Selettiva nello Scouting**: La funzione `rpc_get_scouted_rookies` decifra in memoria i dati sul server PostgreSQL ed espone unicamente i dati autorizzati in base ai gettoni spesi dalla squadra chiamante (0G: solo anagrafica; 1G: range di 10; 2G: range di 3 + conteggio tratti + emotion; 3G: nomi tratti completi + ruoli tattici + piede debole/mabi; 5G: tutto sbloccato esatto).
4. **Protezione Network DevTools**: Le rappresentazioni dei range inviano al client valori punto medio del range, impedendo a chiunque di estrapolare il valore reale dal tab Network di Chrome.
5. **Integrazione Draft**: Quando un rookie viene scelto (`rpc_draft_rookie`), le sue statistiche vengono decifrate e scritte in `public.an_player` (entrando nella rosa della squadra) e in `public.ea_player_db`. In `an_rookie` i dati continuano a rimanere perennemente cifrati.
---

## 📌 23. Calcolo Stelle per Rookie (Formula Ufficiale a Percentili di Ruolo)
- **Stato**: 🟢 Completato & Testato (Implementato nell'Importazione Rookie & Allineato a DB)
- **Priorità**: Media-Alta
- **Moduli coinvolti**: `src/services/rookieImportService.ts`, `src/components/admin/ImportRookieModal.tsx`, `src/pages/Scouting.tsx`, `src/pages/Draft.tsx`
- **Tabelle coinvolte**: `an_rookie`, `an_player`, `an_team`

### Descrizione & Regole Ufficiali
Le stelle dei rookie (da 1 a 5 ⭐), impiegate per oscurare l'overall esatto ai manager prima dello scouting (Blind Database), vengono calcolate in base al rank del loro Overall rispetto alla distribuzione degli Overall dei calciatori sotto contratto all'inizio dell'offseason (Serie A attiva), raggruppati per posizione in campo (`Posiz`):

1. **1 Stella (⭐)**: Se l'overall del rookie è strettamente peggiore di tutti quanti i giocatori sotto contratto nel suo ruolo ($OVR < \min$).
2. **2 Stelle (⭐⭐)**: Se il rookie si posiziona tra il 75° ed il 100° percentile dal top dei giocatori sotto contratto nel suo ruolo.
3. **3 Stelle (⭐⭐⭐)**: Se il rookie si posiziona tra il 50° ed il 75° percentile dal top dei giocatori sotto contratto nel suo ruolo.
4. **4 Stelle (⭐⭐⭐⭐)**: Se il rookie si posiziona tra il 25° ed il 50° percentile dal top dei giocatori sotto contratto nel suo ruolo.
5. **5 Stelle (⭐⭐⭐⭐⭐)**: Se il rookie si posiziona tra il 1° ed il 25° percentile dal top dei giocatori sotto contratto nel suo ruolo (top tier).

> [!NOTE]
> Il calcolo valuta la posizione effettiva dell'overall del rookie come **rank** all'interno della graduatoria ordinata in modo decrescente (quanti giocatori nel ruolo sono strettamente migliori $+ 1$, rapportato a $N$ giocatori), non come scostamento numerico lineare tra massimo e minimo. Ruoli EA speciali come `'AT'` vengono mappati su `'ATT'`.

### Implementazione Architetturale
- **`fetchContractedPlayersRankings()`**: Funzione asincrona in `src/services/rookieImportService.ts` che interroga Supabase (`an_player` per squadre attive in `an_team` con `OVR` non nullo) e genera la mappa decrescente degli OVR per ruolo.
- **`calculateStelle(ovr, posiz, rankings)`**: Algoritmo che applica le 5 fasce di percentile con fallback sui range statici qualora i ranking di ruolo non siano disponibili.
- **Integrazione Import Modal (`ImportRookieModal.tsx`)**: L'analisi dei file e la preview import caricano dinamicamente i ranking aggiornati prima di generare l'anteprima e cifrare i dati.
- **Allineamento DB**: I record già censiti in `an_rookie` (es. Tiago Teixeira, ATT OVR 71, con $\min(\text{ATT}) = 74$) sono stati aggiornati a 1 ⭐.

---

## 📌 24. Calcolo XP Giocatori (Punti Esperienza Settimanali / Stagionali)
- **Stato**: 🟢 Completato & Testato (Formula ufficiale implementata, Service & Report UI in Allenamenti e Dettaglio Calciatore)
- **Priorità**: Alta
- **Moduli coinvolti**: `src/services/playerXpService.ts`, `src/pages/Allenamenti.tsx` (`SeasonalXpReportModal.tsx`), `src/components/player/playerDetails.tsx` (`PlayerXpBreakdownModal.tsx`)
- **Tabelle coinvolte**: `"AS_PLAYER_STAT"`, `an_player`, `an_schedule`

### Formula Ufficiale Implementata
La formula aggrega per ciascun calciatore i punti XP maturati in ogni singola giornata disputata:

1. **XP Minuti in campo (singola partita)**:
   - Se il calciatore non è entrato in campo (0 minuti): **0 XP**.
   - Altrimenti: **1 XP ogni 20 minuti giocati** (arrotondato per eccesso all'unità), fino a un massimo di **5 XP** (es. 1-20 min $\to$ 1 XP; 21-40 min $\to$ 2 XP; 41-60 min $\to$ 3 XP; 61-80 min $\to$ 4 XP; 81+ min $\to$ 5 XP).
2. **XP dal Voto (singola partita)**:
   - Se il calciatore non ha ricevuto voto (S.V. o assente): **2 XP**.
   - Altrimenti: $\lfloor (\text{Voto} - 3) \times 2 \rfloor$ (arrotondato per difetto all'unità).
3. **Totale Singola Partita**:
   - $\text{XP}_{\text{partita}} = \text{XP}_{\text{minuti}} + \text{XP}_{\text{voto}}$ (sempre numero intero).
4. **Aggregazione Stagionale (Regular Season vs Playoff)**:
   - **Regular Season**: somma di tutte le partite disputate (11 giornate nella Lega a 12 squadre della Stagione 11; 9 giornate per la Lega a 10 squadre delle Stagioni $\le$ 10).
   - **Playoff**: si considerano **solamente le migliori prestazioni** per ovviare al diverso numero di incontri tra le squadre:
     - Dalla **Stagione 11 (12 squadre)**: **top 3 migliori match** di playoff.
     - Fino alla **Stagione 10 (10 squadre)**: **top 2 migliori match** di playoff.
5. **Bonus Crescita Giovani (24 e 25 anni)**:
   - Ai calciatori che all'atto della stagione hanno **24 o 25 anni** viene applicato un moltiplicatore di **$\times 1.1$ (+10%)**, simulando la crescita aumentata dei giovani.
6. **Moltiplicatore Generale di Lega & Target Pool**:
   - Calibrato per garantire uniformità e comparabilità statistica tra stagioni diverse a prescindere da variazioni di gameplay:
     - Target storico per Lega a 10 squadre $\times$ 21 giocatori: **circa 20.000 XP**.
     - Target per la nuova Lega a 12 squadre $\times$ 21 giocatori: **circa 24.000 XP**.
   - $\text{XP}_{\text{finali}} = \text{round}(\text{XP}_{\text{giovane}} \times \text{MoltiplicatoreStagionale})$.

### Componenti & Interfaccia
- **`src/services/playerXpService.ts`**: motore di calcolo puro con supporto per formati dinamici per stagione, fetch delle statistiche da `AS_PLAYER_STAT` e riepiloghi di squadra/lega.
- **`SeasonalXpReportModal.tsx` in Allenamenti (`/mia-squadra/allenamenti`)**: dashboard analitica con statistiche di squadra (totale XP, media, top earner, bonus giovani), tabella rosa filtrabile per ruolo/nome ed espansione a fisarmonica con il referto partita per partita (minuti, voto, XP parziali, badge per match inclusi o scartati nei playoff).
- **`PlayerXpBreakdownModal.tsx` in Dettaglio Calciatore (`playerDetails.tsx`)**: pill interattiva `XP: {valore}` nell'intestazione della scheda calciatore che apre il popup dedicato con la timeline stagionale delle sue prestazioni.

---

## 📌 25. Calcolo Peggioramenti Giocatori (In-Season / Prestazionali)
- **Stato**: 🟡 In attesa di definizione & implementazione
- **Priorità**: Media-Alta
- **Moduli coinvolti**: Gestione Rose, Allenamenti, Automazioni Admin
- **Tabelle coinvolte**: `an_player`, `ea_player_db`, `an_player_training`

### Descrizione
Meccanica di decadimento/peggioramento dinamico degli attributi nel corso dell'anno (distinta dall'invecchiamento anagrafico di fine stagione):
- Criteri di calo prestazionale legati a scarso impiego (mancate convocazioni, scarso minutaggio prolungato), infortuni o rendimento gravemente insufficiente per fasce over 30.
- Definizione della soglia minima di salvaguardia e modalità di applicazione (manuale via Admin o calcolata a milestone).

---

## 📌 26. Curva di Crescita ed Esperienza del Calciatore (Popup Dettaglio Giocatore)
- **Stato**: 🟡 In attesa di implementazione
- **Priorità**: Media
- **Moduli coinvolti**: Modale dettaglio calciatore (`src/components/player/PlayerDetailModal.tsx` o componenti correlati in Rose/Scouting)
- **Tabelle coinvolte**: `an_player`, `an_player_training`, storico XP

### Descrizione
Visualizzazione grafica intuitiva (grafico temporale o progression bar multi-stadio) della curva di crescita del calciatore:
- Mostrare all'interno del popup di dettaglio l'evoluzione dell'esperienza (XP attuali, XP necessari per il prossimo step di OVR/attributo).
- Visualizzazione della curva di potenziale e trend di sviluppo teorico in base all'età del giocatore.

---

## 📌 27. Inserimento Partite Manuale da Interfaccia Web & Export CSV
- **Stato**: 🟡 In attesa di implementazione
- **Priorità**: Alta
- **Moduli coinvolti**: Area Amministrazione Partite / Calendario (`src/pages/admin/`)
- **Tabelle coinvolte**: `an_schedule`, `"AS_TEAM_STAT"`, `"AS_PLAYER_STAT"`, `an_standings`

### Descrizione
Interfaccia web dedicata per l'inserimento manuale dei dati e dei referti delle partite:
- Possibilità per l'Admin di compilare direttamente da form web il tabellino partita (risultato, statistiche squadra, voti, gol, cartellini e dettagli individuali).
- Tasto dedicato **"Export CSV"** in grado di esportare i match inseriti o l'intera giornata in un formato CSV standard predefinito (compatibile sia con il parser di importazione sia con gli archivi storici).

---

## 📌 28. Unificazione & Perfezionamento Sezione Allenamenti (Ruoli, Ruoli+ e Tratti Ufficiali)
- **Stato**: 🟢 Completato & Testato
- **Priorità**: Alta
- **Moduli coinvolti**: `src/pages/Allenamenti.tsx`, `src/components/training/UnifiedRoleAndTraitSystem.tsx`, `src/types/training.ts`
- **Tabelle coinvolte**: `an_player_training`, `an_player`, `ea_player_db`
- **Migrazioni**: `supabase/migrations/20261024_sync_training_specializations.sql`

### Specifiche Implementate
1. **Unificazione UI e Architettura Bozza (Zero scritture premature su an_player e ea_player_db)**:
   - Riscrittura completa della logica: eliminata qualsiasi modifica diretta su `an_player` durante la fase di composizione dell'allenamento.
   - Bozza memorizzata in React state e salvata atomicamente in `public.an_player_training` come semplice bozza utente (`status = 'draft'`).
   - **Isolamento Master Data EA FC 25**: la tabella master `public.ea_player_db` **NON** viene modificata durante i salvataggi di bozza dell'utente. La funzione di sincronizzazione `recompute_ea_player_from_an_and_training` proietta gli aumenti e le specializzazioni su `ea_player_db` **esclusivamente quando l'allenamento viene confermato/approvato dall'Amministratore (`status = 'confirmed'`)**.
   - Il pulsante *"Reset ai Valori Originali"* rimuove la bozza da `an_player_training` e ripristina la visualizzazione pulita senza corrompere la scheda base.
   - Schede unificate da 3 a 2: Scheda 1 *"Gruppi Attributi"* e Scheda 2 *"Ruoli & Tratti Speciali"* (`UnifiedRoleAndTraitSystem.tsx`).
2. **Ruolo Principale & Ruoli+ Ufficiali (44 Ruoli da FC 25)**:
   - Cambio Ruolo Principale: **40 XP** (include la scelta del 1° Ruolo+ della nuova posizione).
   - 1° Ruolo+: **Gratuito** se assente nella scheda di base.
   - 2° Ruolo+: **100 XP** (massimo 2 Ruoli+ totali).
   - Swap Ruolo+: **60 XP** per scambiare un ruolo tattico con un altro compatibile.
   - Upgrade a Ruolo++: **100 XP** riservato a calciatori con $\ge 84$ OVR stimato (massimo 1 Ruolo++ per giocatore).
3. **Tratti & Stili di Gioco (36 Tratti Ufficiali con Requisiti Dinamici)**:
   - Tratto Argento: **60 XP** per l'acquisto; **40 XP** per l'eliminazione di un tratto pre-esistente dalla scheda base.
   - Tratto Oro (PlayStyle+):
     - **Gratuito** al raggiungimento di $\ge 84$ OVR per il 1° sblocco (promozione automatica a Oro con 1 solo tratto posseduto; selezione gratuita a scelta con 2 o più tratti; promozione automatica del 1° tratto acquistato se ne ha 0).
     - **70 XP** per scambiare lo status Oro tra due tratti quando uno è già presente (lo status Oro si sposta al nuovo e il precedente torna Argento).
     - Massimo 5 tratti totali per giocatore, massimo 1 Tratto Oro.
   - Verifica dinamica dei requisiti minimi in tempo reale calcolata su `postStats`, consentendo di sbloccare tratti nel momento esatto in cui vengono potenziati gli attributi collegati.


---

## 📌 29. Ottimizzazione Barra Superiore (Navbar Sticky, Rimozione Layout Shift & Dropdown Non-Modal)
- **Stato**: 🟢 Completato & Testato
- **Priorità**: Alta
- **Moduli coinvolti**: `src/components/Navbar.tsx`, `src/components/NotificationsMenu.tsx`, `src/components/ui/dropdown-menu.tsx`, `src/index.css`

### Descrizione & Risoluzione Bug
1. **Rimozione Scostamento Orizzontale (UI Shift / Jitter)**:
   - I menu a discesa Radix UI (`DropdownMenu`) usavano il default `modal={true}`, scatenando la rimozione della scrollbar e l'iniezione di margini sul `body` calcolati da `react-remove-scroll` (causando il salto a sinistra di 17px).
   - Impostato `modal={false}` come default per tutti i dropdown in [`dropdown-menu.tsx`](file:///d:/Users/Stefano/Documents/LCSIM_Website/lcsim-website/src/components/ui/dropdown-menu.tsx) e applicato esplicitamente su tutti i menu della [`Navbar`](file:///d:/Users/Stefano/Documents/LCSIM_Website/lcsim-website/src/components/Navbar.tsx) e [`NotificationsMenu`](file:///d:/Users/Stefano/Documents/LCSIM_Website/lcsim-website/src/components/NotificationsMenu.tsx).
   - In [`index.css`](file:///d:/Users/Stefano/Documents/LCSIM_Website/lcsim-website/src/index.css) aggiunto `scrollbar-gutter: stable` e azzerato `--removed-body-scroll-bar-size` e padding/margin sul body bloccato.
2. **Permanenza Barra Superiore allo Scrolling (Top Bar Permanentemente Visibile)**:
   - Quando l'utente era sceso con lo scroll e cliccava sulla barra superiore, il precedente scroll lock modale applicava `overflow: hidden` a livello di `body`, rompendo la proprietà CSS `position: sticky` del container `<nav>` e provocando la scomparsa della barra (rimasta ancorata a Y=0 fuori dal viewport) e il congelamento dello scroll.
   - Con la navigazione non-modale e `<nav className="sticky top-0 z-50 w-full ...">`, la barra superiore rimane permanentemente visibile, ancorata in cima durante qualsiasi livello di scorrimento, e l'interazione con i menu non blocca mai lo scorrimento della pagina.
---

## 📌 30. Sconto su Cambio Ruolo per Calciatori con Presenze da Titolari
- **Stato**: 🟡 In attesa di definizione & implementazione
- **Priorità**: Media-Alta (Valorizzazione dell'esperienza in campo e continuità tattica)
- **Moduli coinvolti**: `src/pages/Allenamenti.tsx`, `src/services/playerXpService.ts`, `an_player_training`
- **Tabelle coinvolte**: `"AS_PLAYER_STAT"`, `an_player_training`, `an_player`

### Descrizione
Meccanica nella sezione Allenamenti (`/mia-squadra/allenamenti`) che premia la continuità di impiego dei calciatori:
- Se un calciatore ha disputato almeno **$X$ partite da titolare** (con minutaggio $\ge 60'$ o titolare da distinta) nel corso della stagione, il costo XP per il **Cambio di Ruolo Principale** (attualmente standard a 40 XP) viene ridotto o azzerato.
- Definizione della soglia minima di match (es. 5 o 7 partite) e calcolo dinamico dello sconto all'apertura della scheda di allenamento.

---

## 📌 31. Ridenominazione File di Export Master DB in `players.txt`
- **Stato**: 🟡 In attesa di implementazione
- **Priorità**: Media (Allineamento con standard di importazione EA FC 25)
- **Moduli coinvolti**: `src/pages/admin/AdminAutomazioni.tsx`, `src/services/eaPlayerDbService.ts`
- **Tabelle coinvolte**: `ea_player_db`, `an_player`, `an_rookie`

### Descrizione
Nella card dell'Hub Automazioni Admin dedicata all'**Export Master Table EA FC 25**, il download del file tabellare a 137 colonne (attualmente salvato come `DB_NEW.txt`) deve essere ridenominato ufficialmente in **`players.txt`**:
- Garantisce l'immediata compatibilità "drag & drop" con i tool e gli editor interni di EA Sports FC 25 senza richiedere rinomine manuali da parte dell'Admin.

---

## 📌 32. Logica Scelte Compensatorie al Draft
- **Stato**: 🟡 In attesa di definizione & implementazione
- **Priorità**: Media-Alta (Equità sportiva e gestione dei disallineamenti di lega)
- **Moduli coinvolti**: `src/pages/Draft.tsx`, `src/pages/admin/AdminAutomazioni.tsx`
- **Tabelle coinvolte**: `public.an_draft_board`, `public.an_team`

### Descrizione
Integrazione e regolamentazione delle **scelte compensatorie** nel tabellone del Draft:
- Assegnazione di pick supplementari a società che abbiano subito perdite di asset non imputabili a dinamiche di mercato o criteri speciali stabiliti dal regolamento di Lega.
- Gestione della collocazione nel tabellone (es. slot di coda nei round 1, 2 o 3, oppure round compensatorio dedicato) con aggiornamento automatico della vista 60+ scelte in `Draft.tsx` e della funzione atomica di ripristino board.

---

## 📌 33. Tagli di Calciomercato su Numero Totale di Asset (Calciatori + Scelte Draft)
- **Stato**: 🟡 In attesa di definizione & implementazione
- **Priorità**: Alta (Evoluzione strategica del calciomercato e del roster management)
- **Moduli coinvolti**: `src/pages/Roster.tsx`, `src/services/cutsService.ts`, `src/pages/admin/AdminAutomazioni.tsx`
- **Tabelle coinvolte**: `team_cuts_registry`, `an_player`, `an_draft_board`

### Descrizione
Evoluzione della regola di conformità della rosa durante la finestra dei tagli:
- Attualmente la regola verifica il numero di calciatori sotto contratto (minimo 13, massimo 16).
- La nuova logica estende il controllo al **totale complessivo degli asset societari**:
  $$\text{Totale Asset} = \text{Numero Calciatori in Rosa} + \text{Scelte del Draft Possedute}$$
- Definizione dei tetti massimi consentiti e aggiornamento dei contatori in `Roster.tsx` e della card di validazione Admin.

---

## 📌 34. Visualizzazione Magliette Ufficiali nella Pagina Rosa
- **Stato**: 🟡 In attesa di implementazione
- **Priorità**: Media (Arricchimento estetico e immersione grafica del club)
- **Moduli coinvolti**: `src/pages/Roster.tsx` (`/mia-squadra/roster`), `src/pages/Squadre.tsx`, componenti profilo calciatore
- **Tabelle & Asset coinvolti**: Cartella `/images/teams/` o `/images/jerseys/`, colonna `NumeroMaglia` in `an_player`

### Descrizione
Introduzione della grafica delle magliette di gioco nella scheda dei calciatori:
- Mostrare accanto all'avatar del volto (o come badge grafico dedicato) la maglietta ufficiale del club (divisa Home/Away) con il numero di maglia effettivo impresso sopra.
- Migliora l'impatto visivo della rosa e consente un colpo d'occhio immediato sulla numerazione assegnata ai giocatori.

---

## 📌 35. Invecchiamento Solo Anagrafico per Calciatori Ritirati (Senza Decadimenti Statistiche)
- **Stato**: 🟡 In attesa di implementazione
- **Priorità**: Alta (Integrità storica dei dati delle vecchie glorie)
- **Moduli coinvolti**: `src/services/playerAgingService.ts`, funzione SQL Postgres `rpc_apply_player_aging`
- **Tabelle coinvolte**: `public.an_player`, `public.ea_player_db`

### Descrizione
Rettifica della procedura batch di transizione stagionale (`rpc_apply_player_aging`):
- Per i calciatori che risultano già ritirati (`Squadra = 'RITIRATO'`), la procedura deve incrementare **esclusivamente l'età anagrafica** (`Età = Età + 1`), in modo da mantenere coerente lo scorrere degli anni sportivi.
- Viene rigorosamente **esclusa qualsiasi alterazione degli 11 attributi fisici/tecnici** e del valore di OVR, preservando intatta e immutabile la scheda tecnica con cui il calciatore ha concluso la propria carriera.

---

## 📌 36. Segnalazione Calciatori con Ritiro Annunciato (Veterani all'Ultimo Anno)
- **Stato**: 🟡 In attesa di implementazione
- **Priorità**: Media-Alta (Trasparenza contrattuale, valutazioni di mercato e pianificazione rosa)
- **Moduli coinvolti**: `src/components/player/playerDetails.tsx`, `src/pages/Roster.tsx`, `src/pages/Trattative.tsx`, liste mercato
- **Tabelle coinvolte**: `an_player`

### Descrizione
Identificazione visiva esplicita dei calciatori che disputeranno la loro ultima stagione:
- In base al regolamento, i calciatori al compimento dei 35 anni passano automaticamente allo status `RITIRATO`.
- Per tutti i calciatori di **34 anni** attivi in rosa, inserire un badge di avviso distintivo (es. `⏳ Ultima Stagione • Ritiro Annunciato`) nel popup giocatore, nel roster e nelle schermate di trattativa/scambio, consentendo a tutti i manager di sapere che il calciatore si ritirerà al termine del campionato in corso.

---

## 📌 37. Evidenziazione Modifiche Formazione Rispetto alla Settimana Precedente
- **Stato**: 🟡 In attesa di implementazione
- **Priorità**: Media-Alta (Supporto avanzato per caster, commentatori e analisi avversaria)
- **Moduli coinvolti**: `src/pages/FoglioCommento.tsx`, `src/components/home/OpponentScoutModal.tsx`, `src/pages/Tattica.tsx`
- **Tabelle coinvolte**: `public.team_formation_history`, `public.an_team_tactic`

### Descrizione
Confronto automatico tra la formazione schierata nella settimana corrente e quella della settimana precedente:
- Nel **Foglio Commento** (`/campionato/foglio-commento`) e nel popup di **Scouting Avversaria** in Homepage:
  - Evidenziare sul campo 2D con icone/badge cromatici le novità rispetto all'ultimo incontro (es. *"Nuovo Titolare"*, *"Sostituzione Ruolo"*, *"Modulo Variato"*).
  - Segnalare chi tra i titolari della settimana precedente è finito in panchina o in tribuna, fornendo una lettura immediata delle scelte tecniche dell'allenatore.

---

## 📌 38. Sistema Diffide e Squalifiche da Cartellini
- **Stato**: 🟡 In attesa di definizione & implementazione
- **Priorità**: Alta (Regolarità disciplinare del campionato)
- **Moduli coinvolti**: `src/pages/Tattica.tsx`, `src/pages/FoglioCommento.tsx`, gestione partite
- **Tabelle coinvolte**: `"AS_PLAYER_STAT"`, `an_player`, `team_formation_history`

### Descrizione
Tracciamento e applicazione automatica dei provvedimenti del Giudice Sportivo:
- Conteggio progressivo delle ammonizioni (`GIALLI`) ed espulsioni dirette o per doppio giallo (`ROSSI`) dal tabellino partite.
- **Diffida**: badge visivo di avvertimento quando il calciatore è a 1 giallo dalla squalifica.
- **Squalifica**: al raggiungimento della soglia disciplinare (es. 4 ammonizioni) o a seguito di cartellino rosso, il calciatore viene squalificato per la giornata successiva:
  - In `Tattica.tsx` compare un badge rosso `🚫 Squalificato` con divieto assoluto di schierarlo tra gli 11 titolari o in panchina.
  - Avviso nel Foglio Commento per i commentatori.

---

## 📌 39. Panchina da 9 Calciatori e 1 Giocatore in Tribuna
- **Stato**: 🟡 In attesa di implementazione
- **Priorità**: Alta (Adeguamento al regolamento ufficiale e alle rose da 21)
- **Moduli coinvolti**: `src/pages/Tattica.tsx`, `src/pages/FoglioCommento.tsx`, `src/components/tactics/`
- **Tabelle coinvolte**: `an_team_tactic`, `team_formation_history`

### Descrizione
Adeguamento della distinta gara nelle pagine Tattica e Foglio Commento:
- Nelle rose standard da 21 calciatori con 11 titolari:
  - La **Panchina** deve ospitare esattamente **9 riserve** ordinate per priorità di subentro.
  - Il 21° calciatore (ed eventuali ulteriori esuberi) viene alloggiato in una sezione dedicata denominata **"Tribuna"** (non disponibile per le sostituzioni a partita in corso).
- Aggiornamento della logica di validazione e salvataggio in `Tattica.tsx` per gestire formalmente l'assegnazione alla tribuna.

---

## 📌 40. Possibilità di Scegliere Giocatori Svincolati al Draft (Oltre ai Rookie)
- **Stato**: 🟡 In attesa di definizione & implementazione
- **Priorità**: Alta (Flessibilità delle chiamate al Draft)
- **Moduli coinvolti**: `src/pages/Draft.tsx`, `src/services/draftWishlistService.ts`, modale scelta draft
- **Tabelle coinvolte**: `public.an_draft_board`, `public.an_player`, `public.an_rookie`

### Descrizione
Estensione delle opzioni di selezione durante il Draft di Lega:
- Consentire a un club di utilizzare il proprio turno di scelta per tesserare un **calciatore svincolato** già presente nel database (`an_player` con `Squadra IS NULL`), in alternativa a un prospetto della classe rookie (`an_rookie`).
- **Regola di Integrità DB**: i calciatori svincolati **NON** devono essere duplicati o inseriti nella tabella `an_rookie`.
- All'atto della chiamata della scelta, il giocatore svincolato viene contrattualizzato direttamente (`an_player.Squadra = pickingTeamId`), registrando la scelta in `an_draft_board`.

---

## 📌 41. Controllo di Salvaguardia Portieri sui Tagli di Calciomercato
- **Stato**: 🟡 In attesa di implementazione
- **Priorità**: Alta (Integrità sportiva delle rose e prevenzione blocchi formazioni)
- **Moduli coinvolti**: `src/pages/Roster.tsx` (`/mia-squadra/roster`), `src/services/cutsService.ts`, `src/pages/admin/AdminAutomazioni.tsx`
- **Tabelle coinvolte**: `team_cuts_registry`, `an_player`

### Descrizione
Regola di blocco preventivo nella procedura di taglio dei calciatori:
- Nessuna squadra può completare o confermare un taglio che lasci la rosa con **meno di 2 portieri di ruolo** (`Posiz = 'POR'`).
- In `Roster.tsx`: se una squadra ha solo 2 portieri in rosa, l'azione di taglio (`✂️ Taglia`) sui portieri viene automaticamente disabilitata con tooltip esplicito (*"Obbligatorio mantenere almeno 2 portieri in rosa"*).
- Nel pannello Admin: controllo server/RPC che rigetta l'ufficializzazione dei tagli qualora un club risultasse non conforme su questo requisito.

---

## 📌 42. Obbligo Portiere all'Ultima Scelta del Draft (Salvaguardia Minimo 2 Portieri)
- **Stato**: 🟡 In attesa di implementazione
- **Priorità**: Alta (Integrità della rosa e rispetto dei requisiti di ruolo)
- **Moduli coinvolti**: `src/pages/Draft.tsx`, `src/services/draftWishlistService.ts`, modale di selezione/chiamata pick
- **Tabelle coinvolte**: `public.an_draft_board`, `public.an_player`, `public.an_rookie`

### Descrizione
Regola di salvaguardia obbligatoria durante il Draft di Lega per garantire che ogni franchigia termini l'evento con il contingente minimo di estremi difensori (almeno 2 portieri):
- Se una squadra arriva alla sua **ultima scelta del draft** e possiede attualmente **un solo portiere in rosa** (sommando i portieri già sotto contratto e gli eventuali portieri selezionati nelle pick precedenti dello stesso draft):
  - Il sistema **obbliga la squadra a selezionare un portiere** (`Posiz = 'POR'`), sia esso un rookie (`an_rookie`) o un calciatore svincolato (`an_player`).
  - La lista dei giocatori selezionabili nel modale di pick (e la wishlist) disabilita tutti i calciatori di movimento di ruoli diversi (`DIF`, `CEN`, `ATT`), con un banner di avviso esplicito: *"Avviso Regolamento: Avendo un solo portiere a roster, sei obbligato a selezionare un portiere con la tua ultima scelta a disposizione"*.

---

## 📌 43. Tetto Massimo di 3 Portieri in Rosa (Blocco Scambi e Blocco Chiamata al Draft)
- **Stato**: 🟡 In attesa di implementazione
- **Priorità**: Alta (Regolamento composizione rosa ed equilibrio numerico)
- **Moduli coinvolti**: `src/pages/Trattative.tsx`, `src/services/tradeService.ts`, `src/pages/Draft.tsx`, RPC scambi e draft
- **Tabelle coinvolte**: `public.an_player`, `public.market_trades`, `public.an_draft_board`

### Descrizione
Nessuna società sportiva può possedere contemporaneamente più di **3 portieri di ruolo** (`count(POR) <= 3`) sotto contratto. Questo tetto massimo si applica in due snodi chiave di gestione:
1. **Calciomercato & Scambi (`Trattative.tsx` / `tradeService.ts`)**:
   - In fase di formulazione o controproposta di uno scambio, il sistema verifica preventivamente il saldo dei portieri scambiati per ciascuna squadra.
   - Non è consentito confermare, inviare o approvare alcuna proposta di scambio che porterebbe una delle due squadre a superare il limite di 3 portieri in rosa (es. se una squadra ha già 3 portieri e acquisisce un portiere senza cederne almeno uno, o se ne ha 2 e ne acquisisce 2 cedendone 0).
   - Segnalazione d'errore immediata a video: *"Operazione non consentita: la squadra {Nome} supererebbe il limite massimo consentito di 3 portieri in rosa"*.
2. **Draft di Lega (`Draft.tsx`)**:
   - Se una squadra ha già raggiunto la quota massima di **3 portieri** (tra rosa pre-esistente ed eventuali portieri chiamati nei round precedenti del draft in corso):
     - L'opzione di selezionare ulteriori portieri (`Posiz = 'POR'`) viene interdetta e oscurata nel modale di chiamata.
     - Tooltip esplicito: *"Limite raggiunto: hai già 3 portieri in rosa, non puoi selezionarne altri"*.

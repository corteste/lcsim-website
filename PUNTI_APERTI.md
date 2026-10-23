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
- **Stato**: 🟡 Da Progettare / In Backlog
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
- **Stato**: 🟡 Da Progettare / In Backlog
- **Priorità**: Alta (Strumento centrale per caster, commentatori, spettatori e manager)
- **Moduli coinvolti**: Nuova pagina (es. `/foglio-commento` o `/calendario/giornata/:week/formazioni`), componente campo tattico 2D

### Valutazione Fattibilità: 🟢 Pienamente Fattibile
- **Descrizione**:
  - Una pagina pubblica accessibile a tutta la community che visualizza le formazioni ufficiali di tutti gli incontri della giornata, **sbloccata e visibile solo dopo la chiusura delle formazioni** (nessuno può spiare lo schieramento avversario prima della deadline).
  - **Layout & Funzionalità Foglio Partita**:
    - Selettore giornata (`Giornata 1`, `Giornata 2`, ...).
    - Elenco dei match della giornata: per ciascun match, card affiancata Casa vs Trasferta:
      - **Campi Tattici 2D affiancati** (o speculari) con modulo (es. 4-3-3 vs 3-5-2), maglie, nomi e ruoli degli 11 titolari.
      - **Panchina** con riserve a disposizione ordinate per ruolo e OVR.
      - **Incarichi / Calci piazzati**: Capitano, Rigorista, Punizioni, Corner.
      - Pulsante per esportare o condividere il foglio gara (es. screenshot o vista pulita per la diretta streaming / telecronaca).

---

## 📌 5. Archivio Storico delle Formazioni Salvate (Punto 9)
- **Stato**: 🟡 Da Progettare / In Backlog
- **Priorità**: Media-Alta (Essenziale per alimentare il Foglio Commento e lo storico stagionale)
- **Tabelle coinvolte**: Nuova tabella `an_match_lineup` o `team_lineup_history`

### Valutazione Fattibilità: 🟢 Pienamente Fattibile
- **Descrizione**:
  - Attualmente la tabella `an_team_tactic` memorizza solo una formazione attiva per squadra (sovrascritta ad ogni salvataggio).
  - **Nuova tabella archivio formazioni**:
    - Struttura: `id`, `team_id`, `stag` (es. 11), `week` (1..22), `formation_id`, `starting_11` (array JSON con player_id, x, y, ruolo), `bench` (array player_id), `roles` (capitano, rigorista, ecc.), `submitted_at`.
  - **Vantaggi e Utilizzo**:
    1. **Storico Partite**: Al termine della scadenza, la formazione attiva di ogni squadra viene duplicata/congelata per quella specifica giornata (`week`).
    2. **Alimentazione Foglio Commento**: Il Foglio Commento legge direttamente lo snapshot congelato della rispettiva giornata.
    3. **Ripristino Formazioni**: In `Tattica.tsx`, il manager può aprire una tendina *"Carica formazione passata"* per riutilizzare una disposizione usata nelle giornate precedenti.


---

## 📌 6. Sistema Giocatori Preferiti / Watchlist (Draft, Scouting & Free Agent)
- **Stato**: 🟡 Da Progettare / In Backlog
- **Priorità**: Media-Alta (Miglioramento essenziale per l'usabilità durante il mercato e il draft)
- **Moduli coinvolti**: `src/pages/Draft.tsx`, `src/pages/Scouting.tsx`, `src/pages/ListaGiocatori.tsx` (Free Agent), Supabase
- **Tabelle coinvolte**: Nuova tabella `team_player_favorites` (o `user_player_favorites`)

### Valutazione Fattibilità: 🟢 Pienamente Fattibile & Immediata
- **Descrizione**:
  - Permette a ciascun manager di contrassegnare rapidamente qualsiasi calciatore (Rookie al Draft, prospetto nella pagina Scouting, o Free Agent svincolato) con una **stellina / segnalibro** (⭐).
  - **Integrazione Trasversale**:
    - **Pagina Scouting (`/scouting`)**: Il manager mentre spende token di scouting o analizza i report può cliccare sulla stellina per salvare il rookie tra i suoi preferiti.
    - **Pagina Draft (`/draft`)**:
      - Nel tabellone o nella modale di selezione della scelta compare il filtro rapido **"⭐ Solo Preferiti"**.
      - I rookie preferiti hanno un'evidenziazione visiva distinta (es. bordo dorato o badge stellina) per essere individuati all'istante senza dover scorrere decine di profili durante il proprio turno.
    - **Lista Giocatori / Mercato Free Agent**: Funziona identicamente per tenere d'occhio svincolati o talenti di altre squadre.
  - **Architettura Tecnica**:
    - Tabella Supabase: `team_player_favorites(id, team_id, player_id, created_at)` con vincolo univoco `(team_id, player_id)`.
    - RLS per garantire che ciascun manager veda e modifichi solo la propria lista privata.

---

## 📌 7. Lista di Priorità Draft & Autopick per Manager Assenti
- **Stato**: 🟡 Da Progettare / In Backlog
- **Priorità**: Alta (Risolve il problema critico dei blocchi del Draft Live dovuti all'assenza di un manager)
- **Moduli coinvolti**: `src/pages/Draft.tsx`, Supabase RPC
- **Tabelle coinvolte**: Nuova tabella `draft_team_wishlist` (o estensione di `an_draft_board`), collegamento con `team_player_favorites`

### Specifiche Approvate: 🟢 Pronte per lo Sviluppo
- **Descrizione**:
  - Sostituisce o potenzia la vecchia idea "degli interessi per ruolo" trasformandola in una **Priority Queue / Draft Board Personale**.
  - Prima della serata del Draft, ciascun manager può comporre la propria lista segreta ordinata dei Rookie desiderati (1°, 2°, 3°, 4°, ... fino a $N$ scelte).
  - La lista è **100% privata e segreta** (RLS su Supabase), riordinabile via Drag-and-Drop o frecce Su/Giù e popolabile direttamente dai **Preferiti (Punto 6)**.
  - **Attivazione Autopick**:
    - **Manager**: Toggle dedicato nella pagina Draft / Mia Squadra (*"Attiva Autopick / Sono Assente al Draft"*).
    - **Admin**: Pulsante d'emergenza nel pannello di controllo Draft per forzare l'esecuzione dell'autopick sulla squadra al turno corrente in caso di irreperibilità del manager.
  - **Esecuzione Selezione Automatica**:
    1. Il sistema scorre la lista di preferenza della squadra a partire dal Rank 1.
    2. Il primo rookie non ancora draftato viene assegnato alla scelta corrente.
  - **Strategia di Fallback (Fallback A Approvato)**:
    - Se tutti i rookie presenti nella lista personale sono già stati chiamati da altre squadre nei turni precedenti, il sistema seleziona in automatico il rookie rimasto disponibile con l'**Overall (o potenziale stimato) più alto**.

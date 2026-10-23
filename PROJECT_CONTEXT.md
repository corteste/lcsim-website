# ⚽ LCSIM — Contesto di Progetto & Architettura

Benvenuto nel documento di contesto generale di **LCSIM** (Lega Calcio Simulazione).  
Questo file serve come riferimento per sviluppatori, agenti AI e amministratori per comprendere la natura della lega, la struttura tecnologica, le regole di gioco e il modello dati.

---

## 🌟 Cos'è LCSIM?
**LCSIM** è una **Lega di Calcio Simulato** (stile carriera manageriale/franchigia) in cui società gestite da manager umani competono tra loro lungo diverse stagioni (attualmente in corso la **Stagione 11**).

A differenza del classico fantacalcio basato sulla Serie A reale:
- I calciatori hanno attributi dettagliati (stile Football Manager / EA Sports FC: *OVR, Velocità, Tiro, Passaggio, Difesa, Fisico, Tratti, Ruoli+*).
- C'è un sistema di **sviluppo calciatori / allenamenti** con XP, crediti, sblocco tratti (Argento/Oro) e specializzazioni di ruolo.
- C'è un **Draft annuale dei Rookie** con scelte al tabellone (`an_draft_board`) scambiabili tra squadre.
- Il mercato include **trattative dirette tra manager** (scambi di giocatori e scelte draft con convalida della Lega).
- Le partite vengono simulate e i risultati settimanali vengono importati dall'Admin tramite file CSV statistici ufficiali.

---

## 🏗️ Stack Tecnologico

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Lucide Icons, React Router DOM, Framer Motion.
- **Backend & Database**: **Supabase** (PostgreSQL)
  - Autenticazione custom e gestione sessione manager/admin via RPC (`rpc_login`, `an_utenti`).
  - **Realtime**: Tabelle abilitate per sincronizzazione notifiche push, annunci e chat trattative.
  - Funzioni PL/pgSQL atomiche con lock di riga (es. `rpc_execute_trade` per gli scambi).
- **Hosting / Deploy**: Vercel (distribuzione continua dal branch `main`).
- **Workflow di sviluppo**:
  - `dev`: Branch di sviluppo e test locale (`http://localhost:8080`).
  - `main`: Branch di produzione (push solo previa conferma esplicita dell'utente).

---

## 👥 Ruoli Utente & Permessi

1. **Super Admin / Commissione Lega**:
   - `isAdmin: true`, `team: null` (figura neutrale).
   - Ha accesso alla sezione **"Amministrazione"** (al posto di "La Mia Squadra").
   - Convalida o respinge gli scambi di mercato approvati dai manager.
   - Crea, modifica, fissa in alto ed elimina i **Comunicati Ufficiali** di Lega (`/comunicati`) e gestisce il **Banner Globale**.
   - Carica settimanalmente i CSV con i tabellini delle partite per aggiornare statistiche e classifiche.
   - Convalida e applica gli allenamenti dei calciatori.

2. **Manager di Società**:
   - `isAdmin: false`, associato a una squadra univoca (es. `APD`, `MAR`, `COS` da `an_team`).
   - Accede all'area riservata **"La Mia Squadra"**:
     - *Roster & Rose*: gestione rosa, contratti, overall.
     - *Tattiche*: formazione, calci piazzati (rigori, punizioni, freddezza), ruoli.
     - *Allenamenti*: spesa punti XP/crediti per crescita attributi, tratti e ruoli+.
     - *Trattative (`/mia-squadra/trattative`)*: invio e ricezione proposte di scambio con altre società, messaggistica privata, controproposte.
   - Riceve notifiche live nella **Campana** della Navbar (offerte ricevute, comunicati, esito scambi, messaggi).

3. **Visitatore / Pubblico**:
   - Consultazione libera di: Classifica, Calendario, Risultati, Tabellone Draft, Rose pubbliche, Bacheca Scambi Ufficiali (`/mercato/scambi`), Bacheca Comunicati (`/comunicati`), Hall of Fame e Archivio Storico.

---

## 🗄️ Modello Dati Principale (Supabase)

| Tabella | Descrizione |
|---|---|
| `an_team` | Anagrafica delle società (ID a 3 lettere es. `APD`, nome completo, logo, presidente, budget). |
| `an_utenti` | Utenti registrati, credenziali cifrate, associazione a `team_id` e flag `is_admin`. |
| `an_player` | Database di tutti i calciatori (attributi fisici/tecnici, squadra di appartenenza, età, OVR). |
| `an_player_training` | Sessioni di miglioramento/allenamento proposte dai manager prima della convalida Admin. |
| `an_draft_board` | Tabellone del Rookie Draft (round, numero scelta, squadra proprietaria originale e attuale). |
| `an_schedule` | Calendario gare per stagione e giornata (`week`, `home`, `away`, punteggio, meteo, stadio). |
| `"AS_TEAM_STAT"` | Statistiche di squadra per singola partita (possesso, tiri, falli, contrasti, voti). |
| `"AS_PLAYER_STAT"` | Tabellini individuali per partita (gol, assist, minuti, voti, parate, passaggi, dribbling). |
| `market_trades` | Proposte di scambio tra squadre (stato: `pending`, `pending_admin`, `completed`, `rejected`, `admin_rejected`, `cancelled`). |
| `trade_messages` | Thread di messaggistica interna associato a ogni specifica trattativa di mercato. |
| `league_announcements` | Comunicati stampa ufficiali della Commissione di Lega (titolo, contenuto, priorità, banner, pinned). |
| `announcement_reads` | Tracciamento per-utente dei comunicati visualizzati. |

---

## 🔄 Regole Chiave di Mercato & Trattative

1. **Parità degli Asset**: In uno scambio, il numero totale di asset ceduti deve essere identico a quello ricevuto ($N \iff N$, ad esempio 1 giocatore per 1 giocatore, oppure 1 giocatore + 1 scelta per 2 giocatori).
2. **Ciclo di Vita di una Trattativa**:
   - `pending`: Proposta inviata dalla Squadra A alla Squadra B (segreta, visibile solo a loro).
   - La Squadra B può:
     - **Rifiutare** (con motivazione opzionale).
     - **Inviare una Controproposta** (inverte i ruoli e riapre il tavolo).
     - **Accettare** $\to$ Lo stato passa a `pending_admin`.
   - `pending_admin`: La Lega verifica la regolarità.
     - L'Admin approva $\to$ La funzione atomica PostgreSQL `rpc_execute_trade` trasferisce i giocatori in `an_player` e le scelte in `an_draft_board` in una transazione sicura. Lo scambio diventa pubblico su `/mercato/scambi`.
     - L'Admin respinge $\to$ Lo stato diventa `admin_rejected` con motivazione ufficiale.

---

## 📁 Struttura Cartelle del Progetto

```text
lcsim-website/
├── public/                 # Asset statici (loghi squadre, maglie, icone)
├── src/
│   ├── components/         # Componenti UI (Navbar, GlobalBanner, NotificationsMenu, UI shadcn)
│   ├── pages/              # Schermate applicative (Home, Roster, Allenamenti, Trattative, Comunicati, ...)
│   ├── services/           # Logica di business e chiamate Supabase (tradesService, announcementsService, ...)
│   ├── types/              # Definizioni TypeScript (player, team, trades, announcements, training)
│   ├── supabaseClient.ts   # Client Supabase inizializzato
│   └── App.tsx             # Routing principale e layout
├── supabase/
│   └── migrations/         # Script SQL delle migrazioni e rollback
├── PUNTI_APERTI.md         # Backlog e stato di avanzamento delle funzionalità
├── PROJECT_CONTEXT.md      # Questo file di contesto
└── README.md               # Istruzioni d'uso e sviluppo
```

---

## 📌 Note Operative per l'Assistente AI
- **Branching**: Si sviluppa sempre su `dev`. Nessun push su `main` senza richiesta esplicita dell'utente.
- **Rollback SQL**: Ogni migrazione su Supabase deve avere il relativo script di rollback documentato in `supabase/migrations/`.
- **Database Connection**: Per query o DDL dirette sul pooler Supabase, usare l'host IPv4 Supavisor documentato nei file di migrazione.

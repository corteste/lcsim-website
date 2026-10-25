# Regole e Contesto del Progetto LCSIM

## Riferimento Principale
Per la panoramica completa del gioco, delle entità e delle regole, fai sempre riferimento a:
- [PROJECT_CONTEXT.md](file:///d:/Users/Stefano/Documents/LCSIM_Website/lcsim-website/PROJECT_CONTEXT.md)
- [PUNTI_APERTI.md](file:///d:/Users/Stefano/Documents/LCSIM_Website/lcsim-website/PUNTI_APERTI.md)

## Linee Guida Operative
1. **Branching & Deploy**:
   - Sviluppare e testare sempre sul branch `dev`.
   - **MAI** effettuare il merge su `main` o eseguire push in produzione senza l'esplicita richiesta o conferma dell'utente.
2. **Database & Migrazioni**:
   - Qualsiasi modifica DDL/schema su Supabase deve essere accompagnata da uno script SQL di migrazione e dal rispettivo script di rollback in `supabase/migrations/`.
   - L'accesso diretto al DB Supabase avviene tramite il pooler Supavisor IPv4 documentato nelle migrazioni.
3. **Ruoli & Permessi**:
   - L'utente `admin` è un Super Admin neutrale (`is_admin = true`, `team_id = null`). Non possiede una squadra e la sua sezione di navigazione è nominata "Amministrazione".
   - I manager possiedono una squadra (`is_admin = false`, `team_id = 'XXX'`) e gestiscono "La Mia Squadra".
4. **Validazione & Test Obbligatori**:
   - Effettuare **sempre** test approfonditi per validare la soluzione prima di considerarla completata, verificando l'integrità del codice, il funzionamento a runtime, la corretta gestione dei valori nulli/undefined e l'assenza di errori in console o nel build (`npm run build`).
5. **Chiarimento & Modalità di Implementazione**:
   - Chiedere **sempre** preventivamente all'utente le modalità di implementazione per ogni richiesta o nuova funzionalità (ad es. scelte di layout/UI, posizionamento, suddivisione in pagine o tab, opzioni architetturali), presentando le possibili soluzioni e attendendo la sua decisione prima di procedere con la scrittura del codice.

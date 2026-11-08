-- ==============================================================================
-- Migrazione: Reset e Ripristino Dati Giocatori (an_player) e Reset Tagli Pre-Produzione
-- File: supabase/migrations/20261108_restore_players_and_reset_cuts.sql
-- ==============================================================================

-- 1. Reset registro tagli squadre pendenti
DELETE FROM public.team_cuts_registry;

-- 2. Rimozione scelte compensatorie provvisorie generate dai test tagli
DELETE FROM public.an_draft_board WHERE is_compensatory = true;

-- 3. Rinumerazione progressiva delle scelte regolari 1..60
WITH ordered AS (
  SELECT ctid, (round - 1) * 12 + pick_in_round AS new_pick_overall
  FROM public.an_draft_board
  WHERE is_compensatory = false
)
UPDATE public.an_draft_board b
SET pick_overall = o.new_pick_overall
FROM ordered o
WHERE b.ctid = o.ctid;

-- 4. Reset automazione tagli di lega
UPDATE public.league_automation_state
SET 
  last_run_at = NULL,
  last_run_by = NULL,
  details = '{"note": "Nessuna esecuzione registrata (Reset di fabbrica pre-produzione)"}'::jsonb,
  updated_at = timezone('utc'::text, now())
WHERE id = 'official_cuts';

-- 5. Eliminazione comunicato di test sui tagli
DELETE FROM public.league_announcements
WHERE title ILIKE '%tagli%';

NOTIFY pgrst, 'reload schema';

-- ==============================================================================
-- LCSIM - Rollback Migrazione: Stato Automazione Blocco Rose
-- ==============================================================================

UPDATE public.league_automation_state
SET details = '{"status": "unlocked"}'::JSONB,
    updated_at = now()
WHERE id = 'roster_lock';

NOTIFY pgrst, 'reload schema';

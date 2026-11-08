-- Rollback: Inizializzazione stato Apertura / Chiusura Draft
-- Ripristina la dicitura precedente per la Modalità Test (Dry Run)

UPDATE public.league_automation_state
SET
  action_name = 'Modalità Test (Dry Run)',
  details = jsonb_build_object(
    'is_active', true,
    'updated_at', NOW(),
    'updated_by', 'Amministratore LCSIM'
  ),
  updated_at = NOW()
WHERE id = 'test_mode';

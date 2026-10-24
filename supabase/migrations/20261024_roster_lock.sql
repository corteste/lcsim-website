-- ==============================================================================
-- LCSIM - Migrazione: Stato Automazione Blocco Rose (Punto Aperto #12)
-- ==============================================================================

-- 1. Inserisci record roster_lock se non già esistente
INSERT INTO public.league_automation_state (id, action_name, last_run_at, last_run_by, details, created_at, updated_at)
VALUES (
  'roster_lock',
  'Blocco / Sblocco Rose',
  now(),
  'Sistema',
  '{"status": "unlocked"}'::JSONB,
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;

NOTIFY pgrst, 'reload schema';

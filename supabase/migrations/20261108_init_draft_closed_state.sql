-- Migrazione: Inizializzazione stato Apertura / Chiusura Draft
-- Aggiorna league_automation_state impostando il Draft come Chiuso di default (scelte e autopick inibiti)

INSERT INTO public.league_automation_state (
  id,
  action_name,
  last_run_at,
  last_run_by,
  details,
  updated_at
) VALUES (
  'test_mode',
  'Apertura / Chiusura Draft',
  NOW(),
  'Amministratore LCSIM',
  jsonb_build_object(
    'is_open', false,
    'status', 'closed',
    'is_active', true,
    'updated_at', NOW(),
    'updated_by', 'Amministratore LCSIM'
  ),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  action_name = EXCLUDED.action_name,
  last_run_at = EXCLUDED.last_run_at,
  last_run_by = EXCLUDED.last_run_by,
  details = EXCLUDED.details,
  updated_at = EXCLUDED.updated_at;

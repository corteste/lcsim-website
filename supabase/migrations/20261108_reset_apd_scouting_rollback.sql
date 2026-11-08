-- ==============================================================================
-- Rollback: Reset Gettoni e Scouting Effettuato per Squadra APD
-- File: supabase/migrations/20261108_reset_apd_scouting_rollback.sql
-- ==============================================================================

-- Ripristina i record di scouting per la squadra APD
INSERT INTO public.an_rookie_scouting (team_id, rookie_id, tokens_spent, updated_at, updated_by)
VALUES
  ('APD', 27, 5, '2026-10-26T21:53:21.961Z'::timestamptz, 'cotestekkio'),
  ('APD', 51, 5, '2026-10-26T22:03:17.797Z'::timestamptz, 'admin'),
  ('APD', 250, 5, '2026-10-31T10:06:42.546Z'::timestamptz, 'cotestekkio'),
  ('APD', 246, 5, '2026-10-31T12:02:57.885Z'::timestamptz, 'cotestekkio'),
  ('APD', 20801, 3, '2026-10-26T22:20:39.362Z'::timestamptz, 'cotestekkio'),
  ('APD', 240, 2, '2026-10-31T10:06:35.411Z'::timestamptz, 'cotestekkio'),
  ('APD', 330, 2, '2026-10-31T20:38:10.364Z'::timestamptz, 'cotestekkio'),
  ('APD', 1116, 1, '2026-10-31T20:38:22.789Z'::timestamptz, 'cotestekkio')
ON CONFLICT (team_id, rookie_id) DO UPDATE SET
  tokens_spent = EXCLUDED.tokens_spent,
  updated_at = EXCLUDED.updated_at,
  updated_by = EXCLUDED.updated_by;

NOTIFY pgrst, 'reload schema';

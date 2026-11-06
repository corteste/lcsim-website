-- ==============================================================================
-- MIGRAZIONE: Inserimento Membri Hall of Fame Classi S9 e S10
-- Membri indotti:
-- 1. Moritz SCHAFER (ID: 50166) - Classe S9, Ordine #4 (#9 Draft S1 • PAN → HTV → PFC)
-- 2. Kristian ZIMMERMAN (ID: 50215) - Classe S9, Ordine #5 (#69 Draft S1 • PAN → HTV → PFC)
-- 3. Gianfranco BATTAGLIA (ID: 50213) - Classe S9, Ordine #6 (#3 Draft S1 • SBM → MAR)
-- 4. Gennaro ROSSI (ID: 50012) - Classe S10, Ordine #7 (#11 Draft S1 • GAP → ACD)
-- ==============================================================================

INSERT INTO public.an_hall_of_fame (player_id, active_seasons, induction_class, induction_order, bio_note)
VALUES
  ('50166', 'S1-S8', 'S9', 4, '#9 Draft S1 • PAN → HTV → PFC'),
  ('50215', 'S1-S6', 'S9', 5, '#69 Draft S1 • PAN → HTV → PFC'),
  ('50213', 'S1-S7', 'S9', 6, '#3 Draft S1 • SBM → MAR'),
  ('50012', 'S1-S10', 'S10', 7, '#11 Draft S1 • GAP → ACD')
ON CONFLICT (player_id) DO UPDATE SET
  active_seasons = EXCLUDED.active_seasons,
  induction_class = EXCLUDED.induction_class,
  induction_order = EXCLUDED.induction_order,
  bio_note = EXCLUDED.bio_note;

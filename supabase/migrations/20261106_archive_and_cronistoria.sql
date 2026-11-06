-- ==============================================================================
-- LCSIM Migration: Archivio Storico, Cronistoria (5 Fogli) & Hall of Fame (#57)
-- File: supabase/migrations/20261106_archive_and_cronistoria.sql
-- ==============================================================================

-- 1. Tabella Cambi di Nome Squadre (Rebranding)
CREATE TABLE IF NOT EXISTS public.an_team_rebrands (
  id SERIAL PRIMARY KEY,
  rebrand_date DATE NOT NULL,
  pre_team_id TEXT NOT NULL,
  post_team_id TEXT NOT NULL,
  current_franchise_id TEXT NOT NULL,
  season_before INTEGER,
  season_after INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_team_rebrands_pre ON public.an_team_rebrands (pre_team_id);
CREATE INDEX IF NOT EXISTS idx_team_rebrands_post ON public.an_team_rebrands (post_team_id);
CREATE INDEX IF NOT EXISTS idx_team_rebrands_franchise ON public.an_team_rebrands (current_franchise_id);

-- 2. Tabella Movimenti Storici Giocatori (Foglio 1: Giocatori)
CREATE TABLE IF NOT EXISTS public.an_player_transactions (
  id SERIAL PRIMARY KEY,
  tx_order INTEGER NOT NULL,
  tx_date DATE,
  tx_time TEXT,
  player_id BIGINT NOT NULL,
  nome TEXT NOT NULL,
  cognome TEXT NOT NULL,
  prev_team TEXT NOT NULL,
  new_team TEXT NOT NULL,
  motivo TEXT NOT NULL,
  stagione INTEGER NOT NULL,
  draft_pick INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_player_tx_player_order ON public.an_player_transactions (player_id, tx_order);
CREATE INDEX IF NOT EXISTS idx_player_tx_stagione ON public.an_player_transactions (stagione, tx_order);

-- 3. Tabella Stagioni in Carriera / Appartenenza Rosa per Stagione (inclusi 0 minuti giocati)
CREATE TABLE IF NOT EXISTS public.an_player_career_seasons (
  id SERIAL PRIMARY KEY,
  player_id BIGINT NOT NULL,
  stagione INTEGER NOT NULL,
  team_id TEXT NOT NULL,
  franchise_id TEXT NOT NULL,
  entry_motivo TEXT NOT NULL DEFAULT 'Confermato',
  draft_pick INTEGER,
  presenze_capitano INTEGER NOT NULL DEFAULT 0,
  UNIQUE (player_id, stagione)
);

CREATE INDEX IF NOT EXISTS idx_career_seasons_player ON public.an_player_career_seasons (player_id, stagione);
CREATE INDEX IF NOT EXISTS idx_career_seasons_team ON public.an_player_career_seasons (team_id, stagione);
CREATE INDEX IF NOT EXISTS idx_career_seasons_franchise ON public.an_player_career_seasons (franchise_id, stagione);

-- 4. Tabella Eventi Storici di Lega (Foglio 2: Eventi)
CREATE TABLE IF NOT EXISTS public.an_league_events (
  id SERIAL PRIMARY KEY,
  event_order INTEGER NOT NULL,
  event_date DATE,
  evento TEXT NOT NULL,
  tipo TEXT NOT NULL,
  stagione INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_league_events_stagione ON public.an_league_events (stagione, event_order);

-- 5. Tabella Storico Allenatori (Foglio 3: Allenatori)
CREATE TABLE IF NOT EXISTS public.an_coach_history (
  id SERIAL PRIMARY KEY,
  coach_order INTEGER NOT NULL,
  nome TEXT NOT NULL,
  team_id TEXT NOT NULL,
  current_franchise_id TEXT NOT NULL,
  effetto TEXT NOT NULL,
  event_date DATE,
  giornata INTEGER,
  stagione INTEGER NOT NULL,
  note TEXT
);

CREATE INDEX IF NOT EXISTS idx_coach_history_team ON public.an_coach_history (team_id, coach_order);
CREATE INDEX IF NOT EXISTS idx_coach_history_franchise ON public.an_coach_history (current_franchise_id, coach_order);

-- 6. Tabella Capitani per Partita (Foglio 4: Capitani)
CREATE TABLE IF NOT EXISTS public.an_match_captains (
  id SERIAL PRIMARY KEY,
  match_order INTEGER NOT NULL,
  label TEXT NOT NULL,
  stagione INTEGER,
  team1_name TEXT NOT NULL,
  cap1_nome TEXT NOT NULL,
  cap1_cognome TEXT NOT NULL,
  cap1_player_id BIGINT,
  cap2_nome TEXT NOT NULL,
  cap2_cognome TEXT NOT NULL,
  cap2_player_id BIGINT,
  team2_name TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_match_captains_cap1 ON public.an_match_captains (cap1_player_id);
CREATE INDEX IF NOT EXISTS idx_match_captains_cap2 ON public.an_match_captains (cap2_player_id);
CREATE INDEX IF NOT EXISTS idx_match_captains_stag ON public.an_match_captains (stagione, match_order);

-- 7. Tabella Classifica All-Time Capitani (Foglio 4: Classifica Capitani)
CREATE TABLE IF NOT EXISTS public.an_captain_leaderboards (
  player_id BIGINT PRIMARY KEY,
  nome TEXT NOT NULL,
  cognome TEXT NOT NULL,
  presenze_capitano INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_captain_leaderboards_presenze ON public.an_captain_leaderboards (presenze_capitano DESC);

-- 8. Tabella Comunicazioni & Articoli Storici (Foglio 5: Comunicazioni)
CREATE TABLE IF NOT EXISTS public.an_historical_news (
  id SERIAL PRIMARY KEY,
  news_order INTEGER NOT NULL,
  news_date DATE,
  news_time TEXT,
  fonte TEXT,
  squadra TEXT,
  tipo TEXT,
  titolo TEXT,
  testo TEXT,
  commenti TEXT
);

CREATE INDEX IF NOT EXISTS idx_historical_news_order ON public.an_historical_news (news_order DESC);
CREATE INDEX IF NOT EXISTS idx_historical_news_squadra ON public.an_historical_news (squadra);

-- 9. Tabella Ufficiale Hall of Fame
CREATE TABLE IF NOT EXISTS public.an_hall_of_fame (
  player_id BIGINT PRIMARY KEY REFERENCES public.an_player("ID") ON DELETE CASCADE,
  active_seasons TEXT NOT NULL,
  induction_class TEXT NOT NULL,
  induction_order INTEGER NOT NULL DEFAULT 1,
  bio_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS & Public Read Access
ALTER TABLE public.an_team_rebrands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.an_player_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.an_player_career_seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.an_league_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.an_coach_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.an_match_captains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.an_captain_leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.an_historical_news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.an_hall_of_fame ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read an_team_rebrands" ON public.an_team_rebrands;
CREATE POLICY "Public read an_team_rebrands" ON public.an_team_rebrands FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read an_player_transactions" ON public.an_player_transactions;
CREATE POLICY "Public read an_player_transactions" ON public.an_player_transactions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read an_player_career_seasons" ON public.an_player_career_seasons;
CREATE POLICY "Public read an_player_career_seasons" ON public.an_player_career_seasons FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read an_league_events" ON public.an_league_events;
CREATE POLICY "Public read an_league_events" ON public.an_league_events FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read an_coach_history" ON public.an_coach_history;
CREATE POLICY "Public read an_coach_history" ON public.an_coach_history FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read an_match_captains" ON public.an_match_captains;
CREATE POLICY "Public read an_match_captains" ON public.an_match_captains FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read an_captain_leaderboards" ON public.an_captain_leaderboards;
CREATE POLICY "Public read an_captain_leaderboards" ON public.an_captain_leaderboards FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read an_historical_news" ON public.an_historical_news;
CREATE POLICY "Public read an_historical_news" ON public.an_historical_news FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read an_hall_of_fame" ON public.an_hall_of_fame;
CREATE POLICY "Public read an_hall_of_fame" ON public.an_hall_of_fame FOR SELECT USING (true);

GRANT SELECT ON public.an_team_rebrands TO anon, authenticated, service_role;
GRANT SELECT ON public.an_player_transactions TO anon, authenticated, service_role;
GRANT SELECT ON public.an_player_career_seasons TO anon, authenticated, service_role;
GRANT SELECT ON public.an_league_events TO anon, authenticated, service_role;
GRANT SELECT ON public.an_coach_history TO anon, authenticated, service_role;
GRANT SELECT ON public.an_match_captains TO anon, authenticated, service_role;
GRANT SELECT ON public.an_captain_leaderboards TO anon, authenticated, service_role;
GRANT SELECT ON public.an_historical_news TO anon, authenticated, service_role;
GRANT SELECT ON public.an_hall_of_fame TO anon, authenticated, service_role;

-- 10. Popolamento TEAM_ID storico su as_player_stat (S1-S10)
UPDATE public.as_player_stat s
SET "TEAM_ID" = cs.team_id
FROM public.an_player_career_seasons cs
WHERE s."ID" = cs.player_id
  AND s."STAG" = cs.stagione
  AND (s."TEAM_ID" IS NULL OR s."STAG" <= 10);

-- 11. Viste di Riepilogo Stagionale e Carriera (inclusi 0 minuti giocati)
CREATE OR REPLACE VIEW public.view_player_season_summary AS
WITH stat_agg AS (
  SELECT
    "ID" AS player_id,
    "STAG" AS stagione,
    MAX("TEAM_ID") AS stat_team_id,
    COUNT(*)::integer AS presenze,
    COUNT(*) FILTER (WHERE NOT COALESCE("SUB", false))::integer AS titolare,
    COALESCE(SUM("MINUTI"), 0)::integer AS minuti,
    ROUND(AVG("VOTO")::numeric, 2)::real AS media_voto,
    COUNT(*) FILTER (WHERE COALESCE("MOTM", false))::integer AS motm,
    COALESCE(SUM("GOL"), 0)::integer AS gol,
    COALESCE(SUM("AGOL"), 0)::integer AS autogol,
    COALESCE(SUM("ASST"), 0)::integer AS assist,
    COALESCE(SUM("TIRI_IN"), 0)::integer AS tiri_in,
    COALESCE(SUM("TIRI_TOT"), 0)::integer AS tiri_tot,
    COALESCE(SUM("PASS_SI"), 0)::integer AS pass_si,
    COALESCE(SUM("PASS_TOT"), 0)::integer AS pass_tot,
    COALESCE(SUM("DRIB_SI"), 0)::integer AS drib_si,
    COALESCE(SUM("DRIB_TOT"), 0)::integer AS drib_tot,
    COALESCE(SUM("CROS_SI"), 0)::integer AS cros_si,
    COALESCE(SUM("CROS_TOT"), 0)::integer AS cros_tot,
    COALESCE(SUM("CTRS_SI"), 0)::integer AS ctrs_si,
    COALESCE(SUM("CTRS_TOT"), 0)::integer AS ctrs_tot,
    COALESCE(SUM("FALLI"), 0)::integer AS falli,
    COALESCE(SUM("PARA"), 0)::integer AS parate,
    COALESCE(SUM("GSUB"), 0)::integer AS gol_subiti,
    COUNT(*) FILTER (WHERE COALESCE("GSUB", 0) = 0 AND COALESCE("MINUTI", 0) >= 45)::integer AS clean_sheets,
    COALESCE(SUM("GIALLI"), 0)::integer AS gialli,
    COALESCE(SUM("ROSSI"), 0)::integer AS rossi,
    COALESCE(SUM("FGIOCO"), 0)::integer AS fuorigioco
  FROM public.as_player_stat
  GROUP BY "ID", "STAG"
)
SELECT
  COALESCE(cs.player_id, sa.player_id) AS player_id,
  COALESCE(cs.stagione, sa.stagione) AS stagione,
  COALESCE(cs.team_id, sa.stat_team_id, 'N/D') AS team_id,
  COALESCE(cs.franchise_id, sa.stat_team_id, 'N/D') AS franchise_id,
  COALESCE(cs.entry_motivo, 'A Referto') AS entry_motivo,
  cs.draft_pick,
  COALESCE(cs.presenze_capitano, 0)::integer AS presenze_capitano,
  COALESCE(sa.presenze, 0)::integer AS presenze,
  COALESCE(sa.titolare, 0)::integer AS titolare,
  COALESCE(sa.minuti, 0)::integer AS minuti,
  sa.media_voto,
  COALESCE(sa.motm, 0)::integer AS motm,
  COALESCE(sa.gol, 0)::integer AS gol,
  COALESCE(sa.autogol, 0)::integer AS autogol,
  COALESCE(sa.assist, 0)::integer AS assist,
  COALESCE(sa.tiri_in, 0)::integer AS tiri_in,
  COALESCE(sa.tiri_tot, 0)::integer AS tiri_tot,
  COALESCE(sa.pass_si, 0)::integer AS pass_si,
  COALESCE(sa.pass_tot, 0)::integer AS pass_tot,
  COALESCE(sa.drib_si, 0)::integer AS drib_si,
  COALESCE(sa.drib_tot, 0)::integer AS drib_tot,
  COALESCE(sa.cros_si, 0)::integer AS cros_si,
  COALESCE(sa.cros_tot, 0)::integer AS cros_tot,
  COALESCE(sa.ctrs_si, 0)::integer AS ctrs_si,
  COALESCE(sa.ctrs_tot, 0)::integer AS ctrs_tot,
  COALESCE(sa.falli, 0)::integer AS falli,
  COALESCE(sa.parate, 0)::integer AS parate,
  COALESCE(sa.gol_subiti, 0)::integer AS gol_subiti,
  COALESCE(sa.clean_sheets, 0)::integer AS clean_sheets,
  COALESCE(sa.gialli, 0)::integer AS gialli,
  COALESCE(sa.rossi, 0)::integer AS rossi,
  COALESCE(sa.fuorigioco, 0)::integer AS fuorigioco
FROM public.an_player_career_seasons cs
FULL OUTER JOIN stat_agg sa
  ON cs.player_id = sa.player_id AND cs.stagione = sa.stagione;

CREATE OR REPLACE VIEW public.view_player_career_summary AS
WITH raw_career AS (
  SELECT
    "ID" AS player_id,
    COUNT(*)::integer AS presenze,
    COUNT(*) FILTER (WHERE NOT COALESCE("SUB", false))::integer AS titolare,
    COALESCE(SUM("MINUTI"), 0)::integer AS minuti,
    ROUND(AVG("VOTO")::numeric, 2)::real AS media_voto,
    COUNT(*) FILTER (WHERE COALESCE("MOTM", false))::integer AS motm,
    COALESCE(SUM("GOL"), 0)::integer AS gol,
    COALESCE(SUM("AGOL"), 0)::integer AS autogol,
    COALESCE(SUM("ASST"), 0)::integer AS assist,
    COALESCE(SUM("TIRI_IN"), 0)::integer AS tiri_in,
    COALESCE(SUM("TIRI_TOT"), 0)::integer AS tiri_tot,
    COALESCE(SUM("PASS_SI"), 0)::integer AS pass_si,
    COALESCE(SUM("PASS_TOT"), 0)::integer AS pass_tot,
    COALESCE(SUM("DRIB_SI"), 0)::integer AS drib_si,
    COALESCE(SUM("DRIB_TOT"), 0)::integer AS drib_tot,
    COALESCE(SUM("CROS_SI"), 0)::integer AS cros_si,
    COALESCE(SUM("CROS_TOT"), 0)::integer AS cros_tot,
    COALESCE(SUM("CTRS_SI"), 0)::integer AS ctrs_si,
    COALESCE(SUM("CTRS_TOT"), 0)::integer AS ctrs_tot,
    COALESCE(SUM("FALLI"), 0)::integer AS falli,
    COALESCE(SUM("PARA"), 0)::integer AS parate,
    COALESCE(SUM("GSUB"), 0)::integer AS gol_subiti,
    COUNT(*) FILTER (WHERE COALESCE("GSUB", 0) = 0 AND COALESCE("MINUTI", 0) >= 45)::integer AS clean_sheets,
    COALESCE(SUM("GIALLI"), 0)::integer AS gialli,
    COALESCE(SUM("ROSSI"), 0)::integer AS rossi,
    COALESCE(SUM("FGIOCO"), 0)::integer AS fuorigioco
  FROM public.as_player_stat
  GROUP BY "ID"
),
season_meta AS (
  SELECT
    player_id,
    COUNT(*)::integer AS stagioni_rosa,
    COUNT(*) FILTER (WHERE presenze > 0)::integer AS stagioni_giocate,
    MIN(stagione)::integer AS first_stag,
    MAX(stagione)::integer AS last_stag,
    array_agg(team_id ORDER BY stagione) AS season_teams,
    array_agg(DISTINCT franchise_id) AS franchises,
    COALESCE(SUM(presenze_capitano), 0)::integer AS sum_cap
  FROM public.view_player_season_summary
  GROUP BY player_id
),
draft_info AS (
  SELECT DISTINCT ON (player_id)
    player_id,
    stagione AS draft_stag,
    draft_pick,
    new_team AS draft_team
  FROM public.an_player_transactions
  WHERE motivo = 'Draft'
  ORDER BY player_id, tx_order ASC
)
SELECT
  p."ID" AS player_id,
  p."Nome" AS nome,
  p."Cognome" AS cognome,
  p."Posiz" AS posiz,
  p."Squadra" AS squadra_attuale,
  p."OVR" AS ovr,
  p."Età" AS eta,
  p."Altezza" AS altezza,
  p."Peso" AS peso,
  p."Nazionalità" AS nazionalita,
  p."Piede" AS piede,
  (hof.player_id IS NOT NULL) AS is_hof,
  hof.induction_class AS hof_class,
  hof.active_seasons AS hof_active_seasons,
  COALESCE(sm.stagioni_rosa, 0)::integer AS stagioni_rosa,
  COALESCE(sm.stagioni_giocate, 0)::integer AS stagioni_giocate,
  sm.first_stag,
  sm.last_stag,
  COALESCE(sm.season_teams, ARRAY[]::text[]) AS season_teams,
  COALESCE(sm.franchises, ARRAY[]::text[]) AS franchises,
  di.draft_stag,
  di.draft_pick,
  di.draft_team,
  COALESCE(cl.presenze_capitano, sm.sum_cap, 0)::integer AS presenze_capitano,
  COALESCE(rc.presenze, 0)::integer AS presenze,
  COALESCE(rc.titolare, 0)::integer AS titolare,
  COALESCE(rc.minuti, 0)::integer AS minuti,
  rc.media_voto,
  COALESCE(rc.motm, 0)::integer AS motm,
  COALESCE(rc.gol, 0)::integer AS gol,
  COALESCE(rc.autogol, 0)::integer AS autogol,
  COALESCE(rc.assist, 0)::integer AS assist,
  COALESCE(rc.tiri_in, 0)::integer AS tiri_in,
  COALESCE(rc.tiri_tot, 0)::integer AS tiri_tot,
  COALESCE(rc.pass_si, 0)::integer AS pass_si,
  COALESCE(rc.pass_tot, 0)::integer AS pass_tot,
  COALESCE(rc.drib_si, 0)::integer AS drib_si,
  COALESCE(rc.drib_tot, 0)::integer AS drib_tot,
  COALESCE(rc.cros_si, 0)::integer AS cros_si,
  COALESCE(rc.cros_tot, 0)::integer AS cros_tot,
  COALESCE(rc.ctrs_si, 0)::integer AS ctrs_si,
  COALESCE(rc.ctrs_tot, 0)::integer AS ctrs_tot,
  COALESCE(rc.falli, 0)::integer AS falli,
  COALESCE(rc.parate, 0)::integer AS parate,
  COALESCE(rc.gol_subiti, 0)::integer AS gol_subiti,
  COALESCE(rc.clean_sheets, 0)::integer AS clean_sheets,
  COALESCE(rc.gialli, 0)::integer AS gialli,
  COALESCE(rc.rossi, 0)::integer AS rossi,
  COALESCE(rc.fuorigioco, 0)::integer AS fuorigioco
FROM public.an_player p
LEFT JOIN raw_career rc ON p."ID" = rc.player_id
LEFT JOIN season_meta sm ON p."ID" = sm.player_id
LEFT JOIN draft_info di ON p."ID" = di.player_id
LEFT JOIN public.an_captain_leaderboards cl ON p."ID" = cl.player_id
LEFT JOIN public.an_hall_of_fame hof ON p."ID" = hof.player_id;

GRANT SELECT ON public.view_player_season_summary TO anon, authenticated, service_role;
GRANT SELECT ON public.view_player_career_summary TO anon, authenticated, service_role;

-- 12. RPC Admin per Gestione Hall of Fame
CREATE OR REPLACE FUNCTION public.rpc_admin_upsert_hof_member(
  p_player_id BIGINT,
  p_active_seasons TEXT,
  p_induction_class TEXT,
  p_induction_order INTEGER DEFAULT 1,
  p_bio_note TEXT DEFAULT NULL,
  p_acting_username TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user RECORD;
BEGIN
  IF p_acting_username IS NOT NULL AND TRIM(p_acting_username) <> '' THEN
    SELECT * INTO v_user
    FROM public.app_user
    WHERE LOWER(username) = LOWER(TRIM(p_acting_username));

    IF NOT FOUND OR NOT COALESCE(v_user.is_admin, false) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Solo l''amministratore può modificare la Hall of Fame.');
    END IF;
  END IF;

  INSERT INTO public.an_hall_of_fame (player_id, active_seasons, induction_class, induction_order, bio_note)
  VALUES (p_player_id, TRIM(p_active_seasons), TRIM(p_induction_class), COALESCE(p_induction_order, 1), NULLIF(TRIM(COALESCE(p_bio_note, '')), ''))
  ON CONFLICT (player_id) DO UPDATE SET
    active_seasons = EXCLUDED.active_seasons,
    induction_class = EXCLUDED.induction_class,
    induction_order = EXCLUDED.induction_order,
    bio_note = EXCLUDED.bio_note;

  RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_admin_delete_hof_member(
  p_player_id BIGINT,
  p_acting_username TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user RECORD;
BEGIN
  IF p_acting_username IS NOT NULL AND TRIM(p_acting_username) <> '' THEN
    SELECT * INTO v_user
    FROM public.app_user
    WHERE LOWER(username) = LOWER(TRIM(p_acting_username));

    IF NOT FOUND OR NOT COALESCE(v_user.is_admin, false) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Solo l''amministratore può modificare la Hall of Fame.');
    END IF;
  END IF;

  DELETE FROM public.an_hall_of_fame WHERE player_id = p_player_id;
  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_admin_upsert_hof_member(BIGINT, TEXT, TEXT, INTEGER, TEXT, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.rpc_admin_delete_hof_member(BIGINT, TEXT) TO anon, authenticated, service_role;

-- Seed iniziale dei 3 membri ufficiali della Hall of Fame (ID reali da an_player)
INSERT INTO public.an_hall_of_fame (player_id, active_seasons, induction_class, induction_order, bio_note)
VALUES
  (50205, 'S1-S8', 'S8', 1, '#1 Draft S1 • APD → PFC → ASK'),
  (50219, 'S1-S8', 'S8', 2, '#13 Draft S1 • APD → ACD'),
  (50073, 'S1-S8', 'S8', 3, '#10 Draft S1 • SBM → PFC')
ON CONFLICT (player_id) DO UPDATE SET
  active_seasons = EXCLUDED.active_seasons,
  induction_class = EXCLUDED.induction_class,
  induction_order = EXCLUDED.induction_order,
  bio_note = EXCLUDED.bio_note;

-- 13. Inserimento Squadre Storiche / Ritirate / Rebrandizzate in an_team (ACTIVE = false)
INSERT INTO public.an_team ("TEAM_ID", "NAME", "NAME_ABBR", "MANAGER", "ACTIVE", scudetto, supercoppa)
VALUES
  ('FCP', 'Poppo FC', 'Poppo FC', 'Sig. Poppo', false, 0, 0),
  ('KAR', 'FC Karalis', 'FC Karalis', 'Sig. Puddu', false, 0, 0),
  ('QFM', 'Quelli del FantaManiaci', 'FantaManiaci', 'Sig. Deaddis', false, 0, 0),
  ('GAP', 'I Giunti Al Punto', 'Giunti Al Punto', 'Sig. Paragnosta', false, 0, 0),
  ('PAN', 'Panzett Hell', 'Panzett Hell', 'Sig. Mazo', false, 0, 0),
  ('HTV', 'Herta Vernello', 'Herta Vernello', 'Sig. Fiorio', false, 0, 0),
  ('PRO', 'Procions', 'Procions', 'Sig. Falco', false, 0, 0),
  ('YBO', 'Yang Bois', 'Yang Bois', 'Sig. Palermo', false, 0, 0),
  ('SBM', 'Sbinnala Madrid', 'Sbinnala Madrid', 'Sig. Mancini', false, 0, 0),
  ('HVI', 'FC Hellas Vinello', 'Hellas Vinello', 'Sig. Paragnosta M.', false, 0, 0),
  ('BLA', 'Blackmamba FC', 'Blackmamba', 'Sig. Colli', false, 0, 0)
ON CONFLICT ("TEAM_ID") DO UPDATE SET
  "NAME" = EXCLUDED."NAME",
  "NAME_ABBR" = EXCLUDED."NAME_ABBR",
  "MANAGER" = EXCLUDED."MANAGER",
  "ACTIVE" = EXCLUDED."ACTIVE";

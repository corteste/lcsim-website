-- ==============================================================================
-- Migrazione: 20261116_serie_b_player_stat.sql
-- Descrizione: Crea la tabella dedicata public.as_serie_b_player_stat per le
--              statistiche della Serie B (LCSIM 2, es. STAG = 'B-11').
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.as_serie_b_player_stat (
  "STAG" TEXT NOT NULL,
  "WEEK" INTEGER NOT NULL,
  "ID" BIGINT NOT NULL,
  "VOTO" REAL,
  "MINUTI" INTEGER NOT NULL DEFAULT 0,
  "GOL" INTEGER NOT NULL DEFAULT 0,
  "AGOL" INTEGER NOT NULL DEFAULT 0,
  "ASST" INTEGER NOT NULL DEFAULT 0,
  "TIRI_IN" INTEGER NOT NULL DEFAULT 0,
  "TIRI_TOT" INTEGER NOT NULL DEFAULT 0,
  "PASS_SI" INTEGER NOT NULL DEFAULT 0,
  "PASS_TOT" INTEGER NOT NULL DEFAULT 0,
  "DRIB_SI" INTEGER NOT NULL DEFAULT 0,
  "DRIB_TOT" INTEGER NOT NULL DEFAULT 0,
  "CROS_SI" INTEGER NOT NULL DEFAULT 0,
  "CROS_TOT" INTEGER NOT NULL DEFAULT 0,
  "CTRS_SI" INTEGER NOT NULL DEFAULT 0,
  "CTRS_TOT" INTEGER NOT NULL DEFAULT 0,
  "FALLI" INTEGER NOT NULL DEFAULT 0,
  "PARA" INTEGER NOT NULL DEFAULT 0,
  "GSUB" INTEGER NOT NULL DEFAULT 0,
  "GIALLI" INTEGER NOT NULL DEFAULT 0,
  "ROSSI" INTEGER NOT NULL DEFAULT 0,
  "FGIOCO" INTEGER NOT NULL DEFAULT 0,
  "POSS_VINTI" INTEGER NOT NULL DEFAULT 0,
  "PALLE_PERSE" INTEGER NOT NULL DEFAULT 0,
  "DIST_TOT" REAL NOT NULL DEFAULT 0,
  "DIST_SCATTO" REAL NOT NULL DEFAULT 0,
  PRIMARY KEY ("STAG", "WEEK", "ID")
);

CREATE INDEX IF NOT EXISTS idx_as_serie_b_player_stat_id
  ON public.as_serie_b_player_stat ("ID");

ALTER TABLE public.as_serie_b_player_stat ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read on as_serie_b_player_stat" ON public.as_serie_b_player_stat;
CREATE POLICY "Public read on as_serie_b_player_stat"
  ON public.as_serie_b_player_stat
  FOR SELECT
  TO anon, authenticated
  USING (true);

GRANT SELECT ON TABLE public.as_serie_b_player_stat TO anon, authenticated;
GRANT ALL ON TABLE public.as_serie_b_player_stat TO service_role;

-- ==============================================================================
-- Rollback: 20261116_rename_journalist_sources_rollback.sql
-- Descrizione: Ripristina i nomi originali delle testate in
--              public.league_market_rumors (source_label).
-- ==============================================================================

UPDATE public.league_market_rumors
SET source_label = CASE source_label
  WHEN 'Ground Sport LCSIM' THEN 'Sky Sport LCSIM'
  WHEN 'Il Gazzettino' THEN 'Gianluca Di LCSIM'
  WHEN 'Mario Mazo - Qui Per Voi' THEN 'Fabrizio Romano LCSIM Edition'
  ELSE source_label
END
WHERE source_label IN (
  'Ground Sport LCSIM',
  'Il Gazzettino',
  'Mario Mazo - Qui Per Voi'
);

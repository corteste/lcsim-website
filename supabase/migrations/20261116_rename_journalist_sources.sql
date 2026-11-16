-- ==============================================================================
-- Migrazione: 20261116_rename_journalist_sources.sql
-- Descrizione: Aggiorna i nomi delle testate giornalistiche in
--              public.league_market_rumors (source_label):
--              - 'Sky Sport LCSIM' -> 'Ground Sport LCSIM'
--              - 'Gianluca Di LCSIM' -> 'Il Gazzettino'
--              - 'Fabrizio Romano LCSIM Edition' -> 'Mario Mazo - Qui Per Voi'
-- ==============================================================================

UPDATE public.league_market_rumors
SET source_label = CASE source_label
  WHEN 'Sky Sport LCSIM' THEN 'Ground Sport LCSIM'
  WHEN 'Gianluca Di LCSIM' THEN 'Il Gazzettino'
  WHEN 'Fabrizio Romano LCSIM Edition' THEN 'Mario Mazo - Qui Per Voi'
  ELSE source_label
END
WHERE source_label IN (
  'Sky Sport LCSIM',
  'Gianluca Di LCSIM',
  'Fabrizio Romano LCSIM Edition'
);

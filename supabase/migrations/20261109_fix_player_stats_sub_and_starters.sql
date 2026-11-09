-- ==============================================================================
-- Migrazione: Calcolo e Popolamento Retroattivo "SUB" e Titolarità su as_player_stat
-- File: supabase/migrations/20261109_fix_player_stats_sub_and_starters.sql
-- ==============================================================================

-- 1. Imposta inizialmente "SUB" = true su tutti i record (stato di default per riserve e 0 minuti)
UPDATE public.as_player_stat
SET "SUB" = true;

-- 2. Assegna "SUB" = false agli 11 titolari effettivi di ciascuna partita (STAG, WEEK, TEAM_ID)
-- Criteri di selezione degli 11 titolari:
--  a) Priorità assoluta al Portiere di ruolo (POR) sceso in campo
--  b) Ordinamento decrescente per minuti giocati (MINUTI DESC)
--  c) A parità di minutaggio (es. cambi al 45'), rispetto dell'ordine fisico di inserimento referto (ctid ASC)
WITH ranked_players AS (
  SELECT
    s.ctid AS row_id,
    ROW_NUMBER() OVER (
      PARTITION BY s."STAG", s."WEEK", s."TEAM_ID"
      ORDER BY
        CASE WHEN pl."Posiz" = 'POR' THEN 1 ELSE 0 END DESC,
        COALESCE(s."MINUTI", 0) DESC,
        s.ctid ASC
    ) AS rn
  FROM public.as_player_stat s
  LEFT JOIN public.an_player pl ON s."ID" = pl."ID"
  WHERE COALESCE(s."MINUTI", 0) > 0
)
UPDATE public.as_player_stat target
SET "SUB" = false
FROM ranked_players rp
WHERE target.ctid = rp.row_id
  AND rp.rn <= 11;

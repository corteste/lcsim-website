-- ==============================================================================
-- Rollback: 20261031_fix_rookie_traits_count_rpc_rollback.sql
-- Descrizione: Ripristina la precedente implementazione di rpc_get_scouted_rookies
--              definita in 20261024_rookie_encryption.sql.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.rpc_get_scouted_rookies(
  p_team_id TEXT,
  p_admin_passphrase TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, internal_vault, extensions
AS $$
DECLARE
  v_key TEXT;
  v_is_admin_mode BOOLEAN := FALSE;
  v_row RECORD;
  v_tokens INT;
  v_sec JSONB;
  v_item JSONB;
  v_result JSONB := '[]'::JSONB;
BEGIN
  -- Recupera chiave del vault
  SELECT vault_passphrase INTO v_key FROM internal_vault.rookie_key WHERE id = 1;

  IF p_admin_passphrase IS NOT NULL AND v_key IS NOT NULL AND p_admin_passphrase = v_key THEN
    v_is_admin_mode := TRUE;
  END IF;

  FOR v_row IN
    SELECT
      r."ID", r."Nome", r."Cognome", r."DOB", r."Età", r."Nazionalità",
      r."Altezza", r."Peso", r."Posiz", r."Piede", r."Squadra",
      r."Stelle", r."XP",
      r."PreferredPosition2", r."PreferredPosition3", r."PreferredPosition4",
      r.encrypted_data,
      COALESCE(s.tokens_spent, 0) AS tokens_spent
    FROM public.an_rookie r
    LEFT JOIN public.an_rookie_scouting s
      ON s.rookie_id = r."ID" AND s.team_id = p_team_id
    ORDER BY r."ID" ASC
  LOOP
    v_tokens := v_row.tokens_spent;

    -- Oggetto base con campi sempre pubblici
    v_item := jsonb_build_object(
      'ID', v_row."ID",
      'Nome', v_row."Nome",
      'Cognome', v_row."Cognome",
      'DOB', v_row."DOB",
      'Età', v_row."Età",
      'Nazionalità', v_row."Nazionalità",
      'Altezza', v_row."Altezza",
      'Peso', v_row."Peso",
      'Posiz', v_row."Posiz",
      'Piede', v_row."Piede",
      'Squadra', v_row."Squadra",
      'Stelle', v_row."Stelle",
      'XP', v_row."XP",
      'PreferredPosition2', v_row."PreferredPosition2",
      'PreferredPosition3', v_row."PreferredPosition3",
      'PreferredPosition4', v_row."PreferredPosition4",
      'tokens_spent', v_tokens
    );

    -- Se abbiamo la chiave e ci sono dati criptati:
    IF v_key IS NOT NULL AND v_row.encrypted_data IS NOT NULL THEN
      BEGIN
        v_sec := pgp_sym_decrypt(v_row.encrypted_data, v_key)::jsonb;
      EXCEPTION WHEN OTHERS THEN
        v_sec := NULL;
      END;
    ELSE
      v_sec := NULL;
    END IF;

    -- Se Admin Mode con passphrase corretta: TUTTO IN CHIARO
    IF v_is_admin_mode AND v_sec IS NOT NULL THEN
      v_item := v_item || v_sec;
      v_item := jsonb_set(v_item, '{OVR}', COALESCE(v_sec->'OVR', 'null'::jsonb));
    ELSIF v_sec IS NOT NULL THEN
      -- Modalità Manager: applica rigorosamente le fasce di gettoni!

      -- Fascia 5G: Tutto esatto
      IF v_tokens >= 5 THEN
        v_item := v_item || v_sec;

      -- Fascia 3G: Tratti esatti, Ruoli tattici, Piede debole, MABI, Emotion + Range 3
      ELSIF v_tokens >= 3 THEN
        v_item := v_item || jsonb_build_object(
          'OVR', NULL,
          'Role1', v_sec->'Role1',
          'Role2', v_sec->'Role2',
          'Role3', v_sec->'Role3',
          'Trait1', v_sec->'Trait1',
          'Trait2', v_sec->'Trait2',
          'IconTrait1', v_sec->'IconTrait1',
          'IconTrait2', v_sec->'IconTrait2',
          'Tratti', v_sec->'Tratti',
          'Emotion', v_sec->'Emotion',
          'PiedeDebole', v_sec->'PiedeDebole',
          'MABI', v_sec->'MABI',
          -- Reparto DIF
          'CONT', internal_vault.get_range3_mid((v_sec->>'CONT')::NUMERIC),
          'SCIV', internal_vault.get_range3_mid((v_sec->>'SCIV')::NUMERIC),
          'MARC', internal_vault.get_range3_mid((v_sec->>'MARC')::NUMERIC),
          'AGGR', internal_vault.get_range3_mid((v_sec->>'AGGR')::NUMERIC),
          'INTR', internal_vault.get_range3_mid((v_sec->>'INTR')::NUMERIC),
          -- Reparto PAS
          'PASC', internal_vault.get_range3_mid((v_sec->>'PASC')::NUMERIC),
          'PASL', internal_vault.get_range3_mid((v_sec->>'PASL')::NUMERIC),
          'CRSS', internal_vault.get_range3_mid((v_sec->>'CRSS')::NUMERIC),
          'CTRP', internal_vault.get_range3_mid((v_sec->>'CTRP')::NUMERIC),
          'VISI', internal_vault.get_range3_mid((v_sec->>'VISI')::NUMERIC),
          'EFFT', internal_vault.get_range3_mid((v_sec->>'EFFT')::NUMERIC),
          -- Reparto ATT
          'FINA', internal_vault.get_range3_mid((v_sec->>'FINA')::NUMERIC),
          'PIAZ', internal_vault.get_range3_mid((v_sec->>'PIAZ')::NUMERIC),
          'PTIR', internal_vault.get_range3_mid((v_sec->>'PTIR')::NUMERIC),
          'TIRD', internal_vault.get_range3_mid((v_sec->>'TIRD')::NUMERIC),
          'TIRV', internal_vault.get_range3_mid((v_sec->>'TIRV')::NUMERIC),
          'DRBL', internal_vault.get_range3_mid((v_sec->>'DRBL')::NUMERIC),
          'TSTA', internal_vault.get_range3_mid((v_sec->>'TSTA')::NUMERIC),
          -- Reparto FIS
          'VELO', internal_vault.get_range3_mid((v_sec->>'VELO')::NUMERIC),
          'ACCL', internal_vault.get_range3_mid((v_sec->>'ACCL')::NUMERIC),
          'AGIL', internal_vault.get_range3_mid((v_sec->>'AGIL')::NUMERIC),
          'RESI', internal_vault.get_range3_mid((v_sec->>'RESI')::NUMERIC),
          'FRZA', internal_vault.get_range3_mid((v_sec->>'FRZA')::NUMERIC),
          'ELEV', internal_vault.get_range3_mid((v_sec->>'ELEV')::NUMERIC),
          'EQLB', internal_vault.get_range3_mid((v_sec->>'EQLB')::NUMERIC),
          'RIFL', internal_vault.get_range3_mid((v_sec->>'RIFL')::NUMERIC),
          -- Reparto POR
          'PREP', internal_vault.get_range3_mid((v_sec->>'PREP')::NUMERIC),
          'POSP', internal_vault.get_range3_mid((v_sec->>'POSP')::NUMERIC),
          'RINP', internal_vault.get_range3_mid((v_sec->>'RINP')::NUMERIC),
          'RIFP', internal_vault.get_range3_mid((v_sec->>'RIFP')::NUMERIC),
          'TUFP', internal_vault.get_range3_mid((v_sec->>'TUFP')::NUMERIC),
          -- Reparto CPZ & Freddezza
          'PNIZ', internal_vault.get_range3_mid((v_sec->>'PNIZ')::NUMERIC),
          'CRIG', internal_vault.get_range3_mid((v_sec->>'CRIG')::NUMERIC),
          'FRED', internal_vault.get_range3_mid((v_sec->>'FRED')::NUMERIC)
        );

      -- Fascia 2G: Range 3, Emotion, Conteggio Tratti (nomi tratti e ruoli nascosti)
      ELSIF v_tokens >= 2 THEN
        v_item := v_item || jsonb_build_object(
          'OVR', NULL,
          'Role1', NULL,
          'Role2', NULL,
          'Role3', NULL,
          'Trait1', NULL,
          'Trait2', NULL,
          'IconTrait1', NULL,
          'IconTrait2', NULL,
          'Tratti', NULL,
          'TraitsCount', (
            CASE WHEN v_sec->>'Trait1' IS NOT NULL AND v_sec->>'Trait1' != '' AND v_sec->>'Trait1' != 'Nessuno' THEN 1 ELSE 0 END +
            CASE WHEN v_sec->>'Trait2' IS NOT NULL AND v_sec->>'Trait2' != '' AND v_sec->>'Trait2' != 'Nessuno' THEN 1 ELSE 0 END +
            CASE WHEN v_sec->>'IconTrait1' IS NOT NULL AND v_sec->>'IconTrait1' != '' AND v_sec->>'IconTrait1' != 'Nessuno' THEN 1 ELSE 0 END +
            CASE WHEN v_sec->>'IconTrait2' IS NOT NULL AND v_sec->>'IconTrait2' != '' AND v_sec->>'IconTrait2' != 'Nessuno' THEN 1 ELSE 0 END
          ),
          'Emotion', v_sec->'Emotion',
          'PiedeDebole', NULL,
          'MABI', NULL,
          -- Reparto DIF
          'CONT', internal_vault.get_range3_mid((v_sec->>'CONT')::NUMERIC),
          'SCIV', internal_vault.get_range3_mid((v_sec->>'SCIV')::NUMERIC),
          'MARC', internal_vault.get_range3_mid((v_sec->>'MARC')::NUMERIC),
          'AGGR', internal_vault.get_range3_mid((v_sec->>'AGGR')::NUMERIC),
          'INTR', internal_vault.get_range3_mid((v_sec->>'INTR')::NUMERIC),
          -- Reparto PAS
          'PASC', internal_vault.get_range3_mid((v_sec->>'PASC')::NUMERIC),
          'PASL', internal_vault.get_range3_mid((v_sec->>'PASL')::NUMERIC),
          'CRSS', internal_vault.get_range3_mid((v_sec->>'CRSS')::NUMERIC),
          'CTRP', internal_vault.get_range3_mid((v_sec->>'CTRP')::NUMERIC),
          'VISI', internal_vault.get_range3_mid((v_sec->>'VISI')::NUMERIC),
          'EFFT', internal_vault.get_range3_mid((v_sec->>'EFFT')::NUMERIC),
          -- Reparto ATT
          'FINA', internal_vault.get_range3_mid((v_sec->>'FINA')::NUMERIC),
          'PIAZ', internal_vault.get_range3_mid((v_sec->>'PIAZ')::NUMERIC),
          'PTIR', internal_vault.get_range3_mid((v_sec->>'PTIR')::NUMERIC),
          'TIRD', internal_vault.get_range3_mid((v_sec->>'TIRD')::NUMERIC),
          'TIRV', internal_vault.get_range3_mid((v_sec->>'TIRV')::NUMERIC),
          'DRBL', internal_vault.get_range3_mid((v_sec->>'DRBL')::NUMERIC),
          'TSTA', internal_vault.get_range3_mid((v_sec->>'TSTA')::NUMERIC),
          -- Reparto FIS
          'VELO', internal_vault.get_range3_mid((v_sec->>'VELO')::NUMERIC),
          'ACCL', internal_vault.get_range3_mid((v_sec->>'ACCL')::NUMERIC),
          'AGIL', internal_vault.get_range3_mid((v_sec->>'AGIL')::NUMERIC),
          'RESI', internal_vault.get_range3_mid((v_sec->>'RESI')::NUMERIC),
          'FRZA', internal_vault.get_range3_mid((v_sec->>'FRZA')::NUMERIC),
          'ELEV', internal_vault.get_range3_mid((v_sec->>'ELEV')::NUMERIC),
          'EQLB', internal_vault.get_range3_mid((v_sec->>'EQLB')::NUMERIC),
          'RIFL', internal_vault.get_range3_mid((v_sec->>'RIFL')::NUMERIC),
          -- Reparto POR
          'PREP', internal_vault.get_range3_mid((v_sec->>'PREP')::NUMERIC),
          'POSP', internal_vault.get_range3_mid((v_sec->>'POSP')::NUMERIC),
          'RINP', internal_vault.get_range3_mid((v_sec->>'RINP')::NUMERIC),
          'RIFP', internal_vault.get_range3_mid((v_sec->>'RIFP')::NUMERIC),
          'TUFP', internal_vault.get_range3_mid((v_sec->>'TUFP')::NUMERIC),
          -- Reparto CPZ & Freddezza
          'PNIZ', internal_vault.get_range3_mid((v_sec->>'PNIZ')::NUMERIC),
          'CRIG', internal_vault.get_range3_mid((v_sec->>'CRIG')::NUMERIC),
          'FRED', internal_vault.get_range3_mid((v_sec->>'FRED')::NUMERIC)
        );

      -- Fascia 1G: Stima Abilità (Range 10), tutto il resto nascosto
      ELSIF v_tokens >= 1 THEN
        v_item := v_item || jsonb_build_object(
          'OVR', NULL,
          'Role1', NULL,
          'Role2', NULL,
          'Role3', NULL,
          'Trait1', NULL,
          'Trait2', NULL,
          'IconTrait1', NULL,
          'IconTrait2', NULL,
          'Tratti', NULL,
          'Emotion', NULL,
          'PiedeDebole', NULL,
          'MABI', NULL,
          -- Reparto DIF
          'CONT', internal_vault.get_range10_mid((v_sec->>'CONT')::NUMERIC),
          'SCIV', internal_vault.get_range10_mid((v_sec->>'SCIV')::NUMERIC),
          'MARC', internal_vault.get_range10_mid((v_sec->>'MARC')::NUMERIC),
          'AGGR', internal_vault.get_range10_mid((v_sec->>'AGGR')::NUMERIC),
          'INTR', internal_vault.get_range10_mid((v_sec->>'INTR')::NUMERIC),
          -- Reparto PAS
          'PASC', internal_vault.get_range10_mid((v_sec->>'PASC')::NUMERIC),
          'PASL', internal_vault.get_range10_mid((v_sec->>'PASL')::NUMERIC),
          'CRSS', internal_vault.get_range10_mid((v_sec->>'CRSS')::NUMERIC),
          'CTRP', internal_vault.get_range10_mid((v_sec->>'CTRP')::NUMERIC),
          'VISI', internal_vault.get_range10_mid((v_sec->>'VISI')::NUMERIC),
          'EFFT', internal_vault.get_range10_mid((v_sec->>'EFFT')::NUMERIC),
          -- Reparto ATT
          'FINA', internal_vault.get_range10_mid((v_sec->>'FINA')::NUMERIC),
          'PIAZ', internal_vault.get_range10_mid((v_sec->>'PIAZ')::NUMERIC),
          'PTIR', internal_vault.get_range10_mid((v_sec->>'PTIR')::NUMERIC),
          'TIRD', internal_vault.get_range10_mid((v_sec->>'TIRD')::NUMERIC),
          'TIRV', internal_vault.get_range10_mid((v_sec->>'TIRV')::NUMERIC),
          'DRBL', internal_vault.get_range10_mid((v_sec->>'DRBL')::NUMERIC),
          'TSTA', internal_vault.get_range10_mid((v_sec->>'TSTA')::NUMERIC),
          -- Reparto FIS
          'VELO', internal_vault.get_range10_mid((v_sec->>'VELO')::NUMERIC),
          'ACCL', internal_vault.get_range10_mid((v_sec->>'ACCL')::NUMERIC),
          'AGIL', internal_vault.get_range10_mid((v_sec->>'AGIL')::NUMERIC),
          'RESI', internal_vault.get_range10_mid((v_sec->>'RESI')::NUMERIC),
          'FRZA', internal_vault.get_range10_mid((v_sec->>'FRZA')::NUMERIC),
          'ELEV', internal_vault.get_range10_mid((v_sec->>'ELEV')::NUMERIC),
          'EQLB', internal_vault.get_range10_mid((v_sec->>'EQLB')::NUMERIC),
          'RIFL', internal_vault.get_range10_mid((v_sec->>'RIFL')::NUMERIC),
          -- Reparto POR
          'PREP', internal_vault.get_range10_mid((v_sec->>'PREP')::NUMERIC),
          'POSP', internal_vault.get_range10_mid((v_sec->>'POSP')::NUMERIC),
          'RINP', internal_vault.get_range10_mid((v_sec->>'RINP')::NUMERIC),
          'RIFP', internal_vault.get_range10_mid((v_sec->>'RIFP')::NUMERIC),
          'TUFP', internal_vault.get_range10_mid((v_sec->>'TUFP')::NUMERIC),
          -- Reparto CPZ & Freddezza
          'PNIZ', internal_vault.get_range10_mid((v_sec->>'PNIZ')::NUMERIC),
          'CRIG', internal_vault.get_range10_mid((v_sec->>'CRIG')::NUMERIC),
          'FRED', internal_vault.get_range10_mid((v_sec->>'FRED')::NUMERIC)
        );
      END IF;
    END IF;

    v_result := v_result || jsonb_build_array(v_item);
  END LOOP;

  RETURN v_result;
END;
$$;

DROP FUNCTION IF EXISTS internal_vault.count_comma_traits(TEXT);

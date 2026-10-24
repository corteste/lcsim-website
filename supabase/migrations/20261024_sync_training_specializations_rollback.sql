-- Rollback: restore previous version of recompute_ea_player_from_an_and_training
CREATE OR REPLACE FUNCTION public.recompute_ea_player_from_an_and_training(p_player_id BIGINT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_an RECORD;
    v_tr RECORD;
    v_inc JSONB := '{}'::JSONB;
    v_port BIGINT := 0;
    v_porf BIGINT := 0;
    v_diff BIGINT := 0;
    v_difm BIGINT := 0;
    v_cenp BIGINT := 0;
    v_ceng BIGINT := 0;
    v_attt BIGINT := 0;
    v_attc BIGINT := 0;
    v_fisv BIGINT := 0;
    v_fisp BIGINT := 0;
    v_fisr BIGINT := 0;
    v_calc BIGINT := 0;
    v_silver_str TEXT;
    v_gold_str TEXT;
BEGIN
    SELECT * INTO v_an FROM public.an_player WHERE "ID" = p_player_id;
    IF NOT FOUND THEN
        RETURN;
    END IF;

    SELECT * INTO v_tr FROM public.an_player_training WHERE "PlayerID" = p_player_id;
    IF FOUND AND v_tr.increases IS NOT NULL THEN
        v_inc := v_tr.increases::JSONB;
        v_port := COALESCE((v_inc->>'PORT')::BIGINT, 0);
        v_porf := COALESCE((v_inc->>'PORF')::BIGINT, 0);
        v_diff := COALESCE((v_inc->>'DIFF')::BIGINT, 0);
        v_difm := COALESCE((v_inc->>'DIFM')::BIGINT, 0);
        v_cenp := COALESCE((v_inc->>'CENP')::BIGINT, 0);
        v_ceng := COALESCE((v_inc->>'CENG')::BIGINT, 0);
        v_attt := COALESCE((v_inc->>'ATTT')::BIGINT, 0);
        v_attc := COALESCE((v_inc->>'ATTC')::BIGINT, 0);
        v_fisv := COALESCE((v_inc->>'FISV')::BIGINT, 0);
        v_fisp := COALESCE((v_inc->>'FISP')::BIGINT, 0);
        v_fisr := COALESCE((v_inc->>'FISR')::BIGINT, 0);
        v_calc := COALESCE((v_inc->>'CALC')::BIGINT, 0);
    END IF;

    v_silver_str := CONCAT_WS(', ', NULLIF(TRIM(COALESCE(v_an."Trait1", '')), ''), NULLIF(TRIM(COALESCE(v_an."Trait2", '')), ''));
    v_gold_str   := CONCAT_WS(', ', NULLIF(TRIM(COALESCE(v_an."IconTrait1", '')), ''), NULLIF(TRIM(COALESCE(v_an."IconTrait2", '')), ''));

    UPDATE public.ea_player_db
    SET
        birthdate = COALESCE(v_an."DOB", birthdate),
        height = COALESCE(v_an."Altezza", height),
        weight = COALESCE(v_an."Peso", weight),
        preferredposition1 = COALESCE(public.encode_ea_position(v_an."Posiz"), preferredposition1),
        role1 = CASE WHEN v_an."Role1" IS NOT NULL THEN public.encode_ea_role(v_an."Role1", v_an."Posiz") ELSE 0 END,
        role2 = CASE WHEN v_an."Role2" IS NOT NULL THEN public.encode_ea_role(v_an."Role2", v_an."Posiz") ELSE 0 END,
        role3 = CASE WHEN v_an."Role3" IS NOT NULL THEN public.encode_ea_role(v_an."Role3", v_an."Posiz") ELSE role3 END,
        trait1 = public.encode_ea_trait1(v_silver_str),
        trait2 = public.encode_ea_trait2(v_silver_str),
        icontrait1 = public.encode_ea_trait1(v_gold_str),
        icontrait2 = public.encode_ea_trait2(v_gold_str),
        overallrating = COALESCE(v_tr.post_ovr, v_an."OVR", overallrating),
        potential = GREATEST(COALESCE(v_tr.post_ovr, v_an."OVR", overallrating), COALESCE(v_an."POTN", potential)),
        bodytypecode = COALESCE(v_an."BodyType", bodytypecode),
        emotion = COALESCE(v_an."Emotion", emotion),
        gkhandling = LEAST(99, COALESCE(v_an."PREP", gkhandling) + v_port),
        gkpositioning = LEAST(99, COALESCE(v_an."POSP", gkpositioning) + v_port),
        gkkicking = LEAST(99, COALESCE(v_an."RINP", gkkicking) + v_port),
        gkreflexes = LEAST(99, COALESCE(v_an."RIFP", gkreflexes) + v_porf),
        gkdiving = LEAST(99, COALESCE(v_an."TUFP", gkdiving) + v_porf),
        standingtackle = LEAST(99, COALESCE(v_an."CONT", standingtackle) + v_diff),
        slidingtackle = LEAST(99, COALESCE(v_an."SCIV", slidingtackle) + v_diff),
        defensiveawareness = LEAST(99, COALESCE(v_an."MARC", defensiveawareness) + v_difm),
        aggression = LEAST(99, COALESCE(v_an."AGGR", aggression) + v_difm),
        interceptions = LEAST(99, COALESCE(v_an."INTR", interceptions) + v_difm),
        shortpassing = LEAST(99, COALESCE(v_an."PASC", shortpassing) + v_cenp),
        longpassing = LEAST(99, COALESCE(v_an."PASL", longpassing) + v_cenp),
        crossing = LEAST(99, COALESCE(v_an."CRSS", crossing) + v_cenp),
        ballcontrol = LEAST(99, COALESCE(v_an."CTRP", ballcontrol) + v_ceng),
        vision = LEAST(99, COALESCE(v_an."VISI", vision) + v_ceng),
        curve = LEAST(99, COALESCE(v_an."EFFT", curve) + v_ceng),
        shotpower = LEAST(99, COALESCE(v_an."PTIR", shotpower) + v_attt),
        longshots = LEAST(99, COALESCE(v_an."TIRD", longshots) + v_attt),
        volleys = LEAST(99, COALESCE(v_an."TIRV", volleys) + v_attt),
        dribbling = LEAST(99, COALESCE(v_an."DRBL", dribbling) + v_attc),
        positioning = LEAST(99, COALESCE(v_an."PIAZ", positioning) + v_attc),
        finishing = LEAST(99, COALESCE(v_an."FINA", finishing) + v_attc),
        acceleration = LEAST(99, COALESCE(v_an."ACCL", acceleration) + v_fisv),
        sprintspeed = LEAST(99, COALESCE(v_an."VELO", sprintspeed) + v_fisv),
        agility = LEAST(99, COALESCE(v_an."AGIL", agility) + v_fisv),
        stamina = LEAST(99, COALESCE(v_an."RESI", stamina) + v_fisp),
        balance = LEAST(99, COALESCE(v_an."EQLB", balance) + v_fisp),
        strength = LEAST(99, COALESCE(v_an."FRZA", strength) + v_fisp),
        headingaccuracy = LEAST(99, COALESCE(v_an."TSTA", headingaccuracy) + v_fisr),
        reactions = LEAST(99, COALESCE(v_an."RIFL", reactions) + v_fisr),
        jumping = LEAST(99, COALESCE(v_an."ELEV", jumping) + v_fisr),
        freekickaccuracy = LEAST(99, COALESCE(v_an."PNIZ", freekickaccuracy) + v_calc),
        penalties = LEAST(99, COALESCE(v_an."CRIG", penalties) + v_calc),
        composure = LEAST(99, COALESCE(v_an."FRED", composure) + v_calc)
    WHERE playerid = p_player_id;
END;
$$;

-- ==============================================================================
-- LCSIM - Tabella Master EA FC 25 (public.ea_player_db) e Sincronizzazione Bidirezionale
-- Basata sul tracciato a 137 colonne del file DB_NEW- Sheet217.txt
-- ==============================================================================

-- 1. Creazione tabella public.ea_player_db (137 colonne ufficiali EA FC 25 in ordine nativo)
CREATE TABLE IF NOT EXISTS public.ea_player_db (
    haircolorcode BIGINT,
    facialhairtypecode BIGINT,
    curve BIGINT,
    jerseystylecode BIGINT,
    agility BIGINT,
    tattooback BIGINT,
    accessorycode4 BIGINT,
    gksavetype BIGINT,
    positioning BIGINT,
    tattooleftarm BIGINT,
    hairtypecode BIGINT,
    standingtackle BIGINT,
    preferredposition3 BIGINT,
    longpassing BIGINT,
    penalties BIGINT,
    animfreekickstartposcode BIGINT,
    lipcolor BIGINT,
    isretiring BIGINT,
    longshots BIGINT,
    gkdiving BIGINT,
    icontrait2 BIGINT,
    interceptions BIGINT,
    shoecolorcode2 BIGINT,
    crossing BIGINT,
    potential BIGINT,
    gkreflexes BIGINT,
    finishingcode1 BIGINT,
    reactions BIGINT,
    composure BIGINT,
    skinsurfacepack BIGINT,
    vision BIGINT,
    contractvaliduntil BIGINT,
    finishing BIGINT,
    dribbling BIGINT,
    slidingtackle BIGINT,
    accessorycode3 BIGINT,
    accessorycolourcode1 BIGINT,
    headtypecode BIGINT,
    firstnameid BIGINT,
    driref BIGINT,
    sprintspeed BIGINT,
    undershortstyle BIGINT,
    height BIGINT,
    role3 BIGINT,
    hasseasonaljersey BIGINT,
    tattoohead BIGINT,
    preferredposition2 BIGINT,
    strength BIGINT,
    shoetypecode BIGINT,
    birthdate BIGINT,
    preferredposition1 BIGINT,
    tattooleftleg BIGINT,
    skinmakeup BIGINT,
    ballcontrol BIGINT,
    phypos BIGINT,
    shotpower BIGINT,
    trait1 BIGINT,
    socklengthcode BIGINT,
    weight BIGINT,
    hashighqualityhead BIGINT,
    eyedetail BIGINT,
    gkglovetypecode BIGINT,
    tattoorightarm BIGINT,
    icontrait1 BIGINT,
    balance BIGINT,
    gender BIGINT,
    headassetid BIGINT,
    gkkicking BIGINT,
    lastnameid BIGINT,
    defspe BIGINT,
    internationalrep BIGINT,
    shortpassing BIGINT,
    freekickaccuracy BIGINT,
    skillmoves BIGINT,
    faceposerpreset BIGINT,
    usercaneditname BIGINT,
    avatarpomid BIGINT,
    finishingcode2 BIGINT,
    role2 BIGINT,
    aggression BIGINT,
    acceleration BIGINT,
    paskic BIGINT,
    headingaccuracy BIGINT,
    role1 BIGINT,
    iscustomized BIGINT,
    eyebrowcode BIGINT,
    runningcode2 BIGINT,
    modifier BIGINT,
    gkhandling BIGINT,
    eyecolorcode BIGINT,
    jerseysleevelengthcode BIGINT,
    accessorycolourcode3 BIGINT,
    accessorycode1 BIGINT,
    playerjointeamdate BIGINT,
    headclasscode BIGINT,
    tattoofront BIGINT,
    nationality BIGINT,
    preferredfoot BIGINT,
    sideburnscode BIGINT,
    weakfootabilitytypecode BIGINT,
    jumping BIGINT,
    skintypecode BIGINT,
    personality BIGINT,
    gkkickstyle BIGINT,
    stamina BIGINT,
    playerid BIGINT PRIMARY KEY REFERENCES public.an_player("ID") ON UPDATE CASCADE ON DELETE CASCADE,
    accessorycolourcode4 BIGINT,
    gkpositioning BIGINT,
    headvariation BIGINT,
    skillmoveslikelihood BIGINT,
    trait2 BIGINT,
    shohan BIGINT,
    skintonecode BIGINT,
    shortstyle BIGINT,
    overallrating BIGINT,
    smallsidedshoetypecode BIGINT,
    emotion BIGINT,
    runstylecode BIGINT,
    muscularitycode BIGINT,
    skincomplexion BIGINT,
    jerseyfit BIGINT,
    accessorycode2 BIGINT,
    shoedesigncode BIGINT,
    playerjerseynameid BIGINT,
    shoecolorcode1 BIGINT,
    hairstylecode BIGINT,
    commonnameid BIGINT,
    bodytypecode BIGINT,
    animpenaltiesstartposcode BIGINT,
    pacdiv BIGINT,
    defensiveawareness BIGINT,
    runningcode1 BIGINT,
    preferredposition4 BIGINT,
    volleys BIGINT,
    accessorycolourcode2 BIGINT,
    tattoorightleg BIGINT,
    facialhaircolorcode BIGINT
);

-- 2. Aggiunta colonne decodificate opzionali su public.an_player (Role3 e Posizioni Secondarie)
ALTER TABLE public.an_player
    ADD COLUMN IF NOT EXISTS "Role3" TEXT,
    ADD COLUMN IF NOT EXISTS "PreferredPosition2" TEXT,
    ADD COLUMN IF NOT EXISTS "PreferredPosition3" TEXT,
    ADD COLUMN IF NOT EXISTS "PreferredPosition4" TEXT;

-- 3. Abilitazione RLS e Policy su public.ea_player_db
ALTER TABLE public.ea_player_db ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read ea_player_db" ON public.ea_player_db;
CREATE POLICY "Anyone can read ea_player_db"
    ON public.ea_player_db FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Allow write ea_player_db" ON public.ea_player_db;
CREATE POLICY "Allow write ea_player_db"
    ON public.ea_player_db FOR ALL
    USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ea_player_db TO anon, authenticated, service_role;

-- 4. Funzioni di Decodifica Codici EA FC 25 -> Etichette LCSIM

-- 4a. Decodifica Nazionalità EA FC 25
CREATE OR REPLACE FUNCTION public.decode_ea_nationality(p_code BIGINT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT CASE p_code
        WHEN 1 THEN 'ALB'
        WHEN 4 THEN 'AUT'
        WHEN 7 THEN 'BEL'
        WHEN 8 THEN 'BIH'
        WHEN 9 THEN 'BUL'
        WHEN 10 THEN 'CRO'
        WHEN 11 THEN 'CYP'
        WHEN 12 THEN 'CZE'
        WHEN 13 THEN 'DEN'
        WHEN 14 THEN 'ENG'
        WHEN 15 THEN 'MNE'
        WHEN 17 THEN 'FIN'
        WHEN 18 THEN 'FRA'
        WHEN 20 THEN 'GEO'
        WHEN 21 THEN 'GER'
        WHEN 22 THEN 'GRE'
        WHEN 23 THEN 'HUN'
        WHEN 24 THEN 'ISL'
        WHEN 25 THEN 'IRL'
        WHEN 26 THEN 'ISR'
        WHEN 27 THEN 'ITA'
        WHEN 28 THEN 'LET'
        WHEN 30 THEN 'LIT'
        WHEN 31 THEN 'LUX'
        WHEN 34 THEN 'NED'
        WHEN 35 THEN 'NIR'
        WHEN 36 THEN 'NOR'
        WHEN 37 THEN 'POL'
        WHEN 38 THEN 'POR'
        WHEN 39 THEN 'ROU'
        WHEN 40 THEN 'RUS'
        WHEN 41 THEN 'RSM'
        WHEN 42 THEN 'SCO'
        WHEN 43 THEN 'SVK'
        WHEN 44 THEN 'SVN'
        WHEN 45 THEN 'ESP'
        WHEN 46 THEN 'SWE'
        WHEN 47 THEN 'SWI'
        WHEN 48 THEN 'TUR'
        WHEN 49 THEN 'UKR'
        WHEN 50 THEN 'WAL'
        WHEN 51 THEN 'SRB'
        WHEN 52 THEN 'ARG'
        WHEN 53 THEN 'BOL'
        WHEN 54 THEN 'BRA'
        WHEN 55 THEN 'CHI'
        WHEN 56 THEN 'COL'
        WHEN 57 THEN 'ECU'
        WHEN 58 THEN 'PAR'
        WHEN 59 THEN 'PER'
        WHEN 60 THEN 'URU'
        WHEN 61 THEN 'VEN'
        WHEN 66 THEN 'BAR'
        WHEN 70 THEN 'CAN'
        WHEN 72 THEN 'CRC'
        WHEN 82 THEN 'JAM'
        WHEN 83 THEN 'MEX'
        WHEN 95 THEN 'USA'
        WHEN 97 THEN 'ALG'
        WHEN 98 THEN 'ANG'
        WHEN 103 THEN 'CAM'
        WHEN 108 THEN 'CIV'
        WHEN 110 THEN 'COD'
        WHEN 111 THEN 'EGY'
        WHEN 115 THEN 'GAB'
        WHEN 117 THEN 'GHA'
        WHEN 118 THEN 'GUI'
        WHEN 126 THEN 'MLI'
        WHEN 129 THEN 'MOR'
        WHEN 133 THEN 'NGA'
        WHEN 136 THEN 'SEN'
        WHEN 140 THEN 'RSA'
        WHEN 145 THEN 'TUN'
        WHEN 159 THEN 'IRN'
        WHEN 163 THEN 'JPN'
        WHEN 167 THEN 'KOR'
        WHEN 183 THEN 'KSA'
        WHEN 195 THEN 'AUS'
        WHEN 198 THEN 'NZL'
        WHEN 208 THEN 'EST'
        WHEN 219 THEN 'KOS'
        ELSE COALESCE(p_code::TEXT, 'ITA')
    END;
$$;

-- 4b. Decodifica Posizione EA FC 25
CREATE OR REPLACE FUNCTION public.decode_ea_position(p_code BIGINT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT CASE p_code
        WHEN 0 THEN 'POR'
        WHEN 2 THEN 'TD'
        WHEN 3 THEN 'TD'
        WHEN 4 THEN 'DC'
        WHEN 5 THEN 'DC'
        WHEN 6 THEN 'DC'
        WHEN 7 THEN 'TS'
        WHEN 8 THEN 'TS'
        WHEN 9 THEN 'CDC'
        WHEN 10 THEN 'CDC'
        WHEN 11 THEN 'CDC'
        WHEN 12 THEN 'ED'
        WHEN 13 THEN 'CC'
        WHEN 14 THEN 'CC'
        WHEN 15 THEN 'CC'
        WHEN 16 THEN 'ES'
        WHEN 17 THEN 'COC'
        WHEN 18 THEN 'COC'
        WHEN 19 THEN 'COC'
        WHEN 20 THEN 'AT'
        WHEN 21 THEN 'AT'
        WHEN 22 THEN 'AT'
        WHEN 23 THEN 'AD'
        WHEN 24 THEN 'ATT'
        WHEN 25 THEN 'ATT'
        WHEN 26 THEN 'ATT'
        WHEN 27 THEN 'AS'
        ELSE NULL
    END;
$$;

-- 4c. Decodifica Ruoli Giocatore EA FC 25 (Role+ = 1..44, Role++ = 101..144)
CREATE OR REPLACE FUNCTION public.decode_ea_role(p_code BIGINT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    v_base BIGINT;
    v_suffix TEXT;
    v_name TEXT;
BEGIN
    IF p_code IS NULL OR p_code <= 0 THEN
        RETURN NULL;
    END IF;

    IF p_code > 100 THEN
        v_base := p_code - 100;
        v_suffix := ' ++';
    ELSE
        v_base := p_code;
        v_suffix := ' +';
    END IF;

    v_name := CASE v_base
        WHEN 1 THEN 'Portiere Classico'
        WHEN 2 THEN 'Portiere Fuori Dai Pali'
        WHEN 3 THEN 'Terzino'
        WHEN 4 THEN 'Falso Difensore'
        WHEN 5 THEN 'Tornante'
        WHEN 6 THEN 'Terzino di Spinta'
        WHEN 7 THEN 'Terzino'
        WHEN 8 THEN 'Falso Difensore'
        WHEN 9 THEN 'Tornante'
        WHEN 10 THEN 'Terzino di Spinta'
        WHEN 11 THEN 'Difensore'
        WHEN 12 THEN 'Stopper'
        WHEN 13 THEN 'Regista Difensivo'
        WHEN 14 THEN 'Centrocampista di Contenimento'
        WHEN 15 THEN 'Centromediano'
        WHEN 16 THEN 'Regista Arretrato'
        WHEN 17 THEN 'Centrocampista d''Ampiezza'
        WHEN 18 THEN 'Box To Box'
        WHEN 19 THEN 'Centrocampista di Contenimento'
        WHEN 20 THEN 'Regista Arretrato'
        WHEN 21 THEN 'Regista'
        WHEN 22 THEN 'Mezzala'
        WHEN 23 THEN 'Ala'
        WHEN 24 THEN 'Esterno di Centrocampo'
        WHEN 25 THEN 'Regista Largo'
        WHEN 26 THEN 'Attaccante Interno'
        WHEN 27 THEN 'Ala'
        WHEN 28 THEN 'Esterno di Centrocampo'
        WHEN 29 THEN 'Regista Largo'
        WHEN 30 THEN 'Attaccante Interno'
        WHEN 31 THEN 'Regista'
        WHEN 32 THEN 'Attaccante Ombra'
        WHEN 33 THEN 'Mezzala'
        WHEN 34 THEN '10 Vecchia Scuola'
        WHEN 35 THEN 'Ala'
        WHEN 36 THEN 'Attaccante Interno'
        WHEN 37 THEN 'Regista Largo'
        WHEN 38 THEN 'Ala'
        WHEN 39 THEN 'Attaccante Interno'
        WHEN 40 THEN 'Regista Largo'
        WHEN 41 THEN 'Attaccante Avanzato'
        WHEN 42 THEN 'Rapace'
        WHEN 43 THEN 'Falso 9'
        WHEN 44 THEN 'Torre'
        ELSE NULL
    END;

    IF v_name IS NULL THEN
        RETURN NULL;
    END IF;

    RETURN v_name || v_suffix;
END;
$$;

-- 4d. Decodifica Bitmask PlayStyles (trait1 / icontrait1)
CREATE OR REPLACE FUNCTION public.decode_ea_trait1(p_mask BIGINT, p_is_plus BOOLEAN DEFAULT false)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    v_items TEXT[] := ARRAY[]::TEXT[];
    v_suf TEXT := CASE WHEN p_is_plus THEN '+' ELSE '' END;
BEGIN
    IF p_mask IS NULL OR p_mask <= 0 THEN
        RETURN NULL;
    END IF;

    IF (p_mask & 1) <> 0 THEN v_items := array_append(v_items, 'Finesse Shot' || v_suf); END IF;
    IF (p_mask & 2) <> 0 THEN v_items := array_append(v_items, 'Chip Shot' || v_suf); END IF;
    IF (p_mask & 4) <> 0 THEN v_items := array_append(v_items, 'Power Shot' || v_suf); END IF;
    IF (p_mask & 8) <> 0 THEN v_items := array_append(v_items, 'Dead Ball' || v_suf); END IF;
    IF (p_mask & 16) <> 0 THEN v_items := array_append(v_items, 'Power Header' || v_suf); END IF;
    IF (p_mask & 32) <> 0 THEN v_items := array_append(v_items, 'Incisive Pass' || v_suf); END IF;
    IF (p_mask & 64) <> 0 THEN v_items := array_append(v_items, 'Pinged Pass' || v_suf); END IF;
    IF (p_mask & 128) <> 0 THEN v_items := array_append(v_items, 'Long Ball Pass' || v_suf); END IF;
    IF (p_mask & 256) <> 0 THEN v_items := array_append(v_items, 'Tiki Taka' || v_suf); END IF;
    IF (p_mask & 512) <> 0 THEN v_items := array_append(v_items, 'Whipped Pass' || v_suf); END IF;
    IF (p_mask & 1024) <> 0 THEN v_items := array_append(v_items, 'Jockey' || v_suf); END IF;
    IF (p_mask & 2048) <> 0 THEN v_items := array_append(v_items, 'Block' || v_suf); END IF;
    IF (p_mask & 4096) <> 0 THEN v_items := array_append(v_items, 'Intercept' || v_suf); END IF;
    IF (p_mask & 8192) <> 0 THEN v_items := array_append(v_items, 'Anticipate' || v_suf); END IF;
    IF (p_mask & 16384) <> 0 THEN v_items := array_append(v_items, 'Slide Tackle' || v_suf); END IF;
    IF (p_mask & 32768) <> 0 THEN v_items := array_append(v_items, 'Bruiser' || v_suf); END IF;
    IF (p_mask & 65536) <> 0 THEN v_items := array_append(v_items, 'Technical' || v_suf); END IF;
    IF (p_mask & 131072) <> 0 THEN v_items := array_append(v_items, 'Rapid' || v_suf); END IF;
    IF (p_mask & 262144) <> 0 THEN v_items := array_append(v_items, 'Flair' || v_suf); END IF;
    IF (p_mask & 524288) <> 0 THEN v_items := array_append(v_items, 'First Touch' || v_suf); END IF;
    IF (p_mask & 1048576) <> 0 THEN v_items := array_append(v_items, 'Trickster' || v_suf); END IF;
    IF (p_mask & 2097152) <> 0 THEN v_items := array_append(v_items, 'Press Proven' || v_suf); END IF;
    IF (p_mask & 4194304) <> 0 THEN v_items := array_append(v_items, 'Quick Step' || v_suf); END IF;
    IF (p_mask & 8388608) <> 0 THEN v_items := array_append(v_items, 'Relentless' || v_suf); END IF;
    IF (p_mask & 16777216) <> 0 THEN v_items := array_append(v_items, 'Trivela' || v_suf); END IF;
    IF (p_mask & 33554432) <> 0 THEN v_items := array_append(v_items, 'Acrobatic' || v_suf); END IF;
    IF (p_mask & 67108864) <> 0 THEN v_items := array_append(v_items, 'Long Throw' || v_suf); END IF;
    IF (p_mask & 134217728) <> 0 THEN v_items := array_append(v_items, 'Aerial' || v_suf); END IF;
    IF (p_mask & 268435456) <> 0 THEN v_items := array_append(v_items, 'Footwork' || v_suf); END IF;
    IF (p_mask & 536870912) <> 0 THEN v_items := array_append(v_items, 'Far Reach' || v_suf); END IF;

    IF array_length(v_items, 1) IS NULL THEN
        RETURN NULL;
    END IF;

    RETURN array_to_string(v_items, ', ');
END;
$$;

-- 4e. Decodifica Bitmask PlayStyles GK & Trait CPU (trait2 / icontrait2)
CREATE OR REPLACE FUNCTION public.decode_ea_trait2(p_mask BIGINT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    v_items TEXT[] := ARRAY[]::TEXT[];
BEGIN
    IF p_mask IS NULL OR p_mask <= 0 THEN
        RETURN NULL;
    END IF;

    IF (p_mask & 1) <> 0 THEN v_items := array_append(v_items, 'Cross Claimer'); END IF;
    IF (p_mask & 2) <> 0 THEN v_items := array_append(v_items, 'Rush Out'); END IF;
    IF (p_mask & 4) <> 0 THEN v_items := array_append(v_items, 'Far Throw'); END IF;
    IF (p_mask & 8) <> 0 THEN v_items := array_append(v_items, 'Quick Reflexes'); END IF;
    IF (p_mask & 16) <> 0 THEN v_items := array_append(v_items, 'Long Shot Taker'); END IF;
    IF (p_mask & 32) <> 0 THEN v_items := array_append(v_items, 'Early Crosser'); END IF;
    IF (p_mask & 64) <> 0 THEN v_items := array_append(v_items, 'Solid Player'); END IF;
    IF (p_mask & 128) <> 0 THEN v_items := array_append(v_items, 'Team Player'); END IF;
    IF (p_mask & 256) <> 0 THEN v_items := array_append(v_items, 'One Club Player'); END IF;
    IF (p_mask & 512) <> 0 THEN v_items := array_append(v_items, 'Injury Prone'); END IF;
    IF (p_mask & 1024) <> 0 THEN v_items := array_append(v_items, 'Leadership'); END IF;

    IF array_length(v_items, 1) IS NULL THEN
        RETURN NULL;
    END IF;

    RETURN array_to_string(v_items, ', ');
END;
$$;

-- 5. Trigger: Sincronizzazione da public.ea_player_db -> public.an_player
CREATE OR REPLACE FUNCTION public.fn_sync_ea_to_an_player()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE public.an_player
    SET
        "DOB" = NEW.birthdate,
        "Età" = ROUND(25.0 + (152583.0 - COALESCE(NEW.birthdate, 152583)::NUMERIC) / 365.25)::BIGINT,
        "Nazionalità" = public.decode_ea_nationality(NEW.nationality),
        "Altezza" = NEW.height,
        "Peso" = NEW.weight,
        "Posiz" = COALESCE(public.decode_ea_position(NEW.preferredposition1), "Posiz"),
        "PreferredPosition2" = public.decode_ea_position(NEW.preferredposition2),
        "PreferredPosition3" = public.decode_ea_position(NEW.preferredposition3),
        "PreferredPosition4" = public.decode_ea_position(NEW.preferredposition4),
        "Piede" = CASE NEW.preferredfoot WHEN 2 THEN 'SX' ELSE 'DX' END,
        "PiedeDebole" = REPEAT('⭐', GREATEST(1, LEAST(5, COALESCE(NEW.weakfootabilitytypecode, 1)::INT))),
        "MABI" = REPEAT('⭐', GREATEST(1, LEAST(5, COALESCE(NEW.skillmoves, 0)::INT + 1))),
        "Role1" = public.decode_ea_role(NEW.role1),
        "Role2" = public.decode_ea_role(NEW.role2),
        "Role3" = public.decode_ea_role(NEW.role3),
        "OVR" = NEW.overallrating,
        "POTN" = NEW.potential,
        "Trait1" = public.decode_ea_trait1(NEW.trait1, false),
        "Trait2" = public.decode_ea_trait2(NEW.trait2),
        "IconTrait1" = public.decode_ea_trait1(NEW.icontrait1, true),
        "IconTrait2" = public.decode_ea_trait2(NEW.icontrait2),
        "BodyType" = NEW.bodytypecode,
        "Emotion" = NEW.emotion,
        "FRED" = NEW.composure,
        "RIFP" = NEW.gkreflexes,
        "PREP" = NEW.gkhandling,
        "TUFP" = NEW.gkdiving,
        "POSP" = NEW.gkpositioning,
        "RINP" = NEW.gkkicking,
        "MARC" = NEW.defensiveawareness,
        "CONT" = NEW.standingtackle,
        "AGGR" = NEW.aggression,
        "SCIV" = NEW.slidingtackle,
        "INTR" = NEW.interceptions,
        "PASC" = NEW.shortpassing,
        "PASL" = NEW.longpassing,
        "CRSS" = NEW.crossing,
        "CTRP" = NEW.ballcontrol,
        "VISI" = NEW.vision,
        "EFFT" = NEW.curve,
        "PIAZ" = NEW.positioning,
        "PTIR" = NEW.shotpower,
        "TIRD" = NEW.longshots,
        "DRBL" = NEW.dribbling,
        "TIRV" = NEW.volleys,
        "TSTA" = NEW.headingaccuracy,
        "FINA" = NEW.finishing,
        "ACCL" = NEW.acceleration,
        "VELO" = NEW.sprintspeed,
        "RESI" = NEW.stamina,
        "FRZA" = NEW.strength,
        "AGIL" = NEW.agility,
        "ELEV" = NEW.jumping,
        "RIFL" = NEW.reactions,
        "EQLB" = NEW.balance,
        "PNIZ" = NEW.freekickaccuracy,
        "CRIG" = NEW.penalties,
        "JerseyStyle" = NEW.jerseystylecode,
        "JerseyFit" = NEW.jerseyfit,
        "SleeveLength" = NEW.jerseysleevelengthcode,
        "SeasonalJersey" = NEW.hasseasonaljersey,
        "GKGloves" = NEW.gkglovetypecode,
        "Shoe" = NEW.shoetypecode,
        "SockLength" = NEW.socklengthcode,
        "Accessory1" = NEW.accessorycode1,
        "Colour" = NEW.accessorycolourcode1,
        "Accessory2" = NEW.accessorycode2,
        "Colour_1" = NEW.accessorycolourcode2,
        "Accessory3" = NEW.accessorycode3,
        "Colour_2" = NEW.accessorycolourcode3,
        "Accessory4" = NEW.accessorycode4,
        "Colour_3" = NEW.accessorycolourcode4
    WHERE "ID" = NEW.playerid;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_ea_to_an_player ON public.ea_player_db;
CREATE TRIGGER trg_sync_ea_to_an_player
    AFTER INSERT OR UPDATE ON public.ea_player_db
    FOR EACH ROW
    WHEN (pg_trigger_depth() < 1)
    EXECUTE FUNCTION public.fn_sync_ea_to_an_player();

-- 6. Trigger inverso: Sincronizzazione da public.an_player -> public.ea_player_db
-- Mantiene allineata ea_player_db quando un manager o l'admin aggiorna attributi (Allenamenti) o kit/accessori (Rosa)
CREATE OR REPLACE FUNCTION public.fn_sync_an_to_ea_player()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE public.ea_player_db
    SET
        birthdate = COALESCE(NEW."DOB", birthdate),
        height = COALESCE(NEW."Altezza", height),
        weight = COALESCE(NEW."Peso", weight),
        overallrating = COALESCE(NEW."OVR", overallrating),
        potential = COALESCE(NEW."POTN", potential),
        bodytypecode = COALESCE(NEW."BodyType", bodytypecode),
        emotion = COALESCE(NEW."Emotion", emotion),
        composure = COALESCE(NEW."FRED", composure),
        gkreflexes = COALESCE(NEW."RIFP", gkreflexes),
        gkhandling = COALESCE(NEW."PREP", gkhandling),
        gkdiving = COALESCE(NEW."TUFP", gkdiving),
        gkpositioning = COALESCE(NEW."POSP", gkpositioning),
        gkkicking = COALESCE(NEW."RINP", gkkicking),
        defensiveawareness = COALESCE(NEW."MARC", defensiveawareness),
        standingtackle = COALESCE(NEW."CONT", standingtackle),
        aggression = COALESCE(NEW."AGGR", aggression),
        slidingtackle = COALESCE(NEW."SCIV", slidingtackle),
        interceptions = COALESCE(NEW."INTR", interceptions),
        shortpassing = COALESCE(NEW."PASC", shortpassing),
        longpassing = COALESCE(NEW."PASL", longpassing),
        crossing = COALESCE(NEW."CRSS", crossing),
        ballcontrol = COALESCE(NEW."CTRP", ballcontrol),
        vision = COALESCE(NEW."VISI", vision),
        curve = COALESCE(NEW."EFFT", curve),
        positioning = COALESCE(NEW."PIAZ", positioning),
        shotpower = COALESCE(NEW."PTIR", shotpower),
        longshots = COALESCE(NEW."TIRD", longshots),
        dribbling = COALESCE(NEW."DRBL", dribbling),
        volleys = COALESCE(NEW."TIRV", volleys),
        headingaccuracy = COALESCE(NEW."TSTA", headingaccuracy),
        finishing = COALESCE(NEW."FINA", finishing),
        acceleration = COALESCE(NEW."ACCL", acceleration),
        sprintspeed = COALESCE(NEW."VELO", sprintspeed),
        stamina = COALESCE(NEW."RESI", stamina),
        strength = COALESCE(NEW."FRZA", strength),
        agility = COALESCE(NEW."AGIL", agility),
        jumping = COALESCE(NEW."ELEV", jumping),
        reactions = COALESCE(NEW."RIFL", reactions),
        balance = COALESCE(NEW."EQLB", balance),
        freekickaccuracy = COALESCE(NEW."PNIZ", freekickaccuracy),
        penalties = COALESCE(NEW."CRIG", penalties),
        jerseystylecode = COALESCE(NEW."JerseyStyle", jerseystylecode),
        jerseyfit = COALESCE(NEW."JerseyFit", jerseyfit),
        jerseysleevelengthcode = COALESCE(NEW."SleeveLength", jerseysleevelengthcode),
        hasseasonaljersey = COALESCE(NEW."SeasonalJersey", hasseasonaljersey),
        gkglovetypecode = COALESCE(NEW."GKGloves", gkglovetypecode),
        shoetypecode = COALESCE(NEW."Shoe", shoetypecode),
        socklengthcode = COALESCE(NEW."SockLength", socklengthcode),
        accessorycode1 = COALESCE(NEW."Accessory1", accessorycode1),
        accessorycolourcode1 = COALESCE(NEW."Colour", accessorycolourcode1),
        accessorycode2 = COALESCE(NEW."Accessory2", accessorycode2),
        accessorycolourcode2 = COALESCE(NEW."Colour_1", accessorycolourcode2),
        accessorycode3 = COALESCE(NEW."Accessory3", accessorycode3),
        accessorycolourcode3 = COALESCE(NEW."Colour_2", accessorycolourcode3),
        accessorycode4 = COALESCE(NEW."Accessory4", accessorycode4),
        accessorycolourcode4 = COALESCE(NEW."Colour_3", accessorycolourcode4)
    WHERE playerid = NEW."ID";

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_an_to_ea_player ON public.an_player;
CREATE TRIGGER trg_sync_an_to_ea_player
    AFTER UPDATE ON public.an_player
    FOR EACH ROW
    WHEN (pg_trigger_depth() < 1)
    EXECUTE FUNCTION public.fn_sync_an_to_ea_player();

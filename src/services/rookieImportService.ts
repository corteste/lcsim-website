import { supabase } from "@/supabaseClient";
import { EA_PLAYER_DB_TABLE, ROOKIE_TABLE } from "@/constants/App";
import { EA_DB_COLUMNS, EADbColumn, EAPlayerDBRow } from "@/services/eaPlayerDbService";

export interface RookieAnagraficaRow {
  id: number;
  nome: string;
  cognome: string;
  squadra: string | null;
}

export interface DecodedRookie {
  id: number;
  nome: string;
  cognome: string;
  squadra: string | null;
  posiz: string;
  ovr: number;
  potn: number;
  nazionalita: string;
  eta: number;
  piede: string;
  piedeDebole: string;
  mabi: string;
  role1: string | null;
  role2: string | null;
  stelle: number;
  fullEaRow: EAPlayerDBRow;
  fullRookieRow: Record<string, any>;
}

export interface RookieImportPreview {
  valid: boolean;
  error?: string;
  matchedCount: number;
  unmatchedInFile1: number[];
  unmatchedInFile2: number[];
  rookies: DecodedRookie[];
  file1Name?: string;
  file2Name?: string;
}

// -------------------------------------------------------------
// DECODIFICATORI EA FC 25 -> LCSIM
// -------------------------------------------------------------
const EA_POSITIONS: Record<number, string> = {
  0: 'POR',
  2: 'TD',
  3: 'TD',
  4: 'DC',
  5: 'DC',
  6: 'DC',
  7: 'TS',
  8: 'TS',
  9: 'CDC',
  10: 'CDC',
  11: 'CDC',
  12: 'ED',
  13: 'CC',
  14: 'CC',
  15: 'CC',
  16: 'ES',
  17: 'COC',
  18: 'COC',
  19: 'COC',
  20: 'AT',
  21: 'AT',
  22: 'AT',
  23: 'AD',
  24: 'ATT',
  25: 'ATT',
  26: 'ATT',
  27: 'AS',
};

const EA_NATIONALITIES: Record<number, string> = {
  1: 'ALB', 4: 'AUT', 7: 'BEL', 8: 'BIH', 9: 'BUL', 10: 'CRO', 11: 'CYP', 12: 'CZE',
  13: 'DEN', 14: 'ENG', 15: 'MNE', 17: 'FIN', 18: 'FRA', 20: 'GEO', 21: 'GER', 22: 'GRE',
  23: 'HUN', 24: 'ISL', 25: 'IRL', 26: 'ISR', 27: 'ITA', 28: 'LET', 30: 'LIT', 31: 'LUX',
  34: 'NED', 35: 'NIR', 36: 'NOR', 37: 'POL', 38: 'POR', 39: 'ROU', 40: 'RUS', 41: 'RSM',
  42: 'SCO', 43: 'SVK', 44: 'SVN', 45: 'ESP', 46: 'SWE', 47: 'SWI', 48: 'TUR', 49: 'UKR',
  50: 'WAL', 51: 'SRB', 52: 'ARG', 53: 'BOL', 54: 'BRA', 55: 'CHI', 56: 'COL', 57: 'ECU',
  58: 'PAR', 59: 'PER', 60: 'URU', 61: 'VEN', 66: 'BAR', 70: 'CAN', 72: 'CRC', 82: 'JAM',
  83: 'MEX', 95: 'USA', 97: 'ALG', 98: 'ANG', 103: 'CAM', 108: 'CIV', 110: 'COD', 111: 'EGY',
  115: 'GAB', 117: 'GHA', 118: 'GUI', 126: 'MLI', 129: 'MOR', 133: 'NGA', 136: 'SEN', 140: 'RSA',
  145: 'TUN', 159: 'IRN', 163: 'JPN', 167: 'KOR', 183: 'KSA', 195: 'AUS', 198: 'NZL', 208: 'EST',
  219: 'KOS',
};

const EA_BASE_ROLES: Record<number, string> = {
  1: 'Portiere Classico',
  2: 'Portiere Fuori Dai Pali',
  3: 'Terzino',
  4: 'Falso Difensore',
  5: 'Tornante',
  6: 'Terzino di Spinta',
  7: 'Terzino',
  8: 'Falso Difensore',
  9: 'Tornante',
  10: 'Terzino di Spinta',
  11: 'Difensore',
  12: 'Stopper',
  13: 'Regista Difensivo',
  14: 'Centrocampista di Contenimento',
  15: 'Centromediano',
  16: 'Regista Arretrato',
  17: "Centrocampista d'Ampiezza",
  18: 'Box To Box',
  19: 'Centrocampista di Contenimento',
  20: 'Regista Arretrato',
  21: 'Regista',
  22: 'Mezzala',
  23: 'Ala',
  24: 'Esterno di Centrocampo',
  25: 'Regista Largo',
  26: 'Attaccante Interno',
  27: 'Ala',
  28: 'Esterno di Centrocampo',
  29: 'Regista Largo',
  30: 'Attaccante Interno',
  31: 'Regista',
  32: 'Attaccante Ombra',
  33: 'Mezzala',
  34: '10 Vecchia Scuola',
  35: 'Ala',
  36: 'Attaccante Interno',
  37: 'Regista Largo',
  38: 'Ala',
  39: 'Attaccante Interno',
  40: 'Regista Largo',
  41: 'Attaccante Avanzato',
  42: 'Rapace',
  43: 'Falso 9',
  44: 'Torre',
};

const EA_TRAIT1_DEFS: [number, string][] = [
  [1, 'Finesse Shot'],
  [2, 'Chip Shot'],
  [4, 'Power Shot'],
  [8, 'Dead Ball'],
  [16, 'Power Header'],
  [32, 'Incisive Pass'],
  [64, 'Pinged Pass'],
  [128, 'Long Ball Pass'],
  [256, 'Tiki Taka'],
  [512, 'Whipped Cross'],
  [1024, 'Jockey'],
  [2048, 'Block'],
  [4096, 'Intercept'],
  [8192, 'Anticipate'],
  [16384, 'Slide Tackle'],
  [32768, 'Bruiser'],
  [65536, 'Technical'],
  [131072, 'Rapid'],
  [262144, 'Flair'],
  [524288, 'First Touch'],
  [1048576, 'Trickster'],
  [2097152, 'Press Proven'],
  [4194304, 'Quick Step'],
  [8388608, 'Relentless'],
  [16777216, 'Trivela'],
  [33554432, 'Acrobatic'],
  [67108864, 'Long Throw'],
  [134217728, 'Aerial'],
  [268435456, 'Far Throw'],
  [536870912, 'Footwork'],
];

const EA_TRAIT2_DEFS: [number, string][] = [
  [1, 'Cross Claimer'],
  [2, 'Rush Out'],
  [4, 'Far Reach'],
  [8, 'Quick Reflexes'],
  [16, 'Long Shot Taker'],
  [32, 'Early Crosser'],
  [64, 'Solid Player'],
  [128, 'Team Player'],
  [256, 'One Club Player'],
  [512, 'Injury Prone'],
  [1024, 'Leadership'],
];

export function decodePosition(code: number | null | undefined): string {
  if (code === null || code === undefined) return 'CC';
  return EA_POSITIONS[Number(code)] || 'CC';
}

export function decodeNationality(code: number | null | undefined): string {
  if (code === null || code === undefined) return 'ITA';
  return EA_NATIONALITIES[Number(code)] || String(code);
}

export function decodeRole(code: number | null | undefined): string | null {
  if (!code || Number(code) <= 0) return null;
  const num = Number(code);
  const isPlusPlus = num > 100;
  const baseCode = isPlusPlus ? num - 100 : num;
  const baseName = EA_BASE_ROLES[baseCode];
  if (!baseName) return null;
  return isPlusPlus ? `${baseName} ++` : `${baseName} +`;
}

export function decodeTrait1(mask: number | null | undefined, isIcon: boolean): string | null {
  if (!mask || Number(mask) <= 0) return null;
  const val = Number(mask);
  const items: string[] = [];
  for (const [bit, name] of EA_TRAIT1_DEFS) {
    if ((val & bit) !== 0) {
      items.push(isIcon ? `${name}+` : name);
    }
  }
  return items.length > 0 ? items.join(', ') : null;
}

export function decodeTrait2(mask: number | null | undefined): string | null {
  if (!mask || Number(mask) <= 0) return null;
  const val = Number(mask);
  const items: string[] = [];
  for (const [bit, name] of EA_TRAIT2_DEFS) {
    if ((val & bit) !== 0) {
      items.push(name);
    }
  }
  return items.length > 0 ? items.join(', ') : null;
}

export function calculateStelle(ovr: number | null | undefined): number {
  const o = Number(ovr) || 68;
  if (o <= 66) return 1;
  if (o <= 68) return 2;
  if (o <= 71) return 3;
  if (o <= 73) return 4;
  return 5;
}

// -------------------------------------------------------------
// PARSER FILE 1: MASTER DATA (137 COLONNE EA FC 25)
// -------------------------------------------------------------
export function parseRookieMasterFile(content: string): {
  headers: string[];
  rows: Map<number, EAPlayerDBRow>;
  error?: string;
} {
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    return { headers: [], rows: new Map(), error: 'Il File 1 (Master Data) è vuoto o privo di righe dati.' };
  }

  const delimiter = lines[0].includes('\t') ? '\t' : ',';
  const headers = lines[0].split(delimiter).map((h) => h.trim().toLowerCase());
  const pidIdx = headers.indexOf('playerid');

  if (pidIdx === -1) {
    return {
      headers,
      rows: new Map(),
      error: 'Colonna obbligatoria "playerid" non trovata nell\'intestazione del File 1.',
    };
  }

  const rows = new Map<number, EAPlayerDBRow>();

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(delimiter).map((c) => c.trim());
    if (cols.length < pidIdx + 1) continue;
    const pid = Number(cols[pidIdx]);
    if (!pid || isNaN(pid)) continue;

    const rowObj: Record<string, number> = {};
    headers.forEach((h, idx) => {
      const val = Number(cols[idx]);
      rowObj[h] = isNaN(val) ? 0 : val;
    });

    rows.set(pid, rowObj as unknown as EAPlayerDBRow);
  }

  if (rows.size === 0) {
    return { headers, rows: new Map(), error: 'Nessuna riga valida trovata nel File 1.' };
  }

  return { headers, rows };
}

// -------------------------------------------------------------
// PARSER FILE 2: ANAGRAFICA (ID, Nome, Cognome, Squadra)
// -------------------------------------------------------------
export function parseRookieAnagraficaFile(content: string): {
  rookies: RookieAnagraficaRow[];
  error?: string;
} {
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    return { rookies: [], error: 'Il File 2 (Anagrafica) è vuoto o privo di righe.' };
  }

  const firstLine = lines[0];
  let delimiter = '\t';
  if (firstLine.includes('\t')) delimiter = '\t';
  else if (firstLine.includes(';')) delimiter = ';';
  else if (firstLine.includes(',')) delimiter = ',';

  const rawHeaders = firstLine.split(delimiter).map((h) => h.trim().toLowerCase());
  const idIdx = rawHeaders.findIndex((h) => h === 'id' || h === 'playerid');
  const nomeIdx = rawHeaders.findIndex((h) => h === 'nome' || h === 'name' || h === 'firstname');
  const cognomeIdx = rawHeaders.findIndex((h) => h === 'cognome' || h === 'lastname' || h === 'surname');
  const squadraIdx = rawHeaders.findIndex((h) => h === 'squadra' || h === 'team' || h === 'team_id');

  if (idIdx === -1 || nomeIdx === -1 || cognomeIdx === -1) {
    return {
      rookies: [],
      error:
        'Intestazioni mancanti nel File 2. Sono richieste le 4 colonne: ID, Nome, Cognome, Squadra (trovate: ' +
        rawHeaders.join(', ') +
        ')',
    };
  }

  const rookies: RookieAnagraficaRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(delimiter).map((c) => c.trim());
    if (cols.length <= Math.max(idIdx, nomeIdx, cognomeIdx)) continue;

    const id = Number(cols[idIdx]);
    if (!id || isNaN(id)) continue;

    const nome = cols[nomeIdx] || '';
    const cognome = cols[cognomeIdx] || '';
    let squadra: string | null = squadraIdx !== -1 && cols[squadraIdx] ? cols[squadraIdx].trim() : null;
    if (squadra === '-' || squadra === '' || squadra === 'NULL' || squadra === 'null') {
      squadra = null;
    }

    rookies.push({ id, nome, cognome, squadra });
  }

  if (rookies.length === 0) {
    return { rookies: [], error: 'Nessun rookie estratto dal File 2.' };
  }

  return { rookies };
}

// -------------------------------------------------------------
// PREVIEW GENERATOR
// -------------------------------------------------------------
export function previewRookieImport(
  masterContent: string,
  anagraficaContent: string,
  file1Name?: string,
  file2Name?: string
): RookieImportPreview {
  const masterRes = parseRookieMasterFile(masterContent);
  if (masterRes.error) {
    return {
      valid: false,
      error: `File 1 (Master Data): ${masterRes.error}`,
      matchedCount: 0,
      unmatchedInFile1: [],
      unmatchedInFile2: [],
      rookies: [],
      file1Name,
      file2Name,
    };
  }

  const anagraficaRes = parseRookieAnagraficaFile(anagraficaContent);
  if (anagraficaRes.error) {
    return {
      valid: false,
      error: `File 2 (Anagrafica): ${anagraficaRes.error}`,
      matchedCount: 0,
      unmatchedInFile1: [],
      unmatchedInFile2: [],
      rookies: [],
      file1Name,
      file2Name,
    };
  }

  const masterMap = masterRes.rows;
  const anagraficaList = anagraficaRes.rookies;

  const matchedRookies: DecodedRookie[] = [];
  const matchedIds = new Set<number>();
  const unmatchedInFile2: number[] = [];

  for (const an of anagraficaList) {
    const eaRow = masterMap.get(an.id);
    if (!eaRow) {
      unmatchedInFile2.push(an.id);
      continue;
    }

    matchedIds.add(an.id);

    const posiz = decodePosition(eaRow.preferredposition1);
    const ovr = Number(eaRow.overallrating) || 68;
    const potn = Number(eaRow.potential) || 75;
    const nazionalita = decodeNationality(eaRow.nationality);
    const birthdate = Number(eaRow.birthdate) || 155000;
    const eta = Math.round(25.0 + (152583.0 - birthdate) / 365.25);
    const piede = eaRow.preferredfoot === 2 ? 'SX' : 'DX';
    const piedeDebole = '⭐'.repeat(Math.max(1, Math.min(5, Number(eaRow.weakfootabilitytypecode) || 1)));
    const mabi = '⭐'.repeat(Math.max(1, Math.min(5, (Number(eaRow.skillmoves) || 0) + 1)));
    const role1 = decodeRole(eaRow.role1);
    const role2 = decodeRole(eaRow.role2);
    const role3 = decodeRole(eaRow.role3);
    const stelle = calculateStelle(ovr);

    // Full row for an_rookie (matching the 75 columns in public.an_rookie)
    const fullRookieRow: Record<string, any> = {
      ID: an.id,
      Nome: an.nome,
      Cognome: an.cognome,
      DOB: birthdate,
      Età: eta,
      Nazionalità: nazionalita,
      Altezza: Number(eaRow.height) || 180,
      Peso: Number(eaRow.weight) || 75,
      Posiz: posiz,
      PreferredPosition2: decodePosition(eaRow.preferredposition2),
      PreferredPosition3: decodePosition(eaRow.preferredposition3),
      PreferredPosition4: decodePosition(eaRow.preferredposition4),
      Piede: piede,
      PiedeDebole: piedeDebole,
      Squadra: an.squadra,
      XP: 0,
      Role1: role1,
      Role2: role2,
      Role3: role3,
      OVR: ovr,
      POTN: potn,
      Trait1: decodeTrait1(eaRow.trait1, false),
      Trait2: decodeTrait2(eaRow.trait2),
      IconTrait1: decodeTrait1(eaRow.icontrait1, true),
      IconTrait2: decodeTrait2(eaRow.icontrait2),
      BodyType: eaRow.bodytypecode ?? null,
      Emotion: eaRow.emotion ?? null,
      FRED: eaRow.composure ?? null,
      RIFP: eaRow.gkreflexes ?? null,
      PREP: eaRow.gkhandling ?? null,
      TUFP: eaRow.gkdiving ?? null,
      POSP: eaRow.gkpositioning ?? null,
      RINP: eaRow.gkkicking ?? null,
      MARC: eaRow.defensiveawareness ?? null,
      CONT: eaRow.standingtackle ?? null,
      AGGR: eaRow.aggression ?? null,
      SCIV: eaRow.slidingtackle ?? null,
      INTR: eaRow.interceptions ?? null,
      PASC: eaRow.shortpassing ?? null,
      PASL: eaRow.longpassing ?? null,
      CRSS: eaRow.crossing ?? null,
      CTRP: eaRow.ballcontrol ?? null,
      VISI: eaRow.vision ?? null,
      EFFT: eaRow.curve ?? null,
      PIAZ: eaRow.positioning ?? null,
      PTIR: eaRow.shotpower ?? null,
      TIRD: eaRow.longshots ?? null,
      DRBL: eaRow.dribbling ?? null,
      TIRV: eaRow.volleys ?? null,
      TSTA: eaRow.headingaccuracy ?? null,
      FINA: eaRow.finishing ?? null,
      ACCL: eaRow.acceleration ?? null,
      VELO: eaRow.sprintspeed ?? null,
      RESI: eaRow.stamina ?? null,
      FRZA: eaRow.strength ?? null,
      AGIL: eaRow.agility ?? null,
      ELEV: eaRow.jumping ?? null,
      RIFL: eaRow.reactions ?? null,
      EQLB: eaRow.balance ?? null,
      PNIZ: eaRow.freekickaccuracy ?? null,
      CRIG: eaRow.penalties ?? null,
      MABI: mabi,
      JerseyStyle: eaRow.jerseystylecode ?? null,
      JerseyFit: eaRow.jerseyfit ?? null,
      SleeveLength: eaRow.jerseysleevelengthcode ?? null,
      SeasonalJersey: eaRow.hasseasonaljersey ?? null,
      GKGloves: eaRow.gkglovetypecode ?? null,
      Shoe: eaRow.shoetypecode ?? null,
      SockLength: eaRow.socklengthcode ?? null,
      Accessory1: eaRow.accessorycode1 ?? null,
      Colour: eaRow.accessorycolourcode1 ?? null,
      Accessory2: eaRow.accessorycode2 ?? null,
      Colour_1: eaRow.accessorycolourcode2 ?? null,
      Accessory3: eaRow.accessorycode3 ?? null,
      Colour_2: eaRow.accessorycolourcode3 ?? null,
      Accessory4: eaRow.accessorycode4 ?? null,
      Colour_3: eaRow.accessorycolourcode4 ?? null,
      Stelle: stelle,
      NumeroMaglia: null,
    };

    matchedRookies.push({
      id: an.id,
      nome: an.nome,
      cognome: an.cognome,
      squadra: an.squadra,
      posiz,
      ovr,
      potn,
      nazionalita,
      eta,
      piede,
      piedeDebole,
      mabi,
      role1,
      role2,
      stelle,
      fullEaRow: eaRow,
      fullRookieRow,
    });
  }

  const unmatchedInFile1: number[] = [];
  for (const pid of masterMap.keys()) {
    if (!matchedIds.has(pid)) {
      unmatchedInFile1.push(pid);
    }
  }

  if (matchedRookies.length === 0) {
    return {
      valid: false,
      error: 'Nessuna corrispondenza di ID trovata tra il File 1 (Master Data) e il File 2 (Anagrafica).',
      matchedCount: 0,
      unmatchedInFile1,
      unmatchedInFile2,
      rookies: [],
      file1Name,
      file2Name,
    };
  }

  return {
    valid: true,
    matchedCount: matchedRookies.length,
    unmatchedInFile1,
    unmatchedInFile2,
    rookies: matchedRookies,
    file1Name,
    file2Name,
  };
}

// -------------------------------------------------------------
// EXECUTE IMPORT (SUPABASE UPSERT)
// -------------------------------------------------------------
export async function executeRookieImport(
  preview: RookieImportPreview,
  authorName: string
): Promise<{ success: boolean; count: number; error?: string }> {
  if (!preview.valid || preview.rookies.length === 0) {
    return { success: false, count: 0, error: preview.error || 'Nessun rookie pronto per l\'importazione.' };
  }

  const chunkSize = 100;
  const nowIso = new Date().toISOString();

  try {
    // 1. Inserisci righe in public.ea_player_db a blocchi
    const eaRows = preview.rookies.map((r) => r.fullEaRow);
    for (let i = 0; i < eaRows.length; i += chunkSize) {
      const chunk = eaRows.slice(i, i + chunkSize);
      const { error: eaErr } = await supabase
        .from(EA_PLAYER_DB_TABLE)
        .upsert(chunk, { onConflict: 'playerid' });

      if (eaErr) {
        console.error('Errore inserimento in ea_player_db:', eaErr);
        throw new Error(`Errore Master DB (ea_player_db): ${eaErr.message}`);
      }
    }

    // 2. Inserisci righe in public.an_rookie a blocchi
    const rookieRows = preview.rookies.map((r) => r.fullRookieRow);
    for (let i = 0; i < rookieRows.length; i += chunkSize) {
      const chunk = rookieRows.slice(i, i + chunkSize);
      const { error: rErr } = await supabase
        .from(ROOKIE_TABLE)
        .upsert(chunk, { onConflict: 'ID' });

      if (rErr) {
        console.error('Errore inserimento in an_rookie:', rErr);
        throw new Error(`Errore Rookie DB (an_rookie): ${rErr.message}`);
      }
    }

    // 3. Registra esecuzione automazione
    try {
      await supabase.from('league_automation_state').upsert({
        id: 'import_rookie_class',
        action_name: 'Importa Classe Rookie',
        last_run_at: nowIso,
        last_run_by: authorName,
        details: {
          rookies_imported: preview.rookies.length,
          file1: preview.file1Name || null,
          file2: preview.file2Name || null,
        },
        updated_at: nowIso,
      });
    } catch (logErr) {
      console.warn('Errore salvataggio log automazione rookie import:', logErr);
    }

    return {
      success: true,
      count: preview.rookies.length,
    };
  } catch (err: any) {
    console.error('Errore executeRookieImport:', err);
    return {
      success: false,
      count: 0,
      error: err.message || 'Errore imprevisto durante l\'importazione dei rookie.',
    };
  }
}

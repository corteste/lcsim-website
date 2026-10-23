import { supabase } from '@/supabaseClient';
import { EA_PLAYER_DB_TABLE } from '@/constants/App';

/**
 * Exact 137-column header order of the EA FC 25 master database file (DB_NEW- Sheet217.txt).
 */
export const EA_DB_COLUMNS = [
  'haircolorcode', 'facialhairtypecode', 'curve', 'jerseystylecode', 'agility',
  'tattooback', 'accessorycode4', 'gksavetype', 'positioning', 'tattooleftarm',
  'hairtypecode', 'standingtackle', 'preferredposition3', 'longpassing', 'penalties',
  'animfreekickstartposcode', 'lipcolor', 'isretiring', 'longshots', 'gkdiving',
  'icontrait2', 'interceptions', 'shoecolorcode2', 'crossing', 'potential',
  'gkreflexes', 'finishingcode1', 'reactions', 'composure', 'skinsurfacepack',
  'vision', 'contractvaliduntil', 'finishing', 'dribbling', 'slidingtackle',
  'accessorycode3', 'accessorycolourcode1', 'headtypecode', 'firstnameid', 'driref',
  'sprintspeed', 'undershortstyle', 'height', 'role3', 'hasseasonaljersey',
  'tattoohead', 'preferredposition2', 'strength', 'shoetypecode', 'birthdate',
  'preferredposition1', 'tattooleftleg', 'skinmakeup', 'ballcontrol', 'phypos',
  'shotpower', 'trait1', 'socklengthcode', 'weight', 'hashighqualityhead',
  'eyedetail', 'gkglovetypecode', 'tattoorightarm', 'icontrait1', 'balance',
  'gender', 'headassetid', 'gkkicking', 'lastnameid', 'defspe',
  'internationalrep', 'shortpassing', 'freekickaccuracy', 'skillmoves', 'faceposerpreset',
  'usercaneditname', 'avatarpomid', 'finishingcode2', 'role2', 'aggression',
  'acceleration', 'paskic', 'headingaccuracy', 'role1', 'iscustomized',
  'eyebrowcode', 'runningcode2', 'modifier', 'gkhandling', 'eyecolorcode',
  'jerseysleevelengthcode', 'accessorycolourcode3', 'accessorycode1', 'playerjointeamdate', 'headclasscode',
  'tattoofront', 'nationality', 'preferredfoot', 'sideburnscode', 'weakfootabilitytypecode',
  'jumping', 'skintypecode', 'personality', 'gkkickstyle', 'stamina',
  'playerid', 'accessorycolourcode4', 'gkpositioning', 'headvariation', 'skillmoveslikelihood',
  'trait2', 'shohan', 'skintonecode', 'shortstyle', 'overallrating',
  'smallsidedshoetypecode', 'emotion', 'runstylecode', 'muscularitycode', 'skincomplexion',
  'jerseyfit', 'accessorycode2', 'shoedesigncode', 'playerjerseynameid', 'shoecolorcode1',
  'hairstylecode', 'commonnameid', 'bodytypecode', 'animpenaltiesstartposcode', 'pacdiv',
  'defensiveawareness', 'runningcode1', 'preferredposition4', 'volleys', 'accessorycolourcode2',
  'tattoorightleg', 'facialhaircolorcode',
] as const;

export type EADbColumn = (typeof EA_DB_COLUMNS)[number];
export type EAPlayerDBRow = Record<EADbColumn, number>;

export async function fetchEAPlayerDB(): Promise<EAPlayerDBRow[]> {
  const { data, error } = await supabase
    .from(EA_PLAYER_DB_TABLE)
    .select('*')
    .order('playerid', { ascending: true });

  if (error) {
    console.error('Error fetching ea_player_db:', error);
    throw new Error(error.message || 'Failed to fetch EA player database');
  }

  return (data as EAPlayerDBRow[]) ?? [];
}

export async function fetchEAPlayerById(playerId: number): Promise<EAPlayerDBRow | null> {
  const { data, error } = await supabase
    .from(EA_PLAYER_DB_TABLE)
    .select('*')
    .eq('playerid', playerId)
    .maybeSingle();

  if (error) {
    console.error(`Error fetching ea_player_db for player ${playerId}:`, error);
    throw new Error(error.message || 'Failed to fetch EA player row');
  }

  return (data as EAPlayerDBRow) ?? null;
}

/**
 * Exports all rows in public.ea_player_db (or patches a full DB_NEW TSV string)
 * in the exact 137-column tab-separated format required by EA FC 25.
 */
export async function exportEADatabaseTSV(baseTsvContent?: string): Promise<string> {
  const eaRows = await fetchEAPlayerDB();
  const rowMap = new Map<number, EAPlayerDBRow>();
  for (const r of eaRows) {
    rowMap.set(Number(r.playerid), r);
  }

  if (baseTsvContent) {
    const lines = baseTsvContent.split(/\r?\n/);
    if (lines.length === 0) return '';
    const headers = lines[0].split('\t').map((h) => h.trim()) as EADbColumn[];
    const pidIdx = headers.indexOf('playerid');
    if (pidIdx === -1) {
      throw new Error('Colonna playerid non trovata nel file TSV di base.');
    }

    const updatedLines = [lines[0]];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;
      const cols = line.split('\t');
      const pid = Number(cols[pidIdx]);
      const dbRow = rowMap.get(pid);
      if (dbRow) {
        updatedLines.push(headers.map((col) => String(dbRow[col] ?? cols[headers.indexOf(col)] ?? 0)).join('\t'));
      } else {
        updatedLines.push(line);
      }
    }
    return updatedLines.join('\r\n');
  }

  const headerLine = EA_DB_COLUMNS.join('\t');
  const dataLines = eaRows.map((row) =>
    EA_DB_COLUMNS.map((col) => String(row[col] ?? 0)).join('\t')
  );
  return [headerLine, ...dataLines].join('\r\n');
}

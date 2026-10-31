import { supabase } from '@/supabaseClient';
import { EA_PLAYER_DB_TABLE, SUPABASE_STORAGE_URL } from "@/constants/App";

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

export interface ExportResult {
  content: string;
  totalRows: number;
  lcsimRowsCount: number;
  isFullMaster: boolean;
}

/**
 * Exports the EA FC 25 database in the exact 137-column tab-separated format:
 * - If fullMaster = true (default): loads the 21,067-row master template (/data/DB_NEW_MASTER.txt or baseTsvContent),
 *   replaces the 318 LCSIM custom players with their latest stats/accessories from public.ea_player_db,
 *   and returns the complete 21,067-row file ready for EA FC 25!
 * - If fullMaster = false: returns only the 318 LCSIM player rows (with the 137-column header).
 */
export async function exportEADatabaseTSV(options?: {
  baseTsvContent?: string;
  fullMaster?: boolean;
}): Promise<ExportResult> {
  const eaRows = await fetchEAPlayerDB();
  const rowMap = new Map<number, EAPlayerDBRow>();
  for (const r of eaRows) {
    rowMap.set(Number(r.playerid), r);
  }

  const shouldExportFullMaster = options?.fullMaster !== false;
  let masterContent = options?.baseTsvContent;

  // Option B: Automatically fetch the static master file from Supabase Storage (with fallback to local)
  if (!masterContent && shouldExportFullMaster) {
    const SUPABASE_STORAGE_URL =
      'https://hzenyasrargpsbuaxmxl.supabase.co/storage/v1/object/public/game-templates/DB_NEW_MASTER.txt';
    try {
      let resp = await fetch(SUPABASE_STORAGE_URL);
      if (!resp.ok) {
        resp = await fetch('/data/DB_NEW_MASTER.txt');
      }
      if (resp.ok) {
        masterContent = await resp.text();
      } else {
        console.warn('Impossibile caricare DB_NEW_MASTER.txt (status:', resp.status, '), fallback su righe LCSIM');
      }
    } catch (fetchErr) {
      console.warn('Errore fetch DB_NEW_MASTER.txt, fallback su righe LCSIM:', fetchErr);
    }
  }

  // If we have master template content (full 21,067 rows), patch LCSIM rows
  if (masterContent && masterContent.trim().length > 0) {
    const lines = masterContent.split(/\r?\n/);
    if (lines.length > 0) {
      const headers = lines[0].split('\t').map((h) => h.trim()) as EADbColumn[];
      const pidIdx = headers.indexOf('playerid');
      if (pidIdx === -1) {
        throw new Error('Colonna playerid non trovata nel file master.');
      }

      const updatedLines = [lines[0]];
      let matchedCount = 0;
      const consumedIds = new Set<number>();

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;
        const cols = line.split('\t');
        const pid = Number(cols[pidIdx]);
        const dbRow = rowMap.get(pid);
        if (dbRow) {
          updatedLines.push(headers.map((col) => String(dbRow[col] ?? cols[headers.indexOf(col)] ?? 0)).join('\t'));
          matchedCount++;
          consumedIds.add(pid);
        } else {
          updatedLines.push(line);
        }
      }

      // Aggiungi in coda eventuali nuovi calciatori/rookie presenti in ea_player_db ma non nel template base
      let addedExtraCount = 0;
      for (const [pid, dbRow] of rowMap.entries()) {
        if (!consumedIds.has(pid)) {
          updatedLines.push(headers.map((col) => String(dbRow[col] ?? 0)).join('\t'));
          addedExtraCount++;
        }
      }

      return {
        content: updatedLines.join('\r\n'),
        totalRows: updatedLines.length - 1,
        lcsimRowsCount: matchedCount + addedExtraCount,
        isFullMaster: true,
      };
    }
  }

  // Fallback / Standalone: Export only the LCSIM rows
  const headerLine = EA_DB_COLUMNS.join('\t');
  const dataLines = eaRows.map((row) =>
    EA_DB_COLUMNS.map((col) => String(row[col] ?? 0)).join('\t')
  );

  return {
    content: [headerLine, ...dataLines].join('\r\n'),
    totalRows: eaRows.length,
    lcsimRowsCount: eaRows.length,
    isFullMaster: false,
  };
}

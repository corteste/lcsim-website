import { SUPABASE_STORAGE_URL } from "@/constants/App";

export const LCSIM_LOGO = `${SUPABASE_STORAGE_URL}/images/LCSIM_Logo.png`;
export const LCSIM_LOGO_SMALL = `${SUPABASE_STORAGE_URL}/images/LCSIM_Logo_SMALL.png`;
export const PLAYER_FALLBACK_IMAGE = `${SUPABASE_STORAGE_URL}/images/players/MConti.png`;

export const getTeamLogo = (teamId: string | null | undefined) => {
  if (!teamId) return LCSIM_LOGO_SMALL;
  return `${SUPABASE_STORAGE_URL}/images/teams/${teamId}_Logo.png`;
};

export const getAnthemUrl = (teamId: string | null | undefined) => {
  if (!teamId) return "";
  return `${SUPABASE_STORAGE_URL}/sounds/${teamId}.mp3`;
};

/**
 * Ritorna il gruppo generico di reparto della posizione (POR, DIF, CEN, ATT).
 * Supporta sia i ruoli specifici (es. DC, TS, CDC, AD) che i macro-ruoli (es. DIF, CEN),
 * varianti storiche (DFC, TER, MED, TRQ) e notazioni internazionali (GK, CB, CM, ST).
 */
export const getPosGroup = (pos: string | null | undefined): "POR" | "DIF" | "CEN" | "ATT" | "-" => {
  if (!pos) return "-";
  const p = pos.trim().toUpperCase();
  switch (p) {
    case "POR":
    case "GK":
      return "POR";

    case "DC":
    case "DFC":
    case "TD":
    case "TS":
    case "TER":
    case "DIF":
    case "DF":
    case "CB":
    case "RB":
    case "LB":
    case "LWB":
    case "RWB":
    case "LIB":
    case "SW":
      return "DIF";

    case "CDC":
    case "CC":
    case "CEN":
    case "ED":
    case "ES":
    case "COC":
    case "MED":
    case "TRQ":
    case "MF":
    case "CM":
    case "CDM":
    case "CAM":
    case "RM":
    case "LM":
      return "CEN";

    case "AD":
    case "AS":
    case "AT":
    case "ATT":
    case "PC":
    case "SP":
    case "FW":
    case "ST":
    case "CF":
    case "RW":
    case "LW":
      return "ATT";

    default:
      return "-";
  }
};

/**
 * Funzione che ritorna il colore del badge (soft/outline) in base al ruolo o reparto del giocatore.
 * Palette consolidata LCSIM / EA FC:
 * - Portiere: Giallo / Ambra
 * - Difesa: Blu
 * - Centrocampo: Verde / Smeraldo
 * - Attacco: Rosso / Corallo
 */
export const getRoleColor = (role: string | null | undefined): string => {
  const group = getPosGroup(role);
  switch (group) {
    case "POR":
      return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20";
    case "DIF":
      return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20";
    case "CEN":
      return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20";
    case "ATT":
      return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
};

/**
 * Ritorna le sole classi di testo (senza sfondi o bordi), ideale per label su campetti o sfondi scuri.
 */
export const getRoleTextColor = (role: string | null | undefined): string => {
  const group = getPosGroup(role);
  switch (group) {
    case "POR":
      return "text-yellow-400";
    case "DIF":
      return "text-blue-400";
    case "CEN":
      return "text-emerald-400";
    case "ATT":
      return "text-rose-400";
    default:
      return "text-muted-foreground";
  }
};

/**
 * Ritorna le classi per badge solidi / pieni (sfondo saturo e testo bianco/nero ad alto contrasto).
 */
export const getRoleSolidColor = (role: string | null | undefined): string => {
  const group = getPosGroup(role);
  switch (group) {
    case "POR":
      return "bg-yellow-500 text-slate-950 font-black border-yellow-400";
    case "DIF":
      return "bg-blue-600 text-white font-bold border-blue-500";
    case "CEN":
      return "bg-emerald-600 text-white font-bold border-emerald-500";
    case "ATT":
      return "bg-rose-600 text-white font-bold border-rose-500";
    default:
      return "bg-muted text-foreground border-border";
  }
};

/**
 * Ritorna la denominazione in italiano del reparto di appartenenza.
 */
export const getRoleDepartmentLabel = (role: string | null | undefined): string => {
  const group = getPosGroup(role);
  switch (group) {
    case "POR":
      return "Portiere";
    case "DIF":
      return "Difesa";
    case "CEN":
      return "Centrocampo";
    case "ATT":
      return "Attacco";
    default:
      return "Altro";
  }
};

export const getValueColor = (value:number) => {
  if(value < 75) return "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-red-500/20 font-semibold px-2 py-0.5 rounded-full text-xs";
  if(value >= 75 && value < 80) return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 font-semibold px-2 py-0.5 rounded-full text-xs";
  if(value >= 80 && value < 85) return "bg-green-500/10 text-green-700 dark:text-green-400 font-semibold px-2 py-0.5 rounded-full text-xs";
  if(value >= 85 && value < 90) return "bg-blue-500/10 text-blue-700 dark:text-blue-400 font-semibold px-2 py-0.5 rounded-full text-xs";
  if(value >= 90) return "bg-purple-500/10 text-purple-700 dark:text-purple-400 font-semibold px-2 py-0.5 rounded-full text-xs";
};

/**
 * Ritorna il gruppo generico della posizione in base alla posizione specifica
 * @param pos Posizione del giocatore
 * @returns 
 */
export const getContractStatus = (team: string) => {
  if (team === "RITIRATO")
    return "svi";
  if (team != null && team.includes("B -"))
    return "sec";
  if (team != null && team !== "RITIRATO" && !team.includes("B -"))
    return "con";
} 

/**
 * Funzione che ritorna un icona per il meteo corrente
 * @param team Nome del team
 * @returns 
 */
export const getWeatherIcon = (weather: string) => {
  if (weather == "Soleggiato")
    return "☀️";
  if (weather == "Nuvoloso")
    return "☁️";
  if (weather == "Pioggia")
    return "🌧️";
  if (weather == "Neve")
    return "🌨️";
} 

/**
 * Funzione che ritorna il percorso della miniface del giocatore
 * @param id 
 * @returns 
 */

export const getPlayerImage = (id: number) => {
  return `${SUPABASE_STORAGE_URL}/images/players/p${id}.png`;
}

export const getTeamBackground = (team: string) => {
  switch (team) {
    case "APD":
      return "relative bg-gradient-to-r from-pink-500/20 via-yellow-500/10 to-black-500/10 p-6";
    case "ACF":
      return "relative bg-gradient-to-r from-green-500/20 via-green-500/10 to-black-500/10 p-6";
    case "PFC":
      return "relative bg-gradient-to-r from-pink-500/20 via-pink-500/10 to-black-500/10 p-6";
    case "MAR":
      return "relative bg-gradient-to-r from-red-500/20 via-red-500/10 to-blue-500/10 p-6";
    case "ACD":
      return "relative bg-gradient-to-r from-red-500/20 via-red-500/10 to-white-500/10 p-6";
    case "ALV":
      return "relative bg-gradient-to-r from-sky-500/25 via-sky-600/15 to-orange-500/25 p-6";
    case "SKA":
    case "ASK":
      return "relative bg-gradient-to-r from-emerald-600/25 via-emerald-700/15 to-slate-100/20 p-6";
    case "OLD":
      return "relative bg-gradient-to-r from-blue-500/20 via-blue-500/10 to-pink-500/10 p-6";
    case "VFC":
      return "relative bg-gradient-to-r from-yellow-500/20 via-yellow-500/10 to-black-500/10 p-6";
    case "RMB":
      return "relative bg-gradient-to-r from-red-500/20 via-red-500/10 to-black-500/10 p-6";
    default: 
      return "relative bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6";
  }
}

const NATION_FLAG_MAP: Record<string, string> = {
  ALG: "algeria.png",
  ARG: "argentina.png",
  AUT: "austria.png",
  BAR: "barbados.png",
  BEL: "belgium.png",
  BRA: "brazil.png",
  CAM: "cameroon.png",
  CAN: "canada.png",
  CHI: "chile.png",
  CIN: "china.png",
  CIV: "ivory-coast.png",
  COL: "colombia.png",
  CRO: "croatia.png",
  DEN: "denmark.png",
  ECU: "ecuador.png",
  EGY: "egypt.png",
  ENG: "england.png",
  ESP: "spain.png",
  EST: "estonia.png",
  FIN: "finland.png",
  FRA: "france.png",
  GEO: "georgia.png",
  GER: "germany.png",
  GRE: "greece.png",
  HUN: "hungary.png",
  IRL: "ireland.png",
  ITA: "italy.png",
  JPN: "japan.png",
  KOR: "south-korea.png",
  LET: "latvia.png",
  LIE: "liechtenstein.png",
  LIT: "lithuania.png",
  MEX: "mexico.png",
  MOR: "morocco.png",
  NED: "netherlands.png",
  NGA: "nigeria.png",
  NOR: "norway.png",
  NZL: "new-zealand.png",
  POL: "poland.png",
  POR: "portugal.png",
  RSA: "south-africa.png",
  RSM: "san-marino.png",
  SCO: "scotland.png",
  SEN: "senegal.png",
  SRB: "serbia.png",
  SVN: "slovenia.png",
  SWE: "sweden.png",
  SWI: "switzerland.png",
  TUR: "turkey.png",
  URU: "uruguay.png",
  USA: "united-states.png",
  "FRA/BEL": "frabel.png",
  "ITA/GER": "itager.png",
  "ITA/RSM": "itarsm.png",
  "ARG/ESP": "argspain.png",
};

/**
 * Funzione che ritorna lo stato del contratto del giocatore
 * @param team Nome del team
 * @returns 
 */
export const getNationalityFlag = (nationality: string) => {
  const file = NATION_FLAG_MAP[nationality] || "united-states.png";
  return `${SUPABASE_STORAGE_URL}/images/nations/${file}`;
}; 


/**
 * Determina se un calciatore è al suo ultimo anno di carriera prima del ritiro obbligatorio (34 anni) (Punto #36)
 */
export const isRetiringSoon = (
  player: { Età?: number | string | null; Squadra?: string | null } | null | undefined
): boolean => {
  if (!player) return false;
  if (player.Squadra === "RITIRATO") return false;
  const age = Number(player.Età);
  return age === 34;
};

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
  return `/images/players/p${id}.png`;
}

export const getTeamBackground = (team: string) => {
  switch (team) {
    case "APD":
      return "relative bg-gradient-to-r from-pink-500/20 via-yellow-500/10 to-black-500/10 p-6";
    case "ASK":
      return "relative bg-gradient-to-r from-red-500/20 via-red-500/10 to-black-500/10 p-6";
    case "ACF":
      return "relative bg-gradient-to-r from-green-500/20 via-green-500/10 to-black-500/10 p-6";
    case "PFC":
      return "relative bg-gradient-to-r from-pink-500/20 via-pink-500/10 to-black-500/10 p-6";
    case "MAR":
      return "relative bg-gradient-to-r from-red-500/20 via-red-500/10 to-blue-500/10 p-6";
    case "ACD":
      return "relative bg-gradient-to-r from-red-500/20 via-red-500/10 to-white-500/10 p-6";
    case "ALV":
      return "relative bg-gradient-to-r from-blue-500/10 via-blue-500/10 to-white-500/10 p-6";
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

/**
 * Funzione che ritorna lo stato del contratto del giocatore
 * @param team Nome del team
 * @returns 
 */
export const getNationalityFlag = (nationality: string) => {
  switch (nationality) {
    case "ALG":
      return "/images/nations/algeria.png";
    case "ARG":
      return "/images/nations/argentina.png";
    case "AUT":
      return "/images/nations/austria.png";
    case "BAR":
      return "/images/nations/barbados.png";
    case "BEL":
      return "/images/nations/belgium.png";
    case "BRA":
      return "/images/nations/brazil.png";
    case "CAM":
      return "/images/nations/cameroon.png";
    case "CAN":
      return "/images/nations/canada.png";
    case "CHI":
      return "/images/nations/chile.png";
    case "CIN":
      return "/images/nations/china.png";
    case "CIV":
      return "/images/nations/ivory-coast.png";
    case "COL":
      return "/images/nations/colombia.png";
    case "CRO":
      return "/images/nations/croatia.png";
    case "DEN":
      return "/images/nations/denmark.png";
    case "ECU":
      return "/images/nations/ecuador.png";
    case "EGY":
      return "/images/nations/egypt.png";
    case "ENG":
      return "/images/nations/england.png";
    case "ESP":
      return "/images/nations/spain.png";
    case "EST":
      return "/images/nations/estonia.png";
    case "FIN":
      return "/images/nations/finland.png";
    case "FRA":
      return "/images/nations/france.png";
    case "GEO":
      return "/images/nations/georgia.png";
    case "GER":
      return "/images/nations/germany.png";
    case "GRE":
      return "/images/nations/greece.png";
    case "HUN":
      return "/images/nations/hungary.png";
    case "IRL":
      return "/images/nations/ireland.png";
    case "ITA":
      return "/images/nations/italy.png";
    case "JPN":
      return "/images/nations/japan.png";
    case "KOR":
      return "/images/nations/south-korea.png";
    case "LET":
      return "/images/nations/latvia.png";
    case "LIE":
      return "/images/nations/liechtenstein.png";
    case "LIT":
      return "/images/nations/lithuania.png";
    case "MEX":
      return "/images/nations/mexico.png";
    case "MOR":
      return "/images/nations/morocco.png";
    case "NED":
      return "/images/nations/netherlands.png";
    case "NGA":
      return "/images/nations/nigeria.png";
    case "NOR":
      return "/images/nations/norway.png";
    case "NZL":
      return "/images/nations/new-zealand.png";
    case "POL":
      return "/images/nations/poland.png";
    case "POR":
      return "/images/nations/portugal.png";
    case "RSA":
      return "/images/nations/south-africa.png";
    case "RSM":
      return "/images/nations/san-marino.png";
    case "SCO":
      return "/images/nations/scotland.png";
    case "SEN":
      return "/images/nations/senegal.png";
    case "SRB":
      return "/images/nations/serbia.png";
    case "SVN":
      return "/images/nations/slovenia.png";
    case "SWE":
      return "/images/nations/sweden.png";
    case "SWI":
      return "/images/nations/switzerland.png";
    case "TUR":
      return "/images/nations/turkey.png";
    case "URU":
      return "/images/nations/uruguay.png";
    case "USA":
      return "/images/nations/united-states.png";
    case "FRA/BEL":
      return "/images/nations/frabel.png";
    case "ITA/GER":
      return "/images/nations/itager.png";
    case "ITA/RSM":
      return "/images/nations/itarsm.png";
    case "ARG/ESP":
      return "/images/nations/argspain.png";
    default:
      return "/images/nations/united-states.png";
  }
} 


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

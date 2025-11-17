export const getRoleColor = (role: string) => {
  switch (role) {
    case "POR": return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20";
    case "DC": return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20";
    case "TS": return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20";
    case "TD": return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20";
    case "CDC": return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20";
    case "CC": return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20";
    case "ED": return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20";
    case "ES": return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20";
    case "COC": return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20";
    case "AD": return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20";
    case "AS": return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20";
    case "AT": return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20";
    case "ATT": return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20";
    default: return "bg-muted";
  }
};

export const getValueColor = (value:number) => {
  if(value < 70) return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20 font-semibold px-2 py-0.5 rounded-full text-xs";
  if(value >= 70 && value < 80) return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 font-semibold px-2 py-0.5 rounded-full text-xs";
  if(value >= 80) return "bg-green-500/10 text-green-700 dark:text-green-400 font-semibold px-2 py-0.5 rounded-full text-xs";
};


export const getPosGroup = (pos: string) => {
switch (pos) {
    case "POR": return "POR";
    case "DC": return "DIF";
    case "TD": return "DIF";
    case "TS": return "DIF";
    case "CDC": return "CEN";
    case "CC": return "CEN";
    case "ED": return "CEN";
    case "ES": return "CEN";
    case "COC": return "CEN";
    case "AS": return "ATT";
    case "AD": return "ATT";
    case "AT": return "ATT";
    case "ATT": return "ATT";
    default: return "-";
  }
}

export const getContractStatus = (team: string) => {
  if (team === "RITIRATO")
    return "svi";
  if (team != null && team.includes("B -"))
    return "sec";
  if (team != null && team !== "RITIRATO" && !team.includes("B -"))
    return "con";
} 
export type MarketStatusCode = "int" | "fis" | "tra" | "ced";

export type MarketStatus = {
  Status: string;
};

export interface MarketStatusOption {
  code: MarketStatusCode;
  label: string;
  shortLabel: string;
  description: string;
  badgeClass: string;
  color: string;
}

export const MARKET_STATUS_OPTIONS: MarketStatusOption[] = [
  {
    code: "int",
    label: "Intoccabile",
    shortLabel: "INT",
    description: "Incedibile. Nessuna offerta verrà presa in considerazione.",
    badgeClass: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30",
    color: "#a855f7",
  },
  {
    code: "fis",
    label: "Elemento Fisso",
    shortLabel: "FIS",
    description: "Perno della squadra. Trattabile solo a fronte di offerte straordinarie.",
    badgeClass: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
    color: "#3b82f6",
  },
  {
    code: "tra",
    label: "Possibili Trattative",
    shortLabel: "TRA",
    description: "Disponibile ad ascoltare proposte e trattare con altre società.",
    badgeClass: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
    color: "#f59e0b",
  },
  {
    code: "ced",
    label: "Cedibile",
    shortLabel: "CED",
    description: "Ufficialmente in lista cessioni. La società valuta offerte.",
    badgeClass: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    color: "#10b981",
  },
];

export function getMarketStatusCode(market?: any): MarketStatusCode | null {
  if (!market) return null;
  const status =
    typeof market === "string"
      ? market
      : Array.isArray(market)
      ? market[0]?.Status
      : market?.Status;
  if (status === "int" || status === "fis" || status === "tra" || status === "ced") {
    return status;
  }
  return null;
}

export function getMarketStatusOption(market?: any): MarketStatusOption | null {
  const code = getMarketStatusCode(market);
  if (!code) return null;
  return MARKET_STATUS_OPTIONS.find((opt) => opt.code === code) || null;
}

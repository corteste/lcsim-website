/**
 * Utility per la gestione dei colori sociali dei club LCSIM,
 * con rilevamento automatico del contrasto ("clash detection")
 * e switch al colore secondario per le statistiche delle partite.
 */

export interface TeamColorConfig {
  name: string;
  primary: string; // Colore primario (Home kit)
  secondary: string; // Colore secondario (Away kit / contrasto)
}

export const TEAM_COLORS: Record<string, TeamColorConfig> = {
  ACD: {
    name: "AC Denti",
    primary: "#ef4444", // Rosso
    secondary: "#e2e8f0", // Bianco / Grigio ghiaccio
  },
  ACF: {
    name: "AC Fantasy",
    primary: "#10b981", // Verde Smeraldo
    secondary: "#a855f7", // Viola / Magenta
  },
  ALV: {
    name: "Alvisopoli FC",
    primary: "#0ea5e9", // Azzurro
    secondary: "#f97316", // Arancione
  },
  APD: {
    name: "Average Pegiò Drivers",
    primary: "#eab308", // Giallo Oro
    secondary: "#ec4899", // Rosa Shocking
  },
  COS: {
    name: "Cosmo FC",
    primary: "#8b5cf6", // Viola Notte
    secondary: "#06b6d4", // Ciano Elettrico
  },
  EUR: {
    name: "Eurosbin FC",
    primary: "#1d4ed8", // Blu Navy
    secondary: "#facc15", // Giallo
  },
  MAR: {
    name: "Mar's Attack",
    primary: "#dc2626", // Rosso Fuoco
    secondary: "#2563eb", // Blu
  },
  OLD: {
    name: "Old Bois",
    primary: "#3b82f6", // Blu Royale
    secondary: "#f43f5e", // Rosa Fluo
  },
  PFC: {
    name: "Panormus FC",
    primary: "#ec4899", // Rosa
    secondary: "#334155", // Nero antracite / Grigio scuro
  },
  RMB: {
    name: "Redmamba GPT",
    primary: "#b91c1c", // Rosso Rubino
    secondary: "#475569", // Grigio Fumo / Nero
  },
  SKA: {
    name: "Sporting Karalis",
    primary: "#0d9488", // Teal / Petrolio
    secondary: "#f43f5e", // Corallo / Rosso
  },
  ASK: {
    name: "Sporting Karalis",
    primary: "#0d9488",
    secondary: "#f43f5e",
  },
  VFC: {
    name: "Valle FC",
    primary: "#eab308", // Giallo Sole
    secondary: "#1e293b", // Carbone / Nero
  },
};

export const DEFAULT_TEAM_COLORS: TeamColorConfig = {
  name: "Club LCSIM",
  primary: "#2563eb", // Blu standard
  secondary: "#f97316", // Arancione
};

/**
 * Converte una stringa hex in componenti RGB (0..255)
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const cleaned = hex.replace("#", "");
  const num = parseInt(cleaned, 16);
  if (isNaN(num)) {
    return { r: 100, g: 100, b: 100 };
  }
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

/**
 * Converte RGB in HSL: h in [0, 360), s in [0, 1], l in [0, 1]
 */
export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h *= 60;
  }
  return { h, s, l };
}

/**
 * Converte HSL in esadecimale #rrggbb
 */
export function hslToHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0,
    g = 0,
    b = 0;

  if (h >= 0 && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (h >= 60 && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (h >= 180 && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (h >= 240 && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else if (h >= 300 && h < 360) {
    r = c;
    g = 0;
    b = x;
  }

  const toHex = (n: number) => {
    const hex = Math.round((n + m) * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Determina se due colori sono cromaticamente troppo simili (clash detection).
 */
export function areColorsTooSimilar(hex1: string, hex2: string): boolean {
  if (hex1.toLowerCase() === hex2.toLowerCase()) return true;

  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);

  // Distanza euclidea nello spazio RGB
  const rgbDist = Math.sqrt(
    Math.pow(rgb1.r - rgb2.r, 2) +
      Math.pow(rgb1.g - rgb2.g, 2) +
      Math.pow(rgb1.b - rgb2.b, 2)
  );
  if (rgbDist < 90) return true;

  const hsl1 = rgbToHsl(rgb1.r, rgb1.g, rgb1.b);
  const hsl2 = rgbToHsl(rgb2.r, rgb2.g, rgb2.b);

  // Se entrambi sono acromatici / bassa saturazione (es. neri, grigi, bianchi)
  if (hsl1.s < 0.18 && hsl2.s < 0.18) {
    return Math.abs(hsl1.l - hsl2.l) < 0.3;
  }

  // Differenza di tonalità angolare
  const dh = Math.min(Math.abs(hsl1.h - hsl2.h), 360 - Math.abs(hsl1.h - hsl2.h));
  if (dh < 35 && Math.abs(hsl1.l - hsl2.l) < 0.35) {
    return true;
  }

  return false;
}

/**
 * Adatta il colore esadecimale per renderlo perfettamente leggibile come testo
 * evitando colori troppo scuri su sfondo scuro o troppo chiari su sfondo chiaro.
 */
export function getReadableTextColor(hex: string, isDarkMode: boolean = true): string {
  const rgb = hexToRgb(hex);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

  if (isDarkMode) {
    // Su sfondo scuro: se troppo scuro, aumentiamo la luminosità
    if (hsl.l < 0.45) {
      return hslToHex(hsl.h, Math.max(0.4, hsl.s), 0.68);
    }
    return hex;
  } else {
    // Su sfondo chiaro: se troppo chiaro, abbassiamo la luminosità
    if (hsl.l > 0.6) {
      return hslToHex(hsl.h, Math.max(0.6, hsl.s), 0.35);
    }
    return hex;
  }
}

export interface MatchStatsColorsResult {
  homeColor: string;
  awayColor: string;
  homeTextColor: string;
  awayTextColor: string;
  isAwayUsingSecondary: boolean;
  homeConfig: TeamColorConfig;
  awayConfig: TeamColorConfig;
}

/**
 * Calcola i due colori da utilizzare nelle statistiche partita per Home e Away.
 * Se il colore primario dell'Away è troppo simile a quello dell'Home,
 * l'Away adotta automaticamente il proprio colore secondario.
 */
export function getMatchStatsColors(
  homeTeamId?: string | null,
  awayTeamId?: string | null,
  isDarkMode: boolean = true
): MatchStatsColorsResult {
  const hId = (homeTeamId || "").toUpperCase();
  const aId = (awayTeamId || "").toUpperCase();

  const homeConfig = TEAM_COLORS[hId] || DEFAULT_TEAM_COLORS;
  const awayConfig = TEAM_COLORS[aId] || {
    ...DEFAULT_TEAM_COLORS,
    primary: "#10b981",
    secondary: "#eab308",
  };

  const homeColor = homeConfig.primary;
  let awayColor = awayConfig.primary;
  let isAwayUsingSecondary = false;

  if (areColorsTooSimilar(homeColor, awayColor)) {
    isAwayUsingSecondary = true;
    awayColor = awayConfig.secondary;

    // Se anche il secondario dovesse confliggere con il primario di casa
    if (areColorsTooSimilar(homeColor, awayColor)) {
      awayColor = isDarkMode ? "#f8fafc" : "#0f172a";
    }
  }

  const homeTextColor = getReadableTextColor(homeColor, isDarkMode);
  const awayTextColor = getReadableTextColor(awayColor, isDarkMode);

  return {
    homeColor,
    awayColor,
    homeTextColor,
    awayTextColor,
    isAwayUsingSecondary,
    homeConfig,
    awayConfig,
  };
}

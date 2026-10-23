import { Player } from "@/types/player";

export type StatKey =
  | "POR" | "DIF" | "CEN" | "MEN" | "ATT" | "FIS" | "CPZ"
  | "PREP" | "POSP" | "RINP" | "RIFP" | "TUFP"
  | "MARC" | "CONT" | "AGGR" | "SCIV" | "INTR"
  | "PASC" | "PASL" | "CRSS" | "CTRP" | "VISI" | "EFFT"
  | "POTN" | "PIAZ" | "PTIR" | "TIRD" | "DRBL" | "TIRV" | "TSTA" | "FINA"
  | "ACCL" | "VELO" | "RESI" | "FRZA" | "AGIL" | "ELEV" | "RIFL" | "EQLB"
  | "PNIZ" | "CRIG" | "FRED";

// Pesi per la media ponderata basata sul ruolo in simulazione EA FC / LCSIM
export const roleWeights: Record<string, Partial<Record<StatKey, number>>> = {
  POR: {
    PREP: 21, POSP: 21, RINP: 5, RIFP: 21, TUFP: 21,
    CONT: 0, SCIV: 0, MARC: 0, AGGR: 0, INTR: 0,
    PASC: 0, PASL: 0, CRSS: 0, CTRP: 0, VISI: 0, EFFT: 0,
    PTIR: 0, TIRD: 0, TIRV: 0, DRBL: 0, PIAZ: 0, FINA: 0,
    ACCL: 0, VELO: 0, AGIL: 0, RESI: 0, EQLB: 0, FRZA: 0,
    TSTA: 0, RIFL: 11, ELEV: 0, PNIZ: 0, CRIG: 0, FRED: 0,
  },
  DC: {
    PREP: 0, POSP: 0, RINP: 0, RIFP: 0, TUFP: 0,
    CONT: 17, SCIV: 10, MARC: 14, AGGR: 7, INTR: 13,
    PASC: 5, PASL: 0, CRSS: 0, CTRP: 4, VISI: 0, EFFT: 0,
    PTIR: 0, TIRD: 0, TIRV: 0, DRBL: 0, PIAZ: 0, FINA: 0,
    ACCL: 0, VELO: 2, AGIL: 0, RESI: 0, EQLB: 0, FRZA: 10,
    TSTA: 10, RIFL: 5, ELEV: 3, PNIZ: 0, CRIG: 0, FRED: 0,
  },
  DFC: {
    PREP: 0, POSP: 0, RINP: 0, RIFP: 0, TUFP: 0,
    CONT: 17, SCIV: 10, MARC: 14, AGGR: 7, INTR: 13,
    PASC: 5, PASL: 0, CRSS: 0, CTRP: 4, VISI: 0, EFFT: 0,
    PTIR: 0, TIRD: 0, TIRV: 0, DRBL: 0, PIAZ: 0, FINA: 0,
    ACCL: 0, VELO: 2, AGIL: 0, RESI: 0, EQLB: 0, FRZA: 10,
    TSTA: 10, RIFL: 5, ELEV: 3, PNIZ: 0, CRIG: 0, FRED: 0,
  },
  TS: {
    PREP: 0, POSP: 0, RINP: 0, RIFP: 0, TUFP: 0,
    CONT: 11, SCIV: 14, MARC: 8, AGGR: 0, INTR: 12,
    PASC: 7, PASL: 0, CRSS: 9, CTRP: 7, VISI: 0, EFFT: 0,
    PTIR: 0, TIRD: 0, TIRV: 0, DRBL: 0, PIAZ: 0, FINA: 0,
    ACCL: 5, VELO: 7, AGIL: 0, RESI: 8, EQLB: 0, FRZA: 0,
    TSTA: 4, RIFL: 8, ELEV: 0, PNIZ: 0, CRIG: 0, FRED: 0,
  },
  TD: {
    PREP: 0, POSP: 0, RINP: 0, RIFP: 0, TUFP: 0,
    CONT: 11, SCIV: 14, MARC: 8, AGGR: 0, INTR: 12,
    PASC: 7, PASL: 0, CRSS: 9, CTRP: 7, VISI: 0, EFFT: 0,
    PTIR: 0, TIRD: 0, TIRV: 0, DRBL: 0, PIAZ: 0, FINA: 0,
    ACCL: 5, VELO: 7, AGIL: 0, RESI: 8, EQLB: 0, FRZA: 0,
    TSTA: 4, RIFL: 8, ELEV: 0, PNIZ: 0, CRIG: 0, FRED: 0,
  },
  TER: {
    PREP: 0, POSP: 0, RINP: 0, RIFP: 0, TUFP: 0,
    CONT: 11, SCIV: 14, MARC: 8, AGGR: 0, INTR: 12,
    PASC: 7, PASL: 0, CRSS: 9, CTRP: 7, VISI: 0, EFFT: 0,
    PTIR: 0, TIRD: 0, TIRV: 0, DRBL: 0, PIAZ: 0, FINA: 0,
    ACCL: 5, VELO: 7, AGIL: 0, RESI: 8, EQLB: 0, FRZA: 0,
    TSTA: 4, RIFL: 8, ELEV: 0, PNIZ: 0, CRIG: 0, FRED: 0,
  },
  CDC: {
    PREP: 0, POSP: 0, RINP: 0, RIFP: 0, TUFP: 0,
    CONT: 12, SCIV: 9, MARC: 9, AGGR: 5, INTR: 14,
    PASC: 10, PASL: 10, CRSS: 0, CTRP: 7, VISI: 4, EFFT: 0,
    PTIR: 0, TIRD: 0, TIRV: 0, DRBL: 0, PIAZ: 0, FINA: 0,
    ACCL: 0, VELO: 0, AGIL: 0, RESI: 6, EQLB: 0, FRZA: 4,
    TSTA: 0, RIFL: 10, ELEV: 0, PNIZ: 0, CRIG: 0, FRED: 0,
  },
  CC: {
    PREP: 0, POSP: 0, RINP: 0, RIFP: 0, TUFP: 0,
    CONT: 0, SCIV: 0, MARC: 0, AGGR: 0, INTR: 5,
    PASC: 15, PASL: 13, CRSS: 0, CTRP: 14, VISI: 13, EFFT: 0,
    PTIR: 0, TIRD: 4, TIRV: 0, DRBL: 7, PIAZ: 6, FINA: 2,
    ACCL: 0, VELO: 0, AGIL: 0, RESI: 6, EQLB: 0, FRZA: 0,
    TSTA: 0, RIFL: 5, ELEV: 0, PNIZ: 0, CRIG: 0, FRED: 0,
  },
  CEN: {
    PREP: 0, POSP: 0, RINP: 0, RIFP: 0, TUFP: 0,
    CONT: 0, SCIV: 0, MARC: 0, AGGR: 0, INTR: 5,
    PASC: 15, PASL: 13, CRSS: 0, CTRP: 14, VISI: 13, EFFT: 0,
    PTIR: 0, TIRD: 4, TIRV: 0, DRBL: 7, PIAZ: 6, FINA: 2,
    ACCL: 0, VELO: 0, AGIL: 0, RESI: 6, EQLB: 0, FRZA: 0,
    TSTA: 0, RIFL: 5, ELEV: 0, PNIZ: 0, CRIG: 0, FRED: 0,
  },
  COC: {
    PREP: 0, POSP: 0, RINP: 0, RIFP: 0, TUFP: 0,
    CONT: 0, SCIV: 0, MARC: 0, AGGR: 0, INTR: 0,
    PASC: 16, PASL: 4, CRSS: 0, CTRP: 15, VISI: 14, EFFT: 0,
    PTIR: 0, TIRD: 4, TIRV: 0, DRBL: 13, PIAZ: 9, FINA: 7,
    ACCL: 4, VELO: 3, AGIL: 3, RESI: 0, EQLB: 0, FRZA: 0,
    TSTA: 0, RIFL: 3, ELEV: 0, PNIZ: 0, CRIG: 0, FRED: 0,
  },
  ED: {
    PREP: 0, POSP: 0, RINP: 0, RIFP: 0, TUFP: 0,
    CONT: 0, SCIV: 0, MARC: 0, AGGR: 0, INTR: 0,
    PASC: 9, PASL: 0, CRSS: 12, CTRP: 12, VISI: 7, EFFT: 0,
    PTIR: 0, TIRD: 0, TIRV: 0, DRBL: 15, PIAZ: 8, FINA: 6,
    ACCL: 7, VELO: 6, AGIL: 3, RESI: 5, EQLB: 0, FRZA: 0,
    TSTA: 0, RIFL: 7, ELEV: 0, PNIZ: 0, CRIG: 0, FRED: 0,
  },
  ES: {
    PREP: 0, POSP: 0, RINP: 0, RIFP: 0, TUFP: 0,
    CONT: 0, SCIV: 0, MARC: 0, AGGR: 0, INTR: 0,
    PASC: 9, PASL: 0, CRSS: 12, CTRP: 12, VISI: 7, EFFT: 0,
    PTIR: 0, TIRD: 0, TIRV: 0, DRBL: 15, PIAZ: 8, FINA: 6,
    ACCL: 7, VELO: 6, AGIL: 3, RESI: 5, EQLB: 0, FRZA: 0,
    TSTA: 0, RIFL: 7, ELEV: 0, PNIZ: 0, CRIG: 0, FRED: 0,
  },
  AD: {
    PREP: 0, POSP: 0, RINP: 0, RIFP: 0, TUFP: 0,
    CONT: 0, SCIV: 0, MARC: 0, AGGR: 0, INTR: 0,
    PASC: 9, PASL: 0, CRSS: 9, CTRP: 14, VISI: 4, EFFT: 0,
    PTIR: 0, TIRD: 0, TIRV: 0, DRBL: 16, PIAZ: 9, FINA: 10,
    ACCL: 7, VELO: 6, AGIL: 3, RESI: 0, EQLB: 0, FRZA: 0,
    TSTA: 0, RIFL: 7, ELEV: 0, PNIZ: 0, CRIG: 0, FRED: 0,
  },
  AS: {
    PREP: 0, POSP: 0, RINP: 0, RIFP: 0, TUFP: 0,
    CONT: 0, SCIV: 0, MARC: 0, AGGR: 0, INTR: 0,
    PASC: 9, PASL: 0, CRSS: 9, CTRP: 14, VISI: 4, EFFT: 0,
    PTIR: 0, TIRD: 0, TIRV: 0, DRBL: 16, PIAZ: 9, FINA: 10,
    ACCL: 7, VELO: 6, AGIL: 3, RESI: 0, EQLB: 0, FRZA: 0,
    TSTA: 0, RIFL: 7, ELEV: 0, PNIZ: 0, CRIG: 0, FRED: 0,
  },
  AT: {
    PREP: 0, POSP: 0, RINP: 0, RIFP: 0, TUFP: 0,
    CONT: 0, SCIV: 0, MARC: 0, AGGR: 0, INTR: 0,
    PASC: 9, PASL: 0, CRSS: 0, CTRP: 15, VISI: 8, EFFT: 0,
    PTIR: 0, TIRD: 4, TIRV: 0, DRBL: 14, PIAZ: 13, FINA: 18,
    ACCL: 5, VELO: 4, AGIL: 0, RESI: 0, EQLB: 0, FRZA: 0,
    TSTA: 2, RIFL: 5, ELEV: 0, PNIZ: 0, CRIG: 0, FRED: 0,
  },
  ATT: {
    PREP: 0, POSP: 0, RINP: 0, RIFP: 0, TUFP: 0,
    CONT: 0, SCIV: 0, MARC: 0, AGGR: 0, INTR: 0,
    PASC: 5, PASL: 0, CRSS: 0, CTRP: 10, VISI: 0, EFFT: 0,
    PTIR: 0, TIRD: 0, TIRV: 0, DRBL: 7, PIAZ: 13, FINA: 18,
    ACCL: 4, VELO: 5, AGIL: 0, RESI: 0, EQLB: 0, FRZA: 5,
    TSTA: 10, RIFL: 8, ELEV: 0, PNIZ: 0, CRIG: 0, FRED: 0,
  },
};

/**
 * Calculates the overall rating of a player for a specific role based on weighted attributes.
 */
export const calcOverall = (
  role: string | undefined | null,
  stats: Record<string, any>,
  fallbackOvr: number = 70
): number => {
  if (!role) return fallbackOvr;
  const weights = roleWeights[role.toUpperCase()];
  if (!weights) return fallbackOvr;

  let totalWeight = 0;
  let weightedSum = 0;

  for (const [key, weight] of Object.entries(weights) as [StatKey, number][]) {
    if (weight > 0) {
      const val = Number(stats[key]) || Number(stats[key.toLowerCase()]) || 0;
      totalWeight += weight;
      weightedSum += val * weight;
    }
  }

  if (totalWeight === 0) return fallbackOvr;
  return Math.round(weightedSum / totalWeight);
};

export interface RoleEvaluation {
  role: string;
  ovr: number;
  isPrimary: boolean;
  isSecondary: boolean;
}

export const MAIN_PITCH_ROLES = [
  "POR", "DC", "TD", "TS", "CDC", "CC", "COC", "ED", "ES", "AD", "AS", "ATT"
];

/**
 * Calculates OVR ratings for all relevant positions of a rookie/player.
 * Returns both declared roles (primary + secondary) and ratings across the pitch.
 */
export function calculatePlayerRoleOveralls(player: Player | Record<string, any>): {
  primaryRole: RoleEvaluation;
  secondaryRoles: RoleEvaluation[];
  allPitchRoles: RoleEvaluation[];
} {
  const primaryPos = String(player.Posiz || player.RuoloInCampo || "CC").toUpperCase();
  const primaryOvr = calcOverall(primaryPos, player, Number(player.OVR) || 70);

  const primaryRole: RoleEvaluation = {
    role: primaryPos,
    ovr: primaryOvr,
    isPrimary: true,
    isSecondary: false,
  };

  // Extract secondary positions (from PreferredPosition2, 3, 4)
  const secondaryCandidates = [
    player.PreferredPosition2,
    player.PreferredPosition3,
    player.PreferredPosition4,
  ];

  const uniqueSecondaries = Array.from(
    new Set(
      secondaryCandidates
        .filter((pos): pos is string => Boolean(pos && typeof pos === "string" && pos.trim() !== "" && pos !== "-" && pos.toUpperCase() !== primaryPos))
        .map((p) => p.toUpperCase())
    )
  );

  const secondaryRoles: RoleEvaluation[] = uniqueSecondaries.map((sec) => ({
    role: sec,
    ovr: calcOverall(sec, player, primaryOvr),
    isPrimary: false,
    isSecondary: true,
  }));

  const allPitchRoles: RoleEvaluation[] = MAIN_PITCH_ROLES.map((role) => ({
    role,
    ovr: calcOverall(role, player, primaryOvr),
    isPrimary: role === primaryPos,
    isSecondary: uniqueSecondaries.includes(role),
  }));

  return {
    primaryRole,
    secondaryRoles,
    allPitchRoles,
  };
}

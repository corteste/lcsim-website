import { Player } from "@/types/player";
import { EA_FC25_FORMATIONS } from "@/pages/Tattica";

export interface FormationDifferences {
  hasPrevious: boolean;
  prevWeek?: number;
  prevFormationId?: string;
  prevFormationName?: string;
  isFormationChanged: boolean;
  newStarters: Player[];
  newStarterIds: Set<number>;
  roleChangedStarters: { player: Player; oldPos: string; newPos: string }[];
  roleChangedIds: Set<number>;
  demotedToBench: Player[];
  demotedToTribuna: Player[];
}

export function compareFormations(
  currentFormation: {
    formationId: string;
    formationName?: string;
    starters: (Player | null)[];
    bench?: Player[];
  } | null,
  previousFormation: {
    formationId: string;
    formationName?: string;
    starters: (Player | null)[];
    bench?: Player[];
  } | null,
  currentWeek?: number,
  prevWeek?: number
): FormationDifferences {
  if (
    !currentFormation ||
    !previousFormation ||
    (currentWeek !== undefined && currentWeek <= 1)
  ) {
    return {
      hasPrevious: false,
      isFormationChanged: false,
      newStarters: [],
      newStarterIds: new Set(),
      roleChangedStarters: [],
      roleChangedIds: new Set(),
      demotedToBench: [],
      demotedToTribuna: [],
    };
  }

  const currFormDef =
    EA_FC25_FORMATIONS.find((f) => f.id === currentFormation.formationId) ||
    EA_FC25_FORMATIONS[0];
  const prevFormDef =
    EA_FC25_FORMATIONS.find((f) => f.id === previousFormation.formationId) ||
    EA_FC25_FORMATIONS[0];

  const isFormationChanged =
    currentFormation.formationId !== previousFormation.formationId;

  // Mappa dei titolari del turno precedente: ID -> { player, posLabel }
  const prevStartersMap = new Map<number, { player: Player; posLabel: string }>();
  previousFormation.starters.forEach((p, idx) => {
    if (p && p.ID) {
      const posLabel = prevFormDef.positions[idx]?.label || p.Posiz || "";
      prevStartersMap.set(Number(p.ID), { player: p, posLabel });
    }
  });

  const newStarters: Player[] = [];
  const newStarterIds = new Set<number>();
  const roleChangedStarters: { player: Player; oldPos: string; newPos: string }[] = [];
  const roleChangedIds = new Set<number>();
  const currentStarterIds = new Set<number>();

  currentFormation.starters.forEach((p, idx) => {
    if (p && p.ID) {
      const id = Number(p.ID);
      currentStarterIds.add(id);

      const prev = prevStartersMap.get(id);
      if (!prev) {
        newStarters.push(p);
        newStarterIds.add(id);
      } else {
        const currentPosLabel = currFormDef.positions[idx]?.label || p.Posiz || "";
        if (currentPosLabel && prev.posLabel && currentPosLabel !== prev.posLabel) {
          roleChangedStarters.push({
            player: p,
            oldPos: prev.posLabel,
            newPos: currentPosLabel,
          });
          roleChangedIds.add(id);
        }
      }
    }
  });

  // Trova gli ex-titolari non più titolari (finiti in panchina o in tribuna/non convocati)
  const demotedToBench: Player[] = [];
  const demotedToTribuna: Player[] = [];

  const benchIds = new Set<number>(
    (currentFormation.bench || []).map((b) => Number(b.ID)).filter(Boolean)
  );

  prevStartersMap.forEach(({ player }, id) => {
    if (!currentStarterIds.has(id)) {
      if (benchIds.has(id)) {
        demotedToBench.push(player);
      } else {
        demotedToTribuna.push(player);
      }
    }
  });

  return {
    hasPrevious: true,
    prevWeek: prevWeek || (currentWeek ? currentWeek - 1 : undefined),
    prevFormationId: previousFormation.formationId,
    prevFormationName: previousFormation.formationName || prevFormDef.name,
    isFormationChanged,
    newStarters,
    newStarterIds,
    roleChangedStarters,
    roleChangedIds,
    demotedToBench,
    demotedToTribuna,
  };
}

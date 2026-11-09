import { Player } from "@/types/player";
import { TacticalSettings, SET_PIECES_DEFINITIONS, SetPiecesSettings } from "@/types/tactics";
import { PlayerDisciplinaryStatus } from "@/services/disciplineService";

export interface ValidationCheckItem {
  id: string;
  category: "starters" | "discipline" | "captain" | "shooters" | "corners" | "jumpers" | "conflicts" | "deadline";
  title: string;
  description: string;
  status: "valid" | "error" | "warning";
  details?: string[];
  suggestedTab?: "lineup" | "tactics";
}

export interface FormationValidationResult {
  isValid: boolean;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  items: ValidationCheckItem[];
}

export interface ValidateFormationParams {
  starters: (Player | null)[];
  starterIds: (number | null)[];
  benchIds: number[];
  roster: Player[];
  tacticalSettings: TacticalSettings;
  disciplinaryMap: Record<number, PlayerDisciplinaryStatus>;
  isDeadlineClosed: boolean;
  isAdmin: boolean;
}

/**
 * Esegue la validazione completa delle regole di schieramento della formazione (Punto #82)
 */
export function validateFormationLineup({
  starters,
  starterIds,
  benchIds,
  roster,
  tacticalSettings,
  disciplinaryMap,
  isDeadlineClosed,
  isAdmin,
}: ValidateFormationParams): FormationValidationResult {
  const items: ValidationCheckItem[] = [];

  // Helper per trovare nome calciatore
  const getPlayerLabel = (id: number | null | undefined): string => {
    if (!id) return "Nessuno";
    const found = roster.find((p) => Number(p.ID) === Number(id));
    return found ? `${found.Cognome} ${found.Nome} (#${found.Numero || id})` : `Calciatore #${id}`;
  };

  const currentStartersList = starters.filter((p): p is Player => Boolean(p));
  const starterIdSet = new Set(
    starterIds.filter((id): id is number => id !== null && id !== undefined)
  );

  // =========================================================================
  // 1. VERIFICA 11 TITOLARI IN CAMPO
  // =========================================================================
  const startersCount = starterIdSet.size;
  const rawStarterCount = starterIds.filter((id) => id !== null).length;
  const hasDuplicates = startersCount !== rawStarterCount;

  if (rawStarterCount < 11) {
    const emptySlots: number[] = [];
    starterIds.forEach((id, idx) => {
      if (id === null) emptySlots.push(idx + 1);
    });
    items.push({
      id: "check-starters",
      category: "starters",
      title: "11 Titolari Completi",
      description: `Schierati ${rawStarterCount} su 11 calciatori titolari.`,
      status: "error",
      details: [
        `Mancano ${11 - rawStarterCount} titolari per completare la formazione.`,
        `Slot vuoti: ${emptySlots.map((s) => `#${s}`).join(", ")}.`,
      ],
      suggestedTab: "lineup",
    });
  } else if (hasDuplicates) {
    items.push({
      id: "check-starters",
      category: "starters",
      title: "11 Titolari Completi",
      description: "Presenza di calciatori duplicati negli 11 titolari.",
      status: "error",
      details: ["Uno stesso calciatore è stato inserito in più caselle del campo."],
      suggestedTab: "lineup",
    });
  } else {
    items.push({
      id: "check-starters",
      category: "starters",
      title: "11 Titolari Completi",
      description: "Tutti gli 11 slot titolari sono regolarmente assegnati.",
      status: "valid",
    });
  }

  // =========================================================================
  // 2. REGOLARITÀ DISCIPLINARE (SQUALIFICATI ESCLUSI DA TITOLARI E PANCHINA)
  // =========================================================================
  const suspendedStarters = starterIds
    .filter((id): id is number => Boolean(id) && Boolean(disciplinaryMap[id]?.isSuspended))
    .map((id) => getPlayerLabel(id));

  const suspendedBench = benchIds
    .filter((id) => Boolean(disciplinaryMap[id]?.isSuspended))
    .map((id) => getPlayerLabel(id));

  const totalSuspendedInDistinta = [...suspendedStarters, ...suspendedBench];

  if (totalSuspendedInDistinta.length > 0) {
    const errDetails: string[] = [];
    if (suspendedStarters.length > 0) {
      errDetails.push(`Titolari squalificati: ${suspendedStarters.join(", ")}.`);
    }
    if (suspendedBench.length > 0) {
      errDetails.push(`Panchinari squalificati: ${suspendedBench.join(", ")}.`);
    }
    errDetails.push("I calciatori squalificati devono essere spostati forzatamente in Tribuna.");

    items.push({
      id: "check-discipline",
      category: "discipline",
      title: "Regolarità Disciplinare",
      description: "Trovati calciatori squalificati nella distinta di gara.",
      status: "error",
      details: errDetails,
      suggestedTab: "lineup",
    });
  } else {
    items.push({
      id: "check-discipline",
      category: "discipline",
      title: "Regolarità Disciplinare",
      description: "Nessun calciatore squalificato è presente tra titolari o riserve.",
      status: "valid",
    });
  }

  // =========================================================================
  // 3. CAPITANO DESIGNATO E TITOLARE
  // =========================================================================
  const setPieces = tacticalSettings.setPieces || {};
  const captainId = setPieces.capitano;

  if (!captainId) {
    items.push({
      id: "check-captain",
      category: "captain",
      title: "Capitano della Squadra",
      description: "Nessun Capitano designato.",
      status: "error",
      details: ["È obbligatorio assegnare la fascia di capitano a uno degli 11 titolari."],
      suggestedTab: "tactics",
    });
  } else if (!starterIdSet.has(captainId)) {
    items.push({
      id: "check-captain",
      category: "captain",
      title: "Capitano della Squadra",
      description: "Il Capitano scelto non è tra gli 11 titolari.",
      status: "error",
      details: [`${getPlayerLabel(captainId)} non è schierato come titolare in campo.`],
      suggestedTab: "tactics",
    });
  } else if (disciplinaryMap[captainId]?.isSuspended) {
    items.push({
      id: "check-captain",
      category: "captain",
      title: "Capitano della Squadra",
      description: "Il Capitano scelto è squalificato.",
      status: "error",
      details: [`${getPlayerLabel(captainId)} ha una squalifica attiva e non può giocare.`],
      suggestedTab: "tactics",
    });
  } else {
    items.push({
      id: "check-captain",
      category: "captain",
      title: "Capitano della Squadra",
      description: `Capitano designato: ${getPlayerLabel(captainId)}.`,
      status: "valid",
    });
  }

  // =========================================================================
  // 4. TIRATORI CALCI PIAZZATI (RIGORI E PUNIZIONI)
  // =========================================================================
  const shooterKeys: { key: keyof SetPiecesSettings; label: string }[] = [
    { key: "rigore", label: "Rigore" },
    { key: "punizione_corta_sx", label: "Punizione Corta SX" },
    { key: "punizione_corta_dx", label: "Punizione Corta DX" },
    { key: "punizione_lunga", label: "Punizione Lunga" },
  ];

  const missingShooters: string[] = [];
  const nonStarterShooters: string[] = [];
  const suspendedShooters: string[] = [];

  for (const item of shooterKeys) {
    const pId = setPieces[item.key];
    if (!pId) {
      missingShooters.push(item.label);
    } else if (!starterIdSet.has(pId)) {
      nonStarterShooters.push(`${item.label} (${getPlayerLabel(pId)})`);
    } else if (disciplinaryMap[pId]?.isSuspended) {
      suspendedShooters.push(`${item.label} (${getPlayerLabel(pId)})`);
    }
  }

  if (missingShooters.length > 0 || nonStarterShooters.length > 0 || suspendedShooters.length > 0) {
    const details: string[] = [];
    if (missingShooters.length > 0) {
      details.push(`Incarichi non assegnati: ${missingShooters.join(", ")}.`);
    }
    if (nonStarterShooters.length > 0) {
      details.push(`Incaricati non titolari: ${nonStarterShooters.join(", ")}.`);
    }
    if (suspendedShooters.length > 0) {
      details.push(`Incaricati squalificati: ${suspendedShooters.join(", ")}.`);
    }

    items.push({
      id: "check-shooters",
      category: "shooters",
      title: "Tiratori Punizioni e Rigori",
      description: "Incarichi calci piazzati incompleti o non titolari.",
      status: "error",
      details,
      suggestedTab: "tactics",
    });
  } else {
    items.push({
      id: "check-shooters",
      category: "shooters",
      title: "Tiratori Punizioni e Rigori",
      description: "Tutti i tiratori di rigori e punizioni sono regolarmente assegnati a titolari.",
      status: "valid",
    });
  }

  // =========================================================================
  // 5. BATTITORI CALCI D'ANGOLO (CORNER SX E DX)
  // =========================================================================
  const cornerKeys: { key: keyof SetPiecesSettings; label: string }[] = [
    { key: "corner_sx", label: "Corner Sinistro" },
    { key: "corner_dx", label: "Corner Destro" },
  ];

  const missingCorners: string[] = [];
  const nonStarterCorners: string[] = [];
  const suspendedCorners: string[] = [];

  for (const item of cornerKeys) {
    const pId = setPieces[item.key];
    if (!pId) {
      missingCorners.push(item.label);
    } else if (!starterIdSet.has(pId)) {
      nonStarterCorners.push(`${item.label} (${getPlayerLabel(pId)})`);
    } else if (disciplinaryMap[pId]?.isSuspended) {
      suspendedCorners.push(`${item.label} (${getPlayerLabel(pId)})`);
    }
  }

  if (missingCorners.length > 0 || nonStarterCorners.length > 0 || suspendedCorners.length > 0) {
    const details: string[] = [];
    if (missingCorners.length > 0) {
      details.push(`Corner non assegnati: ${missingCorners.join(", ")}.`);
    }
    if (nonStarterCorners.length > 0) {
      details.push(`Battitori non titolari: ${nonStarterCorners.join(", ")}.`);
    }
    if (suspendedCorners.length > 0) {
      details.push(`Battitori squalificati: ${suspendedCorners.join(", ")}.`);
    }

    items.push({
      id: "check-corners",
      category: "corners",
      title: "Battitori Calci d'Angolo",
      description: "Corner non assegnati o non titolari.",
      status: "error",
      details,
      suggestedTab: "tactics",
    });
  } else {
    items.push({
      id: "check-corners",
      category: "corners",
      title: "Battitori Calci d'Angolo",
      description: `Corner SX: ${getPlayerLabel(setPieces.corner_sx)} • Corner DX: ${getPlayerLabel(setPieces.corner_dx)}.`,
      status: "valid",
    });
  }

  // =========================================================================
  // 6. SALTATORI D'AREA SUI CORNER (TORRE, PRIMO PALO, SECONDO PALO)
  // =========================================================================
  const jumperKeys: { key: keyof SetPiecesSettings; label: string }[] = [
    { key: "torre_angolo", label: "Torre d'Angolo" },
    { key: "primo_palo_angolo", label: "Primo Palo" },
    { key: "secondo_palo_angolo", label: "Secondo Palo" },
  ];

  const missingJumpers: string[] = [];
  const nonStarterJumpers: string[] = [];
  const suspendedJumpers: string[] = [];

  for (const item of jumperKeys) {
    const pId = setPieces[item.key];
    if (!pId) {
      missingJumpers.push(item.label);
    } else if (!starterIdSet.has(pId)) {
      nonStarterJumpers.push(`${item.label} (${getPlayerLabel(pId)})`);
    } else if (disciplinaryMap[pId]?.isSuspended) {
      suspendedJumpers.push(`${item.label} (${getPlayerLabel(pId)})`);
    }
  }

  if (missingJumpers.length > 0 || nonStarterJumpers.length > 0 || suspendedJumpers.length > 0) {
    const details: string[] = [];
    if (missingJumpers.length > 0) {
      details.push(`Saltatori non assegnati: ${missingJumpers.join(", ")}.`);
    }
    if (nonStarterJumpers.length > 0) {
      details.push(`Saltatori non titolari: ${nonStarterJumpers.join(", ")}.`);
    }
    if (suspendedJumpers.length > 0) {
      details.push(`Saltatori squalificati: ${suspendedJumpers.join(", ")}.`);
    }

    items.push({
      id: "check-jumpers",
      category: "jumpers",
      title: "Saltatori d'Area sui Corner",
      description: "Saltatori corner incompleti o non titolari.",
      status: "error",
      details,
      suggestedTab: "tactics",
    });
  } else {
    items.push({
      id: "check-jumpers",
      category: "jumpers",
      title: "Saltatori d'Area sui Corner",
      description: "Torre, Primo palo e Secondo palo assegnati a titolari.",
      status: "valid",
    });
  }

  // =========================================================================
  // 7. INCOMPATIBILITÀ BATTITORI CORNER & SALTATORI D'AREA (PUNTO #82)
  // "il tiratore del calcio d'angolo non può essere torre, primo palo o secondo palo"
  // =========================================================================
  const cornerSxId = setPieces.corner_sx;
  const cornerDxId = setPieces.corner_dx;
  const torreId = setPieces.torre_angolo;
  const primoPaloId = setPieces.primo_palo_angolo;
  const secondoPaloId = setPieces.secondo_palo_angolo;

  const jumperAssignments = [
    { key: "torre_angolo", label: "Torre d'Angolo", id: torreId },
    { key: "primo_palo_angolo", label: "Primo Palo", id: primoPaloId },
    { key: "secondo_palo_angolo", label: "Secondo Palo", id: secondoPaloId },
  ];

  const cornerConflicts: string[] = [];

  if (cornerSxId) {
    for (const j of jumperAssignments) {
      if (j.id && j.id === cornerSxId) {
        cornerConflicts.push(
          `${getPlayerLabel(cornerSxId)} è sia battitore del Corner Sinistro sia ${j.label}.`
        );
      }
    }
  }

  if (cornerDxId) {
    for (const j of jumperAssignments) {
      if (j.id && j.id === cornerDxId) {
        cornerConflicts.push(
          `${getPlayerLabel(cornerDxId)} è sia battitore del Corner Destro sia ${j.label}.`
        );
      }
    }
  }

  if (cornerConflicts.length > 0) {
    items.push({
      id: "check-corner-conflicts",
      category: "conflicts",
      title: "Compatibilità Battitori e Saltatori Corner",
      description: "Conflitto rilevato: un battitore di corner non può saltare in area.",
      status: "error",
      details: [
        ...cornerConflicts,
        "Il regolamento vieta di assegnare il medesimo calciatore come tiratore di calcio d'angolo e come saltatore (Torre, Primo o Secondo palo).",
      ],
      suggestedTab: "tactics",
    });
  } else {
    items.push({
      id: "check-corner-conflicts",
      category: "conflicts",
      title: "Compatibilità Battitori e Saltatori Corner",
      description: "Nessun conflitto tra battitori di corner e saltatori d'area.",
      status: "valid",
    });
  }

  // =========================================================================
  // 8. SCADENZA CONSEGNA FORMAZIONI (DEADLINE)
  // =========================================================================
  if (isDeadlineClosed && !isAdmin) {
    items.push({
      id: "check-deadline",
      category: "deadline",
      title: "Termine Consegna Formazioni",
      description: "Le formazioni per la giornata in corso sono chiuse.",
      status: "error",
      details: ["Il countdown è scaduto e non è più possibile inviare modifiche ufficiali."],
    });
  }

  const failedChecks = items.filter((item) => item.status === "error").length;
  const passedChecks = items.filter((item) => item.status === "valid").length;

  return {
    isValid: failedChecks === 0,
    totalChecks: items.length,
    passedChecks,
    failedChecks,
    items,
  };
}

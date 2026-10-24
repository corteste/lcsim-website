// ============================================================================
// LCSIM - Tattiche EA Sports FC 25 (FC IQ)
// Modello ufficiale: Tattiche di Squadra (Stile Costruzione & Approccio Difensivo)
// + Ruoli Giocatore & Focus per ogni posizione in campo.
// ============================================================================

export interface TeamTacticStyle {
  id: "short_passing" | "balanced" | "counter";
  name: string;
  shortDesc: string;
  description: string;
}

export interface TeamDefensiveApproach {
  id: "deep" | "balanced" | "high";
  name: string;
  shortDesc: string;
  description: string;
}

export const BUILD_UP_STYLES: TeamTacticStyle[] = [
  {
    id: "short_passing",
    name: "Passaggi corti",
    shortDesc: "Pazienza e possesso palla",
    description: "I compagni si avvicinano per offrire linee di passaggio pulite e favorire la circolazione palla paziente.",
  },
  {
    id: "balanced",
    name: "Bilanciato",
    shortDesc: "Equilibrio e flessibilità",
    description: "La squadra mantiene le distanze naturali, alternando manovra ragionata e aperture rapide quando opportuno.",
  },
  {
    id: "counter",
    name: "Contropiede",
    shortDesc: "Verticalizzazioni immediate",
    description: "I giocatori offensivi scattano subito in profondità per sfruttare gli spazi lasciati liberi dagli avversari.",
  },
];

export const DEFENSIVE_APPROACHES: TeamDefensiveApproach[] = [
  {
    id: "deep",
    name: "Basso / Prudente",
    shortDesc: "Blocco basso e compatto",
    description: "La linea difensiva arretra a ridosso dell'area, concedendo poco spazio tra portiere e difensori.",
  },
  {
    id: "balanced",
    name: "Equilibrato",
    shortDesc: "Linea a metà campo difensiva",
    description: "La squadra difende a un'altezza media, pressando quando l'avversario entra nella trequarti campo.",
  },
  {
    id: "high",
    name: "Alto / Aggressivo",
    shortDesc: "Pressione alta e fuorigioco",
    description: "La squadra accorcia in avanti, riconquista palla nella metà campo avversaria e applica la trappola del fuorigioco.",
  },
];

export interface RoleFocusOption {
  id: string;
  name: string;
  description: string;
}

export interface PlayerRoleOption {
  id: string;
  name: string;
  description: string;
  focuses: RoleFocusOption[];
}

export const FC25_ROLES_BY_POSITION: Record<string, PlayerRoleOption[]> = {
  POR: [
    {
      id: "portiere",
      name: "Portiere",
      description: "Portiere tradizionale che protegge lo specchio della porta.",
      focuses: [
        { id: "difesa", name: "Difesa", description: "Resta sulla linea di porta concentrandosi sulle parate tra i pali." },
        { id: "equilibrato", name: "Equilibrato", description: "Esce moderatamente sui cross e sui traversoni ravvicinati." },
      ],
    },
    {
      id: "portiere_libero",
      name: "Portiere fuori dai pali",
      description: "Gioca come libero aggiunto, pronto a spazzare palloni profondi.",
      focuses: [
        { id: "equilibrato", name: "Equilibrato", description: "Esce con coraggio per intercettare passaggi filtranti lunghi avversari." },
      ],
    },
  ],
  DC: [
    {
      id: "difensore",
      name: "Difensore",
      description: "Marcatore centrale solido e affidabile.",
      focuses: [
        { id: "difesa", name: "Difesa", description: "Resta concentrato sulla marcatura pura e non rischia la giocata." },
        { id: "equilibrato", name: "Equilibrato", description: "Mantiene la posizione difensiva e imposta con cautela se libero." },
      ],
    },
    {
      id: "stopper",
      name: "Stopper",
      description: "Difensore aggressivo che gioca d'anticipo.",
      focuses: [
        { id: "equilibrato", name: "Equilibrato", description: "Accorcia in avanti sull'attaccante per contrastarlo prima che riceva." },
      ],
    },
    {
      id: "regista_difensivo",
      name: "Regista difensivo",
      description: "Difensore centrale con eccellenti doti di passaggio e visione.",
      focuses: [
        { id: "difesa", name: "Difesa", description: "Imposta la manovra dalle retrovie con lanci o passaggi diagonali." },
        { id: "costruzione", name: "Costruzione", description: "Avanza palla al piede fino alla mediana per creare superiorità." },
      ],
    },
  ],
  TD: [
    {
      id: "terzino",
      name: "Terzino",
      description: "Terzino tradizionale che presidia la propria corsia.",
      focuses: [
        { id: "difesa", name: "Difesa", description: "Resta bloccato in linea con i centrali difensivi, concedendo zero spazio all'ala." },
        { id: "equilibrato", name: "Equilibrato", description: "Accompagna l'azione offensiva solo quando c'è spazio sicuro." },
      ],
    },
    {
      id: "terzino_spinta",
      name: "Terzino di spinta",
      description: "Esterno basso moderno con forte vocazione offensiva.",
      focuses: [
        { id: "equilibrato", name: "Equilibrato", description: "Si sovrappone con continuità e rientra in transizione difensiva." },
        { id: "attacco", name: "Attacco", description: "Spinge costantemente sulla trequarti per crossare o combinare con l'ala." },
      ],
    },
    {
      id: "falso_difensore",
      name: "Falso difensore",
      description: "Terzino che stringe verso il centro formando un doppio perno.",
      focuses: [
        { id: "difesa", name: "Difesa", description: "Stringe verso l'interno a protezione della zona centrale in non possesso." },
        { id: "equilibrato", name: "Equilibrato", description: "In fase di possesso sale a centrocampo per facilitare la circolazione." },
      ],
    },
    {
      id: "tornante",
      name: "Tornante",
      description: "Giocatore a tutto campo in grado di fare l'intera fascia.",
      focuses: [
        { id: "equilibrato", name: "Equilibrato", description: "Copre l'intero corridoio laterale con ritmo costante." },
        { id: "attacco", name: "Attacco", description: "Cerca sempre il fondo e il traversone in area." },
      ],
    },
  ],
  TS: [
    {
      id: "terzino",
      name: "Terzino",
      description: "Terzino tradizionale che presidia la propria corsia.",
      focuses: [
        { id: "difesa", name: "Difesa", description: "Resta bloccato in linea con i centrali difensivi, concedendo zero spazio all'ala." },
        { id: "equilibrato", name: "Equilibrato", description: "Accompagna l'azione offensiva solo quando c'è spazio sicuro." },
      ],
    },
    {
      id: "terzino_spinta",
      name: "Terzino di spinta",
      description: "Esterno basso moderno con forte vocazione offensiva.",
      focuses: [
        { id: "equilibrato", name: "Equilibrato", description: "Si sovrappone con continuità e rientra in transizione difensiva." },
        { id: "attacco", name: "Attacco", description: "Spinge costantemente sulla trequarti per crossare o combinare con l'ala." },
      ],
    },
    {
      id: "falso_difensore",
      name: "Falso difensore",
      description: "Terzino che stringe verso il centro formando un doppio perno.",
      focuses: [
        { id: "difesa", name: "Difesa", description: "Stringe verso l'interno a protezione della zona centrale in non possesso." },
        { id: "equilibrato", name: "Equilibrato", description: "In fase di possesso sale a centrocampo per facilitare la circolazione." },
      ],
    },
    {
      id: "tornante",
      name: "Tornante",
      description: "Giocatore a tutto campo in grado di fare l'intera fascia.",
      focuses: [
        { id: "equilibrato", name: "Equilibrato", description: "Copre l'intero corridoio laterale con ritmo costante." },
        { id: "attacco", name: "Attacco", description: "Cerca sempre il fondo e il traversone in area." },
      ],
    },
  ],
  CDC: [
    {
      id: "contenimento",
      name: "Contenimento",
      description: "Centrocampista di rottura posizionato a protezione della retroguardia.",
      focuses: [
        { id: "difesa", name: "Difesa", description: "Resta rigorosamente davanti ai centrali a schermare l'area di rigore." },
        { id: "svaria", name: "Svaria", description: "Si muove in orizzontale per raddoppiare e chiudere gli spazi laterali." },
      ],
    },
    {
      id: "centromediano",
      name: "Centromediano",
      description: "Mediano che si abbassa tra i due difensori centrali.",
      focuses: [
        { id: "difesa", name: "Difesa", description: "Costruisce da 'terzo centrale' allargando i due difensori." },
      ],
    },
    {
      id: "regista_arretrato",
      name: "Regista arretrato",
      description: "Metronomo di centrocampo che imposta l'azione da posizione bassa.",
      focuses: [
        { id: "difesa", name: "Difesa", description: "Resta arretrato per ricevere palla dai difensori e avviare la manovra." },
        { id: "svaria", name: "Svaria", description: "Si propone costantemente su tutto il fronte mediano per offrire scarico." },
      ],
    },
  ],
  CC: [
    {
      id: "box_to_box",
      name: "Box-to-Box",
      description: "Incursore instancabile che opera da area ad area.",
      focuses: [
        { id: "equilibrato", name: "Equilibrato", description: "Alterna supporto difensivo e inserimenti in zona tiro." },
      ],
    },
    {
      id: "regista",
      name: "Regista",
      description: "Cervello della mediana che gestisce i tempi della squadra.",
      focuses: [
        { id: "equilibrato", name: "Equilibrato", description: "Distribuisce palloni e detta il ritmo della manovra." },
        { id: "attacco", name: "Attacco", description: "Si spinge sulla trequarti per servire passaggi chiave." },
      ],
    },
    {
      id: "mezzala",
      name: "Mezzala",
      description: "Centrocampista dinamico che agisce nei mezzi spazi.",
      focuses: [
        { id: "equilibrato", name: "Equilibrato", description: "Si muove negli spazi tra terzino e centrale avversario." },
        { id: "attacco", name: "Attacco", description: "Tagli profondi a supporto delle punte ed entrate in area." },
      ],
    },
    {
      id: "regista_arretrato",
      name: "Regista arretrato",
      description: "Regista posizionale con propensione al contenimento.",
      focuses: [
        { id: "difesa", name: "Difesa", description: "Conserva la posizione e orchestra senza scoprirsi." },
      ],
    },
    {
      id: "contenimento",
      name: "Centrocampista di contenimento",
      description: "Centrocampista centrale focalizzato sull'interdizione.",
      focuses: [
        { id: "difesa", name: "Difesa", description: "Priorità ai contrasti e al recupero seconde palle." },
      ],
    },
  ],
  ED: [
    {
      id: "ala",
      name: "Ala",
      description: "Esterno classico orientato al fondo e al cross.",
      focuses: [
        { id: "equilibrato", name: "Equilibrato", description: "Mantiene la linea laterale e cerca il cross morbido o teso." },
        { id: "attacco", name: "Attacco", description: "Punta costantemente il terzino avversario nell'uno contro uno." },
      ],
    },
    {
      id: "esterno_tuttocampo",
      name: "Esterno a tutto campo",
      description: "Giocatore di spola che assicura equilibrio e coperture.",
      focuses: [
        { id: "equilibrato", name: "Equilibrato", description: "Garantisce ampiezza in attacco e ripiegamenti precisi." },
        { id: "attacco", name: "Attacco", description: "Sale fino all'area di rigore a chiudere le azioni sul secondo palo." },
      ],
    },
    {
      id: "tornante_fascia",
      name: "Tornante di fascia",
      description: "Esterno tattico con compiti prioritari di sacrificio e raddoppio.",
      focuses: [
        { id: "difesa", name: "Difesa", description: "Rientra costantemente formando una linea difensiva allargata." },
        { id: "equilibrato", name: "Equilibrato", description: "Supporta il terzino ed esce rapido in ripartenza." },
      ],
    },
    {
      id: "attaccante_interno",
      name: "Attaccante interno",
      description: "Esterno che gioca a piede invertito per convergere al tiro.",
      focuses: [
        { id: "equilibrato", name: "Equilibrato", description: "Si accentra verso il limite per tirare o dialogare con la punta." },
        { id: "attacco", name: "Attacco", description: "Taglia dritto in area di rigore cercando la conclusione a rete." },
      ],
    },
  ],
  ES: [
    {
      id: "ala",
      name: "Ala",
      description: "Esterno classico orientato al fondo e al cross.",
      focuses: [
        { id: "equilibrato", name: "Equilibrato", description: "Mantiene la linea laterale e cerca il cross morbido o teso." },
        { id: "attacco", name: "Attacco", description: "Punta costantemente il terzino avversario nell'uno contro uno." },
      ],
    },
    {
      id: "esterno_tuttocampo",
      name: "Esterno a tutto campo",
      description: "Giocatore di spola che assicura equilibrio e coperture.",
      focuses: [
        { id: "equilibrato", name: "Equilibrato", description: "Garantisce ampiezza in attacco e ripiegamenti precisi." },
        { id: "attacco", name: "Attacco", description: "Sale fino all'area di rigore a chiudere le azioni sul secondo palo." },
      ],
    },
    {
      id: "tornante_fascia",
      name: "Tornante di fascia",
      description: "Esterno tattico con compiti prioritari di sacrificio e raddoppio.",
      focuses: [
        { id: "difesa", name: "Difesa", description: "Rientra costantemente formando una linea difensiva allargata." },
        { id: "equilibrato", name: "Equilibrato", description: "Supporta il terzino ed esce rapido in ripartenza." },
      ],
    },
    {
      id: "attaccante_interno",
      name: "Attaccante interno",
      description: "Esterno che gioca a piede invertito per convergere al tiro.",
      focuses: [
        { id: "equilibrato", name: "Equilibrato", description: "Si accentra verso il limite per tirare o dialogare con la punta." },
        { id: "attacco", name: "Attacco", description: "Taglia dritto in area di rigore cercando la conclusione a rete." },
      ],
    },
  ],
  COC: [
    {
      id: "regista",
      name: "Regista",
      description: "Numero 10 classico tra le linee.",
      focuses: [
        { id: "equilibrato", name: "Equilibrato", description: "Si smarca nella 'tasca' tra centrocampo e difesa per rifinire." },
        { id: "attacco", name: "Attacco", description: "Cerca la giocata verticale per mandare in porta le punte." },
      ],
    },
    {
      id: "attaccante_ombra",
      name: "Attaccante ombra",
      description: "Trequartista predatore che si inserisce a sorpresa.",
      focuses: [
        { id: "attacco", name: "Attacco", description: "Attacca lo spazio centrale alle spalle della punta come secondo bomber." },
      ],
    },
    {
      id: "mezzala",
      name: "Mezzala",
      description: "Trequartista moderno che allarga la propria azione.",
      focuses: [
        { id: "equilibrato", name: "Equilibrato", description: "Combina con l'esterno creando catene laterali fluide." },
        { id: "attacco", name: "Attacco", description: "Inserimenti potenti per cross bassi o tiri dal limite." },
      ],
    },
  ],
  AD: [
    {
      id: "ala",
      name: "Ala",
      description: "Freccia offensiva che ara la corsia esterna.",
      focuses: [
        { id: "equilibrato", name: "Equilibrato", description: "Alterna discese sul fondo e rientri per dare appoggio." },
        { id: "attacco", name: "Attacco", description: "Punta costantemente verso la linea di fondo per il passaggio vincente." },
      ],
    },
    {
      id: "attaccante_interno",
      name: "Attaccante interno",
      description: "Ala moderna che si accentra per concludere sul palo lontano.",
      focuses: [
        { id: "equilibrato", name: "Equilibrato", description: "Taglia verso il dischetto o il vertice dell'area." },
        { id: "attacco", name: "Attacco", description: "Attacca direttamente la porta per finalizzare di prima intenzione." },
      ],
    },
    {
      id: "regista_largo",
      name: "Regista largo",
      description: "Giocatore di classe che riceve largo per inventare.",
      focuses: [
        { id: "equilibrato", name: "Equilibrato", description: "Viene incontro e si accentra per creare la manovra." },
        { id: "attacco", name: "Attacco", description: "Cerca il corridoio per il terzino in sovrapposizione o il filtrante." },
      ],
    },
  ],
  AS: [
    {
      id: "ala",
      name: "Ala",
      description: "Freccia offensiva che ara la corsia esterna.",
      focuses: [
        { id: "equilibrato", name: "Equilibrato", description: "Alterna discese sul fondo e rientri per dare appoggio." },
        { id: "attacco", name: "Attacco", description: "Punta costantemente verso la linea di fondo per il passaggio vincente." },
      ],
    },
    {
      id: "attaccante_interno",
      name: "Attaccante interno",
      description: "Ala moderna che si accentra per concludere sul palo lontano.",
      focuses: [
        { id: "equilibrato", name: "Equilibrato", description: "Taglia verso il dischetto o il vertice dell'area." },
        { id: "attacco", name: "Attacco", description: "Attacca direttamente la porta per finalizzare di prima intenzione." },
      ],
    },
    {
      id: "regista_largo",
      name: "Regista largo",
      description: "Giocatore di classe che riceve largo per inventare.",
      focuses: [
        { id: "equilibrato", name: "Equilibrato", description: "Viene incontro e si accentra per creare la manovra." },
        { id: "attacco", name: "Attacco", description: "Cerca il corridoio per il terzino in sovrapposizione o il filtrante." },
      ],
    },
  ],
  ATT: [
    {
      id: "attaccante_avanzato",
      name: "Attaccante avanzato",
      description: "Punta classica completa che vive sul filo del fuorigioco.",
      focuses: [
        { id: "attacco", name: "Attacco", description: "Attacca costantemente la profondità e detta il filtrante." },
        { id: "completo", name: "Completo", description: "Spazia su tutto il fronte offensivo, rifinendo e finalizzando." },
      ],
    },
    {
      id: "rapace_area",
      name: "Rapace d'area",
      description: "Bomber puro implacabile negli ultimi 16 metri.",
      focuses: [
        { id: "attacco", name: "Attacco", description: "Presidia stabilmente l'area di rigore in attesa della palla gol." },
      ],
    },
    {
      id: "falso_nove",
      name: "Falso 9",
      description: "Centravanti di manovra che svuota l'area attirando i centrali.",
      focuses: [
        { id: "costruzione", name: "Costruzione", description: "Viene incontro sulla trequarti per aprire spazi agli inserimenti di ali e mezzali." },
      ],
    },
    {
      id: "torre",
      name: "Torre",
      description: "Punta di peso e stazza dominante nei duelli aerei.",
      focuses: [
        { id: "attacco", name: "Attacco", description: "Attacca il dischetto sui cross per colpire di testa con potenza." },
        { id: "equilibrato", name: "Equilibrato", description: "Fa da sponda spalle alla porta per i compagni che rimorchia." },
      ],
    },
  ],
};

// ============================================================================
// STRUTTURA DATI TATTICHE SALVATE SU SUPABASE
// ============================================================================

export interface PlayerSlotInstruction {
  slotRole: string; // "POR", "DC", "ATT", etc.
  roleId: string;   // es. "portiere", "stopper", "box_to_box"
  focusId: string;  // es. "difesa", "equilibrato", "attacco"
}

export interface SetPiecesSettings {
  capitano?: number | null;
  punizione_corta_sx?: number | null;
  punizione_corta_dx?: number | null;
  punizione_lunga?: number | null;
  rigore?: number | null;
  corner_sx?: number | null;
  corner_dx?: number | null;
  torre_angolo?: number | null;
  primo_palo_angolo?: number | null;
  secondo_palo_angolo?: number | null;
}

export const SET_PIECES_DEFINITIONS: {
  key: keyof SetPiecesSettings;
  label: string;
  column: "left" | "right";
  shortDesc: string;
}[] = [
  { key: "capitano", label: "Capitano", column: "left", shortDesc: "Leader della squadra in campo" },
  { key: "punizione_corta_sx", label: "Punizione Corta Sinistra", column: "left", shortDesc: "Tiratore punizioni a giro da sinistra" },
  { key: "punizione_corta_dx", label: "Punizione Corta Destra", column: "left", shortDesc: "Tiratore punizioni a giro da destra" },
  { key: "punizione_lunga", label: "Punizione Lunga", column: "left", shortDesc: "Crossatore su punizioni dalla trequarti" },
  { key: "rigore", label: "Rigore", column: "left", shortDesc: "Rigorista designato dal dischetto" },
  { key: "corner_sx", label: "Corner Sinistro", column: "right", shortDesc: "Incaricato dei corner da sinistra" },
  { key: "corner_dx", label: "Corner Destro", column: "right", shortDesc: "Incaricato dei corner da destra" },
  { key: "torre_angolo", label: "Torre (Angolo)", column: "right", shortDesc: "Saltatore dominante per colpire di testa in area" },
  { key: "primo_palo_angolo", label: "Primo Palo (Angolo)", column: "right", shortDesc: "Inserimento o spizzata sul primo palo" },
  { key: "secondo_palo_angolo", label: "Secondo Palo (Angolo)", column: "right", shortDesc: "Presidio sul secondo palo a rimorchio" },
];

export interface TacticalSettings {
  teamTactics: {
    buildUpStyle: "short_passing" | "balanced" | "counter";
    defensiveApproach: "deep" | "balanced" | "high";
    defensiveLine: number; // 1-100 (default 50)
  };
  playerInstructions: Record<number, PlayerSlotInstruction>; // slot index 0..10
  setPieces?: SetPiecesSettings;
}

/**
 * Restituisce le opzioni ruolo per la posizione data (o fallback su CC)
 */
export function getRolesForPosition(posLabel: string): PlayerRoleOption[] {
  const norm = (posLabel || "").toUpperCase().trim();
  return FC25_ROLES_BY_POSITION[norm] || FC25_ROLES_BY_POSITION["CC"] || [];
}

/**
 * Restituisce l'istruzione di default per un determinato slot in base al ruolo della casella
 */
export function getDefaultInstructionForSlot(slotRole: string): PlayerSlotInstruction {
  const roles = getRolesForPosition(slotRole);
  const firstRole = roles[0];
  const firstFocus = firstRole?.focuses[0];
  return {
    slotRole: slotRole.toUpperCase().trim(),
    roleId: firstRole?.id || "ruolo_base",
    focusId: firstFocus?.id || "equilibrato",
  };
}

/**
 * Genera il set completo di impostazioni tattiche di default per una formazione (11 slot)
 */
export function getDefaultTacticalSettings(positions: { label: string }[]): TacticalSettings {
  const instructions: Record<number, PlayerSlotInstruction> = {};
  positions.forEach((pos, idx) => {
    instructions[idx] = getDefaultInstructionForSlot(pos.label);
  });

  return {
    teamTactics: {
      buildUpStyle: "balanced",
      defensiveApproach: "balanced",
      defensiveLine: 50,
    },
    playerInstructions: instructions,
    setPieces: {
      capitano: null,
      punizione_corta_sx: null,
      punizione_corta_dx: null,
      punizione_lunga: null,
      rigore: null,
      corner_sx: null,
      corner_dx: null,
      torre_angolo: null,
      primo_palo_angolo: null,
      secondo_palo_angolo: null,
    },
  };
}

/**
 * Valida e sanitizza le impostazioni tattiche caricate dal database o da stato locale
 */
export function sanitizeTacticalSettings(
  raw: any,
  positions: { label: string }[]
): TacticalSettings {
  const defaultSettings = getDefaultTacticalSettings(positions);

  if (!raw || typeof raw !== "object") {
    return defaultSettings;
  }

  // Sanitizzazione Team Tactics
  const rawTT = raw.teamTactics || {};
  const validBuildUp: ("short_passing" | "balanced" | "counter")[] = [
    "short_passing",
    "balanced",
    "counter",
  ];
  const validDef: ("deep" | "balanced" | "high")[] = ["deep", "balanced", "high"];

  const buildUpStyle = validBuildUp.includes(rawTT.buildUpStyle)
    ? rawTT.buildUpStyle
    : "balanced";
  const defensiveApproach = validDef.includes(rawTT.defensiveApproach)
    ? rawTT.defensiveApproach
    : "balanced";
  const defensiveLine =
    typeof rawTT.defensiveLine === "number" &&
    rawTT.defensiveLine >= 1 &&
    rawTT.defensiveLine <= 100
      ? rawTT.defensiveLine
      : 50;

  // Sanitizzazione Player Instructions per i rispettivi 11 slot
  const rawPI = raw.playerInstructions || {};
  const playerInstructions: Record<number, PlayerSlotInstruction> = {};

  positions.forEach((pos, idx) => {
    const slotPos = pos.label.toUpperCase().trim();
    const availableRoles = getRolesForPosition(slotPos);
    const existing = rawPI[idx] || rawPI[String(idx)];

    if (existing && existing.roleId) {
      const matchedRole = availableRoles.find((r) => r.id === existing.roleId);
      if (matchedRole) {
        const matchedFocus = matchedRole.focuses.find((f) => f.id === existing.focusId);
        playerInstructions[idx] = {
          slotRole: slotPos,
          roleId: matchedRole.id,
          focusId: matchedFocus ? matchedFocus.id : matchedRole.focuses[0].id,
        };
        return;
      }
    }

    // Fallback su default dello slot
    playerInstructions[idx] = getDefaultInstructionForSlot(slotPos);
  });

  // Sanitizzazione Incarichi
  const rawSP = raw.setPieces || {};
  const setPieces: SetPiecesSettings = {
    capitano: rawSP.capitano ? Number(rawSP.capitano) : null,
    punizione_corta_sx: rawSP.punizione_corta_sx ? Number(rawSP.punizione_corta_sx) : null,
    punizione_corta_dx: rawSP.punizione_corta_dx ? Number(rawSP.punizione_corta_dx) : null,
    punizione_lunga: rawSP.punizione_lunga ? Number(rawSP.punizione_lunga) : null,
    rigore: rawSP.rigore ? Number(rawSP.rigore) : null,
    corner_sx: rawSP.corner_sx ? Number(rawSP.corner_sx) : null,
    corner_dx: rawSP.corner_dx ? Number(rawSP.corner_dx) : null,
    torre_angolo: rawSP.torre_angolo ? Number(rawSP.torre_angolo) : null,
    primo_palo_angolo: rawSP.primo_palo_angolo ? Number(rawSP.primo_palo_angolo) : null,
    secondo_palo_angolo: rawSP.secondo_palo_angolo ? Number(rawSP.secondo_palo_angolo) : null,
  };

  return {
    teamTactics: {
      buildUpStyle,
      defensiveApproach,
      defensiveLine,
    },
    playerInstructions,
    setPieces,
  };
}

// ============================================================================
// VALUTAZIONE COMPATIBILITÀ RUOLO (Stile EA FC IQ)
// ============================================================================
export type RoleFit = "natural" | "adaptable" | "out";

export function evaluateRoleFit(playerPos: string | undefined, slotRole: string): RoleFit {
  if (!playerPos) return "out";
  const p = playerPos.toUpperCase().trim();
  const s = slotRole.toUpperCase().trim();

  if (p === s) return "natural";
  if ((p === "AT" && s === "ATT") || (p === "ATT" && s === "AT")) return "natural";

  // Portiere può fare solo il portiere
  if (p === "POR" || s === "POR") return "out";

  // Compatibilità affine tra ruoli vicini
  const adaptableMap: Record<string, string[]> = {
    DC: ["CDC", "TD", "TS"],
    TD: ["ED", "TS", "DC"],
    TS: ["ES", "TD", "DC"],
    CDC: ["CC", "DC"],
    CC: ["CDC", "COC", "ED", "ES"],
    COC: ["CC", "AT", "AD", "AS", "ED", "ES", "ATT"],
    ED: ["AD", "TD", "ES", "CC", "COC"],
    ES: ["AS", "TS", "ED", "CC", "COC"],
    AD: ["ED", "AS", "ATT", "COC"],
    AS: ["ES", "AD", "ATT", "COC"],
    AT: ["ATT", "COC", "AD", "AS"],
    ATT: ["AT", "AD", "AS", "COC"],
  };

  if (adaptableMap[s]?.includes(p)) return "adaptable";
  return "out";
}

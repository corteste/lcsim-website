import { Player } from "./player";

export type StatKey =
  | "PREP" | "POSP" | "RINP" | "RIFP" | "TUFP"
  | "CONT" | "SCIV" | "MARC" | "AGGR" | "INTR"
  | "PASC" | "PASL" | "CRSS" | "CTRP" | "VISI" | "EFFT"
  | "PTIR" | "TIRD" | "TIRV" | "DRBL" | "PIAZ" | "FINA"
  | "ACCL" | "VELO" | "AGIL" | "RESI" | "EQLB" | "FRZA"
  | "TSTA" | "RIFL" | "ELEV" | "PNIZ" | "CRIG" | "FRED";

export interface TraitDef {
  id: string;
  name: string;
  description: string;
  category: "Tiro" | "Passaggi" | "Difesa" | "Fisico" | "Dribbling" | "Portiere" | "Piazzati";
  statReqs: Partial<Record<StatKey, number>>;
  roleReqs?: string[]; // e.g. ["DC", "TD", "TS"] or ["POR"]
  minHeight?: number; // e.g. 185 cm
  subRoleReq?: string; // e.g. "Portiere Fuori Dai Pali"
}

export interface SubRoleDef {
  id: number; // 1-44
  idPlusPlus: number; // 101-144
  name: string; // Italian name matching EA FC 25
  position: string; // POR, TD, TS, DC, CDC, CC, ED, ES, COC, AD, AS, ATT
  description: string;
}

export const TRAINING_COSTS = {
  ROLE_CHANGE: 40,            // Cambio Ruolo Principale (include scelta 1° Ruolo+)
  ROLE_PLUS_FIRST: 0,         // 1° Ruolo+ gratis
  ROLE_PLUS_SECOND: 100,      // 2° Ruolo+ 100 XP
  ROLE_PLUS_SWAP: 60,         // Swap Ruolo+ 60 XP
  ROLE_PLUSPLUS: 100,         // Upgrade a Ruolo++ 100 XP (OVR >= 84)
  TRAIT_SILVER_ADD: 60,       // Tratto Argento: 60 XP
  TRAIT_REMOVE: 40,           // Elimina tratto pre-esistente: 40 XP
  TRAIT_GOLD_SWAP: 70,        // Swap/Promozione Tratto Oro: 70 XP (se già presente un oro)
  OVR_THRESHOLD: 84,          // Soglia OVR per 1° Oro gratis e Ruolo++
  MAX_TRAITS: 5,              // Massimo 5 tratti totali
  MAX_GOLD_TRAITS: 1,         // Massimo 1 tratto oro
  MAX_ROLE_PLUS: 2,           // Massimo 2 Ruoli+
  MAX_ROLE_PLUSPLUS: 1,       // Massimo 1 Ruolo++
} as const;

/** Ruoli principali ufficiali supportati */
export const OFFICIAL_POSITIONS = [
  "POR", "DC", "TD", "TS", "CDC", "CC", "ED", "ES", "COC", "AD", "AS", "ATT"
] as const;

/** 44 Ruoli+ Ufficiali (con corrispondenza ID FC25 e Ruolo++) */
export const OFFICIAL_SUBROLES: SubRoleDef[] = [
  // POR
  { id: 1, idPlusPlus: 101, position: "POR", name: "Portiere Classico", description: "Presidia la linea di porta con sicurezza tra i pali e reattività sui tiri ravvicinati." },
  { id: 2, idPlusPlus: 102, position: "POR", name: "Portiere Fuori Dai Pali", description: "Interpreta il ruolo in chiave moderna uscendo dall'area per impostare e neutralizzare lanci lunghi." },
  // TD
  { id: 3, idPlusPlus: 103, position: "TD", name: "Terzino", description: "Terzino equilibrato che difende la corsia e appoggia la manovra quando opportuno." },
  { id: 4, idPlusPlus: 104, position: "TD", name: "Falso Difensore", description: "Stringe verso il centro del campo in fase di possesso per creare superiorità numerica interna." },
  { id: 5, idPlusPlus: 105, position: "TD", name: "Tornante", description: "Percorre instancabilmente tutta la fascia garantendo ampiezza e copertura continua." },
  { id: 6, idPlusPlus: 106, position: "TD", name: "Terzino di Spinta", description: "Si propone costantemente in sovrapposizione offensiva per arrivare al cross sul fondo." },
  // TS
  { id: 7, idPlusPlus: 107, position: "TS", name: "Terzino", description: "Terzino equilibrato che difende la corsia sinistra e appoggia la manovra." },
  { id: 8, idPlusPlus: 108, position: "TS", name: "Falso Difensore", description: "Stringe verso il centrocampo dalla corsia mancina per offrire linee di passaggio centrali." },
  { id: 9, idPlusPlus: 109, position: "TS", name: "Tornante", description: "Garantisce atletismo e continuità su tutta la corsia sinistra tra difesa e transizione." },
  { id: 10, idPlusPlus: 110, position: "TS", name: "Terzino di Spinta", description: "Attacca l'out mancino con continuità per sfornare traversoni e combinazioni offensive." },
  // DC
  { id: 11, idPlusPlus: 111, position: "DC", name: "Difensore", description: "Centrale puro: marcatura solida, posizionamento e protezione dell'area." },
  { id: 12, idPlusPlus: 112, position: "DC", name: "Stopper", description: "Difensore aggressivo che aggredisce l'avversario in anticipo rompendo la linea." },
  { id: 13, idPlusPlus: 113, position: "DC", name: "Regista Difensivo", description: "Centrale tecnico abile nell'impostazione dal basso e nei lanci millimetrici." },
  // CDC
  { id: 14, idPlusPlus: 114, position: "CDC", name: "Centrocampista di Contenimento", description: "Schermo protettivo davanti alla difesa, sradica palloni e spezza il gioco avversario." },
  { id: 15, idPlusPlus: 115, position: "CDC", name: "Centromediano", description: "Perno metodista che gestisce i tempi di gioco e fa da cerniera tattica fondamentale." },
  { id: 16, idPlusPlus: 116, position: "CDC", name: "Regista Arretrato", description: "Playmaker basso dotato di visione e geometrie per avviare la manovra in profondità." },
  { id: 17, idPlusPlus: 117, position: "CDC", name: "Centrocampista d'Ampiezza", description: "Copre le fasce e riequilibra la squadra durante le sovrapposizioni dei terzini." },
  // CC
  { id: 18, idPlusPlus: 118, position: "CC", name: "Box To Box", description: "Centrocampista totale: difende nella propria area e conclude in quella avversaria con grande corsa." },
  { id: 19, idPlusPlus: 119, position: "CC", name: "Centrocampista di Contenimento", description: "Equilibratore di metà campo, recupera palloni e presidia le seconde palle." },
  { id: 20, idPlusPlus: 120, position: "CC", name: "Regista Arretrato", description: "Imposta da posizione intermedia distribuendo il gioco a corto e lungo raggio." },
  { id: 21, idPlusPlus: 121, position: "CC", name: "Regista", description: "Cervello della mediana: controlla il ritmo e detta i tempi delle combinazioni offensive." },
  { id: 22, idPlusPlus: 122, position: "CC", name: "Mezzala", description: "Si inserisce tra le linee e negli spazi laterali per concludere o servire assist." },
  // ED
  { id: 23, idPlusPlus: 123, position: "ED", name: "Ala", description: "Esterno puro che salta l'uomo sul fondo e mette traversoni velenosi in mezzo." },
  { id: 24, idPlusPlus: 124, position: "ED", name: "Esterno di Centrocampo", description: "Garantisce equilibrio tattico coprendo tutta la fascia destra con intelligenza." },
  { id: 25, idPlusPlus: 125, position: "ED", name: "Regista Largo", description: "Esterno di manovra che entra dentro il campo per dialogare e gestire il possesso." },
  { id: 26, idPlusPlus: 126, position: "ED", name: "Attaccante Interno", description: "Parte largo a destra e taglia in diagonale verso la porta per calciare." },
  // ES
  { id: 27, idPlusPlus: 127, position: "ES", name: "Ala", description: "Attacca la linea di fondo mancina con dribbling e cross precisi per le punte." },
  { id: 28, idPlusPlus: 128, position: "ES", name: "Esterno di Centrocampo", description: "Garantisce disciplina sulla corsia mancina sostenendo terzino e centrocampo." },
  { id: 29, idPlusPlus: 129, position: "ES", name: "Regista Largo", description: "Sfrutta la qualità tecnica accentrandosi per smistare palloni tra le linee." },
  { id: 30, idPlusPlus: 130, position: "ES", name: "Attaccante Interno", description: "Taglia dalla sinistra verso il centro mirando l'incrocio sul palo lontano." },
  // COC
  { id: 31, idPlusPlus: 131, position: "COC", name: "Regista", description: "Numero 10 moderno: creatività, filtranti al bacio e rifinitura negli ultimi 25 metri." },
  { id: 32, idPlusPlus: 132, position: "COC", name: "Attaccante Ombra", description: "Trequartista incursore che sfrutta i vuoti lasciati dalla punta per segnare da vicino." },
  { id: 33, idPlusPlus: 133, position: "COC", name: "Mezzala", description: "Trequartista dinamico che svaria sul centro-destra o centro-sinistra con percussioni rapide." },
  { id: 34, idPlusPlus: 134, position: "COC", name: "10 Vecchia Scuola", description: "Puro genio balistico: tocchi di prima, classe pura e scarso dispendio difensivo." },
  // AD
  { id: 35, idPlusPlus: 135, position: "AD", name: "Ala", description: "Attaccante laterale che punta l'avversario in velocità sulla fascia destra." },
  { id: 36, idPlusPlus: 136, position: "AD", name: "Attaccante Interno", description: "Converte la fascia in corsia di tiro, accentrandosi sul mancino per tirare." },
  { id: 37, idPlusPlus: 137, position: "AD", name: "Regista Largo", description: "Rifinitore decentrato che crea superiorità con passaggi filtranti verso l'area." },
  // AS
  { id: 38, idPlusPlus: 138, position: "AS", name: "Ala", description: "Freccia offensiva sull'out sinistro con rapidità e rifinitura sul fondo." },
  { id: 39, idPlusPlus: 139, position: "AS", name: "Attaccante Interno", description: "Taglia sul piede forte destro dalla sinistra per conclusioni a giro irresistibili." },
  { id: 40, idPlusPlus: 140, position: "AS", name: "Regista Largo", description: "Crea gioco dalla fascia sinistra servendo inserimenti di mezzali e punte." },
  // ATT
  { id: 41, idPlusPlus: 141, position: "ATT", name: "Attaccante Avanzato", description: "Centravanti completo che detta il passaggio in profondità e finalizza a rete." },
  { id: 42, idPlusPlus: 142, position: "ATT", name: "Rapace", description: "Killer d'area di rigore: senso del gol letale su ogni pallone vagante." },
  { id: 43, idPlusPlus: 143, position: "ATT", name: "Falso 9", description: "Viene incontro per legare il gioco, disorientare i centrali e lanciare gli esterni." },
  { id: 44, idPlusPlus: 144, position: "ATT", name: "Torre", description: "Gigante dell'area che difende palla spalle alla porta e domina le palle aeree." },
];

/** 36 Tratti Ufficiali con requisiti minimi esatti da regolamento LCSIM */
export const OFFICIAL_TRAITS: TraitDef[] = [
  // 1. Finesse Shot
  {
    id: "finesse_shot",
    name: "Finesse Shot",
    description: "Tiri a giro più precisi e veloci con traiettorie telecomandate verso gli angoli.",
    category: "Tiro",
    statReqs: { FINA: 85, EFFT: 85, TIRD: 79 },
  },
  // 2. Chip Shot
  {
    id: "chip_shot",
    name: "Chip Shot",
    description: "Pallonetti straordinariamente precisi ed eseguiti con tempi di reazione fulminei.",
    category: "Tiro",
    statReqs: { FINA: 89 },
  },
  // 3. Power Shot
  {
    id: "power_shot",
    name: "Power Shot",
    description: "Conclusioni dalla distanza scagliate con potenza devastante ed eccezionale velocità.",
    category: "Tiro",
    statReqs: { PTIR: 87, TIRD: 79 },
  },
  // 4. Dead Ball
  {
    id: "dead_ball",
    name: "Dead Ball",
    description: "Specialista assoluto sui calci piazzati con parabole ad altissima rotazione.",
    category: "Piazzati",
    statReqs: { PNIZ: 85, EFFT: 84, PTIR: 84 },
  },
  // 5. Power Leader (Power Header)
  {
    id: "power_leader",
    name: "Power Leader",
    description: "Colpi di testa violenti e diretti verso la porta con straordinario stacco aereo.",
    category: "Tiro",
    statReqs: { TSTA: 84, FINA: 84, ELEV: 74 },
  },
  // 6. Incisive Pass
  {
    id: "incisive_pass",
    name: "Incisive Pass",
    description: "Passaggi filtranti chirurgici che tagliano le linee difensive con precisione millimetrica.",
    category: "Passaggi",
    statReqs: { PASC: 85, PASL: 84, EFFT: 84, VISI: 74 },
  },
  // 7. Pinged Pass
  {
    id: "pinged_pass",
    name: "Pinged Pass",
    description: "Passaggi rasoterra tesi e rapidissimi che viaggiano ad altissima velocità senza perdere precisione.",
    category: "Passaggi",
    statReqs: { PASL: 85, VISI: 85, PASC: 84, FRED: 79 },
  },
  // 8. Long Ball Pass
  {
    id: "long_ball_pass",
    name: "Long Ball Pass",
    description: "Lanci lunghi millimetrici che scavalcano le retroguardie per imbeccare compagni in corsa.",
    category: "Passaggi",
    statReqs: { PASL: 85, VISI: 84 },
  },
  // 9. Tiki Taka
  {
    id: "tiki_taka",
    name: "Tiki Taka",
    description: "Scambi di prima fulminei a terra con controllo immediato e zero errori di tocco.",
    category: "Passaggi",
    statReqs: { PASC: 89 },
  },
  // 10. Whipped Cross
  {
    id: "whipped_cross",
    name: "Whipped Cross",
    description: "Cross tesi e velenosi sul secondo palo con grande effetto che scavalcano il portiere.",
    category: "Passaggi",
    statReqs: { CRSS: 89 },
  },
  // 11. Jockey
  {
    id: "jockey",
    name: "Jockey",
    description: "Movimento di temporeggiamento difensivo rapidissimo nei cambi di direzione a uomo.",
    category: "Difesa",
    statReqs: { ACCL: 86, VELO: 79 },
    roleReqs: ["DC", "TD", "TS", "DFC", "TER"],
  },
  // 12. Block
  {
    id: "block",
    name: "Block",
    description: "Raggio d'azione allargato nell'intercettare tiri e contrasti corpo a corpo d'arresto.",
    category: "Difesa",
    statReqs: { FRZA: 84, EQLB: 79 },
  },
  // 13. Intercept
  {
    id: "intercept",
    name: "Intercept",
    description: "Lettura anticipata delle linee di passaggio con capacità di trattenere il pallone.",
    category: "Difesa",
    statReqs: { INTR: 89 },
  },
  // 14. Anticipate
  {
    id: "anticipate",
    name: "Anticipate",
    description: "Tackle pulito in piedi che sottrae palla all'attaccante senza commettere fallo.",
    category: "Difesa",
    statReqs: { CONT: 84, SCIV: 84, INTR: 87 },
  },
  // 15. Slide Tackle
  {
    id: "slide_tackle",
    name: "Slide Tackle",
    description: "Scivolate decisive a lunga gittata capaci di fermare la sfera direttamente sui piedi.",
    category: "Difesa",
    statReqs: { SCIV: 89, FRED: 79 },
  },
  // 16. Bruiser
  {
    id: "bruiser",
    name: "Bruiser",
    description: "Impatto fisico travolgente nei contrasti spalla a spalla che sbilancia l'avversario.",
    category: "Fisico",
    statReqs: { EQLB: 85, FRZA: 84 },
  },
  // 17. Technical
  {
    id: "technical",
    name: "Technical",
    description: "Controllo stretto della sfera nello scatto controllato con curve strette e dribbling fluido.",
    category: "Dribbling",
    statReqs: { DRBL: 85, CTRP: 84, RIFL: 74, ACCL: 74 },
  },
  // 18. Rapid
  {
    id: "rapid",
    name: "Rapid",
    description: "Velocità di scatto impressionante palla al piede con allunghi devastanti in contropiede.",
    category: "Fisico",
    statReqs: { ACCL: 89, VELO: 89 },
  },
  // 19. Flair
  {
    id: "flair",
    name: "Flair",
    description: "Giocate di tacco, finte di corpo e tocchi estrosi eseguiti con eleganza naturale.",
    category: "Dribbling",
    statReqs: { DRBL: 84, AGIL: 79 },
  },
  // 20. First Touch
  {
    id: "first_touch",
    name: "First Touch",
    description: "Stop a seguire impeccabile su palloni difficili senza perdere il tempo di gioco.",
    category: "Dribbling",
    statReqs: { CTRP: 85, DRBL: 84 },
  },
  // 21. Trickster
  {
    id: "trickster",
    name: "Trickster",
    description: "Abilità unica nell'eseguire trick e giocate di prestigio per saltare il diretto marcatore.",
    category: "Dribbling",
    statReqs: { DRBL: 89, AGIL: 79, RIFL: 79 },
  },
  // 22. Press Proven
  {
    id: "press_proven",
    name: "Press Proven",
    description: "Protegge il pallone con il corpo sotto forte pressione difensiva senza perderlo.",
    category: "Dribbling",
    statReqs: { CTRP: 84, EQLB: 89 },
  },
  // 23. Quick Step
  {
    id: "quick_step",
    name: "Quick Step",
    description: "Scatto bruciante nei primissimi metri da fermo per bruciare il difensore sul posto.",
    category: "Fisico",
    statReqs: { DRBL: 85, CTRP: 84, EQLB: 74 },
  },
  // 24. Relentless
  {
    id: "relentless",
    name: "Relentless",
    description: "Recupera energie rapidamente durante i tempi morti mantenendo lucidità fino al 90°.",
    category: "Fisico",
    statReqs: { RESI: 87 },
  },
  // 25. Trivela
  {
    id: "trivela",
    name: "Trivela",
    description: "Tiri e passaggi magistrali di collo esterno con rotazione ad uscire.",
    category: "Passaggi",
    statReqs: { EFFT: 89, PASL: 74, TIRD: 74 },
  },
  // 26. Acrobatic
  {
    id: "acrobatic",
    name: "Acrobatic",
    description: "Volée, rovesciate e colpi al volo eseguiti con straordinaria coordinazione aerea.",
    category: "Fisico",
    statReqs: { AGIL: 85, RIFL: 79 },
  },
  // 27. Long Throw
  {
    id: "long_throw",
    name: "Long Throw",
    description: "Rimesse laterali chilometriche capaci di raggiungere direttamente l'area di rigore avversaria.",
    category: "Fisico",
    statReqs: { FRZA: 75 },
    roleReqs: ["DC", "TD", "TS", "DFC", "TER"],
  },
  // 28. Aerial
  {
    id: "aerial",
    name: "Aerial",
    description: "Dominio assoluto nei duelli aerei con stacco prodigioso e superiorità fisica sui cross.",
    category: "Fisico",
    statReqs: { TSTA: 74, ELEV: 84, FRZA: 84 },
    minHeight: 185,
  },
  // 29. Far Throw
  {
    id: "far_throw",
    name: "Far Throw",
    description: "Rinvii e rilanci con le mani del portiere a lunga gittata per innescare rapide ripartenze.",
    category: "Portiere",
    statReqs: { RINP: 80 },
    roleReqs: ["POR"],
  },
  // 30. Footwork
  {
    id: "footwork",
    name: "Footwork",
    description: "Parate decisive con i piedi sui tiri bassi ravvicinati con prontezza riflessa.",
    category: "Portiere",
    statReqs: { RIFP: 84 },
    roleReqs: ["POR"],
  },
  // 31. Cross Claimer
  {
    id: "cross_claimer",
    name: "Cross Claimer",
    description: "Uscite alte sicure e tempestive sui traversoni e corner avversari.",
    category: "Portiere",
    statReqs: { RIFP: 84, POSP: 84 },
    roleReqs: ["POR"],
  },
  // 32. Rush Out
  {
    id: "rush_out",
    name: "Rush Out",
    description: "Uscita fulminea sui piedi dell'attaccante lanciato a rete con chiusura dello specchio.",
    category: "Portiere",
    statReqs: { POSP: 84 },
    roleReqs: ["POR"],
    subRoleReq: "Portiere Fuori Dai Pali",
  },
  // 33. Far Reach
  {
    id: "far_reach",
    name: "Far Reach",
    description: "Estensione corporea massima per deviare conclusioni velenose dirette all'incrocio.",
    category: "Portiere",
    statReqs: { RIFL: 84, RIFP: 84, ELEV: 79 },
    roleReqs: ["POR"],
  },
  // 34. Quick Reflexes
  {
    id: "quick_reflexes",
    name: "Quick Reflexes",
    description: "Riflessi prodigiosi d'istinto sulle conclusioni ravvicinate e deviazioni impreviste.",
    category: "Portiere",
    statReqs: { RIFP: 89, RIFL: 79 },
    roleReqs: ["POR"],
  },
  // 35. Long Shot Taker
  {
    id: "long_shot_taker",
    name: "Long Shot Taker",
    description: "Tiri da fuori area carichi di potenza e precisione capaci di sorprendere il portiere da 30 metri.",
    category: "Tiro",
    statReqs: { TIRD: 86, PTIR: 86 },
  },
  // 36. Early Crosser
  {
    id: "early_crosser",
    name: "Early Crosser",
    description: "Cross anticipati di prima intenzione dalla trequarti che tagliano alle spalle della linea difensiva.",
    category: "Passaggi",
    statReqs: { CRSS: 85, EFFT: 79 },
  },
];

export interface PlayerSpecializationDraft {
  posiz: string;
  role1: string | null;
  role2: string | null;
  traits: Array<{
    id: string;
    tier: "silver" | "gold";
  }>;
  removedBaseTraits: string[];
}

/** Utility to clean trait names from DB */
export const normalizeTraitDbName = (dbName: string): string => {
  return dbName.replace(/\+$/, "").trim().toLowerCase();
};

/** Match a DB string to an official TraitDef */
export const findTraitDef = (identifier: string): TraitDef | undefined => {
  const clean = identifier.replace(/\+$/, "").trim().toLowerCase();
  return OFFICIAL_TRAITS.find(
    (t) =>
      t.id.toLowerCase() === clean.replace(/ /g, "_") ||
      t.name.toLowerCase() === clean ||
      (t.id === "power_leader" && clean === "power header")
  );
};

/** Parse player's current DB fields into structured specialization draft */
export const parsePlayerSpecializations = (player: Player | null | undefined): PlayerSpecializationDraft => {
  if (!player) {
    return {
      posiz: "CC",
      role1: null,
      role2: null,
      traits: [],
      removedBaseTraits: [],
    };
  }

  // Ruolo principale
  let posiz = player.Posiz || "CC";
  if (posiz === "DFC") posiz = "DC";
  if (posiz === "TER" || posiz === "DFD") posiz = "TD";
  if (posiz === "DFS") posiz = "TS";
  if (posiz === "TRQ") posiz = "COC";
  if (["AC", "PC", "SP"].includes(posiz)) posiz = "ATT";

  // Ruoli+
  const role1 = player.Role1 ? player.Role1.trim() : null;
  const role2 = player.Role2 ? player.Role2.trim() : null;

  // Tratti
  const traitsMap = new Map<string, "silver" | "gold">();

  const parseField = (val: string | null | undefined, tier: "silver" | "gold") => {
    if (!val) return;
    const items = val.split(",").map((s) => s.trim()).filter(Boolean);
    for (const it of items) {
      const def = findTraitDef(it);
      if (def && !traitsMap.has(def.id)) {
        traitsMap.set(def.id, tier);
      }
    }
  };

  // Process Gold first so gold status is preserved
  parseField(player.IconTrait1, "gold");
  parseField(player.IconTrait2, "gold");
  parseField(player.Trait1, "silver");
  parseField(player.Trait2, "silver");

  const traits = Array.from(traitsMap.entries()).map(([id, tier]) => ({ id, tier }));

  return {
    posiz,
    role1,
    role2,
    traits,
    removedBaseTraits: [],
  };
};

/** Check if player meets all requirements for a trait */
export const checkTraitRequirements = (
  trait: TraitDef,
  stats: Record<StatKey, number>,
  posiz: string,
  height: number = 180,
  currentSubRoles: Array<string | null> = []
): { ok: boolean; missing: string[] } => {
  const missing: string[] = [];

  // Check stat thresholds (strict inequality: stat > req)
  for (const [key, reqVal] of Object.entries(trait.statReqs)) {
    const statVal = stats[key as StatKey] ?? 0;
    if (statVal <= (reqVal ?? 0)) {
      missing.push(`${key} (${statVal}/${(reqVal ?? 0) + 1})`);
    }
  }

  // Check role requirement
  if (trait.roleReqs && trait.roleReqs.length > 0) {
    const normalizedPos = posiz.toUpperCase();
    const matchesRole = trait.roleReqs.some((r) => r.toUpperCase() === normalizedPos);
    if (!matchesRole) {
      missing.push(`Ruolo: ${trait.roleReqs.join(" o ")}`);
    }
  }

  // Check height
  if (trait.minHeight && height <= trait.minHeight) {
    missing.push(`Altezza > ${trait.minHeight}cm (Attuale: ${height}cm)`);
  }

  // Check sub-role requirement (e.g. Rush Out requires Portiere Fuori Dai Pali)
  if (trait.subRoleReq) {
    const target = trait.subRoleReq.toLowerCase();
    const hasSubRole = currentSubRoles.some((sr) => sr && sr.toLowerCase().includes(target));
    if (!hasSubRole) {
      missing.push(`Ruolo+ richiesto: ${trait.subRoleReq}`);
    }
  }

  return {
    ok: missing.length === 0,
    missing,
  };
};

/** Calculate exact XP cost for roles and traits */
export function calculateSpecializationsCost(
  basePlayer: Player | null | undefined,
  draft: PlayerSpecializationDraft,
  postOverall: number
): {
  roleCost: number;
  traitCost: number;
  totalCost: number;
  roleBreakdown: string[];
  traitBreakdown: string[];
} {
  if (!basePlayer) {
    return { roleCost: 0, traitCost: 0, totalCost: 0, roleBreakdown: [], traitBreakdown: [] };
  }

  const baseSpec = parsePlayerSpecializations(basePlayer);
  let roleCost = 0;
  let traitCost = 0;
  const roleBreakdown: string[] = [];
  const traitBreakdown: string[] = [];

  // 1. RUOLO PRINCIPALE
  const roleChanged = draft.posiz !== baseSpec.posiz;
  if (roleChanged) {
    roleCost += TRAINING_COSTS.ROLE_CHANGE;
    roleBreakdown.push(`Cambio Ruolo Principale a ${draft.posiz}: +${TRAINING_COSTS.ROLE_CHANGE} XP (1° Ruolo+ incluso)`);
  }

  // 2. RUOLI+
  if (roleChanged) {
    // If role changed, 1st Ruolo+ is included free. If 2nd is added, it costs 100 XP.
    if (draft.role2) {
      roleCost += TRAINING_COSTS.ROLE_PLUS_SECOND;
      roleBreakdown.push(`2° Ruolo+ (${draft.role2}): +${TRAINING_COSTS.ROLE_PLUS_SECOND} XP`);
    }
    // Check if any role is ++
    const hasPlusPlus = (draft.role1?.endsWith("++") || draft.role2?.endsWith("++")) ?? false;
    if (hasPlusPlus) {
      roleCost += TRAINING_COSTS.ROLE_PLUSPLUS;
      roleBreakdown.push(`Upgrade a Ruolo++: +${TRAINING_COSTS.ROLE_PLUSPLUS} XP`);
    }
  } else {
    // Position did NOT change: evaluate slot by slot vs base
    const baseR1 = baseSpec.role1;
    const baseR2 = baseSpec.role2;
    const baseR1Clean = baseR1 ? baseR1.replace(/\+\+$/, "").replace(/\+$/, "").trim() : null;
    const baseR2Clean = baseR2 ? baseR2.replace(/\+\+$/, "").replace(/\+$/, "").trim() : null;

    const draftR1 = draft.role1;
    const draftR2 = draft.role2;
    const draftR1Clean = draftR1 ? draftR1.replace(/\+\+$/, "").replace(/\+$/, "").trim() : null;
    const draftR2Clean = draftR2 ? draftR2.replace(/\+\+$/, "").replace(/\+$/, "").trim() : null;

    const baseCount = (baseR1 ? 1 : 0) + (baseR2 ? 1 : 0);

    // Slot 1
    if (!baseR1 && draftR1) {
      // 1st sub-role ever added -> free!
      roleBreakdown.push(`1° Ruolo+ (${draftR1}): Gratuito (0 XP)`);
    } else if (baseR1 && draftR1 && baseR1Clean !== draftR1Clean) {
      // Swapped slot 1
      roleCost += TRAINING_COSTS.ROLE_PLUS_SWAP;
      roleBreakdown.push(`Cambio Ruolo+ (${baseR1} → ${draftR1}): +${TRAINING_COSTS.ROLE_PLUS_SWAP} XP`);
    }

    // Slot 2
    if (!baseR2 && draftR2) {
      if (baseCount === 0 && !draftR1) {
        // Was empty, only added slot 2
        roleBreakdown.push(`1° Ruolo+ (${draftR2}): Gratuito (0 XP)`);
      } else {
        roleCost += TRAINING_COSTS.ROLE_PLUS_SECOND;
        roleBreakdown.push(`Aggiunta 2° Ruolo+ (${draftR2}): +${TRAINING_COSTS.ROLE_PLUS_SECOND} XP`);
      }
    } else if (baseR2 && draftR2 && baseR2Clean !== draftR2Clean) {
      // Swapped slot 2
      roleCost += TRAINING_COSTS.ROLE_PLUS_SWAP;
      roleBreakdown.push(`Cambio Ruolo+ (${baseR2} → ${draftR2}): +${TRAINING_COSTS.ROLE_PLUS_SWAP} XP`);
    }

    // Upgrade ++
    const baseHadPlusPlus = (baseR1?.endsWith("++") || baseR2?.endsWith("++")) ?? false;
    const draftHasPlusPlus = (draftR1?.endsWith("++") || draftR2?.endsWith("++")) ?? false;
    if (draftHasPlusPlus && !baseHadPlusPlus) {
      roleCost += TRAINING_COSTS.ROLE_PLUSPLUS;
      roleBreakdown.push(`Upgrade a Ruolo++: +${TRAINING_COSTS.ROLE_PLUSPLUS} XP`);
    }
  }

  // 3. TRATTI
  const baseTraitIds = new Set(baseSpec.traits.map((t) => t.id));
  const baseGoldTrait = baseSpec.traits.find((t) => t.tier === "gold");
  const draftGoldTrait = draft.traits.find((t) => t.tier === "gold");

  // Removed traits from base (costs 40 XP each)
  for (const removedId of draft.removedBaseTraits || []) {
    const def = OFFICIAL_TRAITS.find((t) => t.id === removedId);
    traitCost += TRAINING_COSTS.TRAIT_REMOVE;
    traitBreakdown.push(`Eliminazione Tratto (${def?.name || removedId}): +${TRAINING_COSTS.TRAIT_REMOVE} XP`);
  }

  // Added traits (cost 60 XP each)
  for (const dt of draft.traits) {
    if (!baseTraitIds.has(dt.id)) {
      const def = OFFICIAL_TRAITS.find((t) => t.id === dt.id);
      traitCost += TRAINING_COSTS.TRAIT_SILVER_ADD;
      traitBreakdown.push(`Acquisto Tratto (${def?.name || dt.id}): +${TRAINING_COSTS.TRAIT_SILVER_ADD} XP`);
    }
  }

  // Gold trait logic:
  // If player reached OVR >= 84 and has a Gold trait:
  if (draftGoldTrait && postOverall >= TRAINING_COSTS.OVR_THRESHOLD) {
    if (baseGoldTrait) {
      // Base ALREADY had a Gold trait!
      if (draftGoldTrait.id !== baseGoldTrait.id) {
        // Swap Gold costs 70 XP!
        traitCost += TRAINING_COSTS.TRAIT_GOLD_SWAP;
        const newGoldDef = OFFICIAL_TRAITS.find((t) => t.id === draftGoldTrait.id);
        traitBreakdown.push(`Scambio Tratto Oro con ${newGoldDef?.name || draftGoldTrait.id}: +${TRAINING_COSTS.TRAIT_GOLD_SWAP} XP`);
      }
    } else {
      // Base had NO gold trait -> 1° sblocco è GRATIS!
      const newGoldDef = OFFICIAL_TRAITS.find((t) => t.id === draftGoldTrait.id);
      traitBreakdown.push(`1° Tratto Oro (${newGoldDef?.name || draftGoldTrait.id}): Gratuito (OVR ≥ 84)`);
    }
  }

  return {
    roleCost,
    traitCost,
    totalCost: roleCost + traitCost,
    roleBreakdown,
    traitBreakdown,
  };
}

/** Serialize draft specializations into format for an_player_training.increases.specializations */
export function serializeSpecializationsForDb(draft: PlayerSpecializationDraft) {
  const silverTraits = draft.traits
    .filter((t) => t.tier === "silver")
    .map((t) => OFFICIAL_TRAITS.find((x) => x.id === t.id)?.name || t.id);

  const goldTraits = draft.traits
    .filter((t) => t.tier === "gold")
    .map((t) => (OFFICIAL_TRAITS.find((x) => x.id === t.id)?.name || t.id) + "+");

  return {
    posiz: draft.posiz,
    role1: draft.role1 || null,
    role2: draft.role2 || null,
    silver_traits: silverTraits.length > 0 ? silverTraits.join(", ") : null,
    gold_traits: goldTraits.length > 0 ? goldTraits.join(", ") : null,
    traits_list: draft.traits,
    removed_base_traits: draft.removedBaseTraits,
  };
}

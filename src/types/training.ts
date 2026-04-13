/** Tratti disponibili con requisiti attributo */
export interface Trait {
  id: string;
  name: string;
  description: string;
  category: "offensive" | "defensive" | "physical" | "mental" | "goalkeeper";
  /** Requisiti minimi di attributo per sbloccare il tratto */
  requirements: Record<string, number>;
  /** Costo XP per acquistare il tratto argento */
  cost: number;
}

export interface PlayerTrait {
  traitId: string;
  tier: "silver" | "gold";
}

/** Ruolo+ e Ruolo++ */
export interface SubRole {
  id: string;
  name: string;
  description: string;
  /** Posizioni principali compatibili */
  positions: string[];
}

export interface PlayerSubRole {
  subRoleId: string;
  tier: "plus" | "plusplus";
}

/** Costi XP placeholder */
export const XP_COSTS = {
  TRAIT_SILVER: 40,
  TRAIT_GOLD_SWAP: 25,
  ROLE_CHANGE: 50,
  ROLE_PLUS_ADD: 30,
  ROLE_PLUS_SWAP: 20,
  ROLE_PLUSPLUS: 60,
} as const;

/** Tratti placeholder */
export const AVAILABLE_TRAITS: Trait[] = [
  // Offensive
  { id: "finisher", name: "Finalizzatore", description: "Maggiore precisione sotto porta", category: "offensive", requirements: { FINA: 70, PIAZ: 65 }, cost: 40 },
  { id: "longshot", name: "Cecchino", description: "Tiri dalla distanza più precisi", category: "offensive", requirements: { TIRD: 70, PTIR: 65 }, cost: 40 },
  { id: "dribbler", name: "Dribblomane", description: "Dribbling più efficace", category: "offensive", requirements: { DRBL: 75, AGIL: 65 }, cost: 40 },
  { id: "playmaker", name: "Regista Offensivo", description: "Visione e passaggi migliorati in attacco", category: "offensive", requirements: { VISI: 70, PASC: 70 }, cost: 40 },
  { id: "header", name: "Colpitore di Testa", description: "Più efficace nei colpi di testa", category: "offensive", requirements: { TSTA: 70, ELEV: 65 }, cost: 40 },
  { id: "volley", name: "Acrobata", description: "Tiri al volo potenziati", category: "offensive", requirements: { TIRV: 70, AGIL: 60 }, cost: 40 },
  // Defensive
  { id: "tackler", name: "Muraglia", description: "Contrasti più puliti e efficaci", category: "defensive", requirements: { CONT: 70, AGGR: 65 }, cost: 40 },
  { id: "interceptor", name: "Intercettatore", description: "Letture difensive migliorate", category: "defensive", requirements: { INTR: 70, MARC: 65 }, cost: 40 },
  { id: "slide_master", name: "Scivolatore", description: "Scivolate più precise", category: "defensive", requirements: { SCIV: 70, AGIL: 60 }, cost: 40 },
  { id: "marker", name: "Marcatore Stretto", description: "Marcatura a uomo migliorata", category: "defensive", requirements: { MARC: 75, AGGR: 60 }, cost: 40 },
  // Physical
  { id: "speedster", name: "Velocista", description: "Scatti e velocità potenziati", category: "physical", requirements: { VELO: 75, ACCL: 70 }, cost: 40 },
  { id: "tank", name: "Corazziere", description: "Forza fisica nei contrasti", category: "physical", requirements: { FRZA: 70, EQLB: 65 }, cost: 40 },
  { id: "marathon", name: "Maratoneta", description: "Resistenza durante la partita", category: "physical", requirements: { RESI: 75 }, cost: 40 },
  { id: "agile", name: "Gazzella", description: "Agilità nei cambi di direzione", category: "physical", requirements: { AGIL: 75, ACCL: 65 }, cost: 40 },
  // Mental
  { id: "leader", name: "Capitano", description: "Leadership e influenza sulla squadra", category: "mental", requirements: { VISI: 70, MARC: 60 }, cost: 40 },
  { id: "clutch", name: "Uomo Partita", description: "Migliore nelle situazioni decisive", category: "mental", requirements: { CRIG: 65, FINA: 65 }, cost: 40 },
  { id: "setpiece", name: "Specialista Piazzati", description: "Calci piazzati migliorati", category: "mental", requirements: { PNIZ: 70, EFFT: 65 }, cost: 40 },
  // Goalkeeper
  { id: "reflexes", name: "Muro", description: "Riflessi portiere potenziati", category: "goalkeeper", requirements: { RIFP: 75, TUFP: 65 }, cost: 40 },
  { id: "sweeper_gk", name: "Portiere Libero", description: "Uscite e gioco con i piedi", category: "goalkeeper", requirements: { RINP: 65, POSP: 70 }, cost: 40 },
  { id: "shot_stopper", name: "Para Rigori", description: "Parate sui rigori migliorate", category: "goalkeeper", requirements: { RIFP: 70, PREP: 70 }, cost: 40 },
];

/** Sotto-ruoli placeholder per posizione */
export const AVAILABLE_SUBROLES: SubRole[] = [
  // Portiere
  { id: "sweeper_keeper", name: "Sweeper Keeper", description: "Portiere che esce a giocare alto", positions: ["POR"] },
  { id: "traditional_gk", name: "Portiere Classico", description: "Portiere tradizionale tra i pali", positions: ["POR"] },
  // Difensori
  { id: "ball_playing_cb", name: "Difensore Regista", description: "Difensore con capacità di impostazione", positions: ["DC", "DFC"] },
  { id: "stopper", name: "Stopper", description: "Difensore aggressivo in marcatura", positions: ["DC", "DFC"] },
  { id: "fullback_att", name: "Terzino Offensivo", description: "Terzino con propensione offensiva", positions: ["TD", "TS", "DFD", "DFS"] },
  { id: "fullback_def", name: "Terzino Difensivo", description: "Terzino bloccato in difesa", positions: ["TD", "TS", "DFD", "DFS"] },
  // Centrocampisti
  { id: "box_to_box", name: "Box-to-Box", description: "Centrocampista a tutto campo", positions: ["CC", "CDC", "COC"] },
  { id: "deep_playmaker", name: "Regista Basso", description: "Centrocampista che imposta da dietro", positions: ["CC", "CDC"] },
  { id: "mezzala", name: "Mezzala", description: "Centrocampista con inserimenti offensivi", positions: ["CC", "COC"] },
  { id: "trequartista", name: "Trequartista", description: "Giocatore tra le linee", positions: ["COC", "TRQ"] },
  { id: "winger", name: "Ala Classica", description: "Esterno che punta la linea di fondo", positions: ["ED", "ES", "AD", "AS"] },
  { id: "inverted_winger", name: "Ala Invertita", description: "Esterno che rientra verso il centro", positions: ["ED", "ES", "AD", "AS"] },
  // Attaccanti
  { id: "target_man", name: "Boa", description: "Attaccante punto di riferimento", positions: ["ATT", "AC", "PC"] },
  { id: "poacher", name: "Finalizzatore", description: "Attaccante d'area di rigore", positions: ["ATT", "AC", "PC"] },
  { id: "false_nine", name: "Falso Nove", description: "Attaccante che si abbassa a giocare", positions: ["ATT", "AC", "PC"] },
  { id: "second_striker", name: "Seconda Punta", description: "Attaccante che gioca tra le linee", positions: ["ATT", "AC", "PC", "SP"] },
];

/** Ruoli principali disponibili per cambio ruolo */
export const AVAILABLE_ROLES = [
  "POR", "DC", "DFC", "TD", "TS", "DFD", "DFS",
  "CC", "CDC", "COC", "TRQ",
  "ED", "ES", "AD", "AS",
  "ATT", "AC", "PC", "SP",
];

// ── Stub save functions (da implementare con il tuo backend) ──

/** Salva i tratti del giocatore */
export async function savePlayerTraits(playerId: number, traits: PlayerTrait[]): Promise<void> {
  console.log("[STUB] savePlayerTraits", { playerId, traits });
  // TODO: implementare chiamata al backend
}

/** Salva i sotto-ruoli del giocatore */
export async function savePlayerSubRoles(playerId: number, subRoles: PlayerSubRole[]): Promise<void> {
  console.log("[STUB] savePlayerSubRoles", { playerId, subRoles });
  // TODO: implementare chiamata al backend
}

/** Salva il cambio ruolo del giocatore */
export async function savePlayerRoleChange(playerId: number, newRole: string, selectedSubRole: string): Promise<void> {
  console.log("[STUB] savePlayerRoleChange", { playerId, newRole, selectedSubRole });
  // TODO: implementare chiamata al backend
}

/** Aggiorna l'XP del giocatore dopo un acquisto */
export async function deductPlayerXP(playerId: number, amount: number): Promise<void> {
  console.log("[STUB] deductPlayerXP", { playerId, amount });
  // TODO: implementare chiamata al backend
}

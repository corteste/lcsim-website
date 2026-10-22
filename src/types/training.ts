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

import { supabase } from "@/supabaseClient";
import { PLAYER_TABLE } from "@/constants/App";
import { Player } from "./player";

// Map frontend trait IDs to database names (English names as stored in DB)
export const TRAIT_MAP: Record<string, string> = {
  finisher: "Finesse Shot",
  longshot: "Long Shot Taker",
  dribbler: "Technical",
  playmaker: "Tiki Taka",
  header: "Power Header",
  volley: "Acrobatic",
  tackler: "Block",
  interceptor: "Intercept",
  slide_master: "Slide Tackle",
  marker: "Jockey",
  speedster: "Rapid",
  tank: "Bruiser",
  marathon: "Relentless",
  agile: "Quick Step",
  leader: "Solid Player",
  clutch: "Clutch",
  setpiece: "Dead Ball",
  reflexes: "Far Throw",
  sweeper_gk: "Footwork",
  shot_stopper: "Rush Out"
};

// Map database strings to frontend trait IDs
export const dbToId = (dbName: string): string => {
  const clean = dbName.replace(/\+$/, "").trim();
  const entry = Object.entries(TRAIT_MAP).find(([_, v]) => v.toLowerCase() === clean.toLowerCase());
  return entry ? entry[0] : clean.toLowerCase().replace(/ /g, "_");
};

export const idToDb = (id: string): string => {
  return TRAIT_MAP[id] || id.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
};

// Map frontend subrole IDs to database names (Italian names as stored in DB)
export const SUBROLE_MAP: Record<string, string> = {
  sweeper_keeper: "Portiere di Movimento",
  traditional_gk: "Portiere Classico",
  ball_playing_cb: "Difensore Regista",
  stopper: "Stopper",
  fullback_att: "Terzino Offensivo",
  fullback_def: "Terzino Difensivo",
  box_to_box: "Box To Box",
  deep_playmaker: "Regista Basso",
  mezzala: "Mezzala",
  trequartista: "Trequartista",
  winger: "Ala",
  inverted_winger: "Attaccante Interno",
  target_man: "Torre",
  poacher: "Rapace",
  false_nine: "Falso 9",
  second_striker: "Seconda Punta",
  regista: "Regista",
  regista_largo: "Regista Largo",
  attaccante_avanzato: "Attaccante Avanzato",
  no_10: "10 Vecchia Scuola",
  difensore: "Difensore"
};

// Map database strings to frontend subrole IDs
export const dbToSubroleId = (dbName: string): string => {
  const clean = dbName.replace(/\+\+$/, "").replace(/\+$/, "").trim();
  const entry = Object.entries(SUBROLE_MAP).find(([_, v]) => v.toLowerCase() === clean.toLowerCase());
  return entry ? entry[0] : clean.toLowerCase().replace(/ /g, "_");
};

export const idToSubroleDb = (id: string): string => {
  return SUBROLE_MAP[id] || id.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
};

// ── Real save functions ──

/** Salva i tratti del giocatore */
export async function savePlayerTraits(playerId: number, traits: PlayerTrait[]): Promise<Player> {
  const silverTraits = traits.filter(t => t.tier === "silver").map(t => idToDb(t.traitId));
  const goldTraits = traits.filter(t => t.tier === "gold").map(t => idToDb(t.traitId) + "+");

  const trait1 = silverTraits.length > 0 ? silverTraits.join(", ") : null;
  const trait2 = null;
  const iconTrait1 = goldTraits.length > 0 ? goldTraits[0] : null;
  const iconTrait2 = goldTraits.length > 1 ? goldTraits[1] : null;

  const { data, error } = await supabase
    .from(PLAYER_TABLE)
    .update({
      Trait1: trait1,
      Trait2: trait2,
      IconTrait1: iconTrait1,
      IconTrait2: iconTrait2
    })
    .eq("ID", playerId)
    .select();

  if (error) throw error;

  const saved = (data && data.length > 0) ? (data[0] as Player) : null;
  return saved as Player;
}

/** Salva i sotto-ruoli del giocatore */
export async function savePlayerSubRoles(playerId: number, subRoles: PlayerSubRole[]): Promise<Player> {
  const role1 = subRoles.length > 0 ? (idToSubroleDb(subRoles[0].subRoleId) + (subRoles[0].tier === "plusplus" ? " ++" : " +")) : null;
  const role2 = subRoles.length > 1 ? (idToSubroleDb(subRoles[1].subRoleId) + (subRoles[1].tier === "plusplus" ? " ++" : " +")) : null;

  const { data, error } = await supabase
    .from(PLAYER_TABLE)
    .update({
      Role1: role1,
      Role2: role2
    })
    .eq("ID", playerId)
    .select();

  if (error) throw error;

  const saved = (data && data.length > 0) ? (data[0] as Player) : null;
  return saved as Player;
}

/** Salva il cambio ruolo del giocatore */
export async function savePlayerRoleChange(playerId: number, newRole: string, selectedSubRole: string): Promise<Player> {
  const role1 = idToSubroleDb(selectedSubRole) + " +";
  const { data, error } = await supabase
    .from(PLAYER_TABLE)
    .update({
      Posiz: newRole,
      Role1: role1,
      Role2: null
    })
    .eq("ID", playerId)
    .select();

  if (error) throw error;

  const saved = (data && data.length > 0) ? (data[0] as Player) : null;
  return saved as Player;
}

/** Aggiorna l'XP del giocatore dopo un acquisto */
export async function deductPlayerXP(playerId: number, amount: number): Promise<Player> {
  const { data: player, error: fetchError } = await supabase
    .from(PLAYER_TABLE)
    .select("XP")
    .eq("ID", playerId)
    .single();

  if (fetchError) throw fetchError;

  const currentXp = player?.XP ?? 0;
  const newXp = Math.max(0, currentXp - amount);

  const { data, error } = await supabase
    .from(PLAYER_TABLE)
    .update({ XP: newXp })
    .eq("ID", playerId)
    .select();

  if (error) {
    console.error("Error deducting player XP:", error);
    throw error;
  }
  const saved = (data && data.length > 0) ? (data[0] as Player) : null;
  return saved as Player;
}

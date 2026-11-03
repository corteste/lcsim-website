import { supabase } from "@/supabaseClient";
import { ROOKIE_COMBINE_TABLE } from "@/constants/App";
import { CombineMetric } from "@/components/draft/DraftPickAnnouncementModal";

export interface RookieCombineResult {
  id: number;
  rookie_id: number;
  nome: string;
  cognome: string;
  eta?: number;
  nazionalita?: string;
  altezza?: number;
  peso?: number;
  posiz?: string;
  piede?: string;
  dash_40yd: number;
  dash_40yd_rank: string;
  bench_press: number;
  bench_press_rank: string;
  vertical_jump: number;
  vertical_jump_rank: string;
  shuttle_run: number;
  shuttle_run_rank: string;
  three_cone: number;
  three_cone_rank: string;
  athletic_index: number;
  created_at?: string;
}

/**
 * Converte la stringa del rank (es. "12°" o "1°") in un punteggio percentuale 0-100 per le barre visive.
 * Rank 1° = 100%, Rank 60° = 2%
 */
export function rankToScore(rankStr?: string | number): number {
  if (!rankStr) return 0;
  const num = parseInt(String(rankStr).replace(/[^\d]/g, ""), 10);
  if (isNaN(num) || num <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round(((61 - num) / 60) * 100)));
}

/**
 * Trasforma il record della combine nei 5 CombineMetric standard per il modal di annuncio draft.
 */
export function buildMetricsFromCombine(combine: RookieCombineResult): CombineMetric[] {
  return [
    {
      id: "40yd_dash",
      label: "40 YD Dash",
      value: combine.dash_40yd,
      unit: "s",
      grade: combine.dash_40yd_rank,
      score: rankToScore(combine.dash_40yd_rank),
    },
    {
      id: "bench_press",
      label: "Bench Press",
      value: combine.bench_press,
      unit: "reps",
      grade: combine.bench_press_rank,
      score: rankToScore(combine.bench_press_rank),
    },
    {
      id: "vertical_jump",
      label: "Vertical Jump",
      value: combine.vertical_jump,
      unit: "cm",
      grade: combine.vertical_jump_rank,
      score: rankToScore(combine.vertical_jump_rank),
    },
    {
      id: "shuttle_run",
      label: "20 YD Shuttle",
      value: combine.shuttle_run,
      unit: "s",
      grade: combine.shuttle_run_rank,
      score: rankToScore(combine.shuttle_run_rank),
    },
    {
      id: "three_cone",
      label: "3 Cone Drill",
      value: combine.three_cone,
      unit: "s",
      grade: combine.three_cone_rank,
      score: rankToScore(combine.three_cone_rank),
    },
  ];
}

/**
 * Recupera i risultati Combine per un singolo rookieId da Supabase.
 */
export async function fetchRookieCombine(rookieId: number): Promise<RookieCombineResult | null> {
  try {
    const { data, error } = await supabase
      .from(ROOKIE_COMBINE_TABLE)
      .select("*")
      .eq("rookie_id", rookieId)
      .maybeSingle();

    if (error) {
      console.error(`Errore caricamento combine per rookie #${rookieId}:`, error);
      return null;
    }
    return (data as RookieCombineResult) ?? null;
  } catch (err) {
    console.error(`Eccezione fetch combine per rookie #${rookieId}:`, err);
    return null;
  }
}

/**
 * Recupera tutti i risultati Combine dal database Supabase.
 */
export async function fetchAllRookieCombines(): Promise<RookieCombineResult[]> {
  try {
    const { data, error } = await supabase
      .from(ROOKIE_COMBINE_TABLE)
      .select("*")
      .order("rookie_id", { ascending: true });

    if (error) {
      console.error("Errore recupero lista combine rookie:", error);
      return [];
    }
    return (data as RookieCombineResult[]) || [];
  } catch (err) {
    console.error("Eccezione recupero lista combine rookie:", err);
    return [];
  }
}

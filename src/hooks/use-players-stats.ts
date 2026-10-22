import { useQuery } from "@tanstack/react-query";
import { PlayerStatsAvg, PlayerStatsSum } from "../types/playerStats";
import { fetchPlayerSumBySeason, fetchPlayerAvgBySeason } from "@/services/playerStatsService";

export function getPlayersStatsRound(season?: number, week?: number, team?: string) {
  const isEnabled = season !== undefined && season !== null;

  const { data, isLoading, error } = useQuery<PlayerStatsAvg[]>({
    queryKey: ['playerRoundStats', season, week, team],
    queryFn: () => (isEnabled ? fetchPlayerAvgBySeason(season!) : Promise.resolve([])),
    enabled: isEnabled,
    staleTime: 5 * 60 * 1000,
  });

  return {
    playersStats: data ?? [],
    loading: isLoading,
    error: error ? (error as Error).message : null,
  };
}

export function getPlayersSumStats(season?: number, player?: string, team?: string) {
  const isEnabled = season !== undefined && season !== null;

  const { data, isLoading, error } = useQuery<PlayerStatsSum[]>({
    queryKey: ['playerSumStats', season, player, team],
    queryFn: () => (isEnabled ? fetchPlayerSumBySeason(season!) : Promise.resolve([])),
    enabled: isEnabled,
    staleTime: 5 * 60 * 1000,
  });

  return {
    playersStats: data ?? [],
    loading: isLoading,
    error: error ? (error as Error).message : null,
  };
}

export function getPlayersAvgStats(season?: number, player?: string, team?: string) {
  const isEnabled = season !== undefined && season !== null;

  const { data, isLoading, error } = useQuery<PlayerStatsAvg[]>({
    queryKey: ['playerAvgStats', season, player, team],
    queryFn: () => (isEnabled ? fetchPlayerAvgBySeason(season!) : Promise.resolve([])),
    enabled: isEnabled,
    staleTime: 5 * 60 * 1000,
  });

  return {
    playersStats: data ?? [],
    loading: isLoading,
    error: error ? (error as Error).message : null,
  };
}

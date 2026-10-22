import { useQuery } from "@tanstack/react-query";
import { Player } from "../types/player";
import { fetchPlayers, fetchPlayersByTeam } from '@/services/playersService';

export function getPlayers(fromTeam?: string) {
  const { data, isLoading, error } = useQuery<Player[]>({
    queryKey: ['players', fromTeam ?? 'all'],
    queryFn: () => (fromTeam !== undefined ? fetchPlayersByTeam(fromTeam) : fetchPlayers()),
    staleTime: 5 * 60 * 1000,
  });

  return {
    players: data ?? [],
    loading: isLoading,
    error: error ? (error as Error).message : null,
  };
}

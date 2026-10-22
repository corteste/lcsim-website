import { useQuery } from "@tanstack/react-query";
import { fetchStandings } from "@/services/standingsService";
import { Standings } from "@/types/standings";

export function getStandings(season?: number) {
  const { data, isLoading, error } = useQuery<Standings[]>({
    queryKey: ['standings', season ?? 'latest'],
    queryFn: () => fetchStandings(season),
    staleTime: 5 * 60 * 1000,
  });

  return {
    standings: data ?? [],
    loading: isLoading,
    error: error ? (error as Error).message : null,
  };
}

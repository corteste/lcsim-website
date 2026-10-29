import { useQuery } from "@tanstack/react-query";
import { Team } from "@/types/team";
import { fetchTeams, fetchTeamById } from '@/services/teamService';

export function getTeams() {
  const { data, isLoading, error, refetch } = useQuery<Team[]>({
    queryKey: ['teams'],
    queryFn: () => fetchTeams(),
    staleTime: 30 * 1000,
  });

  return {
    teams: data ?? [],
    loading: isLoading,
    error: error ? (error as Error).message : null,
    refetch,
  };
}

export function getTeamById(teamId?: string) {
  const { data, isLoading, error, refetch } = useQuery<Team | null>({
    queryKey: ['team', teamId],
    queryFn: () => fetchTeamById(teamId),
    enabled: !!teamId,
    staleTime: 30 * 1000,
  });

  return {
    team: data ?? null,
    loading: isLoading,
    error: error ? (error as Error).message : null,
    refetch,
  };
}

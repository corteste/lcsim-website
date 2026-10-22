import { useEffect, useState } from "react";
import { Team } from "@/types/team";
import { fetchTeams, fetchTeamById } from '@/services/teamService';

export function getTeams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchTeamsWrapper() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchTeams();
        if (isMounted) {
          setTeams(data);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchTeamsWrapper();

    return () => {
      isMounted = false;
    };
  }, []);

  return { teams, loading, error };
}

export function getTeamById(teamId?: string) {
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;

    if (!teamId) {
      setTeam(null);
      setLoading(false);
      return;
    }

    async function fetchTeamWrapper() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchTeamById(teamId);
        if (isMounted) {
          setTeam(data);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchTeamWrapper();

    return () => {
      isMounted = false;
    };
  }, [teamId]);

  return { team, loading, error };
}

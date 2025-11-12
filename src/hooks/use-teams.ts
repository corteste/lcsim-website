import { useEffect, useState } from "react";
import { Team } from "@/types/team";
import { fetchTeams, fetchTeamById } from '@/services/teamService';

export function getTeams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    async function fetchTeamsWrapper() {
       console.log("Fetching all players");
      fetchTeams()
      .then(setTeams)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
      
      setLoading(false);
    }

    fetchTeamsWrapper();
  }, []);

  return { teams, loading, error };
}

export function getTeamById(teamId?: string) {
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    async function fetchTeamsWrapper() {
      console.log("Fetching players for team:", teamId);
      fetchTeamById(teamId)
      .then(setTeam)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
      setLoading(false);
    }

    fetchTeamsWrapper();
  }, [teamId]);

  return { team, loading, error };
}


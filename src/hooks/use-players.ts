import { useEffect, useState } from "react";
import { Player } from "../types/player";
import { fetchPlayers, fetchPlayersByTeam } from '@/services/playersService';


export function getPlayers(fromTeam?: string) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    async function fetchPlayersWrapper() {
      if (fromTeam !== undefined) {
        console.log("Fetching players for team:", fromTeam);
        fetchPlayersByTeam(fromTeam)
      .then(setPlayers)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
      } else {
        console.log("Fetching all players");
        fetchPlayers()
      .then(setPlayers)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
      }
      setLoading(false);
    }

    fetchPlayersWrapper();
  }, [fromTeam]);

  return { players, loading, error };
}
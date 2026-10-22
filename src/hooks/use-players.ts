import { useEffect, useState } from "react";
import { Player } from "../types/player";
import { fetchPlayers, fetchPlayersByTeam } from '@/services/playersService';

export function getPlayers(fromTeam?: string) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchPlayersWrapper() {
      setLoading(true);
      setError(null);
      try {
        const data = fromTeam !== undefined
          ? await fetchPlayersByTeam(fromTeam)
          : await fetchPlayers();
        if (isMounted) {
          setPlayers(data);
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

    fetchPlayersWrapper();

    return () => {
      isMounted = false;
    };
  }, [fromTeam]);

  return { players, loading, error };
}

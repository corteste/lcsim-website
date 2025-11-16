import { fetchStandings } from "@/services/standingsService";
import { Standings } from "@/types/standings";
import { useEffect, useState } from "react";


export function getStandings() {
  const [standings, setStandings] = useState<Standings[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    async function fetchPlayersWrapper() {
        console.log("Fetching standings");
        fetchStandings()
      .then(setStandings)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
      
      setLoading(false);
    }

    fetchPlayersWrapper();
  }, []);

  return { standings, loading, error };
}

// useless
import { useEffect, useState } from "react";
import { MatchStats } from "@/types/teamStats";
import { fetchSchedule } from "@/services/scheduleService";

export function getSchedule(season?: number,week?: number) {
  const [matchStats, setMatchStats] = useState<MatchStats[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);
  useEffect(() => {
    async function fetchPlayerStatsWrapper() {
      if (season !== null) {
        console.log("Fetching schedule for season:", season + " - week: " + week);
        fetchSchedule(season, week)
      .then(setMatchStats)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
      } 
      setLoading(false);
    }

    fetchPlayerStatsWrapper();
  }, [season, week]);

  return { matchStats, loading, error };
}

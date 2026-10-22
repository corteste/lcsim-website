import { useEffect, useState } from "react";
import { MatchStats } from "@/types/teamStats";
import { fetchSchedule } from "@/services/scheduleService";

export function getSchedule(season?: number, week?: number) {
  const [matchStats, setMatchStats] = useState<MatchStats[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;

    if (season === undefined || season === null || week === undefined || week === null) {
      setLoading(false);
      return;
    }

    async function fetchScheduleWrapper() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchSchedule(season!, week!);
        if (isMounted) {
          setMatchStats(data);
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

    fetchScheduleWrapper();

    return () => {
      isMounted = false;
    };
  }, [season, week]);

  return { matchStats, loading, error };
}

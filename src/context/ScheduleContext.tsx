import { fetchSeasonSchedule } from "@/services/scheduleService";
import { Schedule } from "@/types/schedule";
import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";

interface ScheduleContextType {
  schedule: Schedule[];
  loaded: boolean; // Note: named 'loaded' in Calendario.tsx where true means 'isLoading'
  season: number;
  setSeason: (stag: number) => void;
  reloadSchedule: () => Promise<void>;
}

const ScheduleContext = createContext<ScheduleContextType>({
  schedule: [],
  loaded: false,
  season: 11,
  setSeason: () => {},
  reloadSchedule: async () => {},
});

const DEFAULT_SEASON = 11;

export function ScheduleProvider({ children }: { children: ReactNode }) {
  const [season, setSeason] = useState<number>(DEFAULT_SEASON);
  const [schedule, setSchedule] = useState<Schedule[]>([]);
  const [loaded, setLoaded] = useState(false);

  const loadSchedule = async (targetSeason = season) => {
    setLoaded(true);
    try {
      const allWeeks = await fetchSeasonSchedule(targetSeason);
      setSchedule(allWeeks);
    } catch (err) {
      console.error("Error fetching season schedule:", err);
    } finally {
      setLoaded(false);
    }
  };

  useEffect(() => {
    loadSchedule(season);
  }, [season]);

  return (
    <ScheduleContext.Provider value={{ schedule, loaded, season, setSeason, reloadSchedule: () => loadSchedule(season) }}>
      {children}
    </ScheduleContext.Provider>
  );
}

export function useSchedule() {
  return useContext(ScheduleContext);
}

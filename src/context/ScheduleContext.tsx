import { fetchSeasonSchedule } from "@/services/scheduleService";
import { Schedule } from "@/types/schedule";
import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";

interface ScheduleContextType {
  schedule: Schedule[];
  loaded: boolean; // Note: named 'loaded' in Calendario.tsx where true means 'isLoading'
  reloadSchedule: () => Promise<void>;
}

const ScheduleContext = createContext<ScheduleContextType>({
  schedule: [],
  loaded: false,
  reloadSchedule: async () => {},
});

const SEASON = 10;

export function ScheduleProvider({ children }: { children: ReactNode }) {
  const [schedule, setSchedule] = useState<Schedule[]>([]);
  const [loaded, setLoaded] = useState(false);
  const hasFetched = useRef(false);

  const loadSchedule = async () => {
    setLoaded(true);
    try {
      const allWeeks = await fetchSeasonSchedule(SEASON);
      setSchedule(allWeeks);
    } catch (err) {
      console.error("Error fetching season schedule:", err);
    } finally {
      setLoaded(false);
    }
  };

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    loadSchedule();
  }, []);

  return (
    <ScheduleContext.Provider value={{ schedule, loaded, reloadSchedule: loadSchedule }}>
      {children}
    </ScheduleContext.Provider>
  );
}

export function useSchedule() {
  return useContext(ScheduleContext);
}

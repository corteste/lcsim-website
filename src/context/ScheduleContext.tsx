import { fetchSeasonSchedule, fetchSeasonEvents } from "@/services/scheduleService";
import { Schedule, LeagueCalendarEvent } from "@/types/schedule";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface ScheduleContextType {
  schedule: Schedule[];
  seasonEvents: LeagueCalendarEvent[];
  loaded: boolean; // Note: named 'loaded' in Calendario.tsx where true means 'isLoading'
  season: number;
  setSeason: (stag: number) => void;
  reloadSchedule: () => Promise<void>;
}

const ScheduleContext = createContext<ScheduleContextType>({
  schedule: [],
  seasonEvents: [],
  loaded: false,
  season: 11,
  setSeason: () => {},
  reloadSchedule: async () => {},
});

const DEFAULT_SEASON = 11;

export function ScheduleProvider({ children }: { children: ReactNode }) {
  const [season, setSeason] = useState<number>(DEFAULT_SEASON);
  const [schedule, setSchedule] = useState<Schedule[]>([]);
  const [seasonEvents, setSeasonEvents] = useState<LeagueCalendarEvent[]>([]);
  const [loaded, setLoaded] = useState(false);

  const loadSchedule = async (targetSeason = season) => {
    setLoaded(true);
    try {
      const [allWeeks, events] = await Promise.all([
        fetchSeasonSchedule(targetSeason),
        fetchSeasonEvents(targetSeason),
      ]);
      setSchedule(allWeeks);
      setSeasonEvents(events);
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
    <ScheduleContext.Provider
      value={{
        schedule,
        seasonEvents,
        loaded,
        season,
        setSeason,
        reloadSchedule: () => loadSchedule(season),
      }}
    >
      {children}
    </ScheduleContext.Provider>
  );
}

export function useSchedule() {
  return useContext(ScheduleContext);
}

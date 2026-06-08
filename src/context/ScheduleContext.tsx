import { fetchSchedule, fetchScheduleGeneral } from "@/services/scheduleService";
import { PlayerStats } from "@/types/playerStats";
import { Schedule } from "@/types/schedule";
import { createContext, useContext, useState, useEffect, useRef } from "react";

const ScheduleContext = createContext(null);
const SEASON = 10;

// PER ORDINE FORMAZIONE
const rolePriority: Record<string, number> = {
    POR: 0, TD: 1, DC: 2, TS: 3, CDC: 4, ED: 5, CC: 6, ES: 7, COC: 8, AD: 9, AS: 10, AT: 11, ATT: 12
};

function sortPlayersByRole(players: PlayerStats[]): PlayerStats[] {
    return players.slice().sort((a, b) => rolePriority[a.Posiz] - rolePriority[b.Posiz]);
}

// Fetch singola settimana
async function fetchWeekData(season: number, week: number): Promise<Schedule> {
    const [matchStats, scheduleGeneral] = await Promise.all([
        fetchSchedule(season, week),
        fetchScheduleGeneral(season, week)
    ]);
    
    for (let j = 0; j < matchStats.length; j++) {
        matchStats[j].away_player_stats = sortPlayersByRole(matchStats[j].away_player_stats);
        matchStats[j].home_player_stats = sortPlayersByRole(matchStats[j].home_player_stats);
        matchStats[j].stadium = scheduleGeneral[j]?.stadium ?? "";
        matchStats[j].referee = scheduleGeneral[j]?.referee ?? "";
        matchStats[j].weather = scheduleGeneral[j]?.weather ?? "";
        matchStats[j].date = scheduleGeneral[j]?.date ?? new Date();
    }
    
    return { week, matches: matchStats };
}

export function ScheduleProvider({ children }) {
    const [schedule, setSchedule] = useState<Schedule[]>([]);
    const [loaded, setLoaded] = useState(false);
    const hasFetched = useRef(false);

    useEffect(() => {
        // Evita doppio fetch in StrictMode
        if (hasFetched.current) return;
        hasFetched.current = true;

        async function fetchAllWeeks() {
            setLoaded(true);
            
            try {
                // Fetch tutte le settimane in parallelo
                const weekPromises = Array.from({ length: 9 }, (_, i) => 
                    fetchWeekData(SEASON, i + 1).catch(err => {
                        console.error("Error fetching week", i + 1, err);
                        return { week: i + 1, matches: [] } as Schedule;
                    })
                );
                
                const allWeeks = await Promise.all(weekPromises);
                
                // Ordina per settimana
                allWeeks.sort((a, b) => a.week - b.week);
                
                setSchedule(allWeeks);
            } catch (err) {
                console.error("Error fetching schedule", err);
            } finally {
                setLoaded(false);
            }
        }

        fetchAllWeeks();
    }, []);

    return (
        <ScheduleContext.Provider value={{ schedule, loaded }}>
            {children}
        </ScheduleContext.Provider>
    );
}

export function useSchedule() {
    return useContext(ScheduleContext);
}
import { fetchSchedule, fetchScheduleGeneral } from "@/services/scheduleService";
import { PlayerStats } from "@/types/playerStats";
import { Schedule } from "@/types/schedule";
import { createContext, useContext, useState, useEffect } from "react";

const ScheduleContext = createContext(null);

export function ScheduleProvider({ children }) {
    const [schedule, setSchedule] = useState<Schedule[]>([]);
    const [loaded, setLoaded] = useState(false);

    // PER ORDINE FORMAZIONE
    const rolePriority: Record<string, number> = {
        POR: 0, TD: 1, DC: 2, TS: 3, CDC: 4, ED: 5, CC: 6, ES: 7, COC: 8, AD: 9, AS: 10, AT: 11, ATT: 12
    };

    function sortPlayersByRole(players: PlayerStats[]): PlayerStats[] {
        // slice() serve per non modificare l'array originale
        return players.slice().sort((a, b) => rolePriority[a.Posiz] - rolePriority[b.Posiz]);
    }

    useEffect(() => {
        async function fetchAllWeeks() {
            setLoaded(true); // inizio caricamento
            let temp: Schedule[] = [];

            for (let i = 0; i < 9; i++) {
                try {
                    const matchStats = await fetchSchedule(9, i + 1);
                    const scheduleGeneral = await fetchScheduleGeneral(9, i + 1);
                    //ordino lista di giocatori per la formazione
                    for (let j = 0; j < matchStats.length; j++) {
                        matchStats[j].away_player_stats = sortPlayersByRole(matchStats[j].away_player_stats);
                        matchStats[j].home_player_stats = sortPlayersByRole(matchStats[j].home_player_stats);
                        matchStats[j].stadium = scheduleGeneral[j].stadium;
                        matchStats[j].referee = scheduleGeneral[j].referee;
                        matchStats[j].weather = scheduleGeneral[j].weather;
                        matchStats[j].date = scheduleGeneral[j].date;
                    }
                    temp.push({
                        week: i + 1,
                        matches: matchStats,
                    });
                } catch (err) {
                    console.error("Error fetching week", i + 1, err);
                    temp.push({
                        week: i + 1,
                        matches: [],
                    });
                }
                console.log("fetched week " + i);
            }
            setLoaded(false); // fine caricamento
            setSchedule(temp);
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
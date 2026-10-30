import { MatchStats } from "./teamStats";

export type Schedule = {
    week: number;
    matches: MatchStats[];
};

export type ScheduleGeneral = {
    week: number;
    home?: string;
    away?: string;
    stag?: number;
    stadium: string;
    referee: string;
    weather: string;
    date: Date;
    match_time?: string;
    unlock_at?: string | null;
    standings_processed?: boolean;
};
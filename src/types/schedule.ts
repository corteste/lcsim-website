import { MatchStats } from "./teamStats";

export type Schedule = {
    week: number;
    matches: MatchStats[];
};

export type ScheduleGeneral = {
    week: number;
    stadium: string;
    referee: string;
    weather: string;
    date: Date;
};
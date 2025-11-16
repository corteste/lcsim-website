import { MatchStats } from "./teamStats";

export type Schedule = {
    week: number;
    matches: MatchStats[];
};
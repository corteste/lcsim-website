import { Team } from "./team";

export type Standings = {
    team: Team;
    games_played: number;
    win: number;
    draws: number;
    loss: number;
    goal_made: number;
    goal_conceded: number;
    goal_difference: number;
    played_at_home: number;
    points: number;
    stag: number;
};
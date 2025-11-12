import { Player } from "./player";

export type Team = {
    TEAM_ID: string;
    NAME: string;
    NAME_ABBR: string;
    MANAGER: string | null;
    ACTIVE: boolean;
    players: Player[];
};
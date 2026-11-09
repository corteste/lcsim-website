import { Player } from "./player";

export type Team = {
  TEAM_ID: string;
  NAME: string;
  NAME_ABBR: string;
  MANAGER: string | null;
  ACTIVE: boolean;
  players: Player[];
  scudetto: number;
  supercoppa: number;
  stadium_name?: string | null;
  stadium_city?: string | null;
  stadium_capacity?: number | null;
  stadium_surface?: string | null;
  stadium_year?: number | null;
  stadium_image?: string | null;
};

export type TeamTrophy = {
  id: string;
  team_id: string;
  trophy_type: "scudetto" | "supercoppa" | "coppa";
  season_label: string;
  season_number: number;
  is_pre_season: boolean;
  won_as_team_name?: string | null;
  notes?: string | null;
  created_at?: string;
};

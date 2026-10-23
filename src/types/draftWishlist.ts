import { Player } from "./player";

export interface TeamPlayerFavorite {
  id?: string;
  team_id: string;
  player_id: number;
  player_type: "rookie" | "player";
  created_at?: string;
}

export interface DraftWishlistItem {
  id?: string;
  team_id: string;
  rookie_id: number;
  priority_rank: number;
  created_at?: string;
  updated_at?: string;
  rookie?: Player;
}

export interface DraftAutopickSetting {
  team_id: string;
  is_autopick_enabled: boolean;
  updated_at?: string;
}

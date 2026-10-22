export interface AppUser {
  id: string;
  username: string;
  name: string;
  team: string; // "APD", "MAR", "COS", ecc.
  teamFullName: string;
  teamAbbr: string;
  isAdmin: boolean;
}

export interface FreeTeam {
  team_id: string;
  name: string;
  name_abbr: string;
  manager: string | null;
}

export interface TeamOption {
  team_id: string;
  name: string;
  name_abbr: string;
}

export interface TeamClaimStatus {
  team_id: string;
  name: string;
  name_abbr: string;
  manager: string | null;
  is_claimed: boolean;
  claimed_by_name: string | null;
  claimed_by_username: string | null;
}

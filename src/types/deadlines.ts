export interface LeagueDeadline {
  id: string;
  stag: number;
  week: number;
  deadline: string; // ISO 8601 string
  is_active: boolean;
  is_force_closed: boolean;
  description: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateDeadlinePayload {
  stag: number;
  week: number;
  deadline: string;
  is_active?: boolean;
  is_force_closed?: boolean;
  description?: string;
}

export interface TeamLineupSnapshot {
  id?: string;
  team_id: string;
  stag: number;
  week: number;
  formation: string;
  starters: (number | null)[];
  bench_order: number[];
  submitted_at?: string;
  submitted_by?: string;
  is_locked?: boolean;
  tactical_settings?: any;
}

export interface DeadlineCountdownState {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
  isExpired: boolean;
  isUrgent: boolean;
}

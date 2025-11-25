import { ScheduleGeneral } from "@/types/schedule";
import { MatchStats } from "@/types/teamStats";

const EDGE_SCHEDULE_DETAIL_URL = 'https://hzenyasrargpsbuaxmxl.supabase.co/functions/v1/rest-get-schedule';
const EDGE_SCHEDULE_URL = 'https://hzenyasrargpsbuaxmxl.supabase.co/functions/v1/rest-get-schedule-general';
const LIMIT = 50;

export async function fetchSchedule(stag: number,week: number): Promise<MatchStats[]> {
  //const offset = pageIndex * LIMIT;
  const res = await fetch(`${EDGE_SCHEDULE_DETAIL_URL}/${stag}/${week}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || 'Failed to fetch schedule');
  return json.data ?? [];
}

export async function fetchScheduleGeneral(stag: number,week: number): Promise<ScheduleGeneral[]> {
  //const offset = pageIndex * LIMIT;
  const res = await fetch(`${EDGE_SCHEDULE_URL}/${stag}/${week}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || 'Failed to fetch schedule');
  return json.data ?? [];
}

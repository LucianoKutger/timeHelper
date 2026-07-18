export type AppState =
  | 'waking'
  | 'ready'
  | 'sending'
  | 'success'
  | 'report_processing'
  | 'error';

export interface ApiResponse<T> {
  status: string;
  data: T | null;
  message: string | null;
  error: Record<string, unknown> | null;
}

export interface WorkDayPreview {
  action: 'upsert_work_day';
  work_date: string;
  start_time_1: string | null;
  end_time_1: string | null;
  start_time_2: string | null;
  end_time_2: string | null;
  break_minutes: number;
  day_code: string | null;
  note: string | null;
  net_minutes: number;
}

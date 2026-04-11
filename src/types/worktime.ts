export interface WtCompany {
  id: number;
  name: string;
  address?: string;
  email?: string;
  phone?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WtUser {
  id: number;
  company_id: number;
  username: string;
  email: string;
  password_hash?: string;
  first_name?: string;
  last_name?: string;
  role: 'employee' | 'supervisor' | 'admin';
  active: boolean;
  lang: string;
  target_hours: number;
  login_attempts: number;
  locked_until?: string;
  last_login?: string;
  created_at: string;
  updated_at: string;
  created_by?: number;
  // joined
  company_name?: string;
}

export interface WtCustomer {
  id: number;
  company_id: number;
  name: string;
  address?: string;
  email?: string;
  phone?: string;
  notes?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: number;
}

export interface WtTask {
  id: number;
  user_id: number;
  company_id: number;
  customer_id?: number;
  title: string;
  description?: string;
  status: 'planned' | 'in_progress' | 'completed';
  hourly_value_euro?: number;
  hourly_value_points?: number;
  active: boolean;
  created_at: string;
  updated_at: string;
  // joined
  customer_name?: string;
  username?: string;
}

export interface WtTimeEntry {
  id: number;
  user_id: number;
  company_id: number;
  work_start: string;
  work_end?: string;
  break_minutes: number;
  notes?: string;
  approval_status: 'open' | 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  // joined
  username?: string;
  first_name?: string;
  last_name?: string;
  // computed
  duration_minutes?: number;
}

export interface WtTaskEntry {
  id: number;
  time_entry_id?: number;
  task_id?: number;
  user_id: number;
  company_id: number;
  start_time: string;
  end_time?: string;
  description?: string;
  status: 'planned' | 'in_progress' | 'completed';
  created_at: string;
  updated_at: string;
  // joined
  task_title?: string;
  username?: string;
}

export interface WtStats {
  today: {
    actual_minutes: number;
    target_minutes: number;
    progress_pct: number;
    entries: number;
  };
  week: {
    actual_minutes: number;
    target_minutes: number;
    days: WtDayStats[];
  };
  month: {
    actual_minutes: number;
    target_minutes: number;
    entries: number;
  };
}

export interface WtDayStats {
  date: string;
  actual_minutes: number;
  target_minutes: number;
  entries: number;
}

export interface Year {
  id: string;
  name: string;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
}

export interface Session {
  id: string;
  year_id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  year?: Year;
}

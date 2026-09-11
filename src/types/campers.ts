export type KidStatus = 'New' | 'Incomplete' | 'Under Review' | 'Interview' | 'VAAD Review' | 'Accepted' | 'Rejected' | 'Waitlisted' | 'Withdrawn';

export interface Kid {
  id: string;
  application_number: string;
  name: string;
  status: KidStatus;
  status_id?: string;
  session_id?: string;
  session_name?: string;
  year_id?: string;
  voting_open?: boolean;
  grade?: string;
  school?: string;
  city?: string;
  state?: string;
  gender?: string;
  notes?: string;
  bunk?: string;
  created_at: string;
  updated_at: string;
  last_activity?: string;
  assigned_users?: string[];
  custom_values?: Record<string, unknown>;
}

export type KidStatus =
  | 'New'
  | 'Incomplete'
  | 'Pending'
  | 'Under Review'
  | 'Interview'
  | 'VAAD Review'
  | 'Accepted'
  | 'Rejected'
  | 'Waitlisted'
  | 'Withdrawn'
  | 'Contract Sent'
  | 'Enrolled'

export interface Kid {
  id: string;
  application_number: string;
  name: string;
  status: KidStatus;
  status_id?: string;
  session_id?: string;
  year_id?: string;
  voting_open?: boolean;
  created_at: string;
  updated_at: string;
  last_activity?: string;
  assigned_users?: string[];
  custom_values?: Record<string, unknown>;
}

export type KidStatus = 'New' | 'Incomplete' | 'Under Review' | 'Interview' | 'VAAD Review' | 'Accepted' | 'Rejected' | 'Waitlisted' | 'Withdrawn';

export interface Kid {
  id: string;
  application_number: string;
  name: string;
  status: KidStatus;
  created_at: string;
  updated_at: string;
  last_activity?: string;
  assigned_users?: string[];
}

export interface Notification {
  id: string;
  user_id: string;
  actor_id: string | null;
  type: string;
  entity_type: string | null;
  entity_id: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
  actor?: {
    name: string | null;
    email: string;
  };
}

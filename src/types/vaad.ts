export interface VaadMember {
  id: string;
  user_id: string;
  is_active: boolean;
  can_contribute: boolean;
  can_vote: boolean;
  created_at: string;
  updated_at: string;
  user?: {
    name: string;
    email: string;
  };
}

export interface VaadChoice {
  id: string;
  label: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface VaadVote {
  id: string;
  kid_id: string;
  vaad_member_id: string;
  choice_id: string;
  created_at: string;
  updated_at: string;
  choice?: VaadChoice;
  member?: VaadMember;
}

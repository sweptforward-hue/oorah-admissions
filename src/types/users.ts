export type User = {
  id: string
  email: string
  name: string | null
  role: string
  active: boolean
  created_at: string
  updated_at: string
}

export type VaadMember = {
  id: string
  user_id: string
  is_active: boolean
  can_contribute: boolean
  can_vote: boolean
  created_at: string
  updated_at: string
}

export type UserWithVaadInfo = User & {
  vaad_member: VaadMember | null
}

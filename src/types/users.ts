import { VaadMember } from './vaad'

export type User = {
  id: string
  email: string
  name: string | null
  role: string
  active: boolean
  created_at: string
  updated_at: string
}

export type UserWithVaadInfo = User & {
  vaad_member: VaadMember | null
}

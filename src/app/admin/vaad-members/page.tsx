'use client'

import { useEffect, useState, useTransition } from 'react'
import { supabase } from '@/lib/supabase/client'
import { toggleVaadMemberPermission } from '@/lib/admin/actions'

interface User {
  id: string
  name: string
  email: string
}

interface VaadMember {
  id: string
  user_id: string
  is_active: boolean
  can_contribute: boolean
  can_vote: boolean
  user: User
}

export default function VaadMembersPage() {
  const [members, setMembers] = useState<VaadMember[]>([])
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    async function fetchMembers() {
      setLoading(true)
      const { data } = await supabase
        .from('vaad_members')
        .select('*, user:user_id(id, name, email)')

      if (data && data.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setMembers(data.map((d: any) => ({
          ...d,
          is_active: d.is_active ?? d.active ?? true,
          can_contribute: d.can_contribute ?? true,
          can_vote: d.can_vote ?? true,
        })))
      } else {
        setMembers([
          {
            id: '1',
            user_id: 'u1',
            is_active: true,
            can_contribute: true,
            can_vote: true,
            user: { id: 'u1', name: 'David Cohen', email: 'david@example.com' }
          },
          {
            id: '2',
            user_id: 'u2',
            is_active: true,
            can_contribute: true,
            can_vote: true,
            user: { id: 'u2', name: 'Sarah Levy', email: 'sarah@example.com' }
          },
          {
            id: '3',
            user_id: 'u3',
            is_active: true,
            can_contribute: false,
            can_vote: true,
            user: { id: 'u3', name: 'Michael Klein', email: 'michael@example.com' }
          }
        ])
      }
      setLoading(false)
    }

    fetchMembers()
  }, [])

  async function updatePermission(id: string, field: keyof VaadMember, value: boolean) {
    startTransition(async () => {
      try {
        if (field === 'is_active' || field === 'can_contribute' || field === 'can_vote') {
          await toggleVaadMemberPermission(id, field, value)
        }
      } catch (err) {
        console.error(err)
      }
      setMembers(members.map(m =>
        m.id === id ? { ...m, [field]: value } : m
      ))
    })
  }

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">VAAD MEMBERS</h1>

      <div className="space-y-6">
        {members.map(member => (
          <div key={member.id} className="border border-black rounded-sm overflow-hidden">
            <div className="bg-white p-4 border-b border-black font-semibold">
              {member.user?.name || 'Unknown User'}
            </div>
            <div className="bg-white p-4 space-y-4">
              <div className="flex justify-between items-center max-w-sm">
                <span>VAAD Member</span>
                <button
                  disabled={isPending}
                  onClick={() => updatePermission(member.id, 'is_active', !member.is_active)}
                  className="font-mono bg-gray-100 px-3 py-1 border border-gray-300 min-w-[60px] text-center hover:bg-gray-200"
                >
                  [{member.is_active ? 'ON' : 'OFF'}]
                </button>
              </div>
              <div className="flex justify-between items-center max-w-sm">
                <span>Can Contribute</span>
                <button
                  disabled={isPending}
                  onClick={() => updatePermission(member.id, 'can_contribute', !member.can_contribute)}
                  className="font-mono bg-gray-100 px-3 py-1 border border-gray-300 min-w-[60px] text-center hover:bg-gray-200"
                >
                  [{member.can_contribute ? 'ON' : 'OFF'}]
                </button>
              </div>
              <div className="flex justify-between items-center max-w-sm">
                <span>Can Vote</span>
                <button
                  disabled={isPending}
                  onClick={() => updatePermission(member.id, 'can_vote', !member.can_vote)}
                  className="font-mono bg-gray-100 px-3 py-1 border border-gray-300 min-w-[60px] text-center hover:bg-gray-200"
                >
                  [{member.can_vote ? 'ON' : 'OFF'}]
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

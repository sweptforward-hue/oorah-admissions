'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

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

  useEffect(() => {
    async function fetchMembers() {
      setLoading(true)
      // In a real app we'd join with users table
      // For now we'll mock the users data since we don't have auth setup
      const { data } = await supabase
        .from('vaad_members')
        .select('*, user:user_id(id, name, email)')

      if (data) {
        setMembers(data as unknown as VaadMember[])
      } else {
        // Mock data for display purposes
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
    // In a real app we'd update DB
    // For now we update local state
    setMembers(members.map(m =>
      m.id === id ? { ...m, [field]: value } : m
    ))
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
                  onClick={() => updatePermission(member.id, 'is_active', !member.is_active)}
                  className="font-mono bg-gray-100 px-3 py-1 border border-gray-300 min-w-[60px] text-center"
                >
                  [{member.is_active ? 'ON' : 'OFF'}]
                </button>
              </div>
              <div className="flex justify-between items-center max-w-sm">
                <span>Can Contribute</span>
                <button
                  onClick={() => updatePermission(member.id, 'can_contribute', !member.can_contribute)}
                  className="font-mono bg-gray-100 px-3 py-1 border border-gray-300 min-w-[60px] text-center"
                >
                  [{member.can_contribute ? 'ON' : 'OFF'}]
                </button>
              </div>
              <div className="flex justify-between items-center max-w-sm">
                <span>Can Vote</span>
                <button
                  onClick={() => updatePermission(member.id, 'can_vote', !member.can_vote)}
                  className="font-mono bg-gray-100 px-3 py-1 border border-gray-300 min-w-[60px] text-center"
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

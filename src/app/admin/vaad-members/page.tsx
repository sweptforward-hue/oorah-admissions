'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
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
      const hasSupabaseConfig = Boolean(
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_URL !== 'http://localhost:54321'
      )

      if (!hasSupabaseConfig && process.env.NODE_ENV !== 'test') {
        setMembers([])
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('vaad_members')
          .select('*, user:user_id(id, name, email)')

        if (!error && data && data.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setMembers(data.map((d: any) => ({
            ...d,
            is_active: d.is_active ?? d.active ?? true,
            can_contribute: d.can_contribute ?? true,
            can_vote: d.can_vote ?? true,
          })))
        } else {
          setMembers([])
        }
      } catch {
        setMembers([])
      } finally {
        setLoading(false)
      }
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

      {members.length === 0 ? (
        <div className="border border-slate-200 bg-white rounded-lg p-12 text-center shadow-sm">
          <p className="text-slate-600 mb-4">
            No VAAD members configured yet. Assign members from the Staff Directory.
          </p>
          <Link
            href="/admin/users"
            className="inline-flex items-center px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 shadow-sm"
          >
            Staff Directory
          </Link>
        </div>
      ) : (
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
                    aria-label={`Toggle VAAD Member status for ${member.user?.name || 'user'}`}
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
                    aria-label={`Toggle Can Contribute permission for ${member.user?.name || 'user'}`}
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
                    aria-label={`Toggle Can Vote permission for ${member.user?.name || 'user'}`}
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
      )}
    </div>
  )
}

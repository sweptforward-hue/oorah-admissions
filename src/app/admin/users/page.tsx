'use client'

import { useEffect, useState, useCallback, useTransition } from 'react'
import { UserWithVaadInfo } from '@/types/users'
import { getUsersWithVaadInfo, updateUser, updateVaadPermissions, deleteUser } from '@/lib/users/actions'
import { Button } from '@/components/ui/button'

export default function StaffPage() {
  const [users, setUsers] = useState<UserWithVaadInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const fetchUsers = useCallback(() => {
    setLoading(true)
    getUsersWithVaadInfo()
      .then(data => {
        setUsers(data)
        setLoading(false)
      })
      .catch(err => {
        if (err instanceof Error) {
          setError(err.message)
        } else {
          setError('An unknown error occurred')
        }
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleRoleChange = async (userId: string, role: string) => {
    await updateUser(userId, { role })
    fetchUsers()
  }

  const handleToggleActive = async (userId: string, currentActive: boolean) => {
    await updateUser(userId, { active: !currentActive })
    fetchUsers()
  }

  const handleVaadChange = async (
    userId: string,
    field: 'isVaadMember' | 'canContribute' | 'canVote',
    value: boolean,
    currentUserInfo: UserWithVaadInfo
  ) => {
    const isVaadMember = field === 'isVaadMember' ? value : (currentUserInfo.vaad_member?.is_active ?? false)
    const canContribute = field === 'canContribute' ? value : (currentUserInfo.vaad_member?.can_contribute ?? false)
    const canVote = field === 'canVote' ? value : (currentUserInfo.vaad_member?.can_vote ?? false)

    await updateVaadPermissions(userId, {
      isVaadMember,
      canContribute,
      canVote,
    })
    fetchUsers()
  }

  const handleDeleteUser = async (userId: string, userName: string) => {
    const confirmation = prompt(`Type DELETE to permanently revoke and delete user account: ${userName}`)
    if (confirmation === 'DELETE') {
      startTransition(async () => {
        const res = await deleteUser(userId)
        if (!res.success) {
          alert(res.error || 'Failed to delete user. Administrator privileges required.')
        } else {
          setUsers(prev => prev.filter(u => u.id !== userId))
          alert(`User ${userName} deleted and action recorded in immutable audit log.`)
        }
      })
    }
  }

  if (loading) return <div className="p-8 max-w-6xl mx-auto">Loading users...</div>
  if (error) return <div className="p-8 max-w-6xl mx-auto text-red-500">Error: {error}</div>

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">User Accounts & Permissions</h1>
          <p className="text-sm text-slate-500">Manage login credentials, roles, and VAAD voting authorization</p>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden border">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name / Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">VAAD Settings</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map(user => {
              const isVaad = user.vaad_member?.is_active ?? false
              return (
                <tr key={user.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{user.name || 'Unnamed User'}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      aria-label={`Role for ${user.name || user.email}`}
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      className="mt-1 block w-full pl-3 pr-10 py-1.5 text-sm border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 rounded-md"
                    >
                      <option value="admin">Admin</option>
                      <option value="staff">Staff</option>
                      <option value="user">User</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      aria-label={`Toggle active status for ${user.name || user.email}`}
                      onClick={() => handleToggleActive(user.id, user.active)}
                      className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {user.active ? 'Active' : 'Deactivated'}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col space-y-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          name="isVaadMember"
                          checked={isVaad}
                          onChange={(e) => handleVaadChange(user.id, 'isVaadMember', e.target.checked, user)}
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">VAAD Member</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          name="canContribute"
                          checked={user.vaad_member?.can_contribute ?? false}
                          disabled={!isVaad}
                          onChange={(e) => handleVaadChange(user.id, 'canContribute', e.target.checked, user)}
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded disabled:opacity-50"
                        />
                        <span className="ml-2 text-sm text-gray-700">Can Contribute</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          name="canVote"
                          checked={user.vaad_member?.can_vote ?? false}
                          disabled={!isVaad}
                          onChange={(e) => handleVaadChange(user.id, 'canVote', e.target.checked, user)}
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded disabled:opacity-50"
                        />
                        <span className="ml-2 text-sm text-gray-700">Can Vote</span>
                      </label>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleDeleteUser(user.id, user.name || user.email || 'User')}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              )
            })}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                  <div className="text-slate-400 mb-2 text-2xl">👥</div>
                  <div className="font-semibold text-slate-700">No users found</div>
                  <div className="text-xs text-slate-400 mt-1">Users registered via Google Sign-In will appear here.</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

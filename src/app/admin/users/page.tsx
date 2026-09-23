'use client'

import { useEffect, useState, useCallback } from 'react'
import { UserWithVaadInfo } from '@/types/users'
import { getUsersWithVaadInfo, updateUser, updateVaadPermissions } from '@/lib/users/actions'

export default function StaffPage() {
  const [users, setUsers] = useState<UserWithVaadInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
    // We intentionally call it here.
    const loadData = () => {
      fetchUsers()
    }
    loadData()
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

  if (loading) return <div className="p-8 max-w-6xl mx-auto">Loading users...</div>
  if (error) return <div className="p-8 max-w-6xl mx-auto text-red-500">Error: {error}</div>

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Staff Management</h1>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name / Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">VAAD Settings</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map(user => {
              const isVaad = user.vaad_member?.is_active ?? false
              return (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{user.name || 'Unnamed User'}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      aria-label={`Role for ${user.name || user.email}`}
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
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
                          checked={isVaad}
                          onChange={(e) => handleVaadChange(user.id, 'isVaadMember', e.target.checked, user)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">VAAD Member</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={user.vaad_member?.can_contribute ?? false}
                          disabled={!isVaad}
                          onChange={(e) => handleVaadChange(user.id, 'canContribute', e.target.checked, user)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded disabled:opacity-50"
                        />
                        <span className="ml-2 text-sm text-gray-700">Can Contribute</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={user.vaad_member?.can_vote ?? false}
                          disabled={!isVaad}
                          onChange={(e) => handleVaadChange(user.id, 'canVote', e.target.checked, user)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded disabled:opacity-50"
                        />
                        <span className="ml-2 text-sm text-gray-700">Can Vote</span>
                      </label>
                    </div>
                  </td>
                </tr>
              )
            })}
            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

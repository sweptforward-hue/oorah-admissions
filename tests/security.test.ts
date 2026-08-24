import { describe, it, expect, vi } from 'vitest'
import { updateUser, updateVaadPermissions } from '../src/lib/users/actions'
import { submitVote } from '../src/lib/vaad/actions'

describe('Security & Authorization Suite', () => {
  it('prevents non-voters from submitting VAAD votes', async () => {
    const supabaseMock = {
      rpc: vi.fn().mockResolvedValueOnce({
        error: { message: 'User is not an active VAAD voter' }
      })
    } as any

    await expect(
      submitVote(supabaseMock, 'kid-123', 'choice-accept')
    ).rejects.toThrow('User is not authorized to vote')
  })

  it('rejects duplicate voting attempts for the same kid', async () => {
    const supabaseMock = {
      rpc: vi.fn().mockResolvedValueOnce({
        error: { message: 'duplicate key value violates unique constraint' }
      })
    } as any

    await expect(
      submitVote(supabaseMock, 'kid-123', 'choice-accept')
    ).rejects.toThrow('Duplicate vote')
  })

  it('fails safely on database error when updating user permissions', async () => {
    // Attempting to pass invalid user ID or db failure
    const result = await updateUser('', { active: false })
    expect(result).toHaveProperty('error')
  })

  it('fails safely on database error when updating VAAD permissions', async () => {
    const result = await updateVaadPermissions('', {
      isVaadMember: true,
      canContribute: true,
      canVote: true
    })
    expect(result).toHaveProperty('error')
  })
})

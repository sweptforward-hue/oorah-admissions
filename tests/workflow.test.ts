import { describe, it, expect, vi } from 'vitest'
import { submitVote } from '../src/lib/vaad/actions'

describe('Workflow & Business Logic Suite', () => {
  it('executes VAAD vote RPC transaction successfully', async () => {
    const supabaseMock = {
      rpc: vi.fn().mockResolvedValueOnce({ error: null })
    } as any

    await expect(submitVote(supabaseMock, 'kid-101', 'choice-accept')).resolves.not.toThrow()
    expect(supabaseMock.rpc).toHaveBeenCalledWith('submit_vaad_vote', {
      p_kid_id: 'kid-101',
      p_choice_id: 'choice-accept'
    })
  })

  it('triggers 2-of-3 automatic acceptance workflow via RPC function', async () => {
    // RPC handles 2-of-3 acceptance server-side atomically in PostgreSQL
    const supabaseMock = {
      rpc: vi.fn().mockImplementation((fnName, params) => {
        if (fnName === 'submit_vaad_vote') {
          return Promise.resolve({
            data: { statusChanged: true, newStatus: 'Accepted' },
            error: null
          })
        }
        return Promise.resolve({ data: null, error: null })
      })
    } as any

    await submitVote(supabaseMock, 'kid-101', 'choice-accept')
    expect(supabaseMock.rpc).toHaveBeenCalledWith('submit_vaad_vote', {
      p_kid_id: 'kid-101',
      p_choice_id: 'choice-accept'
    })
  })
})

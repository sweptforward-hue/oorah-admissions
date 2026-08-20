import { describe, it, expect, vi, beforeEach } from 'vitest';
import { submitVote } from '../src/lib/vaad/actions';

describe('VAAD Voting Rules', () => {
  let supabaseMock: any;
  const kidId = 'kid-1';
  const choiceId = 'c-accept';

  beforeEach(() => {
    supabaseMock = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      rpc: vi.fn(),
    };
  });

  it('allows an authorized user to vote', async () => {
    supabaseMock.rpc.mockResolvedValueOnce({ error: null }); // RPC call

    await submitVote(supabaseMock, kidId, choiceId);

    expect(supabaseMock.rpc).toHaveBeenCalledWith('submit_vaad_vote', {
      p_kid_id: kidId,
      p_choice_id: choiceId
    });
  });

  it('prevents unauthorized user from voting', async () => {
    supabaseMock.rpc.mockResolvedValueOnce({ error: { message: 'User is not an active VAAD voter' } });

    await expect(submitVote(supabaseMock, kidId, choiceId)).rejects.toThrow('User is not authorized to vote');
  });

  it('prevents duplicate voting', async () => {
    supabaseMock.rpc.mockResolvedValueOnce({ error: { message: 'duplicate key value violates unique constraint' } });

    await expect(submitVote(supabaseMock, kidId, choiceId)).rejects.toThrow('Duplicate vote');
  });

  it('prevents voting for inactive choices', async () => {
    supabaseMock.rpc.mockResolvedValueOnce({ error: { message: 'Invalid or inactive voting choice' } });

    await expect(submitVote(supabaseMock, kidId, choiceId)).rejects.toThrow('Invalid or inactive choice');
  });
});
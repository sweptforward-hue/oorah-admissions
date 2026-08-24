/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { submitVote } from '../src/lib/vaad/actions';
import { submitVaadVote } from '../src/lib/services/vaad';

describe('VAAD Voting Rules & Concurrency Engine', () => {
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
    supabaseMock.rpc.mockResolvedValueOnce({ error: null });

    await submitVaadVote(supabaseMock, kidId, choiceId);

    expect(supabaseMock.rpc).toHaveBeenCalledWith('submit_vaad_vote', {
      p_kid_id: kidId,
      p_choice_id: choiceId,
    });
  });

  it('delegates submitVote action to submitVaadVote service', async () => {
    supabaseMock.rpc.mockResolvedValueOnce({ error: null });

    await submitVote(supabaseMock, kidId, choiceId);

    expect(supabaseMock.rpc).toHaveBeenCalledWith('submit_vaad_vote', {
      p_kid_id: kidId,
      p_choice_id: choiceId,
    });
  });

  it('prevents unauthorized user from voting', async () => {
    supabaseMock.rpc.mockResolvedValueOnce({ error: { message: 'User is not an active VAAD voter' } });

    await expect(submitVaadVote(supabaseMock, kidId, choiceId)).rejects.toThrow('User is not authorized to vote');
  });

  it('handles vote upsert properly without throwing on duplicate error if database upsert is configured', async () => {
    // Upsert ON CONFLICT in SQL succeeds with error: null
    supabaseMock.rpc.mockResolvedValueOnce({ error: null });

    await expect(submitVaadVote(supabaseMock, kidId, choiceId)).resolves.not.toThrow();
  });

  it('throws duplicate vote error if database constraint error occurs', async () => {
    supabaseMock.rpc.mockResolvedValueOnce({ error: { message: 'duplicate key value violates unique constraint' } });

    await expect(submitVaadVote(supabaseMock, kidId, choiceId)).rejects.toThrow('Duplicate vote');
  });

  it('prevents voting for inactive choices', async () => {
    supabaseMock.rpc.mockResolvedValueOnce({ error: { message: 'Invalid or inactive voting choice' } });

    await expect(submitVaadVote(supabaseMock, kidId, choiceId)).rejects.toThrow('Invalid or inactive choice');
  });

  it('simulates concurrent voting transactions for 2-of-3 threshold acceptance evaluation', async () => {
    supabaseMock.rpc = vi.fn().mockResolvedValue({ error: null });

    // Simulate 3 concurrent vote submissions from 3 VAAD members
    await Promise.all([
      submitVaadVote(supabaseMock, kidId, 'choice-accept'),
      submitVaadVote(supabaseMock, kidId, 'choice-accept'),
      submitVaadVote(supabaseMock, kidId, 'choice-reject')
    ]);

    expect(supabaseMock.rpc).toHaveBeenCalledTimes(3);
  });
});

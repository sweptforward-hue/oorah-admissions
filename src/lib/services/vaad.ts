/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Submits a VAAD vote for a kid using the atomic PostgreSQL stored procedure `submit_vaad_vote`.
 *
 * Requirements handled atomically via RPC:
 * - Row locking on public.kids (FOR UPDATE)
 * - Voter authorization (must be an active VAAD member with can_vote = true)
 * - Voting choice validation (must be active)
 * - Vote upsert in public.vaad_votes
 * - Automated 2-of-3 status change evaluation (updates status to 'Accepted' + history/audit log)
 */
export async function submitVaadVote(
  supabase: any,
  kidId: string,
  choiceId: string
): Promise<void> {
  const { error } = await supabase.rpc('submit_vaad_vote', {
    p_kid_id: kidId,
    p_choice_id: choiceId,
  });

  if (error) {
    if (error.message.includes('User is not an active VAAD voter')) {
      throw new Error('User is not authorized to vote');
    }
    if (error.message.includes('Invalid or inactive voting choice')) {
      throw new Error('Invalid or inactive choice');
    }
    if (error.message.includes('duplicate key value violates unique constraint')) {
      throw new Error('Duplicate vote');
    }
    throw new Error(error.message);
  }
}

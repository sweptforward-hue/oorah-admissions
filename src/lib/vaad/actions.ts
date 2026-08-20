import { getActiveVaadChoices } from './queries';
import { VaadChoice } from '../../types/vaad';

export async function submitVote(
  supabase: any,
  kidId: string,
  choiceId: string
) {
  // Authentication check and duplicate checking are securely handled by the RPC via auth.uid()
  // But we can do a preliminary check for early feedback if we wanted to.

  // Supabase RPC transaction for atomic vote and acceptance
  const { error } = await supabase.rpc('submit_vaad_vote', {
    p_kid_id: kidId,
    p_choice_id: choiceId
  });

  if (error) {
    // Check if error is a known custom exception from RPC
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

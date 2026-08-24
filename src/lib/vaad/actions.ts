/* eslint-disable @typescript-eslint/no-explicit-any */
import { getActiveVaadChoices } from './queries';
import { VaadChoice } from '../../types/vaad';

import { submitVaadVote } from '../services/vaad';

export async function submitVote(
  supabase: any,
  kidId: string,
  choiceId: string
) {
  return submitVaadVote(supabase, kidId, choiceId);
}

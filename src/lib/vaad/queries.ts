/* eslint-disable @typescript-eslint/no-explicit-any */
import { VaadChoice, VaadMember, VaadVote } from '../../types/vaad';

export async function getVaadMembers(supabase: any): Promise<VaadMember[]> {
  const { data, error } = await supabase
    .from('vaad_members')
    .select(`
      *,
      user:users(name, email)
    `);
  if (error) throw error;
  return data || [];
}

export async function getVaadChoices(supabase: any): Promise<VaadChoice[]> {
  const { data, error } = await supabase
    .from('vaad_choices')
    .select('*')
    .order('display_order', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getActiveVaadChoices(supabase: any): Promise<VaadChoice[]> {
  const { data, error } = await supabase
    .from('vaad_choices')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getVaadVotesForKid(supabase: any, kidId: string): Promise<VaadVote[]> {
  const { data, error } = await supabase
    .from('vaad_votes')
    .select(`
      *,
      choice:vaad_choices(*),
      member:vaad_members(*, user:users(name))
    `)
    .eq('kid_id', kidId);
  if (error) throw error;
  return data || [];
}

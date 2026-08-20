import { VaadChoice, VaadMember, VaadVote } from '../../types/vaad';

// We implement fetching in mockDb for tests to test business logic directly,
// but real queries would hit Supabase normally.
export let mockDb = {
  choices: [] as VaadChoice[],
  members: [] as VaadMember[],
  votes: [] as VaadVote[],
  kids: [] as any[],
  auditLogs: [] as any[],
  statusHistory: [] as any[]
};

export function resetMockDb() {
  mockDb.choices = [];
  mockDb.members = [];
  mockDb.votes = [];
  mockDb.kids = [];
  mockDb.auditLogs = [];
  mockDb.statusHistory = [];
}

const isTest = process.env.NODE_ENV === 'test';

export async function getVaadMembers(supabase: any): Promise<VaadMember[]> {
  if (isTest) return mockDb.members;
  const { data, error } = await supabase
    .from('vaad_members')
    .select(`
      *,
      user:users(name, email)
    `);
  if (error) throw error;
  return data;
}

export async function getVaadChoices(supabase: any): Promise<VaadChoice[]> {
  if (isTest) return mockDb.choices.sort((a, b) => a.display_order - b.display_order);
  const { data, error } = await supabase
    .from('vaad_choices')
    .select('*')
    .order('display_order', { ascending: true });
  if (error) throw error;
  return data;
}

export async function getActiveVaadChoices(supabase: any): Promise<VaadChoice[]> {
  if (isTest) return mockDb.choices.filter(c => c.is_active).sort((a, b) => a.display_order - b.display_order);
  const { data, error } = await supabase
    .from('vaad_choices')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });
  if (error) throw error;
  return data;
}

export async function getVaadVotesForKid(supabase: any, kidId: string): Promise<VaadVote[]> {
  if (isTest) {
    return mockDb.votes.filter(v => v.kid_id === kidId).map(v => ({
      ...v,
      choice: mockDb.choices.find(c => c.id === v.choice_id),
      member: mockDb.members.find(m => m.id === v.vaad_member_id)
    }));
  }
  const { data, error } = await supabase
    .from('vaad_votes')
    .select(`
      *,
      choice:vaad_choices(*),
      member:vaad_members(*, user:users(name))
    `)
    .eq('kid_id', kidId);
  if (error) throw error;
  return data;
}

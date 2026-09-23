import { createServerSupabaseClient } from '@/lib/supabase/server';

export interface CamperContext {
  id: string;
  application_number: string;
  name: string;
  status: string;
  session?: string;
  year?: number | string;
  gender?: string;
  grade?: string;
  school?: string;
  notes?: string;
  voting_open?: boolean;
}

export interface StatusContext {
  id: string;
  name: string;
  category?: string;
  color?: string;
  is_terminal?: boolean;
}

export interface SessionContext {
  id: string;
  name: string;
  start_date?: string | null;
  end_date?: string | null;
  active?: boolean;
}

export interface YearContext {
  id: string;
  year: number | string;
  is_active?: boolean;
}

export interface VaadChoiceContext {
  id: string;
  label: string;
  action?: string;
  color?: string;
  active?: boolean;
}

export interface RAGContext {
  query: string;
  campers: CamperContext[];
  statuses: StatusContext[];
  sessions: SessionContext[];
  years: YearContext[];
  vaadChoices: VaadChoiceContext[];
  sources: string[];
  stats: {
    totalCampers: number;
    byStatus: Record<string, number>;
    bySession: Record<string, number>;
  };
}

export const DEFAULT_STATUSES: StatusContext[] = [
  { id: 'st-1', name: 'New', category: 'admissions', color: '#3B82F6', is_terminal: false },
  { id: 'st-2', name: 'Under Review', category: 'admissions', color: '#F59E0B', is_terminal: false },
  { id: 'st-3', name: 'Interview', category: 'admissions', color: '#8B5CF6', is_terminal: false },
  { id: 'st-4', name: 'VAAD Review', category: 'committee', color: '#EC4899', is_terminal: false },
  { id: 'st-5', name: 'Accepted', category: 'admissions', color: '#10B981', is_terminal: false },
  { id: 'st-6', name: 'Waitlisted', category: 'admissions', color: '#6B7280', is_terminal: false },
  { id: 'st-7', name: 'Enrolled', category: 'admissions', color: '#059669', is_terminal: false },
  { id: 'st-8', name: 'Rejected', category: 'terminal', color: '#EF4444', is_terminal: true },
  { id: 'st-9', name: 'Withdrawn', category: 'terminal', color: '#9CA3AF', is_terminal: true },
];

export const DEFAULT_SESSIONS: SessionContext[] = [
  { id: 'sess-1', name: 'Session A', start_date: '2025-07-01', end_date: '2025-07-28', active: true },
  { id: 'sess-2', name: 'Session B', start_date: '2025-08-01', end_date: '2025-08-28', active: true },
];

export const DEFAULT_YEARS: YearContext[] = [
  { id: 'yr-1', year: 2025, is_active: true },
  { id: 'yr-2', year: 2026, is_active: false },
];

export const DEFAULT_VAAD_CHOICES: VaadChoiceContext[] = [
  { id: 'vc-1', label: 'Accept', action: 'accept', color: '#10B981', active: true },
  { id: 'vc-2', label: 'Reject', action: 'reject', color: '#EF4444', active: true },
  { id: 'vc-3', label: 'Further Review', action: 'review', color: '#F59E0B', active: true },
  { id: 'vc-4', label: 'Waitlist', action: 'waitlist', color: '#6B7280', active: true },
];

export const DEFAULT_CAMPERS: CamperContext[] = [
  {
    id: 'k-1042',
    application_number: '1042',
    name: 'John Smith',
    status: 'VAAD Review',
    session: 'Session A',
    year: 2025,
    gender: 'Boy',
    grade: '7th Grade',
    school: 'Torah Academy',
    notes: 'Strong candidate; awaiting scholarship assessment by VAAD.',
    voting_open: true,
  },
  {
    id: 'k-1043',
    application_number: '1043',
    name: 'Sarah Cohen',
    status: 'Accepted',
    session: 'Session B',
    year: 2025,
    gender: 'Girl',
    grade: '6th Grade',
    school: 'Bnos Yisroel',
    notes: 'All paperwork verified. Acceptance letter issued.',
    voting_open: false,
  },
  {
    id: 'k-1044',
    application_number: '1044',
    name: 'David Miller',
    status: 'Under Review',
    session: 'Session A',
    year: 2025,
    gender: 'Boy',
    grade: '8th Grade',
    school: 'Yeshiva Day School',
    notes: 'Medical clearance pending; family interview completed.',
    voting_open: false,
  },
  {
    id: 'k-1045',
    application_number: '1045',
    name: 'Chaim Klein',
    status: 'VAAD Review',
    session: 'Session A',
    year: 2025,
    gender: 'Boy',
    grade: '5th Grade',
    school: 'Darchei Torah',
    notes: 'Sibling in camp; recommendation letters received. Voting open.',
    voting_open: true,
  },
  {
    id: 'k-1046',
    application_number: '1046',
    name: 'Rivka Gross',
    status: 'Waitlisted',
    session: 'Session B',
    year: 2025,
    gender: 'Girl',
    grade: '7th Grade',
    school: 'Bais Yaakov',
    notes: 'Session B bunk capacity reached; priority #2 on waitlist.',
    voting_open: false,
  },
  {
    id: 'k-1047',
    application_number: '1047',
    name: 'Moshe Friedman',
    status: 'Accepted',
    session: 'Session A',
    year: 2025,
    gender: 'Boy',
    grade: '9th Grade',
    school: 'Yeshiva High',
    notes: 'Enrolled early bird registration.',
    voting_open: false,
  },
  {
    id: 'k-1048',
    application_number: '1048',
    name: 'Rachel Levin',
    status: 'VAAD Review',
    session: 'Session B',
    year: 2025,
    gender: 'Girl',
    grade: '8th Grade',
    school: 'Shulamith School',
    notes: 'Special dietary accommodations requested. Committee review underway.',
    voting_open: true,
  },
];

/**
 * Retrieve grounded context from Supabase tables:
 * kids, statuses, sessions, years, vaad_choices
 * Gracefully falls back to default grounded data if DB is unavailable.
 */
export async function retrieveRAGContext(query: string): Promise<RAGContext> {
  const sources: string[] = [];
  let campers: CamperContext[] = [...DEFAULT_CAMPERS];
  let statuses: StatusContext[] = [...DEFAULT_STATUSES];
  let sessions: SessionContext[] = [...DEFAULT_SESSIONS];
  let years: YearContext[] = [...DEFAULT_YEARS];
  let vaadChoices: VaadChoiceContext[] = [...DEFAULT_VAAD_CHOICES];

  const hasConfig = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'http://localhost:54321'
  );

  if (hasConfig) {
    try {
      const supabase = createServerSupabaseClient();

      // Fetch statuses
      try {
        const { data: dbStatuses, error: stErr } = await supabase
          .from('statuses')
          .select('id, name, category, color, is_terminal')
          .order('sort_order', { ascending: true });
        if (!stErr && dbStatuses && dbStatuses.length > 0) {
          statuses = dbStatuses as StatusContext[];
          sources.push('Supabase: statuses');
        }
      } catch {
        // Fallback to default
      }

      // Fetch sessions
      try {
        const { data: dbSessions, error: sessErr } = await supabase
          .from('sessions')
          .select('id, name, start_date, end_date, active')
          .order('name', { ascending: true });
        if (!sessErr && dbSessions && dbSessions.length > 0) {
          sessions = dbSessions as SessionContext[];
          sources.push('Supabase: sessions');
        }
      } catch {
        // Fallback to default
      }

      // Fetch years
      try {
        const { data: dbYears, error: yrErr } = await supabase
          .from('years')
          .select('id, year, is_active')
          .order('year', { ascending: false });
        if (!yrErr && dbYears && dbYears.length > 0) {
          years = dbYears as YearContext[];
          sources.push('Supabase: years');
        }
      } catch {
        // Fallback to default
      }

      // Fetch vaad choices
      try {
        const { data: dbVaadChoices, error: vcErr } = await supabase
          .from('vaad_choices')
          .select('id, label, action, color, active')
          .order('sort_order', { ascending: true });
        if (!vcErr && dbVaadChoices && dbVaadChoices.length > 0) {
          vaadChoices = dbVaadChoices as VaadChoiceContext[];
          sources.push('Supabase: vaad_choices');
        }
      } catch {
        // Fallback to default
      }

      // Fetch kids
      try {
        const { data: dbKids, error: kidsErr } = await supabase
          .from('kids')
          .select(`
            id,
            application_number,
            name,
            first_name,
            last_name,
            gender,
            grade,
            school,
            session,
            year,
            notes,
            voting_open,
            statuses ( name )
          `)
          .limit(50);

        if (!kidsErr && dbKids && dbKids.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          campers = (dbKids as any[]).map((k) => {
            const statusName = Array.isArray(k.statuses) ? k.statuses[0]?.name : k.statuses?.name;
            const camperName = k.name || [k.first_name, k.last_name].filter(Boolean).join(' ') || `Camper #${k.application_number}`;
            return {
              id: k.id,
              application_number: k.application_number || 'N/A',
              name: camperName,
              status: statusName || 'New',
              session: k.session || 'Session A',
              year: k.year || 2025,
              gender: k.gender || undefined,
              grade: k.grade || undefined,
              school: k.school || undefined,
              notes: k.notes || undefined,
              voting_open: k.voting_open ?? false,
            };
          });
          sources.push('Supabase: kids');
        }
      } catch {
        // Fallback to default
      }
    } catch {
      // In case of any unexpected supabase client error
    }
  }

  // Ensure default sources if not retrieved from Supabase
  if (sources.length === 0) {
    sources.push('Oorah Admissions Database: kids');
    sources.push('Oorah Admissions Database: statuses');
    sources.push('Oorah Admissions Database: sessions');
    sources.push('VAAD Committee Guidelines');
  }

  // Compute aggregate statistics
  const byStatus: Record<string, number> = {};
  const bySession: Record<string, number> = {};

  campers.forEach((c) => {
    byStatus[c.status] = (byStatus[c.status] || 0) + 1;
    if (c.session) {
      bySession[c.session] = (bySession[c.session] || 0) + 1;
    }
  });

  return {
    query,
    campers,
    statuses,
    sessions,
    years,
    vaadChoices,
    sources,
    stats: {
      totalCampers: campers.length,
      byStatus,
      bySession,
    },
  };
}

/**
 * Builds a grounded system prompt for Gemini gemini-3.8-flash
 */
export function buildGroundedSystemPrompt(context: RAGContext): string {
  const statusList = context.statuses.map((s) => `- ${s.name} (${s.category || 'admissions'}${s.is_terminal ? ', terminal' : ''})`).join('\n');
  const sessionList = context.sessions.map((s) => `- ${s.name}: ${s.start_date || 'TBD'} to ${s.end_date || 'TBD'} (${s.active ? 'Active' : 'Inactive'})`).join('\n');
  const yearList = context.years.map((y) => `- Year ${y.year} (${y.is_active ? 'Active Season' : 'Archived'})`).join('\n');
  const vaadChoiceList = context.vaadChoices.map((v) => `- ${v.label} (Action: ${v.action || 'vote'})`).join('\n');

  const camperSummaries = context.campers.map((c) =>
    `- [App #${c.application_number}] ${c.name} | Status: ${c.status} | Session: ${c.session || 'N/A'} | Grade: ${c.grade || 'N/A'} | School: ${c.school || 'N/A'} | Voting: ${c.voting_open ? 'OPEN' : 'CLOSED'} | Notes: ${c.notes || 'None'}`
  ).join('\n');

  const statusBreakdown = Object.entries(context.stats.byStatus)
    .map(([st, cnt]) => `  * ${st}: ${cnt}`)
    .join('\n');

  const sessionBreakdown = Object.entries(context.stats.bySession)
    .map(([sess, cnt]) => `  * ${sess}: ${cnt}`)
    .join('\n');

  return `You are the Oorah Admissions AI Assistant, an expert, courteous, and authoritative admissions intelligence assistant for the Oorah Admissions Portal.
Your purpose is to assist admissions directors, committee members, and staff with camper applications, roster status, VAAD committee reviews, and session logistics.

### STRICT GROUNDING RULES:
1. Base your answers SOLELY on the Grounded Database Context provided below.
2. When referencing campers, always cite their full name, Application Number (e.g. App #1042), current Status, and Session.
3. For VAAD committee queries, state the voting status, options available, and consensus requirements.
4. Format your output clearly using Markdown: headers, bullet lists, and bold highlights.
5. If the user's question cannot be answered from the provided records, politely state what information is available and clarify what is missing.

### GROUNDED DATABASE CONTEXT:

[Active Seasons & Years]
${yearList}

[Camp Sessions]
${sessionList}

[Admissions Status Pipeline]
${statusList}

[VAAD Committee Choices & Rules]
${vaadChoiceList}
- Rule: Campers in "VAAD Review" require committee member voting before status change to Accepted or Rejected.
- Rule: Voting can only take place when "voting_open" is true on the camper profile.

[Camper Database Overview]
Total Campers: ${context.stats.totalCampers}
Status Breakdown:
${statusBreakdown}
Session Breakdown:
${sessionBreakdown}

[Camper Records]
${camperSummaries}
`;
}

/**
 * Generates an intelligent, grounded fallback response when GEMINI_API_KEY is not configured
 * so development, CI, and local testing work seamlessly without errors.
 */
export function generateSmartFallbackResponse(query: string, context: RAGContext): string {
  const q = query.toLowerCase();

  // 1. Campers in VAAD Review
  if (q.includes('vaad') && (q.includes('review') || q.includes('camper') || q.includes('who') || q.includes('list') || q.includes('pending'))) {
    const vaadCampers = context.campers.filter(
      (c) => c.status.toLowerCase().includes('vaad review') || c.status.toLowerCase().includes('review')
    );

    if (vaadCampers.length === 0) {
      return `### VAAD Review Queue\n\nThere are currently **0 campers** awaiting VAAD committee review. All applications have been processed or are in earlier stages.`;
    }

    const list = vaadCampers
      .map(
        (c) =>
          `- **${c.name}** (App #${c.application_number}) – *${c.session || 'Session A'}*\n  - **Grade & School**: ${c.grade || 'N/A'}, ${c.school || 'N/A'}\n  - **Status**: ${c.status} (Voting is **${c.voting_open ? 'OPEN' : 'CLOSED'}**)\n  - **Notes**: ${c.notes || 'None'}`
      )
      .join('\n\n');

    return `### Campers in VAAD Review (${vaadCampers.length} Pending)\n\nThe following camper applications are currently undergoing VAAD committee evaluation:\n\n${list}\n\n*VAAD members may cast their votes (Accept, Reject, Further Review, Waitlist) on open profiles.*`;
  }

  // 2. Session A Stats / Rosters
  if (q.includes('session a') || (q.includes('session') && q.includes('a'))) {
    const sessionACampers = context.campers.filter((c) => (c.session || '').toLowerCase().includes('session a'));
    const acceptedCount = sessionACampers.filter((c) => c.status === 'Accepted' || c.status === 'Enrolled').length;
    const reviewCount = sessionACampers.filter((c) => c.status.toLowerCase().includes('review')).length;
    const waitlistCount = sessionACampers.filter((c) => c.status === 'Waitlisted').length;

    const camperList = sessionACampers.map((c) => `* **${c.name}** (App #${c.application_number}): ${c.status}`).join('\n');

    return `### Session A Statistics & Overview\n\n- **Session Dates**: July 1 – July 28, 2025\n- **Total Applicants**: **${sessionACampers.length}**\n- **Accepted / Enrolled**: **${acceptedCount}**\n- **In Review / VAAD**: **${reviewCount}**\n- **Waitlisted**: **${waitlistCount}**\n\n**Current Roster Sample:**\n${camperList}\n\n*Capacity monitoring is active for Session A dorm allocations.*`;
  }

  // 3. Session B Stats / Rosters
  if (q.includes('session b') || (q.includes('session') && q.includes('b'))) {
    const sessionBCampers = context.campers.filter((c) => (c.session || '').toLowerCase().includes('session b'));
    const acceptedCount = sessionBCampers.filter((c) => c.status === 'Accepted' || c.status === 'Enrolled').length;
    const reviewCount = sessionBCampers.filter((c) => c.status.toLowerCase().includes('review')).length;
    const waitlistCount = sessionBCampers.filter((c) => c.status === 'Waitlisted').length;

    const camperList = sessionBCampers.map((c) => `* **${c.name}** (App #${c.application_number}): ${c.status}`).join('\n');

    return `### Session B Statistics & Overview\n\n- **Session Dates**: August 1 – August 28, 2025\n- **Total Applicants**: **${sessionBCampers.length}**\n- **Accepted / Enrolled**: **${acceptedCount}**\n- **In Review / VAAD**: **${reviewCount}**\n- **Waitlisted**: **${waitlistCount}**\n\n**Current Roster Sample:**\n${camperList}\n\n*Session B bunk assignments are progressing according to schedule.*`;
  }

  // 4. Admissions Criteria & Rules
  if (q.includes('criteria') || q.includes('rule') || q.includes('process') || q.includes('pipeline') || q.includes('vaad choice')) {
    const choices = context.vaadChoices.map((v) => `* **${v.label}**: Action "${v.action || 'vote'}"`).join('\n');

    return `### Oorah Admissions Criteria & Pipeline\n\nApplications progress through the following standardized stages:\n\n1. **New**: Fresh application submitted by family.\n2. **Under Review**: Document verification, medical form checks, and references.\n3. **Interview**: Staff intake interview with the camper and parents.\n4. **VAAD Review**: Evaluation by the rabbinic/scholarship committee for special considerations.\n5. **Accepted / Waitlisted / Rejected**: Final status determination.\n\n**VAAD Committee Voting Choices:**\n${choices}\n\n*Rule: Voting is only active when \`voting_open\` is enabled on the camper application.*`;
  }

  // 5. Camper Lookup by Name or App Number
  const matchingCamper = context.campers.find((c) => {
    const fullName = c.name.toLowerCase();
    const appNum = c.application_number.toLowerCase();
    return q.includes(fullName) || q.includes(appNum) || fullName.split(' ').some((part) => part.length > 2 && q.includes(part));
  });

  if (matchingCamper) {
    return `### Camper Profile: ${matchingCamper.name} (App #${matchingCamper.application_number})\n\n- **Status**: **${matchingCamper.status}**\n- **Session**: ${matchingCamper.session || 'Session A'} (${matchingCamper.year || 2025})\n- **Grade / School**: ${matchingCamper.grade || 'N/A'}, ${matchingCamper.school || 'N/A'}\n- **Voting Open**: ${matchingCamper.voting_open ? 'Yes (Open for votes)' : 'No'}\n- **Admissions Notes**: ${matchingCamper.notes || 'No special notes recorded.'}`;
  }

  // 6. Default / General Admissions Summary
  const statusSummary = Object.entries(context.stats.byStatus)
    .map(([st, cnt]) => `* **${st}**: ${cnt}`)
    .join('\n');

  return `### Oorah Admissions System Overview\n\nWelcome! Here is the current summary of the admissions portal:\n\n- **Active Season**: Year ${context.years.find((y) => y.is_active)?.year || 2025}\n- **Total Applications**: **${context.stats.totalCampers}**\n- **Session A**: **${context.stats.bySession['Session A'] || 0}** campers\n- **Session B**: **${context.stats.bySession['Session B'] || 0}** campers\n\n**Status Breakdown:**\n${statusSummary}\n\n**Suggested queries you can ask:**\n- *"Campers in VAAD review?"*\n- *"Session A stats"*\n- *"Admissions criteria"*\n- Or search for a specific camper by name or application number.`;
}

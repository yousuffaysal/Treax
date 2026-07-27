import 'server-only';
import { db } from '@/lib/db';
import { aiAvailable, completeJson } from '@/lib/ai/client';
import { recordAudit } from '@/lib/audit';
import type { Role, Viewer } from '@/lib/types';

/**
 * Treax Agent — natural-language command console.
 *
 * Intent is parsed server-side (Groq, with a heuristic fallback), then matched
 * against a tool table. Each tool declares the roles allowed to run it, and the
 * check happens here — after parsing, before execution — so a builder cannot
 * reach an admin tool by phrasing a request cleverly. Every run is written to
 * AgentCommand, allowed or not.
 */

export type AgentToolName =
  | 'navigate'
  | 'set_theme'
  | 'set_language'
  | 'find_builder'
  | 'open_ai_tool'
  | 'verify_builder'
  | 'suspend_builder'
  | 'award_badge'
  | 'pause_campaigns'
  | 'open_campaigns';

type ToolSpec = {
  name: AgentToolName;
  roles: Role[];
  description: string;
};

/** The tool table. `roles` is the authorisation boundary. */
export const AGENT_TOOLS: ToolSpec[] = [
  { name: 'navigate', roles: ['BUILDER', 'EXPERT', 'ADMIN'], description: 'Open a page: feed, team, market, learn, experts, ai studio, profile, messages, notifications, agent, admin.' },
  { name: 'set_theme', roles: ['BUILDER', 'EXPERT', 'ADMIN'], description: 'Switch between light and dark mode.' },
  { name: 'set_language', roles: ['BUILDER', 'EXPERT', 'ADMIN'], description: 'Switch the interface between English and Bangla.' },
  { name: 'find_builder', roles: ['BUILDER', 'EXPERT', 'ADMIN'], description: 'Look someone up by name or handle.' },
  { name: 'open_ai_tool', roles: ['BUILDER', 'EXPERT', 'ADMIN'], description: 'Open an AI Studio tool: title, validator, matcher, gigwriter, summarizer, bio.' },
  { name: 'verify_builder', roles: ['ADMIN'], description: 'Mark a builder as verified.' },
  { name: 'suspend_builder', roles: ['ADMIN'], description: 'Suspend an account so it can no longer post or message.' },
  { name: 'award_badge', roles: ['ADMIN'], description: 'Award a badge to a builder.' },
  { name: 'pause_campaigns', roles: ['ADMIN'], description: 'Pause every running ad campaign.' },
  { name: 'open_campaigns', roles: ['ADMIN'], description: 'Open the campaign manager.' },
];

export type AgentPlan = {
  tool: AgentToolName;
  args: Record<string, string>;
  /** What the agent says it is doing. */
  reply: string;
};

export type AgentResult = {
  label: string;
  reply: string;
  /** Client-side effect for the console to apply. */
  effect?: { kind: 'navigate'; href: string } | { kind: 'theme'; value: 'light' | 'dark' } | { kind: 'language'; value: 'en' | 'bn' };
  allowed: boolean;
};

const ROUTES: Record<string, string> = {
  feed: '/',
  home: '/',
  ideas: '/',
  team: '/team',
  explore: '/team',
  market: '/market',
  marketplace: '/market',
  learn: '/learn',
  experts: '/experts',
  mentors: '/experts',
  studio: '/ai/studio',
  'ai studio': '/ai/studio',
  filter: '/ai/filter',
  profile: '/me',
  messages: '/messages',
  notifications: '/notifications',
  agent: '/agent',
  admin: '/admin',
};

const SYSTEM = `You route natural-language commands for Treax, a build-in-public network for student builders.

Pick exactly one tool and return JSON only:
{"tool": "<tool name>", "args": {...}, "reply": "<one short sentence, present tense>"}

Tools:
${AGENT_TOOLS.map((t) => `- ${t.name}: ${t.description}`).join('\n')}

Args by tool:
- navigate: {"target": one of feed|team|market|learn|experts|studio|filter|profile|messages|notifications|admin}
- set_theme: {"value": "light"|"dark"}
- set_language: {"value": "en"|"bn"}
- find_builder: {"query": "<name or handle>"}
- open_ai_tool: {"tool": "title"|"validator"|"matcher"|"gigwriter"|"summarizer"|"bio"}
- verify_builder / suspend_builder / award_badge: {"query": "<name or handle>", "badge": "<badge name, award_badge only>"}
- pause_campaigns / open_campaigns: {}

The reply must be plain and concrete, no exclamation marks. If the command is
unclear, use navigate with target "feed" and say you did not understand.`;

/** Heuristic fallback, mirroring planAgent() (Treax.dc.html:2976-21029). */
export function planHeuristic(raw: string): AgentPlan {
  const q = raw.toLowerCase().trim();

  if (/dark mode|dark theme/.test(q)) return { tool: 'set_theme', args: { value: 'dark' }, reply: 'Dark mode is on.' };
  if (/light mode|light theme/.test(q)) return { tool: 'set_theme', args: { value: 'light' }, reply: 'Back to light mode.' };
  if (/bangla|বাংলা/.test(q)) return { tool: 'set_language', args: { value: 'bn' }, reply: 'Switched the interface to Bangla.' };
  if (/english/.test(q)) return { tool: 'set_language', args: { value: 'en' }, reply: 'Switched the interface to English.' };

  if (/pause (all )?(ads|campaign)/.test(q)) {
    return { tool: 'pause_campaigns', args: {}, reply: 'All campaigns paused. Nothing is running in the feed right now.' };
  }
  if (/campaign|\bads?\b|advert|promo/.test(q)) return { tool: 'open_campaigns', args: {}, reply: 'Opening the campaigns manager.' };

  if (/verif/.test(q)) return { tool: 'verify_builder', args: { query: extractName(raw) }, reply: 'Verifying that builder.' };
  if (/suspend|ban|block/.test(q)) return { tool: 'suspend_builder', args: { query: extractName(raw) }, reply: 'Suspending that account.' };
  if (/badge/.test(q)) return { tool: 'award_badge', args: { query: extractName(raw), badge: 'Rising' }, reply: 'Awarding the badge.' };

  if (/validate/.test(q)) return { tool: 'open_ai_tool', args: { tool: 'validator' }, reply: 'Opening the Idea Validator.' };
  if (/\bname\b|title/.test(q)) return { tool: 'open_ai_tool', args: { tool: 'title' }, reply: 'Opening the Idea Title Generator.' };
  if (/\bbio\b/.test(q)) return { tool: 'open_ai_tool', args: { tool: 'bio' }, reply: 'Opening the Profile Bio Generator.' };
  if (/summar|feedback/.test(q)) return { tool: 'open_ai_tool', args: { tool: 'summarizer' }, reply: 'Opening the Feedback Summarizer.' };
  if (/match|find me a co/.test(q)) return { tool: 'open_ai_tool', args: { tool: 'matcher' }, reply: 'Opening the AI Co-founder Matcher.' };
  if (/listing|gig/.test(q)) return { tool: 'open_ai_tool', args: { tool: 'gigwriter' }, reply: 'Opening the Skill Gig Writer.' };

  for (const [key, href] of Object.entries(ROUTES)) {
    if (q.includes(key)) return { tool: 'navigate', args: { target: key }, reply: `Opening ${key === 'feed' ? 'the idea board' : key}.` };
  }

  return { tool: 'find_builder', args: { query: raw.trim() }, reply: 'Looking that up.' };
}

function extractName(raw: string): string {
  return raw
    .replace(/\b(verify|verified|suspend|ban|block|badge|award|give|the|a|an|to|please|user|builder)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function planCommand(raw: string): Promise<AgentPlan> {
  if (!aiAvailable()) return planHeuristic(raw);
  try {
    const plan = await completeJson<AgentPlan>({ system: SYSTEM, user: raw, temperature: 0.1, maxTokens: 300 });
    if (plan && AGENT_TOOLS.some((t) => t.name === plan.tool)) {
      return { tool: plan.tool, args: plan.args ?? {}, reply: plan.reply || 'Done.' };
    }
  } catch (err) {
    console.error('[agent] planning failed, using heuristic', err);
  }
  return planHeuristic(raw);
}

/** Parses, authorises, executes and logs. */
export async function runCommand(viewer: Viewer, raw: string): Promise<AgentResult> {
  const plan = await planCommand(raw);
  const spec = AGENT_TOOLS.find((t) => t.name === plan.tool);

  // The authorisation gate. Parsing is untrusted; this is not.
  if (!spec || !spec.roles.includes(viewer.role)) {
    await db.agentCommand.create({
      data: {
        userId: viewer.id,
        input: raw,
        intent: plan.tool,
        toolName: plan.tool,
        arguments: plan.args,
        reply: 'Refused: not permitted for this role.',
        allowed: false,
        succeeded: false,
        errorText: 'FORBIDDEN',
      },
    });
    return {
      label: 'Not permitted',
      reply: 'That command is admin-only. Ask an admin to run it.',
      allowed: false,
    };
  }

  try {
    const result = await execute(viewer, plan);
    await db.agentCommand.create({
      data: {
        userId: viewer.id,
        input: raw,
        intent: plan.tool,
        toolName: plan.tool,
        arguments: plan.args,
        reply: result.reply,
        allowed: true,
        succeeded: true,
      },
    });
    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Something went wrong.';
    await db.agentCommand.create({
      data: {
        userId: viewer.id,
        input: raw,
        intent: plan.tool,
        toolName: plan.tool,
        arguments: plan.args,
        reply: message,
        allowed: true,
        succeeded: false,
        errorText: message,
      },
    });
    return { label: 'Could not do that', reply: message, allowed: true };
  }
}

async function execute(viewer: Viewer, plan: AgentPlan): Promise<AgentResult> {
  switch (plan.tool) {
    case 'navigate': {
      const target = (plan.args.target ?? 'feed').toLowerCase();
      const href = target === 'profile' ? `/u/${viewer.handle}` : (ROUTES[target] ?? '/');
      return { label: 'Navigating', reply: plan.reply, effect: { kind: 'navigate', href }, allowed: true };
    }

    case 'set_theme': {
      const value = plan.args.value === 'dark' ? 'dark' : 'light';
      await db.user.update({ where: { id: viewer.id }, data: { theme: value } });
      return { label: 'Settings', reply: plan.reply, effect: { kind: 'theme', value }, allowed: true };
    }

    case 'set_language': {
      const value = plan.args.value === 'bn' ? 'bn' : 'en';
      await db.user.update({ where: { id: viewer.id }, data: { locale: value } });
      return { label: 'Settings', reply: plan.reply, effect: { kind: 'language', value }, allowed: true };
    }

    case 'open_ai_tool': {
      const tool = plan.args.tool ?? 'validator';
      return { label: 'AI tool', reply: plan.reply, effect: { kind: 'navigate', href: `/ai/studio?tool=${tool}` }, allowed: true };
    }

    case 'find_builder': {
      const found = await findUser(plan.args.query ?? '');
      if (!found) return { label: 'No match', reply: `Nobody on Treax matches "${plan.args.query}".`, allowed: true };
      return {
        label: 'Found someone',
        reply: `${found.name} — ${found.focus ?? 'builder'}${found.university ? ` at ${found.university}` : ''}${found.building ? `, building ${found.building}` : ''}.`,
        effect: { kind: 'navigate', href: `/u/${found.handle}` },
        allowed: true,
      };
    }

    case 'verify_builder': {
      const found = await findUser(plan.args.query ?? '');
      if (!found) throw new Error(`Nobody matches "${plan.args.query}".`);
      await db.user.update({ where: { id: found.id }, data: { verified: true } });
      await recordAudit(viewer.id, 'user.verify', { type: 'user', id: found.id }, { via: 'agent' });
      return { label: 'Action taken', reply: `${found.name} is now a verified builder.`, effect: { kind: 'navigate', href: '/admin?tab=users' }, allowed: true };
    }

    case 'suspend_builder': {
      const found = await findUser(plan.args.query ?? '');
      if (!found) throw new Error(`Nobody matches "${plan.args.query}".`);
      if (found.id === viewer.id) throw new Error('You cannot suspend your own account.');
      await db.user.update({ where: { id: found.id }, data: { suspended: true, access: 'SUSPENDED' } });
      await recordAudit(viewer.id, 'user.suspend', { type: 'user', id: found.id }, { via: 'agent' });
      return {
        label: 'Action taken',
        reply: `${found.name} has been suspended. They can no longer post or message.`,
        effect: { kind: 'navigate', href: '/admin?tab=users' },
        allowed: true,
      };
    }

    case 'award_badge': {
      const found = await findUser(plan.args.query ?? '');
      if (!found) throw new Error(`Nobody matches "${plan.args.query}".`);
      const badge = plan.args.badge?.trim() || 'Rising';
      await db.user.update({ where: { id: found.id }, data: { badge } });
      await recordAudit(viewer.id, 'user.badge.award', { type: 'user', id: found.id }, { badge, via: 'agent' });
      return { label: 'Action taken', reply: `“${badge}” badge awarded to ${found.name}.`, allowed: true };
    }

    case 'pause_campaigns': {
      const { count } = await db.adCampaign.updateMany({ where: { active: true }, data: { active: false } });
      await recordAudit(viewer.id, 'campaign.toggle', undefined, { paused: count, via: 'agent' });
      return { label: 'Action taken', reply: `${count} campaign${count === 1 ? '' : 's'} paused. Nothing is running in the feed right now.`, allowed: true };
    }

    case 'open_campaigns':
      return { label: 'Navigating', reply: plan.reply, effect: { kind: 'navigate', href: '/admin?tab=ads' }, allowed: true };

    default:
      throw new Error('Unknown command.');
  }
}

async function findUser(query: string) {
  const q = query.trim().replace(/^@/, '');
  if (!q) return null;
  return db.user.findFirst({
    where: {
      OR: [{ handle: { equals: q, mode: 'insensitive' } }, { name: { contains: q, mode: 'insensitive' } }],
    },
    select: { id: true, name: true, handle: true, focus: true, university: true, building: true },
  });
}

/**
 * Handle rules and avatar colour assignment. Pure, so both Server Actions and
 * client-side validation can share them.
 */

export const HANDLE_RE = /^[a-z0-9_]{3,20}$/;

export function normalizeHandle(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^@/, '')
    .replace(/[^a-z0-9_]/g, '');
}

export function handleError(raw: string): string | null {
  const handle = normalizeHandle(raw);
  if (handle.length < 3) return 'Handles need at least 3 characters.';
  if (handle.length > 20) return 'Handles are at most 20 characters.';
  if (!HANDLE_RE.test(handle)) return 'Use letters, numbers and underscores only.';
  return null;
}

/** The avatar palette the prototype used across its demo cast. */
export const AVATAR_COLORS = ['#0e0f0c', '#2ead4b', '#38c8ff', '#d03238', '#8b7bf0', '#b86700', '#163300'] as const;

/** Deterministic, so the same person always gets the same avatar colour. */
export function colorFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

/** The "what feels natural to you?" options — Treax.dc.html:1226-1233. */
export const NATURAL_FITS = ['code', 'design', 'promote', 'numbers', 'write', 'research', 'lead', 'unsure'] as const;
export type NaturalFit = (typeof NATURAL_FITS)[number];

export const NATURAL_FIT_LABELS: Record<NaturalFit, string> = {
  code: 'I build and code things',
  design: 'I make things look good',
  promote: 'I talk to people and promote',
  numbers: 'I handle numbers and planning',
  write: 'I write and create content',
  research: 'I research and analyze',
  lead: 'I organize and lead',
  unsure: 'Honestly, I’m not sure yet',
};

/** "Where are you right now?" — Treax.dc.html:1197-1216. */
export const SIGNUP_STAGES = ['idea', 'join', 'lost', 'explore'] as const;
export type SignupStage = (typeof SIGNUP_STAGES)[number];

export const SIGNUP_STAGE_LABELS: Record<SignupStage, string> = {
  idea: 'I have a business idea and I’m ready to build',
  join: 'I want to join something exciting and contribute',
  lost: 'I don’t know what I’m good at yet — help me find out',
  explore: 'Just exploring for now — show me what’s happening',
};

import 'server-only';
import type { PostTag } from '@/lib/types';
import { aiAvailable, completeJson } from '@/lib/ai/client';

/**
 * The Treax filter.
 *
 * `analyzeHeuristic` is a faithful transcription of analyze() from the
 * prototype (Treax.dc.html:2872-2898) — same regexes, same thresholds, same
 * copy. It runs first and always.
 *
 * `analyze` then asks the LLM for a second opinion. The two are combined
 * conservatively: the heuristic's rejections are authoritative (they encode the
 * product's anti-hype stance and are deterministic), while the LLM can bounce
 * something the regexes let through, sharpen the tag, and refine the score.
 * If the LLM is unavailable or malformed, the heuristic verdict stands — the
 * filter must never fail open into "publish anything".
 */

export type FilterVerdict =
  | { ok: true; tag: PostTag; score: number; source: FilterSource }
  | { ok: false; reason: string; suggestion: string; source: FilterSource };

export type FilterSource = 'heuristic' | 'llm' | 'llm+heuristic';

// ── the prototype's rules, verbatim ──────────────────────────────────────────

const FLUFF: RegExp[] = [
  /^gm\b/,
  /good morning/,
  /excited to (be|join|announce)/,
  /let'?s go+/,
  /who'?s (up|building|grinding)/,
  /follow me/,
  /check out my/,
  /big things? (coming|ahead)/,
  /stay tuned/,
  /grateful|blessed/,
  /rise and grind/,
  /to the moon/,
  /drop a (like|follow)/,
  /grind(ing|set)/,
];

const SUBSTANCE =
  /(launched|shipped|released|built|fixed|deployed|pivoted|failed|broke|learned|realized|figured out|cut|reduced|added|customers?|users?|signups?|shops?|farmers?|tuitions?|students?|revenue|paying|market|mvp|prototype|co-?founder|partner|team|equity|marketer|developer|designer|looking for|need (a|an)|\d+\s?%|\d+\s?(tk|taka)|\$\s?\d|\d+\s?(users|customers|shops|farmers|students|signups|days|districts))/;

export const TOO_SHORT = {
  reason: 'Too short to be a real update. What did you launch, learn, or who are you looking for?',
  suggestion: 'Launched <idea> — it does <x>. Result so far: <number or lesson>.',
};

export const HYPE = {
  reason:
    'This reads like hype, not a builder update. Treax only accepts what you launched, learned, struggled with, or the teammate you need — not vibes.',
  suggestion: 'Post the real thing: "Launched X for Y students. Result: Z."',
};

export const NO_SUBSTANCE = {
  reason: 'No concrete update detected. Add what actually happened, a result, a lesson, or who you are looking for.',
  suggestion: 'Name the move + an outcome, e.g. "Moved to a 99tk plan and landed 8 paying shops in 3 days."',
};

export function analyzeHeuristic(raw: string): FilterVerdict {
  const t = (raw || '').trim();
  const lo = t.toLowerCase();

  if (t.length < 14) return { ok: false, ...TOO_SHORT, source: 'heuristic' };

  const substance = SUBSTANCE.test(lo);
  const fluffHit = FLUFF.some((r) => r.test(lo));

  if (fluffHit && !substance) return { ok: false, ...HYPE, source: 'heuristic' };
  if (!substance) return { ok: false, ...NO_SUBSTANCE, source: 'heuristic' };

  return { ok: true, tag: classify(lo), score: scoreOf(t, lo), source: 'heuristic' };
}

/** The classification cascade, in the prototype's order — first match wins. */
export function classify(lo: string): PostTag {
  if (/looking for|need (a|an)|co-?founder|seeking|join me|reach out|dm me|equity|build (this )?together/.test(lo))
    return 'seeking';
  if (/broke|crashed|failed|shut down|regret|mistake|went wrong|postmortem|reverted|zero (signups|sales|users)|painful/.test(lo))
    return 'failed';
  if (/(should i|which (one|would)|thoughts\?|feedback|torn between|stuck|\?$|help me decide)/.test(lo)) return 'feedback';
  if (/learned|realized|lesson|takeaway|turns out|figured out/.test(lo)) return 'learned';
  if (/(\d+\s?%|\d+\s?(tk|taka)|\bmrr\b|\d+\s?(customers|users|shops|farmers|students|paying)|milestone|crossed|hit \d)/.test(lo))
    return 'metric';
  if (/launched|shipped|released|deployed|rolled out|built|fixed/.test(lo)) return 'shipped';
  return 'shipped';
}

/** Ship score 0-100. Base 68, bonuses for numbers, length, deltas and reasoning. */
export function scoreOf(t: string, lo: string): number {
  let s = 68;
  if (/\d/.test(lo)) s += 12;
  if (t.length > 140) s += 8;
  if (t.length > 260) s += 5;
  if (/→|->|from .* to /.test(lo)) s += 6;
  if (/because|root cause|so that|which means|talked to/.test(lo)) s += 5;
  return Math.min(98, s);
}

// ── the LLM pass ─────────────────────────────────────────────────────────────

const SYSTEM = `You are the Treax filter. Treax is a build-in-public network for student builders in Bangladesh. Only real builder updates reach the feed.

ACCEPT a post when it reports something that actually happened: a launch, a shipped change, a measured result, a lesson, a setback or postmortem, a concrete request for feedback, or a genuine co-founder/teammate ask with specifics.

REJECT a post when it is hype, motivation, self-promotion without substance, engagement bait, or an announcement with nothing behind it ("big things coming", "gm builders", "excited to announce", "who else is grinding").

Reply with JSON only:
{"ok": boolean, "tag": "shipped"|"learned"|"failed"|"metric"|"feedback"|"seeking", "score": 0-100, "reason": string, "suggestion": string}

- "tag" and "score" matter only when ok is true. Score specificity: numbers, named results and causal detail score high; vague claims score low.
- "reason" and "suggestion" matter only when ok is false. Write them in the Treax voice: plain, concrete, anti-hype, second person, no exclamation marks, at most two sentences each. The suggestion shows the shape of a post that would pass.`;

type LlmVerdict = { ok: boolean; tag?: string; score?: number; reason?: string; suggestion?: string };

const TAGS: PostTag[] = ['shipped', 'learned', 'failed', 'metric', 'feedback', 'seeking'];

export async function analyze(raw: string): Promise<FilterVerdict> {
  const heuristic = analyzeHeuristic(raw);

  // A heuristic rejection is final. These are the product's stated rules and we
  // do not let a model talk us into publishing hype.
  if (!heuristic.ok) return heuristic;
  if (!aiAvailable()) return heuristic;

  let llm: LlmVerdict | null = null;
  try {
    llm = await completeJson<LlmVerdict>({
      system: SYSTEM,
      user: raw.trim().slice(0, 4000),
      temperature: 0.1,
      maxTokens: 400,
    });
  } catch (err) {
    console.error('[filter] LLM pass failed, falling back to heuristic', err);
    return heuristic;
  }

  if (!llm || typeof llm.ok !== 'boolean') return heuristic;

  if (!llm.ok) {
    return {
      ok: false,
      reason: llm.reason?.trim() || NO_SUBSTANCE.reason,
      suggestion: llm.suggestion?.trim() || NO_SUBSTANCE.suggestion,
      source: 'llm',
    };
  }

  const tag = TAGS.includes(llm.tag as PostTag) ? (llm.tag as PostTag) : heuristic.tag;
  // Average the two scores so neither a generous model nor a blunt regex
  // dominates ranking; clamp to the prototype's 0-98 range.
  const llmScore = typeof llm.score === 'number' && llm.score >= 0 && llm.score <= 100 ? llm.score : null;
  const score = llmScore === null ? heuristic.score : Math.min(98, Math.round((llmScore + heuristic.score) / 2));

  return { ok: true, tag, score, source: 'llm+heuristic' };
}

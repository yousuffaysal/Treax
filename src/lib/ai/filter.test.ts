import { describe, expect, it } from 'vitest';
import { analyzeHeuristic, classify, scoreOf } from './filter';

/**
 * These lock the ported rules to the prototype's analyze()
 * (Treax.dc.html:2872-2898). The two example posts come from the AI-filter
 * explainer page (Treax.dc.html:279 and 284), which states the expected verdict
 * for each, so they double as a check that the copy and the code agree.
 */

describe('analyzeHeuristic — rejections', () => {
  it('bounces anything too short to be an update', () => {
    const verdict = analyzeHeuristic('shipped it');
    expect(verdict.ok).toBe(false);
    if (!verdict.ok) expect(verdict.reason).toMatch(/Too short/);
  });

  it('bounces the explainer page’s hype example', () => {
    const verdict = analyzeHeuristic(
      'gm builders. big things coming this week for my startup, stay tuned. who else is grinding?',
    );
    expect(verdict.ok).toBe(false);
    if (!verdict.ok) expect(verdict.reason).toMatch(/reads like hype/);
  });

  it('bounces a post with no concrete update in it', () => {
    const verdict = analyzeHeuristic('Thinking a lot about the future of things in this country lately.');
    expect(verdict.ok).toBe(false);
    if (!verdict.ok) expect(verdict.reason).toMatch(/No concrete update/);
  });

  it('lets fluff through when it also carries substance', () => {
    // "excited to announce" is a fluff pattern, but this reports a real launch,
    // so the prototype accepts it — fluff alone is not disqualifying.
    const verdict = analyzeHeuristic('Excited to announce we launched RidePool to 120 students this week.');
    expect(verdict.ok).toBe(true);
  });
});

describe('analyzeHeuristic — acceptance', () => {
  it('accepts the explainer page’s good example', () => {
    const verdict = analyzeHeuristic(
      'Launched Tuition Bridge in 3 DU halls. 60 students signed up and 14 tuitions matched in the first 48 hours.',
    );
    expect(verdict.ok).toBe(true);
    if (verdict.ok) {
      // The explainer page labels this one "Launched · Milestone" and shows a
      // score of 94 (Treax.dc.html:283-285), but those are hand-written display
      // values. The real cascade tests `metric` before `shipped`, and
      // "60 students" matches it, so a single tag of `metric` (Milestone) is
      // what the prototype's own analyze() returns. The score likewise computes
      // to 80: base 68 + 12 for containing a number, with no length bonus at
      // 107 characters. We assert the behaviour, not the marketing copy.
      expect(verdict.tag).toBe('metric');
      expect(verdict.score).toBe(80);
    }
  });

  it('reports the heuristic as its source when no model has run', () => {
    const verdict = analyzeHeuristic('Launched RidePool for 120 students, saving 55tk a trip.');
    expect(verdict.source).toBe('heuristic');
  });
});

describe('classify — the tag cascade, in the prototype’s order', () => {
  const cases: Array<[string, string]> = [
    ['looking for a business co-founder in dhaka, equity not a job', 'seeking'],
    ['our payments broke and we reverted the release, painful day', 'failed'],
    ['should i price at 99tk or 199tk? torn between the two', 'feedback'],
    ['learned that students book rides in groups, not solo', 'learned'],
    ['crossed 1,000 farmers this morning across 42 districts', 'metric'],
    ['deployed the new fare split and rolled it out to all halls', 'shipped'],
  ];

  it.each(cases)('classifies %s', (input, expected) => {
    expect(classify(input)).toBe(expected);
  });

  it('prefers seeking over every other tag when both signals are present', () => {
    // A co-founder ask that also reports a launch is still a co-founder ask —
    // "seeking" is first in the cascade for exactly this reason.
    expect(classify('launched the mvp and now looking for a co-founder')).toBe('seeking');
  });
});

describe('scoreOf', () => {
  it('starts from the prototype’s base of 68', () => {
    expect(scoreOf('Deployed the fix', 'deployed the fix')).toBe(68);
  });

  it('rewards numbers, length, deltas and reasoning', () => {
    const plain = 'Deployed the fix';
    const rich =
      'Moved pricing from 500tk to 99tk because shop owners had never paid for software before, which means the free tier does the convincing. Landed 8 paying shops in 3 days, talked to 20 owners in Karwan Bazar to get there, and the pattern held across every one of them.';
    expect(scoreOf(rich, rich.toLowerCase())).toBeGreaterThan(scoreOf(plain, plain.toLowerCase()));
  });

  it('never exceeds the prototype’s ceiling of 98', () => {
    const maximal = `${'x'.repeat(300)} 99% from 5 to 500 because root cause talked to`;
    expect(scoreOf(maximal, maximal)).toBeLessThanOrEqual(98);
  });
});

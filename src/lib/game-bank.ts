/** Signal Rush question bank — gameBank(), Treax.dc.html:2798-2810. Copy unchanged. */

export type GameItem = {
  name: string;
  initials: string;
  color: string;
  text: string;
  verdict: 'accept' | 'bounce';
  why: string;
};

export const GAME_BANK: GameItem[] = [
  {
    name: '@builderx',
    initials: 'BX',
    color: '#38c8ff',
    text: 'gm builders. big things coming for my startup this week, stay tuned. who else is grinding?',
    verdict: 'bounce',
    why: 'Pure hype — no launch, lesson, or ask. The filter bounces vibes.',
  },
  {
    name: '@nusratbuilds',
    initials: 'NJ',
    color: '#2ead4b',
    text: 'Launched Tuition Bridge in 3 DU halls. 60 sign-ups and 14 tuitions matched in the first 48 hours.',
    verdict: 'accept',
    why: 'A real launch with concrete numbers. Textbook accept.',
  },
  {
    name: '@grindset',
    initials: 'GR',
    color: '#b86700',
    text: 'so blessed and grateful for this journey. keep pushing team, we got this!',
    verdict: 'bounce',
    why: 'A motivational post, not a builder update. Bounced.',
  },
  {
    name: '@sabbirbuilds',
    initials: 'SH',
    color: '#d03238',
    text: 'My 500tk price got zero signups. Talked to 20 shop owners, moved to a 99tk plan, landed 8 paying shops.',
    verdict: 'accept',
    why: 'A real setback with a lesson and a result. Accepted.',
  },
  {
    name: '@bighype',
    initials: 'BH',
    color: '#0e0f0c',
    text: 'excited to announce I am building something big. follow along, drop a like if you are in!',
    verdict: 'bounce',
    why: 'An announcement of an announcement. No substance — bounced.',
  },
  {
    name: '@tanviropen',
    initials: 'TA',
    color: '#38c8ff',
    text: 'Full-stack dev at SUST, product is live but I cannot sell. Looking for a marketing co-founder. Equity, not a job.',
    verdict: 'accept',
    why: 'A specific, honest co-founder ask. Exactly what Treax is for.',
  },
  {
    name: '@hustlehard',
    initials: 'HH',
    color: '#868685',
    text: 'rise and grind. who else is up at 5am building the future? to the moon.',
    verdict: 'bounce',
    why: 'Hype with zero build content. Bounced instantly.',
  },
  {
    name: '@rafiapi',
    initials: 'RR',
    color: '#163300',
    text: 'KrishiConnect crossed 1,000 farmers across 42 districts. 10 months from a dorm-room prototype.',
    verdict: 'accept',
    why: 'A concrete milestone with real numbers. Clean accept.',
  },
];

export function shuffle<T>(items: T[]): T[] {
  const copy = items.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { requireViewer } from '@/lib/session';

export const metadata: Metadata = { title: 'Welcome' };

/**
 * Welcome screen — port of Treax.dc.html:1259-1282.
 *
 * The prototype's three "finds" were fixed strings. Here each one is a real
 * count: builders seeking the skills this person just said they have, other
 * students from their university, and the skill most asked for this week.
 */
export default async function WelcomePage() {
  const viewer = await requireViewer();
  if (viewer.onboardingDone) redirect('/');

  const row = await db.user.findUnique({
    where: { id: viewer.id },
    select: { naturalFit: true, university: true },
  });

  const fits = row?.naturalFit ?? [];
  const uni = row?.university?.trim();

  // Builders whose "seeking" mentions something this person naturally does.
  const seekingTerms = fits.flatMap((f) => SEEKING_TERMS[f] ?? []);
  const [matchingIdeas, sameUni, topSkill] = await Promise.all([
    seekingTerms.length
      ? db.user.count({
          where: {
            id: { not: viewer.id },
            suspended: false,
            OR: seekingTerms.map((term) => ({ seeking: { contains: term, mode: 'insensitive' as const } })),
          },
        })
      : Promise.resolve(0),
    uni
      ? db.user.count({
          where: {
            id: { not: viewer.id },
            university: { equals: uni, mode: 'insensitive' },
            createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          },
        })
      : Promise.resolve(0),
    mostWantedSkill(),
  ]);

  const finds = [
    matchingIdeas > 0
      ? `${matchingIdeas} ${matchingIdeas === 1 ? 'builder is' : 'builders are'} looking for someone with your background`
      : 'Builders here are posting what they need — your skills will match soon',
    sameUni > 0
      ? `${sameUni} student${sameUni === 1 ? '' : 's'} from ${uni} also joined recently`
      : 'You are early from your university — that makes you easy to find',
    `Most active skill needed this week: ${topSkill}`,
  ];

  const firstName = viewer.name.trim().split(/\s+/)[0] ?? viewer.name;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', background: 'var(--page)' }}>
      <div
        style={{
          width: '100%',
          maxWidth: 600,
          background: 'var(--card)',
          border: '1px solid var(--card-border)',
          borderRadius: 28,
          padding: 40,
          boxShadow: '0 24px 60px rgba(14,15,12,.10)',
          animation: 'sl-modal-genie .7s cubic-bezier(.2,.85,.25,1) both',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
          <span style={{ width: 46, height: 46, borderRadius: 9999, background: 'var(--primary)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#163300" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M10.3 21a2 2 0 0 0 3.4 0" />
            </svg>
          </span>
          <h2 style={{ fontFamily: 'var(--font-manrope), Manrope', fontWeight: 800, fontSize: 30, letterSpacing: '-.03em', color: 'var(--ink)', margin: 0 }}>
            Welcome, {firstName}.
          </h2>
        </div>

        <p style={{ fontSize: 15, color: 'var(--body)', margin: '20px 0 16px' }}>Here’s what Treax found for you today:</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {finds.map((text, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                background: 'var(--soft)',
                borderRadius: 16,
                padding: '16px 18px',
                animation: `sl-genie-in .5s cubic-bezier(.2,.85,.25,1) both`,
                animationDelay: `${0.12 + i * 0.09}s`,
              }}
            >
              <span
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 11,
                  background: 'var(--card)',
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                  font: '800 15px/1 var(--font-manrope), Manrope',
                  color: 'var(--ink)',
                }}
              >
                {i + 1}
              </span>
              <span style={{ fontSize: 15, lineHeight: 1.45, color: 'var(--ink)' }}>{text}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 26 }}>
          <Link href="/onboarding" style={{ ...ctaPrimary }}>
            Set up your profile
          </Link>
          <Link href="/team" style={{ ...ctaSecondary }}>
            See who’s here
          </Link>
          <Link href="/compose" style={{ ...ctaSecondary }}>
            Post first update
          </Link>
        </div>
      </div>
    </div>
  );
}

const ctaBase: React.CSSProperties = {
  flex: 1,
  minWidth: 150,
  borderRadius: 9999,
  padding: '14px 20px',
  cursor: 'pointer',
  textAlign: 'center',
};

const ctaPrimary: React.CSSProperties = {
  ...ctaBase,
  background: 'var(--primary)',
  color: '#163300',
  border: 'none',
  font: '700 14.5px/1 var(--font-inter), Inter, sans-serif',
};

const ctaSecondary: React.CSSProperties = {
  ...ctaBase,
  background: 'var(--card)',
  color: 'var(--ink)',
  border: '1px solid var(--border-strong)',
  font: '600 14.5px/1 var(--font-inter), Inter, sans-serif',
};

/** Maps a "what feels natural" answer to the words builders use when asking for it. */
const SEEKING_TERMS: Record<string, string[]> = {
  code: ['developer', 'engineer', 'technical'],
  design: ['designer', 'design'],
  promote: ['marketer', 'marketing', 'growth'],
  numbers: ['finance', 'business', 'ops'],
  write: ['content', 'writer'],
  research: ['research', 'analyst'],
  lead: ['co-founder', 'partner'],
  unsure: [],
};

/** The role most named in `seeking` across the network right now. */
async function mostWantedSkill(): Promise<string> {
  const rows = await db.user.findMany({
    where: { seeking: { not: null }, suspended: false },
    select: { seeking: true },
    take: 500,
  });

  const buckets: Record<string, number> = {};
  for (const { seeking } of rows) {
    const lo = (seeking ?? '').toLowerCase();
    for (const [label, terms] of Object.entries(WANTED_LABELS)) {
      if (terms.some((t) => lo.includes(t))) buckets[label] = (buckets[label] ?? 0) + 1;
    }
  }

  const top = Object.entries(buckets).sort((a, b) => b[1] - a[1])[0];
  return top?.[0] ?? 'Designer';
}

const WANTED_LABELS: Record<string, string[]> = {
  Developer: ['developer', 'engineer', 'technical co-founder'],
  Designer: ['designer', 'design'],
  Marketer: ['marketer', 'marketing', 'growth'],
  'Business co-founder': ['business', 'sales', 'ops'],
};

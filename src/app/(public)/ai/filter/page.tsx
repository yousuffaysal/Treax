import type { Metadata } from 'next';
import Link from 'next/link';
import { getViewer } from '@/lib/session';
import { getShellBadges } from '@/lib/shell-data';
import { TopBar } from '@/components/layout/top-bar';
import { CheckIcon, CrossIcon } from '@/components/ui/icons';

export const metadata: Metadata = {
  title: 'The Treax filter',
  description: 'Every post is a real builder update. The filter makes sure.',
};

/**
 * AI filter explainer — port of Treax.dc.html:246-294.
 *
 * Public: this is the page that explains the product's core promise, so it is
 * readable without an account (see PUBLIC_PREFIXES in middleware.ts).
 */
export default async function AiFilterPage() {
  const viewer = await getViewer();
  const badges = viewer ? await getShellBadges(viewer.id) : null;

  const steps = [
    {
      n: '1',
      title: 'Substance check',
      body: 'Detects a real move — a launch, a lesson, a setback, or a genuine co-founder ask. Hype gets bounced.',
    },
    {
      n: '2',
      title: 'Auto-tagging',
      body: 'Classifies each update as Launched, Lesson, Setback, Milestone, Looking for, or Feedback — so the feed stays filterable.',
    },
    {
      n: '3',
      title: 'Ship score',
      body: 'Rates specificity 0–100. Higher scores rank higher. Add numbers, results and detail to climb.',
    },
  ];

  return (
    <>
      {viewer && badges ? <TopBar viewer={viewer} badges={badges} /> : null}

      <div className="sl-wrap" style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px 80px' }}>
        <div className="sl-hero" style={{ background: '#13150d', borderRadius: 28, padding: '64px 56px', position: 'relative', overflow: 'hidden' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              background: 'rgba(159,232,112,.16)',
              color: 'var(--primary)',
              font: '700 12px/1 var(--font-inter), Inter, sans-serif',
              letterSpacing: '.06em',
              textTransform: 'uppercase',
              padding: '8px 14px',
              borderRadius: 9999,
            }}
          >
            The Treax filter
          </span>
          <h1
            style={{
              fontFamily: 'var(--font-manrope), Manrope',
              fontWeight: 800,
              fontSize: 64,
              lineHeight: 1.02,
              letterSpacing: '-.03em',
              color: 'var(--primary)',
              margin: '22px 0 0',
              maxWidth: '16ch',
            }}
          >
            Every post is a real builder update. The filter makes sure.
          </h1>
          <p style={{ fontSize: 20, lineHeight: 1.5, color: 'rgba(255,255,255,.72)', maxWidth: '56ch', margin: '20px 0 0' }}>
            No &quot;gm&quot;. No &quot;big things coming&quot;. No motivational threads. Before anything reaches the feed, the filter
            checks it for one thing: did you actually build, learn, struggle, or are you looking for a teammate?
          </p>
        </div>

        <h2
          style={{
            fontFamily: 'var(--font-manrope), Manrope',
            fontWeight: 800,
            fontSize: 34,
            letterSpacing: '-.02em',
            color: 'var(--ink)',
            margin: '56px 0 4px',
          }}
        >
          How the filter works
        </h2>
        <p style={{ fontSize: 16, color: 'var(--body)', margin: '0 0 28px' }}>Three checks run the moment you hit publish.</p>

        <div className="sl-grid3">
          {steps.map((s) => (
            <div key={s.n} style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 24, padding: 28 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  background: 'var(--primary-pale)',
                  color: 'var(--ink)',
                  display: 'grid',
                  placeItems: 'center',
                  font: '800 18px/1 var(--font-manrope), Manrope',
                }}
              >
                {s.n}
              </div>
              <h3 style={{ font: '700 19px/1.2 var(--font-inter), Inter, sans-serif', color: 'var(--ink)', margin: '18px 0 8px' }}>{s.title}</h3>
              <p style={{ fontSize: 15, lineHeight: 1.55, color: 'var(--body)', margin: 0 }}>{s.body}</p>
            </div>
          ))}
        </div>

        <h2
          style={{
            fontFamily: 'var(--font-manrope), Manrope',
            fontWeight: 800,
            fontSize: 34,
            letterSpacing: '-.02em',
            color: 'var(--ink)',
            margin: '56px 0 28px',
          }}
        >
          Rejected vs. accepted
        </h2>

        <div className="sl-grid2w">
          <div style={{ background: 'rgba(208,50,56,.07)', border: '1px solid rgba(208,50,56,.28)', borderRadius: 24, padding: 26 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--negative)', font: '700 13px/1 var(--font-inter), Inter, sans-serif' }}>
              <CrossIcon size={16} />
              Bounced
            </span>
            <p style={{ fontSize: 17, lineHeight: 1.5, color: 'var(--ink)', margin: '14px 0 16px', fontWeight: 500 }}>
              &quot;gm builders. big things coming this week for my startup, stay tuned. who else is grinding?&quot;
            </p>
            <p style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--body)', margin: 0, paddingTop: 14, borderTop: '1px solid rgba(208,50,56,.2)' }}>
              <b style={{ color: 'var(--ink)' }}>Why:</b> Reads like hype, not a builder update. No launch, result, lesson, or ask
              detected.
            </p>
          </div>

          <div style={{ background: 'rgba(46,173,75,.08)', border: '1px solid rgba(46,173,75,.3)', borderRadius: 24, padding: 26 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--positive)', font: '700 13px/1 var(--font-inter), Inter, sans-serif' }}>
              <CheckIcon size={16} />
              Accepted
            </span>
            <p style={{ fontSize: 17, lineHeight: 1.5, color: 'var(--ink)', margin: '14px 0 16px', fontWeight: 500 }}>
              &quot;Launched Tuition Bridge in 3 DU halls. 60 students signed up and 14 tuitions matched in the first 48 hours.&quot;
            </p>
            <p style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--body)', margin: 0, paddingTop: 14, borderTop: '1px solid rgba(46,173,75,.24)' }}>
              <b style={{ color: 'var(--ink)' }}>Tagged:</b> Milestone — a real launch with measured traction.
            </p>
          </div>
        </div>

        <div
          style={{
            marginTop: 40,
            background: 'var(--primary-pale)',
            borderRadius: 24,
            padding: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 24,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h3
              style={{
                fontFamily: 'var(--font-manrope), Manrope',
                fontWeight: 800,
                fontSize: 26,
                letterSpacing: '-.02em',
                color: 'var(--ink)',
                margin: '0 0 6px',
              }}
            >
              Try it yourself
            </h3>
            <p style={{ fontSize: 16, color: 'var(--body)', margin: 0 }}>Draft an update and watch the filter grade it live.</p>
          </div>
          <Link
            href={viewer ? '/?compose=1' : '/signup'}
            style={{
              background: 'var(--primary)',
              color: '#163300',
              border: 'none',
              borderRadius: 9999,
              padding: '15px 26px',
              font: '600 16px/1 var(--font-inter), Inter, sans-serif',
            }}
          >
            {viewer ? 'Post an update' : 'Join Treax'}
          </Link>
        </div>
      </div>
    </>
  );
}

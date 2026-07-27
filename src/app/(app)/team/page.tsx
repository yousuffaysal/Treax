import type { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/lib/db';
import { requireViewer } from '@/lib/session';
import { getRailData, getShellBadges } from '@/lib/shell-data';
import { AppShell } from '@/components/layout/app-shell';
import { ChipRow, EmptyState, PageHeader } from '@/components/ui/page-header';
import { FollowButton } from '@/components/ui/follow-button';
import { SparkIcon } from '@/components/ui/icons';

export const metadata: Metadata = { title: 'Team' };

/** exploreCats — Treax.dc.html:3652. */
const CATEGORIES = ['All', 'Developers', 'Designers', 'Business', 'Marketing', 'Finance', 'BUET', 'Dhaka University', 'NSU', 'BRAC'];

/**
 * Team — co-founder matching. Port of Treax.dc.html:581-700.
 *
 * The prototype hardcoded its two "AI matches". Here the match is computed: we
 * score every other builder on whether what they are *seeking* overlaps what
 * the viewer brings, and vice versa — complementary skills, not similar ones.
 */
export default async function TeamPage() {
  const viewer = await requireViewer();
  const [badges, rails, me] = await Promise.all([
    getShellBadges(viewer.id),
    getRailData(viewer),
    db.user.findUnique({ where: { id: viewer.id }, select: { tags: true, seeking: true, focus: true } }),
  ]);

  const builders = await db.user.findMany({
    where: { id: { not: viewer.id }, suspended: false },
    orderBy: [{ shipCount: 'desc' }, { streak: 'desc' }],
    take: 40,
    select: {
      id: true,
      name: true,
      handle: true,
      initials: true,
      avatarColor: true,
      verified: true,
      building: true,
      focus: true,
      university: true,
      seeking: true,
      tags: true,
      streak: true,
      shipCount: true,
    },
  });

  const followingRows = await db.follow.findMany({
    where: { followerId: viewer.id },
    select: { followingId: true },
  });
  const following = new Set(followingRows.map((f) => f.followingId));

  const matches = rankMatches({ mine: me, builders }).slice(0, 2);

  return (
    <AppShell viewer={viewer} badges={badges} rails={rails}>
      <PageHeader
        title="Find your missing piece"
        subtitle="Student builders across Bangladesh — by skill, idea, and what they're looking for."
      >
        <ChipRow items={CATEGORIES} />
      </PageHeader>

      {/* AI match panel — Treax.dc.html:589-600 */}
      {matches.length > 0 ? (
        <div style={{ background: '#13150d', borderRadius: 24, padding: '22px 24px', color: '#fff' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              background: 'rgba(159,232,112,.16)',
              color: 'var(--primary)',
              font: '700 12px/1 var(--font-inter), Inter, sans-serif',
              letterSpacing: '.05em',
              textTransform: 'uppercase',
              padding: '7px 12px',
              borderRadius: 9999,
            }}
          >
            <SparkIcon size={13} />
            AI co-founder match
          </span>
          <p style={{ fontSize: 15, lineHeight: 1.5, color: 'rgba(255,255,255,.72)', margin: '14px 0 16px', maxWidth: '62ch' }}>
            {me?.seeking
              ? `You're looking for ${me.seeking.toLowerCase()}. These builders bring exactly that:`
              : 'Based on what you bring, these builders complement your skills:'}
          </p>
          <div className="sl-grid2">
            {matches.map(({ builder, reason }) => (
              <div key={builder.id} style={{ background: 'rgba(255,255,255,.06)', borderRadius: 16, padding: 16 }}>
                <Link href={`/u/${builder.handle}`} style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                  <span
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 9999,
                      background: builder.avatarColor,
                      color: '#fff',
                      font: '800 15px/1 var(--font-manrope), Manrope',
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {builder.initials}
                  </span>
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: 'block', font: '700 15px/1.2 var(--font-inter), Inter, sans-serif', color: '#fff' }}>
                      {builder.name}
                    </span>
                    <span style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,.6)', marginTop: 3 }}>
                      {builder.focus ?? 'Builder'}
                      {builder.university ? ` · ${builder.university}` : ''}
                    </span>
                  </span>
                </Link>
                <p style={{ margin: '13px 0 14px', fontSize: 14, lineHeight: 1.5, color: 'rgba(255,255,255,.78)' }}>{reason}</p>
                <a
                  href={`/messages?to=${builder.handle}`}
                  style={{
                    display: 'inline-block',
                    background: 'var(--primary)',
                    color: '#163300',
                    borderRadius: 9999,
                    padding: '10px 18px',
                    font: '700 13.5px/1 var(--font-inter), Inter, sans-serif',
                  }}
                >
                  Request an intro
                </a>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {builders.length === 0 ? (
        <EmptyState title="No other builders yet." body="Invite a friend and this fills up fast." />
      ) : (
        <div className="sl-grid2">
          {builders.map((b) => (
            <div
              key={b.id}
              style={{
                background: 'var(--card)',
                border: '1px solid var(--card-border)',
                borderRadius: 24,
                padding: 22,
                boxShadow: 'var(--elev)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Link href={`/u/${b.handle}`} style={{ display: 'flex', gap: 13, alignItems: 'center' }}>
                <span
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: 9999,
                    background: b.avatarColor,
                    color: '#fff',
                    font: '800 19px/1 var(--font-manrope), Manrope',
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                  }}
                >
                  {b.initials}
                </span>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span
                      style={{
                        font: '700 16px/1.2 var(--font-inter), Inter, sans-serif',
                        color: 'var(--ink)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {b.name}
                    </span>
                    {b.verified ? (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="var(--primary)" style={{ flexShrink: 0 }} aria-label="Verified">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M17 9l-5.5 5.5L8 11" stroke="#163300" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : null}
                  </span>
                  <span style={{ display: 'block', fontSize: 13, color: 'var(--mute)', marginTop: 3 }}>
                    {b.focus ?? 'Builder'}
                    {b.university ? ` · ${b.university}` : ''}
                  </span>
                </span>
              </Link>

              {b.building ? (
                <p style={{ margin: '14px 0 0', fontSize: 14.5, lineHeight: 1.5, color: 'var(--body)' }}>Building {b.building}</p>
              ) : null}
              {b.seeking ? (
                <p style={{ margin: '6px 0 0', fontSize: 14, color: 'var(--mute)' }}>Looking for {b.seeking}</p>
              ) : null}

              {b.tags.length > 0 ? (
                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', margin: '14px 0 0' }}>
                  {b.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      style={{
                        padding: '6px 11px',
                        borderRadius: 9999,
                        background: 'var(--soft)',
                        color: 'var(--body)',
                        font: '600 12px/1 var(--font-inter), Inter, sans-serif',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}

              <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
                <FollowButton targetId={b.id} initialFollowing={following.has(b.id)} />
                <a
                  href={`/messages?to=${b.handle}`}
                  style={{
                    background: 'var(--card)',
                    color: 'var(--ink)',
                    border: '1px solid var(--border-strong)',
                    borderRadius: 9999,
                    padding: '10px 18px',
                    font: '600 13.5px/1 var(--font-inter), Inter, sans-serif',
                  }}
                >
                  Message
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}

type Builder = {
  id: string;
  name: string;
  handle: string;
  initials: string;
  avatarColor: string;
  focus: string | null;
  university: string | null;
  seeking: string | null;
  tags: string[];
  building: string | null;
};

/**
 * Complementary-skill matching: a builder scores when what they are *seeking*
 * matches what the viewer offers, and when what the viewer seeks matches what
 * they offer. Similar people score nothing — that is the point.
 */
function rankMatches({
  mine,
  builders,
}: {
  mine: { tags: string[]; seeking: string | null; focus: string | null } | null;
  builders: Builder[];
}): Array<{ builder: Builder; reason: string }> {
  if (!mine) return [];

  const iOffer = [...mine.tags, mine.focus ?? ''].join(' ').toLowerCase();
  const iSeek = (mine.seeking ?? '').toLowerCase();

  return builders
    .map((builder) => {
      const theyOffer = [...builder.tags, builder.focus ?? ''].join(' ').toLowerCase();
      const theySeek = (builder.seeking ?? '').toLowerCase();

      let score = 0;
      const reasons: string[] = [];

      if (iSeek && overlaps(iSeek, theyOffer)) {
        score += 2;
        reasons.push(`brings the ${builder.focus?.toLowerCase() ?? 'skills'} you're missing`);
      }
      if (theySeek && overlaps(theySeek, iOffer)) {
        score += 2;
        reasons.push(`is looking for ${builder.seeking?.toLowerCase()}`);
      }
      if (score === 0) return null;

      return {
        builder,
        score,
        reason: `${builder.name.split(' ')[0]} ${reasons.join(' and ')}${builder.building ? `, while building ${builder.building}` : ''}.`,
      };
    })
    .filter((m): m is { builder: Builder; score: number; reason: string } => m !== null)
    .sort((a, b) => b.score - a.score)
    .map(({ builder, reason }) => ({ builder, reason }));
}

/** Word-level overlap, ignoring the filler that appears in every "seeking" line. */
const FILLER = new Set(['a', 'an', 'the', 'in', 'for', 'and', 'or', 'with', 'who', 'can', 'my', 'to', 'of']);

function overlaps(a: string, b: string): boolean {
  const words = a
    .split(/[^a-z]+/)
    .filter((w) => w.length > 2 && !FILLER.has(w));
  return words.some((w) => b.includes(w));
}

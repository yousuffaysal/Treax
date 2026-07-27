'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useToast } from '@/components/providers/toast-provider';
import { Composer } from '@/components/feed/composer';
import { PostCard } from '@/components/feed/post-card';
import { FEED_FILTERS, type FeedAd, type FeedFilter, type FeedRow } from '@/lib/feed';
import { recordAdClick, recordAdImpression } from '@/app/(app)/actions';

/**
 * The interactive half of the feed — composer trigger, filter tabs and the
 * rendered rows. Data arrives already fetched from the server component.
 */

type Viewer = { id: string; name: string; initials: string; avatarColor: string; avatarUrl?: string | null; building: string | null };

const FILTER_KEYS: Record<FeedFilter, string> = {
  foryou: 'foryou',
  shipped: 'launched',
  learned: 'lessons',
  failed: 'setbacks',
  metric: 'milestones',
  seeking: 'cofounders',
  following: 'following',
};

export function FeedClient({
  viewer,
  rows,
  filter,
  labels,
  shareLabel,
}: {
  viewer: Viewer;
  rows: FeedRow[];
  filter: FeedFilter;
  labels: Record<string, string>;
  shareLabel: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const { error } = useToast();
  const [composerOpen, setComposerOpen] = useState(false);
  const [seed, setSeed] = useState('');

  // The top bar and left rail link to /compose; opening the modal here keeps
  // the feed underneath rather than navigating away from it.
  useEffect(() => {
    if (params.get('compose') !== null) {
      setSeed(params.get('seed') ?? '');
      setComposerOpen(true);
    }
  }, [params]);

  function openWith(text: string) {
    setSeed(text);
    setComposerOpen(true);
  }

  function closeComposer() {
    setComposerOpen(false);
    setSeed('');
    if (params.get('compose') !== null) router.replace('/');
  }

  return (
    <>
      {/* composer trigger — Treax.dc.html:478-488 */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 24, padding: 18, boxShadow: 'var(--elev)' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span
            style={{
              width: 44,
              height: 44,
              borderRadius: 9999,
              background: viewer.avatarColor,
              color: '#fff',
              font: '800 16px/1 var(--font-manrope), Manrope',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            {viewer.initials}
          </span>
          <button
            onClick={() => openWith('')}
            style={{
              flex: 1,
              minWidth: 0,
              textAlign: 'left',
              background: 'var(--soft)',
              border: '1px solid var(--border)',
              borderRadius: 9999,
              padding: '13px 20px',
              color: 'var(--mute)',
              fontSize: 14,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              cursor: 'pointer',
            }}
          >
            {shareLabel}
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
          {[
            { label: labels.launched, dot: 'var(--positive)', seed: 'Launched ' },
            { label: labels.lesson, dot: '#38c8ff', seed: 'Learned ' },
            { label: labels.setback, dot: 'var(--negative)', seed: '' },
          ].map((quick) => (
            <button
              key={quick.label}
              onClick={() => openWith(quick.seed)}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 7,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 8,
                borderRadius: 12,
                color: 'var(--body)',
                font: '600 13px/1 var(--font-inter), Inter, sans-serif',
              }}
            >
              <span style={{ width: 9, height: 9, borderRadius: 9999, background: quick.dot }} />
              {quick.label}
            </button>
          ))}
        </div>
      </div>

      {/* filter tabs — Treax.dc.html:490-494 */}
      <div
        className="sl-noscroll"
        style={{
          display: 'flex',
          gap: 6,
          alignItems: 'center',
          background: 'var(--card)',
          border: '1px solid var(--card-border)',
          borderRadius: 9999,
          padding: 6,
          boxShadow: 'var(--elev)',
          overflowX: 'auto',
        }}
      >
        {FEED_FILTERS.map((key) => {
          const on = key === filter;
          return (
            <button
              key={key}
              onClick={() => router.push(key === 'foryou' ? '/' : `/?filter=${key}`)}
              aria-current={on ? 'true' : undefined}
              style={{
                border: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                padding: '9px 16px',
                borderRadius: 9999,
                font: '600 13.5px/1 var(--font-inter), Inter, sans-serif',
                background: on ? 'var(--ink)' : 'transparent',
                color: on ? 'var(--card)' : 'var(--body)',
              }}
            >
              {labels[FILTER_KEYS[key]] ?? key}
            </button>
          );
        })}
      </div>

      {rows.length === 0 ? (
        <div
          style={{
            background: 'var(--card)',
            border: '1px solid var(--card-border)',
            borderRadius: 24,
            padding: 40,
            textAlign: 'center',
            boxShadow: 'var(--elev)',
          }}
        >
          <p style={{ margin: '0 0 6px', font: '700 17px/1.3 var(--font-inter), Inter, sans-serif', color: 'var(--ink)' }}>
            Nothing here yet.
          </p>
          <p style={{ margin: 0, fontSize: 15, color: 'var(--body)' }}>
            {filter === 'following'
              ? 'Follow a few builders and their updates land here.'
              : 'Be the first to post a real update in this lane.'}
          </p>
        </div>
      ) : (
        rows.map((row) =>
          row.kind === 'ad' ? (
            <AdCard key={row.ad.id} ad={row.ad} onError={error} />
          ) : (
            <PostCard key={row.post.id} post={row.post} viewer={viewer} />
          ),
        )
      )}

      <div style={{ textAlign: 'center', padding: 16, color: 'var(--mute)', fontSize: 14 }}>
        You&apos;re all caught up. Go ship something.
      </div>

      {composerOpen ? <Composer viewer={viewer} initialText={seed} onClose={closeComposer} /> : null}
    </>
  );
}

/** Campaign ids already counted in this page load — see the effect below. */
const countedImpressions = new Set<string>();

/** Sponsored slot — Treax.dc.html:498-511. */
function AdCard({ ad, onError }: { ad: FeedAd; onError: (m: string) => void }) {
  // One impression per campaign per page load. A ref would still fire twice
  // under StrictMode's double-invoke in development, which would inflate the
  // count, so the guard lives outside the component's lifecycle.
  useEffect(() => {
    if (countedImpressions.has(ad.id)) return;
    countedImpressions.add(ad.id);
    void recordAdImpression(ad.id);
  }, [ad.id]);

  async function onClick() {
    const result = await recordAdClick(ad.id);
    if (!result.ok) return onError(result.error);
    if (result.data.link) window.open(result.data.link, '_blank', 'noopener');
  }

  return (
    <article
      style={{
        position: 'relative',
        background: 'var(--card)',
        border: '1px solid var(--card-border)',
        borderRadius: 24,
        overflow: 'hidden',
        boxShadow: 'var(--elev)',
        animation: 'sl-genie-in .5s cubic-bezier(.2,.85,.25,1) both',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '14px 18px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <span
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: 'var(--ink)',
              color: 'var(--primary)',
              font: '800 13px/1 var(--font-manrope), Manrope',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            {ad.initials}
          </span>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                font: '700 14.5px/1.2 var(--font-inter), Inter, sans-serif',
                color: 'var(--ink)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {ad.brand}
            </div>
            <div style={{ fontSize: 12, color: 'var(--mute)', marginTop: 2 }}>Promoted on Treax</div>
          </div>
        </div>
        <span
          style={{
            flexShrink: 0,
            background: 'var(--soft)',
            color: 'var(--body)',
            font: '700 11px/1 var(--font-inter), Inter, sans-serif',
            letterSpacing: '.06em',
            textTransform: 'uppercase',
            padding: '6px 10px',
            borderRadius: 9999,
          }}
        >
          Ad
        </span>
      </div>
      <div style={{ padding: 18 }}>
        <h3 style={{ fontFamily: 'var(--font-manrope), Manrope', fontWeight: 800, fontSize: 19, letterSpacing: '-.015em', color: 'var(--ink)', margin: 0 }}>
          {ad.title}
        </h3>
        <p style={{ fontSize: 15, lineHeight: 1.55, color: 'var(--body)', margin: '8px 0 0' }}>{ad.body}</p>
        <button
          onClick={onClick}
          style={{
            marginTop: 16,
            background: 'var(--primary)',
            color: '#163300',
            border: 'none',
            borderRadius: 9999,
            padding: '12px 22px',
            font: '700 14px/1 var(--font-inter), Inter, sans-serif',
            cursor: 'pointer',
            transition: 'transform .18s cubic-bezier(.2,.85,.25,1)',
          }}
        >
          {ad.cta}
        </button>
      </div>
    </article>
  );
}

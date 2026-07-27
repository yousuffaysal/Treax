'use client';

import { useState, useTransition } from 'react';
import { useToast } from '@/components/providers/toast-provider';
import { compactCount } from '@/lib/types';
import { toggleFollow, toggleRespect } from '@/app/(app)/actions';

/**
 * The reader's interactive controls, in two placements: the sticky bar (share
 * plus follow) and the article footer (respect plus message) — Treax.dc.html:1291
 * and 1313-1316.
 */
export function PostActions({
  postId,
  authorId,
  authorHandle,
  initialRespected,
  initialCount,
  initialFollowing,
  isSelf,
  variant,
}: {
  postId: string;
  authorId: string;
  authorHandle: string;
  initialRespected: boolean;
  initialCount: number;
  initialFollowing: boolean;
  isSelf: boolean;
  variant: 'bar' | 'footer';
}) {
  const { flash, error } = useToast();
  const [respected, setRespected] = useState(initialRespected);
  const [count, setCount] = useState(initialCount);
  const [following, setFollowing] = useState(initialFollowing);
  const [, startTransition] = useTransition();

  function share() {
    // The prototype copies `treax.co/p/<id>` (Treax.dc.html:2575); we copy the
    // real shareable URL for this deployment.
    const url = `${window.location.origin}/p/${postId}`;
    void navigator.clipboard?.writeText(url);
    flash('Copied to clipboard');
  }

  function onRespect() {
    startTransition(async () => {
      setRespected((v) => !v);
      setCount((c) => c + (respected ? -1 : 1));
      const result = await toggleRespect(postId);
      if (result.ok) {
        setRespected(result.data.respected);
        setCount(result.data.count);
      } else {
        setRespected(initialRespected);
        setCount(initialCount);
        error(result.error);
      }
    });
  }

  function onFollow() {
    startTransition(async () => {
      const result = await toggleFollow(authorId);
      if (result.ok) setFollowing(result.data.following);
      else error(result.error);
    });
  }

  if (variant === 'bar') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        {!isSelf ? (
          <button
            onClick={onFollow}
            style={{
              background: following ? 'var(--soft)' : 'var(--card)',
              color: following ? 'var(--body)' : 'var(--ink)',
              border: `1px solid ${following ? 'transparent' : 'var(--border-strong)'}`,
              borderRadius: 9999,
              padding: '10px 18px',
              font: '600 13.5px/1 var(--font-inter), Inter, sans-serif',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            {following ? 'Following' : 'Follow'}
          </button>
        ) : null}
        <button
          onClick={share}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            background: 'var(--card)',
            color: 'var(--ink)',
            border: '1px solid var(--border-strong)',
            borderRadius: 9999,
            padding: '10px 17px',
            font: '600 13.5px/1 var(--font-inter), Inter, sans-serif',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
          </svg>
          Share
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 44, paddingTop: 26, borderTop: '1px solid var(--border)' }}>
      <button
        onClick={onRespect}
        aria-pressed={respected}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          border: 'none',
          borderRadius: 9999,
          padding: '12px 20px',
          font: '700 14px/1 var(--font-inter), Inter, sans-serif',
          cursor: 'pointer',
          transition: 'transform .18s cubic-bezier(.2,.85,.25,1)',
          background: respected ? 'var(--primary)' : 'var(--soft)',
          color: respected ? '#163300' : 'var(--ink)',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M7 11v9H4a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1z" />
          <path d="M7 11l4.5-8a2.2 2.2 0 0 1 3.2 2.7L13.5 9H19a2 2 0 0 1 1.9 2.6l-2 6.5A2.5 2.5 0 0 1 16.5 20H7" />
        </svg>
        {respected ? 'Respected' : 'Respect'} · {compactCount(count)}
      </button>

      {!isSelf ? (
        <a
          href={`/messages?to=${authorHandle}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--card)',
            color: 'var(--ink)',
            border: '1px solid var(--border-strong)',
            borderRadius: 9999,
            padding: '12px 20px',
            font: '600 14px/1 var(--font-inter), Inter, sans-serif',
            cursor: 'pointer',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          Message
        </a>
      ) : null}
    </div>
  );
}

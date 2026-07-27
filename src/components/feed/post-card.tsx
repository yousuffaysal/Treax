'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useOptimistic, useState, useTransition } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { useToast } from '@/components/providers/toast-provider';
import { TAG_META, compactCount, scoreStyle, type PostTag } from '@/lib/types';
import { relativeTime, type FeedPost } from '@/lib/feed';
import { addComment, toggleRespect } from '@/app/(app)/actions';

/** Post card — port of Treax.dc.html:513-574. */

type Comment = {
  id: string;
  body: string;
  author: { id: string; name: string; handle: string; initials: string; avatarColor: string; avatarUrl?: string };
};

const actionButton: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 7,
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: 10,
  borderRadius: 12,
  font: '600 14px/1 var(--font-inter), Inter, sans-serif',
};

function VerifiedBadge() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="var(--primary)" style={{ flexShrink: 0 }} aria-label="Verified builder">
      <circle cx="12" cy="12" r="10" />
      <path d="M17 9l-5.5 5.5L8 11" stroke="#163300" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StarGlyph({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 3l1.9 4.9L19 9.8l-4.2 3.1L16 18l-4-2.7L8 18l1.2-5.1L5 9.8l5.1-1.9z" />
    </svg>
  );
}

export function PostCard({
  post,
  viewer,
  initialComments,
}: {
  post: FeedPost;
  viewer: { id: string; initials: string; avatarColor: string; avatarUrl?: string | null };
  initialComments?: Comment[];
}) {
  const { error } = useToast();
  const [, startTransition] = useTransition();

  // Optimistic respect: the count moves the instant it is tapped, and reverts
  // if the server disagrees.
  const [respect, setRespect] = useState({ on: post.respected, count: post.respectCount });
  const [optimisticRespect, applyRespect] = useOptimistic(respect, (_state, next: typeof respect) => next);

  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>(initialComments ?? []);
  const [loadedComments, setLoadedComments] = useState(Boolean(initialComments));
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const tag = TAG_META[post.tag as PostTag];
  const score = scoreStyle(post.shipScore);

  function onRespect() {
    const next = { on: !optimisticRespect.on, count: optimisticRespect.count + (optimisticRespect.on ? -1 : 1) };
    startTransition(async () => {
      applyRespect(next);
      const result = await toggleRespect(post.id);
      if (result.ok) setRespect({ on: result.data.respected, count: result.data.count });
      else error(result.error);
    });
  }

  async function openComments() {
    const next = !commentsOpen;
    setCommentsOpen(next);
    if (next && !loadedComments) {
      // Comments are fetched on demand — loading every thread with the feed
      // would multiply the page payload for something most people never open.
      const res = await fetch(`/api/posts/${post.id}/comments`);
      if (res.ok) setComments((await res.json()) as Comment[]);
      setLoadedComments(true);
    }
  }

  async function send() {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    const result = await addComment({ postId: post.id, body });
    setSending(false);
    if (!result.ok) return error(result.error);
    setComments((cur) => [
      ...cur,
      { id: result.data.id, body, author: { id: viewer.id, name: 'You', handle: '', initials: viewer.initials, avatarColor: viewer.avatarColor, avatarUrl: viewer.avatarUrl } },
    ]);
    setDraft('');
  }

  const profileHref = `/u/${post.author.handle}`;

  return (
    <article
      style={{
        background: 'var(--card)',
        border: '1px solid var(--card-border)',
        borderRadius: 24,
        padding: 22,
        boxShadow: 'var(--elev)',
        animation: 'sl-up .3s ease both',
      }}
    >
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <Link
          href={profileHref}
          style={{
            width: 48,
            height: 48,
            borderRadius: 9999,
            position: 'relative',
            overflow: 'hidden',
            display: 'block',
            flexShrink: 0,
          }}
        >
          <Avatar user={post.author} />
        </Link>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Link
              href={profileHref}
              style={{
                font: '700 15px/1.2 var(--font-inter), Inter, sans-serif',
                color: 'var(--ink)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {post.author.name}
            </Link>
            {post.author.verified ? <VerifiedBadge /> : null}
          </div>
          <div
            style={{
              fontSize: 13,
              color: 'var(--mute)',
              marginTop: 3,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            @{post.author.handle} · {relativeTime(post.createdAt)} · {tag.label}
          </div>
        </div>
        <span
          title={`Ship score ${post.shipScore}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '5px 10px',
            borderRadius: 9999,
            font: '700 12px/1 var(--font-inter), Inter, sans-serif',
            ...score,
          }}
        >
          <StarGlyph />
          {post.shipScore}
        </span>
      </div>

      <div style={{ margin: '14px 0 10px' }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            padding: '5px 12px',
            borderRadius: 9999,
            font: '700 12px/1 var(--font-inter), Inter, sans-serif',
            color: 'var(--ink)',
            background: tag.bg,
          }}
        >
          <span style={{ width: 8, height: 8, borderRadius: 9999, background: tag.dot }} />
          {tag.label}
        </span>
      </div>

      <p style={{ fontSize: 16, lineHeight: 1.6, color: 'var(--ink)', margin: 0, whiteSpace: 'pre-wrap' }}>{post.body}</p>

      {post.metrics && post.metrics.length > 0 ? (
        <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
          {post.metrics.map((m, i) => (
            <div key={i} style={{ background: 'var(--soft)', borderRadius: 16, padding: '14px 16px' }}>
              <div style={{ fontFamily: 'var(--font-manrope), Manrope', fontWeight: 800, fontSize: 24, letterSpacing: '-.02em', color: 'var(--ink)' }}>
                {m.value}
              </div>
              <div style={{ fontSize: 12, color: 'var(--body)', marginTop: 3 }}>{m.label}</div>
            </div>
          ))}
        </div>
      ) : null}

      {post.imageUrl ? (
        <div style={{ marginTop: 16, borderRadius: 18, overflow: 'hidden', border: '1px solid var(--border)', position: 'relative' }}>
          <Image
            src={post.imageUrl}
            alt=""
            width={1200}
            height={750}
            sizes="(max-width: 860px) 100vw, 600px"
            style={{ width: '100%', height: 'auto', display: 'block' }}
          />
        </div>
      ) : null}

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 16, fontSize: 13, color: 'var(--mute)' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 18, height: 18, borderRadius: 9999, background: 'var(--primary)', display: 'grid', placeItems: 'center' }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#163300" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </span>
          {compactCount(optimisticRespect.count)} respects
        </span>
        <span style={{ marginLeft: 'auto' }}>
          {post.commentCount} comments · {post.repostCount} boosts
        </span>
      </div>

      <div style={{ display: 'flex', gap: 4, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
        <button
          onClick={onRespect}
          aria-pressed={optimisticRespect.on}
          style={{ ...actionButton, color: optimisticRespect.on ? 'var(--positive)' : 'var(--body)' }}
        >
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
          Respect
        </button>
        <button onClick={openComments} aria-expanded={commentsOpen} style={{ ...actionButton, color: 'var(--body)' }}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 15a2 2 0 0 1-2 2H8l-4 4V5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2z" />
          </svg>
          Comment
        </button>
        <Link href={`/p/${post.id}`} style={{ ...actionButton, color: 'var(--body)', textDecoration: 'none' }}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 3h6v6" />
            <path d="M10 14 21 3" />
            <path d="M21 14v7H3V3h7" />
          </svg>
          Open
        </Link>
      </div>

      {commentsOpen ? (
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {comments.map((c) => (
            <div key={c.id} style={{ display: 'flex', gap: 10 }}>
              <Link href={`/u/${c.author.handle}`} style={{ width: 32, height: 32, borderRadius: 9999, position: 'relative', overflow: 'hidden', display: 'block', flexShrink: 0 }}>
                <Avatar user={c.author} />
              </Link>
              <div style={{ background: 'var(--soft)', borderRadius: 16, padding: '10px 14px', flex: 1 }}>
                <div style={{ font: '700 13px/1 var(--font-inter), Inter, sans-serif', color: 'var(--ink)', marginBottom: 4 }}>
                  {c.author.name}
                </div>
                <div style={{ fontSize: 14, lineHeight: 1.45, color: 'var(--body)' }}>{c.body}</div>
              </div>
            </div>
          ))}

          {loadedComments && comments.length === 0 ? (
            <p style={{ margin: 0, fontSize: 14, color: 'var(--mute)' }}>No replies yet. Be the first.</p>
          ) : null}

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ width: 32, height: 32, borderRadius: 9999, position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
              <Avatar user={viewer} />
            </div>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              placeholder="Add a builder reply…"
              aria-label="Add a reply"
              style={{
                flex: 1,
                background: 'var(--soft)',
                border: '1px solid var(--border)',
                borderRadius: 9999,
                padding: '10px 16px',
                fontSize: 14,
                color: 'var(--ink)',
              }}
            />
            <button
              onClick={send}
              disabled={sending || !draft.trim()}
              style={{
                background: 'var(--primary)',
                color: '#163300',
                border: 'none',
                borderRadius: 9999,
                padding: '10px 16px',
                font: '600 14px/1 var(--font-inter), Inter, sans-serif',
                cursor: 'pointer',
                opacity: sending || !draft.trim() ? 0.6 : 1,
              }}
            >
              Reply
            </button>
          </div>
        </div>
      ) : null}
    </article>
  );
}

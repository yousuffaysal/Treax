import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { requireViewer } from '@/lib/session';
import { getPostById, relativeTime } from '@/lib/feed';
import { TAG_META, compactCount, scoreStyle, type PostTag } from '@/lib/types';
import { ReadingProgress } from '@/components/feed/reading-progress';
import { PostActions } from './post-actions';
import { db } from '@/lib/db';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const post = await db.post.findFirst({
    where: { id, filterVerdict: 'ACCEPTED' },
    select: { body: true, author: { select: { name: true } } },
  });
  if (!post) return { title: 'Update not found' };
  const excerpt = post.body.split('\n')[0].slice(0, 120);
  return { title: `${post.author.name} — ${excerpt}`, description: excerpt };
}

/** Reader — port of Treax.dc.html:1286-1330, backed by a real post. */
export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const viewer = await requireViewer();
  const { id } = await params;
  const post = await getPostById(id, viewer.id);
  if (!post) notFound();

  const tag = TAG_META[post.tag as PostTag];
  const score = scoreStyle(post.shipScore);
  const paragraphs = post.body.split('\n').filter((p) => p.trim().length > 0);
  const title = paragraphs[0] ?? '';
  const rest = paragraphs.slice(1);

  const following = await db.follow.findUnique({
    where: { followerId_followingId: { followerId: viewer.id, followingId: post.author.id } },
    select: { id: true },
  });

  const more = await db.post.findMany({
    where: { authorId: post.author.id, id: { not: post.id }, filterVerdict: 'ACCEPTED' },
    orderBy: { createdAt: 'desc' },
    take: 3,
    select: { id: true, body: true, tag: true, createdAt: true },
  });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--page)' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 30, background: 'var(--card)', borderBottom: '1px solid var(--border)' }}>
        <div className="sl-readbar" style={{ maxWidth: 1000, margin: '0 auto', padding: '14px 26px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link
            href="/"
            aria-label="Back to the feed"
            style={{
              width: 40,
              height: 40,
              borderRadius: 9999,
              border: '1px solid var(--border-strong)',
              background: 'var(--card)',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </Link>
          <div
            style={{
              flex: 1,
              minWidth: 0,
              font: '600 14.5px/1.3 var(--font-inter), Inter, sans-serif',
              color: 'var(--mute)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {title}
          </div>
          <PostActions
            postId={post.id}
            authorId={post.author.id}
            authorHandle={post.author.handle}
            initialRespected={post.respected}
            initialCount={post.respectCount}
            initialFollowing={Boolean(following)}
            isSelf={post.author.id === viewer.id}
            variant="bar"
          />
        </div>
        <ReadingProgress />
      </div>

      <article className="sl-article" style={{ maxWidth: 720, margin: '0 auto', padding: '54px 26px 90px' }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            background: tag.bg,
            color: 'var(--ink)',
            borderRadius: 9999,
            padding: '6px 13px',
            font: '700 12px/1 var(--font-inter), Inter, sans-serif',
            animation: 'sl-genie-in .5s cubic-bezier(.2,.85,.25,1) both',
          }}
        >
          <span style={{ width: 8, height: 8, borderRadius: 9999, background: tag.dot }} />
          {tag.label}
        </span>

        <h1
          style={{
            fontFamily: 'var(--font-manrope), Manrope',
            fontWeight: 800,
            fontSize: 44,
            lineHeight: 1.12,
            letterSpacing: '-.035em',
            color: 'var(--ink)',
            margin: '20px 0 0',
            textWrap: 'pretty',
            animation: 'sl-genie-in .55s cubic-bezier(.2,.85,.25,1) .06s both',
          }}
        >
          {title}
        </h1>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 13,
            margin: '28px 0 0',
            paddingBottom: 28,
            borderBottom: '1px solid var(--border)',
            animation: 'sl-genie-in .55s cubic-bezier(.2,.85,.25,1) .12s both',
          }}
        >
          <Link href={`/u/${post.author.handle}`} style={{ display: 'flex', alignItems: 'center', gap: 13, minWidth: 0 }}>
            <span
              style={{
                width: 46,
                height: 46,
                borderRadius: 9999,
                background: post.author.avatarColor,
                color: '#fff',
                font: '800 16px/1 var(--font-manrope), Manrope',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
              }}
            >
              {post.author.initials}
            </span>
            <span style={{ minWidth: 0 }}>
              <span style={{ display: 'block', font: '700 15.5px/1.2 var(--font-inter), Inter, sans-serif', color: 'var(--ink)' }}>
                {post.author.name}
              </span>
              <span style={{ display: 'block', fontSize: 13.5, color: 'var(--mute)', marginTop: 3 }}>
                {relativeTime(post.createdAt)} · {compactCount(post.author.followerCount)} followers
              </span>
            </span>
          </Link>
          <div style={{ flex: 1 }} />
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '6px 12px',
              borderRadius: 9999,
              font: '700 12px/1 var(--font-inter), Inter, sans-serif',
              flexShrink: 0,
              ...score,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 3l1.9 4.9L19 9.8l-4.2 3.1L16 18l-4-2.7L8 18l1.2-5.1L5 9.8l5.1-1.9z" />
            </svg>
            {post.shipScore}
          </span>
        </div>

        {rest.map((text, i) => (
          <p
            key={i}
            style={{
              fontSize: 19,
              lineHeight: 1.72,
              color: 'var(--ink)',
              margin: '26px 0 0',
              textWrap: 'pretty',
              animation: `sl-genie-in .5s cubic-bezier(.2,.85,.25,1) ${0.16 + i * 0.06}s both`,
            }}
          >
            {text}
          </p>
        ))}

        {post.metrics && (post.metrics as Array<{ value: string; label: string }>).length > 0 ? (
          <div style={{ marginTop: 30, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
            {(post.metrics as Array<{ value: string; label: string }>).map((m, i) => (
              <div key={i} style={{ background: 'var(--soft)', borderRadius: 16, padding: '16px 18px' }}>
                <div style={{ fontFamily: 'var(--font-manrope), Manrope', fontWeight: 800, fontSize: 26, letterSpacing: '-.02em', color: 'var(--ink)' }}>
                  {m.value}
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--body)', marginTop: 3 }}>{m.label}</div>
              </div>
            ))}
          </div>
        ) : null}

        {post.imageUrl ? (
          <div style={{ marginTop: 30, borderRadius: 18, overflow: 'hidden', border: '1px solid var(--border)' }}>
            <Image src={post.imageUrl} alt="" width={1200} height={750} style={{ width: '100%', height: 'auto', display: 'block' }} />
          </div>
        ) : null}

        <PostActions
          postId={post.id}
          authorId={post.author.id}
          authorHandle={post.author.handle}
          initialRespected={post.respected}
          initialCount={post.respectCount}
          initialFollowing={Boolean(following)}
          isSelf={post.author.id === viewer.id}
          variant="footer"
        />

        {/* author card */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            background: 'var(--card)',
            border: '1px solid var(--card-border)',
            borderRadius: 24,
            padding: 22,
            boxShadow: 'var(--elev)',
            marginTop: 34,
          }}
        >
          <span
            style={{
              width: 56,
              height: 56,
              borderRadius: 9999,
              background: post.author.avatarColor,
              color: '#fff',
              font: '800 20px/1 var(--font-manrope), Manrope',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            {post.author.initials}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ font: '700 16px/1.2 var(--font-inter), Inter, sans-serif', color: 'var(--ink)' }}>{post.author.name}</div>
            <p style={{ fontSize: 14.5, lineHeight: 1.55, color: 'var(--body)', margin: '6px 0 0' }}>
              {post.author.bio ?? `${post.author.focus ?? 'Builder'}${post.author.university ? ` at ${post.author.university}` : ''}`}
            </p>
          </div>
          <Link
            href={`/u/${post.author.handle}`}
            style={{
              background: 'var(--primary)',
              color: '#163300',
              borderRadius: 9999,
              padding: '11px 19px',
              font: '700 14px/1 var(--font-inter), Inter, sans-serif',
              flexShrink: 0,
            }}
          >
            Profile
          </Link>
        </div>

        {/* comments */}
        <section style={{ marginTop: 34 }}>
          <h2 style={{ font: '700 17px/1 var(--font-inter), Inter, sans-serif', color: 'var(--ink)', margin: '0 0 16px' }}>
            {post.commentCount} {post.commentCount === 1 ? 'reply' : 'replies'}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {post.comments.length === 0 ? (
              <p style={{ margin: 0, fontSize: 15, color: 'var(--mute)' }}>No replies yet. Be the first.</p>
            ) : (
              post.comments.map((c) => (
                <div key={c.id} style={{ display: 'flex', gap: 10 }}>
                  <Link
                    href={`/u/${c.author.handle}`}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 9999,
                      background: c.author.avatarColor,
                      color: '#fff',
                      font: '800 13px/1 var(--font-manrope), Manrope',
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {c.author.initials}
                  </Link>
                  <div style={{ background: 'var(--soft)', borderRadius: 16, padding: '10px 14px', flex: 1 }}>
                    <div style={{ font: '700 13px/1 var(--font-inter), Inter, sans-serif', color: 'var(--ink)', marginBottom: 4 }}>
                      {c.author.name}
                    </div>
                    <div style={{ fontSize: 14, lineHeight: 1.45, color: 'var(--body)' }}>{c.body}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* more from */}
        {more.length > 0 ? (
          <section style={{ marginTop: 40, paddingTop: 26, borderTop: '1px solid var(--border)' }}>
            <h2 style={{ font: '700 17px/1 var(--font-inter), Inter, sans-serif', color: 'var(--ink)', margin: '0 0 16px' }}>
              More from {post.author.name}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {more.map((m) => {
                const meta = TAG_META[m.tag as PostTag];
                return (
                  <Link
                    key={m.id}
                    href={`/p/${m.id}`}
                    style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 18, padding: '16px 18px', display: 'block' }}
                  >
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        font: '700 11px/1 var(--font-inter), Inter, sans-serif',
                        color: 'var(--ink)',
                        background: meta.bg,
                        borderRadius: 9999,
                        padding: '5px 10px',
                      }}
                    >
                      <span style={{ width: 7, height: 7, borderRadius: 9999, background: meta.dot }} />
                      {meta.label}
                    </span>
                    <p style={{ margin: '10px 0 0', fontSize: 15, lineHeight: 1.5, color: 'var(--ink)' }}>
                      {m.body.split('\n')[0].slice(0, 130)}
                      {m.body.length > 130 ? '…' : ''}
                    </p>
                    <span style={{ display: 'block', marginTop: 6, fontSize: 12.5, color: 'var(--mute)' }}>{relativeTime(m.createdAt)}</span>
                  </Link>
                );
              })}
            </div>
          </section>
        ) : null}
      </article>
    </div>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { requireViewer } from '@/lib/session';
import { ReadingProgress } from '@/components/feed/reading-progress';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const r = await db.learnResource.findUnique({ where: { id }, select: { title: true, excerpt: true } });
  return r ? { title: r.title, description: r.excerpt } : { title: 'Resource not found' };
}

/** Learn resource reader — same chrome as the post reader. */
export default async function LearnResourcePage({ params }: Props) {
  await requireViewer();
  const { id } = await params;

  const resource = await db.learnResource.findFirst({
    where: { id, published: true },
    select: {
      id: true,
      type: true,
      title: true,
      body: true,
      worked: true,
      failed: true,
      readTime: true,
      authorName: true,
      author: { select: { handle: true, initials: true, avatarColor: true, avatarUrl: true, bio: true } },
    },
  });
  if (!resource) notFound();

  const paragraphs = resource.body.split('\n').filter((p) => p.trim().length > 0);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--page)' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 30, background: 'var(--card)', borderBottom: '1px solid var(--border)' }}>
        <div className="sl-readbar" style={{ maxWidth: 1000, margin: '0 auto', padding: '14px 26px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link
            href="/learn"
            aria-label="Back to Learn"
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
            {resource.title}
          </div>
          <span style={{ fontSize: 13, color: 'var(--mute)', flexShrink: 0 }}>{resource.readTime}</span>
        </div>
        <ReadingProgress />
      </div>

      <article className="sl-article" style={{ maxWidth: 720, margin: '0 auto', padding: '54px 26px 90px' }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            background: 'var(--primary-pale)',
            color: 'var(--ink)',
            borderRadius: 9999,
            padding: '6px 13px',
            font: '700 12px/1 var(--font-inter), Inter, sans-serif',
          }}
        >
          {resource.type}
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
          }}
        >
          {resource.title}
        </h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: 13, margin: '28px 0 0', paddingBottom: 28, borderBottom: '1px solid var(--border)' }}>
          <span
            style={{
              width: 46,
              height: 46,
              borderRadius: 9999,
              background: resource.author?.avatarColor ?? 'var(--ink)',
              color: '#fff',
              font: '800 16px/1 var(--font-manrope), Manrope',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            {resource.author?.initials ?? resource.authorName.slice(0, 2).toUpperCase()}
          </span>
          <div>
            <div style={{ font: '700 15.5px/1.2 var(--font-inter), Inter, sans-serif', color: 'var(--ink)' }}>{resource.authorName}</div>
            <div style={{ fontSize: 13.5, color: 'var(--mute)', marginTop: 3 }}>{resource.readTime} read</div>
          </div>
          {resource.author ? (
            <>
              <div style={{ flex: 1 }} />
              <Link
                href={`/u/${resource.author.handle}`}
                style={{
                  background: 'var(--card)',
                  color: 'var(--ink)',
                  border: '1px solid var(--border-strong)',
                  borderRadius: 9999,
                  padding: '10px 18px',
                  font: '600 14px/1 var(--font-inter), Inter, sans-serif',
                  flexShrink: 0,
                }}
              >
                Profile
              </Link>
            </>
          ) : null}
        </div>

        {paragraphs.map((text, i) => (
          <p key={i} style={{ fontSize: 19, lineHeight: 1.72, color: 'var(--ink)', margin: '26px 0 0', textWrap: 'pretty' }}>
            {text}
          </p>
        ))}

        <div className="sl-grid2" style={{ marginTop: 36 }}>
          <div style={{ background: 'rgba(46,173,75,.08)', border: '1px solid rgba(46,173,75,.26)', borderRadius: 18, padding: '18px 20px' }}>
            <div style={{ font: '700 12px/1 var(--font-inter), Inter, sans-serif', color: 'var(--positive)', marginBottom: 8 }}>What worked</div>
            <div style={{ fontSize: 15, lineHeight: 1.5, color: 'var(--ink)' }}>{resource.worked}</div>
          </div>
          <div style={{ background: 'rgba(208,50,56,.07)', border: '1px solid rgba(208,50,56,.26)', borderRadius: 18, padding: '18px 20px' }}>
            <div style={{ font: '700 12px/1 var(--font-inter), Inter, sans-serif', color: 'var(--negative)', marginBottom: 8 }}>What did not</div>
            <div style={{ fontSize: 15, lineHeight: 1.5, color: 'var(--ink)' }}>{resource.failed}</div>
          </div>
        </div>
      </article>
    </div>
  );
}

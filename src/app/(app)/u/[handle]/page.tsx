import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { db } from '@/lib/db';
import { requireViewer } from '@/lib/session';
import { getRailData, getShellBadges } from '@/lib/shell-data';
import { AppShell } from '@/components/layout/app-shell';
import { relativeTime } from '@/lib/feed';
import { TAG_META, compactCount, type PostTag } from '@/lib/types';
import { ProfileHeaderActions } from './profile-actions';
import { ProfileTabs } from './profile-tabs';
import { Avatar } from '@/components/ui/avatar';

type Props = { params: Promise<{ handle: string }>; searchParams: Promise<{ tab?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const user = await db.user.findUnique({ where: { handle }, select: { name: true, bio: true, building: true } });
  if (!user) return { title: 'Builder not found' };
  return { title: user.name, description: user.bio ?? (user.building ? `Building ${user.building}` : undefined) };
}

const TABS = ['updates', 'services', 'interests', 'about'] as const;
type Tab = (typeof TABS)[number];

/** Profile — port of Treax.dc.html:758-860. */
export default async function ProfilePage({ params, searchParams }: Props) {
  const viewer = await requireViewer();
  const { handle } = await params;
  const { tab: tabParam } = await searchParams;
  const tab: Tab = (TABS as readonly string[]).includes(tabParam ?? '') ? (tabParam as Tab) : 'updates';

  const t = await getTranslations();
  const [badges, rails] = await Promise.all([getShellBadges(viewer.id), getRailData(viewer)]);

  const profile = await db.user.findUnique({
    where: { handle },
    select: {
      id: true,
      name: true,
      handle: true,
      initials: true,
      avatarColor: true, avatarUrl: true, coverUrl: true,
      verified: true,
      suspended: true,
      building: true,
      university: true,
      focus: true,
      bio: true,
      seeking: true,
      tags: true,
      streak: true,
      shipCount: true,
      respectCount: true,
      followerCount: true,
      createdAt: true,
    },
  });
  if (!profile) notFound();

  const isMe = profile.id === viewer.id;

  const [posts, services, blogs, following] = await Promise.all([
    db.post.findMany({
      where: { authorId: profile.id, filterVerdict: 'ACCEPTED' },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 20,
      select: { id: true, body: true, tag: true, shipScore: true, respectCount: true, commentCount: true, createdAt: true },
    }),
    db.service.findMany({
      where: { ownerId: profile.id, active: true },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: { id: true, title: true, description: true, price: true, cta: true, images: true },
    }),
    db.blogPost.findMany({
      where: { ownerId: profile.id },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: { id: true, title: true, excerpt: true, readTime: true, createdAt: true },
    }),
    isMe
      ? Promise.resolve(null)
      : db.follow.findUnique({
          where: { followerId_followingId: { followerId: viewer.id, followingId: profile.id } },
          select: { id: true },
        }),
  ]);

  return (
    <AppShell viewer={viewer} badges={badges} rails={rails}>
      {/* header card */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 24, overflow: 'hidden', boxShadow: 'var(--elev)' }}>
        <div style={{ height: 120, background: 'var(--primary)', position: 'relative' }}>
          {profile.coverUrl ? (
            <img src={profile.coverUrl} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                background: 'repeating-linear-gradient(135deg,transparent,transparent 18px,rgba(22,51,0,.06) 18px,rgba(22,51,0,.06) 36px)',
              }}
            />
          )}
        </div>
        <div style={{ position: 'relative', zIndex: 1, padding: '0 26px 26px', marginTop: -42 }}>
          <div style={{
              width: 88,
              height: 88,
              borderRadius: 9999,
              border: '4px solid var(--card)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Avatar user={profile} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2
                  style={{
                    fontFamily: 'var(--font-manrope), Manrope',
                    fontWeight: 800,
                    fontSize: 28,
                    letterSpacing: '-.02em',
                    color: 'var(--ink)',
                    margin: 0,
                  }}
                >
                  {profile.name}
                </h2>
                {profile.verified ? (
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="var(--primary)" aria-label="Verified builder">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M17 9l-5.5 5.5L8 11" stroke="#163300" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : null}
                {profile.suspended ? (
                  <span
                    style={{
                      background: 'rgba(208,50,56,.14)',
                      color: 'var(--negative)',
                      font: '700 11px/1 var(--font-inter), Inter, sans-serif',
                      padding: '5px 10px',
                      borderRadius: 9999,
                    }}
                  >
                    Suspended
                  </span>
                ) : null}
              </div>
              <p style={{ fontSize: 15, color: 'var(--mute)', margin: '4px 0 0' }}>
                @{profile.handle}
                {profile.building ? ` · Building ${profile.building}` : ''}
              </p>
              {profile.bio ? (
                <p style={{ fontSize: 15, lineHeight: 1.5, color: 'var(--body)', margin: '12px 0 0', maxWidth: '52ch' }}>{profile.bio}</p>
              ) : null}
            </div>

            <ProfileHeaderActions
              isMe={isMe}
              targetId={profile.id}
              targetHandle={profile.handle}
              initialFollowing={Boolean(following)}
              editLabel={t('editProfile')}
              connectLabel={t('connect')}
              messageLabel={t('message')}
              followLabel={t('follow')}
              followingLabel={t('following')}
              profile={{
                name: profile.name,
                handle: profile.handle,
                university: profile.university ?? '',
                focus: profile.focus ?? '',
                building: profile.building ?? '',
                bio: profile.bio ?? '',
                seeking: profile.seeking ?? '',
                avatarColor: profile.avatarColor,
                coverUrl: profile.coverUrl,
                tags: profile.tags,
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 28, marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
            <Stat value={profile.streak} label="day streak" />
            <Stat value={profile.shipCount} label="updates" />
            <Stat value={compactCount(profile.respectCount)} label="backers earned" />
            <Stat value={compactCount(profile.followerCount)} label="followers" />
          </div>
        </div>
      </div>

      <ProfileTabs
        handle={profile.handle}
        active={tab}
        labels={{
          updates: t('updates'),
          services: t('servicesTitle'),
          interests: t('interests'),
          about: t('about'),
        }}
      />

      {tab === 'updates' ? (
        posts.length === 0 ? (
          <Empty text={isMe ? 'You have not posted an update yet.' : `${profile.name} has not posted yet.`} />
        ) : (
          posts.map((p) => {
            const meta = TAG_META[p.tag as PostTag];
            return (
              <article
                key={p.id}
                style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 24, padding: 22, boxShadow: 'var(--elev)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'space-between' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 7,
                      padding: '5px 12px',
                      borderRadius: 9999,
                      font: '700 12px/1 var(--font-inter), Inter, sans-serif',
                      color: 'var(--ink)',
                      background: meta.bg,
                    }}
                  >
                    <span style={{ width: 8, height: 8, borderRadius: 9999, background: meta.dot }} />
                    {meta.label}
                  </span>
                  <span style={{ fontSize: 13, color: 'var(--mute)' }}>{relativeTime(p.createdAt)}</span>
                </div>
                <Link href={`/p/${p.id}`}>
                  <p style={{ fontSize: 16, lineHeight: 1.6, color: 'var(--ink)', margin: '14px 0 0', whiteSpace: 'pre-wrap' }}>{p.body}</p>
                </Link>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 14, fontSize: 13, color: 'var(--mute)' }}>
                  <span>{compactCount(p.respectCount)} respects</span>
                  <span>{p.commentCount} comments</span>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '4px 9px',
                      borderRadius: 9999,
                      background: 'var(--soft)',
                      color: 'var(--body)',
                      font: '700 12px/1 var(--font-inter), Inter, sans-serif',
                    }}
                  >
                    Ship {p.shipScore}
                  </span>
                </div>
              </article>
            );
          })
        )
      ) : null}

      {tab === 'services' ? (
        <ServicesTab isMe={isMe} services={services} blogs={blogs} noServices={t('noServices')} noBlogs={t('noBlogs')} />
      ) : null}

      {tab === 'interests' ? (
        <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 24, padding: 24, boxShadow: 'var(--elev)' }}>
          <h3 style={{ font: '700 17px/1 var(--font-inter), Inter, sans-serif', color: 'var(--ink)', margin: '0 0 14px' }}>{t('interests')}</h3>
          {profile.tags.length === 0 ? (
            <p style={{ margin: 0, fontSize: 15, color: 'var(--mute)' }}>No interests listed yet.</p>
          ) : (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {profile.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    padding: '8px 15px',
                    borderRadius: 9999,
                    background: 'var(--soft)',
                    color: 'var(--ink)',
                    font: '600 13px/1 var(--font-inter), Inter, sans-serif',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {tab === 'about' ? (
        <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 24, padding: 24, boxShadow: 'var(--elev)' }}>
          <h3 style={{ font: '700 17px/1 var(--font-inter), Inter, sans-serif', color: 'var(--ink)', margin: '0 0 16px' }}>{t('about')}</h3>
          <dl style={{ display: 'grid', gap: 14, margin: 0 }}>
            <Row label="University" value={profile.university} />
            <Row label="Focus" value={profile.focus} />
            <Row label="Building" value={profile.building} />
            <Row label="Looking for" value={profile.seeking} />
            <Row label="On Treax since" value={profile.createdAt.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })} />
          </dl>
        </div>
      ) : null}
    </AppShell>
  );
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div>
      <div style={{ font: '800 22px/1 var(--font-manrope), Manrope', color: 'var(--ink)' }}>{value}</div>
      <div style={{ fontSize: 13, color: 'var(--mute)', marginTop: 4 }}>{label}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'baseline' }}>
      <dt style={{ minWidth: 130, fontSize: 13, color: 'var(--mute)' }}>{label}</dt>
      <dd style={{ margin: 0, fontSize: 15, color: 'var(--ink)' }}>{value || '—'}</dd>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1px solid var(--card-border)',
        borderRadius: 24,
        padding: 40,
        textAlign: 'center',
        boxShadow: 'var(--elev)',
        color: 'var(--mute)',
        fontSize: 15,
      }}
    >
      {text}
    </div>
  );
}

function ServicesTab({
  isMe,
  services,
  blogs,
  noServices,
  noBlogs,
}: {
  isMe: boolean;
  services: Array<{ id: string; title: string; description: string; price: string; cta: string; images: string[] }>;
  blogs: Array<{ id: string; title: string; excerpt: string; readTime: string; createdAt: Date }>;
  noServices: string;
  noBlogs: string;
}) {
  return (
    <>
      <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 24, padding: 24, boxShadow: 'var(--elev)' }}>
        <h3 style={{ font: '700 17px/1 var(--font-inter), Inter, sans-serif', color: 'var(--ink)', margin: '0 0 14px' }}>Services</h3>
        {services.length === 0 ? (
          <p style={{ margin: 0, fontSize: 15, color: 'var(--mute)' }}>{noServices}</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {services.map((s) => (
              <div key={s.id} style={{ background: 'var(--soft)', borderRadius: 18, padding: '16px 18px' }}>
                <div style={{ font: '700 15px/1.3 var(--font-inter), Inter, sans-serif', color: 'var(--ink)' }}>{s.title}</div>
                <p style={{ margin: '6px 0 0', fontSize: 14, lineHeight: 1.5, color: 'var(--body)' }}>{s.description}</p>
                <div style={{ marginTop: 10, font: '700 14px/1 var(--font-manrope), Manrope', color: 'var(--ink)' }}>{s.price}</div>
              </div>
            ))}
          </div>
        )}
        {isMe ? (
          <Link
            href="/market?new=service"
            style={{
              display: 'inline-block',
              marginTop: 16,
              background: 'var(--primary)',
              color: '#163300',
              borderRadius: 9999,
              padding: '11px 20px',
              font: '600 14px/1 var(--font-inter), Inter, sans-serif',
            }}
          >
            Add a service
          </Link>
        ) : null}
      </div>

      <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 24, padding: 24, boxShadow: 'var(--elev)' }}>
        <h3 style={{ font: '700 17px/1 var(--font-inter), Inter, sans-serif', color: 'var(--ink)', margin: '0 0 14px' }}>Blog</h3>
        {blogs.length === 0 ? (
          <p style={{ margin: 0, fontSize: 15, color: 'var(--mute)' }}>{noBlogs}</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {blogs.map((b) => (
              <div key={b.id} style={{ background: 'var(--soft)', borderRadius: 18, padding: '16px 18px' }}>
                <div style={{ font: '700 15px/1.3 var(--font-inter), Inter, sans-serif', color: 'var(--ink)' }}>{b.title}</div>
                <p style={{ margin: '6px 0 0', fontSize: 14, lineHeight: 1.5, color: 'var(--body)' }}>{b.excerpt}</p>
                <div style={{ marginTop: 8, fontSize: 12.5, color: 'var(--mute)' }}>
                  {b.readTime} · {relativeTime(b.createdAt)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

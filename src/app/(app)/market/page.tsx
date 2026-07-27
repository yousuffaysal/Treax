import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { db } from '@/lib/db';
import { requireViewer } from '@/lib/session';
import { getRailData, getShellBadges } from '@/lib/shell-data';
import { AppShell } from '@/components/layout/app-shell';
import { ChipRow, EmptyState, PageHeader } from '@/components/ui/page-header';
import { HireButton } from './hire-button';
import { NewServiceSheet } from './new-service-sheet';

export const metadata: Metadata = { title: 'Market' };

const CATEGORIES = ['All', 'Logo & Branding', 'Landing Pages', 'Social Media', 'Video Editing', 'Data & AI', 'Tutoring'];

/** Skill marketplace — services created by builders, hire requests open a chat. */
export default async function MarketPage({ searchParams }: { searchParams: Promise<{ new?: string }> }) {
  const viewer = await requireViewer();
  const { new: newParam } = await searchParams;
  const [badges, rails, services] = await Promise.all([
    getShellBadges(viewer.id),
    getRailData(viewer),
    db.service.findMany({
      where: { active: true, owner: { suspended: false } },
      orderBy: [{ orderCount: 'desc' }, { createdAt: 'desc' }],
      take: 40,
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        price: true,
        cta: true,
        images: true,
        rating: true,
        orderCount: true,
        deliveryDays: true,
        owner: { select: { id: true, name: true, handle: true, initials: true, avatarColor: true, university: true } },
      },
    }),
  ]);

  return (
    <AppShell viewer={viewer} badges={badges} rails={rails}>
      <PageHeader
        title="Skill Marketplace"
        subtitle="Hire another student builder, or turn what you're good at into a listing. Every seller is a builder on Treax."
      >
        <ChipRow items={CATEGORIES} />
      </PageHeader>

      <NewServiceSheet openInitially={newParam === 'service'} />

      {services.length === 0 ? (
        <EmptyState title="No services listed yet." body="Be the first — list what you can do for other builders." />
      ) : (
        <div className="sl-grid2">
          {services.map((s) => (
            <div
              key={s.id}
              style={{
                background: 'var(--card)',
                border: '1px solid var(--card-border)',
                borderRadius: 24,
                overflow: 'hidden',
                boxShadow: 'var(--elev)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  height: 160,
                  position: 'relative',
                  background: 'repeating-linear-gradient(135deg,var(--soft),var(--soft) 11px,var(--soft-2) 11px,var(--soft-2) 22px)',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                {s.images[0] ? (
                  <Image src={s.images[0]} alt="" fill sizes="(max-width: 860px) 100vw, 380px" style={{ objectFit: 'cover' }} />
                ) : (
                  <span
                    style={{
                      fontFamily: 'var(--font-jetbrains), JetBrains Mono, monospace',
                      fontSize: 12,
                      color: 'var(--mute)',
                      background: 'var(--card)',
                      padding: '6px 12px',
                      borderRadius: 9999,
                    }}
                  >
                    {s.category ?? 'service'}
                  </span>
                )}
              </div>

              <div style={{ padding: 20, display: 'flex', flexDirection: 'column', flex: 1 }}>
                <Link href={`/u/${s.owner.handle}`} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 9999,
                      background: s.owner.avatarColor,
                      color: '#fff',
                      font: '800 13px/1 var(--font-manrope), Manrope',
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {s.owner.initials}
                  </span>
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: 'block', font: '700 13.5px/1.2 var(--font-inter), Inter, sans-serif', color: 'var(--ink)' }}>
                      {s.owner.name}
                    </span>
                    {s.owner.university ? (
                      <span style={{ display: 'block', fontSize: 12, color: 'var(--mute)', marginTop: 2 }}>{s.owner.university}</span>
                    ) : null}
                  </span>
                </Link>

                <h3 style={{ font: '700 16px/1.35 var(--font-inter), Inter, sans-serif', color: 'var(--ink)', margin: '14px 0 0' }}>{s.title}</h3>
                <p style={{ margin: '8px 0 0', fontSize: 14, lineHeight: 1.5, color: 'var(--body)' }}>{s.description}</p>

                <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '14px 0', fontSize: 13, color: 'var(--mute)' }}>
                  {s.rating > 0 ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--ink)', fontWeight: 700 }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="var(--warning)" aria-hidden="true">
                        <path d="M12 3l1.9 4.9L19 9.8l-4.2 3.1L16 18l-4-2.7L8 18l1.2-5.1L5 9.8l5.1-1.9z" />
                      </svg>
                      {s.rating.toFixed(1)}
                    </span>
                  ) : null}
                  {s.orderCount > 0 ? <span>{s.orderCount} orders</span> : <span>New listing</span>}
                  <span>{s.deliveryDays}d delivery</span>
                </div>

                <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <span style={{ font: '800 19px/1 var(--font-manrope), Manrope', color: 'var(--ink)' }}>{s.price}</span>
                  {s.owner.id === viewer.id ? (
                    <span style={{ fontSize: 13, color: 'var(--mute)' }}>Your listing</span>
                  ) : (
                    <HireButton serviceId={s.id} sellerName={s.owner.name} cta={s.cta} />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}

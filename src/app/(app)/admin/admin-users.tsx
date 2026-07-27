'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { useToast } from '@/components/providers/toast-provider';
import { awardBadge, setSuspended, setVerified } from './admin-actions';

type AdminUser = {
  id: string;
  name: string;
  handle: string;
  email: string;
  initials: string;
  avatarColor: string;
  role: string;
  verified: boolean;
  suspended: boolean;
  badge: string | null;
  shipCount: number;
  university: string | null;
};

const BADGES = ['Rising', 'Shipper', 'Mentor', 'Top builder'];

const smallButton: React.CSSProperties = {
  borderRadius: 9999,
  padding: '8px 14px',
  font: '600 12.5px/1 var(--font-inter), Inter, sans-serif',
  cursor: 'pointer',
  border: '1px solid var(--border-strong)',
  background: 'var(--card)',
  color: 'var(--ink)',
};

export function AdminUsers({ users, viewerId }: { users: AdminUser[]; viewerId: string }) {
  const router = useRouter();
  const { flash, error } = useToast();
  const [query, setQuery] = useState('');
  const [badgePick, setBadgePick] = useState(BADGES[0]);
  const [, startTransition] = useTransition();

  const filtered = users.filter((u) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return [u.name, u.handle, u.email, u.university ?? ''].some((v) => v.toLowerCase().includes(q));
  });

  function act(run: () => Promise<{ ok: true; data: unknown } | { ok: false; error: string }>, success: string) {
    startTransition(async () => {
      const result = await run();
      if (!result.ok) return error(result.error);
      flash(success);
      router.refresh();
    });
  }

  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 22, padding: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, handle, email or university"
          aria-label="Search users"
          style={{
            flex: 1,
            minWidth: 220,
            background: 'var(--soft)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '11px 15px',
            fontSize: 14,
            color: 'var(--ink)',
          }}
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--mute)' }}>
          Next badge
          <select
            value={badgePick}
            onChange={(e) => setBadgePick(e.target.value)}
            style={{
              background: 'var(--soft)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              padding: '9px 12px',
              fontSize: 13.5,
              color: 'var(--ink)',
            }}
          >
            {BADGES.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </label>
      </div>

      {filtered.length === 0 ? (
        <p style={{ margin: 0, fontSize: 15, color: 'var(--mute)' }}>No users match that search.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((u) => {
            const isSelf = u.id === viewerId;
            return (
              <div
                key={u.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  background: 'var(--soft)',
                  borderRadius: 18,
                  padding: '14px 16px',
                  flexWrap: 'wrap',
                }}
              >
                <Link
                  href={`/u/${u.handle}`}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 9999,
                    background: u.avatarColor,
                    color: '#fff',
                    font: '800 14px/1 var(--font-manrope), Manrope',
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                  }}
                >
                  {u.initials}
                </Link>

                <div style={{ flex: 1, minWidth: 160 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                    <span style={{ font: '700 14.5px/1.2 var(--font-inter), Inter, sans-serif', color: 'var(--ink)' }}>{u.name}</span>
                    {u.verified ? <Tag tone="positive">verified</Tag> : null}
                    {u.suspended ? <Tag tone="negative">suspended</Tag> : null}
                    {u.role !== 'BUILDER' ? <Tag tone="neutral">{u.role.toLowerCase()}</Tag> : null}
                    {u.badge ? <Tag tone="brand">{u.badge}</Tag> : null}
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--mute)', marginTop: 3 }}>
                    @{u.handle} · {u.email} · {u.shipCount} updates
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => act(() => setVerified(u.id, !u.verified), u.verified ? `${u.name} is no longer verified.` : `${u.name} is now a verified builder.`)}
                    style={smallButton}
                  >
                    {u.verified ? 'Unverify' : 'Verify'}
                  </button>
                  <button
                    onClick={() =>
                      act(
                        () => awardBadge({ userId: u.id, badge: u.badge ? '' : badgePick }),
                        u.badge ? `Badge removed from ${u.name}.` : `“${badgePick}” badge awarded to ${u.name}.`,
                      )
                    }
                    style={smallButton}
                  >
                    {u.badge ? 'Remove badge' : 'Award badge'}
                  </button>
                  <button
                    onClick={() => act(() => setSuspended(u.id, !u.suspended), u.suspended ? `${u.name} reinstated.` : `${u.name} suspended.`)}
                    disabled={isSelf}
                    title={isSelf ? 'You cannot suspend your own account.' : undefined}
                    style={{
                      ...smallButton,
                      borderColor: u.suspended ? 'var(--border-strong)' : 'rgba(208,50,56,.4)',
                      color: u.suspended ? 'var(--ink)' : 'var(--negative)',
                      opacity: isSelf ? 0.4 : 1,
                      cursor: isSelf ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {u.suspended ? 'Reinstate' : 'Suspend'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Tag({ children, tone }: { children: React.ReactNode; tone: 'positive' | 'negative' | 'neutral' | 'brand' }) {
  const tones = {
    positive: { background: 'rgba(46,173,75,.14)', color: 'var(--positive)' },
    negative: { background: 'rgba(208,50,56,.14)', color: 'var(--negative)' },
    neutral: { background: 'var(--card)', color: 'var(--body)' },
    brand: { background: 'var(--primary-pale)', color: 'var(--ink)' },
  } as const;
  return (
    <span
      style={{
        font: '700 10.5px/1 var(--font-inter), Inter, sans-serif',
        textTransform: 'uppercase',
        letterSpacing: '.05em',
        padding: '4px 8px',
        borderRadius: 9999,
        ...tones[tone],
      }}
    >
      {children}
    </span>
  );
}

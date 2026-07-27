import type { ReactNode } from 'react';
import { BrandMark } from '@/components/ui/icons';

/**
 * The split auth frame — port of Treax.dc.html:1077-1093 (login) and 1120-1136
 * (signup share the same aside). The aside collapses below 900px via `.sl-auth`.
 */

const asideBullets = [
  {
    text: 'Find what you’re good at by doing, not by guessing.',
    path: <><circle cx="12" cy="12" r="10" /><path d="M16.2 8.2l-2 6.1-6.1 2 2-6.1z" /></>,
  },
  {
    text: 'Join a team before you ever have your own idea.',
    path: (
      <>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      </>
    ),
  },
  {
    text: 'Every update you post builds a record of who you’re becoming.',
    path: <path d="M12 20V10M18 20V4M6 20v-4" />,
  },
];

export function AuthLayout({
  children,
  /** Login is a 404px column; signup is a taller, scrollable 560px one. */
  variant = 'compact',
}: {
  children: ReactNode;
  variant?: 'compact' | 'wide';
}) {
  const wide = variant === 'wide';
  return (
    <div className="sl-auth">
      <aside
        className="sl-auth-aside"
        style={{
          background: 'var(--ink)',
          color: '#fff',
          padding: '56px 48px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: 48,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <span style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--primary)', display: 'grid', placeItems: 'center' }}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#163300" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 19l7-14 7 14-7-4z" />
            </svg>
          </span>
          <span style={{ fontFamily: 'var(--font-manrope), Manrope', fontWeight: 800, fontSize: 20, letterSpacing: '-.02em' }}>Treax</span>
        </div>

        <div>
          <h1
            style={{
              fontFamily: 'var(--font-manrope), Manrope',
              fontWeight: 800,
              fontSize: 44,
              lineHeight: 1.08,
              letterSpacing: '-.035em',
              margin: 0,
              textWrap: 'pretty',
            }}
          >
            You don’t need an idea to join.
            <br />
            <span style={{ color: 'var(--primary)' }}>You just need to show up.</span>
          </h1>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 34 }}>
            {asideBullets.map((b, i) => (
              <div key={i} style={{ display: 'flex', gap: 13, alignItems: 'flex-start' }}>
                <svg
                  width="19"
                  height="19"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--primary)"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ flexShrink: 0, marginTop: 2 }}
                  aria-hidden="true"
                >
                  {b.path}
                </svg>
                <span style={{ fontSize: 15, lineHeight: 1.5, color: 'rgba(255,255,255,.72)' }}>{b.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ fontSize: 13, color: 'rgba(255,255,255,.42)' }}>Built by students, for students · Dhaka</div>
      </aside>

      <main
        className={wide ? 'sl-scroll sl-authmain' : 'sl-authmain'}
        style={{
          display: 'flex',
          alignItems: wide ? 'flex-start' : 'center',
          justifyContent: 'center',
          padding: wide ? '48px 32px 72px' : '56px 32px',
          background: 'var(--page)',
          ...(wide ? { overflowY: 'auto', maxHeight: '100vh' } : {}),
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: wide ? 560 : 404,
            ...(wide ? {} : { animation: 'sl-genie-in .6s cubic-bezier(.2,.85,.25,1) both' }),
          }}
        >
          {/* Shown only below 900px, where the aside is hidden */}
          <div className="sl-authbrand" style={{ display: 'none', alignItems: 'center', gap: 10, marginBottom: 22 }}>
            <span
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                background: 'var(--primary)',
                display: 'grid',
                placeItems: 'center',
                color: '#163300',
                flexShrink: 0,
              }}
            >
              <BrandMark size={20} />
            </span>
            <span style={{ fontFamily: 'var(--font-manrope), Manrope', fontWeight: 800, fontSize: 22, letterSpacing: '-.02em', color: 'var(--ink)' }}>
              Treax
            </span>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}

// ── shared form primitives, matching the prototype's input styling ───────────

export const authInputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: 14,
  padding: '13px 15px',
  fontSize: 15,
  color: 'var(--ink)',
};

export const authLabelStyle: React.CSSProperties = {
  display: 'block',
  font: '600 13px/1 var(--font-inter), Inter, sans-serif',
  color: 'var(--ink)',
  marginBottom: 8,
};

export const authPrimaryButtonStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--primary)',
  color: '#163300',
  border: 'none',
  borderRadius: 9999,
  padding: 15,
  font: '700 15px/1 var(--font-inter), Inter, sans-serif',
  cursor: 'pointer',
  transition: 'transform .18s cubic-bezier(.2,.85,.25,1)',
};

export const authSecondaryButtonStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--card)',
  color: 'var(--ink)',
  border: '1px solid var(--border-strong)',
  borderRadius: 9999,
  padding: 14,
  font: '600 15px/1 var(--font-inter), Inter, sans-serif',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 9,
};

export function AuthDivider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '24px 0' }}>
      <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      <span style={{ fontSize: 12, color: 'var(--mute)' }}>or</span>
      <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    </div>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" style={{ margin: '8px 2px 0', fontSize: 13, color: 'var(--negative)' }}>
      {message}
    </p>
  );
}

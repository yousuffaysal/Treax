import type { ReactNode } from 'react';

/** Section heading card used by Team, Market, Learn and Experts. */
export function PageHeader({
  title,
  subtitle,
  dark = false,
  children,
}: {
  title: string;
  subtitle: string;
  /** Experts and the AI panel use the ink-on-dark treatment from the prototype. */
  dark?: boolean;
  children?: ReactNode;
}) {
  return (
    <div
      style={{
        background: dark ? '#13150d' : 'var(--card)',
        border: dark ? '1px solid rgba(255,255,255,.07)' : '1px solid var(--card-border)',
        borderRadius: 24,
        padding: dark ? 28 : 24,
        boxShadow: 'var(--elev)',
      }}
    >
      <h1
        style={{
          fontFamily: 'var(--font-manrope), Manrope',
          fontWeight: 800,
          fontSize: dark ? 30 : 28,
          letterSpacing: '-.02em',
          color: dark ? 'var(--primary)' : 'var(--ink)',
          margin: '0 0 6px',
        }}
      >
        {title}
      </h1>
      <p
        style={{
          fontSize: 15,
          lineHeight: 1.5,
          color: dark ? 'rgba(255,255,255,.72)' : 'var(--body)',
          margin: children ? '0 0 18px' : 0,
          maxWidth: '62ch',
        }}
      >
        {subtitle}
      </p>
      {children}
    </div>
  );
}

/** Pill row used for category filters. */
export function ChipRow({ items, dark = false }: { items: string[]; dark?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {items.map((item) => (
        <span
          key={item}
          style={{
            padding: '8px 15px',
            borderRadius: 9999,
            background: dark ? 'rgba(255,255,255,.08)' : 'var(--soft)',
            color: dark ? '#fff' : 'var(--ink)',
            font: '600 13px/1 var(--font-inter), Inter, sans-serif',
          }}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
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
      <p style={{ margin: '0 0 6px', font: '700 17px/1.3 var(--font-inter), Inter, sans-serif', color: 'var(--ink)' }}>{title}</p>
      <p style={{ margin: 0, fontSize: 15, color: 'var(--body)' }}>{body}</p>
    </div>
  );
}

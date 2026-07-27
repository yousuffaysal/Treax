'use client';

import Link from 'next/link';

/** Profile tab strip — Treax.dc.html:787-791. */
export function ProfileTabs({
  handle,
  active,
  labels,
}: {
  handle: string;
  active: string;
  labels: Record<string, string>;
}) {
  const tabs = [
    { key: 'updates', label: labels.updates },
    { key: 'services', label: labels.services },
    { key: 'interests', label: labels.interests },
    { key: 'about', label: labels.about },
  ];

  return (
    <div
      style={{
        display: 'flex',
        gap: 6,
        alignItems: 'center',
        background: 'var(--card)',
        border: '1px solid var(--card-border)',
        borderRadius: 9999,
        padding: 6,
        boxShadow: 'var(--elev)',
      }}
    >
      {tabs.map((tab) => {
        const on = tab.key === active;
        return (
          <Link
            key={tab.key}
            href={tab.key === 'updates' ? `/u/${handle}` : `/u/${handle}?tab=${tab.key}`}
            aria-current={on ? 'page' : undefined}
            style={{
              flex: 1,
              textAlign: 'center',
              padding: 10,
              borderRadius: 9999,
              font: '600 14px/1 var(--font-inter), Inter, sans-serif',
              transition: 'background .18s ease, color .18s ease',
              background: on ? 'var(--ink)' : 'transparent',
              color: on ? 'var(--card)' : 'var(--body)',
            }}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}

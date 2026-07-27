import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { ExpertsIcon, LearnIcon } from '@/components/ui/icons';

/**
 * "More on Treax" — port of Treax.dc.html:467-477 with the entries from
 * mobTools (Treax.dc.html:3639-3641). Hidden on desktop; the CSS rule
 * `.sl-mobtools{display:block}` reveals it at <=860px, where Learn and
 * Experts drop out of the floating dock.
 */
export async function MobileTools() {
  const t = await getTranslations();

  const tools = [
    { href: '/learn', label: t('learn'), Icon: LearnIcon },
    { href: '/experts', label: t('experts'), Icon: ExpertsIcon },
  ];

  return (
    <div
      className="sl-mobtools"
      style={{
        display: 'none',
        background: 'var(--card)',
        border: '1px solid var(--card-border)',
        borderRadius: 24,
        padding: 14,
        marginBottom: 16,
        boxShadow: 'var(--elev)',
      }}
    >
      <div
        style={{
          font: '700 12px/1 var(--font-inter), Inter, sans-serif',
          letterSpacing: '.08em',
          textTransform: 'uppercase',
          color: 'var(--mute)',
          margin: '2px 2px 12px',
        }}
      >
        {t('moreTools')}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10 }}>
        {tools.map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 9,
              background: 'var(--soft)',
              border: '1px solid var(--card-border)',
              borderRadius: 18,
              padding: '16px 8px',
              cursor: 'pointer',
              color: 'var(--ink)',
            }}
          >
            <span style={{ width: 38, height: 38, borderRadius: 12, background: 'var(--card)', display: 'grid', placeItems: 'center' }}>
              <Icon size={20} />
            </span>
            <span style={{ font: '700 13px/1 var(--font-inter), Inter, sans-serif' }}>{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

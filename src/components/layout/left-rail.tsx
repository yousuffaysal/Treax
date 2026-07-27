import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import type { Viewer } from '@/lib/types';
import { compactCount } from '@/lib/types';
import { AI_TOOLS } from '@/lib/ai/tools';
import {
  AgentIcon,
  CogIcon,
  FilterStarIcon,
  GameIcon,
  PersonIcon,
  PlusIcon,
  ShieldIcon,
  StarSolidIcon,
  StudioIcon,
} from '@/components/ui/icons';

/** Left rail — port of Treax.dc.html:409-460. */

const card: React.CSSProperties = {
  background: 'var(--card)',
  border: '1px solid var(--card-border)',
  borderRadius: 24,
  boxShadow: 'var(--elev)',
};

const railLink: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: '11px 14px',
  borderRadius: 14,
  color: 'var(--ink)',
  font: '600 14px/1 var(--font-inter), Inter, sans-serif',
  textAlign: 'left',
  width: '100%',
};

const pill: React.CSSProperties = {
  marginLeft: 'auto',
  fontSize: 11,
  color: '#163300',
  background: 'var(--primary)',
  padding: '3px 8px',
  borderRadius: 9999,
  fontWeight: 700,
};

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div>
      <div style={{ font: '800 18px/1 var(--font-manrope), Manrope', color: 'var(--ink)' }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--mute)', marginTop: 3 }}>{label}</div>
    </div>
  );
}

export async function LeftRail({ viewer }: { viewer: Viewer }) {
  const t = await getTranslations();
  const profileHref = `/u/${viewer.handle}`;
  const smartTools = AI_TOOLS.slice(0, 3);

  return (
    <aside className="sl-left" style={{ position: 'sticky', top: 84, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Identity card */}
      <div style={{ ...card, overflow: 'hidden' }}>
        <div style={{ height: 60, background: 'var(--primary)' }} />
        <div style={{ padding: '0 20px 20px', marginTop: -30 }}>
          <Link
            href={profileHref}
            style={{
              width: 60,
              height: 60,
              borderRadius: 9999,
              border: '3px solid var(--card)',
              background: viewer.avatarColor,
              color: '#fff',
              font: '800 22px/1 var(--font-manrope), Manrope',
              cursor: 'pointer',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            {viewer.initials}
          </Link>
          <h3 style={{ font: '700 18px/1.2 var(--font-inter), Inter, sans-serif', color: 'var(--ink)', margin: '12px 0 2px' }}>
            {viewer.name}
          </h3>
          <p style={{ fontSize: 13, color: 'var(--mute)', margin: 0 }}>
            {viewer.building ? `Building ${viewer.building}` : `@${viewer.handle}`}
          </p>
          <div style={{ display: 'flex', gap: 16, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <Stat value={viewer.streak} label="day streak" />
            <Stat value={viewer.shipCount} label="updates" />
            <Stat value={compactCount(viewer.respectCount)} label="backers" />
          </div>
        </div>
      </div>

      {/* Nav card */}
      <nav style={{ ...card, padding: 8, display: 'flex', flexDirection: 'column' }}>
        <Link href={profileHref} style={railLink}>
          <span style={{ color: 'var(--body)', display: 'grid', placeItems: 'center' }}>
            <PersonIcon size={18} />
          </span>
          My profile
        </Link>
        <Link href="/ai/studio" style={railLink}>
          <span style={{ color: 'var(--body)', display: 'grid', placeItems: 'center' }}>
            <StudioIcon size={18} />
          </span>
          AI Studio <span style={pill}>{AI_TOOLS.length} tools</span>
        </Link>
        <Link href="/ai/filter" style={railLink}>
          <span style={{ color: 'var(--body)', display: 'grid', placeItems: 'center' }}>
            <FilterStarIcon size={18} />
          </span>
          AI Filter
        </Link>
        <Link href="/game" style={railLink}>
          <span style={{ color: 'var(--body)', display: 'grid', placeItems: 'center' }}>
            <GameIcon size={18} />
          </span>
          Signal Rush <span style={pill}>Play</span>
        </Link>
        <Link href="/agent" style={railLink}>
          <span style={{ color: 'var(--body)', display: 'grid', placeItems: 'center' }}>
            <AgentIcon size={18} />
          </span>
          Agent
        </Link>
        {/* Superadmin entry is rendered only for ADMIN — the prototype showed it to
            everyone because it had no roles. Route guards enforce this server-side too. */}
        {viewer.role === 'ADMIN' ? (
          <Link href="/admin" style={railLink}>
            <span style={{ color: 'var(--body)', display: 'grid', placeItems: 'center' }}>
              <ShieldIcon size={18} />
            </span>
            Superadmin
          </Link>
        ) : null}
        <Link href="/onboarding" style={railLink}>
          <span style={{ color: 'var(--body)', display: 'grid', placeItems: 'center' }}>
            <CogIcon size={18} />
          </span>
          Setup profile
        </Link>
      </nav>

      <Link
        href="/compose"
        style={{
          width: '100%',
          background: 'var(--primary)',
          color: '#163300',
          font: '600 15px/1 var(--font-inter), Inter, sans-serif',
          border: 'none',
          borderRadius: 24,
          padding: 15,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        <PlusIcon size={17} />
        Post an update
      </Link>

      {/* Smart tools */}
      <div style={{ ...card, padding: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 14px 10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--ink)' }}>
            <StarSolidIcon size={16} />
            <h3 style={{ font: '800 15px/1 var(--font-manrope), Manrope', letterSpacing: '-.01em', color: 'var(--ink)', margin: 0 }}>
              {t('smartTools')}
            </h3>
          </div>
          <Link href="/ai/studio" style={{ color: 'var(--mute)', font: '600 12px/1 var(--font-inter), Inter, sans-serif' }}>
            All {AI_TOOLS.length} →
          </Link>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {smartTools.map((tool) => (
            <Link
              key={tool.id}
              href={`/ai/studio?tool=${tool.id}`}
              style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', padding: '11px 12px', borderRadius: 16 }}
            >
              <span
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  background: tool.accent,
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                  color: '#fff',
                }}
              >
                <tool.Icon size={19} />
              </span>
              <span style={{ minWidth: 0 }}>
                <span style={{ display: 'block', font: '700 14px/1.2 var(--font-inter), Inter, sans-serif', color: 'var(--ink)' }}>
                  {tool.name}
                </span>
                <span
                  style={{
                    display: 'block',
                    fontSize: 12,
                    color: 'var(--mute)',
                    marginTop: 2,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {tool.tagline}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}

'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { usePreferences } from '@/components/providers/preferences-provider';
import type { ShellBadges, Viewer } from '@/lib/types';
import {
  BellIcon,
  BrandMark,
  ExpertsIcon,
  GlobeIcon,
  IdeasIcon,
  LearnIcon,
  MarketIcon,
  MessageIcon,
  MoonIcon,
  PlusIcon,
  SearchIcon,
  SparkIcon,
  SunIcon,
  TeamIcon,
} from '@/components/ui/icons';

/**
 * Top bar — a direct port of Treax.dc.html:173-243.
 *
 * Desktop: sticky 60px bar, tabs pushed right with margin-left:auto.
 * <=860px: the same <nav class="sl-tabs"> is re-positioned by CSS into the
 * floating dark pill dock, the AI tab detaches into its own green FAB, the
 * avatar button is swapped for the "You" tab, and search drops to row 2.
 * All of that lives in globals.css so the markup stays single-source.
 */

type NavKey = 'home' | 'explore' | 'market' | 'learn' | 'experts' | 'aitools' | 'profile' | 'notif';

/** navc()/navk(), Treax.dc.html:3230-3231 */
const activeColor = (isOn: boolean) => (isOn ? 'var(--ink)' : 'var(--mute)');
const activeClass = (isOn: boolean) => (isOn ? 'on' : '');

const tabLabelStyle = { font: '600 11px/1 var(--font-inter), Inter, sans-serif' } as const;

const tabBase: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 3,
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: '6px 13px',
  borderRadius: 10,
};

const iconButton: React.CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 9999,
  border: '1px solid var(--border)',
  background: 'var(--card)',
  display: 'grid',
  placeItems: 'center',
  cursor: 'pointer',
  flexShrink: 0,
};

const badgeStyle: React.CSSProperties = {
  position: 'absolute',
  top: -2,
  right: -2,
  minWidth: 17,
  height: 17,
  padding: '0 4px',
  borderRadius: 9999,
  background: 'var(--negative)',
  color: '#fff',
  font: '700 10px/17px var(--font-inter), Inter, sans-serif',
  textAlign: 'center',
};

export function TopBar({ viewer, badges }: { viewer: Viewer; badges: ShellBadges }) {
  const t = useTranslations();
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme, toggleLocale } = usePreferences();

  const current: NavKey | null = (() => {
    if (pathname === '/') return 'home';
    if (pathname.startsWith('/team')) return 'explore';
    if (pathname.startsWith('/market')) return 'market';
    if (pathname.startsWith('/learn')) return 'learn';
    if (pathname.startsWith('/experts')) return 'experts';
    if (pathname.startsWith('/ai')) return 'aitools';
    if (pathname.startsWith('/notifications')) return 'notif';
    if (pathname.startsWith('/u/')) return 'profile';
    return null;
  })();

  const is = (key: NavKey) => current === key;
  const profileHref = `/u/${viewer.handle}`;

  const tabs: Array<{ key: NavKey; href: string; label: string; icon: React.ReactNode; secondary?: boolean }> = [
    { key: 'home', href: '/', label: t('ideas'), icon: <IdeasIcon size={22} /> },
    { key: 'explore', href: '/team', label: t('team'), icon: <TeamIcon size={22} /> },
    { key: 'market', href: '/market', label: t('market'), icon: <MarketIcon size={22} /> },
    { key: 'learn', href: '/learn', label: t('learn'), icon: <LearnIcon size={22} />, secondary: true },
    { key: 'experts', href: '/experts', label: t('experts'), icon: <ExpertsIcon size={22} />, secondary: true },
  ];

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 40, background: 'var(--card)', borderBottom: '1px solid var(--border)' }}>
      <div
        className="sl-topbar"
        style={{ maxWidth: 1216, margin: '0 auto', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', gap: 20 }}
      >
        <Link href="/" className="sl-brand" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 0 }}>
          <span
            style={{
              width: 34,
              height: 34,
              borderRadius: 11,
              background: 'var(--primary)',
              display: 'grid',
              placeItems: 'center',
              color: '#163300',
              flexShrink: 0,
            }}
          >
            <BrandMark size={19} />
          </span>
          <span style={{ fontFamily: 'var(--font-manrope), Manrope', fontWeight: 800, fontSize: 21, letterSpacing: '-.02em', color: 'var(--ink)' }}>
            Treax
          </span>
        </Link>

        <label
          className="sl-search"
          style={{
            flex: 1,
            maxWidth: 340,
            display: 'flex',
            alignItems: 'center',
            gap: 9,
            background: 'var(--soft)',
            border: '1px solid transparent',
            borderRadius: 12,
            padding: '9px 13px',
            cursor: 'text',
          }}
        >
          <span style={{ color: 'var(--mute)', display: 'grid', placeItems: 'center' }}>
            <SearchIcon size={17} />
          </span>
          <input
            placeholder={t('search')}
            aria-label={t('search')}
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return;
              const q = (e.target as HTMLInputElement).value.trim();
              if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
            }}
            style={{ border: 'none', background: 'none', fontSize: 14, color: 'var(--ink)', width: '100%' }}
          />
        </label>

        <nav className="sl-tabs" style={{ display: 'flex', alignItems: 'center', gap: 2, marginLeft: 'auto' }}>
          {tabs.map((tab) => (
            <Link
              key={tab.key}
              href={tab.href}
              aria-current={is(tab.key) ? 'page' : undefined}
              className={`sl-tab ${tab.secondary ? 'sl-tab-sec ' : ''}${activeClass(is(tab.key))}`}
              style={{ ...tabBase, color: activeColor(is(tab.key)) }}
            >
              {tab.icon}
              <span style={tabLabelStyle}>{tab.label}</span>
            </Link>
          ))}

          {/* AI: inside the row on desktop, detached green FAB on mobile */}
          <Link
            href="/ai/studio"
            aria-current={is('aitools') ? 'page' : undefined}
            className={`sl-tab sl-aifab ${activeClass(is('aitools'))}`}
            style={{ ...tabBase, color: activeColor(is('aitools')) }}
          >
            <span style={{ position: 'relative', display: 'grid', placeItems: 'center', width: 22, height: 22 }}>
              <SparkIcon size={22} />
            </span>
            <span style={tabLabelStyle}>{t('ai')}</span>
          </Link>

          {/* "You": hidden on desktop (the avatar button covers it), shown in the dock */}
          <Link
            href={profileHref}
            aria-current={is('profile') ? 'page' : undefined}
            className={`sl-tab sl-metab ${activeClass(is('profile'))}`}
            style={{ ...tabBase, display: 'none', flexDirection: 'row', color: 'var(--dock-fg)' }}
          >
            <span
              style={{
                width: 26,
                height: 26,
                borderRadius: 9999,
                background: viewer.avatarColor,
                color: '#fff',
                font: '800 11px/1 var(--font-manrope), Manrope',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
              }}
            >
              {viewer.initials}
            </span>
            <span style={tabLabelStyle}>{t('you')}</span>
          </Link>
        </nav>

        <Link
          href="/notifications"
          title={t('notifications')}
          aria-label={
            badges.unreadNotifications > 0
              ? `${t('notifications')} (${badges.unreadNotifications} unread)`
              : t('notifications')
          }
          className="sl-icobtn"
          style={{ ...iconButton, position: 'relative', color: activeColor(is('notif')) }}
        >
          <BellIcon size={19} />
          {badges.unreadNotifications > 0 ? (
            <span style={badgeStyle}>{badges.unreadNotifications > 99 ? '99+' : badges.unreadNotifications}</span>
          ) : null}
        </Link>

        <div className="sl-only-desktop" style={{ width: 1, height: 30, background: 'var(--border)' }} />

        <button
          onClick={toggleLocale}
          title="Language"
          className="sl-lang"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            height: 40,
            padding: '0 14px',
            borderRadius: 9999,
            border: '1px solid var(--border)',
            background: 'var(--card)',
            color: 'var(--ink)',
            font: '700 13px/1 var(--font-inter), Inter, sans-serif',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <GlobeIcon size={16} />
          {t('langLabel')}
        </button>

        <button
          onClick={toggleTheme}
          title="Toggle theme"
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          className="sl-icobtn"
          style={{ ...iconButton, color: 'var(--ink)' }}
        >
          {theme === 'dark' ? <SunIcon size={19} /> : <MoonIcon size={18} />}
        </button>

        <Link
          href="/compose"
          className="sl-post"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            background: 'var(--primary)',
            color: '#163300',
            font: '600 15px/1 var(--font-inter), Inter, sans-serif',
            border: 'none',
            borderRadius: 9999,
            padding: '11px 18px',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <PlusIcon size={17} />
          {t('post')}
        </Link>

        {/* Mobile-only messages button — desktop uses the docked chat panel */}
        <Link
          href="/messages"
          className="sl-msgbtn"
          title={t('messages')}
          aria-label={badges.unreadMessages > 0 ? `${t('messages')} (${badges.unreadMessages} unread)` : t('messages')}
          style={{ ...iconButton, display: 'none', color: 'var(--ink)', position: 'relative' }}
        >
          <MessageIcon size={19} />
          {badges.unreadMessages > 0 ? (
            <span style={badgeStyle}>{badges.unreadMessages > 99 ? '99+' : badges.unreadMessages}</span>
          ) : null}
        </Link>

        <Link
          href={profileHref}
          className="sl-avatarbtn"
          aria-label={`${viewer.name} — your profile`}
          style={{
            width: 40,
            height: 40,
            borderRadius: 9999,
            border: `2px solid ${is('profile') ? 'var(--primary)' : 'transparent'}`,
            background: viewer.avatarColor,
            color: '#fff',
            font: '800 15px/1 var(--font-manrope), Manrope',
            cursor: 'pointer',
            flexShrink: 0,
            display: 'grid',
            placeItems: 'center',
          }}
        >
          {viewer.initials}
        </Link>
      </div>
    </header>
  );
}

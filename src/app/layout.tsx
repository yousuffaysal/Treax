import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { SessionProvider } from 'next-auth/react';
import { PreferencesProvider } from '@/components/providers/preferences-provider';
import { ToastProvider } from '@/components/providers/toast-provider';
import { THEME_COOKIE, defaultTheme, isTheme, type Locale } from '@/i18n/config';
import { fontVariables } from '@/lib/fonts';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Treax — Build-in-Public Network, AI Tools & Real-Time Messaging',
    template: '%s · Treax',
  },
  description:
    'Treax is an advanced build-in-public social network, marketplace, and AI-assisted ecosystem for student builders. Features sub-second real-time Pusher 1:1 chat, Groq Llama 3.3 Anti-Hype AI filter & bio generator, PostgreSQL/Prisma database backend, Cloudinary media pipeline, expert mentorship bookings, and student services marketplace.',
  keywords: [
    'Treax',
    'Build in Public',
    'Student Builders',
    'AI Tools',
    'Groq Llama 3.3',
    'Real-time Live Chat',
    'Pusher Channels WebSockets',
    'PostgreSQL Backend',
    'Prisma ORM',
    'Next.js 15 App Router',
    'Cloudinary Media Uploads',
    'Mentorship Bookings',
    'Services Marketplace',
    'Founder Blogs',
    'Signal Rush Game',
    'Anti-Hype Filter',
    'Yousuf H Faysaal',
  ],
  authors: [{ name: 'Yousuf H Faysaal' }],
  creator: 'YusuF Faisal',
  openGraph: {
    title: 'Treax — Build-in-Public Platform, AI Assistant & Real-Time Chat',
    description:
      'Comprehensive platform for student builders featuring live 1-on-1 messaging, Anti-Hype AI content filter, AI bio generation, PostgreSQL backend, Cloudinary media storage, services marketplace, and expert bookings.',
    siteName: 'Treax',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Treax — Build-in-Public Platform, AI Assistant & Real-Time Chat',
    description:
      'Comprehensive platform for student builders featuring live 1-on-1 messaging, Anti-Hype AI content filter, AI bio generation, PostgreSQL backend, Cloudinary media storage, services marketplace, and expert bookings.',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#e8ebe6' },
    { media: '(prefers-color-scheme: dark)', color: '#0b0d08' },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Theme and locale are resolved on the server from cookies that are kept in
  // sync with User.theme / User.locale, so the first paint is already correct.
  const store = await cookies();
  const cookieTheme = store.get(THEME_COOKIE)?.value;
  const theme = isTheme(cookieTheme) ? cookieTheme : defaultTheme;
  const locale = (await getLocale()) as Locale;
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      data-theme={theme}
      className={`${fontVariables} sl-scroll${locale === 'bn' ? ' lang-bn' : ''}`}
      suppressHydrationWarning
    >
      {/*
        Browser extensions (ColorZilla, Grammarly, password managers) inject
        attributes onto <body> before React hydrates — cz-shortcut-listen,
        data-new-gr-c-s-check-loaded and friends. Those are outside our control
        and harmless, so the warning is suppressed here as well as on <html>.
        This only silences attribute mismatches on these two elements; a real
        mismatch anywhere inside the tree still reports normally.
      */}
      <body className="sl-m" suppressHydrationWarning>
        <SessionProvider>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <PreferencesProvider initialTheme={theme} initialLocale={locale}>
              <ToastProvider>{children}</ToastProvider>
            </PreferencesProvider>
          </NextIntlClientProvider>
        </SessionProvider>
      </body>
    </html>
  );
}

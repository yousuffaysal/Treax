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
    default: 'Treax — build in public',
    template: '%s · Treax',
  },
  description:
    'A build-in-public network for student builders in Bangladesh. Every post is a real builder update — the filter makes sure.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
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
      <body className="sl-m">
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

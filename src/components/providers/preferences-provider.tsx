'use client';

import { createContext, useCallback, useContext, useState, useTransition, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { LOCALE_COOKIE, THEME_COOKIE, type Locale, type Theme } from '@/i18n/config';

type PreferencesValue = {
  theme: Theme;
  locale: Locale;
  toggleTheme: () => void;
  toggleLocale: () => void;
  setTheme: (theme: Theme) => void;
  setLocale: (locale: Locale) => void;
  pending: boolean;
};

const PreferencesContext = createContext<PreferencesValue | null>(null);

/** One year, matching how the prototype persisted to localStorage indefinitely. */
const MAX_AGE = 60 * 60 * 24 * 365;

function writeCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=${MAX_AGE}; samesite=lax`;
}

export function PreferencesProvider({
  children,
  initialTheme,
  initialLocale,
}: {
  children: ReactNode;
  initialTheme: Theme;
  initialLocale: Locale;
}) {
  const router = useRouter();
  const [theme, setThemeState] = useState<Theme>(initialTheme);
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [pending, startTransition] = useTransition();

  // Theme is a pure CSS-variable swap on <html>, so it applies without a reload —
  // same behaviour as applyTheme() in the prototype (Treax.dc.html:2361).
  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    document.documentElement.dataset.theme = next;
    writeCookie(THEME_COOKIE, next);
    void fetch('/api/preferences', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ theme: next }),
    });
  }, []);

  // Locale changes the message bundle, which lives on the server, so we refresh.
  // The `lang-bn` class flips immediately so Bengali fonts never lag behind.
  const setLocale = useCallback(
    (next: Locale) => {
      setLocaleState(next);
      document.documentElement.lang = next;
      document.documentElement.classList.toggle('lang-bn', next === 'bn');
      writeCookie(LOCALE_COOKIE, next);
      void fetch('/api/preferences', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ locale: next }),
      });
      startTransition(() => router.refresh());
    },
    [router],
  );

  const toggleTheme = useCallback(() => setTheme(theme === 'light' ? 'dark' : 'light'), [theme, setTheme]);
  const toggleLocale = useCallback(() => setLocale(locale === 'en' ? 'bn' : 'en'), [locale, setLocale]);

  return (
    <PreferencesContext.Provider
      value={{ theme, locale, toggleTheme, toggleLocale, setTheme, setLocale, pending }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error('usePreferences must be used inside <PreferencesProvider>');
  return ctx;
}

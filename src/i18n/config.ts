export const locales = ['en', 'bn'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

export const LOCALE_COOKIE = 'treax_lang';
export const THEME_COOKIE = 'treax_theme';

export type Theme = 'light' | 'dark';
export const defaultTheme: Theme = 'light';

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (locales as readonly string[]).includes(value);
}

export function isTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark';
}

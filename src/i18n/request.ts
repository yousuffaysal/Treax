import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import { LOCALE_COOKIE, defaultLocale, isLocale } from './config';

/**
 * Locale comes from a cookie, not from the URL. The prototype toggles language
 * in place (Treax.dc.html:2262-2263) and persists it; we mirror that, and the
 * cookie is kept in sync with `User.locale` on sign-in and on profile save so
 * the very first server render is already correct (no flash).
 */
export default getRequestConfig(async () => {
  const store = await cookies();
  const cookieLocale = store.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(cookieLocale) ? cookieLocale : defaultLocale;

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});

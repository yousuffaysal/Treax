import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getViewer } from '@/lib/session';

const schema = z.object({
  theme: z.enum(['light', 'dark']).optional(),
  locale: z.enum(['en', 'bn']).optional(),
});

/**
 * Persists the theme/language toggles to the user record. The cookie is already
 * set client-side for the instant swap; this keeps the preference across
 * devices and makes the very first server render correct on a new session.
 */
export async function POST(req: Request) {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ ok: false }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });

  const { theme, locale } = parsed.data;
  if (!theme && !locale) return NextResponse.json({ ok: true });

  await db.user.update({
    where: { id: viewer.id },
    data: { ...(theme ? { theme } : {}), ...(locale ? { locale } : {}) },
  });

  return NextResponse.json({ ok: true });
}

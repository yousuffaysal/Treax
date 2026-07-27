'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/db';
import { assertActive } from '@/lib/session';
import { action, ActionError, type ActionResult } from '@/lib/action-result';
import { rateLimit, rateLimitMessage } from '@/lib/rate-limit';
import { HANDLE_RE, normalizeHandle } from '@/lib/handle';
import { initialsOf } from '@/lib/types';
import { aiAvailable, complete } from '@/lib/ai/client';

/** Profile, service and blog mutations. */

const BIO_MAX = 220;

const profileSchema = z.object({
  name: z.string().trim().min(2, 'Add your name first.').max(60),
  handle: z.string().trim(),
  university: z.string().trim().max(80),
  focus: z.string().trim().max(80),
  building: z.string().trim().max(120),
  bio: z.string().trim().max(BIO_MAX, `Keep your bio under ${BIO_MAX} characters.`),
  seeking: z.string().trim().max(120),
  avatarColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Pick a colour from the list.'),
  tags: z.array(z.string().trim().min(1).max(40)).max(12),
});

export async function saveProfile(input: z.infer<typeof profileSchema>): Promise<ActionResult<{ handle: string }>> {
  return action(async () => {
    const viewer = await assertActive();
    const data = profileSchema.parse(input);

    const handle = normalizeHandle(data.handle);
    if (!HANDLE_RE.test(handle)) {
      throw new ActionError('Handles are 3-20 characters: letters, numbers and underscores.');
    }

    const clash = await db.user.findUnique({ where: { handle }, select: { id: true } });
    if (clash && clash.id !== viewer.id) throw new ActionError('That handle is taken. Try another.');

    await db.user.update({
      where: { id: viewer.id },
      data: {
        name: data.name,
        handle,
        initials: initialsOf(data.name),
        university: data.university || null,
        focus: data.focus || null,
        building: data.building || null,
        bio: data.bio || null,
        seeking: data.seeking || null,
        avatarColor: data.avatarColor,
        tags: data.tags,
      },
    });

    // The name, avatar and handle appear in the shell on every page.
    revalidatePath('/', 'layout');
    return { handle };
  });
}

/** "Write it for me" — the bio suggestion button on the edit sheet. */
export async function suggestBio(): Promise<ActionResult<{ bio: string }>> {
  return action(async () => {
    const viewer = await assertActive();

    const limit = rateLimit('ai', viewer.id);
    if (!limit.allowed) throw new ActionError(rateLimitMessage(limit));

    const me = await db.user.findUnique({
      where: { id: viewer.id },
      select: { name: true, university: true, focus: true, building: true, seeking: true, tags: true },
    });
    if (!me) throw new ActionError('Profile not found.');

    if (!aiAvailable()) {
      // Deterministic fallback so the button still does something useful when
      // the AI key is absent.
      const parts = [
        me.focus && me.university ? `${me.focus} at ${me.university}` : me.focus || me.university,
        me.building ? `building ${me.building}` : null,
        me.seeking ? `Looking for ${me.seeking.toLowerCase()}` : null,
      ].filter(Boolean);
      return { bio: `${parts.join(', ')}. Building in public, learning fast.`.slice(0, BIO_MAX) };
    }

    const bio = await complete({
      system: `You write short profile bios for Treax, a build-in-public network for student builders in Bangladesh.

Voice: plain, concrete, anti-hype. First person. No exclamation marks, no buzzwords, no "passionate about". Name what they build and what they want. Two or three short sentences, under ${BIO_MAX} characters total. Return the bio only, no quotes or preamble.`,
      user: JSON.stringify({
        name: me.name,
        university: me.university,
        role: me.focus,
        building: me.building,
        lookingFor: me.seeking,
        interests: me.tags,
      }),
      temperature: 0.7,
      maxTokens: 200,
    });

    return { bio: bio.replace(/^["']|["']$/g, '').slice(0, BIO_MAX) };
  });
}

// ── services ─────────────────────────────────────────────────────────────────

const serviceSchema = z.object({
  title: z.string().trim().min(3, 'Give the service a title first.').max(140),
  description: z.string().trim().min(3, 'Say what you deliver.').max(2000),
  price: z.string().trim().max(40),
  cta: z.string().trim().max(40),
  images: z.array(z.string().url()).max(2),
});

export async function saveService(input: z.infer<typeof serviceSchema>): Promise<ActionResult<{ id: string }>> {
  return action(async () => {
    const viewer = await assertActive();
    const data = serviceSchema.parse(input);

    const service = await db.service.create({
      data: {
        ownerId: viewer.id,
        title: data.title,
        description: data.description,
        price: data.price || 'Ask',
        cta: data.cta || 'Request this',
        images: data.images,
      },
      select: { id: true },
    });

    revalidatePath(`/u/${viewer.handle}`);
    revalidatePath('/market');
    return { id: service.id };
  });
}

export async function deleteService(serviceId: string): Promise<ActionResult<undefined>> {
  return action(async () => {
    const viewer = await assertActive();
    // Scoped by ownerId — a caller cannot delete someone else's listing by id.
    const deleted = await db.service.deleteMany({ where: { id: serviceId, ownerId: viewer.id } });
    if (deleted.count === 0) throw new ActionError('That service is not yours to remove.');

    revalidatePath(`/u/${viewer.handle}`);
    revalidatePath('/market');
    return undefined;
  });
}

// ── blog ─────────────────────────────────────────────────────────────────────

const blogSchema = z.object({
  title: z.string().trim().min(3, 'A title and some words, then it goes live.').max(160),
  body: z.string().trim().min(20, 'A title and some words, then it goes live.').max(20000),
});

export async function saveBlogPost(input: z.infer<typeof blogSchema>): Promise<ActionResult<{ id: string }>> {
  return action(async () => {
    const viewer = await assertActive();
    const data = blogSchema.parse(input);

    // ~200 words a minute, the usual reading-time convention.
    const words = data.body.trim().split(/\s+/).length;
    const readTime = `${Math.max(1, Math.round(words / 200))} min`;
    const excerpt = data.body.trim().split('\n')[0].slice(0, 200);

    const post = await db.blogPost.create({
      data: { ownerId: viewer.id, title: data.title, body: data.body, excerpt, readTime },
      select: { id: true },
    });

    revalidatePath(`/u/${viewer.handle}`);
    return { id: post.id };
  });
}

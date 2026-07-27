import { NextResponse } from 'next/server';
import { z } from 'zod';
import { assertActive } from '@/lib/session';
import { rateLimit, rateLimitMessage } from '@/lib/rate-limit';
import { aiAvailable, streamText } from '@/lib/ai/client';
import { TOOL_PROMPTS } from '@/lib/ai/prompts';
import { AI_TOOL_IDS, type AiToolId } from '@/lib/ai/tools';

const schema = z.object({
  tool: z.string().refine((v): v is AiToolId => (AI_TOOL_IDS as string[]).includes(v), 'Unknown tool.'),
  input: z.string().trim().min(1, 'Type something first.').max(6000),
});

/**
 * Streams an AI Studio tool's output.
 *
 * The key stays server-side; the browser only ever sees text chunks. Rate
 * limiting is per-user because these calls cost money.
 */
export async function POST(req: Request) {
  let viewer;
  try {
    viewer = await assertActive();
  } catch {
    return NextResponse.json({ error: 'Sign in to use the AI tools.' }, { status: 401 });
  }

  const limit = rateLimit('ai', viewer.id);
  if (!limit.allowed) return NextResponse.json({ error: rateLimitMessage(limit) }, { status: 429 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Bad request.' }, { status: 400 });
  }

  if (!aiAvailable()) {
    return NextResponse.json({ error: 'The AI tools are not configured yet. Add GROQ_API_KEY.' }, { status: 503 });
  }

  const { tool, input } = parsed.data;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const chunk of streamText({
          system: TOOL_PROMPTS[tool],
          user: input,
          temperature: 0.7,
          maxTokens: 1200,
        })) {
          controller.enqueue(encoder.encode(chunk));
        }
      } catch (err) {
        console.error('[ai/tool]', err);
        controller.enqueue(encoder.encode('\n\nThe AI stopped early. Try running it again.'));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
  });
}

export const runtime = 'nodejs';
export const maxDuration = 60;

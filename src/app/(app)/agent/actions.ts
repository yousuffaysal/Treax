'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { assertActive } from '@/lib/session';
import { action, ActionError, type ActionResult } from '@/lib/action-result';
import { rateLimit, rateLimitMessage } from '@/lib/rate-limit';
import { runCommand, type AgentResult } from '@/lib/ai/agent';

export async function runAgentCommand(inputRaw: string): Promise<ActionResult<AgentResult>> {
  return action(async () => {
    const viewer = await assertActive();

    const limit = rateLimit('agent', viewer.id);
    if (!limit.allowed) throw new ActionError(rateLimitMessage(limit));

    const input = z.string().trim().min(1, 'Type a command first.').max(500).parse(inputRaw);
    const result = await runCommand(viewer, input);

    // Theme and language changes are reflected in the shell.
    if (result.effect?.kind === 'theme' || result.effect?.kind === 'language') {
      revalidatePath('/', 'layout');
    }
    return result;
  });
}

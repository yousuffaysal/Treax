'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/db';
import { assertActive } from '@/lib/session';
import { action, type ActionResult } from '@/lib/action-result';
import { GAME_BANK } from '@/lib/game-bank';

/**
 * Saves a Signal Rush run.
 *
 * The score is recomputed here from the answers rather than trusted from the
 * client — otherwise the leaderboard is whatever anyone cares to POST. The
 * scoring rule mirrors the prototype: 10 points a correct call, plus a combo
 * bonus that grows with each unbroken streak.
 */
const submitSchema = z.object({
  answers: z
    .array(z.object({ index: z.number().int().min(0).max(GAME_BANK.length - 1), choice: z.enum(['accept', 'bounce']) }))
    .max(60),
});

export async function submitGameScore(input: z.infer<typeof submitSchema>): Promise<ActionResult<{ score: number; solved: number; missed: number }>> {
  return action(async () => {
    const viewer = await assertActive();
    const { answers } = submitSchema.parse(input);

    let score = 0;
    let combo = 0;
    let solved = 0;
    let missed = 0;

    for (const answer of answers) {
      const item = GAME_BANK[answer.index];
      if (!item) continue;
      if (item.verdict === answer.choice) {
        combo += 1;
        score += 10 + Math.min(combo, 5) * 2;
        solved += 1;
      } else {
        combo = 0;
        missed += 1;
      }
    }

    await db.gameScore.create({ data: { userId: viewer.id, score, solved, missed } });

    revalidatePath('/game');
    revalidatePath('/', 'layout');
    return { score, solved, missed };
  });
}

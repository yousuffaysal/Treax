import { AuthorizationError } from '@/lib/session';
import { ZodError } from 'zod';

/**
 * Every Server Action returns this shape rather than throwing across the
 * boundary — the client renders `error` in the prototype's toast.
 */
export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

export const ok = <T>(data: T): ActionResult<T> => ({ ok: true, data });
export const fail = (error: string): ActionResult<never> => ({ ok: false, error });

/** Wraps an action body so authorization and validation failures become results. */
export async function action<T>(run: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return ok(await run());
  } catch (err) {
    if (err instanceof AuthorizationError) return fail(err.message);
    if (err instanceof ZodError) {
      return fail(err.issues[0]?.message ?? 'That input is not valid.');
    }
    if (err instanceof ActionError) return fail(err.message);
    // `redirect()` and `notFound()` throw control-flow errors that must bubble.
    if (err && typeof err === 'object' && 'digest' in err) throw err;
    console.error('[action]', err);
    return fail('Something went wrong. Try again.');
  }
}

/** Throw this for expected, user-facing failures inside an action body. */
export class ActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ActionError';
  }
}

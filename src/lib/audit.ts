import 'server-only';
import { db } from '@/lib/db';
import type { Prisma } from '@prisma/client';

/**
 * Every admin action leaves a row here. Called inside the same transaction as
 * the change it records wherever a transaction exists, so the log cannot drift
 * from reality.
 */
export type AuditAction =
  | 'user.verify'
  | 'user.unverify'
  | 'user.suspend'
  | 'user.unsuspend'
  | 'user.badge.award'
  | 'user.badge.remove'
  | 'user.access.change'
  | 'post.moderate.accept'
  | 'post.moderate.bounce'
  | 'campaign.create'
  | 'campaign.toggle'
  | 'campaign.update'
  | 'billboard.update'
  | 'learn.create'
  | 'learn.delete'
  | 'agent.command';

export async function recordAudit(
  actorId: string,
  action: AuditAction,
  target?: { type: string; id: string },
  detail?: Prisma.InputJsonValue,
  client: Prisma.TransactionClient | typeof db = db,
) {
  await client.auditLog.create({
    data: {
      actorId,
      action,
      targetType: target?.type ?? null,
      targetId: target?.id ?? null,
      detail: detail ?? undefined,
    },
  });
}

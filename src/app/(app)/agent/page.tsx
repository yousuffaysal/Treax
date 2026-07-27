import type { Metadata } from 'next';
import { requireViewer } from '@/lib/session';
import { db } from '@/lib/db';
import { AgentConsole } from './agent-console';

export const metadata: Metadata = { title: 'Treax Agent' };

/** Agent console — port of Treax.dc.html's agent screen. */
export default async function AgentPage() {
  const viewer = await requireViewer();

  const history = await db.agentCommand.findMany({
    where: { userId: viewer.id },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: 12,
    select: { id: true, input: true, reply: true, allowed: true, succeeded: true },
  });

  return (
    <AgentConsole
      viewer={{ name: viewer.name, initials: viewer.initials, avatarColor: viewer.avatarColor, avatarUrl: viewer.avatarUrl, role: viewer.role, handle: viewer.handle }}
      history={history.reverse()}
    />
  );
}

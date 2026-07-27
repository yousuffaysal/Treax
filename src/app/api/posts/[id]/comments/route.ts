import { NextResponse } from 'next/server';
import { getViewer } from '@/lib/session';
import { getComments } from '@/lib/feed';
import { db } from '@/lib/db';

/** Comment threads load on demand when a post's Comment button is opened. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  // Only expose threads on posts that actually cleared the filter.
  const post = await db.post.findFirst({ where: { id, filterVerdict: 'ACCEPTED' }, select: { id: true } });
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json(await getComments(id));
}

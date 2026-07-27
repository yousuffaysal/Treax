import { NextResponse } from 'next/server';
import { assertActive } from '@/lib/session';
import { LIMITS, rateLimit, rateLimitMessage } from '@/lib/rate-limit';
import { UploadError, UploadUnavailableError, uploadImage, type UploadFolder } from '@/lib/upload';

const FOLDERS: UploadFolder[] = ['avatars', 'posts', 'services', 'ads', 'billboard'];

export async function POST(req: Request) {
  let viewer;
  try {
    viewer = await assertActive();
  } catch {
    return NextResponse.json({ error: 'Sign in to upload.' }, { status: 401 });
  }

  const limit = rateLimit('upload', viewer.id);
  if (!limit.allowed) {
    return NextResponse.json({ error: rateLimitMessage(limit) }, { status: 429 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get('file');
  const folderRaw = String(form?.get('folder') ?? 'posts');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file received.' }, { status: 400 });
  }
  const folder = FOLDERS.includes(folderRaw as UploadFolder) ? (folderRaw as UploadFolder) : 'posts';

  // Only ADMIN may replace the platform billboard, whatever the client claims.
  if (folder === 'billboard' && viewer.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admins only.' }, { status: 403 });
  }

  try {
    const result = await uploadImage(file, folder);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof UploadError) return NextResponse.json({ error: err.message }, { status: 400 });
    if (err instanceof UploadUnavailableError) {
      return NextResponse.json({ error: 'Image uploads are not configured yet.' }, { status: 503 });
    }
    console.error('[upload]', err);
    return NextResponse.json({ error: 'Upload failed. Try again.' }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const maxDuration = 30;

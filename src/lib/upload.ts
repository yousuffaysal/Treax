import 'server-only';
import { v2 as cloudinary } from 'cloudinary';
import { hasCloudinary } from '@/lib/env';

/**
 * Image storage. Cloudinary is the only implementation, reached through this
 * module so the rest of the app never imports the SDK directly.
 */

let configured = false;

function configure() {
  if (configured) return;
  if (!hasCloudinary()) throw new UploadUnavailableError();
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  configured = true;
}

export class UploadUnavailableError extends Error {
  constructor() {
    super('Image uploads are not configured.');
    this.name = 'UploadUnavailableError';
  }
}

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
export const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'] as const;

export type UploadFolder = 'avatars' | 'posts' | 'services' | 'ads' | 'billboard';

export type UploadResult = { url: string; publicId: string; width: number; height: number };

/**
 * Validates type and size before spending a network call, then uploads.
 * Callers must still check the caller's role/ownership — this does not.
 */
export async function uploadImage(file: File, folder: UploadFolder): Promise<UploadResult> {
  if (!ALLOWED_TYPES.includes(file.type as (typeof ALLOWED_TYPES)[number])) {
    throw new UploadError('That file type is not allowed. Use PNG, JPEG, WebP or GIF.');
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new UploadError('That image is over 4MB. Try a smaller one.');
  }

  configure();
  const buffer = Buffer.from(await file.arrayBuffer());

  const result = await new Promise<{ secure_url: string; public_id: string; width: number; height: number }>(
    (resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `treax/${folder}`,
          resource_type: 'image',
          // Re-encode server-side: strips EXIF and neutralises polyglot files
          // that claim an image mime type but carry script payloads.
          transformation: [{ quality: 'auto:good', fetch_format: 'auto' }],
        },
        (err, res) => {
          if (err || !res) reject(err ?? new UploadError('Upload failed.'));
          else resolve(res as never);
        },
      );
      stream.end(buffer);
    },
  );

  return {
    url: result.secure_url,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
  };
}

export async function deleteImage(publicId: string): Promise<void> {
  configure();
  await cloudinary.uploader.destroy(publicId);
}

export class UploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UploadError';
  }
}

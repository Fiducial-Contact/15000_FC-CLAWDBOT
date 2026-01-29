import { createClient } from '@/lib/supabase/client';

const DEFAULT_BUCKET = 'webchat-uploads';
const DEFAULT_TTL_SECONDS = Number(process.env.NEXT_PUBLIC_SUPABASE_SIGNED_URL_TTL_SECONDS || 3600);

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function sanitizePathSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function resolveTtlSeconds(value?: number) {
  if (!value || Number.isNaN(value) || value <= 0) return DEFAULT_TTL_SECONDS;
  return Math.floor(value);
}

function resolveBucket(bucket?: string) {
  const resolved = (bucket ?? DEFAULT_BUCKET)?.trim();
  if (!resolved) {
    throw new Error('Storage bucket is not configured. Set NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET.');
  }
  return resolved;
}

function isBucketNotFound(message: string) {
  const normalized = message.toLowerCase();
  return normalized.includes('bucket') && normalized.includes('not found');
}

export async function uploadFileAndCreateSignedUrl(params: {
  file: File;
  userId: string;
  bucket?: string;
  ttlSeconds?: number;
}) {
  const { file, userId, bucket, ttlSeconds } = params;
  const resolvedBucket = resolveBucket(bucket);
  const supabase = createClient();
  const safeName = sanitizeFileName(file.name || 'file');
  const fileId = crypto.randomUUID();
  const safeUserId = sanitizePathSegment(userId || 'user');
  const path = `${safeUserId}/${Date.now()}-${fileId}-${safeName}`;
  const contentType = file.type || 'application/octet-stream';

  const { error: uploadError } = await supabase.storage
    .from(resolvedBucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType,
    });

  if (uploadError) {
    if (isBucketNotFound(uploadError.message)) {
      throw new Error(
        `Storage bucket "${resolvedBucket}" not found. Check NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET and Supabase project.`
      );
    }
    throw new Error(uploadError.message);
  }

  const { data, error: signedError } = await supabase.storage
    .from(resolvedBucket)
    .createSignedUrl(path, resolveTtlSeconds(ttlSeconds));

  if (signedError || !data?.signedUrl) {
    throw new Error(signedError?.message || 'Failed to create signed URL');
  }

  return { bucket: resolvedBucket, path, signedUrl: data.signedUrl };
}

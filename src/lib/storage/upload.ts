import { createClient } from '@/lib/supabase/client';

const DEFAULT_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'webchat-uploads';
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

export async function uploadFileAndCreateSignedUrl(params: {
  file: File;
  userId: string;
  bucket?: string;
  ttlSeconds?: number;
}) {
  const { file, userId, bucket = DEFAULT_BUCKET, ttlSeconds } = params;
  const supabase = createClient();
  const safeName = sanitizeFileName(file.name || 'file');
  const fileId = crypto.randomUUID();
  const safeUserId = sanitizePathSegment(userId || 'user');
  const path = `${safeUserId}/${Date.now()}-${fileId}-${safeName}`;
  const contentType = file.type || 'application/octet-stream';

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data, error: signedError } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, resolveTtlSeconds(ttlSeconds));

  if (signedError || !data?.signedUrl) {
    throw new Error(signedError?.message || 'Failed to create signed URL');
  }

  return { bucket, path, signedUrl: data.signedUrl };
}

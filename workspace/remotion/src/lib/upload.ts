import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const DEFAULT_BUCKET = (process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'webchat-uploads').trim();
const DEFAULT_TTL_SECONDS = Number(process.env.NEXT_PUBLIC_SUPABASE_SIGNED_URL_TTL_SECONDS || 3600);

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function resolveBucket(bucket?: string) {
  const resolved = (bucket ?? DEFAULT_BUCKET).trim();
  if (!resolved) {
    throw new Error('Storage bucket is not configured. Set NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET.');
  }
  return resolved;
}

function resolveTtlSeconds(value?: number) {
  if (!value || Number.isNaN(value) || value <= 0) return DEFAULT_TTL_SECONDS;
  return Math.floor(value);
}

function isBucketNotFound(message: string) {
  const normalized = message.toLowerCase();
  return normalized.includes('bucket') && normalized.includes('not found');
}

export async function uploadVideo(
  filePath: string,
  options?: { bucket?: string; ttlSeconds?: number }
): Promise<string> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  if (!fs.existsSync(filePath)) {
    throw new Error(`Video file not found: ${filePath}`);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const resolvedBucket = resolveBucket(options?.bucket);
  const safeName = sanitizeFileName(path.basename(filePath) || 'video.mp4');
  const fileId = crypto.randomUUID();
  const storagePath = `video/${Date.now()}-${fileId}-${safeName}`;
  const fileBuffer = fs.readFileSync(filePath);

  const { error: uploadError } = await supabase.storage
    .from(resolvedBucket)
    .upload(storagePath, fileBuffer, {
      contentType: 'video/mp4',
      upsert: false,
      cacheControl: '3600',
    });

  if (uploadError) {
    if (isBucketNotFound(uploadError.message)) {
      throw new Error(
        `Storage bucket "${resolvedBucket}" not found. Check NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET and Supabase project.`
      );
    }
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  const { data, error: signedError } = await supabase.storage
    .from(resolvedBucket)
    .createSignedUrl(storagePath, resolveTtlSeconds(options?.ttlSeconds));

  if (signedError || !data?.signedUrl) {
    throw new Error(signedError?.message || 'Failed to create signed URL');
  }

  return data.signedUrl;
}

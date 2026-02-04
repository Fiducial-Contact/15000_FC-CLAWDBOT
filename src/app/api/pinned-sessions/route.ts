import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

type StoredPinnedSessions = {
  keys: string[];
  updatedAtMs: number;
};

const PINNED_SESSIONS_PREF_KEY = 'fc_pinned_sessions_v1';
const MAX_SESSION_KEY_LENGTH = 512;
const MAX_PINNED_SESSIONS = 50;

function normalizeSessionKey(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const key = value.trim();
  if (!key) return null;
  if (key.length > MAX_SESSION_KEY_LENGTH) return null;
  return key;
}

function normalizePinnedKeys(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const keys: string[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    const key = normalizeSessionKey(item);
    if (!key) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    keys.push(key);
    if (keys.length >= MAX_PINNED_SESSIONS) break;
  }
  return keys;
}

function normalizeStoredPinnedSessions(value: unknown): StoredPinnedSessions {
  if (Array.isArray(value)) {
    return { keys: normalizePinnedKeys(value), updatedAtMs: 0 };
  }
  if (!value || typeof value !== 'object') {
    return { keys: [], updatedAtMs: 0 };
  }
  const record = value as Record<string, unknown>;
  return {
    keys: normalizePinnedKeys(record.keys),
    updatedAtMs: typeof record.updatedAtMs === 'number' ? record.updatedAtMs : 0,
  };
}

export async function GET() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .select('preferences')
    .eq('user_id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const prefs =
    data?.preferences && typeof data.preferences === 'object'
      ? (data.preferences as Record<string, unknown>)
      : {};
  const pinnedSessions = normalizeStoredPinnedSessions(prefs[PINNED_SESSIONS_PREF_KEY]);

  return Response.json({ pinnedSessions });
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const rawKeys = (body as Record<string, unknown>).keys;
  if (!Array.isArray(rawKeys)) {
    return Response.json({ error: 'Invalid keys list' }, { status: 400 });
  }

  const keys = normalizePinnedKeys(rawKeys);
  const updatedAtMsRaw = (body as Record<string, unknown>).updatedAtMs;
  const updatedAtMs = typeof updatedAtMsRaw === 'number' ? updatedAtMsRaw : Date.now();

  // Load existing preferences so we can merge without clobbering unrelated keys.
  const { data: existingProfile, error: existingError } = await supabase
    .from('user_profiles')
    .select('preferences')
    .eq('user_id', user.id)
    .single();

  if (existingError && existingError.code !== 'PGRST116') {
    return Response.json({ error: existingError.message }, { status: 500 });
  }

  const existingPrefs =
    existingProfile?.preferences && typeof existingProfile.preferences === 'object'
      ? (existingProfile.preferences as Record<string, unknown>)
      : {};

  const nextPrefs: Record<string, unknown> = {
    ...existingPrefs,
    [PINNED_SESSIONS_PREF_KEY]: {
      keys,
      updatedAtMs,
    } satisfies StoredPinnedSessions,
  };

  const { error: upsertError } = await supabase
    .from('user_profiles')
    .upsert(
      {
        user_id: user.id,
        preferences: nextPrefs,
      },
      { onConflict: 'user_id' }
    );

  if (upsertError) {
    return Response.json({ error: upsertError.message }, { status: 500 });
  }

  return Response.json({ pinnedSessions: { keys, updatedAtMs } satisfies StoredPinnedSessions });
}


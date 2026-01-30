import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

type SessionTitleSource = 'auto' | 'user' | 'remote';

type StoredSessionTitle = {
  title: string;
  source: SessionTitleSource;
  updatedAtMs: number;
};

const SESSION_TITLES_PREF_KEY = 'fc_session_titles_v1';
const MAX_SESSION_TITLES = 500;
const MAX_SESSION_KEY_LENGTH = 512;
const MAX_TITLE_LENGTH = 160;

function normalizeStoredTitle(value: unknown): StoredSessionTitle | null {
  if (typeof value === 'string') {
    const title = value.trim();
    if (!title) return null;
    return { title: title.slice(0, MAX_TITLE_LENGTH), source: 'auto', updatedAtMs: 0 };
  }
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  const rawTitle = typeof record.title === 'string' ? record.title.trim() : '';
  if (!rawTitle) return null;
  const rawSource = record.source;
  const source: SessionTitleSource =
    rawSource === 'user' || rawSource === 'remote' ? rawSource : 'auto';
  const updatedAtMs = typeof record.updatedAtMs === 'number' ? record.updatedAtMs : 0;
  return {
    title: rawTitle.slice(0, MAX_TITLE_LENGTH),
    source,
    updatedAtMs,
  };
}

function normalizeSessionKey(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const key = value.trim();
  if (!key) return null;
  if (key.length > MAX_SESSION_KEY_LENGTH) return null;
  return key;
}

function normalizeTitleMap(value: unknown): Record<string, StoredSessionTitle> {
  if (!value || typeof value !== 'object') return {};
  const record = value as Record<string, unknown>;
  const next: Record<string, StoredSessionTitle> = {};
  for (const [rawKey, rawValue] of Object.entries(record)) {
    const key = normalizeSessionKey(rawKey);
    if (!key) continue;
    const entry = normalizeStoredTitle(rawValue);
    if (!entry) continue;
    next[key] = entry;
  }
  return next;
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
  const titles = normalizeTitleMap(prefs[SESSION_TITLES_PREF_KEY]);

  return Response.json({ titles });
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

  const rawSet = (body as Record<string, unknown>).set;
  const rawRemove = (body as Record<string, unknown>).remove;

  const setMap = rawSet ? normalizeTitleMap(rawSet) : {};
  if (Object.keys(setMap).length > MAX_SESSION_TITLES) {
    return Response.json({ error: 'Too many session titles in request' }, { status: 400 });
  }

  const removeList: string[] = [];
  if (typeof rawRemove !== 'undefined') {
    if (!Array.isArray(rawRemove)) {
      return Response.json({ error: 'Invalid remove list' }, { status: 400 });
    }
    for (const item of rawRemove) {
      const key = normalizeSessionKey(item);
      if (!key) {
        return Response.json({ error: 'Invalid session key in remove list' }, { status: 400 });
      }
      removeList.push(key);
    }
  }

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

  const existingTitles = normalizeTitleMap(existingPrefs[SESSION_TITLES_PREF_KEY]);
  const nextTitles: Record<string, StoredSessionTitle> = { ...existingTitles };

  for (const [key, entry] of Object.entries(setMap)) {
    nextTitles[key] = entry;
  }
  for (const key of removeList) {
    delete nextTitles[key];
  }

  const nextPrefs: Record<string, unknown> = {
    ...existingPrefs,
    [SESSION_TITLES_PREF_KEY]: nextTitles,
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

  return Response.json({ titles: nextTitles });
}


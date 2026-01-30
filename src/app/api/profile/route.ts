import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { profileFromRow, profileToRow } from '@/lib/profile';
import type { UserProfile } from '@/lib/types/profile';

export const runtime = 'nodejs';

export async function GET() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') {
    return Response.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return Response.json({ profile: null, recentLearning: [] });
  }

  const { data: learningData, error: learningError } = await supabase
    .from('learning_events')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20);

  if (learningError) {
    console.error('Failed to load learning events:', learningError);
  }

  return Response.json({
    profile: profileFromRow(data),
    recentLearning: learningError ? [] : (learningData ?? []),
  });
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: UserProfile;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const row = profileToRow(body, user.id);
  // Preserve any additional preference keys stored server-side (e.g. session titles).
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

  row.preferences = {
    ...existingPrefs,
    ...(row.preferences as Record<string, unknown>),
  };

  const { data, error } = await supabase
    .from('user_profiles')
    .upsert(row, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ profile: profileFromRow(data) });
}

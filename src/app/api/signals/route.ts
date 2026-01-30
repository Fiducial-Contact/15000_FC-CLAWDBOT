import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const MAX_BATCH_SIZE = 50;

interface SignalInput {
  signal_type: string;
  payload?: Record<string, unknown>;
  session_key_hash?: string;
  created_at?: string;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { signals: SignalInput[] };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!Array.isArray(body.signals) || body.signals.length === 0) {
    return Response.json({ error: 'signals array required' }, { status: 400 });
  }

  const signals = body.signals.slice(0, MAX_BATCH_SIZE);

  const rows = signals.map((s) => ({
    user_id: user.id,
    signal_type: s.signal_type,
    payload: s.payload ?? {},
    session_key_hash: s.session_key_hash ?? null,
    created_at: s.created_at ?? new Date().toISOString(),
  }));

  const { error } = await supabase.from('user_signals').insert(rows);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ inserted: rows.length });
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const signalType = url.searchParams.get('type');
  const rawLimit = Number(url.searchParams.get('limit') ?? '50');
  const rawOffset = Number(url.searchParams.get('offset') ?? '0');

  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(Math.floor(rawLimit), 1), 100) : 50;
  const offset = Number.isFinite(rawOffset) ? Math.max(Math.floor(rawOffset), 0) : 0;

  let query = supabase
    .from('user_signals')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (signalType) {
    query = query.eq('signal_type', signalType);
  }

  const { data, error } = await query;

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ signals: data, count: data?.length ?? 0 });
}

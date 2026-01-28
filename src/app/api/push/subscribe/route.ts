import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const GATEWAY_AGENT_ID = 'work';
const WEBCHAT_CHANNEL = 'webchat';

type SubscriptionPayload = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

function parsePeerId(sessionKey: string) {
  const parts = sessionKey.split(':');
  if (parts.length < 5) return null;
  if (parts[0] !== 'agent' || parts[1] !== GATEWAY_AGENT_ID) return null;
  if (parts[2] !== WEBCHAT_CHANNEL) return null;
  if (parts[3] !== 'dm') return null;
  return parts.slice(4).join(':');
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const subscription = body?.subscription as SubscriptionPayload | undefined;
  const sessionKey = body?.sessionKey as string | undefined;

  if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
    return Response.json({ error: 'Invalid subscription payload' }, { status: 400 });
  }
  if (!sessionKey) {
    return Response.json({ error: 'Session key is required' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data?.user;
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const peerId = parsePeerId(sessionKey);
  if (!peerId || !peerId.startsWith(user.id)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { error } = await supabase.from('web_push_subscriptions').upsert(
    {
      user_id: user.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      peer_id: peerId,
      user_agent: request.headers.get('user-agent'),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'endpoint' }
  );

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}

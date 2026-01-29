import { NextRequest } from 'next/server';
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const GATEWAY_AGENT_ID = 'work';
const WEBCHAT_CHANNEL = 'webchat';

function parsePeerId(sessionKey: string) {
  const parts = sessionKey.split(':');
  if (parts.length < 5) return null;
  if (parts[0] !== 'agent' || parts[1] !== GATEWAY_AGENT_ID) return null;
  if (parts[2] !== WEBCHAT_CHANNEL) return null;
  if (parts[3] !== 'dm') return null;
  return parts.slice(4).join(':');
}

function isPushGone(err: unknown) {
  if (!err || typeof err !== 'object') return false;
  if (!('statusCode' in err)) return false;
  const status = (err as { statusCode?: number }).statusCode;
  return status === 404 || status === 410;
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const apiToken = process.env.WEB_PUSH_API_TOKEN || '';
    if (!apiToken || authHeader !== `Bearer ${apiToken}`) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const sessionKey = body?.sessionKey as string | undefined;
    if (!sessionKey) {
      return Response.json({ error: 'Session key is required' }, { status: 400 });
    }

    const peerId = parsePeerId(sessionKey);
    if (!peerId) {
      return Response.json({ error: 'Invalid session key' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    if (!supabaseUrl || !serviceKey) {
      return Response.json({ error: 'Missing Supabase service configuration' }, { status: 500 });
    }

    const publicKey = process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY || '';
    const privateKey = process.env.WEB_PUSH_PRIVATE_KEY || '';
    const subject = process.env.WEB_PUSH_SUBJECT || 'mailto:admin@fiducial.com';
    if (!publicKey || !privateKey) {
      return Response.json({ error: 'Missing VAPID keys' }, { status: 500 });
    }

    webpush.setVapidDetails(subject, publicKey, privateKey);

  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const { data, error } = await supabase
    .from('web_push_subscriptions')
    .select('endpoint,p256dh,auth,user_id,peer_id');

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const title = String(body?.title || 'New message');
  const messageBody = String(body?.body || 'You have a new message.');
  const url = String(body?.url || '/chat');
  const icon = String(body?.icon || '/brand/favicon.png');
  const badge = String(body?.badge || '/brand/favicon.png');

  let delivered = 0;
  let failed = 0;

  const targets = (data || []).filter((row) => {
    if (row.peer_id === peerId) return true;
    return typeof row.user_id === 'string' && peerId.startsWith(row.user_id);
  });

  for (const row of targets) {
    const subscription = {
      endpoint: row.endpoint,
      keys: {
        p256dh: row.p256dh,
        auth: row.auth,
      },
    };

    try {
      await webpush.sendNotification(
        subscription,
        JSON.stringify({ title, body: messageBody, url, icon, badge })
      );
      delivered += 1;
    } catch (err) {
      failed += 1;
      if (isPushGone(err)) {
        await supabase.from('web_push_subscriptions').delete().eq('endpoint', row.endpoint);
      }
    }
  }

    return Response.json({ ok: true, delivered, failed });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return Response.json({ error: message }, { status: 500 });
  }
}

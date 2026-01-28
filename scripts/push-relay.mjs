import WebSocket from 'ws';

const wsUrl = process.env.GATEWAY_WS_URL;
const token = process.env.GATEWAY_TOKEN;
const sendUrl = process.env.WEB_PUSH_SEND_URL;
const apiToken = process.env.WEB_PUSH_API_TOKEN;

if (!wsUrl || !sendUrl || !apiToken) {
  console.error('Missing env: GATEWAY_WS_URL, WEB_PUSH_SEND_URL, WEB_PUSH_API_TOKEN');
  process.exit(1);
}

let requestId = 0;
let ws;

const sendRequest = (method, params) => {
  const id = `req_${++requestId}`;
  const payload = { type: 'req', id, method, params };
  ws.send(JSON.stringify(payload));
};

const extractText = (message) => {
  if (!message) return '';
  const role = message.role;
  if (role && role !== 'assistant') return '';
  const content = message.content ?? message.text ?? message.output ?? message;
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((block) => {
        if (typeof block === 'string') return block;
        if (block && typeof block === 'object' && 'text' in block) return String(block.text || '');
        return '';
      })
      .filter(Boolean)
      .join('\n');
  }
  if (content && typeof content === 'object' && 'text' in content) {
    return String(content.text || '');
  }
  return '';
};

const sendPush = async (sessionKey, text) => {
  const body = text ? text.slice(0, 180) : 'You have a new message.';
  const response = await fetch(sendUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiToken}`,
    },
    body: JSON.stringify({
      sessionKey,
      title: 'New message',
      body,
      url: '/chat',
    }),
  });

  if (!response.ok) {
    const data = await response.text().catch(() => '');
    console.error('Push send failed:', response.status, data);
  }
};

const handleMessage = async (raw) => {
  let msg;
  try {
    msg = JSON.parse(raw.toString());
  } catch {
    return;
  }

  if (msg.type === 'event' && msg.event === 'connect.challenge') {
    const params = {
      minProtocol: 3,
      maxProtocol: 3,
      client: {
        id: 'push-relay',
        displayName: 'fc-web-push',
        version: '1.0.0',
        platform: 'node',
        mode: 'webchat',
        instanceId: 'push-relay',
      },
      role: 'operator',
      scopes: ['operator.read'],
      device: undefined,
      caps: [],
      commands: [],
      permissions: {},
      auth: token ? { token } : undefined,
      userAgent: 'push-relay',
      locale: 'en-US',
    };
    sendRequest('connect', params);
    return;
  }

  if (msg.type === 'event' && msg.event === 'chat') {
    const payload = msg.payload || {};
    if (payload.state !== 'final') return;
    if (!payload.sessionKey) return;
    const text = extractText(payload.message);
    if (!text) return;
    await sendPush(payload.sessionKey, text);
  }
};

const connect = () => {
  ws = new WebSocket(wsUrl);

  ws.on('open', () => {
    console.log('Push relay connected');
  });

  ws.on('message', (data) => {
    handleMessage(data);
  });

  ws.on('close', () => {
    console.log('Push relay disconnected, retrying');
    setTimeout(connect, 2000);
  });

  ws.on('error', (err) => {
    console.error('Push relay error:', err.message || err);
  });
};

connect();

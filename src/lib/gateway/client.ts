import { getPublicKeyAsync, signAsync, utils } from '@noble/ed25519';
import type { GatewayMessage, ChatEventPayload, SessionEntry, ToolEventPayload, GatewaySkillStatus } from './types';

type Pending = {
  resolve: (value: unknown) => void;
  reject: (err: Error) => void;
};

type GatewayHelloOk = {
  type: 'hello-ok';
  protocol: number;
  auth?: {
    deviceToken?: string;
    role?: string;
    scopes?: string[];
    issuedAtMs?: number;
  };
};

type GatewayClientOptions = {
  url: string;
  token?: string;
  password?: string;
  clientName?: string;
  clientVersion?: string;
  platform?: string;
  mode?: string;
  instanceId?: string;
  scopes?: string[];
  userId?: string;
};

type DeviceIdentity = {
  deviceId: string;
  publicKey: string;
  privateKey: string;
};

type StoredIdentity = {
  version: 1;
  deviceId: string;
  publicKey: string;
  privateKey: string;
  createdAtMs: number;
};

type DeviceAuthEntry = {
  token: string;
  role: string;
  scopes: string[];
  updatedAtMs: number;
};

type DeviceAuthStore = {
  version: 1;
  deviceId: string;
  tokens: Record<string, DeviceAuthEntry>;
};

type ChatHandler = (event: ChatEventPayload) => void;
type ToolHandler = (event: ToolEventPayload) => void;

const IDENTITY_STORAGE_KEY = 'clawdbot-device-identity-v1';
const DEVICE_AUTH_STORAGE_KEY = 'clawdbot.device.auth.v1';

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/g, '');
}

function base64UrlDecode(input: string): Uint8Array {
  const normalized = input.replaceAll('-', '+').replaceAll('_', '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i);
  return out;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function fingerprintPublicKey(publicKey: Uint8Array): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', new Uint8Array(publicKey).buffer);
  return bytesToHex(new Uint8Array(hash));
}

async function generateIdentity(seed?: string): Promise<DeviceIdentity> {
  let privateKey: Uint8Array;
  if (seed) {
    const seedBytes = new TextEncoder().encode(seed);
    const hash = await crypto.subtle.digest('SHA-256', seedBytes);
    privateKey = new Uint8Array(hash);
  } else {
    privateKey = utils.randomSecretKey();
  }
  const publicKey = await getPublicKeyAsync(privateKey);
  const deviceId = await fingerprintPublicKey(publicKey);
  return {
    deviceId,
    publicKey: base64UrlEncode(publicKey),
    privateKey: base64UrlEncode(privateKey),
  };
}

async function loadOrCreateDeviceIdentity(userId?: string): Promise<DeviceIdentity> {
  const storageKey = userId ? `${IDENTITY_STORAGE_KEY}:${userId}` : IDENTITY_STORAGE_KEY;

  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw) as StoredIdentity;
      if (
        parsed?.version === 1 &&
        typeof parsed.deviceId === 'string' &&
        typeof parsed.publicKey === 'string' &&
        typeof parsed.privateKey === 'string'
      ) {
        const derivedId = await fingerprintPublicKey(base64UrlDecode(parsed.publicKey));
        if (derivedId !== parsed.deviceId) {
          const updated: StoredIdentity = {
            ...parsed,
            deviceId: derivedId,
          };
          localStorage.setItem(storageKey, JSON.stringify(updated));
          return {
            deviceId: derivedId,
            publicKey: parsed.publicKey,
            privateKey: parsed.privateKey,
          };
        }
        return {
          deviceId: parsed.deviceId,
          publicKey: parsed.publicKey,
          privateKey: parsed.privateKey,
        };
      }
    }
  } catch {
    // ignore and regenerate
  }

  const seed = userId ? `fc-webchat:${userId}` : undefined;
  const identity = await generateIdentity(seed);
  const stored: StoredIdentity = {
    version: 1,
    deviceId: identity.deviceId,
    publicKey: identity.publicKey,
    privateKey: identity.privateKey,
    createdAtMs: Date.now(),
  };
  localStorage.setItem(storageKey, JSON.stringify(stored));
  return identity;
}

async function signDevicePayload(privateKeyBase64Url: string, payload: string) {
  const key = base64UrlDecode(privateKeyBase64Url);
  const data = new TextEncoder().encode(payload);
  const sig = await signAsync(data, key);
  return base64UrlEncode(sig);
}

function normalizeRole(role: string): string {
  return role.trim();
}

function normalizeScopes(scopes: string[] | undefined): string[] {
  if (!Array.isArray(scopes)) return [];
  const out = new Set<string>();
  for (const scope of scopes) {
    const trimmed = scope.trim();
    if (trimmed) out.add(trimmed);
  }
  return [...out].sort();
}

function readDeviceAuthStore(): DeviceAuthStore | null {
  try {
    const raw = window.localStorage.getItem(DEVICE_AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DeviceAuthStore;
    if (!parsed || parsed.version !== 1) return null;
    if (!parsed.deviceId || typeof parsed.deviceId !== 'string') return null;
    if (!parsed.tokens || typeof parsed.tokens !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeDeviceAuthStore(store: DeviceAuthStore) {
  try {
    window.localStorage.setItem(DEVICE_AUTH_STORAGE_KEY, JSON.stringify(store));
  } catch {
    // ignore
  }
}

function loadDeviceAuthToken(params: { deviceId: string; role: string }): DeviceAuthEntry | null {
  const store = readDeviceAuthStore();
  if (!store || store.deviceId !== params.deviceId) return null;
  const role = normalizeRole(params.role);
  const entry = store.tokens[role];
  if (!entry || typeof entry.token !== 'string') return null;
  return entry;
}

function storeDeviceAuthToken(params: {
  deviceId: string;
  role: string;
  token: string;
  scopes?: string[];
}): DeviceAuthEntry {
  const role = normalizeRole(params.role);
  const next: DeviceAuthStore = {
    version: 1,
    deviceId: params.deviceId,
    tokens: {},
  };
  const existing = readDeviceAuthStore();
  if (existing && existing.deviceId === params.deviceId) {
    next.tokens = { ...existing.tokens };
  }
  const entry: DeviceAuthEntry = {
    token: params.token,
    role,
    scopes: normalizeScopes(params.scopes),
    updatedAtMs: Date.now(),
  };
  next.tokens[role] = entry;
  writeDeviceAuthStore(next);
  return entry;
}

function clearDeviceAuthToken(params: { deviceId: string; role: string }) {
  const store = readDeviceAuthStore();
  if (!store || store.deviceId !== params.deviceId) return;
  const role = normalizeRole(params.role);
  if (!store.tokens[role]) return;
  const next = { ...store, tokens: { ...store.tokens } };
  delete next.tokens[role];
  writeDeviceAuthStore(next);
}

function buildDeviceAuthPayload(params: {
  deviceId: string;
  clientId: string;
  clientMode: string;
  role: string;
  scopes: string[];
  signedAtMs: number;
  token?: string | null;
  nonce?: string | null;
  version?: 'v1' | 'v2';
}): string {
  const version = params.version ?? (params.nonce ? 'v2' : 'v1');
  const scopes = params.scopes.join(',');
  const token = params.token ?? '';
  const base = [
    version,
    params.deviceId,
    params.clientId,
    params.clientMode,
    params.role,
    scopes,
    String(params.signedAtMs),
    token,
  ];
  if (version === 'v2') {
    base.push(params.nonce ?? '');
  }
  return base.join('|');
}

export class GatewayClient {
  private ws: WebSocket | null = null;
  private requestId = 0;
  private pendingRequests = new Map<string, Pending>();
  private messageHandlers = new Set<ChatHandler>();
  private toolHandlers = new Set<ToolHandler>();
  private connected = false;
  private connectNonce: string | null = null;
  private connectSent = false;
  private connectResolve?: (value: void) => void;
  private connectReject?: (error: Error) => void;

  constructor(private opts: GatewayClientOptions) {}

  private normalizeToolEvent(raw: unknown): ToolEventPayload | null {
    if (!raw || typeof raw !== 'object') return null;
    const payload = raw as Record<string, unknown>;
    const sessionKey = payload.sessionKey as string | undefined;
    if (!sessionKey) return null;
    const runId = (payload.runId as string | undefined) ?? '';
    const toolName =
      (payload.toolName as string | undefined) ||
      (payload.name as string | undefined) ||
      (payload.tool as string | undefined) ||
      'Tool';
    const rawToolCallId =
      (payload.toolCallId as string | undefined) ||
      (payload.callId as string | undefined) ||
      (payload.id as string | undefined) ||
      (payload.toolId as string | undefined);
    const toolCallId = rawToolCallId || `${runId || 'tool'}:${toolName}`;
    const phaseRaw =
      (payload.phase as string | undefined) ||
      (payload.state as string | undefined) ||
      (payload.status as string | undefined) ||
      'update';
    const phase =
      phaseRaw === 'start' || phaseRaw === 'update' || phaseRaw === 'end'
        ? phaseRaw
        : phaseRaw === 'result' ||
            phaseRaw === 'complete' ||
            phaseRaw === 'completed' ||
            phaseRaw === 'done' ||
            phaseRaw === 'finish' ||
            phaseRaw === 'finished'
          ? 'end'
          : 'update';
    const outputDelta =
      (payload.outputDelta as string | undefined) ||
      (payload.delta as string | undefined) ||
      (payload.contentDelta as string | undefined);
    const meta = payload.meta as Record<string, unknown> | undefined;
    const outputRaw = payload.output ?? payload.result ?? payload.text ?? payload.content ?? meta?.output ?? meta?.result ?? meta?.content;
    const output =
      typeof outputRaw === 'string'
        ? outputRaw
        : outputRaw
          ? JSON.stringify(outputRaw)
          : undefined;
    const error =
      (payload.error as string | undefined) ||
      (payload.errorMessage as string | undefined);

    return {
      runId,
      sessionKey,
      toolCallId,
      toolName,
      phase,
      parameters: (payload.args || payload.parameters || payload.input) as Record<string, unknown> | undefined,
      output,
      outputDelta,
      status: payload.status as ToolEventPayload['status'] | undefined,
      error,
    };
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.connectResolve = resolve;
      this.connectReject = reject;
      this.ws = new WebSocket(this.opts.url);

      this.ws.onopen = () => {
        // wait for connect.challenge
      };

      this.ws.onmessage = async (event) => {
        try {
          const msg: GatewayMessage = JSON.parse(event.data);
          await this.handleMessage(msg);
        } catch (err) {
          console.error('[Gateway] Failed to parse message:', err);
        }
      };

      this.ws.onerror = () => {
        if (!this.connected) {
          reject(new Error('WebSocket connection failed'));
        }
      };

      this.ws.onclose = () => {
        this.connected = false;
        this.ws = null;
      };
    });
  }

  private async handleMessage(msg: GatewayMessage) {
    if (msg.type === 'event' && msg.event === 'connect.challenge') {
      const payload = msg.payload as { nonce?: string } | undefined;
      this.connectNonce = payload?.nonce ?? null;
      await this.sendConnectRequest();
      return;
    }

    if (msg.type === 'res' && msg.id) {
      const pending = this.pendingRequests.get(msg.id);
      if (pending) {
        this.pendingRequests.delete(msg.id);
        if (msg.ok) {
          pending.resolve(msg.payload);
        } else {
          pending.reject(new Error(msg.error?.message || 'Request failed'));
        }
      }

      const payload = msg.payload as { type?: string } | undefined;
      if (payload?.type === 'hello-ok') {
        this.connected = true;
        this.connectResolve?.();
      }
      return;
    }

    if (msg.type === 'event' && msg.event === 'chat') {
      const payload = msg.payload as ChatEventPayload;
      if (payload?.sessionKey) {
        this.messageHandlers.forEach(handler => handler(payload));
      }
    }

    if (msg.type === 'event' && msg.event === 'tool') {
      const payload = this.normalizeToolEvent(msg.payload);
      if (payload) {
        this.toolHandlers.forEach(handler => handler(payload));
      }
    }

    if (msg.type === 'event' && msg.event === 'stream') {
      const streamPayload = msg.payload as { stream?: string; payload?: unknown } | undefined;
      if (streamPayload?.stream === 'tool') {
        const payload = this.normalizeToolEvent(streamPayload.payload);
        if (payload) {
          this.toolHandlers.forEach(handler => handler(payload));
        }
      }
    }

    if (msg.type === 'event' && msg.event === 'agent') {
      const agentPayload = msg.payload as {
        sessionKey?: string;
        runId?: string;
        stream?: string;
        data?: Record<string, unknown>;
        output?: unknown;
        result?: unknown;
        content?: unknown;
        delta?: string;
        outputDelta?: string;
        contentDelta?: string;
      } | undefined;
      if (agentPayload?.stream !== 'tool' || !agentPayload.sessionKey) {
        return;
      }
      const merged = {
        ...(agentPayload.data ?? {}),
        sessionKey: agentPayload.sessionKey,
        runId: agentPayload.runId,
        ...(agentPayload.output !== undefined && { output: agentPayload.output }),
        ...(agentPayload.result !== undefined && { result: agentPayload.result }),
        ...(agentPayload.content !== undefined && { content: agentPayload.content }),
        ...(agentPayload.delta !== undefined && { delta: agentPayload.delta }),
        ...(agentPayload.outputDelta !== undefined && { outputDelta: agentPayload.outputDelta }),
        ...(agentPayload.contentDelta !== undefined && { contentDelta: agentPayload.contentDelta }),
      };
      const toolEvent = this.normalizeToolEvent(merged);
      if (toolEvent) {
        this.toolHandlers.forEach(handler => handler(toolEvent));
      }
    }
  }

  private async sendConnectRequest() {
    if (this.connectSent) return;
    this.connectSent = true;

    const scopes = this.opts.scopes ?? ['operator.read', 'operator.write', 'operator.admin'];
    const role = 'operator';
    const isSecureContext = typeof crypto !== 'undefined' && !!crypto.subtle;

    let deviceIdentity: DeviceIdentity | null = null;
    let canFallbackToShared = false;
    let authToken = this.opts.token;

    if (isSecureContext) {
      deviceIdentity = await loadOrCreateDeviceIdentity(this.opts.userId);
      const storedToken = loadDeviceAuthToken({
        deviceId: deviceIdentity.deviceId,
        role,
      })?.token;
      authToken = storedToken ?? this.opts.token;
      canFallbackToShared = Boolean(storedToken && this.opts.token);
    }

    const auth = authToken || this.opts.password
      ? { token: authToken, password: this.opts.password }
      : undefined;

    let device:
      | {
          id: string;
          publicKey: string;
          signature: string;
          signedAt: number;
          nonce: string | undefined;
        }
      | undefined;

    if (isSecureContext && deviceIdentity) {
      const signedAtMs = Date.now();
      const nonce = this.connectNonce ?? undefined;
      const payload = buildDeviceAuthPayload({
        deviceId: deviceIdentity.deviceId,
        clientId: 'cli',
        clientMode: this.opts.mode ?? 'webchat',
        role,
        scopes,
        signedAtMs,
        token: authToken ?? null,
        nonce,
      });
      const signature = await signDevicePayload(deviceIdentity.privateKey, payload);
      device = {
        id: deviceIdentity.deviceId,
        publicKey: deviceIdentity.publicKey,
        signature,
        signedAt: signedAtMs,
        nonce,
      };
    }

    const params = {
      minProtocol: 3,
      maxProtocol: 3,
      client: {
        id: 'cli',
        displayName: this.opts.clientName ?? 'fc-team-chat',
        version: this.opts.clientVersion ?? '1.0.0',
        platform: this.opts.platform ?? 'web',
        mode: this.opts.mode ?? 'webchat',
        instanceId: this.opts.instanceId,
      },
      role,
      scopes,
      device,
      caps: [],
      commands: [],
      permissions: {},
      auth,
      userAgent: navigator.userAgent,
      locale: navigator.language,
    };

    try {
      const hello = await this.sendRequest('connect', params) as GatewayHelloOk;
      if (hello?.auth?.deviceToken && deviceIdentity) {
        storeDeviceAuthToken({
          deviceId: deviceIdentity.deviceId,
          role: hello.auth.role ?? role,
          token: hello.auth.deviceToken,
          scopes: hello.auth.scopes ?? [],
        });
      }
    } catch (err) {
      if (canFallbackToShared && deviceIdentity) {
        clearDeviceAuthToken({ deviceId: deviceIdentity.deviceId, role });
      }
      const errorMessage = err instanceof Error ? err.message : 'Connect failed';
      const isPairingRequired = errorMessage.toLowerCase().includes('pairing');
      if (isPairingRequired) {
        const codeMatch = errorMessage.match(/code[:\s]+([A-Z0-9-]+)/i);
        const pairingCode = codeMatch?.[1] || deviceIdentity?.deviceId?.slice(0, 8) || 'unknown';
        this.connectReject?.(new Error(`PAIRING_REQUIRED:${pairingCode}`));
      } else {
        this.connectReject?.(err instanceof Error ? err : new Error('Connect failed'));
      }
    }
  }

  private sendRequest(method: string, params: Record<string, unknown>): Promise<unknown> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      const id = `req_${++this.requestId}`;
      this.pendingRequests.set(id, { resolve, reject });

      const msg: GatewayMessage = {
        type: 'req',
        id,
        method,
        params,
      };

      this.ws.send(JSON.stringify(msg));
    });
  }

  async sendMessage(params: {
    sessionKey: string;
    message: string;
    idempotencyKey: string;
    attachments?: Array<{
      type: 'image';
      mimeType: string;
      fileName?: string;
      content: string;
    }>;
  }) {
    if (!this.connected) {
      throw new Error('Not connected to gateway');
    }

    const payload: Record<string, unknown> = {
      sessionKey: params.sessionKey,
      message: params.message,
      idempotencyKey: params.idempotencyKey,
    };

    if (params.attachments && params.attachments.length > 0) {
      payload.attachments = params.attachments;
    }

    const result = await this.sendRequest('chat.send', payload);

    return result as { runId?: string; status?: string };
  }

  async getHistory(sessionKey: string, limit = 200): Promise<unknown[]> {
    if (!this.connected) {
      throw new Error('Not connected to gateway');
    }

    const result = await this.sendRequest('chat.history', {
      sessionKey,
      limit,
    });

    const data = result as { messages?: unknown[] };
    return Array.isArray(data.messages) ? data.messages : [];
  }

  async listSessions(): Promise<SessionEntry[]> {
    if (!this.connected) {
      throw new Error('Not connected to gateway');
    }

    const result = await this.sendRequest('sessions.list', {});
    const data = result as { sessions?: Array<SessionEntry & { key?: string; sessionKey?: string }> };
    if (!Array.isArray(data.sessions)) return [];
    return data.sessions.map((session) => {
      const sessionKey = session.sessionKey || session.key || '';
      if (!sessionKey) return session as SessionEntry;
      return { ...session, sessionKey } as SessionEntry;
    });
  }

  async patchSession(sessionKey: string, patch: Record<string, unknown>): Promise<void> {
    if (!this.connected) {
      throw new Error('Not connected to gateway');
    }

    await this.sendRequest('sessions.patch', { key: sessionKey, ...patch });
  }

  async deleteSession(sessionKey: string): Promise<void> {
    if (!this.connected) {
      throw new Error('Not connected to gateway');
    }

    await this.sendRequest('sessions.delete', { key: sessionKey });
  }

  async abortChat(sessionKey: string): Promise<void> {
    if (!this.connected) {
      throw new Error('Not connected to gateway');
    }

    await this.sendRequest('chat.abort', { sessionKey });
  }

  onChat(handler: ChatHandler) {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  onTool(handler: ToolHandler) {
    this.toolHandlers.add(handler);
    return () => this.toolHandlers.delete(handler);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
    this.pendingRequests.clear();
    this.messageHandlers.clear();
    this.toolHandlers.clear();
  }

  isConnected() {
    return this.connected;
  }

  async skillsStatus(): Promise<GatewaySkillStatus[]> {
    if (!this.connected) {
      throw new Error('Not connected to gateway');
    }

    const result = await this.sendRequest('skills.status', {});
    const data = result as { skills?: Array<Record<string, unknown>> };
    if (!Array.isArray(data.skills)) return [];

    const resolveSource = (value: unknown): GatewaySkillStatus['source'] => {
      if (typeof value !== 'string') return undefined;
      if (value.includes('bundled')) return 'bundled';
      if (value.includes('workspace')) return 'workspace';
      if (value.includes('clawdhub')) return 'clawdhub';
      return undefined;
    };

    const resolveStatus = (skill: Record<string, unknown>): GatewaySkillStatus['status'] => {
      const error = typeof skill.error === 'string' ? skill.error : undefined;
      if (error) return 'error';

      const disabled = skill.disabled === true || skill.blockedByAllowlist === true;
      if (disabled) return 'disabled';

      if (skill.eligible === true) return 'ready';
      return 'missing';
    };

    return data.skills.map((skill) => {
      const name = typeof skill.name === 'string' ? skill.name : '';
      const status = resolveStatus(skill);
      return {
        name,
        status,
        enabled: typeof skill.enabled === 'boolean' ? skill.enabled : undefined,
        error: typeof skill.error === 'string' ? skill.error : undefined,
        source: resolveSource(skill.source),
        description: typeof skill.description === 'string' ? skill.description : undefined,
      };
    });
  }
}

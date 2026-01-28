export interface GatewayMessage {
  type: 'req' | 'res' | 'event';
  id?: string;
  method?: string;
  params?: Record<string, unknown>;
  ok?: boolean;
  payload?: unknown;
  error?: { code: string; message: string };
  event?: string;
  seq?: number;
}

export interface ConnectParams {
  minProtocol: number;
  maxProtocol: number;
  client: {
    id: string;
    version: string;
    platform: string;
    mode: string;
  };
  role: 'operator';
  scopes: string[];
  caps: never[];
  commands: never[];
  permissions: Record<string, never>;
  auth: { token?: string };
  locale: string;
  userAgent: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
}

export interface ChatEventPayload {
  runId: string;
  sessionKey: string;
  state: 'delta' | 'final' | 'aborted' | 'error';
  message?: unknown;
  errorMessage?: string;
}

export interface SessionOrigin {
  label?: string;
  provider?: string;
  from?: string;
  to?: string;
}

export interface SessionEntry {
  key?: string;
  sessionKey: string;
  sessionId: string;
  agentId?: string;
  updatedAt?: string;
  createdAt?: string;
  displayName?: string;
  channel?: string;
  origin?: SessionOrigin;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
}

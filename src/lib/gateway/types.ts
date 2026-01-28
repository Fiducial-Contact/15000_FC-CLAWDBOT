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
  label?: string;
  channel?: string;
  origin?: SessionOrigin;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  unreadCount?: number;
}

export type ChatContentBlockType = 'text' | 'thinking' | 'toolCall' | 'image' | 'image_url' | string;

export interface ChatContentBlock {
  type: ChatContentBlockType;
  text?: string;
  url?: string;
  data?: string;
  mimeType?: string;
  fileName?: string;
  [key: string]: unknown;
}

export type AttachmentKind = 'image' | 'file';

export interface ChatAttachmentInput {
  id: string;
  file: File;
  kind: AttachmentKind;
  previewUrl?: string;
}

export interface ChatAttachment {
  id: string;
  kind: AttachmentKind;
  fileName: string;
  mimeType: string;
  size: number;
  url?: string;
  previewUrl?: string;
  file?: File;
  status?: 'uploading' | 'ready' | 'error';
}

export type ToolExecutionStatus = 'running' | 'completed' | 'failed';

export interface ToolCallBlock extends ChatContentBlock {
  type: 'toolCall';
  toolCallId?: string;
  toolName: string;
  parameters?: Record<string, unknown>;
  result?: unknown;
  status?: ToolExecutionStatus;
  error?: string;
}

export interface ThinkingBlock extends ChatContentBlock {
  type: 'thinking';
  text: string;
}

export function isToolCallBlock(block: ChatContentBlock): block is ToolCallBlock {
  return block.type === 'toolCall';
}

export function isThinkingBlock(block: ChatContentBlock): block is ThinkingBlock {
  return block.type === 'thinking';
}

export type SkillSource = 'workspace' | 'bundled' | 'clawdhub';
export type SkillMetadataStatus = 'active' | 'disabled' | 'draft';
export type SkillRuntimeStatus = 'ready' | 'missing' | 'disabled' | 'error';

export interface GatewaySkillStatus {
  name: string;
  status: SkillRuntimeStatus;
  enabled?: boolean;
  error?: string;
  source?: SkillSource;
  description?: string;
}

export interface SkillRegistryEntry {
  id: string;
  skill_name: string;
  display_name: string | null;
  description: string | null;
  creator_id: string | null;
  creator_email: string | null;
  source: SkillSource;
  status: SkillMetadataStatus;
  icon: string | null;
  triggers: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface MergedSkill {
  name: string;
  displayName: string;
  description: string | null;
  creatorEmail: string | null;
  source: SkillSource;
  icon: string | null;
  triggers: string[];
  runtimeStatus: SkillRuntimeStatus;
  metadataStatus: SkillMetadataStatus;
  error?: string;
}

export type ToolEventPhase = 'start' | 'update' | 'end';

export interface ToolEventPayload {
  runId: string;
  sessionKey: string;
  toolCallId: string;
  toolName: string;
  phase: ToolEventPhase;
  parameters?: Record<string, unknown>;
  output?: string;
  outputDelta?: string;
  status?: ToolExecutionStatus;
  error?: string;
}

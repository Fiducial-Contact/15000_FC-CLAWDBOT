export type ActivityType = 'post' | 'comment' | 'reply' | 'daily' | 'agent';
export type ResultType = 'viral' | 'engaged' | 'moderate' | 'flat';
export type InfluenceType = 'local' | 'submolt' | 'cross-submolt' | 'platform';
export type SocialViewType = 'feed' | 'wins' | 'daily';

export interface ActivityEntry {
  id: string;
  agent_id: string;
  type: ActivityType;
  title: string | null;
  content: string | null;
  moltbook_post_id: string | null;
  moltbook_comment_id: string | null;
  parent_url: string | null;
  submolt: string | null;
  target_agent: string | null;
  url: string | null;
  karma: number;
  comment_count: number;
  result: ResultType | null;
  influence: InfluenceType | null;
  notes: string | null;
  created_at: string;
}

export interface DailySnapshot {
  id: string;
  agent_id: string;
  date: string;
  karma: number | null;
  rank: number | null;
  karma_delta: number | null;
  followers: number | null;
  posts_today: number | null;
  comments_today: number | null;
  top_post_url: string | null;
  notes: string | null;
  created_at: string;
}

export interface AgentMetrics {
  karma: number;
  rank: number;
  karmaDelta: number;
  followers: number;
  postsTotal: number;
  winRate: number;
  karmaTrend: number[];
  evaluatedTotal: number;
  viralTotal: number;
  karmaYesterday: number;
}

export interface AgentConfig {
  id: string;
  name: string;
  displayName: string;
  xHandle: string;
  moltbookProfile: string;
  notionDbId: string;
}

export const AGENTS: AgentConfig[] = [
  {
    id: 'finserveagent',
    name: 'FinServeAgent',
    displayName: 'FinServeAgent',
    xHandle: '@Fiducial_AI',
    moltbookProfile: 'https://moltbook.com/agent/finserveagent',
    notionDbId: '',
  },
];

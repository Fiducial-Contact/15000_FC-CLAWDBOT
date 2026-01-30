import { createClient } from '@/lib/supabase/client';
import type { ActivityEntry, DailySnapshot, AgentMetrics } from '@/lib/types/social';

const DEFAULT_PAGE_SIZE = 20;

export async function fetchFeed(
  agentId: string,
  cursor?: string,
  pageSize = DEFAULT_PAGE_SIZE
): Promise<ActivityEntry[]> {
  const supabase = createClient();
  let query = supabase
    .from('moltbook_activity')
    .select('*')
    .eq('agent_id', agentId)
    .in('type', ['post', 'comment', 'reply'])
    .order('created_at', { ascending: false })
    .limit(pageSize);

  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as ActivityEntry[];
}

export async function fetchWins(
  agentId: string,
  cursor?: string,
  pageSize = DEFAULT_PAGE_SIZE
): Promise<ActivityEntry[]> {
  const supabase = createClient();
  let query = supabase
    .from('moltbook_activity')
    .select('*')
    .eq('agent_id', agentId)
    .eq('result', 'viral')
    .order('karma', { ascending: false })
    .limit(pageSize);

  if (cursor) {
    query = query.lt('karma', parseInt(cursor, 10));
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as ActivityEntry[];
}

export async function fetchDaily(
  agentId: string,
  cursor?: string,
  pageSize = DEFAULT_PAGE_SIZE
): Promise<DailySnapshot[]> {
  const supabase = createClient();
  let query = supabase
    .from('moltbook_daily')
    .select('*')
    .eq('agent_id', agentId)
    .order('date', { ascending: false })
    .limit(pageSize);

  if (cursor) {
    query = query.lt('date', cursor);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as DailySnapshot[];
}

export async function fetchNetwork(
  agentId: string,
  cursor?: string,
  pageSize = DEFAULT_PAGE_SIZE
): Promise<ActivityEntry[]> {
  const supabase = createClient();
  let query = supabase
    .from('moltbook_activity')
    .select('*')
    .eq('agent_id', agentId)
    .not('target_agent', 'is', null)
    .order('created_at', { ascending: false })
    .limit(pageSize);

  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as ActivityEntry[];
}

export async function fetchSubmolt(
  agentId: string,
  cursor?: string,
  pageSize = DEFAULT_PAGE_SIZE
): Promise<ActivityEntry[]> {
  const supabase = createClient();
  let query = supabase
    .from('moltbook_activity')
    .select('*')
    .eq('agent_id', agentId)
    .eq('type', 'post')
    .order('created_at', { ascending: false })
    .limit(pageSize);

  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as ActivityEntry[];
}

export async function fetchMetrics(agentId: string): Promise<AgentMetrics> {
  const supabase = createClient();

  const { data: latest } = await supabase
    .from('moltbook_daily')
    .select('*')
    .eq('agent_id', agentId)
    .order('date', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { count: totalPosts } = await supabase
    .from('moltbook_activity')
    .select('*', { count: 'exact', head: true })
    .eq('agent_id', agentId)
    .in('type', ['post', 'comment', 'reply']);

  const { count: viralCount } = await supabase
    .from('moltbook_activity')
    .select('*', { count: 'exact', head: true })
    .eq('agent_id', agentId)
    .eq('result', 'viral');

  const { count: evaluatedCount } = await supabase
    .from('moltbook_activity')
    .select('*', { count: 'exact', head: true })
    .eq('agent_id', agentId)
    .not('result', 'is', null);

  const snapshot = latest as DailySnapshot | null;
  const winRate = evaluatedCount && evaluatedCount > 0
    ? Math.round(((viralCount ?? 0) / evaluatedCount) * 100)
    : 0;

  return {
    karma: snapshot?.karma ?? 0,
    rank: snapshot?.rank ?? 0,
    karmaDelta: snapshot?.karma_delta ?? 0,
    followers: snapshot?.followers ?? 0,
    postsTotal: totalPosts ?? 0,
    winRate,
  };
}

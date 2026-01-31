import { createClient } from '@/lib/supabase/client';
import type { ActivityEntry, DailySnapshot, AgentMetrics } from '@/lib/types/social';

const DEFAULT_PAGE_SIZE = 20;

export async function fetchFeed(
  agentId: string,
  cursor?: string,
  pageSize = DEFAULT_PAGE_SIZE,
  filterType?: 'post' | 'comment' | 'reply' | 'viral'
): Promise<ActivityEntry[]> {
  const supabase = createClient();
  let query = supabase
    .from('moltbook_activity')
    .select('*')
    .eq('agent_id', agentId);

  if (filterType === 'viral') {
    query = query.eq('result', 'viral');
  } else if (filterType) {
    query = query.eq('type', filterType);
  } else {
    query = query.in('type', ['post', 'comment', 'reply']);
  }

  query = query.order('created_at', { ascending: false }).limit(pageSize);

  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  const { data, error } = await query;
  if (error) throw error;
  const entries = (data ?? []) as ActivityEntry[];

  if (!filterType && entries.length > 1) {
    const POST_BOOST_MS = 30 * 60 * 1000;
    entries.sort((a, b) => {
      const aTime = new Date(a.created_at).getTime() + (a.type === 'post' ? POST_BOOST_MS : 0);
      const bTime = new Date(b.created_at).getTime() + (b.type === 'post' ? POST_BOOST_MS : 0);
      return bTime - aTime;
    });

    const existingIds = new Set(entries.map((e) => e.id));
    const postIdsWithComments = entries
      .filter((e) => e.type === 'post' && e.moltbook_post_id)
      .map((e) => e.moltbook_post_id!);

    if (postIdsWithComments.length > 0) {
      const { data: comments } = await supabase
        .from('moltbook_activity')
        .select('*')
        .eq('agent_id', agentId)
        .in('type', ['comment', 'reply'])
        .in('moltbook_post_id', postIdsWithComments)
        .order('created_at', { ascending: true });

      if (comments) {
        for (const c of comments as ActivityEntry[]) {
          if (!existingIds.has(c.id)) {
            entries.push(c);
            existingIds.add(c.id);
          }
        }
      }
    }
  }

  return entries;
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

export interface FeedFilterCounts {
  all: number;
  post: number;
  comment: number;
  reply: number;
  viral: number;
}

export async function fetchFilterCounts(agentId: string): Promise<FeedFilterCounts> {
  const supabase = createClient();
  const [allRes, postRes, commentRes, replyRes, viralRes] = await Promise.all([
    supabase.from('moltbook_activity').select('*', { count: 'exact', head: true }).eq('agent_id', agentId).in('type', ['post', 'comment', 'reply']),
    supabase.from('moltbook_activity').select('*', { count: 'exact', head: true }).eq('agent_id', agentId).eq('type', 'post'),
    supabase.from('moltbook_activity').select('*', { count: 'exact', head: true }).eq('agent_id', agentId).eq('type', 'comment'),
    supabase.from('moltbook_activity').select('*', { count: 'exact', head: true }).eq('agent_id', agentId).eq('type', 'reply'),
    supabase.from('moltbook_activity').select('*', { count: 'exact', head: true }).eq('agent_id', agentId).eq('result', 'viral'),
  ]);
  return {
    all: allRes.count ?? 0,
    post: postRes.count ?? 0,
    comment: commentRes.count ?? 0,
    reply: replyRes.count ?? 0,
    viral: viralRes.count ?? 0,
  };
}

export async function fetchMetrics(agentId: string): Promise<AgentMetrics> {
  const supabase = createClient();

  const [snapshotsResult, totalPostsResult, viralResult, evaluatedResult] = await Promise.all([
    supabase
      .from('moltbook_daily')
      .select('karma, rank, followers')
      .eq('agent_id', agentId)
      .order('date', { ascending: false })
      .limit(7),
    supabase
      .from('moltbook_activity')
      .select('*', { count: 'exact', head: true })
      .eq('agent_id', agentId)
      .in('type', ['post', 'comment', 'reply']),
    supabase
      .from('moltbook_activity')
      .select('*', { count: 'exact', head: true })
      .eq('agent_id', agentId)
      .eq('result', 'viral'),
    supabase
      .from('moltbook_activity')
      .select('*', { count: 'exact', head: true })
      .eq('agent_id', agentId)
      .not('result', 'is', null),
  ]);

  const snapshots = (snapshotsResult.data ?? []) as { karma: number | null; rank: number | null; followers: number | null }[];
  const totalPosts = totalPostsResult.count ?? 0;
  const viralCount = viralResult.count ?? 0;
  const evaluatedCount = evaluatedResult.count ?? 0;

  const latest = snapshots[0];
  const yesterday = snapshots[1];
  const karmaTrend = snapshots
    .map((s) => s.karma ?? 0)
    .reverse();

  const winRate = evaluatedCount > 0
    ? Math.round((viralCount / evaluatedCount) * 100)
    : 0;

  return {
    karma: latest?.karma ?? 0,
    rank: latest?.rank ?? 0,
    karmaDelta: latest && yesterday
      ? (latest.karma ?? 0) - (yesterday.karma ?? 0)
      : 0,
    followers: latest?.followers ?? 0,
    postsTotal: totalPosts,
    winRate,
    karmaTrend,
    evaluatedTotal: evaluatedCount,
    viralTotal: viralCount,
    karmaYesterday: yesterday?.karma ?? 0,
  };
}

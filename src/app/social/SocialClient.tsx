'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from '@/components/Header';
import { LoginModal } from '@/components/LoginModal';
import { createClient } from '@/lib/supabase/client';
import { AGENTS } from '@/lib/types/social';
import type { ActivityEntry, DailySnapshot, AgentMetrics, SocialViewType } from '@/lib/types/social';
import { fetchFeed, fetchWins, fetchDaily, fetchMetrics, fetchFilterCounts } from '@/lib/supabase/moltbook';
import type { FeedFilterCounts } from '@/lib/supabase/moltbook';
import { MetricsBar } from './components/MetricsBar';
import { TabBar } from './components/TabBar';
import { FeedView } from './components/FeedView';
import { WinsView } from './components/WinsView';
import { DailyView } from './components/DailyView';

interface SocialClientProps {
  userEmail: string;
  userId: string;
}

const REFRESH_INTERVAL = 2 * 60 * 1000;

export function SocialClient({ userEmail, userId }: SocialClientProps) {
  const isGuest = !userId;
  const router = useRouter();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<SocialViewType>('feed');
  const [activeAgent, setActiveAgent] = useState(AGENTS[0].id);
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [dailyEntries, setDailyEntries] = useState<DailySnapshot[]>([]);
  const [metrics, setMetrics] = useState<AgentMetrics>({
    karma: 0,
    rank: 0,
    karmaDelta: 0,
    followers: 0,
    postsTotal: 0,
    winRate: 0,
    karmaTrend: [],
    evaluatedTotal: 0,
    viralTotal: 0,
    karmaYesterday: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showAgentDropdown, setShowAgentDropdown] = useState(false);
  const [feedFilter, setFeedFilter] = useState<'all' | 'post' | 'comment' | 'reply' | 'viral'>('all');
  const [loadingMore, setLoadingMore] = useState(false);
  const [filterCounts, setFilterCounts] = useState<FeedFilterCounts | undefined>(undefined);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [metricsData] = await Promise.all([
        fetchMetrics(activeAgent),
      ]);
      setMetrics(metricsData);

      if (activeTab === 'daily') {
        const dailyData = await fetchDaily(activeAgent);
        setDailyEntries(dailyData);
      } else if (activeTab === 'wins') {
        setEntries(await fetchWins(activeAgent));
      } else {
        const dbFilter = feedFilter === 'all' ? undefined : feedFilter;
        const feedPageSize = feedFilter === 'all' ? 50 : 20;
        const [feedData, counts] = await Promise.all([
          fetchFeed(activeAgent, undefined, feedPageSize, dbFilter),
          fetchFilterCounts(activeAgent),
        ]);
        setEntries(feedData);
        setFilterCounts(counts);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, activeAgent, feedFilter]);

  useEffect(() => {
    setLoading(true);
    loadData();
  }, [loadData]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!document.hidden) {
        loadData();
      }
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleTabChange = (tab: SocialViewType) => {
    setActiveTab(tab);
    setFeedFilter('all');
    setLoading(true);
  };

  const handleFeedFilterChange = (filter: 'all' | 'post' | 'comment' | 'reply' | 'viral') => {
    setFeedFilter(filter);
    setLoading(true);
  };

  const handleLoadMore = async () => {
    if (loadingMore || entries.length === 0) return;
    setLoadingMore(true);
    try {
      const lastEntry = entries[entries.length - 1];
      const dbFilter = feedFilter === 'all' ? undefined : feedFilter;
      const more = await fetchFeed(activeAgent, lastEntry.created_at, 20, dbFilter);
      if (more.length > 0) {
        setEntries((prev) => {
          const existingIds = new Set(prev.map((e) => e.id));
          const unique = more.filter((e) => !existingIds.has(e.id));
          return [...prev, ...unique];
        });
      }
    } catch {
      // silent
    } finally {
      setLoadingMore(false);
    }
  };

  const handleAgentChange = (agentId: string) => {
    setActiveAgent(agentId);
    setShowAgentDropdown(false);
    setLoading(true);
  };

  const handleLogout = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  }, [router]);

  const activeAgentConfig = AGENTS.find((a) => a.id === activeAgent) ?? AGENTS[0];

  return (
    <div className="min-h-screen bg-[var(--fc-off-white)]">
      <Header
        userName={isGuest ? undefined : userEmail}
        onLogout={isGuest ? undefined : handleLogout}
        onLogin={isGuest ? () => setIsLoginModalOpen(true) : undefined}
      />
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-[28px] font-bold text-[var(--fc-black)]">
              {activeAgentConfig.displayName}
            </h1>
            {AGENTS.length > 1 && (
              <div className="relative">
                <button
                  onClick={() => setShowAgentDropdown(!showAgentDropdown)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--fc-border-gray)] bg-white hover:bg-[var(--fc-subtle-gray)] transition-colors"
                >
                  <span className="text-sm font-medium text-[var(--fc-black)]">
                    {activeAgentConfig.name}
                  </span>
                  <ChevronDown className="w-4 h-4 text-[var(--fc-body-gray)]" />
                </button>
                <AnimatePresence>
                  {showAgentDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="absolute top-full mt-2 left-0 w-48 bg-white rounded-lg border border-[var(--fc-border-gray)] shadow-lg py-1 z-10"
                    >
                      {AGENTS.map((agent) => (
                        <button
                          key={agent.id}
                          onClick={() => handleAgentChange(agent.id)}
                          className={`w-full text-left px-4 py-2 hover:bg-[var(--fc-subtle-gray)] transition-colors ${
                            agent.id === activeAgent
                              ? 'bg-[var(--fc-subtle-gray)] font-medium'
                              : ''
                          }`}
                        >
                          <span className="text-sm text-[var(--fc-black)]">{agent.name}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--fc-border-gray)] bg-white hover:bg-[var(--fc-subtle-gray)] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-[var(--fc-body-gray)] ${refreshing ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium text-[var(--fc-black)]">Refresh</span>
          </button>
        </div>

        <MetricsBar metrics={metrics} />

        <TabBar activeTab={activeTab} onTabChange={handleTabChange} />

        {error ? (
          <div className="bg-white rounded-2xl border border-[var(--fc-border-gray)] shadow-sm p-8">
            <div className="text-center space-y-4">
              <p className="text-[var(--fc-action-red)] font-medium">{error}</p>
              <button
                onClick={handleRefresh}
                className="px-6 py-2 rounded-lg bg-[var(--fc-black)] text-white hover:bg-[var(--fc-dark-gray)] transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'feed' && (
              <FeedView
                entries={entries}
                loading={loading}
                activeFilter={feedFilter}
                onFilterChange={handleFeedFilterChange}
                onLoadMore={handleLoadMore}
                loadingMore={loadingMore}
                filterCounts={filterCounts}
              />
            )}
            {activeTab === 'wins' && <WinsView entries={entries} loading={loading} />}
            {activeTab === 'daily' && <DailyView snapshots={dailyEntries} loading={loading} />}
          </>
        )}
      </div>

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={() => {
          setIsLoginModalOpen(false);
          router.refresh();
        }}
      />
    </div>
  );
}

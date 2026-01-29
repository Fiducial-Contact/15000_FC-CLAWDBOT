'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  RefreshCw,
  WifiOff,
  Loader2,
  Search,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { GatewayClient } from '@/lib/gateway/client';
import { useSkills } from '@/lib/gateway/useSkills';
import { SkillCard } from '@/components/SkillCard';
import { Header } from '@/components/Header';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

interface SkillsClientProps {
  userEmail: string;
  userId: string;
}

type FilterStatus = 'all' | 'ready' | 'disabled' | 'error' | 'missing';

export function SkillsClient({ userEmail, userId }: SkillsClientProps) {
  const router = useRouter();
  const wsUrl = process.env.NEXT_PUBLIC_GATEWAY_WS_URL;
  const token = process.env.NEXT_PUBLIC_GATEWAY_TOKEN;

  // State
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(() =>
    wsUrl ? null : 'Gateway URL not configured'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('all');

  const clientRef = useRef<GatewayClient | null>(null);

  // Connection Logic
  useEffect(() => {
    if (!wsUrl) return;

    const client = new GatewayClient({
      url: wsUrl,
      token,
      clientName: 'fc-team-chat',
      clientVersion: '1.0.0',
      mode: 'webchat',
      userId,
    });

    clientRef.current = client;

    const connect = async () => {
      try {
        await client.connect();
        setIsConnected(true);
        setConnectionError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Connection failed';
        if (errorMessage.startsWith('PAIRING_REQUIRED')) {
          const pairingCode = errorMessage.split(':')[1] || 'unknown';
          setConnectionError(`Authorization required. Pairing code: ${pairingCode}`);
        } else {
          setConnectionError(errorMessage);
        }
        setIsConnected(false);
      }
    };

    connect();

    return () => {
      client.disconnect();
      clientRef.current = null;
    };
  }, [userId, wsUrl, token]);

  const { skills, isLoading, error, refresh } = useSkills({
    userId,
    gatewayClientRef: clientRef,
    isConnected,
  });

  const handleLogout = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  }, [router]);

  const handleRefresh = useCallback(() => {
    if (isConnected) {
      refresh();
    }
  }, [isConnected, refresh]);

  // Filtering Logic
  const filteredSkills = useMemo(() => {
    return skills.filter(skill => {
      const matchesSearch =
        skill.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (skill.description && skill.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesFilter = activeFilter === 'all' || skill.runtimeStatus === activeFilter;

      return matchesSearch && matchesFilter;
    });
  }, [skills, searchQuery, activeFilter]);

  // Counts for tabs
  const getCount = (status: FilterStatus) => {
    if (status === 'all') return skills.length;
    return skills.filter(s => s.runtimeStatus === status).length;
  };

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900">
      <Header userName={userEmail} onLogout={handleLogout} />

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <Link
                href="/chat"
                className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800 transition-colors"
              >
                <ArrowLeft size={14} />
                Back to Chat
              </Link>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Skill Library</h1>
            <p className="text-zinc-500">Manage and view available capabilities for your agents.</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`} />
              <span className="text-xs font-medium text-zinc-600">
                {isConnected ? 'Gateway Connected' : 'Gateway Disconnected'}
              </span>
            </div>

            <button
              onClick={handleRefresh}
              disabled={!isConnected || isLoading}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 hover:border-zinc-300 transition-all disabled:opacity-50 shadow-sm"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {isConnected && !error && (
          <div className="sticky top-4 z-10 bg-white/80 backdrop-blur-md border border-zinc-200/50 rounded-2xl p-4 mb-8 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                <input
                  type="text"
                  placeholder="Search skills..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                />
              </div>

              {/* Filters */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
                {(['all', 'ready', 'disabled', 'error'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setActiveFilter(status)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2",
                      activeFilter === status
                        ? "bg-zinc-900 text-white shadow-md"
                        : "text-zinc-600 hover:bg-zinc-100"
                    )}
                  >
                    <span className="capitalize">{status}</span>
                    <span className={cn(
                      "px-1.5 py-0.5 rounded text-[10px]",
                      activeFilter === status ? "bg-white/20 text-white" : "bg-zinc-200 text-zinc-600"
                    )}>
                      {getCount(status)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="min-h-[400px]">
          {/* Loading State */}
          {isLoading && skills.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-500">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full animate-pulse" />
                <Loader2 size={40} className="relative z-10 animate-spin text-blue-600" />
              </div>
              <p className="mt-4 text-zinc-500 font-medium">Syncing with Gateway...</p>
            </div>
          )}

          {/* Error State */}
          {connectionError && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-dashed border-zinc-300"
            >
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
                <WifiOff size={32} className="text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900">Connection Issue</h3>
              <p className="text-zinc-500 max-w-sm mt-2 mb-6">{connectionError}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors"
              >
                Retry Connection
              </button>
            </motion.div>
          )}

          {/* Empty State */}
          {!isLoading && !connectionError && filteredSkills.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-24 text-center"
            >
              <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mb-4">
                <Search size={32} className="text-zinc-400" />
              </div>
              <h3 className="text-lg font-medium text-zinc-900">No skills found</h3>
              <p className="text-zinc-500 max-w-md mt-1">
                {searchQuery ? `No skills matching "${searchQuery}"` : "No skills are currently available."}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-4 text-blue-600 hover:underline text-sm font-medium"
                >
                  Clear search
                </button>
              )}
            </motion.div>
          )}

          {/* Grid */}
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4"
          >
            <AnimatePresence mode='popLayout'>
              {filteredSkills.map((skill) => (
                <motion.div
                  layout
                  key={skill.name}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  <SkillCard skill={skill} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCw, WifiOff, Loader2, Sparkles, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { GatewayClient } from '@/lib/gateway/client';
import { useSkills } from '@/lib/gateway/useSkills';
import { SkillCard } from '@/components/SkillCard';
import { Header } from '@/components/Header';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface SkillsClientProps {
  userEmail: string;
  userId: string;
}

export function SkillsClient({ userEmail, userId }: SkillsClientProps) {
  const router = useRouter();
  const wsUrl = process.env.NEXT_PUBLIC_GATEWAY_WS_URL;
  const token = process.env.NEXT_PUBLIC_GATEWAY_TOKEN;
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(() =>
    wsUrl ? null : 'Gateway URL not configured'
  );
  const clientRef = useRef<GatewayClient | null>(null);

  useEffect(() => {
    if (!wsUrl) {
      return;
    }

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

  return (
    <div className="min-h-screen bg-[var(--fc-page-bg)]">
      <Header userName={userEmail} onLogout={handleLogout} />

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link
              href="/chat"
              className="flex items-center gap-2 text-sm text-[var(--fc-body-gray)] hover:text-[var(--fc-dark-gray)] transition-colors"
            >
              <ArrowLeft size={16} />
              Back to Chat
            </Link>
            <div className="h-4 w-px bg-[var(--fc-border-gray)]" />
            <div className="flex items-center gap-2">
              <Sparkles size={20} className="text-[var(--fc-action-red)]" />
              <h1 className="text-xl font-semibold text-[var(--fc-black)]">Skills</h1>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            disabled={!isConnected || isLoading}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-[var(--fc-dark-gray)] bg-white border border-[var(--fc-border-gray)] rounded-lg hover:bg-[var(--fc-subtle-gray)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {!isConnected && !connectionError && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Loader2 size={32} className="animate-spin text-[var(--fc-body-gray)] mb-4" />
            <p className="text-[var(--fc-body-gray)]">Connecting to gateway...</p>
          </div>
        )}

        {connectionError && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <WifiOff size={48} className="text-[var(--fc-body-gray)] mb-4" />
            <h2 className="text-lg font-medium text-[var(--fc-dark-gray)] mb-2">
              Connection Required
            </h2>
            <p className="text-[var(--fc-body-gray)] max-w-md">
              {connectionError}
            </p>
          </div>
        )}

        {isConnected && error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {isConnected && !error && isLoading && skills.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Loader2 size={32} className="animate-spin text-[var(--fc-body-gray)] mb-4" />
            <p className="text-[var(--fc-body-gray)]">Loading skills...</p>
          </div>
        )}

        {isConnected && !isLoading && skills.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Sparkles size={48} className="text-[var(--fc-body-gray)] mb-4" />
            <h2 className="text-lg font-medium text-[var(--fc-dark-gray)] mb-2">
              No Skills Found
            </h2>
            <p className="text-[var(--fc-body-gray)] max-w-md">
              No skills are currently available on the gateway.
            </p>
          </div>
        )}

        {isConnected && skills.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {skills.map((skill) => (
              <SkillCard key={skill.name} skill={skill} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

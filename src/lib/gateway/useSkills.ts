'use client';

import { useState, useCallback, useEffect, useRef, type RefObject } from 'react';
import { GatewayClient } from './client';
import { createClient } from '@/lib/supabase/client';
import type {
  GatewaySkillStatus,
  SkillRegistryEntry,
  MergedSkill,
  SkillSource,
  SkillMetadataStatus,
} from './types';

interface UseSkillsOptions {
  userId: string;
  gatewayClientRef: RefObject<GatewayClient | null>;
  isConnected: boolean;
}

interface UseSkillsReturn {
  skills: MergedSkill[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

function mergeSkillsData(
  gatewaySkills: GatewaySkillStatus[],
  metadata: SkillRegistryEntry[]
): MergedSkill[] {
  const metadataByName = new Map(metadata.map((m) => [m.skill_name, m]));
  const gatewayByName = new Map(gatewaySkills.map((s) => [s.name, s]));
  const allNames = new Set([...metadataByName.keys(), ...gatewayByName.keys()]);

  const merged: MergedSkill[] = [];

  for (const name of allNames) {
    const gateway = gatewayByName.get(name);
    const meta = metadataByName.get(name);

    merged.push({
      name,
      displayName: meta?.display_name || name,
      description: meta?.description || null,
      creatorEmail: meta?.creator_email || null,
      source: (meta?.source as SkillSource) || 'workspace',
      icon: meta?.icon || null,
      triggers: meta?.triggers || [],
      runtimeStatus: gateway?.status || 'missing',
      metadataStatus: (meta?.status as SkillMetadataStatus) || 'active',
      error: gateway?.error,
    });
  }

  return merged.sort((a, b) => a.displayName.localeCompare(b.displayName));
}

export function useSkills({ userId, gatewayClientRef, isConnected }: UseSkillsOptions): UseSkillsReturn {
  const [skills, setSkills] = useState<MergedSkill[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabaseRef = useRef(createClient());

  const fetchSkills = useCallback(async () => {
    const gatewayClient = gatewayClientRef.current;
    if (!gatewayClient || !isConnected) {
      setError('Not connected to gateway');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [gatewaySkills, { data: metadata, error: supabaseError }] = await Promise.all([
        gatewayClient.skillsStatus(),
        supabaseRef.current.from('skills_registry').select('*'),
      ]);

      if (supabaseError) {
        console.warn('Failed to fetch skills metadata:', supabaseError);
      }

      const merged = mergeSkillsData(gatewaySkills, (metadata as SkillRegistryEntry[]) || []);
      setSkills(merged);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch skills';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [gatewayClientRef, isConnected]);

  useEffect(() => {
    if (isConnected && gatewayClientRef.current && userId) {
      fetchSkills();
    }
  }, [isConnected, userId, fetchSkills, gatewayClientRef]);

  return {
    skills,
    isLoading,
    error,
    refresh: fetchSkills,
  };
}

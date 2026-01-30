import { NextRequest } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import type { LearningDimension } from '@/lib/types/profile';

export const runtime = 'nodejs';

const VALID_DIMENSIONS: LearningDimension[] = [
  'skill-level',
  'interaction-style',
  'topic-interests',
  'frustration-signals',
];

const MAX_LEARNED_CONTEXT = 50;
const MIN_WRITEBACK_CONFIDENCE = 0.5;
const RATE_LIMIT_PER_MINUTE = 10;

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function getRequestIp(request: NextRequest): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    return first || null;
  }
  const realIp = request.headers.get('x-real-ip');
  return realIp?.trim() || null;
}

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  entry.count += 1;
  return entry.count <= RATE_LIMIT_PER_MINUTE;
}

interface InsightInput {
  dimension: LearningDimension;
  insight: string;
  confidence: number;
  evidence?: unknown[];
}

interface LearnBody {
  userId: string;
  insights: InsightInput[];
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const apiKey = process.env.AGENT_LEARN_API_KEY;

  if (!apiKey || !authHeader || authHeader !== `Bearer ${apiKey}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: LearnBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body.userId || !Array.isArray(body.insights) || body.insights.length === 0) {
    return Response.json({ error: 'userId and insights[] required' }, { status: 400 });
  }

  if (!isUuid(body.userId)) {
    return Response.json({ error: 'Invalid userId (expected UUID)' }, { status: 400 });
  }

  const ip = getRequestIp(request);
  if (!checkRateLimit(`agent-learn:${ip ?? 'unknown'}:${body.userId}`)) {
    return Response.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  for (const insight of body.insights) {
    if (!VALID_DIMENSIONS.includes(insight.dimension)) {
      return Response.json({ error: `Invalid dimension: ${insight.dimension}` }, { status: 400 });
    }
    if (typeof insight.insight !== 'string' || !insight.insight.trim()) {
      return Response.json({ error: 'insight text required' }, { status: 400 });
    }
    if (typeof insight.confidence !== 'number' || insight.confidence < 0 || insight.confidence > 1) {
      return Response.json({ error: 'confidence must be 0-1' }, { status: 400 });
    }
  }

  let supabase: ReturnType<typeof createServiceClient>;
  try {
    supabase = createServiceClient();
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Failed to initialize Supabase service client';
    return Response.json({ error: message }, { status: 500 });
  }

  const eventRows = body.insights.map((i) => ({
    user_id: body.userId,
    dimension: i.dimension,
    insight: i.insight,
    confidence: i.confidence,
    evidence: i.evidence ?? [],
    source: 'heartbeat',
  }));

  const { error: insertError } = await supabase
    .from('learning_events')
    .insert(eventRows);

  if (insertError) {
    return Response.json({ error: insertError.message }, { status: 500 });
  }

  const highConfidence = body.insights
    .map((i) => ({ ...i, insight: i.insight.trim() }))
    .filter((i) => i.confidence >= MIN_WRITEBACK_CONFIDENCE);

  let appendedToProfile = 0;
  let profileCreated = false;

  if (highConfidence.length > 0) {
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('learned_context')
      .eq('user_id', body.userId)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      return Response.json({ error: profileError.message }, { status: 500 });
    }

    const existing: string[] = Array.isArray(profileData?.learned_context)
      ? profileData.learned_context
      : [];

    const existingSet = new Set(existing);
    const dedupedNew = Array.from(
      new Set(highConfidence.map((i) => i.insight).filter((text) => text && text.trim()))
    );
    const newItems = dedupedNew.filter((text) => !existingSet.has(text));

    if (newItems.length > 0) {
      let merged = Array.from(new Set([...existing, ...newItems]));

      if (merged.length > MAX_LEARNED_CONTEXT) {
        const scored = merged.map((text) => {
          const match = highConfidence.find((i) => i.insight === text);
          return { text, confidence: match?.confidence ?? 0.5 };
        });
        scored.sort((a, b) => b.confidence - a.confidence);
        merged = scored.slice(0, MAX_LEARNED_CONTEXT).map((s) => s.text);
      }

      appendedToProfile = newItems.filter((text) => merged.includes(text)).length;

      if (profileError?.code === 'PGRST116') {
        const { error: insertProfileError } = await supabase
          .from('user_profiles')
          .insert({ user_id: body.userId, learned_context: merged });

        if (insertProfileError) {
          // If a profile was created concurrently, fall back to update.
          const { error: updateError } = await supabase
            .from('user_profiles')
            .update({ learned_context: merged })
            .eq('user_id', body.userId);

          if (updateError) {
            return Response.json({ error: updateError.message }, { status: 500 });
          }
        } else {
          profileCreated = true;
        }
      } else {
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({ learned_context: merged })
          .eq('user_id', body.userId);

        if (updateError) {
          return Response.json({ error: updateError.message }, { status: 500 });
        }
      }
    }
  }

  return Response.json({
    inserted: eventRows.length,
    appendedToProfile,
    profileCreated,
  });
}

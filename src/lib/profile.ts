import type { UserProfile, UserPreferences } from '@/lib/types/profile';
import { LANGUAGE_OPTIONS, RESPONSE_STYLE_OPTIONS, TIMEZONE_OPTIONS } from '@/lib/types/profile';

const VALID_LANGUAGES = LANGUAGE_OPTIONS.map(o => o.value);
const VALID_RESPONSE_STYLES = RESPONSE_STYLE_OPTIONS.map(o => o.value);
const VALID_TIMEZONES = TIMEZONE_OPTIONS.map(o => o.value);

function getDefaultTimezone(): string {
  if (typeof Intl !== 'undefined') {
    try {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (VALID_TIMEZONES.includes(detected)) {
        return detected;
      }
    } catch {
      // ignore
    }
  }
  return 'Europe/London';
}

export function createDefaultProfile(seed?: Partial<UserProfile>): UserProfile {
  return {
    name: seed?.name ?? '',
    role: seed?.role ?? '',
    software: seed?.software ?? [],
    preferences: {
      language: seed?.preferences?.language ?? 'en',
      responseStyle: seed?.preferences?.responseStyle ?? 'concise',
      timezone: seed?.preferences?.timezone ?? getDefaultTimezone(),
    },
    frequentTopics: seed?.frequentTopics ?? [],
    learnedContext: seed?.learnedContext ?? [],
    lastUpdated: seed?.lastUpdated ?? new Date().toISOString(),
  };
}

type DbRow = {
  user_id: string;
  name: string | null;
  role: string | null;
  software: string[] | null;
  preferences: Record<string, unknown> | null;
  frequent_topics: string[] | null;
  learned_context: string[] | null;
  updated_at: string | null;
};

export function profileFromRow(row: DbRow): UserProfile {
  const prefs = row.preferences ?? {};
  const lang = typeof prefs.language === 'string' && VALID_LANGUAGES.includes(prefs.language as UserPreferences['language'])
    ? (prefs.language as UserPreferences['language'])
    : 'en';
  const style = typeof prefs.responseStyle === 'string' && VALID_RESPONSE_STYLES.includes(prefs.responseStyle as UserPreferences['responseStyle'])
    ? (prefs.responseStyle as UserPreferences['responseStyle'])
    : 'concise';
  const tz = typeof prefs.timezone === 'string' && VALID_TIMEZONES.includes(prefs.timezone)
    ? prefs.timezone
    : 'Europe/London';

  return {
    name: row.name ?? '',
    role: row.role ?? '',
    software: row.software ?? [],
    preferences: {
      language: lang,
      responseStyle: style,
      timezone: tz,
    },
    frequentTopics: row.frequent_topics ?? [],
    learnedContext: row.learned_context ?? [],
    lastUpdated: row.updated_at ?? new Date().toISOString(),
  };
}

export function profileToRow(profile: UserProfile, userId: string) {
  return {
    user_id: userId,
    name: profile.name,
    role: profile.role,
    software: profile.software,
    preferences: {
      language: profile.preferences.language,
      responseStyle: profile.preferences.responseStyle,
      timezone: profile.preferences.timezone,
    },
    frequent_topics: profile.frequentTopics,
    learned_context: profile.learnedContext,
  };
}

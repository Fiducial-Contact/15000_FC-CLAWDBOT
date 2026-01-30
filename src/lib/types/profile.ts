export interface UserPreferences {
    language: 'en' | 'zh' | 'ja' | 'es' | 'fr' | 'de';
    responseStyle: 'concise' | 'detailed' | 'casual' | 'formal';
    timezone: string;
    workContext: string;
}

export interface UserProfile {
    name: string;
    role: string;
    software: string[];
    preferences: UserPreferences;
    frequentTopics: string[];
    learnedContext: string[];
    lastUpdated: string;
}

export type LearningDimension =
    | 'skill-level'
    | 'interaction-style'
    | 'topic-interests'
    | 'frustration-signals';

export interface LearningEvent {
    id: string;
    user_id: string;
    dimension: LearningDimension;
    insight: string;
    confidence: number;
    evidence: unknown[];
    source: 'heartbeat' | 'self-review' | 'manual';
    created_at: string;
}

export interface ProfileWithLearning {
    profile: UserProfile | null;
    recentLearning: LearningEvent[];
}

export const MOCK_USER_PROFILE: UserProfile = {
    name: 'Anand',
    role: 'Motion Designer',
    software: ['After Effects', 'Cinema 4D', 'Premiere Pro'],
    preferences: {
        language: 'en',
        responseStyle: 'concise',
        timezone: 'Europe/London',
        workContext: 'Motion design for commercials, mostly AE + C4D. Prefers practical, step-by-step answers and export presets.',
    },
    frequentTopics: ['AE expressions', 'render settings'],
    learnedContext: [
        'Prefers keyboard shortcuts over menus',
        'Working on Barclays project',
        'Uses Mac with M1 chip'
    ],
    lastUpdated: '2026-01-29T12:00:00Z'
};

export const LANGUAGE_OPTIONS = [
    { value: 'en', label: 'English' },
    { value: 'zh', label: 'Chinese' },
    { value: 'ja', label: 'Japanese' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
];

export const RESPONSE_STYLE_OPTIONS = [
    { value: 'concise', label: 'Concise' },
    { value: 'detailed', label: 'Detailed' },
    { value: 'casual', label: 'Casual' },
    { value: 'formal', label: 'Formal' },
];

export const TIMEZONE_OPTIONS = [
    { value: 'Europe/London', label: 'London (GMT)' },
    { value: 'America/New_York', label: 'New York (EST)' },
    { value: 'America/Los_Angeles', label: 'Los Angeles (PST)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
    { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
    { value: 'Europe/Paris', label: 'Paris (CET)' },
];

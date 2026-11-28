import { DEFAULT_QUESTIONS, createDefaultState } from '../data/defaultQuestions';
import type { AppState } from '../types/olympiad';

const STORAGE_KEY = 'hassad-olympiad-v2';
const CURRENT_BANK_VERSION = 2;

export function isValidState(value: unknown): value is AppState {
  const s = value as Partial<AppState> | null;
  return (
    !!s &&
    s.version === 1 &&
    Array.isArray(s.sections) &&
    Array.isArray(s.teams) &&
    Array.isArray(s.questions) &&
    Array.isArray(s.matches) &&
    !!s.orders &&
    !!s.settings
  );
}

function migrateState(state: AppState): AppState {
  let next = state;
  if (next.settings.presenter === 'الأستاذ هيثم') {
    next = {
      ...next,
      settings: {
        ...next.settings,
        presenter: 'الأستاذ هيثم حموي',
      },
    };
  }
  if ((next.questionBankVersion ?? 1) < CURRENT_BANK_VERSION) {
    next = {
      ...next,
      questionBankVersion: CURRENT_BANK_VERSION,
      questions: DEFAULT_QUESTIONS.map((q) => ({ ...q })),
    };
  }
  if (!Array.isArray(next.plans) || !Array.isArray(next.planTemplates)) {
    next = {
      ...next,
      plans: Array.isArray(next.plans) ? next.plans : [],
      planTemplates: Array.isArray(next.planTemplates) ? next.planTemplates : [],
    };
  }
  return next;
}

export function parseStoredState(raw: string | null): AppState | null {
  try {
    const parsed = raw ? JSON.parse(raw) : null;
    return isValidState(parsed) ? migrateState(parsed) : null;
  } catch {
    return null;
  }
}

export const storage = {
  load(): AppState {
    try {
      return parseStoredState(localStorage.getItem(STORAGE_KEY)) ?? createDefaultState();
    } catch {
      return createDefaultState();
    }
  },
  save(state: AppState): boolean {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch {
      return false;
    }
  },
  subscribe(onUpdate: (state: AppState) => void): () => void {
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        const next = parseStoredState(event.newValue);
        if (next) onUpdate(next);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  },
};

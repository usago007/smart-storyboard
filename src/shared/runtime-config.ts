import type { AppSettings } from '@/domain/storyboard';

export const DEFAULT_APP_SETTINGS: AppSettings = {
  dataMode: (process.env.NEXT_PUBLIC_DATA_MODE as AppSettings['dataMode']) || 'mock',
  mockDelayMs: 600,
  mockFailureRate: 0,
  language: 'zh',
  theme: 'light',
};

export const STORAGE_KEYS = {
  settings: 'smart-storyboard:settings',
  autoSession: 'smart-storyboard:auto-session',
  manualSession: 'smart-storyboard:manual-session',
} as const;

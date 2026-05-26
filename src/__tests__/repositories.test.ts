import { describe, it, expect, beforeEach } from 'vitest';
import { getLocalStorage, getSessionStorage } from '@/shared/browser-storage';
import { STORAGE_KEYS } from '@/shared/runtime-config';
import { MockSettingsRepository } from '@/infrastructure/mock/repositories';

function resetBrowserStorage() {
  getLocalStorage().removeItem(STORAGE_KEYS.settings);
  getSessionStorage().removeItem(STORAGE_KEYS.autoSession);
  getSessionStorage().removeItem(STORAGE_KEYS.manualSession);
}

describe('MockSettingsRepository', () => {
  let repo: MockSettingsRepository;

  beforeEach(() => {
    resetBrowserStorage();
    repo = new MockSettingsRepository();
  });

  it('returns defaults when no stored settings exist', async () => {
    const settings = await repo.getSettings();
    expect(settings.dataMode).toBe('mock');
    expect(settings.mockDelayMs).toBe(600);
    expect(settings.mockFailureRate).toBe(0);
  });

  it('persists and retrieves updated settings', async () => {
    await repo.updateSettings({ mockDelayMs: 1200, mockFailureRate: 10 });
    const settings = await repo.getSettings();
    expect(settings.mockDelayMs).toBe(1200);
    expect(settings.mockFailureRate).toBe(10);
    expect(settings.dataMode).toBe('mock');
  });

  it('survives JSON parse errors with defaults', async () => {
    getLocalStorage().setItem(STORAGE_KEYS.settings, '{bad json');
    const settings = await repo.getSettings();
    expect(settings.dataMode).toBe('mock');
  });
});

describe('MockSessionRepository', () => {
  beforeEach(() => {
    resetBrowserStorage();
  });

  it('returns null when no session is stored', async () => {
    const { MockSessionRepository } = await import('@/infrastructure/mock/repositories');
    const settingsRepo = new MockSettingsRepository();
    const repo = new MockSessionRepository(settingsRepo);
    const session = await repo.loadSession('auto');
    expect(session).toBeNull();
  });

  it('saves and restores a session', async () => {
    const { MockSessionRepository } = await import('@/infrastructure/mock/repositories');
    const settingsRepo = new MockSettingsRepository();
    const repo = new MockSessionRepository(settingsRepo);

    const session = {
      sessionType: 'auto' as const,
      script: 'test script',
      duration: 10,
      scenes: [],
      updatedAt: new Date().toISOString(),
    };

    await repo.saveSession(session);
    const restored = await repo.loadSession('auto');
    expect(restored).not.toBeNull();
    expect(restored!.script).toBe('test script');
    expect(restored!.sessionType).toBe('auto');
  });

  it('clearSession removes stored data', async () => {
    const { MockSessionRepository } = await import('@/infrastructure/mock/repositories');
    const settingsRepo = new MockSettingsRepository();
    const repo = new MockSessionRepository(settingsRepo);

    const session = {
      sessionType: 'manual' as const,
      script: 'manual',
      duration: 5,
      scenes: [],
      updatedAt: new Date().toISOString(),
    };

    await repo.saveSession(session);
    await repo.clearSession('manual');
    const restored = await repo.loadSession('manual');
    expect(restored).toBeNull();
  });
});

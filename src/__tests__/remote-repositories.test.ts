// @vitest-environment node

import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import { unlinkSync } from 'node:fs';

const TEST_DB_PATH = './data/test-remote-repositories.db';

function cleanupDbFiles() {
  try { unlinkSync(TEST_DB_PATH); } catch { /* no existing db */ }
  try { unlinkSync(`${TEST_DB_PATH}-wal`); } catch { /* no existing db */ }
  try { unlinkSync(`${TEST_DB_PATH}-shm`); } catch { /* no existing db */ }
}

beforeAll(() => {
  process.env.NEXT_PUBLIC_DATA_MODE = 'remote';
  process.env.SQLITE_DB_PATH = TEST_DB_PATH;
  cleanupDbFiles();
});

beforeEach(() => {
  vi.resetModules();
});

describe('SqliteSettingsRepository', () => {
  it('returns defaults when no stored settings', async () => {
    const { SqliteSettingsRepository, runWithToken } = await import('@/infrastructure/remote/repositories');
    const repo = new SqliteSettingsRepository();

    const settings = await runWithToken('user-1', () => repo.getSettings());
    expect(settings.language).toBe('zh');
    expect(settings.theme).toBe('light');
    expect(settings.dataMode).toBe('remote');
  });

  it('persists and retrieves settings', async () => {
    const { SqliteSettingsRepository, runWithToken } = await import('@/infrastructure/remote/repositories');
    const repo = new SqliteSettingsRepository();

    await runWithToken('user-1', () =>
      repo.updateSettings({ language: 'en', theme: 'dark' }),
    );

    const settings = await runWithToken('user-1', () => repo.getSettings());
    expect(settings.language).toBe('en');
    expect(settings.theme).toBe('dark');
  });

  it('isolates settings per token', async () => {
    const { SqliteSettingsRepository, runWithToken } = await import('@/infrastructure/remote/repositories');
    const repo = new SqliteSettingsRepository();

    await runWithToken('user-a', () =>
      repo.updateSettings({ language: 'en', theme: 'dark' }),
    );
    await runWithToken('user-b', () =>
      repo.updateSettings({ language: 'zh', theme: 'light' }),
    );

    const settingsA = await runWithToken('user-a', () => repo.getSettings());
    const settingsB = await runWithToken('user-b', () => repo.getSettings());

    expect(settingsA.language).toBe('en');
    expect(settingsB.language).toBe('zh');
  });
});

describe('SqliteSessionRepository', () => {
  it('returns null for unknown session', async () => {
    const { SqliteSessionRepository, runWithToken } = await import('@/infrastructure/remote/repositories');
    const repo = new SqliteSessionRepository();

    const session = await runWithToken('user-1', () => repo.loadSession('auto'));
    expect(session).toBeNull();
  });

  it('saves and restores a session', async () => {
    const { SqliteSessionRepository, runWithToken } = await import('@/infrastructure/remote/repositories');
    const repo = new SqliteSessionRepository();

    const session = {
      sessionType: 'auto' as const,
      script: '测试文案',
      duration: 10,
      wordCount: 89,
      scenes: [{ id: 1, name: '分镜1', dialogue: 'test', duration: 10 }],
      updatedAt: new Date().toISOString(),
    };

    await runWithToken('user-1', () => repo.saveSession(session));

    const restored = await runWithToken('user-1', () => repo.loadSession('auto'));
    expect(restored).not.toBeNull();
    expect(restored!.script).toBe('测试文案');
    expect(restored!.scenes).toHaveLength(1);
  });

  it('upserts session with same token+type', async () => {
    const { SqliteSessionRepository, runWithToken } = await import('@/infrastructure/remote/repositories');
    const repo = new SqliteSessionRepository();

    const v1 = {
      sessionType: 'auto' as const,
      script: 'v1',
      duration: 5,
      scenes: [],
      updatedAt: new Date().toISOString(),
    };

    const v2 = {
      sessionType: 'auto' as const,
      script: 'v2',
      duration: 10,
      scenes: [],
      updatedAt: new Date().toISOString(),
    };

    await runWithToken('user-1', () => repo.saveSession(v1));
    await runWithToken('user-1', () => repo.saveSession(v2));

    const restored = await runWithToken('user-1', () => repo.loadSession('auto'));
    expect(restored!.script).toBe('v2');
    expect(restored!.duration).toBe(10);
  });

  it('stores auto and manual separately per token', async () => {
    const { SqliteSessionRepository, runWithToken } = await import('@/infrastructure/remote/repositories');
    const repo = new SqliteSessionRepository();

    const autoSession = {
      sessionType: 'auto' as const,
      script: 'auto-data',
      duration: 10,
      scenes: [],
      updatedAt: new Date().toISOString(),
    };

    const manualSession = {
      sessionType: 'manual' as const,
      script: 'manual-data',
      duration: 5,
      scenes: [],
      updatedAt: new Date().toISOString(),
    };

    await runWithToken('user-1', () => repo.saveSession(autoSession));
    await runWithToken('user-1', () => repo.saveSession(manualSession));

    const auto = await runWithToken('user-1', () => repo.loadSession('auto'));
    const manual = await runWithToken('user-1', () => repo.loadSession('manual'));

    expect(auto!.script).toBe('auto-data');
    expect(manual!.script).toBe('manual-data');
  });

  it('clearSession removes specific type', async () => {
    const { SqliteSessionRepository, runWithToken } = await import('@/infrastructure/remote/repositories');
    const repo = new SqliteSessionRepository();

    const autoSession = {
      sessionType: 'auto' as const,
      script: 'auto',
      duration: 10,
      scenes: [],
      updatedAt: new Date().toISOString(),
    };

    const manualSession = {
      sessionType: 'manual' as const,
      script: 'manual',
      duration: 5,
      scenes: [],
      updatedAt: new Date().toISOString(),
    };

    await runWithToken('user-1', () => repo.saveSession(autoSession));
    await runWithToken('user-1', () => repo.saveSession(manualSession));
    await runWithToken('user-1', () => repo.clearSession('auto'));

    const auto = await runWithToken('user-1', () => repo.loadSession('auto'));
    const manual = await runWithToken('user-1', () => repo.loadSession('manual'));

    expect(auto).toBeNull();
    expect(manual).not.toBeNull();
  });

  it('clearSession without type removes all', async () => {
    const { SqliteSessionRepository, runWithToken } = await import('@/infrastructure/remote/repositories');
    const repo = new SqliteSessionRepository();

    await runWithToken('user-1', () => repo.saveSession({
      sessionType: 'auto' as const,
      script: 'a',
      duration: 5,
      scenes: [],
      updatedAt: new Date().toISOString(),
    }));

    await runWithToken('user-1', () => repo.clearSession());

    const auto = await runWithToken('user-1', () => repo.loadSession('auto'));
    expect(auto).toBeNull();
  });
});

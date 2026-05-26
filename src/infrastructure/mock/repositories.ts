import type {
  AppSettings,
  FramePrompt,
  FrameType,
  Scene,
  SessionType,
  StoryboardSession,
} from '@/domain/storyboard';
import type {
  IAssetRepository,
  ISessionRepository,
  ISettingsRepository,
  IStoryboardRepository,
} from '@/infrastructure/repository-interfaces';
import { getLocalStorage, getSessionStorage } from '@/shared/browser-storage';
import { DEFAULT_APP_SETTINGS, STORAGE_KEYS } from '@/shared/runtime-config';
import { buildFixtureSession } from './fixtures';
import {
  generateFramePrompt,
  generateImageUrl,
  generateImportedContent,
  generateScenes,
  generateShotPrompt,
  polishScript,
} from './generators';

async function simulateLatency(settings: AppSettings) {
  const jitter = Math.round(settings.mockDelayMs * 0.35 * Math.random());
  await new Promise((resolve) => setTimeout(resolve, settings.mockDelayMs + jitter));
}

function maybeThrowMockError(settings: AppSettings, fallbackMessage: string) {
  if (settings.mockFailureRate <= 0) {
    return;
  }

  if (Math.random() < settings.mockFailureRate / 100) {
    throw new Error(fallbackMessage);
  }
}

export class MockSettingsRepository implements ISettingsRepository {
  private cache: AppSettings | null = null;

  async getSettings(): Promise<AppSettings> {
    if (this.cache) {
      return this.cache;
    }

    const storage = getLocalStorage();
    const raw = storage.getItem(STORAGE_KEYS.settings);
    if (!raw) {
      return DEFAULT_APP_SETTINGS;
    }

    try {
      const parsed = {
        ...DEFAULT_APP_SETTINGS,
        ...JSON.parse(raw),
      } satisfies AppSettings;
      this.cache = parsed;
      return parsed;
    } catch {
      return DEFAULT_APP_SETTINGS;
    }
  }

  async updateSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
    const storage = getLocalStorage();
    const current = await this.getSettings();
    const next = { ...current, ...patch };
    this.cache = next;
    storage.setItem(STORAGE_KEYS.settings, JSON.stringify(next));
    return next;
  }
}

export class MockSessionRepository implements ISessionRepository {
  constructor(private readonly settingsRepository: ISettingsRepository) {}

  private getKey(sessionType: SessionType) {
    return sessionType === 'auto' ? STORAGE_KEYS.autoSession : STORAGE_KEYS.manualSession;
  }

  async loadSession(sessionType: SessionType): Promise<StoryboardSession | null> {
    const settings = await this.settingsRepository.getSettings();
    await simulateLatency({ ...settings, mockDelayMs: Math.max(80, Math.round(settings.mockDelayMs / 4)) });
    const storage = getSessionStorage();
    const raw = storage.getItem(this.getKey(sessionType));

    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as StoryboardSession;
    } catch {
      return null;
    }
  }

  async saveSession(session: StoryboardSession): Promise<void> {
    const settings = await this.settingsRepository.getSettings();
    await simulateLatency({ ...settings, mockDelayMs: Math.max(80, Math.round(settings.mockDelayMs / 4)) });
    const storage = getSessionStorage();
    storage.setItem(this.getKey(session.sessionType), JSON.stringify(session));
  }

  async clearSession(sessionType?: SessionType): Promise<void> {
    const storage = getSessionStorage();
    if (sessionType) {
      storage.removeItem(this.getKey(sessionType));
      return;
    }
    storage.removeItem(STORAGE_KEYS.autoSession);
    storage.removeItem(STORAGE_KEYS.manualSession);
  }
}

export class MockStoryboardRepository implements IStoryboardRepository {
  constructor(private readonly settingsRepository: ISettingsRepository) {}

  async splitScenes(input: { script: string; duration: number; wordCount?: number }): Promise<Scene[]> {
    const settings = await this.settingsRepository.getSettings();
    await simulateLatency(settings);
    maybeThrowMockError(settings, '模拟分镜拆分失败，请重试。');
    return generateScenes(input.script, input.duration);
  }

  async polishScript(input: { script: string }): Promise<string> {
    const settings = await this.settingsRepository.getSettings();
    await simulateLatency(settings);
    maybeThrowMockError(settings, '模拟文案润色失败，请重试。');
    return polishScript(input.script);
  }

  async importFromUrl(input: { url: string }): Promise<string> {
    const settings = await this.settingsRepository.getSettings();
    await simulateLatency(settings);
    maybeThrowMockError(settings, '模拟链接导入失败，请重试。');
    return generateImportedContent(input.url);
  }

  async generateShotPrompt(scene: Scene): Promise<string> {
    const settings = await this.settingsRepository.getSettings();
    await simulateLatency(settings);
    maybeThrowMockError(settings, '模拟镜头提示词生成失败，请重试。');
    return generateShotPrompt(scene);
  }

  async generateFrame(scene: Scene, frameType: FrameType): Promise<FramePrompt> {
    const settings = await this.settingsRepository.getSettings();
    await simulateLatency(settings);
    maybeThrowMockError(settings, `模拟${frameType === 'first' ? '首帧' : '尾帧'}生成失败，请重试。`);
    return generateFramePrompt(scene, frameType);
  }

  getFixtureSession(sessionType: SessionType): StoryboardSession {
    return buildFixtureSession(sessionType);
  }
}

export class MockAssetRepository implements IAssetRepository {
  constructor(private readonly settingsRepository: ISettingsRepository) {}

  async generateImage(scene: Scene, frameType: FrameType): Promise<string> {
    const settings = await this.settingsRepository.getSettings();
    await simulateLatency({ ...settings, mockDelayMs: Math.max(settings.mockDelayMs, 900) });
    maybeThrowMockError(settings, '模拟图片生成失败，请重试。');
    return generateImageUrl(scene, frameType);
  }
}

import type {
  AppSettings,
  BatchGenerationProgress,
  FrameType,
  Scene,
  SessionType,
  StoryboardDraft,
  StoryboardSession,
} from '@/domain/storyboard';
import {
  MockAssetRepository,
  MockSessionRepository,
  MockSettingsRepository,
  MockStoryboardRepository,
} from '@/infrastructure/mock/repositories';
import {
  RemoteSessionRepository,
  RemoteSettingsRepository,
} from '@/infrastructure/remote/client-repositories';
import { DEFAULT_APP_SETTINGS, getRuntimeDataMode } from '@/shared/runtime-config';

export interface StoryboardService {
  splitScenes(input: { script: string; duration: number; wordCount?: number }): Promise<StoryboardDraft>;
  polishScript(input: { script: string; targetLength?: number }): Promise<string>;
  importFromUrl(input: { url: string }): Promise<string>;
  generateShotPrompt(scene: Scene): Promise<string>;
  generateFrame(scene: Scene, frameType: FrameType): Promise<Scene>;
  batchGeneratePrompts(
    scenes: Scene[],
    onProgress?: (progress: BatchGenerationProgress) => void,
  ): Promise<Scene[]>;
  batchGenerateFrames(
    scenes: Scene[],
    onProgress?: (progress: BatchGenerationProgress) => void,
  ): Promise<Scene[]>;
}

export interface SessionService {
  loadAutoSession(): Promise<StoryboardSession | null>;
  loadManualSession(): Promise<StoryboardSession | null>;
  saveAutoSession(session: Omit<StoryboardSession, 'sessionType' | 'updatedAt'>): Promise<StoryboardSession>;
  saveManualSession(session: Omit<StoryboardSession, 'sessionType' | 'updatedAt'>): Promise<StoryboardSession>;
  clearSession(sessionType?: SessionType): Promise<void>;
  getFixtureSession(sessionType: SessionType): StoryboardSession;
  resetToFixtureSession(sessionType: SessionType): Promise<StoryboardSession>;
}

export interface AssetService {
  generateImage(scene: Scene, frameType: FrameType): Promise<string>;
  batchGenerateImages(
    scenes: Scene[],
    onProgress?: (progress: BatchGenerationProgress) => void,
  ): Promise<Scene[]>;
}

export interface SettingsService {
  getSettings(): Promise<AppSettings>;
  updateSettings(patch: Partial<AppSettings>): Promise<AppSettings>;
}

function withSessionMeta(
  sessionType: SessionType,
  session: Omit<StoryboardSession, 'sessionType' | 'updatedAt'>,
): StoryboardSession {
  return {
    ...session,
    sessionType,
    updatedAt: new Date().toISOString(),
  };
}

export function createClientServices() {
  const dataMode = getRuntimeDataMode();
  const isRemote = dataMode === 'remote';

  const mockSettingsRepository = new MockSettingsRepository();

  const settingsRepository = isRemote
    ? new RemoteSettingsRepository()
    : mockSettingsRepository;

  const sessionRepository = isRemote
    ? new RemoteSessionRepository()
    : new MockSessionRepository(mockSettingsRepository);

  const storyboardRepository = new MockStoryboardRepository(mockSettingsRepository);
  const assetRepository = new MockAssetRepository(mockSettingsRepository);

  const storyboardService: StoryboardService = {
    async splitScenes(input) {
      const scenes = await storyboardRepository.splitScenes(input);
      return {
        script: input.script,
        duration: input.duration,
        wordCount: input.wordCount,
        scenes,
      };
    },
    async polishScript(input) {
      return storyboardRepository.polishScript(input);
    },
    async importFromUrl(input) {
      return storyboardRepository.importFromUrl(input);
    },
    async generateShotPrompt(scene) {
      return storyboardRepository.generateShotPrompt(scene);
    },
    async generateFrame(scene, frameType) {
      const frame = await storyboardRepository.generateFrame(scene, frameType);
      return frameType === 'first'
        ? { ...scene, firstFrame: frame }
        : { ...scene, lastFrame: frame };
    },
    async batchGeneratePrompts(scenes, onProgress) {
      const nextScenes: Scene[] = [];
      for (const [index, scene] of scenes.entries()) {
        const shotPrompt = await storyboardRepository.generateShotPrompt(scene);
        nextScenes.push({ ...scene, shotPrompt });
        onProgress?.({ current: index + 1, total: scenes.length, sceneId: scene.id });
      }
      return nextScenes;
    },
    async batchGenerateFrames(scenes, onProgress) {
      const nextScenes: Scene[] = [];
      for (const [index, scene] of scenes.entries()) {
        const firstFrame = await storyboardRepository.generateFrame(scene, 'first');
        const lastFrame = await storyboardRepository.generateFrame(scene, 'last');
        nextScenes.push({ ...scene, firstFrame, lastFrame });
        onProgress?.({ current: index + 1, total: scenes.length, sceneId: scene.id });
      }
      return nextScenes;
    },
  };

  const sessionService: SessionService = {
    async loadAutoSession() {
      return sessionRepository.loadSession('auto');
    },
    async loadManualSession() {
      return sessionRepository.loadSession('manual');
    },
    async saveAutoSession(session) {
      const next = withSessionMeta('auto', session);
      await sessionRepository.saveSession(next);
      return next;
    },
    async saveManualSession(session) {
      const next = withSessionMeta('manual', session);
      await sessionRepository.saveSession(next);
      return next;
    },
    async clearSession(sessionType) {
      return sessionRepository.clearSession(sessionType);
    },
    getFixtureSession(sessionType) {
      return storyboardRepository.getFixtureSession(sessionType);
    },
    async resetToFixtureSession(sessionType) {
      const fixture = storyboardRepository.getFixtureSession(sessionType);
      await sessionRepository.saveSession(fixture);
      return fixture;
    },
  };

  const assetService: AssetService = {
    async generateImage(scene, frameType) {
      return assetRepository.generateImage(scene, frameType);
    },
    async batchGenerateImages(scenes, onProgress) {
      const nextScenes: Scene[] = [];
      for (const [index, scene] of scenes.entries()) {
        const firstFrameImage = await assetRepository.generateImage(scene, 'first');
        const lastFrameImage = await assetRepository.generateImage(scene, 'last');
        nextScenes.push({ ...scene, firstFrameImage, lastFrameImage });
        onProgress?.({ current: index + 1, total: scenes.length, sceneId: scene.id });
      }
      return nextScenes;
    },
  };

  const settingsService: SettingsService = {
    async getSettings() {
      return settingsRepository.getSettings();
    },
    async updateSettings(patch) {
      return settingsRepository.updateSettings(patch);
    },
  };

  return {
    storyboardService,
    sessionService,
    assetService,
    settingsService,
  };
}

let clientServices: ReturnType<typeof createClientServices> | null = null;

export function getClientServices() {
  if (!clientServices) {
    clientServices = createClientServices();
  }

  return clientServices;
}

export async function ensureDefaultSettings() {
  const services = getClientServices();
  const current = await services.settingsService.getSettings();

  if (!current) {
    await services.settingsService.updateSettings(DEFAULT_APP_SETTINGS);
  }
}

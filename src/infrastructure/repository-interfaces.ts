import type {
  AppSettings,
  FramePrompt,
  FrameType,
  Scene,
  SessionType,
  StoryboardSession,
} from '@/domain/storyboard';

export interface ISettingsRepository {
  getSettings(): Promise<AppSettings>;
  updateSettings(patch: Partial<AppSettings>): Promise<AppSettings>;
}

export interface ISessionRepository {
  loadSession(sessionType: SessionType): Promise<StoryboardSession | null>;
  saveSession(session: StoryboardSession): Promise<void>;
  clearSession(sessionType?: SessionType): Promise<void>;
}

export interface IStoryboardRepository {
  splitScenes(input: { script: string; duration: number; wordCount?: number }): Promise<Scene[]>;
  polishScript(input: { script: string }): Promise<string>;
  importFromUrl(input: { url: string }): Promise<string>;
  generateShotPrompt(scene: Scene): Promise<string>;
  generateFrame(scene: Scene, frameType: FrameType): Promise<FramePrompt>;
  getFixtureSession(sessionType: SessionType): StoryboardSession;
}

export interface IAssetRepository {
  generateImage(scene: Scene, frameType: FrameType): Promise<string>;
}

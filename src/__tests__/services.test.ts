import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createClientServices } from '@/application/services';
import { getLocalStorage, getSessionStorage } from '@/shared/browser-storage';
import { STORAGE_KEYS } from '@/shared/runtime-config';

function resetBrowserStorage() {
  getLocalStorage().removeItem(STORAGE_KEYS.settings);
  getSessionStorage().removeItem(STORAGE_KEYS.autoSession);
  getSessionStorage().removeItem(STORAGE_KEYS.manualSession);
}

describe('StoryboardService', () => {
  beforeEach(() => {
    resetBrowserStorage();
  });

  it('splitScenes returns a StoryboardDraft with correct structure', async () => {
    const { storyboardService } = createClientServices();
    const draft = await storyboardService.splitScenes({
      script: '这是一段测试文案，用于验证分镜拆分功能是否正常工作。',
      duration: 10,
      wordCount: 89,
    });

    expect(draft.script).toBe('这是一段测试文案，用于验证分镜拆分功能是否正常工作。');
    expect(draft.duration).toBe(10);
    expect(draft.scenes.length).toBeGreaterThanOrEqual(3);
    expect(draft.scenes.every((scene) => typeof scene.id === 'number')).toBe(true);
  });

  it('splitScenes falls back to demo script on empty input', async () => {
    const { storyboardService } = createClientServices();
    const draft = await storyboardService.splitScenes({
      script: '',
      duration: 5,
    });

    expect(draft.scenes.length).toBeGreaterThanOrEqual(3);
    draft.scenes.forEach((scene) => {
      expect(scene.duration).toBe(5);
    });
  });

  it('polishScript returns a modified version', async () => {
    const { storyboardService } = createClientServices();
    const polished = await storyboardService.polishScript({
      script: '测试文本',
    });

    expect(polished).toContain('【润色版】');
    expect(polished).toContain('测试文本');
  });

  it('importFromUrl returns mock content', async () => {
    const { storyboardService } = createClientServices();
    const content = await storyboardService.importFromUrl({
      url: 'https://example.com/ad',
    });

    expect(content).toContain('https://example.com/ad');
    expect(content.length).toBeGreaterThan(0);
  });

  it('generateShotPrompt returns a non-empty string', async () => {
    const { storyboardService } = createClientServices();
    const prompt = await storyboardService.generateShotPrompt({
      id: 1,
      name: '分镜1（10秒）',
      dialogue: '测试文案',
      duration: 10,
    });

    expect(typeof prompt).toBe('string');
    expect(prompt.length).toBeGreaterThan(0);
  });

  it('generateFrame returns scene with frame populated', async () => {
    const { storyboardService } = createClientServices();
    const scene = {
      id: 1,
      name: '分镜1',
      dialogue: '测试',
      duration: 5,
    };
    const updated = await storyboardService.generateFrame(scene, 'first');
    expect(updated.firstFrame).toBeDefined();
    expect(updated.firstFrame!.sceneDescription.length).toBeGreaterThan(0);
  });
});

describe('SessionService', () => {
  beforeEach(() => {
    resetBrowserStorage();
  });

  it('loadAutoSession returns null initially', async () => {
    const { sessionService } = createClientServices();
    const session = await sessionService.loadAutoSession();
    expect(session).toBeNull();
  });

  it('saves and restores an auto session', async () => {
    const { sessionService } = createClientServices();
    await sessionService.saveAutoSession({
      script: 'auto script',
      duration: 10,
      scenes: [],
    });

    const restored = await sessionService.loadAutoSession();
    expect(restored).not.toBeNull();
    expect(restored!.script).toBe('auto script');
    expect(restored!.sessionType).toBe('auto');
  });

  it('getFixtureSession returns valid data', () => {
    const { sessionService } = createClientServices();
    const fixture = sessionService.getFixtureSession('auto');
    expect(fixture.sessionType).toBe('auto');
    expect(fixture.scenes.length).toBeGreaterThanOrEqual(2);
  });

  it('resetToFixtureSession saves and returns a fixture', async () => {
    const { sessionService } = createClientServices();
    const fixture = await sessionService.resetToFixtureSession('manual');
    expect(fixture.sessionType).toBe('manual');
    expect(fixture.scenes.length).toBeGreaterThan(0);

    const restored = await sessionService.loadManualSession();
    expect(restored).not.toBeNull();
    expect(restored!.script).toBe(fixture.script);
  });
});

describe('AssetService', () => {
  beforeEach(() => {
    resetBrowserStorage();
  });

  it('generateImage returns a placeholder URL', async () => {
    const { assetService } = createClientServices();
    const url = await assetService.generateImage(
      { id: 1, name: '分镜1', dialogue: '测试', duration: 10 },
      'first',
    );

    expect(url).toContain('placehold.co');
  });

  it('batchGenerateImages fills both frames for every scene', async () => {
    const { assetService } = createClientServices();
    const scenes = [
      { id: 1, name: 'A', dialogue: 'a', duration: 10 },
      { id: 2, name: 'B', dialogue: 'b', duration: 10 },
    ];

    const progressItems: number[] = [];
    const updated = await assetService.batchGenerateImages(scenes, (p) => {
      progressItems.push(p.sceneId);
    });

    expect(updated).toHaveLength(2);
    updated.forEach((scene) => {
      expect(scene.firstFrameImage).toContain('placehold.co');
      expect(scene.lastFrameImage).toContain('placehold.co');
    });
    expect(progressItems).toEqual([1, 2]);
  });
});

describe('SettingsService', () => {
  beforeEach(() => {
    resetBrowserStorage();
  });

  it('getSettings returns defaults with no stored config', async () => {
    const { settingsService } = createClientServices();
    const settings = await settingsService.getSettings();
    expect(settings.mockDelayMs).toBe(600);
  });

  it('updateSettings persists and returns new values', async () => {
    const { settingsService } = createClientServices();
    const updated = await settingsService.updateSettings({ mockFailureRate: 25 });
    expect(updated.mockFailureRate).toBe(25);

    const reloaded = await settingsService.getSettings();
    expect(reloaded.mockFailureRate).toBe(25);
  });
});

describe('Service mode selection', () => {
  beforeEach(() => {
    resetBrowserStorage();
    delete process.env.NEXT_PUBLIC_DATA_MODE;
  });

  it('uses mock repositories by default', async () => {
    const { sessionService } = createClientServices();
    const session = await sessionService.loadAutoSession();
    expect(session).toBeNull();
  });

  it('uses remote repositories for session/settings when remote mode is enabled', async () => {
    process.env.NEXT_PUBLIC_DATA_MODE = 'remote';
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true, data: null }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        success: true,
        data: {
          dataMode: 'remote',
          mockDelayMs: 600,
          mockFailureRate: 0,
          language: 'zh',
          theme: 'light',
        },
      }), { status: 200 }));

    vi.stubGlobal('fetch', fetchMock);

    const { createClientServices: createRemoteClientServices } = await import('@/application/services');
    const services = createRemoteClientServices();
    await services.sessionService.loadAutoSession();
    await services.settingsService.getSettings();

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      '/api/session?type=auto',
      expect.objectContaining({ headers: expect.objectContaining({ 'Content-Type': 'application/json' }) }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/settings',
      expect.objectContaining({ headers: expect.objectContaining({ 'Content-Type': 'application/json' }) }),
    );

    vi.unstubAllGlobals();
    delete process.env.NEXT_PUBLIC_DATA_MODE;
  });
});

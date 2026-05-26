import { describe, it, expect, beforeEach } from 'vitest';
import { createClientServices } from '@/application/services';
import { getLocalStorage, getSessionStorage } from '@/shared/browser-storage';
import { STORAGE_KEYS } from '@/shared/runtime-config';

function resetBrowserStorage() {
  getLocalStorage().removeItem(STORAGE_KEYS.settings);
  getSessionStorage().removeItem(STORAGE_KEYS.autoSession);
  getSessionStorage().removeItem(STORAGE_KEYS.manualSession);
}

describe('Smoke: full demo walkthrough', () => {
  beforeEach(() => {
    resetBrowserStorage();
  });

  it('smart-create → result → generate prompts → restore session', async () => {
    const services = createClientServices();

    // 1. Split scenes
    const draft = await services.storyboardService.splitScenes({
      script: '每天坚持使用，肌肤焕发自然光彩。温和配方，深层滋养。',
      duration: 10,
      wordCount: 89,
    });

    expect(draft.scenes.length).toBeGreaterThanOrEqual(2);

    // 2. Save auto session
    await services.sessionService.saveAutoSession({
      script: draft.script,
      duration: draft.duration,
      wordCount: draft.wordCount,
      scenes: draft.scenes,
    });

    // 3. Generate prompt for first scene
    const firstScene = draft.scenes[0];
    const prompt = await services.storyboardService.generateShotPrompt(firstScene);
    expect(prompt.length).toBeGreaterThan(0);

    // 4. Generate frame for first scene
    const withFrame = await services.storyboardService.generateFrame(firstScene, 'first');
    expect(withFrame.firstFrame).toBeDefined();

    // 5. Generate image
    const imageUrl = await services.assetService.generateImage(firstScene, 'first');
    expect(imageUrl).toContain('placehold.co');

    // 6. Update and re-save
    const updatedScenes = draft.scenes.map((scene) =>
      scene.id === firstScene.id
        ? { ...scene, shotPrompt: prompt, firstFrame: withFrame.firstFrame, firstFrameImage: imageUrl }
        : scene,
    );

    await services.sessionService.saveAutoSession({
      script: draft.script,
      duration: draft.duration,
      wordCount: draft.wordCount,
      scenes: updatedScenes,
    });

    // 7. Restore session
    const restored = await services.sessionService.loadAutoSession();
    expect(restored).not.toBeNull();
    expect(restored!.scenes).toHaveLength(draft.scenes.length);
    const restoredFirst = restored!.scenes.find((s) => s.id === firstScene.id);
    expect(restoredFirst).toBeDefined();
    expect(restoredFirst!.shotPrompt).toBe(prompt);
    expect(restoredFirst!.firstFrameImage).toBe(imageUrl);
  });

  it('batch generation with progress tracking', { timeout: 15000 }, async () => {
    const services = createClientServices();
    // Reduce delay for test speed
    await services.settingsService.updateSettings({ mockDelayMs: 10 });
    const scenes = [
      { id: 1, name: 'A', dialogue: 'a', duration: 10 },
      { id: 2, name: 'B', dialogue: 'b', duration: 10 },
      { id: 3, name: 'C', dialogue: 'c', duration: 10 },
    ];

    const promptProgress: number[] = [];
    const promptResult = await services.storyboardService.batchGeneratePrompts(
      scenes,
      (p) => promptProgress.push(p.sceneId),
    );
    expect(promptResult).toHaveLength(3);
    expect(promptProgress).toEqual([1, 2, 3]);

    const frameProgress: number[] = [];
    const frameResult = await services.storyboardService.batchGenerateFrames(
      promptResult,
      (p) => frameProgress.push(p.sceneId),
    );
    expect(frameResult).toHaveLength(3);
    expect(frameProgress).toEqual([1, 2, 3]);

    const imageProgress: number[] = [];
    const imageResult = await services.assetService.batchGenerateImages(
      frameResult,
      (p) => imageProgress.push(p.sceneId),
    );
    expect(imageResult).toHaveLength(3);
    expect(imageProgress).toEqual([1, 2, 3]);
  });

  it('settings update affects service behavior', async () => {
    const services = createClientServices();

    // Default: no failures
    const result = await services.storyboardService.splitScenes({
      script: 'test',
      duration: 5,
    });
    expect(result.scenes.length).toBeGreaterThan(0);

    // Update settings
    const updated = await services.settingsService.updateSettings({ mockFailureRate: 5, mockDelayMs: 200 });
    expect(updated.mockFailureRate).toBe(5);
    expect(updated.mockDelayMs).toBe(200);

    const reloaded = await services.settingsService.getSettings();
    expect(reloaded.mockFailureRate).toBe(5);
  });
});

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getClientServices } from '@/application';
import type { Scene, StoryboardSession } from '@/domain/storyboard';
import { useApp } from '@/contexts/AppContext';
import { showErrorAlert } from '@/lib/error-handler';

function createScene(id: number, duration = 5): Scene {
  return {
    id,
    name: `分镜${id}（${duration}秒）`,
    dialogue: '',
    duration,
  };
}

export default function ManualCreatePage() {
  const router = useRouter();
  const { language } = useApp();
  const { storyboardService, sessionService, assetService } = getClientServices();
  const [session, setSession] = useState<StoryboardSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [shotLoading, setShotLoading] = useState<Record<number, boolean>>({});
  const [frameLoading, setFrameLoading] = useState<Record<string, boolean>>({});
  const [imageLoading, setImageLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let active = true;
    const initialize = async () => {
      try {
        const restored = await sessionService.loadManualSession();
        if (!active) {
          return;
        }

        setSession(restored || {
          sessionType: 'manual',
          script: 'Manual Create',
          duration: 5,
          wordCount: 42,
          scenes: [createScene(1)],
          updatedAt: new Date().toISOString(),
        });
      } catch (error) {
        showErrorAlert(error, language === 'zh' ? '手工分镜初始化失败' : 'Failed to initialize manual scene');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void initialize();
    return () => {
      active = false;
    };
  }, [language, sessionService]);

  useEffect(() => {
    if (!session || loading) {
      return;
    }

    const timer = window.setTimeout(async () => {
      setSaving(true);
      try {
        await sessionService.saveManualSession({
          script: session.script,
          duration: session.duration,
          wordCount: session.wordCount,
          scenes: session.scenes,
        });
      } catch (error) {
        console.error(error);
      } finally {
        setSaving(false);
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [loading, session, sessionService]);

  const updateScene = (sceneId: number, updater: (scene: Scene) => Scene) => {
    setSession((current) => current ? {
      ...current,
      scenes: current.scenes.map((scene) => scene.id === sceneId ? updater(scene) : scene),
    } : current);
  };

  const addScene = () => {
    setSession((current) => {
      if (!current) {
        return current;
      }
      const nextId = current.scenes.length ? Math.max(...current.scenes.map((scene) => scene.id)) + 1 : 1;
      return {
        ...current,
        scenes: [...current.scenes, createScene(nextId, current.duration)],
      };
    });
  };

  const removeScene = (sceneId: number) => {
    setSession((current) => current ? {
      ...current,
      scenes: current.scenes.filter((scene) => scene.id !== sceneId),
    } : current);
  };

  const handleGeneratePrompt = async (scene: Scene) => {
    setShotLoading((current) => ({ ...current, [scene.id]: true }));
    try {
      const shotPrompt = await storyboardService.generateShotPrompt(scene);
      updateScene(scene.id, (item) => ({ ...item, shotPrompt }));
    } catch (error) {
      showErrorAlert(error, language === 'zh' ? '镜头提示词生成失败' : 'Prompt generation failed');
    } finally {
      setShotLoading((current) => ({ ...current, [scene.id]: false }));
    }
  };

  const handleGenerateFrame = async (scene: Scene, frameType: 'first' | 'last') => {
    const key = `${scene.id}-${frameType}`;
    setFrameLoading((current) => ({ ...current, [key]: true }));
    try {
      const nextScene = await storyboardService.generateFrame(scene, frameType);
      updateScene(scene.id, () => nextScene);
    } catch (error) {
      showErrorAlert(error, language === 'zh' ? '首尾帧生成失败' : 'Frame generation failed');
    } finally {
      setFrameLoading((current) => ({ ...current, [key]: false }));
    }
  };

  const handleGenerateImage = async (scene: Scene, frameType: 'first' | 'last') => {
    const key = `${scene.id}-${frameType}`;
    setImageLoading((current) => ({ ...current, [key]: true }));
    try {
      const imageUrl = await assetService.generateImage(scene, frameType);
      updateScene(scene.id, (item) => (
        frameType === 'first'
          ? { ...item, firstFrameImage: imageUrl }
          : { ...item, lastFrameImage: imageUrl }
      ));
    } catch (error) {
      showErrorAlert(error, language === 'zh' ? '图片生成失败' : 'Image generation failed');
    } finally {
      setImageLoading((current) => ({ ...current, [key]: false }));
    }
  };

  if (loading || !session) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-gray-500 dark:text-gray-400">
        {language === 'zh' ? '加载手工分镜中...' : 'Loading manual scene...'}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-black">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">
              {language === 'zh' ? '手工分镜' : 'Manual Storyboard'}
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {language === 'zh'
                ? '这一页完全由 mock session 驱动。你可以增删改查分镜内容，并生成提示词、首尾帧和占位图。'
                : 'This page is fully powered by the mock session. Create, edit, remove, and enrich scenes with prompts, frames, and placeholder images.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={addScene}
              className="rounded-2xl border border-gray-200 px-4 py-2 text-sm dark:border-gray-700"
            >
              {language === 'zh' ? '新增分镜' : 'Add Scene'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/settings')}
              className="rounded-2xl bg-black px-4 py-2 text-sm text-white dark:bg-white dark:text-black"
            >
              {language === 'zh' ? '查看演示配置' : 'View Settings'}
            </button>
          </div>
        </div>
        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          {saving ? (language === 'zh' ? '正在自动保存...' : 'Autosaving...') : (language === 'zh' ? '本地会话已接管自动保存' : 'Autosave is handled by local mock session')}
        </div>
      </section>

      <section className="space-y-4">
        {session.scenes.map((scene) => (
          <article
            key={scene.id}
            className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-black"
          >
            <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <input
                    value={scene.name}
                    onChange={(event) => updateScene(scene.id, (item) => ({ ...item, name: event.target.value }))}
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-lg font-semibold outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => removeScene(scene.id)}
                    disabled={session.scenes.length === 1}
                    className="rounded-2xl border border-red-200 px-4 py-3 text-sm text-red-600 disabled:opacity-40 dark:border-red-900/40"
                  >
                    {language === 'zh' ? '删除' : 'Delete'}
                  </button>
                </div>

                <textarea
                  value={scene.dialogue}
                  onChange={(event) => updateScene(scene.id, (item) => ({ ...item, dialogue: event.target.value }))}
                  rows={5}
                  placeholder={language === 'zh' ? '输入这个分镜的对白或动作说明' : 'Describe dialogue or action for this scene'}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />

                <textarea
                  value={scene.shotPrompt || ''}
                  onChange={(event) => updateScene(scene.id, (item) => ({ ...item, shotPrompt: event.target.value }))}
                  rows={6}
                  placeholder={language === 'zh' ? '镜头提示词' : 'Shot prompt'}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleGeneratePrompt(scene)}
                    className="rounded-full border border-gray-200 px-3 py-1.5 text-xs dark:border-gray-700"
                  >
                    {shotLoading[scene.id]
                      ? (language === 'zh' ? '生成中...' : 'Generating...')
                      : (language === 'zh' ? '生成提示词' : 'Generate Prompt')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGenerateFrame(scene, 'first')}
                    className="rounded-full border border-gray-200 px-3 py-1.5 text-xs dark:border-gray-700"
                  >
                    {frameLoading[`${scene.id}-first`]
                      ? (language === 'zh' ? '首帧生成中...' : 'Generating first...')
                      : (language === 'zh' ? '生成首帧' : 'First Frame')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGenerateFrame(scene, 'last')}
                    className="rounded-full border border-gray-200 px-3 py-1.5 text-xs dark:border-gray-700"
                  >
                    {frameLoading[`${scene.id}-last`]
                      ? (language === 'zh' ? '尾帧生成中...' : 'Generating last...')
                      : (language === 'zh' ? '生成尾帧' : 'Last Frame')}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {(['first', 'last'] as const).map((frameType) => {
                  const frame = frameType === 'first' ? scene.firstFrame : scene.lastFrame;
                  const imageUrl = frameType === 'first' ? scene.firstFrameImage : scene.lastFrameImage;
                  return (
                    <div key={frameType} className="rounded-2xl bg-gray-50 p-4 dark:bg-gray-900">
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                          {frameType === 'first'
                            ? (language === 'zh' ? '首帧信息' : 'First Frame')
                            : (language === 'zh' ? '尾帧信息' : 'Last Frame')}
                        </h3>
                        <button
                          type="button"
                          onClick={() => handleGenerateImage(scene, frameType)}
                          className="rounded-full border border-gray-200 px-3 py-1 text-xs dark:border-gray-700"
                        >
                          {imageLoading[`${scene.id}-${frameType}`]
                            ? (language === 'zh' ? '生成图片中...' : 'Rendering...')
                            : (language === 'zh' ? '生成图片' : 'Generate Image')}
                        </button>
                      </div>

                      {frame ? (
                        <div className="space-y-2 text-xs text-gray-600 dark:text-gray-300">
                          <div>{frame.sceneDescription}</div>
                          <div>{frame.characterPerformance}</div>
                          <div>{frame.cameraAngle}</div>
                          <div>{frame.lighting}</div>
                          {frame.atmosphere && <div>{frame.atmosphere}</div>}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {language === 'zh' ? '尚未生成' : 'Not generated yet'}
                        </div>
                      )}

                      {imageUrl && (
                        <button
                          type="button"
                          onClick={() => router.push(`/image-viewer?image=${encodeURIComponent(imageUrl)}&name=${encodeURIComponent(`${scene.name}-${frameType}.jpg`)}`)}
                          className="mt-4 block w-full overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={imageUrl} alt={`${scene.name}-${frameType}`} className="h-40 w-full object-cover" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

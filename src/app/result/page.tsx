'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getClientServices } from '@/application';
import type { Scene, StoryboardSession } from '@/domain/storyboard';
import { useApp } from '@/contexts/AppContext';
import { showErrorAlert } from '@/lib/error-handler';

function formatFrame(scene: Scene, frameType: 'first' | 'last') {
  const frame = frameType === 'first' ? scene.firstFrame : scene.lastFrame;
  if (!frame) {
    return null;
  }

  return [
    ['场景描述', frame.sceneDescription],
    ['角色表演', frame.characterPerformance],
    ['镜头角度', frame.cameraAngle],
    ['灯光', frame.lighting],
    ['氛围', frame.atmosphere || '-'],
  ];
}

export default function ResultPage() {
  const router = useRouter();
  const { language, settings } = useApp();
  const { storyboardService, sessionService, assetService } = getClientServices();
  const [session, setSession] = useState<StoryboardSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [shotLoading, setShotLoading] = useState<Record<number, boolean>>({});
  const [frameLoading, setFrameLoading] = useState<Record<string, boolean>>({});
  const [imageLoading, setImageLoading] = useState<Record<string, boolean>>({});
  const [batchState, setBatchState] = useState<{
    type: 'prompt' | 'frame' | null;
    current: number;
    total: number;
  }>({ type: null, current: 0, total: 0 });

  useEffect(() => {
    let active = true;

    const initialize = async () => {
      try {
        const restored = await sessionService.loadAutoSession();
        if (!active) {
          return;
        }

        if (restored) {
          setSession(restored);
        } else {
          setSession(sessionService.getFixtureSession('auto'));
        }
      } catch (error) {
        showErrorAlert(error, language === 'zh' ? '结果页初始化失败' : 'Failed to initialize result page');
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
        await sessionService.saveAutoSession({
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

  const scenes = useMemo(() => session?.scenes || [], [session]);

  const updateScene = (sceneId: number, updater: (scene: Scene) => Scene) => {
    setSession((current) => current ? {
      ...current,
      scenes: current.scenes.map((scene) => scene.id === sceneId ? updater(scene) : scene),
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

  const handleBatchPrompts = async () => {
    if (!session) {
      return;
    }

    setBatchState({ type: 'prompt', current: 0, total: session.scenes.length });
    try {
      const nextScenes = await storyboardService.batchGeneratePrompts(session.scenes, (progress) => {
        setBatchState({ type: 'prompt', current: progress.current, total: progress.total });
      });
      setSession({ ...session, scenes: nextScenes });
    } catch (error) {
      showErrorAlert(error, language === 'zh' ? '批量生成提示词失败' : 'Batch prompt generation failed');
    } finally {
      setBatchState({ type: null, current: 0, total: 0 });
    }
  };

  const handleBatchFrames = async () => {
    if (!session) {
      return;
    }

    setBatchState({ type: 'frame', current: 0, total: session.scenes.length });
    try {
      const nextScenes = await storyboardService.batchGenerateFrames(session.scenes, (progress) => {
        setBatchState({ type: 'frame', current: progress.current, total: progress.total });
      });
      setSession({ ...session, scenes: nextScenes });
    } catch (error) {
      showErrorAlert(error, language === 'zh' ? '批量生成首尾帧失败' : 'Batch frame generation failed');
    } finally {
      setBatchState({ type: null, current: 0, total: 0 });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-gray-500 dark:text-gray-400">
        {language === 'zh' ? '正在加载演示结果...' : 'Loading demo result...'}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-black">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">
              {language === 'zh' ? '分镜结果' : 'Storyboard Result'}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600 dark:text-gray-400">
              {session?.script}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => router.push('/smart-create')}
              className="rounded-2xl border border-gray-200 px-4 py-2 text-sm dark:border-gray-700"
            >
              {language === 'zh' ? '返回重做' : 'Back'}
            </button>
            <button
              type="button"
              onClick={handleBatchPrompts}
              className="rounded-2xl border border-gray-200 px-4 py-2 text-sm dark:border-gray-700"
            >
              {language === 'zh' ? '批量生成提示词' : 'Batch Prompts'}
            </button>
            <button
              type="button"
              onClick={handleBatchFrames}
              className="rounded-2xl bg-black px-4 py-2 text-sm text-white dark:bg-white dark:text-black"
            >
              {language === 'zh' ? '批量生成首尾帧' : 'Batch Frames'}
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <span>{language === 'zh' ? `时长 ${session?.duration}s` : `Duration ${session?.duration}s`}</span>
          <span>{language === 'zh' ? `分镜数量 ${scenes.length}` : `Scenes ${scenes.length}`}</span>
          <span>{saving
            ? (language === 'zh' ? '正在自动保存...' : 'Autosaving...')
            : (language === 'zh'
              ? `${settings?.dataMode === 'remote' ? '远端' : '本地'}会话已接管保存`
              : `Saved to ${settings?.dataMode === 'remote' ? 'remote' : 'local'} session storage`)}</span>
          {batchState.type && (
            <span>
              {language === 'zh'
                ? `批量处理中 ${batchState.current}/${batchState.total}`
                : `Batch ${batchState.current}/${batchState.total}`}
            </span>
          )}
        </div>
      </section>

      <section className="space-y-4">
        {scenes.map((scene) => (
          <article
            key={scene.id}
            className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-black"
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{scene.name}</h2>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{scene.dialogue}</p>
              </div>
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

            <div className="mt-5 grid gap-4 lg:grid-cols-3">
              <div className="rounded-2xl bg-gray-50 p-4 dark:bg-gray-900">
                <div className="mb-2 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  {language === 'zh' ? '镜头提示词' : 'Shot Prompt'}
                </div>
                <textarea
                  value={scene.shotPrompt || ''}
                  onChange={(event) => updateScene(scene.id, (item) => ({ ...item, shotPrompt: event.target.value }))}
                  rows={8}
                  className="w-full resize-none bg-transparent text-sm leading-6 text-gray-700 outline-none dark:text-gray-200"
                />
              </div>

              {(['first', 'last'] as const).map((frameType) => {
                const rows = formatFrame(scene, frameType);
                const imageUrl = frameType === 'first' ? scene.firstFrameImage : scene.lastFrameImage;

                return (
                  <div key={frameType} className="rounded-2xl bg-gray-50 p-4 dark:bg-gray-900">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        {frameType === 'first'
                          ? (language === 'zh' ? '首帧' : 'First Frame')
                          : (language === 'zh' ? '尾帧' : 'Last Frame')}
                      </div>
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

                    <div className="space-y-2 text-sm">
                      {rows ? rows.map(([label, value]) => (
                        <div key={label}>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
                          <input
                            value={value}
                            onChange={(event) => updateScene(scene.id, (item) => {
                              const frame = frameType === 'first' ? item.firstFrame : item.lastFrame;
                              if (!frame) {
                                return item;
                              }
                              const keyMap = {
                                '场景描述': 'sceneDescription',
                                '角色表演': 'characterPerformance',
                                '镜头角度': 'cameraAngle',
                                '灯光': 'lighting',
                                '氛围': 'atmosphere',
                              } as const;
                              const frameKey = keyMap[label as keyof typeof keyMap];
                              const nextFrame = { ...frame, [frameKey]: event.target.value };
                              return frameType === 'first'
                                ? { ...item, firstFrame: nextFrame }
                                : { ...item, lastFrame: nextFrame };
                            })}
                            className="mt-1 w-full rounded-xl border border-transparent bg-white px-3 py-2 text-sm outline-none dark:bg-black"
                          />
                        </div>
                      )) : (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {language === 'zh' ? '尚未生成' : 'Not generated yet'}
                        </div>
                      )}
                    </div>

                    {imageUrl && (
                      <button
                        type="button"
                        onClick={() => router.push(`/image-viewer?image=${encodeURIComponent(imageUrl)}&name=${encodeURIComponent(`${scene.name}-${frameType}.jpg`)}`)}
                        className="mt-4 block overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imageUrl} alt={`${scene.name}-${frameType}`} className="h-44 w-full object-cover" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

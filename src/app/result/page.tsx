'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getClientServices } from '@/application';
import type { Scene, StoryboardSession } from '@/domain/storyboard';
import { useApp } from '@/contexts/AppContext';

function formatFrame(scene: Scene, frameType: 'first' | 'last') {
  const frame = frameType === 'first' ? scene.firstFrame : scene.lastFrame;
  if (!frame) return null;
  return [
    ['场景描述', frame.sceneDescription],
    ['角色表演', frame.characterPerformance],
    ['镜头角度', frame.cameraAngle],
    ['灯光', frame.lighting],
    ['氛围', frame.atmosphere || '-'],
  ];
}

function FramePanel({
  scene,
  frameType,
  imageUrl,
  onGenerateImage,
  onUpdateScene,
  imageLoading,
  language,
}: {
  scene: Scene;
  frameType: 'first' | 'last';
  imageUrl?: string;
  onGenerateImage: () => void;
  onUpdateScene: (updater: (s: Scene) => Scene) => void;
  imageLoading: boolean;
  language: string;
}) {
  const router = useRouter();
  const rows = formatFrame(scene, frameType);
  const keyMap: Record<string, string> = {
    '场景描述': 'sceneDescription',
    '角色表演': 'characterPerformance',
    '镜头角度': 'cameraAngle',
    '灯光': 'lighting',
    '氛围': 'atmosphere',
  };

  return (
    <div className="rounded-[8px] bg-gray-50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-xs uppercase tracking-wide text-gray-400">
          {frameType === 'first' ? (language === 'zh' ? '首帧' : 'First Frame') : (language === 'zh' ? '尾帧' : 'Last Frame')}
        </div>
        <button
          type="button"
          onClick={onGenerateImage}
          className="flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600 hover:bg-gray-100 transition-colors"
        >
          {imageLoading ? (language === 'zh' ? '渲染中...' : 'Rendering...') : (language === 'zh' ? '生成图片' : 'Generate Image')}
        </button>
      </div>

      {rows ? (
        <div className="space-y-2 text-sm">
          {rows.map(([label, value]) => (
            <div key={label}>
              <div className="text-xs text-gray-400">{label}</div>
              <input
                value={value}
                onChange={(e) => onUpdateScene((item) => {
                  const frame = frameType === 'first' ? item.firstFrame : item.lastFrame;
                  if (!frame) return item;
                  const frameKey = keyMap[label] || 'sceneDescription';
                  const next = { ...frame, [frameKey]: e.target.value };
                  return frameType === 'first' ? { ...item, firstFrame: next } : { ...item, lastFrame: next };
                })}
                className="mt-1 w-full rounded-[6px] border border-transparent bg-white px-3 py-2 text-sm outline-none"
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-gray-400">{language === 'zh' ? '尚未生成' : 'Not generated yet'}</div>
      )}

      {imageUrl && (
        <button
          type="button"
          onClick={() => router.push(`/image-viewer?image=${encodeURIComponent(imageUrl)}&name=${encodeURIComponent(`${scene.name}-${frameType}.jpg`)}`)}
          className="mt-4 block overflow-hidden rounded-[8px] border border-gray-200 hover:opacity-90 transition-opacity"
        >
          <img src={imageUrl} alt="" className="h-44 w-full object-cover" />
        </button>
      )}
    </div>
  );
}

function SceneCard({
  scene,
  language,
  onGeneratePrompt,
  onGenerateFrame,
  onUpdateScene,
  shotLoading,
  frameLoading,
  onGenerateImage,
  imageLoading,
}: {
  scene: Scene;
  language: string;
  onGeneratePrompt: (scene: Scene) => void;
  onGenerateFrame: (scene: Scene, type: 'first' | 'last') => void;
  onUpdateScene: (id: number, updater: (s: Scene) => Scene) => void;
  shotLoading: boolean;
  frameLoading: Record<string, boolean>;
  onGenerateImage: (scene: Scene, type: 'first' | 'last') => void;
  imageLoading: Record<string, boolean>;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-[8px] p-6 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{scene.name}</h2>
          <p className="mt-1 text-sm text-gray-500 max-w-[65ch]">{scene.dialogue}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onGeneratePrompt(scene)}
            className="flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
          >
            {shotLoading ? (language === 'zh' ? '生成中...' : 'Generating...') : (language === 'zh' ? '生成提示词' : 'Prompt')}
          </button>
          <button
            type="button"
            onClick={() => onGenerateFrame(scene, 'first')}
            className="flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
          >
            {frameLoading[`${scene.id}-first`] ? (language === 'zh' ? '首帧中...' : 'First...') : (language === 'zh' ? '首帧' : 'First')}
          </button>
          <button
            type="button"
            onClick={() => onGenerateFrame(scene, 'last')}
            className="flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
          >
            {frameLoading[`${scene.id}-last`] ? (language === 'zh' ? '尾帧中...' : 'Last...') : (language === 'zh' ? '尾帧' : 'Last')}
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <div className="rounded-[8px] bg-gray-50 p-4">
          <div className="mb-2 text-xs uppercase tracking-wide text-gray-400">
            {language === 'zh' ? '镜头提示词' : 'Shot Prompt'}
          </div>
          <textarea
            value={scene.shotPrompt || ''}
            onChange={(e) => onUpdateScene(scene.id, (item) => ({ ...item, shotPrompt: e.target.value }))}
            rows={8}
            className="w-full resize-none bg-transparent text-sm leading-6 text-gray-700 outline-none"
          />
        </div>

        {(['first', 'last'] as const).map((ft) => (
          <FramePanel
            key={ft}
            scene={scene}
            frameType={ft}
            imageUrl={ft === 'first' ? scene.firstFrameImage : scene.lastFrameImage}
            onGenerateImage={() => onGenerateImage(scene, ft)}
            onUpdateScene={(updater) => onUpdateScene(scene.id, updater)}
            imageLoading={imageLoading[`${scene.id}-${ft}`] || false}
            language={language}
          />
        ))}
      </div>
    </div>
  );
}

export default function ResultPage() {
  const router = useRouter();
  const { language } = useApp();
  const { storyboardService, sessionService, assetService } = getClientServices();
  const [session, setSession] = useState<StoryboardSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [shotLoading, setShotLoading] = useState<Record<number, boolean>>({});
  const [frameLoading, setFrameLoading] = useState<Record<string, boolean>>({});
  const [imageLoading, setImageLoading] = useState<Record<string, boolean>>({});
  const [batchState, setBatchState] = useState<{ type: 'prompt' | 'frame' | null; current: number; total: number }>(
    { type: null, current: 0, total: 0 },
  );

  useEffect(() => {
    let active = true;
    const initialize = async () => {
      try {
        const restored = await sessionService.loadAutoSession();
        if (!active) return;
        setSession(restored || sessionService.getFixtureSession('auto'));
      } catch {
        alert(language === 'zh' ? '结果页初始化失败' : 'Failed to initialize result page');
      } finally {
        if (active) setLoading(false);
      }
    };
    void initialize();
    return () => { active = false; };
  }, [language, sessionService]);

  useEffect(() => {
    if (!session || loading) return;
    const timer = setTimeout(async () => {
      setSaving(true);
      try {
        await sessionService.saveAutoSession({
          script: session.script,
          duration: session.duration,
          wordCount: session.wordCount,
          scenes: session.scenes,
        });
      } catch { /* ignore */ } finally {
        setSaving(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [loading, session, sessionService]);

  const scenes = useMemo(() => session?.scenes || [], [session]);

  const updateScene = (sceneId: number, updater: (scene: Scene) => Scene) => {
    setSession((current) => (current ? { ...current, scenes: current.scenes.map((s) => s.id === sceneId ? updater(s) : s) } : current));
  };

  const handleGeneratePrompt = async (scene: Scene) => {
    setShotLoading((prev) => ({ ...prev, [scene.id]: true }));
    try {
      const shotPrompt = await storyboardService.generateShotPrompt(scene);
      updateScene(scene.id, (item) => ({ ...item, shotPrompt }));
    } catch {
      alert(language === 'zh' ? '镜头提示词生成失败' : 'Prompt generation failed');
    } finally {
      setShotLoading((prev) => ({ ...prev, [scene.id]: false }));
    }
  };

  const handleGenerateFrame = async (scene: Scene, frameType: 'first' | 'last') => {
    const key = `${scene.id}-${frameType}`;
    setFrameLoading((prev) => ({ ...prev, [key]: true }));
    try {
      const nextScene = await storyboardService.generateFrame(scene, frameType);
      updateScene(scene.id, () => nextScene);
    } catch {
      alert(language === 'zh' ? '首尾帧生成失败' : 'Frame generation failed');
    } finally {
      setFrameLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleGenerateImage = async (scene: Scene, frameType: 'first' | 'last') => {
    const key = `${scene.id}-${frameType}`;
    setImageLoading((prev) => ({ ...prev, [key]: true }));
    try {
      const imageUrl = await assetService.generateImage(scene, frameType);
      updateScene(scene.id, (item) => (frameType === 'first' ? { ...item, firstFrameImage: imageUrl } : { ...item, lastFrameImage: imageUrl }));
    } catch {
      alert(language === 'zh' ? '图片生成失败' : 'Image generation failed');
    } finally {
      setImageLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleBatchPrompts = async () => {
    if (!session) return;
    setBatchState({ type: 'prompt', current: 0, total: session.scenes.length });
    try {
      const nextScenes = await storyboardService.batchGeneratePrompts(session.scenes, (p) => {
        setBatchState({ type: 'prompt', current: p.current, total: p.total });
      });
      setSession({ ...session, scenes: nextScenes });
    } catch {
      alert(language === 'zh' ? '批量生成提示词失败' : 'Batch prompt generation failed');
    } finally {
      setBatchState({ type: null, current: 0, total: 0 });
    }
  };

  const handleBatchFrames = async () => {
    if (!session) return;
    setBatchState({ type: 'frame', current: 0, total: session.scenes.length });
    try {
      const nextScenes = await storyboardService.batchGenerateFrames(session.scenes, (p) => {
        setBatchState({ type: 'frame', current: p.current, total: p.total });
      });
      setSession({ ...session, scenes: nextScenes });
    } catch {
      alert(language === 'zh' ? '批量生成首尾帧失败' : 'Batch frame generation failed');
    } finally {
      setBatchState({ type: null, current: 0, total: 0 });
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-sm text-gray-400">
          {language === 'zh' ? '加载分镜结果...' : 'Loading result...'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-[8px] p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              {language === 'zh' ? '分镜结果' : 'Storyboard Result'}
            </h1>
            <p className="mt-2 max-w-[65ch] text-sm text-gray-500">
              {session?.script}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => router.push('/smart-create')}
              className="flex items-center gap-1.5 rounded-[6px] border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              {language === 'zh' ? '返回' : 'Back'}
            </button>
            <button
              type="button"
              onClick={handleBatchPrompts}
              className="flex items-center gap-1.5 rounded-[6px] border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              {language === 'zh' ? '批量提示词' : 'Batch Prompts'}
            </button>
            <button
              type="button"
              onClick={handleBatchFrames}
              className="flex items-center gap-1.5 rounded-[6px] bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800 transition-colors"
            >
              {language === 'zh' ? '批量帧' : 'Batch Frames'}
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-400">
          <span>{language === 'zh' ? `时长 ${session?.duration}s` : `Duration ${session?.duration}s`}</span>
          <span>{language === 'zh' ? `分镜 ${scenes.length}` : `Scenes ${scenes.length}`}</span>
          <span>
            {saving
              ? (language === 'zh' ? '自动保存中...' : 'Saving...')
              : (language === 'zh' ? '已保存' : 'Saved')}
          </span>
          {batchState.type && (
            <span className="text-gray-500">{batchState.current}/{batchState.total}</span>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {scenes.map((scene) => (
          <SceneCard
            key={scene.id}
            scene={scene}
            language={language}
            onGeneratePrompt={handleGeneratePrompt}
            onGenerateFrame={handleGenerateFrame}
            onUpdateScene={updateScene}
            shotLoading={shotLoading[scene.id] || false}
            frameLoading={frameLoading}
            onGenerateImage={handleGenerateImage}
            imageLoading={imageLoading}
          />
        ))}
      </div>
    </div>
  );
}

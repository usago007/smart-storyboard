'use client';

import { useEffect, useState, useCallback } from 'react';
import { getClientServices } from '@/application';
import type { Scene, StoryboardSession } from '@/domain/storyboard';

function createScene(id: number, duration = 5): Scene {
  return {
    id,
    name: `分镜${id}（${duration}秒）`,
    dialogue: '',
    duration,
  };
}

const durationRange: Record<number, string> = {
  5: '35-50',
  10: '70-100',
  12: '84-120',
};

export default function ManualCreatePage() {
  const { sessionService } = getClientServices();
  const [session, setSession] = useState<StoryboardSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);
  const [lockedScenes, setLockedScenes] = useState<Set<number>>(new Set());

  useEffect(() => {
    let active = true;
    const initialize = async () => {
      try {
        const restored = await sessionService.loadManualSession();
        if (!active) return;
        setSession(restored || {
          sessionType: 'manual',
          script: 'Manual Create',
          duration: 5,
          wordCount: 42,
          scenes: [createScene(1)],
          updatedAt: new Date().toISOString(),
        });
      } catch {
        alert('手工分镜初始化失败');
      } finally {
        if (active) setLoading(false);
      }
    };
    void initialize();
    return () => { active = false; };
  }, [sessionService]);

  useEffect(() => {
    if (!session || loading) return;
    const timer = setTimeout(async () => {
      try {
        await sessionService.saveManualSession({
          script: session.script,
          duration: session.duration,
          wordCount: session.wordCount,
          scenes: session.scenes,
        });
      } catch { /* ignore */ }
    }, 300);
    return () => clearTimeout(timer);
  }, [loading, session, sessionService]);

  const updateScene = useCallback((sceneId: number, updater: (scene: Scene) => Scene) => {
    setSession((current) => (current ? { ...current, scenes: current.scenes.map((s) => s.id === sceneId ? updater(s) : s) } : current));
  }, []);

  const addScene = useCallback(() => {
    setSession((current) => {
      if (!current) return current;
      const nextId = current.scenes.length ? Math.max(...current.scenes.map((s) => s.id)) + 1 : 1;
      return { ...current, scenes: [...current.scenes, createScene(nextId, current.duration)] };
    });
  }, []);

  const handleGenerate = useCallback(async (scene: Scene, field: string) => {
    if (!session) return;
    try {
      let mockContent = '';
      switch (field) {
        case 'shotPrompt':
          mockContent = '镜头缓缓推进，特写产品细节，背景虚化突出主体。';
          break;
        case 'firstFramePrompt':
          mockContent = '开篇全景，温暖的自然光线洒入室内，主角由远及近走来。';
          break;
        case 'firstFrameImage':
          mockContent = 'https://picsum.photos/seed/frame1/800/600';
          break;
        case 'lastFramePrompt':
          mockContent = '结尾特写，产品在主角手中绽放光芒，品牌Logo淡入。';
          break;
        case 'lastFrameImage':
          mockContent = 'https://picsum.photos/seed/frame2/800/600';
          break;
      }
      updateScene(scene.id, (item) => {
        switch (field) {
          case 'shotPrompt': return { ...item, shotPrompt: mockContent };
          case 'firstFramePrompt': return { ...item, firstFrame: { sceneDescription: mockContent, characterPerformance: '', cameraAngle: '', lighting: '', atmosphere: '' } };
          case 'firstFrameImage': return { ...item, firstFrameImage: mockContent };
          case 'lastFramePrompt': return { ...item, lastFrame: { sceneDescription: mockContent, characterPerformance: '', cameraAngle: '', lighting: '', atmosphere: '' } };
          case 'lastFrameImage': return { ...item, lastFrameImage: mockContent };
          default: return item;
        }
      });
    } catch {
      alert('生成失败');
    }
  }, [session, updateScene]);

  const handleGenerateAll = useCallback(async (scene: Scene) => {
    if (!session) return;
    updateScene(scene.id, (item) => ({
      ...item,
      shotPrompt: '镜头缓缓推进，特写产品细节，背景虚化突出主体。',
      firstFrame: { sceneDescription: '开篇全景，温暖的自然光线洒入室内，主角由远及近走来。', characterPerformance: '', cameraAngle: '', lighting: '', atmosphere: '' },
      lastFrame: { sceneDescription: '结尾特写，产品在主角手中绽放光芒，品牌Logo淡入。', characterPerformance: '', cameraAngle: '', lighting: '', atmosphere: '' },
      firstFrameImage: 'https://picsum.photos/seed/frame1/800/600',
      lastFrameImage: 'https://picsum.photos/seed/frame2/800/600',
    }));
  }, [session, updateScene]);

  const handleRegenerate = useCallback(async (scene: Scene) => {
    if (!session) return;
    updateScene(scene.id, (item) => ({
      ...item,
      shotPrompt: '',
      firstFrame: undefined,
      lastFrame: undefined,
      firstFrameImage: undefined,
      lastFrameImage: undefined,
    }));
    handleGenerateAll(scene);
  }, [session, updateScene, handleGenerateAll]);

  const handleToggleLock = useCallback((sceneId: number) => {
    setLockedScenes((prev) => {
      const next = new Set(prev);
      if (next.has(sceneId)) next.delete(sceneId);
      else next.add(sceneId);
      return next;
    });
  }, []);

  if (loading || !session) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-sm text-gray-400">
        加载中...
      </div>
    );
  }

  const totalChars = session.scenes.reduce((sum, s) => sum + s.dialogue.length, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-base font-semibold text-gray-900 text-center flex-1">
          手工创建分镜 · {session.scenes.length} 个
        </h1>
        <span className="text-xs text-gray-400">{session.duration}秒 {totalChars}字</span>
      </div>
      <p className="text-xs text-gray-400 text-center -mt-4 mb-6">
        用于校正 AI 初稿，精修镜头表达、首尾帧提示词和参考图。
      </p>

      {session.scenes.map((scene) => {
        const range = durationRange[scene.duration] || '35-50';
        const isLocked = lockedScenes.has(scene.id);
        return (
          <div key={scene.id} className={`bg-white border rounded-[8px] p-4 shadow-sm transition-colors ${isLocked ? 'border-gray-300 bg-gray-50' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-2"
              >
                <span className="text-sm font-semibold text-gray-900">分镜{scene.id}（{scene.duration}秒）</span>
                <span className="text-xs text-gray-400">（{scene.duration}秒）· {scene.dialogue.length}字</span>
                {isLocked && (
                  <span className="text-[11px] bg-gray-200 text-gray-500 rounded-full px-2 py-0.5">已锁定</span>
                )}
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={`text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => handleGenerateAll(scene)}
                  disabled={isLocked}
                  className={`text-xs px-2.5 py-1 rounded-[4px] transition-colors ${
                    isLocked ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  生成全部
                </button>
                <button
                  type="button"
                  onClick={() => handleRegenerate(scene)}
                  disabled={isLocked}
                  className={`text-xs px-2.5 py-1 rounded-[4px] transition-colors ${
                    isLocked ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  重新生成
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleLock(scene.id)}
                  className={`text-xs px-2.5 py-1 rounded-[4px] transition-colors ${
                    isLocked ? 'bg-gray-200 text-gray-600' : 'text-gray-400 hover:bg-gray-50'
                  }`}
                >
                  {isLocked ? '解锁' : '锁定'}
                </button>
              </div>
            </div>

            {expanded && (
              <div className="mt-4 space-y-4">
                <div>
                  <h3 className="text-xs font-medium text-gray-400 mb-2">基础内容</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium text-gray-700">对白</span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={isLocked}
                            className="text-gray-400 hover:text-gray-600 disabled:text-gray-200"
                            onClick={() => { void navigator.clipboard.writeText(scene.dialogue); }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                            </svg>
                          </button>
                          <button type="button" disabled={isLocked} className="text-gray-400 hover:text-gray-600 disabled:text-gray-200">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                              <polygon points="5 3 19 12 5 21 5 3" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <textarea
                        value={scene.dialogue}
                        onChange={(e) => updateScene(scene.id, (item) => ({ ...item, dialogue: e.target.value }))}
                        placeholder="输入对白内容…"
                        disabled={isLocked}
                        className="w-full h-[70px] border border-gray-300 rounded-[6px] p-3 text-sm text-gray-900 placeholder:text-gray-400 resize-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                      />
                      <div className="text-xs text-gray-400 mt-1">{scene.dialogue.length} / 建议 {range}</div>
                    </div>

                    <div>
                      <span className="text-xs font-medium text-gray-700 mb-1.5 block">分镜时长</span>
                      <div className="flex gap-2">
                        {[5, 10, 12].map((dur) => (
                          <button
                            key={dur}
                            type="button"
                            disabled={isLocked}
                            onClick={() => updateScene(scene.id, (item) => ({ ...item, duration: dur }))}
                            className={`h-[34px] px-3 rounded-[6px] text-sm transition-colors ${
                              isLocked
                                ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                                : scene.duration === dur
                                  ? 'bg-gray-900 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {dur}秒分镜
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-medium text-gray-400 mb-2">AI 提示词</h3>
                  <div className="space-y-3">
                    {[
                      { key: 'shotPrompt', label: '镜头提示词', content: scene.shotPrompt },
                      { key: 'firstFramePrompt', label: '首帧提示词', content: scene.firstFrame?.sceneDescription },
                      { key: 'lastFramePrompt', label: '尾帧提示词', content: scene.lastFrame?.sceneDescription },
                    ].map((area) => (
                      <div key={area.key}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-medium text-gray-700">{area.label}</span>
                          <button
                            type="button"
                            onClick={() => handleGenerate(scene, area.key)}
                            disabled={isLocked}
                            className={`h-7 px-2.5 rounded-[4px] text-[11px] border transition-colors ${
                              isLocked
                                ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                                : 'border-gray-200 text-gray-400 hover:bg-gray-50'
                            }`}
                          >
                            生成
                          </button>
                        </div>
                        {area.content ? (
                          <textarea
                            value={area.content}
                            onChange={(e) => {
                              if (area.key === 'shotPrompt') {
                                updateScene(scene.id, (item) => ({ ...item, shotPrompt: e.target.value }));
                              } else if (area.key === 'firstFramePrompt') {
                                updateScene(scene.id, (item) => ({ ...item, firstFrame: { sceneDescription: e.target.value, characterPerformance: item.firstFrame?.characterPerformance || '', cameraAngle: item.firstFrame?.cameraAngle || '', lighting: item.firstFrame?.lighting || '', atmosphere: item.firstFrame?.atmosphere || '' } }));
                              } else {
                                updateScene(scene.id, (item) => ({ ...item, lastFrame: { sceneDescription: e.target.value, characterPerformance: item.lastFrame?.characterPerformance || '', cameraAngle: item.lastFrame?.cameraAngle || '', lighting: item.lastFrame?.lighting || '', atmosphere: item.lastFrame?.atmosphere || '' } }));
                              }
                            }}
                            disabled={isLocked}
                            className="w-full h-10 border border-gray-200 rounded-[4px] px-3 py-2 text-xs text-gray-700 bg-gray-50 resize-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                          />
                        ) : (
                          <div className="h-10 bg-gray-50 rounded-[4px] flex items-center justify-center text-xs text-gray-400">
                            {area.key === 'shotPrompt' ? '点击生成镜头提示词' : area.key === 'firstFramePrompt' ? '点击生成首帧提示词' : '点击生成尾帧提示词'}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-medium text-gray-400 mb-2">视觉参考</h3>
                  <div className="space-y-3">
                    {[
                      { key: 'firstFrameImage', label: '首帧参考图', url: scene.firstFrameImage },
                      { key: 'lastFrameImage', label: '尾帧参考图', url: scene.lastFrameImage },
                    ].map((area) => (
                      <div key={area.key}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-medium text-gray-700">{area.label}</span>
                          <button
                            type="button"
                            onClick={() => handleGenerate(scene, area.key)}
                            disabled={isLocked}
                            className={`h-7 px-2.5 rounded-[4px] text-[11px] border transition-colors ${
                              isLocked
                                ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                                : 'border-gray-200 text-gray-400 hover:bg-gray-50'
                            }`}
                          >
                            生成
                          </button>
                        </div>
                        {area.url ? (
                          <img src={area.url} alt="" className="w-full h-16 object-cover rounded-[4px] border border-gray-200" />
                        ) : (
                          <div className="h-12 bg-gray-50 rounded-[4px] flex items-center justify-center text-xs text-gray-400">
                            {area.key === 'firstFrameImage' ? '点击生成首帧参考图' : '点击生成尾帧参考图'}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}

      <div className="flex justify-center pt-2">
        <button
          type="button"
          onClick={addScene}
          className="h-10 px-5 rounded-[6px] bg-gray-900 text-white text-sm hover:bg-gray-800 transition-colors active:scale-[0.98]"
        >
          添加新分镜
        </button>
      </div>
    </div>
  );
}

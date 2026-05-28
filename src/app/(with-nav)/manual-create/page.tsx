'use client';

import { useEffect, useState, useCallback } from 'react';
import { getClientServices } from '@/application';
import { useToast } from '@/lib/error-handler';
import type { Scene, StoryboardSession } from '@/domain/storyboard';
import {
  DEMO_DURATION,
  DEMO_WORD_COUNT,
  DEMO_SCENES,
} from '@/shared/demo-storyboard';
import { getSketchUrl } from '@/shared/storyboard-sketches';

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

type SceneStatus = '待填写' | '已生成' | '已锁定' | '缺少参考图';

const sceneDescriptions = [
  '开场问题抛出', '产品亮相', '核心卖点演示',
  '效果对比', '用户反馈', '品牌收束',
];

function getSceneStatus(scene: Scene, locked: Set<number>): SceneStatus {
  if (locked.has(scene.id)) return '已锁定';
  const hasGeneration = !!(scene.shotPrompt || scene.firstFrame || scene.lastFrame);
  const missingImage = hasGeneration && (!scene.firstFrameImage || !scene.lastFrameImage);
  if (missingImage) return '缺少参考图';
  if (hasGeneration) return '已生成';
  return '待填写';
}

const statusStyle: Record<SceneStatus, string> = {
  '待填写': 'text-gray-300 border-gray-200 bg-white',
  '已生成': 'text-gray-600 bg-gray-100 border-gray-200',
  '已锁定': 'text-gray-500 bg-gray-200 border-gray-200',
  '缺少参考图': 'text-amber-600 bg-amber-50 border-amber-200',
};

const statusLabel: Record<SceneStatus, string> = {
  '待填写': '待填写',
  '已生成': '已生成',
  '已锁定': '已锁定',
  '缺少参考图': '缺参考图',
};

export default function ManualCreatePage() {
  const { sessionService } = getClientServices();
  const [session, setSession] = useState<StoryboardSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [lockedScenes, setLockedScenes] = useState<Set<number>>(new Set());
  const [activeSceneId, setActiveSceneId] = useState<number | null>(null);
  const [previewImage, setPreviewImage] = useState<{ url: string; name: string; downloadName?: string } | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    let active = true;
    const initialize = async () => {
      try {
        const restored = await sessionService.loadManualSession();
        if (!active) return;
        const nextSession = restored || {
          sessionType: 'manual',
          script: 'Manual Create',
          duration: 5,
          wordCount: 42,
          scenes: [],
          updatedAt: new Date().toISOString(),
        };
        setSession(nextSession);
        setExpanded(new Set(nextSession.scenes.map((s) => s.id)));
      } catch {
        showToast('手工分镜初始化失败', 'error');
      } finally {
        if (active) setLoading(false);
      }
    };
    void initialize();
    return () => { active = false; };
  }, [sessionService, showToast]);

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
      setExpanded((prev) => new Set([...prev, nextId]));
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
          mockContent = `mock:first-frame-${(scene.id - 1) % 3 + 1}`;
          break;
        case 'lastFramePrompt':
          mockContent = '结尾特写，产品在主角手中绽放光芒，品牌Logo淡入。';
          break;
        case 'lastFrameImage':
          mockContent = `mock:last-frame-${(scene.id - 1) % 3 + 1}`;
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
      showToast('生成失败', 'error');
    }
  }, [session, updateScene, showToast]);

  const handleGenerateAll = useCallback(async (scene: Scene) => {
    if (!session) return;
    updateScene(scene.id, (item) => ({
      ...item,
      shotPrompt: '镜头缓缓推进，特写产品细节，背景虚化突出主体。',
      firstFrame: { sceneDescription: '开篇全景，温暖的自然光线洒入室内，主角由远及近走来。', characterPerformance: '', cameraAngle: '', lighting: '', atmosphere: '' },
      lastFrame: { sceneDescription: '结尾特写，产品在主角手中绽放光芒，品牌Logo淡入。', characterPerformance: '', cameraAngle: '', lighting: '', atmosphere: '' },
      firstFrameImage: `mock:first-frame-${(scene.id - 1) % 3 + 1}`,
      lastFrameImage: `mock:last-frame-${(scene.id - 1) % 3 + 1}`,
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
    const wasLocked = lockedScenes.has(sceneId);
    setLockedScenes((prev) => {
      const next = new Set(prev);
      if (next.has(sceneId)) next.delete(sceneId);
      else next.add(sceneId);
      return next;
    });
    if (!wasLocked) showToast('已锁定', 'success');
  }, [showToast, lockedScenes]);

  const handleDeleteScene = useCallback((sceneId: number) => {
    if (!window.confirm(`确定删除分镜 ${sceneId} 吗？此操作不可恢复。`)) {
      return;
    }

    setSession((current) => {
      if (!current) return current;

      const filtered = current.scenes.filter((s) => s.id !== sceneId);
      if (filtered.length === current.scenes.length) return current;

      const renumbered = filtered.map((s, i) => ({
        ...s,
        id: i + 1,
        name: `分镜${i + 1}（${s.duration}秒）`,
      }));

      setExpanded((prev) => {
        const next = new Set<number>();
        filtered.forEach((s, i) => {
          if (prev.has(s.id)) next.add(i + 1);
        });
        return next;
      });

      setLockedScenes((prev) => {
        const next = new Set<number>();
        filtered.forEach((s, i) => {
          if (prev.has(s.id)) next.add(i + 1);
        });
        return next;
      });

      setActiveSceneId(null);

      return { ...current, scenes: renumbered };
    });
  }, []);

  const handleClearAll = useCallback(() => {
    if (!session) return;
    const hasLocked = session.scenes.some((s) => lockedScenes.has(s.id));
    if (hasLocked) {
      showToast('存在锁定分镜，请先解锁后再清空', 'error');
      return;
    }
    if (!window.confirm('确定清空所有分镜吗？此操作不可恢复。')) return;
    setSession((current) => (current ? { ...current, scenes: [] } : current));
    setExpanded(new Set());
    setLockedScenes(new Set());
    setActiveSceneId(null);
  }, [session, lockedScenes, showToast]);

  const handleLoadDemoSession = useCallback(() => {
    if (!session) return;
    const hasScenes = session.scenes.length > 0;
    if (hasScenes) {
      if (!window.confirm('当前已有分镜，加载演示分镜会覆盖当前分镜列表，是否继续？')) {
        return;
      }
    }
    const clonedScenes = JSON.parse(JSON.stringify(DEMO_SCENES));
    const demoSession: StoryboardSession = {
      sessionType: 'manual',
      script: 'Manual Create',
      duration: DEMO_DURATION,
      wordCount: DEMO_WORD_COUNT,
      scenes: clonedScenes,
      updatedAt: new Date().toISOString(),
    };
    setSession(demoSession);
    setExpanded(new Set(clonedScenes.map((s: Scene) => s.id)));
    setLockedScenes(new Set());
    setActiveSceneId(null);
    sessionService.saveManualSession({
      script: 'Manual Create',
      duration: DEMO_DURATION,
      wordCount: DEMO_WORD_COUNT,
      scenes: clonedScenes,
    });
    showToast('已加载演示分镜', 'success');
  }, [session, sessionService, showToast]);

  const handleCopyFullScene = useCallback(async (scene: Scene) => {
    const text = [
      `场景 ${scene.id}（${scene.duration}秒）`,
      `画面描述：${sceneDescriptions[(scene.id - 1) % 6]}`,
      `旁白：${scene.dialogue}`,
      scene.shotPrompt ? `镜头提示词：${scene.shotPrompt}` : '',
      scene.firstFrame?.sceneDescription ? `首帧提示词：${scene.firstFrame.sceneDescription}` : '',
      scene.lastFrame?.sceneDescription ? `尾帧提示词：${scene.lastFrame.sceneDescription}` : '',
    ].filter(Boolean).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      showToast('已复制当前分镜内容', 'success');
    } catch {
      showToast('复制失败', 'error');
    }
  }, [showToast]);

  if (loading || !session) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-sm text-gray-400">
        加载中...
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1280px] mx-auto space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-base font-semibold text-gray-900">
            手工创建分镜 · {session.scenes.length} 个
          </span>
        </div>
        <div className="flex items-center gap-2 pt-0.5">
          <button
            type="button"
            onClick={handleLoadDemoSession}
            className="h-8 px-3 rounded-[8px] text-[13px] font-medium border border-slate-200 text-gray-600 bg-white hover:bg-slate-50 hover:text-sky-600 transition-colors"
          >
            加载演示分镜
          </button>
          {session.scenes.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => setExpanded(new Set(session.scenes.map((s) => s.id)))}
                className="h-8 px-2.5 rounded-[8px] text-[13px] text-gray-600 hover:bg-slate-100 transition-colors"
              >
                全部展开
              </button>
              <button
                type="button"
                onClick={() => setExpanded(new Set())}
                className="h-8 px-2.5 rounded-[8px] text-[13px] text-gray-600 hover:bg-slate-100 transition-colors"
              >
                全部收起
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="h-8 px-2.5 rounded-[8px] text-[13px] text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
              >
                清空全部
              </button>
            </>
          )}
        </div>
      </div>

      {session.scenes.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-[10px] p-10 shadow-sm flex flex-col items-center text-center">
          <h3 className="text-base font-semibold text-gray-900 mb-2">暂无分镜</h3>
          <p className="text-sm text-gray-500 max-w-[300px] mb-6">
            可以从智能分镜同步生成结果，也可以手动添加一个分镜。
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={addScene}
              className="h-10 px-5 rounded-[6px] bg-gray-900 text-white text-sm hover:bg-gray-800 transition-colors active:scale-[0.98]"
            >
              添加第一个分镜
            </button>
            <button
              type="button"
              onClick={handleLoadDemoSession}
              className="h-10 px-5 rounded-[6px] border border-gray-300 text-gray-600 text-sm hover:bg-gray-50 transition-colors active:scale-[0.98]"
            >
              加载演示分镜
            </button>
          </div>
        </div>
      )}

      {session.scenes.length > 0 && (
      <div className="flex items-start gap-2">
        <div className="flex gap-2 overflow-x-auto pb-2 flex-1">
          {session.scenes.map((scene) => {
            const status = getSceneStatus(scene, lockedScenes);
            const isActive = activeSceneId === scene.id;
            return (
              <button
                key={scene.id}
                type="button"
                onClick={() => {
                  setActiveSceneId(scene.id);
                  document.getElementById(`scene-${scene.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className={`flex-shrink-0 flex items-center gap-2 h-8 px-3 rounded-full text-[13px] font-medium transition-colors ${
                  isActive ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span>#{scene.id}</span>
                <span className="opacity-60">{scene.duration}s</span>
                <span className={`text-[12px] px-2 py-0.5 rounded-full ${status === '待填写' ? 'text-gray-400 bg-white/50' : status === '已生成' ? 'text-gray-600 bg-white/60' : status === '已锁定' ? 'text-gray-500 bg-white/50' : 'text-amber-600 bg-amber-50/60'}`}>
                  {statusLabel[status]}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      )}

      {session.scenes.map((scene) => {
        const range = durationRange[scene.duration] || '35-50';
        const isLocked = lockedScenes.has(scene.id);
        return (
          <div key={scene.id} id={`scene-${scene.id}`} className={`bg-white border rounded-[10px] p-4 shadow-[0_4px_20px_rgba(15,23,42,0.04)] transition-all duration-200 hover:shadow-[0_8px_30px_rgba(15,23,42,0.08)] hover:border-slate-300 ${
            activeSceneId === scene.id ? 'border-sky-400 bg-sky-50/30' : isLocked ? 'border-gray-300 bg-gray-50' : 'border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setExpanded((prev) => { const next = new Set(prev); if (next.has(scene.id)) next.delete(scene.id); else next.add(scene.id); return next; })}
                className="flex items-center gap-2"
              >
                <span className="text-[15px] font-semibold text-gray-900">分镜{scene.id}（{scene.duration}秒）</span>
                <span className="text-[13px] text-gray-500">· {scene.dialogue.length}字</span>
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${statusStyle[getSceneStatus(scene, lockedScenes)]}`}>
                  {statusLabel[getSceneStatus(scene, lockedScenes)]}
                </span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={`text-gray-400 transition-transform ${expanded.has(scene.id) ? 'rotate-180' : ''}`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              <div className="flex gap-1.5 items-center">
                <button
                  type="button"
                  onClick={() => handleCopyFullScene(scene)}
                  disabled={isLocked}
                  className={`h-[30px] px-2.5 rounded-[8px] text-[13px] border transition-colors flex items-center gap-1 ${
                    isLocked ? 'border-slate-200 text-slate-300 cursor-not-allowed' : 'border-slate-200 text-gray-600 bg-white hover:bg-slate-50'
                  }`}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  复制完整分镜
                </button>
                {expanded.has(scene.id) && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleGenerateAll(scene)}
                      disabled={isLocked}
                      className={`h-[30px] px-3 rounded-[8px] text-[13px] font-medium transition-colors ${
                        isLocked ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-gray-900 text-white hover:bg-gray-800'
                      }`}
                    >
                      生成全部
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRegenerate(scene)}
                      disabled={isLocked}
                      className={`h-[30px] px-2.5 rounded-[8px] text-[13px] transition-colors ${
                        isLocked ? 'text-slate-300 cursor-not-allowed' : 'text-gray-600 hover:bg-slate-100'
                      }`}
                    >
                      重新生成
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => handleToggleLock(scene.id)}
                  className={`h-[30px] px-2.5 rounded-[8px] text-[13px] transition-colors ${
                    isLocked ? 'bg-slate-100 text-gray-600' : 'text-gray-600 hover:bg-slate-100'
                  }`}
                >
                  {isLocked ? '解锁' : '锁定'}
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteScene(scene.id)}
                  disabled={isLocked}
                  className={`h-[30px] px-2.5 rounded-[8px] text-[13px] transition-colors ${
                    isLocked ? 'text-slate-300 cursor-not-allowed' : 'text-gray-500 hover:text-red-600 hover:bg-red-50'
                  }`}
                >
                  删除
                </button>
              </div>
            </div>

            {expanded.has(scene.id) && (
              <div className="mt-4 space-y-4">
                <div>
                  <h3 className="text-[13px] font-medium text-gray-500 mb-3">基础内容</h3>
                  <div className="space-y-3.5">
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
                        className="w-full h-[70px] border border-slate-200 rounded-[8px] p-3 text-sm text-gray-800 placeholder:text-gray-400 resize-none focus:border-sky-400/40 focus:ring-[3px] focus:ring-sky-100/50 focus:ring-offset-0 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed transition-shadow duration-200"
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
                            className={`h-[30px] px-3 rounded-[8px] text-[13px] font-medium transition-colors ${
                              isLocked
                                ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                                : scene.duration === dur
                                  ? 'bg-gray-900 text-white'
                                  : 'bg-slate-100 text-gray-600 hover:bg-slate-200'
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
                  <h3 className="text-[13px] font-medium text-gray-500 mb-3">AI 提示词</h3>
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
                            className={`h-[26px] px-2 rounded-[6px] text-[12px] border transition-colors ${
                              isLocked
                                ? 'border-slate-200 text-slate-300 cursor-not-allowed'
                                : 'border-slate-200 text-slate-500 bg-white hover:text-slate-700 hover:border-slate-300 hover:bg-slate-50'
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
                            className="w-full h-10 border border-slate-200 rounded-[6px] px-3 py-2 text-xs text-gray-700 bg-gray-50 resize-none focus:border-sky-400/40 focus:ring-[3px] focus:ring-sky-100/50 focus:ring-offset-0 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed transition-shadow duration-200"
                          />
                        ) : (
                          <div className="h-10 bg-gray-50 border border-dashed border-gray-300 rounded-[4px] flex items-center justify-center text-xs text-gray-500">
                            {area.key === 'shotPrompt' ? '点击生成镜头提示词' : area.key === 'firstFramePrompt' ? '点击生成首帧提示词' : '点击生成尾帧提示词'}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-[13px] font-medium text-gray-500 mb-3">视觉参考</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {([
                      { key: 'firstFrameImage' as const, label: '首帧参考图', frameType: 'first' as const },
                      { key: 'lastFrameImage' as const, label: '尾帧参考图', frameType: 'last' as const },
                    ]).map((area) => {
                      const imgValue = area.key === 'firstFrameImage' ? scene.firstFrameImage : scene.lastFrameImage;
                      const sketchUrl = getSketchUrl(imgValue);
                      const downloadName = `storyboard-scene-${scene.id}-${area.frameType}-frame.svg`;
                      const previewTitle = `${area.label} · 分镜 ${scene.id}`;
                      return (
                        <div key={area.key} className="border border-gray-200 rounded-[8px] p-3 flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-700">{area.label}</span>
                            <button
                              type="button"
                              onClick={() => handleGenerate(scene, area.key)}
                              disabled={isLocked}
                              className={`h-[26px] px-2 rounded-[6px] text-[12px] border transition-colors ${
                                isLocked
                                  ? 'border-slate-200 text-slate-300 cursor-not-allowed'
                                  : 'border-slate-200 text-slate-500 bg-white hover:text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              生成
                            </button>
                          </div>
                          {sketchUrl ? (
                            <>
                              <button
                                type="button"
                                onClick={() => setPreviewImage({ url: sketchUrl, name: previewTitle, downloadName })}
                                className="block w-full"
                              >
                                <img
                                  src={sketchUrl}
                                  alt={area.label}
                                  className="w-full aspect-square object-contain rounded-[6px] border border-gray-200 hover:border-gray-400 transition-colors"
                                />
                              </button>
                              <div className="flex gap-2">
                                <a
                                  href={sketchUrl}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setPreviewImage({ url: sketchUrl, name: previewTitle, downloadName });
                                  }}
                                  className="flex-1 text-center text-[11px] text-gray-500 hover:text-gray-700 py-1.5 rounded-[6px] border border-gray-200 hover:bg-gray-50 transition-colors"
                                >
                                  预览
                                </a>
                                <a
                                  href={sketchUrl}
                                  download={downloadName}
                                  className="flex-1 text-center text-[11px] text-gray-500 hover:text-gray-700 py-1.5 rounded-[6px] border border-gray-200 hover:bg-gray-50 transition-colors"
                                >
                                  下载
                                </a>
                              </div>
                            </>
                          ) : (
                            <div className="aspect-square bg-gray-50 border border-dashed border-gray-300 rounded-[6px] flex items-center justify-center text-[11px] text-gray-400">
                              {area.key === 'firstFrameImage' ? '点击生成首帧参考图' : '点击生成尾帧参考图'}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {session.scenes.length > 0 && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={addScene}
            className="h-10 px-5 rounded-[6px] bg-gray-900 text-white text-sm hover:bg-gray-800 transition-colors active:scale-[0.98]"
          >
            添加新分镜
          </button>
        </div>
      )}

      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-8"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-[90vw] max-h-[90vh] bg-white rounded-[10px] p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-800">{previewImage.name}</span>
              <div className="flex gap-2">
                <a
                  href={previewImage.url}
                  download={previewImage.downloadName || 'storyboard-frame.svg'}
                  className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-[6px] border border-gray-200 transition-colors"
                >
                  下载
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewImage(null)}
                  className="text-xs text-gray-400 hover:text-gray-600 px-3 py-1.5 rounded-[6px] border border-gray-200 transition-colors"
                >
                  关闭
                </button>
              </div>
            </div>
            <img
              src={previewImage.url}
              alt=""
              className="max-w-[80vw] max-h-[75vh] object-contain rounded-[6px]"
            />
          </div>
        </div>
      )}
    </div>
  );
}

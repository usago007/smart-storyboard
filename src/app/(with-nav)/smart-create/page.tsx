'use client';

import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { getClientServices } from '@/application';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/lib/error-handler';
import type { Scene } from '@/domain/storyboard';
import {
  DEMO_SCRIPT,
  DEMO_DURATION,
  DEMO_WORD_COUNT,
  DEMO_SCENES,
  DEMO_SCENE_DESCRIPTIONS,
} from '@/shared/demo-storyboard';

interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: Event) => void;
  onend: () => void;
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

type InputMethod = 'text' | 'file' | 'voice' | 'url' | 'template';

interface DurationConfig {
  seconds: number;
  label: string;
  subLabel: string;
  range: string;
  minWords: number;
  maxWords: number;
  recommendedWords: number;
}

const durationConfigs: DurationConfig[] = [
  { seconds: 5, label: '5s', subLabel: '5秒分镜', range: '35-50', minWords: 35, maxWords: 50, recommendedWords: 42 },
  { seconds: 10, label: '10s', subLabel: '10秒分镜', range: '70-100', minWords: 70, maxWords: 100, recommendedWords: 89 },
  { seconds: 12, label: '12s', subLabel: '12秒分镜', range: '84-120', minWords: 84, maxWords: 120, recommendedWords: 107 },
];

const templates = [
  { id: 'beauty', name: '护肤品广告', content: '每天坚持使用，肌肤焕发自然光彩。温和配方，深层滋养，让美丽从内而外绽放。选择我们，选择自信与美丽。' },
  { id: 'food', name: '美食广告', content: '新鲜食材，用心烹饪，每一口都是家的味道。传统工艺，现代口感，让味蕾记住这一刻的美好。' },
  { id: 'tech', name: '科技产品', content: '创新科技，改变生活。智能设计，便捷操作，让每一天都充满可能。未来已来，你准备好了吗？' },
  { id: 'edu', name: '教育培训', content: '专业师资，科学方法，让学习成为乐趣。个性化教学，因材施教，每个孩子都是独特的未来之星。' },
];

const sceneTemplates = [
  '开场问题抛出',
  '产品亮相',
  '核心卖点演示',
  '效果对比',
  '用户反馈',
  '品牌收束',
];

function enrichScenes(scenes: Scene[]): Scene[] {
  return scenes.map((scene) => ({
    ...scene,
    shotPrompt: `分镜${scene.id}：${sceneTemplates[(scene.id - 1) % 6]}，围绕"${scene.dialogue.slice(0, 20)}..."展开，保持信息聚焦、镜头稳定、产品表达明确，画面风格统一。`,
    firstFrame: {
      sceneDescription: `极简室内场景，主体位于画面中央。重点表现：${scene.dialogue.slice(0, 28)}。`,
      characterPerformance: '角色动作克制自然，表情从困扰转为放松，突出情绪变化。',
      cameraAngle: '中近景，平视机位，轻微推进镜头强化叙事节奏。',
      lighting: '柔和主光配合侧逆光，保留产品轮廓和面部层次。',
      atmosphere: '干净、专业、可信赖。',
    },
    lastFrame: {
      sceneDescription: `产品与用户同框，形成问题到解决方案的清晰对照。重点表现：${scene.dialogue.slice(0, 28)}。`,
      characterPerformance: '角色目光聚焦产品，动作简洁明确，强调使用效果。',
      cameraAngle: '三分法构图，稳定机位，保留足够信息量用于后续转场。',
      lighting: '明亮自然光，局部补光提升质感。',
      atmosphere: '高效、轻松、具有转化感。',
    },
  }));
}

const sceneTemplatesV2 = [
  '痛点引入',
  '解决方案呈现',
  '功能深度讲解',
  '使用场景展示',
  '用户证言',
  '品牌号召',
];

function enrichScenesV2(scenes: Scene[]): Scene[] {
  return scenes.map((scene) => ({
    ...scene,
    shotPrompt: `镜号${scene.id}：${sceneTemplatesV2[(scene.id - 1) % 6]}，以"${scene.dialogue.slice(0, 20)}..."为核心信息，镜头语言直接、节奏明快、视觉冲击力强。`,
    firstFrame: {
      sceneDescription: `干净背景，主体处于黄金分割位。表达核心：${scene.dialogue.slice(0, 28)}。`,
      characterPerformance: '动作简洁有力，视线引导观众关注关键信息。',
      cameraAngle: '近景平拍，平稳运镜，突出画面主体。',
      lighting: '柔和漫射光，画面层次分明过渡自然。',
      atmosphere: '清晰、直接、有说服力。',
    },
    lastFrame: {
      sceneDescription: `品牌元素与产品联动呈现。重点表达：${scene.dialogue.slice(0, 28)}。`,
      characterPerformance: '人物微表情变化传达产品体验感受。',
      cameraAngle: '固定机位，稳定构图，预留转场空间。',
      lighting: '主光突出，辅光补充细节轮廓。',
      atmosphere: '专注、可信、有记忆点。',
    },
  }));
}

export default function SmartCreatePage() {
  const { settings } = useApp();
  const { storyboardService, sessionService } = getClientServices();
  const [inputMethod, setInputMethod] = useState<InputMethod>('text');
  const [script, setScript] = useState('');
  const [selectedDuration, setSelectedDuration] = useState(5);
  const [wordCount, setWordCount] = useState(42);
  const [urlInput, setUrlInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [recording, setRecording] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [generatedScenes, setGeneratedScenes] = useState<Scene[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [syncedIds, setSyncedIds] = useState<Set<number>>(new Set());
  const [isRegenerated, setIsRegenerated] = useState(false);
  const [isDemoResult, setIsDemoResult] = useState(false);
  const { showToast } = useToast();

  const recognitionRef = useRef<SpeechRecognition | null>(null) as React.MutableRefObject<SpeechRecognition | null>;

  const currentConfig = useMemo(
    () => durationConfigs.find((c) => c.seconds === selectedDuration) || durationConfigs[0],
    [selectedDuration],
  );

  const isInputValid = script.trim().length > 0 && script.length <= 3000;

  useEffect(() => {
    if (!errorMessage) return;
    const t = setTimeout(() => setErrorMessage(''), 4000);
    return () => clearTimeout(t);
  }, [errorMessage]);

  const handleGenerate = useCallback(async () => {
    if (!isInputValid) return;
    if (script.trim().length < 20) {
      setErrorMessage('广告文案过短，建议补充产品特点、使用场景或转化诉求。');
      return;
    }
    setLoading(true);
    setShowResults(false);
    try {
      const draft = await storyboardService.splitScenes({
        script,
        duration: selectedDuration,
        wordCount,
      });
      const enriched = enrichScenes(draft.scenes);
      setGeneratedScenes(enriched);
      setShowResults(true);
      await sessionService.saveAutoSession({ ...draft, wordCount });
    } catch {
      setErrorMessage('分镜生成失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [isInputValid, script, selectedDuration, wordCount, storyboardService, sessionService]);

  const handleImportUrl = useCallback(async () => {
    if (!urlInput.trim()) {
      setErrorMessage('请输入需要提取的网页链接。');
      return;
    }
    setImporting(true);
    try {
      const content = await storyboardService.importFromUrl({ url: urlInput });
      setScript(content.slice(0, 3000));
      setInputMethod('text');
    } catch {
      setErrorMessage('链接导入失败');
    } finally {
      setImporting(false);
    }
  }, [urlInput, storyboardService]);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.txt')) {
      setErrorMessage('当前仅支持 .txt 文件。');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('文件过大，请选择小于10MB的文件');
      return;
    }
    try {
      const text = await file.text();
      setScript(text.slice(0, 3000));
      setInputMethod('text');
    } catch {
      setErrorMessage('文件读取失败');
    }
  }, []);

  const handleStartRecording = useCallback(() => {
    const w = window as unknown as Record<string, unknown>;
    const SpeechRecognitionAPI = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setErrorMessage('您的浏览器不支持语音输入，请使用Chrome或Edge浏览器');
      return;
    }
    if (recording) {
      recognitionRef.current?.stop();
      setRecording(false);
      return;
    }
    const recognition = new (SpeechRecognitionAPI as new () => SpeechRecognition)();
    recognition.lang = 'zh-CN';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setScript((prev) => (prev + transcript).slice(0, 3000));
    };

    recognition.onerror = () => {
      setRecording(false);
      setErrorMessage('语音识别出错，请重试');
    };

    recognition.onend = () => {
      setRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setRecording(true);
  }, [recording]);

  const updateResultScene = useCallback((sceneId: number, field: string, value: string) => {
    setGeneratedScenes((prev) => prev.map((s) => {
      if (s.id !== sceneId) return s;
      if (field === 'shotPrompt') return { ...s, shotPrompt: value };
      if (field === 'dialogue') return { ...s, dialogue: value };
      if (field === 'firstFrameSceneDescription') return { ...s, firstFrame: { ...s.firstFrame!, sceneDescription: value } };
      if (field === 'lastFrameSceneDescription') return { ...s, lastFrame: { ...s.lastFrame!, sceneDescription: value } };
      return s;
    }));
  }, []);

  const handleCopyScene = useCallback(async (scene: Scene) => {
    const text = [
      `场景 ${scene.id} · ${scene.duration}秒`,
      `画面描述：${isDemoResult ? DEMO_SCENE_DESCRIPTIONS[scene.id] || '' : sceneTemplates[(scene.id - 1) % 6]}`,
      `旁白：${scene.dialogue}`,
      `镜头提示词：${scene.shotPrompt || ''}`,
      `首帧提示词：${scene.firstFrame?.sceneDescription || ''}`,
      `尾帧提示词：${scene.lastFrame?.sceneDescription || ''}`,
    ].join('\n');
    try {
      await navigator.clipboard.writeText(text);
      showToast('已复制', 'success');
    } catch {
      showToast('复制失败', 'error');
    }
  }, [showToast, isDemoResult]);

  const handleSyncToManual = useCallback(async (scene: Scene) => {
    try {
      let manualSession = await sessionService.loadManualSession();
      if (!manualSession) {
        manualSession = {
          sessionType: 'manual',
          script: 'Manual Create',
          duration: selectedDuration,
          wordCount,
          scenes: [],
          updatedAt: new Date().toISOString(),
        };
      }
      const nextId = manualSession.scenes.length
        ? Math.max(...manualSession.scenes.map((s) => s.id)) + 1
        : 1;
      manualSession.scenes.push({
        ...scene,
        id: nextId,
        name: `分镜${nextId}（${scene.duration}秒）`,
      });
      manualSession.updatedAt = new Date().toISOString();
      await sessionService.saveManualSession(manualSession);
      setSyncedIds((prev) => new Set([...prev, scene.id]));
      showToast('已同步到手工分镜', 'success');
    } catch {
      showToast('同步失败', 'error');
    }
  }, [sessionService, selectedDuration, wordCount, showToast]);

  const handleSyncAllToManual = useCallback(async () => {
    try {
      let manualSession = await sessionService.loadManualSession();
      if (!manualSession) {
        manualSession = {
          sessionType: 'manual',
          script: 'Manual Create',
          duration: selectedDuration,
          wordCount,
          scenes: [],
          updatedAt: new Date().toISOString(),
        };
      }
      const nextId = manualSession.scenes.length
        ? Math.max(...manualSession.scenes.map((s) => s.id)) + 1
        : 1;
      const newScenes = generatedScenes.map((scene, i) => ({
        ...scene,
        id: nextId + i,
        name: `分镜${nextId + i}（${scene.duration}秒）`,
      }));
      manualSession.scenes.push(...newScenes);
      manualSession.updatedAt = new Date().toISOString();
      await sessionService.saveManualSession(manualSession);
      setSyncedIds(new Set(generatedScenes.map((s) => s.id)));
      showToast('已同步全部到手工分镜', 'success');
    } catch {
      showToast('同步失败', 'error');
    }
  }, [sessionService, selectedDuration, wordCount, generatedScenes, showToast]);

  const handleRegenerateAll = useCallback(() => {
    setGeneratedScenes((prev) => enrichScenesV2(
      prev.map(({ id, name, dialogue, duration }) => ({ id, name, dialogue, duration })),
    ));
    setIsRegenerated(true);
    showToast('已重新生成结果', 'success');
  }, [showToast]);

  const handleClearResults = useCallback(() => {
    setShowResults(false);
    setGeneratedScenes([]);
    setSyncedIds(new Set());
    setIsRegenerated(false);
    setIsDemoResult(false);
  }, []);

  const handleLoadDemo = useCallback(() => {
    const hasExistingContent = script.trim().length > 0 || generatedScenes.length > 0;
    if (hasExistingContent) {
      if (!window.confirm('当前已有内容，加载演示素材会覆盖当前输入和生成结果，是否继续？')) {
        return;
      }
    }
    setInputMethod('text');
    setScript(DEMO_SCRIPT);
    setSelectedDuration(DEMO_DURATION);
    setWordCount(DEMO_WORD_COUNT);
    setErrorMessage('');
    setSyncedIds(new Set());
    setGeneratedScenes(JSON.parse(JSON.stringify(DEMO_SCENES)));
    setShowResults(true);
    setIsRegenerated(false);
    setIsDemoResult(true);
    showToast('已加载演示素材', 'success');
  }, [script, generatedScenes, showToast]);

  if (!settings) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-sm text-gray-400">
        加载配置中...
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1180px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-base font-semibold text-gray-900">将广告文案转换为可编辑的镜头脚本</p>
          <p className="text-[13px] text-gray-500 mt-1">
            输入素材 · 选择节奏 · 生成分镜 · 同步精修
          </p>
        </div>
        <button
          type="button"
          onClick={handleLoadDemo}
          className="text-[13px] text-gray-500 hover:text-sky-600 transition-colors whitespace-nowrap"
        >
          加载演示素材
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/50 shadow-[0_8px_30px_rgba(15,23,42,0.04)] p-6">
        <div className="flex flex-wrap gap-1.5 mb-4">
          {([
            { id: 'text' as const, label: '手动输入' },
            { id: 'file' as const, label: '文件上传' },
            { id: 'voice' as const, label: '语音输入' },
            { id: 'url' as const, label: '链接导入' },
            { id: 'template' as const, label: '预设模板' },
          ]).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setInputMethod(tab.id)}
              className={`rounded-full h-8 px-3 text-[13px] transition-colors ${
                inputMethod === tab.id
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {inputMethod === 'text' && (
          <div>
            <textarea
              value={script}
              onChange={(e) => setScript(e.target.value.slice(0, 3000))}
              placeholder="输入广告文案、产品卖点或脚本草稿..."
              className="w-full h-[200px] border border-slate-200 rounded-xl p-4 text-sm text-gray-800 placeholder:text-gray-400 resize-none focus:border-sky-400/40 focus:ring-[3px] focus:ring-sky-100/50 focus:ring-offset-0 leading-relaxed transition-shadow duration-200"
            />
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="text-[13px] text-gray-500">节奏</span>
                  {durationConfigs.map((config) => (
                    <button
                      key={config.seconds}
                      type="button"
                      onClick={() => {
                        setSelectedDuration(config.seconds);
                        setWordCount(config.recommendedWords);
                      }}
                      className={`h-7 px-2.5 rounded-md text-[13px] font-medium border transition-colors ${
                        selectedDuration === config.seconds
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {config.label}
                    </button>
                  ))}
                </div>
                <span className="text-gray-200">|</span>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] text-gray-500">字数</span>
                  <input
                    type="range"
                    min={currentConfig.minWords}
                    max={currentConfig.maxWords}
                    value={wordCount}
                    onChange={(e) => setWordCount(Number(e.target.value))}
                    className="w-24 accent-gray-900"
                  />
                  <span className="text-[13px] text-gray-700 font-medium w-6">{wordCount}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading || !isInputValid}
                className={`h-9 px-6 rounded-lg text-sm font-semibold transition-colors ${
                  loading || !isInputValid
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-900 text-white hover:bg-gray-800 active:scale-[0.98]'
                }`}
              >
                {loading ? '生成中...' : '生成分镜'}
              </button>
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="text-xs text-gray-400">{script.length}/3000</div>
              <div className="flex gap-3 text-xs text-gray-400">
                {script.length === 3000 && <span className="text-red-500">内容超出长度限制</span>}
                {script.length < 20 && script.length > 0 && <span className="text-amber-500">文案偏短</span>}
              </div>
            </div>
          </div>
        )}

        {inputMethod === 'file' && (
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-12 text-center">
            <label className="cursor-pointer flex flex-col items-center gap-2">
              <span className="text-sm text-gray-500">选择文件</span>
              <span className="text-xs text-gray-400">支持 .txt 格式，最大 10MB</span>
              <input type="file" accept=".txt,text/plain" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        )}

        {inputMethod === 'voice' && (
          <div className="flex flex-col items-center gap-4 py-12">
            <button
              type="button"
              onClick={handleStartRecording}
              className={`w-48 h-10 rounded-lg text-sm font-medium transition-colors ${
                recording ? 'bg-red-600 text-white' : 'bg-gray-900 text-white hover:bg-gray-800'
              }`}
            >
              {recording ? '停止录音' : '开始录音'}
            </button>
            <p className="text-xs text-gray-400">建议使用 Chrome 或 Edge 浏览器</p>
          </div>
        )}

        {inputMethod === 'url' && (
          <div className="flex gap-3">
            <input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="粘贴网页链接..."
              className="flex-1 h-10 border border-gray-200 rounded-lg px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:ring-0"
            />
            <button
              type="button"
              onClick={handleImportUrl}
              disabled={importing}
              className="h-10 px-4 rounded-lg bg-gray-200 text-gray-700 text-sm disabled:opacity-50 hover:bg-gray-300 transition-colors"
            >
              {importing ? '导入中...' : '提取'}
            </button>
          </div>
        )}

        {inputMethod === 'template' && (
          <div className="grid grid-cols-2 gap-3">
            {templates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => { setScript(template.content); setInputMethod('text'); }}
                className="border border-gray-200 rounded-lg p-4 text-left hover:border-gray-400 transition-colors active:scale-[0.98]"
              >
                <div className="font-semibold text-sm text-gray-900">{template.name}</div>
                <div className="mt-1 text-xs text-gray-500 leading-relaxed line-clamp-3">{template.content}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 text-xs text-red-700">
          {errorMessage}
        </div>
      )}

      <p className="text-[13px] text-gray-500 text-center">
        提示：输入完整广告文案，生成更稳定；生成后可同步到手工分镜精修。
      </p>

      {loading && !showResults && (
        <div className="bg-white border border-gray-200 rounded-[8px] p-6 shadow-sm animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="h-16 bg-gray-100 rounded-[6px]" />
          <div className="h-16 bg-gray-100 rounded-[6px]" />
          <div className="h-16 bg-gray-100 rounded-[6px]" />
        </div>
      )}

      {showResults && generatedScenes.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-[10px] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">
              {isDemoResult ? '演示分镜结果' : isRegenerated ? '重新生成结果' : '生成结果'}
            </h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSyncAllToManual}
                className="h-8 px-3 rounded-[6px] text-xs font-medium bg-gray-900 text-white hover:bg-gray-800 transition-colors active:scale-[0.98]"
              >
                同步全部到手工分镜
              </button>
              <button
                type="button"
                onClick={handleRegenerateAll}
                className="h-8 px-3 rounded-[6px] text-xs font-medium border border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-colors active:scale-[0.98]"
              >
                重新生成
              </button>
              <button
                type="button"
                onClick={handleClearResults}
                className="h-8 px-3 rounded-[6px] text-xs font-medium border border-gray-300 text-gray-500 hover:border-gray-400 hover:bg-gray-50 transition-colors active:scale-[0.98]"
              >
                清空结果
              </button>
            </div>
          </div>
          <div className="space-y-4">
            {generatedScenes.map((scene) => (
              <div key={scene.id} className="border border-gray-200 rounded-[6px] p-4 hover:border-gray-300 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-gray-900">
                    场景 {scene.id} · {scene.duration}秒
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopyScene(scene)}
                      className="text-xs text-gray-400 hover:text-gray-600 transition-colors px-2 py-1 rounded-[4px] hover:bg-gray-50"
                    >
                      复制
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSyncToManual(scene)}
                      disabled={syncedIds.has(scene.id)}
                      className={`text-xs px-2 py-1 rounded-[4px] transition-colors ${
                        syncedIds.has(scene.id)
                          ? 'text-gray-300 cursor-default'
                          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {syncedIds.has(scene.id) ? '已同步' : '同步到手工分镜'}
                    </button>
                  </div>
                </div>

                <dl className="space-y-2 text-xs">
                  <div>
                    <dt className="text-gray-400">画面描述</dt>
                    <dd className="text-gray-700 mt-0.5">{isDemoResult ? DEMO_SCENE_DESCRIPTIONS[scene.id] || sceneTemplates[(scene.id - 1) % 6] : sceneTemplates[(scene.id - 1) % 6]}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-400">旁白</dt>
                    <dd>
                      <textarea
                        value={scene.dialogue}
                        onChange={(e) => updateResultScene(scene.id, 'dialogue', e.target.value)}
                        className="w-full mt-0.5 bg-transparent border-0 p-0 text-sm text-gray-700 resize-none focus:outline-none"
                        rows={2}
                      />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-400">镜头提示词</dt>
                    <dd>
                      <textarea
                        value={scene.shotPrompt || ''}
                        onChange={(e) => updateResultScene(scene.id, 'shotPrompt', e.target.value)}
                        className="w-full mt-0.5 bg-transparent border-0 p-0 text-sm text-gray-700 resize-none focus:outline-none"
                        rows={2}
                      />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-400">首帧提示词</dt>
                    <dd>
                      <textarea
                        value={scene.firstFrame?.sceneDescription || ''}
                        onChange={(e) => updateResultScene(scene.id, 'firstFrameSceneDescription', e.target.value)}
                        className="w-full mt-0.5 bg-transparent border-0 p-0 text-sm text-gray-700 resize-none focus:outline-none"
                        rows={2}
                      />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-400">尾帧提示词</dt>
                    <dd>
                      <textarea
                        value={scene.lastFrame?.sceneDescription || ''}
                        onChange={(e) => updateResultScene(scene.id, 'lastFrameSceneDescription', e.target.value)}
                        className="w-full mt-0.5 bg-transparent border-0 p-0 text-sm text-gray-700 resize-none focus:outline-none"
                        rows={2}
                      />
                    </dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-[8px] p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">使用提示</h3>
        <ul className="space-y-1 text-xs text-gray-500">
          <li>建议输入完整广告文案，包括产品卖点、使用场景和转化目标</li>
          <li>不同时长适合不同节奏：5秒适合快节奏切片，10-12秒适合完整卖点表达</li>
          <li>生成结果可同步到手工分镜继续调整镜头、提示词和参考图</li>
        </ul>
      </div>
    </div>
  );
}

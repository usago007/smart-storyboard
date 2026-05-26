'use client';

import { useMemo, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getClientServices } from '@/application';
import { useApp } from '@/contexts/AppContext';

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

export default function SmartCreatePage() {
  const router = useRouter();
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

  const recognitionRef = useRef<SpeechRecognition | null>(null) as React.MutableRefObject<SpeechRecognition | null>;

  const currentConfig = useMemo(
    () => durationConfigs.find((c) => c.seconds === selectedDuration) || durationConfigs[0],
    [selectedDuration],
  );

  const isInputValid = script.trim().length > 0 && script.length <= 3000;

  const handleGenerate = useCallback(async () => {
    if (!isInputValid) return;
    setLoading(true);
    try {
      const draft = await storyboardService.splitScenes({
        script,
        duration: selectedDuration,
        wordCount,
      });
      await sessionService.saveAutoSession({ ...draft, wordCount });
      router.push('/result');
    } catch {
      alert('分镜生成失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [isInputValid, script, selectedDuration, wordCount, storyboardService, sessionService, router]);

  const handleImportUrl = useCallback(async () => {
    if (!urlInput.trim()) {
      alert('请输入有效的 URL');
      return;
    }
    setImporting(true);
    try {
      const content = await storyboardService.importFromUrl({ url: urlInput });
      setScript(content.slice(0, 3000));
      setInputMethod('text');
    } catch {
      alert('链接导入失败');
    } finally {
      setImporting(false);
    }
  }, [urlInput, storyboardService]);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert('文件过大，请选择小于10MB的文件');
      return;
    }
    try {
      const text = await file.text();
      setScript(text.slice(0, 3000));
      setInputMethod('text');
    } catch {
      alert('文件读取失败');
    }
  }, []);

  const handleStartRecording = useCallback(() => {
    const w = window as unknown as Record<string, unknown>;
    const SpeechRecognitionAPI = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      alert('您的浏览器不支持语音输入，请使用Chrome或Edge浏览器');
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
      alert('语音识别出错，请重试');
    };

    recognition.onend = () => {
      setRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setRecording(true);
  }, [recording]);

  if (!settings) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-sm text-gray-400">
        加载配置中...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-bold text-gray-900">FatMug 智能分镜</h1>
        <p className="mt-1 text-sm text-gray-500">输入广告对白，智能生成分镜脚本</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-[8px] p-6 shadow-sm">
        <div className="space-y-6">
          <section>
            <h2 className="text-sm font-semibold text-gray-900 mb-3">选择分镜时长</h2>
            <div className="grid grid-cols-3 gap-3">
              {durationConfigs.map((config) => (
                <button
                  key={config.seconds}
                  type="button"
                  onClick={() => {
                    setSelectedDuration(config.seconds);
                    setWordCount(config.recommendedWords);
                  }}
                  className={`h-[78px] rounded-[6px] border text-center flex flex-col items-center justify-center transition-colors ${
                    selectedDuration === config.seconds
                      ? 'border-gray-900 bg-white'
                      : 'border-gray-300 bg-white hover:border-gray-400'
                  }`}
                >
                  <span className="text-2xl font-bold text-gray-900">{config.label}</span>
                  <span className="text-xs text-gray-400 mt-0.5">{config.subLabel}</span>
                </button>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-semibold text-gray-900">镜头文案密度</h2>
              <span className="text-xs text-gray-400">字数范围：{currentConfig.range}</span>
            </div>
            <p className="text-xs text-gray-500 mb-3">系统会根据分镜时长自动建议每个镜头的旁白字数范围。</p>
            <input
              type="range"
              min={currentConfig.minWords}
              max={currentConfig.maxWords}
              value={wordCount}
              onChange={(e) => setWordCount(Number(e.target.value))}
              className="w-full accent-gray-900"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>{currentConfig.minWords}</span>
              <span className="text-gray-700 font-medium">{wordCount}</span>
              <span>{currentConfig.maxWords}</span>
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-gray-900 mb-3">选择输入方式</h2>
            <div className="flex flex-wrap gap-2">
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
                  className={`rounded-[9999px] h-[38px] px-4 text-sm transition-colors ${
                    inputMethod === tab.id
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="mt-4">
              {inputMethod === 'text' && (
                <div>
                  <textarea
                    value={script}
                    onChange={(e) => setScript(e.target.value.slice(0, 3000))}
                    placeholder="请输入广告对白"
                    className="w-full h-[110px] border border-gray-300 rounded-[6px] p-3 text-sm text-gray-900 placeholder:text-gray-400 resize-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                  />
                  <div className="text-xs text-gray-400 mt-1 text-right">{script.length}/3000</div>
                </div>
              )}

              {inputMethod === 'file' && (
                <div className="border-2 border-dashed border-gray-300 rounded-[6px] p-6 text-center">
                  <label className="cursor-pointer flex flex-col items-center gap-2">
                    <span className="text-sm text-gray-500">选择文件</span>
                    <span className="text-xs text-gray-400">未选择任何文件</span>
                    <input type="file" accept=".txt,text/plain" onChange={handleFileUpload} className="hidden" />
                  </label>
                  <p className="text-xs text-gray-400 mt-2">支持 .txt 格式，最大 10MB</p>
                </div>
              )}

              {inputMethod === 'voice' && (
                <div className="flex flex-col items-center gap-4 py-4">
                  <button
                    type="button"
                    onClick={handleStartRecording}
                    className={`w-[280px] h-11 rounded-[6px] text-sm font-medium transition-colors ${
                      recording
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                  >
                    {recording ? '停止录音' : '开始录音'}
                  </button>
                  <p className="text-xs text-gray-400">建议使用Chrome或Edge浏览器以获得最佳体验</p>
                </div>
              )}

              {inputMethod === 'url' && (
                <div className="space-y-3">
                  <input
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="请输入网页链接…"
                    className="w-full h-11 border border-gray-300 rounded-[6px] px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                  />
                  <button
                    type="button"
                    onClick={handleImportUrl}
                    disabled={importing}
                    className="h-10 w-[86px] rounded-[6px] bg-gray-300 text-white text-sm disabled:opacity-50 hover:bg-gray-400 transition-colors"
                  >
                    {importing ? '导入中...' : '提取内容'}
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
                      className="border border-gray-200 rounded-[6px] p-4 text-left hover:border-gray-400 transition-colors"
                    >
                      <div className="font-semibold text-sm text-gray-900">{template.name}</div>
                      <div className="mt-1 text-xs text-gray-600 leading-relaxed line-clamp-3">
                        {template.content}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading || !isInputValid}
            className={`w-full h-11 rounded-[6px] text-sm font-medium transition-colors ${
              loading || !isInputValid
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gray-900 text-white hover:bg-gray-800'
            }`}
          >
            {loading ? '生成中...' : '生成分镜'}
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-[8px] p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">使用提示</h3>
        <ul className="space-y-1 text-xs text-gray-500">
          <li>建议输入完整的广告文案，包含产品特点和使用场景</li>
          <li>根据广告时长选择合适的分镜时长</li>
          <li>生成的分镜可以后续调整和优化</li>
        </ul>
      </div>
    </div>
  );
}

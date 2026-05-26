'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getClientServices } from '@/application';
import { useApp } from '@/contexts/AppContext';
import { showErrorAlert } from '@/lib/error-handler';

type InputMethod = 'text' | 'file' | 'url' | 'template';

interface DurationConfig {
  seconds: number;
  minWords: number;
  maxWords: number;
  recommendedWords: number;
}

const durationConfigs: DurationConfig[] = [
  { seconds: 5, minWords: 35, maxWords: 50, recommendedWords: 42 },
  { seconds: 10, minWords: 70, maxWords: 100, recommendedWords: 89 },
  { seconds: 12, minWords: 84, maxWords: 120, recommendedWords: 107 },
];

const templates = {
  zh: [
    { id: 'beauty', name: '护肤品广告', content: '每天坚持使用，肌肤焕发自然光彩。温和配方，深层滋养，让美丽从内而外绽放。选择我们，选择自信与美丽。' },
    { id: 'food', name: '美食广告', content: '新鲜食材，用心烹饪，每一口都是家的味道。传统工艺，现代口感，让味蕾记住这一刻的美好。' },
    { id: 'tech', name: '科技产品', content: '创新科技，改变生活。智能设计，便捷操作，让每一天都充满可能。未来已来，你准备好了吗？' },
  ],
  en: [
    { id: 'beauty', name: 'Beauty Product', content: 'A gentle formula brings visible glow, balanced hydration, and a more confident daily routine.' },
    { id: 'food', name: 'Food Campaign', content: 'Fresh ingredients, careful cooking, and memorable taste create a warm story worth sharing.' },
    { id: 'tech', name: 'Tech Product', content: 'Smart design makes everyday work simpler, faster, and more reliable from the first interaction.' },
  ],
};

export default function SmartCreatePage() {
  const router = useRouter();
  const { language, t } = useApp();
  const { storyboardService, sessionService } = getClientServices();
  const [inputMethod, setInputMethod] = useState<InputMethod>('text');
  const [script, setScript] = useState('');
  const [selectedDuration, setSelectedDuration] = useState(5);
  const [wordCount, setWordCount] = useState(42);
  const [urlInput, setUrlInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [polishing, setPolishing] = useState(false);

  const currentConfig = useMemo(
    () => durationConfigs.find((config) => config.seconds === selectedDuration) || durationConfigs[0],
    [selectedDuration],
  );

  const currentTemplates = templates[language];
  const isInputValid = script.trim().length > 0 && script.length <= 3000;

  const handleGenerate = async () => {
    if (!isInputValid) {
      alert(script.trim() ? t.longScriptError : t.emptyScriptError);
      return;
    }

    setLoading(true);
    try {
      const draft = await storyboardService.splitScenes({
        script,
        duration: selectedDuration,
        wordCount,
      });

      await sessionService.saveAutoSession({
        ...draft,
        wordCount,
      });

      router.push('/result');
    } catch (error) {
      showErrorAlert(error, language === 'zh' ? '分镜生成失败' : 'Storyboard generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleImportUrl = async () => {
    if (!urlInput.trim()) {
      alert(language === 'zh' ? '请输入有效的 URL' : 'Please enter a valid URL');
      return;
    }

    setImporting(true);
    try {
      const content = await storyboardService.importFromUrl({ url: urlInput });
      setScript(content.slice(0, 3000));
      setInputMethod('text');
    } catch (error) {
      showErrorAlert(error, language === 'zh' ? '链接导入失败' : 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const handlePolish = async () => {
    if (!script.trim()) {
      alert(language === 'zh' ? '请先输入文案' : 'Please enter script first');
      return;
    }

    setPolishing(true);
    try {
      const polished = await storyboardService.polishScript({
        script,
        targetLength: currentConfig.recommendedWords * 3,
      });
      setScript(polished.slice(0, 3000));
    } catch (error) {
      showErrorAlert(error, language === 'zh' ? '文案润色失败' : 'Script polishing failed');
    } finally {
      setPolishing(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const text = await file.text();
    setScript(text.slice(0, 3000));
    setInputMethod('text');
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-black">
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">
          {language === 'zh' ? 'FatMug 智能分镜' : 'FatMug Smart Storyboard'}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600 dark:text-gray-400">
          {language === 'zh'
            ? 'V1 已切换到纯前端 mock 数据模式。你可以直接演示输入、拆分、生成提示词、生成图片和结果保存，不依赖 Coze 或数据库。'
            : 'V1 now runs entirely on frontend mock data. You can demo input, splitting, prompt generation, image generation, and state persistence without backend services.'}
        </p>
      </section>

      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-black">
        <div className="flex flex-wrap gap-2">
          {([
            ['text', language === 'zh' ? '手动输入' : 'Text'],
            ['file', language === 'zh' ? '文件导入' : 'File'],
            ['url', language === 'zh' ? '链接导入' : 'URL'],
            ['template', language === 'zh' ? '预设模板' : 'Templates'],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setInputMethod(id)}
              className={`rounded-full px-4 py-2 text-sm transition ${
                inputMethod === id
                  ? 'bg-black text-white dark:bg-white dark:text-black'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-4">
          {inputMethod === 'text' && (
            <textarea
              value={script}
              onChange={(event) => setScript(event.target.value.slice(0, 3000))}
              rows={8}
              placeholder={t.scriptPlaceholder}
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
          )}

          {inputMethod === 'file' && (
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 px-6 py-12 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
              <span>{language === 'zh' ? '上传 txt 文件' : 'Upload a txt file'}</span>
              <span className="mt-2 text-xs">{language === 'zh' ? '内容将直接填入文案框' : 'Content will be copied into the script field'}</span>
              <input type="file" accept=".txt,text/plain" onChange={handleFileUpload} className="hidden" />
            </label>
          )}

          {inputMethod === 'url' && (
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={urlInput}
                onChange={(event) => setUrlInput(event.target.value)}
                placeholder="https://example.com/story"
                className="flex-1 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
              <button
                type="button"
                onClick={handleImportUrl}
                disabled={importing}
                className="rounded-2xl bg-black px-5 py-3 text-sm text-white disabled:opacity-60 dark:bg-white dark:text-black"
              >
                {importing ? (language === 'zh' ? '导入中...' : 'Importing...') : (language === 'zh' ? '导入链接' : 'Import')}
              </button>
            </div>
          )}

          {inputMethod === 'template' && (
            <div className="grid gap-3 md:grid-cols-3">
              {currentTemplates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => {
                    setScript(template.content);
                    setInputMethod('text');
                  }}
                  className="rounded-2xl border border-gray-200 p-4 text-left transition hover:border-gray-400 dark:border-gray-700 dark:hover:border-gray-500"
                >
                  <div className="font-medium text-gray-900 dark:text-white">{template.name}</div>
                  <div className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-400">{template.content}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-black">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t.selectDuration}</h2>
            <button
              type="button"
              onClick={handlePolish}
              disabled={polishing}
              className="rounded-full border border-gray-300 px-4 py-2 text-sm text-gray-700 disabled:opacity-60 dark:border-gray-700 dark:text-gray-200"
            >
              {polishing ? (language === 'zh' ? '润色中...' : 'Polishing...') : t.aiPolishing}
            </button>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            {durationConfigs.map((config) => (
              <button
                key={config.seconds}
                type="button"
                onClick={() => {
                  setSelectedDuration(config.seconds);
                  setWordCount(config.recommendedWords);
                }}
                className={`rounded-2xl border p-4 text-left transition ${
                  selectedDuration === config.seconds
                    ? 'border-black bg-gray-50 dark:border-white dark:bg-gray-900'
                    : 'border-gray-200 hover:border-gray-400 dark:border-gray-800 dark:hover:border-gray-700'
                }`}
              >
                <div className="text-xl font-semibold text-gray-900 dark:text-white">{config.seconds}s</div>
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {language === 'zh' ? `${config.minWords}-${config.maxWords} 字/镜` : `${config.minWords}-${config.maxWords} chars/scene`}
                </div>
              </button>
            ))}
          </div>

          <div className="mt-6">
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">{t.wordCountPerScene}</label>
            <input
              type="range"
              min={currentConfig.minWords}
              max={currentConfig.maxWords}
              value={wordCount}
              onChange={(event) => setWordCount(Number(event.target.value))}
              className="w-full"
            />
            <div className="mt-2 flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>{language === 'zh' ? `最少 ${currentConfig.minWords}` : `Min ${currentConfig.minWords}`}</span>
              <span>{language === 'zh' ? `当前 ${wordCount}` : `Current ${wordCount}`}</span>
              <span>{language === 'zh' ? `最多 ${currentConfig.maxWords}` : `Max ${currentConfig.maxWords}`}</span>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-black">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{language === 'zh' ? '演示摘要' : 'Demo Summary'}</h2>
          <dl className="mt-4 space-y-4 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-gray-500 dark:text-gray-400">{language === 'zh' ? '数据模式' : 'Data Mode'}</dt>
              <dd className="rounded-full bg-gray-100 px-3 py-1 text-gray-800 dark:bg-gray-900 dark:text-gray-200">mock</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-gray-500 dark:text-gray-400">{language === 'zh' ? '当前字数' : 'Characters'}</dt>
              <dd className="font-medium text-gray-900 dark:text-white">{script.length}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-gray-500 dark:text-gray-400">{language === 'zh' ? '时长' : 'Duration'}</dt>
              <dd className="font-medium text-gray-900 dark:text-white">{selectedDuration}s</dd>
            </div>
          </dl>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading || !isInputValid}
            className="mt-8 w-full rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black"
          >
            {loading ? t.generating : t.generateBtn}
          </button>
        </div>
      </section>
    </div>
  );
}

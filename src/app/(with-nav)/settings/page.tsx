'use client';

import { getClientServices } from '@/application';
import type { AppSettings } from '@/domain/storyboard';
import { useApp } from '@/contexts/AppContext';

export default function SettingsPage() {
  const { language, theme, setLanguage, setTheme, settings, updateSettings } = useApp();
  const { sessionService } = getClientServices();

  if (!settings) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-gray-500 dark:text-gray-400">
        {language === 'zh' ? '加载配置中...' : 'Loading settings...'}
      </div>
    );
  }

  const applyPatch = async (patch: Partial<AppSettings>) => {
    await updateSettings(patch);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-black">
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">
          {language === 'zh' ? '演示配置中心' : 'Demo Control Center'}
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600 dark:text-gray-400">
          {language === 'zh'
            ? '这里替代原来的 Coze / API / 数据库配置页。V1 统一展示 mock 数据运行参数，并允许切换主题、语言、延迟与失败率。'
            : 'This replaces the old Coze/API/database status page. V1 exposes the frontend mock runtime controls for language, theme, delay, and failure rate.'}
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-black">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {language === 'zh' ? '运行时配置' : 'Runtime Settings'}
          </h2>

          <div className="mt-6 space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {language === 'zh' ? '数据模式' : 'Data Mode'}
              </label>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">
                {settings.dataMode}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {language === 'zh' ? '模拟延迟（毫秒）' : 'Mock Delay (ms)'}
              </label>
              <input
                type="range"
                min={100}
                max={2000}
                step={100}
                value={settings.mockDelayMs}
                onChange={(event) => void applyPatch({ mockDelayMs: Number(event.target.value) })}
                className="w-full"
              />
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">{settings.mockDelayMs} ms</div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {language === 'zh' ? '模拟失败率' : 'Mock Failure Rate'}
              </label>
              <input
                type="range"
                min={0}
                max={40}
                step={5}
                value={settings.mockFailureRate}
                onChange={(event) => void applyPatch({ mockFailureRate: Number(event.target.value) })}
                className="w-full"
              />
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">{settings.mockFailureRate}%</div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-black">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {language === 'zh' ? '界面与会话' : 'UI and Sessions'}
          </h2>

          <div className="mt-6 space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {language === 'zh' ? '语言' : 'Language'}
              </label>
              <div className="flex gap-2">
                {(['zh', 'en'] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setLanguage(item)}
                    className={`rounded-full px-4 py-2 text-sm ${
                      language === item
                        ? 'bg-black text-white dark:bg-white dark:text-black'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-200'
                    }`}
                  >
                    {item === 'zh' ? '中文' : 'English'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {language === 'zh' ? '主题' : 'Theme'}
              </label>
              <div className="flex gap-2">
                {(['light', 'dark'] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setTheme(item)}
                    className={`rounded-full px-4 py-2 text-sm ${
                      theme === item
                        ? 'bg-black text-white dark:bg-white dark:text-black'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-200'
                    }`}
                  >
                    {item === 'light'
                      ? (language === 'zh' ? '浅色' : 'Light')
                      : (language === 'zh' ? '深色' : 'Dark')}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-700">
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {language === 'zh' ? '清理本地演示会话' : 'Clear Local Demo Sessions'}
              </div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {language === 'zh'
                  ? '删除 auto / manual 的浏览器会话存档，不影响 mock 配置。'
                  : 'Deletes browser-stored auto and manual sessions without touching runtime settings.'}
              </p>
              <button
                type="button"
                onClick={() => void sessionService.clearSession()}
                className="mt-4 rounded-2xl border border-red-200 px-4 py-2 text-sm text-red-600 dark:border-red-900/40"
              >
                {language === 'zh' ? '清空本地会话' : 'Clear Sessions'}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

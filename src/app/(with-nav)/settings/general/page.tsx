'use client';

import { useApp } from '@/contexts/AppContext';
import { getClientServices } from '@/application';
import { useCallback, useState } from 'react';

export default function GeneralSettingsPage() {
  const { settings, language } = useApp();
  const { settingsService } = getClientServices();
  const [saveMsg, setSaveMsg] = useState('');

  const brand = settings?.brand;
  const security = settings?.security;

  const update = useCallback(
    async (patch: Parameters<typeof settingsService.updateSettings>[0]) => {
      try {
        await settingsService.updateSettings(patch);
        setSaveMsg('已保存');
        setTimeout(() => setSaveMsg(''), 1500);
      } catch {
        setSaveMsg('保存失败');
      }
    },
    [settingsService],
  );

  const flash = (msg: string) => {
    setSaveMsg(msg);
    setTimeout(() => setSaveMsg(''), 1500);
  };

  if (!settings || !brand || !security) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-sm text-gray-400">
        加载配置中...
      </div>
    );
  }

  const isMock = settings.dataMode === 'mock';

  return (
    <div className="space-y-6">
      {/* Brand */}
      <div className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-[0_4px_20px_rgba(15,23,42,0.04)]">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">品牌与界面</h2>
        <div className="grid grid-cols-3 gap-4">
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-gray-500">应用名称</span>
            <input
              value={brand.appName}
              onChange={(e) => update({ brand: { ...brand, appName: e.target.value } })}
              className="w-full h-9 border border-slate-200 rounded-lg px-3 text-sm text-gray-800 focus:border-sky-400/40 focus:ring-[3px] focus:ring-sky-100/50"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-gray-500">默认语言</span>
            <select
              value={brand.defaultLanguage}
              onChange={(e) => update({ brand: { ...brand, defaultLanguage: e.target.value as typeof brand.defaultLanguage } })}
              className="w-full h-9 border border-slate-200 rounded-lg px-3 text-sm text-gray-800 focus:border-sky-400/40 focus:ring-[3px] focus:ring-sky-100/50"
            >
              <option value="zh">中文</option>
              <option value="en">English</option>
            </select>
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-gray-500">默认主题</span>
            <select
              value={brand.defaultTheme}
              onChange={(e) => update({ brand: { ...brand, defaultTheme: e.target.value as typeof brand.defaultTheme } })}
              className="w-full h-9 border border-slate-200 rounded-lg px-3 text-sm text-gray-800 focus:border-sky-400/40 focus:ring-[3px] focus:ring-sky-100/50"
            >
              <option value="light">浅色</option>
              <option value="dark">深色</option>
            </select>
          </label>
        </div>
      </div>

      {/* Security */}
      <div className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-[0_4px_20px_rgba(15,23,42,0.04)]">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">安全与限流</h2>
        <div className="grid grid-cols-4 gap-4 mb-4">
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-gray-500">API 限流（RPM）</span>
            <input
              type="number"
              min={10}
              max={10000}
              value={security.rateLimitRpm}
              onChange={(e) => update({ security: { ...security, rateLimitRpm: Number(e.target.value) } })}
              className="w-full h-9 border border-slate-200 rounded-lg px-3 text-sm focus:border-sky-400/40 focus:ring-[3px] focus:ring-sky-100/50"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-gray-500">最大并发图片生成</span>
            <input
              type="number"
              min={1}
              max={50}
              value={security.maxConcurrentImageGen}
              onChange={(e) => update({ security: { ...security, maxConcurrentImageGen: Number(e.target.value) } })}
              className="w-full h-9 border border-slate-200 rounded-lg px-3 text-sm focus:border-sky-400/40 focus:ring-[3px] focus:ring-sky-100/50"
            />
          </label>
          <label className="space-y-1.5 col-span-2">
            <span className="text-xs font-medium text-gray-500">CORS 允许域名（逗号分隔）</span>
            <input
              value={security.corsOrigins}
              onChange={(e) => update({ security: { ...security, corsOrigins: e.target.value } })}
              placeholder="https://example.com, https://app.example.com"
              className="w-full h-9 border border-slate-200 rounded-lg px-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-sky-400/40 focus:ring-[3px] focus:ring-sky-100/50"
            />
          </label>
        </div>

        <label className="space-y-1.5">
          <span className="text-xs font-medium text-gray-500">Session Secret</span>
          <div className="flex gap-2">
            <input
              type="password"
              value={security.sessionSecret}
              onChange={(e) => update({ security: { ...security, sessionSecret: e.target.value } })}
              placeholder="未设置"
              className="flex-1 h-9 border border-slate-200 rounded-lg px-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-sky-400/40 focus:ring-[3px] focus:ring-sky-100/50"
            />
            <button
              type="button"
              onClick={() => {
                const random = Array.from({ length: 32 }, () => Math.random().toString(36)[2]).join('');
                update({ security: { ...security, sessionSecret: random } });
                flash('已生成新密钥');
              }}
              className="h-9 px-4 rounded-lg text-sm font-medium border border-slate-200 text-gray-600 hover:bg-slate-50 transition-colors"
            >
              重新生成
            </button>
          </div>
        </label>
      </div>

      {/* Dev Debug — only in mock mode */}
      {isMock && (
        <div className="bg-white border border-amber-200/60 rounded-xl p-6 shadow-[0_4px_20px_rgba(15,23,42,0.04)]">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <h2 className="text-sm font-semibold text-gray-900">开发调试</h2>
            <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">仅 Mock 模式</span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <label className="space-y-1.5">
              <span className="text-xs font-medium text-gray-500">Mock 模拟延迟（ms）</span>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={3000}
                  step={50}
                  value={settings.mockDelayMs}
                  onChange={(e) => update({ mockDelayMs: Number(e.target.value) })}
                  className="flex-1 accent-gray-900"
                />
                <span className="text-xs text-gray-700 font-medium w-10">{settings.mockDelayMs}</span>
              </div>
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-medium text-gray-500">Mock 失败率（%）</span>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={settings.mockFailureRate}
                  onChange={(e) => update({ mockFailureRate: Number(e.target.value) })}
                  className="flex-1 accent-gray-900"
                />
                <span className="text-xs text-gray-700 font-medium w-10">{settings.mockFailureRate}%</span>
              </div>
            </label>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.dataMode === 'remote'}
              onChange={(e) => update({ dataMode: e.target.checked ? 'remote' : 'mock' })}
              className="accent-gray-900"
            />
            <span className="text-xs text-gray-600">切换到 Remote 模式（需后端支持）</span>
          </label>
        </div>
      )}

      {saveMsg && (
        <p className="text-[11px] text-emerald-600 text-center">{saveMsg}</p>
      )}
    </div>
  );
}

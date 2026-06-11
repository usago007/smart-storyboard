'use client';

import { useApp } from '@/contexts/AppContext';
import { getClientServices } from '@/application';
import { useCallback, useState } from 'react';

export default function DataSettingsPage() {
  const { settings, language } = useApp();
  const { settingsService } = getClientServices();
  const [saveMsg, setSaveMsg] = useState('');

  const dataPolicy = settings?.dataPolicy;

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

  if (!settings || !dataPolicy) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-sm text-gray-400">
        加载配置中...
      </div>
    );
  }

  const isRemote = settings.dataMode === 'remote';

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-[0_4px_20px_rgba(15,23,42,0.04)]">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">数据库</h2>
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: '类型', value: 'PostgreSQL + Drizzle ORM' },
            { label: '状态', value: isRemote ? '已连接' : 'Demo 模式 (localStorage)' },
            { label: 'Host', value: isRemote ? '127.0.0.1' : '-' },
            { label: 'Port', value: isRemote ? '5432' : '-' },
          ].map((item) => (
            <div key={item.label} className="border border-slate-200/60 rounded-lg px-4 py-3">
              <span className="text-[11px] text-gray-400 block">{item.label}</span>
              <span className="text-xs font-medium text-gray-900 mt-0.5">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-[0_4px_20px_rgba(15,23,42,0.04)]">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">数据保留策略</h2>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-gray-500">会话过期时间（小时）</span>
            <input
              type="number"
              min={1}
              max={720}
              value={dataPolicy.sessionTtlHours}
              onChange={(e) => update({ dataPolicy: { ...dataPolicy, sessionTtlHours: Number(e.target.value) } })}
              className="w-full h-9 border border-slate-200 rounded-lg px-3 text-sm focus:border-sky-400/40 focus:ring-[3px] focus:ring-sky-100/50"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-gray-500">图片缓存 TTL（小时）</span>
            <input
              type="number"
              min={1}
              max={720}
              value={dataPolicy.imageCacheTtlHours}
              onChange={(e) => update({ dataPolicy: { ...dataPolicy, imageCacheTtlHours: Number(e.target.value) } })}
              className="w-full h-9 border border-slate-200 rounded-lg px-3 text-sm focus:border-sky-400/40 focus:ring-[3px] focus:ring-sky-100/50"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-gray-500">自动清理间隔（分钟）</span>
            <input
              type="number"
              min={5}
              max={1440}
              value={dataPolicy.cleanupIntervalMinutes}
              onChange={(e) => update({ dataPolicy: { ...dataPolicy, cleanupIntervalMinutes: Number(e.target.value) } })}
              className="w-full h-9 border border-slate-200 rounded-lg px-3 text-sm focus:border-sky-400/40 focus:ring-[3px] focus:ring-sky-100/50"
            />
          </label>
        </div>

        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl mb-4">
          <div className="text-center px-4">
            <div className="text-lg font-semibold text-gray-900">-</div>
            <div className="text-[11px] text-gray-400">当前会话数</div>
          </div>
          <div className="text-center px-4">
            <div className="text-lg font-semibold text-gray-900">-</div>
            <div className="text-[11px] text-gray-400">当前图片数</div>
          </div>
          <div className="text-center px-4">
            <div className="text-lg font-semibold text-gray-900">-</div>
            <div className="text-[11px] text-gray-400">预估存储</div>
          </div>
          <button
            type="button"
            onClick={() => flash('清理完成（Demo 模式）')}
            className="ml-auto h-9 px-4 rounded-lg text-sm font-medium border border-slate-200 text-gray-600 hover:bg-slate-50 transition-colors"
          >
            手动清理
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-[0_4px_20px_rgba(15,23,42,0.04)]">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">导出配置</h2>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-gray-500">默认格式</span>
            <select
              value={dataPolicy.exportFormat}
              onChange={(e) => update({ dataPolicy: { ...dataPolicy, exportFormat: e.target.value as typeof dataPolicy.exportFormat } })}
              className="w-full h-9 border border-slate-200 rounded-lg px-3 text-sm text-gray-800 focus:border-sky-400/40 focus:ring-[3px] focus:ring-sky-100/50"
            >
              <option value="json">JSON</option>
              <option value="pdf">PDF 分镜表</option>
              <option value="ppt">PPT</option>
            </select>
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-gray-500">图片分辨率</span>
            <select
              value={dataPolicy.exportImageResolution}
              onChange={(e) => update({ dataPolicy: { ...dataPolicy, exportImageResolution: e.target.value as typeof dataPolicy.exportImageResolution } })}
              className="w-full h-9 border border-slate-200 rounded-lg px-3 text-sm text-gray-800 focus:border-sky-400/40 focus:ring-[3px] focus:ring-sky-100/50"
            >
              <option value="1x">1x</option>
              <option value="2x">2x</option>
              <option value="original">原始</option>
            </select>
          </label>
        </div>

        <h3 className="text-xs font-medium text-gray-500 mb-3">导出字段</h3>
        <div className="flex flex-wrap gap-3">
          {[
            { key: 'sceneId', label: '场景 ID' },
            { key: 'dialogue', label: '对白' },
            { key: 'shotPrompt', label: '镜头提示词' },
            { key: 'firstFrame', label: '首帧' },
            { key: 'lastFrame', label: '尾帧' },
            { key: 'firstFrameImage', label: '首帧参考图' },
            { key: 'lastFrameImage', label: '尾帧参考图' },
          ].map(({ key, label: itemLabel }) => (
            <label key={key} className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={dataPolicy.exportFields.includes(key)}
                onChange={(e) => {
                  const next = e.target.checked
                    ? [...dataPolicy.exportFields, key]
                    : dataPolicy.exportFields.filter((f) => f !== key);
                  update({ dataPolicy: { ...dataPolicy, exportFields: next } });
                }}
                className="accent-gray-900"
              />
              <span className="text-xs text-gray-600">{itemLabel}</span>
            </label>
          ))}
        </div>
      </div>

      {saveMsg && (
        <p className="text-[11px] text-emerald-600 text-center">{saveMsg}</p>
      )}
    </div>
  );
}

'use client';

import { useApp } from '@/contexts/AppContext';
import { getClientServices } from '@/application';
import { useCallback, useState } from 'react';

const TASK_LABELS: Record<string, string> = {
  polishScript: '文案润色',
  shotPrompt: '镜头提示词',
  frames: '首尾帧',
  batch: '批量生成',
};

export default function AISettingsPage() {
  const { settings } = useApp();
  const { settingsService } = getClientServices();
  const [saving, setSaving] = useState(false);

  const update = useCallback(
    async (patch: Parameters<typeof settingsService.updateSettings>[0]) => {
      setSaving(true);
      try {
        await settingsService.updateSettings(patch);
      } finally {
        setSaving(false);
      }
    },
    [settingsService],
  );

  if (!settings) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-sm text-gray-400">
        加载配置中...
      </div>
    );
  }

  const { llm, imageGen } = settings;

  return (
    <div className="space-y-6">
      {/* LLM Section */}
      <div className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-[0_4px_20px_rgba(15,23,42,0.04)]">
        <h2 className="text-sm font-semibold text-gray-900 mb-5">LLM 文本生成</h2>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-gray-500">Base URL</span>
            <input
              value={llm.baseUrl}
              onChange={(e) => update({ llm: { ...llm, baseUrl: e.target.value } })}
              placeholder="https://api.openai.com/v1"
              className="w-full h-9 border border-slate-200 rounded-lg px-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-sky-400/40 focus:ring-[3px] focus:ring-sky-100/50"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-gray-500">API Key</span>
            <input
              type="password"
              value={llm.apiKey}
              onChange={(e) => update({ llm: { ...llm, apiKey: e.target.value } })}
              placeholder="sk-..."
              className="w-full h-9 border border-slate-200 rounded-lg px-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-sky-400/40 focus:ring-[3px] focus:ring-sky-100/50"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-gray-500">供应商</span>
            <input
              value={llm.provider}
              onChange={(e) => update({ llm: { ...llm, provider: e.target.value } })}
              placeholder="openai / coze / custom"
              className="w-full h-9 border border-slate-200 rounded-lg px-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-sky-400/40 focus:ring-[3px] focus:ring-sky-100/50"
            />
          </label>
        </div>

        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">按任务模型参数</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-3 py-2.5 font-medium text-gray-600">任务</th>
                <th className="text-left px-3 py-2.5 font-medium text-gray-600">模型名</th>
                <th className="text-left px-3 py-2.5 font-medium text-gray-600">Temp</th>
                <th className="text-left px-3 py-2.5 font-medium text-gray-600">MaxTokens</th>
                <th className="text-left px-3 py-2.5 font-medium text-gray-600">TopP</th>
                <th className="text-left px-3 py-2.5 font-medium text-gray-600">流式</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(llm.tasks).map(([key, task]) => (
                <tr key={key} className="border-b border-gray-100">
                  <td className="px-3 py-2.5 text-gray-900 font-medium">{TASK_LABELS[key] || key}</td>
                  <td className="px-3 py-2.5">
                    <input
                      value={task.model}
                      onChange={(e) =>
                        update({ llm: { ...llm, tasks: { ...llm.tasks, [key]: { ...task, model: e.target.value } } } })
                      }
                      placeholder="doubao-seed-1-6"
                      className="w-36 h-7 border border-slate-200 rounded px-2 text-xs focus:border-sky-400/40 focus:ring-[3px] focus:ring-sky-100/50"
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={task.temperature}
                      onChange={(e) =>
                        update({ llm: { ...llm, tasks: { ...llm.tasks, [key]: { ...task, temperature: Number(e.target.value) } } } })
                      }
                      className="w-20 accent-gray-900"
                    />
                    <span className="ml-1.5 text-gray-500 w-5 inline-block">{task.temperature}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <input
                      type="number"
                      value={task.maxTokens}
                      onChange={(e) =>
                        update({ llm: { ...llm, tasks: { ...llm.tasks, [key]: { ...task, maxTokens: Number(e.target.value) } } } })
                      }
                      className="w-20 h-7 border border-slate-200 rounded px-2 text-xs focus:border-sky-400/40 focus:ring-[3px] focus:ring-sky-100/50"
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    <input
                      type="number"
                      min="0"
                      max="1"
                      step="0.01"
                      value={task.topP}
                      onChange={(e) =>
                        update({ llm: { ...llm, tasks: { ...llm.tasks, [key]: { ...task, topP: Number(e.target.value) } } } })
                      }
                      className="w-16 h-7 border border-slate-200 rounded px-2 text-xs focus:border-sky-400/40 focus:ring-[3px] focus:ring-sky-100/50"
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    <button
                      type="button"
                      onClick={() =>
                        update({ llm: { ...llm, tasks: { ...llm.tasks, [key]: { ...task, stream: !task.stream } } } })
                      }
                      className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                        task.stream
                          ? 'bg-gray-900 text-white'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {task.stream ? 'ON' : 'OFF'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Image Generation Section */}
      <div className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-[0_4px_20px_rgba(15,23,42,0.04)]">
        <h2 className="text-sm font-semibold text-gray-900 mb-5">图片生成</h2>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-gray-500">Endpoint</span>
            <input
              value={imageGen.baseUrl}
              onChange={(e) => update({ imageGen: { ...imageGen, baseUrl: e.target.value } })}
              className="w-full h-9 border border-slate-200 rounded-lg px-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-sky-400/40 focus:ring-[3px] focus:ring-sky-100/50"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-gray-500">API Key</span>
            <input
              type="password"
              value={imageGen.apiKey}
              onChange={(e) => update({ imageGen: { ...imageGen, apiKey: e.target.value } })}
              className="w-full h-9 border border-slate-200 rounded-lg px-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-sky-400/40 focus:ring-[3px] focus:ring-sky-100/50"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-gray-500">模型名</span>
            <input
              value={imageGen.model}
              onChange={(e) => update({ imageGen: { ...imageGen, model: e.target.value } })}
              placeholder="doubao-seedream-4-5"
              className="w-full h-9 border border-slate-200 rounded-lg px-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-sky-400/40 focus:ring-[3px] focus:ring-sky-100/50"
            />
          </label>
        </div>

        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">生成参数</h3>
        <div className="grid grid-cols-4 gap-4 mb-6">
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-gray-500">生成尺寸（宽×高）</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={imageGen.genWidth}
                onChange={(e) => update({ imageGen: { ...imageGen, genWidth: Number(e.target.value) } })}
                className="w-20 h-9 border border-slate-200 rounded-lg px-3 text-sm focus:border-sky-400/40 focus:ring-[3px] focus:ring-sky-100/50"
              />
              <span className="text-gray-300">×</span>
              <input
                type="number"
                value={imageGen.genHeight}
                onChange={(e) => update({ imageGen: { ...imageGen, genHeight: Number(e.target.value) } })}
                className="w-20 h-9 border border-slate-200 rounded-lg px-3 text-sm focus:border-sky-400/40 focus:ring-[3px] focus:ring-sky-100/50"
              />
            </div>
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-gray-500">输出尺寸（宽×高）</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={imageGen.outputWidth}
                onChange={(e) => update({ imageGen: { ...imageGen, outputWidth: Number(e.target.value) } })}
                className="w-20 h-9 border border-slate-200 rounded-lg px-3 text-sm focus:border-sky-400/40 focus:ring-[3px] focus:ring-sky-100/50"
              />
              <span className="text-gray-300">×</span>
              <input
                type="number"
                value={imageGen.outputHeight}
                onChange={(e) => update({ imageGen: { ...imageGen, outputHeight: Number(e.target.value) } })}
                className="w-20 h-9 border border-slate-200 rounded-lg px-3 text-sm focus:border-sky-400/40 focus:ring-[3px] focus:ring-sky-100/50"
              />
            </div>
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-gray-500">色彩模式</span>
            <div className="flex gap-1">
              {(['grayscale', 'color'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => update({ imageGen: { ...imageGen, colorMode: mode } })}
                  className={`h-9 px-3 rounded-lg text-sm font-medium transition-colors ${
                    imageGen.colorMode === mode
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {mode === 'grayscale' ? '黑白' : '彩色'}
                </button>
              ))}
            </div>
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-gray-500">存储方式</span>
            <div className="flex gap-1">
              {(['base64', 's3'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => update({ imageGen: { ...imageGen, storageMode: mode } })}
                  className={`h-9 px-3 rounded-lg text-sm font-medium transition-colors ${
                    imageGen.storageMode === mode
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {mode === 'base64' ? 'Base64' : 'S3'}
                </button>
              ))}
            </div>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-gray-500">风格描述</span>
            <input
              value={imageGen.styleDescription}
              onChange={(e) => update({ imageGen: { ...imageGen, styleDescription: e.target.value } })}
              className="w-full h-9 border border-slate-200 rounded-lg px-3 text-sm text-gray-800 focus:border-sky-400/40 focus:ring-[3px] focus:ring-sky-100/50"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-gray-500">负面提示词</span>
            <input
              value={imageGen.negativePrompt}
              onChange={(e) => update({ imageGen: { ...imageGen, negativePrompt: e.target.value } })}
              className="w-full h-9 border border-slate-200 rounded-lg px-3 text-sm text-gray-800 focus:border-sky-400/40 focus:ring-[3px] focus:ring-sky-100/50"
            />
          </label>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={imageGen.watermark}
            onChange={(e) => update({ imageGen: { ...imageGen, watermark: e.target.checked } })}
            className="accent-gray-900"
          />
          <span className="text-xs text-gray-600">启用水印</span>
        </label>
      </div>

      {saving && (
        <p className="text-[11px] text-gray-400 text-center">自动保存中...</p>
      )}
    </div>
  );
}

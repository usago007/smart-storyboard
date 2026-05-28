'use client';

import { useApp } from '@/contexts/AppContext';
import { getClientServices } from '@/application';
import { SCENE_LABELS_V1, SCENE_LABELS_V2, DEFAULT_FIRST_FRAME_TEMPLATE, DEFAULT_LAST_FRAME_TEMPLATE } from '@/shared/runtime-config';
import { useCallback, useState } from 'react';

const VARIABLES_HELP = '{id} {sceneLabel} {dialogue}';

export default function PromptsSettingsPage() {
  const { settings } = useApp();
  const { settingsService } = getClientServices();
  const [newLabel, setNewLabel] = useState('');
  const [saving, setSaving] = useState(false);

  const prompts = settings?.prompts;
  const firstFrame = prompts?.firstFrameTemplate;
  const lastFrame = prompts?.lastFrameTemplate;

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

  if (!settings || !prompts) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-sm text-gray-400">
        加载配置中...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Scene Labels */}
      <div className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-[0_4px_20px_rgba(15,23,42,0.04)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">场景叙事标签</h2>
            <p className="text-xs text-gray-400 mt-0.5">按场景顺序定义叙事结构，每个分镜依次取对应标签</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => update({ prompts: { ...prompts, sceneLabels: SCENE_LABELS_V1 } })}
              className="h-7 px-3 rounded-lg text-[11px] font-medium border border-slate-200 text-gray-500 hover:bg-slate-50 transition-colors"
            >
              V1 预设
            </button>
            <button
              type="button"
              onClick={() => update({ prompts: { ...prompts, sceneLabels: SCENE_LABELS_V2 } })}
              className="h-7 px-3 rounded-lg text-[11px] font-medium border border-slate-200 text-gray-500 hover:bg-slate-50 transition-colors"
            >
              V2 预设
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          {prompts.sceneLabels.map((label, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-[12px] text-gray-700"
            >
              <span className="text-gray-400 font-mono text-[10px]">{i + 1}</span>
              {label}
              <button
                type="button"
                onClick={() =>
                  update({ prompts: { ...prompts, sceneLabels: prompts.sceneLabels.filter((_, j) => j !== i) } })
                }
                className="text-gray-400 hover:text-red-500 ml-0.5"
              >
                ×
              </button>
            </span>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="新标签..."
            className="flex-1 h-8 border border-slate-200 rounded-lg px-3 text-xs text-gray-800 placeholder:text-gray-400 focus:border-sky-400/40 focus:ring-[3px] focus:ring-sky-100/50"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newLabel.trim()) {
                update({ prompts: { ...prompts, sceneLabels: [...prompts.sceneLabels, newLabel.trim()] } });
                setNewLabel('');
              }
            }}
          />
          <button
            type="button"
            disabled={!newLabel.trim()}
            onClick={() => {
              update({ prompts: { ...prompts, sceneLabels: [...prompts.sceneLabels, newLabel.trim()] } });
              setNewLabel('');
            }}
            className="h-8 px-4 rounded-lg text-xs font-medium bg-gray-900 text-white hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 transition-colors"
          >
            添加
          </button>
        </div>
      </div>

      {/* Shot Prompt Template */}
      <div className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-[0_4px_20px_rgba(15,23,42,0.04)]">
        <h2 className="text-sm font-semibold text-gray-900 mb-2">镜头提示词模板</h2>
        <p className="text-xs text-gray-400 mb-3">可用变量：<code className="text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">{VARIABLES_HELP}</code></p>
        <textarea
          value={prompts.shotPromptTemplate}
          onChange={(e) => update({ prompts: { ...prompts, shotPromptTemplate: e.target.value } })}
          rows={3}
          className="w-full border border-slate-200 rounded-xl p-3 text-sm text-gray-800 resize-none focus:border-sky-400/40 focus:ring-[3px] focus:ring-sky-100/50 leading-relaxed"
        />

        <div className="grid grid-cols-2 gap-4 mt-4">
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-gray-500">对白截断长度（镜头提示词）</span>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="10"
                max="60"
                value={prompts.dialogueTruncationShot}
                onChange={(e) => update({ prompts: { ...prompts, dialogueTruncationShot: Number(e.target.value) } })}
                className="flex-1 accent-gray-900"
              />
              <span className="text-xs text-gray-700 font-medium w-6">{prompts.dialogueTruncationShot}</span>
            </div>
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-gray-500">对白截断长度（帧提示词）</span>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="10"
                max="80"
                value={prompts.dialogueTruncationFrame}
                onChange={(e) => update({ prompts: { ...prompts, dialogueTruncationFrame: Number(e.target.value) } })}
                className="flex-1 accent-gray-900"
              />
              <span className="text-xs text-gray-700 font-medium w-6">{prompts.dialogueTruncationFrame}</span>
            </div>
          </label>
        </div>
      </div>

      {/* Frame Templates */}
      <div className="grid grid-cols-2 gap-4">
        {([
          { label: '首帧模板', key: 'firstFrameTemplate' as const, template: firstFrame, defaultT: DEFAULT_FIRST_FRAME_TEMPLATE },
          { label: '尾帧模板', key: 'lastFrameTemplate' as const, template: lastFrame, defaultT: DEFAULT_LAST_FRAME_TEMPLATE },
        ]).map(({ label, key, template, defaultT }) => (
          <div key={key} className="bg-white border border-slate-200/60 rounded-xl p-5 shadow-[0_4px_20px_rgba(15,23,42,0.04)]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900">{label}</h2>
              <button
                type="button"
                onClick={() => update({ prompts: { ...prompts, [key]: defaultT } })}
                className="text-[11px] text-gray-400 hover:text-gray-600 transition-colors"
              >
                恢复默认
              </button>
            </div>

            {([
              { field: 'sceneDescription', label: '场景描述' },
              { field: 'characterPerformance', label: '角色表演' },
              { field: 'cameraAngle', label: '镜头角度' },
              { field: 'lighting', label: '灯光' },
              { field: 'atmosphere', label: '氛围' },
            ] as const).map(({ field, label: fieldLabel }) => (
              <div key={field} className="mb-3">
                <span className="text-[11px] font-medium text-gray-400 mb-1 block">{fieldLabel}</span>
                <textarea
                  value={template?.[field] || ''}
                  onChange={(e) =>
                    update({
                      prompts: {
                        ...prompts,
                        [key]: { ...template, [field]: e.target.value },
                      } as typeof prompts,
                    })
                  }
                  rows={2}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-gray-700 resize-none focus:border-sky-400/40 focus:ring-[3px] focus:ring-sky-100/50"
                />
              </div>
            ))}
          </div>
        ))}
      </div>

      {saving && (
        <p className="text-[11px] text-gray-400 text-center">自动保存中...</p>
      )}
    </div>
  );
}

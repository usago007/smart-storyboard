'use client';

import { useApp } from '@/contexts/AppContext';

const apiRoutes = [
  { name: '分镜拆分', path: '/api/split-scenes', method: 'POST' as const, model: '算法拆分（无需LLM）', module: '智能生成分镜' },
  { name: '文案润色', path: '/api/polish-script', method: 'POST' as const, model: 'doubao-seed-2-0-lite-260215', module: '智能生成分镜' },
  { name: '镜头提示词生成', path: '/api/generate-shot-prompt', method: 'POST' as const, model: 'doubao-seed-2-0-lite-260215', module: '智能生成分镜、手工创建分镜' },
  { name: '首尾帧提示词生成', path: '/api/generate-frames', method: 'POST' as const, model: 'doubao-seed-2-0-lite-260215', module: '智能生成分镜、手工创建分镜' },
  { name: '图片生成', path: '/api/generate-image', method: 'POST' as const, model: 'doubao-seedream-4-5-251128', module: '智能生成分镜、手工创建分镜' },
  { name: '批量生成', path: '/api/batch-generate', method: 'POST' as const, model: 'doubao-seed-2-0-lite-260215', module: '智能生成分镜' },
  { name: '链接内容提取', path: '/api/fetch-url', method: 'POST' as const, model: '-', module: '智能生成分镜' },
  { name: '数据库会话管理', path: '/api/database/session', method: 'GET' as const, model: '-', module: '整个系统' },
];

const modelCards = [
  {
    name: '文案润色',
    desc: 'AI智能优化广告文案表达',
    model: 'doubao-seed-2-0-lite-260215',
    temperature: 0.8,
    maxTokens: 1500,
    category: '文本',
  },
  {
    name: '镜头提示词生成',
    desc: '为分镜生成专业的镜头拍摄提示词',
    model: 'doubao-seed-2-0-lite-260215',
    temperature: 0.7,
    maxTokens: 2000,
    category: '文本',
  },
  {
    name: '首尾帧提示词生成',
    desc: '为分镜生成详细的首帧和尾帧拍摄指导',
    model: 'doubao-seed-2-0-lite-260215',
    temperature: 0.7,
    maxTokens: 1500,
    category: '文本',
  },
  {
    name: '批量生成',
    desc: '批量生成分镜提示词和首尾帧',
    model: 'doubao-seed-2-0-lite-260215',
    temperature: 0.7,
    maxTokens: 1500,
    category: '文本',
  },
];

const dbTables = [
  { name: 'user_generation_sessions', desc: '用户会话表', tag: '24h TTL' },
  { name: 'image_generations', desc: '图片存储表', tag: 'Base64' },
  { name: 'auto_cleanup', desc: '自动清理任务', tag: '1h' },
];

const envVars = [
  { key: 'API Key配置', status: '未配置' as const },
  { key: 'LLM Base URL', status: '未配置' as const },
  { key: '图片服务URL', status: '未配置' as const },
  { key: '数据库连接', status: '未配置' as const },
];

const systemInfo = [
  { key: '应用名称', value: 'FatMug' },
  { key: '运行端口', value: '5000' },
  { key: '框架版本', value: 'Next.js 16.0.10' },
  { key: '运行环境', value: 'production' },
];

const durationConfigs = [
  { duration: '5秒', range: '35-50字', recommended: '42字' },
  { duration: '10秒', range: '70-100字', recommended: '89字' },
  { duration: '12秒', range: '84-120字', recommended: '107字' },
];

function Pill({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${className || ''}`}>
      {children}
    </span>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-[8px] p-6 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-900 mb-4">{title}</h2>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const { language } = useApp();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-bold text-gray-900">系统配置</h1>
        <p className="mt-1 text-sm text-gray-500">
          {language === 'zh' ? '开发者/管理员用于查看 API、模型、数据库与环境变量状态。' : 'Developer/admin page for reviewing API, model, database, and environment variable status.'}
        </p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="border border-gray-200 rounded-[8px] p-4">
          <div className="text-xs text-gray-400">API 接口</div>
          <div className="text-lg font-semibold text-gray-900 mt-1">8 个接口</div>
        </div>
        <div className="border border-gray-200 rounded-[8px] p-4">
          <div className="text-xs text-gray-400">文本模型</div>
          <div className="text-lg font-semibold text-gray-900 mt-1">4 项已启用</div>
        </div>
        <div className="border border-gray-200 rounded-[8px] p-4">
          <div className="text-xs text-gray-400">图片模型</div>
          <div className="text-lg font-semibold text-gray-900 mt-1">1 项已配置</div>
        </div>
        <div className="border border-gray-200 rounded-[8px] p-4">
          <div className="text-xs text-gray-400">数据库</div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            <span className="text-sm font-medium text-gray-900">未连接</span>
          </div>
        </div>
      </div>

      <SectionCard title="API接口配置">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {['接口名称', '路径', '方法', '使用模型', '功能模块'].map((h) => (
                  <th key={h} className="text-left px-3 py-3 font-medium text-gray-600 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {apiRoutes.map((row) => (
                <tr key={row.name} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-3 py-3 text-gray-900 font-medium whitespace-nowrap">{row.name}</td>
                  <td className="px-3 py-3 text-gray-500 font-mono text-[11px]">{row.path}</td>
                  <td className="px-3 py-3">
                    <Pill className={row.method === 'POST' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                      {row.method}
                    </Pill>
                  </td>
                  <td className="px-3 py-3 text-gray-500 max-w-[180px] truncate">{row.model}</td>
                  <td className="px-3 py-3">
                    <Pill className="bg-blue-50 text-blue-700">{row.module}</Pill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="大模型服务配置">
        <div className="grid grid-cols-2 gap-4">
          {modelCards.map((card) => (
            <div key={card.name} className="border border-gray-200 rounded-[6px] p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-900">{card.name}</span>
                <Pill className="bg-green-100 text-green-800">已启用</Pill>
              </div>
              <p className="text-xs text-gray-500 mb-3">{card.desc}</p>
              <dl className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <dt className="text-gray-400">模型名称</dt>
                  <dd className="text-gray-700 font-mono">{card.model}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-400">温度</dt>
                  <dd className="text-gray-700">{card.temperature}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-400">最大Token</dt>
                  <dd className="text-gray-700">{card.maxTokens}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-400">类别</dt>
                  <dd className="text-gray-700">{card.category}</dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="数据库配置">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs bg-gray-100 text-gray-700 rounded-[4px] px-3 py-1.5">PostgreSQL（using Drizzle ORM）</span>
          <span className="text-xs bg-red-50 text-red-600 rounded-full px-2.5 py-0.5 font-medium">未连接</span>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {['表名', '说明', '标签'].map((h) => (
                <th key={h} className="text-left px-3 py-3 font-medium text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dbTables.map((t) => (
              <tr key={t.name} className="border-b border-gray-100">
                <td className="px-3 py-3 text-gray-900 font-mono text-[11px]">{t.name}</td>
                <td className="px-3 py-3 text-gray-500">{t.desc}</td>
                <td className="px-3 py-3">
                  <Pill className="bg-gray-100 text-gray-600">{t.tag}</Pill>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>

      <SectionCard title="分镜时长配置">
        <div className="grid grid-cols-3 gap-4 mb-3">
          {durationConfigs.map((c) => (
            <div key={c.duration} className="border border-gray-200 rounded-[6px] p-3 text-center">
              <div className="text-base font-semibold text-gray-900">{c.duration}</div>
              <div className="text-xs text-gray-500 mt-1">{c.range}</div>
              <div className="text-xs text-gray-400 mt-0.5">推荐 {c.recommended}</div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400">分镜对白字数必须符合时长限制，系统会在输入时提示推荐字数范围。</p>
      </SectionCard>

      <SectionCard title="环境变量状态">
        <div className="grid grid-cols-2 gap-3">
          {envVars.map((v) => (
            <div key={v.key} className="flex items-center justify-between border border-gray-200 rounded-[6px] px-4 py-3">
              <span className="text-xs text-gray-700">{v.key}</span>
              <span className="text-xs bg-red-50 text-red-600 rounded-full px-2.5 py-0.5 font-medium">{v.status}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="系统信息">
        <div className="grid grid-cols-2 gap-3">
          {systemInfo.map((info) => (
            <div key={info.key} className="border border-gray-200 rounded-[6px] px-4 py-3 flex items-center justify-between">
              <span className="text-xs text-gray-400">{info.key}</span>
              <span className="text-xs text-gray-900 font-medium">{info.value}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="bg-blue-50 border border-blue-200 rounded-[8px] p-4">
        <p className="text-xs text-blue-800 leading-relaxed">
          开发人员专用页面。此页面仅开发人员查看系统资源配置，所有配置均为只读状态。如需修改配置，请通过环境变量或配置文件进行。
        </p>
      </div>
    </div>
  );
}

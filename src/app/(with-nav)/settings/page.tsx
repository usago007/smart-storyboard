'use client';

import { useApp } from '@/contexts/AppContext';

type ServiceStatus = '待对接' | '已就绪' | '未配置';

interface ApiRoute {
  name: string;
  path: string;
  method: 'POST' | 'GET';
  module: string;
  status: ServiceStatus;
}

interface ModelCard {
  name: string;
  desc: string;
  category: '文本' | '图像';
  preset: string;
  status: ServiceStatus;
}

interface TableInfo {
  name: string;
  desc: string;
  note: string;
}

interface EnvVar {
  key: string;
  desc: string;
  status: ServiceStatus;
}

const apiRoutes: ApiRoute[] = [
  { name: '分镜拆分', path: '/api/split-scenes', method: 'POST', module: '智能生成分镜', status: '待对接' },
  { name: '文案润色', path: '/api/polish-script', method: 'POST', module: '智能生成分镜', status: '待对接' },
  { name: '镜头提示词生成', path: '/api/generate-shot-prompt', method: 'POST', module: '智能生成分镜 / 手工创建分镜', status: '待对接' },
  { name: '首尾帧提示词生成', path: '/api/generate-frames', method: 'POST', module: '智能生成分镜 / 手工创建分镜', status: '待对接' },
  { name: '图片生成', path: '/api/generate-image', method: 'POST', module: '智能生成分镜 / 手工创建分镜', status: '待对接' },
  { name: '批量生成', path: '/api/batch-generate', method: 'POST', module: '智能生成分镜', status: '未配置' },
  { name: '链接内容提取', path: '/api/fetch-url', method: 'POST', module: '智能生成分镜', status: '已就绪' },
  { name: '会话管理', path: '/api/session', method: 'GET', module: '整个系统', status: '已就绪' },
];

const modelCards: ModelCard[] = [
  { name: '文案润色', desc: '优化广告文案表达与节奏', category: '文本', preset: '待配置', status: '待对接' },
  { name: '镜头提示词生成', desc: '为分镜生成专业镜头拍摄描述', category: '文本', preset: '待配置', status: '待对接' },
  { name: '首尾帧提示词生成', desc: '生成详细的首帧和尾帧拍摄指导', category: '文本', preset: '待配置', status: '待对接' },
  { name: '批量生成', desc: '批量生成分镜提示词与首尾帧', category: '文本', preset: '待配置', status: '未配置' },
  { name: '图片生成', desc: '根据提示词生成分镜参考图', category: '图像', preset: '待配置', status: '待对接' },
];

const dbInfo = {
  type: 'PostgreSQL',
  orm: 'Drizzle ORM',
  host: '127.0.0.1',
  port: 5432,
  database: '未配置',
  user: '未配置',
  status: '未配置' as ServiceStatus,
};

const dbTables: TableInfo[] = [
  { name: 'sessions', desc: '用户会话记录', note: '24h TTL' },
  { name: 'scenes', desc: '分镜数据存储', note: '关联 session_id' },
  { name: 'image_cache', desc: '图片缓存表', note: 'Base64 / URL' },
  { name: 'system_logs', desc: '操作日志', note: '7d 轮转' },
];

const envVars: EnvVar[] = [
  { key: 'LLM_API_KEY', desc: '大模型服务密钥', status: '未配置' },
  { key: 'LLM_BASE_URL', desc: '大模型服务地址', status: '未配置' },
  { key: 'LLM_MODEL_NAME', desc: '默认模型名称', status: '未配置' },
  { key: 'IMAGE_SERVICE_URL', desc: '图片生成服务地址', status: '未配置' },
  { key: 'IMAGE_SERVICE_MODEL', desc: '图片生成模型名', status: '未配置' },
  { key: 'DATABASE_URL', desc: 'PostgreSQL 连接串', status: '未配置' },
  { key: 'REDIS_URL', desc: '缓存服务地址', status: '未配置' },
  { key: 'SESSION_SECRET', desc: '会话加密密钥', status: '未配置' },
  { key: 'S3_ENDPOINT', desc: '对象存储端点', status: '未配置' },
  { key: 'S3_BUCKET', desc: '存储桶名称', status: '未配置' },
];

const systemInfoItems = [
  { key: '应用名称', value: 'FatMug' },
  { key: '运行端口', value: '3000' },
  { key: 'Node.js', value: '20.x' },
  { key: '运行环境', value: 'development' },
];

const statusStyle: Record<ServiceStatus, string> = {
  '待对接': 'text-gray-500 bg-gray-100 border-gray-200',
  '已就绪': 'text-gray-900 bg-gray-200 border-gray-200',
  '未配置': 'text-red-600 bg-red-50 border-red-200',
};

const summaryCards = [
  { label: 'API 接口', value: `${apiRoutes.filter(r => r.status === '已就绪').length}/${apiRoutes.length}` },
  { label: '大模型服务', value: `${modelCards.filter(m => m.status === '已就绪').length}/${modelCards.length}` },
  { label: '数据库', value: '未连接' as string | number },
  { label: '存储服务', value: '未配置' as string | number },
];

function Pill({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${className || ''}`}>
      {children}
    </span>
  );
}

function StatusBadge({ status }: { status: ServiceStatus }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium border ${statusStyle[status]}`}>
      {status}
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
          {language === 'zh'
            ? '基础设施对接状态一览，展示各服务接入进度与配置信息。'
            : 'Infrastructure integration overview — track service connection status and configuration.'}
        </p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {summaryCards.map((card) => (
          <div key={card.label} className="bg-white border border-gray-200 rounded-[8px] p-4">
            <div className="text-xs text-gray-400">{card.label}</div>
            <div className={`mt-1 ${typeof card.value === 'number' ? 'text-lg font-semibold' : 'flex items-center gap-1.5'}`}>
              {typeof card.value === 'string' && card.value.includes('/') ? (
                <span className="text-lg font-semibold text-gray-900">{card.value}</span>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  <span className="text-sm font-medium text-gray-900">{card.value}</span>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <SectionCard title="API 接口配置">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {['接口名称', '路径', '方法', '功能模块', '对接状态'].map((h) => (
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
                    <Pill className={row.method === 'POST' ? 'bg-gray-100 text-gray-700' : 'bg-gray-100 text-gray-700'}>
                      {row.method}
                    </Pill>
                  </td>
                  <td className="px-3 py-3 text-gray-500 max-w-[200px] truncate">{row.module}</td>
                  <td className="px-3 py-3">
                    <StatusBadge status={row.status} />
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
                <StatusBadge status={card.status} />
              </div>
              <p className="text-xs text-gray-500 mb-3">{card.desc}</p>
              <dl className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <dt className="text-gray-400">类别</dt>
                  <dd className={`font-mono ${card.category === '图像' ? 'text-gray-700' : 'text-gray-700'}`}>{card.category}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-400">模型</dt>
                  <dd className="text-gray-400 font-mono">{card.preset}</dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="数据库配置">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs bg-gray-100 text-gray-700 rounded-[4px] px-3 py-1.5">{dbInfo.type}（{dbInfo.orm}）</span>
          <StatusBadge status={dbInfo.status} />
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            { label: 'Host', value: dbInfo.host },
            { label: 'Port', value: String(dbInfo.port) },
            { label: 'Database', value: dbInfo.database },
            { label: 'User', value: dbInfo.user },
          ].map((f) => (
            <div key={f.label} className="flex items-center justify-between border border-gray-200 rounded-[6px] px-4 py-2.5">
              <span className="text-xs text-gray-400">{f.label}</span>
              <span className="text-xs font-mono text-gray-900">{f.value}</span>
            </div>
          ))}
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {['表名', '说明', '备注'].map((h) => (
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
                  <Pill className="bg-gray-100 text-gray-600">{t.note}</Pill>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>

      <SectionCard title="环境变量配置">
        <div className="grid grid-cols-2 gap-3">
          {envVars.map((v) => (
            <div key={v.key} className="flex items-center justify-between border border-gray-200 rounded-[6px] px-4 py-3">
              <div className="flex flex-col">
                <span className="text-xs text-gray-900 font-mono">{v.key}</span>
                <span className="text-[11px] text-gray-400 mt-0.5">{v.desc}</span>
              </div>
              <StatusBadge status={v.status} />
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="系统信息">
        <div className="grid grid-cols-2 gap-3">
          {systemInfoItems.map((info) => (
            <div key={info.key} className="border border-gray-200 rounded-[6px] px-4 py-3 flex items-center justify-between">
              <span className="text-xs text-gray-400">{info.key}</span>
              <span className="text-xs text-gray-900 font-medium">{info.value}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="bg-gray-50 border border-gray-200 rounded-[8px] p-4">
        <p className="text-xs text-gray-500 leading-relaxed">
          {language === 'zh'
            ? '此页面展示系统基础设施对接状态，所有信息均为只读。服务对接完成后，对应状态将自动更新。'
            : 'This page displays system infrastructure integration status. All information is read-only. Status updates automatically when services are connected.'}
        </p>
      </div>
    </div>
  );
}

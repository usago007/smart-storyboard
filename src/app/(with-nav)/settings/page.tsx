'use client';

import { useApp } from '@/contexts/AppContext';
import { getClientServices } from '@/application';

function StatusDot({ online }: { online: boolean }) {
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${
        online ? 'bg-emerald-500' : 'bg-gray-300'
      }`}
    />
  );
}

function ServiceCard({
  name,
  desc,
  online,
  detail,
}: {
  name: string;
  desc: string;
  online: boolean;
  detail: string;
}) {
  return (
    <div className="bg-white border border-slate-200/60 rounded-xl p-5 shadow-[0_4px_20px_rgba(15,23,42,0.04)]">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-gray-900">{name}</span>
        <StatusDot online={online} />
      </div>
      <p className="text-xs text-gray-500 mb-3">{desc}</p>
      <p className="text-[11px] text-gray-400 font-mono">{detail}</p>
    </div>
  );
}

export default function SettingsOverviewPage() {
  const { settings, language } = useApp();

  if (!settings) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-sm text-gray-400">
        加载配置中...
      </div>
    );
  }

  const isRemote = settings.dataMode === 'remote';
  const hasLLM = !!settings.llm.baseUrl;
  const hasImageGen = !!settings.imageGen.baseUrl;

  return (
    <div className="space-y-6">
      {!isRemote && (
        <div className="bg-sky-50/60 border border-sky-100 rounded-xl px-4 py-3 text-[13px] text-sky-700 leading-relaxed">
          {language === 'zh'
            ? 'Demo 模式：当前使用本地 mock 数据，切换至 Remote 模式后可接入真实服务。'
            : 'Demo mode: using local mock data. Switch to Remote mode to connect real services.'}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <ServiceCard
          name="LLM 文本生成"
          desc="镜头提示词、首尾帧、文案润色、批量生成"
          online={hasLLM}
          detail={hasLLM ? `${settings.llm.provider} · ${settings.llm.baseUrl}` : '未配置'}
        />
        <ServiceCard
          name="图片生成"
          desc="分镜参考图生成与后处理"
          online={hasImageGen}
          detail={hasImageGen ? `${settings.imageGen.model} · ${settings.imageGen.colorMode}` : '未配置'}
        />
        <ServiceCard
          name="PostgreSQL"
          desc="会话数据、分镜数据、图片缓存、操作日志"
          online={isRemote}
          detail={isRemote ? '已连接（Remote 模式）' : 'Demo 模式 · localStorage'}
        />
        <ServiceCard
          name="对象存储"
          desc="S3 兼容存储，图片持久化与 CDN 加速"
          online={false}
          detail={settings.imageGen.storageMode === 's3' ? 'S3 模式' : 'Base64 模式（内存/DB）'}
        />
      </div>

      <div className="bg-white border border-slate-200/60 rounded-xl p-5 shadow-[0_4px_20px_rgba(15,23,42,0.04)]">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">系统信息</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { key: '应用名称', value: settings.brand.appName },
            { key: '数据模式', value: settings.dataMode === 'remote' ? 'Remote' : 'Mock (Demo)' },
            { key: '语言', value: settings.language === 'zh' ? '中文' : 'English' },
            { key: '主题', value: settings.theme === 'light' ? '浅色' : '深色' },
            { key: '环境', value: process.env.NODE_ENV || 'development' },
            { key: 'Node.js', value: '20.x' },
            { key: 'Next.js', value: '16.0' },
            { key: '端口', value: '3000' },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between border border-slate-200/60 rounded-lg px-4 py-2.5">
              <span className="text-xs text-gray-400">{item.key}</span>
              <span className="text-xs font-medium text-gray-900">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

'use client';

import { usePathname, useRouter } from 'next/navigation';

const tabs = [
  { id: '', label: '概览' },
  { id: 'ai', label: 'AI 服务' },
  { id: 'prompts', label: '提示词' },
  { id: 'database', label: '数据' },
  { id: 'general', label: '通用' },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="w-full max-w-[1280px] mx-auto space-y-5">
      <nav className="flex gap-1 border-b border-slate-200 pb-0">
        {tabs.map((tab) => {
          const href = tab.id ? `/settings/${tab.id}/` : '/settings/';
          const isActive = tab.id
            ? pathname.startsWith(`/settings/${tab.id}/`)
            : pathname === '/settings/';

          return (
            <button
              key={tab.id || '_overview'}
              type="button"
              onClick={() => router.push(href)}
              className={`relative px-4 h-9 text-sm font-medium transition-colors ${
                isActive
                  ? 'text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {isActive && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gray-900 rounded-full" />
              )}
            </button>
          );
        })}
      </nav>
      {children}
    </div>
  );
}

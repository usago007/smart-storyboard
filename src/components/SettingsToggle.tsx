'use client';

import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import ModelConfigPanel from './ModelConfigPanel';

export default function SettingsToggle() {
  const { language, t } = useApp();
  const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2 sm:gap-4">
        {/* 模型配置 */}
        <button
          onClick={() => setIsConfigPanelOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
          title="模型配置"
        >
          <span className="text-xs">⚙️</span>
          <span className="hidden sm:inline">{language === 'zh' ? '配置' : 'Config'}</span>
        </button>
      </div>

      {/* 模型配置面板 */}
      <ModelConfigPanel 
        isOpen={isConfigPanelOpen}
        onClose={() => setIsConfigPanelOpen(false)}
      />
    </>
  );
}
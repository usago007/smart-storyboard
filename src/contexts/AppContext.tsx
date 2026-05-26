'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getClientServices } from '@/application';
import type { AppSettings } from '@/domain/storyboard';

type Language = 'zh' | 'en';
type Theme = 'light' | 'dark';

export const translations = {
  zh: {
    appName: 'FatMug',
    appDescription: '智能分镜工具 - 输入广告对白，生成分镜脚本',

    // Settings page
    settingsTitle: '系统配置',
    settingsDesc: '当前系统API接口、数据库和大模型配置（仅供开发人员查看）',

    // Global
    loading: '加载中...',
  },
  en: {
    appName: 'FatMug',
    appDescription: 'Intelligent storyboard tool - Input ad script, generate storyboard',

    settingsTitle: 'System Configuration',
    settingsDesc: 'System API, database, and model configuration (developer only)',

    loading: 'Loading...',
  },
};

interface AppContextType {
  language: Language;
  theme: Theme;
  setLanguage: (lang: Language) => void;
  setTheme: (theme: Theme) => void;
  settings: AppSettings | null;
  updateSettings: (patch: Partial<AppSettings>) => Promise<void>;
  t: typeof translations.zh | typeof translations.en;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [language, setLanguageState] = useState<Language>('zh');
  const [theme, setThemeState] = useState<Theme>('light');
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const { settingsService } = getClientServices();

  useEffect(() => {
    settingsService.getSettings().then((loaded) => {
      setSettings(loaded);
      setLanguageState(loaded.language);
      setThemeState(loaded.theme);
    });
  }, [settingsService]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const updateSettings = async (patch: Partial<AppSettings>) => {
    const next = await settingsService.updateSettings(patch);
    setSettings(next);
    setLanguageState(next.language);
    setThemeState(next.theme);
  };

  const setLanguage = (lang: Language) => {
    void updateSettings({ language: lang });
  };

  const setTheme = (newTheme: Theme) => {
    void updateSettings({ theme: newTheme });
  };

  const t = translations[language];

  return (
    <AppContext.Provider value={{ language, theme, setLanguage, setTheme, settings, updateSettings, t }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

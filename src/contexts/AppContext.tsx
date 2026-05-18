'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// 语言类型定义
type Language = 'zh' | 'en';

// 主题类型定义
type Theme = 'light' | 'dark';

// 文案翻译
export const translations = {
  zh: {
    // App
    appName: 'FatMug',
    appDescription: '智能分镜工具 - 输入广告对白，生成分镜脚本',
    
    // Input methods
    textInput: '选择输入方式',
    fileUpload: '文件上传',
    voiceInput: '语音输入',
    urlInput: '链接导入',
    template: '预设模板',
    // Input area titles
    scriptContent: '文案内容',
    fileContent: '文件内容',
    voiceContent: '语音内容',
    urlContent: '链接内容',
    templateContent: '模板内容',
    // Tab labels
    manualInput: '手动编辑',
    uploadFile: '文件上传',
    voiceRecord: '语音输入',
    importLink: '链接导入',
    presetTemplate: '预设模板',
    
    // Form
    scriptPlaceholder: '请输入广告对白（最多3000字符）...',
    selectDuration: '选择分镜时长',
    wordCountPerScene: '每分镜字数',
    generateBtn: '生成分镜',
    generating: '生成中...',
    
    // Templates
    beautyAd: '护肤品广告',
    foodAd: '美食广告',
    techAd: '科技产品',
    educationAd: '教育培训',
    
    // Messages
    emptyScriptError: '请输入广告对白',
    longScriptError: '输入内容超过3000字符限制',
    splitFailedError: '分镜拆分失败',
    fileTooLargeError: '文件过大，请选择小于10MB的文件',
    fileReadSuccess: '文件读取成功！',
    charactersImported: '字符',
    truncated: '（已截取）',
    
    // File upload
    dragFileHere: '点击或拖拽文件到此处',
    supportedFormats: '支持 .txt 格式，最大 3000 字符',
    autoSwitchToEditMode: '上传后将自动切换到手动模式供您编辑',
    contentAutoSwitchedToEdit: '内容已自动切换到文本模式供您编辑',
    readingFile: '文件读取中...',
    contentPreview: '已读取内容预览',
    switchToEditMode: '切换到手动模式编辑 →',
    
    // Voice input
    startRecording: '🎤 点击开始录音，支持中文语音',
    stopRecording: '🔴 正在录音，点击停止...',
    characterCount: '字数',
    approachingLimit: '接近字数限制',
    autoSwitchAfterRecording: '录音结束后将自动切换到手动模式',
    browserRecommendation: '建议使用Chrome或Edge浏览器',
    recognizedContent: '已识别内容',
    voicePlaceholder: '语音识别的内容将显示在这里...',
    
    // URL input
    linkImport: '链接导入',
    urlPlaceholder: '请输入包含文本内容的网页链接',
    import: '导入',
    importing: '获取中',
    supportedPages: '支持文章、博客等包含文本内容的网页',
    autoSwitchAfterImport: '导入后将自动切换到手动模式供您编辑',
    importSuccess: '导入成功',
    
    // Template
    selectTemplate: '选择模板',
    useThisTemplate: '点击使用此模板 →',
    
    // Status messages
    approachingCharacterLimit: '接近字数限制',
    pleaseEnterContent: '请输入广告对白内容以开始',
    contentTooShort: '内容较短，建议添加更多描述以获得更好的分镜效果',
    aiPolishing: 'AI润色',
    polishing: '润色中',
    clear: '清空',
    polish: '润色',
    
    // Alerts
    pleaseEnterValidUrl: '请输入有效的URL链接',
    fileFormatNotSupported: '不支持的文件格式，请上传txt文件',
    onlySupportTxtFile: '目前仅支持txt文件，请将文件转换为txt格式',
    fileReadFailed: '文件读取失败，请重试',
    voiceRecognitionError: '语音识别出错：',
    browserNotSupportVoice: '您的浏览器不支持语音输入，请使用Chrome或Edge浏览器',
    reachedCharacterLimit: '已达到3000字符限制，录音已自动停止',
    voiceInputComplete: '语音输入完成！已识别',
    charactersForYouToEdit: '字符，已切换到手动模式供您查看和编辑',
    urlImportFailed: 'URL导入失败，请检查链接是否有效',
    cannotGetTextFromUrl: '未能从URL获取到文本内容',
    urlContentImported: 'URL内容导入成功！',
    urlContentImportedTruncated: '已截取前3000字符',
    originalText: '原文',
    characters: '字符',
    pleaseEnterScriptFirst: '请先输入广告对白内容',
    aiPolishFailed: 'AI润色失败，请重试',
    aiPolishCompleted: 'AI润色完成！内容已更新。',
    reachCharacterLimitConfirm: '文件内容为',
    charactersExceedLimit: '字符，超过了3000字符限制。是否截取前3000字符继续？',
    
    // Character count warnings
    wordCount: '字数',
    word: '字',
    words: 'words',
    min: '最少',
    max: '最多',
    recommended: '推荐值',
    second: '秒',
    seconds: 's',
    
    // Duration descriptions
    scene5s: '5秒分镜',
    scene10s: '10秒分镜',
    scene12s: '12秒分镜',
    
    // Settings
    language: '语言',
    theme: '主题',
    lightTheme: '浅色',
    darkTheme: '深色',
    
    // Result page
    resultTitle: '分镜结果',
    backButton: '返回',
    regenerateBtn: '重新生成',
    copyAllBtn: '复制全部',
    downloadBtn: '下载',
    expandAll: '全部展开',
    collapseAll: '全部折叠',
    batchGenerate: '批量生成提示词',
    sceneTitle: '分镜',
    shotPrompt: '镜头提示词',
    firstFrame: '首帧画面',
    lastFrame: '尾帧画面',
    sceneDescription: '场景描述',
    characterPerformance: '角色表演',
    cameraAngle: '镜头角度',
    lighting: '灯光',
    atmosphere: '氛围',
    generatePrompt: '生成提示词',
    copy: '复制',
    play: '播放',
    pause: '暂停',
    expand: '展开',
    collapse: '折叠',
    speechNotSupported: '您的浏览器不支持语音播放功能',
    copySuccess: '已复制到剪贴板',
    downloadSuccess: '下载成功',
    generatingPrompts: '正在批量生成提示词...',
    
    // Manual create
    or: '或者',
    createManually: '手工创建分镜',
  },
  en: {
    // App
    appName: 'Ad Script Storyboard Tool',
    appDescription: 'Input ad script to generate intelligent storyboard',
    
    // Input methods
    textInput: 'Select Input Method',
    fileUpload: 'File Upload',
    voiceInput: 'Voice Input',
    urlInput: 'Link Import',
    template: 'Preset Template',
    // Input area titles
    scriptContent: 'Script Content',
    fileContent: 'File Content',
    voiceContent: 'Voice Content',
    urlContent: 'URL Content',
    templateContent: 'Template Content',
    // Tab labels
    manualInput: 'Manual Input',
    uploadFile: 'File Upload',
    voiceRecord: 'Voice Input',
    importLink: 'Link Import',
    presetTemplate: 'Preset Template',
    
    // Form
    scriptPlaceholder: 'Enter ad script (max 3000 characters)...',
    selectDuration: 'Select Scene Duration',
    wordCountPerScene: 'Words per Scene',
    generateBtn: 'Generate Storyboard',
    generating: 'Generating...',
    
    // Templates
    beautyAd: 'Beauty Product Ad',
    foodAd: 'Food Ad',
    techAd: 'Tech Product',
    educationAd: 'Education Training',
    
    // Messages
    emptyScriptError: 'Please enter ad script',
    longScriptError: 'Content exceeds 3000 character limit',
    splitFailedError: 'Storyboard splitting failed',
    fileTooLargeError: 'File too large, please select a file smaller than 10MB',
    fileReadSuccess: 'File read successfully!',
    charactersImported: 'characters',
    truncated: ' (truncated)',
    
    // File upload
    dragFileHere: 'Click or drag file here',
    supportedFormats: 'Supports .txt format, max 3000 characters',
    autoSwitchToEditMode: 'Will auto-switch to manual mode for editing after upload',
    contentAutoSwitchedToEdit: 'Content will auto-switch to text mode for editing',
    readingFile: 'Reading file...',
    contentPreview: 'Content Preview',
    switchToEditMode: 'Switch to manual edit mode →',
    
    // Voice input
    startRecording: '🎤 Click to start recording, supports Chinese voice',
    stopRecording: '🔴 Recording, click to stop...',
    characterCount: 'Characters',
    approachingLimit: 'Approaching limit',
    autoSwitchAfterRecording: 'Will auto-switch to manual mode after recording',
    browserRecommendation: 'Recommended to use Chrome or Edge browser',
    recognizedContent: 'Recognized Content',
    voicePlaceholder: 'Voice recognition content will appear here...',
    
    // URL input
    linkImport: 'Link Import',
    urlPlaceholder: 'Enter webpage URL containing text content',
    import: 'Import',
    importing: 'Importing',
    supportedPages: 'Supports articles, blogs and other pages with text content',
    autoSwitchAfterImport: 'Will auto-switch to manual mode for editing after import',
    importSuccess: 'Import Successful',
    
    // Template
    selectTemplate: 'Select Template',
    useThisTemplate: 'Click to use this template →',
    
    // Status messages
    approachingCharacterLimit: 'Approaching character limit',
    pleaseEnterContent: 'Please enter ad script to start',
    contentTooShort: 'Content is short, consider adding more description for better storyboarding',
    aiPolishing: 'AI Polish',
    polishing: 'Polishing',
    clear: 'Clear',
    polish: 'Polish',
    
    // Alerts
    pleaseEnterValidUrl: 'Please enter valid URL',
    fileFormatNotSupported: 'File format not supported, please upload txt file',
    onlySupportTxtFile: 'Currently only supports txt files, please convert file to txt format',
    fileReadFailed: 'File read failed, please try again',
    voiceRecognitionError: 'Voice recognition error:',
    browserNotSupportVoice: 'Your browser does not support voice input, please use Chrome or Edge browser',
    reachedCharacterLimit: 'Reached 3000 character limit, recording stopped automatically',
    voiceInputComplete: 'Voice input complete! Recognized',
    charactersForYouToEdit: 'characters, switched to manual mode for your review and editing',
    urlImportFailed: 'URL import failed, please check if the link is valid',
    cannotGetTextFromUrl: 'Could not get text content from URL',
    urlContentImported: 'URL content imported successfully!',
    urlContentImportedTruncated: 'truncated to first 3000 characters',
    originalText: 'original',
    characters: 'characters',
    pleaseEnterScriptFirst: 'Please enter ad script content first',
    aiPolishFailed: 'AI polish failed, please try again',
    aiPolishCompleted: 'AI polish completed! Content updated.',
    reachCharacterLimitConfirm: 'File content is',
    charactersExceedLimit: 'characters, exceeds 3000 character limit. Truncate to first 3000 characters?',
    
    // Character count warnings
    wordCount: 'Word Count',
    word: 'word',
    words: 'words',
    min: 'Min',
    max: 'Max',
    recommended: 'Recommended',
    second: 'second',
    seconds: 's',
    
    // Duration descriptions
    scene5s: '5s Scene',
    scene10s: '10s Scene',
    scene12s: '12s Scene',
    
    // Settings
    language: 'Language',
    theme: 'Theme',
    lightTheme: 'Light',
    darkTheme: 'Dark',
    
    // Result page
    resultTitle: 'Storyboard Results',
    backButton: 'Back',
    regenerateBtn: 'Regenerate',
    copyAllBtn: 'Copy All',
    downloadBtn: 'Download',
    expandAll: 'Expand All',
    collapseAll: 'Collapse All',
    batchGenerate: 'Generate All Prompts',
    sceneTitle: 'Scene',
    shotPrompt: 'Shot Prompt',
    firstFrame: 'First Frame',
    lastFrame: 'Last Frame',
    sceneDescription: 'Scene Description',
    characterPerformance: 'Character Performance',
    cameraAngle: 'Camera Angle',
    lighting: 'Lighting',
    atmosphere: 'Atmosphere',
    generatePrompt: 'Generate Prompt',
    copy: 'Copy',
    play: 'Play',
    pause: 'Pause',
    expand: 'Expand',
    collapse: 'Collapse',
    speechNotSupported: 'Your browser does not support speech synthesis',
    copySuccess: 'Copied to clipboard',
    downloadSuccess: 'Download successful',
    generatingPrompts: 'Generating all prompts...',
    
    // Manual create
    or: 'Or',
    createManually: 'Create Storyboard Manually'
  }
};

// Context类型定义
interface AppContextType {
  language: Language;
  theme: Theme;
  setLanguage: (lang: Language) => void;
  setTheme: (theme: Theme) => void;
  t: typeof translations.zh | typeof translations.en;
}

// 创建Context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider组件
interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  // 从localStorage读取用户偏好设置，默认中文和浅色主题
  const [language, setLanguageState] = useState<Language>('zh');
  const [theme, setThemeState] = useState<Theme>('light');
  const [isClient, setIsClient] = useState(false);

  // 标记客户端渲染
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 客户端初始化时读取localStorage
  useEffect(() => {
    if (!isClient) return;
    
    const savedLanguage = localStorage.getItem('ad-script-language') as Language;
    const savedTheme = localStorage.getItem('ad-script-theme') as Theme;
    
    if (savedLanguage && (savedLanguage === 'zh' || savedLanguage === 'en')) {
      setLanguageState(savedLanguage);
    }
    
    // 应用保存的主题到DOM
    const finalTheme = savedTheme || 'light';
    setThemeState(finalTheme);
    
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (finalTheme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
    
    // 启动数据清理服务（通过API通知服务端）
    fetch('/api/database/cleanup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'start' })
    }).catch((error) => {
      console.error('启动数据清理服务失败:', error);
    });
  }, [isClient]);

  // 设置语言并保存到localStorage
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('ad-script-language', lang);
  };

  // 设置主题并保存到localStorage
  const setTheme = (newTheme: Theme) => {
    console.log('Setting theme to:', newTheme);
    setThemeState(newTheme);
    localStorage.setItem('ad-script-theme', newTheme);
    
    // 更新HTML元素的class来触发主题变化
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      console.log('Current root classes before:', root.className);
      if (newTheme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
      console.log('Current root classes after:', root.className);
    }
  };

  // 获取当前语言的翻译
  const t = translations[language];

  const value = {
    language,
    theme,
    setLanguage,
    setTheme,
    t
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

// Hook用于使用Context
export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/contexts/AppContext';
import SettingsToggle from '@/components/SettingsToggle';
import { showErrorAlert } from '@/lib/error-handler';

interface DurationConfig {
  seconds: number;
  minWords: number;
  maxWords: number;
  recommendedWords: number;
  step: number;
  description: string;
}

// 预设模板
const getTemplates = (language: string) => [
  {
    id: 'beauty',
    name: language === 'zh' ? '护肤品广告' : 'Beauty Product Ad',
    content: '每天坚持使用，肌肤焕发自然光彩。温和配方，深层滋养，让美丽从内而外绽放。选择我们，选择自信与美丽。'
  },
  {
    id: 'food',
    name: language === 'zh' ? '美食广告' : 'Food Ad',
    content: '新鲜食材，用心烹饪，每一口都是家的味道。传统工艺，现代口感，让味蕾记住这一刻的美好。'
  },
  {
    id: 'tech',
    name: language === 'zh' ? '科技产品' : 'Tech Product',
    content: '创新科技，改变生活。智能设计，便捷操作，让每一天都充满可能。未来已来，你准备好了吗？'
  },
  {
    id: 'education',
    name: language === 'zh' ? '教育培训' : 'Education Ad',
    content: '专业师资，科学方法，让学习成为乐趣。个性化教学，因材施教，每个孩子都是独特的未来之星。'
  }
];

export default function SmartCreatePage() {
  const { t, language } = useApp();
  const router = useRouter();
  
  // 获取当前语言的模板
  const templates = getTemplates(language);
  
  // 时长配置
  const durationConfigs: DurationConfig[] = [
    {
      seconds: 5,
      minWords: 35,
      maxWords: 50,
      recommendedWords: 42,
      step: 1,
      description: language === 'zh' ? '5秒分镜' : '5s Scene'
    },
    {
      seconds: 10,
      minWords: 70,
      maxWords: 100,
      recommendedWords: 89,
      step: 1,
      description: language === 'zh' ? '10秒分镜' : '10s Scene'
    },
    {
      seconds: 12,
      minWords: 84,
      maxWords: 120,
      recommendedWords: 107,
      step: 1,
      description: language === 'zh' ? '12秒分镜' : '12s Scene'
    }
  ];

  const [script, setScript] = useState('');
  const [manualInputScript, setManualInputScript] = useState(''); // 保存手动输入的内容
  const [selectedDuration, setSelectedDuration] = useState(5);
  const [wordCount, setWordCount] = useState(42); // 5秒分镜的推荐字数
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [inputMethod, setInputMethod] = useState<'text' | 'file' | 'voice' | 'url' | 'template'>('text');
  const [isRecording, setIsRecording] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [polishLoading, setPolishLoading] = useState(false);
  const [isUserAdjustedWordCount, setIsUserAdjustedWordCount] = useState(false);
  const [previousDuration, setPreviousDuration] = useState(5);
  const [showMore, setShowMore] = useState(false);

  // 确保客户端hydration完成
  useEffect(() => {
    setMounted(true);
  }, []);

  // 根据选择的时长获取配置
  const currentConfig = durationConfigs.find(config => config.seconds === selectedDuration);

  // 根据输入方式获取对应的标题
  const getInputTitle = () => {
    return language === 'zh' ? '选择输入方式' : 'Select Input Method'; // 统一显示"选择输入方式"
  };

  // 当选择的时长改变时，更新字数（仅在用户未手动调整过时）
  useEffect(() => {
    if (currentConfig && selectedDuration !== previousDuration) {
      setWordCount(currentConfig.recommendedWords);
      setIsUserAdjustedWordCount(false); // 重置用户调整状态
      setPreviousDuration(selectedDuration);
    }
  }, [selectedDuration, currentConfig, previousDuration]);

  // 验证输入是否有效
  const isInputValid = script.trim().length > 0 && script.length <= 3000;

  const handleGenerate = async () => {
    if (!isInputValid || !currentConfig) {
      alert(script.trim().length === 0 ? t.emptyScriptError : t.longScriptError);
      return;
    }

    setLoading(true);
    try {
      // 调用第一步API：拆分分镜
      const response = await fetch('/api/split-scenes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          script,
          duration: selectedDuration,
          targetWordsPerScene: wordCount
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw { code: errorData.code, message: errorData.message, requestId: errorData.requestId };
      }

      const data = await response.json();

      if (data.success && data.scenes && data.scenes.length > 0) {
        // 将数据存储到sessionStorage供下一页使用
        sessionStorage.setItem('adScriptData', JSON.stringify({
          script,
          duration: selectedDuration,
          wordCount,
          scenes: data.scenes
        }));

        // 跳转到第二页
        router.push('/result');
      } else {
        throw new Error('分镜拆分返回的数据无效');
      }
    } catch (error) {
      console.error('Error:', error);
      showErrorAlert(error, '分镜生成失败');
    } finally {
      setLoading(false);
    }
  };

  const handleScriptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (newValue.length <= 3000) {
      setScript(newValue);
      setManualInputScript(newValue); // 同时保存到手动输入的状态
    }
  };

  const handleDurationSelect = (seconds: number) => {
    setSelectedDuration(seconds);
    // 注意：字数更新已经在 useEffect 中处理，这里不需要重复
  };

  const handleWordCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (currentConfig && !isNaN(value) && value >= currentConfig.minWords && value <= currentConfig.maxWords) {
      setWordCount(value);
      setIsUserAdjustedWordCount(true); // 标记用户已手动调整
    }
  };

  // 文件上传处理
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadLoading(true);
    try {
      // 检查文件大小（限制为10MB）
      if (file.size > 10 * 1024 * 1024) {
        alert(t.fileTooLargeError);
        return;
      }

      // 支持更多文本格式
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        const text = await file.text();
        if (text.length > 3000) {
          alert(t.longScriptError);
          return;
        }
        setScript(text);
        // 文件上传方式不需要保存到手动输入状态
      } else if (file.type === 'application/msword' || file.name.endsWith('.doc') || file.name.endsWith('.docx')) {
        // 对于Word文档，提示用户转换为文本文件
        alert(language === 'zh' ? '请将Word文档转换为文本文件后上传' : 'Please convert Word document to text file before uploading');
        return;
      } else {
        alert(language === 'zh' ? '不支持的文件格式，请上传txt文件' : 'Unsupported file format, please upload txt file');
        return;
      }
    } catch (error) {
      console.error('File upload error:', error);
      alert(language === 'zh' ? '文件上传失败，请重试' : 'File upload failed, please try again');
    } finally {
      setUploadLoading(false);
    }
  };

  // 语音输入处理
  const startVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert(language === 'zh' ? '您的浏览器不支持语音输入功能' : 'Your browser does not support voice input');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = language === 'zh' ? 'zh-CN' : 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event: any) => {
      let currentText = script;
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          currentText += transcript;
        }
      }
      if (currentText.length <= 3000) {
        setScript(currentText);
        // 语音输入方式不需要保存到手动输入状态
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
      alert(language === 'zh' ? '语音输入出现错误，请重试' : 'Voice input error, please try again');
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
  };

  const stopVoiceInput = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.stop();
      setIsRecording(false);
    }
  };

  // URL内容提取处理
  const handleUrlExtract = async () => {
    if (!urlInput.trim()) {
      alert(language === 'zh' ? '请输入有效的URL' : 'Please enter a valid URL');
      return;
    }

    setUploadLoading(true);
    try {
      // 这里应该调用一个API来提取URL内容
      // 由于这是客户端代码，我们模拟这个过程
      const response = await fetch('/api/extract-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: urlInput }),
      });

      if (!response.ok) {
        throw new Error('URL内容提取失败');
      }

      const data = await response.json();
      if (data.content && data.content.length > 3000) {
        alert(t.longScriptError);
        return;
      }
      setScript(data.content || '');
      // URL导入方式不需要保存到手动输入状态
    } catch (error) {
      console.error('URL extract error:', error);
      alert(language === 'zh' ? 'URL内容提取失败，请检查URL是否有效' : 'Failed to extract URL content, please check if the URL is valid');
    } finally {
      setUploadLoading(false);
    }
  };

  // 模板选择处理
  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setScript(template.content);
      // 模板方式不需要保存到手动输入状态
    }
  };

  // AI润色功能
  const handlePolishScript = async () => {
    if (!script.trim()) {
      alert(language === 'zh' ? '请先输入广告对白内容' : 'Please enter advertising dialogue first');
      return;
    }

    setPolishLoading(true);
    try {
      const response = await fetch('/api/polish-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          script,
          targetLength: currentConfig ? currentConfig.recommendedWords * 3 : 3000 // 总长度建议
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw { code: errorData.code, message: errorData.message, requestId: errorData.requestId };
      }

      const data = await response.json();
      if (data.polishedScript && data.polishedScript.length <= 3000) {
        setScript(data.polishedScript);
        // 如果当前是手动输入方式，同时保存到手动输入状态
        if (inputMethod === 'text') {
          setManualInputScript(data.polishedScript);
        }
      } else {
        alert(language === 'zh' ? '润色后的文案过长，已为您保留原始内容' : 'Polished content is too long, original content preserved');
      }
    } catch (error) {
      console.error('Polish error:', error);
      showErrorAlert(error, 'AI润色失败');
    } finally {
      setPolishLoading(false);
    }
  };

  // 如果还没有挂载，显示加载状态
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{language === 'zh' ? '加载中...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          FatMug {language === 'zh' ? '智能分镜' : 'Smart Storyboard'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {language === 'zh' ? '输入广告对白，智能生成分镜脚本' : 'Input ad script to generate intelligent storyboard'}
        </p>
      </div>

      <div className="bg-white dark:bg-black rounded-lg shadow-lg p-6 mb-6 border border-gray-200 dark:border-gray-800">
        {/* 时长选择 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            {t.selectDuration}
          </label>
          <div className="grid grid-cols-3 gap-4">
            {durationConfigs.map((config) => (
              <button
                key={config.seconds}
                onClick={() => handleDurationSelect(config.seconds)}
                className={`p-4 rounded-lg border-2 transition-all min-h-[88px] flex flex-col items-center justify-center ${
                  selectedDuration === config.seconds
                    ? 'border-black bg-white dark:bg-black'
                    : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
                }`}
              >
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {config.seconds}s
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {config.description}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 字数调整 */}
        {currentConfig && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {language === 'zh' ? '每分镜字数' : 'Words Per Scene'}
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                ({currentConfig.minWords}-{currentConfig.maxWords}字)
              </span>
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="range"
                min={currentConfig.minWords}
                max={currentConfig.maxWords}
                step={currentConfig.step}
                value={wordCount}
                onChange={handleWordCountChange}
                className="flex-1 h-1 bg-gray-300 dark:bg-gray-700 rounded appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-black dark:[&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-gray-300 dark:[&::-webkit-slider-thumb]:border-gray-600 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-black dark:[&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-gray-300 dark:[&::-moz-range-thumb]:border-gray-600"
              />
              <div className="w-16 text-center">
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  {wordCount}
                </span>
              </div>
            </div>
            {isUserAdjustedWordCount && (
              <div className="mt-2 text-xs text-orange-600 dark:text-orange-400">
                {language === 'zh' ? '您已手动调整字数' : 'You have manually adjusted word count'}
              </div>
            )}
          </div>
        )}

        {/* 输入方式选择 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            {getInputTitle()}
          </label>
          
          {/* 输入方式选择器 */}
          <div className="flex flex-wrap gap-2 mb-4">
            {[
              { id: 'text', label: language === 'zh' ? '手动输入' : 'Manual Input' },
              { id: 'file', label: language === 'zh' ? '文件上传' : 'File Upload' },
              { id: 'voice', label: language === 'zh' ? '语音输入' : 'Voice Input' },
              { id: 'url', label: language === 'zh' ? '链接导入' : 'Link Import' },
              { id: 'template', label: language === 'zh' ? '预设模板' : 'Preset Template' }
            ].map((method) => (
              <button
                key={method.id}
                onClick={() => {
                  const previousMethod = inputMethod;
                  setInputMethod(method.id as any);
                  
                  // 切换逻辑：
                  // 1. 如果从手动输入切换到其他方式：清空内容
                  // 2. 如果从其他方式切换回手动输入：恢复手动输入的内容
                  // 3. 如果在非手动输入方式之间切换：清空内容
                  if (previousMethod === 'text' && method.id !== 'text') {
                    // 从手动输入切换到其他方式，清空内容
                    setScript('');
                    setUrlInput('');
                  } else if (previousMethod !== 'text' && method.id === 'text') {
                    // 切换回手动输入，恢复之前手动输入的内容
                    setScript(manualInputScript);
                  } else if (previousMethod !== 'text' && method.id !== 'text') {
                    // 在非手动输入方式之间切换，清空内容
                    setScript('');
                    setUrlInput('');
                  }
                  // 如果是同一种方式，不做任何操作
                }}
                className={`px-4 py-3 rounded-full text-sm font-medium transition-all min-h-[44px] flex items-center justify-center ${
                  inputMethod === method.id
                    ? 'bg-black text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {method.label}
              </button>
            ))}
          </div>

          {/* 动态输入区域 */}
          {inputMethod === 'text' && (
            <div>
              <textarea
                value={script}
                onChange={handleScriptChange}
                placeholder={language === 'zh' ? '请输入广告对白' : 'Please enter ad script (max 3000 characters)...'}
                className="w-full h-32 p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                maxLength={3000}
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {script.length}/3000
                </span>
                {script.trim() && (
                  <button
                    onClick={handlePolishScript}
                    disabled={polishLoading}
                    className="px-4 py-2 text-xs bg-black text-white rounded-full hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] flex items-center justify-center"
                  >
                    {polishLoading ? (language === 'zh' ? '润色中...' : 'Polishing...') : (language === 'zh' ? 'AI润色' : 'AI Polish')}
                  </button>
                )}
              </div>
            </div>
          )}

          {inputMethod === 'file' && (
            <div>
              <input
                type="file"
                accept=".txt"
                onChange={handleFileUpload}
                disabled={uploadLoading}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {language === 'zh' ? '支持 .txt 格式，最大 10MB' : 'Support .txt format, max 10MB'}
              </p>
            </div>
          )}

          {inputMethod === 'voice' && (
            <div className="text-center py-8">
              {isRecording ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center">
                    <div className="animate-pulse">
                      <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <p className="text-lg text-gray-700 dark:text-gray-300">{language === 'zh' ? '正在录音...' : 'Recording...'}</p>
                  <button
                    onClick={stopVoiceInput}
                    className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 min-h-[44px] flex items-center justify-center"
                  >
                    {language === 'zh' ? '停止录音' : 'Stop Recording'}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <button
                    onClick={startVoiceInput}
                    className="w-full max-w-xs mx-auto px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 min-h-[44px] flex items-center justify-center"
                  >
                    {language === 'zh' ? '开始录音' : 'Start Recording'}
                  </button>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {language === 'zh' ? '建议使用Chrome或Edge浏览器以获得最佳体验' : 'Recommended to use Chrome or Edge browser for best experience'}
                  </p>
                </div>
              )}
            </div>
          )}

          {inputMethod === 'url' && (
            <div className="space-y-4">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder={language === 'zh' ? '请输入网页链接...' : 'Please enter webpage URL...'}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
              <button
                onClick={handleUrlExtract}
                disabled={uploadLoading || !urlInput.trim()}
                className="px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] flex items-center justify-center"
              >
                {uploadLoading ? (language === 'zh' ? '提取中...' : 'Extracting...') : (language === 'zh' ? '提取内容' : 'Extract Content')}
              </button>
            </div>
          )}

          {inputMethod === 'template' && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateSelect(template.id)}
                    className="p-4 text-left border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors min-h-[88px] flex flex-col justify-center"
                  >
                    <div className="font-medium text-gray-900 dark:text-white mb-2">
                      {template.name}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {template.content}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 对白预览 */}
        {script && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {language === 'zh' ? '对白预览' : 'Script Preview'}
            </h3>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                {script}
              </p>
            </div>
          </div>
        )}

        {/* 生成按钮 */}
        <button
          onClick={handleGenerate}
          disabled={!isInputValid || loading}
          className="w-full py-3 bg-black text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed font-medium transition-colors"
        >
          {loading ? (language === 'zh' ? '生成中...' : 'Generating...') : (language === 'zh' ? '生成分镜' : 'Generate Scenes')}
        </button>
      </div>

      {/* 使用提示 */}
      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
          {language === 'zh' ? '使用提示' : 'Tips'}
        </h3>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>• {language === 'zh' ? '建议输入完整的广告文案，包含产品特点和使用场景' : '建议输入完整的广告文案，包含产品特点和使用场景'}</li>
          <li>• {language === 'zh' ? '根据广告时长选择合适的分镜时长' : '根据广告时长选择合适的分镜时长'}</li>
          <li>• {language === 'zh' ? '生成的分镜可以后续调整和优化' : '生成的分镜可以后续调整和优化'}</li>
        </ul>
      </div>
    </div>
  );
}
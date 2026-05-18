'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { AI_SERVICES, getAvailableServices } from '@/lib/model-config';

// API接口信息
interface APIEndpoint {
  name: string;
  path: string;
  method: string;
  description: string;
  usedBy: string[];
  model?: string;
}

export default function SettingsPage() {
  const { t, language } = useApp();
  const [mounted, setMounted] = useState(false);

  // 当前系统的API端点配置
  const apiEndpoints: APIEndpoint[] = [
    {
      name: '分镜拆分',
      path: '/api/split-scenes',
      method: 'POST',
      description: '将广告对白按时长智能拆分为分镜（现已使用算法拆分）',
      usedBy: ['智能生成分镜'],
      model: '算法拆分（无需LLM）'
    },
    {
      name: '文案润色',
      path: '/api/polish-script',
      method: 'POST',
      description: 'AI智能优化广告文案表达',
      usedBy: ['智能生成分镜'],
      model: AI_SERVICES.polishScript.model.modelName
    },
    {
      name: '镜头提示词生成',
      path: '/api/generate-shot-prompt',
      method: 'POST',
      description: '为分镜生成专业的镜头拍摄提示词',
      usedBy: ['智能生成分镜', '手工创建分镜'],
      model: AI_SERVICES.generateShotPrompt.model.modelName
    },
    {
      name: '首尾帧提示词生成',
      path: '/api/generate-frames',
      method: 'POST',
      description: '为分镜生成详细的首帧和尾帧拍摄指导',
      usedBy: ['智能生成分镜', '手工创建分镜'],
      model: AI_SERVICES.generateFrames.model.modelName
    },
    {
      name: '图片生成',
      path: '/api/generate-image',
      method: 'POST',
      description: '生成分镜的首帧和尾帧图片（铅笔手绘风格）',
      usedBy: ['智能生成分镜', '手工创建分镜'],
      model: 'doubao-seedream-4-5-251128'
    },
    {
      name: '批量生成',
      path: '/api/batch-generate',
      method: 'POST',
      description: '批量生成分镜提示词和首尾帧',
      usedBy: ['智能生成分镜'],
      model: AI_SERVICES.batchGenerate.model.modelName
    },
    {
      name: '链接内容提取',
      path: '/api/fetch-url',
      method: 'POST',
      description: '从网页URL提取文本内容',
      usedBy: ['智能生成分镜'],
    },
    {
      name: '数据库会话管理',
      path: '/api/database/session',
      method: 'GET',
      description: '管理用户会话和数据存储',
      usedBy: ['整个系统'],
    },
  ];

  // 获取当前可用的大模型服务
  const availableServices = getAvailableServices();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {language === 'zh' ? '系统配置' : 'System Configuration'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {language === 'zh' ? '当前系统API接口、数据库和大模型配置（仅供开发人员查看）' : 'Current system API, database, and LLM configuration (for developers only)'}
        </p>
      </div>

      {/* API接口配置 */}
      <div className="bg-white dark:bg-black rounded-lg shadow p-6 border border-gray-200 dark:border-gray-800">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          {language === 'zh' ? 'API接口配置' : 'API Endpoints'}
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {language === 'zh' ? '接口名称' : 'API Name'}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {language === 'zh' ? '路径' : 'Path'}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {language === 'zh' ? '方法' : 'Method'}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {language === 'zh' ? '使用模型' : 'Model'}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {language === 'zh' ? '功能模块' : 'Used By'}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {apiEndpoints.map((endpoint, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {endpoint.name}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono text-xs">
                    {endpoint.path}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                      {endpoint.method}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {endpoint.model || '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {endpoint.usedBy.map((module, idx) => (
                        <span key={idx} className="px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                          {module}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 大模型服务配置 */}
      <div className="bg-white dark:bg-black rounded-lg shadow p-6 border border-gray-200 dark:border-gray-800">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          {language === 'zh' ? '大模型服务配置' : 'LLM Service Configuration'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {availableServices.map((service, index) => (
            <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                  {service.serviceName}
                </h4>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  service.enabled 
                    ? 'bg-gray-900 text-white dark:bg-white dark:text-black' 
                    : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                }`}>
                  {service.enabled ? 
                    (language === 'zh' ? '已启用' : 'Enabled') : 
                    (language === 'zh' ? '已禁用' : 'Disabled')
                  }
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 leading-relaxed">
                {service.description}
              </p>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 dark:text-gray-400">
                    {language === 'zh' ? '模型名称' : 'Model Name'}:
                  </span>
                  <span className="font-mono text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                    {service.model.modelName}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 dark:text-gray-400">
                    {language === 'zh' ? '温度' : 'Temperature'}:
                  </span>
                  <span className="font-mono text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                    {service.model.temperature}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 dark:text-gray-400">
                    {language === 'zh' ? '最大Token' : 'Max Tokens'}:
                  </span>
                  <span className="font-mono text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                    {service.model.maxTokens}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 dark:text-gray-400">
                    {language === 'zh' ? '类别' : 'Category'}:
                  </span>
                  <span className="font-mono text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                    {service.category === 'text' ? 
                      (language === 'zh' ? '文本' : 'Text') : 
                      service.category}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 数据库配置 */}
      <div className="bg-white dark:bg-black rounded-lg shadow p-6 border border-gray-200 dark:border-gray-800">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
          </svg>
          {language === 'zh' ? '数据库配置' : 'Database Configuration'}
        </h2>
        <div className="space-y-4">
          <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'zh' ? '数据库类型' : 'Database Type'}
                </label>
                <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-lg">
                  <span>PostgreSQL</span>
                  <span className="text-xs text-gray-500">(using Drizzle ORM)</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'zh' ? '连接状态' : 'Connection Status'}
                </label>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-2 text-sm rounded-lg ${
                    process.env.PGDATABASE_URL ?
                      'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800' :
                      'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                  }`}>
                    {process.env.PGDATABASE_URL ?
                      (language === 'zh' ? '已连接' : 'Connected') :
                      (language === 'zh' ? '未连接' : 'Disconnected')
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              {language === 'zh' ? '数据表结构' : 'Data Tables'}
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">user_generation_sessions</span>
                  <span className="text-gray-500 ml-2">{language === 'zh' ? '用户会话表' : 'User sessions table'}</span>
                </div>
                <span className="px-2 py-0.5 text-xs font-medium rounded bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                  24h TTL
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">image_generations</span>
                  <span className="text-gray-500 ml-2">{language === 'zh' ? '图片存储表' : 'Images storage table'}</span>
                </div>
                <span className="px-2 py-0.5 text-xs font-medium rounded bg-gray-900 text-white dark:bg-white dark:text-black">
                  Base64
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">auto_cleanup</span>
                  <span className="text-gray-500 ml-2">{language === 'zh' ? '自动清理任务' : 'Auto cleanup task'}</span>
                </div>
                <span className="px-2 py-0.5 text-xs font-medium rounded bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
                  1h
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 分镜时长配置 */}
      <div className="bg-white dark:bg-black rounded-lg shadow p-6 border border-gray-200 dark:border-gray-800">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {language === 'zh' ? '分镜时长配置' : 'Scene Duration Configuration'}
        </h2>
        <div className="space-y-3">
          <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">5秒</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  {language === 'zh' ? '字数范围' : 'Word Count Range'}
                </div>
                <div className="text-lg font-medium text-blue-600 dark:text-blue-400">
                  35-50{language === 'zh' ? '字' : ' chars'}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {language === 'zh' ? '推荐：42字' : 'Recommended: 42'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">10秒</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  {language === 'zh' ? '字数范围' : 'Word Count Range'}
                </div>
                <div className="text-lg font-medium text-blue-600 dark:text-blue-400">
                  70-100{language === 'zh' ? '字' : ' chars'}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {language === 'zh' ? '推荐：89字' : 'Recommended: 89'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">12秒</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  {language === 'zh' ? '字数范围' : 'Word Count Range'}
                </div>
                <div className="text-lg font-medium text-blue-600 dark:text-blue-400">
                  84-120{language === 'zh' ? '字' : ' chars'}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {language === 'zh' ? '推荐：107字' : 'Recommended: 107'}
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 mt-0.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                {language === 'zh' 
                  ? '分镜对白字数必须符合时长限制。系统会在输入时提示推荐字数范围。'
                  : 'Scene dialogue word count must comply with duration limits. The system will prompt recommended word count range during input.'
                }
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 环境变量状态 */}
      <div className="bg-white dark:bg-black rounded-lg shadow p-6 border border-gray-200 dark:border-gray-800">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          {language === 'zh' ? '环境变量状态' : 'Environment Variables'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 dark:text-gray-400">
                {language === 'zh' ? 'API Key配置' : 'API Key Configured'}:
              </span>
              <span className={`px-2 py-1 text-xs font-medium rounded ${
                process.env.COZE_WORKLOAD_IDENTITY_API_KEY ? 
                  'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 
                  'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
              }`}>
                {process.env.COZE_WORKLOAD_IDENTITY_API_KEY ? 
                  (language === 'zh' ? '已配置' : 'Configured') : 
                  (language === 'zh' ? '未配置' : 'Not Configured')
                }
              </span>
            </div>
          </div>
          <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 dark:text-gray-400">
                {language === 'zh' ? 'LLM Base URL' : 'LLM Base URL'}:
              </span>
              <span className={`px-2 py-1 text-xs font-medium rounded ${
                process.env.COZE_INTEGRATION_MODEL_BASE_URL ? 
                  'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 
                  'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
              }`}>
                {process.env.COZE_INTEGRATION_MODEL_BASE_URL ? 
                  (language === 'zh' ? '已配置' : 'Configured') : 
                  (language === 'zh' ? '未配置' : 'Not Configured')
                }
              </span>
            </div>
          </div>
          <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 dark:text-gray-400">
                {language === 'zh' ? '图片服务URL' : 'Image Service URL'}:
              </span>
              <span className={`px-2 py-1 text-xs font-medium rounded ${
                process.env.COZE_INTEGRATION_BASE_URL ? 
                  'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 
                  'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
              }`}>
                {process.env.COZE_INTEGRATION_BASE_URL ? 
                  (language === 'zh' ? '已配置' : 'Configured') : 
                  (language === 'zh' ? '未配置' : 'Not Configured')
                }
              </span>
            </div>
          </div>
          <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 dark:text-gray-400">
                {language === 'zh' ? '数据库连接' : 'Database URL'}:
              </span>
              <span className={`px-2 py-1 text-xs font-medium rounded ${
                process.env.PGDATABASE_URL ?
                  'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                  'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
              }`}>
                {process.env.PGDATABASE_URL ?
                  (language === 'zh' ? '已配置' : 'Configured') :
                  (language === 'zh' ? '未配置' : 'Not Configured')
                }
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 系统信息 */}
      <div className="bg-white dark:bg-black rounded-lg shadow p-6 border border-gray-200 dark:border-gray-800">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {language === 'zh' ? '系统信息' : 'System Information'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-3">
            <span className="text-gray-500 dark:text-gray-400 block mb-1">
              {language === 'zh' ? '应用名称' : 'Application Name'}:
            </span>
            <span className="font-mono text-gray-900 dark:text-white">FatMug</span>
          </div>
          <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-3">
            <span className="text-gray-500 dark:text-gray-400 block mb-1">
              {language === 'zh' ? '运行端口' : 'Runtime Port'}:
            </span>
            <span className="font-mono text-gray-900 dark:text-white">
              {process.env.DEPLOY_RUN_PORT || '5000'}
            </span>
          </div>
          <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-3">
            <span className="text-gray-500 dark:text-gray-400 block mb-1">
              {language === 'zh' ? '框架版本' : 'Framework Version'}:
            </span>
            <span className="font-mono text-gray-900 dark:text-white">Next.js 16.0.10</span>
          </div>
          <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-3">
            <span className="text-gray-500 dark:text-gray-400 block mb-1">
              {language === 'zh' ? '运行环境' : 'Runtime Environment'}:
            </span>
            <span className="font-mono text-gray-900 dark:text-white">
              {process.env.NODE_ENV || 'production'}
            </span>
          </div>
        </div>
      </div>

      {/* 底部说明 */}
      <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-medium mb-1">
              {language === 'zh' ? '开发人员专用页面' : 'Developer Only Page'}
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              {language === 'zh' 
                ? '此页面仅供开发人员查看系统资源配置，所有配置均为只读状态。如需修改配置，请通过环境变量或配置文件进行。' 
                : 'This page is for developers to view system resource configuration only. All configurations are read-only. To modify configurations, please use environment variables or configuration files.'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

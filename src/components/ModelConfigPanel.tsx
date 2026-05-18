'use client';

import { useState, useEffect } from 'react';
import { AI_SERVICES, AIServiceConfig, getAvailableServices } from '@/lib/model-config';

interface ModelConfigPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ModelConfigPanel({ isOpen, onClose }: ModelConfigPanelProps) {
  const [services, setServices] = useState<AIServiceConfig[]>([]);
  const [selectedService, setSelectedService] = useState<string>('');
  const [editingConfig, setEditingConfig] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setServices(getAvailableServices());
    if (services.length > 0 && !selectedService) {
      setSelectedService(Object.keys(AI_SERVICES)[0]);
    }
  }, []);

  useEffect(() => {
    if (selectedService && AI_SERVICES[selectedService]) {
      setEditingConfig(JSON.parse(JSON.stringify(AI_SERVICES[selectedService])));
    }
  }, [selectedService]);

  const handleSaveConfig = () => {
    if (selectedService && editingConfig) {
      // 这里应该保存到后端或本地存储
      console.log('保存配置:', selectedService, editingConfig);
      alert('配置已保存（注意：当前仅保存在内存中，刷新后会重置）');
      setIsEditing(false);
    }
  };

  const handleResetConfig = () => {
    if (selectedService && AI_SERVICES[selectedService]) {
      setEditingConfig(JSON.parse(JSON.stringify(AI_SERVICES[selectedService])));
      setIsEditing(false);
    }
  };

  const updateConfigField = (field: string, value: any, nestedPath?: string) => {
    setEditingConfig((prev: any) => {
      const updated = { ...prev };
      if (nestedPath) {
        updated.model[nestedPath] = value;
      } else {
        updated[field] = value;
      }
      return updated;
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'text': return '📝';
      case 'vision': return '👁️';
      case 'audio': return '🎵';
      case 'translation': return '🌐';
      default: return '🤖';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            大模型配置管理
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* 服务列表 */}
          <div className="w-80 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                AI服务列表
              </h3>
              <div className="space-y-2">
                {Object.entries(AI_SERVICES).map(([key, service]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setSelectedService(key);
                      setIsEditing(false);
                    }}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedService === key
                        ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    } ${!service.enabled ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getCategoryIcon(service.category)}</span>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {service.serviceName}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {service.description}
                        </div>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${
                        service.enabled ? 'bg-green-500' : 'bg-gray-400'
                      }`}></div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 配置详情 */}
          <div className="flex-1 overflow-y-auto">
            {editingConfig && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    {editingConfig.serviceName} 配置
                  </h3>
                  <div className="flex gap-2">
                    {isEditing ? (
                      <>
                        <button
                          onClick={handleSaveConfig}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                        >
                          保存
                        </button>
                        <button
                          onClick={handleResetConfig}
                          className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-sm"
                        >
                          取消
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                      >
                        编辑
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  {/* 基本信息 */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      基本信息
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          服务名称
                        </label>
                        <input
                          type="text"
                          value={editingConfig.serviceName}
                          onChange={(e) => updateConfigField('serviceName', e.target.value)}
                          disabled={!isEditing}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          服务状态
                        </label>
                        <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800">
                          <div className={`w-2 h-2 rounded-full ${
                            editingConfig.enabled ? 'bg-green-500' : 'bg-gray-400'
                          }`}></div>
                          <span className="text-sm">
                            {editingConfig.enabled ? '已启用' : '已禁用'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 模型配置 */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      模型配置
                    </h4>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            模型名称
                          </label>
                          <input
                            type="text"
                            value={editingConfig.model.modelName}
                            onChange={(e) => updateConfigField('', e.target.value, 'modelName')}
                            disabled={!isEditing}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm disabled:opacity-50"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            API Key
                          </label>
                          <input
                            type="password"
                            value={editingConfig.model.apiKey}
                            onChange={(e) => updateConfigField('', e.target.value, 'apiKey')}
                            disabled={!isEditing}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm disabled:opacity-50"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Base URL
                        </label>
                        <input
                          type="text"
                          value={editingConfig.model.baseURL}
                          onChange={(e) => updateConfigField('', e.target.value, 'baseURL')}
                          disabled={!isEditing}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm disabled:opacity-50"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            Temperature
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="2"
                            value={editingConfig.model.temperature}
                            onChange={(e) => updateConfigField('', parseFloat(e.target.value), 'temperature')}
                            disabled={!isEditing}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm disabled:opacity-50"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            Max Tokens
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={editingConfig.model.maxTokens}
                            onChange={(e) => updateConfigField('', parseInt(e.target.value), 'maxTokens')}
                            disabled={!isEditing}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm disabled:opacity-50"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            流式输出
                          </label>
                          <div className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800">
                            <span className="text-sm">
                              {editingConfig.model.streaming ? '启用' : '禁用'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 描述信息 */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      描述信息
                    </h4>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        服务描述
                      </label>
                      <textarea
                        rows={3}
                        value={editingConfig.description}
                        onChange={(e) => updateConfigField('description', e.target.value)}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm disabled:opacity-50 resize-none"
                      />
                    </div>
                  </div>

                  {/* 配置预览 */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      配置预览
                    </h4>
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                      <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-x-auto">
                        {JSON.stringify(editingConfig.model, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
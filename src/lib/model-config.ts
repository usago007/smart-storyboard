// 系统大模型配置管理

export interface ModelConfig {
  modelName: string;
  apiKey: string;
  baseURL: string;
  temperature: number;
  maxTokens: number;
  streaming: boolean;
  modelKwargs?: Record<string, any>;
}

export interface AIServiceConfig {
  serviceName: string;
  description: string;
  model: ModelConfig;
  category: 'text' | 'vision' | 'audio' | 'translation';
  enabled: boolean;
}

// 默认配置
const DEFAULT_MODEL_CONFIG: ModelConfig = {
  modelName: '',
  apiKey: '',
  baseURL: '',
  temperature: 0.7,
  maxTokens: 1000,
  streaming: true,
  modelKwargs: {
    thinking: {
      type: "disabled",
    },
  },
};

// 系统AI服务配置
export const AI_SERVICES: Record<string, AIServiceConfig> = {
  // 分镜拆分服务（已废弃，现使用算法拆分）
  splitScenes: {
    serviceName: '分镜拆分（已废弃）',
    description: '将广告对白按时长智能拆分为分镜（已改用算法拆分，此配置保留用于向后兼容）',
    model: {
      ...DEFAULT_MODEL_CONFIG,
      modelName: process.env.SPLIT_SCENES_MODEL || 'doubao-seed-2-0-lite-260215',
      apiKey: process.env.COZE_WORKLOAD_IDENTITY_API_KEY || '',
      baseURL: process.env.COZE_INTEGRATION_MODEL_BASE_URL || '',
      maxTokens: 2000,
      temperature: 0.6,
    },
    category: 'text',
    enabled: false, // 已禁用，不再使用
  },

  // 文案润色服务
  polishScript: {
    serviceName: '文案润色',
    description: 'AI智能优化广告文案表达',
    model: {
      ...DEFAULT_MODEL_CONFIG,
      modelName: process.env.POLISH_SCRIPT_MODEL || 'doubao-seed-2-0-lite-260215',
      apiKey: process.env.COZE_WORKLOAD_IDENTITY_API_KEY || '',
      baseURL: process.env.COZE_INTEGRATION_MODEL_BASE_URL || '',
      maxTokens: 1500,
      temperature: 0.8,
    },
    category: 'text',
    enabled: true,
  },

  // 镜头提示词生成服务
  generateShotPrompt: {
    serviceName: '镜头提示词生成',
    description: '为分镜生成专业的镜头拍摄提示词',
    model: {
      ...DEFAULT_MODEL_CONFIG,
      modelName: process.env.SHOT_PROMPT_MODEL || 'doubao-seed-2-0-lite-260215',
      apiKey: process.env.COZE_WORKLOAD_IDENTITY_API_KEY || '',
      baseURL: process.env.COZE_INTEGRATION_MODEL_BASE_URL || '',
      maxTokens: 2000,
      temperature: 0.7,
    },
    category: 'text',
    enabled: true,
  },

  // 首尾帧生成服务
  generateFrames: {
    serviceName: '首尾帧提示词生成',
    description: '为分镜生成详细的首帧和尾帧拍摄指导',
    model: {
      ...DEFAULT_MODEL_CONFIG,
      modelName: process.env.FRAMES_MODEL || 'doubao-seed-2-0-lite-260215',
      apiKey: process.env.COZE_WORKLOAD_IDENTITY_API_KEY || '',
      baseURL: process.env.COZE_INTEGRATION_MODEL_BASE_URL || '',
      maxTokens: 1500,
      temperature: 0.7,
    },
    category: 'text',
    enabled: true,
  },

  // 批量生成服务（复用其他服务的配置）
  batchGenerate: {
    serviceName: '批量生成',
    description: '批量生成分镜提示词和首尾帧',
    model: {
      ...DEFAULT_MODEL_CONFIG,
      modelName: process.env.BATCH_MODEL || 'doubao-seed-2-0-lite-260215',
      apiKey: process.env.COZE_WORKLOAD_IDENTITY_API_KEY || '',
      baseURL: process.env.COZE_INTEGRATION_MODEL_BASE_URL || '',
      maxTokens: 1500,
      temperature: 0.7,
    },
    category: 'text',
    enabled: true,
  },
};

// 获取指定服务的模型配置
export function getModelConfig(serviceKey: string): ModelConfig {
  const service = AI_SERVICES[serviceKey];
  if (!service) {
    throw new Error(`AI服务 "${serviceKey}" 未找到`);
  }
  
  if (!service.enabled) {
    throw new Error(`AI服务 "${serviceKey}" 已禁用`);
  }

  if (!service.model.apiKey || !service.model.baseURL) {
    throw new Error(`AI服务 "${serviceKey}" 的配置不完整：缺少API Key或BaseURL`);
  }

  return service.model;
}

// 获取所有可用的AI服务
export function getAvailableServices(): AIServiceConfig[] {
  return Object.values(AI_SERVICES).filter(service => service.enabled);
}

// 按类别获取AI服务
export function getServicesByCategory(category: AIServiceConfig['category']): AIServiceConfig[] {
  return Object.values(AI_SERVICES).filter(service => 
    service.enabled && service.category === category
  );
}

// 更新服务配置（运行时）
export function updateServiceConfig(serviceKey: string, updates: Partial<AIServiceConfig>): void {
  const service = AI_SERVICES[serviceKey];
  if (service) {
    Object.assign(service, updates);
  }
}

// 验证模型配置完整性
export function validateModelConfig(config: ModelConfig): string[] {
  const errors: string[] = [];
  
  if (!config.modelName) {
    errors.push('模型名称不能为空');
  }
  
  if (!config.apiKey) {
    errors.push('API Key不能为空');
  }
  
  if (!config.baseURL) {
    errors.push('Base URL不能为空');
  }
  
  if (config.temperature < 0 || config.temperature > 2) {
    errors.push('Temperature必须在0-2之间');
  }
  
  if (config.maxTokens < 1) {
    errors.push('Max Tokens必须大于0');
  }
  
  return errors;
}
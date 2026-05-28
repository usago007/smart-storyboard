import type { AppSettings } from '@/domain/storyboard';

export function getRuntimeDataMode(): AppSettings['dataMode'] {
  return process.env.NEXT_PUBLIC_DATA_MODE === 'remote' ? 'remote' : 'mock';
}

export const SCENE_LABELS_V1 = [
  '开场问题抛出',
  '产品亮相',
  '核心卖点演示',
  '效果对比',
  '用户反馈',
  '品牌收束',
];

export const SCENE_LABELS_V2 = [
  '痛点引入',
  '解决方案呈现',
  '功能深度讲解',
  '使用场景展示',
  '用户证言',
  '品牌号召',
];

export const SHOT_PROMPT_TEMPLATE =
  '分镜{id}：{sceneLabel}，围绕"{dialogue}"展开，保持信息聚焦、镜头稳定、产品表达明确，画面风格统一。';

export const DEFAULT_FIRST_FRAME_TEMPLATE = {
  sceneDescription: '极简室内场景，主体位于画面中央。重点表现：{dialogue}。',
  characterPerformance: '角色动作克制自然，表情从困扰转为放松，突出情绪变化。',
  cameraAngle: '中近景，平视机位，轻微推进镜头强化叙事节奏。',
  lighting: '柔和主光配合侧逆光，保留产品轮廓和面部层次。',
  atmosphere: '干净、专业、可信赖。',
};

export const DEFAULT_LAST_FRAME_TEMPLATE = {
  sceneDescription: '产品与用户同框，形成问题到解决方案的清晰对照。重点表现：{dialogue}。',
  characterPerformance: '角色目光聚焦产品，动作简洁明确，强调使用效果。',
  cameraAngle: '三分法构图，稳定机位，保留足够信息量用于后续转场。',
  lighting: '明亮自然光，局部补光提升质感。',
  atmosphere: '高效、轻松、具有转化感。',
};

export const DEFAULT_APP_SETTINGS: AppSettings = {
  dataMode: getRuntimeDataMode(),
  mockDelayMs: 600,
  mockFailureRate: 0,
  language: 'zh',
  theme: 'light',

  llm: {
    baseUrl: '',
    apiKey: '',
    provider: 'custom',
    tasks: {
      polishScript: { model: '', temperature: 0.8, maxTokens: 1500, topP: 0.9, stream: true },
      shotPrompt: { model: '', temperature: 0.7, maxTokens: 2000, topP: 0.9, stream: true },
      frames: { model: '', temperature: 0.7, maxTokens: 1500, topP: 0.9, stream: true },
      batch: { model: '', temperature: 0.7, maxTokens: 2000, topP: 0.9, stream: true },
    },
  },

  imageGen: {
    baseUrl: '',
    apiKey: '',
    model: '',
    genWidth: 3840,
    genHeight: 3840,
    outputWidth: 1024,
    outputHeight: 1024,
    colorMode: 'grayscale',
    styleDescription: '铅笔手绘风格，黑白单色，高对比度',
    negativePrompt: '彩色，色彩，颜色，低对比度，模糊',
    storageMode: 'base64',
    watermark: false,
  },

  prompts: {
    sceneLabels: SCENE_LABELS_V1,
    shotPromptTemplate: SHOT_PROMPT_TEMPLATE,
    dialogueTruncationShot: 20,
    dialogueTruncationFrame: 28,
    firstFrameTemplate: DEFAULT_FIRST_FRAME_TEMPLATE,
    lastFrameTemplate: DEFAULT_LAST_FRAME_TEMPLATE,
  },

  dataPolicy: {
    sessionTtlHours: 24,
    imageCacheTtlHours: 24,
    cleanupIntervalMinutes: 60,
    maxSessionsPerUser: 50,
    exportFormat: 'json',
    exportImageResolution: '2x',
    exportFields: ['sceneId', 'dialogue', 'shotPrompt', 'firstFrame', 'lastFrame'],
  },

  brand: {
    appName: 'FatMug',
    defaultLanguage: 'zh',
    defaultTheme: 'light',
  },

  security: {
    sessionSecret: '',
    rateLimitRpm: 500,
    maxConcurrentImageGen: 10,
    corsOrigins: '',
  },
};

export const STORAGE_KEYS = {
  settings: 'smart-storyboard:settings',
  autoSession: 'smart-storyboard:auto-session',
  manualSession: 'smart-storyboard:manual-session',
} as const;

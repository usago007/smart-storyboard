import type { Scene, StoryboardSession } from '@/domain/storyboard';

export const demoScripts = [
  '每天坚持使用，肌肤焕发自然光彩。温和配方，深层滋养，让美丽从内而外绽放。选择我们，选择自信与美丽。',
  '创新科技，改变生活。智能设计，便捷操作，让每一天都充满可能。未来已来，你准备好了吗？',
  '新鲜食材，用心烹饪，每一口都是家的味道。传统工艺，现代口感，让味蕾记住这一刻的美好。',
];

export const frameTemplates = [
  {
    sceneDescription: '极简室内场景，主体位于画面中央，背景保持留白与品牌识别度。',
    characterPerformance: '角色动作克制自然，表情从困扰转为放松，突出情绪变化。',
    cameraAngle: '中近景，平视机位，轻微推进镜头强化叙事节奏。',
    lighting: '柔和主光配合侧逆光，保留产品轮廓和面部层次。',
    atmosphere: '干净、专业、可信赖。',
  },
  {
    sceneDescription: '产品与用户同框，形成问题到解决方案的清晰对照。',
    characterPerformance: '角色目光聚焦产品，动作简洁明确，强调使用效果。',
    cameraAngle: '三分法构图，稳定机位，保留足够信息量用于后续转场。',
    lighting: '明亮自然光，局部补光提升质感。',
    atmosphere: '高效、轻松、具有转化感。',
  },
];

export function buildFixtureScenes(duration: number): Scene[] {
  return [1, 2, 3].map((id) => ({
    id,
    name: `分镜${id}（${duration}秒）`,
    dialogue: `这是第 ${id} 个演示分镜，用于展示前端完全脱离后端后的 mock 数据流。`,
    duration,
    shotPrompt: `分镜${id}：主体先展示问题场景，再切换到产品介入，最后给出效果特写与行动号召。`,
    firstFrame: frameTemplates[0],
    lastFrame: frameTemplates[1],
    firstFrameImage: `https://placehold.co/1024x1024/111111/FFFFFF?text=Scene+${id}+First`,
    lastFrameImage: `https://placehold.co/1024x1024/111111/FFFFFF?text=Scene+${id}+Last`,
  }));
}

export function buildFixtureSession(sessionType: StoryboardSession['sessionType']): StoryboardSession {
  const duration = sessionType === 'auto' ? 10 : 5;

  return {
    sessionType,
    script: demoScripts[0],
    duration,
    wordCount: duration === 10 ? 89 : 42,
    scenes: buildFixtureScenes(duration),
    updatedAt: new Date().toISOString(),
  };
}

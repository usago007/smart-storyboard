import type { FramePrompt, Scene } from '@/domain/storyboard';
import { demoScripts, frameTemplates } from './fixtures';

const sceneTemplates = [
  '开场问题抛出',
  '产品亮相',
  '核心卖点演示',
  '效果对比',
  '用户反馈',
  '品牌收束',
];

export function normalizeScript(script: string): string {
  return script.trim().replace(/\s+/g, ' ');
}

export function generateScenes(script: string, duration: number): Scene[] {
  const normalized = normalizeScript(script) || demoScripts[0];
  const parts = normalized.split(/[。！？!?,，；;\n]/).map((item) => item.trim()).filter(Boolean);
  const total = Math.min(Math.max(parts.length || 3, 3), 6);

  return Array.from({ length: total }, (_, index) => ({
    id: index + 1,
    name: `分镜${index + 1}（${duration}秒）`,
    dialogue: parts[index] || `${normalized.slice(0, 42)}...`,
    duration,
  }));
}

export function generateShotPrompt(scene: Scene): string {
  return `${scene.name}：${sceneTemplates[(scene.id - 1) % sceneTemplates.length]}，围绕“${scene.dialogue}”展开，保持信息聚焦、镜头稳定、产品表达明确，画面风格统一为高对比黑白故事板。`;
}

export function generateFramePrompt(scene: Scene, frameType: 'first' | 'last'): FramePrompt {
  const template = frameTemplates[frameType === 'first' ? 0 : 1];

  return {
    ...template,
    sceneDescription: `${template.sceneDescription} 重点表现：${scene.dialogue.slice(0, 28)}。`,
  };
}

export function generateImageUrl(scene: Scene, frameType: 'first' | 'last'): string {
  const label = frameType === 'first' ? 'First' : 'Last';

  return `https://placehold.co/1024x1024/111111/FFFFFF?text=Scene+${scene.id}+${label}`;
}

export function generateImportedContent(url: string): string {
  return `从链接 ${url} 提取的模拟文案：这是一段用于演示的网页导入内容，已经按前端 mock 数据流程生成，可直接继续拆分分镜。`;
}

export function polishScript(script: string): string {
  const normalized = normalizeScript(script);

  return `【润色版】${normalized}。语气更凝练，节奏更利于分镜拆分，卖点表达更直接。`;
}

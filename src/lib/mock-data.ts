export interface MockScene {
  id: number;
  name: string;
  dialogue: string;
  duration: number;
  prompt: string;
  imageUrl: string;
}

export interface MockSession {
  id: string;
  sessionId: string;
  scriptContent: string;
  duration: number;
  scenes: MockScene[];
  sceneType: string;
  createdAt: Date;
  expiresAt: Date;
}

export function generateMockScenes(script: string, duration: number): MockScene[] {
  const lines = script.split(/[\n,，]/).filter((line) => line.trim());

  const wordCountMap: Record<number, [number, number]> = {
    5: [10, 15],
    10: [20, 30],
    12: [25, 35],
  };

  const [minWords, maxWords] = wordCountMap[duration] || [15, 25];

  const sceneTemplates = [
    { name: '开场', prompt: '产品展示，干净明亮的背景' },
    { name: '问题呈现', prompt: '用户遇到困扰，表情焦虑' },
    { name: '解决方案', prompt: '产品出现，光线聚焦' },
    { name: '效果展示', prompt: '使用后效果对比，前后对比' },
    { name: '产品特写', prompt: '产品细节特写，专业打光' },
    { name: '用户反馈', prompt: '用户满意微笑，轻松氛围' },
    { name: '品牌展示', prompt: '品牌logo展示，专业商务风格' },
    { name: '行动呼吁', prompt: '购买引导，简洁有力' },
  ];

  const sceneCount = Math.min(Math.max(lines.length, 3), 8);

  const scenes: MockScene[] = [];
  for (let i = 0; i < sceneCount; i++) {
    const line = lines[i % lines.length].trim();
    const truncatedLine =
      line.length > maxWords ? line.slice(0, maxWords) : line;

    const template = sceneTemplates[i % sceneTemplates.length];

    scenes.push({
      id: i + 1,
      name: `${template.name} ${i + 1}`,
      dialogue: truncatedLine,
      duration,
      prompt: template.prompt,
      imageUrl: `https://placehold.co/1024x1024/333/fff?text=Scene+${i + 1}`,
    });
  }

  return scenes;
}

export async function simulateImageGeneration(prompt: string): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const sceneMatch = prompt.match(/Scene\s*(\d+)/i);
  const sceneNum = sceneMatch ? sceneMatch[1] : Math.floor(Math.random() * 10) + 1;

  return `https://placehold.co/1024x1024/333/fff?text=Scene+${sceneNum}`;
}

export async function simulateAIResponse(
  input: string,
  type: 'polish' | 'prompt' | 'batch'
): Promise<string> {
  const delay = 500 + Math.random() * 500;
  await new Promise((resolve) => setTimeout(resolve, delay));

  switch (type) {
    case 'polish':
      return `【优化后】${input}\n\n优化说明：\n1. 增强了情感表达，让对白更具感染力\n2. 调整了语序，使逻辑更清晰\n3. 精简了冗余表述，更符合广告语风格`;

    case 'prompt':
      return `拍摄指导：\n1. 场景：简洁明亮的室内环境\n2. 光线：自然光为主，侧光补光\n3. 构图：三分法构图，主体位于黄金分割点\n4. 风格：黑白铅笔手绘素描，单色线条艺术\n5. 视角：平视角度，突出主体`;

    case 'batch':
      return JSON.stringify({
        scenes: [
          {
            id: 1,
            prompt: '产品展示，干净明亮的背景，黑白素描风格',
            firstFrameImage: 'https://placehold.co/1024x1024/333/fff?text=Scene+1+First',
            lastFrameImage: 'https://placehold.co/1024x1024/333/fff?text=Scene+1+Last',
          },
          {
            id: 2,
            prompt: '用户遇到困扰，表情焦虑，黑白素描风格',
            firstFrameImage: 'https://placehold.co/1024x1024/333/fff?text=Scene+2+First',
            lastFrameImage: 'https://placehold.co/1024x1024/333/fff?text=Scene+2+Last',
          },
          {
            id: 3,
            prompt: '产品出现，光线聚焦，黑白素描风格',
            firstFrameImage: 'https://placehold.co/1024x1024/333/fff?text=Scene+3+First',
            lastFrameImage: 'https://placehold.co/1024x1024/333/fff?text=Scene+3+Last',
          },
        ],
      });

    default:
      return `模拟AI响应：${input}`;
  }
}

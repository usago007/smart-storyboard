import { NextRequest, NextResponse } from 'next/server';
import { simulateAIResponse } from '@/lib/mock-data';

interface GenerateShotPromptRequest {
  sceneId: number;
  dialogue: string;
  duration: number;
}

export async function POST(request: NextRequest) {
  try {
    const { sceneId, dialogue, duration }: GenerateShotPromptRequest = await request.json();

    if (!dialogue || !duration) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      );
    }

    if (process.env.DEMO_MODE === 'true') {
      const shotPrompt = await simulateAIResponse(dialogue, 'prompt');
      return NextResponse.json({
        success: true,
        shot_prompt: shotPrompt,
        demo: true
      });
    }

    const { LLMClient, Config, HeaderUtils } = await import('coze-coding-dev-sdk');

    console.log(`开始生成分镜${sceneId}的镜头提示词...`);

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const client = new LLMClient(config, customHeaders);

    const messages = [
      {
        role: 'system' as const,
        content: `请为以下广告分镜生成详细且专业的镜头提示词，用于指导视频制作团队。

分镜信息：
- 分镜编号：${sceneId}
- 分镜对白："${dialogue}"
- 分镜时长：${duration}秒

请生成一个精简的镜头提示词（严格控制在500字符以内），必须包含以下要素：
1. 场景设置（简述环境、背景）
2. 角色表演（动作、表情、情绪）
3. 镜头语言（景别、角度、运动）
4. 视觉风格（色调、光线、构图）
5. 关键道具和细节

要求：
- 严格控制在500字符以内（含标点符号）
- 语言要精炼专业，便于制作团队执行
- 要符合分镜时长的节奏要求
- 要与对白内容高度匹配
- 避免冗余描述，突出核心信息

请直接返回镜头提示词内容，不要添加任何解释或格式标记：`
      },
      {
        role: 'user' as const,
        content: `请为以下分镜生成镜头提示词（500字符以内）：分镜${sceneId}，对白："${dialogue}"，${duration}秒`
      }
    ];

    const response = await client.invoke(messages, {
      model: 'doubao-seed-2-0-lite-260215',
      temperature: 0.7,
    });

    if (!response.content) {
      throw new Error('LLM返回的镜头提示词为空');
    }

    const maxLength = 500;
    const truncatedShotPrompt = response.content.length > maxLength 
      ? response.content.substring(0, maxLength) 
      : response.content;

    console.log(`分镜${sceneId}镜头提示词生成完成，长度：${truncatedShotPrompt.length}字符`);

    return NextResponse.json({
      success: true,
      shot_prompt: truncatedShotPrompt
    });

  } catch (error) {
    console.error('生成镜头提示词失败:', error);
    return NextResponse.json(
      { success: false, error: '生成镜头提示词失败，请重试' },
      { status: 500 }
    );
  }
}

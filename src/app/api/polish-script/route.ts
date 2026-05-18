import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

interface PolishScriptRequest {
  script: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: PolishScriptRequest = await request.json();
    const { script } = body;

    if (!script || script.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: '请提供要润色的广告对白' },
        { status: 400 }
      );
    }

    if (script.length > 3000) {
      return NextResponse.json(
        { 
          success: false, 
          error: `广告对白内容超长（当前${script.length}字符，最多3000字符）。建议：拆分为多个段落或精简内容后再进行润色。` 
        },
        { status: 400 }
      );
    }

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const client = new LLMClient(config, customHeaders);

    const systemPrompt = `你是一位专业的广告文案编辑师，擅长优化和润色广告对白内容。你的任务是：

1. 保持原文的核心信息和品牌调性
2. 优化语言表达，使其更加流畅、有吸引力
3. 增强文案的感染力和说服力
4. 确保语言简洁明了，符合口语化表达
5. 保持原有的长度和结构，不要大幅增加或减少内容

请直接返回润色后的广告对白，不要添加任何解释或说明。`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: `请润色以下广告对白：\n\n${script}` }
    ];

    const response = await client.invoke(messages, {
      model: 'doubao-seed-2-0-lite-260215',
      temperature: 0.8,
    });

    return NextResponse.json({
      success: true,
      polishedScript: response.content.trim(),
    });

  } catch (error) {
    console.error('AI润色失败:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'AI润色服务暂时不可用，请稍后重试' 
      },
      { status: 500 }
    );
  }
}
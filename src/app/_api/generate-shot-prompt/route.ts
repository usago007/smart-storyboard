import { NextRequest, NextResponse } from 'next/server';
import { simulateAIResponse } from '@/lib/mock-data';

interface GenerateShotPromptRequest {
  dialogue: string;
}

export async function POST(request: NextRequest) {
  try {
    const { dialogue }: GenerateShotPromptRequest = await request.json();

    if (!dialogue) {
      return NextResponse.json({ success: false, error: '缺少必要参数' }, { status: 400 });
    }

    const shotPrompt = await simulateAIResponse(dialogue, 'prompt');
    return NextResponse.json({
      success: true,
      shot_prompt: shotPrompt,
      demo: true,
    });
  } catch (error) {
    console.error('生成镜头提示词失败:', error);
    return NextResponse.json({ success: false, error: '生成镜头提示词失败，请重试' }, { status: 500 });
  }
}

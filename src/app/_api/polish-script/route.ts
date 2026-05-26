import { NextRequest, NextResponse } from 'next/server';
import { simulateAIResponse } from '@/lib/mock-data';

interface PolishScriptRequest {
  script: string;
}

export async function POST(request: NextRequest) {
  try {
    const { script }: PolishScriptRequest = await request.json();

    if (!script || script.trim().length === 0) {
      return NextResponse.json({ success: false, error: '请提供要润色的广告对白' }, { status: 400 });
    }

    const polished = await simulateAIResponse(script, 'polish');
    return NextResponse.json({
      success: true,
      polishedScript: polished,
      demo: true,
    });
  } catch (error) {
    console.error('AI润色失败:', error);
    return NextResponse.json({ success: false, error: 'AI润色服务暂时不可用，请稍后重试' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { sessionManager } from '@/storage/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { scenes } = body;

    if (!scenes || !Array.isArray(scenes)) {
      return NextResponse.json({
        success: false,
        error: '缺少必要参数: scenes'
      }, { status: 400 });
    }

    // 创建手工分镜session
    const sessionData = await sessionManager.createSession({
      scriptContent: 'Manual Create',
      duration: 5,
      sceneType: 'manual',
      scenes: scenes.map((scene: any, index: number) => ({
        id: index + 1,
        name: scene.name,
        dialogue: scene.dialogue,
        duration: scene.duration,
        shot_prompt: scene.shot_prompt,
        first_frame: scene.first_frame,
        last_frame: scene.last_frame
      }))
    });

    return NextResponse.json({
      success: true,
      sessionId: sessionData.sessionId
    });

  } catch (error) {
    console.error('创建手工分镜session失败:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '服务器内部错误'
    }, { status: 500 });
  }
}

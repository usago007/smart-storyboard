import { NextRequest, NextResponse } from 'next/server';
import { sessionManager } from '@/storage/database';

interface GenerateRequest {
  scenes: Array<{
    id: string;
    name: string;
    dialogue: string;
    duration: number;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const { scenes }: GenerateRequest = await request.json();

    if (!scenes || scenes.length === 0) {
      return NextResponse.json(
        { success: false, error: '分镜数据不能为空' },
        { status: 400 }
      );
    }

    // 创建会话，标记为手工创建
    const sessionId = await sessionManager.createSession({
      sessionId: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      scriptContent: scenes.map(s => s.dialogue).join('\n'),
      duration: scenes.reduce((sum, scene) => sum + scene.duration, 0),
      scenes: scenes,
      sceneType: 'manual',
      sourceData: { scenes, createdAt: new Date().toISOString() }
    });

    console.log(`手工创建分镜生成会话: ${sessionId}，包含 ${scenes.length} 个分镜`);

    return NextResponse.json({
      success: true,
      sessionId: sessionId,
      sceneCount: scenes.length,
      totalDuration: scenes.reduce((sum, scene) => sum + scene.duration, 0),
      message: '分镜创建成功，正在跳转到结果页面'
    });

  } catch (error) {
    console.error('手工创建分镜生成失败:', error);
    return NextResponse.json(
      { success: false, error: '生成失败，请重试' },
      { status: 500 }
    );
  }
}
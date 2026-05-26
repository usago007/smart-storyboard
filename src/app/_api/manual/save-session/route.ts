import { NextRequest, NextResponse } from 'next/server';
import { sessionManager } from '@/storage/database';
import { eq, and, gt } from 'drizzle-orm';
import { getDb } from '@/storage/database/db';
import { userGenerationSessions } from '@/storage/database/shared/schema';

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

    const sessionId = sessionManager.getSessionId();

    if (process.env.DEMO_MODE === 'true') {
      return NextResponse.json({
        success: true,
        sessionId,
        demo: true
      });
    }

    const db = await getDb();
    
    const [updatedSession] = await db!
      .update(userGenerationSessions)
      .set({
        scenes: scenes.map((scene: any, index: number) => ({
          id: index + 1,
          name: scene.name,
          dialogue: scene.dialogue,
          duration: scene.duration,
          shot_prompt: scene.shot_prompt,
          first_frame: scene.first_frame,
          last_frame: scene.last_frame,
          first_frame_image: scene.first_frame_image,
          last_frame_image: scene.last_frame_image
        }))
      })
      .where(and(
        eq(userGenerationSessions.sessionId, sessionId),
        eq(userGenerationSessions.sceneType, 'manual'),
        gt(userGenerationSessions.expiresAt, new Date())
      ))
      .returning();

    if (!updatedSession) {
      return NextResponse.json({
        success: false,
        error: '未找到会话数据'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      sessionId: updatedSession.sessionId
    });

  } catch (error) {
    console.error('保存手工分镜session失败:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '服务器内部错误'
    }, { status: 500 });
  }
}

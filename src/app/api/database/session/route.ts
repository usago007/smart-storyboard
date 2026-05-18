import { NextRequest, NextResponse } from 'next/server';
import { sessionManager, imageGenerationManager } from '@/storage/database';

// GET - 获取会话数据
export async function GET(request: NextRequest) {
  try {
    // 获取查询参数中的sessionId或scene_type
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const sceneTypeParam = searchParams.get('scene_type'); // 'auto' | 'manual'
    
    let sessionData;
    if (sessionId) {
      // 如果提供了sessionId，通过数据库查询
      console.log('Looking for session with ID:', sessionId);
      sessionData = await sessionManager.restoreFromDatabase(sessionId);
      console.log('Session data found:', sessionData ? 'YES' : 'NO');
    } else if (sceneTypeParam && (sceneTypeParam === 'auto' || sceneTypeParam === 'manual')) {
      // 如果提供了scene_type，查询匹配类型的会话
      sessionData = await sessionManager.getSessionByType(sceneTypeParam as 'auto' | 'manual');
      console.log(`Looking for ${sceneTypeParam} session, found:`, sessionData ? 'YES' : 'NO');
    } else {
      // 否则使用当前会话
      sessionData = await sessionManager.getCurrentSession();
    }
    
    if (!sessionData) {
      return NextResponse.json({
        success: false,
        error: '未找到会话数据'
      }, { status: 404 });
    }

    // 获取图片生成记录
    const imageRecords = await imageGenerationManager.getSessionGenerations(
      sessionData.sessionId
    );

    // 更新场景的图片URL
    const updatedScenes = (sessionData.scenes as any[]).map((scene: any) => {
      const firstFrameRecord = imageRecords.find(
        record => record.sceneId === scene.id && record.frameType === 'first'
      );
      const lastFrameRecord = imageRecords.find(
        record => record.sceneId === scene.id && record.frameType === 'last'
      );
      
      return {
        ...scene,
        firstFrameImage: firstFrameRecord?.imageUrl,
        lastFrameImage: lastFrameRecord?.imageUrl,
        imageGenerating: {
          firstFrame: firstFrameRecord?.status === 'generating',
          lastFrame: lastFrameRecord?.status === 'generating'
        },
        imageError: {
          firstFrame: firstFrameRecord?.status === 'failed' ? firstFrameRecord.errorMessage : undefined,
          lastFrame: lastFrameRecord?.status === 'failed' ? lastFrameRecord.errorMessage : undefined
        }
      };
    });

    return NextResponse.json({
      success: true,
      sessionData: {
        ...sessionData,
        scenes: updatedScenes
      }
    });

  } catch (error) {
    console.error('获取会话数据失败:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '服务器内部错误'
    }, { status: 500 });
  }
}

// POST - 创建或更新会话
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { scriptContent, duration, scenes } = body;

    if (!scriptContent || !duration || !scenes) {
      return NextResponse.json({
        success: false,
        error: '缺少必要参数'
      }, { status: 400 });
    }

    const sessionData = await sessionManager.createSession({
      scriptContent,
      duration,
      scenes
    });

    return NextResponse.json({
      success: true,
      sessionData
    });

  } catch (error) {
    console.error('创建会话失败:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '服务器内部错误'
    }, { status: 500 });
  }
}

// PUT - 更新会话
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { scriptContent, duration, scenes } = body;

    const updatedSession = await sessionManager.updateSession({
      scriptContent,
      duration,
      scenes
    });

    if (!updatedSession) {
      return NextResponse.json({
        success: false,
        error: '未找到会话数据'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      sessionData: updatedSession
    });

  } catch (error) {
    console.error('更新会话失败:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '服务器内部错误'
    }, { status: 500 });
  }
}

// DELETE - 删除会话
export async function DELETE(request: NextRequest) {
  try {
    const success = await sessionManager.deleteCurrentSession();

    return NextResponse.json({
      success
    });

  } catch (error) {
    console.error('删除会话失败:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '服务器内部错误'
    }, { status: 500 });
  }
}
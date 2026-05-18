import { NextRequest, NextResponse } from 'next/server';
import { cleanupService } from '@/storage/database';

// GET - 获取清理统计信息
export async function GET(request: NextRequest) {
  try {
    // DEMO 模式直接返回成功
    if (process.env.DEMO_MODE === 'true') {
      return NextResponse.json({
        success: true,
        stats: { cleaned: 0 },
        isActive: false
      });
    }

    const stats = await cleanupService.getCleanupStats();
    const isActive = cleanupService.isCleanupActive();

    return NextResponse.json({
      success: true,
      stats,
      isActive
    });

  } catch (error) {
    console.error('获取清理统计失败:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '服务器内部错误'
    }, { status: 500 });
  }
}

// POST - 手动触发清理
export async function POST(request: NextRequest) {
  try {
    // DEMO 模式直接返回成功
    if (process.env.DEMO_MODE === 'true') {
      return NextResponse.json({
        success: true,
        message: 'Demo 模式无需清理'
      });
    }

    const result = await cleanupService.triggerManualCleanup();

    return NextResponse.json(result);

  } catch (error) {
    console.error('手动清理失败:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '服务器内部错误'
    }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';

interface GenerateFramesRequest {
  frameType?: 'first' | 'last';
}

const mockFrame = {
  scene_description: '简洁明亮的室内环境，自然光线充足，主体清晰突出。',
  character_performance: '角色动作自然，情绪从问题感过渡到轻松自信。',
  camera_angle: '中近景平视机位，构图稳定，保留清晰叙事焦点。',
  lighting: '自然主光配合柔和补光，强调主体轮廓与产品细节。',
  atmosphere: '专业、可信、具有明显转化感。',
};

export async function POST(request: NextRequest) {
  try {
    const { frameType }: GenerateFramesRequest = await request.json();

    if (frameType === 'last') {
      return NextResponse.json({
        success: true,
        last_frame: {
          scene_description: mockFrame.scene_description,
          character_performance: '角色完成动作后停留在结果状态，情绪稳定积极。',
          camera_angle: mockFrame.camera_angle,
          lighting: mockFrame.lighting,
        },
        demo: true,
      });
    }

    if (frameType === 'first' || frameType === undefined) {
      return NextResponse.json({
        success: true,
        first_frame: mockFrame,
        demo: true,
      });
    }

    return NextResponse.json({ success: false, error: 'frameType参数值无效' }, { status: 400 });
  } catch (error) {
    console.error('生成首尾帧失败:', error);
    return NextResponse.json({ success: false, error: '生成首尾帧失败，请重试' }, { status: 500 });
  }
}

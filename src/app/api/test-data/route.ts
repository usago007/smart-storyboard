import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // 创建测试分镜数据
  const testData = {
    scenes: [
      {
        id: 1,
        duration: 10,
        dialogue: "欢迎使用广告对白分镜工具，这是一个测试对白，用于验证编辑和删除功能。",
        shotPrompt: "产品展示特写镜头，突出产品特点和质量",
        firstFramePrompt: "明亮的产品包装特写，品牌标志清晰可见",
        lastFramePrompt: "产品与用户互动场景，展示使用效果"
      },
      {
        id: 2,
        duration: 5,
        dialogue: "第二个分镜的测试对白内容。",
        shotPrompt: "人物使用产品的场景",
        firstFramePrompt: "用户开心使用产品",
        lastFramePrompt: "产品效果展示"
      },
      {
        id: 3,
        duration: 12,
        dialogue: "第三个分镜是对白内容，用于测试长时长的分镜编辑功能，确保字符限制正常工作。",
        shotPrompt: "多角度产品展示场景",
        firstFramePrompt: "产品全貌展示",
        lastFramePrompt: "产品使用后的满意效果"
      }
    ]
  };

  return NextResponse.json(testData);
}
import { NextRequest, NextResponse } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';

interface BatchGenerateRequest {
  scenes: Array<{
    id: number;
    dialogue: string;
    duration: number;
  }>;
  type: 'shot_prompt' | 'frames';
}

async function callLLM(messages: any[], config: any) {
  const apiKey = process.env.COZE_WORKLOAD_IDENTITY_API_KEY;
  const baseURL = process.env.COZE_INTEGRATION_MODEL_BASE_URL;
  
  if (!baseURL || !apiKey) {
    throw new Error("Missing environment variables");
  }

  const llm = new ChatOpenAI({
    modelName: config.model || "doubao-seed-2-0-lite-260215",
    apiKey: apiKey,
    configuration: {
      baseURL: baseURL,
    },
    streaming: true,
    temperature: config.temperature || 0.7,
    maxTokens: config.max_tokens || 1000,
    modelKwargs: {
      thinking: {
        type: "disabled",
      },
    },
  });

  const stream = await llm.stream(messages);
  let fullContent = "";
  for await (const chunk of stream) {
    fullContent += chunk.content;
  }
  return fullContent;
}

async function generateShotPrompt(sceneId: number, dialogue: string, duration: number) {
  console.log(`开始生成分镜${sceneId}的镜头提示词...`);

  const shotPrompt = await callLLM([
    new SystemMessage(`请为以下广告分镜生成详细且专业的镜头提示词，用于指导视频制作团队。

分镜信息：
- 分镜编号：${sceneId}
- 分镜对白："${dialogue}"
- 分镜时长：${duration}秒

请生成一个精简的镜头提示词（严格控制在500字符以内），必须包含以下要素：
1. 场景设置（简述环境、背景）
2. 角色表演（动作、表情、情绪）
3. 镜头语言（景别、角度、运动）
4. 视觉风格（色调、光线、构图）
5. 关键道具和细节

要求：
- 严格控制在500字符以内（含标点符号）
- 语言要精炼专业，便于制作团队执行
- 要符合分镜时长的节奏要求
- 要与对白内容高度匹配
- 避免冗余描述，突出核心信息

请直接返回镜头提示词内容，不要添加任何解释或格式标记：`),
    new HumanMessage(`请为以下分镜生成镜头提示词（500字符以内）：分镜${sceneId}，对白："${dialogue}"，${duration}秒`)
  ], {
    model: "doubao-seed-2-0-lite-260215",
    temperature: 0.7,
    max_tokens: 800
  });

  if (!shotPrompt) {
    throw new Error('LLM返回的镜头提示词为空');
  }

  // 强制截断到500字符
  const maxLength = 500;
  const truncatedShotPrompt = shotPrompt.length > maxLength
    ? shotPrompt.substring(0, maxLength)
    : shotPrompt;

  console.log(`分镜${sceneId}镜头提示词生成完成，长度：${truncatedShotPrompt.length}字符`);
  return { sceneId, shot_prompt: truncatedShotPrompt };
}

async function generateFrames(sceneId: number, dialogue: string, duration: number) {
  console.log(`开始生成分镜${sceneId}的首尾帧提示词...`);
  
  const [firstFrameContent, lastFrameContent] = await Promise.all([
    // 生成首帧
    callLLM([
      new SystemMessage(`请为以下广告分镜生成首帧的详细提示词，用于指导视频制作的开头画面。

分镜信息：
- 分镜编号：${sceneId}
- 分镜对白："${dialogue}"
- 分镜时长：${duration}秒

请按照以下JSON格式返回首帧的详细提示词：

{
  "first_frame": {
    "scene_description": "首帧场景描述（环境、背景、道具等）",
    "character_performance": "首帧角色表演（动作、表情、起始状态）",
    "camera_angle": "首帧镜头角度（景别、拍摄角度、构图）",
    "lighting": "首帧光线设置（主光、辅光、氛围光）",
    "atmosphere": "首帧氛围描述（整体感觉、情绪基调）"
  }
}

要求：
1. 要符合分镜对白的内容和情感基调
2. 场景描述要具体且可执行
3. 表演指导要详细且专业
4. 镜头和光线设置要符合行业标准
5. 要体现角色表演的起始状态
6. 请严格按照JSON格式返回，不要添加任何其他内容

分镜对白："${dialogue}"

请生成符合要求的首帧提示词：`),
      new HumanMessage(`请为分镜${sceneId}生成首帧提示词`)
    ], {
      model: "doubao-seed-2-0-lite-260215",
      temperature: 0.7,
      max_tokens: 1500
    }),
    
    // 生成尾帧
    callLLM([
      new SystemMessage(`请为以下广告分镜生成尾帧的详细提示词，用于指导视频制作的结尾画面。

分镜信息：
- 分镜编号：${sceneId}
- 分镜对白："${dialogue}"
- 分镜时长：${duration}秒

请按照以下JSON格式返回尾帧的详细提示词：

{
  "last_frame": {
    "scene_description": "尾帧场景描述（环境变化、最终状态）",
    "character_performance": "尾帧角色表演（动作、表情、结束状态）",
    "camera_angle": "尾帧镜头角度（景别、拍摄角度、构图）",
    "lighting": "尾帧光线设置（主光、辅光、氛围光）"
  }
}

要求：
1. 要符合分镜对白的内容和情感基调
2. 场景描述要具体且可执行
3. 表演指导要详细且专业
4. 镜头和光线设置要符合行业标准
5. 要体现角色表演的结束状态和成果
6. 请严格按照JSON格式返回，不要添加任何其他内容

分镜对白："${dialogue}"

请生成符合要求的尾帧提示词：`),
      new HumanMessage(`请为分镜${sceneId}生成尾帧提示词`)
    ], {
      model: "doubao-seed-2-0-lite-260215",
      temperature: 0.7,
      max_tokens: 1500
    })
  ]);

  // 解析首帧结果
  let firstFrame;
  try {
    const jsonMatch = firstFrameContent.match(/\{[\s\S]*\}/);
    const jsonContent = jsonMatch ? jsonMatch[0] : firstFrameContent;
    const parsed = JSON.parse(jsonContent);
    firstFrame = parsed.first_frame;

    if (!firstFrame) {
      throw new Error('首帧数据缺失');
    }

    const requiredFields = ['scene_description', 'character_performance', 'camera_angle', 'lighting', 'atmosphere'];
    for (const field of requiredFields) {
      if (!firstFrame[field]) {
        firstFrame[field] = '待补充';
      }
    }
  } catch (error) {
    console.error('解析首帧JSON失败:', error);
    firstFrame = {
      scene_description: '根据对白内容设置相应场景',
      character_performance: '角色开始表演的初始状态',
      camera_angle: '中景，正面拍摄',
      lighting: '自然光，明亮清晰',
      atmosphere: '温馨积极的氛围'
    };
  }

  // 解析尾帧结果
  let lastFrame;
  try {
    const jsonMatch = lastFrameContent.match(/\{[\s\S]*\}/);
    const jsonContent = jsonMatch ? jsonMatch[0] : lastFrameContent;
    const parsed = JSON.parse(jsonContent);
    lastFrame = parsed.last_frame;

    if (!lastFrame) {
      throw new Error('尾帧数据缺失');
    }

    const requiredFields = ['scene_description', 'character_performance', 'camera_angle', 'lighting'];
    for (const field of requiredFields) {
      if (!lastFrame[field]) {
        lastFrame[field] = '待补充';
      }
    }
  } catch (error) {
    console.error('解析尾帧JSON失败:', error);
    lastFrame = {
      scene_description: '场景的最终状态',
      character_performance: '角色表演的结束状态',
      camera_angle: '中景，保持一致性',
      lighting: '自然光，保持氛围'
    };
  }

  console.log(`分镜${sceneId}首尾帧提示词生成完成`);
  return { 
    sceneId, 
    first_frame: firstFrame,
    last_frame: lastFrame
  };
}

export async function POST(request: NextRequest) {
  try {
    const { scenes, type, sessionId }: BatchGenerateRequest & { sessionId?: string } = await request.json();

    if (!scenes || scenes.length === 0) {
      return NextResponse.json(
        { success: false, error: '缺少分镜数据' },
        { status: 400 }
      );
    }

    console.log(`开始批量生成${type === 'shot_prompt' ? '镜头提示词' : '首尾帧提示词'}，共${scenes.length}个分镜`);

    let results: any[] = [];
    const errors: Array<{sceneId: number, error: string}> = [];
    const completedScenes: number[] = [];

    if (type === 'shot_prompt') {
      // 串行生成镜头提示词，以便跟踪进度
      for (const scene of scenes) {
        try {
          completedScenes.push(scene.id);
          const result = await generateShotPrompt(scene.id, scene.dialogue, scene.duration);
          results.push(result);
          
          // 可以通过WebSocket或其他机制实时推送进度，这里暂时使用日志
          console.log(`分镜${scene.id}完成，进度：${completedScenes.length}/${scenes.length}`);
          
        } catch (error) {
          console.error(`分镜${scene.id}生成镜头提示词失败:`, error);
          errors.push({
            sceneId: scene.id,
            error: error instanceof Error ? error.message : '生成失败'
          });
        }
      }
      
    } else if (type === 'frames') {
      // 串行生成首尾帧，以便跟踪进度
      for (const scene of scenes) {
        try {
          completedScenes.push(scene.id);
          const result = await generateFrames(scene.id, scene.dialogue, scene.duration);
          results.push(result);
          
          // 可以通过WebSocket或其他机制实时推送进度，这里暂时使用日志
          console.log(`分镜${scene.id}完成，进度：${completedScenes.length}/${scenes.length}`);
          
        } catch (error) {
          console.error(`分镜${scene.id}生成首尾帧失败:`, error);
          errors.push({
            sceneId: scene.id,
            error: error instanceof Error ? error.message : '生成失败'
          });
        }
      }
    } else {
      return NextResponse.json(
        { success: false, error: '无效的生成类型' },
        { status: 400 }
      );
    }

    console.log(`批量生成完成：成功${results.length}个，失败${errors.length}个`);

    return NextResponse.json({
      success: true,
      results: results,
      errors: errors,
      total: scenes.length,
      success_count: results.length,
      error_count: errors.length,
      completed_scenes: completedScenes // 返回已完成的分镜ID列表
    });

  } catch (error) {
    console.error('批量生成失败:', error);
    return NextResponse.json(
      { success: false, error: '批量生成失败，请重试' },
      { status: 500 }
    );
  }
}
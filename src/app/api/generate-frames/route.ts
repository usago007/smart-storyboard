import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

interface GenerateFramesRequest {
  sceneId: number;
  dialogue: string;
  duration: number;
  frameType?: 'first' | 'last';
}

async function callLLM(request: NextRequest, messages: Array<{role: 'system' | 'user' | 'assistant', content: string}>, config: any) {
  const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
  const llmConfig = new Config();
  const client = new LLMClient(llmConfig, customHeaders);

  const response = await client.invoke(messages, {
    model: config.model || 'doubao-seed-2-0-lite-260215',
    temperature: config.temperature || 0.7,
  });

  return response.content;
}

export async function POST(request: NextRequest) {
  try {
    const { sceneId, dialogue, duration, frameType }: GenerateFramesRequest = await request.json();

    // 参数验证
    if (!dialogue || !duration) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 验证frameType参数
    if (frameType !== undefined && frameType !== 'first' && frameType !== 'last') {
      return NextResponse.json(
        { success: false, error: 'frameType参数值无效，必须是"first"或"last"' },
        { status: 400 }
      );
    }

    if (frameType === 'first') {
      console.log(`开始生成分镜${sceneId}的首帧提示词...`);
      
      const content = await callLLM(request, [
        {
          role: 'system',
          content: `请为以下广告分镜生成首帧的详细提示词，用于指导视频制作的开头画面。

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
1. 每个字段严格控制在100字符以内
2. 要符合分镜对白的内容和情感基调
3. 场景描述要具体且可执行
4. 表演指导要详细且专业
5. 镜头和光线设置要符合行业标准
6. 要体现角色表演的起始状态
7. 请严格按照JSON格式返回，不要添加任何其他内容

分镜对白："${dialogue}"

请生成符合要求的首帧提示词：`
        },
        {
          role: 'user',
          content: `请为分镜${sceneId}生成首帧提示词`
        }
      ], {
        model: 'doubao-seed-2-0-lite-260215',
        temperature: 0.7,
        max_tokens: 800
      });

      if (!content) {
        throw new Error('LLM返回的首帧提示词为空');
      }

      // 解析JSON结果
      let firstFrame;
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const jsonContent = jsonMatch ? jsonMatch[0] : content;
        const parsed = JSON.parse(jsonContent);
        firstFrame = parsed.first_frame;

        if (!firstFrame) {
          throw new Error('首帧数据缺失');
        }

        // 强制截断每个字段到100字符
        const maxLength = 100;
        const requiredFields = ['scene_description', 'character_performance', 'camera_angle', 'lighting', 'atmosphere'];
        for (const field of requiredFields) {
          if (!firstFrame[field]) {
            firstFrame[field] = '待补充';
          } else if (firstFrame[field].length > maxLength) {
            firstFrame[field] = firstFrame[field].substring(0, maxLength);
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

      return NextResponse.json({
        success: true,
        first_frame: firstFrame
      });

    } else if (frameType === 'last') {
      console.log(`开始生成分镜${sceneId}的尾帧提示词...`);
      
      const content = await callLLM(request, [
        {
          role: 'system',
          content: `请为以下广告分镜生成尾帧的详细提示词，用于指导视频制作的结尾画面。

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
1. 每个字段严格控制在100字符以内
2. 要符合分镜对白的内容和情感基调
3. 场景描述要具体且可执行
4. 表演指导要详细且专业
5. 镜头和光线设置要符合行业标准
6. 要体现角色表演的结束状态和成果
7. 请严格按照JSON格式返回，不要添加任何其他内容

分镜对白："${dialogue}"

请生成符合要求的尾帧提示词：`
        },
        {
          role: 'user',
          content: `请为分镜${sceneId}生成尾帧提示词`
        }
      ], {
        model: 'doubao-seed-2-0-lite-260215',
        temperature: 0.7,
        max_tokens: 800
      });

      if (!content) {
        throw new Error('LLM返回的尾帧提示词为空');
      }

      // 解析JSON结果
      let lastFrame;
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const jsonContent = jsonMatch ? jsonMatch[0] : content;
        const parsed = JSON.parse(jsonContent);
        lastFrame = parsed.last_frame;

        if (!lastFrame) {
          throw new Error('尾帧数据缺失');
        }

        // 强制截断每个字段到100字符
        const maxLength = 100;
        const requiredFields = ['scene_description', 'character_performance', 'camera_angle', 'lighting'];
        for (const field of requiredFields) {
          if (!lastFrame[field]) {
            lastFrame[field] = '待补充';
          } else if (lastFrame[field].length > maxLength) {
            lastFrame[field] = lastFrame[field].substring(0, maxLength);
          }
        }

      } catch (error) {
        console.error('解析尾帧JSON失败:', error);
        lastFrame = {
          scene_description: '根据对白内容设置相应场景',
          character_performance: '角色表演的结束状态',
          camera_angle: '中景，正面拍摄',
          lighting: '自然光，明亮清晰'
        };
      }

      return NextResponse.json({
        success: true,
        last_frame: lastFrame
      });

    } else {
      // 默认生成首尾帧（保持向后兼容）
      console.log(`开始生成分镜${sceneId}的首帧和尾帧提示词...`);
      
      const content = await callLLM(request, [
        {
          role: 'system',
          content: `请为以下广告分镜生成首帧和尾帧的详细提示词，用于指导视频制作的关键画面。

分镜信息：
- 分镜编号：${sceneId}
- 分镜对白："${dialogue}"
- 分镜时长：${duration}秒

请按照以下JSON格式返回首帧和尾帧的详细提示词：

{
  "first_frame": {
    "scene_description": "首帧场景描述（环境、背景、道具等）",
    "character_performance": "首帧角色表演（动作、表情、起始状态）",
    "camera_angle": "首帧镜头角度（景别、拍摄角度、构图）",
    "lighting": "首帧光线设置（主光、辅光、氛围光）",
    "atmosphere": "首帧氛围描述（整体感觉、情绪基调）"
  },
  "last_frame": {
    "scene_description": "尾帧场景描述（环境变化、最终状态）",
    "character_performance": "尾帧角色表演（动作、表情、结束状态）",
    "camera_angle": "尾帧镜头角度（景别、拍摄角度、构图）",
    "lighting": "尾帧光线设置（主光、辅光、氛围光）"
  }
}

要求：
1. 每个字段严格控制在100字符以内
2. 首帧和尾帧要在内容上形成连贯性和递进关系
3. 要体现角色情绪的发展和变化
4. 要符合分镜对白的内容和情感基调
5. 场景描述要具体且可执行
6. 表演指导要详细且专业
7. 镜头和光线设置要符合行业标准
8. 请严格按照JSON格式返回，不要添加任何其他内容

分镜对白："${dialogue}"

请生成符合要求的首帧和尾帧提示词：`
        },
        {
          role: 'user',
          content: `请为分镜${sceneId}生成首帧和尾帧提示词`
        }
      ], {
        model: 'doubao-seed-2-0-lite-260215',
        temperature: 0.7,
        max_tokens: 1200
      });

      if (!content) {
        throw new Error('LLM返回的首尾帧提示词为空');
      }

      // 解析JSON结果
      let firstFrame, lastFrame;
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const jsonContent = jsonMatch ? jsonMatch[0] : content;
        const parsed = JSON.parse(jsonContent);
        
        firstFrame = parsed.first_frame;
        lastFrame = parsed.last_frame;

        // 验证结构完整性
        if (!firstFrame || !lastFrame) {
          throw new Error('首帧或尾帧数据缺失');
        }

        // 强制截断每个字段到100字符
        const maxLength = 100;
        const requiredFirstFields = ['scene_description', 'character_performance', 'camera_angle', 'lighting', 'atmosphere'];
        const requiredLastFields = ['scene_description', 'character_performance', 'camera_angle', 'lighting'];

        for (const field of requiredFirstFields) {
          if (!firstFrame[field]) {
            firstFrame[field] = '待补充';
          } else if (firstFrame[field].length > maxLength) {
            firstFrame[field] = firstFrame[field].substring(0, maxLength);
          }
        }

        for (const field of requiredLastFields) {
          if (!lastFrame[field]) {
            lastFrame[field] = '待补充';
          } else if (lastFrame[field].length > maxLength) {
            lastFrame[field] = lastFrame[field].substring(0, maxLength);
          }
        }

      } catch (error) {
        console.error('解析首尾帧JSON失败:', error);
        console.log('原始内容:', content);
        
        // 如果JSON解析失败，提供默认结构
        firstFrame = {
          scene_description: '根据对白内容设置相应场景',
          character_performance: '角色开始表演的初始状态',
          camera_angle: '中景，正面拍摄',
          lighting: '自然光，明亮清晰',
          atmosphere: '积极向上的氛围'
        };

        lastFrame = {
          scene_description: '场景的结束状态',
          character_performance: '角色表演的结束状态',
          camera_angle: '中景，保持一致的视角',
          lighting: '保持与首帧一致的灯光'
        };
      }

      return NextResponse.json({
        success: true,
        first_frame: firstFrame,
        last_frame: lastFrame
      });
    }

  } catch (error) {
    console.error('生成首尾帧失败:', error);
    return NextResponse.json(
      { success: false, error: '生成首尾帧失败，请重试' },
      { status: 500 }
    );
  }
}
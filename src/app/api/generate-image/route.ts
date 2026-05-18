import { NextRequest, NextResponse } from 'next/server';
import { 
  sessionManager, 
  imageGenerationManager 
} from '@/storage/database';
import axios from 'axios';
import { eq } from 'drizzle-orm';
import { getDb } from '@/storage/database/db';
import { userGenerationSessions } from '@/storage/database/shared/schema';
import { simulateImageGeneration } from '@/lib/mock-data';

// 图片生成API响应接口
interface ImageItem {
  url?: string;
  b64_json?: string;
  size?: string;
  error?: {
    message: string;
    code: string;
  };
}

interface ApiResponse {
  model: string;
  created: number;
  data: ImageItem[];
  usage: {
    generated_images: number;
    output_tokens: number;
    total_tokens: number;
  };
  error?: {
    message: string;
    code: string;
  };
}

// 验证图片尺寸
function validateImageSize(size: string): string {
  const validShortSizes = new Set(["2K", "4K"]);
  
  if (validShortSizes.has(size)) {
    return size;
  }

  const parts = size.split("x");
  if (parts.length !== 2) {
    return "2K";
  }

  const [widthStr, heightStr] = parts;
  if (!/^\d+$/.test(widthStr) || !/^\d+$/.test(heightStr)) {
    return "2K";
  }

  const width = parseInt(widthStr, 10);
  const height = parseInt(heightStr, 10);
  const isWidthValid = width >= 2560 && width <= 4096;
  const isHeightValid = height >= 1440 && height <= 4096;

  if (!isWidthValid || !isHeightValid) {
    return "2K";
  }

  return size;
}

/**
 * 图片生成函数
 */
async function image_generation(
  prompt: string,
  size: string = "2K",
  watermark: boolean = true,
  image: string | string[] | null = null,
  response_format: string = "url",
  optimize_prompt_mode: string = "standard",
  sequential_image_generation: string = "disabled",
  sequential_image_generation_max_images: number = 15,
): Promise<[string[], ApiResponse]> {
  
  const apiKey = process.env.COZE_WORKLOAD_IDENTITY_API_KEY;
  const baseUrl = process.env.COZE_INTEGRATION_BASE_URL;

  if (!baseUrl) {
    throw new Error("Environment variable COZE_INTEGRATION_BASE_URL is missing");
  }
  
  size = validateImageSize(size);
  
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${apiKey}`,
  };

  const requestBody = {
    model: "doubao-seedream-4-5-251128",
    prompt: prompt,
    size: size,
    watermark: watermark,
    image: image,
    response_format: response_format,
    optimize_prompt_options: {
      mode: optimize_prompt_mode,
    },
    sequential_image_generation: sequential_image_generation,
    sequential_image_generation_options: {
      max_images: sequential_image_generation_max_images,
    },
    // 添加负面提示词，避免彩色元素
    negative_prompt: "彩色，色彩，颜色，彩色元素，非黑白，彩色图像，彩色照片，非灰度，非单色，彩色阴影，彩色光效"
  };

  try {
    const response = await axios.post<ApiResponse>(
      `${baseUrl}/api/v3/images/generations`,
      requestBody,
      { headers: headers }
    );

    const data = response.data;

    if (data.error) {
      throw new Error(
        `图片生成失败: code=${data.error.code}, message=${data.error.message}`
      );
    }

    const imgList: string[] = [];

    if (data.data && Array.isArray(data.data)) {
      for (const item of data.data) {
        if (item.url) {
          imgList.push(item.url);
        } else if (item.b64_json) {
          imgList.push(item.b64_json);
        } else if (item.error) {
          throw new Error(
            `图片生成失败: code=${item.error.code}, message=${item.error.message}`
          );
        }
      }
    }

    return [imgList, data];

  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as any;
      const errorData = axiosError.response?.data;
      if (errorData?.error) {
        throw new Error(
          `图片生成失败: code=${errorData.error.code}, message=${errorData.error.message}`
        );
      }
      throw new Error(`网络请求失败: ${axiosError.message}`);
    } else if (error instanceof Error) {
      throw new Error(`图片生成失败: ${error.message}`);
    } else {
      throw new Error(`图片生成失败: 未知错误`);
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId: requestSessionId, sceneId, frameType, prompt, forceRegenerate = false } = body;

    if (!sceneId || !frameType || !prompt) {
      return NextResponse.json({
        success: false,
        error: '缺少必要参数：sceneId, frameType, prompt'
      }, { status: 400 });
    }

    if (frameType !== 'first' && frameType !== 'last') {
      return NextResponse.json({
        success: false,
        error: 'frameType 必须是 "first" 或 "last"'
      }, { status: 400 });
    }

    const sceneIdNum = parseInt(sceneId, 10);
    if (isNaN(sceneIdNum)) {
      return NextResponse.json({
        success: false,
        error: 'sceneId 必须是有效的数字'
      }, { status: 400 });
    }

    const sessionId = requestSessionId || sessionManager.getSessionId();

    if (process.env.DEMO_MODE === 'true') {
      const startTime = Date.now();
      const enhancedPrompt = imageGenerationManager.enhancePromptForPencilSketch(prompt);
      const mockImageUrl = await simulateImageGeneration(enhancedPrompt);

      return NextResponse.json({
        success: true,
        imageUrl: mockImageUrl,
        generationTime: Date.now() - startTime,
        enhancedPrompt,
        demo: true
      });
    }

    const slotCheck = await imageGenerationManager.acquireGenerationSlot(sessionId);
    if (!slotCheck.canProceed) {
      return NextResponse.json({
        success: false,
        error: slotCheck.reason,
        estimatedWaitTime: slotCheck.estimatedWaitTime
      }, { status: 429 });
    }

    // 检查是否已有生成记录
    const existingRecord = await imageGenerationManager.getGenerationRecord(
      sessionId, 
      sceneIdNum, 
      frameType
    );

    let generationRecord;
    if (existingRecord) {
      // 如果已有成功记录且不是强制重新生成，直接返回
      if (existingRecord.status === 'success' && existingRecord.imageUrl && !forceRegenerate) {
        return NextResponse.json({
          success: true,
          imageUrl: existingRecord.imageUrl,
          generationTime: existingRecord.generationTime,
          cached: true
        });
      }
      
      // 如果正在生成中，返回状态
      if (existingRecord.status === 'generating') {
        return NextResponse.json({
          success: false,
          error: '正在生成中，请稍后查看',
          generating: true
        }, { status: 202 });
      }

      // 如果是强制重新生成或有失败记录，创建新记录
      if (forceRegenerate || existingRecord.status === 'failed') {
        generationRecord = await imageGenerationManager.createGenerationRecord({
          sessionId,
          sceneId: sceneIdNum,
          frameType,
          prompt
        });
      } else {
        generationRecord = existingRecord;
      }
    } else {
      // 创建新的生成记录
      generationRecord = await imageGenerationManager.createGenerationRecord({
        sessionId,
        sceneId: sceneIdNum,
        frameType,
        prompt
      });
    }

    // 标记为生成中
    await imageGenerationManager.markGenerationInProgress(generationRecord.id);

    const startTime = Date.now();

    try {
      // 增强提示词（添加铅笔手绘风格）
      const enhancedPrompt = imageGenerationManager.enhancePromptForPencilSketch(prompt);
      
      // 生成图片（使用3840x3840尺寸，强制灰度）
      const [imgList, _] = await image_generation(
        enhancedPrompt + "，灰度模式，黑白图像，单色图像",
        "3840x3840",  // 1:1正方形
        false,        // 关闭水印
        null,         // 无参考图片
        "url",        // 返回URL格式
        "standard",   // 标准提示词优化
        "disabled",   // 关闭组图
        1            // 单张图片
      );

      const generationTime = Date.now() - startTime;
      
      if (imgList.length > 0) {
        const originalImageUrl = imgList[0];
        
        // 验证图片URL
        const isValidUrl = await imageGenerationManager.validateImageUrl(originalImageUrl);
        
        if (isValidUrl) {
          // 尝试将图片转换为黑白
          let finalImageUrl = originalImageUrl;
          
          try {
            console.log('开始处理图片:', originalImageUrl.substring(0, 100));
            
            // 下载原始图片
            const imageResponse = await fetch(originalImageUrl);
            const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
            
            console.log('原始图片大小:', imageBuffer.length);
            
            // 如果图片太大（超过5MB），直接使用原始URL
            if (imageBuffer.length > 5 * 1024 * 1024) {
              console.warn('图片过大，跳过处理，使用原始URL');
              finalImageUrl = originalImageUrl;
            } else {
              // 使用Sharp进行黑白转换
              const sharp = require('sharp');
              const blackWhiteBuffer = await sharp(imageBuffer)
                .resize(1024, 1024, { // 缩小尺寸以减少base64大小
                  fit: 'inside',
                  withoutEnlargement: true
                })
                .greyscale()                    // 转换为灰度
                .normalize()                    // 增强对比度
                .jpeg({ 
                  quality: 75,                  // 降低质量
                  progressive: true            // 渐进式JPEG
                })
                .toBuffer();
              
              console.log('处理后图片大小:', blackWhiteBuffer.length);
              
              // 检查base64大小，如果太大则使用原始URL
              const base64Size = blackWhiteBuffer.length * 4/3; // base64大约比原始大33%
              if (base64Size > 2 * 1024 * 1024) { // 超过2MB则不使用base64
                console.warn('base64图片过大，使用原始URL');
                finalImageUrl = originalImageUrl;
              } else {
                // 上传处理后的图片（使用base64编码返回）
                const base64Image = `data:image/jpeg;base64,${blackWhiteBuffer.toString('base64')}`;
                finalImageUrl = base64Image;
              }
            }
            
          } catch (processError) {
            console.warn('图片黑白处理失败，返回原始图片:', processError);
            // 如果处理失败，继续使用原始图片
            finalImageUrl = originalImageUrl;
          }
          
          console.log('最终图片URL类型:', finalImageUrl.startsWith('data:') ? 'base64' : 'url');
          
          // 尝试更新为成功状态
          try {
            const success = await imageGenerationManager.markGenerationSuccess(
              generationRecord.id, 
              finalImageUrl, 
              generationTime
            );
            
            if (!success) {
              console.warn('数据库更新失败，尝试使用原始URL重试');
              // 如果更新失败，尝试使用原始URL重试
              const retrySuccess = await imageGenerationManager.markGenerationSuccess(
                generationRecord.id,
                originalImageUrl,
                generationTime
              );
              
              if (!retrySuccess) {
                throw new Error('数据库更新失败，请检查数据库连接或数据大小');
              }
              finalImageUrl = originalImageUrl;
            }
          } catch (dbError) {
            console.error('数据库更新完全失败:', dbError);
            throw new Error(`数据库更新失败: ${dbError instanceof Error ? dbError.message : '未知错误'}`);
          }

          // 更新session中的图片数据
          try {
            const db = await getDb();
          const sessions = await db!
            .select()
            .from(userGenerationSessions)
            .where(eq(userGenerationSessions.sessionId, sessionId))
            .limit(1);

            if (sessions.length > 0) {
              const currentSession = sessions[0];
              const currentScenes = currentSession.scenes as any[];
              
              // 找到对应的scene并更新图片
              const updatedScenes = currentScenes.map((scene: any) => {
                if (scene.id === sceneIdNum) {
                  if (frameType === 'first') {
                    return { ...scene, first_frame_image: finalImageUrl };
                  } else if (frameType === 'last') {
                    return { ...scene, last_frame_image: finalImageUrl };
                  }
                }
                return scene;
              });

              // 更新session
              await db!
                .update(userGenerationSessions)
                .set({ scenes: updatedScenes })
                .where(eq(userGenerationSessions.id, currentSession.id));

              console.log('Session中的图片数据已更新:', { sessionId, sceneId: sceneIdNum, frameType });
            }
          } catch (sessionUpdateError) {
            console.warn('更新session图片数据失败:', sessionUpdateError);
            // 不影响主流程，只是记录警告
          }

          return NextResponse.json({
            success: true,
            imageUrl: finalImageUrl,
            generationTime,
            enhancedPrompt,
            processed: finalImageUrl !== originalImageUrl
          });
        } else {
          throw new Error('生成的图片URL无效');
        }
      } else {
        throw new Error('未生成任何图片');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      
      // 更新为失败状态
      await imageGenerationManager.markGenerationFailure(
        generationRecord.id, 
        errorMessage
      );

      return NextResponse.json({
        success: false,
        error: errorMessage,
        generationTime: Date.now() - startTime
      }, { status: 500 });
    }

  } catch (error) {
    console.error('图片生成API错误:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '服务器内部错误'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sceneId = searchParams.get('sceneId');
    const frameType = searchParams.get('frameType');

    if (!sceneId || !frameType) {
      return NextResponse.json({
        success: false,
        error: '缺少参数：sceneId, frameType'
      }, { status: 400 });
    }

    if (frameType !== 'first' && frameType !== 'last') {
      return NextResponse.json({
        success: false,
        error: 'frameType 必须是 "first" 或 "last"'
      }, { status: 400 });
    }

    const sessionId = sessionManager.getSessionId();
    const record = await imageGenerationManager.getGenerationRecord(
      sessionId, 
      parseInt(sceneId), 
      frameType as 'first' | 'last'
    );

    if (!record) {
      return NextResponse.json({
        success: false,
        error: '未找到生成记录'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      record
    });

  } catch (error) {
    console.error('获取生成记录API错误:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '服务器内部错误'
    }, { status: 500 });
  }
}
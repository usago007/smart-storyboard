import { NextRequest, NextResponse } from 'next/server';
import { llmServices } from '@/lib/llm-client';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';

interface SplitScenesRequest {
  script: string;
  duration: number;
  targetWordsPerScene?: number;
}

interface Scene {
  id: number;
  name: string;
  dialogue: string;
  duration: number;
}

// 此API已改为使用算法拆分，不再需要LLM

export async function POST(request: NextRequest) {
  try {
    const { script, duration, targetWordsPerScene }: SplitScenesRequest = await request.json();

    if (!script || !duration) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      );
    }

    if (![5, 10, 12].includes(duration)) {
      return NextResponse.json(
        { success: false, error: '分镜时长必须是5秒、10秒或12秒' },
        { status: 400 }
      );
    }

    console.log(`开始拆分分镜：${script.length}字符，${duration}秒分镜，目标字数${targetWordsPerScene || '默认'}`);

    // 使用用户选择的字数，如果未提供则使用默认值
    const durationLimits = {
      5: { min: 35, max: 50, recommended: 42 },      // 5秒：35-50字（推荐42字）
      10: { min: 70, max: 100, recommended: 89 },    // 10秒：70-100字（推荐89字）
      12: { min: 84, max: 120, recommended: 107 }    // 12秒：84-120字（推荐107字）
    };

    const limits = durationLimits[duration as keyof typeof durationLimits];
    
    // 使用用户指定的字数或推荐字数
    const targetWords = targetWordsPerScene || limits.recommended;
    
    // 确保目标字数在合理范围内
    const finalTargetWords = Math.max(limits.min, Math.min(limits.max, targetWords));
    
    const totalChars = script.length;
    const targetShots = Math.max(1, Math.ceil(totalChars / finalTargetWords));

    console.log(`拆分配置：${totalChars}字符，目标${finalTargetWords}字/镜，预计${targetShots}个分镜`);

    // 使用精确字数控制进行拆分
    const scenes = splitWithPreciseWordCount(script, finalTargetWords, targetShots);
    
    const formattedScenes = scenes.map((dialogue, index) => ({
      id: index + 1,
      name: `分镜${index + 1}（${duration}秒）`,
      dialogue: dialogue.trim(),
      duration: duration
    }));

    console.log(`拆分完成：${formattedScenes.length}个分镜`);
    formattedScenes.forEach((scene, i) => {
      console.log(`分镜${i+1}: ${scene.dialogue.length}字 - "${scene.dialogue.substring(0, 20)}..."`);
    });

    return NextResponse.json({
      success: true,
      scenes: formattedScenes
    });

  } catch (error) {
    console.error('分镜拆分失败:', error);
    return NextResponse.json(
      { success: false, error: '分镜拆分失败：' + (error as Error).message },
      { status: 500 }
    );
  }
}

// 精确字数控制的拆分函数
function splitWithPreciseWordCount(script: string, targetWords: number, maxShots: number): string[] {
  const totalChars = script.length;
  const estimatedShots = Math.ceil(totalChars / targetWords);
  
  // 如果预估分镜数合理，使用精确拆分
  if (estimatedShots <= maxShots) {
    return preciseSplitByWordCount(script, targetWords);
  }
  
  // 否则先做简单拆分，再精确控制字数
  return splitWithMaxShots(script, targetWords, maxShots);
}

// 按精确字数拆分
function preciseSplitByWordCount(script: string, targetWords: number): string[] {
  const scenes: string[] = [];
  let remaining = script.trim();
  
  while (remaining.length > 0) {
    if (remaining.length <= targetWords * 1.2) { // 允许20%的误差
      scenes.push(remaining.trim());
      break;
    }
    
    // 寻找最佳切分点
    let cutPoint = targetWords;
    
    // 优先在标点符号处切分
    const punctuation = ['。', '！', '？', '，', '；', '、'];
    let bestCut = targetWords;
    
    for (const punct of punctuation) {
      const searchStart = Math.max(targetWords - 5, 0);
      const searchEnd = Math.min(targetWords + 5, remaining.length);
      
      for (let i = searchStart; i <= searchEnd; i++) {
        if (remaining[i] === punct) {
          const candidateCut = i + 1;
          const tolerance = Math.abs(candidateCut - targetWords) / targetWords;
          const currentTolerance = Math.abs(bestCut - targetWords) / targetWords;
          
          if (tolerance <= currentTolerance && candidateCut >= targetWords * 0.8 && candidateCut <= targetWords * 1.2) {
            bestCut = candidateCut;
            break;
          }
        }
      }
      if (bestCut !== targetWords) break;
    }
    
    // 如果没找到合适的标点符号，尝试在词边界切分
    if (bestCut === targetWords) {
      for (let i = targetWords - 2; i <= targetWords + 2; i++) {
        if (i > 0 && i < remaining.length && /\s/.test(remaining[i])) {
          bestCut = i;
          break;
        }
      }
    }
    
    const cutPosition = Math.max(1, Math.min(remaining.length - 1, bestCut));
    scenes.push(remaining.substring(0, cutPosition).trim());
    remaining = remaining.substring(cutPosition).trim();
  }
  
  return scenes;
}

// 在最大分镜数限制下拆分
function splitWithMaxShots(script: string, targetWords: number, maxShots: number): string[] {
  const totalChars = script.length;
  const actualTargetWords = Math.ceil(totalChars / maxShots);
  
  return preciseSplitByWordCount(script, Math.min(targetWords, actualTargetWords));
}
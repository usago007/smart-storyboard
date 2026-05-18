import { ChatOpenAI } from '@langchain/openai';
import { SystemMessage, HumanMessage, BaseMessage } from '@langchain/core/messages';
import { ModelConfig } from './model-config';

// 统一的LLM客户端调用函数
export async function callLLM(
  messages: BaseMessage[],
  config: Partial<ModelConfig> = {},
  serviceKey?: string
): Promise<string> {
  // 如果提供了serviceKey，使用预定义配置
  if (serviceKey) {
    const { getModelConfig } = await import('./model-config');
    const serviceConfig = getModelConfig(serviceKey);
    config = { ...serviceConfig, ...config };
  }

  // 验证必要参数
  if (!config.apiKey || !config.baseURL) {
    throw new Error("LLM配置不完整：缺少API Key或BaseURL");
  }

  const llm = new ChatOpenAI({
    modelName: config.modelName || "doubao-seed-2-0-lite-260215",
    apiKey: config.apiKey,
    configuration: {
      baseURL: config.baseURL,
    },
    streaming: config.streaming ?? true,
    temperature: config.temperature ?? 0.7,
    maxTokens: config.maxTokens ?? 1000,
    modelKwargs: config.modelKwargs || {
      thinking: {
        type: "disabled",
      },
    },
  });

  // 流式或非流式调用
  if (config.streaming) {
    const stream = await llm.stream(messages);
    let fullContent = "";
    for await (const chunk of stream) {
      fullContent += chunk.content;
    }
    return fullContent;
  } else {
    const response = await llm.invoke(messages);
    return response.content as string;
  }
}

// 便捷函数：系统消息+人类消息的调用
export async function callLLMWithSystemPrompt(
  systemPrompt: string,
  humanPrompt: string,
  config: Partial<ModelConfig> = {},
  serviceKey?: string
): Promise<string> {
  const messages = [
    new SystemMessage(systemPrompt),
    new HumanMessage(humanPrompt)
  ];
  
  return callLLM(messages, config, serviceKey);
}

// 服务特定的调用函数
export const llmServices = {
  // 分镜拆分（已废弃，现使用算法拆分）
  splitScenes: (systemPrompt: string, humanPrompt: string) =>
    callLLMWithSystemPrompt(systemPrompt, humanPrompt, {}, 'splitScenes'),

  // 文案润色
  polishScript: (systemPrompt: string, humanPrompt: string) =>
    callLLMWithSystemPrompt(systemPrompt, humanPrompt, {}, 'polishScript'),

  // 镜头提示词生成
  generateShotPrompt: (systemPrompt: string, humanPrompt: string) =>
    callLLMWithSystemPrompt(systemPrompt, humanPrompt, {}, 'generateShotPrompt'),

  // 首尾帧生成
  generateFrames: (systemPrompt: string, humanPrompt: string) =>
    callLLMWithSystemPrompt(systemPrompt, humanPrompt, {}, 'generateFrames'),

  // 批量生成
  batchGenerate: (systemPrompt: string, humanPrompt: string) =>
    callLLMWithSystemPrompt(systemPrompt, humanPrompt, {}, 'batchGenerate'),
};

// 错误处理包装器
export async function safeCallLLM(
  callFn: () => Promise<string>,
  errorMessage: string = 'AI调用失败'
): Promise<{ success: boolean; content?: string; error?: string }> {
  try {
    const content = await callFn();
    return { success: true, content };
  } catch (error) {
    console.error(`${errorMessage}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : errorMessage 
    };
  }
}
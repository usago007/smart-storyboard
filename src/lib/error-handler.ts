/**
 * 统一的错误处理工具
 */

export interface ErrorInfo {
  code?: string;
  message?: string;
  requestId?: string;
}

/**
 * 检查是否是内容安全检测错误
 */
export function isContentSafetyError(error: any): boolean {
  if (typeof error === 'string') {
    return error.includes('InputTextSensitiveContentDetected') ||
           error.includes('sensitive information') ||
           error.includes('敏感内容');
  }
  
  if (error?.code === 'InputTextSensitiveContentDetected') {
    return true;
  }
  
  if (error?.message?.includes('sensitive information')) {
    return true;
  }
  
  return false;
}

/**
 * 获取友好的错误提示信息
 */
export function getFriendlyErrorMessage(error: any): string {
  if (isContentSafetyError(error)) {
    return '检测到输入内容可能包含敏感信息，请修改对白内容后重试。\n\n建议：\n• 避免使用激烈或争议性表述\n• 简化对白内容\n• 检查是否有容易被误判的词汇';
  }
  
  if (error?.message) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return '操作失败，请稍后重试';
}

/**
 * 显示错误提示
 */
export function showErrorAlert(error: any, context: string = '') {
  const message = getFriendlyErrorMessage(error);
  const fullMessage = context ? `${context}\n\n${message}` : message;
  alert(fullMessage);
}

/**
 * 解析API响应中的错误信息
 */
export function parseApiError(response: Response): Promise<any> {
  return response.json().catch(() => {
    return { 
      code: 'UNKNOWN_ERROR', 
      message: response.statusText || '请求失败' 
    };
  });
}

/**
 * 获取请求ID（如果有）
 */
export function getRequestId(error: any): string | undefined {
  return error?.requestId || error?.message?.match(/Request id: ([\w]+)/)?.[1];
}

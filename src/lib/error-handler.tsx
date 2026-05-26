'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface Toast {
  id: number;
  message: string;
  type: 'error' | 'success' | 'info';
}

interface ToastContextType {
  showToast: (message: string, type?: Toast['type']) => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

let toastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: Toast['type'] = 'error') => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={[
              'pointer-events-auto rounded-[8px] px-5 py-3 text-sm font-medium shadow-sm max-w-sm transition-opacity duration-300',
              toast.type === 'error' && 'bg-red-50 text-red-800 border border-red-200',
              toast.type === 'success' && 'bg-gray-50 text-gray-800 border border-gray-200',
              toast.type === 'info' && 'bg-gray-50 text-gray-800 border border-gray-200',
            ].join(' ')}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

export function showErrorAlert(error: unknown, context: string = '') {
  const message = getFriendlyErrorMessage(error);
  const fullMessage = context ? `${context}: ${message}` : message;
  console.error(fullMessage);
}

export function getFriendlyErrorMessage(error: unknown): string {
  if (isContentSafetyError(error)) {
    return '检测到输入内容可能包含敏感信息，请修改对白内容后重试。';
  }
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return (error as { message: string }).message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return '操作失败，请稍后重试';
}

export function isContentSafetyError(error: unknown): boolean {
  if (typeof error === 'string') {
    return error.includes('InputTextSensitiveContentDetected') ||
           error.includes('sensitive information') ||
           error.includes('敏感内容');
  }
  if (typeof error === 'object' && error !== null) {
    const obj = error as { code?: string; message?: string };
    if (obj.code === 'InputTextSensitiveContentDetected') return true;
    if (obj.message?.includes('sensitive information')) return true;
  }
  return false;
}

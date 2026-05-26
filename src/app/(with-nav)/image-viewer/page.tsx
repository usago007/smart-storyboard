'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function ImageViewerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const imageParam = searchParams.get('image');
  const imageName = searchParams.get('name') || 'image.jpg';
  const imageUrl = imageParam ? decodeURIComponent(imageParam) : '';

  // 下载图片功能
  const downloadImage = () => {
    try {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = imageName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('下载失败:', error);
      alert('下载失败，请尝试右键保存图片');
    }
  };

  if (!imageUrl) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
        <div className="space-y-3 text-center">
          <div className="text-gray-600 dark:text-gray-400">未找到图片数据</div>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-full border border-gray-300 px-4 py-2 text-sm text-gray-700 dark:border-gray-700 dark:text-gray-200"
          >
            返回
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black flex flex-col">
      {/* 顶部工具栏 */}
      <div className="sticky top-0 z-50 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            返回
          </button>
          
          <button
            onClick={downloadImage}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-black dark:bg-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            下载图片
          </button>
        </div>
      </div>

      {/* 图片显示区域 */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="max-w-full max-h-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={imageName}
            className="max-w-full max-h-[calc(100vh-120px)] object-contain rounded-lg shadow-2xl"
          />
        </div>
      </div>

      {/* 底部提示 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="max-w-7xl mx-auto text-center text-sm text-gray-600 dark:text-gray-400">
          右键点击图片也可以下载
        </div>
      </div>
    </div>
  );
}

export default function ImageViewerPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-gray-600 dark:text-gray-400">加载中...</div>
      </div>
    }>
      <ImageViewerContent />
    </Suspense>
  );
}

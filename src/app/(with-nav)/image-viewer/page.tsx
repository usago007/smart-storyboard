'use client';

import { Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function ImageViewerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const imageUrl = searchParams.get('image') ? decodeURIComponent(searchParams.get('image')!) : '';
  const imageName = searchParams.get('name') || 'image.jpg';

  const downloadImage = useCallback(() => {
    try {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = imageName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      console.error('Download failed');
    }
  }, [imageUrl, imageName]);

  if (!imageUrl) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-white">
        <div className="space-y-4 text-center">
          <p className="text-sm text-gray-400">No image found</p>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-[6px] border border-gray-200 px-5 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <div className="sticky top-0 z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 rounded-[6px] border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
          <button
            onClick={downloadImage}
            className="flex items-center gap-2 rounded-[6px] bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800 transition-colors"
          >
            Download
          </button>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-4 lg:p-8">
        <div className="max-w-full max-h-full">
          <img
            src={imageUrl}
            alt=""
            className="max-w-full max-h-[calc(100dvh-140px)] object-contain rounded-[8px]"
          />
        </div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 px-4 py-3">
        <p className="text-center text-xs text-gray-400">Right-click to save image</p>
      </div>
    </div>
  );
}

export default function ImageViewerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[100dvh] flex items-center justify-center bg-white">
        <div className="text-sm text-gray-400">Loading...</div>
      </div>
    }>
      <ImageViewerContent />
    </Suspense>
  );
}

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => router.replace('/smart-create'), 800);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div className="h-screen flex items-center justify-center bg-white">
      <div className="text-center space-y-6">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">FatMug</h1>
        <div className="flex justify-center">
          <div className="h-1 w-48 rounded-full bg-gray-200 overflow-hidden">
            <div className="h-full w-12 rounded-full bg-gray-900 animate-pulse" />
          </div>
        </div>
        <p className="text-sm text-gray-400">Loading</p>
      </div>
    </div>
  );
}

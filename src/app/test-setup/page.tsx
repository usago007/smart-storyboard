'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TestPage() {
  const router = useRouter();

  useEffect(() => {
    // 设置测试分镜数据
    const testData = {
      scenes: [
        {
          id: 1,
          duration: 10,
          dialogue: "欢迎使用广告对白分镜工具，这是一个测试对白，用于验证编辑和删除功能。",
          shotPrompt: "产品展示特写镜头，突出产品特点和质量",
          firstFramePrompt: "明亮的产品包装特写，品牌标志清晰可见",
          lastFramePrompt: "产品与用户互动场景，展示使用效果"
        },
        {
          id: 2,
          duration: 5,
          dialogue: "第二个分镜的测试对白内容。",
          shotPrompt: "人物使用产品的场景",
          firstFramePrompt: "用户开心使用产品",
          lastFramePrompt: "产品效果展示"
        },
        {
          id: 3,
          duration: 12,
          dialogue: "第三个分镜是对白内容，用于测试长时长的分镜编辑功能，确保字符限制正常工作。",
          shotPrompt: "多角度产品展示场景",
          firstFramePrompt: "产品全貌展示",
          lastFramePrompt: "产品使用后的满意效果"
        }
      ]
    };

    // 保存到sessionStorage
    sessionStorage.setItem('splitterResult', JSON.stringify(testData));
    
    console.log('测试数据已保存到sessionStorage:', testData);
    
    // 2秒后跳转到结果页面
    setTimeout(() => {
      router.push('/result');
    }, 2000);
  }, [router]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-medium text-gray-900 dark:text-gray-100 mb-4">
          正在设置测试数据...
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          设置完成后将自动跳转到结果页面
        </p>
        <div className="mt-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    </div>
  );
}
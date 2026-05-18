'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Scene {
  id: number;
  duration: number;
  dialogue: string;
  shotPrompt: string;
  firstFramePrompt: string;
  lastFramePrompt: string;
}

interface SplitterResult {
  scenes: Scene[];
}

export default function ResultTestPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [loading, setLoading] = useState(true);

  // 测试数据
  const testData: SplitterResult = {
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

  useEffect(() => {
    setMounted(true);
    
    // 模拟加载过程
    setTimeout(() => {
      setScenes(testData.scenes);
      setLoading(false);
    }, 1000);
  }, []);

  const getDialogueLimit = (duration: number) => {
    if (duration === 5) return { min: 35, max: 50 };
    if (duration === 10) return { min: 70, max: 100 };
    if (duration === 12) return { min: 84, max: 120 };
    return { min: 35, max: 50 };
  };

  const handleDialogueChange = (sceneId: number, newDialogue: string) => {
    setScenes(prevScenes => {
      const updatedScenes = prevScenes.map(scene => {
        if (scene.id === sceneId) {
          const limit = getDialogueLimit(scene.duration);
          const truncatedDialogue = newDialogue.length > limit.max 
            ? newDialogue.substring(0, limit.max) 
            : newDialogue;
          return { ...scene, dialogue: truncatedDialogue };
        }
        return scene;
      });
      
      // 模拟保存到sessionStorage
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('splitterResult', JSON.stringify({ scenes: updatedScenes }));
      }
      
      return updatedScenes;
    });
  };

  const handleSceneDelete = (sceneId: number) => {
    if (scenes.length <= 1) {
      alert('至少需要保留一个分镜');
      return;
    }

    setScenes(prevScenes => {
      const updatedScenes = prevScenes
        .filter(scene => scene.id !== sceneId)
        .map((scene, index) => ({ ...scene, id: index + 1 }));
      
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('splitterResult', JSON.stringify({ scenes: updatedScenes }));
      }
      
      return updatedScenes;
    });
  };

  const handleAddScene = () => {
    const lastScene = scenes[scenes.length - 1];
    const newScene: Scene = {
      id: scenes.length + 1,
      duration: lastScene?.duration || 10,
      dialogue: "",
      shotPrompt: "",
      firstFramePrompt: "",
      lastFramePrompt: ""
    };

    setScenes(prevScenes => {
      const updatedScenes = [...prevScenes, newScene];
      
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('splitterResult', JSON.stringify({ scenes: updatedScenes }));
      }
      
      return updatedScenes;
    });
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-medium text-gray-900 dark:text-gray-100">
            分镜结果测试
          </h1>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            返回首页
          </button>
        </div>

        <div className="space-y-6">
          {scenes.map((scene) => {
            const limit = getDialogueLimit(scene.duration);
            const isOverLimit = scene.dialogue.length > limit.max;
            const isUnderLimit = scene.dialogue.length < limit.min;

            return (
              <div
                key={scene.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-medium text-gray-900 dark:text-gray-100">
                      分镜 {scene.id}
                    </span>
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                      {scene.duration}秒
                    </span>
                  </div>
                  <button
                    onClick={() => handleSceneDelete(scene.id)}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="删除分镜"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      对白 ({scene.dialogue.length}/{limit.max}字)
                      {isOverLimit && <span className="text-red-500 ml-2">超出字数限制</span>}
                      {isUnderLimit && scene.dialogue.length > 0 && <span className="text-yellow-500 ml-2">低于最低字数</span>}
                    </label>
                    <textarea
                      value={scene.dialogue}
                      onChange={(e) => handleDialogueChange(scene.id, e.target.value)}
                      maxLength={limit.max}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      placeholder={`请输入分镜对白（${limit.min}-${limit.max}字）...`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      镜头提示词 ({scene.shotPrompt.length}/500字)
                    </label>
                    <textarea
                      value={scene.shotPrompt}
                      onChange={(e) => {
                        const updatedScenes = scenes.map(s => 
                          s.id === scene.id 
                            ? { ...s, shotPrompt: e.target.value.substring(0, 500) }
                            : s
                        );
                        setScenes(updatedScenes);
                        if (typeof window !== 'undefined') {
                          sessionStorage.setItem('splitterResult', JSON.stringify({ scenes: updatedScenes }));
                        }
                      }}
                      maxLength={500}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      placeholder="请输入镜头提示词..."
                    />
                  </div>
                </div>
              </div>
            );
          })}

          <div className="flex justify-center pt-4">
            <button
              onClick={handleAddScene}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              新增分镜
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
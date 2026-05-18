'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/contexts/AppContext';
import { showErrorAlert } from '@/lib/error-handler';

interface Scene {
  id: number;
  name: string;
  dialogue: string;
  duration: number;
  shot_prompt?: string;
  first_frame?: {
    scene_description: string;
    character_performance: string;
    camera_angle: string;
    lighting: string;
    atmosphere: string;
  };
  last_frame?: {
    scene_description: string;
    character_performance: string;
    camera_angle: string;
    lighting: string;
  };
  // 图片生成相关字段
  firstFrameImage?: string;     // 首帧图片URL
  lastFrameImage?: string;      // 尾帧图片URL
  imageGenerating?: {           // 图片生成状态
    firstFrame: boolean;
    lastFrame: boolean;
  };
  imageError?: {                // 错误信息
    firstFrame?: string;
    lastFrame?: string;
  };
}

interface AdScriptData {
  script: string;
  duration: number;
  scenes: Scene[];
}

export default function ResultPage() {
  const { t, language } = useApp();
  const [data, setData] = useState<AdScriptData | null>(null);
  const [mounted, setMounted] = useState(false);
  const [shotLoading, setShotLoading] = useState<{[key: number]: boolean}>({});
  const [firstFrameLoading, setFirstFrameLoading] = useState<{[key: number]: boolean}>({});
  const [lastFrameLoading, setLastFrameLoading] = useState<{[key: number]: boolean}>({});
  const [collapsedScenes, setCollapsedScenes] = useState<{[key: number]: boolean}>({});
  const [readingStates, setReadingStates] = useState<{[key: number]: 'idle' | 'playing' | 'paused'}>({});
  const [currentReadingId, setCurrentReadingId] = useState<number | null>(null);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [batchShotLoading, setBatchShotLoading] = useState(false);
  const [batchFramesLoading, setBatchFramesLoading] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
  const [batchProcessingScenes, setBatchProcessingScenes] = useState<number[]>([]);
  const [batchType, setBatchType] = useState<'shot_prompt' | 'frames' | null>(null);
  const [editStates, setEditStates] = useState<{[key: string]: boolean}>({});
  const [editedContent, setEditedContent] = useState<{[key: string]: string}>({});
  // 图片生成相关状态
  const [imageGenerating, setImageGenerating] = useState<{[key: string]: boolean}>({});
  const [imageErrors, setImageErrors] = useState<{[key: string]: string}>({});
  const router = useRouter();

  // 自适应textarea高度的处理函数
  const handleTextareaResize = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    textarea.style.height = 'auto'; // 重置高度
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px'; // 设置新高度，最大200px
  }, []);

  useEffect(() => {
    const initializeData = async () => {
      setMounted(true);
      // 检查浏览器是否支持语音合成
      if (typeof window !== 'undefined' && !window.speechSynthesis) {
        setSpeechSupported(false);
      }
      
      try {
        // 首先尝试从数据库恢复数据
        const response = await fetch('/api/database/session');
        
        if (response.ok) {
          const result = await response.json();
          
          if (result.success && result.sessionData) {
            // 从数据库恢复数据
            const restoredData = {
              script: result.sessionData.scriptContent || '',
              duration: result.sessionData.duration || 5,
              scenes: result.sessionData.scenes || []
            };
            
            setData(restoredData);
            
            // 同步到sessionStorage
            sessionStorage.setItem('adScriptData', JSON.stringify(restoredData));
          }
        } else {
          // 从sessionStorage恢复数据（向后兼容）
          const storedData = sessionStorage.getItem('adScriptData');
          if (storedData) {
            const parsedData = JSON.parse(storedData);
            setData(parsedData);
            
            // 创建数据库会话
            await fetch('/api/database/session', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                scriptContent: parsedData.script,
                duration: parsedData.duration,
                scenes: parsedData.scenes
              })
            });
          } else {
            router.push('/');
            return;
          }
        }
        
        // 初始化展开状态：分镜1默认展开，其他分镜默认折叠
        if (data) {
          const collapsed: {[key: number]: boolean} = {};
          data.scenes.forEach((scene: Scene) => {
            collapsed[scene.id] = scene.id !== 1;
          });
          setCollapsedScenes(collapsed);
        }
        
      } catch (error) {
        console.error('数据初始化失败:', error);
        
        // 降级到sessionStorage
        const storedData = sessionStorage.getItem('adScriptData');
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          setData(parsedData);
        } else {
          router.push('/');
        }
      }
    };
    
    initializeData();
  }, [router]);

  const generateShotPrompt = async (sceneId: number) => {
    setShotLoading(prev => ({ ...prev, [sceneId]: true }));

    try {
      const response = await fetch('/api/generate-shot-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sceneId,
          dialogue: data?.scenes.find(s => s.id === sceneId)?.dialogue,
          duration: data?.duration
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw { code: errorData.code, message: errorData.message, requestId: errorData.requestId };
      }

      const result = await response.json();

      if (result.success) {
        // 强制截断到500字符
        const maxLength = 500;
        const truncatedShotPrompt = result.shot_prompt.length > maxLength
          ? result.shot_prompt.substring(0, maxLength)
          : result.shot_prompt;

        setData(prev => prev ? {
          ...prev,
          scenes: prev.scenes.map(scene =>
            scene.id === sceneId
              ? { ...scene, shot_prompt: truncatedShotPrompt }
              : scene
          )
        } : null);
      } else {
        throw new Error(result.error || '生成镜头提示词失败');
      }
    } catch (error) {
      console.error('Error:', error);
      showErrorAlert(error, '生成镜头提示词失败');
    } finally {
      setShotLoading(prev => ({ ...prev, [sceneId]: false }));
    }
  };

  const generateFirstFrame = async (sceneId: number) => {
    setFirstFrameLoading(prev => ({ ...prev, [sceneId]: true }));

    try {
      const response = await fetch('/api/generate-frames', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sceneId,
          dialogue: data?.scenes.find(s => s.id === sceneId)?.dialogue,
          duration: data?.duration,
          frameType: 'first'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw { code: errorData.code, message: errorData.message, requestId: errorData.requestId };
      }

      const result = await response.json();

      if (result.success) {
        // 强制截断每个字段到100字符
        const maxLength = 100;
        const truncatedFirstFrame: Scene['first_frame'] = {
          scene_description: result.first_frame.scene_description?.length > maxLength
            ? result.first_frame.scene_description.substring(0, maxLength)
            : result.first_frame.scene_description,
          character_performance: result.first_frame.character_performance?.length > maxLength
            ? result.first_frame.character_performance.substring(0, maxLength)
            : result.first_frame.character_performance,
          camera_angle: result.first_frame.camera_angle?.length > maxLength
            ? result.first_frame.camera_angle.substring(0, maxLength)
            : result.first_frame.camera_angle,
          lighting: result.first_frame.lighting?.length > maxLength
            ? result.first_frame.lighting.substring(0, maxLength)
            : result.first_frame.lighting,
          atmosphere: result.first_frame.atmosphere?.length > maxLength
            ? result.first_frame.atmosphere.substring(0, maxLength)
            : result.first_frame.atmosphere
        };

        setData(prev => prev ? {
          ...prev,
          scenes: prev.scenes.map(scene =>
            scene.id === sceneId
              ? { ...scene, first_frame: truncatedFirstFrame }
              : scene
          )
        } : null);
      } else {
        throw new Error(result.error || '生成首帧失败');
      }
    } catch (error) {
      console.error('Error:', error);
      showErrorAlert(error, '生成首帧失败');
    } finally {
      setFirstFrameLoading(prev => ({ ...prev, [sceneId]: false }));
    }
  };

  const generateLastFrame = async (sceneId: number) => {
    setLastFrameLoading(prev => ({ ...prev, [sceneId]: true }));

    try {
      const response = await fetch('/api/generate-frames', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sceneId,
          dialogue: data?.scenes.find(s => s.id === sceneId)?.dialogue,
          duration: data?.duration,
          frameType: 'last'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw { code: errorData.code, message: errorData.message, requestId: errorData.requestId };
      }

      const result = await response.json();

      if (result.success) {
        // 强制截断每个字段到100字符
        const maxLength = 100;
        const truncatedLastFrame: Scene['last_frame'] = {
          scene_description: result.last_frame.scene_description?.length > maxLength
            ? result.last_frame.scene_description.substring(0, maxLength)
            : result.last_frame.scene_description,
          character_performance: result.last_frame.character_performance?.length > maxLength
            ? result.last_frame.character_performance.substring(0, maxLength)
            : result.last_frame.character_performance,
          camera_angle: result.last_frame.camera_angle?.length > maxLength
            ? result.last_frame.camera_angle.substring(0, maxLength)
            : result.last_frame.camera_angle,
          lighting: result.last_frame.lighting?.length > maxLength
            ? result.last_frame.lighting.substring(0, maxLength)
            : result.last_frame.lighting
        };

        setData(prev => prev ? {
          ...prev,
          scenes: prev.scenes.map(scene =>
            scene.id === sceneId
              ? { ...scene, last_frame: truncatedLastFrame }
              : scene
          )
        } : null);
      } else {
        throw new Error(result.error || '生成尾帧失败');
      }
    } catch (error) {
      console.error('Error:', error);
      showErrorAlert(error, '生成尾帧失败');
    } finally {
      setLastFrameLoading(prev => ({ ...prev, [sceneId]: false }));
    }
  };

  // 图片生成功能
  const generateImage = async (sceneId: number, frameType: 'first' | 'last', forceRegenerate: boolean = false) => {
    const key = `${sceneId}-${frameType}`;
    
    // 设置加载状态
    setImageGenerating(prev => ({ ...prev, [key]: true }));
    setImageErrors(prev => ({ ...prev, [key]: '' }));
    
    try {
      const scene = data?.scenes.find(s => s.id === sceneId);
      if (!scene) {
        throw new Error('未找到对应分镜');
      }

      // 构建提示词
      const frameData = frameType === 'first' ? scene.first_frame : scene.last_frame;
      const framePrompt = frameData ? 
        `${frameData.scene_description}，${frameData.character_performance}，${frameData.camera_angle}，${frameData.lighting}${(frameData as any).atmosphere ? '，' + (frameData as any).atmosphere : ''}` :
        scene.dialogue;

      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          sceneId,
          frameType,
          prompt: framePrompt,
          forceRegenerate
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '图片生成失败');
      }

      const result = await response.json();
      
      if (result.success) {
        // 更新场景数据
        setData(prev => prev ? {
          ...prev,
          scenes: prev.scenes.map(scene => 
            scene.id === sceneId 
              ? { 
                  ...scene, 
                  [frameType === 'first' ? 'firstFrameImage' : 'lastFrameImage']: result.imageUrl,
                  imageGenerating: {
                    firstFrame: scene.imageGenerating?.firstFrame || false,
                    lastFrame: scene.imageGenerating?.lastFrame || false,
                    [frameType]: false
                  }
                }
              : scene
          )
        } : null);
      } else {
        throw new Error(result.error || '图片生成失败');
      }
    } catch (error) {
      console.error('图片生成错误:', error);
      const errorMessage = error instanceof Error ? error.message : '图片生成失败，请重试';
      
      // 设置错误状态
      setImageErrors(prev => ({ ...prev, [key]: errorMessage }));
      
      // 更新生成状态为false
      setData(prev => prev ? {
        ...prev,
        scenes: prev.scenes.map(scene => 
          scene.id === sceneId 
            ? { 
                ...scene, 
                imageGenerating: {
                  firstFrame: scene.imageGenerating?.firstFrame || false,
                  lastFrame: scene.imageGenerating?.lastFrame || false,
                  [frameType]: false
                },
                imageError: {
                  firstFrame: frameType === 'first' ? errorMessage : scene.imageError?.firstFrame,
                  lastFrame: frameType === 'last' ? errorMessage : scene.imageError?.lastFrame
                }
              }
            : scene
        )
      } : null);
      
      alert(errorMessage);
    } finally {
      setImageGenerating(prev => ({ ...prev, [key]: false }));
    }
  };

  // 朗读功能相关函数
  const calculateTargetSpeechRate = (scene: Scene) => {
    const wordCount = scene.dialogue.length;
    const duration = scene.duration;
    // 目标语速：字数/秒，转换为语音合成的rate值（标准为1.0）
    const targetWordsPerSecond = wordCount / duration;
    // 标准播音员语速约为4-5字/秒，映射到rate 0.8-1.2
    const speechRate = Math.max(0.5, Math.min(2.0, targetWordsPerSecond / 4));
    return speechRate;
  };

  const startReading = (sceneId: number) => {
    if (!data || !speechSupported) return;
    
    const scene = data.scenes.find(s => s.id === sceneId);
    if (!scene) return;

    // 停止当前正在播放的语音
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(scene.dialogue);
    utterance.lang = 'zh-CN';
    utterance.rate = calculateTargetSpeechRate(scene);
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    utterance.onstart = () => {
      setCurrentReadingId(sceneId);
      setReadingStates(prev => ({ ...prev, [sceneId]: 'playing' }));
    };
    
    utterance.onend = () => {
      setCurrentReadingId(null);
      setReadingStates(prev => ({ ...prev, [sceneId]: 'idle' }));
    };
    
    utterance.onerror = () => {
      setCurrentReadingId(null);
      setReadingStates(prev => ({ ...prev, [sceneId]: 'idle' }));
    };
    
    window.speechSynthesis.speak(utterance);
  };

  const stopReading = () => {
    window.speechSynthesis.cancel();
    setCurrentReadingId(null);
    setReadingStates(prev => {
      const newStates = { ...prev };
      Object.keys(newStates).forEach(key => {
        newStates[parseInt(key)] = 'idle';
      });
      return newStates;
    });
  };

  const handlePlayPause = (sceneId: number) => {
    if (!speechSupported) return;
    
    if (readingStates[sceneId] === 'playing') {
      stopReading();
    } else {
      startReading(sceneId);
    }
  };

  const formatFramePrompt = (frame: any) => {
    const parts = [];
    if (frame.scene_description) parts.push(frame.scene_description);
    if (frame.character_performance) parts.push(frame.character_performance);
    if (frame.camera_angle) parts.push(frame.camera_angle);
    if (frame.lighting) parts.push(frame.lighting);
    if (frame.atmosphere) parts.push(frame.atmosphere);
    return parts.join('，');
  };

  // 获取对白最大字符数
  const getDialogueMaxChars = useMemo(() => (duration: number) => {
    if (duration === 5) return 50;
    if (duration === 10) return 100;
    if (duration === 12) return 120;
    return 100; // 默认值
  }, []);

  // 获取对白当前字符数
  const getDialogueCharCount = useMemo(() => (duration: number, currentLength: number) => {
    return currentLength;
  }, []);

  // 处理编辑功能
  const toggleEdit = (key: string) => {
    setEditStates(prev => ({ ...prev, [key]: !prev[key] }));
    if (!editStates[key]) {
      // 进入编辑模式时，初始化编辑内容
      const [sceneId, field] = key.split('-');
      const scene = data?.scenes.find(s => s.id === parseInt(sceneId));
      if (scene) {
        if (field === 'dialogue') {
          setEditedContent(prev => ({ ...prev, [key]: scene.dialogue || '' }));
        } else if (field === 'shot_prompt') {
          setEditedContent(prev => ({ ...prev, [key]: scene.shot_prompt || '' }));
        } else if (field === 'first_frame') {
          setEditedContent(prev => ({ ...prev, [key]: scene.first_frame ? formatFramePrompt(scene.first_frame) : '' }));
        } else if (field === 'last_frame') {
          setEditedContent(prev => ({ ...prev, [key]: scene.last_frame ? formatFramePrompt(scene.last_frame) : '' }));
        }
      }
    }
  };

  const handleEditChange = useCallback((key: string, value: string) => {
    const [sceneId, field] = key.split('-');
    
    if (field === 'dialogue') {
      // 根据分镜时长限制字符数
      const scene = data?.scenes.find(s => s.id === parseInt(sceneId));
      if (scene) {
        let maxLength = 100; // 默认值
        if (scene.duration === 5) {
          maxLength = 50;
        } else if (scene.duration === 10) {
          maxLength = 100;
        } else if (scene.duration === 12) {
          maxLength = 120;
        }
        
        if (value.length <= maxLength) {
          setEditedContent(prev => ({ ...prev, [key]: value }));
        }
      }
    } else {
      // 所有字段限制500字符
      const maxLength = 500;
      if (value.length <= maxLength) {
        setEditedContent(prev => ({ ...prev, [key]: value }));
      }
    }
  }, [data]);

  const saveEdit = (key: string) => {
    const [sceneId, field] = key.split('-');
    const content = editedContent[key] || '';
    
    let updatedData;
    
    // 更新数据
    if (field === 'dialogue') {
      updatedData = data ? {
        ...data,
        scenes: data.scenes.map(scene => 
          scene.id === parseInt(sceneId) 
            ? { ...scene, dialogue: content }
            : scene
        )
      } : null;
    } else if (field === 'shot_prompt') {
      updatedData = data ? {
        ...data,
        scenes: data.scenes.map(scene => 
          scene.id === parseInt(sceneId) 
            ? { ...scene, shot_prompt: content }
            : scene
        )
      } : null;
    } else if (field === 'first_frame' || field === 'last_frame') {
      // 这里需要解析格式化的提示词回原始格式
      const parts = content.split('，');
      const frameData = {
        scene_description: parts[0] || '',
        character_performance: parts[1] || '',
        camera_angle: parts[2] || '',
        lighting: parts[3] || '',
        atmosphere: parts[4] || ''
      };
      
      updatedData = data ? {
        ...data,
        scenes: data.scenes.map(scene => 
          scene.id === parseInt(sceneId) 
            ? { ...scene, [field]: frameData }
            : scene
        )
      } : null;
    }
    
    if (updatedData) {
      setData(updatedData);
    }
    
    // 退出编辑模式
    setEditStates(prev => ({ ...prev, [key]: false }));
  };

  // 删除分镜
  const deleteScene = (sceneId: number) => {
    if (!data) return;
    
    if (data.scenes.length <= 1) {
      alert('至少需要保留一个分镜');
      return;
    }
    
    if (confirm(`确定要删除${language === 'zh' ? '分镜' : 'Scene'} ${sceneId}吗？`)) {
      const updatedScenes = data.scenes
        .filter(scene => scene.id !== sceneId)
        .map((scene, index) => ({
          ...scene,
          id: index + 1 // 重新编号
        }));
      
      const updatedData = {
        ...data,
        scenes: updatedScenes
      };
      
      if (updatedData) {
      setData(updatedData);
    }
      
      // 更新折叠状态
      const newCollapsed: {[key: number]: boolean} = {};
      updatedScenes.forEach((scene, index) => {
        newCollapsed[scene.id] = scene.id !== 1; // 只有第一个分镜默认展开
      });
      setCollapsedScenes(newCollapsed);
      
      // 保存到sessionStorage
      sessionStorage.setItem('adScriptData', JSON.stringify(updatedData));
    }
  };

  // 新增分镜
  const addScene = () => {
    if (!data) return;
    
    const newScene: Scene = {
      id: data.scenes.length + 1,
      name: `${language === 'zh' ? '分镜' : 'Scene'} ${data.scenes.length + 1}`,
      dialogue: '',
      duration: data.scenes[data.scenes.length - 1]?.duration || 5, // 使用最后一个分镜的时长
      shot_prompt: '',
      first_frame: {
        scene_description: '',
        character_performance: '',
        camera_angle: '',
        lighting: '',
        atmosphere: ''
      },
      last_frame: {
        scene_description: '',
        character_performance: '',
        camera_angle: '',
        lighting: ''
      }
    };
    
    const updatedData = {
      ...data,
      scenes: [...data.scenes, newScene]
    };
    
    if (updatedData) {
      setData(updatedData);
    }
    
    // 新分镜默认展开
    setCollapsedScenes(prev => ({ ...prev, [newScene.id]: false }));
    
    // 默认对白处于可编辑状态
    setEditStates(prev => ({ ...prev, [`${newScene.id}-dialogue`]: true }));
    
    // 保存到sessionStorage
    sessionStorage.setItem('adScriptData', JSON.stringify(updatedData));
  };

  // 自动保存数据到sessionStorage和数据库（使用防抖）
  useEffect(() => {
    if (!data || !mounted) return;
    
    const timeoutId = setTimeout(async () => {
      // 保存到sessionStorage（向后兼容）
      sessionStorage.setItem('adScriptData', JSON.stringify(data));
      
      // 保存到数据库
      try {
        await fetch('/api/database/session', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            scriptContent: data.script,
            duration: data.duration,
            scenes: data.scenes
          })
        });
      } catch (error) {
        console.error('数据库保存失败:', error);
        // 静默失败，不影响用户体验
      }
    }, 500); // 500ms 防抖延迟
    
    return () => clearTimeout(timeoutId);
  }, [data, mounted]);

  const copyToClipboard = async (text: string, itemType: string = '内容') => {
    try {
      await navigator.clipboard.writeText(text);
      // 显示复制成功提示
      alert(`${itemType}已复制到剪贴板`);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      alert(`复制失败，请重试`);
    }
  };

  const generateBatchShotPrompts = async (sceneIds?: number[]) => {
    if (!data) return;
    
    setBatchShotLoading(true);
    setBatchType('shot_prompt');
    setBatchProgress({ current: 0, total: data.scenes.length });
    const targetIds = sceneIds || data.scenes.map(s => s.id);
    setBatchProcessingScenes(targetIds);
    
    try {
      const targetScenes = data.scenes.filter(s => targetIds.includes(s.id));
      
      const response = await fetch('/api/batch-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          scenes: targetScenes.map(s => ({
            id: s.id,
            dialogue: s.dialogue,
            duration: s.duration
          })),
          type: 'shot_prompt'
        }),
      });

      if (!response.ok) {
        throw new Error('批量生成镜头提示词失败');
      }

      const result = await response.json();
      
      if (result.success) {
        // 强制截断到500字符
        const maxLength = 500;
        
        // 更新页面数据
        setData(prev => prev ? {
          ...prev,
          scenes: prev.scenes.map(scene => {
            const generatedResult = result.results.find((r: any) => r.sceneId === scene.id);
            if (generatedResult) {
              const truncatedShotPrompt = generatedResult.shot_prompt.length > maxLength 
                ? generatedResult.shot_prompt.substring(0, maxLength) 
                : generatedResult.shot_prompt;
              return { ...scene, shot_prompt: truncatedShotPrompt };
            }
            return scene;
          })
        } : null);

        // 更新已完成的分镜列表
        if (result.completed_scenes) {
          setBatchProcessingScenes(prev => 
            prev.filter(id => !result.completed_scenes.includes(id))
          );
        }

        // 显示结果提示
        if (result.error_count > 0) {
          alert(`批量生成完成：成功 ${result.success_count} 个，失败 ${result.error_count} 个`);
        } else {
          alert(`批量生成成功：已完成 ${result.success_count} 个镜头提示词生成`);
        }
      } else {
        throw new Error(result.error || '批量生成失败');
      }
    } catch (error) {
      console.error('批量生成镜头提示词失败:', error);
      alert('批量生成镜头提示词失败，请重试');
    } finally {
      setBatchShotLoading(false);
      setBatchProgress({ current: 0, total: 0 });
      setBatchProcessingScenes([]);
      setBatchType(null);
    }
  };

  const generateBatchFrames = async (sceneIds?: number[]) => {
    if (!data) return;
    
    setBatchFramesLoading(true);
    setBatchType('frames');
    setBatchProgress({ current: 0, total: data.scenes.length });
    const targetIds = sceneIds || data.scenes.map(s => s.id);
    setBatchProcessingScenes(targetIds);
    
    try {
      const targetScenes = data.scenes.filter(s => targetIds.includes(s.id));
      
      const response = await fetch('/api/batch-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          scenes: targetScenes.map(s => ({
            id: s.id,
            dialogue: s.dialogue,
            duration: s.duration
          })),
          type: 'frames'
        }),
      });

      if (!response.ok) {
        throw new Error('批量生成首尾帧失败');
      }

      const result = await response.json();
      
      if (result.success) {
        // 强制截断每个字段到100字符
        const maxLength = 100;
        
        // 更新页面数据
        setData(prev => prev ? {
          ...prev,
          scenes: prev.scenes.map(scene => {
            const generatedResult = result.results.find((r: any) => r.sceneId === scene.id);
            if (generatedResult) {
              // 截断首帧字段
              const truncatedFirstFrame: Scene['first_frame'] = {
                scene_description: generatedResult.first_frame?.scene_description?.length > maxLength 
                  ? generatedResult.first_frame.scene_description.substring(0, maxLength) 
                  : generatedResult.first_frame?.scene_description,
                character_performance: generatedResult.first_frame?.character_performance?.length > maxLength 
                  ? generatedResult.first_frame.character_performance.substring(0, maxLength) 
                  : generatedResult.first_frame?.character_performance,
                camera_angle: generatedResult.first_frame?.camera_angle?.length > maxLength 
                  ? generatedResult.first_frame.camera_angle.substring(0, maxLength) 
                  : generatedResult.first_frame?.camera_angle,
                lighting: generatedResult.first_frame?.lighting?.length > maxLength 
                  ? generatedResult.first_frame.lighting.substring(0, maxLength) 
                  : generatedResult.first_frame?.lighting,
                atmosphere: generatedResult.first_frame?.atmosphere?.length > maxLength 
                  ? generatedResult.first_frame.atmosphere.substring(0, maxLength) 
                  : generatedResult.first_frame?.atmosphere
              };

              // 截断尾帧字段
              const truncatedLastFrame: Scene['last_frame'] = {
                scene_description: generatedResult.last_frame?.scene_description?.length > maxLength 
                  ? generatedResult.last_frame.scene_description.substring(0, maxLength) 
                  : generatedResult.last_frame?.scene_description,
                character_performance: generatedResult.last_frame?.character_performance?.length > maxLength 
                  ? generatedResult.last_frame.character_performance.substring(0, maxLength) 
                  : generatedResult.last_frame?.character_performance,
                camera_angle: generatedResult.last_frame?.camera_angle?.length > maxLength 
                  ? generatedResult.last_frame.camera_angle.substring(0, maxLength) 
                  : generatedResult.last_frame?.camera_angle,
                lighting: generatedResult.last_frame?.lighting?.length > maxLength 
                  ? generatedResult.last_frame.lighting.substring(0, maxLength) 
                  : generatedResult.last_frame?.lighting
              };

              return { 
                ...scene, 
                first_frame: truncatedFirstFrame,
                last_frame: truncatedLastFrame
              };
            }
            return scene;
          })
        } : null);

        // 更新已完成的分镜列表
        if (result.completed_scenes) {
          setBatchProcessingScenes(prev => 
            prev.filter(id => !result.completed_scenes.includes(id))
          );
        }

        // 显示结果提示
        if (result.error_count > 0) {
          alert(`批量生成完成：成功 ${result.success_count} 个，失败 ${result.error_count} 个`);
        } else {
          alert(`批量生成成功：已完成 ${result.success_count} 个分镜的首尾帧生成`);
        }
      } else {
        throw new Error(result.error || '批量生成失败');
      }
    } catch (error) {
      console.error('批量生成首尾帧失败:', error);
      alert('批量生成首尾帧失败，请重试');
    } finally {
      setBatchFramesLoading(false);
      setBatchProgress({ current: 0, total: 0 });
      setBatchProcessingScenes([]);
      setBatchType(null);
    }
  };

  if (!mounted || !data) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-gray-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* 顶部导航 */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <button
            onClick={() => router.push('/')}
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors p-2 -ml-2 sm:p-0 sm:ml-0"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">{t.backButton}</span>
          </button>
          <h1 className="text-lg sm:text-xl font-medium text-gray-900 dark:text-gray-100 text-center sm:text-left">
            {t.resultTitle} · {data.scenes.length} {language === 'zh' ? '个' : ''}
          </h1>
          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 text-right">
            <div>{data.duration}{language === 'zh' ? '秒' : 's'}</div>
            <div className="hidden sm:inline">{data.scenes.reduce((sum, scene) => sum + scene.dialogue.length, 0)}{language === 'zh' ? '字' : ' chars'}</div>
          </div>
        </div>

        {/* 分镜列表 */}
        <div className="space-y-4 sm:space-y-6">
          {data.scenes.map((scene, index) => (
            <div key={scene.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              {/* 分镜头部 */}
              <div 
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors active:bg-gray-200 dark:active:bg-gray-600"
                onClick={() => setCollapsedScenes(prev => ({ ...prev, [scene.id]: !prev[scene.id] }))}
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100">{t.sceneTitle} {scene.id}</span>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">({scene.duration}{language === 'zh' ? '秒' : 's'})</span>
                    <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">•</span>
                    <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{scene.dialogue.length}{language === 'zh' ? '字' : ' chars'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {data.scenes.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteScene(scene.id);
                      }}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                      title="删除分镜"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                  <svg 
                    className={`w-5 h-5 text-gray-400 dark:text-gray-500 transition-transform ${collapsedScenes[scene.id] ? '' : 'rotate-180'}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* 分镜内容 */}
              {!collapsedScenes[scene.id] && (
                <div className="p-4 space-y-4">
                  {/* 对白内容 */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-900 dark:text-gray-100">{language === 'zh' ? '对白' : 'Dialogue'}</label>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            if (scene.dialogue.trim()) {
                              copyToClipboard(scene.dialogue, '对白');
                            }
                          }}
                          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                          title="复制对白"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                        {editStates[`${scene.id}-dialogue`] ? null : (
                          <button
                            onClick={() => toggleEdit(`${scene.id}-dialogue`)}
                            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                            title="编辑"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => handlePlayPause(scene.id)}
                          disabled={!speechSupported}
                          className={`p-2 rounded-lg transition-colors ${readingStates[scene.id] === 'playing' ? 'text-red-500 active:text-red-700' : 'text-gray-500 hover:text-gray-700 active:text-gray-900'}`}
                          title={readingStates[scene.id] === 'playing' ? '暂停' : '朗读'}
                        >
                          {readingStates[scene.id] === 'playing' ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                    {editStates[`${scene.id}-dialogue`] ? (
                      <div>
                        <textarea
                          ref={(textarea) => {
                            if (textarea) {
                              textarea.style.height = 'auto';
                              textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
                            }
                          }}
                          value={editedContent[`${scene.id}-dialogue`] || ''}
                          onChange={(e) => {
                            handleEditChange(`${scene.id}-dialogue`, e.target.value);
                            handleTextareaResize(e);
                          }}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-gray-900 resize-none bg-white transition-colors duration-150"
                          style={{ minHeight: '75px', maxHeight: '200px' }}
                          placeholder="输入对白内容..."
                        />
                        <div className="flex items-center justify-between mt-2">
                          <span className={`text-xs ${(editedContent[`${scene.id}-dialogue`]?.length || 0) >= getDialogueMaxChars(scene.duration) ? 'text-red-500' : 'text-gray-500'}`}>
                            {editedContent[`${scene.id}-dialogue`]?.length || 0}/{getDialogueMaxChars(scene.duration)}
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => saveEdit(`${scene.id}-dialogue`)}
                              disabled={!editedContent[`${scene.id}-dialogue`]?.trim()}
                              className={`text-xs px-3 py-2 rounded min-h-[44px] flex items-center justify-center ${
                                editedContent[`${scene.id}-dialogue`]?.trim()
                                  ? 'bg-black text-white hover:bg-gray-800'
                                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              }`}
                            >
                              保存
                            </button>
                            <button
                              onClick={() => toggleEdit(`${scene.id}-dialogue`)}
                              className="text-xs px-3 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 min-h-[44px] flex items-center justify-center"
                            >
                              取消
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-md text-gray-900 text-sm leading-relaxed">
                        {scene.dialogue}
                      </div>
                    )}
                  </div>

                  {/* 镜头提示词 */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-900">镜头提示词</label>
                      <button
                        onClick={() => generateShotPrompt(scene.id)}
                        disabled={shotLoading[scene.id] || batchProcessingScenes.includes(scene.id) || batchShotLoading || !scene.dialogue}
                        className="px-3 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 active:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed min-h-[44px] flex items-center justify-center gap-2"
                      >
                        {(shotLoading[scene.id] || (batchProcessingScenes.includes(scene.id) && batchType === 'shot_prompt')) ? (
                          <>
                            <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {language === 'zh' ? '生成中...' : 'Generating...'}
                          </>
                        ) : (
                          scene.shot_prompt ? (language === 'zh' ? '重新生成' : 'Regenerate') : (language === 'zh' ? '生成' : 'Generate')
                        )}
                      </button>
                    </div>
                    {scene.shot_prompt ? (
                      <div className="p-3 bg-gray-50 rounded-md text-gray-900 text-sm leading-relaxed">
                        <div className="flex items-start justify-between">
                          {editStates[`${scene.id}-shot_prompt`] ? (
                            <div className="flex-1">
                              <textarea
                                ref={(textarea) => {
                                  if (textarea) {
                                    textarea.style.height = 'auto';
                                    textarea.style.height = Math.min(textarea.scrollHeight, 180) + 'px';
                                  }
                                }}
                                value={editedContent[`${scene.id}-shot_prompt`] || ''}
                                onChange={(e) => {
                                  handleEditChange(`${scene.id}-shot_prompt`, e.target.value);
                                  handleTextareaResize(e);
                                }}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-900 resize-none bg-white transition-colors duration-150"
                                style={{ minHeight: '60px', maxHeight: '180px' }}
                                placeholder="镜头提示词..."
                              />
                              <div className="flex items-center justify-between mt-2">
                                <span className={`text-xs ${(editedContent[`${scene.id}-shot_prompt`]?.length || 0) >= 800 ? 'text-red-500' : 'text-gray-500'}`}>
                                  {editedContent[`${scene.id}-shot_prompt`]?.length || 0}/500
                                </span>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => saveEdit(`${scene.id}-shot_prompt`)}
                                    className="text-xs px-3 py-2 bg-black text-white rounded hover:bg-gray-800 min-h-[44px] flex items-center justify-center"
                                  >
                                    保存
                                  </button>
                                  <button
                                    onClick={() => toggleEdit(`${scene.id}-shot_prompt`)}
                                    className="text-xs px-3 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 min-h-[44px] flex items-center justify-center"
                                  >
                                    取消
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex-1">
                              <div className="mb-1">
                                {scene.shot_prompt}
                              </div>
                              <div className="text-xs text-gray-500">
                                {scene.shot_prompt?.length || 0}/500
                              </div>
                            </div>
                          )}
                          <div className="ml-2 flex gap-1 flex-shrink-0">
                            {editStates[`${scene.id}-shot_prompt`] ? null : (
                              <>
                                <button
                                  onClick={() => copyToClipboard(scene.shot_prompt || '', '镜头提示词')}
                                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                                  title="复制"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => toggleEdit(`${scene.id}-shot_prompt`)}
                                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                                  title="编辑"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                              </>
                            )}
                            {batchProcessingScenes.includes(scene.id) && batchType === 'shot_prompt' && (
                              <svg className="w-4 h-4 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 text-center text-gray-400 bg-gray-50 rounded-md relative">
                        <div>{language === 'zh' ? '点击生成镜头提示词' : 'Click to generate shot prompt'}</div>
                        {batchProcessingScenes.includes(scene.id) && batchType === 'shot_prompt' && (
                          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-md flex items-center justify-center">
                            <svg className="w-5 h-5 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 首尾帧提示词 */}
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-900">首帧提示词</label>
                        <button
                          onClick={() => generateFirstFrame(scene.id)}
                          disabled={firstFrameLoading[scene.id] || batchProcessingScenes.includes(scene.id) || batchFramesLoading || !scene.dialogue || !scene.shot_prompt}
                          className="px-3 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 active:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed min-h-[44px] flex items-center justify-center gap-2"
                        >
                          {(firstFrameLoading[scene.id] || (batchProcessingScenes.includes(scene.id) && batchType === 'frames')) ? (
                            <>
                              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              {language === 'zh' ? '生成中...' : 'Generating...'}
                            </>
                          ) : (
                            (scene.first_frame && (scene.first_frame.scene_description || scene.first_frame.character_performance || scene.first_frame.camera_angle || scene.first_frame.lighting)) ? (language === 'zh' ? '重新生成' : 'Regenerate') : (language === 'zh' ? '生成' : 'Generate')
                          )}
                        </button>
                      </div>
                      {(scene.first_frame && (scene.first_frame.scene_description || scene.first_frame.character_performance || scene.first_frame.camera_angle || scene.first_frame.lighting)) ? (
                        <div className="p-3 bg-green-50 rounded-md text-gray-900 text-sm leading-relaxed">
                          <div className="flex items-start justify-between">
                            {editStates[`${scene.id}-first_frame`] ? (
                              <div className="flex-1">
                                <textarea
                                  ref={(textarea) => {
                                    if (textarea) {
                                      textarea.style.height = 'auto';
                                      textarea.style.height = Math.min(textarea.scrollHeight, 180) + 'px';
                                    }
                                  }}
                                  value={editedContent[`${scene.id}-first_frame`] || ''}
                                  onChange={(e) => {
                                    handleEditChange(`${scene.id}-first_frame`, e.target.value);
                                    handleTextareaResize(e);
                                  }}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-green-500 resize-none bg-white transition-colors duration-150"
                                  style={{ minHeight: '60px', maxHeight: '180px' }}
                                  placeholder="首帧提示词（场景描述，角色表演，镜头角度，灯光，氛围）"
                                />
                                <div className="flex items-center justify-between mt-2">
                                  <span className={`text-xs ${(editedContent[`${scene.id}-first_frame`]?.length || 0) >= 500 ? 'text-red-500' : 'text-gray-500'}`}>
                                    {editedContent[`${scene.id}-first_frame`]?.length || 0}/500
                                  </span>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => saveEdit(`${scene.id}-first_frame`)}
                                      className="text-xs px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 min-h-[44px] flex items-center justify-center"
                                    >
                                      保存
                                    </button>
                                    <button
                                      onClick={() => toggleEdit(`${scene.id}-first_frame`)}
                                      className="text-xs px-3 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 min-h-[44px] flex items-center justify-center"
                                    >
                                      取消
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="flex-1">
                                <div className="mb-1">
                                  {formatFramePrompt(scene.first_frame)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {formatFramePrompt(scene.first_frame).length}/500
                                </div>
                              </div>
                            )}
                            <div className="ml-2 flex gap-1 flex-shrink-0">
                              {editStates[`${scene.id}-first_frame`] ? null : (
                                <>
                                  <button
                                    onClick={() => copyToClipboard(scene.first_frame ? formatFramePrompt(scene.first_frame) : '', '首帧提示词')}
                                    className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                                    title="复制"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => toggleEdit(`${scene.id}-first_frame`)}
                                    className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                                    title="编辑"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                </>
                              )}
                              {batchProcessingScenes.includes(scene.id) && batchType === 'frames' && (
                                <svg className="w-4 h-4 text-green-500 animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-6 text-center text-gray-400 bg-gray-50 rounded-md relative">
                          <div>{language === 'zh' ? '点击生成首帧提示词' : 'Click to generate first frame'}</div>
                          {batchProcessingScenes.includes(scene.id) && batchType === 'frames' && (
                            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-md flex items-center justify-center">
                              <svg className="w-5 h-5 text-green-500 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 首帧图片生成区域 */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-900">{language === 'zh' ? '首帧参考图' : 'First Frame Image'}</label>
                        <button
                          onClick={() => generateImage(scene.id, 'first', scene.firstFrameImage ? true : false)}
                          disabled={imageGenerating[`${scene.id}-first`] || !scene.first_frame || (!scene.first_frame.scene_description && !scene.first_frame.character_performance && !scene.first_frame.camera_angle && !scene.first_frame.lighting)}
                          className="px-3 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 active:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed min-h-[44px] flex items-center justify-center gap-2"
                        >
                          {imageGenerating[`${scene.id}-first`] ? (
                            <>
                              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              {language === 'zh' ? '生成中...' : 'Generating...'}
                            </>
                          ) : (
                            scene.firstFrameImage ? (language === 'zh' ? '重新生成' : 'Regenerate') : (language === 'zh' ? '生成图片' : 'Generate Image')
                          )}
                        </button>
                      </div>
                      
                      {scene.firstFrameImage ? (
                        <div className="relative group">
                          <img 
                            src={scene.firstFrameImage} 
                            alt={`首帧图片 - ${scene.name}`}
                            className="w-full rounded-lg object-cover aspect-square max-w-md mx-auto cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => {
                              const encodedImage = encodeURIComponent(scene.firstFrameImage!);
                              router.push(`/image-viewer?image=${encodedImage}&name=${scene.name}_首帧_${scene.id}.jpg`);
                            }}
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const encodedImage = encodeURIComponent(scene.firstFrameImage!);
                                router.push(`/image-viewer?image=${encodedImage}&name=${scene.name}_首帧_${scene.id}.jpg`);
                              }}
                              className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors"
                              title="查看图片"
                            >
                              <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => generateImage(scene.id, 'first', true)}
                              className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors"
                              title="重新生成"
                            >
                              <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ) : imageGenerating[`${scene.id}-first`] ? (
                        <div className="p-12 text-center text-gray-400 bg-gray-50 rounded-md">
                          <div className="flex flex-col items-center gap-4">
                            <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <div>{language === 'zh' ? '正在生成首帧图片...' : 'Generating first frame image...'}</div>
                          </div>
                        </div>
                      ) : imageErrors[`${scene.id}-first`] ? (
                        <div className="p-8 text-center text-red-600 bg-red-50 rounded-md">
                          <div className="mb-2">
                            <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div className="text-sm">{imageErrors[`${scene.id}-first`]}</div>
                          <button
                            onClick={() => generateImage(scene.id, 'first')}
                            className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
                          >
                            {language === 'zh' ? '重试' : 'Retry'}
                          </button>
                        </div>
                      ) : (
                        <div className="p-8 text-center text-gray-400 bg-gray-50 rounded-md">
                          <div className="mb-2">
                            <svg className="w-8 h-8 mx-auto opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div className="text-sm">
                            {scene.first_frame && (scene.first_frame.scene_description || scene.first_frame.character_performance) 
                              ? (language === 'zh' ? '点击生成首帧图片' : 'Click to generate first frame image')
                              : (language === 'zh' ? '请先生成首帧提示词' : 'Please generate first frame prompt first')
                            }
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-900">尾帧提示词</label>
                        <button
                          onClick={() => generateLastFrame(scene.id)}
                          disabled={lastFrameLoading[scene.id] || batchProcessingScenes.includes(scene.id) || batchFramesLoading || !scene.dialogue || !scene.shot_prompt}
                          className="px-3 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 active:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed min-h-[44px] flex items-center justify-center gap-2"
                        >
                          {(lastFrameLoading[scene.id] || (batchProcessingScenes.includes(scene.id) && batchType === 'frames')) ? (
                            <>
                              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              {language === 'zh' ? '生成中...' : 'Generating...'}
                            </>
                          ) : (
                            (scene.last_frame && (scene.last_frame.scene_description || scene.last_frame.character_performance || scene.last_frame.camera_angle || scene.last_frame.lighting)) ? (language === 'zh' ? '重新生成' : 'Regenerate') : (language === 'zh' ? '生成' : 'Generate')
                          )}
                        </button>
                      </div>
                      {(scene.last_frame && (scene.last_frame.scene_description || scene.last_frame.character_performance || scene.last_frame.camera_angle || scene.last_frame.lighting)) ? (
                        <div className="p-3 bg-green-50 rounded-md text-gray-900 text-sm leading-relaxed">
                          <div className="flex items-start justify-between">
                            {editStates[`${scene.id}-last_frame`] ? (
                              <div className="flex-1">
                                <textarea
                                  ref={(textarea) => {
                                    if (textarea) {
                                      textarea.style.height = 'auto';
                                      textarea.style.height = Math.min(textarea.scrollHeight, 180) + 'px';
                                    }
                                  }}
                                  value={editedContent[`${scene.id}-last_frame`] || ''}
                                  onChange={(e) => {
                                    handleEditChange(`${scene.id}-last_frame`, e.target.value);
                                    handleTextareaResize(e);
                                  }}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-green-500 resize-none bg-white transition-colors duration-150"
                                  style={{ minHeight: '60px', maxHeight: '180px' }}
                                  placeholder="尾帧提示词（场景描述，角色表演，镜头角度，灯光，氛围）"
                                />
                                <div className="flex items-center justify-between mt-2">
                                  <span className={`text-xs ${(editedContent[`${scene.id}-last_frame`]?.length || 0) >= 500 ? 'text-red-500' : 'text-gray-500'}`}>
                                    {editedContent[`${scene.id}-last_frame`]?.length || 0}/500
                                  </span>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => saveEdit(`${scene.id}-last_frame`)}
                                      className="text-xs px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 min-h-[44px] flex items-center justify-center"
                                    >
                                      保存
                                    </button>
                                    <button
                                      onClick={() => toggleEdit(`${scene.id}-last_frame`)}
                                      className="text-xs px-3 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 min-h-[44px] flex items-center justify-center"
                                    >
                                      取消
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="flex-1">
                                <div className="mb-1">
                                  {formatFramePrompt(scene.last_frame)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {formatFramePrompt(scene.last_frame).length}/500
                                </div>
                              </div>
                            )}
                            <div className="ml-2 flex gap-1 flex-shrink-0">
                              {editStates[`${scene.id}-last_frame`] ? null : (
                                <>
                                  <button
                                    onClick={() => copyToClipboard(scene.last_frame ? formatFramePrompt(scene.last_frame) : '', '尾帧提示词')}
                                    className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                                    title="复制"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => toggleEdit(`${scene.id}-last_frame`)}
                                    className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                                    title="编辑"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                </>
                              )}
                              {batchProcessingScenes.includes(scene.id) && batchType === 'frames' && (
                                <svg className="w-4 h-4 text-green-500 animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-6 text-center text-gray-400 bg-gray-50 rounded-md relative">
                          <div>{language === 'zh' ? '点击生成尾帧提示词' : 'Click to generate last frame'}</div>
                          {batchProcessingScenes.includes(scene.id) && batchType === 'frames' && (
                            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-md flex items-center justify-center">
                              <svg className="w-5 h-5 text-green-500 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 尾帧图片生成区域 */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-900">{language === 'zh' ? '尾帧参考图' : 'Last Frame Image'}</label>
                        <button
                          onClick={() => generateImage(scene.id, 'last', scene.lastFrameImage ? true : false)}
                          disabled={imageGenerating[`${scene.id}-last`] || !scene.last_frame || (!scene.last_frame.scene_description && !scene.last_frame.character_performance && !scene.last_frame.camera_angle && !scene.last_frame.lighting)}
                          className="px-3 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 active:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed min-h-[44px] flex items-center justify-center gap-2"
                        >
                          {imageGenerating[`${scene.id}-last`] ? (
                            <>
                              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              {language === 'zh' ? '生成中...' : 'Generating...'}
                            </>
                          ) : (
                            scene.lastFrameImage ? (language === 'zh' ? '重新生成' : 'Regenerate') : (language === 'zh' ? '生成图片' : 'Generate Image')
                          )}
                        </button>
                      </div>
                      
                      {scene.lastFrameImage ? (
                        <div className="relative group">
                          <img 
                            src={scene.lastFrameImage} 
                            alt={`尾帧图片 - ${scene.name}`}
                            className="w-full rounded-lg object-cover aspect-square max-w-md mx-auto cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => {
                              const encodedImage = encodeURIComponent(scene.lastFrameImage!);
                              router.push(`/image-viewer?image=${encodedImage}&name=${scene.name}_尾帧_${scene.id}.jpg`);
                            }}
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const encodedImage = encodeURIComponent(scene.lastFrameImage!);
                                router.push(`/image-viewer?image=${encodedImage}&name=${scene.name}_尾帧_${scene.id}.jpg`);
                              }}
                              className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors"
                              title="查看图片"
                            >
                              <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => generateImage(scene.id, 'last', true)}
                              className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors"
                              title="重新生成"
                            >
                              <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ) : imageGenerating[`${scene.id}-last`] ? (
                        <div className="p-12 text-center text-gray-400 bg-gray-50 rounded-md">
                          <div className="flex flex-col items-center gap-4">
                            <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <div>{language === 'zh' ? '正在生成尾帧图片...' : 'Generating last frame image...'}</div>
                          </div>
                        </div>
                      ) : imageErrors[`${scene.id}-last`] ? (
                        <div className="p-8 text-center text-red-600 bg-red-50 rounded-md">
                          <div className="mb-2">
                            <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div className="text-sm">{imageErrors[`${scene.id}-last`]}</div>
                          <button
                            onClick={() => generateImage(scene.id, 'last')}
                            className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
                          >
                            {language === 'zh' ? '重试' : 'Retry'}
                          </button>
                        </div>
                      ) : (
                        <div className="p-8 text-center text-gray-400 bg-gray-50 rounded-md">
                          <div className="mb-2">
                            <svg className="w-8 h-8 mx-auto opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div className="text-sm">
                            {scene.last_frame && (scene.last_frame.scene_description || scene.last_frame.character_performance) 
                              ? (language === 'zh' ? '点击生成尾帧图片' : 'Click to generate last frame image')
                              : (language === 'zh' ? '请先生成尾帧提示词' : 'Please generate last frame prompt first')
                            }
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {/* 新增分镜按钮 */}
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
            <button
              onClick={addScene}
              className="w-full py-3 px-4 bg-gray-900 text-white rounded-lg hover:bg-gray-800 active:bg-gray-700 min-h-[44px] flex items-center justify-center gap-2 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {language === 'zh' ? '新增分镜' : 'Add New Scene'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/contexts/AppContext';
import { showErrorAlert } from '@/lib/error-handler';

interface Scene {
  id: string;
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
  first_frame_image?: string;
  last_frame_image?: string;
}

interface DurationConfig {
  seconds: number;
  minWords: number;
  maxWords: number;
  recommendedWords: number;
  description: string;
}

export default function ManualCreatePage() {
  const { t, language } = useApp();
  
  // 时长配置
  const durationConfigs: DurationConfig[] = [
    {
      seconds: 5,
      minWords: 35,
      maxWords: 50,
      recommendedWords: 42,
      description: language === 'zh' ? '5秒分镜' : '5s Scene'
    },
    {
      seconds: 10,
      minWords: 70,
      maxWords: 100,
      recommendedWords: 89,
      description: language === 'zh' ? '10秒分镜' : '10s Scene'
    },
    {
      seconds: 12,
      minWords: 84,
      maxWords: 120,
      recommendedWords: 107,
      description: language === 'zh' ? '12秒分镜' : '12s Scene'
    }
  ];

  const [scenes, setScenes] = useState<Scene[]>([
    {
      id: 'scene_1',
      name: '分镜1（5秒）',
      dialogue: '',
      duration: 5
    }
  ]);

  const [mounted, setMounted] = useState(false);
  const [collapsedScenes, setCollapsedScenes] = useState<{[key: string]: boolean}>({});
  const [readingStates, setReadingStates] = useState<{[key: string]: 'idle' | 'playing' | 'paused'}>({});
  const [currentReadingId, setCurrentReadingId] = useState<string | null>(null);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const router = useRouter();
  
  // 生成提示词相关的loading状态
  const [shotLoading, setShotLoading] = useState<{[key: string]: boolean}>({});
  const [firstFrameLoading, setFirstFrameLoading] = useState<{[key: string]: boolean}>({});
  const [lastFrameLoading, setLastFrameLoading] = useState<{[key: string]: boolean}>({});

  // 图片生成相关的loading状态
  const [firstImageLoading, setFirstImageLoading] = useState<{[key: string]: boolean}>({});
  const [lastImageLoading, setLastImageLoading] = useState<{[key: string]: boolean}>({});

  // 提示词编辑状态（仅用于提示词，对白不再需要）
  const [editStates, setEditStates] = useState<{[key: string]: boolean}>({});
  const [editedContent, setEditedContent] = useState<{[key: string]: string}>({});
  
  // Session ID，用于与数据库同步
  const [sessionId, setSessionId] = useState<string>('');
  
  const textareaRefs = useRef<{[key: string]: HTMLTextAreaElement | null}>({});

  // 确保客户端hydration完成
  useEffect(() => {
    const initializeData = async () => {
      setMounted(true);

      // 检查浏览器是否支持语音合成
      if (typeof window !== 'undefined' && !window.speechSynthesis) {
        setSpeechSupported(false);
      }

      // 初始化展开状态：分镜1默认展开，其他分镜默认折叠
      const collapsed: {[key: string]: boolean} = {};
      scenes.forEach((scene) => {
        collapsed[scene.id] = scene.id !== 'scene_1';
      });
      setCollapsedScenes(collapsed);

      // 尝试从数据库恢复session
      try {
        const response = await fetch('/api/database/session?scene_type=manual');
        
        if (response.ok) {
          const result = await response.json();
          
          if (result.success && result.sessionData && result.sessionData.scene_type === 'manual') {
            // 从数据库恢复数据
            const restoredScenes = (result.sessionData.scenes || []).map((scene: any) => ({
              id: `scene_${scene.id}`,
              name: scene.name,
              dialogue: scene.dialogue,
              duration: scene.duration,
              shot_prompt: scene.shot_prompt,
              first_frame: scene.first_frame,
              last_frame: scene.last_frame,
              first_frame_image: scene.first_frame_image,
              last_frame_image: scene.last_frame_image
            }));
            
            setScenes(restoredScenes);
            setSessionId(result.sessionData.sessionId);
            
            // 同步到sessionStorage
            sessionStorage.setItem('manualCreateData', JSON.stringify(restoredScenes));
            
            console.log('成功从数据库恢复手工分镜session');
            return;
          }
        }
      } catch (error) {
        console.error('从数据库恢复session失败:', error);
      }

      // 如果数据库中没有session，尝试从sessionStorage恢复（向后兼容）
      const storedData = sessionStorage.getItem('manualCreateData');
      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData);
          setScenes(parsedData);
          
          // 创建数据库session
          const response = await fetch('/api/manual/create-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ scenes: parsedData })
          });
          const data = await response.json();
          if (data.success && data.sessionId) {
            setSessionId(data.sessionId);
          }
          return;
        } catch (error) {
          console.error('从sessionStorage恢复失败:', error);
        }
      }

      // 如果都没有，创建新的session
      try {
        const response = await fetch('/api/manual/create-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scenes })
        });
        const data = await response.json();
        if (data.success && data.sessionId) {
          setSessionId(data.sessionId);
        }
      } catch (error) {
        console.error('创建session失败:', error);
      }
    };

    initializeData();
  }, []);

  // 自动调整textarea高度
  useEffect(() => {
    Object.keys(textareaRefs.current).forEach(id => {
      const textarea = textareaRefs.current[id];
      if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
      }
    });
  }, [scenes, editedContent]);

  // 自动保存数据到数据库
  useEffect(() => {
    if (mounted && scenes.length > 0) {
      const saveToDatabase = async () => {
        try {
          await fetch('/api/manual/save-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ scenes })
          });
        } catch (error) {
          console.error('保存数据失败:', error);
        }
      };
      
      // 防抖处理，避免频繁保存
      const timer = setTimeout(saveToDatabase, 500);
      return () => clearTimeout(timer);
    }
  }, [scenes, mounted]);

  // 自适应textarea高度的处理函数
  const handleTextareaResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    textarea.style.height = 'auto'; // 重置高度
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px'; // 设置新高度，最大200px
  };

  // 获取当前分镜的配置
  const getCurrentConfig = (duration: number) => {
    return durationConfigs.find(config => config.seconds === duration);
  };

  // 验证对白长度（仅检查空值和500字软限制，不强制校验时长范围）
  const validateDialogue = (dialogue: string, duration: number) => {
    const wordCount = dialogue.trim().length;
    if (wordCount === 0) {
      return { valid: false, message: language === 'zh' ? '对白不能为空' : 'Dialogue cannot be empty' };
    }
    if (wordCount > 500) {
      return { valid: false, message: language === 'zh' ? '对白不能超过500字' : 'Dialogue cannot exceed 500 characters' };
    }
    return { valid: true, message: '' };
  };

  // 获取对白最大字符数
  const getDialogueMaxChars = (duration: number) => {
    const config = getCurrentConfig(duration);
    return config ? config.maxWords : 100;
  };

  // 格式化首尾帧提示词
  const formatFramePrompt = (frame: Scene['first_frame'] | Scene['last_frame']) => {
    if (!frame) return '';
    const parts = [frame.scene_description, frame.character_performance, frame.camera_angle, frame.lighting];
    if ('atmosphere' in frame && frame.atmosphere) {
      parts.push(frame.atmosphere);
    }
    return parts.filter(Boolean).join('，');
  };

  // 添加新分镜
  const addNewScene = () => {
    const lastScene = scenes[scenes.length - 1];
    const newScene: Scene = {
      id: `scene_${Date.now()}`,
      name: `分镜${scenes.length + 1}（${lastScene.duration}秒）`,
      dialogue: '',
      duration: lastScene.duration
    };
    
    const updatedScenes = [...scenes, newScene];
    setScenes(updatedScenes);
    
    // 新分镜默认展开
    setCollapsedScenes(prev => ({ ...prev, [newScene.id]: false }));
    
    // 自动聚焦到新分镜的对白输入框
    setTimeout(() => {
      const textarea = textareaRefs.current[newScene.id];
      if (textarea) {
        textarea.focus();
      }
    }, 100);
  };

  // 删除分镜
  const deleteScene = (sceneId: string) => {
    if (scenes.length <= 1) {
      alert(language === 'zh' ? '至少需要保留一个分镜' : 'At least one scene must be kept');
      return;
    }
    
    if (confirm(`${language === 'zh' ? '确定要删除分镜' : 'Confirm to delete scene'} ${scenes.find(s => s.id === sceneId)?.name}？`)) {
      const updatedScenes = scenes.filter(scene => scene.id !== sceneId)
        .map((scene, index) => ({
          ...scene,
          name: `分镜${index + 1}（${scene.duration}秒）`
        }));
      
      setScenes(updatedScenes);
      
      // 更新折叠状态
      const newCollapsed: {[key: string]: boolean} = {};
      updatedScenes.forEach((scene) => {
        newCollapsed[scene.id] = scene.id !== updatedScenes[0].id;
      });
      setCollapsedScenes(newCollapsed);
    }
  };

  // 更新分镜
  const updateScene = (sceneId: string, updates: Partial<Scene>) => {
    setScenes(scenes.map(scene => {
      if (scene.id === sceneId) {
        // 如果修改了duration，同步更新分镜名称
        if (updates.duration !== undefined && updates.duration !== scene.duration) {
          const sceneIndex = scenes.findIndex(s => s.id === sceneId);
          const newName = `分镜${sceneIndex + 1}（${updates.duration}秒）`;
          return { ...scene, ...updates, name: newName };
        }
        return { ...scene, ...updates };
      }
      return scene;
    }));
  };

  // 对白输入变更（直接更新，不做长度限制校验）
  const handleDialogueChange = (sceneId: string, value: string) => {
    // 只做500字软限制，超过也不阻止输入
    updateScene(sceneId, { dialogue: value });
  };

  // 朗读功能
  const handleReadDialogue = (sceneId: string, dialogue: string) => {
    if (!speechSupported) {
      alert(language === 'zh' ? '您的浏览器不支持语音朗读功能' : 'Your browser does not support speech synthesis');
      return;
    }

    // 停止当前朗读
    if (currentReadingId && currentReadingId !== sceneId) {
      window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(dialogue);
    utterance.lang = language === 'zh' ? 'zh-CN' : 'en-US';
    utterance.rate = 0.9;

    utterance.onstart = () => {
      setReadingStates({ ...readingStates, [sceneId]: 'playing' });
      setCurrentReadingId(sceneId);
    };

    utterance.onend = () => {
      setReadingStates({ ...readingStates, [sceneId]: 'idle' });
      setCurrentReadingId(null);
    };

    utterance.onerror = () => {
      setReadingStates({ ...readingStates, [sceneId]: 'idle' });
      setCurrentReadingId(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  // 停止朗读
  const stopReading = (sceneId: string) => {
    window.speechSynthesis.cancel();
    setReadingStates({ ...readingStates, [sceneId]: 'idle' });
    setCurrentReadingId(null);
  };

  // 复制功能
  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(type);
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (err) {
      // 降级方案
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopySuccess(type);
        setTimeout(() => setCopySuccess(null), 2000);
      } catch (err) {
        alert(language === 'zh' ? '复制失败，请手动复制' : 'Copy failed, please copy manually');
      }
      document.body.removeChild(textArea);
    }
  };

  // 提示词编辑功能（仅用于提示词）
  const toggleEdit = (key: string) => {
    const [sceneId, field] = key.split('-');
    const scene = scenes.find(s => s.id === sceneId);
    
    if (!scene) return;
    
    if (editStates[key]) {
      // 退出编辑模式
      setEditStates(prev => ({ ...prev, [key]: false }));
    } else {
      // 进入编辑模式
      setEditStates(prev => ({ ...prev, [key]: true }));
      
      // 初始化编辑内容
      if (field === 'shot_prompt') {
        setEditedContent(prev => ({ ...prev, [key]: scene.shot_prompt || '' }));
      } else if (field === 'first_frame') {
        setEditedContent(prev => ({ ...prev, [key]: scene.first_frame ? formatFramePrompt(scene.first_frame) : '' }));
      } else if (field === 'last_frame') {
        setEditedContent(prev => ({ ...prev, [key]: scene.last_frame ? formatFramePrompt(scene.last_frame) : '' }));
      }
    }
  };

  // 提示词编辑内容变更
  const handleEditChange = (key: string, value: string) => {
    // 所有提示词字段限制500字符
    const maxLength = 500;
    if (value.length <= maxLength) {
      setEditedContent(prev => ({ ...prev, [key]: value }));
    }
  };

  // 保存提示词编辑
  const saveEdit = (key: string) => {
    const [sceneId, field] = key.split('-');
    const content = editedContent[key] || '';
    
    let updatedData;
    
    // 更新数据
    if (field === 'shot_prompt') {
      updatedData = scenes.map(scene => 
        scene.id === sceneId 
          ? { ...scene, shot_prompt: content }
          : scene
      );
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
      
      updatedData = scenes.map(scene => 
        scene.id === sceneId 
          ? { ...scene, [field]: frameData }
          : scene
      );
    }
    
    if (updatedData) {
      setScenes(updatedData);
    }
    
    // 退出编辑模式
    setEditStates(prev => ({ ...prev, [key]: false }));
  };

  // 生成镜头提示词
  const generateShotPrompt = async (sceneId: string) => {
    const scene = scenes.find(s => s.id === sceneId);
    if (!scene || !scene.dialogue.trim()) {
      alert(language === 'zh' ? '请先输入对白内容' : 'Please enter dialogue content first');
      return;
    }

    setShotLoading({ ...shotLoading, [sceneId]: true });

    try {
      const response = await fetch('/api/generate-shot-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sceneId: parseInt(scene.id.replace('scene_', '')), dialogue: scene.dialogue, duration: scene.duration })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw { code: errorData.code, message: errorData.message, requestId: errorData.requestId };
      }

      const data = await response.json();

      if (data.success && data.shot_prompt) {
        // 强制截断到500字符
        const maxLength = 500;
        const truncatedShotPrompt = data.shot_prompt.length > maxLength
          ? data.shot_prompt.substring(0, maxLength)
          : data.shot_prompt;

        updateScene(sceneId, { shot_prompt: truncatedShotPrompt });
      } else {
        alert(data.error || (language === 'zh' ? '生成镜头提示词失败' : 'Failed to generate shot prompt'));
      }
    } catch (error) {
      console.error('Error generating shot prompt:', error);
      showErrorAlert(error, '生成镜头提示词失败');
    } finally {
      setShotLoading({ ...shotLoading, [sceneId]: false });
    }
  };

  // 生成首帧提示词
  const generateFirstFrame = async (sceneId: string) => {
    const scene = scenes.find(s => s.id === sceneId);
    if (!scene || !scene.dialogue.trim()) {
      alert(language === 'zh' ? '请先输入对白内容' : 'Please enter dialogue content first');
      return;
    }

    setFirstFrameLoading({ ...firstFrameLoading, [sceneId]: true });

    try {
      const response = await fetch('/api/generate-frames', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sceneId: parseInt(scene.id.replace('scene_', '')),
          dialogue: scene.dialogue,
          duration: scene.duration,
          frameType: 'first'
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw { code: errorData.code, message: errorData.message, requestId: errorData.requestId };
      }

      const data = await response.json();

      if (data.success && data.first_frame) {
        // 强制截断每个字段到100字符
        const maxLength = 100;
        const truncatedFirstFrame: Scene['first_frame'] = {
          scene_description: data.first_frame.scene_description?.length > maxLength
            ? data.first_frame.scene_description.substring(0, maxLength)
            : data.first_frame.scene_description,
          character_performance: data.first_frame.character_performance?.length > maxLength
            ? data.first_frame.character_performance.substring(0, maxLength)
            : data.first_frame.character_performance,
          camera_angle: data.first_frame.camera_angle?.length > maxLength
            ? data.first_frame.camera_angle.substring(0, maxLength)
            : data.first_frame.camera_angle,
          lighting: data.first_frame.lighting?.length > maxLength
            ? data.first_frame.lighting.substring(0, maxLength)
            : data.first_frame.lighting,
          atmosphere: data.first_frame.atmosphere?.length > maxLength
            ? data.first_frame.atmosphere.substring(0, maxLength)
            : data.first_frame.atmosphere
        };

        updateScene(sceneId, {
          first_frame: truncatedFirstFrame
        });
      } else {
        alert(data.error || (language === 'zh' ? '生成首帧提示词失败' : 'Failed to generate first frame prompt'));
      }
    } catch (error) {
      console.error('Error generating first frame:', error);
      showErrorAlert(error, '生成首帧提示词失败');
    } finally {
      setFirstFrameLoading({ ...firstFrameLoading, [sceneId]: false });
    }
  };

  // 生成尾帧提示词
  const generateLastFrame = async (sceneId: string) => {
    const scene = scenes.find(s => s.id === sceneId);
    if (!scene || !scene.dialogue.trim()) {
      alert(language === 'zh' ? '请先输入对白内容' : 'Please enter dialogue content first');
      return;
    }

    setLastFrameLoading({ ...lastFrameLoading, [sceneId]: true });

    try {
      const response = await fetch('/api/generate-frames', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sceneId: parseInt(scene.id.replace('scene_', '')),
          dialogue: scene.dialogue,
          duration: scene.duration,
          frameType: 'last'
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw { code: errorData.code, message: errorData.message, requestId: errorData.requestId };
      }

      const data = await response.json();

      if (data.success && data.last_frame) {
        // 强制截断每个字段到100字符
        const maxLength = 100;
        const truncatedLastFrame: Scene['last_frame'] = {
          scene_description: data.last_frame.scene_description?.length > maxLength
            ? data.last_frame.scene_description.substring(0, maxLength)
            : data.last_frame.scene_description,
          character_performance: data.last_frame.character_performance?.length > maxLength
            ? data.last_frame.character_performance.substring(0, maxLength)
            : data.last_frame.character_performance,
          camera_angle: data.last_frame.camera_angle?.length > maxLength
            ? data.last_frame.camera_angle.substring(0, maxLength)
            : data.last_frame.camera_angle,
          lighting: data.last_frame.lighting?.length > maxLength
            ? data.last_frame.lighting.substring(0, maxLength)
            : data.last_frame.lighting
        };

        updateScene(sceneId, {
          last_frame: truncatedLastFrame
        });
      } else {
        alert(data.error || (language === 'zh' ? '生成尾帧提示词失败' : 'Failed to generate last frame prompt'));
      }
    } catch (error) {
      console.error('Error generating last frame:', error);
      showErrorAlert(error, '生成尾帧提示词失败');
    } finally {
      setLastFrameLoading({ ...lastFrameLoading, [sceneId]: false });
    }
  };

  // 生成首帧参考图
  const generateFirstFrameImage = async (sceneId: string) => {
    const scene = scenes.find(s => s.id === sceneId);
    if (!scene || !scene.first_frame) {
      alert(language === 'zh' ? '请先生成首帧提示词' : 'Please generate first frame prompt first');
      return;
    }

    const prompt = formatFramePrompt(scene.first_frame);
    if (!prompt.trim()) {
      alert(language === 'zh' ? '首帧提示词为空' : 'First frame prompt is empty');
      return;
    }

    setFirstImageLoading({ ...firstImageLoading, [sceneId]: true });

    try {
      const numericSceneId = parseInt(sceneId.replace('scene_', ''));
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionId,
          sceneId: numericSceneId,
          frameType: 'first',
          prompt: prompt,
          forceRegenerate: true
        })
      });

      const data = await response.json();

      if (data.success && (data.imageUrl || data.data)) {
        const imageUrl = data.imageUrl || data.data;
        updateScene(sceneId, { first_frame_image: imageUrl });
      } else {
        alert(data.error || (language === 'zh' ? '生成首帧参考图失败' : 'Failed to generate first frame reference image'));
      }
    } catch (error) {
      console.error('Error generating first frame image:', error);
      alert(language === 'zh' ? '生成首帧参考图失败' : 'Failed to generate first frame reference image');
    } finally {
      setFirstImageLoading({ ...firstImageLoading, [sceneId]: false });
    }
  };

  // 生成尾帧参考图
  const generateLastFrameImage = async (sceneId: string) => {
    const scene = scenes.find(s => s.id === sceneId);
    if (!scene || !scene.last_frame) {
      alert(language === 'zh' ? '请先生成尾帧提示词' : 'Please generate last frame prompt first');
      return;
    }

    const prompt = formatFramePrompt(scene.last_frame);
    if (!prompt.trim()) {
      alert(language === 'zh' ? '尾帧提示词为空' : 'Last frame prompt is empty');
      return;
    }

    setLastImageLoading({ ...lastImageLoading, [sceneId]: true });

    try {
      const numericSceneId = parseInt(sceneId.replace('scene_', ''));
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionId,
          sceneId: numericSceneId,
          frameType: 'last',
          prompt: prompt,
          forceRegenerate: true
        })
      });

      const data = await response.json();

      if (data.success && (data.imageUrl || data.data)) {
        const imageUrl = data.imageUrl || data.data;
        updateScene(sceneId, { last_frame_image: imageUrl });
      } else {
        alert(data.error || (language === 'zh' ? '生成尾帧参考图失败' : 'Failed to generate last frame reference image'));
      }
    } catch (error) {
      console.error('Error generating last frame image:', error);
      alert(language === 'zh' ? '生成尾帧参考图失败' : 'Failed to generate last frame reference image');
    } finally {
      setLastImageLoading({ ...lastImageLoading, [sceneId]: false });
    }
  };

  // 保存分镜
  if (!mounted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* 顶部导航 */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <h1 className="text-lg sm:text-xl font-medium text-gray-900 dark:text-gray-100">
            {language === 'zh' ? '手工创建分镜' : 'Manual Scene Creation'} · {scenes.length} {language === 'zh' ? '个' : ''}
          </h1>
          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 text-right">
            <div>{scenes.reduce((sum, scene) => sum + scene.duration, 0)}{language === 'zh' ? '秒' : 's'}</div>
            <div className="hidden sm:inline">{scenes.reduce((sum, scene) => sum + scene.dialogue.length, 0)}{language === 'zh' ? '字' : ' chars'}</div>
          </div>
        </div>

        {/* 分镜列表 */}
        <div className="space-y-4 sm:space-y-6">
          {scenes.map((scene, index) => (
            <div key={scene.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              {/* 分镜头部 */}
              <div 
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors active:bg-gray-200 dark:active:bg-gray-600"
                onClick={() => setCollapsedScenes(prev => ({ ...prev, [scene.id]: !prev[scene.id] }))}
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100">{scene.name}</span>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">({scene.duration}{language === 'zh' ? '秒' : 's'})</span>
                    <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">•</span>
                    <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{scene.dialogue.length}{language === 'zh' ? '字' : ' chars'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {scenes.length > 1 && (
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
                  {/* 对白内容 - 始终可编辑 */}
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
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="复制对白"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => {
                            if (readingStates[scene.id] === 'playing') {
                              stopReading(scene.id);
                            } else {
                              handleReadDialogue(scene.id, scene.dialogue);
                            }
                          }}
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
                    <textarea
                      ref={(textarea) => {
                        if (textarea) {
                          textarea.style.height = 'auto';
                          textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
                        }
                      }}
                      value={scene.dialogue}
                      onChange={(e) => {
                        handleDialogueChange(scene.id, e.target.value);
                        handleTextareaResize(e);
                      }}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:border-blue-500 resize-none bg-white dark:bg-gray-800 transition-colors duration-150"
                      style={{ minHeight: '75px', maxHeight: '200px' }}
                      placeholder={language === 'zh' ? '输入对白内容...' : 'Enter dialogue content...'}
                    />
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {scene.dialogue.length} / {language === 'zh' ? '建议' : 'Recommended'} {getCurrentConfig(scene.duration)?.minWords || 35}-{getCurrentConfig(scene.duration)?.maxWords || 50}
                      </span>
                    </div>
                  </div>

                  {/* 时长选择 */}
                  <div>
                    <label className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 block">
                      {language === 'zh' ? '分镜时长' : 'Scene Duration'}
                    </label>
                    <div className="flex gap-2">
                      {durationConfigs.map(config => (
                        <button
                          key={config.seconds}
                          onClick={() => updateScene(scene.id, { duration: config.seconds })}
                          className={`px-4 py-3 rounded-lg transition-colors min-h-[44px] flex items-center justify-center ${
                            scene.duration === config.seconds
                              ? 'bg-gray-900 text-white'
                              : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {config.description}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 镜头提示词 */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-900">镜头提示词</label>
                      <button
                        onClick={() => generateShotPrompt(scene.id)}
                        disabled={shotLoading[scene.id] || !scene.dialogue}
                        className="px-3 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 active:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed min-h-[44px] flex items-center justify-center gap-2"
                      >
                        {shotLoading[scene.id] ? (
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
                      <div className="p-3 bg-blue-50 rounded-md text-gray-900 text-sm leading-relaxed">
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
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500 resize-none bg-white transition-colors duration-150"
                                style={{ minHeight: '60px', maxHeight: '180px' }}
                                placeholder="镜头提示词..."
                              />
                              <div className="flex items-center justify-between mt-2">
                                <span className={`text-xs ${(editedContent[`${scene.id}-shot_prompt`]?.length || 0) >= 500 ? 'text-red-500' : 'text-gray-500'}`}>
                                  {editedContent[`${scene.id}-shot_prompt`]?.length || 0}/500
                                </span>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => saveEdit(`${scene.id}-shot_prompt`)}
                                    className="text-xs px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 min-h-[44px] flex items-center justify-center"
                                  >
                                    {language === 'zh' ? '保存' : 'Save'}
                                  </button>
                                  <button
                                    onClick={() => toggleEdit(`${scene.id}-shot_prompt`)}
                                    className="text-xs px-3 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 min-h-[44px] flex items-center justify-center"
                                  >
                                    {language === 'zh' ? '取消' : 'Cancel'}
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
                                {scene.shot_prompt.length}/500
                              </div>
                            </div>
                          )}
                          <div className="ml-2 flex gap-1 flex-shrink-0">
                            {editStates[`${scene.id}-shot_prompt`] ? null : (
                              <>
                                <button
                                  onClick={() => copyToClipboard(scene.shot_prompt || '', '镜头提示词')}
                                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                  title="复制"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => toggleEdit(`${scene.id}-shot_prompt`)}
                                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                  title="编辑"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 text-center text-gray-400 bg-gray-50 rounded-md">
                        <div>{language === 'zh' ? '点击生成镜头提示词' : 'Click to generate shot prompt'}</div>
                      </div>
                    )}
                  </div>

                  {/* 首帧提示词 */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-900">首帧提示词</label>
                      <button
                        onClick={() => generateFirstFrame(scene.id)}
                        disabled={firstFrameLoading[scene.id] || !scene.dialogue || !scene.shot_prompt}
                        className="px-3 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 active:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed min-h-[44px] flex items-center justify-center gap-2"
                      >
                        {firstFrameLoading[scene.id] ? (
                          <>
                            <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {language === 'zh' ? '生成中...' : 'Generating...'}
                          </>
                        ) : (
                          (scene.first_frame && (scene.first_frame.scene_description || scene.first_frame.character_performance)) ? (language === 'zh' ? '重新生成' : 'Regenerate') : (language === 'zh' ? '生成' : 'Generate')
                        )}
                      </button>
                    </div>
                    {(scene.first_frame && (scene.first_frame.scene_description || scene.first_frame.character_performance)) ? (
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
                                placeholder={language === 'zh' ? '首帧提示词（场景描述，角色表演，镜头角度，灯光，氛围）' : 'First frame prompt (scene, performance, camera, lighting, atmosphere)'}
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
                                    {language === 'zh' ? '保存' : 'Save'}
                                  </button>
                                  <button
                                    onClick={() => toggleEdit(`${scene.id}-first_frame`)}
                                    className="text-xs px-3 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 min-h-[44px] flex items-center justify-center"
                                  >
                                    {language === 'zh' ? '取消' : 'Cancel'}
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
                                  onClick={() => copyToClipboard(formatFramePrompt(scene.first_frame), '首帧提示词')}
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
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 text-center text-gray-400 bg-gray-50 rounded-md">
                        <div>{language === 'zh' ? '点击生成首帧提示词' : 'Click to generate first frame prompt'}</div>
                      </div>
                    )}

                    {/* 首帧参考图 */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-900">{language === 'zh' ? '首帧参考图' : 'First Frame Image'}</label>
                        <button
                          onClick={() => generateFirstFrameImage(scene.id)}
                          disabled={firstImageLoading[scene.id] || !scene.first_frame}
                          className="px-3 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 active:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed min-h-[44px] flex items-center justify-center gap-2"
                        >
                          {firstImageLoading[scene.id] ? (
                            <>
                              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              {language === 'zh' ? '生成中...' : 'Generating...'}
                            </>
                          ) : (
                            scene.first_frame_image ? (language === 'zh' ? '重新生成' : 'Regenerate') : (language === 'zh' ? '生成' : 'Generate')
                          )}
                        </button>
                      </div>
                      {scene.first_frame_image ? (
                        <div className="mt-2">
                          <img
                            src={scene.first_frame_image}
                            alt={language === 'zh' ? '首帧参考图' : 'First Frame Image'}
                            className="w-full h-auto rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:opacity-90 transition-opacity"
                            style={{ maxHeight: '400px', objectFit: 'contain' }}
                            onClick={() => {
                              const encodedImage = encodeURIComponent(scene.first_frame_image!);
                              router.push(`/image-viewer?image=${encodedImage}&name=${scene.name}_首帧.jpg`);
                            }}
                          />
                        </div>
                      ) : (
                        <div className="p-6 text-center text-gray-400 bg-gray-50 rounded-md">
                          <div>{language === 'zh' ? '点击生成首帧参考图' : 'Click to generate first frame image'}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 尾帧提示词 */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-900">尾帧提示词</label>
                      <button
                        onClick={() => generateLastFrame(scene.id)}
                        disabled={lastFrameLoading[scene.id] || !scene.dialogue || !scene.shot_prompt}
                        className="px-3 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 active:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed min-h-[44px] flex items-center justify-center gap-2"
                      >
                        {lastFrameLoading[scene.id] ? (
                          <>
                            <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {language === 'zh' ? '生成中...' : 'Generating...'}
                          </>
                        ) : (
                          (scene.last_frame && (scene.last_frame.scene_description || scene.last_frame.character_performance)) ? (language === 'zh' ? '重新生成' : 'Regenerate') : (language === 'zh' ? '生成' : 'Generate')
                        )}
                      </button>
                    </div>
                    {(scene.last_frame && (scene.last_frame.scene_description || scene.last_frame.character_performance)) ? (
                      <div className="p-3 bg-purple-50 rounded-md text-gray-900 text-sm leading-relaxed">
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
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-purple-500 resize-none bg-white transition-colors duration-150"
                                style={{ minHeight: '60px', maxHeight: '180px' }}
                                placeholder={language === 'zh' ? '尾帧提示词（场景描述，角色表演，镜头角度，灯光）' : 'Last frame prompt (scene, performance, camera, lighting)'}
                              />
                              <div className="flex items-center justify-between mt-2">
                                <span className={`text-xs ${(editedContent[`${scene.id}-last_frame`]?.length || 0) >= 500 ? 'text-red-500' : 'text-gray-500'}`}>
                                  {editedContent[`${scene.id}-last_frame`]?.length || 0}/500
                                </span>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => saveEdit(`${scene.id}-last_frame`)}
                                    className="text-xs px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 min-h-[44px] flex items-center justify-center"
                                  >
                                    {language === 'zh' ? '保存' : 'Save'}
                                  </button>
                                  <button
                                    onClick={() => toggleEdit(`${scene.id}-last_frame`)}
                                    className="text-xs px-3 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 min-h-[44px] flex items-center justify-center"
                                  >
                                    {language === 'zh' ? '取消' : 'Cancel'}
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
                                  onClick={() => copyToClipboard(formatFramePrompt(scene.last_frame), '尾帧提示词')}
                                  className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                                  title="复制"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => toggleEdit(`${scene.id}-last_frame`)}
                                  className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                                  title="编辑"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 text-center text-gray-400 bg-gray-50 rounded-md">
                        <div>{language === 'zh' ? '点击生成尾帧提示词' : 'Click to generate last frame prompt'}</div>
                      </div>
                    )}

                    {/* 尾帧参考图 */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-900">{language === 'zh' ? '尾帧参考图' : 'Last Frame Image'}</label>
                        <button
                          onClick={() => generateLastFrameImage(scene.id)}
                          disabled={lastImageLoading[scene.id] || !scene.last_frame}
                          className="px-3 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 active:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed min-h-[44px] flex items-center justify-center gap-2"
                        >
                          {lastImageLoading[scene.id] ? (
                            <>
                              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              {language === 'zh' ? '生成中...' : 'Generating...'}
                            </>
                          ) : (
                            scene.last_frame_image ? (language === 'zh' ? '重新生成' : 'Regenerate') : (language === 'zh' ? '生成' : 'Generate')
                          )}
                        </button>
                      </div>
                      {scene.last_frame_image ? (
                        <div className="mt-2">
                          <img
                            src={scene.last_frame_image}
                            alt={language === 'zh' ? '尾帧参考图' : 'Last Frame Image'}
                            className="w-full h-auto rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:opacity-90 transition-opacity"
                            style={{ maxHeight: '400px', objectFit: 'contain' }}
                            onClick={() => {
                              const encodedImage = encodeURIComponent(scene.last_frame_image!);
                              router.push(`/image-viewer?image=${encodedImage}&name=${scene.name}_尾帧.jpg`);
                            }}
                          />
                        </div>
                      ) : (
                        <div className="p-6 text-center text-gray-400 bg-gray-50 rounded-md">
                          <div>{language === 'zh' ? '点击生成尾帧参考图' : 'Click to generate last frame image'}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 添加新分镜按钮 */}
        <div className="mt-6 sm:mt-8 flex justify-center">
          <button
            onClick={addNewScene}
            className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 active:bg-gray-700 min-h-[44px] text-sm sm:text-base flex items-center justify-center gap-2"
          >
            {language === 'zh' ? '添加新分镜' : 'Add New Scene'}
          </button>
        </div>
      </div>
    </div>
  );
}

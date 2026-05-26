export type Language = 'zh' | 'en';
export type Theme = 'light' | 'dark';
export type DataMode = 'mock' | 'remote';
export type SessionType = 'auto' | 'manual';
export type FrameType = 'first' | 'last';

export interface FramePrompt {
  sceneDescription: string;
  characterPerformance: string;
  cameraAngle: string;
  lighting: string;
  atmosphere?: string;
}

export interface GeneratedImage {
  url: string;
  name: string;
}

export interface GenerationStatus {
  firstFrame: boolean;
  lastFrame: boolean;
}

export interface ImageErrorState {
  firstFrame?: string;
  lastFrame?: string;
}

export interface Scene {
  id: number;
  name: string;
  dialogue: string;
  duration: number;
  shotPrompt?: string;
  firstFrame?: FramePrompt;
  lastFrame?: FramePrompt;
  firstFrameImage?: string;
  lastFrameImage?: string;
  imageGenerating?: GenerationStatus;
  imageError?: ImageErrorState;
}

export interface StoryboardDraft {
  script: string;
  duration: number;
  wordCount?: number;
  scenes: Scene[];
}

export interface StoryboardSession extends StoryboardDraft {
  sessionType: SessionType;
  updatedAt: string;
}

export interface AppSettings {
  dataMode: DataMode;
  mockDelayMs: number;
  mockFailureRate: number;
  language: Language;
  theme: Theme;
}

export interface GenerateFrameInput {
  sceneId: number;
  dialogue: string;
  duration: number;
  frameType: FrameType;
}

export interface BatchGenerationProgress {
  current: number;
  total: number;
  sceneId: number;
}

export interface LegacyFramePrompt {
  scene_description?: string;
  character_performance?: string;
  camera_angle?: string;
  lighting?: string;
  atmosphere?: string;
}

export interface LegacyScene {
  id: number | string;
  name: string;
  dialogue: string;
  duration: number;
  shot_prompt?: string;
  first_frame?: LegacyFramePrompt;
  last_frame?: LegacyFramePrompt;
  firstFrameImage?: string;
  lastFrameImage?: string;
  first_frame_image?: string;
  last_frame_image?: string;
}

export function toFramePrompt(frame?: LegacyFramePrompt): FramePrompt | undefined {
  if (!frame) {
    return undefined;
  }

  return {
    sceneDescription: frame.scene_description || '',
    characterPerformance: frame.character_performance || '',
    cameraAngle: frame.camera_angle || '',
    lighting: frame.lighting || '',
    atmosphere: frame.atmosphere,
  };
}

export function toScene(scene: LegacyScene): Scene {
  return {
    id: typeof scene.id === 'string' ? Number.parseInt(scene.id.replace(/\D+/g, ''), 10) || 1 : scene.id,
    name: scene.name,
    dialogue: scene.dialogue,
    duration: scene.duration,
    shotPrompt: scene.shot_prompt,
    firstFrame: toFramePrompt(scene.first_frame),
    lastFrame: toFramePrompt(scene.last_frame),
    firstFrameImage: scene.firstFrameImage || scene.first_frame_image,
    lastFrameImage: scene.lastFrameImage || scene.last_frame_image,
  };
}

export function toLegacyFramePrompt(frame?: FramePrompt): LegacyFramePrompt | undefined {
  if (!frame) {
    return undefined;
  }

  return {
    scene_description: frame.sceneDescription,
    character_performance: frame.characterPerformance,
    camera_angle: frame.cameraAngle,
    lighting: frame.lighting,
    atmosphere: frame.atmosphere,
  };
}

export function toLegacyScene(scene: Scene): LegacyScene {
  return {
    id: scene.id,
    name: scene.name,
    dialogue: scene.dialogue,
    duration: scene.duration,
    shot_prompt: scene.shotPrompt,
    first_frame: toLegacyFramePrompt(scene.firstFrame),
    last_frame: toLegacyFramePrompt(scene.lastFrame),
    firstFrameImage: scene.firstFrameImage,
    lastFrameImage: scene.lastFrameImage,
  };
}

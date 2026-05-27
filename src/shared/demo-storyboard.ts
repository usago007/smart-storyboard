import type { Scene } from '@/domain/storyboard';

export const DEMO_SCRIPT =
  '熬夜、换季、空调房，让皮肤越来越干，早上上妆容易卡粉。AquaGlow 水光精华采用温和保湿配方，质地轻盈不黏腻，能够快速补水并改善肌肤暗沉。每天早晚使用，让肌肤保持稳定、细腻、有光泽的好状态。现在下单，开启你的日常水光护理。';

export const DEMO_DURATION = 10;
export const DEMO_WORD_COUNT = 89;

export const DEMO_SCENES: Scene[] = [
  {
    id: 1,
    name: '分镜1（10秒）',
    duration: 10,
    dialogue: '熬夜、换季、空调房，让皮肤越来越干，早上上妆容易卡粉。',
    shotPrompt:
      'close-up shot, morning bedroom, young woman looking in mirror, dry skin texture, makeup not sitting well, soft natural light, realistic skincare commercial style',
    firstFrame: {
      sceneDescription:
        '清晨柔和自然光下，女生坐在梳妆台前，镜子中能看到脸颊干燥和轻微卡粉，画面干净真实。',
      characterPerformance:
        '女生微微皱眉，用手轻触脸颊，表现出对皮肤干燥和妆容不服帖的困扰。',
      cameraAngle: '中近景平视机位，镜子和人物同框，突出真实生活场景。',
      lighting: '清晨自然光从侧面进入，柔和但略显清冷。',
      atmosphere: '真实、轻微焦虑、生活化。',
    },
    lastFrame: {
      sceneDescription:
        '镜头推进到脸颊局部，突出干燥纹理和底妆不服帖的问题，为产品出现做铺垫。',
      characterPerformance:
        '女生观察脸颊细节，表情从疑惑转为期待解决方案。',
      cameraAngle: '面部局部特写，轻微推进。',
      lighting: '柔和自然光，保留皮肤纹理细节。',
      atmosphere: '问题明确、等待解决。',
    },
    firstFrameImage: 'mock:first-frame-1',
    lastFrameImage: 'mock:last-frame-1',
  },
  {
    id: 2,
    name: '分镜2（10秒）',
    duration: 10,
    dialogue:
      'AquaGlow 水光精华采用温和保湿配方，质地轻盈不黏腻，能够快速补水并改善肌肤暗沉。',
    shotPrompt:
      'product hero shot, skincare serum bottle, transparent texture, dropper applying serum, clean white background, soft glow, premium beauty advertisement',
    firstFrame: {
      sceneDescription:
        'AquaGlow 水光精华瓶身置于浅色台面，周围有水光质感反射，画面突出清透和保湿感。',
      characterPerformance:
        '无人物正脸，重点展示产品瓶身、滴管和精华质地。',
      cameraAngle: '产品中近景，轻微俯拍，瓶身位于画面中心。',
      lighting: '高亮柔光，局部反射形成水润质感。',
      atmosphere: '干净、专业、清透。',
    },
    lastFrame: {
      sceneDescription:
        '女生轻拍脸颊，精华快速吸收，肌肤表面呈现自然水润光泽，表情放松。',
      characterPerformance: '女生用指腹轻拍脸颊，动作自然，表情舒缓。',
      cameraAngle: '面部半侧近景，手部动作和脸颊光泽同框。',
      lighting: '柔和明亮光线，突出水润感。',
      atmosphere: '舒适、安心、有效。',
    },
    firstFrameImage: 'mock:first-frame-2',
    lastFrameImage: 'mock:last-frame-2',
  },
  {
    id: 3,
    name: '分镜3（10秒）',
    duration: 10,
    dialogue:
      '每天早晚使用，让肌肤保持稳定、细腻、有光泽的好状态。现在下单，开启你的日常水光护理。',
    shotPrompt:
      'final beauty shot, smooth glowing skin, confident woman smiling, skincare product beside call-to-action text, clean commercial layout, premium minimal style',
    firstFrame: {
      sceneDescription:
        '女生面对镜头微笑，妆容服帖自然，肌肤呈现细腻光泽，背景明亮干净。',
      characterPerformance:
        '女生神态自信放松，轻轻转头展示肌肤状态。',
      cameraAngle: '中近景平视机位，面部和肩颈自然入镜。',
      lighting: '柔和主光配合轻微轮廓光，提升肤质表现。',
      atmosphere: '自信、清透、积极。',
    },
    lastFrame: {
      sceneDescription:
        '产品瓶身与"开启日常水光护理"文字同屏展示，画面简洁，突出购买转化。',
      characterPerformance: '无人物动作，重点为产品和转化文案。',
      cameraAngle: '产品正面构图，右侧预留文字区域。',
      lighting: '明亮商业摄影光，产品边缘清晰。',
      atmosphere: '简洁、可信、转化导向。',
    },
    firstFrameImage: 'mock:first-frame-3',
    lastFrameImage: 'mock:last-frame-3',
  },
];

export const DEMO_SCENE_DESCRIPTIONS: Record<number, string> = {
  1: '清晨卧室内，女生对着镜子查看皮肤状态，脸颊干燥，底妆不服帖。',
  2: '产品瓶身在明亮背景中出现，用户将精华滴在手背和脸颊，质地清透易吸收。',
  3: '女生完成护肤和上妆，肌肤细腻服帖，最后产品与促销信息同屏展示。',
};

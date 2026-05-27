export type MaterialType =
  | 'adCopy'
  | 'productInfo'
  | 'talkingScript'
  | 'brandIntro'
  | 'newsOrArticle'
  | 'roughIdea'
  | 'unknown';

const MATERIAL_LABELS: Record<MaterialType, string> = {
  adCopy: '广告文案',
  productInfo: '产品资料',
  talkingScript: '口播脚本',
  brandIntro: '品牌介绍',
  newsOrArticle: '新闻/文章',
  roughIdea: '模糊创意',
  unknown: '未识别',
};

export interface SceneOutline {
  id: number;
  title: string;
  purpose: string;
  keyMessage: string;
  visualDirection: string;
  duration: number;
}

export interface StoryboardBrief {
  contentType: string;
  materialType: MaterialType;
  objective: string;
  targetAudience: string;
  coreMessage: string;
  sellingPoints: string[];
  storyStructure: string[];
  visualStyle: string;
  sceneCount: number;
  duration: number;
  notes: string[];
}

export function normalizeMaterialText(script: string): string {
  return script
    .replace(/[\t\r]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/ {2,}/g, ' ')
    .trim();
}

export function detectMaterialType(script: string): MaterialType {
  const txt = script;
  const adSignal = /广告|投放|转化|促销|限时|点击|购买|下单|优惠|活动/;
  const productSignal = /产品|配方|成分|功效|使用|适用|规格|参数/;
  const talkSignal = /口播|讲一下|观点|大家好|今天聊|分享|说道/;
  const brandSignal = /品牌|理念|愿景|使命|企业|公司|服务|价值观/;
  const newsSignal = /新闻|报道|发布|宣布|最新|据悉|记者|行业/;
  const ideaSignal = /创意|想法|灵感|构思|概念|大概|可能|也许|试一下/;

  if (adSignal.test(txt) && txt.length > 30) return 'adCopy';
  if (newsSignal.test(txt) || (txt.length > 100 && txt.includes('。'))) return 'newsOrArticle';
  if (brandSignal.test(txt)) return 'brandIntro';
  if (productSignal.test(txt) && txt.length > 20) return 'productInfo';
  if (talkSignal.test(txt)) return 'talkingScript';
  if (ideaSignal.test(txt) || txt.length < 30) return 'roughIdea';
  return 'unknown';
}

export interface MaterialSignals {
  topic: string;
  productName: string;
  category: string;
  painPoints: string[];
  sellingPoints: string[];
  targetAudience: string;
  callToAction: string;
}

export function extractMaterialSignals(script: string, materialType: MaterialType): MaterialSignals {
  const normalized = normalizeMaterialText(script);
  const words = normalized.split(/[\s，。！？,]+/).filter(Boolean);

  return {
    topic: words.slice(0, 4).join('') || '未识别主题',
    productName: words.find((w) => w.length >= 2 && /[A-Za-z\u4e00-\u9fff]{2,}/.test(w)) || '',
    category: '',
    painPoints: words.length > 5 ? [words.slice(0, 3).join(''), words.slice(3, 6).join('')].filter(Boolean) : [],
    sellingPoints: words.length > 8 ? [words.slice(6, 9).join(''), words.slice(9, 12).join('')].filter(Boolean) : [],
    targetAudience: '',
    callToAction: materialType === 'adCopy' ? '立即行动' : '了解更多',
  };
}

export type CreationType =
  | 'adCreative'
  | 'productSellingPoints'
  | 'talkingScript'
  | 'scenarioSeeding'
  | 'brandPromo'
  | 'customIdea';

export type ScenarioType =
  | 'douyin'
  | 'xiaohongshu'
  | 'infoAd'
  | 'productDemo'
  | 'brandVideo'
  | 'internalReview';

export type ObjectiveType =
  | 'conversion'
  | 'awareness'
  | 'explain'
  | 'trust'
  | 'engagement'
  | 'retention';

export type StyleType =
  | 'commercial'
  | 'realistic'
  | 'cinematic'
  | 'clean'
  | 'storyDriven'
  | 'lightSeeding';

export const CREATION_TYPES: { value: CreationType; label: string; desc: string }[] = [
  { value: 'adCreative', label: '广告创意', desc: '将广告文案拆解为镜头脚本' },
  { value: 'productSellingPoints', label: '产品卖点', desc: '围绕产品核心卖点叙事' },
  { value: 'talkingScript', label: '口播脚本', desc: '将口播转化为分镜画面' },
  { value: 'scenarioSeeding', label: '剧情种草', desc: '用场景故事展示体验' },
  { value: 'brandPromo', label: '品牌宣传', desc: '品牌形象的分镜表达' },
  { value: 'customIdea', label: '自定义创意', desc: '自由创作叙事结构' },
];

export const SCENARIOS: { value: ScenarioType; label: string }[] = [
  { value: 'douyin', label: '抖音短视频' },
  { value: 'xiaohongshu', label: '小红书种草' },
  { value: 'infoAd', label: '信息流广告' },
  { value: 'productDemo', label: '产品演示' },
  { value: 'brandVideo', label: '品牌宣传片' },
  { value: 'internalReview', label: '内部提案' },
];

export const OBJECTIVES: { value: ObjectiveType; label: string }[] = [
  { value: 'conversion', label: '引导购买' },
  { value: 'awareness', label: '提升认知' },
  { value: 'explain', label: '讲清产品' },
  { value: 'trust', label: '建立信任' },
  { value: 'engagement', label: '引发兴趣' },
  { value: 'retention', label: '强化记忆点' },
];

export const STYLES: { value: StyleType; label: string }[] = [
  { value: 'commercial', label: '商业广告感' },
  { value: 'realistic', label: '真实口播感' },
  { value: 'cinematic', label: '电影质感' },
  { value: 'clean', label: '干净高级' },
  { value: 'storyDriven', label: '剧情化' },
  { value: 'lightSeeding', label: '轻松种草' },
];

const structureMap: Record<CreationType, string[]> = {
  adCreative: ['痛点引入', '产品出现', '卖点证明', '使用场景', '行动号召'],
  productSellingPoints: ['产品亮相', '卖点一', '卖点二', '使用效果', '购买引导'],
  talkingScript: ['开场钩子', '问题说明', '观点展开', '案例证明', '总结引导'],
  scenarioSeeding: ['场景冲突', '用户困扰', '产品介入', '体验变化', '种草推荐'],
  brandPromo: ['品牌场景', '价值主张', '产品能力', '用户信任', '品牌收束'],
  customIdea: ['创意开场', '背景铺垫', '重点表达', '情绪强化', '结尾收束'],
};

const objectiveMap: Record<CreationType, string> = {
  adCreative: '将广告文案拆解为有故事感的短视频分镜，提升观看转化',
  productSellingPoints: '清晰传递产品核心卖点，建立购买动机',
  talkingScript: '将口播稿转化为视觉化分镜，增强表现力',
  scenarioSeeding: '通过真实场景展示产品体验，激发种草意愿',
  brandPromo: '塑造品牌形象，传递品牌价值观和信任感',
  customIdea: '自由创意表达，灵活构建叙事结构',
};

const audienceMap: Record<CreationType, string> = {
  adCreative: '25-35 岁关注生活品质的年轻消费者',
  productSellingPoints: '对产品功能有明确需求的潜在用户',
  talkingScript: '短视频平台内容消费者',
  scenarioSeeding: '对新产品持观望态度的种草受众',
  brandPromo: '对品牌有认知但未建立深度信任的泛用户',
  customIdea: '自定义目标受众',
};

const styleMap: Record<CreationType, string> = {
  adCreative: '干净明亮，生活化场景，产品质感突出，节奏轻快',
  productSellingPoints: '产品特写为主，简洁专业，功能性叙事强',
  talkingScript: '人物近景为主，背景干净，信息层次清楚',
  scenarioSeeding: '自然生活光线，真实使用场景，情绪细腻',
  brandPromo: '高端简约，质感镜头，品牌调性统一',
  customIdea: '自定义视觉风格',
};

export function generateMockStoryboardBrief(params: {
  creationType: CreationType;
  scenario: ScenarioType;
  objective: ObjectiveType;
  style: StyleType;
  script: string;
  duration: number;
}): StoryboardBrief {
  const { creationType, scenario, objective, style, script, duration } = params;
  const normalized = normalizeMaterialText(script);
  const materialType = detectMaterialType(normalized);
  const signals = extractMaterialSignals(normalized, materialType);
  const label = CREATION_TYPES.find((t) => t.value === creationType)?.label || '自定义';
  const scenarioLabel = SCENARIOS.find((s) => s.value === scenario)?.label || '';
  const objectiveLabel = OBJECTIVES.find((o) => o.value === objective)?.label || '';
  const styleLabel = STYLES.find((s) => s.value === style)?.label || '';

  /* Build a summarised coreMessage instead of raw word slice */
  const coreMessage = (() => {
    switch (materialType) {
      case 'productInfo':
        return `通过${signals.sellingPoints[0] || '核心卖点'}解决${signals.painPoints[0] || '用户痛点'}，突出${normalized.slice(0, 20)}`;
      case 'talkingScript':
        return `围绕"${normalized.slice(0, 30)}"，展开观点并提供行动引导`;
      case 'brandIntro':
        return `传递${signals.productName || '品牌'}的核心理念与价值主张，建立用户信任`;
      case 'newsOrArticle':
        return `将${normalized.slice(0, 25)}转化为短视频分镜叙事`;
      case 'roughIdea':
        return `基于"${normalized.slice(0, 30)}"的创意方向，构建可拍摄的镜头叙事`;
      default:
        return `以"${normalized.slice(0, 30)}"为核心，构建短视频分镜叙事`;
    }
  })();

  const needsWarning = materialType === 'newsOrArticle' || materialType === 'roughIdea' || materialType === 'unknown';
  const notes = [];
  if (needsWarning) {
    notes.push('当前素材不完全像标准广告文案，系统已尝试转换为可生成分镜的创意方案，建议补充产品、品牌或转化目标。');
  }
  if (normalized.length < 40) {
    notes.push('素材偏短，建议补充产品卖点、使用场景或目标受众信息。');
  }
  if (normalized.length >= 40 && !needsWarning) {
    notes.push('素材信息较完整，可进一步补充转化诉求或品牌调性。');
  }

  return {
    contentType: label,
    materialType,
    objective: `面向${scenarioLabel}，目标为${objectiveLabel}，${objectiveMap[creationType]}`,
    targetAudience: audienceMap[creationType],
    coreMessage,
    sellingPoints: signals.sellingPoints.filter(Boolean).length
      ? signals.sellingPoints.filter(Boolean)
      : [normalized.slice(0, 20) || '请补充'].filter(Boolean),
    storyStructure: structureMap[creationType],
    visualStyle: `${styleLabel}风格，${styleMap[creationType]}`,
    sceneCount: Math.min(Math.max(Math.ceil(normalized.length / 60), 3), 6),
    duration,
    notes: notes.length ? notes : ['素材信息较完整'],
  };
}

/** Generate an alternative brief with slightly different content for demo purposes. */
export function generateAlternativeBrief(original: StoryboardBrief): StoryboardBrief {
  const altStructures: Record<string, string[]> = {
    adCreative: ['开场吸引', '产品展示', '用户见证', '效果对比', '限时活动'],
    productSellingPoints: ['需求唤醒', '产品特写', '成分解析', '体验感受', '立即下单'],
    talkingScript: ['话题引入', '深度分析', '观点碰撞', '案例佐证', '互动引导'],
    scenarioSeeding: ['日常困扰', '发现好物', '试用体验', '惊喜变化', '分享推荐'],
    brandPromo: ['情感共鸣', '理念阐述', '品质呈现', '社会责任', '品牌承诺'],
    customIdea: ['悬念开场', '层层展开', '高潮转折', '价值升华', '余味收束'],
  };

  const ctKey = Object.keys(altStructures).find((k) =>
    original.contentType.includes(CREATION_TYPES.find((t) => t.value === k)?.label || ''),
  ) || 'adCreative';

  return {
    ...original,
    coreMessage: `备选方案：${original.coreMessage}`,
    sellingPoints: original.sellingPoints.map((sp, i) =>
      i === 0 ? `${sp}（备选强调）` : sp,
    ),
    storyStructure: altStructures[ctKey] || original.storyStructure,
    sceneCount: Math.max(3, original.sceneCount - 1),
    notes: [...original.notes, '此为备选方案，与默认方案采用不同的叙事结构。'],
  };
}

export function getMaterialLabel(type: MaterialType): string {
  return MATERIAL_LABELS[type] || '未识别';
}

export function buildSceneOutlinesFromBrief(brief: StoryboardBrief): SceneOutline[] {
  const structures = brief.storyStructure;
  const count = brief.sceneCount;

  return structures.slice(0, count).map((title, i) => ({
    id: i + 1,
    title,
    purpose: i === 0 ? '开场引入，建立场景和问题认知' : i === count - 1 ? '结尾收束，引导转化或行动' : '展开核心内容，推进叙事节奏',
    keyMessage: brief.coreMessage,
    visualDirection: brief.visualStyle,
    duration: brief.duration,
  }));
}

/** Build generation context — brief info serves as background, NOT displayed in scene text. */
export function buildScriptFromBrief(script: string, brief: StoryboardBrief): string {
  return [
    script,
    '',
    `[核心表达] ${brief.coreMessage}`,
    `[目标用户] ${brief.targetAudience}`,
    `[卖点] ${brief.sellingPoints.join('；')}`,
    `[风格] ${brief.visualStyle}`,
  ].join('\n');
}

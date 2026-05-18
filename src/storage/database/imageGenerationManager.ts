import { eq, and, count } from "drizzle-orm";
import { getDb } from "./db";
import { 
  imageGenerations, 
  insertImageGenerationSchema, 
  updateImageGenerationSchema,
  type ImageGeneration,
  type InsertImageGeneration,
  type UpdateImageGeneration 
} from "./shared/schema";

export interface ImageGenerationOptions {
  sessionId: string;
  sceneId: number;
  frameType: 'first' | 'last';
  prompt: string;
}

export interface GenerationResult {
  success: boolean;
  imageUrl?: string;
  generationTime?: number;
  error?: string;
}

export class ImageGenerationManager {
  private readonly MAX_CONCURRENT_PER_SESSION = 3;
  private readonly MAX_CONCURRENT_GLOBAL = 50;
  private memoryRecords = new Map<string, any>();

  async createGenerationRecord(options: ImageGenerationOptions): Promise<ImageGeneration> {
    if (process.env.DEMO_MODE === 'true') {
      const id = `demo_gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const record = {
        id,
        sessionId: options.sessionId,
        sceneId: options.sceneId,
        frameType: options.frameType,
        prompt: options.prompt,
        status: 'pending',
        imageUrl: null,
        generationTime: null,
        errorMessage: null,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      };
      this.memoryRecords.set(id, record);
      return record;
    }

    const db = await getDb();
    const recordData: InsertImageGeneration = {
      sessionId: options.sessionId,
      sceneId: options.sceneId,
      frameType: options.frameType,
      prompt: options.prompt,
    };

    const validatedData = insertImageGenerationSchema.parse(recordData);
    const [record] = await db!.insert(imageGenerations).values(validatedData).returning();

    return record;
  }

  async getGenerationRecord(sessionId: string, sceneId: number, frameType: 'first' | 'last'): Promise<ImageGeneration | null> {
    if (process.env.DEMO_MODE === 'true') {
      for (const record of this.memoryRecords.values()) {
        if (record.sessionId === sessionId && record.sceneId === sceneId && record.frameType === frameType) {
          return record;
        }
      }
      return null;
    }

    const db = await getDb();
    const [record] = await db!
      .select()
      .from(imageGenerations)
      .where(and(
        eq(imageGenerations.sessionId, sessionId),
        eq(imageGenerations.sceneId, sceneId),
        eq(imageGenerations.frameType, frameType)
      ))
      .orderBy(imageGenerations.createdAt)
      .limit(1);

    return record || null;
  }

  async updateGenerationRecord(
    id: string,
    updates: UpdateImageGeneration
  ): Promise<ImageGeneration | null> {
    if (process.env.DEMO_MODE === 'true') {
      const record = this.memoryRecords.get(id);
      if (!record) return null;
      Object.assign(record, updates);
      return record;
    }

    const db = await getDb();

    try {
      const validatedData = updateImageGenerationSchema.parse(updates);

      const [record] = await db!
        .update(imageGenerations)
        .set(validatedData)
        .where(eq(imageGenerations.id, id))
        .returning();

      return record || null;
    } catch (error) {
      throw error;
    }
  }

  async markGenerationSuccess(
    id: string,
    imageUrl: string,
    generationTime: number
  ): Promise<boolean> {
    try {
      const result = await this.updateGenerationRecord(id, {
        imageUrl,
        generationTime,
        status: 'success'
      });

      return result !== null;
    } catch (error) {
      return false;
    }
  }

  async markGenerationFailure(id: string, errorMessage: string): Promise<boolean> {
    const result = await this.updateGenerationRecord(id, {
      status: 'failed',
      errorMessage
    });

    return result !== null;
  }

  async markGenerationInProgress(id: string): Promise<boolean> {
    const result = await this.updateGenerationRecord(id, {
      status: 'generating'
    });

    return result !== null;
  }

  async acquireGenerationSlot(sessionId: string): Promise<{
    canProceed: boolean;
    estimatedWaitTime?: number;
    reason?: string;
  }> {
    if (process.env.DEMO_MODE === 'true') {
      return { canProceed: true };
    }

    const db = await getDb();

    const sessionConcurrent = await db!
      .select({ count: count() })
      .from(imageGenerations)
      .where(and(
        eq(imageGenerations.sessionId, sessionId),
        eq(imageGenerations.status, 'generating')
      ));

    const sessionCount = sessionConcurrent[0]?.count || 0;
    if (sessionCount >= this.MAX_CONCURRENT_PER_SESSION) {
      return {
        canProceed: false,
        reason: '当前会话生成任务过多，请稍后再试'
      };
    }

    const globalConcurrent = await db!
      .select({ count: count() })
      .from(imageGenerations)
      .where(eq(imageGenerations.status, 'generating'));

    const globalCount = globalConcurrent[0]?.count || 0;
    const loadRatio = globalCount / this.MAX_CONCURRENT_GLOBAL;

    if (globalCount >= this.MAX_CONCURRENT_GLOBAL) {
      return {
        canProceed: false,
        reason: '系统繁忙，请稍后再试'
      };
    }

    let estimatedWaitTime: number | undefined;
    if (loadRatio > 0.7) {
      estimatedWaitTime = Math.ceil(loadRatio * 15);
    }

    return {
      canProceed: true,
      estimatedWaitTime
    };
  }

  async getSessionGenerations(sessionId: string): Promise<ImageGeneration[]> {
    if (process.env.DEMO_MODE === 'true') {
      const generations: ImageGeneration[] = [];
      for (const record of this.memoryRecords.values()) {
        if (record.sessionId === sessionId) {
          generations.push(record);
        }
      }
      return generations;
    }

    const db = await getDb();
    return db!
      .select()
      .from(imageGenerations)
      .where(eq(imageGenerations.sessionId, sessionId))
      .orderBy(imageGenerations.createdAt);
  }

  async getSceneGenerations(sessionId: string, sceneId: number): Promise<ImageGeneration[]> {
    if (process.env.DEMO_MODE === 'true') {
      const generations: ImageGeneration[] = [];
      for (const record of this.memoryRecords.values()) {
        if (record.sessionId === sessionId && record.sceneId === sceneId) {
          generations.push(record);
        }
      }
      return generations;
    }

    const db = await getDb();
    return db!
      .select()
      .from(imageGenerations)
      .where(and(
        eq(imageGenerations.sessionId, sessionId),
        eq(imageGenerations.sceneId, sceneId)
      ))
      .orderBy(imageGenerations.createdAt);
  }

  async getSystemLoad(): Promise<{
    currentGenerating: number;
    maxConcurrent: number;
    loadPercentage: number;
    sessionGenerating: number;
  }> {
    if (process.env.DEMO_MODE === 'true') {
      let generatingCount = 0;
      for (const record of this.memoryRecords.values()) {
        if (record.status === 'generating') {
          generatingCount++;
        }
      }
      return {
        currentGenerating: generatingCount,
        maxConcurrent: this.MAX_CONCURRENT_GLOBAL,
        loadPercentage: 0,
        sessionGenerating: 0
      };
    }

    const db = await getDb();

    const globalResult = await db!
      .select({ count: count() })
      .from(imageGenerations)
      .where(eq(imageGenerations.status, 'generating'));

    const sessionResult = await db!
      .select({ count: count() })
      .from(imageGenerations)
      .where(and(
        eq(imageGenerations.status, 'generating'),
        eq(imageGenerations.sessionId, '')
      ));

    const currentGenerating = globalResult[0]?.count || 0;
    const sessionGenerating = sessionResult[0]?.count || 0;
    const loadPercentage = (currentGenerating / this.MAX_CONCURRENT_GLOBAL) * 100;

    return {
      currentGenerating,
      maxConcurrent: this.MAX_CONCURRENT_GLOBAL,
      loadPercentage: Math.round(loadPercentage),
      sessionGenerating
    };
  }

  enhancePromptForPencilSketch(basePrompt: string): string {
    const stylePrompt = "黑白铅笔手绘素描画，单色线条艺术，传统素描技法，1:1比例正方形构图，只有黑色线条和白色背景，绝对不能有彩色，完全无彩色，纯黑白，铅笔素描风格，线条画，不使用任何彩色元素，灰度图像，单色图像，黑白照片";

    if (basePrompt.trim()) {
      return `黑白素描风格，${basePrompt}，${stylePrompt}，严格要求黑白两色，无任何彩色成分，纯黑线条白底，灰度模式，monochrome`;
    }

    return `${stylePrompt}，严格要求黑白两色，无任何彩色成分，纯黑线条白底，灰度模式，monochrome`;
  }

  async validateImageUrl(imageUrl: string): Promise<boolean> {
    try {
      const response = await fetch(imageUrl, { method: 'HEAD' });
      return response.ok && (response.headers.get('content-type') || '').startsWith('image/');
    } catch (error) {
      return false;
    }
  }

  async convertToBlackWhite(imageUrl: string): Promise<string | null> {
    try {
      console.log('注意：当前环境下无法自动转换图片为黑白，请确保生成的图片符合要求');
      return null;
    } catch (error) {
      console.error('转换黑白失败:', error);
      return null;
    }
  }

  async deleteGenerationRecord(id: string): Promise<boolean> {
    if (process.env.DEMO_MODE === 'true') {
      return this.memoryRecords.delete(id);
    }

    const db = await getDb();
    const result = await db!.delete(imageGenerations).where(eq(imageGenerations.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async cleanupExpiredRecords(): Promise<number> {
    if (process.env.DEMO_MODE === 'true') {
      let cleaned = 0;
      const now = new Date();
      for (const [id, record] of this.memoryRecords.entries()) {
        if (record.expiresAt < now) {
          this.memoryRecords.delete(id);
          cleaned++;
        }
      }
      return cleaned;
    }

    const db = await getDb();
    const result = await db!
      .delete(imageGenerations)
      .where(eq(imageGenerations.expiresAt, new Date()));

    return result.rowCount || 0;
  }
}

export const imageGenerationManager = new ImageGenerationManager();

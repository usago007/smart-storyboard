import { lt, count } from "drizzle-orm";
import { getDb } from "./db";
import { userGenerationSessions, imageGenerations } from "./shared/schema";
import { sql } from "drizzle-orm";

export class DataCleanupService {
  private cleanupInterval: NodeJS.Timeout | null = null;
  private readonly CLEANUP_INTERVAL = 60 * 60 * 1000; // 1小时

  /**
   * 启动定时清理任务
   */
  startCleanupScheduler(): void {
    if (process.env.DEMO_MODE === 'true') {
      console.log('DEMO 模式：跳过数据清理服务');
      return;
    }

    this.stopCleanupScheduler();
    
    this.performCleanup();
    
    this.cleanupInterval = setInterval(() => {
      this.performCleanup();
    }, this.CLEANUP_INTERVAL);
    
    console.log('数据清理任务已启动，每小时执行一次');
  }

  /**
   * 停止定时清理任务
   */
  stopCleanupScheduler(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      console.log('数据清理任务已停止');
    }
  }

  /**
   * 执行数据清理
   */
  private async performCleanup(): Promise<void> {
    try {
      const startTime = Date.now();
      const results = await this.cleanupExpiredData();
      const duration = Date.now() - startTime;
      
      console.log(`数据清理完成:`, {
        sessionsDeleted: results.sessionsDeleted,
        imagesDeleted: results.imagesDeleted,
        duration: `${duration}ms`
      });
      
      // 如果清理了大量数据，记录警告
      if (results.sessionsDeleted > 100 || results.imagesDeleted > 500) {
        console.warn('清理了大量过期数据，建议检查数据生成频率');
      }
      
    } catch (error) {
      console.error('数据清理失败:', error);
    }
  }

  /**
   * 清理过期数据
   */
  async cleanupExpiredData(): Promise<{
    sessionsDeleted: number;
    imagesDeleted: number;
  }> {
    if (process.env.DEMO_MODE === 'true') {
      return { sessionsDeleted: 0, imagesDeleted: 0 };
    }

    const db = await getDb();
    const now = new Date();

    try {
      const sessionResult = await db!
        .delete(userGenerationSessions)
        .where(lt(userGenerationSessions.expiresAt, now));

      const sessionsDeleted = sessionResult.rowCount || 0;

      const imageResult = await db!
        .delete(imageGenerations)
        .where(lt(imageGenerations.expiresAt, now));

      const imagesDeleted = imageResult.rowCount || 0;

      return {
        sessionsDeleted,
        imagesDeleted
      };

    } catch (error) {
      console.error('清理过期数据时发生错误:', error);
      throw error;
    }
  }

  async getCleanupStats(): Promise<{
    activeSessions: number;
    activeImages: number;
    expiredSessions: number;
    expiredImages: number;
  }> {
    if (process.env.DEMO_MODE === 'true') {
      return { activeSessions: 0, activeImages: 0, expiredSessions: 0, expiredImages: 0 };
    }

    const db = await getDb();
    const now = new Date();

    try {
      const activeSessionResult = await db!
        .select({ count: count() })
        .from(userGenerationSessions);

      const activeSessions = Number(activeSessionResult[0]?.count || 0);

      const activeImageResult = await db!
        .select({ count: count() })
        .from(imageGenerations);

      const activeImages = Number(activeImageResult[0]?.count || 0);

      const expiredSessionResult = await db!
        .select({ count: count() })
        .from(userGenerationSessions)
        .where(lt(userGenerationSessions.expiresAt, now));

      const expiredSessions = Number(expiredSessionResult[0]?.count || 0);

      const expiredImageResult = await db!
        .select({ count: count() })
        .from(imageGenerations)
        .where(lt(imageGenerations.expiresAt, now));

      const expiredImages = Number(expiredImageResult[0]?.count || 0);

      return {
        activeSessions,
        activeImages,
        expiredSessions,
        expiredImages
      };

    } catch (error) {
      console.error('获取清理统计信息时发生错误:', error);
      return {
        activeSessions: 0,
        activeImages: 0,
        expiredSessions: 0,
        expiredImages: 0
      };
    }
  }

  async triggerManualCleanup(): Promise<{
    success: boolean;
    results?: {
      sessionsDeleted: number;
      imagesDeleted: number;
    };
    error?: string;
  }> {
    if (process.env.DEMO_MODE === 'true') {
      return { success: true, results: { sessionsDeleted: 0, imagesDeleted: 0 } };
    }

    try {
      const results = await this.cleanupExpiredData();
      return {
        success: true,
        results
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  /**
   * 检查清理服务状态
   */
  isCleanupActive(): boolean {
    return this.cleanupInterval !== null;
  }
}

// 导出单例实例
export const cleanupService = new DataCleanupService();
import { eq, and, lt, gt } from "drizzle-orm";
import { getDb } from "./db";
import { 
  userGenerationSessions, 
  insertUserGenerationSessionSchema, 
  updateUserGenerationSessionSchema,
  type UserGenerationSession,
  type InsertUserGenerationSession,
  type UpdateUserGenerationSession 
} from "./shared/schema";

export class SessionManager {
  private sessionId: string;
  private userFingerprint: string;
  private memorySessions = new Map<string, any>();

  constructor() {
    this.sessionId = this.getOrCreateSessionId();
    this.userFingerprint = this.generateFingerprint();
  }

  /**
   * 获取或创建会话ID
   */
  private getOrCreateSessionId(): string {
    if (typeof window === 'undefined') {
      // 服务端生成临时会话ID
      return `server_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // 优先从sessionStorage获取，否则生成新的
    let sessionId = sessionStorage.getItem('ad_script_session');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('ad_script_session', sessionId);
    }
    return sessionId;
  }

  /**
   * 生成用户指纹（基于浏览器特征）
   */
  private generateFingerprint(): string {
    if (typeof window === 'undefined') {
      return 'server_fingerprint';
    }
    
    try {
      const parts = [
        navigator.userAgent || '',
        screen.width + 'x' + screen.height,
        new Date().getTimezoneOffset().toString(),
        navigator.language || ''
      ];
      return btoa(parts.join('|')).substr(0, 32);
    } catch (error) {
      return 'unknown_fingerprint';
    }
  }

  /**
   * 获取当前会话ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * 获取用户指纹
   */
  getUserFingerprint(): string {
    return this.userFingerprint;
  }

  /**
   * 创建新的生成会话
   */
  async createSession(data: {
    scriptContent: string;
    duration: number;
    scenes: any;
    sessionId?: string;
    sceneType?: string;
    sourceData?: any;
  }): Promise<UserGenerationSession> {
    if (process.env.DEMO_MODE === 'true') {
      const session = {
        id: `demo_${Date.now()}`,
        sessionId: data.sessionId || this.sessionId,
        userFingerprint: this.userFingerprint,
        scriptContent: data.scriptContent,
        duration: data.duration,
        scenes: data.scenes,
        sceneType: data.sceneType || 'auto',
        sourceData: data.sourceData,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      };
      this.memorySessions.set(session.sessionId, session);
      return session;
    }

    const db = await getDb();
    const sessionData: InsertUserGenerationSession = {
      sessionId: data.sessionId || this.sessionId,
      userFingerprint: this.userFingerprint,
      scriptContent: data.scriptContent,
      duration: data.duration,
      scenes: data.scenes,
    };

    const validatedData = insertUserGenerationSessionSchema.parse(sessionData);
    const [session] = await db!.insert(userGenerationSessions).values(validatedData).returning();

    if (data.sceneType || data.sourceData || data.sessionId) {
      const updateData: any = {};
      if (data.sceneType) updateData.sceneType = data.sceneType;
      if (data.sourceData) updateData.sourceData = data.sourceData;

      const [updatedSession] = await db!
        .update(userGenerationSessions)
        .set(updateData)
        .where(eq(userGenerationSessions.id, session.id))
        .returning();

      return updatedSession;
    }

    return session;
  }

  /**
   * 获取当前会话
   */
  async getCurrentSession(): Promise<UserGenerationSession | null> {
    if (process.env.DEMO_MODE === 'true') {
      const session = this.memorySessions.get(this.sessionId);
      return session || null;
    }

    const db = await getDb();
    const [session] = await db!
      .select()
      .from(userGenerationSessions)
      .where(and(
        eq(userGenerationSessions.sessionId, this.sessionId),
        gt(userGenerationSessions.expiresAt, new Date())
      ))
      .orderBy(userGenerationSessions.createdAt)
      .limit(1);

    return session || null;
  }

  /**
   * 更新会话数据
   */
  async updateSession(data: UpdateUserGenerationSession): Promise<UserGenerationSession | null> {
    if (process.env.DEMO_MODE === 'true') {
      const session = this.memorySessions.get(this.sessionId);
      if (!session) return null;
      Object.assign(session, data);
      return session;
    }

    const db = await getDb();
    const validatedData = updateUserGenerationSessionSchema.parse(data);

    const [session] = await db!
      .update(userGenerationSessions)
      .set(validatedData)
      .where(eq(userGenerationSessions.sessionId, this.sessionId))
      .returning();

    return session || null;
  }

  async deleteCurrentSession(): Promise<boolean> {
    if (process.env.DEMO_MODE === 'true') {
      const deleted = this.memorySessions.delete(this.sessionId);
      if (deleted && typeof window !== 'undefined') {
        sessionStorage.removeItem('ad_script_session');
      }
      return deleted;
    }

    const db = await getDb();
    const result = await db!
      .delete(userGenerationSessions)
      .where(eq(userGenerationSessions.sessionId, this.sessionId));

    const success = (result.rowCount ?? 0) > 0;

    if (success && typeof window !== 'undefined') {
      sessionStorage.removeItem('ad_script_session');
    }

    return success;
  }

  async restoreFromDatabase(sessionId?: string): Promise<UserGenerationSession | null> {
    if (process.env.DEMO_MODE === 'true') {
      const targetSessionId = sessionId || this.sessionId;
      const session = this.memorySessions.get(targetSessionId);
      return session || null;
    }

    const targetSessionId = sessionId || this.sessionId;
    const db = await getDb();

    const [session] = await db!
      .select()
      .from(userGenerationSessions)
      .where(and(
        eq(userGenerationSessions.sessionId, targetSessionId),
        gt(userGenerationSessions.expiresAt, new Date())
      ))
      .orderBy(userGenerationSessions.createdAt)
      .limit(1);

    return session || null;
  }

  async getSessionByType(sceneType: 'auto' | 'manual'): Promise<UserGenerationSession | null> {
    if (process.env.DEMO_MODE === 'true') {
      const session = this.memorySessions.get(this.sessionId);
      if (session && session.sceneType === sceneType) return session;
      return null;
    }

    const db = await getDb();

    const [session] = await db!
      .select()
      .from(userGenerationSessions)
      .where(and(
        eq(userGenerationSessions.sessionId, this.sessionId),
        eq(userGenerationSessions.sceneType, sceneType),
        gt(userGenerationSessions.expiresAt, new Date())
      ))
      .orderBy(userGenerationSessions.createdAt)
      .limit(1);

    return session || null;
  }

  async isSessionValid(): Promise<boolean> {
    const session = await this.getCurrentSession();
    return session !== null;
  }

  async extendSession(): Promise<boolean> {
    if (process.env.DEMO_MODE === 'true') {
      const session = this.memorySessions.get(this.sessionId);
      if (!session) return false;
      session.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      return true;
    }

    const db = await getDb();
    const newExpiresAt = new Date();
    newExpiresAt.setHours(newExpiresAt.getHours() + 24);

    const result = await db!
      .update(userGenerationSessions)
      .set({ expiresAt: newExpiresAt })
      .where(eq(userGenerationSessions.sessionId, this.sessionId));

    return (result.rowCount ?? 0) > 0;
  }
}

// 导出单例实例
export const sessionManager = new SessionManager();
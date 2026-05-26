import type { AppSettings, SessionType, StoryboardSession } from '@/domain/storyboard';
import type { ISessionRepository, ISettingsRepository } from '@/infrastructure/repository-interfaces';
import { getRuntimeDataMode } from '@/shared/runtime-config';
import { getDb } from './db';
import { sessions, settings } from './schema';
import { eq, and } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { AsyncLocalStorage } from 'node:async_hooks';

const tokenStore = new AsyncLocalStorage<string>();

export function runWithToken<T>(token: string, fn: () => Promise<T>): Promise<T> {
  return tokenStore.run(token, fn);
}

function getToken(): string {
  return tokenStore.getStore() || 'default';
}

export class SqliteSettingsRepository implements ISettingsRepository {
  async getSettings(): Promise<AppSettings> {
    const db = getDb();
    const token = getToken();

    const [row] = await db
      .select()
      .from(settings)
      .where(eq(settings.token, token));

    return {
      dataMode: getRuntimeDataMode(),
      mockDelayMs: row?.mockDelayMs ?? 600,
      mockFailureRate: row?.mockFailureRate ?? 0,
      language: (row?.language as AppSettings['language']) || 'zh',
      theme: (row?.theme as AppSettings['theme']) || 'light',
    };
  }

  async updateSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
    const db = getDb();
    const token = getToken();
    const current = await this.getSettings();
    const next = { ...current, ...patch };

    const dbPatch: Record<string, string | number> = {};
    if (patch.language !== undefined) {
      dbPatch.language = next.language;
    }
    if (patch.theme !== undefined) {
      dbPatch.theme = next.theme;
    }
    if (patch.mockDelayMs !== undefined) {
      dbPatch.mockDelayMs = next.mockDelayMs;
    }
    if (patch.mockFailureRate !== undefined) {
      dbPatch.mockFailureRate = next.mockFailureRate;
    }

    if (Object.keys(dbPatch).length === 0) {
      return next;
    }

    await db
      .insert(settings)
      .values({
        token,
        language: next.language,
        theme: next.theme,
        mockDelayMs: next.mockDelayMs,
        mockFailureRate: next.mockFailureRate,
      })
      .onConflictDoUpdate({
        target: settings.token,
        set: dbPatch,
      });

    return next;
  }
}

export class SqliteSessionRepository implements ISessionRepository {
  async loadSession(sessionType: SessionType): Promise<StoryboardSession | null> {
    const db = getDb();
    const token = getToken();

    const [row] = await db
      .select()
      .from(sessions)
      .where(and(
        eq(sessions.token, token),
        eq(sessions.sessionType, sessionType),
      ));

    if (!row) {
      return null;
    }

    return {
      sessionType: row.sessionType as SessionType,
      script: row.script,
      duration: row.duration,
      wordCount: row.wordCount ?? undefined,
      scenes: JSON.parse(row.scenesJson),
      updatedAt: row.updatedAt,
    };
  }

  async saveSession(session: StoryboardSession): Promise<void> {
    const db = getDb();
    const token = getToken();

    const values = {
      token,
      sessionType: session.sessionType,
      script: session.script,
      duration: session.duration,
      wordCount: session.wordCount ?? null,
      scenesJson: JSON.stringify(session.scenes),
      updatedAt: new Date().toISOString(),
    };

    await db
      .insert(sessions)
      .values(values)
      .onConflictDoUpdate({
        target: [sessions.token, sessions.sessionType],
        set: {
          script: sql`excluded.script`,
          duration: sql`excluded.duration`,
          wordCount: sql`excluded.word_count`,
          scenesJson: sql`excluded.scenes_json`,
          updatedAt: sql`excluded.updated_at`,
        },
      });
  }

  async clearSession(sessionType?: SessionType): Promise<void> {
    const db = getDb();
    const token = getToken();

    if (sessionType) {
      await db
        .delete(sessions)
        .where(and(
          eq(sessions.token, token),
          eq(sessions.sessionType, sessionType),
        ));
    } else {
      await db
        .delete(sessions)
        .where(eq(sessions.token, token));
    }
  }
}

import { sqliteTable, text, integer, unique } from 'drizzle-orm/sqlite-core';
import type { SessionType, Language, Theme } from '@/domain/storyboard';

export const sessions = sqliteTable('sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  token: text('token').notNull(),
  sessionType: text('session_type').$type<SessionType>().notNull(),
  script: text('script').notNull(),
  duration: integer('duration').notNull(),
  wordCount: integer('word_count'),
  scenesJson: text('scenes_json').notNull(),
  updatedAt: text('updated_at').notNull(),
}, (table) => ({
  tokenTypeUniq: unique('sessions_token_type_uniq').on(table.token, table.sessionType),
}));

export const settings = sqliteTable('settings', {
  token: text('token').primaryKey(),
  language: text('language').$type<Language>().notNull().default('zh'),
  theme: text('theme').$type<Theme>().notNull().default('light'),
  mockDelayMs: integer('mock_delay_ms').notNull().default(600),
  mockFailureRate: integer('mock_failure_rate').notNull().default(0),
});

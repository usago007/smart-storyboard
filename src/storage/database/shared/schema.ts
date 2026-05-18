import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  boolean,
  integer,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { createSchemaFactory } from "drizzle-zod";
import { z } from "zod";

// 用户生成会话表
export const userGenerationSessions = pgTable(
  "user_generation_sessions",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    sessionId: varchar("session_id", { length: 255 }).notNull(),
    userFingerprint: text("user_fingerprint"),
    scriptContent: text("script_content"),
    duration: integer("duration"),
    scenes: jsonb("scenes"),
    sceneType: varchar("scene_type", { length: 20 }).default("auto").notNull(), // 'auto' | 'manual'
    sourceData: jsonb("source_data"), // 手工创建时的原始数据
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true })
      .default(sql`now() + interval '24 hours'`)
      .notNull(),
  },
  (table) => ({
    sessionIdIdx: index("user_generation_sessions_session_id_idx").on(table.sessionId),
    expiresAtIdx: index("user_generation_sessions_expires_at_idx").on(table.expiresAt),
    userFingerprintIdx: index("user_generation_sessions_user_fingerprint_idx").on(table.userFingerprint),
    sceneTypeIdx: index("user_generation_sessions_scene_type_idx").on(table.sceneType),
  })
);

// 图片生成记录表
export const imageGenerations = pgTable(
  "image_generations",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    sessionId: varchar("session_id", { length: 255 }).notNull(),
    sceneId: integer("scene_id").notNull(),
    frameType: varchar("frame_type", { length: 10 }).notNull(), // 'first' or 'last'
    prompt: text("prompt").notNull(),
    imageUrl: text("image_url"),
    generationTime: integer("generation_time"), // 生成耗时（毫秒）
    status: varchar("status", { length: 20 }).default("pending").notNull(), // pending, generating, success, failed
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true })
      .default(sql`now() + interval '24 hours'`)
      .notNull(),
  },
  (table) => ({
    sessionSceneIdx: index("image_generations_session_scene_idx").on(table.sessionId, table.sceneId, table.frameType),
    statusIdx: index("image_generations_status_idx").on(table.status),
    expiresAtIdx: index("image_generations_expires_at_idx").on(table.expiresAt),
  })
);

// 使用 createSchemaFactory 配置 date coercion（处理前端 string → Date 转换）
const { createInsertSchema: createCoercedInsertSchema } = createSchemaFactory({
  coerce: { date: true },
});

// Zod schemas for validation
export const insertUserGenerationSessionSchema = createCoercedInsertSchema(userGenerationSessions).pick({
  sessionId: true,
  userFingerprint: true,
  scriptContent: true,
  duration: true,
  scenes: true,
  sceneType: true,
  sourceData: true,
});

export const updateUserGenerationSessionSchema = createCoercedInsertSchema(userGenerationSessions)
  .pick({
    scriptContent: true,
    duration: true,
    scenes: true,
    sceneType: true,
  })
  .partial();

export const insertImageGenerationSchema = createCoercedInsertSchema(imageGenerations).pick({
  sessionId: true,
  sceneId: true,
  frameType: true,
  prompt: true,
  generationTime: true,
});

export const updateImageGenerationSchema = createCoercedInsertSchema(imageGenerations)
  .pick({
    imageUrl: true,
    generationTime: true,
    status: true,
    errorMessage: true,
  })
  .partial();

// TypeScript types
export type UserGenerationSession = typeof userGenerationSessions.$inferSelect;
export type InsertUserGenerationSession = z.infer<typeof insertUserGenerationSessionSchema>;
export type UpdateUserGenerationSession = z.infer<typeof updateUserGenerationSessionSchema>;

export type ImageGeneration = typeof imageGenerations.$inferSelect;
export type InsertImageGeneration = z.infer<typeof insertImageGenerationSchema>;
export type UpdateImageGeneration = z.infer<typeof updateImageGenerationSchema>;





import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { modules } from './modules';

export const units = sqliteTable('units', {
  id: text('id', { length: 36 }).primaryKey(),
  moduleId: text('module_id')
    .notNull()
    .references(() => modules.id, { onDelete: 'cascade' }),
  title: text('title', { length: 255 }).notNull(),
  content: text('content'), // This could be text, markdown, or a key to R2 for non-PDF content
  order: integer('order').notNull().default(0),
  audioUrl: text('audio_url'),
  videoUrl: text('video_url'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
});

export type SelectUnit = typeof units.$inferSelect;
export type InsertUnit = typeof units.$inferInsert;

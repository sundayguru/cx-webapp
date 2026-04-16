import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { courses } from './courses';

export const modules = sqliteTable('modules', {
  id: text('id', { length: 36 }).primaryKey(),
  courseId: text('course_id')
    .notNull()
    .references(() => courses.id, { onDelete: 'cascade' }),
  title: text('title', { length: 255 }).notNull(),
  description: text('description'),
  rawText: text('raw_text'),
  order: integer('order').notNull().default(0),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
});

export type SelectModule = typeof modules.$inferSelect;
export type InsertModule = typeof modules.$inferInsert;

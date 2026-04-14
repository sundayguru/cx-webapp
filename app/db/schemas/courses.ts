import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { users } from './users';

export const courses = sqliteTable('courses', {
  id: text('id', { length: 36 }).primaryKey(),
  title: text('title', { length: 255 }).notNull(),
  code: text('code', { length: 50 }).notNull().unique(),
  description: text('description').notNull(),
  status: text('status', { length: 20 }).notNull().default('pending'),
  createdBy: text('created_by')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  contentKey: text('content_key', { length: 511 }),
  contentType: text('content_type', { length: 100 }),
  contentSize: integer('content_size'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
});

export type SelectCourse = typeof courses.$inferSelect;
export type InsertCourse = typeof courses.$inferInsert;

import { sql } from 'drizzle-orm';
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { users } from './users';

export const schools = sqliteTable('schools', {
  id: text('id', { length: 36 }).primaryKey(),
  name: text('name', { length: 255 }).notNull().unique(),
  slug: text('slug', { length: 255 }).notNull().unique(),
  createdBy: text('created_by').references(() => users.id, {
    onDelete: 'set null',
  }),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
});

export type SelectSchool = typeof schools.$inferSelect;
export type InsertSchool = typeof schools.$inferInsert;

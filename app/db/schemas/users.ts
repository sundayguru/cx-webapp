import { sql } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable('users', {
  id: text('id', { length: 36 }).primaryKey(),
  firstName: text({ length: 255 }).notNull(),
  lastName: text({ length: 255 }).notNull(),
  email: text({ length: 255 }).notNull(),
  createdAt: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
});

export type SelectUser = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

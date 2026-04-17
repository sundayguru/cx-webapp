import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { units } from './units';

export const chatMessages = sqliteTable('chat_messages', {
  id: text('id', { length: 36 }).primaryKey(),
  unitId: text('unit_id')
    .notNull()
    .references(() => units.id, { onDelete: 'cascade' }),
  userId: text('user_id'),
  role: text('role', { length: 20 }).notNull(),
  content: text('content').notNull(),
  provider: text('provider', { length: 20 }),
  model: text('model', { length: 50 }),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
});

export type SelectChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;

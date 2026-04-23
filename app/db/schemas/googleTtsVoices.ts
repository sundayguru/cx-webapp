import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const googleTtsVoices = sqliteTable('google_tts_voices', {
  name: text('name', { length: 255 }).primaryKey(),
  languageCodes: text('language_codes').notNull(),
  ssmlGender: text('ssml_gender', { length: 64 }).notNull(),
  naturalSampleRateHertz: integer('natural_sample_rate_hertz').notNull(),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
});

export type SelectGoogleTtsVoice = typeof googleTtsVoices.$inferSelect;
export type InsertGoogleTtsVoice = typeof googleTtsVoices.$inferInsert;

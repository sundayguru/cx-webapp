import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { units } from './units';

export const questionTypes = ['openText', 'choice'] as const;
export type QuestionType = (typeof questionTypes)[number];

export const quizzes = sqliteTable('quizzes', {
  id: text('id', { length: 36 }).primaryKey(),
  unitId: text('unit_id')
    .notNull()
    .references(() => units.id, { onDelete: 'cascade' }),
  question: text('question').notNull(),
  questionType: text('question_type', { length: 20 }).notNull(),
  answer: text('answer').notNull(),
  options: text('options'), // JSON array for choice questions
  createdAt: text('created_at')
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
});

export type SelectQuiz = typeof quizzes.$inferSelect;
export type InsertQuiz = typeof quizzes.$inferInsert;

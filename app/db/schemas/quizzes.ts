import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { units, users } from './index';

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
  options: text('options'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
});

export type SelectQuiz = typeof quizzes.$inferSelect;
export type InsertQuiz = typeof quizzes.$inferInsert;

export const quizSessionModes = ['learning', 'exam'] as const;
export type QuizSessionMode = (typeof quizSessionModes)[number];

export const quizSessions = sqliteTable('quiz_sessions', {
  id: text('id', { length: 36 }).primaryKey(),
  unitId: text('unit_id')
    .notNull()
    .references(() => units.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  mode: text('mode', { length: 20 }).notNull(),
  timerEnabled: integer('timer_enabled').notNull().default(0),
  totalQuestions: integer('total_questions').notNull(),
  correctAnswers: integer('correct_answers').notNull().default(0),
  timeSpentSeconds: integer('time_spent_seconds').notNull().default(0),
  answers: text('answers'),
  startedAt: text('started_at')
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
  completedAt: text('completed_at'),
});

export type SelectQuizSession = typeof quizSessions.$inferSelect;
export type InsertQuizSession = typeof quizSessions.$inferInsert;

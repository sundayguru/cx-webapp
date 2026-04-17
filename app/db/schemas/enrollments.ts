import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { courses, users } from './index';

export const enrollments = sqliteTable('enrollments', {
  id: text('id', { length: 36 }).primaryKey(),
  courseId: text('course_id')
    .notNull()
    .references(() => courses.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  enrolledAt: text('enrolled_at')
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
});

export type SelectEnrollment = typeof enrollments.$inferSelect;
export type InsertEnrollment = typeof enrollments.$inferInsert;

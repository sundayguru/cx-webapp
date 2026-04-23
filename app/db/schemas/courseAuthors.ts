import { sql } from 'drizzle-orm';
import { primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { authors } from './authors';
import { courses } from './courses';

export const courseAuthors = sqliteTable(
  'course_authors',
  {
    courseId: text('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    authorId: text('author_id')
      .notNull()
      .references(() => authors.id, { onDelete: 'cascade' }),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP)`),
  },
  (table) => [primaryKey({ columns: [table.courseId, table.authorId] })],
);

export type SelectCourseAuthor = typeof courseAuthors.$inferSelect;
export type InsertCourseAuthor = typeof courseAuthors.$inferInsert;

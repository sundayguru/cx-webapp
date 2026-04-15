import { eq } from 'drizzle-orm';
import { getDb } from './connection';
import { courses, schools, authors, type InsertCourse } from './schemas';
import { v4 as uuidv4 } from 'uuid';
import { logError } from '~/utils/logger';

export const createCourse = async (
  courseData: Omit<InsertCourse, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<InsertCourse | null> => {
  try {
    const db = getDb();
    const courseWithId = {
      ...courseData,
      id: uuidv4(),
    };

    await db.insert(courses).values(courseWithId);
    return courseWithId;
  } catch (e) {
    logError(e, 'Error creating course');
    return null;
  }
};

export const getCourseById = async (id: string) => {
  try {
    const db = getDb();
    const results = await db
      .select({
        course: courses,
        school: schools,
        author: authors,
      })
      .from(courses)
      .leftJoin(schools, eq(courses.schoolId, schools.id))
      .leftJoin(authors, eq(courses.authorId, authors.id))
      .where(eq(courses.id, id))
      .limit(1);
    
    return results[0] || null;
  } catch (e) {
    logError(e, 'Error getting course by id');
    return null;
  }
};

export const getCourseByCode = async (code: string) => {
  try {
    const db = getDb();
    const [course] = await db.select().from(courses).where(eq(courses.code, code));
    return course;
  } catch (e) {
    logError(e, 'Error getting course by code');
    return null;
  }
};

export const getCoursesByUserId = async (userId: string) => {
  try {
    const db = getDb();
    return db
      .select({
        course: courses,
        school: schools,
        author: authors,
      })
      .from(courses)
      .leftJoin(schools, eq(courses.schoolId, schools.id))
      .leftJoin(authors, eq(courses.authorId, authors.id))
      .where(eq(courses.createdBy, userId))
      .orderBy(courses.createdAt);
  } catch (e) {
    logError(e, 'Error getting courses by user id');
    return [];
  }
};

export const updateCourse = async (id: string, data: Partial<InsertCourse>) => {
  try {
    const db = getDb();
    await db
      .update(courses)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(eq(courses.id, id));
    return getCourseById(id);
  } catch (e) {
    logError(e, 'Error updating course');
    return null;
  }
};

export const updateCourseContent = async (
  id: string,
  contentKey: string,
  contentType: string,
  contentSize: number,
) => {
  try {
    const db = getDb();
    await db
      .update(courses)
      .set({
        contentKey,
        contentType,
        contentSize,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(courses.id, id));
    return getCourseById(id);
  } catch (e) {
    logError(e, 'Error updating course content');
    return null;
  }
};

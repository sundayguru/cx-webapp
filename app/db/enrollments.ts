import { eq, count } from 'drizzle-orm';
import { getDb } from './connection';
import { enrollments, type SelectEnrollment } from './schemas';
import { logError } from '~/utils/logger';

export const getEnrollmentCount = async (courseId: string): Promise<number> => {
  try {
    const db = getDb();
    const result = await db
      .select({ count: count() })
      .from(enrollments)
      .where(eq(enrollments.courseId, courseId));
    return result[0]?.count ?? 0;
  } catch (e) {
    logError(e, 'Error getting enrollment count');
    return 0;
  }
};

export const isUserEnrolled = async (
  courseId: string,
  userId: string,
): Promise<boolean> => {
  try {
    const db = getDb();
    const result = await db
      .select()
      .from(enrollments)
      .where(eq(enrollments.courseId, courseId));
    return result.some((e) => e.userId === userId);
  } catch (e) {
    logError(e, 'Error checking enrollment');
    return false;
  }
};

export const enrollUser = async (
  courseId: string,
  userId: string,
): Promise<SelectEnrollment> => {
  const db = getDb();
  const [enrollment] = await db
    .insert(enrollments)
    .values({
      id: crypto.randomUUID(),
      courseId,
      userId,
    })
    .returning();
  return enrollment;
};

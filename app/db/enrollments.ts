import { eq, count, desc } from 'drizzle-orm';
import { getDb } from './connection';
import { enrollments, type SelectEnrollment } from './schemas';
import { courses } from './schemas/courses';
import { quizSessions } from './schemas/quizzes';
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

export type UserEnrollmentWithCourse = SelectEnrollment & {
  course: {
    id: string;
    title: string;
    code: string;
    category: string;
    thumbnailKey: string | null;
    level: string;
  };
};

export const getUserEnrollments = async (
  userId: string,
): Promise<UserEnrollmentWithCourse[]> => {
  try {
    const db = getDb();
    const results = await db
      .select({
        id: enrollments.id,
        courseId: enrollments.courseId,
        userId: enrollments.userId,
        enrolledAt: enrollments.enrolledAt,
        course: {
          id: courses.id,
          title: courses.title,
          code: courses.code,
          category: courses.category,
          thumbnailKey: courses.thumbnailKey,
          level: courses.level,
        },
      })
      .from(enrollments)
      .innerJoin(courses, eq(enrollments.courseId, courses.id))
      .where(eq(enrollments.userId, userId))
      .orderBy(desc(enrollments.enrolledAt));
    return results as unknown as UserEnrollmentWithCourse[];
  } catch (e) {
    logError(e, 'Error getting user enrollments');
    return [];
  }
};

export const getUserEnrollmentsCount = async (
  userId: string,
): Promise<number> => {
  try {
    const db = getDb();
    const result = await db
      .select({ count: count() })
      .from(enrollments)
      .where(eq(enrollments.userId, userId));
    return result[0]?.count ?? 0;
  } catch (e) {
    logError(e, 'Error getting user enrollments count');
    return 0;
  }
};

export type UserStats = {
  coursesEnrolled: number;
  quizzesTaken: number;
  totalTimeSpent: number;
  averageScore: number;
  totalSessions: number;
  completedSessions: number;
  sessionCompletionRate: number;
};

export const getUserStats = async (userId: string): Promise<UserStats> => {
  try {
    const db = getDb();
    const userEnrollments = await db
      .select()
      .from(enrollments)
      .where(eq(enrollments.userId, userId));
    const coursesEnrolled = userEnrollments.length;

    const userSessions = await db
      .select()
      .from(quizSessions)
      .where(eq(quizSessions.userId, userId));

    const totalSessions = userSessions.length;
    const quizzesTaken = userSessions.length;
    const completedSessions = userSessions.filter((session) =>
      Boolean(session.completedAt),
    ).length;
    const totalTimeSpent = userSessions.reduce(
      (sum, session) => sum + session.timeSpentSeconds,
      0,
    );
    const totalQuestions = userSessions.reduce(
      (sum, session) => sum + session.totalQuestions,
      0,
    );
    const correctAnswers = userSessions.reduce(
      (sum, session) => sum + session.correctAnswers,
      0,
    );
    const averageScore =
      totalQuestions > 0
        ? Math.round((correctAnswers / totalQuestions) * 100)
        : 0;
    const sessionCompletionRate =
      totalSessions > 0
        ? Math.round((completedSessions / totalSessions) * 100)
        : 0;

    return {
      coursesEnrolled,
      quizzesTaken,
      totalTimeSpent,
      averageScore,
      totalSessions,
      completedSessions,
      sessionCompletionRate,
    };
  } catch (e) {
    logError(e, 'Error getting user stats');
    return {
      coursesEnrolled: 0,
      quizzesTaken: 0,
      totalTimeSpent: 0,
      averageScore: 0,
      totalSessions: 0,
      completedSessions: 0,
      sessionCompletionRate: 0,
    };
  }
};

import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import { getDb } from './connection';
import {
  courses,
  modules,
  quizzes,
  quizSessions,
  units,
  type InsertQuiz,
  type SelectQuiz,
  type SelectQuizSession,
} from './schemas';
import { v4 as uuidv4 } from 'uuid';
import { logError } from '~/utils/logger';

export const createQuiz = async (
  unitId: string,
  question: string,
  questionType: 'openText' | 'choice',
  answer: string,
  options?: string[],
): Promise<SelectQuiz | null> => {
  try {
    const db = getDb();
    const quiz = {
      id: uuidv4(),
      unitId,
      question,
      questionType,
      answer,
      options: options ? JSON.stringify(options) : null,
    };

    await db.insert(quizzes).values(quiz);
    return quiz as SelectQuiz;
  } catch (e) {
    logError(e, 'Error creating quiz');
    return null;
  }
};

export const getQuizzesByUnitId = async (
  unitId: string,
): Promise<SelectQuiz[]> => {
  try {
    const db = getDb();
    return await db
      .select()
      .from(quizzes)
      .where(eq(quizzes.unitId, unitId))
      .orderBy(asc(quizzes.createdAt));
  } catch (e) {
    logError(e, 'Error getting quizzes by unit id');
    return [];
  }
};

export const deleteQuizzesByUnitId = async (
  unitId: string,
): Promise<boolean> => {
  try {
    const db = getDb();
    await db.delete(quizzes).where(eq(quizzes.unitId, unitId));
    return true;
  } catch (e) {
    logError(e, 'Error deleting quizzes by unit id');
    return false;
  }
};

export const createManyQuizzes = async (
  quizData: Omit<InsertQuiz, 'id' | 'createdAt'>[],
): Promise<boolean> => {
  try {
    const db = getDb();
    const quizzesWithIds = quizData.map((q) => ({
      ...q,
      id: uuidv4(),
    }));
    await db.insert(quizzes).values(quizzesWithIds);
    return true;
  } catch (e) {
    logError(e, 'Error creating many quizzes');
    return false;
  }
};

export const createQuizSession = async (
  courseId: string,
  unitId: string,
  userId: string,
  mode: 'learning' | 'exam',
  timerEnabled: boolean,
  totalQuestions: number,
): Promise<SelectQuizSession | null> => {
  try {
    const db = getDb();
    const session = {
      id: uuidv4(),
      courseId,
      unitId,
      userId,
      mode,
      timerEnabled: timerEnabled ? 1 : 0,
      totalQuestions,
      correctAnswers: 0,
      timeSpentSeconds: 0,
    };
    await db.insert(quizSessions).values(session);
    return session as SelectQuizSession;
  } catch (e) {
    logError(e, 'Error creating quiz session');
    return null;
  }
};

export const updateQuizSession = async (
  sessionId: string,
  correctAnswers: number,
  timeSpentSeconds: number,
  answers: string,
  completed: boolean = false,
): Promise<boolean> => {
  try {
    const db = getDb();
    await db
      .update(quizSessions)
      .set({
        correctAnswers,
        timeSpentSeconds,
        answers,
        ...(completed ? { completedAt: new Date().toISOString() } : {}),
      })
      .where(eq(quizSessions.id, sessionId));
    return true;
  } catch (e) {
    logError(e, 'Error updating quiz session');
    return false;
  }
};

export const getQuizSessionById = async (
  sessionId: string,
): Promise<SelectQuizSession | null> => {
  try {
    const db = getDb();
    const [session] = await db
      .select()
      .from(quizSessions)
      .where(eq(quizSessions.id, sessionId))
      .limit(1);
    return session ?? null;
  } catch (e) {
    logError(e, 'Error getting quiz session');
    return null;
  }
};

export const getQuizSessionsByUnitAndUser = async (
  unitId: string,
  userId: string,
): Promise<SelectQuizSession[]> => {
  try {
    const db = getDb();
    return await db
      .select()
      .from(quizSessions)
      .where(
        and(eq(quizSessions.unitId, unitId), eq(quizSessions.userId, userId)),
      )
      .orderBy(asc(quizSessions.startedAt));
  } catch (e) {
    logError(e, 'Error getting quiz sessions');
    return [];
  }
};

export const getQuizSessionsByUser = async (
  userId: string,
): Promise<SelectQuizSession[]> => {
  try {
    const db = getDb();
    return await db
      .select()
      .from(quizSessions)
      .where(eq(quizSessions.userId, userId))
      .orderBy(asc(quizSessions.startedAt));
  } catch (e) {
    logError(e, 'Error getting user quiz sessions');
    return [];
  }
};

export const getRecentQuizSessionsWithCourse = async (
  userId: string,
  limit: number = 5,
): Promise<Array<{ session: SelectQuizSession; courseId: string }>> => {
  try {
    const db = getDb();
    const sessions = await db
      .select()
      .from(quizSessions)
      .where(eq(quizSessions.userId, userId))
      .orderBy(desc(quizSessions.startedAt))
      .limit(limit);

    return sessions.map((s) => ({ session: s, courseId: s.unitId }));
  } catch (e) {
    logError(e, 'Error getting recent quiz sessions');
    return [];
  }
};

export type CourseProgressStats = {
  totalUnits: number;
  totalQuizzes: number;
  unitsStarted: number;
  quizzesTaken: number;
  correctAnswers: number;
  totalQuestions: number;
  averageScore: number;
  totalTimeSpent: number;
};

export type UnitAccuracyPoint = {
  unitId: string;
  courseId: string;
  courseTitle: string;
  unitTitle: string;
  accuracy: number;
  correctAnswers: number;
  totalQuestions: number;
};

export const getUnitAccuracyHistory = async (
  userId: string,
  courseId?: string,
): Promise<UnitAccuracyPoint[]> => {
  try {
    const db = getDb();
    const conditions = [eq(quizSessions.userId, userId)];

    if (courseId) {
      conditions.push(eq(courses.id, courseId));
    }

    const results = await db
      .select({
        unitId: units.id,
        courseId: courses.id,
        courseTitle: courses.title,
        unitTitle: units.title,
        correctAnswers: quizSessions.correctAnswers,
        totalQuestions: quizSessions.totalQuestions,
      })
      .from(quizSessions)
      .innerJoin(units, eq(quizSessions.unitId, units.id))
      .innerJoin(modules, eq(units.moduleId, modules.id))
      .innerJoin(courses, eq(modules.courseId, courses.id))
      .where(and(...conditions))
      .orderBy(desc(quizSessions.startedAt));

    const groupedResults = new Map<
      string,
      {
        unitId: string;
        courseId: string;
        courseTitle: string;
        unitTitle: string;
        correctAnswers: number;
        totalQuestions: number;
      }
    >();

    results.forEach((result) => {
      const existingResult = groupedResults.get(result.unitId);

      if (existingResult) {
        existingResult.correctAnswers += result.correctAnswers;
        existingResult.totalQuestions += result.totalQuestions;
        return;
      }

      groupedResults.set(result.unitId, { ...result });
    });

    return Array.from(groupedResults.values())
      .slice(0, 12)
      .reverse()
      .map((result) => ({
        ...result,
        accuracy:
          result.totalQuestions > 0
            ? Math.round((result.correctAnswers / result.totalQuestions) * 100)
            : 0,
      }));
  } catch (e) {
    logError(e, 'Error getting unit accuracy history');
    return [];
  }
};

export const getCourseProgressStats = async (
  userId: string,
  unitIds: string[],
): Promise<CourseProgressStats> => {
  const db = getDb();

  const allQuizzes = await db
    .select()
    .from(quizzes)
    .where(inArray(quizzes.unitId, unitIds));
  const totalQuizzes = allQuizzes.length;

  const relevantSessions = await db
    .select()
    .from(quizSessions)
    .where(
      and(
        inArray(quizSessions.unitId, unitIds),
        eq(quizSessions.userId, userId),
      ),
    );

  const uniqueUnitsWithQuizzes = new Set(relevantSessions.map((s) => s.unitId));
  const quizAttempts = relevantSessions.length;

  const totalTimeSpent = relevantSessions.reduce(
    (sum, s) => sum + s.timeSpentSeconds,
    0,
  );

  const totalQuestions = relevantSessions.reduce(
    (sum, s) => sum + s.totalQuestions,
    0,
  );
  const correctAnswers = relevantSessions.reduce(
    (sum, s) => sum + s.correctAnswers,
    0,
  );

  const averageScore =
    totalQuestions > 0
      ? Math.round((correctAnswers / totalQuestions) * 100)
      : 0;

  return {
    totalUnits: unitIds.length,
    totalQuizzes,
    unitsStarted: uniqueUnitsWithQuizzes.size,
    quizzesTaken: quizAttempts,
    correctAnswers,
    totalQuestions,
    averageScore,
    totalTimeSpent,
  };
};

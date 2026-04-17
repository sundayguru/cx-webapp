import { eq, asc } from 'drizzle-orm';
import { getDb } from './connection';
import { quizzes, type InsertQuiz, type SelectQuiz } from './schemas';
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
    return db
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

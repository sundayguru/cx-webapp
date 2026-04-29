import type { SelectQuizSession } from '~/db/schemas/quizzes';

export type QuizSessionAnswer = {
  quizId: string;
  answer: string | null;
  isCorrect: boolean;
};

export type QuizPerformanceStat = {
  quizId: string;
  attempts: number;
  correctCount: number;
  incorrectCount: number;
  accuracy: number | null;
  lastResult: 'correct' | 'incorrect' | null;
  lastAttemptedAt: string | null;
  priorityWeight: number;
};

const isQuizSessionAnswer = (value: unknown): value is QuizSessionAnswer => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.quizId === 'string' &&
    (typeof candidate.answer === 'string' || candidate.answer === null) &&
    typeof candidate.isCorrect === 'boolean'
  );
};

export const parseQuizSessionAnswers = (
  rawAnswers: string | null,
): QuizSessionAnswer[] => {
  if (!rawAnswers) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawAnswers) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isQuizSessionAnswer);
  } catch {
    return [];
  }
};

export const buildQuizPerformanceMap = (
  quizIds: string[],
  sessions: SelectQuizSession[],
): Record<string, QuizPerformanceStat> => {
  const stats = Object.fromEntries(
    quizIds.map((quizId) => [
      quizId,
      {
        quizId,
        attempts: 0,
        correctCount: 0,
        incorrectCount: 0,
        accuracy: null,
        lastResult: null,
        lastAttemptedAt: null,
        priorityWeight: 6,
      } satisfies QuizPerformanceStat,
    ]),
  ) as Record<string, QuizPerformanceStat>;

  sessions.forEach((session) => {
    const answers = parseQuizSessionAnswers(session.answers);

    answers.forEach((answer) => {
      const current = stats[answer.quizId];

      if (!current) {
        return;
      }

      current.attempts += 1;

      if (answer.isCorrect) {
        current.correctCount += 1;
      } else {
        current.incorrectCount += 1;
      }

      current.lastResult = answer.isCorrect ? 'correct' : 'incorrect';
      current.lastAttemptedAt = session.completedAt ?? session.startedAt;
    });
  });

  Object.values(stats).forEach((stat) => {
    stat.accuracy =
      stat.attempts > 0 ? stat.correctCount / stat.attempts : null;

    if (stat.attempts === 0) {
      stat.priorityWeight = 6;
      return;
    }

    const accuracyPenalty =
      stat.accuracy === null ? 0 : Math.max(0, 1 - stat.accuracy) * 4;
    const incorrectBias = stat.incorrectCount * 1.5;
    const recencyBias = stat.lastResult === 'incorrect' ? 1.5 : 0;

    stat.priorityWeight = Math.max(
      1,
      1 + accuracyPenalty + incorrectBias + recencyBias,
    );
  });

  return stats;
};

export const getQuizSessionQuizzes = <
  T extends { id: string; questionType: string },
>(
  quizzes: T[],
  performanceMap: Record<string, QuizPerformanceStat>,
  sessionSize: number,
  maxOpenTextQuestions: number,
): T[] => {
  const selected: T[] = [];
  const selectedIds = new Set<string>();
  let openTextCount = 0;

  const appendQuizzes = (pool: T[], limit = Number.POSITIVE_INFINITY) => {
    for (const quiz of pool) {
      if (
        selected.length >= sessionSize ||
        limit <= 0 ||
        selectedIds.has(quiz.id)
      ) {
        break;
      }

      if (quiz.questionType === 'openText') {
        if (openTextCount >= maxOpenTextQuestions) {
          continue;
        }

        openTextCount += 1;
      }

      selected.push(quiz);
      selectedIds.add(quiz.id);
      limit -= 1;
    }
  };

  const attemptedQuizzes = quizzes
    .filter((quiz) => (performanceMap[quiz.id]?.attempts ?? 0) > 0)
    .sort((left, right) => {
      const leftAttemptedAt = performanceMap[left.id]?.lastAttemptedAt;
      const rightAttemptedAt = performanceMap[right.id]?.lastAttemptedAt;

      if (leftAttemptedAt && rightAttemptedAt) {
        return leftAttemptedAt.localeCompare(rightAttemptedAt);
      }

      if (leftAttemptedAt) {
        return -1;
      }

      if (rightAttemptedAt) {
        return 1;
      }

      return 0;
    });

  const unattemptedQuizzes = quizzes.filter(
    (quiz) => (performanceMap[quiz.id]?.attempts ?? 0) === 0,
  );

  if (attemptedQuizzes.length === 0) {
    appendQuizzes(unattemptedQuizzes, sessionSize);
    return selected;
  }

  appendQuizzes(attemptedQuizzes, Math.min(5, sessionSize));
  appendQuizzes(unattemptedQuizzes, sessionSize - selected.length);
  appendQuizzes(attemptedQuizzes, sessionSize - selected.length);

  return selected;
};

export const normalizeQuizAnswer = (answer: string | null) => {
  return answer?.trim().toLowerCase() ?? '';
};

const parseQuizOptions = (options: string | null) => {
  if (!options) {
    return [] as string[];
  }

  try {
    const parsed = JSON.parse(options) as unknown;
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
};

export const isQuizAnswerCorrect = (
  quiz: {
    answer: string;
    questionType: string;
    options: string | null;
  },
  answer: string | null,
) => {
  const normalizedUserAnswer = normalizeQuizAnswer(answer);

  if (!normalizedUserAnswer) {
    return false;
  }

  if (quiz.questionType === 'choice') {
    const options = parseQuizOptions(quiz.options);
    const answerIndex = Number(quiz.answer);

    if (!Number.isNaN(answerIndex) && options[answerIndex]) {
      return (
        normalizedUserAnswer === normalizeQuizAnswer(options[answerIndex]) ||
        normalizedUserAnswer === normalizeQuizAnswer(String(answerIndex))
      );
    }
  }

  return normalizedUserAnswer === normalizeQuizAnswer(quiz.answer);
};

export const getQuizDisplayAnswer = (quiz: {
  answer: string;
  questionType: string;
  options: string | null;
}) => {
  if (quiz.questionType !== 'choice' || !quiz.options) {
    return quiz.answer;
  }

  const options = parseQuizOptions(quiz.options);
  const answerIndex = Number(quiz.answer);

  if (!Number.isNaN(answerIndex) && options[answerIndex]) {
    return options[answerIndex];
  }

  return quiz.answer;
};

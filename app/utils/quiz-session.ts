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

export const getWeightedRandomizedQuizzes = <T extends { id: string }>(
  quizzes: T[],
  performanceMap: Record<string, QuizPerformanceStat>,
): T[] => {
  const pool = [...quizzes];
  const ordered: T[] = [];

  while (pool.length > 0) {
    const totalWeight = pool.reduce((sum, quiz) => {
      return sum + (performanceMap[quiz.id]?.priorityWeight ?? 1);
    }, 0);

    let cursor = Math.random() * totalWeight;
    let pickedIndex = 0;

    for (let index = 0; index < pool.length; index += 1) {
      cursor -= performanceMap[pool[index].id]?.priorityWeight ?? 1;

      if (cursor <= 0) {
        pickedIndex = index;
        break;
      }
    }

    const [pickedQuiz] = pool.splice(pickedIndex, 1);

    if (pickedQuiz) {
      ordered.push(pickedQuiz);
    }
  }

  return ordered;
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

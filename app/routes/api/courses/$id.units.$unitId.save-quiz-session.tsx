import { data, type ActionFunctionArgs } from 'react-router';
import { getCourseById } from '~/db/courses';
import { getQuizSessionById, updateQuizSession } from '~/db/quizzes';
import { getUserFromRequest } from '~/utils/session.server';
import { parseQuizSessionAnswers } from '~/utils/quiz-session';

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const user = await getUserFromRequest(request);

  if (!user) {
    return data({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id, unitId } = params;

  if (!id || !unitId) {
    return data(
      { error: 'Course ID and Unit ID are required' },
      { status: 400 },
    );
  }

  const courseData = await getCourseById(id);

  if (!courseData) {
    return data({ error: 'Course not found' }, { status: 404 });
  }

  const unitExists = courseData.modules.some((module) =>
    module.units.some((unit) => unit.id === unitId),
  );

  if (!unitExists) {
    return data({ error: 'Unit not found' }, { status: 404 });
  }

  const formData = await request.formData();
  const sessionId = formData.get('sessionId');
  const correctAnswers = Number(formData.get('correctAnswers'));
  const timeSpent = Number(formData.get('timeSpent'));
  const answersValue = formData.get('answers');
  const completedValue = formData.get('completed');

  if (typeof sessionId !== 'string' || !sessionId) {
    return data({ error: 'Session ID is required' }, { status: 400 });
  }

  if (typeof answersValue !== 'string') {
    return data({ error: 'Answers are required' }, { status: 400 });
  }

  const session = await getQuizSessionById(sessionId);

  if (!session || session.unitId !== unitId || session.userId !== user.id) {
    return data({ error: 'Quiz session not found' }, { status: 404 });
  }

  if (!Number.isFinite(correctAnswers) || correctAnswers < 0) {
    return data(
      { error: 'Correct answer count must be valid' },
      { status: 400 },
    );
  }

  if (!Number.isFinite(timeSpent) || timeSpent < 0) {
    return data({ error: 'Time spent must be valid' }, { status: 400 });
  }

  const parsedAnswers = parseQuizSessionAnswers(answersValue);

  if (parsedAnswers.length === 0) {
    return data({ error: 'Answers payload is invalid' }, { status: 400 });
  }

  const completed = completedValue === 'true' || completedValue === '1';

  const updated = await updateQuizSession(
    sessionId,
    correctAnswers,
    Math.round(timeSpent),
    answersValue,
    completed,
  );

  if (!updated) {
    return data({ error: 'Failed to save quiz session' }, { status: 500 });
  }

  return data({ success: true });
};

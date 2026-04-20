import { data, type ActionFunctionArgs } from 'react-router';
import { getCourseById } from '~/db/courses';
import { createQuizSession } from '~/db/quizzes';
import { getUserFromRequest } from '~/utils/session.server';

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
  const modeValue = formData.get('mode');
  const timerEnabledValue = formData.get('timerEnabled');
  const totalQuestionsValue = Number(formData.get('totalQuestions'));

  const mode = modeValue === 'exam' ? 'exam' : 'learning';
  const timerEnabled =
    timerEnabledValue === 'true' || timerEnabledValue === '1';

  if (!Number.isFinite(totalQuestionsValue) || totalQuestionsValue <= 0) {
    return data({ error: 'Total questions must be provided' }, { status: 400 });
  }

  const session = await createQuizSession(
    id,
    unitId,
    user.id,
    mode,
    timerEnabled,
    totalQuestionsValue,
  );

  if (!session) {
    return data({ error: 'Failed to start quiz session' }, { status: 500 });
  }

  return data({
    success: true,
    sessionId: session.id,
  });
};

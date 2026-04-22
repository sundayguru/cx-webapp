import { type ActionFunctionArgs, data } from 'react-router';
import { getCourseById } from '~/db/courses';
import { getUserFromRequest } from '~/utils/session.server';
import {
  CourseProcessingError,
  DEFAULT_WORKFLOW_QUIZ_BATCH_SIZE,
  DEFAULT_WORKFLOW_QUIZ_TARGET,
  generateQuizBatchForUnit,
  resolveCourseAiOptions,
} from '~/utils/course-processing.server';

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

  if (courseData.course.createdBy !== user.id) {
    return data(
      { error: 'Only the creator can generate quizzes' },
      { status: 403 },
    );
  }

  const formData = await request.formData();
  const options = resolveCourseAiOptions(
    formData.get('provider'),
    formData.get('model'),
  );

  try {
    const result = await generateQuizBatchForUnit(unitId, {
      ...options,
      maxNewQuizzes: DEFAULT_WORKFLOW_QUIZ_BATCH_SIZE,
      maxTotalQuizzes: DEFAULT_WORKFLOW_QUIZ_TARGET,
    });

    return data({
      success: true,
      count: result.count,
      totalCount: result.totalCount,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Generation failed';
    return data(
      { error: message },
      { status: err instanceof CourseProcessingError ? err.status : 500 },
    );
  }
};

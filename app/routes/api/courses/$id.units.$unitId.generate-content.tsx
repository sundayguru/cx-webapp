import { type ActionFunctionArgs, data } from 'react-router';
import { getCourseById } from '~/db/courses';
import { getUserFromRequest } from '~/utils/session.server';
import {
  CourseProcessingError,
  generateUnitContentForUnit,
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
      { error: 'Only the creator can generate unit content' },
      { status: 403 },
    );
  }

  const formData = await request.formData();
  const options = resolveCourseAiOptions(
    formData.get('provider'),
    formData.get('model'),
  );

  try {
    const result = await generateUnitContentForUnit(unitId, options);

    return data({
      success: true,
      title: result.title,
      summary: result.summary,
      contentLength: result.contentLength,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Generation failed';
    return data(
      { error: message },
      { status: err instanceof CourseProcessingError ? err.status : 500 },
    );
  }
};

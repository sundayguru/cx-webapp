import { data, type ActionFunctionArgs } from 'react-router';
import { getCourseById } from '~/db/courses';
import {
  CourseProcessingError,
  generateUnitAudioForUnit,
} from '~/utils/course-processing.server';
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

  if (courseData.course.createdBy !== user.id) {
    return data(
      { error: 'Only the creator can generate unit audio' },
      { status: 403 },
    );
  }

  try {
    const result = await generateUnitAudioForUnit(unitId);

    return data({
      success: true,
      audioUrl: result.audioUrl,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Generation failed';
    return data(
      { error: message },
      { status: err instanceof CourseProcessingError ? err.status : 500 },
    );
  }
};

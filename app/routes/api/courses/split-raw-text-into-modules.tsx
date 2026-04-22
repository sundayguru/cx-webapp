import { type ActionFunctionArgs, data } from 'react-router';
import { getCourseById } from '~/db/courses';
import {
  CourseProcessingError,
  splitCourseRawTextIntoModulesForCourse,
} from '~/utils/course-processing.server';
import { getUserFromRequest } from '~/utils/session.server';

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const user = await getUserFromRequest(request);
  if (!user) {
    return data({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;
  if (!id) {
    return data({ error: 'Course ID is required' }, { status: 400 });
  }

  const courseData = await getCourseById(id);
  if (!courseData) {
    return data({ error: 'Course not found' }, { status: 404 });
  }

  if (courseData.course.createdBy !== user.id) {
    return data(
      { error: 'Only the creator can split raw text into modules' },
      { status: 403 },
    );
  }

  try {
    const result = await splitCourseRawTextIntoModulesForCourse(id);

    return data({
      success: true,
      modulesCount: result.modulesCount,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : 'Failed to create modules from raw text';
    return data(
      { error: message },
      { status: err instanceof CourseProcessingError ? err.status : 500 },
    );
  }
};

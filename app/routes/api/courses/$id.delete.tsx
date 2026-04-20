import { data } from 'react-router';
import type { ActionFunctionArgs } from 'react-router';
import { deleteCourse, getCourseById } from '~/db/courses';
import { getUserFromRequest } from '~/utils/session.server';

export const action = async ({ params, request }: ActionFunctionArgs) => {
  const user = await getUserFromRequest(request);
  const { id: courseId } = params;

  if (!user) {
    return data({ error: 'Authentication required' }, { status: 401 });
  }

  if (!courseId) {
    return data({ error: 'Course ID is required' }, { status: 400 });
  }

  const courseData = await getCourseById(courseId);
  if (!courseData) {
    return data({ error: 'Course not found' }, { status: 404 });
  }

  const isCreator = courseData.course.createdBy === user.id;
  const canDelete =
    user.isAdmin || (isCreator && courseData.course.status === 'pending');

  if (!canDelete) {
    return data(
      { error: 'You do not have permission to delete this course' },
      { status: 403 },
    );
  }

  const success = await deleteCourse(courseId);
  if (!success) {
    return data({ error: 'Failed to delete course' }, { status: 500 });
  }

  return data({ success: true, message: 'Course deleted successfully' });
};

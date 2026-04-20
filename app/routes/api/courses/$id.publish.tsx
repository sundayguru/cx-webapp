import { data } from 'react-router';
import type { ActionFunctionArgs } from 'react-router';
import { publishCourse, unpublishCourse, getCourseById } from '~/db/courses';
import { getUserFromRequest } from '~/utils/session.server';
import { notifyAllUsers } from '~/db/notifications';

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const user = await getUserFromRequest(request);
  const { id: courseId } = params;

  if (!user) {
    return data({ error: 'Authentication required' }, { status: 401 });
  }

  if (!courseId) {
    return data({ error: 'Course ID is required' }, { status: 400 });
  }

  const formData = await request.formData();
  const intent = formData.get('intent') as string;

  let success: boolean;
  if (intent === 'unpublish') {
    success = await unpublishCourse(courseId);
    if (!success) {
      return data({ error: 'Failed to unpublish course' }, { status: 500 });
    }
    return data({ success: true, message: 'Course unpublished' });
  }

  success = await publishCourse(courseId);
  if (!success) {
    return data({ error: 'Failed to publish course' }, { status: 500 });
  }

  // Trigger notification to users
  const courseData = await getCourseById(courseId);
  if (courseData) {
    await notifyAllUsers({
      title: 'New Course Published',
      message: `A new course "${courseData.course.title}" is now available.`,
      actionUrl: `/courses/${courseId}`,
    });
  }

  return data({ success: true, message: 'Course published' });
};

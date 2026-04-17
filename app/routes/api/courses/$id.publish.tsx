import { data } from 'react-router';
import type { ActionFunctionArgs } from 'react-router';
import { publishCourse } from '~/db/courses';
import { getUserFromRequest } from '~/utils/session.server';

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const user = await getUserFromRequest(request);
  const { id: courseId } = params;

  if (!user) {
    return data({ error: 'Authentication required' }, { status: 401 });
  }

  if (!courseId) {
    return data({ error: 'Course ID is required' }, { status: 400 });
  }

  const success = await publishCourse(courseId);
  if (!success) {
    return data({ error: 'Failed to publish course' }, { status: 500 });
  }

  return data({ success: true });
};

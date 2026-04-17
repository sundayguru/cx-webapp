import { data } from 'react-router';
import type { ActionFunctionArgs } from 'react-router';
import { isUserEnrolled, enrollUser } from '~/db/enrollments';
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

  const alreadyEnrolled = await isUserEnrolled(courseId, user.id);
  if (alreadyEnrolled) {
    return data({ error: 'Already enrolled' }, { status: 400 });
  }

  await enrollUser(courseId, user.id);
  return data({ success: true });
};

export const loader = async ({ request, params }: ActionFunctionArgs) => {
  const user = await getUserFromRequest(request);
  const { id: courseId } = params;

  if (!user || !courseId) {
    return data({ isEnrolled: false, enrollmentCount: 0 });
  }

  const isEnrolled = await isUserEnrolled(courseId, user.id);
  return data({ isEnrolled });
};

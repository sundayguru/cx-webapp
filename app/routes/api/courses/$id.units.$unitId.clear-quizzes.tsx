import { type ActionFunctionArgs, data } from 'react-router';
import { getCourseById } from '~/db/courses';
import { deleteQuizzesByUnitId } from '~/db/quizzes';
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
      { error: 'Only the creator can clear quizzes' },
      { status: 403 },
    );
  }

  const deleted = await deleteQuizzesByUnitId(unitId);
  if (!deleted) {
    return data({ error: 'Failed to delete quizzes' }, { status: 500 });
  }

  return data({ success: true });
};

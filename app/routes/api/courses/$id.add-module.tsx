import { type ActionFunctionArgs, data } from 'react-router';
import { addModule, getCourseById } from '~/db/courses';
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

  if (courseData.course.createdBy !== user.id && !user.isAdmin) {
    return data(
      { error: 'Only the creator or an admin can add modules' },
      { status: 403 },
    );
  }

  const formData = await request.formData();
  const title = formData.get('title');
  const rawText = formData.get('rawText');

  if (typeof title !== 'string' || !title) {
    return data({ error: 'Module title is required' }, { status: 400 });
  }

  if (typeof rawText !== 'string' || !rawText) {
    return data({ error: 'Module raw text is required' }, { status: 400 });
  }

  const added = await addModule(id, title, rawText);

  if (!added) {
    return data({ error: 'Failed to add module' }, { status: 500 });
  }

  return data({ success: true });
};

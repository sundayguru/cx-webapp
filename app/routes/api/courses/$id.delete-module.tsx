import { type ActionFunctionArgs, data } from 'react-router';
import { deleteModuleById, getCourseById } from '~/db/courses';
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
      { error: 'Only the creator or an admin can delete modules' },
      { status: 403 },
    );
  }

  const formData = await request.formData();
  const moduleIdValue = formData.get('moduleId');

  if (typeof moduleIdValue !== 'string' || !moduleIdValue) {
    return data({ error: 'Module ID is required' }, { status: 400 });
  }

  const moduleExists = courseData.modules.some(
    (module) => module.id === moduleIdValue,
  );

  if (!moduleExists) {
    return data({ error: 'Module not found' }, { status: 404 });
  }

  const deleted = await deleteModuleById(moduleIdValue);

  if (!deleted) {
    return data({ error: 'Failed to delete module' }, { status: 500 });
  }

  return data({ success: true });
};

import { type ActionFunctionArgs, data } from 'react-router';
import { deleteUnitById, getCourseById } from '~/db/courses';
import { getUserFromRequest } from '~/utils/session.server';

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const user = await getUserFromRequest(request);
  if (!user) {
    return data({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id, unitId } = params;
  if (!id) {
    return data({ error: 'Course ID is required' }, { status: 400 });
  }

  if (!unitId) {
    return data({ error: 'Unit ID is required' }, { status: 400 });
  }

  const courseData = await getCourseById(id);
  if (!courseData) {
    return data({ error: 'Course not found' }, { status: 404 });
  }

  if (courseData.course.createdBy !== user.id && !user.isAdmin) {
    return data(
      { error: 'Only the creator or an admin can delete units' },
      { status: 403 },
    );
  }

  const unitExists = courseData.modules.some((module) =>
    module.units.some((unit) => unit.id === unitId),
  );

  if (!unitExists) {
    return data({ error: 'Unit not found' }, { status: 404 });
  }

  const deleted = await deleteUnitById(unitId);

  if (!deleted) {
    return data({ error: 'Failed to delete unit' }, { status: 500 });
  }

  return data({ success: true });
};

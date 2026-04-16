import { type ActionFunctionArgs, data } from 'react-router';
import { getDb } from '~/db/connection';
import { modules } from '~/db/schemas';
import { eq } from 'drizzle-orm';
import { splitModuleRawTextIntoUnits } from '~/db/courses';
import { getUserFromRequest } from '~/utils/session.server';
import { getCourseById } from '~/db/courses';

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
      { error: 'Only the creator can split module raw text into units' },
      { status: 403 },
    );
  }

  const formData = await request.formData();
  const moduleIdValue = formData.get('moduleId');

  if (typeof moduleIdValue !== 'string' || !moduleIdValue) {
    return data({ error: 'Module ID is required' }, { status: 400 });
  }

  const db = getDb();
  const [module] = await db
    .select()
    .from(modules)
    .where(eq(modules.id, moduleIdValue))
    .limit(1);

  if (!module) {
    return data({ error: 'Module not found' }, { status: 404 });
  }

  const result = await splitModuleRawTextIntoUnits(moduleIdValue);
  if (!result) {
    return data(
      { error: 'Failed to create units from raw text' },
      { status: 500 },
    );
  }

  return data({
    success: true,
    moduleId: moduleIdValue,
    unitsCount: result.unitsCount,
  });
};

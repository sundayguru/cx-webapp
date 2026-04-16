import { type ActionFunctionArgs, data } from 'react-router';
import { getDb } from '~/db/connection';
import { modules } from '~/db/schemas';
import { eq } from 'drizzle-orm';
import { updateModuleRawText, getCourseById } from '~/db/courses';
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
      { error: 'Only the creator can update module raw text' },
      { status: 403 },
    );
  }

  const formData = await request.formData();
  const moduleIdValue = formData.get('moduleId');
  const rawTextValue = formData.get('rawText');

  if (typeof moduleIdValue !== 'string' || !moduleIdValue) {
    return data({ error: 'Module ID is required' }, { status: 400 });
  }

  if (typeof rawTextValue !== 'string') {
    return data({ error: 'Raw text is required' }, { status: 400 });
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

  const updated = await updateModuleRawText(moduleIdValue, rawTextValue.trim());
  if (!updated) {
    return data({ error: 'Failed to update module raw text' }, { status: 500 });
  }

  return data({
    success: true,
    characters: rawTextValue.trim().length,
  });
};

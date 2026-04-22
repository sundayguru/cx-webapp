import { type ActionFunctionArgs, data } from 'react-router';
import { eq } from 'drizzle-orm';
import { getDb } from '~/db/connection';
import { units } from '~/db/schemas';
import { getCourseById, updateUnitRawText } from '~/db/courses';
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

  if (courseData.course.createdBy !== user.id) {
    return data(
      { error: 'Only the creator can update unit raw text' },
      { status: 403 },
    );
  }

  const formData = await request.formData();
  const rawTextValue = formData.get('rawText');

  if (typeof rawTextValue !== 'string') {
    return data({ error: 'Raw text is required' }, { status: 400 });
  }

  const db = getDb();
  const [unit] = await db
    .select()
    .from(units)
    .where(eq(units.id, unitId))
    .limit(1);

  if (!unit) {
    return data({ error: 'Unit not found' }, { status: 404 });
  }

  const updated = await updateUnitRawText(unitId, rawTextValue.trim());
  if (!updated) {
    return data({ error: 'Failed to update unit raw text' }, { status: 500 });
  }

  return data({
    success: true,
    characters: rawTextValue.trim().length,
  });
};

import { type ActionFunctionArgs, data } from 'react-router';
import { getCourseById } from '~/db/courses';
import { getDb } from '~/db/connection';
import { units } from '~/db/schemas';
import { eq } from 'drizzle-orm';
import { getUserFromRequest } from '~/utils/session.server';
import { setUnitComplete } from '~/db/courses';

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

  const db = getDb();
  const [unit] = await db
    .select()
    .from(units)
    .where(eq(units.id, unitId))
    .limit(1);

  if (!unit) {
    return data({ error: 'Unit not found' }, { status: 404 });
  }

  const formData = await request.formData();
  const isCompleteValue = formData.get('isComplete');

  const isComplete = isCompleteValue === 'true' || isCompleteValue === '1';

  const updated = await setUnitComplete(unitId, isComplete);
  if (!updated) {
    return data({ error: 'Failed to update unit completion' }, { status: 500 });
  }

  return data({
    success: true,
    isComplete,
  });
};

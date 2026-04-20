import { data } from 'react-router';
import type { ActionFunctionArgs } from 'react-router';
import { addBookmark, isUnitBookmarked, removeBookmark } from '~/db/bookmarks';
import { getDb } from '~/db/connection';
import { units } from '~/db/schemas';
import { eq } from 'drizzle-orm';
import { getUserFromRequest } from '~/utils/session.server';

export const action = async ({ params, request }: ActionFunctionArgs) => {
  const user = await getUserFromRequest(request);
  const { unitId } = params;

  if (!user) {
    return data({ error: 'Authentication required' }, { status: 401 });
  }

  if (!unitId) {
    return data({ error: 'Unit ID is required' }, { status: 400 });
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

  const alreadyBookmarked = await isUnitBookmarked(user.id, unitId);
  const success = alreadyBookmarked
    ? await removeBookmark(user.id, unitId)
    : await addBookmark(user.id, unitId);

  if (!success) {
    return data({ error: 'Failed to update bookmark' }, { status: 500 });
  }

  return data({
    success: true,
    isBookmarked: !alreadyBookmarked,
    message: alreadyBookmarked ? 'Bookmark removed' : 'Unit bookmarked',
  });
};

import { and, desc, eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from './connection';
import { bookmarks, courses, modules, units } from './schemas';
import { logError } from '~/utils/logger';

export type BookmarkedUnit = {
  bookmark: typeof bookmarks.$inferSelect;
  unit: {
    id: string;
    title: string;
    summary: string | null;
  };
  module: {
    id: string;
    title: string;
  };
  course: {
    id: string;
    title: string;
    code: string;
    category: string;
    thumbnailKey: string | null;
  };
};

export const isUnitBookmarked = async (
  userId: string,
  unitId: string,
): Promise<boolean> => {
  try {
    const db = getDb();
    const [bookmark] = await db
      .select()
      .from(bookmarks)
      .where(and(eq(bookmarks.userId, userId), eq(bookmarks.unitId, unitId)))
      .limit(1);

    return Boolean(bookmark);
  } catch (e) {
    logError(e, 'Error checking unit bookmark');
    return false;
  }
};

export const addBookmark = async (
  userId: string,
  unitId: string,
): Promise<boolean> => {
  try {
    const db = getDb();
    const existingBookmark = await isUnitBookmarked(userId, unitId);

    if (existingBookmark) {
      return true;
    }

    await db.insert(bookmarks).values({
      id: uuidv4(),
      userId,
      unitId,
    });

    return true;
  } catch (e) {
    logError(e, 'Error adding bookmark');
    return false;
  }
};

export const removeBookmark = async (
  userId: string,
  unitId: string,
): Promise<boolean> => {
  try {
    const db = getDb();
    await db
      .delete(bookmarks)
      .where(and(eq(bookmarks.userId, userId), eq(bookmarks.unitId, unitId)));

    return true;
  } catch (e) {
    logError(e, 'Error removing bookmark');
    return false;
  }
};

export const getBookmarkedUnitsByUser = async (
  userId: string,
): Promise<BookmarkedUnit[]> => {
  try {
    const db = getDb();
    const results = await db
      .select({
        bookmark: bookmarks,
        unit: {
          id: units.id,
          title: units.title,
          summary: units.summary,
        },
        module: {
          id: modules.id,
          title: modules.title,
        },
        course: {
          id: courses.id,
          title: courses.title,
          code: courses.code,
          category: courses.category,
          thumbnailKey: courses.thumbnailKey,
        },
      })
      .from(bookmarks)
      .innerJoin(units, eq(bookmarks.unitId, units.id))
      .innerJoin(modules, eq(units.moduleId, modules.id))
      .innerJoin(courses, eq(modules.courseId, courses.id))
      .where(eq(bookmarks.userId, userId))
      .orderBy(desc(bookmarks.createdAt));

    return results;
  } catch (e) {
    logError(e, 'Error getting bookmarked units');
    return [];
  }
};

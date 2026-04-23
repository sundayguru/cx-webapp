import { eq, and, like, or, SQL, asc, inArray } from 'drizzle-orm';
import { getDb } from './connection';
import {
  courses,
  courseAuthors,
  schools,
  authors,
  modules,
  profile,
  units,
  users,
  type InsertCourse,
} from './schemas';
import { v4 as uuidv4 } from 'uuid';
import { logError } from '~/utils/logger';
import type { CourseContributor } from '~/types/course';

type CourseWithRelations = {
  course: typeof courses.$inferSelect;
  school: typeof schools.$inferSelect | null;
  author: typeof authors.$inferSelect | null;
  authors: Array<typeof authors.$inferSelect>;
  contributor: CourseContributor;
};

const getCourseAuthorsMap = async (courseIds: string[]) => {
  if (courseIds.length === 0) {
    return new Map<string, Array<typeof authors.$inferSelect>>();
  }

  const db = getDb();
  const rows = await db
    .select({
      courseId: courseAuthors.courseId,
      author: authors,
    })
    .from(courseAuthors)
    .innerJoin(authors, eq(courseAuthors.authorId, authors.id))
    .where(inArray(courseAuthors.courseId, courseIds));

  const authorsMap = new Map<string, Array<typeof authors.$inferSelect>>();

  rows.forEach(({ courseId, author }) => {
    const existing = authorsMap.get(courseId) ?? [];
    existing.push(author);
    authorsMap.set(courseId, existing);
  });

  return authorsMap;
};

export const setCourseAuthors = async (
  courseId: string,
  authorIds: string[],
) => {
  try {
    const db = getDb();
    const uniqueAuthorIds = Array.from(new Set(authorIds.filter(Boolean)));

    await db.delete(courseAuthors).where(eq(courseAuthors.courseId, courseId));

    if (uniqueAuthorIds.length > 0) {
      await db.insert(courseAuthors).values(
        uniqueAuthorIds.map((authorId) => ({
          courseId,
          authorId,
        })),
      );
    }

    const primaryAuthorId = uniqueAuthorIds[0] ?? null;

    await db
      .update(courses)
      .set({
        authorId: primaryAuthorId,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(courses.id, courseId));

    return true;
  } catch (e) {
    logError(e, 'Error setting course authors');
    return false;
  }
};

export const createCourse = async (
  courseData: Omit<InsertCourse, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<InsertCourse | null> => {
  try {
    const db = getDb();
    const courseWithId = {
      ...courseData,
      id: uuidv4(),
    };

    await db.insert(courses).values(courseWithId);
    return courseWithId;
  } catch (e) {
    logError(e, 'Error creating course');
    return null;
  }
};

export const publishCourse = async (courseId: string): Promise<boolean> => {
  try {
    const db = getDb();
    await db
      .update(courses)
      .set({ status: 'published', updatedAt: new Date().toISOString() })
      .where(eq(courses.id, courseId));
    return true;
  } catch (e) {
    logError(e, 'Error publishing course');
    return false;
  }
};

export const unpublishCourse = async (courseId: string): Promise<boolean> => {
  try {
    const db = getDb();
    await db
      .update(courses)
      .set({ status: 'pending', updatedAt: new Date().toISOString() })
      .where(eq(courses.id, courseId));
    return true;
  } catch (e) {
    logError(e, 'Error unpublishing course');
    return false;
  }
};

export const deleteCourse = async (courseId: string): Promise<boolean> => {
  try {
    const db = getDb();
    await db.delete(courses).where(eq(courses.id, courseId));
    return true;
  } catch (e) {
    logError(e, 'Error deleting course');
    return false;
  }
};

export const getCourseById = async (id: string) => {
  try {
    const db = getDb();

    // Get course, school and author
    const results = await db
      .select({
        course: courses,
        school: schools,
        author: authors,
        contributor: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          avatarUrl: profile.avatarUrl,
        },
      })
      .from(courses)
      .leftJoin(schools, eq(courses.schoolId, schools.id))
      .leftJoin(authors, eq(courses.authorId, authors.id))
      .innerJoin(users, eq(courses.createdBy, users.id))
      .leftJoin(profile, eq(profile.userId, users.id))
      .where(eq(courses.id, id))
      .limit(1);

    if (results.length === 0) {
      return null;
    }

    const courseData = results[0] as CourseWithRelations;
    const authorsMap = await getCourseAuthorsMap([id]);
    const linkedAuthors = authorsMap.get(id) ?? [];
    const courseAuthorsList =
      linkedAuthors.length > 0
        ? linkedAuthors
        : courseData.author
          ? [courseData.author]
          : [];

    // Get modules for the course
    const courseModules = await db
      .select()
      .from(modules)
      .where(eq(modules.courseId, id))
      .orderBy(asc(modules.order));

    // Get units for all modules in this course
    const moduleIds = courseModules.map((m) => m.id);
    let courseUnits: Array<typeof units.$inferSelect> = [];
    if (moduleIds.length > 0) {
      courseUnits = await db
        .select()
        .from(units)
        .where(or(...moduleIds.map((mid) => eq(units.moduleId, mid))))
        .orderBy(asc(units.order));
    }

    // Organize into hierarchy
    const modulesWithUnits = courseModules.map((m) => ({
      ...m,
      units: courseUnits.filter((u) => u.moduleId === m.id),
    }));

    return {
      ...courseData,
      authors: courseAuthorsList,
      modules: modulesWithUnits,
    };
  } catch (e) {
    logError(e, 'Error getting course by id');
    return null;
  }
};

export const getCourseByCode = async (code: string) => {
  try {
    const db = getDb();
    const [course] = await db
      .select()
      .from(courses)
      .where(eq(courses.code, code));
    return course;
  } catch (e) {
    logError(e, 'Error getting course by code');
    return null;
  }
};

type CourseFilters = {
  search?: string;
  schoolId?: string;
  authorId?: string;
  level?: string;
  category?: string;
  createdBy?: string;
  publishedOnly?: boolean;
};

export const getCourses = async (filters?: CourseFilters, isAdmin = false) => {
  try {
    const db = getDb();
    const conditions: SQL[] = [];

    if (filters?.createdBy) {
      conditions.push(eq(courses.createdBy, filters.createdBy));
    }

    if (filters?.publishedOnly && !isAdmin) {
      conditions.push(eq(courses.status, 'published'));
    }

    if (filters?.search) {
      conditions.push(
        or(
          like(courses.title, `%${filters.search}%`),
          like(courses.code, `%${filters.search}%`),
          like(courses.description, `%${filters.search}%`),
        )!,
      );
    }

    if (filters?.schoolId) {
      conditions.push(eq(courses.schoolId, filters.schoolId));
    }

    if (filters?.authorId) {
      const linkedCourses = await db
        .selectDistinct({ courseId: courseAuthors.courseId })
        .from(courseAuthors)
        .where(eq(courseAuthors.authorId, filters.authorId));
      const linkedCourseIds = linkedCourses.map((row) => row.courseId);

      if (linkedCourseIds.length > 0) {
        conditions.push(
          or(
            eq(courses.authorId, filters.authorId),
            inArray(courses.id, linkedCourseIds),
          )!,
        );
      } else {
        conditions.push(eq(courses.authorId, filters.authorId));
      }
    }

    if (filters?.level) {
      conditions.push(eq(courses.level, filters.level));
    }

    if (filters?.category) {
      conditions.push(eq(courses.category, filters.category));
    }

    const query = db
      .select({
        course: courses,
        school: schools,
        author: authors,
        contributor: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          avatarUrl: profile.avatarUrl,
        },
      })
      .from(courses)
      .leftJoin(schools, eq(courses.schoolId, schools.id))
      .leftJoin(authors, eq(courses.authorId, authors.id))
      .innerJoin(users, eq(courses.createdBy, users.id))
      .leftJoin(profile, eq(profile.userId, users.id));

    if (conditions.length > 0) {
      query.where(and(...conditions));
    }

    const courseRows = await query.orderBy(courses.createdAt);
    const authorsMap = await getCourseAuthorsMap(
      courseRows.map((row) => row.course.id),
    );

    return courseRows.map((row) => ({
      ...row,
      authors:
        authorsMap.get(row.course.id) ?? (row.author ? [row.author] : []),
    }));
  } catch (e) {
    logError(e, 'Error getting courses');
    return [];
  }
};

// Kept for backward compatibility if needed, but redirects to getCourses
export const getCoursesByUserId = (userId: string, filters?: CourseFilters) => {
  return getCourses({ ...filters, createdBy: userId });
};

export const getAllCourseMetadata = async () => {
  try {
    const db = getDb();

    const allSchools = await db
      .selectDistinct({
        id: schools.id,
        name: schools.name,
      })
      .from(courses)
      .innerJoin(schools, eq(courses.schoolId, schools.id));

    const allAuthors = await db
      .selectDistinct({
        id: authors.id,
        name: authors.name,
      })
      .from(authors);

    return { schools: allSchools, authors: allAuthors };
  } catch (e) {
    logError(e, 'Error getting all course metadata');
    return { schools: [], authors: [] };
  }
};

export const clearCourseCurriculum = async (courseId: string) => {
  try {
    const db = getDb();
    const courseModules = await db
      .select()
      .from(modules)
      .where(eq(modules.courseId, courseId));
    const moduleIds = courseModules.map((m) => m.id);

    if (moduleIds.length > 0) {
      await db
        .delete(units)
        .where(or(...moduleIds.map((mid) => eq(units.moduleId, mid))));
      await db.delete(modules).where(eq(modules.courseId, courseId));
    }
    return true;
  } catch (e) {
    logError(e, 'Error clearing course curriculum');
    return false;
  }
};

export const addCurriculum = async (
  courseId: string,
  curriculum: {
    title: string;
    description: string;
    units: { title: string; content: string }[];
  }[],
) => {
  try {
    const db = getDb();

    for (let i = 0; i < curriculum.length; i++) {
      const m = curriculum[i];
      const moduleId = uuidv4();

      await db.insert(modules).values({
        id: moduleId,
        courseId,
        title: m.title,
        description: m.description,
        order: i,
      });

      for (let j = 0; j < m.units.length; j++) {
        const u = m.units[j];
        await db.insert(units).values({
          id: uuidv4(),
          moduleId,
          title: u.title,
          content: u.content,
          order: j,
        });
      }
    }
    return true;
  } catch (e) {
    logError(e, 'Error adding course curriculum');
    return false;
  }
};

export const updateCourse = async (id: string, data: Partial<InsertCourse>) => {
  try {
    const db = getDb();
    await db
      .update(courses)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(eq(courses.id, id));
    return getCourseById(id);
  } catch (e) {
    logError(e, 'Error updating course');
    return null;
  }
};

export const updateCourseContent = async (
  id: string,
  contentKey: string,
  contentType: string,
  contentSize: number,
) => {
  try {
    const db = getDb();
    await db
      .update(courses)
      .set({
        contentKey,
        contentType,
        contentSize,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(courses.id, id));
    return getCourseById(id);
  } catch (e) {
    logError(e, 'Error updating course content');
    return null;
  }
};

export const updateCourseRawText = async (id: string, rawText: string) => {
  try {
    const db = getDb();
    await db
      .update(courses)
      .set({
        rawText,
        updatedAt: new Date().toISOString(),
        status: 'processing',
      })
      .where(eq(courses.id, id));
    return getCourseById(id);
  } catch (e) {
    logError(e, 'Error updating course raw text');
    return null;
  }
};

export const splitCourseRawTextIntoModules = async (
  courseId: string,
  rawText: string,
) => {
  try {
    const parts = rawText
      .split(/--endmodule--|--end--/g)
      .map((part) => part.trim())
      .filter(Boolean);

    if (parts.length === 0) {
      throw new Error('No module text segments were found');
    }

    const db = getDb();
    await clearCourseCurriculum(courseId);

    const moduleValues = [];
    for (const [index, part] of parts.entries()) {
      if (index == 0) {
        continue;
      }
      moduleValues.push({
        id: uuidv4(),
        courseId,
        title: `Module ${index}`,
        rawText: part,
        order: index,
      });
    }

    await db.insert(modules).values(moduleValues);
    return getCourseById(courseId);
  } catch (e) {
    logError(e, 'Error splitting course raw text into modules');
    return null;
  }
};

export const replaceModuleUnits = async (
  moduleId: string,
  moduleData: {
    title: string;
    description: string;
    units: { title: string; summary: string; content: string }[];
  },
) => {
  try {
    const db = getDb();

    await db.delete(units).where(eq(units.moduleId, moduleId));

    await db
      .update(modules)
      .set({
        title: moduleData.title,
        description: moduleData.description,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(modules.id, moduleId));

    for (const [index, unit] of moduleData.units.entries()) {
      await db.insert(units).values({
        id: uuidv4(),
        moduleId,
        title: unit.title,
        summary: unit.summary,
        content: unit.content,
        order: index,
      });
    }

    return true;
  } catch (e) {
    logError(e, 'Error replacing module units');
    return false;
  }
};

export const splitModuleRawTextIntoUnits = async (moduleId: string) => {
  try {
    const db = getDb();

    const [module] = await db
      .select()
      .from(modules)
      .where(eq(modules.id, moduleId))
      .limit(1);

    if (!module) {
      throw new Error('Module not found');
    }

    const rawText = module.rawText?.trim() || '';
    if (!rawText) {
      throw new Error('Module raw text is empty');
    }

    if (!rawText.includes('--endunit--') && !rawText.includes('--end--')) {
      throw new Error(
        'Module raw text must include "--endunit--" separators before splitting into units',
      );
    }

    const parts = rawText
      .split(/--endunit--|--end--/g)
      .map((part) => part.trim())
      .filter(Boolean);

    if (parts.length === 0) {
      throw new Error('No unit text segments were found');
    }

    await db.delete(units).where(eq(units.moduleId, moduleId));

    for (const [index, part] of parts.entries()) {
      await db.insert(units).values({
        id: uuidv4(),
        moduleId,
        title: `Unit ${index + 1}`,
        rawText: part,
        order: index,
      });
    }

    return { unitsCount: parts.length };
  } catch (e) {
    logError(e, 'Error splitting module raw text into units');
    return null;
  }
};

export const updateModuleRawText = async (
  moduleId: string,
  rawText: string,
) => {
  try {
    const db = getDb();
    await db
      .update(modules)
      .set({
        rawText,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(modules.id, moduleId));
    return true;
  } catch (e) {
    logError(e, 'Error updating module raw text');
    return false;
  }
};

export const updateUnitRawText = async (unitId: string, rawText: string) => {
  try {
    const db = getDb();
    await db
      .update(units)
      .set({
        rawText,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(units.id, unitId));
    return true;
  } catch (e) {
    logError(e, 'Error updating unit raw text');
    return false;
  }
};

export const deleteModuleById = async (moduleId: string) => {
  try {
    const db = getDb();
    const [module] = await db
      .select()
      .from(modules)
      .where(eq(modules.id, moduleId))
      .limit(1);

    if (!module) {
      return false;
    }

    await db.delete(modules).where(eq(modules.id, moduleId));

    const remainingModules = await db
      .select({ id: modules.id })
      .from(modules)
      .where(eq(modules.courseId, module.courseId))
      .orderBy(asc(modules.order));

    for (const [index, remainingModule] of remainingModules.entries()) {
      await db
        .update(modules)
        .set({
          order: index,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(modules.id, remainingModule.id));
    }

    return true;
  } catch (e) {
    logError(e, 'Error deleting module');
    return false;
  }
};

export const deleteUnitById = async (unitId: string) => {
  try {
    const db = getDb();
    const [unit] = await db
      .select()
      .from(units)
      .where(eq(units.id, unitId))
      .limit(1);

    if (!unit) {
      return false;
    }

    await db.delete(units).where(eq(units.id, unitId));

    const remainingUnits = await db
      .select({ id: units.id })
      .from(units)
      .where(eq(units.moduleId, unit.moduleId))
      .orderBy(asc(units.order));

    for (const [index, remainingUnit] of remainingUnits.entries()) {
      await db
        .update(units)
        .set({
          order: index,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(units.id, remainingUnit.id));
    }

    return true;
  } catch (e) {
    logError(e, 'Error deleting unit');
    return false;
  }
};

export const setUnitComplete = async (unitId: string, isComplete: boolean) => {
  try {
    const db = getDb();
    await db
      .update(units)
      .set({
        isComplete: isComplete ? 1 : 0,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(units.id, unitId));
    return true;
  } catch (e) {
    logError(e, 'Error setting unit complete');
    return false;
  }
};

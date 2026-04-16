import { eq, and, like, or, SQL, asc } from 'drizzle-orm';
import { getDb } from './connection';
import {
  courses,
  schools,
  authors,
  modules,
  units,
  type InsertCourse,
  type InsertModule,
  type InsertUnit,
} from './schemas';
import { v4 as uuidv4 } from 'uuid';
import { logError } from '~/utils/logger';

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

export const getCourseById = async (id: string) => {
  try {
    const db = getDb();

    // Get course, school and author
    const results = await db
      .select({
        course: courses,
        school: schools,
        author: authors,
      })
      .from(courses)
      .leftJoin(schools, eq(courses.schoolId, schools.id))
      .leftJoin(authors, eq(courses.authorId, authors.id))
      .where(eq(courses.id, id))
      .limit(1);

    if (results.length === 0) return null;

    const courseData = results[0];

    // Get modules for the course
    const courseModules = await db
      .select()
      .from(modules)
      .where(eq(modules.courseId, id))
      .orderBy(asc(modules.order));

    // Get units for all modules in this course
    const moduleIds = courseModules.map((m) => m.id);
    let courseUnits: any[] = [];
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
};

export const getCourses = async (filters?: CourseFilters) => {
  try {
    const db = getDb();
    const conditions: SQL[] = [];

    if (filters?.createdBy) {
      conditions.push(eq(courses.createdBy, filters.createdBy));
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
      conditions.push(eq(courses.authorId, filters.authorId));
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
      })
      .from(courses)
      .leftJoin(schools, eq(courses.schoolId, schools.id))
      .leftJoin(authors, eq(courses.authorId, authors.id));

    if (conditions.length > 0) {
      query.where(and(...conditions));
    }

    return query.orderBy(courses.createdAt);
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
      .from(courses)
      .innerJoin(authors, eq(courses.authorId, authors.id));

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
      .split('--end--')
      .map((part) => part.trim())
      .filter(Boolean);

    if (parts.length === 0) {
      throw new Error('No module text segments were found');
    }

    const db = getDb();
    await clearCourseCurriculum(courseId);

    for (const [index, part] of parts.entries()) {
      await db.insert(modules).values({
        id: uuidv4(),
        courseId,
        title: `Module ${index + 1}`,
        rawText: part,
        order: index,
      });
    }

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

    if (!rawText.includes('--end--')) {
      throw new Error(
        'Module raw text must include "--end--" separators before splitting into units',
      );
    }

    const parts = rawText
      .split('--end--')
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

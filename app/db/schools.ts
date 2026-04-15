import { getDb } from './connection';
import { schools } from './schemas';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export const getSchoolById = async (id: string) => {
  const db = getDb();
  const results = await db.select().from(schools).where(eq(schools.id, id)).limit(1);
  return results[0] || null;
};

export const getSchoolBySlug = async (slug: string) => {
  const db = getDb();
  const results = await db.select().from(schools).where(eq(schools.slug, slug)).limit(1);
  return results[0] || null;
};

export const createSchool = async (name: string, userId: string) => {
  const db = getDb();
  const id = uuidv4();
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  
  // Check if slug already exists, if so append a short hash or number
  let finalSlug = slug;
  let counter = 1;
  while (await getSchoolBySlug(finalSlug)) {
    finalSlug = `${slug}-${counter}`;
    counter++;
  }

  const result = await db.insert(schools).values({
    id,
    name,
    slug: finalSlug,
    createdBy: userId,
  }).returning();

  return result[0];
};

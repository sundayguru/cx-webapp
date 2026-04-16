import { getDb } from './connection';
import { authors } from './schemas';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export const getAuthorById = async (id: string) => {
  const db = getDb();
  const results = await db
    .select()
    .from(authors)
    .where(eq(authors.id, id))
    .limit(1);
  return results[0] || null;
};

export const getAuthorBySlug = async (slug: string) => {
  const db = getDb();
  const results = await db
    .select()
    .from(authors)
    .where(eq(authors.slug, slug))
    .limit(1);
  return results[0] || null;
};

export const createAuthor = async (name: string, userId: string) => {
  const db = getDb();
  const id = uuidv4();
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  // Check if slug already exists, if so append a short hash or number
  let finalSlug = slug;
  let counter = 1;
  while (await getAuthorBySlug(finalSlug)) {
    finalSlug = `${slug}-${counter}`;
    counter++;
  }

  const result = await db
    .insert(authors)
    .values({
      id,
      name,
      slug: finalSlug,
      createdBy: userId,
    })
    .returning();

  return result[0];
};

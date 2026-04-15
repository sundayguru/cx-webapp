import type { Route } from './+types/authors';
import { data } from 'react-router';
import { getDb } from '~/db/connection';
import { authors } from '~/db/schemas';
import { like, or } from 'drizzle-orm';

export const loader = async ({ request }: Route.LoaderArgs) => {
  const url = new URL(request.url);
  const q = url.searchParams.get('q') || '';

  try {
    const db = getDb();
    const results = await db
      .select()
      .from(authors)
      .where(or(like(authors.name, `%${q}%`), like(authors.slug, `%${q}%`)))
      .limit(10);

    return data({ authors: results });
  } catch (error) {
    console.error('Error fetching authors:', error);
    return data({ authors: [] }, { status: 500 });
  }
};

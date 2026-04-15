import type { Route } from './+types/schools';
import { data } from 'react-router';
import { getDb } from '~/db/connection';
import { schools } from '~/db/schemas';
import { like, or } from 'drizzle-orm';

export const loader = async ({ request }: Route.LoaderArgs) => {
  const url = new URL(request.url);
  const q = url.searchParams.get('q') || '';

  try {
    const db = getDb();
    const results = await db
      .select()
      .from(schools)
      .where(or(like(schools.name, `%${q}%`), like(schools.slug, `%${q}%`)))
      .limit(10);

    return data({ schools: results });
  } catch (error) {
    console.error('Error fetching schools:', error);
    return data({ schools: [] }, { status: 500 });
  }
};

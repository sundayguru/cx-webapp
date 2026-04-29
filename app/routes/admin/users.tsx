import type { Route } from './+types/users';
import { data, Form, Link, useFetcher } from 'react-router';
import { and, desc, eq, like, or, sql } from 'drizzle-orm';
import {
  Crown,
  Search,
  Shield,
  ShieldAlert,
  UserCheck,
  UserX,
} from 'lucide-react';
import { useEffect } from 'react';
import { getDb } from '~/db/connection';
import { users, type SelectUser } from '~/db/schemas';
import { getUserFromRequest } from '~/utils/session.server';
import { useToast } from '~/utils/useToast';

const USERS_PAGE_SIZE = 20;

type ActionData = {
  success?: boolean;
  message?: string;
  error?: string;
};

const getPaginationHref = (query: string, page: number) => {
  const params = new URLSearchParams();

  if (query) {
    params.set('q', query);
  }

  if (page > 1) {
    params.set('page', String(page));
  }

  const search = params.toString();

  return search ? `/admin/users?${search}` : '/admin/users';
};

export const loader = async ({ request }: Route.LoaderArgs) => {
  const user = await getUserFromRequest(request);

  if (!user || !user.isAdmin) {
    throw data({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const query = url.searchParams.get('q')?.trim() ?? '';
  const rawPage = Number(url.searchParams.get('page') ?? '1');
  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
  const offset = (page - 1) * USERS_PAGE_SIZE;
  const db = getDb();
  const conditions = [];

  if (query) {
    const searchTerm = `%${query}%`;
    const fullName = sql<string>`${users.firstName} || ' ' || ${users.lastName}`;

    conditions.push(
      or(
        like(users.firstName, searchTerm),
        like(users.lastName, searchTerm),
        like(users.email, searchTerm),
        like(fullName, searchTerm),
      )!,
    );
  }

  const userQuery = db.select().from(users);
  const countQuery = db.select({ id: users.id }).from(users);

  if (conditions.length > 0) {
    const whereClause = and(...conditions);
    userQuery.where(whereClause);
    countQuery.where(whereClause);
  }

  const [pagedUsers, totalRows] = await Promise.all([
    userQuery.orderBy(desc(users.createdAt)).limit(USERS_PAGE_SIZE).offset(offset),
    countQuery,
  ]);

  const total = totalRows.length;
  const totalPages = Math.max(1, Math.ceil(total / USERS_PAGE_SIZE));

  return {
    users: pagedUsers,
    filters: {
      query,
    },
    pagination: {
      page: Math.min(page, totalPages),
      pageSize: USERS_PAGE_SIZE,
      total,
      totalPages,
      hasPreviousPage: page > 1,
      hasNextPage: page < totalPages,
    },
  };
};

export const action = async ({ request }: Route.ActionArgs) => {
  const user = await getUserFromRequest(request);

  if (!user || !user.isAdmin) {
    return data({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const intent = formData.get('intent');
  const targetUserId = formData.get('userId');

  if (typeof targetUserId !== 'string' || targetUserId.length === 0) {
    return data({ error: 'User ID is required' }, { status: 400 });
  }

  const db = getDb();

  if (intent === 'toggleDeactivate') {
    const isDeactivated = formData.get('isDeactivated') === 'true';

    await db
      .update(users)
      .set({ isDeactivated: !isDeactivated })
      .where(eq(users.id, targetUserId));

    return data({
      success: true,
      message: `User ${!isDeactivated ? 'deactivated' : 'activated'}`,
    });
  }

  if (intent === 'toggleBan') {
    const isBanned = formData.get('isBanned') === 'true';

    await db
      .update(users)
      .set({ isBanned: !isBanned })
      .where(eq(users.id, targetUserId));

    return data({
      success: true,
      message: `User ${!isBanned ? 'banned' : 'unbanned'}`,
    });
  }

  if (intent === 'toggleAdmin') {
    const isAdmin = formData.get('isAdmin') === 'true';

    await db
      .update(users)
      .set({ isAdmin: !isAdmin })
      .where(eq(users.id, targetUserId));

    return data({
      success: true,
      message: `User ${!isAdmin ? 'made admin' : 'removed from admin'}`,
    });
  }

  return data({ error: 'Invalid intent' }, { status: 400 });
};

const StatusBadge = ({
  tone,
  children,
}: {
  tone: 'admin' | 'active' | 'deactivated' | 'banned';
  children: string;
}) => {
  const toneClasses = {
    admin: 'bg-sky-100 text-sky-700',
    active: 'bg-green-100 text-green-700',
    deactivated: 'bg-orange-100 text-orange-700',
    banned: 'bg-red-100 text-red-700',
  } satisfies Record<'admin' | 'active' | 'deactivated' | 'banned', string>;

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
};

const UserRow = ({
  user,
  fetcher,
}: {
  user: SelectUser;
  fetcher: ReturnType<typeof useFetcher<ActionData>>;
}) => (
  <tr key={user.id} className='transition-colors hover:bg-black/[0.02]'>
    <td className='px-6 py-4 font-medium text-[#1a1a1a]'>
      <div className='min-w-0'>
        <p className='truncate'>
          {user.firstName} {user.lastName}
        </p>
        <p className='mt-1 text-xs text-black/40'>ID: {user.id.slice(0, 8)}</p>
      </div>
    </td>
    <td className='px-6 py-4'>{user.email}</td>
    <td className='px-6 py-4'>
      <div className='flex flex-wrap gap-2'>
        {user.isAdmin ? <StatusBadge tone='admin'>Admin</StatusBadge> : null}
        {user.isDeactivated ? (
          <StatusBadge tone='deactivated'>Deactivated</StatusBadge>
        ) : (
          <StatusBadge tone='active'>Active</StatusBadge>
        )}
        {user.isBanned ? <StatusBadge tone='banned'>Banned</StatusBadge> : null}
      </div>
    </td>
    <td className='px-6 py-4'>
      <div className='flex flex-wrap items-center justify-end gap-2'>
        <fetcher.Form method='post'>
          <input type='hidden' name='intent' value='toggleDeactivate' />
          <input type='hidden' name='userId' value={user.id} />
          <input
            type='hidden'
            name='isDeactivated'
            value={String(user.isDeactivated)}
          />
          <button
            type='submit'
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              user.isDeactivated
                ? 'bg-[#5A5A40] text-white hover:bg-[#4a4a35]'
                : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
            }`}
          >
            {user.isDeactivated ? <UserCheck size={14} /> : <UserX size={14} />}
            {user.isDeactivated ? 'Activate' : 'Deactivate'}
          </button>
        </fetcher.Form>

        <fetcher.Form method='post'>
          <input type='hidden' name='intent' value='toggleBan' />
          <input type='hidden' name='userId' value={user.id} />
          <input type='hidden' name='isBanned' value={String(user.isBanned)} />
          <button
            type='submit'
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              user.isBanned
                ? 'bg-[#5A5A40] text-white hover:bg-[#4a4a35]'
                : 'bg-red-100 text-red-700 hover:bg-red-200'
            }`}
          >
            {user.isBanned ? <Shield size={14} /> : <ShieldAlert size={14} />}
            {user.isBanned ? 'Unban' : 'Ban'}
          </button>
        </fetcher.Form>

        <fetcher.Form method='post'>
          <input type='hidden' name='intent' value='toggleAdmin' />
          <input type='hidden' name='userId' value={user.id} />
          <input type='hidden' name='isAdmin' value={String(user.isAdmin)} />
          <button
            type='submit'
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              user.isAdmin
                ? 'bg-sky-100 text-sky-700 hover:bg-sky-200'
                : 'bg-[#5A5A40] text-white hover:bg-[#4a4a35]'
            }`}
          >
            <Crown size={14} />
            {user.isAdmin ? 'Remove Admin' : 'Make Admin'}
          </button>
        </fetcher.Form>
      </div>
    </td>
  </tr>
);

export default function AdminUsersPage({ loaderData }: Route.ComponentProps) {
  const { users: allUsers, filters, pagination } = loaderData;
  const fetcher = useFetcher<ActionData>();
  const { showToast } = useToast();

  useEffect(() => {
    if (fetcher.state !== 'idle' || !fetcher.data) {
      return;
    }

    if (fetcher.data.success && fetcher.data.message) {
      showToast({ tone: 'success', message: fetcher.data.message });
    } else if (fetcher.data.error) {
      showToast({ tone: 'error', message: fetcher.data.error });
    }
  }, [fetcher.data, fetcher.state, showToast]);

  return (
    <div className='relative mx-auto max-w-6xl flex-1 px-4 py-8'>
      <div className='mb-8'>
        <h1 className='font-serif text-4xl text-[#1a1a1a]'>Manage Users</h1>
        <p className='mt-2 text-black/60'>
          Administer the platform, ban abusive users, or deactivate accounts.
        </p>
      </div>

      <div className='mb-6 rounded-[24px] border border-black/5 bg-white p-4 shadow-sm sm:p-5'>
        <Form method='get' className='flex flex-col gap-3 md:flex-row md:items-center'>
          <label className='relative flex-1'>
            <Search
              size={16}
              className='pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-black/35'
            />
            <input
              type='search'
              name='q'
              defaultValue={filters.query}
              placeholder='Search by name or email'
              className='w-full rounded-2xl border border-black/10 bg-[#faf9f4] py-3 pr-4 pl-11 text-sm text-[#1a1a1a] outline-none transition focus:border-[#5A5A40]'
            />
          </label>
          <div className='flex items-center gap-3'>
            <button
              type='submit'
              className='rounded-2xl bg-[#5A5A40] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#4a4a35]'
            >
              Search
            </button>
            {filters.query ? (
              <Link
                to='/admin/users'
                className='rounded-2xl border border-black/10 px-5 py-3 text-sm font-semibold text-black/60 transition-colors hover:bg-black/5'
              >
                Clear
              </Link>
            ) : null}
          </div>
        </Form>

        <div className='mt-4 flex flex-col gap-2 text-sm text-black/50 sm:flex-row sm:items-center sm:justify-between'>
          <p>
            Showing{' '}
            <span className='font-semibold text-[#1a1a1a]'>{allUsers.length}</span>{' '}
            of{' '}
            <span className='font-semibold text-[#1a1a1a]'>
              {pagination.total}
            </span>{' '}
            users
          </p>
          <p>
            Page{' '}
            <span className='font-semibold text-[#1a1a1a]'>
              {pagination.page}
            </span>{' '}
            of{' '}
            <span className='font-semibold text-[#1a1a1a]'>
              {pagination.totalPages}
            </span>
          </p>
        </div>
      </div>

      <div className='overflow-hidden rounded-[24px] border border-black/5 bg-white shadow-sm'>
        <div className='overflow-x-auto'>
          <table className='w-full text-left text-sm text-black/60'>
            <thead className='bg-[#faf9f4] text-[11px] font-bold tracking-[0.2em] text-black/35 uppercase'>
              <tr>
                <th className='px-6 py-4'>User</th>
                <th className='px-6 py-4'>Email</th>
                <th className='px-6 py-4'>Status</th>
                <th className='px-6 py-4 text-right'>Actions</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-black/5'>
              {allUsers.map((user) => (
                <UserRow key={user.id} user={user} fetcher={fetcher} />
              ))}
              {allUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className='px-6 py-8 text-center text-black/40'>
                    No users found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div className='mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <p className='text-sm text-black/45'>
          Use search to narrow down accounts, then page through the results.
        </p>
        <div className='flex items-center gap-3 self-end'>
          <Link
            to={getPaginationHref(filters.query, pagination.page - 1)}
            aria-disabled={!pagination.hasPreviousPage}
            className={`rounded-2xl px-4 py-2 text-sm font-semibold transition-colors ${
              pagination.hasPreviousPage
                ? 'border border-black/10 text-black/60 hover:bg-black/5'
                : 'pointer-events-none border border-black/5 text-black/25'
            }`}
          >
            Previous
          </Link>
          <Link
            to={getPaginationHref(filters.query, pagination.page + 1)}
            aria-disabled={!pagination.hasNextPage}
            className={`rounded-2xl px-4 py-2 text-sm font-semibold transition-colors ${
              pagination.hasNextPage
                ? 'bg-[#5A5A40] text-white hover:bg-[#4a4a35]'
                : 'pointer-events-none bg-black/5 text-black/25'
            }`}
          >
            Next
          </Link>
        </div>
      </div>
    </div>
  );
}

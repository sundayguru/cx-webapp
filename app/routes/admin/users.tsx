import type { Route } from './+types/users';
import { data, useFetcher, useNavigate } from 'react-router';
import { eq, desc } from 'drizzle-orm';
import { getDb } from '~/db/connection';
import { users } from '~/db/schemas';
import { getUserFromRequest } from '~/utils/session.server';
import { Shield, ShieldAlert, UserX, UserCheck, Crown } from 'lucide-react';
import { useToast } from '~/utils/useToast';
import { useEffect } from 'react';

export const loader = async ({ request }: Route.LoaderArgs) => {
  const user = await getUserFromRequest(request);
  if (!user) {
    throw data({ error: 'Unauthorized' }, { status: 401 });
  }

  // Note: Add strict admin role check here if roles are implemented, for now we allow anyone accessing it since it is an MVP

  const db = getDb();
  const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));

  return { users: allUsers };
};

export const action = async ({ request }: Route.ActionArgs) => {
  const user = await getUserFromRequest(request);
  if (!user) {
    return data({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const intent = formData.get('intent') as string;
  const targetUserId = formData.get('userId') as string;

  if (!targetUserId) {
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

export default function AdminUsersPage({ loaderData }: Route.ComponentProps) {
  const { users: allUsers } = loaderData;
  const fetcher = useFetcher();
  const { showToast } = useToast();

  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data) {
      if ((fetcher.data as any).success) {
        showToast({ tone: 'success', message: (fetcher.data as any).message });
      } else if ((fetcher.data as any).error) {
        showToast({ tone: 'error', message: (fetcher.data as any).error });
      }
      fetcher.reset();
    }
  }, [fetcher.state, fetcher.data, showToast]);

  return (
    <div className='relative mx-auto max-w-6xl flex-1 px-4 py-8'>
      <div className='mb-8'>
        <h1 className='font-serif text-4xl text-[#1a1a1a]'>Manage Users</h1>
        <p className='mt-2 text-black/60'>
          Administer the platform, ban abusive users, or deactivate accounts.
        </p>
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
              {allUsers.map((u: any) => (
                <tr
                  key={u.id}
                  className='transition-colors hover:bg-black/[0.02]'
                >
                  <td className='px-6 py-4 font-medium text-[#1a1a1a]'>
                    {u.firstName} {u.lastName}
                  </td>
                  <td className='px-6 py-4'>{u.email}</td>
                  <td className='px-6 py-4'>
                    <div className='flex flex-wrap gap-2'>
                      {u.isAdmin && (
                        <span className='rounded-full bg-purple-100 px-2.5 py-1 text-[11px] font-bold text-purple-700 uppercase'>
                          Admin
                        </span>
                      )}
                      {u.isDeactivated ? (
                        <span className='rounded-full bg-orange-100 px-2.5 py-1 text-[11px] font-bold text-orange-700 uppercase'>
                          Deactivated
                        </span>
                      ) : (
                        <span className='rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-bold text-green-700 uppercase'>
                          Active
                        </span>
                      )}
                      {u.isBanned && (
                        <span className='rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-bold text-red-700 uppercase'>
                          Banned
                        </span>
                      )}
                    </div>
                  </td>
                  <td className='px-6 py-4'>
                    <div className='flex items-center justify-end gap-2'>
                      <fetcher.Form method='post'>
                        <input
                          type='hidden'
                          name='intent'
                          value='toggleDeactivate'
                        />
                        <input type='hidden' name='userId' value={u.id} />
                        <input
                          type='hidden'
                          name='isDeactivated'
                          value={String(u.isDeactivated || false)}
                        />
                        <button
                          type='submit'
                          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                            u.isDeactivated
                              ? 'bg-[#5A5A40] text-white hover:bg-[#4a4a35]'
                              : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                          }`}
                        >
                          {u.isDeactivated ? (
                            <UserCheck size={14} />
                          ) : (
                            <UserX size={14} />
                          )}
                          {u.isDeactivated ? 'Activate' : 'Deactivate'}
                        </button>
                      </fetcher.Form>

                      <fetcher.Form method='post'>
                        <input type='hidden' name='intent' value='toggleBan' />
                        <input type='hidden' name='userId' value={u.id} />
                        <input
                          type='hidden'
                          name='isBanned'
                          value={String(u.isBanned || false)}
                        />
                        <button
                          type='submit'
                          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                            u.isBanned
                              ? 'bg-[#5A5A40] text-white hover:bg-[#4a4a35]'
                              : 'bg-red-100 text-red-700 hover:bg-red-200'
                          }`}
                        >
                          {u.isBanned ? (
                            <Shield size={14} />
                          ) : (
                            <ShieldAlert size={14} />
                          )}
                          {u.isBanned ? 'Unban' : 'Ban'}
                        </button>
                      </fetcher.Form>

                      <fetcher.Form method='post'>
                        <input
                          type='hidden'
                          name='intent'
                          value='toggleAdmin'
                        />
                        <input type='hidden' name='userId' value={u.id} />
                        <input
                          type='hidden'
                          name='isAdmin'
                          value={String(u.isAdmin || false)}
                        />
                        <button
                          type='submit'
                          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                            u.isAdmin
                              ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                              : 'bg-[#5A5A40] text-white hover:bg-[#4a4a35]'
                          }`}
                        >
                          <Crown size={14} />
                          {u.isAdmin ? 'Remove Admin' : 'Make Admin'}
                        </button>
                      </fetcher.Form>
                    </div>
                  </td>
                </tr>
              ))}
              {allUsers.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className='px-6 py-8 text-center text-black/40'
                  >
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

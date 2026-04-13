import type { Route } from './+types/ProtectedLayout';
import { redirect } from 'react-router';
import { getUserFromRequest } from '~/utils/session.server';

export const middleware: Route.MiddlewareFunction[] = [
  async ({ request }) => {
    const user = await getUserFromRequest(request);
    if (!user) {
      const url = new URL(request.url);
      const callbackUrl = url.pathname + url.search;
      return redirect(`/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
    }
  },
];

export const loader = () => { };

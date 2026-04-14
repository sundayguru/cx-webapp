import { getUserFromRequest } from '~/utils/session.server';
import { getFromR2 } from '~/utils/r2.server';

export const loader = async ({
  request,
  params,
}: {
  request: Request;
  params: { '*': string };
}) => {
  const user = await getUserFromRequest(request);
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const key = decodeURIComponent(params['*']);
  const r2Object = await getFromR2(key);

  if (!r2Object) {
    return new Response('File not found', { status: 404 });
  }

  const headers = new Headers();
  headers.set(
    'Content-Type',
    r2Object.httpMetadata?.contentType ?? 'application/pdf',
  );
  headers.set('Cache-Control', 'public, max-age=3600');

  return new Response(r2Object.body, { headers });
};
